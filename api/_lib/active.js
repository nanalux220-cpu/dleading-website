/**
 * Loads the WhatsApp number + business token chosen by Embedded Signup (Coexistence)
 * from Redis, so they override the env vars without a Vercel change. Never throws.
 *
 * If there is no Embedded Signup token, it also picks the access token that is actually
 * valid for the current Meta app, checking the usual variable first and then the others
 * (credentials are sometimes saved under the wrong name). Values are never logged.
 */
import { pipeline, storeConfigured } from "./store.js";
import { setActivePhone, setActiveToken } from "./whatsapp.js";

const env = (k) => String(process.env[k] || "").trim();
const appId = () => env("META_APP_ID") || "1345357342001483";
export const TOKEN_CANDIDATES = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_API_KEY", "WHATSAPP_VERIFY_TOKEN"];

let resolved = { at: 0, token: "" };
async function resolveEnvToken() {
  if (Date.now() - resolved.at < 10 * 60e3) return resolved.token;
  const base = `${process.env.WHATSAPP_GRAPH_BASE || "https://graph.facebook.com"}/${env("WHATSAPP_API_VERSION") || "v21.0"}`;
  let pick = "";
  for (const name of TOKEN_CANDIDATES) {
    const v = env(name);
    if (!v || v.length < 40) continue; // a short value is a verify phrase, not a token
    try {
      const r = await fetch(`${base}/app?fields=id`, { headers: { authorization: `Bearer ${v}` } });
      const d = await r.json().catch(() => ({}));
      if (r.ok && String(d.id) === appId()) { pick = v; if (name !== "WHATSAPP_ACCESS_TOKEN") console.warn(`[whatsapp] using access token from ${name}; move it to WHATSAPP_ACCESS_TOKEN`); break; }
    } catch { /* try next */ }
  }
  resolved = { at: Date.now(), token: pick };
  return pick;
}

export async function loadActive() {
  let token = "";
  if (storeConfigured()) {
    try {
      const [phone, t] = await pipeline([["GET", "wa:active_phone_id"], ["GET", "wa:business_token"]]);
      setActivePhone(phone);
      token = t || "";
    } catch { /* fall back to env vars */ }
  }
  if (!token) token = await resolveEnvToken();
  setActiveToken(token);
}
