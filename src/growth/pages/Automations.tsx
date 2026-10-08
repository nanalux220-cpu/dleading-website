import { useState, type ReactNode } from "react";
import {
  Zap, Flame, UserPlus, Clock, CalendarClock, CalendarCheck, Hand, ArrowRightLeft, Mail, MessageSquare, Filter, ArrowRight,
  Rocket, Lock, Star, RefreshCw, BellRing, Workflow,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { useAuth, canManage } from "../auth";
import { Alert, Badge, Button, Card, EmptyState, Input, PageHeader, Skeleton, Toggle, cn, useLoad, useToast } from "../ui";

type Action = { type: string; channel?: string; template?: string };
type Rule = { id: string; name: string; trigger: string; conditions: { hours?: number }; actions: Action[]; enabled: boolean; updated_at?: string };
type Template = { key: string; name: string; trigger: string; conditions: { hours?: number }; actions: Action[]; description: string };

const TRIGGERS: Record<string, { icon: typeof Zap; when: string; tone: string }> = {
  lead_hot: { icon: Flame, when: "A lead becomes Hot", tone: "bg-red-50 text-red-600 ring-red-100" },
  lead_created: { icon: UserPlus, when: "A new lead comes in", tone: "bg-sky-50 text-sky-600 ring-sky-100" },
  no_reply: { icon: Clock, when: "The customer stops replying", tone: "bg-amber-50 text-amber-600 ring-amber-100" },
  follow_up_due: { icon: CalendarClock, when: "A follow-up is due", tone: "bg-violet-50 text-violet-600 ring-violet-100" },
  appointment_booked: { icon: CalendarCheck, when: "An appointment is booked", tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  conversation_handoff: { icon: Hand, when: "The AI hands over to a person", tone: "bg-orange-50 text-orange-600 ring-orange-100" },
  lead_status_changed: { icon: ArrowRightLeft, when: "A lead changes stage", tone: "bg-gray-100 text-gray-600 ring-gray-200" },
};

function actionText(a: Action) {
  if (a.type === "notify_team") return { icon: Mail, text: `Email your team` };
  if (a.type === "send_message") return { icon: MessageSquare, text: "Send the customer a follow-up message" };
  if (a.type === "set_status") return { icon: ArrowRightLeft, text: "Update the lead's stage" };
  return { icon: Zap, text: a.type.replace(/_/g, " ") };
}

const UPCOMING = [
  { icon: BellRing, title: "Appointment reminders", text: "Text customers the day before their appointment to cut no-shows." },
  { icon: Star, title: "Review requests", text: "Ask happy customers for a Google review after a job is marked Won." },
  { icon: RefreshCw, title: "Win back cold leads", text: "Check in with leads who went quiet a few weeks ago." },
];

export default function Automations() {
  const { me } = useAuth();
  const manager = canManage(me);
  const toast = useToast();
  const { data, loading, error, reload, setData } = useLoad(() => api<{ rules: Rule[]; templates: Template[] }>("automations"), []);
  const rules = data?.rules || [];
  const templates = data?.templates || [];
  const onCount = rules.filter((r) => r.enabled).length;

  const replace = (rule: Rule) => setData((d) => (d ? { ...d, rules: d.rules.map((r) => (r.id === rule.id ? rule : r)) } : d));

  async function patch(rule: Rule, body: Partial<Pick<Rule, "enabled" | "conditions">>, success?: string) {
    replace({ ...rule, ...body });
    try {
      const res = await api<{ rule: Rule }>("automation", { method: "PATCH", params: { id: rule.id }, body });
      replace(res.rule);
      if (success) toast(success);
    } catch (e) {
      replace(rule);
      toast(errorMessage(e), "error");
    }
  }

  return (
    <div>
      <PageHeader title="Automations" subtitle="Simple rules that follow up and keep your team in the loop, so no lead slips through the cracks." />

      <div className="relative overflow-hidden rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-white p-4 sm:p-5 mb-6">
        <div className="flex gap-3.5">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/30"><Rocket className="w-5 h-5" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] font-semibold text-gray-900">Automations are being switched on in the next release</h2>
              <Badge tone="orange">Coming soon</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed max-w-3xl">
              You can choose which ones you want now and they'll start working automatically once email/SMS sending is connected. Until then, nothing is sent to your team or your customers.
            </p>
          </div>
        </div>
      </div>

      <HowItWorks />

      {!manager && <Alert tone="info" className="mb-6 flex items-center gap-2"><Lock className="w-4 h-4 shrink-0" />Only owners and admins can switch automations on or off.</Alert>}

      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Your automations</h2>
        {!loading && !error && rules.length > 0 && <span className="text-[13px] text-gray-500"><span className="tabular-nums font-medium text-gray-700">{onCount}</span> of {rules.length} chosen</span>}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Card key={i} className="p-5 space-y-3"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /></Card>)}</div>
      ) : error ? (
        <Alert tone="error" className="flex items-center justify-between gap-3">
          <span>{errorMessage(error)}</span>
          <Button size="sm" variant="secondary" onClick={reload}>Try again</Button>
        </Alert>
      ) : rules.length === 0 ? (
        <Card><EmptyState icon={<Workflow className="w-5 h-5" />} title="No automations yet">Your starter automations will appear here. If you've just created your workspace, refresh the page in a moment.</EmptyState></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((r) => (
            <RuleCard key={r.id} rule={r} template={templates.find((t) => t.trigger === r.trigger && t.name === r.name) || templates.find((t) => t.trigger === r.trigger)} manager={manager} onPatch={patch} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">On the roadmap</h2>
        <p className="text-[13px] text-gray-500 mb-3">More automations we're adding once messaging is live.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {UPCOMING.map((u) => (
            <div key={u.title} className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-4">
              <div className="flex items-center gap-2">
                <u.icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">{u.title}</span>
              </div>
              <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{u.text}</p>
              <Badge tone="gray" className="mt-3">Coming soon</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule, template, manager, onPatch }: { rule: Rule; template?: Template; manager: boolean; onPatch: (r: Rule, body: Partial<Pick<Rule, "enabled" | "conditions">>, success?: string) => Promise<void> }) {
  const t = TRIGGERS[rule.trigger] || { icon: Zap, when: rule.trigger, tone: "bg-gray-100 text-gray-600 ring-gray-200" };
  const hours = rule.conditions?.hours ?? 24;
  const [hoursDraft, setHoursDraft] = useState(String(hours));
  const [lastHours, setLastHours] = useState(hours);
  if (lastHours !== hours) { setLastHours(hours); setHoursDraft(String(hours)); }
  const actions = rule.actions?.length ? rule.actions : template?.actions || [];
  const description = rule.trigger === "no_reply"
    ? `Send a friendly follow-up ${hours} ${hours === 1 ? "hour" : "hours"} after the customer stops replying.`
    : template?.description || "";

  function commitHours() {
    const n = Math.round(Number(hoursDraft));
    if (!Number.isFinite(n) || n < 1 || n > 720) { setHoursDraft(String(hours)); return; }
    if (n !== hours) onPatch(rule, { conditions: { hours: n } }, "Follow-up time updated");
  }

  return (
    <Card className={cn("flex flex-col transition", rule.enabled && "border-orange-200 shadow-[0_0_0_3px_rgba(246,89,1,0.06)]")}>
      <div className="p-5 flex-1">
        <div className="flex items-start gap-3.5">
          <span className={cn("w-10 h-10 rounded-xl ring-1 flex items-center justify-center shrink-0", t.tone)}><t.icon className="w-5 h-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">{rule.name}</h3>
              <Toggle checked={rule.enabled} onChange={(v) => onPatch(rule, { enabled: v }, v ? "Switched on. It'll start once sending is connected." : "Switched off")} disabled={!manager} />
            </div>
            {description && <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{description}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Step label="When">{t.when}</Step>
          {rule.trigger === "no_reply" && (
            <Step label="If">
              <span className="inline-flex items-center gap-2 flex-wrap">
                No reply for
                <Input
                  type="number" min={1} max={720} value={hoursDraft} disabled={!manager}
                  onChange={(e) => setHoursDraft(e.target.value)} onBlur={commitHours}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="h-8 w-20 text-center tabular-nums" aria-label="Hours without a reply"
                />
                hours
              </span>
            </Step>
          )}
          {actions.map((a, i) => {
            const at = actionText(a);
            return <Step key={i} label="Then"><span className="inline-flex items-center gap-1.5"><at.icon className="w-3.5 h-3.5 text-gray-400" />{at.text}</span></Step>;
          })}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-2.5 bg-gray-50/60 rounded-b-xl">
        {rule.enabled ? <Badge tone="green" dot>Ready</Badge> : <Badge tone="gray">Off</Badge>}
        <span className="text-xs text-gray-500">{rule.enabled ? "Starts automatically when sending is connected" : "Not chosen"}</span>
      </div>
    </Card>
  );
}

function Step({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-gray-700 min-h-[28px]">
      <span className="w-11 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function HowItWorks() {
  const steps: { icon: ReactNode; title: string; text: string; example: string }[] = [
    { icon: <Zap className="w-4 h-4" />, title: "Trigger", text: "Something happens", example: "A lead becomes Hot" },
    { icon: <Filter className="w-4 h-4" />, title: "Condition", text: "Only if it matches", example: "No reply for 24 hours" },
    { icon: <Mail className="w-4 h-4" />, title: "Action", text: "We do the work", example: "Email your team" },
  ];
  return (
    <Card className="p-4 sm:p-5 mb-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">How it works</div>
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
        {steps.map((s, i) => (
          <div key={s.title} className="contents">
            <div className="flex-1 flex items-start gap-3 rounded-lg bg-gray-50 ring-1 ring-gray-100 p-3">
              <span className="w-8 h-8 rounded-lg bg-white ring-1 ring-gray-200 text-orange-600 flex items-center justify-center shrink-0">{s.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{i + 1}. {s.title}</div>
                <div className="text-xs text-gray-500">{s.text}</div>
                <div className="text-xs text-gray-700 mt-1.5 italic">e.g. {s.example}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center justify-center sm:px-2 text-gray-300">
                <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
