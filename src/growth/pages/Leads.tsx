import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Search, Users, Plug, Phone, Mail, CalendarPlus, Trash2, ChevronLeft, ChevronRight, MessagesSquare,
  CalendarDays, Clock, Sparkles, AlertTriangle, ArrowUpRight, MapPin, Briefcase, Activity, RefreshCw,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { useAuth, canManage } from "../auth";
import {
  Alert, Avatar, Badge, Button, Card, ChannelIcon, Drawer, EmptyState, Field, Input, Modal, PageHeader, ScoreBadge,
  Select, Skeleton, StatusBadge, Tabs, Textarea, Toggle, cn, useLoad, useToast,
} from "../ui";
import {
  CHANNEL_LABEL, LEAD_STATUSES, SOURCE_LABEL, STATUS_LABEL, eventText, fmtDate, fmtDateTime, fromLocalInput, timeAgo, toLocalInput,
} from "../format";

// ---------- types ----------
type Lead = {
  id: string; name: string; phone: string; email: string; source: string; service_interest: string; location: string;
  budget: string; preferred_date: string; urgency: "" | "low" | "medium" | "high"; ready_to_book: boolean; status: string;
  score: number; score_label: "cold" | "warm" | "hot"; qualification: { reasons?: string[] } | null; notes: string;
  value_pence: number | null; last_contact_at: string | null; next_follow_up_at: string | null; created_at: string; updated_at: string;
};
type LeadsResponse = { leads: Lead[]; total: number; page: number; counts: Record<string, number> };
type LeadConversation = { id: string; channel: string; status: string; handler: string; last_message_at: string | null; last_message_preview: string };
type Appointment = { id: string; title: string; starts_at: string; ends_at: string | null; status: string; location: string; notes: string };
type LeadEvent = { id: string; type: string; actor: string; data: any; created_at: string };
type LeadDetail = { lead: Lead; conversations: LeadConversation[]; appointments: Appointment[]; events: LeadEvent[] };

type LeadForm = {
  name: string; phone: string; email: string; source: string; service_interest: string; location: string; budget: string;
  preferred_date: string; urgency: string; ready_to_book: boolean; status: string; notes: string; value: string; next_follow_up_at: string;
};

const PAGE_SIZE = 50;
const SORTS = [
  { value: "created_at", label: "Newest first" },
  { value: "score", label: "Highest score" },
  { value: "last_contact_at", label: "Recently contacted" },
  { value: "next_follow_up_at", label: "Next follow-up" },
  { value: "name", label: "Name (A–Z)" },
];
const URGENCY_LABEL: Record<string, string> = { "": "Not set", low: "Low", medium: "Medium", high: "High" };
const APPT_STATUS_TONE: Record<string, "green" | "amber" | "gray" | "red" | "blue"> = { confirmed: "green", requested: "amber", cancelled: "gray", completed: "blue", no_show: "red" };

const leadName = (l: Pick<Lead, "name" | "phone" | "email">) => l.name || l.phone || l.email || "Unnamed lead";
const isOverdue = (l: Lead) => !!l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() < Date.now() && !["won", "lost"].includes(l.status);

const emptyForm = (): LeadForm => ({
  name: "", phone: "", email: "", source: "manual", service_interest: "", location: "", budget: "", preferred_date: "",
  urgency: "", ready_to_book: false, status: "new", notes: "", value: "", next_follow_up_at: "",
});
const formFromLead = (l: Lead): LeadForm => ({
  name: l.name || "", phone: l.phone || "", email: l.email || "", source: l.source || "manual", service_interest: l.service_interest || "",
  location: l.location || "", budget: l.budget || "", preferred_date: l.preferred_date || "", urgency: l.urgency || "",
  ready_to_book: !!l.ready_to_book, status: l.status, notes: l.notes || "",
  value: typeof l.value_pence === "number" ? String(l.value_pence / 100) : "", next_follow_up_at: toLocalInput(l.next_follow_up_at),
});
/** Form → API body. With `base`, only fields that changed are included. */
function formToBody(f: LeadForm, base?: LeadForm) {
  const out: Record<string, unknown> = {};
  (Object.keys(f) as (keyof LeadForm)[]).forEach((k) => {
    if (base && f[k] === base[k]) return;
    if (k === "value") {
      const n = parseFloat(f.value.replace(/[£,\s]/g, ""));
      out.value_pence = f.value.trim() === "" || Number.isNaN(n) ? null : Math.round(n * 100);
    } else if (k === "next_follow_up_at") out.next_follow_up_at = fromLocalInput(f.next_follow_up_at);
    else out[k] = typeof f[k] === "string" ? (f[k] as string).trim() : f[k];
  });
  return out;
}
const tomorrowAt10 = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return toLocalInput(d.toISOString()); };

