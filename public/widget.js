/*!
 * Dleading Growth Engine™ website chat widget.
 * Embed:  <script src="https://www.creativedleading.co.uk/widget.js" data-key="pk_…" async></script>
 * The public key identifies the business; it's safe to publish. All AI and data handling is server-side.
 */
(function () {
  "use strict";
  var script = document.currentScript || (function () { var s = document.querySelectorAll("script[data-key]"); return s[s.length - 1]; })();
  if (!script || window.__dleadingGrowthWidget) return;
  window.__dleadingGrowthWidget = true;
  var KEY = script.getAttribute("data-key") || "";
  if (!/^pk_[a-f0-9]{24}$/.test(KEY)) { console.warn("[Growth Engine] missing or invalid data-key"); return; }
  var BASE = new URL(script.src).origin + "/api/widget";
  var STORE = "ge_widget_" + KEY;

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(STORE + k) || "null"); localStorage.setItem(STORE + k, JSON.stringify(v)); } catch (e) { return null; } }
  function rid() {
    var a = new Uint8Array(18); (window.crypto || window.msCrypto).getRandomValues(a);
    return "v_" + Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  var visitor = store("visitor") || rid(); store("visitor", visitor);

  function req(r, opts) {
    opts = opts || {};
    var url = BASE + "?r=" + r + (opts.query ? "&" + opts.query : "");
    return fetch(url, opts.body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(opts.body) } : {})
      .then(function (res) { return res.json().then(function (d) { if (!res.ok) throw d; return d; }); });
  }

  var cfg = null, open = false, messages = [], handler = "ai", sending = false, poll = null, contactDone = !!store("contact");

  // ---------- DOM (Shadow DOM so the host site's CSS can't break it) ----------
  var host = document.createElement("div");
  host.setAttribute("data-growth-engine", "");
  host.style.cssText = "position:fixed;z-index:2147483000;bottom:20px;right:20px;";
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
  var css = "\n:host{all:initial}*{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    ".btn{width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.2);transition:transform .2s}.btn:hover{transform:scale(1.06)}" +
    ".panel{position:absolute;bottom:76px;right:0;width:370px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 110px);background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(0,0,0,.06)}.panel.open{display:flex}" +
    ".hd{padding:16px 18px;color:#fff;display:flex;align-items:center;gap:12px}.av{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}.ti{font-weight:700;font-size:15px;line-height:1.2}.st{font-size:12px;opacity:.85;margin-top:2px;display:flex;align-items:center;gap:6px}.dot{width:7px;height:7px;border-radius:50%;background:#4ade80}.x{margin-left:auto;background:rgba(255,255,255,.18);border:0;color:#fff;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:18px;line-height:1}" +
    ".bd{flex:1;overflow-y:auto;padding:16px;background:#f7f7f8;display:flex;flex-direction:column;gap:8px}.m{max-width:82%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}.in{align-self:flex-end;color:#fff;border-bottom-right-radius:5px}.out{align-self:flex-start;background:#fff;color:#111;border:1px solid #ececef;border-bottom-left-radius:5px}.who{font-size:11px;color:#8a8a93;margin:6px 4px -4px;align-self:flex-start}" +
    ".note{align-self:center;font-size:12px;color:#6b6b74;background:#fff;border:1px solid #ececef;border-radius:999px;padding:5px 11px}.typing{align-self:flex-start;background:#fff;border:1px solid #ececef;border-radius:16px;padding:12px 14px;display:flex;gap:4px}.typing i{width:6px;height:6px;border-radius:50%;background:#b5b5bd;animation:b 1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}@keyframes b{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}" +
    ".card{align-self:stretch;background:#fff;border:1px solid #ececef;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:7px}.card b{font-size:13px;color:#111}.card input{height:36px;border:1px solid #e3e3e8;border-radius:9px;padding:0 10px;font-size:13px;outline:none}.card input:focus{border-color:#aaa}.card .row{display:flex;gap:6px}.card button{height:36px;border:0;border-radius:9px;color:#fff;font-weight:600;font-size:13px;cursor:pointer}.card .skip{background:none;color:#8a8a93;font-weight:500}.err{color:#c0262d;font-size:12px}" +
    ".ft{border-top:1px solid #ececef;padding:10px;display:flex;gap:8px;background:#fff}.ft textarea{flex:1;resize:none;border:1px solid #e3e3e8;border-radius:12px;padding:10px 12px;font-size:14px;max-height:110px;outline:none;line-height:1.35}.ft textarea:focus{border-color:#bbb}.send{width:42px;border:0;border-radius:12px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}.send:disabled{opacity:.5;cursor:default}" +
    ".pw{text-align:center;font-size:10.5px;color:#a1a1aa;padding:6px 0 8px;background:#fff}.pw a{color:inherit}" +
    "@media (max-width:480px){.panel{position:fixed;inset:0;width:100%;max-width:none;height:100%;max-height:none;border-radius:0;bottom:0;right:0}}";
  root.innerHTML = "<style>" + css + "</style>" +
    '<div class="panel" role="dialog" aria-label="Chat"><div class="hd"><div class="av"></div><div><div class="ti"></div><div class="st"><span class="dot"></span><span class="stt">Typically replies instantly</span></div></div><button class="x" aria-label="Close chat">×</button></div>' +
    '<div class="bd" aria-live="polite"></div><div class="ft"><textarea rows="1" placeholder="Type your message…" aria-label="Message"></textarea><button class="send" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg></button></div>' +
    '<div class="pw">Powered by <a href="https://www.creativedleading.co.uk" target="_blank" rel="noopener">Dleading Growth Engine™</a></div></div>' +
    '<button class="btn" aria-label="Open chat"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>';

  var $ = function (s) { return root.querySelector(s); };
  var panel = $(".panel"), body = $(".bd"), input = $("textarea"), sendBtn = $(".send"), launch = $(".btn");

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function render(typing) {
    body.innerHTML = "";
    var color = (cfg && cfg.color) || "#F65901";
    if (cfg && cfg.greeting) body.appendChild(el("div", "m out", cfg.greeting));
    var lastSender = null;
    messages.forEach(function (m) {
      if (m.direction === "out" && m.sender !== lastSender && (m.sender === "human")) body.appendChild(el("div", "who", "Team member"));
      var b = el("div", "m " + (m.direction === "in" ? "in" : "out"), m.body);
      if (m.direction === "in") b.style.background = color;
      body.appendChild(b);
      lastSender = m.direction === "out" ? m.sender : null;
    });
    if (handler === "human" && messages.length) body.appendChild(el("div", "note", "You're chatting with the team"));
    if (!contactDone && messages.some(function (m) { return m.direction === "out"; })) body.appendChild(contactCard(color));
    if (typing) { var t = el("div", "typing"); t.innerHTML = "<i></i><i></i><i></i>"; body.appendChild(t); }
    body.scrollTop = body.scrollHeight;
  }

  function contactCard(color) {
    var c = el("div", "card");
    c.appendChild(el("b", null, "Leave your details so we can get back to you"));
    var name = el("input"); name.placeholder = "Your name"; name.autocomplete = "name";
    var phone = el("input"); phone.placeholder = "Phone"; phone.type = "tel"; phone.autocomplete = "tel";
    var email = el("input"); email.placeholder = "Email"; email.type = "email"; email.autocomplete = "email";
    var err = el("div", "err");
    var row = el("div", "row");
    var go = el("button", null, "Send details"); go.style.background = color; go.style.flex = "1";
    var skip = el("button", "skip", "Not now");
    skip.onclick = function () { contactDone = true; store("contact", "skipped"); render(); };
    go.onclick = function () {
      if (!name.value.trim() && !phone.value.trim() && !email.value.trim()) { err.textContent = "Please add a phone number or email."; return; }
      go.disabled = true;
      req("contact", { body: { key: KEY, visitor_id: visitor, name: name.value, phone: phone.value, email: email.value } })
        .then(function () { contactDone = true; store("contact", true); messages.push({ direction: "out", sender: "system", body: "Thanks" + (name.value.trim() ? ", " + name.value.trim().split(" ")[0] : "") + "! We've got your details." }); render(); })
        .catch(function (e) { go.disabled = false; err.textContent = e && e.error === "invalid_email" ? "Please check your email address." : e && e.error === "invalid_phone" ? "Please check your phone number." : "Couldn't save that, please try again."; });
    };
    row.appendChild(go); row.appendChild(skip);
    [name, phone, email, err, row].forEach(function (x) { c.appendChild(x); });
    return c;
  }

  function loadHistory() {
    return req("history", { query: "key=" + KEY + "&visitor_id=" + visitor }).then(function (d) {
      var changed = d.messages.length !== messages.length || d.handler !== handler;
      messages = d.messages; handler = d.handler;
      if (changed && !sending) render();
    }).catch(function () {});
  }

  function send() {
    var text = input.value.trim();
    if (!text || sending) return;
    sending = true; sendBtn.disabled = true; input.value = ""; input.style.height = "";
    messages.push({ direction: "in", sender: "customer", body: text });
    render(handler === "ai");
    req("message", { body: { key: KEY, visitor_id: visitor, text: text } }).then(function (d) {
      handler = d.handler || handler;
      if (d.reply) messages.push(d.reply);
      return loadHistory();
    }).catch(function (e) {
      messages.push({ direction: "out", sender: "system", body: e && e.error === "rate_limited" ? "You're sending messages quickly. Please wait a moment." : "Sorry, something went wrong. Please try again." });
    }).then(function () { sending = false; sendBtn.disabled = false; render(); input.focus(); });
  }

  function toggle(v) {
    open = v === undefined ? !open : v;
    panel.classList.toggle("open", open);
    launch.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    clearInterval(poll);
    if (open) {
      loadHistory().then(function () { render(); });
      poll = setInterval(function () { if (!document.hidden) loadHistory(); }, 5000);
      setTimeout(function () { input.focus(); }, 50);
    }
  }

  launch.onclick = function () { toggle(); };
  $(".x").onclick = function () { toggle(false); };
  sendBtn.onclick = send;
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 110) + "px"; });

  req("config", { query: "key=" + KEY }).then(function (c) {
    cfg = c;
    var color = /^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color : "#F65901";
    $(".hd").style.background = "linear-gradient(135deg," + color + "," + color + "dd)";
    launch.style.background = color; sendBtn.style.background = color;
    $(".ti").textContent = c.name;
    $(".av").textContent = (c.assistant_name || c.name || "?").charAt(0).toUpperCase();
    $(".stt").textContent = c.ai_enabled ? (c.assistant_name || "Assistant") + " · replies instantly" : "We'll reply as soon as we can";
    (document.body || document.documentElement).appendChild(host);
  }).catch(function (e) { console.warn("[Growth Engine] widget disabled:", (e && e.error) || "unavailable"); });
})();
