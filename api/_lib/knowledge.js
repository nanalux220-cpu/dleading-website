import { KNOWLEDGE } from "./knowledge-data.js";

/**
 * While the knowledge base is small, the whole thing goes into the system prompt
 * (most accurate, and cheap thanks to prompt caching). If it grows past this
 * size (e.g. after adding PDFs), only the core company docs go in the prompt and
 * the AI must use the search_dleading_knowledge tool for everything else.
 */
const INLINE_LIMIT_CHARS = 160_000; // ~40k tokens

const totalChars = KNOWLEDGE.reduce((n, c) => n + c.text.length + c.title.length, 0);
export const KNOWLEDGE_INLINE = totalChars <= INLINE_LIMIT_CHARS;

function format(c) {
  const where = c.url ? ` (page: creativedleading.co.uk${c.url})` : "";
  return `### [${c.category}] ${c.title}${where}\n${c.text}`;
}

export function knowledgeForPrompt() {
  const chunks = KNOWLEDGE_INLINE ? KNOWLEDGE : KNOWLEDGE.filter((c) => c.category === "company");
  return chunks.map(format).join("\n\n");
}

const STOP = new Set("a an the and or of to for in on at is are do does you your we our i my me it with how what can much".split(" "));
const tokenize = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9£ ]+/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

/** Simple keyword search. Good enough for a small business KB; swap for embeddings later if needed. */
export function searchKnowledge(query, limit = 6) {
  const q = tokenize(String(query || "")).slice(0, 20);
  if (!q.length) return [];
  return KNOWLEDGE.map((c) => {
    const title = tokenize(c.title);
    const body = tokenize(c.text);
    let score = 0;
    for (const w of q) {
      if (title.includes(w)) score += 3;
      score += Math.min(body.filter((b) => b === w || b.startsWith(w)).length, 3);
    }
    return { c, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => format(r.c));
}
