-- Dleading Growth Engine: core multi-business schema (Phase 1).
-- Additive only. Every tenant table carries business_id; row-level security is the
-- second wall behind the API's own business_id scoping (see api/_lib/db.js).

create extension if not exists pgcrypto;

-- ---------- helpers used by row-level security ----------
-- The API sets these per transaction with set_config(..., true).
create or replace function app_business_id() returns uuid
  language sql stable as $$ select nullif(current_setting('app.business_id', true), '')::uuid $$;
create or replace function app_is_system() returns boolean
  language sql stable as $$ select coalesce(current_setting('app.system', true), '') = 'on' $$;

create or replace function touch_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- plans (placeholders, no billing yet) ----------
create table plans (
  id          text primary key,
  name        text not null,
  price_pence integer not null,
  currency    text not null default 'GBP',
  interval    text not null default 'month',
  limits      jsonb not null default '{}',
  features    jsonb not null default '[]',
  sort        integer not null default 0,
  is_public   boolean not null default true
);
insert into plans (id, name, price_pence, limits, features, sort) values
  ('starter', 'Starter', 4900, '{"users":2,"conversations_per_month":500,"knowledge_items":100,"channels":2}', '["AI assistant","Website chat","WhatsApp","Lead CRM"]', 1),
  ('growth',  'Growth',  9900, '{"users":5,"conversations_per_month":2000,"knowledge_items":500,"channels":4}', '["Everything in Starter","Automations","Appointments","Analytics"]', 2),
  ('pro',     'Pro',    19900, '{"users":15,"conversations_per_month":10000,"knowledge_items":2000,"channels":6}', '["Everything in Growth","Priority support","Advanced analytics"]', 3);

