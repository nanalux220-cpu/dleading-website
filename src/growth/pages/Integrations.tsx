// Integrations: the channels the Growth Engine listens on, and the website chat widget setup.
import { useState, type ReactNode } from "react";
import {
  AlertTriangle, Bell, CalendarDays, Check, CheckCircle2, Clock, Code2, Copy, Eye, Facebook, Globe, Instagram, KeyRound,
  Link2, Lock, Mail, MessageCircle, MessageSquare, Palette, Phone, Plus, RefreshCw, Send, ShieldCheck, Unlink, X,
} from "lucide-react";
import { api, errorMessage } from "../api";
import { canManage, useAuth } from "../auth";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Skeleton, cn, useLoad, useToast } from "../ui";

type Integration = { id: string; provider: string; status: string; external_id: string | null; display_name: string; config: Record<string, unknown>; connected_at: string | null };
type Brand = { primary_color?: string; logo_url?: string };
type IntegrationsResp = {
  integrations: Integration[];
  widget: { public_key: string; widget_allowed_origins: string[]; brand: Brand };
  whatsapp_platform: { available: boolean; linked_elsewhere: boolean };
};

const DEFAULT_COLOUR = "#F65901";
const MANAGER_HINT = "Only owners and admins can change integrations.";

export default function Integrations() {
  const { me } = useAuth();
  const manager = canManage(me);
  const { data, loading, error, reload, setData } = useLoad(() => api<IntegrationsResp>("integrations"), []);

  if (!data) {
    if (error && !loading) {
      return (
        <div>
          <PageHeader title="Integrations" />
          <Card>
            <EmptyState icon={<Link2 className="w-5 h-5" />} title="We couldn't load your integrations" action={<Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={reload}>Try again</Button>}>
              {errorMessage(error)}
            </EmptyState>
          </Card>
        </div>
      );
    }
    return (
      <div>
        <PageHeader title="Integrations" subtitle="Connect the places your customers already message you." />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const byProvider = (p: string) => data.integrations.find((i) => i.provider === p);

  return (
    <div>
      <PageHeader title="Integrations" subtitle="Connect the places your customers already message you. Every conversation lands in one inbox, answered by your AI assistant." />
      {!manager && <Alert tone="info" className="mb-4 flex items-center gap-2"><Lock className="w-4 h-4 shrink-0" />You can view integrations, but only owners and admins can connect or change them.</Alert>}

      <SectionTitle>Live channels</SectionTitle>
      <div className="space-y-4">
        <WhatsAppCard integration={byProvider("whatsapp")} platform={data.whatsapp_platform} manager={manager} onChange={reload} />
        <WidgetCard
          widget={data.widget}
          manager={manager}
          onSaved={(w) => setData({ ...data, widget: { ...data.widget, ...w } })}
        />
      </div>

      <SectionTitle className="mt-8">Coming soon</SectionTitle>
      <p className="text-sm text-gray-500 -mt-1 mb-3">We're rolling these out over the coming months. Let us know which ones matter to you and we'll prioritise your business.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SOON.map((s) => <ComingSoonCard key={s.provider} {...s} requested={!!byProvider(s.provider)} manager={manager} onRequested={reload} />)}
      </div>
    </div>
  );
}

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3", className)}>{children}</h2>;
}

function ProviderIcon({ children, className }: { children: ReactNode; className: string }) {
  return <span className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", className)}>{children}</span>;
}

