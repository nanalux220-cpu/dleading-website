/**
 * Builds the AI assistant's knowledge base from the website's own source files,
 * so the assistant always quotes what the site actually says.
 *
 *   npm run kb
 *
 * Sources:
 *   1. Data arrays in the site's pages/mocks (services, pricing, FAQs, process...)
 *   2. Every .md file in /knowledge (hand-written docs: company info, policies,
 *      future FAQs / service docs / pricing docs). Add a file there, re-run, commit.
 *
 * Output: api/_lib/knowledge-data.js  (committed; read by /api/chat)
 *
 * Run this again whenever prices, services or FAQs change on the site.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// Files whose top-level data arrays are customer-facing facts.
// (Blog posts are excluded on purpose: they are general advice, not company facts.)
const SOURCES = [
  { file: "src/mocks/servicesData.ts", category: "services", url: "/services" },
  { file: "src/mocks/servicesPricing.ts", category: "pricing", url: "/pricing" },
  { file: "src/mocks/portfolioItems.ts", category: "portfolio", url: "/portfolio" },
  { file: "src/pages/faq/page.tsx", category: "faq", url: "/faq" },
  { file: "src/pages/pricing/page.tsx", category: "pricing", url: "/pricing" },
  { file: "src/pages/logo-pricing/page.tsx", category: "pricing", url: "/logo-pricing" },
  { file: "src/pages/smm-pricing/page.tsx", category: "pricing", url: "/smm-pricing" },
  { file: "src/pages/ppc-pricing/page.tsx", category: "pricing", url: "/ppc-pricing" },
  { file: "src/pages/services/page.tsx", category: "services", url: "/services" },
  { file: "src/pages/about/page.tsx", category: "company", url: "/about" },
  { file: "src/pages/home/components/HowWeWorkSection.tsx", category: "process", url: "/" },
  { file: "src/pages/home/components/ServicesSection.tsx", category: "services", url: "/" },
];

// Keys that carry no customer-facing meaning.
const SKIP_KEYS = new Set(["icon", "image", "img", "images", "color", "bg", "gradient", "avatar", "photo", "logo", "id", "highlight", "featured", "rating", "className", "style", "accent"]);
const TITLE_KEYS = ["title", "name", "q", "question", "label", "heading"];

// Proxy stub so expressions like stockImages.foo evaluate harmlessly.
const stub = new Proxy({}, { get: () => "" });

function extractBlocks(src) {
  const lines = src.split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(?:export\s+)?const\s+(\w+)\s*(?::[^=]+)?=\s*([[{])\s*$/);
    if (!m) continue;
    const close = m[2] === "[" ? /^\](?:\s*as\s+const)?;?\s*$/ : /^\}(?:\s*as\s+const)?;?\s*$/;
    const body = [m[2]];
    let j = i + 1;
    for (; j < lines.length && !close.test(lines[j]); j++) body.push(lines[j]);
    if (j >= lines.length) continue;
    body.push(m[2] === "[" ? "]" : "}");
    blocks.push({ name: m[1], code: body.join("\n") });
    i = j;
  }
  return blocks;
}

function evaluate(code) {
  const cleaned = code
    .replace(/\bas\s+const\b/g, "")
    .replace(/\s+as\s+[A-Z]\w*(\[\])?/g, "");
  // eslint-disable-next-line no-new-func
  return new Function("stockImages", "t", `return (${cleaned});`)(stub, (s) => s);
}

function toText(value, depth = 0) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map((v) => toText(v, depth + 1)).filter(Boolean)
      .map((t) => (t.includes("\n") ? t : `- ${t}`)).join("\n");
  }
  if (typeof value === "object") {
    // {text, included:false} style feature rows
    if ("text" in value && "included" in value) {
      return `${value.text}${value.included === false ? " (NOT included)" : ""}`;
    }
    const parts = [];
    for (const [k, v] of Object.entries(value)) {
      if (SKIP_KEYS.has(k) || typeof v === "function") continue;
      if (typeof v === "string" && /^(https?:)?\/\/|\.(png|jpe?g|webp|svg)$|^ri-|^#[0-9a-f]{3,8}$|^(bg|text|from|to)-/i.test(v)) continue;
      const t = toText(v, depth + 1);
      if (t) parts.push(`${k}: ${t.includes("\n") ? "\n" + t : t}`);
    }
    return parts.join("\n");
  }
  return "";
}

function titleOf(item, fallback) {
  if (item && typeof item === "object") {
    for (const k of TITLE_KEYS) if (typeof item[k] === "string") return item[k];
  }
  return fallback;
}

const chunks = [];
const seen = new Set();
function addChunk(c) {
  const key = c.text.slice(0, 400);
  if (!c.text || c.text.length < 25 || seen.has(key)) return;
  seen.add(key);
  chunks.push({ id: `kb-${chunks.length + 1}`, ...c });
}

for (const s of SOURCES) {
  const full = path.join(root, s.file);
  if (!fs.existsSync(full)) { console.warn(`skip (missing): ${s.file}`); continue; }
  const src = fs.readFileSync(full, "utf8");
  for (const b of extractBlocks(src)) {
    let value;
    try { value = evaluate(b.code); } catch (e) { console.warn(`skip ${s.file}:${b.name} (${e.message})`); continue; }
    const label = `${path.basename(path.dirname(s.file))}/${b.name}`;
    if (Array.isArray(value)) {
      value.forEach((item, idx) => addChunk({
        source: label, category: s.category, url: s.url,
        title: titleOf(item, `${b.name} #${idx + 1}`),
        text: toText(item),
      }));
    } else if (value && typeof value === "object") {
      // e.g. servicesPricing: { "web-design": [plans] }
      for (const [k, v] of Object.entries(value)) {
        if (Array.isArray(v)) {
          v.forEach((item) => addChunk({
            source: label, category: s.category, url: s.url,
            title: `${k} — ${titleOf(item, "")}`.replace(/ — $/, ""),
            text: `service: ${k}\n${toText(item)}`,
          }));
        } else {
          addChunk({ source: label, category: s.category, url: s.url, title: k, text: toText(v) });
        }
      }
    }
  }
}

// Hand-written markdown docs: split on "## " headings.
const kbDir = path.join(root, "knowledge");
for (const f of fs.existsSync(kbDir) ? fs.readdirSync(kbDir).filter((x) => x.endsWith(".md")).sort() : []) {
  const md = fs.readFileSync(path.join(kbDir, f), "utf8");
  const category = f.replace(/\.md$/, "");
  for (const section of md.split(/^## /m).slice(1)) {
    const [title, ...rest] = section.split("\n");
    addChunk({ source: `knowledge/${f}`, category, url: null, title: title.trim(), text: rest.join("\n").trim() });
  }
}

const out = `// AUTO-GENERATED by scripts/build-knowledge.mjs — do not edit by hand. Run: npm run kb\n` +
  `export const KNOWLEDGE = ${JSON.stringify(chunks, null, 1)};\n`;
fs.writeFileSync(path.join(root, "api/_lib/knowledge-data.js"), out);
const chars = chunks.reduce((n, c) => n + c.text.length, 0);
console.log(`knowledge: ${chunks.length} chunks, ~${Math.round(chars / 4)} tokens`);
const byCat = {};
chunks.forEach((c) => { byCat[c.category] = (byCat[c.category] || 0) + 1; });
console.log(byCat);
