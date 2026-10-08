// Analytics: how leads and conversations are trending for the selected window.
import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Bot, CheckCircle2, Inbox, MessagesSquare, Percent, RefreshCw, Users, UserRoundCog } from "lucide-react";
import { api, errorMessage } from "../api";
import { CHANNEL_LABEL, SOURCE_LABEL, STATUS_LABEL } from "../format";
import { Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard, cn, useLoad } from "../ui";

type Analytics = {
  days: number;
  leads_by_day: { day: string; leads: number; conversations: number }[];
  by_source: { source: string; n: number }[];
  by_status: { status: string; n: number }[];
  by_score: { score_label: string; n: number }[];
  by_channel: { channel: string; n: number }[];
  messages: { inbound: number; ai: number; human: number };
  handoffs: number;
  total_leads: number;
  won: number;
  conversion_rate: number;
  ai_share: number;
};

// Chart palette (validated with the dataviz validator against white: CVD ΔE 26.8, contrast ≥ 3:1).
const C = {
  leads: "#F26A1B", // brand-aligned orange: series 1
  conversations: "#2A78D6", // blue: series 2
  grid: "#EEEDE8",
  axis: "#D9D8D1",
  muted: "#8A8880",
  // Lead temperature: blue → amber → red (validated all-pairs; amber is < 3:1 so values are always labelled)
  cold: "#2A78D6",
  warm: "#EDA100",
  hot: "#E34948",
};

const RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "12 months" },
];
const PIPELINE = ["new", "contacted", "qualified", "appointment", "won"] as const;
const nf = new Intl.NumberFormat("en-GB");

