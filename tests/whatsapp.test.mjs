// Offline tests for the WhatsApp engine (/api/whatsapp + /api/admin).
// Fake Meta Graph API, fake Upstash Redis, fake Claude and fake n8n — no real accounts or credit used.
// Run: npm run test:whatsapp
import http from "node:http";
import { createHmac } from "node:crypto";

const log = { claude: [], graph: [], n8n: [] };
let graphMode = "ok", claudeMode = "ok";
const listen = (srv, port) => new Promise((r) => srv.listen(port, r));
const readBody = async (req) => { let b = ""; for await (const c of req) b += c; return b; };
const send = (res, obj, status = 200) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

// ---- fake Upstash (subset of Redis used by the app) ----
const kv = new Map();
function redis([c, ...a]) {
  c = c.toUpperCase();
  const list = (k) => (kv.has(k) ? kv.get(k) : (kv.set(k, []), kv.get(k)));
  switch (c) {
    case "GET": return kv.has(a[0]) && typeof kv.get(a[0]) === "string" ? kv.get(a[0]) : null;
    case "SET": { if (a.includes("NX") && kv.has(a[0])) return null; kv.set(a[0], a[1]); return "OK"; }
    case "SADD": { const s = kv.get(a[0]) || new Set(); kv.set(a[0], s); let n = 0; for (const x of a.slice(1)) if (!s.has(x)) { s.add(x); n++; } return n; }
    case "SMEMBERS": return [...(kv.get(a[0]) || [])];
    case "SCARD": return (kv.get(a[0]) || new Set()).size;
    case "LPUSH": { const l = list(a[0]); l.unshift(...a.slice(1).reverse()); return l.length; }
    case "RPUSH": { const l = list(a[0]); l.push(...a.slice(1)); return l.length; }
    case "LTRIM": { const l = list(a[0]); kv.set(a[0], l.slice(+a[1], +a[2] + 1)); return "OK"; }
    case "LRANGE": { const l = kv.get(a[0]) || []; const end = +a[2] < 0 ? l.length : +a[2] + 1; return l.slice(+a[1], end); }
    default: throw new Error("unsupported " + c);
  }
}
const upstash = http.createServer(async (req, res) => {
  if (req.headers.authorization !== "Bearer kv-token") return send(res, { error: "unauthorized" }, 401);
  const body = JSON.parse(await readBody(req));
  if (req.url === "/pipeline") return send(res, body.map((cmd) => ({ result: redis(cmd) })));
  send(res, { result: redis(body) });
});

// ---- fake Meta Graph ----
let wamidN = 0;
const graph = http.createServer(async (req, res) => {
  if (req.method === "GET") return req.headers.authorization === "Bearer test-wa-token" ? send(res, { display_phone_number: "+44 7427 259935", verified_name: "Dleading" }) : send(res, { error: { code: 190, message: "Invalid OAuth access token" } }, 401);
  const body = JSON.parse(await readBody(req));
  log.graph.push({ url: req.url, auth: req.headers.authorization, body });
  if (body.status === "read") return send(res, { success: true });
  if (graphMode === "fail") return send(res, { error: { code: 131047, message: "Re-engagement message" } }, 400);
  send(res, { messages: [{ id: `wamid.OUT${++wamidN}` }] });
});

// ---- fake Claude ----
const claude = http.createServer(async (req, res) => {
  const body = JSON.parse(await readBody(req));
  log.claude.push(body);
  if (claudeMode === "fail") return send(res, { error: "x" }, 500);
  const last = body.messages.at(-1);
  const reply = (text) => send(res, { stop_reason: "end_turn", content: [{ type: "text", text }] });
  const tool = (name, input, text = "") => send(res, { stop_reason: "tool_use", content: [...(text ? [{ type: "text", text }] : []), { type: "tool_use", id: "t1", name, input }] });
  if (Array.isArray(last.content)) return reply("TOOL " + last.content.map((c) => c.content).join(" "));
  const t = last.content.split("\n").at(-1);
  if (t.includes("LEAD")) return tool("create_lead", { name: "Priya", needs: "Website for Sparkle Cleaning" });
  if (t.includes("HUMAN")) return tool("request_human", { reason: "Wants to speak to a person", name: "Priya" });
  if (t.includes("ABUSE")) return tool("end_conversation", { reason: "abuse" }, "I'll end our chat here. Take care.");
  if (t.includes("MARKER")) return reply("Message us below [[WHATSAPP]]");
  return reply("Hi! How can I help?");
});

