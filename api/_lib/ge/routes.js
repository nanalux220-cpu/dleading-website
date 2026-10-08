/**
 * Growth Engine dashboard API routes. Mounted by /api/app (one Vercel function, ?r=<route>).
 * Every tenant route runs inside tenant(businessId) AND filters by business_id explicitly.
 */
import { timingSafeEqual, randomBytes } from "node:crypto";
import { tenant, system, isUuid } from "./db.js";
import { hashPassword, verifyPassword, burnPasswordCheck, createSession, clearSessionCookie, destroySession } from "./auth.js";
import { fail, rateLimit, str, oneOf, bool, int, email as cleanEmail, phone as cleanPhone, url as cleanUrl, isoDate } from "./http.js";
import { LEAD_STATUSES, LEAD_SOURCES, CHANNELS, logEvent, addMessage, scoringFor } from "./leads.js";
import { scoreLead, normaliseQualification, normaliseScoring, DEFAULT_QUALIFICATION, DEFAULT_SCORING, DEFAULT_HANDOFF, QUALIFICATION_FIELDS } from "./scoring.js";
import { runBusinessAgent } from "./agent.js";
import { loadAiContext, cleanLeadDetails } from "./engine.js";
import { linkableWhatsApp, sendWhatsAppFromInbox, setWhatsAppHandler } from "./bridge.js";

const KNOWLEDGE_KINDS = ["company", "service", "price", "faq", "hours", "location", "policy", "contact", "instruction"];
const PERSONALITIES = ["friendly", "professional", "concise", "warm", "custom"];
const ROLES_THAT_MANAGE = ["owner", "admin"];

function requireManager(ctx) {
  if (!ROLES_THAT_MANAGE.includes(ctx.session.role)) fail(403, "forbidden");
}

function slugify(name) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "business";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

// ---------- business creation (shared by signup and "add another business") ----------
async function createBusiness(tx, userId, name) {
  const [biz] = await tx`insert into businesses (name, slug) values (${name}, ${slugify(name)}) returning *`;
  await tx`insert into memberships (business_id, user_id, role) values (${biz.id}, ${userId}, 'owner')`;
  await tx`insert into ai_settings (business_id, assistant_name, qualification, scoring, handoff)
           values (${biz.id}, 'Assistant', ${tx.json(DEFAULT_QUALIFICATION)}, ${tx.json(DEFAULT_SCORING)}, ${tx.json(DEFAULT_HANDOFF)})`;
  await tx`insert into integrations (business_id, provider, status, display_name, connected_at)
           values (${biz.id}, 'website_widget', 'connected', 'Website chat', now())`;
  for (const t of AUTOMATION_TEMPLATES) {
    await tx`insert into automation_rules (business_id, name, trigger, conditions, actions, enabled)
             values (${biz.id}, ${t.name}, ${t.trigger}, ${tx.json(t.conditions)}, ${tx.json(t.actions)}, false)`;
  }
  await logEvent(tx, biz.id, "business.created", { actor: `user:${userId}` });
  return biz;
}

export const AUTOMATION_TEMPLATES = [
  { key: "hot_alert", name: "Alert the team about hot leads", trigger: "lead_hot", conditions: {}, actions: [{ type: "notify_team", channel: "email" }], description: "When a lead becomes Hot, notify the team straight away." },
  { key: "new_lead_alert", name: "New lead notification", trigger: "lead_created", conditions: {}, actions: [{ type: "notify_team", channel: "email" }], description: "Tell the team whenever a new lead comes in." },
  { key: "no_reply_follow_up", name: "Follow up if the customer goes quiet", trigger: "no_reply", conditions: { hours: 24 }, actions: [{ type: "send_message", template: "follow_up_1" }], description: "Send a friendly follow-up 24 hours after the customer stops replying." },
  { key: "follow_up_due", name: "Remind me when a follow-up is due", trigger: "follow_up_due", conditions: {}, actions: [{ type: "notify_team", channel: "email" }], description: "Remind the assigned person on the day a lead's follow-up is due." },
  { key: "handoff_alert", name: "Alert when a customer asks for a person", trigger: "conversation_handoff", conditions: {}, actions: [{ type: "notify_team", channel: "email" }], description: "Notify the team when the AI hands a conversation to a human." },
];

// ---------- serialisers ----------
const publicBusiness = (b) => b && ({
  id: b.id, name: b.name, slug: b.slug, industry: b.industry, website: b.website, description: b.description,
  services: b.services, opening_hours: b.opening_hours, contact: b.contact, timezone: b.timezone, brand: b.brand,
  plan_id: b.plan_id, status: b.status, onboarding_step: b.onboarding_step, onboarding_completed_at: b.onboarding_completed_at,
  public_key: b.public_key, widget_allowed_origins: b.widget_allowed_origins, created_at: b.created_at,
});

function aiSettingsOut(s) {
  return {
    enabled: s.enabled, assistant_name: s.assistant_name, personality: s.personality, tone_notes: s.tone_notes,
    greeting: s.greeting, custom_instructions: s.custom_instructions,
    qualification: normaliseQualification(s.qualification), scoring: normaliseScoring(s.scoring),
    handoff: { ...DEFAULT_HANDOFF, ...(s.handoff || {}) }, updated_at: s.updated_at,
    qualification_fields: QUALIFICATION_FIELDS,
  };
}

