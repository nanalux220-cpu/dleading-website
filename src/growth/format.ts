export const LEAD_STATUSES = ["new", "contacted", "qualified", "appointment", "won", "lost"] as const;
export const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", appointment: "Appointment", won: "Won", lost: "Lost" };
export const SOURCE_LABEL: Record<string, string> = { whatsapp: "WhatsApp", website: "Website", facebook: "Facebook", instagram: "Instagram", voice: "Phone", email: "Email", sms: "SMS", manual: "Added manually", import: "Import", other: "Other" };
export const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", website: "Website chat", facebook: "Facebook", instagram: "Instagram", voice: "Phone", email: "Email", sms: "SMS" };

export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
export const fmtTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");
export const initials = (name?: string) => (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
/** <input type="datetime-local"> value ↔ ISO */
export const toLocalInput = (iso?: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const EVENT_TEXT: Record<string, (e: any) => string> = {
  "lead.created": (e) => `New lead${e.data?.source ? ` from ${SOURCE_LABEL[e.data.source] || e.data.source}` : ""}`,
  "lead.hot": () => "Lead became Hot",
  "lead.scored": (e) => `Lead scored ${e.data?.to ? e.data.to[0].toUpperCase() + e.data.to.slice(1) : ""}`,
  "lead.status_changed": (e) => `Moved to ${STATUS_LABEL[e.data?.to] || e.data?.to}`,
  "lead.won": () => "Lead marked as Won",
  "lead.lost": () => "Lead marked as Lost",
  "lead.contact_captured": () => "Shared contact details",
  "conversation.started": (e) => `New ${CHANNEL_LABEL[e.data?.channel || e.channel] || ""} conversation`,
  "conversation.handoff": (e) => `Handed to a human${e.data?.reason ? `: ${e.data.reason}` : ""}`,
  "conversation.takeover": () => "Team member took over",
  "conversation.ai_resumed": () => "AI re-enabled",
  "message.received": (e) => `Message on ${CHANNEL_LABEL[e.channel || e.data?.channel] || "chat"}`,
  "appointment.created": () => "Appointment booked",
  "integration.connected": (e) => `${CHANNEL_LABEL[e.data?.provider] || e.data?.provider} connected`,
  "integration.requested": (e) => `${CHANNEL_LABEL[e.data?.provider] || e.data?.provider} connection requested`,
  "business.created": () => "Workspace created",
  "business.onboarded": () => "Setup completed",
};
export const eventText = (e: any) => (EVENT_TEXT[e.type] ? EVENT_TEXT[e.type](e) : e.type);
