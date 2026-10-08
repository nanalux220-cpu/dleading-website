/**
 * Applies db/migrations/*.sql in order, once each, recorded in schema_migrations.
 * Additive migrations only: never edit a migration that has been applied; add a new file.
 *
 *   node scripts/migrate.mjs                 apply pending migrations
 *   node scripts/migrate.mjs --if-configured exit quietly when no database is configured (used by vercel-build)
 *   node scripts/migrate.mjs --status        list applied / pending
 *   --soft                                   on failure, warn but exit 0 (deploys of the website/WhatsApp
 *                                            engine must not be blocked; /api/app?r=health shows what's applied)
 */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const env = (k) => String(process.env[k] || "").trim();
const url = env("DATABASE_URL_UNPOOLED") || env("POSTGRES_URL_NON_POOLING") || env("DATABASE_URL") || env("POSTGRES_URL");
const args = new Set(process.argv.slice(2));

if (!url) {
  if (args.has("--if-configured")) { console.log("[migrate] no database configured; skipping"); process.exit(0); }
  console.error("[migrate] set DATABASE_URL (or POSTGRES_URL)");
  process.exit(1);
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const sql = postgres(url, { max: 1, prepare: false, ssl: local || /sslmode=disable/.test(url) ? false : "require", onnotice: () => {} });

try {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const files = (await readdir(dir)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  // One deploy at a time (advisory lock), so parallel builds can't apply the same file twice.
  await sql`select pg_advisory_lock(812734001)`;
  const applied = new Set((await sql`select name from schema_migrations`).map((r) => r.name));
  if (args.has("--status")) {
    for (const f of files) console.log(`${applied.has(f) ? "applied " : "pending "} ${f}`);
  } else {
    let n = 0;
    for (const f of files) {
      if (applied.has(f)) continue;
      const text = await readFile(join(dir, f), "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`insert into schema_migrations (name) values (${f})`;
      });
      console.log(`[migrate] applied ${f}`);
      n++;
    }
    console.log(n ? `[migrate] ${n} migration(s) applied` : "[migrate] up to date");
  }
  await sql`select pg_advisory_unlock(812734001)`;
} catch (e) {
  // Message only: connection strings never appear in postgres.js error messages, but don't risk printing objects.
  console.error(`[migrate] failed: ${e.message}`);
  process.exitCode = args.has("--soft") ? 0 : 1;
} finally {
  await sql.end({ timeout: 5 });
}
