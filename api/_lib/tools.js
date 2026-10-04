import { createHash } from "node:crypto";
import { searchKnowledge, KNOWLEDGE_INLINE } from "./knowledge.js";

/*
 * ACTION TRACKING / IDEMPOTENCY
 * The server is stateless, so the conversation's action state travels with each
 * request: the server returns it, the widget stores it, and sends it back next time.
 *
 *   state.lead     = null | { id, version, fingerprint, sentAt, data }
 *   state.handoffs = [{ id, reason, sentAt }]   (max 3)
 *
 * Rules enforced in code (not just asked of the AI):
 *   - One lead per conversation. Later create_lead calls MERGE new details into it and
 *     send an "update" with the SAME lead id (n8n updates the same Sheet row).
 *   - An update with nothing new is skipped (no duplicate notification).
 *   - A handoff for the same issue is not re-sent; different issues allowed, max 3.
 * The state is client-held, so a determined user could reset it; worst case is an extra
 * notification, which the rate limit and n8n's update-by-id keep bounded.
 */
const LEAD_FIELDS = ["name", "email", "phone", "business_name", "needs", "budget", "preferred_contact"];
const MAX_HANDOFFS = 3;
const idOk = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(v);

export function sanitizeState(raw) {
  const out = { lead: null, handoffs: [], mode: "ai", forwarded: 0 };
  if (!raw || typeof raw !== "object") return out;
  const l = raw.lead;
  if (l && typeof l === "object" && idOk(l.id)) {
    const data = {};
    for (const f of LEAD_FIELDS) data[f] = clean(l.data?.[f], f === "needs" ? 1000 : 254);
    out.lead = {
      id: l.id,
      version: Math.min(Math.max(parseInt(l.version, 10) || 1, 1), 100),
      fingerprint: typeof l.fingerprint === "string" ? l.fingerprint.slice(0, 64) : "",
      sentAt: clean(l.sentAt, 40),
      data,
    };
  }
  if (Array.isArray(raw.handoffs)) {
    out.handoffs = raw.handoffs.slice(0, MAX_HANDOFFS)
      .filter((h) => h && idOk(h.id))
      .map((h) => ({ id: h.id, reason: clean(h.reason, 500), sentAt: clean(h.sentAt, 40) }));
  }
  // "handoff" mode: a human handoff succeeded, so the AI stops replying for this chat.
  if (raw.mode === "handoff" && out.handoffs.length) out.mode = "handoff";
  out.forwarded = Math.min(Math.max(parseInt(raw.forwarded, 10) || 0, 0), 1000);
  return out;
}

const MAX_FORWARDED = 10;
const HANDOFF_ACK = "Thanks, I've added that to your request. The Dleading team will reply to you directly.";
const HANDOFF_ACK_FALLBACK = "Thanks. The Dleading team already has your request and will be in touch. If it's urgent, you can reach them on WhatsApp/phone +44 742 725 9935 or info@creativedleading.co.uk.";

/**
 * Called instead of the AI while the chat is handed over to a human.
 * Forwards the visitor's new message to the handoff workflow (same handoff_id, so
 * n8n updates the same row) and returns a short fixed acknowledgement.
 */
export async function handleHandoffMode(ctx, latestMessage) {
  const st = ctx.state;
  const h = st.handoffs[st.handoffs.length - 1];
  if (st.forwarded >= MAX_FORWARDED) return { reply: HANDOFF_ACK_FALLBACK, forwarded: false };
  const r = await sendToN8n("N8N_HANDOFF_WEBHOOK_URL", {
    type: "handoff",
    action: "message",
    handoff_id: h.id,
    timestamp: new Date().toISOString(),
    conversation_id: ctx.conversationId,
    lead_id: st.lead?.id || "",
    page: ctx.page,
    reason: h.reason,
    message: clean(latestMessage, 2000),
    customer: { name: st.lead?.data?.name || "", email: st.lead?.data?.email || "", phone: st.lead?.data?.phone || "", preferred_contact: st.lead?.data?.preferred_contact || "" },
    transcript: ctx.transcript,
  });
  if (r.ok) st.forwarded += 1;
  return { reply: r.ok ? HANDOFF_ACK : HANDOFF_ACK_FALLBACK, forwarded: r.ok };
}

