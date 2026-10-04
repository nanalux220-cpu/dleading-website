import { useEffect, useRef, useState, Fragment, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * Dleading AI assistant chat widget.
 * Talks only to /api/chat on this site — no keys or secrets in the browser.
 */

type Role = "user" | "assistant";
interface Msg { role: Role; content: string }
/** Completed actions (lead sent, handoffs) — owned by the server, stored here, sent back each request. */
type ActionState = Record<string, unknown> | null;
interface ChatState {
  id: string;
  messages: Msg[];
  actions: ActionState;
  ended: boolean;
  updatedAt: number;
}

const STORAGE_KEY = "dleading_ai_chat_v1";
const EXPIRY_MS = 24 * 60 * 60 * 1000;
const MAX_INPUT = 2000;
const MAX_SENT = 30; // messages sent to the server per request
const WELCOME = "Hi 👋 I'm Dleading's AI assistant. How can I help you today?";
const WHATSAPP = "https://wa.link/9m4r50";
const SUGGESTIONS = ["What services do you offer?", "How much is a website?", "I'd like a quote", "Talk to a person"];

const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`).replace(/[^A-Za-z0-9_-]/g, "");

const fresh = (): ChatState => ({ id: newId(), messages: [], actions: null, ended: false, updatedAt: Date.now() });

function load(): ChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw) as ChatState;
    if (!s?.id || !Array.isArray(s.messages) || Date.now() - s.updatedAt > EXPIRY_MS) return fresh();
    // Drop a dangling unanswered user message (e.g. page refreshed mid-request) so history stays valid.
    const msgs = s.messages.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
    if (msgs.length && msgs[msgs.length - 1].role === "user") msgs.pop();
    return { ...s, messages: msgs, actions: s.actions && typeof s.actions === "object" ? s.actions : null };
  } catch {
    return fresh();
  }
}

function save(s: ChatState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* private mode etc. */ }
}

/** Turn URLs, emails and the phone number into links — no innerHTML. */
const LINK_RE = /(https?:\/\/[^\s)]+|(?:www\.)?creativedleading\.co\.uk(?:\/[^\s),.]*)?|[\w.+-]+@[\w-]+\.[\w.]+|\+44 ?7\d{2} ?\d{3} ?\d{4})/g;
function linkify(text: string): ReactNode[] {
  return text.split(LINK_RE).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    let href = part;
    if (part.includes("@") && !part.startsWith("http")) href = `mailto:${part}`;
    else if (part.startsWith("+")) href = `tel:${part.replace(/\s/g, "")}`;
    else if (!part.startsWith("http")) href = `https://${part}`;
    const external = href.startsWith("http") && !href.includes("creativedleading.co.uk");
    return (
      <a key={i} href={href} className="underline underline-offset-2 font-medium break-words"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {part}
      </a>
    );
  });
}

