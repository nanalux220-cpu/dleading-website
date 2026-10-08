// Credential fallbacks: App Secret under WHATSAPP_API_KEY, access token under another variable.
import { createHmac } from "node:crypto";
let fails = 0;
const check = (name, ok, info) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + JSON.stringify(info)}`); if (!ok) fails++; };

delete process.env.KV_REST_API_URL; delete process.env.UPSTASH_REDIS_REST_URL;
process.env.META_APP_ID = "1345357342001483";
process.env.WHATSAPP_ACCESS_TOKEN = "OLD-deleted-app-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
process.env.WHATSAPP_APP_SECRET = "old-secret";
process.env.WHATSAPP_API_KEY = "new-app-secret";
process.env.WHATSAPP_VERIFY_TOKEN = "NEW-valid-token-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy";

const seen = [];
globalThis.fetch = async (url, opts = {}) => {
  const auth = opts.headers?.authorization || "";
  seen.push(String(url));
  if (String(url).includes("/app?") && auth === `Bearer ${process.env.WHATSAPP_VERIFY_TOKEN}`) return new Response(JSON.stringify({ id: "1345357342001483" }), { status: 200 });
  return new Response(JSON.stringify({ error: { code: 190 } }), { status: 400 });
};

const wa = await import("../api/_lib/whatsapp.js");
const { loadActive } = await import("../api/_lib/active.js");

const body = '{"x":1}';
const sig = (s) => "sha256=" + createHmac("sha256", s).update(body).digest("hex");
check("signature with App Secret in WHATSAPP_API_KEY accepted", wa.validSignature(body, sig("new-app-secret")));
check("signature with old WHATSAPP_APP_SECRET still accepted", wa.validSignature(body, sig("old-secret")));
check("signature with unknown secret rejected", !wa.validSignature(body, sig("nope")));
check("missing signature rejected", !wa.validSignature(body, undefined));

await loadActive();
check("valid token picked from another variable", wa.whatsappEnv("WHATSAPP_ACCESS_TOKEN") === process.env.WHATSAPP_VERIFY_TOKEN);
const n = seen.length; await loadActive();
check("token choice is cached (no extra Meta calls)", seen.length === n, { before: n, after: seen.length });

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
