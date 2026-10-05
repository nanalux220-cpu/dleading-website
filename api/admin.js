/**
 * /api/admin — Dleading WhatsApp admin API (used by /admin.html).
 * Every request needs:  Authorization: Bearer <ADMIN_TOKEN>   (env var, long random string)
 *
 * GET  ?action=stats
 * GET  ?action=contacts
 * GET  ?action=messages&number=447…
 * GET  ?action=export&type=contacts|messages      → CSV download
 * GET  ?action=autoreplies
 * GET  ?action=campaigns                          → with sent/delivered/read/failed counts
 * POST { action:"save_autoreplies", rules:[{keyword, match:"contains"|"exact", reply, enabled}] }
 * POST { action:"broadcast", name, template, language, params:[…], numbers:[…] | audience:"all" }
 * POST { action:"send", number, text }             → manual reply as Dleading (24h window only)
 * POST { action:"resume_ai", number }              → end a human handoff, AI answers again
 * POST { action:"set_optout", number, opted_out }
 */
import { timingSafeEqual } from "node:crypto";
import { cmd, pipeline, getJSON, setJSON, storeConfigured } from "./_lib/store.js";
import { sendTemplate, normaliseNumber, whatsappConfigured, setActivePhone } from "./_lib/whatsapp.js";
import { sanitizeState } from "./_lib/tools.js";
import { reply } from "./whatsapp.js";

