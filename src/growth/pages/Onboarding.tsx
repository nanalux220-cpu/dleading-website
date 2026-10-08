import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Building2, Briefcase, Globe, FileText, Package, Clock, Phone, Bot,
  Plug, PartyPopper, Copy, MessageCircle, Wrench, Scissors, Stethoscope, Home, Car, UtensilsCrossed, GraduationCap,
  Dumbbell, Scale, ShoppingBag, Sparkles, HardHat,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { useAuth, type Business } from "../auth";
import { Logo } from "../Brand";
import { Alert, Button, Field, Input, Textarea, Toggle, cn, useToast } from "../ui";

const STEPS = [
  { title: "Business name", icon: Building2 },
  { title: "Industry", icon: Briefcase },
  { title: "Website", icon: Globe },
  { title: "Description", icon: FileText },
  { title: "Services", icon: Package },
  { title: "Opening hours", icon: Clock },
  { title: "Contact details", icon: Phone },
  { title: "AI personality", icon: Bot },
  { title: "Connect channels", icon: Plug },
  { title: "Finish", icon: PartyPopper },
];

const INDUSTRIES = [
  { name: "Trades & home services", icon: Wrench }, { name: "Construction", icon: HardHat }, { name: "Beauty & hair", icon: Scissors },
  { name: "Health & clinics", icon: Stethoscope }, { name: "Property & lettings", icon: Home }, { name: "Automotive", icon: Car },
  { name: "Restaurants & hospitality", icon: UtensilsCrossed }, { name: "Education & training", icon: GraduationCap }, { name: "Fitness & wellbeing", icon: Dumbbell },
  { name: "Legal & finance", icon: Scale }, { name: "Retail & e-commerce", icon: ShoppingBag }, { name: "Marketing & creative", icon: Sparkles },
];

const DAYS: [string, string][] = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]];
const DEFAULT_HOURS = Object.fromEntries(DAYS.map(([d]) => [d, { open: "09:00", close: "17:30", closed: d === "sat" || d === "sun" }]));

const PERSONALITIES = [
  { id: "friendly", name: "Friendly", sample: "Hi there! Happy to help. What can I do for you today?" },
  { id: "professional", name: "Professional", sample: "Good afternoon. How may I assist you with your enquiry?" },
  { id: "warm", name: "Warm & caring", sample: "Hello, thanks so much for getting in touch. Take your time, how can I help?" },
  { id: "concise", name: "Short & direct", sample: "Hi. What do you need?" },
];

function originsFor(site: string) {
  try {
    const u = new URL(site);
    const host = u.hostname.replace(/^www\./, "");
    return [`https://${host}`, `https://www.${host}`];
  } catch { return []; }
}