// ---------- shared form fields ----------
function LeadFields({ form, set, creating }: { form: LeadForm; set: (patch: Partial<LeadForm>) => void; creating?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
      <Field label="Full name" className="sm:col-span-2">
        <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Sarah Thompson" autoFocus={creating} />
      </Field>
      <Field label="Phone">
        <Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+44 7700 900123" />
      </Field>
      <Field label="Email">
        <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="sarah@example.com" />
      </Field>
      <Field label="Source">
        <Select value={form.source} onChange={(e) => set({ source: e.target.value })}>
          {Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      {!creating && (
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set({ status: e.target.value })}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Service interested in" className={creating ? "" : "sm:col-span-2"}>
        <Input value={form.service_interest} onChange={(e) => set({ service_interest: e.target.value })} placeholder="e.g. Kitchen fitting" />
      </Field>
      <Field label="Location">
        <Input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Manchester" />
      </Field>
      <Field label="Budget">
        <Input value={form.budget} onChange={(e) => set({ budget: e.target.value })} placeholder="e.g. £5,000–£8,000" />
      </Field>
      <Field label="Urgency">
        <Select value={form.urgency} onChange={(e) => set({ urgency: e.target.value })}>
          {Object.entries(URGENCY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      {!creating && (
        <Field label="Preferred date">
          <Input value={form.preferred_date} onChange={(e) => set({ preferred_date: e.target.value })} placeholder="e.g. Early next month" />
        </Field>
      )}
      {!creating && (
        <Field label="Deal value (£)" hint="Optional. Used for reporting.">
          <Input inputMode="decimal" value={form.value} onChange={(e) => set({ value: e.target.value })} placeholder="0.00" />
        </Field>
      )}
      <Field label="Next follow-up">
        <Input type="datetime-local" value={form.next_follow_up_at} onChange={(e) => set({ next_follow_up_at: e.target.value })} />
      </Field>
      {!creating && (
        <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
          <div>
            <div className="text-[13px] font-medium text-gray-800">Ready to book</div>
            <div className="text-xs text-gray-500">The customer has said they want to go ahead.</div>
          </div>
          <Toggle checked={form.ready_to_book} onChange={(v) => set({ ready_to_book: v })} />
        </div>
      )}
      <Field label="Notes" className="sm:col-span-2">
        <Textarea rows={creating ? 3 : 4} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Anything the team should know about this lead" />
      </Field>
    </div>
  );
}

// ---------- add lead ----------
function AddLeadModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (lead: Lead) => void }) {
  const toast = useToast();
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm(emptyForm()); setError(""); } }, [open]);
  const valid = !!(form.name.trim() || form.phone.trim() || form.email.trim());
  const submit = async () => {
    if (!valid) { setError("Add at least a name, phone number or email."); return; }
    setBusy(true); setError("");
    try {
      const body = formToBody(form);
      delete body.status;
      const r = await api<{ lead: Lead }>("leads", { method: "POST", body });
      toast(`${leadName(r.lead)} added`);
      onCreated(r.lead);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} wide title="Add a lead"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy} disabled={!valid}>Add lead</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <p className="text-sm text-gray-500 mb-4">For leads that came in by phone, email or in person. We'll score them automatically.</p>
        {error && <Alert tone="error" className="mb-4">{error}</Alert>}
        <LeadFields form={form} set={(p) => setForm((f) => ({ ...f, ...p }))} creating />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

// ---------- book appointment ----------
function BookAppointmentModal({ lead, open, onClose, onBooked }: { lead: Lead; open: boolean; onClose: () => void; onBooked: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setTitle(lead.service_interest ? `${lead.service_interest} – ${leadName(lead)}` : `Appointment with ${leadName(lead)}`);
    setWhen(tomorrowAt10()); setLocation(lead.location || ""); setNotes(""); setError("");
  }, [open, lead]);
  const submit = async () => {
    const iso = fromLocalInput(when);
    if (!iso) { setError("Choose a date and time."); return; }
    setBusy(true); setError("");
    try {
      await api("appointments", { method: "POST", body: { lead_id: lead.id, title: title.trim() || "Appointment", starts_at: iso, location: location.trim(), notes: notes.trim() } });
      toast("Appointment booked");
      onBooked();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Book an appointment"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy} icon={<CalendarPlus className="w-4 h-4" />}>Book appointment</Button></>}>
      <div className="space-y-3.5">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Date and time"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field>
        <Field label="Location" hint="Optional. An address, “Phone call” or a video link."><Input value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
        <Field label="Notes"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>
        {["new", "contacted", "qualified"].includes(lead.status) && (
          <p className="text-xs text-gray-500">The lead will move to <span className="font-medium text-gray-700">Appointment</span> automatically.</p>
        )}
      </div>
    </Modal>
  );
}

