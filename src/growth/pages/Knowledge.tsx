import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Wrench, PoundSterling, HelpCircle, Clock, MapPin, ShieldCheck, Phone, Sparkles, Plus, Pencil, Trash2,
  BookOpen, FileUp, Globe, ArrowRight, Lock, Info, ChevronRight,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { useAuth, canManage } from "../auth";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Textarea, Toggle, cn, useLoad, useToast } from "../ui";

type Kind = "company" | "service" | "price" | "faq" | "hours" | "location" | "policy" | "contact" | "instruction";
type Item = { id: string; kind: Kind; title: string; content: string; enabled: boolean; position: number; created_at: string; updated_at?: string };

type KindMeta = {
  label: string;
  singular: string;
  icon: typeof Building2;
  explainer: string;
  titleLabel: string;
  titlePlaceholder: string;
  contentLabel: string;
  contentPlaceholder: string;
  noTitle?: boolean;
};

const KINDS: Kind[] = ["company", "service", "price", "faq", "hours", "location", "policy", "contact", "instruction"];

const META: Record<Kind, KindMeta> = {
  company: {
    label: "Company information", singular: "company detail", icon: Building2,
    explainer: "Who you are, what makes you different and anything a customer might ask about your business.",
    titleLabel: "Topic", titlePlaceholder: "e.g. About us",
    contentLabel: "Details", contentPlaceholder: "e.g. Family-run plumbing firm serving Leeds since 2009. Gas Safe registered, fully insured, 4.9★ on Google from 300+ reviews.",
  },
  service: {
    label: "Services", singular: "service", icon: Wrench,
    explainer: "What you offer, who it's for and what's included, so the assistant can recommend the right thing.",
    titleLabel: "Service name", titlePlaceholder: "e.g. Boiler servicing",
    contentLabel: "Description", contentPlaceholder: "e.g. Annual service for gas boilers, includes safety check and certificate. Takes around 1 hour. Available Monday–Saturday.",
  },
  price: {
    label: "Prices", singular: "price", icon: PoundSterling,
    explainer: "Prices, packages and what affects the cost. The assistant will never quote a price that isn't here.",
    titleLabel: "What's being priced", titlePlaceholder: "e.g. Boiler service",
    contentLabel: "Price and conditions", contentPlaceholder: "e.g. £85 including VAT. £10 discount for returning customers. Call-out within 10 miles included.",
  },
  faq: {
    label: "FAQs", singular: "FAQ", icon: HelpCircle,
    explainer: "Questions customers ask you all the time, with the answer you'd give.",
    titleLabel: "Question", titlePlaceholder: "e.g. Do you offer weekend appointments?",
    contentLabel: "Answer", contentPlaceholder: "e.g. Yes, we work Saturdays from 9am to 2pm. Sunday visits are available for emergencies only.",
  },
  hours: {
    label: "Opening hours", singular: "opening hours note", icon: Clock,
    explainer: "Holiday closures, seasonal hours or anything beyond your standard weekly hours.",
    titleLabel: "Title", titlePlaceholder: "e.g. Christmas opening",
    contentLabel: "Details", contentPlaceholder: "e.g. Closed 24 December to 2 January. Emergency call-outs still available on 07700 900123.",
  },
  location: {
    label: "Locations", singular: "location", icon: MapPin,
    explainer: "Where you are, the areas you cover, parking and how to find you.",
    titleLabel: "Location or area", titlePlaceholder: "e.g. Service area",
    contentLabel: "Details", contentPlaceholder: "e.g. We cover Leeds, Bradford, Wakefield and Harrogate. Free parking is available behind our showroom on Kirkstall Road.",
  },
  policy: {
    label: "Policies", singular: "policy", icon: ShieldCheck,
    explainer: "Cancellations, refunds, deposits, guarantees and other rules customers should know.",
    titleLabel: "Policy name", titlePlaceholder: "e.g. Cancellation policy",
    contentLabel: "Policy", contentPlaceholder: "e.g. Free cancellation up to 24 hours before your appointment. Later cancellations are charged a £25 call-out fee.",
  },
  contact: {
    label: "Contact information", singular: "contact detail", icon: Phone,
    explainer: "Extra ways to reach you beyond your main phone and email, such as departments or emergency lines.",
    titleLabel: "Label", titlePlaceholder: "e.g. Emergency line",
    contentLabel: "Details", contentPlaceholder: "e.g. For out-of-hours emergencies call 07700 900123. For invoices email accounts@example.co.uk.",
  },
  instruction: {
    label: "Custom instructions", singular: "instruction", icon: Sparkles,
    explainer: "Rules for how the assistant should behave, e.g. what to always offer or never say.",
    titleLabel: "Title", titlePlaceholder: "", noTitle: true,
    contentLabel: "Instruction", contentPlaceholder: "e.g. Always offer a free, no-obligation quote before discussing price.",
  },
};

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_SHORT: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

