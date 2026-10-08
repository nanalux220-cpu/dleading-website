// Growth Engine tests: auth, tenant isolation, leads, inbox, knowledge, AI sandbox, website widget,
// and the WhatsApp → dashboard bridge. Uses a real Postgres (throwaway database) plus fake
// Upstash / Meta / Claude servers, so no real accounts or credit are used.
//
// Run: TEST_DATABASE_URL=postgres://user:pass@localhost:5432/ge_test npm run test:ge
// Without TEST_DATABASE_URL the suite is skipped (exit 0).
import http from "node:http";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import postgres from "postgres";

const DB = process.env.TEST_DATABASE_URL;
if (!DB) { console.log("SKIP  Growth Engine tests (set TEST_DATABASE_URL to a throwaway Postgres database)"); process.exit(0); }

// ---- fresh schema ----
const admin = postgres(DB, { max: 1, onnotice: () => {} });
await admin.unsafe("drop schema public cascade; create schema public;");
await admin.end();
execFileSync("node", [new URL("../scripts/migrate.mjs", import.meta.url).pathname], { env: { ...process.env, DATABASE_URL: DB }, stdio: "inherit" });

const listen = (srv, port) => new Promise((r) => srv.listen(port, r));
const readBody = async (req) => { let b = ""; for await (const c of req) b += c; return b; };
const send = (res, obj, status = 200) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

// ---- fake Upstash ----
const kv = new Map();
function redis([c, ...a]) {
  c = c.toUpperCase();
  const list = (k) => (kv.has(k) ? kv.get(k) : (kv.set(k, []), kv.get(k)));
  switch (c) {
    case "GET": return kv.has(a[0]) && typeof kv.get(a[0]) === "string" ? kv.get(a[0]) : null;
    case "SET": { if (a.includes("NX") && kv.has(a[0])) return null; kv.set(a[0], a[1]); return "OK"; }
    case "INCR": { const v = Number(kv.get(a[0]) || 0) + 1; kv.set(a[0], String(v)); return v; }
    case "EXPIRE": return 1;
    case "SADD": { const s = kv.get(a[0]) || new Set(); kv.set(a[0], s); let n = 0; for (const x of a.slice(1)) if (!s.has(x)) { s.add(x); n++; } return n; }
    case "SMEMBERS": return [...(kv.get(a[0]) || [])];
    case "SCARD": return (kv.get(a[0]) || new Set()).size;
    case "LPUSH": { const l = list(a[0]); l.unshift(...a.slice(1).reverse()); return l.length; }
    case "LTRIM": { const l = list(a[0]); kv.set(a[0], l.slice(+a[1], +a[2] + 1)); return "OK"; }
    case "LRANGE": { const l = kv.get(a[0]) || []; const end = +a[2] < 0 ? l.length : +a[2] + 1; return l.slice(+a[1], end); }
    default: throw new Error("unsupported " + c);
  }
}
const upstash = http.createServer(async (req, res) => {
  const body = JSON.parse(await readBody(req));
  if (req.url === "/pipeline") return send(res, body.map((cmd) => ({ result: redis(cmd) })));
  send(res, { result: redis(body) });
});

// ---- fake Meta ----
const graphLog = [];
let wamidN = 0;
const graph = http.createServer(async (req, res) => {
  if (req.method === "GET") return send(res, { id: "1345357342001483", display_phone_number: "+44 7427 259935" });
  const body = JSON.parse(await readBody(req));
  graphLog.push(body);
  if (body.status === "read") return send(res, { success: true });
  send(res, { messages: [{ id: `wamid.OUT${++wamidN}` }] });
});