// ---- fake n8n ----
const n8n = http.createServer(async (req, res) => { log.n8n.push({ path: req.url, body: JSON.parse(await readBody(req)) }); send(res, {}); });

await Promise.all([listen(upstash, 4701), listen(graph, 4702), listen(claude, 4703), listen(n8n, 4704)]);
Object.assign(process.env, {
  KV_REST_API_URL: "http://127.0.0.1:4701", KV_REST_API_TOKEN: "kv-token",
  WHATSAPP_GRAPH_BASE: "http://127.0.0.1:4702", WHATSAPP_ACCESS_TOKEN: "test-wa-token", WHATSAPP_PHONE_NUMBER_ID: "1385944931264059",
  WHATSAPP_APP_SECRET: "test-app-secret", WHATSAPP_VERIFY_TOKEN: "test-verify-token",
  ANTHROPIC_BASE_URL: "http://127.0.0.1:4703", ANTHROPIC_API_KEY: "test-key",
  N8N_LEAD_WEBHOOK_URL: "http://127.0.0.1:4704/lead", N8N_HANDOFF_WEBHOOK_URL: "http://127.0.0.1:4704/handoff", N8N_WEBHOOK_SECRET: "s",
  ADMIN_TOKEN: "admin-token-0123456789abcdef-XYZ",
});
const wa = await import(new URL("../api/whatsapp.js", import.meta.url).href);
const admin = await import(new URL("../api/admin.js", import.meta.url).href);

let fails = 0, n = 0;
const check = (name, cond, info) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + JSON.stringify(info)?.slice(0, 600)}`); if (!cond) fails++; };
const sign = (raw, secret = "test-app-secret") => "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
const NUM = "447700900123";
const event = (msgs = [], statuses = [], phoneId = "1385944931264059") => ({
  object: "whatsapp_business_account",
  entry: [{ id: "562742200250790", changes: [{ field: "messages", value: { messaging_product: "whatsapp", metadata: { phone_number_id: phoneId }, contacts: [{ wa_id: NUM, profile: { name: "Priya" } }], messages: msgs, statuses } }] }],
});
const textMsg = (text, id = `wamid.IN${++n}`, from = NUM) => ({ from, id, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: text } });
async function post(evt, sig) {
  const raw = JSON.stringify(evt);
  const r = await wa.POST(new Request("https://creativedleading.co.uk/api/whatsapp", { method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": sig ?? sign(raw) }, body: raw }));
  return { status: r.status, body: await r.json().catch(() => null) };
}
const say = (text, id) => post(event([textMsg(text, id)]));
const sent = () => log.graph.filter((g) => g.body.type === "text");
const lastSent = () => sent().at(-1)?.body;
const contact = (num = NUM) => JSON.parse(kv.get(`wa:contact:${num}`) || "null");
const state = (num = NUM) => JSON.parse(kv.get(`wa:state:${num}`) || "null");
const adminReq = (method, q, body, token = process.env.ADMIN_TOKEN) =>
  admin[method](new Request(`https://creativedleading.co.uk/api/admin${q}`, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }));

