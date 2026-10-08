/* eslint-disable react-refresh/only-export-components -- shared hooks/constants live beside their components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export type Business = {
  id: string; name: string; slug: string; industry: string; website: string; description: string;
  services: { name: string; description?: string; price?: string }[];
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  contact: { phone?: string; email?: string; address?: string; whatsapp?: string };
  timezone: string; brand: { primary_color?: string; logo_url?: string }; plan_id: string; status: string;
  onboarding_step: number; onboarding_completed_at: string | null; public_key: string; widget_allowed_origins: string[];
};
export type Me = {
  user: { id: string; email: string; name: string; is_platform_admin: boolean } | null;
  role?: "owner" | "admin" | "agent" | null;
  business?: Business | null;
  businesses?: { id: string; name: string; role: string; onboarded: boolean }[];
};

type Ctx = { me: Me | null; loading: boolean; unavailable: boolean; refresh: () => Promise<Me | null>; setBusiness: (b: Business) => void };
const AuthCtx = createContext<Ctx>({ me: null, loading: true, unavailable: false, refresh: async () => null, setBusiness: () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const m = await api<Me>("auth/me");
      setMe(m);
      setUnavailable(false);
      return m;
    } catch (e: any) {
      if (e?.code === "database_not_configured" || e?.status >= 500) setUnavailable(true);
      setMe({ user: null });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const setBusiness = useCallback((b: Business) => setMe((m) => (m ? { ...m, business: b } : m)), []);
  return <AuthCtx.Provider value={{ me, loading, unavailable, refresh, setBusiness }}>{children}</AuthCtx.Provider>;
}

export const canManage = (me: Me | null) => me?.role === "owner" || me?.role === "admin";
