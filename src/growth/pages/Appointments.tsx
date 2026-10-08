import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, ChevronDown, List, MapPin, Phone, Plus, Search, Trash2, X,
  UserRound, Bot, StickyNote, Sparkles,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { fromLocalInput, toLocalInput, fmtTime } from "../format";
import { Alert, Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Spinner, Textarea, cn, useLoad, useToast } from "../ui";

type Status = "requested" | "confirmed" | "cancelled" | "completed" | "no_show";
type Appt = {
  id: string; lead_id: string | null; title: string; starts_at: string; ends_at: string | null; status: Status;
  location: string; notes: string; created_by: string; lead_name?: string | null; lead_phone?: string | null;
};
type LeadLite = { id: string; name: string; phone: string; email: string; service_interest?: string };

const STATUSES: { value: Status; label: string; tone: "amber" | "green" | "gray" | "blue" | "red"; }[] = [
  { value: "requested", label: "Requested", tone: "amber" },
  { value: "confirmed", label: "Confirmed", tone: "green" },
  { value: "completed", label: "Completed", tone: "blue" },
  { value: "no_show", label: "No-show", tone: "red" },
  { value: "cancelled", label: "Cancelled", tone: "gray" },
];
const STATUS_META = Object.fromEntries(STATUSES.map((s) => [s.value, s])) as Record<Status, (typeof STATUSES)[number]>;
const DURATIONS = [15, 30, 45, 60, 90];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------- date helpers (local time) ----------
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);
function dayLabel(d: Date) {
  const today = startOfDay(new Date());
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, addDays(today, 1))) return "Tomorrow";
  if (sameDay(d, addDays(today, -1))) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) });
}
function gridStart(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  return addDays(first, -((first.getDay() + 6) % 7)); // back to Monday
}
function durationText(a: Appt) {
  if (!a.ends_at) return "";
  const m = Math.round((new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000);
  if (m <= 0) return "";
  return m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;
}
function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  if (d.getHours() < 8 && sameDay(d, new Date())) { d.setHours(10); return d; }
  if (d.getHours() >= 18 || !sameDay(d, new Date())) { const t = addDays(startOfDay(new Date()), 1); t.setHours(10); return t; }
  return d;
}

