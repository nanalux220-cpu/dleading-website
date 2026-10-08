// Settings: business profile, team, plan and account.
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Check, Clock, CreditCard, Info, Lock, LogOut, Mail, MapPin, MessageCircle, Phone, Plus, RefreshCw, Save, Sparkles, Trash2, UserPlus, Users, Wrench,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { canManage, useAuth, type Business } from "../auth";
import { fmtDate } from "../format";
import { Alert, Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, PageLoader, Select, Tabs, Textarea, Toggle, cn, useLoad, useToast } from "../ui";

type Plan = { id: string; name: string; price_pence: number; currency: string; interval: string; limits: Record<string, number>; features: string[]; sort: number };
type Member = { id: string; name: string; email: string; role: "owner" | "admin" | "agent"; created_at: string };
type Tab = "profile" | "team" | "plan" | "account";

const MANAGER_HINT = "Only owners and admins can change these settings.";

export default function Settings() {
  const [tab, setTab] = useState<Tab>("profile");
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your business details, team, plan and account." />
      <div className="mb-6">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { value: "profile", label: "Business profile" },
            { value: "team", label: "Team" },
            { value: "plan", label: "Plan" },
            { value: "account", label: "Account" },
          ]}
        />
      </div>
      {tab === "profile" && <ProfileTab />}
      {tab === "team" && <TeamTab />}
      {tab === "plan" && <PlanTab />}
      {tab === "account" && <AccountTab />}
    </div>
  );
}

function LoadError({ error, reload, what }: { error: unknown; reload: () => void; what: string }) {
  return (
    <Card>
      <EmptyState icon={<Info className="w-5 h-5" />} title={`We couldn't load ${what}`} action={<Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={reload}>Try again</Button>}>
        {errorMessage(error)}
      </EmptyState>
    </Card>
  );
}

