/**
 * /api/widget?r=config|message|history|contact — public endpoints for the embeddable website chat
 * (public/widget.js). The business is identified by its PUBLIC key (pk_…), which is safe to put
 * in a web page; it grants nothing except chatting as a customer.
 *
 * Protection: per-business origin allow-list (Integrations → Website chat), CORS limited to that
 * list, rate limits per IP / visitor / business, input validation, and the visitor id is an
 * unguessable random token that only unlocks that visitor's own conversation.
 */
import { system, tenant, dbConfigured } from "./_lib/ge/db.js";
import { json, readJson, clientIp, rateLimit, HttpError, fail, str, email as cleanEmail, phone as cleanPhone, requestHost } from "./_lib/ge/http.js";
import { customerTurn } from "./_lib/ge/engine.js";
import { upsertConversation, mergeLeadDetails, logEvent } from "./_lib/ge/leads.js";

const KEY = /^pk_[a-f0-9]{24}$/;
const VISITOR = /^v_[A-Za-z0-9_-]{20,64}$/;

// Looked up on every request (one indexed query) so allow-list / branding changes apply at once.
async function businessByKey(key) {
  if (!KEY.test(key || "")) fail(404, "unknown_business");
  const [biz] = await system((tx) => tx`
    select b.id, b.name, b.brand, b.widget_allowed_origins, b.status, s.assistant_name, s.greeting, s.enabled as ai_enabled
    from businesses b left join ai_settings s on s.business_id = b.id where b.public_key = ${key}`);
  if (!biz || biz.status !== "active") fail(404, "unknown_business");
  return biz;
}

function allowedOrigin(request, biz) {
  const origin = request.headers.get("origin");
  if (!origin) return null; // non-browser callers get no CORS headers (and browsers block them)
  let o;
  try { o = new URL(origin); } catch { return false; }
  if (o.host === requestHost(request)) return origin; // dashboard preview on our own domain
  const list = biz.widget_allowed_origins || [];
  if (!list.length) return origin; // no list yet: any site (dashboard recommends adding one)
  return list.includes(o.origin) ? origin : false;
}

const cors = (origin) => origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {};

async function handle(request) {
  const url = new URL(request.url);
  const r = url.searchParams.get("r");
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    const o = request.headers.get("origin");
    return new Response(null, { status: 204, headers: { ...(o ? { "access-control-allow-origin": o, vary: "Origin" } : {}), "access-control-allow-methods": "GET, POST", "access-control-allow-headers": "content-type", "access-control-max-age": "600" } });
  }
  if (!dbConfigured()) return json(503, { error: "unavailable" });

  const ip = clientIp(request);
  await rateLimit(`w:${ip}`, 120, 60);
  const body = method === "POST" ? await readJson(request, 20_000) : {};
  const key = method === "POST" ? body.key : url.searchParams.get("key");
  const biz = await businessByKey(key);
  const origin = allowedOrigin(request, biz);
  if (origin === false) return json(403, { error: "origin_not_allowed" });
  const h = cors(origin);

  if (r === "config" && method === "GET") {
    return json(200, {
      name: biz.name, assistant_name: biz.assistant_name || "Assistant", greeting: biz.greeting || "Hi! How can I help you today?",
      color: biz.brand?.primary_color || "#F65901", logo_url: biz.brand?.logo_url || "", ai_enabled: biz.ai_enabled !== false,
    }, h);
  }

  const visitor = method === "POST" ? body.visitor_id : url.searchParams.get("visitor_id");
  if (!VISITOR.test(visitor || "")) return json(400, { error: "invalid_visitor" }, h);

  if (r === "history" && method === "GET") {
    const out = await tenant(biz.id, async (tx) => {
      const [c] = await tx`select id, handler from conversations where business_id = ${biz.id} and channel = 'website' and external_id = ${visitor}`;
      if (!c) return { messages: [], handler: "ai" };
      const messages = await tx`select id, direction, sender, body, created_at from (select * from messages where conversation_id = ${c.id} and business_id = ${biz.id} order by created_at desc limit 100) m order by created_at`;
      return { messages, handler: c.handler };
    });
    return json(200, out, h);
  }

  if (r === "message" && method === "POST") {
    await rateLimit(`wv:${visitor}`, 20, 60);
    await rateLimit(`wb:${biz.id}`, 1000, 3600);
    const text = str(body.text, 2000);
    if (!text) return json(400, { error: "empty_message" }, h);
    const out = await customerTurn({ businessId: biz.id, channel: "website", externalId: visitor, text, customer: { name: str(body.name, 120) } });
    return json(200, out, h);
  }

  if (r === "contact" && method === "POST") {
    await rateLimit(`wc:${visitor}`, 10, 600);
    const details = { name: str(body.name, 120), phone: cleanPhone(body.phone), email: cleanEmail(body.email) };
    if (!details.name && !details.phone && !details.email) return json(400, { error: "details_required" }, h);
    if (body.phone && !details.phone) return json(400, { error: "invalid_phone" }, h);
    if (body.email && !details.email) return json(400, { error: "invalid_email" }, h);
    await tenant(biz.id, async (tx) => {
      const { conv } = await upsertConversation(tx, biz.id, { channel: "website", externalId: visitor, customerName: details.name, source: "website" });
      if (details.name && !conv.customer_name) await tx`update conversations set customer_name = ${details.name} where id = ${conv.id}`;
      if (conv.lead_id) await mergeLeadDetails(tx, biz.id, conv.lead_id, details, "customer");
      await logEvent(tx, biz.id, "lead.contact_captured", { leadId: conv.lead_id, conversationId: conv.id, actor: "customer", data: { via: "widget_form" } });
    });
    return json(200, { ok: true }, h);
  }

  return json(404, { error: "not_found" }, h);
}

async function entry(request) {
  try { return await handle(request); } catch (e) {
    const o = request.headers.get("origin");
    const h = o ? { "access-control-allow-origin": o, vary: "Origin" } : {};
    if (e instanceof HttpError) return json(e.status, { error: e.code }, h);
    console.error(`[widget] ${e?.message || e}`);
    return json(500, { error: "server_error" }, h);
  }
}
export const GET = entry;
export const POST = entry;
export const OPTIONS = entry;
