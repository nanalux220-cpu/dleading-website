import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Target, Flame, Hand } from "lucide-react";
import { api, errorMessage } from "../api";
import { useAuth } from "../auth";
import { Logo, TAGLINE } from "../Brand";
import { Alert, Button, Field, Input } from "../ui";

function Shell({ children }: { children: ReactNode }) {
  const points = [
    { icon: MessageCircle, title: "Every enquiry answered", text: "Website, WhatsApp and social messages answered instantly with your own business information." },
    { icon: Target, title: "Leads qualified for you", text: "The assistant finds out what they need, where, when and their budget." },
    { icon: Flame, title: "Hot leads flagged", text: "Scored Cold, Warm or Hot so your team calls the right people first." },
    { icon: Hand, title: "Take over any time", text: "Jump into any conversation and the AI steps aside until you hand it back." },
  ];
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-white" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <section className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-[#0f0f10] text-white">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#F69D01]/35 to-[#F65901]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-[#F65901]/10 blur-3xl" />
        <div className="relative"><Logo dark /></div>
        <div className="relative max-w-md">
          <h1 className="text-[40px] leading-[1.1] font-bold tracking-tight">{TAGLINE.split("—")[0]}<span className="bg-gradient-to-r from-[#F69D01] to-[#F65901] bg-clip-text text-transparent">— automatically.</span></h1>
          <div className="mt-10 space-y-5">
            {points.map((p) => (
              <div key={p.title} className="flex gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0"><p.icon className="w-[18px] h-[18px] text-orange-400" /></span>
                <div><div className="text-[15px] font-semibold">{p.title}</div><div className="text-sm text-white/55 mt-0.5 leading-relaxed">{p.text}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/35">© {new Date().getFullYear()} Dleading Creative Designs Ltd · Leeds, UK</div>
      </section>
      <section className="flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="lg:hidden mb-10"><Logo /></div>
        <div className="w-full max-w-sm mx-auto">{children}</div>
      </section>
    </div>
  );
}

export function Login() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("auth/login", { method: "POST", body: { email, password } });
      await refresh();
      nav(loc.state?.from || "/app", { replace: true });
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Shell>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back</h2>
      <p className="text-sm text-gray-500 mt-1.5">Sign in to your Growth Engine dashboard.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email"><Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.uk" /></Field>
        <Field label="Password"><Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
      </form>
      <p className="text-sm text-gray-500 mt-6 text-center">New to Growth Engine? <Link to="/app/signup" className="font-semibold text-orange-600 hover:text-orange-700">Create an account</Link></p>
    </Shell>
  );
}

export function Signup() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", business_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("auth/signup", { method: "POST", body: f });
      await refresh();
      nav("/app/onboarding", { replace: true });
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Shell>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create your account</h2>
      <p className="text-sm text-gray-500 mt-1.5">Set up your AI assistant in about 10 minutes.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Your name"><Input autoComplete="name" required value={f.name} onChange={set("name")} placeholder="Jane Smith" /></Field>
        <Field label="Business name"><Input required value={f.business_name} onChange={set("business_name")} placeholder="Smith & Co Plumbing" /></Field>
        <Field label="Work email"><Input type="email" autoComplete="email" required value={f.email} onChange={set("email")} placeholder="jane@smithplumbing.co.uk" /></Field>
        <Field label="Password" hint="At least 10 characters."><Input type="password" autoComplete="new-password" required minLength={10} value={f.password} onChange={set("password")} /></Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>Create account</Button>
        <p className="text-xs text-gray-400 text-center leading-relaxed">By continuing you agree to the <a className="underline hover:text-gray-600" href="/terms" target="_blank" rel="noreferrer">Terms</a> and <a className="underline hover:text-gray-600" href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.</p>
      </form>
      <p className="text-sm text-gray-500 mt-6 text-center">Already have an account? <Link to="/app/login" className="font-semibold text-orange-600 hover:text-orange-700">Sign in</Link></p>
    </Shell>
  );
}