// ---------- lead drawer ----------
function Section({ title, icon, children, action }: { title: string; icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="px-5 py-5 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gray-500">{icon}{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function LeadDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const { me } = useAuth();
  const { data, loading, error, reload, setData } = useLoad(() => api<LeadDetail>("lead", { params: { id } }), [id]);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [base, setBase] = useState<LeadForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!data?.lead) return;
    const f = formFromLead(data.lead);
    setForm(f); setBase(f);
  }, [data]);

  const dirty = useMemo(() => Object.keys(formToBody(form, base)).length > 0, [form, base]);
  const lead = data?.lead;

  const save = async () => {
    const body = formToBody(form, base);
    if (!Object.keys(body).length) return;
    setSaving(true);
    try {
      const r = await api<LeadDetail>("lead", { method: "PATCH", params: { id }, body });
      setData(r); toast("Changes saved"); onChanged();
    } catch (e) { toast(errorMessage(e), "error"); } finally { setSaving(false); }
  };
  const changeStatus = async (status: string) => {
    if (!lead || status === lead.status) return;
    setStatusBusy(true);
    try {
      const r = await api<LeadDetail>("lead", { method: "PATCH", params: { id }, body: { status } });
      setData(r); toast(`Moved to ${STATUS_LABEL[status]}`); onChanged();
    } catch (e) { toast(errorMessage(e), "error"); } finally { setStatusBusy(false); }
  };
  const remove = async () => {
    setDeleting(true);
    try {
      await api("lead", { method: "DELETE", params: { id } });
      toast("Lead deleted"); setConfirmDelete(false); onChanged(); onClose();
    } catch (e) { toast(errorMessage(e), "error"); } finally { setDeleting(false); }
  };
  const tryClose = () => {
    if (booking || confirmDelete) return; // Escape closes the inner modal first
    if (dirty && !window.confirm("You have unsaved changes. Close without saving?")) return;
    onClose();
  };

  const title = lead ? (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar name={leadName(lead)} size={40} />
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-gray-900 truncate">{leadName(lead)}</div>
        <div className="flex items-center gap-1.5 mt-0.5"><StatusBadge status={lead.status} /><ScoreBadge label={lead.score_label} score={lead.score} /></div>
      </div>
    </div>
  ) : <div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-24" /></div></div>;

  const footer = lead ? (
    <>
      {canManage(me) && <Button variant="ghost" className="mr-auto !text-red-600 hover:!bg-red-50" icon={<Trash2 className="w-4 h-4" />} onClick={() => setConfirmDelete(true)}>Delete</Button>}
      {dirty && <Button variant="secondary" onClick={() => setForm(base)}>Discard</Button>}
      <Button onClick={save} loading={saving} disabled={!dirty}>Save changes</Button>
    </>
  ) : undefined;

  const reasons = lead?.qualification?.reasons || [];

  return (
    <Drawer open onClose={tryClose} title={title} footer={footer}>
      {loading && !data ? (
        <div className="p-5 space-y-4">
          <Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" />
        </div>
      ) : error && !data ? (
        <div className="p-5">
          <Alert tone="error">{errorMessage(error)}</Alert>
          <Button variant="secondary" className="mt-3" icon={<RefreshCw className="w-4 h-4" />} onClick={reload}>Try again</Button>
        </div>
      ) : lead ? (
        <>
          {/* quick actions */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex flex-wrap items-center gap-2">
              {lead.phone && <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50"><Phone className="w-3.5 h-3.5" />Call</a>}
              {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50"><Mail className="w-3.5 h-3.5" />Email</a>}
              <Button size="sm" variant="secondary" icon={<CalendarPlus className="w-3.5 h-3.5" />} onClick={() => setBooking(true)}>Book appointment</Button>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-500 mb-1.5">Move to stage</div>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_STATUSES.map((s) => (
                  <button key={s} disabled={statusBusy} onClick={() => changeStatus(s)}
                    className={cn("h-7 px-2.5 rounded-md text-xs font-medium transition border disabled:opacity-60",
                      lead.status === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900")}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* score */}
          <Section title="Lead score" icon={<Sparkles className="w-3.5 h-3.5 text-orange-500" />}>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold tracking-tight tabular-nums text-gray-900">{lead.score}<span className="text-base font-medium text-gray-400">/100</span></div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", lead.score_label === "hot" ? "bg-gradient-to-r from-[#F69D01] to-[#F65901]" : lead.score_label === "warm" ? "bg-amber-400" : "bg-sky-400")} style={{ width: `${Math.max(3, lead.score)}%` }} />
                </div>
                <div className="mt-1.5"><ScoreBadge label={lead.score_label} /></div>
              </div>
            </div>
            {reasons.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {reasons.map((r, i) => <li key={i} className="flex gap-2 text-[13px] text-gray-600"><span className="mt-[7px] w-1 h-1 rounded-full bg-gray-400 shrink-0" />{r}</li>)}
              </ul>
            ) : <p className="mt-3 text-[13px] text-gray-500">The score updates as we learn more: service, budget, urgency and readiness all count.</p>}
          </Section>

          {/* details */}
          <Section title="Details" icon={<Briefcase className="w-3.5 h-3.5" />}>
            <LeadFields form={form} set={(p) => setForm((f) => ({ ...f, ...p }))} />
            <div className="mt-3 text-xs text-gray-400">Created {fmtDateTime(lead.created_at)} · Last contact {timeAgo(lead.last_contact_at)}</div>
          </Section>

          {/* conversations */}
          <Section title="Conversations" icon={<MessagesSquare className="w-3.5 h-3.5" />}>
            {data!.conversations.length ? (
              <div className="space-y-2">
                {data!.conversations.map((c) => (
                  <Link key={c.id} to={`/app/conversations/${c.id}`} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition">
                    <ChannelIcon channel={c.channel} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-gray-800">
                        {CHANNEL_LABEL[c.channel] || c.channel}
                        {c.status === "closed" && <Badge>Closed</Badge>}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{c.last_message_preview || "No messages yet"}</div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(c.last_message_at)}</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : <p className="text-[13px] text-gray-500">No conversations linked to this lead yet.</p>}
          </Section>

          {/* appointments */}
          <Section title="Appointments" icon={<CalendarDays className="w-3.5 h-3.5" />}
            action={<button onClick={() => setBooking(true)} className="text-xs font-semibold text-orange-600 hover:text-orange-700">+ Book</button>}>
            {data!.appointments.length ? (
              <div className="space-y-2">
                {data!.appointments.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                    <div className="w-10 shrink-0 text-center rounded-md bg-orange-50 text-orange-700 py-1">
                      <div className="text-[10px] font-semibold uppercase leading-none">{new Date(a.starts_at).toLocaleDateString("en-GB", { month: "short" })}</div>
                      <div className="text-base font-bold leading-tight tabular-nums">{new Date(a.starts_at).getDate()}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-gray-800 truncate">{a.title || "Appointment"}</div>
                      <div className="text-xs text-gray-500">{fmtDateTime(a.starts_at)}{a.location ? ` · ${a.location}` : ""}</div>
                    </div>
                    <Badge tone={APPT_STATUS_TONE[a.status] || "gray"} className="capitalize">{a.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-[13px] text-gray-500">No appointments booked.</p>}
          </Section>

          {/* activity */}
          <Section title="Activity" icon={<Activity className="w-3.5 h-3.5" />}>
            {data!.events.length ? (
              <ol className="relative ml-1.5 border-l border-gray-200 space-y-3.5">
                {data!.events.map((e) => (
                  <li key={e.id} className="pl-4 relative">
                    <span className={cn("absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white", e.type === "lead.hot" || e.type === "lead.won" ? "bg-orange-500" : "bg-gray-300")} />
                    <div className="text-[13px] text-gray-800">{eventText(e)}</div>
                    <div className="text-xs text-gray-400">{fmtDateTime(e.created_at)}{e.actor?.startsWith("user:") ? " · Team" : e.actor === "ai" ? " · AI" : ""}</div>
                  </li>
                ))}
              </ol>
            ) : <p className="text-[13px] text-gray-500">No activity yet.</p>}
          </Section>

          <BookAppointmentModal lead={lead} open={booking} onClose={() => setBooking(false)} onBooked={() => { setBooking(false); reload(); onChanged(); }} />
          <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this lead?"
            footer={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={remove} icon={<Trash2 className="w-4 h-4" />}>Delete lead</Button></>}>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{leadName(lead)}</span> and their activity history will be permanently removed. Conversations stay in your inbox but will no longer be linked to a lead. This can't be undone.
            </p>
          </Modal>
        </>
      ) : null}
    </Drawer>
  );
}

// ---------- list pieces ----------
function FollowUp({ lead }: { lead: Lead }) {
  if (!lead.next_follow_up_at) return <span className="text-gray-400">—</span>;
  const overdue = isOverdue(lead);
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", overdue ? "text-red-600 font-medium" : "text-gray-700")}>
      {overdue && <AlertTriangle className="w-3.5 h-3.5" />}
      {fmtDateTime(lead.next_follow_up_at)}
    </span>
  );
}

function SourceCell({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700">
      {CHANNEL_LABEL[source] ? <ChannelIcon channel={source} className="!w-5 !h-5" /> : null}
      {SOURCE_LABEL[source] || source}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-28" /></div>
          <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
          <Skeleton className="h-5 w-14 rounded-full hidden md:block" />
          <Skeleton className="h-3.5 w-20 hidden md:block" />
        </div>
      ))}
    </div>
  );
}

// ---------- page ----------
export default function Leads() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const openId = params.get("lead");
  const [status, setStatus] = useState<string>("all");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [score, setScore] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("created_at");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const { data, loading, error, reload } = useLoad(
    () => api<LeadsResponse>("leads", { params: { status: status === "all" ? undefined : status, q, score, source, sort, page } }),
    [status, q, score, source, sort, page],
  );

  const counts = data?.counts || {};
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const filtered = !!(q || score || source || status !== "all");
  const noLeadsAtAll = !!data && allCount === 0;
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const open = (id: string) => setParams((p) => { const n = new URLSearchParams(p); n.set("lead", id); return n; });
  const close = () => setParams((p) => { const n = new URLSearchParams(p); n.delete("lead"); return n; }, { replace: true });
  const clearFilters = () => { setQInput(""); setQ(""); setScore(""); setSource(""); setStatus("all"); setPage(1); };
  const onFilter = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1); };

  const tabs = [
    { value: "all", label: "All", count: data ? allCount : undefined },
    ...LEAD_STATUSES.map((s) => ({ value: s as string, label: STATUS_LABEL[s], count: data ? counts[s] || 0 : undefined })),
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Every enquiry from your website chat, WhatsApp and other channels, scored and in one place."
        actions={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setAdding(true)}>Add lead</Button>}
      />

      {noLeadsAtAll ? (
        <Card>
          <EmptyState icon={<Users className="w-6 h-6" />} title="No leads yet"
            action={
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button icon={<Plus className="w-4 h-4" />} onClick={() => setAdding(true)}>Add lead manually</Button>
                <Button variant="secondary" icon={<Plug className="w-4 h-4" />} onClick={() => navigate("/app/integrations")}>Connect channels</Button>
              </div>
            }>
            Leads appear here automatically when customers chat with your AI assistant on your website or message you on WhatsApp. Each one is scored Hot, Warm or Cold so you know who to call first.
          </EmptyState>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-2 sm:px-3 pt-1">
            <Tabs value={status} onChange={onFilter(setStatus)} items={tabs} />
          </div>

          {/* filters */}
          <div className="flex flex-col md:flex-row gap-2 p-3 sm:p-4 border-b border-gray-100 border-t">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search name, phone, email, service or location" className="pl-9" aria-label="Search leads" />
            </div>
            <div className="grid grid-cols-3 gap-2 md:flex md:w-auto">
              <Select value={score} onChange={(e) => onFilter(setScore)(e.target.value)} className="md:w-32" aria-label="Score">
                <option value="">All scores</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option>
              </Select>
              <Select value={source} onChange={(e) => onFilter(setSource)(e.target.value)} className="md:w-40" aria-label="Source">
                <option value="">All sources</option>
                {Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <Select value={sort} onChange={(e) => onFilter(setSort)(e.target.value)} className="md:w-44" aria-label="Sort by">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
          </div>

          {error && !data ? (
            <div className="p-4">
              <Alert tone="error">{errorMessage(error)}</Alert>
              <Button variant="secondary" className="mt-3" icon={<RefreshCw className="w-4 h-4" />} onClick={reload}>Try again</Button>
            </div>
          ) : !data ? (
            <TableSkeleton />
          ) : data.leads.length === 0 ? (
            <EmptyState icon={<Search className="w-6 h-6" />} title={filtered ? "No leads match these filters" : "Nothing here yet"}
              action={filtered ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : undefined}>
              {status !== "all" && !q && !score && !source ? `You don't have any leads in ${STATUS_LABEL[status]} right now.` : "Try a different search or remove a filter."}
            </EmptyState>
          ) : (
            <div className={cn("transition-opacity", loading && "opacity-60")}>
              {/* desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 bg-gray-50/70 border-b border-gray-100">
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-3 py-2.5 font-medium">Source</th>
                      <th className="px-3 py-2.5 font-medium">Service</th>
                      <th className="px-3 py-2.5 font-medium hidden xl:table-cell">Location</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Score</th>
                      <th className="px-3 py-2.5 font-medium hidden lg:table-cell">Last contact</th>
                      <th className="px-3 py-2.5 font-medium">Next follow-up</th>
                      <th className="px-4 py-2.5 font-medium hidden xl:table-cell text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.leads.map((l) => (
                      <tr key={l.id} onClick={() => open(l.id)} className="cursor-pointer hover:bg-gray-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar name={leadName(l)} size={34} />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate max-w-[220px]">{leadName(l)}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[220px] tabular-nums">{[l.phone, l.email].filter(Boolean).join(" · ") || "No contact details yet"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap"><SourceCell source={l.source} /></td>
                        <td className="px-3 py-3 text-gray-700"><span className="block truncate max-w-[180px]">{l.service_interest || <span className="text-gray-400">—</span>}</span></td>
                        <td className="px-3 py-3 text-gray-700 hidden xl:table-cell"><span className="block truncate max-w-[140px]">{l.location || <span className="text-gray-400">—</span>}</span></td>
                        <td className="px-3 py-3"><StatusBadge status={l.status} /></td>
                        <td className="px-3 py-3"><ScoreBadge label={l.score_label} score={l.score} /></td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap hidden lg:table-cell">{timeAgo(l.last_contact_at)}</td>
                        <td className="px-3 py-3 whitespace-nowrap"><FollowUp lead={l} /></td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden xl:table-cell text-right tabular-nums">{fmtDate(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile cards */}
              <ul className="md:hidden divide-y divide-gray-100">
                {data.leads.map((l) => (
                  <li key={l.id}>
                    <button onClick={() => open(l.id)} className="w-full text-left px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition">
                      <div className="flex items-start gap-3">
                        <Avatar name={leadName(l)} size={38} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-[14px] text-gray-900 truncate">{leadName(l)}</div>
                            <ScoreBadge label={l.score_label} score={l.score} />
                          </div>
                          <div className="text-xs text-gray-500 truncate tabular-nums">{[l.phone, l.email].filter(Boolean).join(" · ") || "No contact details yet"}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-600">
                            <StatusBadge status={l.status} />
                            <span>{SOURCE_LABEL[l.source] || l.source}</span>
                            {l.service_interest && <span className="inline-flex items-center gap-1 truncate max-w-[160px]"><Briefcase className="w-3 h-3 text-gray-400" />{l.service_interest}</span>}
                            {l.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{l.location}</span>}
                          </div>
                          {l.next_follow_up_at && (
                            <div className={cn("mt-1.5 inline-flex items-center gap-1 text-xs", isOverdue(l) ? "text-red-600 font-medium" : "text-gray-500")}>
                              <Clock className="w-3 h-3" />{isOverdue(l) ? "Overdue: " : "Follow up "}{fmtDateTime(l.next_follow_up_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* pagination */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-[13px] text-gray-500">
                <span className="tabular-nums">
                  {(data.page - 1) * PAGE_SIZE + 1}–{Math.min(data.page * PAGE_SIZE, data.total)} of {data.total.toLocaleString("en-GB")} lead{data.total === 1 ? "" : "s"}
                </span>
                {pages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft className="w-4 h-4" />} aria-label="Previous page"><span className="hidden sm:inline">Previous</span></Button>
                    <span className="px-1.5 tabular-nums">{page} / {pages}</span>
                    <Button size="sm" variant="secondary" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><span className="hidden sm:inline">Next</span><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      <AddLeadModal open={adding} onClose={() => setAdding(false)} onCreated={(l) => { setAdding(false); reload(); open(l.id); }} />
      {openId && <LeadDrawer key={openId} id={openId} onClose={close} onChanged={reload} />}
    </div>
  );
}
