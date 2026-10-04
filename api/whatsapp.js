/**
 * /api/whatsapp — WhatsApp Cloud API webhook for Dleading.
 *
 *   GET  : Meta's one-time verification handshake (hub.verify_token must equal WHATSAPP_VERIFY_TOKEN)
 *   POST : incoming messages + delivery statuses. Every request must carry a valid
 *          X-Hub-Signature-256 (HMAC of the raw body with WHATSAPP_APP_SECRET), else 401.
 *
 * For each NEW inbound message (Meta retries are ignored by message id):
 *   1. save contact (first message = new lead → alert via the n8n lead workflow) + message
 *   2. STOP / START → opt out / back in (campaigns respect this)
 *   3. "Ref H-xxxx" (from the website's "speak to someone" button) → straight to a human
 *   4. muted after abuse / handed over to a human → AI stays silent (message still forwarded/saved)
 *   5. keyword auto-reply (managed in /admin.html) → instant fixed reply
 *   6. otherwise the SAME receptionist AI as the website, with this customer's history
 * Delivery statuses (sent / delivered / read / failed) are stored per message id.
 */
import { validSignature, sendText, markRead, normaliseNumber } from "./_lib/whatsapp.js";
import { cmd, pipeline, getJSON, setJSON, claimOnce, storeConfigured } from "./_lib/store.js";
import { runAgent } from "./_lib/agent.js";
import { sanitizeState, notifyN8n } from "./_lib/tools.js";

const HISTORY_ITEMS = 24;          // messages of context given to the AI
const HANDOFF_HOURS = Number(process.env.WHATSAPP_HANDOFF_HOURS || 24); // AI stays silent this long after a handoff
const MUTE_HOURS = 24;             // after an abusive chat is ended
const STATE_TTL = 60 * 60 * 24 * 30;
const STATUS_RANK = { sent: 1, delivered: 2, read: 3, failed: 4 };

const AI_DOWN = "Sorry, I'm having a little trouble right now. Someone from the Dleading team will get back to you here as soon as possible.";
const NON_TEXT = "Thanks! I can only read text messages at the moment. Could you type your question?";
const OPT_OUT = "You've been unsubscribed from Dleading updates. You can still message us here any time. Reply START to subscribe again.";
const OPT_IN = "You're subscribed to Dleading updates again. Reply STOP any time to unsubscribe.";
const REF_HANDOFF = "Thanks for getting in touch! Someone from the Dleading team will reply to you here shortly.";

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const now = () => new Date().toISOString();

// ---------- Meta verification ----------
const envTrim = (k) => String(process.env[k] || "").trim();

export function GET(request) {
  const p = new URL(request.url).searchParams;
  const mode = p.get("hub.mode");

  // Plain visit (no hub.* params): safe setup check. Shows ONLY whether settings exist, never their values.
  if (!mode && !p.has("hub.verify_token")) {
    const vt = envTrim("WHATSAPP_VERIFY_TOKEN");
    return json(200, {
      endpoint: "ok",
      callback_url: `https://${request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host}/api/whatsapp`,
      note: "Use callback_url exactly as shown in Meta (Meta does not follow redirects).",
      settings: {
        WHATSAPP_VERIFY_TOKEN: vt ? `set (${vt.length} characters)` : "MISSING",
        WHATSAPP_APP_SECRET: envTrim("WHATSAPP_APP_SECRET") ? "set" : "MISSING",
        WHATSAPP_ACCESS_TOKEN: envTrim("WHATSAPP_ACCESS_TOKEN") ? "set" : "MISSING",
        WHATSAPP_PHONE_NUMBER_ID: envTrim("WHATSAPP_PHONE_NUMBER_ID") ? "set" : "MISSING",
        DATABASE_UPSTASH: storeConfigured() ? "connected" : "MISSING",
        ANTHROPIC_API_KEY: envTrim("ANTHROPIC_API_KEY") ? "set" : "MISSING",
      },
    });
  }

  const expected = envTrim("WHATSAPP_VERIFY_TOKEN");
  const given = String(p.get("hub.verify_token") || "").trim();
  if (mode === "subscribe" && expected && given === expected) {
    return new Response(p.get("hub.challenge") || "", { status: 200, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
  }
  console.warn(`[whatsapp] verification failed: ${!expected ? "WHATSAPP_VERIFY_TOKEN not set in Vercel" : mode !== "subscribe" ? "hub.mode is not subscribe" : `token mismatch (received ${given.length} chars, expected ${expected.length})`}`);
  return new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
}

// ---------- incoming events ----------
export async function POST(request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    console.warn("[whatsapp] rejected: bad or missing signature");
    return new Response("Invalid signature", { status: 401 });
  }
  if (!storeConfigured()) {
    console.error("[whatsapp] Upstash Redis not configured (KV_REST_API_URL / KV_REST_API_TOKEN)");
    return json(200, { ok: false, error: "store_not_configured" }); // 200 so Meta doesn't hammer retries
  }

  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { error: "invalid json" }); }
  if (body.object !== "whatsapp_business_account") return json(200, { ignored: true });

  const summary = { messages: 0, duplicates: 0, statuses: 0, errors: 0 };
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      const v = change.value || {};
      // Only handle events for OUR number.
      const ourId = envTrim("WHATSAPP_PHONE_NUMBER_ID");
      if (ourId && v.metadata?.phone_number_id && v.metadata.phone_number_id !== ourId) continue;

      for (const s of v.statuses || []) {
        try { await saveStatus(s); summary.statuses++; } catch (e) { summary.errors++; console.error(`[whatsapp] status error: ${e.message}`); }
      }
      const names = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile?.name || ""]));
      for (const m of v.messages || []) {
        try {
          if (!m?.id || !(await claimOnce(`wa:seen:${m.id}`, 7 * 86400))) { summary.duplicates++; continue; }
          await handleMessage(m, names[m.from] || "");
          summary.messages++;
        } catch (e) {
          summary.errors++;
          console.error(`[whatsapp] message error: ${e.message}`);
        }
      }
    }
  }
  return json(200, { ok: true, ...summary });
}

