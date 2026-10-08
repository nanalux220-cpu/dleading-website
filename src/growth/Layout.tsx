/* eslint-disable react-refresh/only-export-components -- shared hooks/constants live beside their components */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, MessagesSquare, Bot, BookOpen, Workflow, CalendarDays, BarChart3, Plug, Settings,
  ChevronsUpDown, LogOut, Plus, Check, Menu, X, Sparkles,
} from "lucide-react";
import { Logo } from "./Brand";
import { useAuth } from "./auth";
import { api, errorMessage } from "./api";
import { Avatar, Button, Input, Modal, cn, useToast } from "./ui";

export const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/leads", label: "Leads", icon: Users },
  { to: "/app/conversations", label: "Conversations", icon: MessagesSquare },
  { to: "/app/assistant", label: "AI Assistant", icon: Bot },
  { to: "/app/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/app/automations", label: "Automations", icon: Workflow },
  { to: "/app/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/integrations", label: "Integrations", icon: Plug },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function BusinessSwitcher() {
  const { me, refresh } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const switchTo = async (id: string) => {
    setOpen(false);
    if (id === me?.business?.id) return;
    try { await api("auth/switch", { method: "POST", body: { business_id: id } }); await refresh(); nav("/app"); } catch (e) { toast(errorMessage(e), "error"); }
  };
  const create = async () => {
    setBusy(true);
    try { await api("businesses/create", { method: "POST", body: { name } }); await refresh(); setAdding(false); setName(""); nav("/app/onboarding"); }
    catch (e) { toast(errorMessage(e), "error"); } finally { setBusy(false); }
  };
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/10 transition text-left">
        <span className="w-7 h-7 rounded-md bg-white/10 text-white text-xs font-bold flex items-center justify-center shrink-0">{(me?.business?.name || "?").slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-white truncate">{me?.business?.name}</span>
          <span className="block text-[11px] text-white/45 capitalize">{me?.business?.plan_id} plan</span>
        </span>
        <ChevronsUpDown className="w-4 h-4 text-white/40" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-30 rounded-lg bg-white shadow-xl ring-1 ring-gray-200 py-1.5 text-sm">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Businesses</div>
          {(me?.businesses || []).map((b) => (
            <button key={b.id} onClick={() => switchTo(b.id)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
              <span className="flex-1 truncate text-gray-800">{b.name}</span>
              {b.id === me?.business?.id && <Check className="w-4 h-4 text-orange-500" />}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { setOpen(false); setAdding(true); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"><Plus className="w-4 h-4" />Add a business</button>
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a business" footer={<><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={create} loading={busy} disabled={!name.trim()}>Create business</Button></>}>
        <p className="text-sm text-gray-500 mb-4">Each business gets its own leads, conversations, AI assistant and settings. Nothing is shared between businesses.</p>
        <Input autoFocus placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && create()} />
      </Modal>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { me, refresh } = useAuth();
  const nav = useNavigate();
  const logout = async () => { await api("auth/logout", { method: "POST" }).catch(() => {}); await refresh(); nav("/app/login"); };
  return (
    <div className="flex flex-col h-full bg-[#0f0f10] text-white">
      <div className="px-4 pt-5 pb-4"><Logo dark /></div>
      <div className="px-3 pb-3"><BusinessSwitcher /></div>
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
            className={({ isActive }) => cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition",
              isActive ? "bg-white/[0.09] text-white" : "text-white/60 hover:text-white hover:bg-white/[0.05]")}>
            {({ isActive }) => (<>
              <n.icon className={cn("w-[18px] h-[18px]", isActive ? "text-orange-400" : "text-white/40 group-hover:text-white/70")} />
              {n.label}
            </>)}
          </NavLink>
        ))}
      </nav>
      {me?.business && !me.business.onboarding_completed_at && (
        <div className="mx-3 mb-3 rounded-lg bg-gradient-to-br from-[#F69D01]/20 to-[#F65901]/10 ring-1 ring-orange-500/30 p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold"><Sparkles className="w-4 h-4 text-orange-400" />Finish setting up</div>
          <p className="text-xs text-white/60 mt-1">Step {me.business.onboarding_step} of 10. Your AI gets smarter with every step.</p>
          <button onClick={() => { onNavigate?.(); nav("/app/onboarding"); }} className="mt-2 text-xs font-semibold text-orange-300 hover:text-orange-200">Continue setup →</button>
        </div>
      )}
      <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
        <Avatar name={me?.user?.name || me?.user?.email} size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium truncate">{me?.user?.name || "You"}</div>
          <div className="text-[11px] text-white/45 truncate">{me?.user?.email}</div>
        </div>
        <button onClick={logout} title="Sign out" className="p-2 rounded-md text-white/45 hover:text-white hover:bg-white/10"><LogOut className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  const current = NAV.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)));
  const full = loc.pathname.startsWith("/app/conversations");
  return (
    <div className="min-h-screen bg-[#f6f6f7] text-gray-900 antialiased" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[248px] z-20"><Sidebar /></aside>
      {mobile && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobile(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] shadow-2xl"><Sidebar onNavigate={() => setMobile(false)} /></aside>
          <button onClick={() => setMobile(false)} className="absolute top-4 left-[284px] p-2 rounded-full bg-white/90 text-gray-700" aria-label="Close menu"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="lg:pl-[248px]">
        <header className="lg:hidden sticky top-0 z-10 flex items-center gap-3 h-14 px-4 bg-white/90 backdrop-blur border-b border-gray-200">
          <button onClick={() => setMobile(true)} className="p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100" aria-label="Open menu"><Menu className="w-5 h-5" /></button>
          <span className="font-semibold text-[15px]">{current?.label || "Growth Engine"}</span>
        </header>
        <main className={full ? "" : "px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto"}>{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
