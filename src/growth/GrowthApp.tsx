// Dleading Growth Engine™ — the business dashboard, mounted at /app/* (lazy-loaded, so the
// marketing site's bundle is unaffected).
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Database } from "lucide-react";
import { AuthProvider, useAuth } from "./auth";
import { AppLayout } from "./Layout";
import { ToastProvider, PageLoader, EmptyState } from "./ui";
import { Logo } from "./Brand";

const Login = lazy(() => import("./pages/Auth").then((m) => ({ default: m.Login })));
const Signup = lazy(() => import("./pages/Auth").then((m) => ({ default: m.Signup })));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Overview = lazy(() => import("./pages/Overview"));
const Leads = lazy(() => import("./pages/Leads"));
const Conversations = lazy(() => import("./pages/Conversations"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Automations = lazy(() => import("./pages/Automations"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Integrations = lazy(() => import("./pages/Integrations"));
const SettingsPage = lazy(() => import("./pages/Settings"));

function useAppChrome() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Dleading Growth Engine™";
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) { meta = document.createElement("meta"); meta.name = "robots"; document.head.appendChild(meta); }
    const prevRobots = meta.content;
    meta.content = "noindex, nofollow";
    if (!document.getElementById("ge-font")) {
      const l = document.createElement("link");
      l.id = "ge-font"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    return () => { document.title = prevTitle; if (created) meta!.remove(); else meta!.content = prevRobots; };
  }, []);
}

function Unavailable() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f6f7] px-4">
      <Logo />
      <div className="mt-8 bg-white rounded-2xl border border-gray-200 max-w-md w-full">
        <EmptyState icon={<Database className="w-5 h-5" />} title="Almost ready">
          The Growth Engine database hasn't been connected to this site yet. Once it is, sign-up and the dashboard will appear here automatically.
        </EmptyState>
      </div>
    </div>
  );
}

function Protected({ children, allowUnonboarded = true }: { children: React.ReactNode; allowUnonboarded?: boolean }) {
  const { me, loading, unavailable } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen bg-[#f6f6f7]"><PageLoader /></div>;
  if (unavailable) return <Unavailable />;
  if (!me?.user) return <Navigate to="/app/login" replace state={{ from: loc.pathname }} />;
  if (!me.business) return <Navigate to="/app/onboarding" replace />;
  if (!allowUnonboarded && !me.business.onboarding_completed_at && me.business.onboarding_step <= 1) return <Navigate to="/app/onboarding" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { me, loading, unavailable } = useAuth();
  if (loading) return <div className="min-h-screen bg-white"><PageLoader /></div>;
  if (unavailable) return <Unavailable />;
  if (me?.user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function GrowthApp() {
  useAppChrome();
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<div className="min-h-screen bg-[#f6f6f7]"><PageLoader /></div>}>
          <Routes>
            <Route path="login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="signup" element={<PublicOnly><Signup /></PublicOnly>} />
            <Route path="onboarding" element={<Protected><Onboarding /></Protected>} />
            <Route element={<Protected><AppLayout /></Protected>}>
              <Route index element={<Protected allowUnonboarded={false}><Overview /></Protected>} />
              <Route path="leads" element={<Leads />} />
              <Route path="conversations" element={<Conversations />} />
              <Route path="conversations/:id" element={<Conversations />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="automations" element={<Automations />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
