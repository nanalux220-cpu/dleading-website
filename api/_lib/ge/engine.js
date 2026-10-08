/**
 * One customer turn on a Growth Engine channel (website widget today; Facebook/Instagram/voice later):
 * save the inbound message → if AI is handling, run the business's assistant → save the reply.
 * The AI call runs OUTSIDE any database transaction so connections aren't held while it thinks.
 */
import { tenant } from "./db.js";
import { upsertConversation, addMessage, mergeLeadDetails, logEvent } from "./leads.js";
import { runBusinessAgent, toHistory } from "./agent.js";
import { str, email as cleanEmail, phone as cleanPhone, oneOf } from "./http.js";

export async function loadAiContext(tx, businessId) {
  const [business] = await tx`select * from businesses where id = ${businessId}`;
  const [settings] = await tx`select * from ai_settings where business_id = ${businessId}`;
  const knowledge = await tx`select kind, title, content from knowledge_items where business_id = ${businessId} and enabled order by kind, position, created_at`;
  return { business, settings: settings || {}, knowledge };
}

export function cleanLeadDetails(input) {
  return {
    name: str(input.name, 120),
    phone: cleanPhone(input.phone),
    email: cleanEmail(input.email),
    service_interest: str(input.service_interest, 200),
    location: str(input.location, 120),
    budget: str(input.budget, 80),
    preferred_date: str(input.preferred_date, 80),
    urgency: oneOf(input.urgency, ["low", "medium", "high"], ""),
    ready_to_book: input.ready_to_book === true,
    notes: str(input.notes, 300),
  };
}

/** Tool effects for a real conversation. */
export function conversationTools(businessId, convId, leadId) {
  return async (name, input) => {
    if (name === "save_lead_details") {
      if (!leadId) return { ok: false };
      const lead = await tenant(businessId, (tx) => mergeLeadDetails(tx, businessId, leadId, cleanLeadDetails(input), "ai"));
      return { ok: !!lead };
    }
    if (name === "request_human") {
      await tenant(businessId, async (tx) => {
        await tx`update conversations set handler = 'human', human_since = now(), status = 'open' where id = ${convId} and business_id = ${businessId}`;
        await logEvent(tx, businessId, "conversation.handoff", { leadId, conversationId: convId, actor: "ai", data: { reason: str(input.reason, 300) } });
      });
      return { ok: true };
    }
    return { ok: false, error: "unknown_tool" };
  };
}

const AI_DOWN = "Thanks for your message. A member of the team will get back to you shortly.";

/**
 * @returns {{conversationId, handler, reply?: {id, body, created_at}}}
 */
export async function customerTurn({ businessId, channel, externalId, text, customer = {} }) {
  const { conv, ctx } = await tenant(businessId, async (tx) => {
    const { conv } = await upsertConversation(tx, businessId, {
      channel, externalId, customerName: customer.name || "", phone: customer.phone || "", email: customer.email || "", source: channel,
    });
    await addMessage(tx, businessId, conv, { direction: "in", sender: "customer", body: text });
    const [fresh] = await tx`select * from conversations where id = ${conv.id}`;
    if (fresh.handler !== "ai") return { conv: fresh, ctx: null };
    const ctx = await loadAiContext(tx, businessId);
    if (!ctx.settings.enabled) return { conv: fresh, ctx: null };
    const rows = await tx`select direction, body from (select direction, body, created_at from messages where conversation_id = ${conv.id} and sender <> 'system' order by created_at desc limit 30) m order by created_at`;
    return { conv: fresh, ctx: { ...ctx, history: toHistory(rows) } };
  });
  if (!ctx || !ctx.history.length) return { conversationId: conv.id, handler: conv.handler };

  const out = await runBusinessAgent({ ...ctx, channel, onTool: conversationTools(businessId, conv.id, conv.lead_id) });
  const body = out.ok ? out.reply : AI_DOWN;
  const saved = await tenant(businessId, async (tx) => {
    const m = await addMessage(tx, businessId, conv, { direction: "out", sender: out.ok ? "ai" : "system", body });
    if (!out.ok) {
      // AI unavailable: hand to a human so the customer isn't left waiting on a machine.
      await tx`update conversations set handler = 'human', human_since = now() where id = ${conv.id} and business_id = ${businessId}`;
      await logEvent(tx, businessId, "conversation.handoff", { conversationId: conv.id, leadId: conv.lead_id, data: { reason: "AI unavailable" } });
    }
    return m;
  });
  return { conversationId: conv.id, handler: out.ok && !out.handoff ? "ai" : "human", reply: saved && { id: saved.id, body: saved.body, sender: saved.sender, created_at: saved.created_at } };
}