async function saveStatus(s) {
  if (!s?.id || !STATUS_RANK[s.status]) return;
  const key = `wa:status:${s.id}`;
  const prev = await getJSON(key);
  if (prev && STATUS_RANK[prev.status] >= STATUS_RANK[s.status] && s.status !== "failed") return; // statuses can arrive out of order
  await setJSON(key, {
    status: s.status,
    ts: s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : now(),
    to: s.recipient_id || prev?.to || "",
    ...(s.errors?.length ? { error: `${s.errors[0].code} ${String(s.errors[0].title || "").slice(0, 120)}` } : {}),
  }, 60 * 86400);
}

function textOf(m) {
  switch (m.type) {
    case "text": return m.text?.body || "";
    case "button": return m.button?.text || "";
    case "interactive": return m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || "";
    default: return "";
  }
}

export async function saveMessage(num, msg) {
  await pipeline([
    ["LPUSH", `wa:msgs:${num}`, JSON.stringify(msg)],
    ["LTRIM", `wa:msgs:${num}`, 0, 499],
  ]);
}

/** Send + store an outbound text and its initial status. */
export async function reply(num, text, kind = "ai") {
  const r = await sendText(num, text);
  await saveMessage(num, { id: r.id || null, dir: "out", text, ts: now(), kind, ok: r.ok, ...(r.ok ? {} : { error: r.error }) });
  if (r.ok && r.id) await setJSON(`wa:status:${r.id}`, { status: "sent", ts: now(), to: num }, 60 * 86400);
  return r;
}

