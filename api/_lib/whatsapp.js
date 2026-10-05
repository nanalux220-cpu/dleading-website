/**
 * WhatsApp Cloud API helpers (Meta Graph API). Server-side only.
 *
 * Env:
 *   WHATSAPP_ACCESS_TOKEN      permanent System User token (NEVER the 24h token, never in code/GitHub)
 *   WHATSAPP_PHONE_NUMBER_ID   e.g. 1385944931264059
 *   WHATSAPP_APP_SECRET        Meta App Dashboard → App settings → Basic → App secret (signature check)
 *   WHATSAPP_VERIFY_TOKEN      any long random string; must match what you type in Meta's webhook settings
 *   WHATSAPP_API_VERSION       optional, default v21.0
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = process.env.WHATSAPP_GRAPH_BASE || "https://graph.facebook.com";
const version = () => String(process.env.WHATSAPP_API_VERSION || "").trim() || "v21.0";

// Non-secret defaults for Dleading (env vars still override them).
const DEFAULTS = { WHATSAPP_PHONE_NUMBER_ID: "1385944931264059" };
// Active phone number chosen at registration time (stored in Redis by /api/connect-number)
// overrides the env var, so switching numbers needs no Vercel change.
let activePhone = "";
export const setActivePhone = (id) => { activePhone = /^\d{6,20}$/.test(String(id || "")) ? String(id) : ""; };
const env = (k) => (k === "WHATSAPP_PHONE_NUMBER_ID" && activePhone) || String(process.env[k] || "").trim() || DEFAULTS[k] || "";
export const whatsappEnv = env;
export function whatsappConfigured() {
  return !!(env("WHATSAPP_ACCESS_TOKEN") && env("WHATSAPP_PHONE_NUMBER_ID"));
}

/** Verify Meta's X-Hub-Signature-256 header against the raw request body. */
export function validSignature(rawBody, header) {
  const secret = String(process.env.WHATSAPP_APP_SECRET || "").trim();
  if (!secret || typeof header !== "string" || !header.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const given = header.slice(7);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}

/** Digits only, no "+" (the format Meta uses for wa_id). */
export function normaliseNumber(n) {
  let d = String(n || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0") && d.length === 11) d = "44" + d.slice(1); // UK local 07… → 447…
  return /^\d{8,15}$/.test(d) ? d : null;
}

async function graph(payload) {
  if (!whatsappConfigured()) return { ok: false, error: "whatsapp_not_configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${GRAPH}/${version()}/${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${env("WHATSAPP_ACCESS_TOKEN")}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Log Meta's error code/message only — never the token or message text.
      const err = data?.error || {};
      console.error(`[whatsapp] send failed ${res.status} code=${err.code ?? "?"} ${String(err.message || "").slice(0, 160)}`);
      return { ok: false, error: `meta_${err.code ?? res.status}`, detail: String(err.message || "").slice(0, 200) };
    }
    return { ok: true, id: data?.messages?.[0]?.id || null };
  } catch (e) {
    console.error(`[whatsapp] send error ${e.name}`);
    return { ok: false, error: e.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

/** Free-form text. Only delivered inside the 24h customer-service window (i.e. replies). */
export const sendText = (to, body) =>
  graph({ recipient_type: "individual", to, type: "text", text: { preview_url: true, body: String(body).slice(0, 4096) } });

/**
 * Approved template (required for campaigns / messaging people outside the 24h window).
 * params: values for {{1}}, {{2}}… in the template body.
 */
export const sendTemplate = (to, name, language = "en_GB", params = []) =>
  graph({
    to,
    type: "template",
    template: {
      name,
      language: { code: language },
      ...(params.length ? { components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: String(p) })) }] } : {}),
    },
  });

/** Blue ticks on the customer's message (best effort). */
export const markRead = (messageId) => graph({ status: "read", message_id: messageId });
