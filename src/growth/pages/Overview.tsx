import { useNavigate, Link } from "react-router-dom";
import {
  UserPlus, BadgeCheck, Flame, MessagesSquare, CalendarDays, TrendingUp, BellRing, Activity, ArrowRight,
  CheckCircle2, Circle, BookOpen, MessageCircle, Bot,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Card, CardHeader, ChannelIcon, EmptyState, PageHeader, Skeleton, StatCard, Button, cn, useLoad, Alert } from "../ui";
import { eventText, timeAgo } from "../format";

type OverviewData = {
  stats: {
    new_leads: number; new_leads_open: number; qualified_leads: number; hot_leads: number; conversations: number;
    conversations_with_human: number; unread: number; appointments: number; conversion_rate: number; won: number;
    total_leads: number; follow_ups_due: number;
  };
  activity: { id: number; type: string; created_at: string; lead_id: string | null; conversation_id: string | null; lead_name: string | null; lead_phone: string | null; channel: string | null; data: any }[];
  setup: { onboarded: boolean; knowledge_items: number; whatsapp: string };
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const EVENT_ICON: Record<string, { I: any; c: string }> = {
  "lead.created": { I: UserPlus, c: "bg-sky-50 text-sky-600" },
  "lead.hot": { I: Flame, c: "bg-red-50 text-red-600" },
  "lead.won": { I: TrendingUp, c: "bg-emerald-50 text-emerald-600" },
  "lead.status_changed": { I: BadgeCheck, c: "bg-orange-50 text-orange-600" },
  "conversation.handoff": { I: BellRing, c: "bg-violet-50 text-violet-600" },
  "conversation.takeover": { I: BellRing, c: "bg-violet-50 text-violet-600" },
  "appointment.created": { I: CalendarDays, c: "bg-amber-50 text-amber-600" },
};

export default function Overview() {
  const { me } = useAuth();
  const nav = useNavigate();
  const { data, loading, error } = useLoad<OverviewData>(() => api("overview"), [me?.business?.id]);
  const s = data?.stats;
  const first = (me?.user?.name || "").split(" ")[0];

  const setupSteps = data ? [
    { done: data.setup.onboarded, label: "Tell the AI about your business", to: "/app/onboarding", icon: Bot },
    { done: data.setup.knowledge_items > 0, label: "Add FAQs, prices and policies", to: "/app/knowledge", icon: BookOpen },
    { done: data.setup.whatsapp === "connected", label: "Connect WhatsApp", to: "/app/integrations", icon: MessageCircle },
  ] : [];
  const setupLeft = setupSteps.filter((x) => !x.done).length;

  return (
    <>
      <PageHeader
        title={`${greeting()}${first ? `, ${first}` : ""}`}
        subtitle={`Here's what's happening at ${me?.business?.name || "your business"}.`}
        actions={<><Button variant="secondary" onClick={() => nav("/app/conversations")} icon={<MessagesSquare className="w-4 h-4" />}>Open inbox</Button><Button onClick={() => nav("/app/leads")} icon={<UserPlus className="w-4 h-4" />}>View leads</Button></>}
      />

      {error ? <Alert tone="error" className="mb-6">We couldn't load your dashboard. Please refresh the page.</Alert> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading || !s ? Array.from({ length: 8 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-14 mt-4" /></Card>) : (<>
          <StatCard label="New leads" value={s.new_leads} icon={<UserPlus className="w-4 h-4" />} tone="blue" hint={`Last 7 days · ${s.new_leads_open} awaiting contact`} onClick={() => nav("/app/leads")} />
          <StatCard label="Qualified leads" value={s.qualified_leads} icon={<BadgeCheck className="w-4 h-4" />} tone="orange" hint="Ready for your team" onClick={() => nav("/app/leads")} />
          <StatCard label="Hot leads" value={s.hot_leads} icon={<Flame className="w-4 h-4" />} tone="red" hint={s.hot_leads ? "Call these first" : "None right now"} onClick={() => nav("/app/leads")} />
          <StatCard label="Conversations" value={s.conversations} icon={<MessagesSquare className="w-4 h-4" />} tone="violet" hint={s.unread ? `${s.unread} unread · ${s.conversations_with_human} with a person` : `${s.conversations_with_human} with a person`} onClick={() => nav("/app/conversations")} />
          <StatCard label="Appointments" value={s.appointments} icon={<CalendarDays className="w-4 h-4" />} tone="amber" hint="Upcoming" onClick={() => nav("/app/appointments")} />
          <StatCard label="Conversion rate" value={`${s.conversion_rate}%`} icon={<TrendingUp className="w-4 h-4" />} tone="green" hint={`${s.won} won of ${s.total_leads} leads`} onClick={() => nav("/app/analytics")} />
          <StatCard label="Follow-ups due" value={s.follow_ups_due} icon={<BellRing className="w-4 h-4" />} tone={s.follow_ups_due ? "red" : "blue"} hint="Today or overdue" onClick={() => nav("/app/leads")} />
          <StatCard label="Total leads" value={s.total_leads} icon={<Activity className="w-4 h-4" />} tone="blue" hint="All time" onClick={() => nav("/app/leads")} />
        </>)}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 mt-6">
        <Card>
          <CardHeader title="Recent activity" subtitle="Leads, conversations and handovers as they happen" />
          {loading ? (
            <div className="px-5 pb-5 space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex gap-3"><Skeleton className="w-8 h-8 rounded-lg" /><div className="flex-1"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-24 mt-2" /></div></div>)}</div>
          ) : !data?.activity.length ? (
            <EmptyState icon={<Activity className="w-5 h-5" />} title="No activity yet">
              When customers message you on your website or WhatsApp, new leads and conversations will show up here in real time.
            </EmptyState>
          ) : (
            <ul className="px-2 pb-2">
              {data.activity.map((e) => {
                const m = EVENT_ICON[e.type];
                const who = e.lead_name || e.lead_phone;
                const to = e.conversation_id ? `/app/conversations/${e.conversation_id}` : e.lead_id ? `/app/leads?lead=${e.lead_id}` : null;
                const row = (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition">
                    {!m && !e.channel && !e.data?.channel ? <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-gray-500"><Activity className="w-4 h-4" /></span> : m ? <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", m.c)}><m.I className="w-4 h-4" /></span>
                      : <ChannelIcon channel={e.channel || e.data?.channel || "website"} className="w-8 h-8 rounded-lg" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-900 truncate">{eventText(e)}{who ? <span className="text-gray-500"> · {who}</span> : null}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{timeAgo(e.created_at)}</div>
                    </div>
                    {to && <ArrowRight className="w-4 h-4 text-gray-300" />}
                  </div>
                );
                return <li key={e.id}>{to ? <Link to={to}>{row}</Link> : row}</li>;
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          {data && setupLeft > 0 && (
            <Card className="overflow-hidden">
              <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-orange-50 to-white">
                <div className="text-[15px] font-semibold text-gray-900">Get the most from Growth Engine</div>
                <div className="text-[13px] text-gray-500 mt-0.5">{setupSteps.length - setupLeft} of {setupSteps.length} done</div>
                <div className="mt-3 h-1.5 rounded-full bg-orange-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#F69D01] to-[#F65901]" style={{ width: `${((setupSteps.length - setupLeft) / setupSteps.length) * 100}%` }} /></div>
              </div>
              <ul className="p-2">
                {setupSteps.map((st) => (
                  <li key={st.label}>
                    <Link to={st.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
                      {st.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-gray-300" />}
                      <span className={cn("text-sm flex-1", st.done ? "text-gray-400 line-through" : "text-gray-800")}>{st.label}</span>
                      {!st.done && <ArrowRight className="w-4 h-4 text-gray-300" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="rounded-xl p-5 bg-[#0f0f10] text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#F69D01]/40 to-transparent blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-semibold"><Bot className="w-4 h-4 text-orange-400" />Your AI assistant</div>
              <p className="text-[13px] text-white/60 mt-2 leading-relaxed">Answers customers from your knowledge base, qualifies leads and hands over to you when needed.</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => nav("/app/assistant")}>Test it</Button>
                <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={() => nav("/app/knowledge")}>Add knowledge</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
