import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bot, Send, RotateCcw, UserRound, Sparkles, Smile, Briefcase, Zap, Heart, PenLine, Hand, AlertTriangle, HelpCircle,
  ListChecks, Gauge, MessageSquareText, Check, Lock, Info, ArrowRight, Flame,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { useAuth, canManage } from "../auth";
import { Alert, Badge, Button, Card, CardHeader, Field, Input, PageHeader, ScoreBadge, Skeleton, Textarea, Toggle, cn, useLoad, useToast } from "../ui";

type Personality = "friendly" | "professional" | "concise" | "warm" | "custom";
type QualField = { key: string; label: string; question: string };
type Weights = { contact: number; service: number; location: number; budget: number; preferred_date: number; urgency_high: number; urgency_medium: number; ready_to_book: number };
type Settings = {
  enabled: boolean;
  assistant_name: string;
  personality: Personality;
  tone_notes: string;
  greeting: string;
  custom_instructions: string;
  qualification: { fields: Record<string, { enabled: boolean; question: string }> };
  scoring: { weights: Weights; thresholds: { warm: number; hot: number } };
  handoff: { on_request: boolean; on_complaint: boolean; on_unknown: boolean };
  updated_at?: string;
  qualification_fields?: QualField[];
};
type Editable = Omit<Settings, "updated_at" | "qualification_fields">;
type SettingsRes = { settings: Settings; ai_available: boolean };

const PERSONALITIES: { key: Personality; label: string; icon: typeof Smile; sample: string }[] = [
  { key: "friendly", label: "Friendly", icon: Smile, sample: "Hi there! Happy to help. What can I do for you today?" },
  { key: "professional", label: "Professional", icon: Briefcase, sample: "Good afternoon, thank you for getting in touch. How may I help?" },
  { key: "concise", label: "Concise", icon: Zap, sample: "Hi, what do you need a quote for?" },
  { key: "warm", label: "Warm", icon: Heart, sample: "Hello, and thanks for reaching out. Take your time, I'm here to help." },
  { key: "custom", label: "Custom", icon: PenLine, sample: "You describe exactly how it should sound in the tone notes." },
];

const HANDOFF: { key: keyof Settings["handoff"]; label: string; hint: string; icon: typeof Hand }[] = [
  { key: "on_request", label: "When the customer asks for a person", hint: "e.g. “Can I speak to someone?”", icon: Hand },
  { key: "on_complaint", label: "When the customer complains or is upset", hint: "Your team handles anything sensitive.", icon: AlertTriangle },
  { key: "on_unknown", label: "When it doesn't know the answer", hint: "Instead of guessing, it passes the question on.", icon: HelpCircle },
];

const WEIGHTS: { key: keyof Weights; label: string; hint: string }[] = [
  { key: "contact", label: "Shared contact details", hint: "Phone number or email" },
  { key: "service", label: "Knows what they want", hint: "Named a service" },
  { key: "location", label: "Gave their location", hint: "" },
  { key: "budget", label: "Gave a budget", hint: "" },
  { key: "preferred_date", label: "Has a date in mind", hint: "" },
  { key: "urgency_high", label: "Urgent", hint: "Needs it as soon as possible" },
  { key: "urgency_medium", label: "Fairly soon", hint: "Within the next few weeks" },
  { key: "ready_to_book", label: "Ready to buy or book", hint: "Strongest buying signal" },
];

const CAPTURE_LABEL: Record<string, string> = {
  name: "Name", phone: "Phone", email: "Email", service_interest: "Interested in", location: "Location", budget: "Budget",
  preferred_date: "Preferred date", urgency: "Urgency", ready_to_book: "Ready to book", notes: "Notes",
};

const pick = (s: Settings): Editable => ({
  enabled: s.enabled, assistant_name: s.assistant_name, personality: s.personality, tone_notes: s.tone_notes, greeting: s.greeting,
  custom_instructions: s.custom_instructions, qualification: s.qualification, scoring: s.scoring, handoff: s.handoff,
});