// ---- fake Claude: understands both the Dleading receptionist and the Growth Engine assistant ----
const claudeLog = [];
const claude = http.createServer(async (req, res) => {
  const body = JSON.parse(await readBody(req));
  claudeLog.push(body);
  const last = body.messages.at(-1);
  const reply = (text) => send(res, { stop_reason: "end_turn", content: [{ type: "text", text }] });
  const tool = (name, input) => send(res, { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name, input }] });
  if (Array.isArray(last.content)) return reply("Thanks, noted. Anything else?");
  const t = last.content.split("\n").at(-1);
  const ge = body.tools.some((x) => x.name === "save_lead_details");
  if (t.includes("BOOK") && ge) return tool("save_lead_details", { name: "Sam", phone: "07700 900123", service_interest: "Boiler repair", location: "Leeds", budget: "£300", preferred_date: "Friday", urgency: "high", ready_to_book: true });
  if (t.includes("HUMAN") && ge) return tool("request_human", { reason: "Asked for a person" });
  if (t.includes("LEAD") && !ge) return tool("create_lead", { name: "Priya", needs: "Website for Sparkle Cleaning", budget: "£1000" });
  const system = body.system.map((s) => s.text).join("\n");
  const biz = system.match(/assistant for (.+?)\./)?.[1] || "Dleading";
  return reply(`Hello from ${biz}`);
});

// ---- fake n8n (the Dleading receptionist only records a lead once n8n accepts it) ----
const n8n = http.createServer(async (req, res) => { await readBody(req); send(res, {}); });

await Promise.all([listen(upstash, 4801), listen(graph, 4802), listen(claude, 4803), listen(n8n, 4804)]);
Object.assign(process.env, {
  DATABASE_URL: DB,
  KV_REST_API_URL: "http://127.0.0.1:4801", KV_REST_API_TOKEN: "kv-token",
  WHATSAPP_GRAPH_BASE: "http://127.0.0.1:4802", WHATSAPP_ACCESS_TOKEN: "test-wa-token-0123456789012345678901234567890", WHATSAPP_PHONE_NUMBER_ID: "1385944931264059",
  WHATSAPP_APP_SECRET: "test-app-secret", WHATSAPP_VERIFY_TOKEN: "test-verify-token",
  ANTHROPIC_BASE_URL: "http://127.0.0.1:4803", ANTHROPIC_API_KEY: "test-key",
  ADMIN_TOKEN: "admin-token-0123456789abcdef-XYZ",
  N8N_LEAD_WEBHOOK_URL: "http://127.0.0.1:4804/lead", N8N_HANDOFF_WEBHOOK_URL: "http://127.0.0.1:4804/handoff",
});
const app = await import(new URL("../api/app.js", import.meta.url).href);
const widget = await import(new URL("../api/widget.js", import.meta.url).href);
const wa = await import(new URL("../api/whatsapp.js", import.meta.url).href);
const { closeDb } = await import(new URL("../api/_lib/ge/db.js", import.meta.url).href);

