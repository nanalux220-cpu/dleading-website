/**
 * Loads the WhatsApp number + business token chosen by Embedded Signup (Coexistence)
 * from Redis, so they override the env vars without a Vercel change. Never throws.
 */
import { pipeline, storeConfigured } from "./store.js";
import { setActivePhone, setActiveToken } from "./whatsapp.js";

export async function loadActive() {
  if (!storeConfigured()) return;
  try {
    const [phone, token] = await pipeline([["GET", "wa:active_phone_id"], ["GET", "wa:business_token"]]);
    setActivePhone(phone);
    setActiveToken(token);
  } catch { /* fall back to env vars */ }
}