export default function Appointments() {
  const toast = useToast();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Appt | null>(null);
  const [deleting, setDeleting] = useState(false);

  const range = useMemo(() => {
    if (view === "calendar") {
      const s = gridStart(month);
      return { from: s.toISOString(), to: addDays(s, 42).toISOString() };
    }
    const s = startOfDay(new Date());
    return { from: s.toISOString(), to: addDays(s, 180).toISOString() };
  }, [view, month]);

  const { data, loading, error, reload, setData } = useLoad(() => api<{ appointments: Appt[] }>("appointments", { params: range }), [range.from, range.to]);
  const appts = useMemo(() => data?.appointments || [], [data]);

  const byDay = useMemo(() => {
    const m = new Map<string, Appt[]>();
    for (const a of appts) {
      const k = dayKey(new Date(a.starts_at));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    }
    return m;
  }, [appts]);

  const replace = (a: Appt) => setData((d) => (d ? { ...d, appointments: d.appointments.map((x) => (x.id === a.id ? { ...x, ...a, lead_name: x.lead_name, lead_phone: x.lead_phone } : x)) } : d));

  async function changeStatus(a: Appt, status: Status) {
    if (status === a.status) return;
    replace({ ...a, status });
    try {
      const res = await api<{ appointment: Appt }>("appointment", { method: "PATCH", params: { id: a.id }, body: { status } });
      replace(res.appointment);
      toast(`Marked as ${STATUS_META[status].label.toLowerCase()}`);
    } catch (e) {
      replace(a);
      toast(errorMessage(e), "error");
    }
  }

  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api("appointment", { method: "DELETE", params: { id: toDelete.id } });
      setData((d) => (d ? { ...d, appointments: d.appointments.filter((x) => x.id !== toDelete.id) } : d));
      toast("Appointment deleted");
      setToDelete(null);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  }

  const upcomingCount = appts.filter((a) => (a.status === "requested" || a.status === "confirmed") && new Date(a.starts_at) >= new Date()).length;
  const rowProps = { onStatus: changeStatus, onDelete: setToDelete };

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={view === "list" && !loading && !error ? `${upcomingCount} upcoming ${upcomingCount === 1 ? "appointment" : "appointments"}` : "Visits, calls and bookings with your customers."}
        actions={
          <>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5" role="tablist" aria-label="View">
              {([["list", "Upcoming", List], ["calendar", "Calendar", CalendarDays]] as const).map(([v, label, I]) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-[13px] font-medium transition", view === v ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900")}>
                  <I className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreating(true)}>New appointment</Button>
          </>
        }
      />

      {error ? (
        <Alert tone="error" className="flex items-center justify-between gap-3">
          <span>{errorMessage(error)}</span>
          <Button size="sm" variant="secondary" onClick={reload}>Try again</Button>
        </Alert>
      ) : view === "list" ? (
        loading ? <ListSkeleton /> : appts.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CalendarDays className="w-5 h-5" />}
              title="No upcoming appointments"
              action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreating(true)}>Add an appointment</Button>}
            >
              Online booking and booking by your AI assistant arrive in the next phase. For now, add appointments here manually and link them to a lead to keep everything in one place.
            </EmptyState>
          </Card>
        ) : (
          <div className="space-y-6">
            {[...byDay.entries()].map(([k, list]) => {
              const d = new Date(list[0].starts_at);
              const isToday = sameDay(d, new Date());
              return (
                <section key={k}>
                  <div className="flex items-baseline gap-2 mb-2 px-1">
                    <h2 className={cn("text-sm font-semibold", isToday ? "text-orange-600" : "text-gray-900")}>{dayLabel(startOfDay(d))}</h2>
                    {(isToday || sameDay(d, addDays(new Date(), 1))) && <span className="text-xs text-gray-400">{d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>}
                    <span className="text-xs text-gray-400 ml-auto">{list.length} {list.length === 1 ? "appointment" : "appointments"}</span>
                  </div>
                  <Card className="divide-y divide-gray-100 overflow-hidden">
                    {list.map((a) => <ApptRow key={a.id} a={a} {...rowProps} />)}
                  </Card>
                </section>
              );
            })}
            <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1"><Sparkles className="w-3.5 h-3.5" />Online booking and AI booking arrive in the next phase.</p>
          </div>
        )
      ) : (
        <CalendarView
          month={month}
          setMonth={(m) => { setMonth(m); setSelectedDay(null); }}
          byDay={byDay}
          loading={loading}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          onAdd={() => setCreating(true)}
          rowProps={rowProps}
        />
      )}

      {creating && (
        <NewAppointment
          defaultDay={view === "calendar" && selectedDay ? selectedDay : null}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); reload(); }}
        />
      )}

      <Modal
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        title="Delete appointment?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>Keep it</Button>
            <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={remove} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          “<span className="font-medium text-gray-900">{toDelete?.title || "Appointment"}</span>” on {toDelete && new Date(toDelete.starts_at).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} will be removed permanently.
          If it just didn't go ahead, mark it as <span className="font-medium">Cancelled</span> or <span className="font-medium">No-show</span> instead to keep a record.
        </p>
      </Modal>
    </div>
  );
}

// ---------- row ----------
type RowProps = { onStatus: (a: Appt, s: Status) => void; onDelete: (a: Appt) => void };