// ---- verification ----
let r = await wa.GET(new Request("https://x/api/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=12345"));
check("Meta verification: correct token echoes challenge", r.status === 200 && (await r.text()) === "12345", r.status);
r = await wa.GET(new Request("https://x/api/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1"));
check("Meta verification: wrong token rejected", r.status === 403, r.status);
process.env.WHATSAPP_VERIFY_TOKEN = "  test-verify-token\n";
r = await wa.GET(new Request("https://x/api/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=987"));
check("Meta verification: stray spaces/newline in Vercel value tolerated", r.status === 200 && (await r.text()) === "987", r.status);
process.env.WHATSAPP_VERIFY_TOKEN = "test-verify-token";
r = await wa.GET(new Request("https://x/api/whatsapp"));
const diag = await r.json(); const diagText = JSON.stringify(diag);
check("setup check: shows which settings exist", r.status === 200 && diag.settings.WHATSAPP_VERIFY_TOKEN === "set (17 characters)" && diag.settings.DATABASE_UPSTASH === "connected", diag);
r = await wa.GET(new Request("https://x/api/whatsapp?live=1"));
const live = (await r.json()).live_checks;
check("live check: database read/write + token accepted by Meta", live?.database?.startsWith("OK") && live?.whatsapp_token?.startsWith("OK"), live);
check("live check: no secret values in output", !/test-wa-token|kv-token|test-app-secret/.test(JSON.stringify(live)), live);
check("setup check: never reveals secret values", !/test-verify-token|test-app-secret|test-wa-token|kv-token|test-key/.test(diagText), diagText);
const vt = process.env.WHATSAPP_VERIFY_TOKEN; delete process.env.WHATSAPP_VERIFY_TOKEN;
r = await wa.GET(new Request("https://x/api/whatsapp?hub.mode=subscribe&hub.verify_token=&hub.challenge=1"));
check("verification with no token configured -> 403 (never matches empty)", r.status === 403, r.status);
process.env.WHATSAPP_VERIFY_TOKEN = vt;

// ---- security ----
r = await post(event([textMsg("Hi")]), sign("tampered"));
check("bad signature -> 401, nothing processed", r.status === 401 && log.claude.length === 0 && !kv.has(`wa:contact:${NUM}`), r);
r = await post(event([textMsg("Hi")]), "");
check("missing signature -> 401", r.status === 401, r);
r = await post(event([textMsg("Hi")]), sign(JSON.stringify(event([textMsg("Hi")])), "other-secret"));
check("signature with wrong app secret -> 401", r.status === 401, r);

// ---- "Hi" end-to-end ----
r = await say("Hi", "wamid.HI1");
check("'Hi' -> 200", r.status === 200 && r.body.messages === 1, r);
check("'Hi' -> new contact saved (lead captured)", contact()?.name === "Priya" && contact()?.msg_count === 1 && kv.get("wa:contacts").has(NUM), contact());
check("'Hi' -> new-lead alert sent to n8n (one row per person)", log.n8n.some((x) => x.path === "/lead" && x.body.action === "new_contact" && x.body.lead_id === `lead_wa_${NUM}` && x.body.lead.phone === `+${NUM}`), log.n8n);
check("'Hi' -> AI called with WhatsApp channel rules", log.claude.length === 1 && JSON.stringify(log.claude[0].system).includes("# Channel: WhatsApp"), null);
check("'Hi' -> reply sent to the customer's number", lastSent()?.to === NUM && lastSent()?.text?.body === "Hi! How can I help?", lastSent());
check("Graph API auth uses server token + phone number id", log.graph.at(-1).auth === "Bearer test-wa-token" && log.graph.at(-1).url === "/v21.0/1385944931264059/messages", log.graph.at(-1));
check("'Hi' -> marked as read", log.graph.some((g) => g.body.status === "read" && g.body.message_id === "wamid.HI1"), null);
const msgs = kv.get(`wa:msgs:${NUM}`).map(JSON.parse);
check("'Hi' -> inbound + outbound messages stored", msgs[1].dir === "in" && msgs[1].text === "Hi" && msgs[0].dir === "out" && msgs[0].id === "wamid.OUT1", msgs);
check("outbound status recorded as sent", JSON.parse(kv.get("wa:status:wamid.OUT1")).status === "sent", null);

// ---- duplicates ----
const before = sent().length, beforeAI = log.claude.length;
r = await say("Hi", "wamid.HI1");
check("Meta retry of same message -> ignored (no 2nd reply, no 2nd AI call)", r.body.duplicates === 1 && sent().length === before && log.claude.length === beforeAI, r.body);

// ---- statuses ----
await post(event([], [{ id: "wamid.OUT1", status: "read", timestamp: "1700000000", recipient_id: NUM }]));
await post(event([], [{ id: "wamid.OUT1", status: "delivered", timestamp: "1699999999", recipient_id: NUM }]));
check("status tracking: read kept even if 'delivered' arrives late", JSON.parse(kv.get("wa:status:wamid.OUT1")).status === "read", kv.get("wa:status:wamid.OUT1"));
await post(event([], [{ id: "wamid.OUT1", status: "failed", recipient_id: NUM, errors: [{ code: 131026, title: "Undeliverable" }] }]));
check("status tracking: failed recorded with error code", JSON.parse(kv.get("wa:status:wamid.OUT1")).error?.startsWith("131026"), kv.get("wa:status:wamid.OUT1"));