const MAX_BROADCAST = 100; // per request (keeps within the function time limit); send more in batches
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function authorised(request) {
  const expected = String(process.env.ADMIN_TOKEN || "").trim();
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (expected.length < 24 || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const failed = new Map(); // simple brute-force brake per IP
function guard(request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const f = failed.get(ip) || { n: 0, t: 0 };
  if (f.n >= 10 && Date.now() - f.t < 15 * 60e3) return json(429, { error: "too_many_attempts" });
  if (!authorised(request)) { failed.set(ip, { n: f.n + 1, t: Date.now() }); return json(401, { error: "unauthorised" }); }
  failed.delete(ip);
  if (!storeConfigured()) return json(503, { error: "store_not_configured" });
  return "ok";
}

const csvCell = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (header, rows) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

async function allContacts() {
  const nums = ((await cmd("SMEMBERS", "wa:contacts")) || []).slice(0, 5000);
  const vals = await pipeline(nums.map((n) => ["GET", `wa:contact:${n}`]));
  return vals.map((v) => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean)
    .sort((a, b) => String(b.last_seen).localeCompare(String(a.last_seen)));
}

async function messagesFor(num, limit = 200) {
  const rows = (await cmd("LRANGE", `wa:msgs:${num}`, 0, limit - 1)) || [];
  const msgs = rows.map((r) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
  const ids = msgs.filter((m) => m.dir === "out" && m.id).map((m) => m.id);
  const st = await pipeline(ids.map((id) => ["GET", `wa:status:${id}`]));
  const byId = Object.fromEntries(ids.map((id, i) => [id, st[i] ? JSON.parse(st[i]) : null]));
  return msgs.map((m) => (m.dir === "out" && byId[m.id] ? { ...m, status: byId[m.id].status } : m));
}

export async function GET(request) {
  const blocked = guard(request); if (blocked !== "ok") return blocked;
  try { setActivePhone(await cmd("GET", "wa:active_phone_id")); } catch { /* env */ }
  const p = new URL(request.url).searchParams;
  const action = p.get("action");

  if (action === "stats") {
    const contacts = await allContacts();
    const dayAgo = Date.now() - 86400e3;
    return json(200, {
      whatsapp_configured: whatsappConfigured(),
      contacts: contacts.length,
      new_last_24h: contacts.filter((c) => Date.parse(c.first_seen) > dayAgo).length,
      active_last_24h: contacts.filter((c) => Date.parse(c.last_seen) > dayAgo).length,
      opted_out: contacts.filter((c) => c.opted_out).length,
    });
  }
  if (action === "contacts") {
    const contacts = await allContacts();
    const states = await pipeline(contacts.map((c) => ["GET", `wa:state:${c.wa_id}`]));
    return json(200, { contacts: contacts.map((c, i) => ({ ...c, mode: states[i] ? sanitizeState(JSON.parse(states[i])).mode : "ai" })) });
  }
  if (action === "messages") {
    const num = normaliseNumber(p.get("number"));
    if (!num) return json(400, { error: "invalid number" });
    return json(200, { number: num, messages: await messagesFor(num) });
  }
  if (action === "export") {
    const type = p.get("type") === "messages" ? "messages" : "contacts";
    const contacts = await allContacts();
    let csv;
    if (type === "contacts") {
      csv = toCsv(["phone", "name", "first_seen", "last_seen", "messages", "last_topic", "source_page", "opted_out"],
        contacts.map((c) => [`+${c.wa_id}`, c.name, c.first_seen, c.last_seen, c.msg_count, c.last_topic, c.source_page, c.opted_out ? "yes" : "no"]));
    } else {
      const rows = [];
      for (const c of contacts.slice(0, 1000)) {
        for (const m of (await messagesFor(c.wa_id, 500)).reverse()) rows.push([`+${c.wa_id}`, c.name, m.ts, m.dir === "in" ? "customer" : m.kind || "dleading", m.text, m.status || ""]);
      }
      csv = toCsv(["phone", "name", "time", "from", "text", "status"], rows);
    }
    return new Response(csv, {
      status: 200,
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="dleading-whatsapp-${type}-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
    });
  }
  if (action === "autoreplies") return json(200, { rules: (await getJSON("wa:autoreplies", [])) || [] });
  if (action === "campaigns") {
    const rows = ((await cmd("LRANGE", "wa:campaigns", 0, 49)) || []).map((r) => JSON.parse(r));
    for (const c of rows) {
      const ids = (await cmd("LRANGE", `wa:campaign:${c.id}:msgs`, 0, 999)) || [];
      const st = await pipeline(ids.map((id) => ["GET", `wa:status:${id}`]));
      const count = (s) => st.filter((x) => x && JSON.parse(x).status === s).length;
      c.stats = { sent: ids.length, delivered: count("delivered") + count("read"), read: count("read"), failed_after_send: count("failed") };
    }
    return json(200, { campaigns: rows });
  }
  return json(400, { error: "unknown action" });
}

export async function POST(request) {
  const blocked = guard(request); if (blocked !== "ok") return blocked;
  try { setActivePhone(await cmd("GET", "wa:active_phone_id")); } catch { /* env */ }
  let b;
  try { b = await request.json(); } catch { return json(400, { error: "invalid json" }); }

  if (b.action === "save_autoreplies") {
    if (!Array.isArray(b.rules) || b.rules.length > 100) return json(400, { error: "rules must be an array (max 100)" });
    const rules = b.rules.map((r, i) => ({
      id: String(r.id || `r${Date.now()}${i}`).slice(0, 40),
      keyword: String(r.keyword || "").trim().slice(0, 60),
      match: r.match === "exact" ? "exact" : "contains",
      reply: String(r.reply || "").trim().slice(0, 1000),
      enabled: r.enabled !== false,
    })).filter((r) => r.keyword && r.reply);
    await setJSON("wa:autoreplies", rules);
    return json(200, { ok: true, rules });
  }

  if (b.action === "broadcast") {
    const template = String(b.template || "").trim();
    if (!/^[a-z0-9_]{1,512}$/.test(template)) return json(400, { error: "template must be the approved template name, e.g. hello_world" });
    const language = /^[a-z]{2}(_[A-Z]{2})?$/.test(b.language || "") ? b.language : "en_GB";
    const params = Array.isArray(b.params) ? b.params.slice(0, 10).map((x) => String(x).slice(0, 200)) : [];
    let targets;
    if (b.audience === "all") targets = (await allContacts()).map((c) => c.wa_id);
    else targets = [...new Set((Array.isArray(b.numbers) ? b.numbers : String(b.numbers || "").split(/[\s,;]+/)).map(normaliseNumber).filter(Boolean))];
    if (!targets.length) return json(400, { error: "no valid numbers" });
    if (targets.length > MAX_BROADCAST) return json(400, { error: `max ${MAX_BROADCAST} numbers per send; split your list` });

    const contacts = await pipeline(targets.map((n) => ["GET", `wa:contact:${n}`]));
    const id = `c${Date.now().toString(36)}`;
    const result = { id, name: String(b.name || template).slice(0, 80), template, language, created_at: new Date().toISOString(), total: targets.length, sent: 0, failed: 0, skipped: 0, errors: [] };
    for (let i = 0; i < targets.length; i++) {
      const c = contacts[i] ? JSON.parse(contacts[i]) : null;
      if (c?.opted_out) { result.skipped++; continue; } // respect STOP
      const r = await sendTemplate(targets[i], template, language, params);
      if (r.ok) {
        result.sent++;
        await pipeline([
          ["RPUSH", `wa:campaign:${id}:msgs`, r.id],
          ["SET", `wa:status:${r.id}`, JSON.stringify({ status: "sent", ts: new Date().toISOString(), to: targets[i] }), "EX", 60 * 86400],
          ["LPUSH", `wa:msgs:${targets[i]}`, JSON.stringify({ id: r.id, dir: "out", text: `[campaign: ${template}] ${params.join(" | ")}`.trim(), ts: new Date().toISOString(), kind: "campaign" })],
        ]);
      } else {
        result.failed++;
        if (result.errors.length < 5) result.errors.push({ number: `+${targets[i]}`, error: r.error, detail: r.detail });
      }
    }
    const { errors, ...stored } = result;
    await pipeline([["LPUSH", "wa:campaigns", JSON.stringify(stored)], ["LTRIM", "wa:campaigns", 0, 199]]);
    return json(200, { ok: true, campaign: result });
  }

  if (b.action === "send") {
    const num = normaliseNumber(b.number);
    const text = String(b.text || "").trim().slice(0, 4096);
    if (!num || !text) return json(400, { error: "number and text required" });
    const r = await reply(num, text, "human");
    return json(r.ok ? 200 : 502, r.ok ? { ok: true, id: r.id } : { ok: false, error: r.error, detail: r.detail });
  }

  if (b.action === "resume_ai" || b.action === "set_optout") {
    const num = normaliseNumber(b.number);
    if (!num) return json(400, { error: "invalid number" });
    if (b.action === "resume_ai") {
      const st = sanitizeState(await getJSON(`wa:state:${num}`));
      st.mode = "ai";
      await setJSON(`wa:state:${num}`, st, 60 * 60 * 24 * 30);
      const c = await getJSON(`wa:contact:${num}`);
      if (c?.muted_until) await setJSON(`wa:contact:${num}`, { ...c, muted_until: "" });
    } else {
      const c = await getJSON(`wa:contact:${num}`);
      if (!c) return json(404, { error: "unknown contact" });
      await setJSON(`wa:contact:${num}`, { ...c, opted_out: !!b.opted_out });
    }
    return json(200, { ok: true });
  }
  return json(400, { error: "unknown action" });
}