function ApptRow({ a, onStatus, onDelete }: { a: Appt } & RowProps) {
  const muted = a.status === "cancelled" || a.status === "no_show";
  const dur = durationText(a);
  return (
    <div className={cn("flex gap-3 sm:gap-4 px-4 sm:px-5 py-3.5", muted && "bg-gray-50/50")}>
      <div className="w-14 sm:w-16 shrink-0 pt-0.5">
        <div className={cn("text-sm font-semibold tabular-nums", muted ? "text-gray-400 line-through" : "text-gray-900")}>{fmtTime(a.starts_at)}</div>
        {dur && <div className="text-xs text-gray-400">{dur}</div>}
      </div>
      <div className={cn("w-0.5 rounded-full shrink-0", a.status === "confirmed" ? "bg-emerald-400" : a.status === "requested" ? "bg-amber-400" : a.status === "completed" ? "bg-sky-400" : "bg-gray-200")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn("text-sm font-semibold truncate", muted ? "text-gray-500" : "text-gray-900")}>{a.title || "Appointment"}</h3>
              {a.created_by === "ai" && <Badge tone="violet"><Bot className="w-3 h-3" />Booked by AI</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-500">
              {a.lead_id && (
                <Link to="/app/leads" className="inline-flex items-center gap-1.5 hover:text-orange-600 min-w-0">
                  <Avatar name={a.lead_name || "?"} size={18} />
                  <span className="truncate font-medium text-gray-700">{a.lead_name || "Unnamed lead"}</span>
                </Link>
              )}
              {a.lead_phone && <a href={`tel:${a.lead_phone}`} className="inline-flex items-center gap-1 hover:text-orange-600"><Phone className="w-3.5 h-3.5" />{a.lead_phone}</a>}
              {a.location && <span className="inline-flex items-center gap-1 min-w-0"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{a.location}</span></span>}
            </div>
            {a.notes && <p className="mt-1.5 text-[13px] text-gray-500 line-clamp-2 flex gap-1.5"><StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />{a.notes}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusPicker value={a.status} onChange={(s) => onStatus(a, s)} />
            <button type="button" aria-label="Delete appointment" title="Delete" onClick={() => onDelete(a)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Badge-styled native select: quick to use on both desktop and phones. */
function StatusPicker({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  const m = STATUS_META[value] || STATUSES[0];
  return (
    <span className="relative inline-flex">
      <Badge tone={m.tone} dot className="pr-1.5 cursor-pointer">{m.label}<ChevronDown className="w-3 h-3 opacity-60" /></Badge>
      <select aria-label="Change status" value={value} onChange={(e) => onChange(e.target.value as Status)} className="absolute inset-0 opacity-0 cursor-pointer w-full">
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-28 mb-2" />
          <Card className="divide-y divide-gray-100">
            {[0, 1].map((j) => <div key={j} className="flex gap-4 p-4"><Skeleton className="h-4 w-12" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></div>)}
          </Card>
        </div>
      ))}
    </div>
  );
}

// ---------- calendar ----------
function CalendarView({ month, setMonth, byDay, loading, selectedDay, setSelectedDay, onAdd, rowProps }: {
  month: Date; setMonth: (d: Date) => void; byDay: Map<string, Appt[]>; loading: boolean;
  selectedDay: string | null; setSelectedDay: (k: string | null) => void; onAdd: () => void; rowProps: RowProps;
}) {
  const start = gridStart(month);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const todayKey = dayKey(new Date());
  const monthTotal = days.filter((d) => d.getMonth() === month.getMonth()).reduce((n, d) => n + (byDay.get(dayKey(d))?.length || 0), 0);
  const selected = selectedDay ? byDay.get(selectedDay) || [] : null;
  const selectedDate = selectedDay ? new Date(`${selectedDay}T00:00:00`) : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-900 flex-1">
            {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            <span className="ml-2 text-xs font-normal text-gray-400">{loading ? "" : `${monthTotal} ${monthTotal === 1 ? "appointment" : "appointments"}`}</span>
          </h2>
          {loading && <Spinner className="w-4 h-4" />}
          <Button size="sm" variant="secondary" onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); }}>Today</Button>
          <Button size="sm" variant="ghost" className="w-8 px-0" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} icon={<ChevronLeft className="w-4 h-4" />} />
          <Button size="sm" variant="ghost" className="w-8 px-0" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} icon={<ChevronRight className="w-4 h-4" />} />
        </div>
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60">
          {WEEKDAYS.map((w) => <div key={w} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const k = dayKey(d);
            const list = byDay.get(k) || [];
            const inMonth = d.getMonth() === month.getMonth();
            const isSel = selectedDay === k;
            const isToday = k === todayKey;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedDay(isSel ? null : k)}
                className={cn(
                  "relative text-left min-h-[56px] sm:min-h-[96px] p-1 sm:p-1.5 border-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400",
                  i % 7 !== 6 && "border-r", i < 35 && "border-b",
                  inMonth ? "bg-white hover:bg-orange-50/40" : "bg-gray-50/60 text-gray-400",
                  isSel && "bg-orange-50/70 ring-2 ring-inset ring-orange-300",
                )}
                aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}, ${list.length} appointments`}
              >
                <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium tabular-nums",
                  isToday ? "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white" : inMonth ? "text-gray-700" : "text-gray-400")}>
                  {d.getDate()}
                </span>
                {list.length > 0 && (
                  <>
                    {/* phones: dots */}
                    <div className="sm:hidden flex gap-0.5 mt-1 pl-1">
                      {list.slice(0, 3).map((a) => <span key={a.id} className={cn("w-1.5 h-1.5 rounded-full", dotTone(a.status))} />)}
                    </div>
                    {/* larger screens: pills */}
                    <div className="hidden sm:block mt-1 space-y-0.5">
                      {list.slice(0, 2).map((a) => (
                        <div key={a.id} className={cn("truncate rounded px-1.5 py-0.5 text-[11px] leading-tight", pillTone(a.status))}>
                          <span className="tabular-nums font-semibold">{fmtTime(a.starts_at)}</span> {a.title || a.lead_name || "Appointment"}
                        </div>
                      ))}
                      {list.length > 2 && <div className="px-1.5 text-[11px] text-gray-500">+{list.length - 2} more</div>}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="xl:sticky xl:top-4">
        {selected && selectedDate ? (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <h2 className="text-sm font-semibold text-gray-900 flex-1">{dayLabel(selectedDate)}{["Today", "Tomorrow", "Yesterday"].includes(dayLabel(selectedDate)) && <span className="ml-2 text-xs font-normal text-gray-400">{selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>}</h2>
              <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5" />} onClick={() => setSelectedDay(null)}>Clear</Button>
            </div>
            <Card className="divide-y divide-gray-100 overflow-hidden">
              {selected.length ? selected.map((a) => <ApptRow key={a.id} a={a} {...rowProps} />) : (
                <EmptyState icon={<CalendarPlus className="w-5 h-5" />} title="Nothing booked" className="py-10" action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={onAdd}>Add for this day</Button>}>
                  This day is free.
                </EmptyState>
              )}
            </Card>
          </div>
        ) : (
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-orange-50 ring-1 ring-orange-100 text-orange-600 flex items-center justify-center shrink-0"><CalendarDays className="w-4 h-4" /></span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Pick a day</h3>
                <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">Tap any day to see its appointments, change their status or add a new one.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
              {STATUSES.map((s) => <span key={s.value} className="inline-flex items-center gap-1.5"><span className={cn("w-2 h-2 rounded-full", dotTone(s.value))} />{s.label}</span>)}
            </div>
            <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0" />Online booking and AI booking arrive in the next phase. For now, add appointments manually.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

const dotTone = (s: Status) => ({ requested: "bg-amber-400", confirmed: "bg-emerald-500", completed: "bg-sky-500", no_show: "bg-red-400", cancelled: "bg-gray-300" }[s] || "bg-gray-300");
const pillTone = (s: Status) => ({
  requested: "bg-amber-50 text-amber-800", confirmed: "bg-emerald-50 text-emerald-800", completed: "bg-sky-50 text-sky-800",
  no_show: "bg-red-50 text-red-700 line-through", cancelled: "bg-gray-100 text-gray-500 line-through",
}[s] || "bg-gray-100 text-gray-600");

// ---------- new appointment ----------
function NewAppointment({ defaultDay, onClose, onCreated }: { defaultDay: string | null; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [lead, setLead] = useState<LeadLite | null>(null);
  const [start, setStart] = useState(() => {
    if (defaultDay) { const d = new Date(`${defaultDay}T10:00:00`); return toLocalInput(d.toISOString()); }
    return toLocalInput(defaultStart().toISOString());
  });
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"requested" | "confirmed">("confirmed");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const starts = fromLocalInput(start);
    if (!starts) { toast("Choose a date and time.", "error"); return; }
    const ends = new Date(new Date(starts).getTime() + duration * 60000).toISOString();
    setSaving(true);
    try {
      await api("appointments", {
        method: "POST",
        body: { title: title.trim() || (lead ? `Appointment with ${lead.name || lead.phone || lead.email}` : ""), lead_id: lead?.id || null, starts_at: starts, ends_at: ends, location: location.trim(), notes: notes.trim(), status },
      });
      toast("Appointment added");
      onCreated();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  }

  const endPreview = (() => {
    const s = fromLocalInput(start);
    return s ? fmtTime(new Date(new Date(s).getTime() + duration * 60000).toISOString()) : "";
  })();

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title="New appointment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving} icon={<CalendarPlus className="w-4 h-4" />}>Add appointment</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Free quote visit" autoFocus />
        </Field>

        <LeadPicker value={lead} onChange={setLead} />

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_150px] gap-4">
          <Field label="Date and time">
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
          </Field>
          <Field label="Duration" hint={endPreview ? `Ends at ${endPreview}` : undefined}>
            <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((m) => <option key={m} value={m}>{m < 60 ? `${m} minutes` : m === 60 ? "1 hour" : `${m / 60} hours`}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Location" hint="An address, “Phone call” or a video link.">
          <Input value={location} maxLength={200} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. 14 Park Lane, Leeds LS1 2AB" />
        </Field>

        <Field label="Notes (optional)">
          <Textarea rows={3} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Side gate code 1234. Customer prefers a text before arrival." />
        </Field>

        <div>
          <span className="block text-[13px] font-medium text-gray-700 mb-1.5">Status</span>
          <div className="grid grid-cols-2 gap-2">
            {([["confirmed", "Confirmed", "The time is agreed"], ["requested", "Requested", "Waiting to confirm"]] as const).map(([v, label, hint]) => (
              <button key={v} type="button" onClick={() => setStatus(v)}
                className={cn("text-left rounded-lg border px-3 py-2.5 transition", status === v ? "border-orange-300 bg-orange-50/50 ring-4 ring-orange-100" : "border-gray-200 hover:border-gray-300")}>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><span className={cn("w-2 h-2 rounded-full", dotTone(v))} />{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{hint}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function LeadPicker({ value, onChange }: { value: LeadLite | null; onChange: (l: LeadLite | null) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<LeadLite[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      api<{ leads: LeadLite[] }>("leads", { params: { q: q.trim() } })
        .then((r) => alive && setResults(r.leads.slice(0, 8)))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setSearching(false));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q, open]);

  if (value) {
    return (
      <Field label="Customer (optional)">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
          <Avatar name={value.name || value.phone || "?"} size={28} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">{value.name || "Unnamed lead"}</div>
            <div className="text-xs text-gray-500 truncate">{[value.phone, value.email].filter(Boolean).join(" · ") || "No contact details"}</div>
          </div>
          <button type="button" onClick={() => onChange(null)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Remove customer"><X className="w-4 h-4" /></button>
        </div>
      </Field>
    );
  }

  return (
    <Field label="Customer (optional)" hint="Linking a lead moves them to the Appointment stage.">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search leads by name, phone or email"
          className="pl-9"
          role="combobox"
          aria-expanded={open}
        />
        {open && (
          <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {searching && !results.length ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500"><Spinner className="w-4 h-4" />Searching…</div>
            ) : results.length ? (
              <ul role="listbox">
                {results.map((l) => (
                  <li key={l.id}>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(l); setOpen(false); setQ(""); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-orange-50/60">
                      <Avatar name={l.name || l.phone || "?"} size={26} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{l.name || "Unnamed lead"}</div>
                        <div className="text-xs text-gray-500 truncate">{[l.phone, l.email, l.service_interest].filter(Boolean).join(" · ")}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-3 text-sm text-gray-500 flex items-center gap-2"><UserRound className="w-4 h-4 text-gray-400" />{q ? "No leads match that search." : "No leads yet."}</div>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
