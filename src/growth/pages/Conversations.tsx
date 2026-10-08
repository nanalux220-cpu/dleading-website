import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Bot, Check, CheckCheck, ChevronDown, Clock, ExternalLink, Info, Loader2, MessagesSquare, Plug, RefreshCw,
  Search, SendHorizontal, UserRound, AlertCircle, Hand, Sparkles, Inbox, Phone, Mail, X,
} from "lucide-react";
import { api, errorMessage, ApiError } from "../api";
import { useAuth } from "../auth";
import {
  Alert, Avatar, Badge, Button, ChannelIcon, Drawer, EmptyState, HandlerBadge, ScoreBadge, Skeleton, StatusBadge, cn, useToast,
} from "../ui";
import { CHANNEL_LABEL, STATUS_LABEL, fmtDate, fmtDateTime, fmtTime, timeAgo } from "../format";

// ---------- types ----------
type ConvStatus = "open" | "pending" | "closed";
type Handler = "ai" | "human";
type ConversationRow = {
  id: string; lead_id: string | null; channel: string; external_id: string; customer_name: string; status: ConvStatus; handler: Handler;
  human_since: string | null; unread_count: number; last_message_at: string | null; last_message_preview: string; created_at: string;
  lead_name?: string | null; lead_phone?: string | null; lead_email?: string | null; score?: number | null; score_label?: string | null; lead_status?: string | null;
};
type Message = {
  id: string; direction: "in" | "out"; sender: "customer" | "ai" | "human" | "system" | "auto"; body: string; status: string;
  created_at: string; metadata: { user_id?: string; error?: string } | null; pending?: boolean;
};
type Lead = {
  id: string; name: string; phone: string; email: string; status: string; score: number; score_label: string; service_interest: string;
  location: string; budget: string; preferred_date: string; urgency: string; next_follow_up_at: string | null; notes: string;
  qualification: { reasons?: string[] } | null;
};
type Thread = { conversation: ConversationRow; messages: Message[]; lead: Lead | null };

// Channels shown as filters by default; any other channel that appears in the data is added automatically.
const DEFAULT_CHANNELS = ["whatsapp", "website", "facebook", "instagram"];
const STATUS_OPTIONS: { value: ConvStatus; label: string; hint: string }[] = [
  { value: "open", label: "Open", hint: "Needs attention or is in progress" },
  { value: "pending", label: "Pending", hint: "Waiting on the customer" },
  { value: "closed", label: "Closed", hint: "Done. Hidden from the active inbox" },
];
const URGENCY_LABEL: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };
const channelLabel = (c: string) => CHANNEL_LABEL[c] || c.charAt(0).toUpperCase() + c.slice(1);

function displayName(c: Pick<ConversationRow, "channel" | "customer_name" | "external_id"> & { lead_name?: string | null; lead_phone?: string | null }) {
  return c.lead_name || c.customer_name || c.lead_phone || (c.channel === "whatsapp" && c.external_id ? `+${c.external_id}` : c.channel === "website" ? "Website visitor" : `${channelLabel(c.channel)} customer`);
}

/** setInterval that pauses while the tab is hidden and catches up as soon as it's visible again. */
function usePoll(fn: () => void, ms: number, enabled = true) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  useEffect(() => {
    if (!enabled) return;
    const tick = () => { if (!document.hidden) ref.current(); };
    const t = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", tick); };
  }, [ms, enabled]);
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOutside(); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onOutside(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [ref, onOutside, active]);
}

