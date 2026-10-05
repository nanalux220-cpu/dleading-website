/**
 * POST /api/connect-number — one-time helper to register the business number on the
 * WhatsApp Cloud API (Meta has no dashboard button for numbers already added).
 *
 * Body: { key, step, method?, code?, pin? }
 *   key  : must equal WHATSAPP_VERIFY_TOKEN for verify_code / register (status & request_code are open, capped)
 *   step : "status" | "request_code" | "verify_code" | "register"
 * The SMS code and PIN go straight to Meta; they're never stored or logged.
 */
import { timingSafeEqual } from "node:crypto";
import { whatsappEnv, setActivePhone } from "./_lib/whatsapp.js";
import { cmd, storeConfigured } from "./_lib/store.js";

// API-type WABA (the "Dleading Creative Design Ltd" WABA is a WhatsApp Business *app* account,
// which can't hold Cloud API numbers).
const WABA_ID = "1090927923795967";
// Numbers the owner has asked to connect (adding them is harmless; codes go to that phone).
// The stuck, never-registered entry the owner approved removing (frees a number slot).
const REMOVABLE = { "1239342529252777": "+44 7427 259935" };
const ALLOWED_NEW = { "447383827715": { cc: "44", phone_number: "7383827715" } };

const env = (k) => String(process.env[k] || "").trim();
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

let sent = [];
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
  // "status" and "request_code" are harmless (the code only goes to the business phone), so they
  // don't need the key; request_code is capped. Verifying and registering still require the key.
  const open = b.step === "status" || b.step === "request_code" || b.step === "add_number" || b.step === "remove_offline";
  if (!open && !keyOk(b.key)) return json(401, { ok: false, error: "Wrong key. Use the WHATSAPP_VERIFY_TOKEN value from Vercel." });
  if (b.step === "request_code") {
    sent = sent.filter((t) => Date.now() - t < 60 * 60e3);
    if (sent.length >= 5) return json(429, { ok: false, error: "Code already requested 5 times this hour. Use the last code you received, or wait." });
    sent.push(Date.now());
  }
  if (!env("WHATSAPP_ACCESS_TOKEN")) return json(503, { ok: false, error: "WHATSAPP_ACCESS_TOKEN not set in Vercel" });
  if (storeConfigured()) { try { setActivePhone(await cmd("GET", "wa:active_phone_id")); } catch { /* env */ } }
  // Target phone: an explicit phone_id that belongs to our WABA, else the active one.
  let phone = whatsappEnv("WHATSAPP_PHONE_NUMBER_ID");
  if (b.phone_id) {
    const list = await graph(`${WABA_ID}/phone_numbers?fields=id,display_phone_number`);
    if (!list.ok) return json(502, list);
    if (!(list.data?.data || []).some((n) => String(n.id) === String(b.phone_id))) return json(400, { ok: false, error: "That phone ID isn't in the Dleading WhatsApp account." });
    phone = String(b.phone_id);
  }

  switch (b.step) {
    case "remove_offline": {
      const id = Object.keys(REMOVABLE)[0];
      const st = await graph(`${id}?fields=status,code_verification_status`);
      if (st.ok && st.data?.status === "CONNECTED") return json(400, { ok: false, error: "That number is connected; not removing it." });
      const r = await graph(id, "DELETE");
      return json(r.ok ? 200 : 502, r.ok ? { ok: true, message: `Removed the offline entry for ${REMOVABLE[id]} from Meta (phone app unaffected).`, data: r.data } : r);
    }
    case "add_number": {
      const digits = String(b.number || "").replace(/\D/g, "").replace(/^0/, "44");
      const n = ALLOWED_NEW[digits];
      if (!n) return json(400, { ok: false, error: "Only the agreed new number can be added here." });
      const list = await graph(`${WABA_ID}/phone_numbers?fields=id,display_phone_number,status,code_verification_status`);
      const existing = (list.data?.data || []).find((x) => String(x.display_phone_number || "").replace(/\D/g, "") === digits);
      if (existing) return json(200, { ok: true, message: "Number already added.", data: existing });
      const r = await graph(`${WABA_ID}/phone_numbers`, "POST", { cc: n.cc, phone_number: n.phone_number, verified_name: "Dleading Creative Design Ltd" });
      return json(r.ok ? 200 : 502, r.ok ? { ok: true, message: "Number added.", data: r.data } : r);
    }
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
      if (r.ok && storeConfigured()) await cmd("SET", "wa:active_phone_id", phone);
      return json(r.ok ? 200 : 502, r.ok ? { ok: true, message: "Registered on the Cloud API and set as the active AI number. Messages will now reach your AI." } : r);
    }
    default:
      return json(400, { ok: false, error: "unknown step" });
  }
}