-- ---------- businesses (tenants) ----------
create table businesses (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null check (length(name) between 1 and 120),
  slug                    text not null unique,
  industry                text not null default '',
  website                 text not null default '',
  description             text not null default '',
  services                jsonb not null default '[]',   -- [{name, description, price}]
  opening_hours           jsonb not null default '{}',   -- {mon:{open,close,closed}, ...}
  contact                 jsonb not null default '{}',   -- {phone, email, address, whatsapp}
  timezone                text not null default 'Europe/London',
  brand                   jsonb not null default '{}',   -- {primary_color, logo_url}
  plan_id                 text not null default 'starter' references plans(id),
  status                  text not null default 'active' check (status in ('active','suspended','closed')),
  onboarding_step         integer not null default 1,
  onboarding_completed_at timestamptz,
  public_key              text not null unique default ('pk_' || encode(gen_random_bytes(12), 'hex')),
  widget_allowed_origins  text[] not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ---------- users, memberships, sessions ----------
create table users (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  name              text not null default '',
  password_hash     text not null,
  is_platform_admin boolean not null default false,
  created_at        timestamptz not null default now(),
  last_login_at     timestamptz
);
create unique index users_email_key on users (lower(email));

create table memberships (
  business_id uuid not null references businesses(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner','admin','agent')),
  created_at  timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index memberships_user_idx on memberships (user_id);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  user_id     uuid not null references users(id) on delete cascade,
  business_id uuid references businesses(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  ip          text not null default '',
  user_agent  text not null default ''
);
create index sessions_user_idx on sessions (user_id);

-- ---------- AI configuration ----------
create table ai_settings (
  business_id        uuid primary key references businesses(id) on delete cascade,
  enabled            boolean not null default true,
  assistant_name     text not null default 'Assistant',
  personality        text not null default 'friendly',  -- friendly | professional | concise | warm | custom
  tone_notes         text not null default '',
  greeting           text not null default 'Hi! How can I help you today?',
  custom_instructions text not null default '',
  qualification      jsonb not null default '{}',       -- which details to collect
  scoring            jsonb not null default '{}',       -- weights + cold/warm/hot thresholds
  handoff            jsonb not null default '{}',       -- when to hand to a human
  model              text not null default '',
  updated_at         timestamptz not null default now()
);

-- ---------- knowledge base ----------
-- knowledge_sources is the hook for later documents / website crawls; manual items have no source.
create table knowledge_sources (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  type        text not null check (type in ('manual','document','website')),
  name        text not null default '',
  url         text not null default '',
  status      text not null default 'ready' check (status in ('pending','processing','ready','error')),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index knowledge_sources_biz_idx on knowledge_sources (business_id);

create table knowledge_items (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  source_id   uuid references knowledge_sources(id) on delete cascade,
  kind        text not null check (kind in ('company','service','price','faq','hours','location','policy','contact','instruction','document','web_page')),
  title       text not null default '',
  content     text not null default '',
  metadata    jsonb not null default '{}',
  enabled     boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index knowledge_items_biz_idx on knowledge_items (business_id, kind, position);

-- ---------- leads ----------
create table leads (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null default '',
  phone             text not null default '',
  email             text not null default '',
  source            text not null default 'manual' check (source in ('whatsapp','website','facebook','instagram','voice','email','sms','manual','import','other')),
  service_interest  text not null default '',
  location          text not null default '',
  budget            text not null default '',
  preferred_date    text not null default '',
  urgency           text not null default '' check (urgency in ('','low','medium','high')),
  ready_to_book     boolean not null default false,
  status            text not null default 'new' check (status in ('new','contacted','qualified','appointment','won','lost')),
  score             integer not null default 0 check (score between 0 and 100),
  score_label       text not null default 'cold' check (score_label in ('cold','warm','hot')),
  qualification     jsonb not null default '{}',
  notes             text not null default '',
  value_pence       integer,
  last_contact_at   timestamptz,
  next_follow_up_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index leads_biz_created_idx on leads (business_id, created_at desc);
create index leads_biz_status_idx on leads (business_id, status);
create index leads_biz_phone_idx on leads (business_id, phone) where phone <> '';
create index leads_biz_followup_idx on leads (business_id, next_follow_up_at) where next_follow_up_at is not null;

-- ---------- conversations + messages ----------
create table conversations (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references businesses(id) on delete cascade,
  lead_id              uuid references leads(id) on delete set null,
  channel              text not null check (channel in ('whatsapp','website','facebook','instagram','voice','email','sms')),
  external_id          text not null,               -- WhatsApp number, widget visitor id, PSID, call id…
  customer_name        text not null default '',
  status               text not null default 'open' check (status in ('open','pending','closed')),
  handler              text not null default 'ai' check (handler in ('ai','human')),
  human_since          timestamptz,
  assigned_user_id     uuid references users(id) on delete set null,
  unread_count         integer not null default 0,
  last_message_at      timestamptz,
  last_message_preview text not null default '',
  metadata             jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (business_id, channel, external_id)
);
create index conversations_biz_last_idx on conversations (business_id, last_message_at desc nulls last);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction       text not null check (direction in ('in','out')),
  sender          text not null check (sender in ('customer','ai','human','system','auto')),
  body            text not null default '',
  external_id     text,                               -- WhatsApp wamid etc.
  status          text not null default '',
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on messages (conversation_id, created_at);
create unique index messages_external_key on messages (business_id, external_id) where external_id is not null;

-- ---------- appointments ----------
create table appointments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  lead_id         uuid references leads(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  title           text not null default '',
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  status          text not null default 'requested' check (status in ('requested','confirmed','cancelled','completed','no_show')),
  location        text not null default '',
  notes           text not null default '',
  created_by      text not null default 'human',      -- human | ai | voice
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index appointments_biz_start_idx on appointments (business_id, starts_at);

-- ---------- automation rules (stored now, executed from Phase 2) ----------
create table automation_rules (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  trigger     text not null check (trigger in ('lead_created','lead_hot','no_reply','follow_up_due','appointment_booked','conversation_handoff','lead_status_changed')),
  conditions  jsonb not null default '{}',
  actions     jsonb not null default '[]',            -- [{type:"notify_team"|"send_message"|"set_status"|..., ...}]
  enabled     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index automation_rules_biz_idx on automation_rules (business_id);

-- ---------- integrations ----------
-- Holds non-secret settings only. Tokens stay in server env / Redis, never here in plain text.
create table integrations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  provider     text not null check (provider in ('whatsapp','website_widget','facebook','instagram','email','sms','voice','calendar','n8n')),
  status       text not null default 'pending' check (status in ('pending','connected','disconnected','error')),
  external_id  text,                                   -- e.g. WhatsApp phone_number_id
  display_name text not null default '',
  config       jsonb not null default '{}',
  connected_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (business_id, provider)
);
-- One external account (e.g. one WhatsApp number) can only ever belong to one business.
create unique index integrations_external_key on integrations (provider, external_id) where external_id is not null;

-- ---------- analytics events ----------
create table events (
  id              bigserial primary key,
  business_id     uuid not null references businesses(id) on delete cascade,
  type            text not null,                      -- lead.created, message.received, conversation.handoff, …
  lead_id         uuid references leads(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  actor           text not null default 'system',     -- system | ai | user:<id> | customer
  data            jsonb not null default '{}',
  created_at      timestamptz not null default now()
);
create index events_biz_created_idx on events (business_id, created_at desc);
create index events_biz_type_idx on events (business_id, type, created_at desc);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['businesses','knowledge_sources','knowledge_items','leads','conversations','appointments','automation_rules','integrations','ai_settings'] loop
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------- row-level security ----------
do $$
declare t text;
begin
  foreach t in array array['ai_settings','knowledge_sources','knowledge_items','leads','conversations','messages','appointments','automation_rules','integrations','events','memberships'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy tenant_isolation on %I using (app_is_system() or business_id = app_business_id()) with check (app_is_system() or business_id = app_business_id())', t);
  end loop;
end $$;

alter table businesses enable row level security;
alter table businesses force row level security;
create policy tenant_isolation on businesses
  using (app_is_system() or id = app_business_id()) with check (app_is_system() or id = app_business_id());

-- Accounts and sessions are only touched by the auth code (system mode).
alter table users enable row level security;
alter table users force row level security;
create policy system_only on users using (app_is_system()) with check (app_is_system());
alter table sessions enable row level security;
alter table sessions force row level security;
create policy system_only on sessions using (app_is_system()) with check (app_is_system());

alter table plans enable row level security;
alter table plans force row level security;
create policy read_all on plans for select using (true);
create policy system_write on plans using (app_is_system()) with check (app_is_system());

-- Supabase exposes the public schema to browser keys; this app never uses them, so lock them out.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on all tables in schema public from anon';
    execute 'revoke all on all sequences in schema public from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on all tables in schema public from authenticated';
    execute 'revoke all on all sequences in schema public from authenticated';
  end if;
end $$;