/** Plain-English summary of completed actions, given to the AI each turn. */
export function stateNotes(state) {
  const notes = [];
  if (state.lead) {
    const d = state.lead.data;
    const known = LEAD_FIELDS.filter((f) => d[f]).map((f) => `${f}: ${d[f]}`).join("; ");
    notes.push(`A lead has ALREADY been sent to the team in this chat (${known}). Do NOT collect everything again. If the visitor gives NEW or CORRECTED details, call create_lead with just those fields: it updates the same lead, it does not create a new one. Otherwise don't call create_lead.`);
  }
  if (state.handoffs.length) {
    notes.push(`The team has ALREADY been asked to follow up on: ${state.handoffs.map((h) => `"${h.reason}"`).join(", ")}. Don't call request_human again for the same issue; only for a clearly different issue.`);
  }
  return notes;
}

const words = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
function sameIssue(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return a.trim().toLowerCase() === b.trim().toLowerCase();
  let inter = 0; for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size) >= 0.6;
}
const fingerprint = (data) => createHash("sha256").update(JSON.stringify(LEAD_FIELDS.map((f) => (data[f] || "").toLowerCase()))).digest("hex").slice(0, 32);

const BUSINESS_INFO = {
  company: "Dleading Creative Designs Ltd",
  website: "https://creativedleading.co.uk",
  location: "Holbeck, Leeds, West Yorkshire, United Kingdom",
  phone_whatsapp: "+44 742 725 9935",
  whatsapp_link: "https://wa.link/9m4r50",
  email: "info@creativedleading.co.uk",
  contact_page: "https://creativedleading.co.uk/contact",
  hours: "Mon–Fri 9:00am–6:00pm, Sat 10:00am–3:00pm (Sunday not listed)",
};

export const TOOL_DEFS = [
  ...(KNOWLEDGE_INLINE ? [] : [{
    name: "search_dleading_knowledge",
    description: "Search Dleading's knowledge base (services, pricing, FAQs, policies). Use before answering any factual question about Dleading that isn't covered in the prompt.",
    input_schema: { type: "object", properties: { query: { type: "string", description: "Short search query" } }, required: ["query"] },
  }]),
  {
    name: "get_business_information",
    description: "Get Dleading's official contact details, location and opening hours.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_lead",
    description: "Send a potential customer's details to the Dleading team. First time: needs name, what they need, and an email or phone, with the visitor's agreement. If a lead was already sent in this chat, calling again with new/corrected fields UPDATES that same lead (only pass the changed fields).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string", description: "Phone or WhatsApp number" },
        business_name: { type: "string" },
        needs: { type: "string", description: "What they need, in a sentence or two" },
        budget: { type: "string", description: "Only if the visitor gave one" },
        preferred_contact: { type: "string", enum: ["email", "phone", "whatsapp"] },
      },
      required: [],
    },
  },
  {
    name: "request_human",
    description: "Hand the conversation over to the Dleading team (visitor wants a human, or you can't answer). Needs an email or phone so the team can reply.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why the visitor needs a human, one sentence" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        preferred_contact: { type: "string", enum: ["email", "phone", "whatsapp"] },
      },
      required: ["reason"],
    },
  },
  {
    name: "end_conversation",
    description: "End the chat after continued abuse following a warning. Never use for ordinary frustration.",
    input_schema: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] },
  },
];

const clean = (v, max = 300) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

function contactFields(input) {
  const email = clean(input.email, 254);
  const phone = clean(input.phone, 30);
  const errors = [];
  if (email && !EMAIL_RE.test(email)) errors.push("email looks invalid - ask the visitor to check it");
  if (phone && !PHONE_RE.test(phone)) errors.push("phone looks invalid - ask the visitor to check it");
  if (!email && !phone) errors.push("need an email or phone number");
  return { email, phone, errors };
}

