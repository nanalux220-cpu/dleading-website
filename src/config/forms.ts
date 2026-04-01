/**
 * Form POST endpoints. Set the matching `VITE_FORM_*` in `.env` for your backend
 * (e.g. Formspree, Netlify Forms, or a custom API).
 */
const urls = {
  contact: import.meta.env.VITE_FORM_CONTACT_URL,
  leadPopup: import.meta.env.VITE_FORM_LEAD_POPUP_URL,
  websiteAudit: import.meta.env.VITE_FORM_WEBSITE_AUDIT_URL,
  ppcPricing: import.meta.env.VITE_FORM_PPC_PRICING_URL,
} as const;

export type FormKey = keyof typeof urls;

export function getFormActionUrl(key: FormKey): string | null {
  const u = urls[key];
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : null;
}