export default function Onboarding() {
  const { me, refresh, setBusiness } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const b = me?.business as Business;
  const [step, setStep] = useState(() => Math.min(Math.max(b?.onboarding_step || 1, 1), 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState(() => ({
    name: b?.name || "",
    industry: b?.industry || "",
    website: b?.website || "",
    description: b?.description || "",
    services: b?.services?.length ? b.services : [{ name: "", price: "", description: "" }],
    opening_hours: Object.keys(b?.opening_hours || {}).length ? { ...DEFAULT_HOURS, ...b.opening_hours } : DEFAULT_HOURS,
    contact: { phone: "", email: me?.user?.email || "", address: "", whatsapp: "", ...(b?.contact || {}) },
  }));
  const [ai, setAi] = useState({ assistant_name: "", personality: "friendly", greeting: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api("ai-settings").then((r) => setAi({ assistant_name: r.settings.assistant_name === "Assistant" ? "" : r.settings.assistant_name, personality: r.settings.personality, greeting: r.settings.greeting })).catch(() => {});
  }, []);

  const otherIndustry = f.industry && !INDUSTRIES.some((i) => i.name === f.industry);
  const snippet = useMemo(() => `<script src="${window.location.origin}/widget.js" data-key="${b?.public_key}" async></script>`, [b?.public_key]);

  const canContinue = (() => {
    if (step === 1) return f.name.trim().length > 0;
    if (step === 2) return f.industry.trim().length > 0;
    if (step === 4) return f.description.trim().length >= 20;
    return true;
  })();

  async function save(next: number) {
    setBusy(true); setError("");
    try {
      const body: Record<string, unknown> = { onboarding_step: Math.max(next, b?.onboarding_step || 1) };
      if (step === 1) body.name = f.name;
      if (step === 2) body.industry = f.industry;
      if (step === 3) {
        body.website = f.website;
        if (f.website && !(b?.widget_allowed_origins || []).length) {
          const full = /^https?:\/\//.test(f.website) ? f.website : `https://${f.website}`;
          body.widget_allowed_origins = originsFor(full);
        }
      }
      if (step === 4) body.description = f.description;
      if (step === 5) body.services = f.services.filter((s) => s.name.trim());
      if (step === 6) body.opening_hours = f.opening_hours;
      if (step === 7) body.contact = f.contact;
      if (step === 8) await api("ai-settings", { method: "PATCH", body: { assistant_name: ai.assistant_name || "Assistant", personality: ai.personality, greeting: ai.greeting || `Hi! I'm ${ai.assistant_name || "the assistant"} at ${f.name}. How can I help?` } });
      const r = await api<{ business: Business }>("business", { method: "PATCH", body });
      setBusiness(r.business);
      if (next > 10) {
        await api("onboarding/complete", { method: "POST" });
        await refresh();
        toast("You're all set. Welcome to Growth Engine!");
        nav("/app", { replace: true });
        return;
      }
      setStep(next);
      window.scrollTo({ top: 0 });
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  const StepIcon = STEPS[step - 1].icon;
  let body: ReactNode = null;
  if (step === 1) body = (
    <Field label="What's your business called?" hint="This is how your AI assistant will introduce your business.">
      <Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Smith & Co Plumbing" className="h-12 text-base" />
    </Field>
  );
  if (step === 2) body = (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {INDUSTRIES.map((i) => (
          <button key={i.name} type="button" onClick={() => setF({ ...f, industry: i.name })} className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition", f.industry === i.name ? "border-orange-400 bg-orange-50 ring-4 ring-orange-100 text-gray-900" : "border-gray-200 hover:border-gray-300 text-gray-700")}>
            <i.icon className={cn("w-4 h-4 shrink-0", f.industry === i.name ? "text-orange-500" : "text-gray-400")} />
            <span className="leading-tight">{i.name}</span>
          </button>
        ))}
      </div>
      <Field label="Something else?" className="mt-4"><Input value={otherIndustry ? f.industry : ""} onChange={(e) => setF({ ...f, industry: e.target.value })} placeholder="Type your industry" /></Field>
    </div>
  );
  if (step === 3) body = (
    <Field label="Your website address" hint="Optional. We'll allow your chat widget to run on this site. Later you'll be able to import pages from it into your knowledge base.">
      <Input autoFocus value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="www.yourbusiness.co.uk" className="h-12 text-base" />
    </Field>
  );
  if (step === 4) body = (
    <Field label="Describe your business in a few sentences" hint={`What you do, who for, where, and what makes you different. ${f.description.trim().length < 20 ? `At least 20 characters (${f.description.trim().length}/20).` : ""}`}>
      <Textarea autoFocus rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="We're a family-run plumbing and heating company covering Leeds and Bradford. We fix boilers, leaks and install bathrooms, with same-day emergency call-outs and a 12-month guarantee on all work." />
    </Field>
  );
  if (step === 5) body = (
    <div className="space-y-3">
      {f.services.map((s, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="grid sm:grid-cols-[1fr_160px_auto] gap-2.5">
            <Input placeholder="Service or product" value={s.name} onChange={(e) => { const sv = [...f.services]; sv[i] = { ...s, name: e.target.value }; setF({ ...f, services: sv }); }} />
            <Input placeholder="Price (optional)" value={s.price || ""} onChange={(e) => { const sv = [...f.services]; sv[i] = { ...s, price: e.target.value }; setF({ ...f, services: sv }); }} />
            <Button variant="ghost" size="md" aria-label="Remove" onClick={() => setF({ ...f, services: f.services.length > 1 ? f.services.filter((_, j) => j !== i) : [{ name: "", price: "", description: "" }] })} icon={<Trash2 className="w-4 h-4" />} />
          </div>
          <Input className="mt-2.5" placeholder="Short description (optional)" value={s.description || ""} onChange={(e) => { const sv = [...f.services]; sv[i] = { ...s, description: e.target.value }; setF({ ...f, services: sv }); }} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => setF({ ...f, services: [...f.services, { name: "", price: "", description: "" }] })} icon={<Plus className="w-4 h-4" />}>Add another</Button>
      <p className="text-xs text-gray-500">Prices are quoted exactly as you write them, e.g. "from £90" or "£45 per hour". Leave blank if you'd rather the AI didn't quote.</p>
    </div>
  );
  if (step === 6) body = (
    <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
      {DAYS.map(([d, label]) => {
        const h = f.opening_hours[d];
        const set = (patch: Partial<typeof h>) => setF({ ...f, opening_hours: { ...f.opening_hours, [d]: { ...h, ...patch } } });
        return (
          <div key={d} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="w-24 text-sm font-medium text-gray-800">{label}</span>
            <Toggle checked={!h.closed} onChange={(v) => set({ closed: !v })} label={<span className="w-12 inline-block text-gray-500">{h.closed ? "Closed" : "Open"}</span>} />
            {!h.closed && (
              <div className="flex items-center gap-2 ml-auto">
                <Input type="time" value={h.open} onChange={(e) => set({ open: e.target.value })} className="w-[120px]" />
                <span className="text-gray-400 text-sm">to</span>
                <Input type="time" value={h.close} onChange={(e) => set({ close: e.target.value })} className="w-[120px]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  if (step === 7) body = (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Phone"><Input value={f.contact.phone} onChange={(e) => setF({ ...f, contact: { ...f.contact, phone: e.target.value } })} placeholder="0113 496 0000" /></Field>
      <Field label="Email"><Input type="email" value={f.contact.email} onChange={(e) => setF({ ...f, contact: { ...f.contact, email: e.target.value } })} placeholder="hello@yourbusiness.co.uk" /></Field>
      <Field label="WhatsApp number" hint="If different from your phone."><Input value={f.contact.whatsapp} onChange={(e) => setF({ ...f, contact: { ...f.contact, whatsapp: e.target.value } })} placeholder="+44 7700 900000" /></Field>
      <Field label="Address or service area" className="sm:col-span-2"><Textarea rows={2} value={f.contact.address} onChange={(e) => setF({ ...f, contact: { ...f.contact, address: e.target.value } })} placeholder="12 Example Street, Leeds LS1 1AA · We cover Leeds, Bradford and Wakefield" /></Field>
    </div>
  );
  if (step === 8) body = (
    <div className="space-y-5">
      <Field label="Give your assistant a name" hint="Customers will see this name in the chat."><Input value={ai.assistant_name} onChange={(e) => setAi({ ...ai, assistant_name: e.target.value })} placeholder="e.g. Ava" /></Field>
      <div>
        <span className="block text-[13px] font-medium text-gray-700 mb-1.5">How should it sound?</span>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {PERSONALITIES.map((p) => (
            <button key={p.id} type="button" onClick={() => setAi({ ...ai, personality: p.id })} className={cn("rounded-xl border p-3.5 text-left transition", ai.personality === p.id ? "border-orange-400 bg-orange-50 ring-4 ring-orange-100" : "border-gray-200 hover:border-gray-300")}>
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-gray-900">{p.name}</span>{ai.personality === p.id && <Check className="w-4 h-4 text-orange-500" />}</div>
              <div className="text-[13px] text-gray-500 mt-1.5 italic">"{p.sample}"</div>
            </button>
          ))}
        </div>
      </div>
      <Field label="Greeting message" hint="The first thing customers see when they open your website chat."><Input value={ai.greeting} onChange={(e) => setAi({ ...ai, greeting: e.target.value })} placeholder={`Hi! I'm ${ai.assistant_name || "Ava"} at ${f.name}. How can I help?`} /></Field>
    </div>
  );
  if (step === 9) body = (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Globe className="w-4 h-4" /></span><div><div className="text-sm font-semibold text-gray-900">Website chat</div><div className="text-xs text-gray-500">Ready now. Paste this just before &lt;/body&gt; on your website.</div></div></div>
        <div className="mt-3 relative">
          <pre className="text-[12px] leading-relaxed bg-gray-900 text-gray-100 rounded-lg p-3 pr-12 overflow-x-auto whitespace-pre-wrap break-all">{snippet}</pre>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20" aria-label="Copy">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 p-4 flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#128C7E] flex items-center justify-center shrink-0"><MessageCircle className="w-4 h-4" /></span>
        <div className="flex-1"><div className="text-sm font-semibold text-gray-900">WhatsApp Business</div><div className="text-xs text-gray-500 mt-0.5 leading-relaxed">Connect your WhatsApp number so enquiries there are answered, qualified and saved as leads too. You can do this from Integrations at any time.</div></div>
      </div>
      <p className="text-xs text-gray-500">Facebook, Instagram, email, SMS and phone are coming soon.</p>
    </div>
  );
  if (step === 10) body = (
    <div className="text-center py-4">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F69D01] to-[#F65901] flex items-center justify-center shadow-lg shadow-orange-500/30"><PartyPopper className="w-7 h-7 text-white" /></div>
      <p className="text-sm text-gray-600 mt-5 max-w-sm mx-auto leading-relaxed">{ai.assistant_name || "Your assistant"} now knows about {f.name}, your services, hours and contact details. Add FAQs, prices and policies in the Knowledge Base to make it even sharper.</p>
      <ul className="mt-6 grid sm:grid-cols-3 gap-2.5 text-left">
        {["Answers enquiries 24/7", "Qualifies and scores leads", "Hands over to you anytime"].map((t) => (
          <li key={t} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[13px] text-gray-700"><Check className="w-4 h-4 text-emerald-500 shrink-0" />{t}</li>
        ))}
      </ul>
    </div>
  );

  const questions = ["What's your business called?", "What industry are you in?", "Do you have a website?", "Tell us about your business", "What do you offer?", "When are you open?", "How can customers reach you?", "Meet your AI assistant", "Where do your customers message you?", "You're ready to go"];

  return (
    <div className="min-h-screen bg-[#f6f6f7]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-gray-200">
        <Logo />
        {b?.onboarding_completed_at ? <Button variant="ghost" size="sm" onClick={() => nav("/app")}>Back to dashboard</Button>
          : step > 1 ? <Button variant="ghost" size="sm" onClick={() => nav("/app")}>Finish later</Button> : null}
      </header>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 lg:py-12 grid lg:grid-cols-[220px_1fr] gap-8">
        <ol className="hidden lg:block space-y-1">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            return (
              <li key={s.title}>
                <button disabled={n > Math.max(step, b?.onboarding_step || 1)} onClick={() => setStep(n)} className={cn("w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition disabled:cursor-default", n === step ? "bg-white shadow-sm ring-1 ring-gray-200 text-gray-900 font-semibold" : done ? "text-gray-600 hover:bg-white/60" : "text-gray-400")}>
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", done ? "bg-emerald-500 text-white" : n === step ? "bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white" : "bg-gray-200 text-gray-500")}>{done ? <Check className="w-3.5 h-3.5" /> : n}</span>
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>
        <div>
          <div className="lg:hidden mb-4">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5"><span>Step {step} of 10</span><span>{STEPS[step - 1].title}</span></div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#F69D01] to-[#F65901] transition-all" style={{ width: `${(step / 10) * 100}%` }} /></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-5 sm:px-8 pt-7 pb-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 bg-orange-50 rounded-full px-2.5 py-1"><StepIcon className="w-3.5 h-3.5" />Step {step} of 10</span>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-3">{questions[step - 1]}</h1>
            </div>
            <div className="px-5 sm:px-8 py-6">
              {error && <Alert tone="error" className="mb-4">{error}</Alert>}
              {body}
            </div>
            <div className="px-5 sm:px-8 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60 rounded-b-2xl">
              <Button variant="ghost" disabled={step === 1 || busy} onClick={() => setStep(step - 1)} icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
              <div className="flex items-center gap-2">
                {[3, 5, 7, 9].includes(step) && <Button variant="ghost" disabled={busy} onClick={() => save(step + 1)}>Skip</Button>}
                <Button size="lg" loading={busy} disabled={!canContinue} onClick={() => save(step + 1)}>{step === 10 ? "Go to my dashboard" : "Continue"}{step < 10 && <ArrowRight className="w-4 h-4" />}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