// ======================================================================
//  Business profile
// ======================================================================
const DAYS = [
  { key: "mon", label: "Monday" }, { key: "tue", label: "Tuesday" }, { key: "wed", label: "Wednesday" }, { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" }, { key: "sat", label: "Saturday" }, { key: "sun", label: "Sunday" },
] as const;
const TIMEZONES = [
  "Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Amsterdam", "Africa/Accra", "Africa/Lagos",
  "Africa/Johannesburg", "Africa/Nairobi", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "America/New_York",
  "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto",
];
type Hours = Business["opening_hours"];
type Service = Business["services"][number];
type ProfileForm = {
  name: string; industry: string; website: string; description: string; timezone: string;
  services: Service[]; opening_hours: Hours; contact: Required<Business["contact"]>;
};

const toForm = (b: Business): ProfileForm => {
  const hours: Hours = {};
  for (const d of DAYS) {
    const h = b.opening_hours?.[d.key];
    hours[d.key] = h ? { open: h.open || "09:00", close: h.close || "17:00", closed: !!h.closed } : { open: "09:00", close: "17:00", closed: d.key === "sun" };
  }
  return {
    name: b.name || "", industry: b.industry || "", website: b.website || "", description: b.description || "", timezone: b.timezone || "Europe/London",
    services: (b.services || []).map((s) => ({ name: s.name || "", price: s.price || "", description: s.description || "" })),
    opening_hours: hours,
    contact: { phone: b.contact?.phone || "", email: b.contact?.email || "", address: b.contact?.address || "", whatsapp: b.contact?.whatsapp || "" },
  };
};

function ProfileTab() {
  const { data, error, reload } = useLoad(() => api<{ business: Business; plan: Plan | null }>("business"), []);
  if (error && !data) return <LoadError error={error} reload={reload} what="your business profile" />;
  if (!data) return <PageLoader />;
  return <ProfileForm key={data.business.id} business={data.business} />;
}

function ProfileForm({ business }: { business: Business }) {
  const { me, setBusiness } = useAuth();
  const toast = useToast();
  const manager = canManage(me);
  const [saved, setSaved] = useState(() => toForm(business));
  const [f, setF] = useState(saved);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(f) !== JSON.stringify(saved), [f, saved]);
  const timezones = TIMEZONES.includes(f.timezone) ? TIMEZONES : [f.timezone, ...TIMEZONES];

  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const setContact = (k: keyof ProfileForm["contact"], v: string) => setF((x) => ({ ...x, contact: { ...x.contact, [k]: v } }));
  const setDay = (d: string, patch: Partial<Hours[string]>) => setF((x) => ({ ...x, opening_hours: { ...x.opening_hours, [d]: { ...x.opening_hours[d], ...patch } } }));
  const setService = (i: number, patch: Partial<Service>) => setF((x) => ({ ...x, services: x.services.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const save = async () => {
    if (!f.name.trim()) { toast("Please enter your business name.", "error"); return; }
    const badHours = DAYS.find((d) => { const h = f.opening_hours[d.key]; return !h.closed && h.open >= h.close; });
    if (badHours) { toast(`${badHours.label}: closing time must be after opening time.`, "error"); return; }
    setSaving(true);
    try {
      const body = { ...f, services: f.services.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), price: (s.price || "").trim(), description: (s.description || "").trim() })) };
      const r = await api<{ business: Business }>("business", { method: "PATCH", body });
      setBusiness(r.business);
      const next = toForm(r.business);
      setSaved(next);
      setF(next);
      toast("Business profile saved");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const dis = !manager;
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4 pb-20">
      {!manager && <Alert tone="info" className="flex items-center gap-2"><Lock className="w-4 h-4 shrink-0" />{MANAGER_HINT} You can still view them.</Alert>}
      <p className="text-sm text-gray-500 flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-500 shrink-0" />Your AI assistant uses these details to answer customers accurately, so keep them up to date.</p>

      <Section icon={<Building2 className="w-4 h-4" />} title="About your business">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name"><Input value={f.name} onChange={(e) => set("name", e.target.value)} disabled={dis} required maxLength={120} /></Field>
          <Field label="Industry"><Input value={f.industry} onChange={(e) => set("industry", e.target.value)} disabled={dis} placeholder="e.g. Beauty salon, Plumbing, Dental clinic" maxLength={80} /></Field>
          <Field label="Website"><Input value={f.website} onChange={(e) => set("website", e.target.value)} disabled={dis} placeholder="https://www.yourbusiness.co.uk" inputMode="url" /></Field>
          <Field label="Time zone" hint="Used for opening hours and appointment times.">
            <Select value={f.timezone} onChange={(e) => set("timezone", e.target.value)} disabled={dis}>
              {timezones.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2" hint="A few sentences about what you do, who you serve and what makes you different.">
            <Textarea rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} disabled={dis} maxLength={3000} placeholder="We're a family-run salon in Manchester offering…" />
          </Field>
        </div>
      </Section>

      <Section
        icon={<Wrench className="w-4 h-4" />}
        title="Services"
        subtitle="What you offer and how much it costs."
        action={<Button type="button" variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} disabled={dis || f.services.length >= 50} onClick={() => set("services", [...f.services, { name: "", price: "", description: "" }])}>Add service</Button>}
      >
        {f.services.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            No services yet. Add your main services so the AI can tell customers what you offer and quote prices.
          </div>
        ) : (
          <ul className="space-y-3">
            {f.services.map((s, i) => (
              <li key={i} className="rounded-lg border border-gray-200 p-3 sm:p-4 bg-gray-50/40">
                <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] items-start">
                  <Field label="Service name"><Input value={s.name} onChange={(e) => setService(i, { name: e.target.value })} disabled={dis} placeholder="e.g. Boiler service" maxLength={120} /></Field>
                  <Field label="Price"><Input value={s.price || ""} onChange={(e) => setService(i, { price: e.target.value })} disabled={dis} placeholder="e.g. £80 or From £50" maxLength={80} /></Field>
                  <Button type="button" variant="ghost" size="sm" aria-label="Remove service" title="Remove service" disabled={dis} onClick={() => set("services", f.services.filter((_, j) => j !== i))} className="sm:mt-7 justify-self-end text-gray-400 hover:text-red-600" icon={<Trash2 className="w-4 h-4" />}><span className="sm:hidden">Remove</span></Button>
                </div>
                <Field label="Description (optional)" className="mt-3"><Input value={s.description || ""} onChange={(e) => setService(i, { description: e.target.value })} disabled={dis} placeholder="What's included, how long it takes…" maxLength={500} /></Field>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={<Clock className="w-4 h-4" />} title="Opening hours" subtitle="Outside these hours the AI still replies and lets customers know when you're open.">
        <ul className="divide-y divide-gray-100">
          {DAYS.map((d) => {
            const h = f.opening_hours[d.key];
            return (
              <li key={d.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
                <span className="w-24 text-sm font-medium text-gray-900">{d.label}</span>
                <Toggle checked={!h.closed} onChange={(v) => setDay(d.key, { closed: !v })} disabled={dis} label={<span className="w-12 inline-block">{h.closed ? "Closed" : "Open"}</span>} />
                {!h.closed && (
                  <div className="flex items-center gap-2">
                    <Input type="time" aria-label={`${d.label} opening time`} value={h.open} onChange={(e) => setDay(d.key, { open: e.target.value })} disabled={dis} className="w-[120px]" />
                    <span className="text-sm text-gray-400">to</span>
                    <Input type="time" aria-label={`${d.label} closing time`} value={h.close} onChange={(e) => setDay(d.key, { close: e.target.value })} disabled={dis} className={cn("w-[120px]", h.open >= h.close && "border-red-300")} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section icon={<Phone className="w-4 h-4" />} title="Contact details" subtitle="Shared with customers when they ask how to reach you.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />Phone</span>}><Input type="tel" value={f.contact.phone} onChange={(e) => setContact("phone", e.target.value)} disabled={dis} placeholder="+44 20 7946 0000" /></Field>
          <Field label={<span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />Email</span>}><Input type="email" value={f.contact.email} onChange={(e) => setContact("email", e.target.value)} disabled={dis} placeholder="hello@yourbusiness.co.uk" /></Field>
          <Field label={<span className="inline-flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-gray-400" />WhatsApp number</span>}><Input type="tel" value={f.contact.whatsapp} onChange={(e) => setContact("whatsapp", e.target.value)} disabled={dis} placeholder="+44 7700 900000" /></Field>
          <Field label={<span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" />Address</span>}><Input value={f.contact.address} onChange={(e) => setContact("address", e.target.value)} disabled={dis} placeholder="12 High Street, Leeds LS1 4AB" maxLength={300} /></Field>
        </div>
      </Section>

      {manager && (
        <div className="sticky bottom-0 z-10 -mx-1 px-1">
          <div className={cn("flex items-center justify-between gap-3 rounded-xl border bg-white/95 backdrop-blur px-4 py-3 shadow-lg transition", dirty ? "border-orange-200" : "border-gray-200")}>
            <span className="text-sm text-gray-600">{dirty ? "You have unsaved changes." : "All changes saved."}</span>
            <div className="flex gap-2">
              {dirty && <Button type="button" variant="ghost" onClick={() => setF(saved)} disabled={saving}>Discard</Button>}
              <Button type="submit" icon={<Save className="w-4 h-4" />} loading={saving} disabled={!dirty}>Save changes</Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Section({ icon, title, subtitle, action, children }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={<span className="inline-flex items-center gap-2"><span className="text-gray-400">{icon}</span>{title}</span>} subtitle={subtitle} action={action} />
      <div className="px-5 pb-5 pt-1">{children}</div>
    </Card>
  );
}

// ======================================================================
//  Team
// ======================================================================
const ROLE: Record<Member["role"], { label: string; tone: "orange" | "violet" | "gray"; text: string }> = {
  owner: { label: "Owner", tone: "orange", text: "Full access, including billing" },
  admin: { label: "Admin", tone: "violet", text: "Manages settings and integrations" },
  agent: { label: "Agent", tone: "gray", text: "Handles conversations and leads" },
};

function TeamTab() {
  const { me } = useAuth();
  const { data, error, reload } = useLoad(() => api<{ members: Member[] }>("team"), []);
  if (error && !data) return <LoadError error={error} reload={reload} what="your team" />;
  if (!data) return <PageLoader />;
  const members = data.members;
  return (
    <Card>
      <CardHeader
        title="Team members"
        subtitle={`${members.length} ${members.length === 1 ? "person has" : "people have"} access to this business`}
        action={
          <div className="flex flex-col items-end gap-1">
            <Button size="sm" icon={<UserPlus className="w-4 h-4" />} disabled title="Inviting team members is coming soon">Invite team member</Button>
            <span className="text-[11px] text-gray-400">Coming soon</span>
          </div>
        }
      />
      {members.length === 0 ? (
        <EmptyState icon={<Users className="w-5 h-5" />} title="No team members found">Team members you invite will appear here.</EmptyState>
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {members.map((m) => {
            const r = ROLE[m.role] || ROLE.agent;
            const you = m.id === me?.user?.id;
            return (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={m.name || m.email} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{m.name || m.email}{you && <span className="ml-1.5 text-xs font-normal text-gray-400">(you)</span>}</div>
                  <div className="text-[13px] text-gray-500 truncate">{m.email}</div>
                </div>
                <div className="hidden md:block text-xs text-gray-400 w-48 text-right">{r.text}</div>
                <div className="hidden sm:block text-xs text-gray-400 w-28 text-right">Joined {fmtDate(m.created_at)}</div>
                <Badge tone={r.tone}>{r.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
      <div className="px-5 py-3.5 border-t border-gray-100 text-[13px] text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
        Inviting colleagues is coming soon. Until then, contact Dleading if you need someone added to your workspace.
      </div>
    </Card>
  );
}

// ======================================================================
//  Plan
// ======================================================================
const gbp = (pence: number, currency = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: pence % 100 ? 2 : 0 }).format(pence / 100);
const LIMIT_LABEL: Record<string, (n: number) => string> = {
  users: (n) => `${n} team member${n === 1 ? "" : "s"}`,
  conversations_per_month: (n) => `${n.toLocaleString("en-GB")} conversations a month`,
  knowledge_items: (n) => `${n.toLocaleString("en-GB")} knowledge items`,
  channels: (n) => `${n} channel${n === 1 ? "" : "s"}`,
};

function PlanTab() {
  const { data, error, reload } = useLoad(() => Promise.all([api<{ business: Business; plan: Plan | null }>("business"), api<{ plans: Plan[] }>("plans")]), []);
  if (error && !data) return <LoadError error={error} reload={reload} what="plans" />;
  if (!data) return <PageLoader />;
  const [{ plan: current, business }, { plans }] = data;
  const currentId = current?.id || business.plan_id;
  return (
    <div className="space-y-4">
      <Alert tone="info" className="flex items-start gap-2.5">
        <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
        <span><strong className="font-semibold">Plans and billing are coming soon.</strong> You're on the {current?.name || "Starter"} plan during early access, and you won't be charged.</span>
      </Alert>
      {plans.length === 0 ? (
        <Card><EmptyState icon={<CreditCard className="w-5 h-5" />} title="No plans available">Plan details will appear here once billing launches.</EmptyState></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === currentId;
            return (
              <Card key={p.id} className={cn("p-5 flex flex-col relative", isCurrent && "border-orange-300 ring-2 ring-orange-100")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                  {isCurrent && <Badge tone="orange" dot>Current plan</Badge>}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-gray-900">{gbp(p.price_pence, p.currency || "GBP")}</span>
                  <span className="text-sm text-gray-500">/ {p.interval || "month"}</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-gray-700 flex-1">
                  {(p.features || []).map((ft) => (
                    <li key={ft} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />{ft}</li>
                  ))}
                </ul>
                {Object.keys(p.limits || {}).length > 0 && (
                  <ul className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-[13px] text-gray-500">
                    {Object.entries(p.limits).map(([k, v]) => <li key={k}>{LIMIT_LABEL[k] ? LIMIT_LABEL[k](v) : `${k.replace(/_/g, " ")}: ${v}`}</li>)}
                  </ul>
                )}
                <Button variant={isCurrent ? "secondary" : "dark"} className="mt-5 w-full" disabled title={isCurrent ? undefined : "Changing plans is coming soon"}>
                  {isCurrent ? "Your current plan" : "Coming soon"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-400">Prices are per month. You will be able to change plans here once billing goes live.</p>
    </div>
  );
}

// ======================================================================
//  Account
// ======================================================================
function AccountTab() {
  const { me, refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const role = me?.role ? ROLE[me.role] : null;
  const signOut = async () => {
    setBusy(true);
    try {
      await api("auth/logout", { method: "POST" });
    } catch (e) {
      toast(errorMessage(e), "error");
    }
    await refresh();
    nav("/app/login");
  };
  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader title="Your account" subtitle="The details you sign in with." />
        <div className="px-5 pb-5 flex items-center gap-4">
          <Avatar name={me?.user?.name || me?.user?.email} size={48} />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-gray-900 truncate">{me?.user?.name || "—"}</div>
            <div className="text-sm text-gray-500 truncate">Signed in as <span className="text-gray-800 font-medium">{me?.user?.email}</span></div>
            {role && <div className="mt-1.5 flex items-center gap-2"><Badge tone={role.tone}>{role.label}</Badge><span className="text-xs text-gray-400">at {me?.business?.name}</span></div>}
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Sign out" subtitle="Sign out of the Growth Engine on this device." />
        <div className="px-5 pb-5">
          <Button variant="danger" icon={<LogOut className="w-4 h-4" />} loading={busy} onClick={signOut}>Sign out</Button>
        </div>
      </Card>
    </div>
  );
}
