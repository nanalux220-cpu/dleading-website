/**
 * POST /api/connect-number — one-time helper to register the business number on the
 * WhatsApp Cloud API (Meta has no dashboard button for numbers already added).
 *
 * Body: { key, step, method?, code?, pin? }
 *   key  : must equal WHATSAPP_VERIFY_TOKEN (only the owner knows it)
 *   step : "status" | "request_code" | "verify_code" | "register"
 * The SMS code and PIN go straight to Meta; they're never stored or logged.
 */
import { timingSafeEqual } from "node:crypto";
import { whatsappEnv } from "./_lib/whatsapp.js";

const env = (k) => String(process.env[k] || "").trim();
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const attempts = new Map();
function limited(ip) {
  const now = Date.now();
  const a = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60e3);
  a.push(now);
  attempts.set(ip, a);
  return a.length > 20;
}
function keyOk(given) {
  const expected = env("WHATSAPP_VERIFY_TOKEN");
  const g = String(given || "").trim();
  if (!expected || g.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(g), Buffer.from(expected));
}

async function graph(path, method = "GET", body) {
  const ver = env("WHATSAPP_API_VERSION") || "v21.0";
  const res = await fetch(`${process.env.WHATSAPP_GRAPH_BASE || "https://graph.facebook.com"}/${ver}/${path}`, {
    method,
    headers: { authorization: `Bearer ${env("WHATSAPP_ACCESS_TOKEN")}`, "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, data } : { ok: false, error: `Meta error ${data?.error?.code ?? res.status}: ${String(data?.error?.error_user_msg || data?.error?.message || "").slice(0, 300)}` };
}

export async function POST(request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (limited(ip)) return json(429, { ok: false, error: "Too many attempts. Wait 15 minutes." });
  let b;
  try { b = await request.json(); } catch { return json(400, { ok: false, error: "invalid json" }); }
  if (!keyOk(b.key)) return json(401, { ok: false, error: "Wrong key. Use the WHATSAPP_VERIFY_TOKEN value from Vercel." });
  if (!env("WHATSAPP_ACCESS_TOKEN")) return json(503, { ok: false, error: "WHATSAPP_ACCESS_TOKEN not set in Vercel" });
  const phone = whatsappEnv("WHATSAPP_PHONE_NUMBER_ID");

  switch (b.step) {
    case "status": {
      const r = await graph(`${phone}?fields=display_phone_number,verified_name,status,code_verification_status,platform_type`);
      return json(r.ok ? 200 : 502, r);
    }
    case "request_code": {
      const method = b.method === "VOICE" ? "VOICE" : "SMS";
      const r = await graph(`${phone}/request_code`, "POST", { code_method: method, language: "en_GB" });
      return json(r.ok ? 200 : 502, r.ok ? { ok: true, message: `Code sent by ${method}.` } : r);
    }
    case "verify_code": {
      const code = String(b.code || "").replace(/\D/g, "");
      if (!/^\d{6}$/.test(code)) return json(400, { ok: false, error: "The code is 6 digits." });
      const r = await graph(`${phone}/verify_code`, "POST", { code });
      return json(r.ok ? 200 : 502, r.ok ? { ok: true, message: "Number verified." } : r);
    }
    case "register": {
      const pin = String(b.pin || "");
      if (!/^\d{6}$/.test(pin)) return json(400, { ok: false, error: "The PIN must be 6 digits." });
      const r = await graph(`${phone}/register`, "POST", { messaging_product: "whatsapp", pin });
      return json(r.ok ? 200 : 502, r.ok ? { ok: true, message: "Registered on the Cloud API. Messages will now reach your AI." } : r);
    }
    default:
      return json(400, { ok: false, error: "unknown step" });
  }
}