// ---------- list pane ----------
function Segmented<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
      {items.map((it) => (
        <button key={it.value} onClick={() => onChange(it.value)}
          className={cn("h-7 px-2.5 rounded-md text-xs font-medium transition whitespace-nowrap", value === it.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800")}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

function ConversationListItem({ c, active, onSelect }: { c: ConversationRow; active: boolean; onSelect: () => void }) {
  const name = displayName(c);
  const unread = c.unread_count > 0 && !active;
  return (
    <button onClick={onSelect}
      className={cn("w-full text-left flex gap-3 px-3.5 py-3 border-l-2 transition",
        active ? "bg-orange-50/70 border-orange-500" : "border-transparent hover:bg-gray-50")}>
      <div className="relative shrink-0">
        <Avatar name={name} size={40} />
        <ChannelIcon channel={c.channel} className="!w-5 !h-5 absolute -bottom-1 -right-1 ring-2 ring-white !rounded-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("text-[13.5px] truncate", unread ? "font-semibold text-gray-900" : "font-medium text-gray-800")}>{name}</span>
          <span className={cn("text-[11px] shrink-0 tabular-nums", unread ? "text-orange-600 font-semibold" : "text-gray-400")}>{timeAgo(c.last_message_at)}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={cn("text-[12.5px] truncate flex-1", unread ? "text-gray-800" : "text-gray-500")}>{c.last_message_preview || "No messages yet"}</p>
          {unread && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-[10.5px] font-bold flex items-center justify-center tabular-nums shrink-0">{c.unread_count > 99 ? "99+" : c.unread_count}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <HandlerBadge handler={c.handler} />
          {c.score_label && <ScoreBadge label={c.score_label} score={c.score ?? undefined} />}
          {c.status === "pending" && <Badge tone="amber">Pending</Badge>}
          {c.status === "closed" && <Badge>Closed</Badge>}
        </div>
      </div>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-3.5 py-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2 pt-0.5"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-4 w-24 rounded-full" /></div>
        </div>
      ))}
    </div>
  );
}

// ---------- thread pieces ----------
function DeliveryStatus({ status }: { status: string }) {
  if (status === "sending") return <Loader2 className="w-3 h-3 animate-spin" aria-label="Sending" />;
  if (status === "failed") return <span className="inline-flex items-center gap-0.5 text-red-600 font-medium"><AlertCircle className="w-3 h-3" />Not delivered</span>;
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-sky-500" aria-label="Read" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5" aria-label="Delivered" />;
  if (status === "sent") return <Check className="w-3.5 h-3.5" aria-label="Sent" />;
  return null;
}

function MessageBubble({ m, channel, myId }: { m: Message; channel: string; myId?: string }) {
  const time = fmtTime(m.created_at);
  const showDelivery = m.direction === "out" && (channel === "whatsapp" || m.pending);
  if (m.sender === "system" || m.sender === "auto") {
    return (
      <div className="flex justify-center px-2">
        <div className="max-w-[85%] sm:max-w-md rounded-xl bg-gray-100 text-gray-600 px-3.5 py-2 text-[12.5px] leading-relaxed text-center">
          <div className="flex items-center justify-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
            <Sparkles className="w-3 h-3" />{m.sender === "auto" ? "Automated message" : "System"}
          </div>
          <div className="whitespace-pre-wrap break-words">{m.body}</div>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[10.5px] text-gray-400 tabular-nums">{time}{showDelivery && <DeliveryStatus status={m.status} />}</div>
        </div>
      </div>
    );
  }
  if (m.direction === "in") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div className="rounded-2xl rounded-bl-md bg-white border border-gray-200/80 shadow-[0_1px_1px_rgba(16,24,40,0.04)] px-3.5 py-2 text-[14px] text-gray-900 leading-relaxed whitespace-pre-wrap break-words">{m.body}</div>
          <div className="mt-1 pl-1 text-[10.5px] text-gray-400 tabular-nums">{time}</div>
        </div>
      </div>
    );
  }
  const ai = m.sender === "ai";
  const label = ai ? "AI assistant" : m.metadata?.user_id && m.metadata.user_id === myId ? "You" : "Team";
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
        <div className={cn("flex items-center gap-1 mb-1 pr-1 text-[10.5px] font-semibold uppercase tracking-wide", ai ? "text-orange-600" : "text-gray-500")}>
          {ai ? <Bot className="w-3 h-3" /> : <UserRound className="w-3 h-3" />}{label}
        </div>
        <div className={cn("rounded-2xl rounded-br-md px-3.5 py-2 text-[14px] leading-relaxed whitespace-pre-wrap break-words",
          ai ? "bg-gradient-to-br from-orange-50 to-amber-50 text-gray-900 ring-1 ring-inset ring-orange-200/70" : "bg-gray-900 text-white",
          m.pending && "opacity-70", m.status === "failed" && "ring-2 ring-red-300")}>
          {m.body}
        </div>
        <div className="mt-1 pr-1 flex items-center gap-1.5 text-[10.5px] text-gray-400 tabular-nums">
          {time}{showDelivery && <DeliveryStatus status={m.status} />}
        </div>
        {m.status === "failed" && m.metadata?.error && <div className="mt-0.5 pr-1 text-[11px] text-red-600 max-w-xs text-right">{m.metadata.error}</div>}
      </div>
    </div>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function StatusMenu({ value, onChange, busy }: { value: ConvStatus; onChange: (s: ConvStatus) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const dot = value === "open" ? "bg-emerald-500" : value === "pending" ? "bg-amber-500" : "bg-gray-400";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={busy} aria-haspopup="menu" aria-expanded={open}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
        <span className={cn("w-2 h-2 rounded-full", dot)} />
        <span className="hidden sm:inline">{STATUS_OPTIONS.find((s) => s.value === value)?.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1.5 w-60 z-30 rounded-xl bg-white shadow-xl ring-1 ring-gray-200 p-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button key={s.value} role="menuitemradio" aria-checked={value === s.value} onClick={() => { setOpen(false); if (s.value !== value) onChange(s.value); }}
              className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-gray-50">
              <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", s.value === "open" ? "bg-emerald-500" : s.value === "pending" ? "bg-amber-500" : "bg-gray-400")} />
              <span className="flex-1">
                <span className="block text-[13px] font-medium text-gray-900">{s.label}</span>
                <span className="block text-xs text-gray-500">{s.hint}</span>
              </span>
              {value === s.value && <Check className="w-4 h-4 text-orange-500 mt-0.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- lead panel ----------
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-b-0">
      <dt className="text-[12.5px] text-gray-500 shrink-0">{label}</dt>
      <dd className="text-[13px] text-gray-900 text-right min-w-0 break-words">{children}</dd>
    </div>
  );
}
const dash = <span className="text-gray-400">—</span>;

function LeadInfo({ thread }: { thread: Thread }) {
  const { conversation: c, lead } = thread;
  if (!lead) {
    return (
      <div className="p-5">
        <div className="text-center rounded-xl border border-dashed border-gray-200 px-4 py-6">
          <UserRound className="w-6 h-6 text-gray-300 mx-auto" />
          <div className="mt-2 text-[13px] font-medium text-gray-800">Not linked to a lead yet</div>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">A lead is created automatically once the customer shares their name, phone number or email.</p>
        </div>
        <dl className="mt-4">
          <InfoRow label="Channel"><span className="inline-flex items-center gap-1.5"><ChannelIcon channel={c.channel} className="!w-5 !h-5" />{channelLabel(c.channel)}</span></InfoRow>
          {c.customer_name && <InfoRow label="Name">{c.customer_name}</InfoRow>}
          {c.channel === "whatsapp" && <InfoRow label="Phone">+{c.external_id}</InfoRow>}
          <InfoRow label="Started">{fmtDateTime(c.created_at)}</InfoRow>
        </dl>
      </div>
    );
  }
  const overdue = lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < Date.now() && !["won", "lost"].includes(lead.status);
  const reasons = lead.qualification?.reasons || [];
  const name = lead.name || lead.phone || lead.email || "Unnamed lead";
  return (
    <div className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={name} size={44} />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-gray-900 truncate">{name}</div>
          <div className="flex items-center gap-1.5 mt-1"><StatusBadge status={lead.status} /><ScoreBadge label={lead.score_label} score={lead.score} /></div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {lead.phone && <a href={`tel:${lead.phone}`} className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50"><Phone className="w-3.5 h-3.5" />Call</a>}
        {lead.email && <a href={`mailto:${lead.email}`} className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50"><Mail className="w-3.5 h-3.5" />Email</a>}
      </div>
      <dl className="mt-4">
        <InfoRow label="Phone">{lead.phone ? <span className="tabular-nums">{lead.phone}</span> : dash}</InfoRow>
        <InfoRow label="Email">{lead.email || dash}</InfoRow>
        <InfoRow label="Status">{STATUS_LABEL[lead.status] || lead.status}</InfoRow>
        <InfoRow label="Score"><span className="tabular-nums">{lead.score}/100</span></InfoRow>
        <InfoRow label="Service">{lead.service_interest || dash}</InfoRow>
        <InfoRow label="Location">{lead.location || dash}</InfoRow>
        <InfoRow label="Budget">{lead.budget || dash}</InfoRow>
        <InfoRow label="Preferred date">{lead.preferred_date || dash}</InfoRow>
        <InfoRow label="Urgency">{URGENCY_LABEL[lead.urgency] || dash}</InfoRow>
        <InfoRow label="Next follow-up">
          {lead.next_follow_up_at ? <span className={cn("tabular-nums", overdue && "text-red-600 font-medium")}>{fmtDateTime(lead.next_follow_up_at)}{overdue ? " · overdue" : ""}</span> : dash}
        </InfoRow>
      </dl>
      {reasons.length > 0 && (
        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Why this score</div>
          <ul className="space-y-1">{reasons.slice(0, 5).map((r, i) => <li key={i} className="text-xs text-gray-600">• {r}</li>)}</ul>
        </div>
      )}
      {lead.notes && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Notes</div>
          <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
        </div>
      )}
      <Link to={`/app/leads?lead=${lead.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 h-9 rounded-lg bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800">
        Open in Leads<ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ---------- page ----------
export default function Conversations() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { me } = useAuth();
  const myId = me?.user?.id;

  // list state
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("");
  const [handler, setHandler] = useState<"" | Handler>("");
  const [status, setStatus] = useState<"active" | "closed">("active");
  const [list, setList] = useState<ConversationRow[] | null>(null);
  const [listError, setListError] = useState<unknown>(null);
  const [listLoading, setListLoading] = useState(true);
  const [hasAny, setHasAny] = useState<boolean | null>(null);
  const listReq = useRef(0);

  // thread state
  const [thread, setThread] = useState<Thread | null>(null);
  const [threadError, setThreadError] = useState<unknown>(null);
  const [pending, setPending] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [patching, setPatching] = useState<"" | "handler" | "status">("");
  const [showPanel, setShowPanel] = useState(() => { try { return localStorage.getItem("ge.inbox.panel") !== "0"; } catch { return true; } });
  const [infoDrawer, setInfoDrawer] = useState(false);
  const idRef = useRef(id);
  idRef.current = id;
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const filtered = !!(q || channel || handler || status !== "active");

  const loadList = useCallback(async (silent = false) => {
    const n = ++listReq.current;
    if (!silent) setListLoading(true);
    try {
      const r = await api<{ conversations: ConversationRow[] }>("conversations", { params: { q, channel, handler, status } });
      if (n !== listReq.current) return;
      setList(r.conversations.map((c) => (c.id === idRef.current ? { ...c, unread_count: 0 } : c)));
      setListError(null);
    } catch (e) {
      if (n === listReq.current && !silent) setListError(e);
    } finally {
      if (n === listReq.current) setListLoading(false);
    }
  }, [q, channel, handler, status]);

  useEffect(() => { loadList(); }, [loadList]);
  usePoll(() => loadList(true), 10000);

  // Is the inbox completely empty (not just this filter)? Decides between "no conversations yet" and a filtered empty list.
  useEffect(() => {
    if (!list) return;
    if (list.length > 0) { setHasAny(true); return; }
    if (hasAny !== null) return;
    if (!filtered) {
      api<{ conversations: ConversationRow[] }>("conversations", { params: { status: "all" } })
        .then((r) => setHasAny(r.conversations.length > 0)).catch(() => setHasAny(true));
    }
  }, [list, filtered, hasAny]);

  const loadThread = useCallback(async (convId: string) => {
    try {
      const r = await api<Thread>("conversation", { params: { id: convId } });
      if (idRef.current !== convId) return;
      setThread(r);
      setThreadError(null);
      setList((l) => l && l.map((c) => (c.id === convId ? { ...c, unread_count: 0, handler: r.conversation.handler, status: r.conversation.status } : c)));
    } catch (e) {
      if (idRef.current === convId) setThreadError(e);
    }
  }, []);

  useEffect(() => {
    setThread(null); setThreadError(null); setPending([]); setDraft(""); setSendError(""); setInfoDrawer(false);
    stick.current = true;
    if (id) loadThread(id);
  }, [id, loadThread]);
  usePoll(() => { if (id) loadThread(id); }, 5000, !!id);

  const messages = useMemo(() => [...(thread?.messages || []), ...pending], [thread, pending]);

  // keep the view pinned to the newest message unless the user has scrolled up
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, thread?.conversation.id]);
  const onScroll = () => {
    const el = scroller.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // auto-grow composer
  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const select = (convId: string) => navigate(`/app/conversations/${convId}`);

  const patch = async (body: { handler?: Handler; status?: ConvStatus }, done: string) => {
    if (!id) return;
    setPatching(body.handler ? "handler" : "status");
    try {
      const r = await api<Thread>("conversation", { method: "PATCH", params: { id }, body });
      if (idRef.current === id) setThread(r);
      toast(done);
      loadList(true);
    } catch (e) { toast(errorMessage(e), "error"); } finally { setPatching(""); }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !id || sending) return;
    const convId = id;
    const temp: Message = { id: `tmp-${Date.now()}`, direction: "out", sender: "human", body: text, status: "sending", created_at: new Date().toISOString(), metadata: { user_id: myId }, pending: true };
    setPending((p) => [...p, temp]);
    setDraft(""); setSendError(""); setSending(true);
    stick.current = true;
    try {
      await api("conversation/send", { method: "POST", body: { id: convId, text } });
      await loadThread(convId);
      loadList(true);
    } catch (e) {
      if (idRef.current === convId) {
        setDraft((d) => d || text);
        setSendError(errorMessage(e));
      }
      toast(e instanceof ApiError && e.code === "outside_24h_window" ? "Message not sent: outside WhatsApp's 24-hour window" : "Message not sent", "error");
    } finally {
      setPending((p) => p.filter((m) => m.id !== temp.id));
      setSending(false);
      textarea.current?.focus();
    }
  };

  const toggleInfo = () => {
    if (window.matchMedia("(min-width: 1280px)").matches) {
      setShowPanel((s) => { try { localStorage.setItem("ge.inbox.panel", s ? "0" : "1"); } catch { /* storage unavailable */ } return !s; });
    } else setInfoDrawer(true);
  };

  // channels for the filter: defaults + anything present in the data
  const channels = useMemo(() => {
    const set = new Set(DEFAULT_CHANNELS);
    (list || []).forEach((c) => set.add(c.channel));
    if (channel) set.add(channel);
    return [...set];
  }, [list, channel]);

  const conv = thread?.conversation;
  const name = conv ? displayName({ ...conv, lead_name: thread?.lead?.name, lead_phone: thread?.lead?.phone }) : "";
  const lastCustomerAt = useMemo(() => [...(thread?.messages || [])].reverse().find((m) => m.direction === "in")?.created_at, [thread]);
  const outsideWindow = conv?.channel === "whatsapp" && (!lastCustomerAt || Date.now() - new Date(lastCustomerAt).getTime() > 24 * 3600e3);
  const notFound = threadError instanceof ApiError && (threadError.status === 404 || threadError.status === 400);

  const shell = "flex h-[calc(100dvh-56px)] lg:h-screen bg-white overflow-hidden";

  // whole inbox empty
  if (hasAny === false && list && list.length === 0 && !filtered && !id) {
    return (
      <div className={cn(shell, "items-center justify-center bg-[#f6f6f7]")}>
        <EmptyState icon={<MessagesSquare className="w-6 h-6" />} title="No conversations yet"
          action={<Button icon={<Plug className="w-4 h-4" />} onClick={() => navigate("/app/integrations")}>Connect your channels</Button>}>
          When customers chat with your AI assistant on your website or message you on WhatsApp, the conversations appear here automatically. You can read along, and step in at any time.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* ---------- list ---------- */}
      <section className={cn("w-full md:w-[320px] lg:w-[340px] shrink-0 border-r border-gray-200 flex-col bg-white", id ? "hidden md:flex" : "flex")}>
        <div className="px-3.5 pt-4 pb-3 border-b border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-gray-900">Inbox</h1>
            <Segmented<"active" | "closed"> value={status} onChange={setStatus} items={[{ value: "active", label: "Active" }, { value: "closed", label: "Closed" }]} />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search name, number or message" aria-label="Search conversations"
              className="w-full h-9 rounded-lg bg-gray-100 pl-9 pr-8 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition" />
            {qInput && <button onClick={() => setQInput("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-700" aria-label="Clear search"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-3.5 px-3.5 pb-0.5 [scrollbar-width:none]">
            {["", ...channels].map((c) => (
              <button key={c || "all"} onClick={() => setChannel(c)}
                className={cn("inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border whitespace-nowrap transition",
                  channel === c ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
                {c ? channelLabel(c) : "All channels"}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Handled by</span>
            <Segmented<"" | Handler> value={handler} onChange={setHandler} items={[{ value: "", label: "All" }, { value: "ai", label: "AI" }, { value: "human", label: "Human" }]} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {listError && !list ? (
            <div className="p-4">
              <Alert tone="error">{errorMessage(listError)}</Alert>
              <Button size="sm" variant="secondary" className="mt-3" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => loadList()}>Try again</Button>
            </div>
          ) : !list ? (
            <ListSkeleton />
          ) : list.length === 0 ? (
            <EmptyState icon={<Inbox className="w-6 h-6" />} title={filtered ? "No matching conversations" : "Inbox zero"} className="py-12"
              action={filtered ? <Button size="sm" variant="secondary" onClick={() => { setQInput(""); setQ(""); setChannel(""); setHandler(""); setStatus("active"); }}>Clear filters</Button> : undefined}>
              {filtered ? "Try a different search or filter." : "There are no active conversations right now. New messages will appear here automatically."}
            </EmptyState>
          ) : (
            <div className={cn("divide-y divide-gray-100 transition-opacity", listLoading && "opacity-60")}>
              {list.map((c) => <ConversationListItem key={c.id} c={c} active={c.id === id} onSelect={() => select(c.id)} />)}
              {list.length >= 100 && <p className="px-4 py-3 text-center text-xs text-gray-400">Showing the 100 most recent. Search to find older conversations.</p>}
            </div>
          )}
        </div>
      </section>

      {/* ---------- thread ---------- */}
      <section className={cn("flex-1 min-w-0 flex-col bg-[#f6f6f7]", id ? "flex" : "hidden md:flex")}>
        {!id ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<MessagesSquare className="w-6 h-6" />} title="Choose a conversation">
              Pick a conversation on the left to read the full chat, see what your AI has said, and step in whenever you like.
            </EmptyState>
          </div>
        ) : threadError && !thread ? (
          <div className="flex-1 flex flex-col">
            <div className="md:hidden px-3 py-2 border-b border-gray-200 bg-white">
              <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate("/app/conversations")}>Inbox</Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {notFound ? (
                <EmptyState icon={<MessagesSquare className="w-6 h-6" />} title="Conversation not found" action={<Button variant="secondary" onClick={() => navigate("/app/conversations")}>Back to inbox</Button>}>
                  It may have been removed, or it belongs to a different business.
                </EmptyState>
              ) : (
                <div className="max-w-sm w-full px-6">
                  <Alert tone="error">{errorMessage(threadError)}</Alert>
                  <Button variant="secondary" className="mt-3" icon={<RefreshCw className="w-4 h-4" />} onClick={() => loadThread(id)}>Try again</Button>
                </div>
              )}
            </div>
          </div>
        ) : !thread || !conv ? (
          <div className="flex-1 flex flex-col">
            <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-200 bg-white"><Skeleton className="w-9 h-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-20" /></div></div>
            <div className="flex-1 p-4 sm:p-6 space-y-4">
              <Skeleton className="h-12 w-2/3 sm:w-1/3 rounded-2xl bg-gray-200/70" />
              <Skeleton className="h-16 w-3/4 sm:w-2/5 rounded-2xl ml-auto bg-orange-100/70" />
              <Skeleton className="h-10 w-1/2 sm:w-1/4 rounded-2xl bg-gray-200/70" />
            </div>
          </div>
        ) : (
          <>
            {/* header */}
            <header className="shrink-0 bg-white border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 h-16">
                <button onClick={() => navigate("/app/conversations")} className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100" aria-label="Back to inbox"><ArrowLeft className="w-5 h-5" /></button>
                <Avatar name={name} size={38} className="hidden sm:inline-flex" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[15px] font-semibold text-gray-900 truncate">{name}</span>
                    {thread.lead && <span className="hidden sm:inline-flex"><ScoreBadge label={thread.lead.score_label} score={thread.lead.score} /></span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <ChannelIcon channel={conv.channel} className="!w-4 !h-4 !rounded" />
                    <span className="truncate">{channelLabel(conv.channel)}{conv.last_message_at ? ` · last message ${timeAgo(conv.last_message_at)}` : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {conv.handler === "ai" ? (
                    <Button size="sm" variant="dark" loading={patching === "handler"} icon={<Hand className="w-3.5 h-3.5" />}
                      onClick={() => patch({ handler: "human" }, "You're now handling this conversation. The AI is paused.")}>
                      Take over
                    </Button>
                  ) : (
                    <Button size="sm" loading={patching === "handler"} icon={<Bot className="w-3.5 h-3.5" />}
                      onClick={() => patch({ handler: "ai" }, "Handed back to the AI")}>
                      <span className="sm:hidden">Use AI</span><span className="hidden sm:inline">Hand back to AI</span>
                    </Button>
                  )}
                  <StatusMenu value={conv.status} busy={patching === "status"} onChange={(s) => patch({ status: s }, s === "closed" ? "Conversation closed" : `Marked as ${s === "open" ? "open" : "pending"}`)} />
                  <button onClick={toggleInfo} title="Customer details" aria-label="Customer details"
                    className={cn("p-2 rounded-lg border transition", showPanel ? "xl:bg-gray-100 xl:border-gray-200 xl:text-gray-900" : "", "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900")}>
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {conv.handler === "human" ? (
                <div className="flex items-center gap-2.5 px-4 py-2 bg-violet-50 border-t border-violet-100 text-[12.5px] text-violet-900">
                  <UserRound className="w-4 h-4 shrink-0 text-violet-600" />
                  <span className="flex-1"><span className="font-semibold">A person is handling this.</span> AI is paused in this conversation until you hand it back.{conv.human_since ? <span className="text-violet-700/70"> Since {fmtDateTime(conv.human_since)}.</span> : null}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-50/60 border-t border-emerald-100 text-[12px] text-emerald-900">
                  <Bot className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Your AI assistant is replying. Take over at any time to reply yourself.</span>
                </div>
              )}
            </header>

            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-w-0 flex flex-col">
                {/* messages */}
                <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">
                  {messages.length === 0 ? (
                    <EmptyState icon={<MessagesSquare className="w-6 h-6" />} title="No messages yet">Messages in this conversation will appear here as they arrive.</EmptyState>
                  ) : messages.map((m, i) => {
                    const prev = messages[i - 1];
                    const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                    return (
                      <div key={m.id}>
                        {newDay && (
                          <div className="flex items-center justify-center my-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] font-medium text-gray-500">{dayLabel(m.created_at)}</span>
                          </div>
                        )}
                        <MessageBubble m={m} channel={conv.channel} myId={myId} />
                      </div>
                    );
                  })}
                </div>

                {/* composer */}
                <div className="shrink-0 border-t border-gray-200 bg-white px-3 sm:px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  {sendError && (
                    <Alert tone="error" className="mb-2.5 flex items-start gap-2 !py-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span className="flex-1">{sendError}</span>
                      <button onClick={() => setSendError("")} aria-label="Dismiss" className="text-red-700/60 hover:text-red-800"><X className="w-4 h-4" /></button>
                    </Alert>
                  )}
                  {outsideWindow && !sendError && (
                    <div className="mb-2.5 flex items-start gap-2 rounded-lg bg-amber-50 ring-1 ring-amber-100 px-3 py-2 text-xs text-amber-900">
                      <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      The customer's last WhatsApp message was over 24 hours ago, so WhatsApp may block a free-form reply.
                    </div>
                  )}
                  {conv.status === "closed" && (
                    <div className="mb-2.5 flex items-center justify-between gap-2 rounded-lg bg-gray-50 ring-1 ring-gray-100 px-3 py-2 text-xs text-gray-600">
                      <span>This conversation is closed.</span>
                      <button onClick={() => patch({ status: "open" }, "Conversation reopened")} className="font-semibold text-orange-600 hover:text-orange-700">Reopen</button>
                    </div>
                  )}
                  <div className={cn("flex items-end gap-2 rounded-xl border bg-white px-2 py-1.5 transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100", "border-gray-200")}>
                    <textarea
                      ref={textarea}
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
                      }}
                      placeholder={conv.handler === "ai" ? "Write a reply… (sending pauses the AI)" : `Reply on ${channelLabel(conv.channel)}…`}
                      aria-label="Message"
                      className="flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[14px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none max-h-40"
                    />
                    <button onClick={send} disabled={!draft.trim() || sending} aria-label="Send message"
                      className="mb-0.5 h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white shadow-sm shadow-orange-500/20 transition hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[11px] text-gray-400">
                    <span className="truncate">
                      {conv.handler === "ai" ? <><Bot className="inline w-3 h-3 -mt-0.5 mr-1 text-orange-500" />Replying yourself takes over from the AI until you hand it back.</> : "Replies are sent as your business."}
                    </span>
                    <span className="hidden sm:inline shrink-0">Enter to send · Shift + Enter for a new line</span>
                  </div>
                </div>
              </div>

              {/* lead panel (xl+) */}
              {showPanel && (
                <aside className="hidden xl:block w-[320px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
                  <div className="flex items-center justify-between px-5 pt-4">
                    <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">Customer</h2>
                    <button onClick={toggleInfo} className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Hide customer details"><X className="w-4 h-4" /></button>
                  </div>
                  <LeadInfo thread={thread} />
                </aside>
              )}
            </div>

            {/* lead details below xl */}
            <Drawer open={infoDrawer} onClose={() => setInfoDrawer(false)} title={<span className="text-[15px] font-semibold text-gray-900">Customer details</span>}>
              <LeadInfo thread={thread} />
              <div className="px-5 pb-5 text-xs text-gray-400">Conversation started {fmtDate(conv.created_at)}</div>
            </Drawer>
          </>
        )}
      </section>
    </div>
  );
}