/** Mirrors api/_lib/ge/scoring.js scoreLead so the preview reflects the weights on screen. */
function scorePreview(lead: Record<string, any>, scoring: Settings["scoring"]) {
  const w = scoring.weights;
  let score = 0;
  const reasons: string[] = [];
  const add = (pts: number, why: string) => { if (pts > 0) { score += pts; reasons.push(why); } };
  if (lead.phone || lead.email) add(w.contact, "contact details");
  if (lead.service_interest) add(w.service, "knows what they want");
  if (lead.location) add(w.location, "location given");
  if (lead.budget) add(w.budget, "budget given");
  if (lead.preferred_date) add(w.preferred_date, "has a date in mind");
  if (lead.urgency === "high") add(w.urgency_high, "urgent");
  else if (lead.urgency === "medium") add(w.urgency_medium, "fairly soon");
  if (lead.ready_to_book) add(w.ready_to_book, "ready to buy/book");
  score = Math.min(100, score);
  const label = score >= scoring.thresholds.hot ? "hot" : score >= scoring.thresholds.warm ? "warm" : "cold";
  return { score, label, reasons };
}

export default function Assistant() {
  const { me } = useAuth();
  const manager = canManage(me);
  const toast = useToast();
  const { data, loading, error, reload, setData } = useLoad(() => api<SettingsRes>("ai-settings"), []);
  const [form, setForm] = useState<Editable | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data?.settings) setForm(pick(data.settings)); }, [data]);

  const saved = data?.settings ? pick(data.settings) : null;
  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);
  const fields = data?.settings?.qualification_fields || [];

  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function save() {
    if (!form) return;
    if (form.scoring.thresholds.hot <= form.scoring.thresholds.warm) { toast("The Hot threshold must be higher than Warm.", "error"); return; }
    if (form.personality === "custom" && !form.tone_notes.trim()) { toast("Describe the custom personality in the tone notes.", "error"); return; }
    setSaving(true);
    try {
      const res = await api<SettingsRes>("ai-settings", { method: "PATCH", body: form });
      setData(res);
      toast("Assistant settings saved");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  }

  if (!error && (loading || !form || !data)) {
    return (
      <div>
        <PageHeader title="AI assistant" subtitle="Set how your assistant talks, what it asks and when it hands over to your team." />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-6">{[0, 1, 2].map((i) => <Card key={i} className="p-5 space-y-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-2/3" /></Card>)}</div>
          <Card className="p-5"><Skeleton className="h-80 w-full" /></Card>
        </div>
      </div>
    );
  }

  if (error || !form || !data) {
    return (
      <div>
        <PageHeader title="AI assistant" />
        <Alert tone="error" className="flex items-center justify-between gap-3">
          <span>{error ? errorMessage(error) : "Couldn't load your assistant settings."}</span>
          <Button size="sm" variant="secondary" onClick={reload}>Try again</Button>
        </Alert>
      </div>
    );
  }

  const ro = !manager;

  return (
    <div>
      <PageHeader
        title="AI assistant"
        subtitle="Set how your assistant talks, what it asks and when it hands over to your team."
        actions={<Link to="/app/knowledge"><Button variant="secondary" icon={<Sparkles className="w-4 h-4" />}>Edit knowledge</Button></Link>}
      />

      {ro && <Alert tone="info" className="mb-6 flex items-center gap-2"><Lock className="w-4 h-4 shrink-0" />You can view and test the assistant. Only owners and admins can change its settings.</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] items-start">
        <div className="space-y-6 min-w-0">
          {/* Status */}
          <Card className={cn("p-5 flex items-center gap-4", !form.enabled && "bg-gray-50")}>
            <span className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", form.enabled ? "bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shadow-sm shadow-orange-500/30" : "bg-gray-200 text-gray-500")}>
              <Bot className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-semibold text-gray-900">{form.enabled ? "Assistant is on" : "Assistant is off"}</h3>
                <Badge tone={form.enabled ? "green" : "gray"} dot>{form.enabled ? "Replying to customers" : "Paused"}</Badge>
              </div>
              <p className="text-[13px] text-gray-500 mt-0.5">{form.enabled ? "It replies instantly on your connected channels, day and night." : "New messages wait in your inbox for your team to answer."}</p>
            </div>
            <Toggle checked={form.enabled} onChange={(v) => set("enabled", v)} disabled={ro} />
          </Card>

          {/* Identity & personality */}
          <Card>
            <CardHeader title="Identity and personality" subtitle="How your assistant introduces itself and the way it speaks." />
            <div className="px-5 pb-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Assistant name" hint="Customers see this name in the chat.">
                  <Input value={form.assistant_name} maxLength={60} onChange={(e) => set("assistant_name", e.target.value)} disabled={ro} placeholder="e.g. Sophie" />
                </Field>
                <Field label="Greeting message" hint="The first message on your website chat.">
                  <Input value={form.greeting} maxLength={300} onChange={(e) => set("greeting", e.target.value)} disabled={ro} placeholder="Hi! How can I help you today?" />
                </Field>
              </div>

              <div>
                <span className="block text-[13px] font-medium text-gray-700 mb-2">Personality</span>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {PERSONALITIES.map((p) => {
                    const on = form.personality === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        disabled={ro}
                        onClick={() => set("personality", p.key)}
                        className={cn(
                          "relative text-left rounded-xl border p-3.5 transition disabled:cursor-not-allowed",
                          on ? "border-orange-300 bg-orange-50/50 ring-4 ring-orange-100" : "border-gray-200 bg-white hover:border-gray-300",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <p.icon className={cn("w-4 h-4", on ? "text-orange-600" : "text-gray-400")} />
                          <span className="text-sm font-semibold text-gray-900">{p.label}</span>
                          {on && <Check className="w-4 h-4 text-orange-600 ml-auto" />}
                        </div>
                        <p className="text-[13px] text-gray-500 mt-1.5 leading-snug">{p.key === "custom" ? p.sample : `“${p.sample}”`}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field
                label={form.personality === "custom" ? "Describe the personality" : "Tone notes (optional)"}
                hint={form.personality === "custom" ? "Required for a custom personality. This replaces the preset style." : "Small adjustments on top of the style above."}
              >
                <Textarea rows={2} maxLength={1000} value={form.tone_notes} onChange={(e) => set("tone_notes", e.target.value)} disabled={ro}
                  placeholder={form.personality === "custom" ? "e.g. Relaxed and chatty, uses first names, light humour but never sarcastic." : "e.g. Use British spelling. Avoid jargon. Never use exclamation marks."} />
              </Field>

              <Field label="Custom instructions" hint={<>Rules it must always follow. You can also add these one by one under <Link to="/app/knowledge" className="text-orange-600 font-medium hover:underline">Knowledge</Link>.</>}>
                <Textarea rows={4} maxLength={4000} value={form.custom_instructions} onChange={(e) => set("custom_instructions", e.target.value)} disabled={ro}
                  placeholder={"e.g. Always offer a free, no-obligation quote.\nNever promise a same-day visit.\nIf someone mentions a gas smell, tell them to call the National Gas Emergency line on 0800 111 999."} />
              </Field>
            </div>
          </Card>

          {/* Handoff */}
          <Card>
            <CardHeader title="Hand over to your team" subtitle="When the assistant should stop and bring in a person. You'll see these in Conversations." />
            <div className="px-5 pb-3 divide-y divide-gray-100">
              {HANDOFF.map((h) => (
                <div key={h.key} className="flex items-center gap-3 py-3">
                  <span className="w-8 h-8 rounded-lg bg-gray-50 ring-1 ring-gray-100 text-gray-500 flex items-center justify-center shrink-0"><h.icon className="w-4 h-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800">{h.label}</div>
                    <div className="text-xs text-gray-500">{h.hint}</div>
                  </div>
                  <Toggle checked={form.handoff[h.key]} onChange={(v) => set("handoff", { ...form.handoff, [h.key]: v })} disabled={ro} />
                </div>
              ))}
            </div>
          </Card>

          {/* Qualification */}
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-2"><ListChecks className="w-4 h-4 text-orange-600" />Lead qualification</span>}
              subtitle="What the assistant finds out from interested customers, one question at a time. It words the questions naturally, using yours as a guide."
            />
            <div className="px-5 pb-5 space-y-2.5">
              {fields.map((f) => {
                const q = form.qualification.fields[f.key] || { enabled: true, question: f.question };
                const setQ = (patch: Partial<typeof q>) => set("qualification", { fields: { ...form.qualification.fields, [f.key]: { ...q, ...patch } } });
                return (
                  <div key={f.key} className={cn("rounded-lg border p-3 sm:p-3.5 transition", q.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50/70")}>
                    <div className="flex items-center gap-3">
                      <Toggle checked={q.enabled} onChange={(v) => setQ({ enabled: v })} disabled={ro} />
                      <span className={cn("text-sm font-semibold flex-1", q.enabled ? "text-gray-900" : "text-gray-500")}>{f.label}</span>
                      {!q.enabled && <span className="text-xs text-gray-400">Won't ask</span>}
                    </div>
                    {q.enabled && (
                      <div className="mt-2.5 sm:pl-[52px]">
                        <Input value={q.question} maxLength={200} onChange={(e) => setQ({ question: e.target.value })} disabled={ro} placeholder={f.question} aria-label={`Example question for ${f.label}`} className="h-9" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Scoring */}
          <ScoringCard scoring={form.scoring} onChange={(s) => set("scoring", s)} disabled={ro} />

          {/* Sticky save bar */}
          {dirty && (
            <div className="sticky bottom-4 z-20">
              <div className="flex items-center gap-3 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-2xl shadow-gray-900/20">
                <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                <span className="text-sm flex-1 min-w-0">You have unsaved changes</span>
                <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10" onClick={() => saved && setForm(saved)} disabled={saving}>Discard</Button>
                <Button size="sm" onClick={save} loading={saving} disabled={ro}>Save changes</Button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-4">
          <TestChat greeting={form.greeting} name={form.assistant_name} aiAvailable={data.ai_available} scoring={form.scoring} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}

// ---------------- scoring ----------------
function ScoringCard({ scoring, onChange, disabled }: { scoring: Settings["scoring"]; onChange: (s: Settings["scoring"]) => void; disabled: boolean }) {
  const { weights: w, thresholds: t } = scoring;
  const maxPossible = Math.min(100, w.contact + w.service + w.location + w.budget + w.preferred_date + Math.max(w.urgency_high, w.urgency_medium) + w.ready_to_book);
  const setW = (k: keyof Weights, v: number) => onChange({ ...scoring, weights: { ...w, [k]: clamp(v, 0, 100) } });
  const setWarm = (v: number) => onChange({ ...scoring, thresholds: { ...t, warm: clamp(v, 1, 99) } });
  const setHot = (v: number) => onChange({ ...scoring, thresholds: { ...t, hot: clamp(v, 2, 100) } });
  const invalid = t.hot <= t.warm;
  const warmW = Math.max(0, Math.min(t.hot, 100) - t.warm);

  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2"><Gauge className="w-4 h-4 text-orange-600" />Lead scoring</span>}
        subtitle="Each detail a customer shares adds points. The total (out of 100) decides whether a lead is Cold, Warm or Hot."
      />
      <div className="px-5 pb-5 space-y-6">
        {/* Visual bar */}
        <div>
          <div className="relative h-9 rounded-lg overflow-hidden flex text-[11px] font-semibold">
            <div className="bg-sky-100 text-sky-800 flex items-center justify-center" style={{ width: `${t.warm}%` }}>{t.warm >= 12 && "Cold"}</div>
            <div className="bg-amber-100 text-amber-800 flex items-center justify-center" style={{ width: `${warmW}%` }}>{warmW >= 12 && "Warm"}</div>
            <div className="bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white flex items-center justify-center" style={{ width: `${100 - Math.max(t.hot, t.warm)}%` }}>{100 - Math.max(t.hot, t.warm) >= 10 && "Hot"}</div>
            {maxPossible < 100 && <div className="absolute inset-y-0 right-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.65)_0_4px,transparent_4px_8px)]" style={{ width: `${100 - maxPossible}%` }} title="Out of reach with the current points" />}
          </div>
          <div className="relative h-5 mt-1 text-[11px] text-gray-500 tabular-nums">
            <span className="absolute left-0">0</span>
            <span className="absolute -translate-x-1/2" style={{ left: `${t.warm}%` }}>{t.warm}</span>
            <span className="absolute -translate-x-1/2" style={{ left: `${t.hot}%` }}>{t.hot}</span>
            <span className="absolute right-0">100</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Field label="Warm from" hint="Points needed to be Warm">
              <Input type="number" min={1} max={99} value={t.warm} onChange={(e) => setWarm(Number(e.target.value))} disabled={disabled} />
            </Field>
            <Field label="Hot from" hint="Points needed to be Hot" error={invalid ? "Must be higher than Warm" : undefined}>
              <Input type="number" min={2} max={100} value={t.hot} onChange={(e) => setHot(Number(e.target.value))} disabled={disabled} />
            </Field>
          </div>
          {!invalid && maxPossible < t.hot && (
            <Alert tone="warning" className="mt-3 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />With these points a lead can score at most {maxPossible}, so no lead will ever become Hot. Raise some points or lower the Hot threshold.</Alert>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[13px] font-medium text-gray-700">Points for each signal</span>
            <span className="text-xs text-gray-400">Highest possible score: <span className="tabular-nums font-medium text-gray-600">{maxPossible}</span></span>
          </div>
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {WEIGHTS.map((x) => (
              <div key={x.key} className="grid grid-cols-[minmax(0,1fr)_64px] sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)_64px] items-center gap-x-4 gap-y-2 px-3.5 py-3">
                <div className="min-w-0">
                  <div className="text-sm text-gray-800">{x.label}</div>
                  {x.hint && <div className="text-xs text-gray-400">{x.hint}</div>}
                </div>
                <input
                  type="range" min={0} max={50} step={1} value={Math.min(w[x.key], 50)} disabled={disabled}
                  onChange={(e) => setW(x.key, Number(e.target.value))}
                  className="order-last col-span-2 sm:order-none sm:col-span-1 w-full accent-orange-500 disabled:opacity-50"
                  aria-label={`${x.label} points`}
                />
                <Input type="number" min={0} max={100} value={w[x.key]} onChange={(e) => setW(x.key, Number(e.target.value))} disabled={disabled} className="h-9 text-right tabular-nums" aria-label={`${x.label} points`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">“Urgent” and “Fairly soon” don't add together; a lead gets one or the other.</p>
        </div>
      </div>
    </Card>
  );
}

const clamp = (v: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(Math.max(Math.round(v), min), max) : min);

// ---------------- test chat ----------------
type Msg = { role: "user" | "assistant"; content: string };
type Score = { score: number; label: string; reasons: string[] };

function TestChat({ greeting, name, aiAvailable, scoring, dirty }: { greeting: string; name: string; aiAvailable: boolean; scoring: Settings["scoring"]; dirty: boolean }) {
  const toast = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [captured, setCaptured] = useState<Record<string, any>>({});
  const [handoff, setHandoff] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const score: Score = useMemo(() => scorePreview(captured, scoring), [captured, scoring]);
  const capturedEntries = Object.entries(captured).filter(([, v]) => v !== "" && v !== false && v != null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await api<{ reply: string; captured: Record<string, any>; score: Score; handoff: string | null }>("ai/test", {
        method: "POST",
        body: { messages: next.map((m) => ({ content: m.content })) },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply || "…" }]);
      if (res.captured && Object.keys(res.captured).length) setCaptured((c) => ({ ...c, ...res.captured }));
      if (res.handoff) setHandoff(res.handoff);
    } catch (e) {
      // roll back the unanswered message so the history keeps alternating
      setMessages(messages);
      setInput(content);
      toast(errorMessage(e), "error");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMessages([]);
    setCaptured({});
    setHandoff(null);
    setInput("");
  }

  const suggestions = ["What services do you offer?", "How much does it cost?", "Can I book for next week?"];

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 truncate">Test your assistant</div>
          <div className="text-xs text-gray-500 truncate">Chat as a customer would. Nothing is saved.</div>
        </div>
        <Button size="sm" variant="ghost" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={reset} disabled={sending || (!messages.length && !capturedEntries.length)}>Reset</Button>
      </div>

      {!aiAvailable && (
        <Alert tone="warning" className="m-4 mb-0 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />The AI key isn't configured on the server yet, so test replies won't work. Your settings can still be saved.</Alert>
      )}
      {dirty && aiAvailable && (
        <div className="mx-4 mt-4 flex gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />The test uses your saved settings. Save your changes to try them out.</div>
      )}

      <div ref={scrollRef} className="h-[340px] lg:h-[min(380px,calc(100vh-420px))] min-h-[260px] overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/40">
        <Bubble role="assistant" name={name}>{greeting || "Hi! How can I help you today?"}</Bubble>
        {messages.map((m, i) => <Bubble key={i} role={m.role} name={name}>{m.content}</Bubble>)}
        {sending && (
          <div className="flex items-center gap-1 pl-9">
            <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-white ring-1 ring-gray-200 px-3 py-2.5">
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </span>
          </div>
        )}
        {!messages.length && !sending && aiAvailable && (
          <div className="flex flex-wrap gap-1.5 pt-2 pl-9">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full bg-white ring-1 ring-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:ring-orange-300 hover:text-orange-700 transition">{s}</button>
            ))}
          </div>
        )}
      </div>

      {handoff && (
        <div className="flex gap-2 border-t border-violet-100 bg-violet-50 px-4 py-2.5 text-xs text-violet-900">
          <UserRound className="w-4 h-4 shrink-0" />
          <span><span className="font-semibold">Handed to your team.</span> In a real chat this conversation would move to a person. Reason: {handoff}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t border-gray-100 p-3">
        <Textarea
          rows={1} value={input} maxLength={2000} disabled={!aiAvailable}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={aiAvailable ? "Type a message as a customer…" : "Test chat unavailable"}
          className="resize-none min-h-[40px] max-h-32 py-2"
        />
        <Button type="submit" className="h-10 w-10 px-0 shrink-0" disabled={!input.trim() || !aiAvailable} loading={sending} icon={<Send className="w-4 h-4" />} aria-label="Send" />
      </form>

      <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-white">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">What the AI captured</span>
            <ScoreBadge label={score.label} score={score.score} />
          </div>
          {capturedEntries.length ? (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
              {capturedEntries.map(([k, v]) => (
                <Pair key={k} k={CAPTURE_LABEL[k] || k}>{v === true ? "Yes" : k === "urgency" ? cap(String(v)) : String(v)}</Pair>
              ))}
            </dl>
          ) : (
            <p className="text-[13px] text-gray-400">Nothing yet. Try saying you'd like a quote and share a few details.</p>
          )}
        </div>
        {score.reasons.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" />Why this score</div>
            <div className="flex flex-wrap gap-1.5">{score.reasons.map((r) => <Badge key={r} tone="gray">{r}</Badge>)}</div>
          </div>
        )}
        <Link to="/app/leads" className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-orange-600"><MessageSquareText className="w-3.5 h-3.5" />Real chats create leads automatically <ArrowRight className="w-3 h-3" /></Link>
      </div>
    </Card>
  );
}

function Pair({ k, children }: { k: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-gray-900 font-medium break-words">{children}</dd>
    </>
  );
}

function Bubble({ role, name, children }: { role: Msg["role"]; name: string; children: ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-900 text-white px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <span className="w-7 h-7 rounded-full bg-orange-50 ring-1 ring-orange-100 text-orange-600 flex items-center justify-center shrink-0" title={name}><Bot className="w-3.5 h-3.5" /></span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white ring-1 ring-gray-200 text-gray-800 px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{children}</div>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