/** POST to an n8n webhook. Never throws. */
async function sendToN8n(urlEnv, payload) {
  const url = process.env[urlEnv];
  if (!url) return { ok: false, error: "not_configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-dleading-secret": process.env.N8N_WEBHOOK_SECRET || "" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[chat] n8n ${urlEnv} responded ${res.status}`);
      return { ok: false, error: `status_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[chat] n8n ${urlEnv} failed: ${e.name}`);
    return { ok: false, error: e.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

const FAIL_MSG = "Sending failed. Do NOT say the team was notified. Apologise, and ask the visitor to contact Dleading directly: WhatsApp/phone +44 742 725 9935 or info@creativedleading.co.uk.";

/**
 * Executes one tool call. `ctx` = { conversationId, transcript, page, state } (state is mutated).
 * Returns { result (object for the model), action? (for the client), ended? }.
 */
export async function runTool(name, input, ctx) {
  input = input && typeof input === "object" ? input : {};
  switch (name) {
    case "search_dleading_knowledge": {
      const hits = searchKnowledge(clean(input.query, 200));
      return { result: hits.length ? { results: hits } : { results: [], note: "Nothing found. Say you don't have that information and offer the team." } };
    }
    case "get_business_information":
      return { result: BUSINESS_INFO };

    case "create_lead": {
      const st = ctx.state;
      const incoming = {};
      for (const f of LEAD_FIELDS) incoming[f] = clean(input[f], f === "needs" ? 1000 : f === "name" ? 100 : 254);
      if (!["email", "phone", "whatsapp"].includes(incoming.preferred_contact)) incoming.preferred_contact = "";
      // Merge: new non-empty values override earlier ones.
      const prev = st.lead?.data || {};
      const data = {};
      for (const f of LEAD_FIELDS) data[f] = incoming[f] || prev[f] || "";

      const { errors } = contactFields(data);
      if (!data.name) errors.push("need the visitor's name");
      if (!data.needs) errors.push("need a short description of what they need");
      if (errors.length) return { result: { ok: false, error: errors.join("; ") } };

      const fp = fingerprint(data);
      if (st.lead && st.lead.fingerprint === fp) {
        return { result: { ok: true, note: "Nothing new: the team already has exactly these details. Don't mention re-sending." } };
      }
      const isUpdate = !!st.lead;
      const lead = {
        id: st.lead?.id || `lead_${ctx.conversationId}`.slice(0, 100),
        version: isUpdate ? st.lead.version + 1 : 1,
        fingerprint: fp,
        sentAt: new Date().toISOString(),
        data,
      };
      const r = await sendToN8n("N8N_LEAD_WEBHOOK_URL", {
        type: "lead",
        action: isUpdate ? "update" : "create",
        lead_id: lead.id,
        version: lead.version,
        timestamp: lead.sentAt,
        conversation_id: ctx.conversationId,
        page: ctx.page,
        lead: data,
        transcript: ctx.transcript,
      });
      if (r.ok) st.lead = lead; // only record actions that really happened
      return {
        result: r.ok ? { ok: true, updated_existing_lead: isUpdate } : { ok: false, error: FAIL_MSG },
        action: { type: isUpdate ? "lead_update" : "lead", ok: r.ok },
      };
    }

    case "request_human": {
      const st = ctx.state;
      const reason = clean(input.reason, 500);
      // Fall back to contact details already given in a lead.
      const ld = st.lead?.data || {};
      const contact = { email: input.email || ld.email, phone: input.phone || ld.phone };
      const { email, phone, errors } = contactFields(contact);
      if (!reason) errors.push("need a reason");
      if (errors.length) return { result: { ok: false, error: errors.join("; ") + ". If the visitor won't share contact details, give them Dleading's contact details instead." } };

      const dup = st.handoffs.find((h) => sameIssue(h.reason, reason));
      if (dup) return { result: { ok: true, already_requested: true, note: "The team was already asked about this issue in this chat. Reassure the visitor; don't say it was sent again." } };
      if (st.handoffs.length >= MAX_HANDOFFS) return { result: { ok: false, error: "Handoff limit reached for this chat. Give the visitor Dleading's contact details instead." } };

      const handoff = { id: `${ctx.conversationId}-h${st.handoffs.length + 1}`.slice(0, 100), reason, sentAt: new Date().toISOString() };
      const r = await sendToN8n("N8N_HANDOFF_WEBHOOK_URL", {
        type: "handoff",
        action: "create",
        handoff_id: handoff.id,
        timestamp: handoff.sentAt,
        conversation_id: ctx.conversationId,
        lead_id: st.lead?.id || "",
        page: ctx.page,
        reason,
        customer: {
          name: clean(input.name, 100) || ld.name || "", email, phone,
          preferred_contact: ["email", "phone", "whatsapp"].includes(input.preferred_contact) ? input.preferred_contact : ld.preferred_contact || "",
        },
        transcript: ctx.transcript,
      });
      if (r.ok) { st.handoffs.push(handoff); st.mode = "handoff"; }
      return { result: r.ok ? { ok: true } : { ok: false, error: FAIL_MSG }, action: { type: "handoff", ok: r.ok } };
    }

    case "end_conversation":
      return { result: { ok: true }, ended: true };

    default:
      return { result: { ok: false, error: "unknown tool" } };
  }
}