let fails = 0;
const check = (name, cond, info) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + JSON.stringify(info)?.slice(0, 600)}`); if (!cond) fails++; };

// ---- helpers ----
const HOST = "growth.test";
let ipN = 0;
function client() {
  let cookie = "";
  const ip = `10.0.0.${++ipN}`;
  return async function call(route, { method = "GET", body, params = {}, origin = `https://${HOST}` } = {}) {
    const qs = new URLSearchParams({ r: route, ...params }).toString();
    const headers = { host: HOST, "x-forwarded-proto": "https", "x-forwarded-for": ip, ...(cookie ? { cookie } : {}) };
    if (method !== "GET") { headers["content-type"] = "application/json"; if (origin) headers.origin = origin; }
    const req = new Request(`https://${HOST}/api/app?${qs}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const res = await app[method](req);
    const sc = res.headers.get("set-cookie");
    if (sc) cookie = sc.split(";")[0];
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, cookie: sc };
  };
}

// ---------- auth ----------
const alice = client();
let r = await alice("auth/signup", { method: "POST", body: { name: "Alice", email: "alice@example.com", password: "short", business_name: "Alice Plumbing" } });
check("signup rejects weak password", r.status === 400 && r.data.error === "weak_password", r);
r = await alice("auth/signup", { method: "POST", body: { name: "Alice", email: "alice@example.com", password: "correct horse battery", business_name: "Alice Plumbing" } });
check("signup creates account + business", r.status === 201 && /HttpOnly/.test(r.cookie) && /Secure/.test(r.cookie) && /SameSite=Lax/.test(r.cookie), r);
r = await client()("auth/signup", { method: "POST", body: { email: "ALICE@example.com", password: "another long password" } });
check("duplicate email rejected (case-insensitive)", r.status === 409, r);
r = await alice("auth/me");
check("me returns user + business", r.data.user?.email === "alice@example.com" && r.data.business?.name === "Alice Plumbing" && r.data.role === "owner", r.data);
const aliceKey = r.data.business.public_key;
check("business has a public widget key", /^pk_[a-f0-9]{24}$/.test(aliceKey), aliceKey);

const bob = client();
await bob("auth/signup", { method: "POST", body: { name: "Bob", email: "bob@example.com", password: "bobs long password", business_name: "Bob's Salon" } });

const anon = client();
r = await anon("leads");
check("leads require login", r.status === 401, r);
r = await anon("auth/login", { method: "POST", body: { email: "alice@example.com", password: "wrong password!!" } });
check("wrong password rejected", r.status === 401 && r.data.error === "invalid_credentials", r);
r = await anon("auth/login", { method: "POST", body: { email: "nobody@example.com", password: "whatever password" } });
check("unknown email gives the same error", r.status === 401 && r.data.error === "invalid_credentials", r);
const alice2 = client();
r = await alice2("auth/login", { method: "POST", body: { email: "alice@example.com", password: "correct horse battery" } });
check("login works", r.status === 200 && !!r.cookie, r);

// CSRF
r = await alice("leads", { method: "POST", body: { name: "X" }, origin: "https://evil.example" });
check("cross-site write blocked", r.status === 403 && r.data.error === "forbidden_origin", r);
r = await alice("leads", { method: "POST", body: { name: "X" }, origin: null });
check("write without Origin blocked", r.status === 403, r);

// ---------- onboarding / profile ----------
r = await alice("business", { method: "PATCH", body: {
  industry: "Plumbing", website: "aliceplumbing.co.uk", description: "Emergency plumbing in Leeds",
  services: [{ name: "Boiler repair", price: "from £90" }, { name: "Leak fix" }],
  opening_hours: { mon: { open: "08:00", close: "18:00" }, sun: { closed: true } },
  contact: { phone: "0113 496 0000", email: "hello@aliceplumbing.co.uk" }, onboarding_step: 6,
} });
check("profile saved", r.status === 200 && r.data.business.website === "https://aliceplumbing.co.uk" && r.data.business.services.length === 2 && r.data.business.onboarding_step === 6, r.data);
r = await alice("business", { method: "PATCH", body: { website: "javascript:alert(1)" } });
check("bad website rejected", r.status === 400, r);
r = await alice("ai-settings", { method: "PATCH", body: { assistant_name: "Ava", personality: "warm", scoring: { thresholds: { warm: 30, hot: 60 } } } });
check("AI settings saved + normalised", r.data.settings?.assistant_name === "Ava" && r.data.settings.scoring.thresholds.hot === 60 && r.data.settings.qualification.fields.budget.enabled === true, r.data);
r = await alice("onboarding/complete", { method: "POST", body: {} });
check("onboarding completes", r.status === 200, r);

// ---------- knowledge ----------
r = await alice("knowledge", { method: "POST", body: { items: [
  { kind: "faq", title: "Do you cover Bradford?", content: "Yes, Leeds and Bradford." },
  { kind: "price", title: "Call-out fee", content: "£60 call-out, waived if you book the repair." },
  { kind: "instruction", content: "Always mention we offer a 12-month guarantee." },
] } });
check("knowledge items created", r.status === 201 && r.data.items.length === 3, r);
const kid = r.data.items[0].id;
r = await alice("knowledge", { method: "POST", body: { kind: "nonsense", content: "x" } });
check("invalid knowledge kind rejected", r.status === 400, r);

// ---------- leads ----------
r = await alice("leads", { method: "POST", body: { name: "Jo Bloggs", phone: "07700 900456", email: "jo@example.com", service_interest: "New bathroom", budget: "£5k", urgency: "high" } });
check("lead created + scored", r.status === 201 && r.data.lead.score > 0 && ["warm", "hot"].includes(r.data.lead.score_label), r.data);
const aliceLead = r.data.lead.id;
r = await alice("leads", { method: "POST", body: { email: "not-an-email" } });
check("invalid email rejected", r.status === 400, r);
r = await alice("lead", { method: "PATCH", params: { id: aliceLead }, body: { status: "won", notes: "Paid deposit", next_follow_up_at: "2030-01-01T10:00:00Z" } });
check("lead updated", r.data.lead?.status === "won" && r.data.lead.notes === "Paid deposit", r.data);
r = await alice("lead", { method: "PATCH", params: { id: aliceLead }, body: { status: "maybe" } });
check("invalid status rejected", r.status === 400, r);
r = await alice("leads", { params: { q: "bathroom" } });
check("lead search", r.data.total === 1 && r.data.leads[0].id === aliceLead, r.data);
r = await alice("leads", { params: { status: "new" } });
check("lead status filter", r.data.total === 0, r.data);

// ---------- TENANT ISOLATION ----------
r = await bob("lead", { params: { id: aliceLead } });
check("other business cannot read a lead by id", r.status === 404, r);
r = await bob("lead", { method: "PATCH", params: { id: aliceLead }, body: { name: "hacked" } });
check("other business cannot edit a lead", r.status === 404, r);
r = await bob("lead", { method: "DELETE", params: { id: aliceLead } });
check("other business cannot delete a lead", r.status === 404, r);
r = await bob("leads");
check("other business sees none of its leads", r.data.total === 0, r.data);
r = await bob("knowledge");
check("other business sees none of its knowledge", r.data.items.length === 0, r.data);
r = await bob("knowledge/item", { method: "DELETE", params: { id: kid } });
check("other business cannot delete knowledge", r.status === 404, r);
r = await bob("auth/switch", { method: "POST", body: { business_id: (await alice("auth/me")).data.business.id } });
check("cannot switch into a business you don't belong to", r.status === 403, r);

// Row-level security as the second wall: raw SQL as the app's DB role, without the API's filters.
{
  const raw = postgres(DB, { max: 1, onnotice: () => {} });
  const none = await raw`select count(*)::int as n from leads`;
  check("RLS: no tenant set → no rows visible", none[0].n === 0, none);
  const [bobBiz] = await raw.begin(async (tx) => { await tx`select set_config('app.system','on',true)`; return tx`select id from businesses where name = 'Bob''s Salon'`; });
  const seen = await raw.begin(async (tx) => { await tx`select set_config('app.business_id', ${bobBiz.id}, true)`; return tx`select count(*)::int as n from leads`; });
  check("RLS: Bob's tenant sees 0 of Alice's leads", seen[0].n === 0, seen);
  let blocked = false;
  try { await raw.begin(async (tx) => { await tx`select set_config('app.business_id', ${bobBiz.id}, true)`; await tx`update leads set name = 'x' where id = ${aliceLead}`; const [l] = await tx`select count(*)::int as n from leads where name = 'x'`; if (l.n) throw new Error("leaked"); }); blocked = true; } catch { blocked = false; }
  check("RLS: cross-tenant update affects nothing", blocked, null);
  await raw.end();
}

// ---------- AI sandbox ----------
r = await alice("ai/test", { method: "POST", body: { messages: [{ content: "I need to BOOK a boiler repair" }] } });
check("AI sandbox runs with the business's own data", r.status === 200 && r.data.captured.service_interest === "Boiler repair" && r.data.score.label === "hot", r.data);
const sys = claudeLog.at(-1)?.system?.map((s) => s.text).join("\n") || "";
check("assistant prompt uses Alice's knowledge + instructions", sys.includes("Do you cover Bradford?") && sys.includes("12-month guarantee") && sys.includes("Ava") && sys.includes("Boiler repair"), sys.slice(0, 400));
check("assistant prompt has nothing from Bob's business", !sys.includes("Bob's Salon"), null);

// ---------- website widget ----------
async function w(route, { method = "GET", body, params = {}, origin = "https://aliceplumbing.co.uk" } = {}) {
  const qs = new URLSearchParams({ r: route, ...params }).toString();
  const headers = { host: HOST, "x-forwarded-for": "10.9.9.9", ...(origin ? { origin } : {}), ...(method === "POST" ? { "content-type": "application/json" } : {}) };
  const res = await widget[method](new Request(`https://${HOST}/api/widget?${qs}`, { method, headers, body: body ? JSON.stringify(body) : undefined }));
  return { status: res.status, data: await res.json().catch(() => ({})), cors: res.headers.get("access-control-allow-origin") };
}
r = await w("config", { params: { key: aliceKey } });
check("widget config by public key", r.status === 200 && r.data.name === "Alice Plumbing" && r.data.assistant_name === "Ava" && r.cors === "https://aliceplumbing.co.uk", r);
r = await w("config", { params: { key: "pk_000000000000000000000000" } });
check("unknown widget key → 404", r.status === 404, r);
await alice("business", { method: "PATCH", body: { widget_allowed_origins: ["https://aliceplumbing.co.uk"] } });
const visitor = "v_" + "a".repeat(30);
r = await w("message", { method: "POST", body: { key: aliceKey, visitor_id: visitor, text: "Hi there" } });
check("widget message gets an AI reply", r.status === 200 && r.data.reply?.body === "Hello from Alice Plumbing" && r.data.handler === "ai", r.data);
r = await w("message", { method: "POST", body: { key: aliceKey, visitor_id: visitor, text: "I want to BOOK a boiler repair" } });
check("widget conversation qualifies the lead", r.status === 200, r.data);
r = await w("contact", { method: "POST", body: { key: aliceKey, visitor_id: visitor, name: "Sam", email: "sam@example.com" } });
check("widget lead capture form", r.status === 200, r.data);
r = await w("history", { params: { key: aliceKey, visitor_id: visitor } });
check("widget history returns this visitor's messages", r.data.messages?.length === 4, r.data);
r = await w("history", { params: { key: aliceKey, visitor_id: "v_" + "b".repeat(30) } });
check("another visitor id sees nothing", r.data.messages?.length === 0, r.data);
r = await w("message", { method: "POST", body: { key: aliceKey, visitor_id: visitor, text: "hi" }, origin: "https://evil.example" });
check("widget blocked on a site not in the allow-list", r.status === 403, r);
r = await alice("leads", { params: { source: "website" } });
const webLead = r.data.leads[0];
check("widget lead in CRM, scored hot, with captured details", webLead && webLead.score_label === "hot" && webLead.phone === "07700900123" && webLead.email === "sam@example.com" && webLead.status === "qualified", webLead);