type Draft = { id?: string; kind: Kind; title: string; content: string; enabled: boolean };

export default function Knowledge() {
  const { me } = useAuth();
  const manager = canManage(me);
  const toast = useToast();
  const { data, loading, error, reload, setData } = useLoad(() => api<{ items: Item[] }>("knowledge"), []);
  const items = useMemo(() => data?.items || [], [data]);
  const [active, setActive] = useState<Kind>("faq");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of items) c[it.kind] = (c[it.kind] || 0) + 1;
    return c;
  }, [items]);
  const list = items.filter((i) => i.kind === active);
  const meta = META[active];
  const enabledCount = items.filter((i) => i.enabled).length;

  const replaceItem = (item: Item) => setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === item.id ? item : x)) } : d));

  async function save() {
    if (!draft) return;
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!content) { toast(META[draft.kind].noTitle ? "Write the instruction first." : `Add the ${META[draft.kind].contentLabel.toLowerCase()} first.`, "error"); return; }
    setSaving(true);
    try {
      if (draft.id) {
        const { item } = await api<{ item: Item }>("knowledge/item", { method: "PATCH", params: { id: draft.id }, body: { title, content, enabled: draft.enabled } });
        replaceItem(item);
        toast("Saved");
      } else {
        const position = (counts[draft.kind] || 0);
        const res = await api<{ items: Item[] }>("knowledge", { method: "POST", body: { kind: draft.kind, title, content, position } });
        let created = res.items[0];
        if (created && !draft.enabled) {
          created = (await api<{ item: Item }>("knowledge/item", { method: "PATCH", params: { id: created.id }, body: { enabled: false } })).item;
        }
        setData((d) => (d ? { ...d, items: [...d.items, ...(created ? [created] : [])] } : d));
        toast(`${cap(META[draft.kind].singular)} added`);
      }
      setDraft(null);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: Item, enabled: boolean) {
    replaceItem({ ...item, enabled });
    try {
      const { item: fresh } = await api<{ item: Item }>("knowledge/item", { method: "PATCH", params: { id: item.id }, body: { enabled } });
      replaceItem(fresh);
    } catch (e) {
      replaceItem(item);
      toast(errorMessage(e), "error");
    }
  }

  async function remove() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api("knowledge/item", { method: "DELETE", params: { id: confirmDelete.id } });
      setData((d) => (d ? { ...d, items: d.items.filter((x) => x.id !== confirmDelete.id) } : d));
      toast("Deleted");
      setConfirmDelete(null);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  }

  const openNew = (kind: Kind = active) => setDraft({ kind, title: "", content: "", enabled: true });

  return (
    <div>
      <PageHeader
        title="Knowledge"
        subtitle="Everything your assistant knows about your business."
        actions={<Button icon={<Plus className="w-4 h-4" />} onClick={() => openNew()} disabled={!manager} title={manager ? undefined : "Only owners and admins can edit knowledge"}>Add information</Button>}
      />

      <div className="flex items-start gap-3 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50/80 to-white px-4 py-3.5 mb-6">
        <span className="w-8 h-8 rounded-lg bg-white ring-1 ring-orange-100 text-orange-600 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4" /></span>
        <div className="text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">Your assistant only answers from this information.</span>{" "}
          If something isn't here or in your business profile, it will say it doesn't know and offer to pass the question to your team, rather than guess.
          {!loading && !error && <span className="text-gray-500"> {enabledCount} {enabledCount === 1 ? "item is" : "items are"} live.</span>}
        </div>
      </div>

      {!manager && (
        <Alert tone="info" className="mb-6 flex items-center gap-2"><Lock className="w-4 h-4 shrink-0" />You can view the knowledge base. Only owners and admins can add or change it.</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Category list: horizontal pills on mobile, vertical list on desktop */}
        <nav aria-label="Knowledge categories" className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto lg:overflow-visible">
          <div className="flex lg:flex-col gap-1.5 lg:gap-0.5 lg:sticky lg:top-4 min-w-max lg:min-w-0">
            {KINDS.map((k) => {
              const M = META[k];
              const on = active === k;
              return (
                <button
                  key={k}
                  onClick={() => setActive(k)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition whitespace-nowrap",
                    on ? "bg-white text-gray-900 font-semibold shadow-sm ring-1 ring-gray-200" : "text-gray-600 hover:bg-white/70 hover:text-gray-900 ring-1 ring-transparent lg:ring-0 bg-white lg:bg-transparent border border-gray-200 lg:border-0",
                  )}
                >
                  <M.icon className={cn("w-4 h-4 shrink-0", on ? "text-orange-600" : "text-gray-400 group-hover:text-gray-500")} />
                  <span className="flex-1">{M.label}</span>
                  <span className={cn("rounded-full px-1.5 min-w-[20px] text-center text-[11px] tabular-nums", on ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500")}>
                    {loading ? "·" : counts[k] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-2"><meta.icon className="w-4 h-4 text-orange-600" />{meta.label}</span>}
              subtitle={meta.explainer}
              action={list.length > 0 ? <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => openNew()} disabled={!manager}>Add</Button> : undefined}
            />
            <div className="border-t border-gray-100">
              {loading ? (
                <div className="p-5 space-y-4">
                  {[0, 1, 2].map((i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-5/6" /></div>)}
                </div>
              ) : error ? (
                <div className="p-5">
                  <Alert tone="error" className="flex items-center justify-between gap-3">
                    <span>{errorMessage(error)}</span>
                    <Button size="sm" variant="secondary" onClick={reload}>Try again</Button>
                  </Alert>
                </div>
              ) : list.length === 0 ? (
                <EmptyState
                  icon={<meta.icon className="w-5 h-5" />}
                  title={`No ${meta.label.toLowerCase()} yet`}
                  action={manager ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => openNew()}>Add your first {meta.singular}</Button> : undefined}
                >
                  <span className="block">{meta.explainer}</span>
                  <span className="block mt-3 text-gray-400">Example: <span className="italic">{(meta.noTitle ? meta.contentPlaceholder : meta.titlePlaceholder).replace(/^e\.g\. /, "")}</span></span>
                </EmptyState>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {list.map((it) => (
                    <li key={it.id} className={cn("group flex gap-3 sm:gap-4 px-5 py-4", !it.enabled && "bg-gray-50/60")}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {it.title && <h4 className={cn("text-sm font-semibold", it.enabled ? "text-gray-900" : "text-gray-500")}>{it.title}</h4>}
                          {!it.enabled && <Badge tone="gray">Hidden from AI</Badge>}
                        </div>
                        <p className={cn("text-sm leading-relaxed whitespace-pre-line line-clamp-4", it.title && "mt-1", it.enabled ? "text-gray-600" : "text-gray-400")}>{it.content}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <Toggle checked={it.enabled} onChange={(v) => toggle(it, v)} disabled={!manager} />
                        <div className="flex items-center gap-0.5">
                          <IconBtn label="Edit" disabled={!manager} onClick={() => setDraft({ id: it.id, kind: it.kind, title: it.title, content: it.content, enabled: it.enabled })}><Pencil className="w-4 h-4" /></IconBtn>
                          <IconBtn label="Delete" danger disabled={!manager} onClick={() => setConfirmDelete(it)}><Trash2 className="w-4 h-4" /></IconBtn>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <ProfileCard />
            <ComingSoonCard />
          </div>
        </div>
      </div>

      <Modal
        open={!!draft}
        onClose={() => !saving && setDraft(null)}
        title={draft ? `${draft.id ? "Edit" : "Add"} ${META[draft.kind].singular}` : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{draft?.id ? "Save changes" : "Add"}</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {!draft.id && (
              <Field label="Category">
                <div className="flex flex-wrap gap-1.5">
                  {KINDS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft({ ...draft, kind: k })}
                      className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition", draft.kind === k ? "bg-orange-50 text-orange-700 ring-orange-200" : "bg-white text-gray-600 ring-gray-200 hover:ring-gray-300")}
                    >
                      {META[k].label}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <p className="text-[13px] text-gray-500 -mt-1 flex gap-1.5"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />{META[draft.kind].explainer}</p>
            {!META[draft.kind].noTitle && (
              <Field label={META[draft.kind].titleLabel}>
                <Input value={draft.title} maxLength={200} placeholder={META[draft.kind].titlePlaceholder} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
              </Field>
            )}
            <Field label={META[draft.kind].contentLabel} hint={draft.kind === "instruction" ? "Write it as you'd brief a new receptionist. One rule per instruction works best." : "Write in plain English, the way you'd explain it to a customer."}>
              <Textarea rows={6} value={draft.content} maxLength={8000} placeholder={META[draft.kind].contentPlaceholder} onChange={(e) => setDraft({ ...draft, content: e.target.value })} autoFocus={!!META[draft.kind].noTitle} />
            </Field>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-gray-800">Use in answers</div>
                <div className="text-xs text-gray-500">Turn off to keep it here without the assistant using it.</div>
              </div>
              <Toggle checked={draft.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="Delete this item?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={remove} loading={deleting} icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          The assistant will stop using{confirmDelete?.title ? <> “<span className="font-medium text-gray-900">{confirmDelete.title}</span>”</> : " this information"} straight away. This can't be undone. If you might need it again, turn it off instead.
        </p>
      </Modal>
    </div>
  );
}

function IconBtn({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("p-2 rounded-md text-gray-400 transition disabled:opacity-40 disabled:cursor-not-allowed", danger ? "hover:text-red-600 hover:bg-red-50" : "hover:text-gray-800 hover:bg-gray-100")}
    >
      {children}
    </button>
  );
}

function ProfileCard() {
  const { me } = useAuth();
  const b = me?.business;
  const services = b?.services || [];
  const hours = b?.opening_hours || {};
  const contact = b?.contact || {};
  const hasHours = DAYS.some((d) => hours[d]);
  const contactLine = [contact.phone, contact.email, contact.address].filter(Boolean);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="From your business profile"
        subtitle="Also shared with the assistant. Edit it in Settings."
        action={<Link to="/app/settings" className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap">Edit <ArrowRight className="w-3.5 h-3.5" /></Link>}
      />
      <div className="px-5 pb-5 divide-y divide-gray-100 flex-1">
        <Row label="About" empty={!b?.description}><p className="line-clamp-3 leading-relaxed">{b?.description}</p></Row>
        <Row label={`Services${services.length ? ` (${services.length})` : ""}`} empty={!services.length}>
          <div className="flex flex-wrap gap-1.5">
            {services.slice(0, 8).map((s, i) => (
              <Badge key={i} tone="gray">{s.name}{s.price ? <span className="text-gray-500">· {s.price}</span> : null}</Badge>
            ))}
            {services.length > 8 && <Badge tone="gray">+{services.length - 8} more</Badge>}
          </div>
        </Row>
        <Row label="Opening hours" empty={!hasHours}>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 tabular-nums">
            {DAYS.filter((d) => hours[d]).map((d) => (
              <div key={d} className="contents">
                <span className="text-gray-500">{DAY_SHORT[d]}</span>
                <span className={hours[d].closed ? "text-gray-400" : ""}>{hours[d].closed ? "Closed" : `${hours[d].open || "?"}–${hours[d].close || "?"}`}</span>
              </div>
            ))}
          </div>
        </Row>
        <Row label="Contact" empty={!contactLine.length}>
          <div className="space-y-0.5 break-words">{contactLine.map((c) => <div key={c}>{c}</div>)}</div>
        </Row>
      </div>
    </Card>
  );
}

function Row({ label, children, empty }: { label: string; children: ReactNode; empty: boolean }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{label}</div>
      {empty ? <div className="text-sm text-gray-400">Not added yet</div> : <div className="text-sm text-gray-700">{children}</div>}
    </div>
  );
}

function SoonOption({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3.5">
      <span className="w-9 h-9 rounded-lg bg-white ring-1 ring-gray-200 text-gray-500 flex items-center justify-center shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <Badge tone="violet">Coming soon</Badge>
        </div>
        <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">{text}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 mt-2.5 shrink-0" />
    </div>
  );
}

function ComingSoonCard() {
  return (
    <Card>
      <CardHeader title="Add knowledge faster" subtitle="We're building quicker ways to teach your assistant." />
      <div className="px-5 pb-5 space-y-3">
        <SoonOption icon={<FileUp className="w-4 h-4" />} title="Upload documents" text="Drop in price lists, brochures or PDFs and the assistant will learn from them." />
        <SoonOption icon={<Globe className="w-4 h-4" />} title="Import from your website" text="Point us at your website and we'll pull in your services, FAQs and policies for you to review." />
        <p className="text-xs text-gray-400 pt-1">Until then, copy and paste the important parts into the categories above.</p>
      </div>
    </Card>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
