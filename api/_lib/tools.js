import { searchKnowledge, KNOWLEDGE_INLINE } from "./knowledge.js";

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
    description: "Send a potential customer's details to the Dleading team. Only call once you have name, what they need, and an email or phone, and the visitor has agreed to share them.",
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
      required: ["name", "needs"],
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
 * Executes one tool call. `ctx` = { conversationId, transcript, page, sent:Set }.
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
      const { email, phone, errors } = contactFields(input);
      const nameV = clean(input.name, 100);
      const needs = clean(input.needs, 1000);
      if (!nameV) errors.push("need the visitor's name");
      if (!needs) errors.push("need a short description of what they need");
      if (errors.length) return { result: { ok: false, error: errors.join("; ") } };
      if (ctx.sent.has("lead")) return { result: { ok: true, note: "Lead already sent in this request." } };
      ctx.sent.add("lead");
      const r = await sendToN8n("N8N_LEAD_WEBHOOK_URL", {
        type: "lead",
        timestamp: new Date().toISOString(),
        conversation_id: ctx.conversationId,
        page: ctx.page,
        lead: {
          name: nameV, email, phone,
          business_name: clean(input.business_name, 150),
          needs,
          budget: clean(input.budget, 100),
          preferred_contact: ["email", "phone", "whatsapp"].includes(input.preferred_contact) ? input.preferred_contact : "",
        },
        transcript: ctx.transcript,
      });
      return { result: r.ok ? { ok: true } : { ok: false, error: FAIL_MSG }, action: { type: "lead", ok: r.ok } };
    }

    case "request_human": {
      const { email, phone, errors } = contactFields(input);
      const reason = clean(input.reason, 500);
      if (!reason) errors.push("need a reason");
      if (errors.length) return { result: { ok: false, error: errors.join("; ") + ". If the visitor won't share contact details, give them Dleading's contact details instead." } };
      if (ctx.sent.has("handoff")) return { result: { ok: true, note: "Already handed over in this request." } };
      ctx.sent.add("handoff");
      const r = await sendToN8n("N8N_HANDOFF_WEBHOOK_URL", {
        type: "handoff",
        timestamp: new Date().toISOString(),
        conversation_id: ctx.conversationId,
        page: ctx.page,
        reason,
        customer: {
          name: clean(input.name, 100), email, phone,
          preferred_contact: ["email", "phone", "whatsapp"].includes(input.preferred_contact) ? input.preferred_contact : "",
        },
        transcript: ctx.transcript,
      });
      return { result: r.ok ? { ok: true } : { ok: false, error: FAIL_MSG }, action: { type: "handoff", ok: r.ok } };
    }

    case "end_conversation":
      return { result: { ok: true }, ended: true };

    default:
      return { result: { ok: false, error: "unknown tool" } };
  }
}
