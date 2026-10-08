/**
 * Accounts and sessions for the Growth Engine dashboard.
 *  - Passwords: scrypt (N=16384, r=8, p=1) with a random salt; compared in constant time.
 *  - Sessions: 32 random bytes in an HttpOnly, SameSite=Lax, Secure cookie; only the SHA-256 of
 *    the token is stored, so a database leak can't be replayed as a login.
 */
import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { system } from "./db.js";
import { parseCookies, cookie, isHttps } from "./http.js";

const scrypt = promisify(_scrypt);
export const SESSION_COOKIE = "ge_session";
const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const [alg, N, r, p, salt, hash] = String(stored || "").split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(key, expected);
}

// Spend the same time on unknown emails as on wrong passwords (no account enumeration by timing).
let dummyHash = null;
export async function burnPasswordCheck(password) {
  dummyHash ||= await hashPassword("not-a-real-password");
  await verifyPassword(password, dummyHash);
}

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export async function createSession(request, userId, businessId) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400e3);
  await system((tx) => tx`
    insert into sessions (token_hash, user_id, business_id, expires_at, ip, user_agent)
    values (${sha256(token)}, ${userId}, ${businessId}, ${expires}, ${(request.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64)}, ${(request.headers.get("user-agent") || "").slice(0, 200)})`);
  return cookie(SESSION_COOKIE, token, { maxAge: SESSION_DAYS * 86400, secure: isHttps(request) });
}

export const clearSessionCookie = (request) => cookie(SESSION_COOKIE, "", { maxAge: 0, secure: isHttps(request) });

/** { user, businessId, role } for a valid session cookie, else null. */
export async function readSession(request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token || token.length < 30 || token.length > 100) return null;
  return system(async (tx) => {
    const [s] = await tx`
      select s.id as session_id, s.business_id, u.id as user_id, u.email, u.name, u.is_platform_admin
      from sessions s join users u on u.id = s.user_id
      where s.token_hash = ${sha256(token)} and s.expires_at > now()`;
    if (!s) return null;
    let role = null;
    if (s.business_id) {
      const [m] = await tx`select role from memberships where business_id = ${s.business_id} and user_id = ${s.user_id}`;
      role = m?.role || null;
    }
    // Membership removed since login → no business access.
    return {
      sessionId: s.session_id,
      user: { id: s.user_id, email: s.email, name: s.name, is_platform_admin: s.is_platform_admin },
      businessId: role ? s.business_id : null,
      role,
    };
  });
}

export async function destroySession(request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return;
  await system((tx) => tx`delete from sessions where token_hash = ${sha256(token)}`);
}
