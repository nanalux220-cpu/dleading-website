/**
 * Tiny Upstash Redis client (REST API, no npm package needed).
 *
 * Env (set automatically when you add Upstash from the Vercel Marketplace):
 *   KV_REST_API_URL + KV_REST_API_TOKEN   (Vercel Marketplace names)
 *   or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash console names)
 *
 * DATA MODEL ("schema")
 *   wa:contacts                 SET   all WhatsApp numbers (E.164 digits, e.g. 447700900123)
 *   wa:contact:<num>            JSON  { wa_id, name, first_seen, last_seen, last_topic, source_page,
 *                                       msg_count, opted_out, is_lead }
 *   wa:msgs:<num>               LIST  newest first, JSON { id, dir:"in"|"out", text, ts, kind }
 *   wa:status:<wamid>           JSON  { status:"sent"|"delivered"|"read"|"failed", ts, to, error? }
 *   wa:state:<num>              JSON  AI action state (lead, handoffs, mode) — same shape as the website
 *   wa:seen:<wamid>             "1"   idempotency for Meta retries (7 days)
 *   wa:autoreplies              JSON  [{ id, keyword, match:"contains"|"exact", reply, enabled }]
 *   wa:campaigns                LIST  newest first, JSON { id, name, template, language, created_at,
 *                                       total, sent, failed, skipped }
 *   wa:campaign:<id>:msgs       LIST  wamids sent by a campaign (for delivery/read stats)
 */

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export const storeConfigured = () => !!creds();

async function call(path, body) {
  const c = creds();
  if (!c) throw new Error("store_not_configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${c.url}${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`store_http_${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Run one Redis command, e.g. cmd("SET", "k", "v", "NX"). */
export async function cmd(...args) {
  const out = await call("", args.map(String));
  if (out.error) throw new Error(`store_error: ${out.error}`);
  return out.result;
}

/** Run several commands in one round trip. Returns results in order. */
export async function pipeline(commands) {
  if (!commands.length) return [];
  const out = await call("/pipeline", commands.map((c) => c.map(String)));
  return out.map((r) => {
    if (r.error) throw new Error(`store_error: ${r.error}`);
    return r.result;
  });
}

export async function getJSON(key, fallback = null) {
  const v = await cmd("GET", key);
  if (v == null) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}

export const setJSON = (key, value, ttlSeconds) =>
  ttlSeconds ? cmd("SET", key, JSON.stringify(value), "EX", ttlSeconds) : cmd("SET", key, JSON.stringify(value));

/** Returns true the FIRST time a key is claimed (atomic), false if already claimed. */
export async function claimOnce(key, ttlSeconds) {
  return (await cmd("SET", key, "1", "NX", "EX", ttlSeconds)) === "OK";
}
