// LIVE check of the 10 customer scenarios against the REAL AI on the deployed site.
// Uses the public /api/chat endpoint (no API key needed). Costs a few pence of Claude credit.
//   node tests/scenarios.live.mjs                      (production)
//   CHAT_URL=https://<preview>.vercel.app node tests/scenarios.live.mjs
const BASE = (process.env.CHAT_URL || "https://creativedleading.co.uk").replace(/\/$/, "");
let fails = 0;
const ok = (name, cond, reply) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}\n      → ${String(reply).replace(/\n/g, " ").slice(0, 220)}`); if (!cond) fails++; };
const sentences = (t) => (t.match(/[.!?](\s|$)/g) || []).length || 1;
const questions = (t) => (t.match(/\?/g) || []).length;

async function chat(id, history, state) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ conversationId: id, messages: history, state }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}
async function single(text) { return chat(`live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, [{ role: "user", content: text }]); }

let r;
r = await single("What do you do?");
ok("S1 What do you do? → short summary", sentences(r.reply) <= 4 && /web|site/i.test(r.reply) && questions(r.reply) <= 1, r.reply);
r = await single("How much is a website?");
ok("S2 How much is a website? → starting price, no full dump", r.reply.includes("£299") && (r.reply.match(/£/g) || []).length <= 3 && questions(r.reply) <= 1, r.reply);
r = await single("Tell me more about the £299 package.");
ok("S3 £299 package → real details", /3 (custom-designed )?pages/i.test(r.reply) || /7.?10 days/i.test(r.reply), r.reply);
r = await single("Do you do plumbing?");
ok("S4 plumbing → short no", /\bno\b|don't|do not/i.test(r.reply) && sentences(r.reply) <= 3 && !r.reply.includes("£"), r.reply);
r = await single("I need a website for my cleaning company.");
ok("S5 cleaning website → one question (name first)", questions(r.reply) === 1 && /name/i.test(r.reply), r.reply);
r = await single("Can I speak to someone?");
ok("S6 speak to someone → WhatsApp button", r.cta === "whatsapp" && sentences(r.reply) <= 3, r.reply);
r = await single("You are fucking useless.");
ok("S7 abuse → short professional warning", sentences(r.reply) <= 3 && !/fuck|useless/i.test(r.reply) && !r.ended, r.reply);

// S8 + S9: memory across turns
const id = `live_mem_${Date.now()}`;
const h = [{ role: "user", content: "Hi, I'm Priya from Sparkle Cleaning. My email is priya@example.com and I need a new website." }];
r = await chat(id, h); h.push({ role: "assistant", content: r.reply });
h.push({ role: "user", content: "What's the best package for my business?" });
const r2 = await chat(id, h, r.state);
ok("S8 name/contact remembered (not asked again)", !/what('s| is) your (name|email)/i.test(r2.reply), r2.reply);
ok("S9 follow-up uses earlier info (cleaning/website context)", /website|site|package|starter|growth/i.test(r2.reply) && !/what (kind of|type of) business/i.test(r2.reply), r2.reply);

r = await single("Do you offer a 10-year guarantee on your websites?");
ok("S10 unknown → doesn't invent", !/\byes\b.*guarantee|10-year guarantee (is|are) included/i.test(r.reply) && /(don't|do not|not sure|can't|cannot|no )|team/i.test(r.reply), r.reply);

console.log(fails ? `\n${fails} FAILED — paste this output to Claude` : "\nALL LIVE SCENARIOS PASSED");
process.exit(fails ? 1 : 0);
