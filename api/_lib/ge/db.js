/**
 * Postgres access for the Growth Engine (server-side only).
 *
 * Env (any one of these; Vercel's Supabase / Neon integrations set them automatically):
 *   DATABASE_URL | POSTGRES_URL                      pooled connection string (used by the API)
 *   DATABASE_URL_UNPOOLED | POSTGRES_URL_NON_POOLING  direct connection (used by migrations)
 *
 * TENANT ISOLATION
 *   Every request runs inside one transaction that sets app.business_id (tenant()) or
 *   app.system (system()). Row-level security policies (db/migrations) only return rows of
 *   that business, and every query ALSO filters by business_id explicitly, so one mistake
 *   in either layer can't leak another business's data.
 */
import postgres from "postgres";

const env = (k) => String(process.env[k] || "").trim();
export const databaseUrl = () => env("DATABASE_URL") || env("POSTGRES_URL");
export const directDatabaseUrl = () => env("DATABASE_URL_UNPOOLED") || env("POSTGRES_URL_NON_POOLING") || databaseUrl();
export const dbConfigured = () => !!databaseUrl();

let sql = null;
export function db() {
  if (!sql) {
    const url = databaseUrl();
    if (!url) throw Object.assign(new Error("database_not_configured"), { status: 503 });
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    sql = postgres(url, {
      max: 3,                 // serverless: few connections per instance
      idle_timeout: 20,
      connect_timeout: 8,
      prepare: false,         // required by transaction-mode poolers (Supabase :6543, Neon pooler)
      ssl: local || /sslmode=disable/.test(url) ? false : "require",
      onnotice: () => {},
      transform: { undefined: null },
    });
  }
  return sql;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === "string" && UUID.test(v);

/** Run fn(tx) as one business. Nothing outside that business is visible. */
export async function tenant(businessId, fn) {
  if (!isUuid(businessId)) throw Object.assign(new Error("no_business"), { status: 403 });
  return db().begin(async (tx) => {
    await tx`select set_config('app.business_id', ${businessId}, true), set_config('app.system', '', true)`;
    return fn(tx);
  });
}

/** Run fn(tx) with system access (auth, webhooks resolving which business a message belongs to). */
export async function system(fn) {
  return db().begin(async (tx) => {
    await tx`select set_config('app.system', 'on', true), set_config('app.business_id', '', true)`;
    return fn(tx);
  });
}

/** For tests: close the pool. */
export async function closeDb() {
  if (sql) { const s = sql; sql = null; await s.end({ timeout: 5 }); }
}