async function handleMessage(m, profileName) {
  const num = normaliseNumber(m.from);
  if (!num) return;
  const text = textOf(m).trim().slice(0, 2000);
  const ts = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : now();

  // 1. contact + message
  const contact = (await getJSON(`wa:contact:${num}`)) || null;
  const isNew = !contact;
  const pageMatch = text.match(/\(page:\s*([^)\s]{1,120})\)/i);
  const c = {
    wa_id: num,
    name: profileName || contact?.name || "",
    first_seen: contact?.first_seen || ts,
    last_seen: ts,
    last_topic: text ? text.replace(/\s+/g, " ").slice(0, 80) : `[${m.type}]`,
    source_page: pageMatch ? pageMatch[1] : contact?.source_page || "",
    msg_count: (contact?.msg_count || 0) + 1,
    opted_out: contact?.opted_out || false,
    is_lead: true,
    muted_until: contact?.muted_until || "",
  };
  await pipeline([
    ["SET", `wa:contact:${num}`, JSON.stringify(c)],
    ["SADD", "wa:contacts", num],
    ["LPUSH", `wa:msgs:${num}`, JSON.stringify({ id: m.id, dir: "in", text: text || `[${m.type}]`, ts, kind: m.type })],
    ["LTRIM", `wa:msgs:${num}`, 0, 499],
  ]);
  markRead(m.id).catch(() => {});

  if (isNew) {
    // New lead alert (same n8n lead workflow; same lead id the AI uses later, so one Sheet row per person).
    notifyN8n("N8N_LEAD_WEBHOOK_URL", {
      type: "lead", action: "new_contact", lead_id: `lead_wa_${num}`, version: 0, timestamp: ts,
      conversation_id: `wa_${num}`, page: c.source_page || "whatsapp",
      lead: { name: c.name, email: "", phone: `+${num}`, business_name: "", needs: `First WhatsApp message: ${text.slice(0, 300)}`, budget: "", preferred_contact: "whatsapp" },
      transcript: `Customer: ${text}`,
    }).catch(() => {});
  }

  if (!text) { await reply(num, NON_TEXT, "system"); return; }

  // 2. opt-out / opt-in
  if (/^\s*(stop|unsubscribe|stop all)\s*$/i.test(text)) {
    await setJSON(`wa:contact:${num}`, { ...c, opted_out: true });
    await reply(num, OPT_OUT, "system");
    return;
  }
  if (/^\s*(start|subscribe)\s*$/i.test(text)) {
    await setJSON(`wa:contact:${num}`, { ...c, opted_out: false });
    await reply(num, OPT_IN, "system");
    return;
  }

  // AI state (lead/handoff/mode) — same shape and rules as the website chat.
  const state = sanitizeState(await getJSON(`wa:state:${num}`));
  const last = state.handoffs[state.handoffs.length - 1];
  if (state.mode === "handoff" && last?.sentAt && Date.now() - Date.parse(last.sentAt) > HANDOFF_HOURS * 3600e3) state.mode = "ai";

  // 3. "speak to someone" from the website → human straight away
  const ref = text.match(/\bref\s*(H-[A-Z0-9]{4,10})\b/i);
  if (ref && state.mode !== "handoff") {
    const id = `wa_${num}-${ref[1].toUpperCase()}`.slice(0, 100);
    const r = await notifyN8n("N8N_HANDOFF_WEBHOOK_URL", {
      type: "handoff", action: "create", handoff_id: id, timestamp: now(), conversation_id: `wa_${num}`, lead_id: "",
      page: c.source_page || "website", reason: `Asked for a person from the website chat (${ref[1].toUpperCase()})`,
      customer: { name: c.name, email: "", phone: `+${num}`, preferred_contact: "whatsapp" }, transcript: `Customer: ${text}`,
    });
    if (state.handoffs.length < 3) state.handoffs.push({ id, reason: `Website handoff ${ref[1].toUpperCase()}`, sentAt: now() });
    state.mode = "handoff";
    await setJSON(`wa:state:${num}`, state, STATE_TTL);
    await reply(num, REF_HANDOFF, "system");
    if (!r.ok) console.error("[whatsapp] website handoff notify failed");
    return;
  }

  // 4. muted after abuse
  if (c.muted_until && Date.parse(c.muted_until) > Date.now()) return;

  // 5. keyword auto-replies (not while a human has the conversation)
  if (state.mode !== "handoff") {
    const rules = (await getJSON("wa:autoreplies", [])) || [];
    const lower = text.toLowerCase();
    const hit = rules.find((r) => r.enabled !== false && r.keyword && (
      r.match === "exact" ? lower === r.keyword.toLowerCase() : new RegExp(`\\b${r.keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)
    ));
    if (hit) { await reply(num, hit.reply, "auto"); return; }
  }

  // 6. the receptionist AI
  const history = await buildHistory(num);
  if (!history.length) return;
  const ctx = {
    conversationId: `wa_${num}`,
    page: c.source_page || "whatsapp",
    transcript: history.map((h) => `${h.role === "user" ? "Customer" : "Assistant"}: ${h.content}`).join("\n").slice(-6000),
    state,
    contactPhone: `+${num}`,
  };
  const out = await runAgent({ messages: history, ctx, channel: "whatsapp" });
  await setJSON(`wa:state:${num}`, out.state, STATE_TTL);

  if (out.ended) await setJSON(`wa:contact:${num}`, { ...c, muted_until: new Date(Date.now() + MUTE_HOURS * 3600e3).toISOString() });
  const text_ = out.ok ? out.reply : AI_DOWN;
  if (text_) await reply(num, text_, out.ok ? "ai" : "system");
}

/** Chronological, alternating user/assistant history from stored messages. */
export async function buildHistory(num) {
  const rows = (await cmd("LRANGE", `wa:msgs:${num}`, 0, HISTORY_ITEMS - 1)) || [];
  const items = rows.map((r) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean).reverse();
  const out = [];
  for (const it of items) {
    if (!it.text || (it.dir === "out" && it.ok === false)) continue;
    const role = it.dir === "in" ? "user" : "assistant";
    const prev = out[out.length - 1];
    if (prev && prev.role === role) prev.content += `\n${it.text}`;
    else out.push({ role, content: it.text });
  }
  while (out.length && out[0].role !== "user") out.shift();
  while (out.length && out[out.length - 1].role !== "user") out.pop();
  // keep it compact
  let total = out.reduce((n, m) => n + m.content.length, 0);
  while (out.length > 1 && total > 12000) { total -= out[0].content.length; out.shift(); if (out[0]?.role === "assistant") { total -= out[0].content.length; out.shift(); } }
  return out;
}
