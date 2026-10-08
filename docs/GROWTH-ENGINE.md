# Dleading Growth Engine™ — Phase 1

*Turn conversations into customers — automatically.*

A multi-business dashboard at **`/app`** on this site. Each business gets its own leads, conversations,
AI assistant, knowledge base, appointments, automations, integrations and analytics. The marketing site,
its chat and the WhatsApp engine keep working exactly as before.

## How it fits together

```
Website visitor ─► /widget.js (any site) ─► /api/widget ─┐
                                                        ├─► Postgres (per-business data, row-level security)
Business owner  ─► /app (React)          ─► /api/app ───┤
                                                        │
Customer's WhatsApp ─► Meta ─► /api/whatsapp (unchanged: Redis, AI reply, handoff)
                                   └─► bridge: mirrors messages, lead details, AI/human state ─┘
```

- **`db/migrations/*.sql`** — schema. Applied by `npm run migrate` and automatically during the Vercel build
  (`vercel-build`). Additive only: never edit an applied file, add a new one. Every new tenant table needs
  `business_id`, `enable/force row level security` and a `tenant_isolation` policy like the others.
- **`api/app.js`** — one function for every dashboard route (`?r=leads`, `?r=conversation`, …), defined in
  `api/_lib/ge/routes.js`.
- **`api/widget.js` + `public/widget.js`** — the embeddable website chat. A business's public key (`pk_…`) is
  safe to publish; it only allows chatting as a customer.
- **`api/_lib/ge/bridge.js`** — copies WhatsApp traffic into the business that owns the number. No database,
  or number not linked → does nothing. It never throws and gives up after 4 seconds, so it can't delay or
  break a WhatsApp reply.

## Security
- **Accounts**: scrypt-hashed passwords, 30-day HttpOnly/Secure/SameSite=Lax session cookie, only a SHA-256
  of the session token is stored. Login and sign-up are rate-limited.
- **Tenant isolation, twice**: every query filters by the signed-in business, *and* runs in a transaction
  with `app.business_id` set so Postgres row-level security hides every other business's rows.
  (`tests/ge.test.mjs` checks both, including raw SQL as the app's database user.)
- **CSRF**: every write must come from this site's Origin with a JSON body.
- **Secrets** stay in Vercel env vars. Nothing secret is stored in the database or sent to the browser.
  Linking the live WhatsApp number to a business needs the existing `ADMIN_TOKEN` password.
- **Widget**: per-business allowed-websites list, CORS limited to it, rate limits per IP / visitor / business.

## Setting it up (owner)
1. Vercel → dleading-website → **Storage** → **Create Database** → **Supabase** (Postgres) → connect it to
   the project for Production and Preview. Vercel adds the connection variables itself.
2. Redeploy. The build applies the migrations. Check `https://www.creativedleading.co.uk/api/app?r=health`
   shows `"database":"connected"` and the migration list.
3. Go to `/app/signup`, create the Dleading account and finish onboarding.
4. Integrations → WhatsApp → **Link the live WhatsApp number** (asks for the `/admin.html` password).
   From then on WhatsApp chats appear in Conversations and Leads.

## Local development
```
createdb ge_dev && DATABASE_URL=postgres://localhost/ge_dev npm run migrate
DATABASE_URL=postgres://localhost/ge_dev ANTHROPIC_API_KEY=… npm run dev:api   # API on :3001
npm run dev                                                                    # site on :3000, /api proxied
TEST_DATABASE_URL=postgres://localhost/ge_test npm run test:ge                 # wipes that database
```

## What's next (Phase 2)
Automations actually sending (email/SMS follow-ups, hot-lead alerts), appointment booking by the AI,
Facebook/Instagram messaging, per-business WhatsApp numbers via Embedded Signup, team invites and
password reset by email.
