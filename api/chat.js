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
import { sanitizeState } from "./_lib/tools.js";
import { runAgent, FALLBACK } from "./_lib/agent.js";

const MAX_MESSAGES = 40;
const MAX_USER_CHARS = 2000;
const MAX_TOTAL_CHARS = 40000;



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
  const out = await runAgent({ messages, ctx, channel: "web" });
  const { ok, ...rest } = out;
  if (!ok) return json(502, { error: "ai_error", ...rest });
  return json(200, rest);
}

export function GET() {
  return json(405, { error: "method_not_allowed" }, { allow: "POST" });
}
