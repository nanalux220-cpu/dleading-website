/**
 * Local API server for development: serves api/*.js handlers (same Request/Response signature as
 * Vercel) on http://localhost:3001. `npm run dev` proxies /api to it.
 *   DATABASE_URL=postgres://… ANTHROPIC_API_KEY=… npm run dev:api
 */
import http from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "api");
const port = Number(process.env.API_PORT || 3001);

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const name = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
    const file = join(root, `${name}.js`);
    if (!/^[a-z0-9/_-]+$/i.test(name) || name.includes("_lib") || !existsSync(file)) { res.writeHead(404); return res.end("not found"); }
    const mod = await import(file);
    const handler = mod[req.method];
    if (!handler) { res.writeHead(405); return res.end(); }
    let body = "";
    for await (const c of req) body += c;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    // fetch's Request drops "host"; Vercel passes it as x-forwarded-host, so mirror that locally.
    if (!headers.has("x-forwarded-host") && req.headers.host) headers.set("x-forwarded-host", req.headers.host);
    const out = await handler(new Request(url, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body }));
    const h = {};
    out.headers.forEach((v, k) => { h[k] = v; });
    res.writeHead(out.status, h);
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500); res.end("error");
  }
}).listen(port, () => console.log(`[dev-api] http://localhost:${port}`));