// inbox: takeover + human reply + AI stays silent
r = await alice("conversations", { params: { channel: "website" } });
const webConv = r.data.conversations[0];
check("conversation in inbox with lead info", webConv && webConv.lead_name === "Sam" && webConv.unread_count >= 2, webConv);
r = await alice("conversation", { method: "PATCH", params: { id: webConv.id }, body: { handler: "human" } });
check("human takeover", r.data.conversation?.handler === "human", r.data);
const before = claudeLog.length;
r = await w("message", { method: "POST", body: { key: aliceKey, visitor_id: visitor, text: "Are you there?" } });
check("AI silent while a human handles it", r.data.handler === "human" && !r.data.reply && claudeLog.length === before, r.data);
r = await alice("conversation/send", { method: "POST", body: { id: webConv.id, text: "Hi Sam, Alice here." } });
check("human reply from inbox", r.status === 200, r);
r = await w("history", { params: { key: aliceKey, visitor_id: visitor } });
check("visitor sees the human reply", r.data.messages.at(-1)?.body === "Hi Sam, Alice here." && r.data.messages.at(-1)?.sender === "human", r.data.messages.at(-1));
r = await bob("conversation", { params: { id: webConv.id } });
check("other business cannot open the conversation", r.status === 404, r);
r = await bob("conversation/send", { method: "POST", body: { id: webConv.id, text: "spam" } });
check("other business cannot send into it", r.status === 404, r);
await alice("conversation", { method: "PATCH", params: { id: webConv.id }, body: { handler: "ai" } });
r = await w("message", { method: "POST", body: { key: aliceKey, visitor_id: visitor, text: "Thanks" } });
check("AI resumes after re-enabling", r.data.handler === "ai" && !!r.data.reply, r.data);