// ---------- validation of business profile ----------
function cleanServices(v) {
  if (!Array.isArray(v)) return undefined;
  return v.slice(0, 50).map((x) => ({ name: str(x?.name, 120), description: str(x?.description, 500), price: str(x?.price, 80) })).filter((x) => x.name);
}
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
function cleanHours(v) {
  if (!v || typeof v !== "object") return undefined;
  const out = {};
  for (const d of DAYS) {
    const h = v[d];
    if (!h) continue;
    out[d] = { closed: bool(h.closed), open: TIME.test(h.open) ? h.open : "09:00", close: TIME.test(h.close) ? h.close : "17:00" };
  }
  return out;
}
function cleanContact(v) {
  if (!v || typeof v !== "object") return undefined;
  return { phone: cleanPhone(v.phone) || str(v.phone, 40), email: cleanEmail(v.email), address: str(v.address, 300), whatsapp: cleanPhone(v.whatsapp) };
}
function cleanBrand(v) {
  if (!v || typeof v !== "object") return undefined;
  return { primary_color: /^#[0-9a-fA-F]{6}$/.test(v.primary_color) ? v.primary_color : "#F65901", logo_url: cleanUrl(v.logo_url) };
}
function cleanOrigins(v) {
  if (!Array.isArray(v)) return undefined;
  const out = [];
  for (const o of v.slice(0, 20)) {
    try { const u = new URL(/^https?:\/\//.test(o) ? o : `https://${o}`); if (/^https?:$/.test(u.protocol)) out.push(u.origin); } catch { /* skip */ }
  }
  return [...new Set(out)];
}

function businessPatch(b) {
  const p = {};
  if ("name" in b) { p.name = str(b.name, 120); if (!p.name) fail(400, "name_required"); }
  if ("industry" in b) p.industry = str(b.industry, 80);
  if ("website" in b) { p.website = cleanUrl(b.website); if (b.website && !p.website) fail(400, "invalid_website"); }
  if ("description" in b) p.description = str(b.description, 3000);
  if ("timezone" in b) p.timezone = str(b.timezone, 60) || "Europe/London";
  const services = cleanServices(b.services); if (services) p.services = services;
  const hours = cleanHours(b.opening_hours); if (hours) p.opening_hours = hours;
  const contact = cleanContact(b.contact); if (contact) p.contact = contact;
  const brand = cleanBrand(b.brand); if (brand) p.brand = brand;
  const origins = cleanOrigins(b.widget_allowed_origins); if (origins) p.widget_allowed_origins = origins;
  if ("onboarding_step" in b) p.onboarding_step = int(b.onboarding_step, 1, 10, 1);
  return p;
}

function leadPatch(b, { creating = false } = {}) {
  const p = {};
  if ("name" in b) p.name = str(b.name, 120);
  if ("phone" in b) { p.phone = cleanPhone(b.phone); if (b.phone && !p.phone) fail(400, "invalid_phone"); }
  if ("email" in b) { p.email = cleanEmail(b.email); if (b.email && !p.email) fail(400, "invalid_email"); }
  if ("source" in b) p.source = oneOf(b.source, LEAD_SOURCES, "manual");
  for (const k of ["service_interest", "location", "budget", "preferred_date"]) if (k in b) p[k] = str(b[k], 200);
  if ("urgency" in b) p.urgency = oneOf(b.urgency, ["", "low", "medium", "high"], "");
  if ("ready_to_book" in b) p.ready_to_book = bool(b.ready_to_book);
  if ("status" in b) { if (!LEAD_STATUSES.includes(b.status)) fail(400, "invalid_status"); p.status = b.status; }
  if ("notes" in b) p.notes = str(b.notes, 5000);
  if ("value_pence" in b) p.value_pence = b.value_pence === null || b.value_pence === "" ? null : int(b.value_pence, 0, 1e9, null);
  for (const k of ["next_follow_up_at", "last_contact_at"]) {
    if (k in b) { const d = isoDate(b[k]); if (d === undefined) fail(400, `invalid_${k}`); p[k] = d; }
  }
  if (creating && !p.name && !p.phone && !p.email) fail(400, "name_phone_or_email_required");
  return p;
}

// ======================================================================
//  Routes
// ======================================================================
export const routes = {};
const route = (name, methods, opts, fn) => { routes[name] = { methods, auth: opts.auth ?? "business", fn }; };

// ---------- auth ----------
route("auth/signup", ["POST"], { auth: "none" }, async ({ request, body, ip }) => {
  await rateLimit(`signup:${ip}`, 5, 3600);
  const em = cleanEmail(body.email);
  const name = str(body.name, 120);
  const businessName = str(body.business_name, 120);
  const password = typeof body.password === "string" ? body.password : "";
  if (!em) fail(400, "invalid_email");
  if (password.length < 10 || password.length > 200) fail(400, "weak_password", "Use at least 10 characters.");
  const hash = await hashPassword(password);
  const result = await system(async (tx) => {
    const [exists] = await tx`select 1 from users where lower(email) = ${em}`;
    if (exists) fail(409, "email_taken");
    const [user] = await tx`insert into users (email, name, password_hash, last_login_at) values (${em}, ${name}, ${hash}, now()) returning id`;
    const biz = await createBusiness(tx, user.id, businessName || (name ? `${name}'s business` : "My business"));
    return { userId: user.id, businessId: biz.id };
  });
  const setCookie = await createSession(request, result.userId, result.businessId);
  return { status: 201, body: { ok: true }, headers: { "set-cookie": setCookie } };
});

route("auth/login", ["POST"], { auth: "none" }, async ({ request, body, ip }) => {
  const em = cleanEmail(body.email);
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  await rateLimit(`login:${ip}`, 20, 900);
  await rateLimit(`login:${em || "invalid"}`, 10, 900);
  const user = em ? await system(async (tx) => (await tx`select id, password_hash from users where lower(email) = ${em}`)[0]) : null;
  if (!user) { await burnPasswordCheck(password); fail(401, "invalid_credentials"); }
  if (!(await verifyPassword(password, user.password_hash))) fail(401, "invalid_credentials");
  const businessId = await system(async (tx) => {
    await tx`update users set last_login_at = now() where id = ${user.id}`;
    await tx`delete from sessions where user_id = ${user.id} and expires_at < now()`;
    const [m] = await tx`select business_id from memberships where user_id = ${user.id} order by created_at limit 1`;
    return m?.business_id || null;
  });
  return { body: { ok: true }, headers: { "set-cookie": await createSession(request, user.id, businessId) } };
});

route("auth/logout", ["POST"], { auth: "none" }, async ({ request }) => {
  await destroySession(request);
  return { body: { ok: true }, headers: { "set-cookie": clearSessionCookie(request) } };
});

route("auth/me", ["GET"], { auth: "optional" }, async ({ session }) => {
  if (!session) return { body: { user: null } };
  const memberships = await system((tx) => tx`
    select b.id, b.name, m.role, b.onboarding_completed_at is not null as onboarded
    from memberships m join businesses b on b.id = m.business_id where m.user_id = ${session.user.id} order by b.name`);
  const business = session.businessId ? await tenant(session.businessId, async (tx) => publicBusiness((await tx`select * from businesses where id = ${session.businessId}`)[0])) : null;
  return { body: { user: session.user, role: session.role, business, businesses: memberships } };
});

route("auth/switch", ["POST"], { auth: "user" }, async ({ session, body }) => {
  if (!isUuid(body.business_id)) fail(400, "invalid_business");
  await system(async (tx) => {
    const [m] = await tx`select 1 from memberships where user_id = ${session.user.id} and business_id = ${body.business_id}`;
    if (!m) fail(403, "forbidden");
    await tx`update sessions set business_id = ${body.business_id} where id = ${session.sessionId}`;
  });
  return { body: { ok: true } };
});

route("businesses/create", ["POST"], { auth: "user" }, async ({ session, body }) => {
  const name = str(body.name, 120);
  if (!name) fail(400, "name_required");
  const biz = await system(async (tx) => {
    const [{ n }] = await tx`select count(*)::int as n from memberships where user_id = ${session.user.id} and role = 'owner'`;
    if (n >= 50) fail(400, "too_many_businesses");
    const b = await createBusiness(tx, session.user.id, name);
    await tx`update sessions set business_id = ${b.id} where id = ${session.sessionId}`;
    return b;
  });
  return { status: 201, body: { business: publicBusiness(biz) } };
});

// ---------- business profile / onboarding ----------
route("business", ["GET", "PATCH"], {}, async ({ session, method, body }) => {
  const bid = session.businessId;
  if (method === "PATCH") requireManager({ session });
  return tenant(bid, async (tx) => {
    if (method === "PATCH") {
      const p = businessPatch(body);
      if (Object.keys(p).length) await tx`update businesses set ${tx(p)} where id = ${bid}`;
    }
    const [b] = await tx`select * from businesses where id = ${bid}`;
    const [plan] = await tx`select * from plans where id = ${b.plan_id}`;
    return { body: { business: publicBusiness(b), plan } };
  });
});

route("onboarding/complete", ["POST"], {}, async ({ session }) => {
  requireManager({ session });
  const bid = session.businessId;
  return tenant(bid, async (tx) => {
    await tx`update businesses set onboarding_completed_at = coalesce(onboarding_completed_at, now()), onboarding_step = 10 where id = ${bid}`;
    await logEvent(tx, bid, "business.onboarded", { actor: `user:${session.user.id}` });
    return { body: { ok: true } };
  });
});

route("plans", ["GET"], {}, async ({ session }) => tenant(session.businessId, async (tx) => ({ body: { plans: await tx`select * from plans where is_public order by sort` } })));

route("team", ["GET"], {}, async ({ session }) => {
  const bid = session.businessId;
  const members = await system((tx) => tx`select u.id, u.name, u.email, m.role, m.created_at from memberships m join users u on u.id = m.user_id where m.business_id = ${bid} order by m.created_at`);
  return { body: { members } };
});

// ---------- overview ----------
route("overview", ["GET"], {}, async ({ session }) => {
  const bid = session.businessId;
  return tenant(bid, async (tx) => {
    const [s] = await tx`
      select
        count(*) filter (where created_at > now() - interval '7 days')::int as new_leads_7d,
        count(*) filter (where status = 'new')::int as new_leads_open,
        count(*) filter (where status = 'qualified')::int as qualified,
        count(*) filter (where score_label = 'hot' and status not in ('won','lost'))::int as hot,
        count(*) filter (where status = 'won')::int as won,
        count(*)::int as total,
        count(*) filter (where next_follow_up_at is not null and next_follow_up_at < now() + interval '1 day' and status not in ('won','lost'))::int as follow_ups_due
      from leads where business_id = ${bid}`;
    const [c] = await tx`
      select count(*) filter (where status <> 'closed')::int as open,
             count(*) filter (where handler = 'human' and status <> 'closed')::int as with_human,
             coalesce(sum(unread_count), 0)::int as unread,
             count(*) filter (where last_message_at > now() - interval '30 days')::int as active_30d
      from conversations where business_id = ${bid}`;
    const [a] = await tx`select count(*)::int as upcoming from appointments where business_id = ${bid} and starts_at >= now() and status in ('requested','confirmed')`;
    const activity = await tx`
      select e.id, e.type, e.actor, e.data, e.created_at, e.lead_id, e.conversation_id, l.name as lead_name, l.phone as lead_phone, c.channel
      from events e left join leads l on l.id = e.lead_id left join conversations c on c.id = e.conversation_id
      where e.business_id = ${bid} and e.type not in ('message.sent')
      order by e.created_at desc limit 12`;
    const [b] = await tx`select onboarding_completed_at, (select count(*)::int from knowledge_items where business_id = ${bid}) as knowledge_count from businesses where id = ${bid}`;
    const [wa] = await tx`select status from integrations where business_id = ${bid} and provider = 'whatsapp'`;
    return {
      body: {
        stats: {
          new_leads: s.new_leads_7d, new_leads_open: s.new_leads_open, qualified_leads: s.qualified, hot_leads: s.hot,
          conversations: c.open, conversations_with_human: c.with_human, unread: c.unread, conversations_30d: c.active_30d,
          appointments: a.upcoming, conversion_rate: s.total ? Math.round((s.won / s.total) * 1000) / 10 : 0,
          won: s.won, total_leads: s.total, follow_ups_due: s.follow_ups_due,
        },
        activity,
        setup: { onboarded: !!b.onboarding_completed_at, knowledge_items: b.knowledge_count, whatsapp: wa?.status || "not_connected" },
      },
    };
  });
});

// ---------- leads ----------
route("leads", ["GET", "POST"], {}, async ({ session, method, params, body }) => {
  const bid = session.businessId;
  return tenant(bid, async (tx) => {
    if (method === "POST") {
      const p = leadPatch(body, { creating: true });
      const scored = scoreLead({ ...p }, await scoringFor(tx, bid));
      const [lead] = await tx`insert into leads ${tx({ ...p, business_id: bid, source: p.source || "manual", score: scored.score, score_label: scored.label, qualification: tx.json({ reasons: scored.reasons }) })} returning *`;
      await logEvent(tx, bid, "lead.created", { leadId: lead.id, actor: `user:${session.user.id}`, data: { source: lead.source } });
      return { status: 201, body: { lead } };
    }
    const q = str(params.get("q"), 100);
    const status = params.get("status");
    const label = params.get("score");
    const source = params.get("source");
    const sort = oneOf(params.get("sort"), ["created_at", "score", "last_contact_at", "next_follow_up_at", "name"], "created_at");
    const page = int(params.get("page"), 1, 1000, 1);
    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const where = tx`business_id = ${bid}
      ${LEAD_STATUSES.includes(status) ? tx`and status = ${status}` : tx``}
      ${["cold", "warm", "hot"].includes(label) ? tx`and score_label = ${label}` : tx``}
      ${LEAD_SOURCES.includes(source) ? tx`and source = ${source}` : tx``}
      ${q ? tx`and (name ilike ${like} or phone ilike ${like} or email ilike ${like} or service_interest ilike ${like} or location ilike ${like})` : tx``}`;
    const order = sort === "name" ? tx`name asc` : sort === "next_follow_up_at" ? tx`next_follow_up_at asc nulls last` : tx`${tx(sort)} desc nulls last`;
    const leads = await tx`select * from leads where ${where} order by ${order}, created_at desc limit 50 offset ${(page - 1) * 50}`;
    const [{ total }] = await tx`select count(*)::int as total from leads where ${where}`;
    const counts = await tx`select status, count(*)::int as n from leads where business_id = ${bid} group by status`;
    return { body: { leads, total, page, counts: Object.fromEntries(counts.map((r) => [r.status, r.n])) } };
  });
});

route("lead", ["GET", "PATCH", "DELETE"], {}, async ({ session, method, params, body }) => {
  const bid = session.businessId;
  const id = params.get("id");
  if (!isUuid(id)) fail(400, "invalid_id");
  return tenant(bid, async (tx) => {
    const [lead] = await tx`select * from leads where id = ${id} and business_id = ${bid}`;
    if (!lead) fail(404, "not_found");
    if (method === "DELETE") {
      requireManager({ session });
      await tx`delete from leads where id = ${id} and business_id = ${bid}`;
      return { body: { ok: true } };
    }
    if (method === "PATCH") {
      const p = leadPatch(body);
      if (Object.keys(p).length) {
        const merged = { ...lead, ...p };
        const scored = scoreLead(merged, await scoringFor(tx, bid));
        p.score = scored.score; p.score_label = scored.label;
        p.qualification = tx.json({ ...(lead.qualification || {}), reasons: scored.reasons });
        await tx`update leads set ${tx(p)} where id = ${id} and business_id = ${bid}`;
        if (p.status && p.status !== lead.status) {
          await logEvent(tx, bid, p.status === "won" ? "lead.won" : p.status === "lost" ? "lead.lost" : "lead.status_changed", { leadId: id, actor: `user:${session.user.id}`, data: { from: lead.status, to: p.status } });
        }
        if (scored.label === "hot" && lead.score_label !== "hot") await logEvent(tx, bid, "lead.hot", { leadId: id, actor: `user:${session.user.id}`, data: { score: scored.score } });
      }
    }
    const [fresh] = await tx`select * from leads where id = ${id} and business_id = ${bid}`;
    const conversations = await tx`select id, channel, status, handler, last_message_at, last_message_preview from conversations where lead_id = ${id} and business_id = ${bid} order by last_message_at desc nulls last`;
    const appointments = await tx`select * from appointments where lead_id = ${id} and business_id = ${bid} order by starts_at desc`;
    const events = await tx`select id, type, actor, data, created_at from events where lead_id = ${id} and business_id = ${bid} and type not in ('message.sent','message.received') order by created_at desc limit 30`;
    return { body: { lead: fresh, conversations, appointments, events } };
  });
});

// ---------- conversations ----------
route("conversations", ["GET"], {}, async ({ session, params }) => {
  const bid = session.businessId;
  const channel = params.get("channel");
  const handler = params.get("handler");
  const status = params.get("status") || "active";
  const q = str(params.get("q"), 100);
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  return tenant(bid, async (tx) => {
    const conversations = await tx`
      select c.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email, l.score, l.score_label, l.status as lead_status
      from conversations c left join leads l on l.id = c.lead_id
      where c.business_id = ${bid}
        ${CHANNELS.includes(channel) ? tx`and c.channel = ${channel}` : tx``}
        ${["ai", "human"].includes(handler) ? tx`and c.handler = ${handler}` : tx``}
        ${status === "active" ? tx`and c.status <> 'closed'` : ["open", "pending", "closed"].includes(status) ? tx`and c.status = ${status}` : tx``}
        ${q ? tx`and (c.customer_name ilike ${like} or l.name ilike ${like} or l.phone ilike ${like} or c.last_message_preview ilike ${like})` : tx``}
      order by c.last_message_at desc nulls last limit 100`;
    return { body: { conversations } };
  });
});

route("conversation", ["GET", "PATCH"], {}, async ({ session, method, params, body }) => {
  const bid = session.businessId;
  const id = params.get("id");
  if (!isUuid(id)) fail(400, "invalid_id");
  const conv = await tenant(bid, async (tx) => {
    const [c] = await tx`select * from conversations where id = ${id} and business_id = ${bid}`;
    if (!c) fail(404, "not_found");
    if (method === "PATCH") {
      const p = {};
      if ("status" in body) p.status = oneOf(body.status, ["open", "pending", "closed"], c.status);
      if ("handler" in body) {
        p.handler = oneOf(body.handler, ["ai", "human"], c.handler);
        if (p.handler !== c.handler) {
          p.human_since = p.handler === "human" ? new Date() : null;
          if (p.handler === "human") p.assigned_user_id = session.user.id;
          await logEvent(tx, bid, p.handler === "human" ? "conversation.takeover" : "conversation.ai_resumed", { conversationId: id, leadId: c.lead_id, actor: `user:${session.user.id}` });
        }
      }
      if (Object.keys(p).length) await tx`update conversations set ${tx(p)} where id = ${id} and business_id = ${bid}`;
    } else if (c.unread_count) {
      await tx`update conversations set unread_count = 0 where id = ${id} and business_id = ${bid}`;
    }
    return c;
  });
  // WhatsApp: the live webhook keeps its own handoff state in Redis; keep it in step with the inbox.
  if (method === "PATCH" && "handler" in body && conv.channel === "whatsapp" && body.handler !== conv.handler) {
    await setWhatsAppHandler(conv.external_id, body.handler);
  }
  return tenant(bid, async (tx) => {
    const [c] = await tx`select c.* from conversations c where c.id = ${id} and c.business_id = ${bid}`;
    const messages = await tx`select id, direction, sender, body, status, created_at, metadata from (select * from messages where conversation_id = ${id} and business_id = ${bid} order by created_at desc limit 300) m order by created_at`;
    const [lead] = c.lead_id ? await tx`select * from leads where id = ${c.lead_id} and business_id = ${bid}` : [null];
    return { body: { conversation: c, messages, lead: lead || null } };
  });
});

route("conversation/send", ["POST"], {}, async ({ session, body }) => {
  const bid = session.businessId;
  const id = body.id;
  const text = str(body.text, 4000);
  if (!isUuid(id)) fail(400, "invalid_id");
  if (!text) fail(400, "empty_message");
  await rateLimit(`send:${session.user.id}`, 60, 60);
  const conv = await tenant(bid, async (tx) => (await tx`select * from conversations where id = ${id} and business_id = ${bid}`)[0]);
  if (!conv) fail(404, "not_found");
  if (conv.channel === "whatsapp") {
    const r = await sendWhatsAppFromInbox(bid, conv, text, session.user.id);
    if (!r.ok) fail(502, r.error || "send_failed", r.detail);
  } else if (conv.channel === "website") {
    await tenant(bid, async (tx) => {
      await addMessage(tx, bid, conv, { direction: "out", sender: "human", body: text, metadata: { user_id: session.user.id } });
    });
  } else {
    fail(400, "channel_not_supported_yet");
  }
  // Replying as a person takes the conversation over (AI pauses) until AI is re-enabled.
  if (conv.handler !== "human") {
    await tenant(bid, async (tx) => {
      await tx`update conversations set handler = 'human', human_since = now(), assigned_user_id = ${session.user.id} where id = ${id} and business_id = ${bid}`;
      await logEvent(tx, bid, "conversation.takeover", { conversationId: id, leadId: conv.lead_id, actor: `user:${session.user.id}` });
    });
    if (conv.channel === "whatsapp") await setWhatsAppHandler(conv.external_id, "human");
  }
  await tenant(bid, async (tx) => {
    if (conv.lead_id) await tx`update leads set last_contact_at = now(), status = case when status = 'new' then 'contacted' else status end where id = ${conv.lead_id} and business_id = ${bid}`;
  });
  return { body: { ok: true } };
});

// ---------- knowledge base ----------
route("knowledge", ["GET", "POST"], {}, async ({ session, method, body }) => {
  const bid = session.businessId;
  return tenant(bid, async (tx) => {
    if (method === "POST") {
      requireManager({ session });
      const items = Array.isArray(body.items) ? body.items : [body];
      if (items.length > 50) fail(400, "too_many_items");
      const [{ n }] = await tx`select count(*)::int as n from knowledge_items where business_id = ${bid}`;
      if (n + items.length > 2000) fail(400, "knowledge_limit_reached");
      const created = [];
      for (const it of items) {
        const kind = oneOf(it.kind, KNOWLEDGE_KINDS, null);
        if (!kind) fail(400, "invalid_kind");
        const title = str(it.title, 200);
        const content = str(it.content, 8000);
        if (!content && !title) fail(400, "content_required");
        const [row] = await tx`insert into knowledge_items (business_id, kind, title, content, position) values (${bid}, ${kind}, ${title}, ${content}, ${int(it.position, 0, 10000, 0)}) returning *`;
        created.push(row);
      }
      return { status: 201, body: { items: created } };
    }
    const items = await tx`select * from knowledge_items where business_id = ${bid} order by kind, position, created_at`;
    const sources = await tx`select * from knowledge_sources where business_id = ${bid} order by created_at desc`;
    return { body: { items, sources, kinds: KNOWLEDGE_KINDS } };
  });
});

route("knowledge/item", ["PATCH", "DELETE"], {}, async ({ session, method, params, body }) => {
  requireManager({ session });
  const bid = session.businessId;
  const id = params.get("id");
  if (!isUuid(id)) fail(400, "invalid_id");
  return tenant(bid, async (tx) => {
    if (method === "DELETE") {
      const r = await tx`delete from knowledge_items where id = ${id} and business_id = ${bid}`;
      if (!r.count) fail(404, "not_found");
      return { body: { ok: true } };
    }
    const p = {};
    if ("kind" in body) p.kind = oneOf(body.kind, KNOWLEDGE_KINDS, "company");
    if ("title" in body) p.title = str(body.title, 200);
    if ("content" in body) p.content = str(body.content, 8000);
    if ("enabled" in body) p.enabled = bool(body.enabled);
    if ("position" in body) p.position = int(body.position, 0, 10000, 0);
    const [row] = Object.keys(p).length ? await tx`update knowledge_items set ${tx(p)} where id = ${id} and business_id = ${bid} returning *` : await tx`select * from knowledge_items where id = ${id} and business_id = ${bid}`;
    if (!row) fail(404, "not_found");
    return { body: { item: row } };
  });
});

// ---------- AI settings + sandbox ----------
route("ai-settings", ["GET", "PATCH"], {}, async ({ session, method, body }) => {
  const bid = session.businessId;
  if (method === "PATCH") requireManager({ session });
  return tenant(bid, async (tx) => {
    if (method === "PATCH") {
      const p = {};
      if ("enabled" in body) p.enabled = bool(body.enabled);
      if ("assistant_name" in body) p.assistant_name = str(body.assistant_name, 60) || "Assistant";
      if ("personality" in body) p.personality = oneOf(body.personality, PERSONALITIES, "friendly");
      if ("tone_notes" in body) p.tone_notes = str(body.tone_notes, 1000);
      if ("greeting" in body) p.greeting = str(body.greeting, 300);
      if ("custom_instructions" in body) p.custom_instructions = str(body.custom_instructions, 4000);
      if ("qualification" in body) p.qualification = tx.json(normaliseQualification(body.qualification));
      if ("scoring" in body) p.scoring = tx.json(normaliseScoring(body.scoring));
      if ("handoff" in body) p.handoff = tx.json({ on_request: bool(body.handoff?.on_request), on_complaint: bool(body.handoff?.on_complaint), on_unknown: bool(body.handoff?.on_unknown) });
      if (Object.keys(p).length) await tx`update ai_settings set ${tx(p)} where business_id = ${bid}`;
    }
    const [s] = await tx`select * from ai_settings where business_id = ${bid}`;
    return { body: { settings: aiSettingsOut(s), ai_available: !!process.env.ANTHROPIC_API_KEY } };
  });
});

route("ai/test", ["POST"], {}, async ({ session, body }) => {
  const bid = session.businessId;
  await rateLimit(`aitest:${bid}`, 30, 600);
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const history = msgs.map((m, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: str(m?.content, 2000) })).filter((m) => m.content);
  if (!history.length || history[history.length - 1].role !== "user") fail(400, "invalid_messages");
  const ctx = await tenant(bid, (tx) => loadAiContext(tx, bid));
  const captured = {};
  let handoff = null;
  const out = await runBusinessAgent({
    ...ctx, history, channel: "website",
    onTool: async (name, input) => {
      if (name === "save_lead_details") { const d = cleanLeadDetails(input); for (const [k, v] of Object.entries(d)) if (v) captured[k] = v; return { ok: true }; }
      if (name === "request_human") { handoff = str(input.reason, 200) || "requested"; return { ok: true }; }
      return { ok: false };
    },
  });
  if (!out.ok) fail(503, out.error || "ai_error");
  const score = scoreLead(captured, ctx.settings.scoring);
  return { body: { reply: out.reply, captured, score, handoff } };
});

// ---------- appointments ----------
route("appointments", ["GET", "POST"], {}, async ({ session, method, params, body }) => {
  const bid = session.businessId;
  return tenant(bid, async (tx) => {
    if (method === "POST") {
      const starts = isoDate(body.starts_at);
      if (!starts) fail(400, "invalid_starts_at");
      const ends = body.ends_at ? isoDate(body.ends_at) : null;
      if (ends === undefined) fail(400, "invalid_ends_at");
      const leadId = isUuid(body.lead_id) ? body.lead_id : null;
      if (leadId && !(await tx`select 1 from leads where id = ${leadId} and business_id = ${bid}`).length) fail(400, "invalid_lead");
      const [a] = await tx`insert into appointments (business_id, lead_id, title, starts_at, ends_at, status, location, notes, created_by)
        values (${bid}, ${leadId}, ${str(body.title, 200) || "Appointment"}, ${starts}, ${ends}, ${oneOf(body.status, ["requested", "confirmed"], "confirmed")}, ${str(body.location, 200)}, ${str(body.notes, 2000)}, 'human') returning *`;
      if (leadId) await tx`update leads set status = 'appointment' where id = ${leadId} and business_id = ${bid} and status in ('new','contacted','qualified')`;
      await logEvent(tx, bid, "appointment.created", { leadId, actor: `user:${session.user.id}`, data: { starts_at: starts } });
      return { status: 201, body: { appointment: a } };
    }
    const from = isoDate(params.get("from")) || new Date(Date.now() - 30 * 86400e3).toISOString();
    const to = isoDate(params.get("to")) || new Date(Date.now() + 120 * 86400e3).toISOString();
    const appointments = await tx`select a.*, l.name as lead_name, l.phone as lead_phone from appointments a left join leads l on l.id = a.lead_id
      where a.business_id = ${bid} and a.starts_at between ${from} and ${to} order by a.starts_at`;
    return { body: { appointments } };
  });
});

route("appointment", ["PATCH", "DELETE"], {}, async ({ session, method, params, body }) => {
  const bid = session.businessId;
  const id = params.get("id");
  if (!isUuid(id)) fail(400, "invalid_id");
  return tenant(bid, async (tx) => {
    if (method === "DELETE") { await tx`delete from appointments where id = ${id} and business_id = ${bid}`; return { body: { ok: true } }; }
    const p = {};
    if ("title" in body) p.title = str(body.title, 200);
    if ("status" in body) p.status = oneOf(body.status, ["requested", "confirmed", "cancelled", "completed", "no_show"], "confirmed");
    if ("starts_at" in body) { p.starts_at = isoDate(body.starts_at); if (!p.starts_at) fail(400, "invalid_starts_at"); }
    if ("location" in body) p.location = str(body.location, 200);
    if ("notes" in body) p.notes = str(body.notes, 2000);
    const [a] = Object.keys(p).length ? await tx`update appointments set ${tx(p)} where id = ${id} and business_id = ${bid} returning *` : [];
    if (!a) fail(404, "not_found");
    return { body: { appointment: a } };
  });
});

// ---------- automations ----------
route("automations", ["GET"], {}, async ({ session }) => tenant(session.businessId, async (tx) => ({
  body: { rules: await tx`select * from automation_rules where business_id = ${session.businessId} order by created_at`, templates: AUTOMATION_TEMPLATES },
})));

route("automation", ["PATCH"], {}, async ({ session, params, body }) => {
  requireManager({ session });
  const bid = session.businessId;
  const id = params.get("id");
  if (!isUuid(id)) fail(400, "invalid_id");
  return tenant(bid, async (tx) => {
    const p = {};
    if ("enabled" in body) p.enabled = bool(body.enabled);
    if ("name" in body) p.name = str(body.name, 120);
    if ("conditions" in body && body.conditions && typeof body.conditions === "object") p.conditions = tx.json({ hours: int(body.conditions.hours, 1, 720, 24) });
    const [r] = Object.keys(p).length ? await tx`update automation_rules set ${tx(p)} where id = ${id} and business_id = ${bid} returning *` : [];
    if (!r) fail(404, "not_found");
    return { body: { rule: r } };
  });
});

// ---------- integrations ----------
route("integrations", ["GET"], {}, async ({ session }) => {
  const bid = session.businessId;
  const rows = await tenant(bid, (tx) => tx`select id, provider, status, external_id, display_name, config, connected_at from integrations where business_id = ${bid}`);
  const [b] = await tenant(bid, (tx) => tx`select public_key, widget_allowed_origins, brand from businesses where id = ${bid}`);
  const wa = await linkableWhatsApp();
  return { body: { integrations: rows, widget: b, whatsapp_platform: { available: wa.configured, linked_elsewhere: wa.linkedBusinessId && wa.linkedBusinessId !== bid } } };
});

route("integrations/whatsapp/link", ["POST"], {}, async ({ session, body, ip }) => {
  requireManager({ session });
  await rateLimit(`walink:${ip}`, 5, 900);
  // Linking the live Dleading WhatsApp number needs the existing admin password (ADMIN_TOKEN),
  // so only the platform owner can attach it to a business.
  const expected = String(process.env.ADMIN_TOKEN || "").trim();
  const given = String(body.admin_password || "").trim();
  const ok = expected.length >= 24 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) fail(403, "wrong_admin_password");
  const wa = await linkableWhatsApp();
  if (!wa.configured || !wa.phoneNumberId) fail(400, "whatsapp_not_configured");
  const bid = session.businessId;
  await system(async (tx) => {
    // Move the number to this business (one business per number, enforced by a unique index).
    await tx`delete from integrations where provider = 'whatsapp' and external_id = ${wa.phoneNumberId} and business_id <> ${bid}`;
    await tx`insert into integrations (business_id, provider, status, external_id, display_name, connected_at, config)
             values (${bid}, 'whatsapp', 'connected', ${wa.phoneNumberId}, ${wa.displayName || "WhatsApp Business"}, now(), ${tx.json({ mode: "cloud_api" })})
             on conflict (business_id, provider) do update set status = 'connected', external_id = excluded.external_id, display_name = excluded.display_name, connected_at = now()`;
    await logEvent(tx, bid, "integration.connected", { actor: `user:${session.user.id}`, data: { provider: "whatsapp" } });
  });
  return { body: { ok: true } };
});

route("integrations/whatsapp/unlink", ["POST"], {}, async ({ session }) => {
  requireManager({ session });
  const bid = session.businessId;
  await tenant(bid, async (tx) => {
    await tx`delete from integrations where business_id = ${bid} and provider = 'whatsapp'`;
    await logEvent(tx, bid, "integration.disconnected", { actor: `user:${session.user.id}`, data: { provider: "whatsapp" } });
  });
  return { body: { ok: true } };
});

route("integrations/request", ["POST"], {}, async ({ session, body }) => {
  requireManager({ session });
  const provider = oneOf(body.provider, ["whatsapp", "facebook", "instagram", "email", "sms", "voice", "calendar"], null);
  if (!provider) fail(400, "invalid_provider");
  const bid = session.businessId;
  await tenant(bid, async (tx) => {
    await tx`insert into integrations (business_id, provider, status, display_name, config) values (${bid}, ${provider}, 'pending', '', ${tx.json({ requested_by: session.user.id, requested_at: new Date().toISOString() })})
             on conflict (business_id, provider) do nothing`;
    await logEvent(tx, bid, "integration.requested", { actor: `user:${session.user.id}`, data: { provider } });
  });
  return { body: { ok: true } };
});

// ---------- analytics ----------
route("analytics", ["GET"], {}, async ({ session, params }) => {
  const bid = session.businessId;
  const days = oneOf(int(params.get("days"), 7, 365, 30), [7, 30, 90, 365], 30);
  return tenant(bid, async (tx) => {
    const since = new Date(Date.now() - days * 86400e3);
    const leadsByDay = await tx`
      select to_char(d, 'YYYY-MM-DD') as day,
             (select count(*)::int from leads where business_id = ${bid} and created_at >= d and created_at < d + interval '1 day') as leads,
             (select count(*)::int from events where business_id = ${bid} and type = 'conversation.started' and created_at >= d and created_at < d + interval '1 day') as conversations
      from generate_series(date_trunc('day', ${since}::timestamptz), date_trunc('day', now()), interval '1 day') d order by d`;
    const bySource = await tx`select source, count(*)::int as n from leads where business_id = ${bid} and created_at >= ${since} group by source order by n desc`;
    const byStatus = await tx`select status, count(*)::int as n from leads where business_id = ${bid} and created_at >= ${since} group by status`;
    const byScore = await tx`select score_label, count(*)::int as n from leads where business_id = ${bid} and created_at >= ${since} group by score_label`;
    const byChannel = await tx`select channel, count(*)::int as n from conversations where business_id = ${bid} and created_at >= ${since} group by channel order by n desc`;
    const [m] = await tx`select count(*) filter (where direction = 'in')::int as inbound, count(*) filter (where sender = 'ai')::int as ai, count(*) filter (where sender = 'human')::int as human from messages where business_id = ${bid} and created_at >= ${since}`;
    const [h] = await tx`select count(*)::int as n from events where business_id = ${bid} and type in ('conversation.handoff','conversation.takeover') and created_at >= ${since}`;
    const total = byStatus.reduce((n, r) => n + r.n, 0);
    const won = byStatus.find((r) => r.status === "won")?.n || 0;
    return {
      body: {
        days, leads_by_day: leadsByDay, by_source: bySource, by_status: byStatus, by_score: byScore, by_channel: byChannel,
        messages: m, handoffs: h.n, total_leads: total, won, conversion_rate: total ? Math.round((won / total) * 1000) / 10 : 0,
        ai_share: m.ai + m.human ? Math.round((m.ai / (m.ai + m.human)) * 100) : 0,
      },
    };
  });
});
