/**
 * WhatsApp ⇄ Growth Engine bridge.
 *
 * The live WhatsApp webhook (api/whatsapp.js) keeps working exactly as before: Redis stays its
 * source of truth for replies, de-duplication and handoff. This module MIRRORS what happens
 * into the business that owns the WhatsApp number (integrations.provider = 'whatsapp'), so the
 * conversation, lead, score and analytics appear in the dashboard.
 *
 * Safety rules:
 *  - No database configured, or number not linked to a business → returns immediately.
 *  - Never throws and never takes longer than MIRROR_TIMEOUT_MS, so it can't delay or break a reply.
 */
import { dbConfigured, system, tenant } from "./db.js";
import { upsertConversation, addMessage, mergeLeadDetails, logEvent } from "./leads.js";
import { getJSON, setJSON, storeConfigured } from "../store.js";
import { sanitizeState } from "../tools.js";
import { whatsappEnv, whatsappConfigured, normaliseNumber } from "../whatsapp.js";
import { loadActive } from "../active.js";
import { str, email as cleanEmail } from "./http.js";

const MIRROR_TIMEOUT_MS = 4000;
const STATE_TTL = 60 * 60 * 24 * 30;

let cache = { at: 0, phoneId: "", businessId: null };
async function businessForPhone(phoneId) {
  if (!phoneId) return null;
  if (cache.phoneId === phoneId && Date.now() - cache.at < 60e3) return cache.businessId;
  const [row] = await system((tx) => tx`select business_id from integrations where provider = 'whatsapp' and external_id = ${phoneId} and status = 'connected'`);
  cache = { at: Date.now(), phoneId, businessId: row?.business_id || null };
  return cache.businessId;
}
export const resetBridgeCache = () => { cache = { at: 0, phoneId: "", businessId: null }; };

function guarded(label, fn) {
  return async (...args) => {
    if (!dbConfigured()) return;
    let timer;
    try {
      await Promise.race([fn(...args), new Promise((resolve) => { timer = setTimeout(() => { console.warn(`[ge-bridge] ${label} timed out`); resolve(); }, MIRROR_TIMEOUT_MS); })]);
    } catch (e) {
      console.error(`[ge-bridge] ${label} failed: ${e.message}`);
    } finally { clearTimeout(timer); }
  };
}

const SENDER = { ai: "ai", system: "system", auto: "auto", human: "human", human_app: "human", customer: "customer" };

/** Mirror one WhatsApp message (inbound or outbound). */
export const mirrorWhatsApp = guarded("message", async ({ num, name = "", direction, kind = "ai", text, wamid = null, ts = null, ok = true, error = "" }) => {
  const bid = await businessForPhone(whatsappEnv("WHATSAPP_PHONE_NUMBER_ID"));
  if (!bid || !num) return;
  await tenant(bid, async (tx) => {
    const { conv } = await upsertConversation(tx, bid, { channel: "whatsapp", externalId: num, customerName: name, phone: `+${num}`, source: "whatsapp" });
    await addMessage(tx, bid, conv, {
      direction,
      sender: direction === "in" ? "customer" : SENDER[kind] || "system",
      body: String(text || "").slice(0, 4096),
      externalId: wamid,
      status: direction === "out" ? (ok ? "sent" : "failed") : "",
      metadata: error ? { error: String(error).slice(0, 200) } : {},
      at: ts ? new Date(ts) : null,
    });
  });
});

/** Mirror the AI/human state and anything the receptionist AI learned about the lead. */
export const mirrorWhatsAppState = guarded("state", async (num, { handler, reason = "", leadData = null } = {}) => {
  const bid = await businessForPhone(whatsappEnv("WHATSAPP_PHONE_NUMBER_ID"));
  if (!bid || !num) return;
  await tenant(bid, async (tx) => {
    const [conv] = await tx`select * from conversations where business_id = ${bid} and channel = 'whatsapp' and external_id = ${num}`;
    if (!conv) return;
    if (handler && handler !== conv.handler) {
      await tx`update conversations set handler = ${handler}, human_since = ${handler === "human" ? new Date() : null} where id = ${conv.id} and business_id = ${bid}`;
      await logEvent(tx, bid, handler === "human" ? "conversation.handoff" : "conversation.ai_resumed", { conversationId: conv.id, leadId: conv.lead_id, actor: "ai", data: reason ? { reason: str(reason, 300) } : {} });
    }
    if (leadData && conv.lead_id) {
      await mergeLeadDetails(tx, bid, conv.lead_id, {
        name: str(leadData.name, 120), email: cleanEmail(leadData.email), service_interest: str(leadData.needs, 200),
        budget: str(leadData.budget, 80), notes: "",
      }, "ai");
    }
  });
});

/** Delivery status (sent/delivered/read/failed) onto the mirrored message. */
export const mirrorWhatsAppStatus = guarded("status", async (wamid, status) => {
  const bid = await businessForPhone(whatsappEnv("WHATSAPP_PHONE_NUMBER_ID"));
  if (!bid || !wamid) return;
  await tenant(bid, (tx) => tx`update messages set status = ${status} where business_id = ${bid} and external_id = ${wamid} and status <> 'failed'`);
});

// ---------- used by the dashboard ----------

/** The WhatsApp number this deployment is connected to, and which business (if any) it's linked to. */
export async function linkableWhatsApp() {
  await loadActive();
  const phoneNumberId = whatsappEnv("WHATSAPP_PHONE_NUMBER_ID");
  let linkedBusinessId = null;
  if (dbConfigured() && phoneNumberId) {
    const [row] = await system((tx) => tx`select business_id from integrations where provider = 'whatsapp' and external_id = ${phoneNumberId}`);
    linkedBusinessId = row?.business_id || null;
  }
  resetBridgeCache();
  return { configured: whatsappConfigured(), phoneNumberId, linkedBusinessId, displayName: "WhatsApp Business" };
}

/** Keep the webhook's Redis handoff state in step with the inbox's AI/Human switch. */
export async function setWhatsAppHandler(externalId, handler) {
  const num = normaliseNumber(externalId);
  if (!num || !storeConfigured()) return;
  const st = sanitizeState(await getJSON(`wa:state:${num}`));
  if (handler === "human") {
    st.handoffs = [...st.handoffs.slice(-2), { id: `wa_${num}-inbox${Date.now().toString(36)}`, reason: "Taken over in the Growth Engine inbox", sentAt: new Date().toISOString() }];
    st.mode = "handoff";
  } else {
    st.mode = "ai";
    const c = await getJSON(`wa:contact:${num}`);
    if (c?.muted_until) await setJSON(`wa:contact:${num}`, { ...c, muted_until: "" });
  }
  await setJSON(`wa:state:${num}`, st, STATE_TTL);
}

/** Send a human reply from the inbox through the existing WhatsApp sender (which mirrors it back). */
export async function sendWhatsAppFromInbox(businessId, conv, text) {
  await loadActive();
  const phoneId = whatsappEnv("WHATSAPP_PHONE_NUMBER_ID");
  const [own] = await tenant(businessId, (tx) => tx`select 1 from integrations where business_id = ${businessId} and provider = 'whatsapp' and external_id = ${phoneId} and status = 'connected'`);
  if (!own) return { ok: false, error: "whatsapp_not_connected" };
  const num = normaliseNumber(conv.external_id);
  if (!num) return { ok: false, error: "invalid_number" };
  const { reply } = await import("../../whatsapp.js");
  const r = await reply(num, text, "human");
  return r.ok ? { ok: true } : { ok: false, error: r.error === "meta_131047" ? "outside_24h_window" : r.error || "send_failed", detail: r.detail };
}