// ---- memory ----
await say("I run Sparkle Cleaning");
const lastAI = log.claude.at(-1).messages;
check("history: earlier messages + replies given to the AI, alternating", lastAI.length === 3 && lastAI[0].content === "Hi" && lastAI[1].role === "assistant" && lastAI[2].content === "I run Sparkle Cleaning", lastAI);

// ---- lead ----
await say("LEAD please");
const lead = log.n8n.filter((x) => x.path === "/lead").at(-1).body;
check("lead: created with WhatsApp number auto-filled (not asked)", lead.action === "create" && lead.lead_id === `lead_wa_${NUM}` && lead.lead.phone === `+${NUM}` && lead.lead.name === "Priya", lead);
check("lead: recorded in persistent state", state().lead?.id === `lead_wa_${NUM}`, state());
const leadsBefore = log.n8n.filter((x) => x.path === "/lead").length;
await say("LEAD please again");
check("lead: identical resubmission not sent twice", log.n8n.filter((x) => x.path === "/lead").length === leadsBefore, null);

// ---- WhatsApp channel never shows the website button marker ----
await say("MARKER");
check("WhatsApp reply never contains [[WHATSAPP]] marker", !lastSent().text.body.includes("[["), lastSent());

// ---- handoff ----
await say("HUMAN please");
check("handoff: request sent to n8n + chat switched to human mode", log.n8n.at(-1).path === "/handoff" && log.n8n.at(-1).body.customer.phone === `+${NUM}` && state().mode === "handoff", { n8n: log.n8n.at(-1), st: state() });
const aiCalls = log.claude.length, sends = sent().length;
await say("are you there? my budget is £700");
check("after handoff: AI silent (no AI call, no reply)", log.claude.length === aiCalls && sent().length === sends, null);
check("after handoff: message forwarded to the team", log.n8n.at(-1).body.action === "message" && log.n8n.at(-1).body.message.includes("£700"), log.n8n.at(-1));

lastLiveReset: {
  r = await wa.GET(new Request("https://x/api/whatsapp?live=1&t=2"));
  const lc = (await r.json()).live_checks;
  check("live check: shows last webhook result + contact count (no content)", (lc.cached || lc.last_webhook_from_meta?.includes("OK:")) && !JSON.stringify(lc).includes("Sparkle"), lc);
}
// ---- admin ----
check("admin: no token -> 401", (await adminReq("GET", "?action=stats", null, "wrong")).status === 401, null);
let a = await (await adminReq("GET", "?action=contacts")).json();
check("admin: contact list shows human mode", a.contacts[0].wa_id === NUM && a.contacts[0].mode === "handoff", a);
r = await adminReq("POST", "", { action: "send", number: `+${NUM}`, text: "Hi Priya, Tom from Dleading here." });
check("admin: manual human reply sent + stored", r.status === 200 && lastSent().text.body.startsWith("Hi Priya, Tom") && JSON.parse(kv.get(`wa:msgs:${NUM}`)[0]).kind === "human", await r.json());
await adminReq("POST", "", { action: "resume_ai", number: NUM });
await say("thanks, one more question");
check("admin: resume_ai -> AI answers again", log.claude.length === aiCalls + 1 && state().mode === "ai", state());

// ---- auto-replies ----
r = await adminReq("POST", "", { action: "save_autoreplies", rules: [{ keyword: "opening hours", reply: "We're open Mon–Fri 9am–6pm and Sat 10am–3pm.", match: "contains" }] });
check("admin: auto-reply saved", r.status === 200, null);
const ai2 = log.claude.length;
await say("what are your opening hours?");
check("auto-reply: keyword -> instant fixed reply, no AI", lastSent().text.body.startsWith("We're open") && log.claude.length === ai2, lastSent());
await say("do you do logos");
check("auto-reply: no keyword -> AI answers", log.claude.length === ai2 + 1, null);

