/**
 * /api/app?r=<route> — Dleading Growth Engine dashboard API (one function for every route,
 * see api/_lib/ge/routes.js). Cookie session auth; every write must come from this site's origin.
 *
 * Env: DATABASE_URL or POSTGRES_URL (Postgres), ANTHROPIC_API_KEY (assistant + sandbox),
 *      ADMIN_TOKEN (needed once to link the live WhatsApp number to a business).
 */
import { routes } from "./_lib/ge/routes.js";
import { readSession } from "./_lib/ge/auth.js";
import { dbConfigured, db } from "./_lib/ge/db.js";
import { json, readJson, sameOrigin, clientIp, rateLimit, HttpError } from "./_lib/ge/http.js";

// Setup check (no secrets): is the database connected and which migrations are applied.
async function health() {
  if (!dbConfigured()) return { ok: false, database: "not_configured" };
  try {
    const rows = await db()`select name from schema_migrations order by name`;
    return { ok: true, database: "connected", migrations: rows.map((r) => r.name) };
  } catch (e) {
    return { ok: false, database: "error", detail: String(e.code || e.message).slice(0, 80) };
  }
}

async function handle(request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("r") || "";
  const method = request.method.toUpperCase();

  if (name === "health") return json(200, await health());
  if (!dbConfigured()) return json(503, { error: "database_not_configured" });

  const route = Object.prototype.hasOwnProperty.call(routes, name) ? routes[name] : null;
  if (!route) return json(404, { error: "not_found" });
  if (!route.methods.includes(method)) return json(405, { error: "method_not_allowed" }, { allow: route.methods.join(", ") });

  const ip = clientIp(request);
  if (method !== "GET") {
    if (!sameOrigin(request)) return json(403, { error: "forbidden_origin" });
    if (!(request.headers.get("content-type") || "").includes("application/json")) return json(415, { error: "json_required" });
  }
  await rateLimit(`app:${ip}`, 300, 60);

  const session = route.auth === "none" ? null : await readSession(request);
  if (route.auth === "user" && !session) return json(401, { error: "unauthenticated" });
  if (route.auth === "business") {
    if (!session) return json(401, { error: "unauthenticated" });
    if (!session.businessId) return json(403, { error: "no_business" });
  }

  const body = method === "GET" || method === "DELETE" ? {} : await readJson(request);
  const out = await route.fn({ request, method, params: url.searchParams, body, session, ip });
  return json(out.status || 200, out.body, out.headers || {});
}

async function entry(request) {
  try {
    return await handle(request);
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.code, ...(e.detail ? { detail: e.detail } : {}) });
    if (e?.status === 503) return json(503, { error: "database_not_configured" });
    if (e?.code === "23505") return json(409, { error: "already_exists" });
    console.error(`[app] ${e?.code || ""} ${e?.message || e}`);
    return json(500, { error: "server_error" });
  }
}

export const GET = entry;
export const POST = entry;
export const PATCH = entry;
export const DELETE = entry;
