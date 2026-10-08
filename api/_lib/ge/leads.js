/** Lead + conversation persistence shared by the dashboard API, the widget and the WhatsApp bridge. */
import { scoreLead } from "./scoring.js";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "appointment", "won", "lost"];
export const LEAD_SOURCES = ["whatsapp", "website", "facebook", "instagram", "voice", "email", "sms", "manual", "import", "other"];
export const CHANNELS = ["whatsapp", "website", "facebook", "instagram", "voice", "email", "sms"];

export async function logEvent(tx, businessId, type, { leadId = null, conversationId = null, actor = "system", data = {} } = {}) {
  await tx`insert into events (business_id, type, lead_id, conversation_id, actor, data)
           values (${businessId}, ${type}, ${leadId}, ${conversationId}, ${actor}, ${tx.json(data)})`;
}

export async function scoringFor(tx, businessId) {
  const [s] = await tx`select scoring from ai_settings where business_id = ${businessId}`;
  return s?.scoring || {};
}

/**
 * Merge non-empty details into a lead and rescore it. Only fills fields with new values,
 * never blanks existing ones. Logs lead.scored / lead.hot when the label changes.
 */
export async function mergeLeadDetails(tx, businessId, leadId, details, actor = "ai") {
  const [lead] = await tx`select * from leads where id = ${leadId} and business_id = ${businessId}`;
  if (!lead) return null;
  const patch = {};
  for (const k of ["name", "phone", "email", "service_interest", "location", "budget", "preferred_date"]) {
    if (details[k] && details[k] !== lead[k]) patch[k] = details[k];
  }
  if (details.urgency && details.urgency !== lead.urgency) patch.urgency = details.urgency;
  if (details.ready_to_book === true && !lead.ready_to_book) patch.ready_to_book = true;
  if (details.notes) patch.notes = lead.notes ? `${lead.notes}\n${details.notes}`.slice(-5000) : details.notes;
  const merged = { ...lead, ...patch };
  const { score, label, reasons } = scoreLead(merged, await scoringFor(tx, businessId));
  patch.score = score;
  patch.score_label = label;
  patch.qualification = { ...(lead.qualification || {}), reasons, scored_at: new Date().toISOString() };
  if (lead.status === "new" && label !== "cold" && merged.service_interest && (merged.phone || merged.email)) patch.status = "qualified";
  const [updated] = await tx`update leads set ${tx(patch)} where id = ${leadId} and business_id = ${businessId} returning *`;
  if (label !== lead.score_label) {
    await logEvent(tx, businessId, label === "hot" ? "lead.hot" : "lead.scored", { leadId, actor, data: { from: lead.score_label, to: label, score } });
  }
  if (patch.status === "qualified") await logEvent(tx, businessId, "lead.status_changed", { leadId, actor, data: { from: "new", to: "qualified" } });
  return updated;
}

/** Find-or-create the conversation for (channel, externalId), with a lead attached. */
export async function upsertConversation(tx, businessId, { channel, externalId, customerName = "", phone = "", email = "", source }) {
  let [conv] = await tx`select * from conversations where business_id = ${businessId} and channel = ${channel} and external_id = ${externalId}`;
  let createdLead = null;
  if (!conv) {
    let lead = null;
    if (phone) [lead] = await tx`select * from leads where business_id = ${businessId} and phone = ${phone} order by created_at limit 1`;
    if (!lead) {
      [lead] = await tx`insert into leads (business_id, name, phone, email, source, last_contact_at)
                        values (${businessId}, ${customerName}, ${phone}, ${email}, ${source || channel}, now()) returning *`;
      createdLead = lead;
      await logEvent(tx, businessId, "lead.created", { leadId: lead.id, actor: "customer", data: { source: source || channel } });
    }
    [conv] = await tx`insert into conversations (business_id, lead_id, channel, external_id, customer_name)
                      values (${businessId}, ${lead.id}, ${channel}, ${externalId}, ${customerName})
                      on conflict (business_id, channel, external_id) do update set updated_at = now()
                      returning *`;
    await logEvent(tx, businessId, "conversation.started", { leadId: lead.id, conversationId: conv.id, actor: "customer", data: { channel } });
  } else if (customerName && !conv.customer_name) {
    [conv] = await tx`update conversations set customer_name = ${customerName} where id = ${conv.id} returning *`;
  }
  return { conv, createdLead };
}

/** Insert a message (idempotent on external_id) and update the conversation preview/unread. */
export async function addMessage(tx, businessId, conv, { direction, sender, body, externalId = null, status = "", metadata = {}, at = null }) {
  const rows = await tx`
    insert into messages (business_id, conversation_id, direction, sender, body, external_id, status, metadata, created_at)
    values (${businessId}, ${conv.id}, ${direction}, ${sender}, ${body}, ${externalId}, ${status}, ${tx.json(metadata)}, ${at || new Date()})
    on conflict (business_id, external_id) where external_id is not null do nothing
    returning *`;
  if (!rows.length) return null; // duplicate delivery
  const preview = body.replace(/\s+/g, " ").slice(0, 140);
  await tx`update conversations set
             last_message_at = greatest(coalesce(last_message_at, 'epoch'), ${rows[0].created_at}),
             last_message_preview = ${preview},
             unread_count = case when ${direction} = 'in' then unread_count + 1 else unread_count end,
             status = case when ${direction} = 'in' and status = 'closed' then 'open' else status end
           where id = ${conv.id} and business_id = ${businessId}`;
  if (direction === "in" && conv.lead_id) {
    await tx`update leads set last_contact_at = now() where id = ${conv.lead_id} and business_id = ${businessId}`;
  }
  await logEvent(tx, businessId, direction === "in" ? "message.received" : "message.sent", { leadId: conv.lead_id, conversationId: conv.id, actor: sender, data: { channel: conv.channel } });
  return rows[0];
}