const parseDay = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, (m || 1) - 1, dd || 1);
};
const dayLabel = (d: string, long = false) => parseDay(d).toLocaleDateString("en-GB", long ? { weekday: "short", day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useLoad(() => api<Analytics>("analytics", { params: { days } }), [days]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="How your enquiries, conversations and sales are trending."
        actions={
          <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            {RANGES.map((r) => (
              <button
                key={r.value}
                role="radio"
                aria-checked={days === r.value}
                onClick={() => setDays(r.value)}
                className={cn("h-8 px-3 rounded-md text-[13px] font-medium transition whitespace-nowrap", days === r.value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error && !data ? (
        <Card>
          <EmptyState icon={<BarChart3 className="w-5 h-5" />} title="We couldn't load your analytics" action={<Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={reload}>Try again</Button>}>
            {errorMessage(error)}
          </EmptyState>
        </Card>
      ) : !data ? (
        <LoadingSkeleton />
      ) : (
        <div className={cn("space-y-4 transition-opacity", loading && "opacity-60")} aria-busy={loading}>
          <Kpis a={data} />
          <TrendCard a={data} />
          <div className="grid gap-4 lg:grid-cols-2">
            <FunnelCard a={data} />
            <TemperatureCard a={data} />
            <BarListCard
              title="Leads by source"
              subtitle="Where new leads came from"
              rows={data.by_source.map((r) => ({ key: r.source, label: SOURCE_LABEL[r.source] || r.source, n: r.n }))}
              unit="lead"
              emptyIcon={<Users className="w-5 h-5" />}
              emptyTitle="No leads in this period"
              emptyText="When customers enquire on WhatsApp, your website or anywhere else, you'll see which channels bring in the most leads."
            />
            <BarListCard
              title="Conversations by channel"
              subtitle="Where customers are talking to you"
              rows={data.by_channel.map((r) => ({ key: r.channel, label: CHANNEL_LABEL[r.channel] || r.channel, n: r.n }))}
              unit="conversation"
              emptyIcon={<MessagesSquare className="w-5 h-5" />}
              emptyTitle="No conversations in this period"
              emptyText="Once your WhatsApp number or website chat is live, conversations will be broken down by channel here."
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)}
      </div>
      <Skeleton className="h-[340px] rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}

function Kpis({ a }: { a: Analytics }) {
  const replies = a.messages.ai + a.messages.human;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <StatCard label="Total leads" value={nf.format(a.total_leads)} icon={<Users className="w-4 h-4" />} hint={`Last ${a.days} days`} />
      <StatCard label="Won" value={nf.format(a.won)} icon={<CheckCircle2 className="w-4 h-4" />} tone="green" hint="Leads marked as Won" />
      <StatCard label="Conversion rate" value={`${a.conversion_rate}%`} icon={<Percent className="w-4 h-4" />} tone="violet" hint={a.total_leads ? "Won ÷ all leads" : "No leads yet"} />
      <StatCard label="AI share of replies" value={`${a.ai_share}%`} icon={<Bot className="w-4 h-4" />} tone="blue" hint={replies ? `${nf.format(a.messages.ai)} of ${nf.format(replies)} replies` : "No replies yet"} />
      <StatCard label="Handoffs" value={nf.format(a.handoffs)} icon={<UserRoundCog className="w-4 h-4" />} tone="amber" hint="Passed to your team" />
      <StatCard label="Inbound messages" value={nf.format(a.messages.inbound)} icon={<Inbox className="w-4 h-4" />} tone="orange" hint="From customers" />
    </div>
  );
}

// ---------- shared chart bits ----------
function ChartEmpty({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <EmptyState icon={icon} title={title} className="py-10">{children}</EmptyState>;
}

type TipRow = { name: string; value: number; color: string };
function TooltipBox({ title, rows }: { title: string; rows: TipRow[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-[13px] min-w-[150px]">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2 py-0.5">
          <span className="w-3 h-[2px] rounded-full" style={{ background: r.color }} />
          <span className="font-semibold text-gray-900 tabular-nums">{nf.format(r.value)}</span>
          <span className="text-gray-500">{r.name}</span>
        </div>
      ))}
    </div>
  );
}

function LegendItem({ color, label, value, shape = "line" }: { color: string; label: string; value?: ReactNode; shape?: "line" | "box" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-600">
      <span className={shape === "line" ? "w-3.5 h-[2px] rounded-full" : "w-2.5 h-2.5 rounded-[3px]"} style={{ background: color }} />
      {label}
      {value !== undefined && <span className="font-semibold text-gray-900 tabular-nums">{value}</span>}
    </span>
  );
}

// ---------- trend ----------
function TrendCard({ a }: { a: Analytics }) {
  const rows = a.leads_by_day;
  const totals = useMemo(() => rows.reduce((t, r) => ({ leads: t.leads + r.leads, conversations: t.conversations + r.conversations }), { leads: 0, conversations: 0 }), [rows]);
  const empty = totals.leads + totals.conversations === 0;
  return (
    <Card>
      <CardHeader
        title="Leads and conversations"
        subtitle="New leads and new conversations started each day"
        action={!empty && (
          <div className="hidden sm:flex items-center gap-4">
            <LegendItem color={C.leads} label="Leads" value={nf.format(totals.leads)} />
            <LegendItem color={C.conversations} label="Conversations" value={nf.format(totals.conversations)} />
          </div>
        )}
      />
      {empty ? (
        <ChartEmpty icon={<BarChart3 className="w-5 h-5" />} title="Nothing to chart yet">
          There were no new leads or conversations in this period. As soon as customers start messaging you, daily activity appears here.
        </ChartEmpty>
      ) : (
        <div className="px-2 sm:px-3 pb-4">
          <div className="flex sm:hidden items-center gap-4 px-3 pb-2">
            <LegendItem color={C.leads} label="Leads" value={nf.format(totals.leads)} />
            <LegendItem color={C.conversations} label="Conversations" value={nf.format(totals.conversations)} />
          </div>
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ga-leads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.leads} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={C.leads} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="ga-conv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.conversations} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={C.conversations} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="day" tickFormatter={(d: string) => dayLabel(d)} tick={{ fontSize: 12, fill: C.muted }} tickLine={false} axisLine={{ stroke: C.axis }} minTickGap={28} tickMargin={8} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: C.muted }} tickLine={false} axisLine={false} width={36} tickFormatter={(v: number) => nf.format(v)} />
                <Tooltip
                  cursor={{ stroke: C.axis, strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as Analytics["leads_by_day"][number];
                    return <TooltipBox title={dayLabel(String(label), true)} rows={[{ name: "Leads", value: p.leads, color: C.leads }, { name: "Conversations", value: p.conversations, color: C.conversations }]} />;
                  }}
                />
                <Area type="monotone" dataKey="conversations" name="Conversations" stroke={C.conversations} strokeWidth={2} fill="url(#ga-conv)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke={C.leads} strokeWidth={2} fill="url(#ga-leads)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------- pipeline funnel ----------
function FunnelCard({ a }: { a: Analytics }) {
  const count = (s: string) => a.by_status.find((r) => r.status === s)?.n || 0;
  const stages = PIPELINE.map((s) => ({ key: s, label: STATUS_LABEL[s], n: count(s) }));
  const lost = count("lost");
  const max = Math.max(1, ...stages.map((s) => s.n));
  const empty = a.total_leads === 0;
  return (
    <Card>
      <CardHeader title="Pipeline by stage" subtitle="Where this period's leads are right now" />
      {empty ? (
        <ChartEmpty icon={<Users className="w-5 h-5" />} title="No leads to show">
          Leads move from New to Won as your team follows up. Your pipeline will fill in as enquiries arrive.
        </ChartEmpty>
      ) : (
        <div className="px-5 pb-5">
          <ul className="space-y-2.5">
            {stages.map((s) => {
              const pct = a.total_leads ? Math.round((s.n / a.total_leads) * 100) : 0;
              return (
                <li key={s.key} className="grid grid-cols-[92px_1fr_auto] items-center gap-3" title={`${s.label}: ${s.n} lead${s.n === 1 ? "" : "s"} (${pct}%)`}>
                  <span className="text-[13px] text-gray-600 truncate">{s.label}</span>
                  <span className="h-5 relative rounded-r-[4px] bg-gray-50">
                    <span className="absolute inset-y-0 left-0 rounded-r-[4px] transition-all" style={{ width: s.n ? `max(4px, ${(s.n / max) * 100}%)` : 0, background: C.leads }} />
                  </span>
                  <span className="text-[13px] tabular-nums text-right min-w-[64px]">
                    <span className="font-semibold text-gray-900">{nf.format(s.n)}</span>
                    <span className="text-gray-400 ml-1.5">{pct}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[13px]">
            <span className="text-gray-500">Lost (not in the pipeline)</span>
            <span className="tabular-nums"><span className="font-semibold text-gray-900">{nf.format(lost)}</span><span className="text-gray-400 ml-1.5">{a.total_leads ? Math.round((lost / a.total_leads) * 100) : 0}%</span></span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------- cold / warm / hot ----------
function TemperatureCard({ a }: { a: Analytics }) {
  const n = (k: string) => a.by_score.find((r) => r.score_label === k)?.n || 0;
  const parts = [
    { key: "cold", label: "Cold", n: n("cold"), color: C.cold, hint: "Early interest" },
    { key: "warm", label: "Warm", n: n("warm"), color: C.warm, hint: "Engaged, needs a nudge" },
    { key: "hot", label: "Hot", n: n("hot"), color: C.hot, hint: "Ready to buy or book" },
  ];
  const total = parts.reduce((t, p) => t + p.n, 0);
  return (
    <Card>
      <CardHeader title="Lead temperature" subtitle="How ready this period's leads are to buy" />
      {total === 0 ? (
        <ChartEmpty icon={<Users className="w-5 h-5" />} title="No scored leads yet">
          The AI scores every lead as Cold, Warm or Hot from the conversation. The split will appear here.
        </ChartEmpty>
      ) : (
        <div className="px-5 pb-5">
          <div className="flex h-6 w-full gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={parts.map((p) => `${p.label} ${p.n}`).join(", ")}>
            {parts.filter((p) => p.n > 0).map((p) => (
              <span key={p.key} title={`${p.label}: ${p.n} (${Math.round((p.n / total) * 100)}%)`} className="h-full transition-all hover:brightness-110" style={{ width: `${(p.n / total) * 100}%`, background: p.color }} />
            ))}
          </div>
          <ul className="mt-5 divide-y divide-gray-100">
            {parts.map((p) => (
              <li key={p.key} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: p.color }} />
                  <span className="text-sm font-medium text-gray-900">{p.label}</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">{p.hint}</span>
                </div>
                <span className="text-[13px] tabular-nums">
                  <span className="font-semibold text-gray-900">{nf.format(p.n)}</span>
                  <span className="text-gray-400 ml-1.5">{Math.round((p.n / total) * 100)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

// ---------- single-series horizontal bars ----------
function BarListCard({ title, subtitle, rows, unit, emptyIcon, emptyTitle, emptyText }: {
  title: string; subtitle: string; rows: { key: string; label: string; n: number }[]; unit: string;
  emptyIcon: ReactNode; emptyTitle: string; emptyText: string;
}) {
  const data = rows.filter((r) => r.n > 0);
  const height = Math.max(120, data.length * 40 + 16);
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {data.length === 0 ? (
        <ChartEmpty icon={emptyIcon} title={emptyTitle}>{emptyText}</ChartEmpty>
      ) : (
        <div className="px-2 sm:px-3 pb-4" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap={8}>
              <CartesianGrid horizontal={false} stroke={C.grid} />
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 13, fill: "#4B5563" }} tickLine={false} axisLine={{ stroke: C.axis }} />
              <Tooltip
                cursor={{ fill: "rgba(17,24,39,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as { label: string; n: number };
                  return <TooltipBox title={p.label} rows={[{ name: `${unit}${p.n === 1 ? "" : "s"}`, value: p.n, color: C.leads }]} />;
                }}
              />
              <Bar dataKey="n" fill={C.leads} barSize={20} radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 12, fill: "#374151", formatter: (v: unknown) => nf.format(Number(v)) }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
