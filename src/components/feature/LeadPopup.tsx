import { useState, useEffect, useRef } from "react";
import { getFormActionUrl } from "@/config/forms";
import { stockImages } from "@/config/media";

const STORAGE_KEY = "dleading_lead_captured_v2";

type ChatPhase = "hidden" | "typing1" | "msg1" | "typing2" | "msg2" | "form" | "success" | "minimised";

export default function LeadPopup() {
  const agentAvatarUrl = stockImages.leadAvatar;
  const [phase, setPhase] = useState<ChatPhase>("hidden");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timerRefs.current.push(id);
  };

  const startChatSequence = () => {
    setPhase("typing1");
    schedule(() => setPhase("msg1"), 1400);
    schedule(() => setPhase("typing2"), 2600);
    schedule(() => setPhase("msg2"), 4100);
    schedule(() => setPhase("form"), 5300);
  };

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    let triggered = false;

    // Desktop: exit intent — mouse leaves top of viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (triggered) return;
      if (e.clientY <= 8) {
        triggered = true;
        startChatSequence();
      }
    };

    // Mobile / fallback: trigger after 45 seconds of inactivity
    const fallbackId = setTimeout(() => {
      if (!triggered) {
        triggered = true;
        startChatSequence();
      }
    }, 45000);
    timerRefs.current.push(fallbackId);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearAllTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    clearAllTimers();
    localStorage.setItem(STORAGE_KEY, "true");
    setPhase("hidden");
  };

  const minimise = () => {
    clearAllTimers();
    setPhase("minimised");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    try {
      const url = getFormActionUrl("leadPopup");
      if (!url) {
        setError("Form not configured. Email info@creativedleading.co.uk or use WhatsApp.");
        setLoading(false);
        return;
      }
      const body = new URLSearchParams({ name: name.trim(), email: email.trim() });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (res.ok) {
        setPhase("success");
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (phase === "hidden") return null;

  const isOpen = phase !== "minimised";

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-4px); opacity: 1; }
        }
        .dot1 { animation: typingDot 1.2s infinite 0s; }
        .dot2 { animation: typingDot 1.2s infinite 0.2s; }
        .dot3 { animation: typingDot 1.2s infinite 0.4s; }
        .chat-bubble-in { animation: bubbleIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        .chat-slide-up  { animation: chatSlideUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; }
      `}</style>

      <div className="fixed bottom-24 right-5 z-[9997] flex flex-col items-end gap-0 pointer-events-none"
           style={{ maxWidth: "340px", width: "calc(100vw - 24px)" }}>

        {/* ── Chat window ── */}
        {isOpen && (
          <div
            className="w-full rounded-2xl overflow-hidden chat-slide-up pointer-events-auto"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.22)", background: "#fff" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#F69D01] to-[#F65901] px-4 py-3 flex items-center gap-3">
              {/* Agent avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40">
                  <img
                    src={agentAvatarUrl}
                    alt="Elvis"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Online dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Elvis — Dleading Creative</p>
                <p className="text-white/75 text-xs">Online · Typically replies in minutes</p>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={minimise}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer text-white"
                  aria-label="Minimise"
                >
                  <i className="ri-subtract-line text-sm"></i>
                </button>
                <button
                  onClick={dismiss}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer text-white"
                  aria-label="Close"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
            </div>

            {/* Chat body */}
            <div className="bg-[#f5f5f5] px-4 py-4 space-y-3 min-h-[100px]">

              {/* Message 1 */}
              {(phase === "msg1" || phase === "typing2" || phase === "msg2" || phase === "form" || phase === "success") && (
                <div className="flex items-end gap-2 chat-bubble-in">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <img
                      src={agentAvatarUrl}
                      alt="Elvis"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[82%]" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    <p className="text-gray-800 text-sm leading-relaxed">Hey there! 👋 Thinking of leaving already?</p>
                  </div>
                </div>
              )}

              {/* Typing indicator 1 */}
              {phase === "typing1" && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <img
                      src={agentAvatarUrl}
                      alt="Elvis"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 dot1 inline-block"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 dot2 inline-block"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 dot3 inline-block"></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message 2 */}
              {(phase === "msg2" || phase === "form" || phase === "success") && (
                <div className="flex items-end gap-2 chat-bubble-in">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <img
                      src={agentAvatarUrl}
                      alt="Elvis"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[82%]" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      Before you go — drop your email and I&apos;ll send you a <strong className="text-[#F65901]">free website audit</strong> + <strong className="text-[#F65901]">10% off</strong> your first project. Takes 5 seconds! 🚀
                    </p>
                  </div>
                </div>
              )}

              {/* Typing indicator 2 */}
              {phase === "typing2" && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <img
                      src={agentAvatarUrl}
                      alt="Elvis"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 dot1 inline-block"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 dot2 inline-block"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 dot3 inline-block"></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form bubble */}
              {phase === "form" && (
                <div className="chat-bubble-in">
                  {/* User reply placeholder */}
                  <form
                    onSubmit={handleSubmit}
                    id="lead-popup-form"
                    className="bg-white rounded-2xl px-4 py-4 space-y-3"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-gray-400 pointer-events-none">
                        <i className="ri-user-line text-sm"></i>
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your first name"
                        required
                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all bg-gray-50"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-gray-400 pointer-events-none">
                        <i className="ri-mail-line text-sm"></i>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all bg-gray-50"
                      />
                    </div>

                    {error && (
                      <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                        <i className="ri-error-warning-line"></i>{error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-loader-4-line animate-spin text-sm"></i>
                          </div>
                          Claiming...
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-send-plane-fill text-sm"></i>
                          </div>
                          Claim Free Audit + 10% Off
                        </>
                      )}
                    </button>
                    <p className="text-gray-400 text-[10px] text-center">
                      No spam, ever. Unsubscribe anytime.
                    </p>
                  </form>
                </div>
              )}

              {/* Success */}
              {phase === "success" && (
                <div className="chat-bubble-in">
                  <div className="flex items-end gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                      <img
                        src={agentAvatarUrl}
                        alt="Elvis"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[82%]" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                      <p className="text-gray-800 text-sm leading-relaxed">
                        Amazing — you&apos;re all set! 🎉 Check your inbox for the audit details. Talk soon!
                      </p>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 shrink-0">
                      <i className="ri-checkbox-circle-fill text-green-500 text-lg"></i>
                    </div>
                    <div>
                      <p className="text-green-700 font-semibold text-xs">Locked in! Check your email.</p>
                      <p className="text-green-600 text-xs">Your free audit + 10% discount is on its way.</p>
                    </div>
                  </div>
                  <button
                    onClick={dismiss}
                    className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Footer branding */}
            {(phase === "form" || phase === "msg2") && (
              <div className="bg-white px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  <span className="text-gray-400 text-[10px]">Elvis is available right now</span>
                </div>
                <a
                  href="https://wa.link/9m4r50"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-semibold text-[#25D366] hover:underline cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-whatsapp-line text-xs"></i>
                  Chat on WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Minimised tab ── */}
        {phase === "minimised" && (
          <button
            onClick={() => setPhase("form")}
            className="flex items-center gap-2 bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white px-4 py-2.5 rounded-full cursor-pointer chat-slide-up whitespace-nowrap pointer-events-auto"
            style={{ boxShadow: "0 6px 20px rgba(246,101,1,0.4)" }}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-chat-3-line text-sm"></i>
            </div>
            <span className="text-xs font-bold">Claim 10% Off + Free Audit</span>
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
          </button>
        )}
      </div>
    </>
  );
}