// ---------- WhatsApp ----------
function WhatsAppCard({ integration, platform, manager, onChange }: { integration?: Integration; platform: IntegrationsResp["whatsapp_platform"]; manager: boolean; onChange: () => void }) {
  const toast = useToast();
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkError, setLinkError] = useState("");
  const connected = integration?.status === "connected";
  const pending = integration?.status === "pending";

  const link = async () => {
    setBusy(true);
    setLinkError("");
    try {
      await api("integrations/whatsapp/link", { method: "POST", body: { admin_password: password } });
      toast("WhatsApp number linked to this business");
      setLinkOpen(false);
      setPassword("");
      onChange();
    } catch (e) {
      setLinkError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const unlink = async () => {
    setBusy(true);
    try {
      await api("integrations/whatsapp/unlink", { method: "POST" });
      toast("WhatsApp unlinked from this business");
      setUnlinkOpen(false);
      onChange();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const request = async () => {
    setBusy(true);
    try {
      await api("integrations/request", { method: "POST", body: { provider: "whatsapp" } });
      toast("Request sent. We'll be in touch to set up WhatsApp.");
      onChange();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  let status: ReactNode;
  let action: ReactNode;
  let body: ReactNode;
  if (connected) {
    status = <Badge tone="green" dot>Connected</Badge>;
    action = <Button variant="danger" size="sm" icon={<Unlink className="w-4 h-4" />} disabled={!manager} title={manager ? undefined : MANAGER_HINT} onClick={() => setUnlinkOpen(true)}>Unlink</Button>;
    body = (
      <dl className="grid gap-3 sm:grid-cols-3 mt-4">
        <Detail label="Display name" value={integration?.display_name || "WhatsApp Business"} />
        <Detail label="Phone number ID" value={<span className="font-mono text-[13px]">{integration?.external_id || "—"}</span>} />
        <Detail label="Connected" value={integration?.connected_at ? new Date(integration.connected_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
      </dl>
    );
  } else if (platform.available) {
    status = pending ? <Badge tone="amber" dot>Requested</Badge> : <Badge tone="gray">Not connected</Badge>;
    action = <Button size="sm" icon={<Link2 className="w-4 h-4" />} disabled={!manager} title={manager ? undefined : MANAGER_HINT} onClick={() => { setLinkError(""); setLinkOpen(true); }}>Link the live WhatsApp number</Button>;
    body = platform.linked_elsewhere ? (
      <Alert tone="warning" className="mt-4 flex gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>The live WhatsApp number is currently linked to another business. Linking it here will move it, and new WhatsApp conversations will arrive in this business instead.</span></Alert>
    ) : null;
  } else {
    status = pending ? <Badge tone="amber" dot>Requested</Badge> : <Badge tone="gray">Not connected</Badge>;
    action = pending
      ? <Button variant="secondary" size="sm" icon={<Check className="w-4 h-4" />} disabled>Requested</Button>
      : <Button size="sm" icon={<Send className="w-4 h-4" />} loading={busy} disabled={!manager} title={manager ? undefined : MANAGER_HINT} onClick={request}>Request WhatsApp connection</Button>;
    body = (
      <p className="text-sm text-gray-600 mt-4 leading-relaxed">
        {pending
          ? "Thanks — we've got your request. The Dleading team will contact you to connect your WhatsApp Business number."
          : "Request a connection and the Dleading team will set up WhatsApp for you. Connecting your own number yourself is coming in a later update."}
      </p>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <ProviderIcon className="bg-[#25D366]/10 text-[#128C7E]"><MessageCircle className="w-5 h-5" /></ProviderIcon>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-gray-900">WhatsApp Business</h3>
            <Badge tone="gray" className="font-normal">Cloud API</Badge>
            {status}
          </div>
          <p className="text-sm text-gray-500 mt-1">Your AI assistant replies to WhatsApp messages instantly, captures leads and hands over to your team when needed.</p>
        </div>
        <div className="sm:ml-auto">{action}</div>
      </div>
      {body}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-600">
        <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
        <span>Replies, AI answers and handoff to your team on the existing WhatsApp number keep working exactly as before. Linking simply shows those conversations and leads in this dashboard.</span>
      </div>

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link the live WhatsApp number"
        footer={<>
          <Button variant="secondary" onClick={() => setLinkOpen(false)}>Cancel</Button>
          <Button icon={<Link2 className="w-4 h-4" />} loading={busy} disabled={!password.trim()} onClick={link}>Link number</Button>
        </>}
      >
        <form onSubmit={(e) => { e.preventDefault(); if (password.trim()) link(); }} className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            To keep the number safe, linking needs the <strong className="font-semibold text-gray-900">WhatsApp admin password</strong>. It's the same password you use to sign in to the existing WhatsApp admin page (<span className="font-mono text-[13px]">/admin.html</span>), not your dashboard password.
          </p>
          {platform.linked_elsewhere && (
            <Alert tone="warning" className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>This number is linked to another business. Linking it here moves it, so that business will stop seeing new WhatsApp conversations.</span></Alert>
          )}
          <Field label="WhatsApp admin password" error={linkError || undefined}>
            <Input type="password" autoFocus autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter the admin password" />
          </Field>
          <p className="text-xs text-gray-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Customers won't notice anything. Replies, AI and handoff keep working as before.</p>
        </form>
      </Modal>

      <Modal
        open={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        title="Unlink WhatsApp?"
        footer={<>
          <Button variant="secondary" onClick={() => setUnlinkOpen(false)}>Cancel</Button>
          <Button variant="danger" icon={<Unlink className="w-4 h-4" />} loading={busy} onClick={unlink}>Unlink</Button>
        </>}
      >
        <p className="text-sm text-gray-600 leading-relaxed">New WhatsApp conversations will stop appearing in this business. Your existing leads and conversation history stay where they are, and you can link the number again at any time.</p>
      </Modal>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value}</dd>
    </div>
  );
}

// ---------- Website chat widget ----------
function normaliseOrigin(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!/^https?:$/.test(u.protocol) || (!u.hostname.includes(".") && u.hostname !== "localhost")) return null;
    return u.origin;
  } catch {
    return null;
  }
}

function WidgetCard({ widget, manager, onSaved }: { widget: IntegrationsResp["widget"]; manager: boolean; onSaved: (w: Partial<IntegrationsResp["widget"]>) => void }) {
  const toast = useToast();
  const { setBusiness } = useAuth();
  const snippet = `<script src="${window.location.origin}/widget.js" data-key="${widget.public_key}" async></script>`;
  const [copied, setCopied] = useState<"snippet" | "key" | null>(null);
  const [origins, setOrigins] = useState<string[]>(widget.widget_allowed_origins || []);
  const [newOrigin, setNewOrigin] = useState("");
  const [originError, setOriginError] = useState("");
  const [colour, setColour] = useState(widget.brand?.primary_color || DEFAULT_COLOUR);
  const [logo, setLogo] = useState(widget.brand?.logo_url || "");
  const [savingOrigins, setSavingOrigins] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [preview, setPreview] = useState(false);

  const copy = async (text: string, what: "snippet" | "key") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast("Couldn't copy automatically. Select the text and copy it manually.", "error");
    }
  };

  const saveOrigins = async (next: string[]) => {
    setSavingOrigins(true);
    try {
      const r = await api<{ business: Parameters<typeof setBusiness>[0] }>("business", { method: "PATCH", body: { widget_allowed_origins: next } });
      setOrigins(r.business.widget_allowed_origins);
      setBusiness(r.business);
      onSaved({ widget_allowed_origins: r.business.widget_allowed_origins });
      toast("Allowed websites updated");
      return true;
    } catch (e) {
      toast(errorMessage(e), "error");
      return false;
    } finally {
      setSavingOrigins(false);
    }
  };
  const addOrigin = async () => {
    const o = normaliseOrigin(newOrigin);
    if (!o) { setOriginError("Enter a website address, like www.yourbusiness.co.uk"); return; }
    if (origins.includes(o)) { setOriginError("That website is already on the list."); return; }
    setOriginError("");
    if (await saveOrigins([...origins, o])) setNewOrigin("");
  };

  const validColour = /^#[0-9a-fA-F]{6}$/.test(colour);
  const brandDirty = colour.toLowerCase() !== (widget.brand?.primary_color || DEFAULT_COLOUR).toLowerCase() || logo.trim() !== (widget.brand?.logo_url || "");
  const saveBrand = async () => {
    if (!validColour) { toast("Use a colour like #F65901", "error"); return; }
    setSavingBrand(true);
    try {
      const r = await api<{ business: Parameters<typeof setBusiness>[0] }>("business", { method: "PATCH", body: { brand: { primary_color: colour, logo_url: logo.trim() } } });
      setBusiness(r.business);
      onSaved({ brand: r.business.brand });
      setColour(r.business.brand?.primary_color || colour);
      setLogo(r.business.brand?.logo_url || "");
      toast("Widget appearance saved");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSavingBrand(false);
    }
  };

  return (
    <Card>
      <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4 border-b border-gray-100">
        <ProviderIcon className="bg-orange-50 text-orange-600"><Globe className="w-5 h-5" /></ProviderIcon>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-gray-900">Website chat</h3>
            <Badge tone="green" dot>Available</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">Add a chat button to your website. Visitors chat with your AI assistant, and their details arrive here as leads.</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => setPreview(true)} className="sm:ml-auto self-start">Preview</Button>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Step 1: install */}
        <section className="p-5">
          <StepTitle n={1} icon={<Code2 className="w-4 h-4" />} title="Add the code to your website" />
          <p className="text-sm text-gray-500 mt-1 mb-3">Paste this line just before the closing <code className="font-mono text-[12px] bg-gray-100 rounded px-1 py-0.5">&lt;/body&gt;</code> tag on every page, or send it to whoever looks after your website. It works with WordPress, Wix, Squarespace, Shopify and custom sites.</p>
          <div className="relative rounded-lg bg-gray-950 text-gray-100 ring-1 ring-gray-900">
            <pre className="overflow-x-auto px-4 py-3.5 pr-24 text-[12.5px] leading-relaxed font-mono whitespace-pre-wrap break-all">{snippet}</pre>
            <button onClick={() => copy(snippet, "snippet")} className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-medium text-white transition">
              {copied === "snippet" ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-gray-500">
            <KeyRound className="w-4 h-4 text-gray-400" />
            Public key
            <code className="font-mono text-[12.5px] text-gray-800 bg-gray-100 rounded px-1.5 py-0.5 break-all">{widget.public_key}</code>
            <button onClick={() => copy(widget.public_key, "key")} className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium">
              {copied === "key" ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
            <span className="w-full sm:w-auto text-xs text-gray-400">Safe to share. It only identifies your chat, it isn't a password.</span>
          </div>
        </section>

        {/* Step 2: allowed websites */}
        <section className="p-5">
          <StepTitle n={2} icon={<ShieldCheck className="w-4 h-4" />} title="Allowed websites" badge={<Badge tone="orange">Recommended</Badge>} />
          <p className="text-sm text-gray-500 mt-1 mb-3">Choose which websites can show your chat. If you leave this empty, the chat works on any site. We recommend adding your own domain so nobody else can use your chat on their website.</p>
          {origins.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 mb-3">No websites added. Your chat currently works on any website.</div>
          ) : (
            <ul className="flex flex-wrap gap-2 mb-3">
              {origins.map((o) => (
                <li key={o} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 ring-1 ring-gray-200 pl-3 pr-1.5 py-1.5 text-sm text-gray-800">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-mono text-[12.5px]">{o}</span>
                  <button
                    aria-label={`Remove ${o}`}
                    disabled={!manager || savingOrigins}
                    title={manager ? "Remove" : MANAGER_HINT}
                    onClick={() => saveOrigins(origins.filter((x) => x !== o))}
                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={(e) => { e.preventDefault(); addOrigin(); }} className="flex flex-col sm:flex-row gap-2 sm:max-w-xl">
            <Field error={originError || undefined} hint={manager ? "For example: www.yourbusiness.co.uk" : MANAGER_HINT} className="flex-1">
              <Input value={newOrigin} onChange={(e) => { setNewOrigin(e.target.value); setOriginError(""); }} placeholder="www.yourbusiness.co.uk" disabled={!manager} inputMode="url" autoCapitalize="off" spellCheck={false} />
            </Field>
            <Button type="submit" variant="secondary" icon={<Plus className="w-4 h-4" />} loading={savingOrigins} disabled={!manager || !newOrigin.trim()} className="sm:self-start">Add website</Button>
          </form>
        </section>

        {/* Step 3: appearance */}
        <section className="p-5">
          <StepTitle n={3} icon={<Palette className="w-4 h-4" />} title="Appearance" />
          <p className="text-sm text-gray-500 mt-1 mb-3">Match the chat button to your brand.</p>
          <div className="grid gap-4 sm:grid-cols-2 sm:max-w-2xl">
            <Field label="Brand colour" hint={manager ? "Used for the chat button and header." : MANAGER_HINT}>
              <div className="flex items-center gap-2">
                <label className={cn("relative w-10 h-10 rounded-lg ring-1 ring-gray-200 overflow-hidden shrink-0", manager ? "cursor-pointer" : "opacity-50")} style={{ background: validColour ? colour : DEFAULT_COLOUR }}>
                  <input type="color" aria-label="Pick brand colour" value={validColour ? colour : DEFAULT_COLOUR} onChange={(e) => setColour(e.target.value.toUpperCase())} disabled={!manager} className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
                <Input value={colour} onChange={(e) => setColour(e.target.value.trim())} maxLength={7} disabled={!manager} className={cn("font-mono uppercase", !validColour && "border-red-300")} />
              </div>
            </Field>
            <Field label="Logo URL (optional)" hint="A square image link, shown in the chat header.">
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…/logo.png" disabled={!manager} inputMode="url" />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={<Check className="w-4 h-4" />} loading={savingBrand} disabled={!manager || !brandDirty || !validColour} onClick={saveBrand}>Save appearance</Button>
            <Button variant="ghost" icon={<Eye className="w-4 h-4" />} onClick={() => setPreview(true)}>Preview</Button>
          </div>
        </section>
      </div>

      <Modal open={preview} onClose={() => setPreview(false)} title="Website chat preview" wide>
        <WidgetPreview colour={validColour ? colour : DEFAULT_COLOUR} logo={logo.trim()} />
        <p className="text-xs text-gray-500 mt-3">A preview of how the chat looks on your website. Replies come from your AI assistant using your Knowledge base.</p>
      </Modal>
    </Card>
  );
}

function StepTitle({ n, icon, title, badge }: { n: number; icon: ReactNode; title: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center" aria-hidden>{n}</span>
      <span className="text-gray-400">{icon}</span>
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      {badge}
    </div>
  );
}

function WidgetPreview({ colour, logo }: { colour: string; logo: string }) {
  const { me } = useAuth();
  const name = me?.business?.name || "Your business";
  const [logoOk, setLogoOk] = useState(true);
  return (
    <div className="relative rounded-xl bg-[linear-gradient(180deg,#F3F4F6,#E5E7EB)] h-[460px] overflow-hidden ring-1 ring-gray-200">
      {/* faux website */}
      <div className="absolute inset-x-0 top-0 h-9 bg-white/80 border-b border-gray-200 flex items-center gap-1.5 px-3">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /><span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        <span className="ml-3 h-4 w-40 rounded bg-gray-100" />
      </div>
      <div className="absolute left-5 top-14 space-y-2.5 w-1/2 hidden sm:block">
        <div className="h-5 w-3/4 rounded bg-white/80" /><div className="h-3 w-full rounded bg-white/60" /><div className="h-3 w-5/6 rounded bg-white/60" /><div className="h-3 w-2/3 rounded bg-white/60" />
      </div>
      {/* panel */}
      <div className="absolute right-4 bottom-20 w-[300px] max-w-[calc(100%-2rem)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="px-4 py-3.5 text-white flex items-center gap-2.5" style={{ background: colour }}>
          {logo && logoOk ? (
            <img src={logo} alt="" onError={() => setLogoOk(false)} className="w-8 h-8 rounded-full bg-white object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">{name.slice(0, 1).toUpperCase()}</span>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-[11px] opacity-85 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />Typically replies instantly</div>
          </div>
          <X className="w-4 h-4 ml-auto opacity-80" />
        </div>
        <div className="px-3.5 py-4 space-y-2.5 bg-gray-50 text-[13px]">
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white ring-1 ring-gray-200 px-3 py-2 text-gray-800">Hi there! How can we help you today?</div>
          <div className="max-w-[85%] ml-auto rounded-2xl rounded-br-md px-3 py-2 text-white" style={{ background: colour }}>Do you have availability this week?</div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white ring-1 ring-gray-200 px-3 py-2 text-gray-800">We do. Could I take your name and the best number to reach you?</div>
        </div>
        <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2.5">
          <span className="flex-1 text-[13px] text-gray-400">Type your message…</span>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: colour }}><Send className="w-3.5 h-3.5" /></span>
        </div>
      </div>
      {/* launcher */}
      <span className="absolute right-4 bottom-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white" style={{ background: colour }}>
        <MessageCircle className="w-6 h-6" />
      </span>
    </div>
  );
}

// ---------- coming soon ----------
const SOON: { provider: string; name: string; text: string; icon: ReactNode; iconCls: string }[] = [
  { provider: "facebook", name: "Facebook Messenger", text: "Answer Facebook Page messages with your AI assistant.", icon: <Facebook className="w-5 h-5" />, iconCls: "bg-blue-50 text-blue-600" },
  { provider: "instagram", name: "Instagram DMs", text: "Reply to Instagram direct messages and capture leads.", icon: <Instagram className="w-5 h-5" />, iconCls: "bg-pink-50 text-pink-600" },
  { provider: "email", name: "Email", text: "Turn enquiry emails into leads and draft replies automatically.", icon: <Mail className="w-5 h-5" />, iconCls: "bg-sky-50 text-sky-600" },
  { provider: "sms", name: "SMS", text: "Text customers back and send follow-up reminders.", icon: <MessageSquare className="w-5 h-5" />, iconCls: "bg-gray-100 text-gray-600" },
  { provider: "voice", name: "Phone receptionist", text: "An AI receptionist that answers calls and takes messages.", icon: <Phone className="w-5 h-5" />, iconCls: "bg-violet-50 text-violet-600" },
  { provider: "calendar", name: "Calendar", text: "Sync appointments with Google or Outlook Calendar.", icon: <CalendarDays className="w-5 h-5" />, iconCls: "bg-emerald-50 text-emerald-600" },
];

function ComingSoonCard({ provider, name, text, icon, iconCls, requested, manager, onRequested }: (typeof SOON)[number] & { requested: boolean; manager: boolean; onRequested: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const request = async () => {
    setBusy(true);
    try {
      await api("integrations/request", { method: "POST", body: { provider } });
      toast(`Thanks! We'll let you know when ${name} is ready.`);
      onRequested();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <ProviderIcon className={iconCls}>{icon}</ProviderIcon>
        {requested ? <Badge tone="amber" dot>Requested</Badge> : <Badge tone="gray"><Clock className="w-3 h-3" />Coming soon</Badge>}
      </div>
      <h3 className="text-[15px] font-semibold text-gray-900 mt-4">{name}</h3>
      <p className="text-sm text-gray-500 mt-1 flex-1">{text}</p>
      <div className="mt-4">
        {requested ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500"><CheckCircle2 className="w-4 h-4 text-emerald-600" />We'll notify you when it's ready</span>
        ) : (
          <Button variant="secondary" size="sm" icon={<Bell className="w-4 h-4" />} loading={busy} disabled={!manager} title={manager ? undefined : MANAGER_HINT} onClick={request}>Notify me</Button>
        )}
      </div>
    </Card>
  );
}
