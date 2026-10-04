/**
 * POST /api/chat — Dleading website AI assistant.
 *
 * Request:  { conversationId, messages: [{ role: "user"|"assistant", content }], page?, state? }  (state = completed actions, see _lib/tools.js)
 * Response: { reply, ended, actions: [{ type: "lead"|"lead_update"|"handoff", ok }], state }
 *
 * Server-side env vars (set in Vercel, never in the frontend):
 *   ANTHROPIC_API_KEY        required
 *   ANTHROPIC_MODEL          optional, default claude-haiku-4-5-20251001
 *   N8N_LEAD_WEBHOOK_URL     optional until the n8n lead workflow exists
 *   N8N_HANDOFF_WEBHOOK_URL  optional until the n8n handoff workflow exists
 *   N8N_WEBHOOK_SECRET       shared secret sent to n8n as the x-dleading-secret header
 *   ALLOWED_ORIGINS          optional extra origins, comma-separated
 *   ABUSE_MAX_WARNINGS       optional, default 1
 */
import { buildSystem } from "./_lib/prompt.js";
import { TOOL_DEFS, runTool, sanitizeState, stateNotes, handleHandoffMode } from "./_lib/tools.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const API_BASE = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
const MAX_MESSAGES = 40;
const MAX_USER_CHARS = 2000;
const MAX_TOTAL_CHARS = 40000;
const MAX_TOOL_ROUNDS = 4;
const AI_TIMEOUT_MS = 25000;

const FALLBACK =
  "Sorry, I'm having trouble responding right now. You can reach the Dleading team directly on WhatsApp/phone +44 742 725 9935 or at info@creativedleading.co.uk.";

// ---------- helpers ----------
function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });
}

const DEFAULT_ORIGINS = ["https://creativedleading.co.uk", "https://www.creativedleading.co.uk"];
function originAllowed(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false; // browsers always send Origin on cross/same-origin POST fetches
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  // Same-origin (covers production, custom domains and Vercel preview URLs automatically)
  const reqHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (reqHost && host === reqHost) return true;
  const extra = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...DEFAULT_ORIGINS, ...extra].includes(origin);
}

// Best-effort, per-instance rate limit (stops casual spam; not a hard guarantee across instances).
const hits = new Map();
function rateLimited(key, limit = 15, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  return arr.length > limit;
}

function validate(body) {
  if (!body || typeof body !== "object") return "invalid body";
  const { conversationId, messages, page } = body;
  if (typeof conversationId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(conversationId)) return "invalid conversationId";
  if (page !== undefined && (typeof page !== "string" || page.length > 200)) return "invalid page";
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) return "invalid messages";
  let total = 0;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m.content !== "string" || !m.content.trim()) return "invalid message";
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (m.role !== expected) return "messages must alternate user/assistant, starting with user";
    if (m.role === "user" && m.content.length > MAX_USER_CHARS) return "message too long";
    total += m.content.length;
  }
  if (messages[messages.length - 1].role !== "user") return "last message must be from user";
  if (total > MAX_TOTAL_CHARS) return "conversation too long";
  return null;
}

async function callClaude(messages, state) {
  const system = buildSystem();
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

// ---------- handlers ----------
export async function POST(request) {
  if (!originAllowed(request)) return json(403, { error: "forbidden" });

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(`ip:${ip}`)) return json(429, { error: "rate_limited", reply: "You're sending messages a little fast. Please wait a moment and try again." });

  const len = Number(request.headers.get("content-length") || 0);
  if (len > 100_000) return json(413, { error: "too_large" });

  let body;
  try { body = await request.json(); } catch { return json(400, { error: "invalid json" }); }
  const problem = validate(body);
  if (problem) return json(400, { error: problem });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[chat] ANTHROPIC_API_KEY missing");
    return json(503, { error: "ai_unavailable", reply: FALLBACK });
  }

  const messages = body.messages.map((m) => ({ role: m.role, content: m.content }));
  const ctx = {
    conversationId: body.conversationId,
    page: body.page || "",
    transcript: messages.map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`).join("\n"),
    state: sanitizeState(body.state),
  };
  const state = ctx.state;
  const actions = [];
  let ended = false;

  // Handed over to a human: the AI stays quiet; new messages go to the team.
  if (state.mode === "handoff") {
    const out = await handleHandoffMode(ctx, messages[messages.length - 1].content);
    return json(200, { reply: out.reply, ended: false, handoff: true, actions: [{ type: "handoff_message", ok: out.forwarded }], state });
  }

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const data = await callClaude(messages, state);
      const content = Array.isArray(data.content) ? data.content : [];
      const text = content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      const toolUses = content.filter((b) => b.type === "tool_use");

      if (data.stop_reason !== "tool_use" || !toolUses.length || round === MAX_TOOL_ROUNDS) {
        if (!text) throw new Error("empty_reply");
        return json(200, { reply: text, ended, handoff: state.mode === "handoff", actions, state });
      }

      messages.push({ role: "assistant", content });
      const results = [];
      for (const tu of toolUses) {
        const out = await runTool(tu.name, tu.input, ctx);
        if (out.action) actions.push(out.action);
        if (out.ended) ended = true;
        results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(out.result) });
      }
      messages.push({ role: "user", content: results });

      if (ended) {
        // Use the closing line the model already wrote, or a neutral default.
        return json(200, { reply: text || "I'm going to end our chat here. If you need help later, you can contact Dleading on +44 742 725 9935.", ended, actions, state });
      }
    }
  } catch (e) {
    console.error(`[chat] failed: ${e.message}`);
    return json(502, { error: "ai_error", reply: FALLBACK, actions, state });
  }
  return json(502, { error: "ai_error", reply: FALLBACK, actions });
}

export function GET() {
  return json(405, { error: "method_not_allowed" }, { allow: "POST" });
}
