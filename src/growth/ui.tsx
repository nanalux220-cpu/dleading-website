/* eslint-disable react-refresh/only-export-components -- shared hooks/constants live beside their components */
// Growth Engine UI kit: one consistent look for every dashboard page.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Loader2, X, CheckCircle2, AlertCircle, MessageCircle, Globe, Facebook, Instagram, Phone, Mail, MessageSquare } from "lucide-react";
import { initials } from "./format";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------- buttons ----------
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" | "dark"; size?: "sm" | "md" | "lg"; loading?: boolean; icon?: ReactNode };
export function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest }: BtnProps) {
  const v = {
    primary: "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white shadow-sm shadow-orange-500/20 hover:brightness-105",
    secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
    dark: "bg-gray-900 text-white hover:bg-gray-800",
  }[variant];
  const s = { sm: "h-8 px-3 text-[13px] gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-[15px] gap-2" }[size];
  return (
    <button {...rest} disabled={disabled || loading} className={cn("inline-flex items-center justify-center rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1", v, s, className)}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ---------- layout ----------
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  // Only default to white when the caller didn't choose a background (Tailwind can't override by class order).
  const bg = /(^|\s)bg-/.test(className || "") ? "" : "bg-white";
  return <div {...rest} className={cn(bg, "rounded-xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)}>{children}</div>;
}
export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-3", className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ---------- form ----------
export function Field({ label, hint, error, children, className }: { label?: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</span>}
      {children}
      {error ? <span className="block text-xs text-red-600 mt-1">{error}</span> : hint ? <span className="block text-xs text-gray-500 mt-1">{hint}</span> : null}
    </label>
  );
}
const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-gray-50";
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, "h-10", p.className)} />;
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(inputCls, "py-2.5 leading-relaxed", p.className)} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(inputCls, "h-10 pr-8 cursor-pointer", p.className)} />;

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 disabled:opacity-50">
      <span className={cn("relative w-10 h-6 rounded-full transition", checked ? "bg-gradient-to-r from-[#F69D01] to-[#F65901]" : "bg-gray-200")}>
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition", checked && "translate-x-4")} />
      </span>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </button>
  );
}

// ---------- feedback ----------
export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn("w-5 h-5 animate-spin text-orange-500", className)} />;
export function PageLoader() {
  return <div className="flex items-center justify-center py-24"><Spinner className="w-6 h-6" /></div>;
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-100", className)} />;
}

export function EmptyState({ icon, title, children, action, className }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center text-center px-6 py-14", className)}>
      <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4 ring-1 ring-orange-100">{icon}</div>
      <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
      {children && <p className="text-sm text-gray-500 mt-1.5 max-w-sm leading-relaxed">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "info", children, className }: { tone?: "info" | "warning" | "error" | "success"; children: ReactNode; className?: string }) {
  const t = { info: "bg-blue-50 text-blue-900 ring-blue-100", warning: "bg-amber-50 text-amber-900 ring-amber-100", error: "bg-red-50 text-red-800 ring-red-100", success: "bg-emerald-50 text-emerald-900 ring-emerald-100" }[tone];
  return <div className={cn("rounded-lg px-4 py-3 text-sm ring-1", t, className)}>{children}</div>;
}

// ---------- badges ----------
const TONES = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  dark: "bg-gray-900 text-white ring-gray-900",
};
export function Badge({ tone = "gray", children, className, dot }: { tone?: keyof typeof TONES; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
export function ScoreBadge({ label, score }: { label?: string; score?: number }) {
  const tone = label === "hot" ? "red" : label === "warm" ? "amber" : "blue";
  const text = label === "hot" ? "Hot" : label === "warm" ? "Warm" : "Cold";
  return <Badge tone={tone} dot>{text}{typeof score === "number" ? <span className="opacity-60 tabular-nums">{score}</span> : null}</Badge>;
}
const STATUS_TONE: Record<string, keyof typeof TONES> = { new: "blue", contacted: "violet", qualified: "orange", appointment: "amber", won: "green", lost: "gray" };
export function StatusBadge({ status }: { status: string }) {
  const label = { new: "New", contacted: "Contacted", qualified: "Qualified", appointment: "Appointment", won: "Won", lost: "Lost" }[status] || status;
  return <Badge tone={STATUS_TONE[status] || "gray"}>{label}</Badge>;
}
export function HandlerBadge({ handler }: { handler: string }) {
  return handler === "human" ? <Badge tone="violet" dot>Human</Badge> : <Badge tone="green" dot>AI</Badge>;
}

export function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  const map: Record<string, { I: any; c: string }> = {
    whatsapp: { I: MessageCircle, c: "bg-[#25D366]/10 text-[#128C7E]" },
    website: { I: Globe, c: "bg-orange-50 text-orange-600" },
    facebook: { I: Facebook, c: "bg-blue-50 text-blue-600" },
    instagram: { I: Instagram, c: "bg-pink-50 text-pink-600" },
    voice: { I: Phone, c: "bg-violet-50 text-violet-600" },
    email: { I: Mail, c: "bg-sky-50 text-sky-600" },
    sms: { I: MessageSquare, c: "bg-gray-100 text-gray-600" },
  };
  const m = map[channel] || map.sms;
  return <span className={cn("inline-flex items-center justify-center rounded-md w-6 h-6 shrink-0", m.c, className)}><m.I className="w-3.5 h-3.5" /></span>;
}

export function Avatar({ name, size = 36, className }: { name?: string; size?: number; className?: string }) {
  const hue = [...(name || "?")].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360;
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0", className)} style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 30) % 360} 75% 45%))` }}>
      {initials(name)}
    </span>
  );
}

export function StatCard({ label, value, icon, hint, tone = "orange", onClick }: { label: string; value: ReactNode; icon: ReactNode; hint?: ReactNode; tone?: "orange" | "red" | "green" | "blue" | "violet" | "amber"; onClick?: () => void }) {
  const t = { orange: "bg-orange-50 text-orange-600", red: "bg-red-50 text-red-600", green: "bg-emerald-50 text-emerald-600", blue: "bg-sky-50 text-sky-600", violet: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600" }[tone];
  return (
    <Card className={cn("p-4 sm:p-5", onClick && "cursor-pointer hover:border-gray-300 transition")} onClick={onClick}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-500">{label}</span>
        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t)}>{icon}</span>
      </div>
      <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-gray-900 tabular-nums">{value}</div>
      {hint && <div className="mt-2 text-xs text-gray-500">{hint}</div>}
    </Card>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 -mb-px">
      {items.map((it) => (
        <button key={it.value} onClick={() => onChange(it.value)} className={cn("px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition", value === it.value ? "border-orange-500 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800")}>
          {it.label}
          {typeof it.count === "number" && <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums", value === it.value ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500")}>{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- overlays ----------
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn("relative bg-white w-full rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/60 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gray-900/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0 flex-1">{title}</div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">{footer}</div>}
      </aside>
    </div>
  );
}

// ---------- toasts ----------
type Toast = { id: number; tone: "success" | "error"; text: string };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-gray-900 text-white text-sm px-4 py-3 shadow-xl max-w-sm">
            {t.tone === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Small data hook: { data, loading, error, reload }. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn().then((d) => { if (alive) { setData(d); setError(null); } }).catch((e) => alive && setError(e)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { data, loading, error, reload: () => setN((x) => x + 1), setData };
}
