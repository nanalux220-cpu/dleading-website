/**
 * Writes plain-HTML copies of the legal pages to public/legal/ so crawlers that
 * don't run JavaScript (e.g. Meta's app review checker) can read them.
 * Same wording as the React pages. Run: npm run legal
 */
import fs from "node:fs";
const src = fs.readFileSync("src/pages/privacy-policy/page.tsx", "utf8");
const updated = src.match(/lastUpdated = "([^"]+)"/)[1];
const block = src.slice(src.indexOf("const sections = ["), src.indexOf("];", src.indexOf("const sections = [")) + 1).replace("const sections = ", "");
const sections = new Function(`return ${block}`)();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const body = sections.map((s) => {
  const paras = s.content.split(/\n\n+/).map((p) => {
    const lines = p.split("\n");
    const items = lines.filter((l) => l.startsWith("• "));
    const head = lines.filter((l) => !l.startsWith("• "));
    return (head.length ? `<p>${esc(head.join(" "))}</p>` : "") + (items.length ? `<ul>${items.map((i) => `<li>${esc(i.slice(2))}</li>`).join("")}</ul>` : "");
  }).join("\n");
  return `<section id="${s.id}"><h2>${esc(s.title)}</h2>\n${paras}</section>`;
}).join("\n");
const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy | Dleading Creative Designs</title>
<meta name="description" content="How Dleading Creative Designs collects, uses and protects your personal data (UK GDPR).">
<link rel="canonical" href="https://www.creativedleading.co.uk/privacy-policy">
<style>
body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;background:#fff}
header{background:#111;color:#fff;padding:40px 16px}
header div,main{max-width:760px;margin:0 auto}
h1{margin:0 0 8px;font-size:30px}
header p{color:#9ca3af;margin:4px 0}
main{padding:24px 16px 48px}
h2{font-size:19px;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:32px}
a{color:#F65901}
</style>
</head>
<body>
<header><div><h1>Privacy Policy</h1><p>Last updated: ${esc(updated)}</p>
<p>This policy explains how Dleading Creative Designs collects, uses, and protects your personal data in accordance with UK GDPR and the Data Protection Act 2018.</p></div></header>
<main>
${body}
<section id="data-deletion"><h2>Data deletion requests</h2>
<p>To ask us to delete your personal data (including messages you sent us on WhatsApp or through our website chat), email <a href="mailto:info@creativedleading.co.uk">info@creativedleading.co.uk</a> or message us on WhatsApp at +44 742 725 9935. We will confirm and complete deletion within 30 days.</p></section>
<p><a href="https://www.creativedleading.co.uk/">Back to creativedleading.co.uk</a> · <a href="https://www.creativedleading.co.uk/cookie-policy">Cookie Policy</a></p>
</main>
</body>
</html>
`;
fs.writeFileSync("public/legal/privacy-policy.html", html);
console.log(`public/legal/privacy-policy.html written (${sections.length} sections)`);
