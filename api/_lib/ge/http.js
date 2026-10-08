/** Small HTTP helpers shared by /api/app and /api/widget. */
import { cmd, storeConfigured } from "../store.js";

export class HttpError extends Error {
  constructor(status, code, detail) { super(code); this.status = status; this.code = code; this.detail = detail; }
}
export const fail = (status, code, detail) => { throw new HttpError(status, code, detail); };

export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
  });
}

export const clientIp = (request) => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
export const requestHost = (request) => request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
export const isHttps = (request) => (request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "")) === "https";

/** CSRF guard for cookie-authenticated writes: the browser's Origin must be this site. */
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === requestHost(request); } catch { return false; }
}

export async function readJson(request, maxBytes = 200_000) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > maxBytes) fail(413, "too_large");
  const text = await request.text();
  if (text.length > maxBytes) fail(413, "too_large");
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) fail(400, "invalid_body");
    return v;
  } catch (e) { if (e instanceof HttpError) throw e; fail(400, "invalid_json"); }
}

// ---------- cookies ----------
export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
export function cookie(name, value, { maxAge, secure }) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

// ---------- rate limiting ----------
// Redis fixed window when Upstash is configured (shared across instances), otherwise per instance.
const local = new Map();
export async function rateLimit(key, limit, windowSec) {
  const bucket = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  if (storeConfigured()) {
    try {
      const n = Number(await cmd("INCR", bucket));
      if (n === 1) await cmd("EXPIRE", bucket, windowSec + 5);
      if (n > limit) fail(429, "rate_limited");
      return;
    } catch (e) { if (e instanceof HttpError) throw e; /* store down: fall back to local */ }
  }
  const n = (local.get(bucket) || 0) + 1;
  local.set(bucket, n);
  if (local.size > 5000) local.clear();
  if (n > limit) fail(429, "rate_limited");
}

// ---------- validation ----------
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
/** Trimmed string, control characters stripped, length-capped. Non-strings become "". */
export const str = (v, max = 500) => (typeof v === "string" ? v.replace(CTRL, "").trim().slice(0, max) : typeof v === "number" ? String(v).slice(0, max) : "");
export const oneOf = (v, allowed, dflt) => (allowed.includes(v) ? v : dflt);
export const bool = (v) => v === true || v === "true" || v === 1;
export const int = (v, min, max, dflt) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : dflt; };
export const email = (v) => { const s = str(v, 254).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : ""; };
export const phone = (v) => { const s = str(v, 40).replace(/[^\d+]/g, ""); return /^\+?\d{6,16}$/.test(s) ? s : ""; };
export function url(v) {
  const s = str(v, 300);
  if (!s) return "";
  try { const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); return /^https?:$/.test(u.protocol) && u.hostname.includes(".") ? u.toString().replace(/\/$/, "") : ""; } catch { return ""; }
}
export function isoDate(v) {
  if (v === null || v === "") return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
