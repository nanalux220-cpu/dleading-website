/**
 * The Dleading receptionist AI, shared by the website chat (/api/chat) and WhatsApp (/api/whatsapp).
 * Same rules, same knowledge, same tools, same lead/handoff idempotency.
 */
import { buildSystem } from "./prompt.js";
import { TOOL_DEFS, runTool, stateNotes, handleHandoffMode } from "./tools.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const API_BASE = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
const MAX_TOOL_ROUNDS = 4;
const AI_TIMEOUT_MS = 25000;
export const FALLBACK =
  "Sorry, I'm having trouble responding right now. You can reach the Dleading team directly on WhatsApp/phone +44 742 725 9935 or at info@creativedleading.co.uk.";

/*
 * WhatsApp action: the widget shows a "Chat on WhatsApp" button under a reply when
 * the response has cta: "whatsapp". It's shown when the visitor asks for a person,
 * when a handoff is requested/active, or when the AI ends its reply with [[WHATSAPP]].
 */
const WA_MARKER = /\s*\[\[WHATSAPP\]\]\s*/gi;
const HUMAN_RE = /\b(speak|talk|chat)\s+(to|with)\s+(someone|somebody|anyone|a\s+(human|person|real\s+person)|an?\s+agent|(a\s+)?(member\s+of\s+)?staff|(the\s+)?team|you\s+guys)|\b(real|actual)\s+(person|human)|\bhuman\b|\bwhats\s?app\b|\bcall\s+me\b|\bcall\s+back\b/i;
function finishReply(text, { latest, handedOver, humanRequested }) {
  const marked = WA_MARKER.test(text);
  WA_MARKER.lastIndex = 0;
  const reply = text.replace(WA_MARKER, " ").replace(/[ \t]+\n/g, "\n").trim();
  const cta = marked || handedOver || humanRequested || HUMAN_RE.test(latest) ? "whatsapp" : undefined;
  return { reply, cta };
}

async function callClaude(messages, state, channel) {
  const system = buildSystem(channel);
  const notes = stateNotes(state);
  if (notes.length) system.push({ type: "text", text: "# Conversation state\n" + notes.join("\n") });
  const body = JSON.stringify({ model: MODEL, max_tokens: 500, system, tools: TOOL_DEFS, messages });
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body,
        signal: controller.signal,
      });
      if (res.ok) return await res.json();
      const retryable = res.status === 429 || res.status >= 500;
      console.error(`[chat] Claude API ${res.status}`);
      if (!retryable || attempt === 1) throw new Error(`claude_${res.status}`);
    } catch (e) {
      if (attempt === 1 || !(e.name === "AbortError" || /claude_(429|5\d\d)/.test(e.message) || e.name === "TypeError")) throw e;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error("claude_unreachable");
}

/**
 * Run one visitor turn.
 * @param {object} p
 * @param {{role:string, content:string}[]} p.messages  alternating history ending with the visitor's message
 * @param {object} p.ctx  { conversationId, page, transcript, state } (state is mutated)
 * @param {"web"|"whatsapp"} [p.channel]
 * @returns {Promise<{ok:boolean, reply:string, cta?:string, ended:boolean, handoff:boolean, actions:object[], state:object}>}
 */
export async function runAgent({ messages, ctx, channel = "web" }) {
  const state = ctx.state;
  const actions = [];
  let ended = false;
  const latest = messages[messages.length - 1].content;
  const web = channel === "web";

  // Handed over to a human: the AI stays quiet; new messages go to the team.
  if (state.mode === "handoff") {
    const out = await handleHandoffMode(ctx, latest, channel);
    return { ok: true, reply: out.reply, ended: false, handoff: true, cta: web ? "whatsapp" : undefined, actions: [{ type: "handoff_message", ok: out.forwarded }], state };
  }

  const convo = messages.map((m) => ({ role: m.role, content: m.content }));
  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const data = await callClaude(convo, state, channel);
      const content = Array.isArray(data.content) ? data.content : [];
      const text = content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      const toolUses = content.filter((b) => b.type === "tool_use");

      if (data.stop_reason !== "tool_use" || !toolUses.length || round === MAX_TOOL_ROUNDS) {
        if (!text) throw new Error("empty_reply");
        const fin = finishReply(text, { latest, handedOver: state.mode === "handoff", humanRequested: actions.some((a) => a.type === "handoff") });
        if (!fin.reply) throw new Error("empty_reply");
        return { ok: true, reply: fin.reply, cta: web ? fin.cta : undefined, ended, handoff: state.mode === "handoff", actions, state };
      }

      convo.push({ role: "assistant", content });
      const results = [];
      for (const tu of toolUses) {
        const out = await runTool(tu.name, tu.input, ctx);
        if (out.action) actions.push(out.action);
        if (out.ended) ended = true;
        results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(out.result) });
      }
      convo.push({ role: "user", content: results });

      if (ended) {
        return { ok: true, reply: text.replace(WA_MARKER, " ").trim() || "I'm going to end our chat here. If you need help later, you can contact Dleading on +44 742 725 9935.", ended, handoff: false, actions, state };
      }
    }
  } catch (e) {
    console.error(`[agent:${channel}] failed: ${e.message}`);
    return { ok: false, reply: FALLBACK, ended: false, handoff: state.mode === "handoff", actions, state };
  }
  return { ok: false, reply: FALLBACK, ended: false, handoff: false, actions, state };
}