function Bubble({ msg }: { msg: Msg }) {
  const mine = msg.role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
          mine
            ? "bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white rounded-2xl rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md"
        }`}
      >
        {mine ? msg.content : linkify(msg.content)}
      </div>
    </div>
  );
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<ChatState>(() => (typeof window === "undefined" ? fresh() : load()));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedText, setFailedText] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const location = useLocation();

  useEffect(() => { save(chat); }, [chat]);

  // Scroll to newest message
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages, loading, error, open]);

  // Open: focus input, tell other popups to stay out of the way, lock page scroll on mobile
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new Event("dleading-chat-open"));
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const prev = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";
    if (!isMobile) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_INPUT);
    if (!content || loading || chat.ended) return;
    setError(null);
    setFailedText(null);
    setInput("");

    const id = chat.id;
    const history: Msg[] = [...chat.messages, { role: "user", content }];
    setChat((c) => ({ ...c, messages: history, updatedAt: Date.now() }));
    setLoading(true);

    // Keep the request small: last MAX_SENT messages, always starting with a user message.
    let start = Math.max(0, history.length - MAX_SENT);
    if (history[start]?.role !== "user") start += 1;

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: chat.id,
          messages: history.slice(start),
          page: location.pathname,
          state: chat.actions ?? undefined,
        }),
        signal: controller.signal,
      });
      let data: { reply?: string; ended?: boolean; state?: ActionState } = {};
      try { data = await res.json(); } catch { /* non-JSON error page */ }
      // Record completed actions even if the reply itself failed (e.g. lead sent, then AI error).
      if (data.state && typeof data.state === "object") {
        const st = data.state;
        setChat((c) => (c.id !== id ? c : { ...c, actions: st }));
      }

      if (!res.ok && !data.reply) throw new Error(`HTTP ${res.status}`);
      if (!res.ok && data.reply) {
        // Server gave a friendly message (rate limit / AI down). Show it as an error, allow retry.
        throw Object.assign(new Error("server"), { friendly: data.reply });
      }

      setChat((c) => c.id !== id ? c : ({
        ...c,
        messages: [...history, { role: "assistant", content: data.reply || "" }],
        ended: c.ended || !!data.ended,
        updatedAt: Date.now(),
      }));
    } catch (e) {
      // Conversation was reset while waiting: ignore silently.
      if (abortRef.current !== controller) return;
      // Remove the unanswered message from history and offer a retry.
      setChat((c) => c.id !== id ? c : ({ ...c, messages: history.slice(0, -1) }));
      setFailedText(content);
      const friendly = (e as { friendly?: string })?.friendly;
      setError(
        friendly ||
          ((e as Error)?.name === "AbortError"
            ? "That took too long to answer."
            : navigator.onLine === false
              ? "You seem to be offline."
              : "Sorry, something went wrong.")
      );
    } finally {
      clearTimeout(timeout);
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  function newConversation() {
    const pending = abortRef.current;
    abortRef.current = null;
    pending?.abort();
    setChat(fresh());
    setError(null);
    setFailedText(null);
    setInput("");
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const showSuggestions = chat.messages.length === 0 && !loading;

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with Dleading's AI assistant"}
        aria-expanded={open}
        className={`fixed bottom-[144px] md:bottom-[92px] right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
          open ? "hidden" : ""
        }`}
        style={{ background: "linear-gradient(135deg, #F69D01 0%, #F65901 100%)", boxShadow: "0 6px 28px rgba(246,89,1,0.45)" }}
      >
        <i className={`${open ? "ri-close-line" : "ri-chat-smile-3-line"} text-[26px]`} />
        {!open && chat.messages.length === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Dleading AI assistant"
          className="fixed z-[10000] bg-white flex flex-col overflow-hidden
            inset-0 h-[100dvh]
            md:inset-auto md:bottom-[92px] md:right-6 md:w-[380px] md:h-[min(620px,calc(100vh-130px))] md:rounded-2xl"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #F69D01 0%, #F65901 100%)" }}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/assets/logo.png" alt="" className="w-8 h-8 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[15px] leading-tight truncate">Dleading Assistant</div>
              <div className="text-[11px] opacity-90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" /> AI · Dleading Creative Designs
              </div>
            </div>
            <button type="button" onClick={newConversation} title="Start a new conversation" aria-label="Start a new conversation"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer">
              <i className="ri-refresh-line text-lg" />
            </button>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp instead" aria-label="Chat on WhatsApp instead"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20">
              <i className="ri-whatsapp-line text-lg" />
            </a>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer">
              <i className="ri-close-line text-xl" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 bg-white" aria-live="polite">
            <Bubble msg={{ role: "assistant", content: WELCOME }} />
            {chat.messages.map((m, i) => <Bubble key={i} msg={m} />)}

            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}
                    className="text-[13px] px-3 py-1.5 rounded-full border border-[#F65901]/40 text-[#F65901] hover:bg-[#F65901]/5 cursor-pointer">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start" aria-label="Assistant is typing">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                <p>{linkify(error)}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {failedText && (
                    <button type="button" onClick={() => send(failedText)} className="font-semibold underline cursor-pointer">Try again</button>
                  )}
                  <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold underline">WhatsApp us</a>
                  <a href="mailto:info@creativedleading.co.uk" className="font-semibold underline">Email us</a>
                </div>
              </div>
            )}

            {!chat.ended && (chat.actions as { mode?: string } | null)?.mode === "handoff" && (
              <div className="text-center text-[12px] text-gray-500 py-2">
                Passed to the Dleading team. They'll contact you directly; anything you add here goes to them.{" "}
                <button type="button" onClick={newConversation} className="underline cursor-pointer">Start a new conversation</button>
              </div>
            )}

            {chat.ended && (
              <div className="text-center text-[12px] text-gray-500 py-2">
                This conversation has ended.{" "}
                <button type="button" onClick={newConversation} className="underline cursor-pointer">Start a new one</button>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="shrink-0 border-t border-gray-100 px-3 pt-2.5 bg-white"
            style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); }
                }}
                rows={1}
                disabled={chat.ended}
                placeholder={chat.ended ? "Conversation ended" : "Type your message…"}
                aria-label="Your message"
                className="flex-1 resize-none max-h-28 rounded-xl border border-gray-200 px-3 py-2.5 text-[16px] md:text-[14px] leading-snug focus:outline-none focus:border-[#F65901] focus:ring-2 focus:ring-[#F65901]/15 disabled:bg-gray-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || chat.ended}
                aria-label="Send message"
                className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #F69D01 0%, #F65901 100%)" }}
              >
                <i className="ri-send-plane-2-fill text-lg" />
              </button>
            </div>
            <p className="text-[10.5px] text-gray-400 text-center mt-1.5">
              AI assistant · can make mistakes · please don't share sensitive information
            </p>
          </form>
        </div>
      )}
    </>
  );
}