// ---- website "speak to someone" ref ----
const NUM2 = "447700900456";
const s0 = sent().length, c0 = log.claude.length;
await post({ ...event([textMsg("Hi Dleading, I'd like to speak to someone. Ref H-4821 (page: /pricing)", "wamid.REF1", NUM2)]), });
check("website ref -> straight to human, no AI", log.claude.length === c0 && state(NUM2)?.mode === "handoff" && log.n8n.at(-1).body.reason.includes("H-4821"), state(NUM2));
check("website ref -> one short acknowledgement", sent().length === s0 + 1 && sent().at(-1).body.text.body.includes("Someone from the Dleading team"), sent().at(-1));
check("source page tracked from pre-filled message", contact(NUM2).source_page === "/pricing", contact(NUM2));

// ---- abuse ----
const NUM3 = "447700900789";
await post(event([textMsg("ABUSE you idiot", "wamid.AB1", NUM3)]));
check("abuse: chat ended with polite closing line, contact muted", sent().at(-1).body.text.body.includes("end our chat") && contact(NUM3).muted_until > new Date().toISOString(), contact(NUM3));
const c3 = log.claude.length, s3 = sent().length;
await post(event([textMsg("hello??", "wamid.AB2", NUM3)]));
check("abuse: further messages get no reply while muted", log.claude.length === c3 && sent().length === s3, null);

// ---- opt-out + broadcast ----
await post(event([textMsg("STOP", "wamid.STOP1", NUM2)]));
check("STOP -> opted out + confirmation", contact(NUM2).opted_out === true && sent().at(-1).body.text.body.includes("unsubscribed"), contact(NUM2));
r = await adminReq("POST", "", { action: "broadcast", name: "Autumn offer", template: "hello_world", language: "en_US", numbers: [`+${NUM}`, NUM2, "07700 900999", "not-a-number"] });
a = await r.json();
const tpl = log.graph.filter((g) => g.body.type === "template");
check("broadcast: approved template sent, STOP respected, UK 07… normalised", a.campaign.sent === 2 && a.campaign.skipped === 1 && tpl.length === 2 && tpl.some((g) => g.body.to === "447700900999") && tpl[0].body.template.name === "hello_world", a);
await post(event([], [{ id: tpl[0].body.to === NUM ? "wamid.OUT" + wamidN : "x", status: "delivered", recipient_id: NUM }]));
a = await (await adminReq("GET", "?action=campaigns")).json();
check("campaign stats tracked", a.campaigns[0].name === "Autumn offer" && a.campaigns[0].stats.sent === 2, a.campaigns[0]);
check("broadcast: invalid template name rejected", (await adminReq("POST", "", { action: "broadcast", template: "Hello World!", numbers: [NUM] })).status === 400, null);

// ---- export ----
r = await adminReq("GET", "?action=export&type=contacts");
const csv = await r.text();
check("CSV export: contacts with phone, name, source page, opt-out", r.headers.get("content-type").includes("text/csv") && csv.includes(`+${NUM},Priya`) && csv.includes("/pricing") && csv.split("\r\n")[0].startsWith("phone,name"), csv.slice(0, 300));
r = await adminReq("GET", "?action=export&type=messages");
const mcsv = await r.text();
check("CSV export: full message log incl. statuses", mcsv.includes("I run Sparkle Cleaning") && mcsv.includes("human"), mcsv.slice(0, 300));

// ---- failures ----
graphMode = "fail";
const r4 = await post(event([textMsg("hello", "wamid.F1", "447700900111")]));
check("Meta send failure -> no crash, failure stored", r4.status === 200 && JSON.parse(kv.get("wa:msgs:447700900111")[0]).ok === false, kv.get("wa:msgs:447700900111"));
graphMode = "ok"; claudeMode = "fail";
await post(event([textMsg("hello", "wamid.F2", "447700900222")]));
check("AI failure -> polite 'team will get back to you' reply", sent().at(-1).body.text.body.includes("trouble"), sent().at(-1));
claudeMode = "ok";
await post(event([{ from: "447700900333", id: "wamid.IMG1", type: "image", image: { id: "x" } }]));
check("image/voice message -> asks them to type", sent().at(-1).body.text.body.includes("only read text"), sent().at(-1));
const c5 = log.claude.length;
await post(event([textMsg("Hi", "wamid.OTHER1")], [], "999999"));
check("events for another phone number id ignored", log.claude.length === c5, null);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
[upstash, graph, claude, n8n].forEach((s) => s.close());
process.exit(fails ? 1 : 0);
