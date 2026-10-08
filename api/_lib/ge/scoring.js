/**
 * Lead qualification + scoring, configurable per business (ai_settings.qualification / .scoring).
 * The AI extracts details (save_lead_details tool); the score itself is computed here in code,
 * so it is consistent, explainable and can't be talked up by a customer.
 */

export const QUALIFICATION_FIELDS = [
  { key: "service", label: "What they want", question: "What can we help you with?" },
  { key: "location", label: "Location", question: "Where are you based?" },
  { key: "budget", label: "Budget", question: "Do you have a rough budget in mind?" },
  { key: "preferred_date", label: "Preferred date", question: "When would you like this done?" },
  { key: "urgency", label: "Urgency", question: "How soon do you need this?" },
  { key: "contact", label: "Contact details", question: "What's the best number or email to reach you?" },
];

export const DEFAULT_QUALIFICATION = {
  fields: Object.fromEntries(QUALIFICATION_FIELDS.map((f) => [f.key, { enabled: true, question: f.question }])),
};

export const DEFAULT_SCORING = {
  weights: { contact: 15, service: 15, location: 10, budget: 15, preferred_date: 10, urgency_high: 20, urgency_medium: 10, ready_to_book: 25 },
  thresholds: { warm: 35, hot: 70 },
};

export const DEFAULT_HANDOFF = { on_request: true, on_complaint: true, on_unknown: true };

const clampInt = (v, min, max, d) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : d; };

export function normaliseScoring(raw) {
  const w = { ...DEFAULT_SCORING.weights };
  for (const k of Object.keys(w)) if (raw?.weights && k in raw.weights) w[k] = clampInt(raw.weights[k], 0, 100, w[k]);
  const warm = clampInt(raw?.thresholds?.warm, 1, 99, DEFAULT_SCORING.thresholds.warm);
  const hot = clampInt(raw?.thresholds?.hot, warm + 1, 100, Math.max(DEFAULT_SCORING.thresholds.hot, warm + 1));
  return { weights: w, thresholds: { warm, hot } };
}

export function normaliseQualification(raw) {
  const fields = {};
  for (const f of QUALIFICATION_FIELDS) {
    const r = raw?.fields?.[f.key];
    fields[f.key] = {
      enabled: r && typeof r.enabled === "boolean" ? r.enabled : true,
      question: typeof r?.question === "string" && r.question.trim() ? r.question.trim().slice(0, 200) : f.question,
    };
  }
  return { fields };
}

/** Returns { score 0-100, label cold|warm|hot, reasons[] } for a lead row. */
export function scoreLead(lead, scoringRaw) {
  const { weights: w, thresholds } = normaliseScoring(scoringRaw);
  let score = 0;
  const reasons = [];
  const add = (pts, why) => { if (pts > 0) { score += pts; reasons.push(why); } };
  if (lead.phone || lead.email) add(w.contact, "contact details");
  if (lead.service_interest) add(w.service, "knows what they want");
  if (lead.location) add(w.location, "location given");
  if (lead.budget) add(w.budget, "budget given");
  if (lead.preferred_date) add(w.preferred_date, "has a date in mind");
  if (lead.urgency === "high") add(w.urgency_high, "urgent");
  else if (lead.urgency === "medium") add(w.urgency_medium, "fairly soon");
  if (lead.ready_to_book) add(w.ready_to_book, "ready to buy/book");
  score = Math.min(100, score);
  const label = score >= thresholds.hot ? "hot" : score >= thresholds.warm ? "warm" : "cold";
  return { score, label, reasons };
}
