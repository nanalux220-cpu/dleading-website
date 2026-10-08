// Thin client for /api/app?r=<route>. Cookies carry the session; the server checks Origin on writes.
export class ApiError extends Error {
  status: number;
  code: string;
  detail?: string;
  constructor(status: number, code: string, detail?: string) {
    super(code);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

type Opts = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; params?: Record<string, string | number | undefined | null> };

export async function api<T = any>(route: string, opts: Opts = {}): Promise<T> {
  const qs = new URLSearchParams({ r: route });
  for (const [k, v] of Object.entries(opts.params || {})) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const method = opts.method || "GET";
  const res = await fetch(`/api/app?${qs}`, {
    method,
    credentials: "same-origin",
    headers: method === "GET" ? {} : { "content-type": "application/json" },
    body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(opts.body ?? {}),
  });
  let data: any = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new ApiError(res.status, data.error || `http_${res.status}`, data.detail);
  return data as T;
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match.",
  email_taken: "There's already an account with that email. Try signing in.",
  weak_password: "Use a password of at least 10 characters.",
  invalid_email: "Please enter a valid email address.",
  invalid_phone: "Please enter a valid phone number.",
  invalid_website: "Please enter a valid website address.",
  rate_limited: "Too many attempts. Please wait a minute and try again.",
  database_not_configured: "The Growth Engine database isn't connected yet.",
  forbidden: "You don't have permission to do that.",
  wrong_admin_password: "That admin password isn't right.",
  whatsapp_not_connected: "WhatsApp isn't connected to this business.",
  outside_24h_window: "WhatsApp only allows free-form replies within 24 hours of the customer's last message.",
  ai_not_configured: "The AI isn't configured on the server yet.",
  ai_error: "The AI didn't respond. Please try again.",
  name_phone_or_email_required: "Add at least a name, phone or email.",
  channel_not_supported_yet: "Replying on this channel isn't available yet.",
};
export const errorMessage = (e: unknown) => (e instanceof ApiError ? e.detail || MESSAGES[e.code] || "Something went wrong. Please try again." : "Network problem. Check your connection and try again.");