// widget HUMAN request → handoff
const v2 = "v_" + "c".repeat(30);
r = await w("message", { method: "POST", body: { key: aliceKey, visitor_id: v2, text: "HUMAN please" } });
check("AI hands over on request", r.data.handler === "human", r.data);

// ---------- WhatsApp bridge ----------
function signed(payload) {
  const raw = JSON.stringify(payload);
  return new Request("https://x/api/whatsapp", { method: "POST", body: raw, headers: { "x-hub-signature-256": "sha256=" + createHmac("sha256", "test-app-secret").update(raw).digest("hex") } });
}
const waMsg = (id, from, text, name = "Priya") => ({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1385944931264059" }, contacts: [{ wa_id: from, profile: { name } }], messages: [{ id, from, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: text } }] } }] }] });

// Not linked yet: webhook works exactly as before and nothing lands in any business.
r = await wa.POST(signed(waMsg("wamid.IN1", "447700900111", "Hello")));
check("WhatsApp webhook still replies when not linked", r.status === 200 && graphLog.some((g) => g.text?.body === "Hello from Dleading"), graphLog.at(-1));
r = await alice("conversations", { params: { channel: "whatsapp" } });
check("unlinked number mirrors into no business", r.data.conversations.length === 0, r.data);

r = await bob("integrations/whatsapp/link", { method: "POST", body: { admin_password: "wrong-wrong-wrong-wrong-wrong!!" } });
check("linking the live number needs the admin password", r.status === 403, r);
r = await alice("integrations/whatsapp/link", { method: "POST", body: { admin_password: process.env.ADMIN_TOKEN } });
check("platform owner links WhatsApp to a business", r.status === 200, r);

const sentBefore = graphLog.length;
r = await wa.POST(signed(waMsg("wamid.IN2", "447700900111", "I need a website LEAD")));
check("webhook still answers after linking", r.status === 200 && graphLog.length > sentBefore, r);
r = await alice("conversations", { params: { channel: "whatsapp" } });
const waConv = r.data.conversations[0];
check("WhatsApp conversation mirrored into the dashboard", waConv?.external_id === "447700900111" && waConv.lead_phone === "+447700900111", waConv);
r = await alice("conversation", { params: { id: waConv.id } });
check("inbound + AI reply mirrored", r.data.messages.some((m) => m.body === "I need a website LEAD" && m.sender === "customer") && r.data.messages.some((m) => m.sender === "ai"), r.data.messages);
check("lead details from the receptionist AI land on the lead", r.data.lead?.name === "Priya" && /Sparkle/.test(r.data.lead.service_interest) && r.data.lead.budget === "£1000", r.data.lead);

// duplicate delivery from Meta
await wa.POST(signed(waMsg("wamid.IN2", "447700900111", "I need a website LEAD")));
r = await alice("conversation", { params: { id: waConv.id } });
check("Meta retry does not duplicate messages", r.data.messages.filter((m) => m.body === "I need a website LEAD").length === 1, r.data.messages.length);

// takeover from inbox → webhook's AI goes silent
await alice("conversation", { method: "PATCH", params: { id: waConv.id }, body: { handler: "human" } });
const st = JSON.parse(kv.get("wa:state:447700900111"));
check("inbox takeover sets the webhook's handoff state", st.mode === "handoff", st);
const n0 = graphLog.filter((g) => g.type === "text").length;
await wa.POST(signed(waMsg("wamid.IN3", "447700900111", "hello?")));
check("WhatsApp AI stays silent after takeover", graphLog.filter((g) => g.type === "text").length === n0, graphLog.at(-1));
r = await alice("conversation/send", { method: "POST", body: { id: waConv.id, text: "Hi Priya, it's Alice" } });
check("human reply from inbox goes out via WhatsApp", r.status === 200 && graphLog.at(-1)?.text?.body === "Hi Priya, it's Alice", graphLog.at(-1));
r = await alice("conversation", { params: { id: waConv.id } });
check("human reply mirrored once", r.data.messages.filter((m) => m.body === "Hi Priya, it's Alice" && m.sender === "human").length === 1, r.data.messages);
await alice("conversation", { method: "PATCH", params: { id: waConv.id }, body: { handler: "ai" } });
check("re-enabling AI clears the webhook handoff", JSON.parse(kv.get("wa:state:447700900111")).mode === "ai", null);
const n1 = graphLog.filter((g) => g.type === "text").length;
await wa.POST(signed(waMsg("wamid.IN4", "447700900111", "one more question")));
check("WhatsApp AI answers again", graphLog.filter((g) => g.type === "text").length === n1 + 1, null);

r = await bob("conversation/send", { method: "POST", body: { id: waConv.id, text: "spam" } });
check("other business cannot send on Alice's WhatsApp", r.status === 404, r);

// delivery status
const outId = (await alice("conversation", { params: { id: waConv.id } })).data.messages.filter((m) => m.sender === "ai").at(-1);
const wamidRow = await (async () => { const raw = postgres(DB, { max: 1 }); const x = await raw.begin(async (tx) => { await tx`select set_config('app.system','on',true)`; return tx`select external_id from messages where id = ${outId.id}`; }); await raw.end(); return x[0].external_id; })();
await wa.POST(signed({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1385944931264059" }, statuses: [{ id: wamidRow, status: "read", timestamp: "1700000000", recipient_id: "447700900111" }] } }] }] }));
r = await alice("conversation", { params: { id: waConv.id } });
check("read receipt mirrored", r.data.messages.find((m) => m.id === outId.id)?.status === "read", r.data.messages.find((m) => m.id === outId.id));

// ---------- overview + analytics ----------
r = await alice("overview");
check("overview stats", r.status === 200 && r.data.stats.total_leads >= 3 && r.data.stats.hot_leads >= 1 && r.data.activity.length > 0 && r.data.setup.whatsapp === "connected", r.data.stats);
r = await alice("analytics", { params: { days: "30" } });
check("analytics", r.status === 200 && r.data.leads_by_day.length >= 30 && r.data.by_channel.length >= 2 && r.data.won === 1, { ...r.data, leads_by_day: r.data.leads_by_day?.length });
r = await bob("overview");
check("Bob's overview is empty", r.data.stats.total_leads === 0 && r.data.activity.every((a) => a.type === "business.created"), r.data);

// appointments + automations
r = await alice("appointments", { method: "POST", body: { lead_id: webLead.id, title: "Boiler visit", starts_at: "2030-02-01T09:00:00Z" } });
check("appointment created", r.status === 201, r);
r = await bob("appointments", { method: "POST", body: { lead_id: webLead.id, starts_at: "2030-02-01T09:00:00Z" } });
check("cannot book against another business's lead", r.status === 400, r);
r = await alice("automations");
check("automation templates seeded (off by default)", r.data.rules.length === 5 && r.data.rules.every((x) => !x.enabled), r.data);

// logout
r = await alice("auth/logout", { method: "POST", body: {} });
r = await alice("leads");
check("logged out", r.status === 401, r);

await closeDb();
for (const s of [upstash, graph, claude, n8n]) s.close();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
