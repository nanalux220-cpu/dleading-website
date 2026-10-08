/**
 * /api/embedded-signup — WhatsApp Business App onboarding (Coexistence), Embedded Signup v4.
 *
 * GET  → public config for the page: { appId, configId, graphVersion }
 * POST { code, waba_id, phone_number_id, key } → finishes onboarding:
 *   1. exchanges the one-time code for a business token (server-side, uses WHATSAPP_APP_SECRET)
 *   2. subscribes the WABA to this app (webhooks)
 *   3. starts Coexistence sync of contacts + chat history (smb_app_data)
 *   4. stores phone ID, WABA ID and the token in Redis so the AI uses this number
 *
 * Coexistence keeps the number on the WhatsApp Business App with its chats.
 * This endpoint NEVER calls /register, /deregister, request_code or deletes anything.
 *
 * Env: META_APP_ID (default 1345357342001483), META_ES_CONFIG_ID (Embedded Signup configuration ID),
 *      WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN (used as the owner key), WHATSAPP_API_VERSION.
 */
import { timingSafeEqual } from "node:crypto";
import { cmd, pipeline, storeConfigured } from "./_lib/store.js";

const env = (k) => String(process.env[k] || "").trim();
const APP_ID = () => env("META_APP_ID") || "1345357342001483";
const VERSION = () => env("WHATSAPP_API_VERSION") || "v21.0";
const GRAPH = () => process.env.WHATSAPP_GRAPH_BASE || "https://graph.facebook.com";
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function keyOk(given) {
  const expected = env("WHATSAPP_VERIFY_TOKEN");
  const g = String(given || "").trim();
  return !!expected && g.length === expected.length && timingSafeEqual(Buffer.from(g), Buffer.from(expected));
}

async function graph(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${GRAPH()}/${VERSION()}/${path}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, data } : { ok: false, error: `Meta error ${data?.error?.code ?? res.status}: ${String(data?.error?.error_user_msg || data?.error?.message || "").slice(0, 300)}` };
}

export function GET() {
  return json(200, { appId: APP_ID(), configId: env("META_ES_CONFIG_ID"), graphVersion: VERSION() });
}

const tries = new Map();
export async function POST(request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const t = (tries.get(ip) || []).filter((x) => Date.now() - x < 15 * 60e3);
  t.push(Date.now()); tries.set(ip, t);
  if (t.length > 10) return json(429, { ok: false, error: "Too many attempts. Wait 15 minutes." });

  let b;
  try { b = await request.json(); } catch { return json(400, { ok: false, error: "invalid json" }); }
  if (!keyOk(b.key)) return json(401, { ok: false, error: "Wrong setup key (use WHATSAPP_VERIFY_TOKEN from Vercel)." });
  const code = String(b.code || "");
  const waba = String(b.waba_id || "");
  const phone = String(b.phone_number_id || "");
  if (!code || !/^\d{5,25}$/.test(waba) || !/^\d{5,25}$/.test(phone)) return json(400, { ok: false, error: "Missing code, WABA ID or phone number ID from Embedded Signup." });
  if (!env("WHATSAPP_APP_SECRET")) return json(503, { ok: false, error: "WHATSAPP_APP_SECRET not set in Vercel." });
  if (!storeConfigured()) return json(503, { ok: false, error: "Database (Upstash) not connected." });

  const steps = [];
  // 1. Exchange code → business token (secret stays server-side).
  const tok = await graph(`oauth/access_token?client_id=${encodeURIComponent(APP_ID())}&client_secret=${encodeURIComponent(env("WHATSAPP_APP_SECRET"))}&code=${encodeURIComponent(code)}`);
  if (!tok.ok || !tok.data?.access_token) return json(502, { ok: false, error: `Token exchange failed. ${tok.error || ""}`.trim() });
  const token = tok.data.access_token;
  steps.push("token exchanged");

  // 2. Subscribe the WABA to this app so webhooks arrive.
  const sub = await graph(`${waba}/subscribed_apps`, { method: "POST", token });
  steps.push(sub.ok ? "WABA subscribed to app" : `WABA subscription failed: ${sub.error}`);

  // 3. Coexistence: sync contacts and chat history from the WhatsApp Business App.
  for (const sync_type of ["smb_app_state_sync", "history"]) {
    const r = await graph(`${phone}/smb_app_data`, { method: "POST", token, body: { messaging_product: "whatsapp", sync_type } });
    steps.push(r.ok ? `${sync_type} requested` : `${sync_type} not started: ${r.error}`);
  }

  // 4. Make this number the AI's number.
  const info = await graph(`${phone}?fields=display_phone_number,verified_name,platform_type,status`, { token });
  await pipeline([
    ["SET", "wa:active_phone_id", phone],
    ["SET", "wa:active_waba_id", waba],
    ["SET", "wa:business_token", token],
    ["SET", "wa:onboarded_at", new Date().toISOString()],
  ]);
  steps.push("number set as active");

  return json(200, { ok: true, steps, number: info.ok ? info.data : null });
}
