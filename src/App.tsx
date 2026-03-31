import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Link, useLocation } from "react-router-dom";
import { AppRoutes } from "./router";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import LeadPopup from "./components/feature/LeadPopup";
import CookieBanner from "./components/feature/CookieBanner";

function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show button only after scrolling 320px down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 320) {
        setVisible(true);
      } else {
        setVisible(false);
        setShowTooltip(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-show tooltip briefly once the button becomes visible
  useEffect(() => {
    if (visible) {
      const showT = setTimeout(() => {
        setShowTooltip(true);
        if (autoHideRef.current) clearTimeout(autoHideRef.current);
        autoHideRef.current = setTimeout(() => setShowTooltip(false), 4000);
      }, 700);
      return () => clearTimeout(showT);
    }
  }, [visible]);

  const handleMouseEnter = () => {
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    autoHideRef.current = setTimeout(() => setShowTooltip(false), 300);
  };

  return (
    <div
      className={`fixed bottom-[76px] md:bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 transition-all duration-500 pointer-events-none ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-12"
      }`}
    >
      {/* Tooltip card */}
      <div
        className={`transition-all duration-300 ${
          showTooltip
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-3 scale-95 pointer-events-none"
        }`}
      >
        <div
          className="relative bg-white rounded-2xl px-5 py-4 flex flex-col gap-2"
          style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.16)", minWidth: "228px" }}
        >
          {/* Arrow pointing down to the FAB */}
          <div
            className="absolute bottom-[-8px] right-7 w-4 h-4 bg-white rotate-45"
            style={{ boxShadow: "3px 3px 8px rgba(0,0,0,0.07)" }}
          />

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#25D366" }}>
              <i className="ri-whatsapp-line text-white text-base"></i>
            </div>
            <div>
              <div className="text-gray-900 text-xs font-bold leading-tight">Dleading Creative Designs</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#25D366" }}></div>
                <span className="text-gray-400 text-[10px]">Online · Replies in minutes</span>
              </div>
            </div>
          </div>

          {/* Message bubble */}
          <div className="bg-gray-50 rounded-xl rounded-tl-sm px-3 py-2.5">
            <p className="text-gray-700 text-xs leading-relaxed">
              Hi there! 👋 Got a question about our services or pricing? We&apos;d love to help.
            </p>
          </div>

          {/* CTA */}
          <a
            href="https://wa.link/9m4r50"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer whitespace-nowrap transition-opacity hover:opacity-90 mt-0.5"
            style={{ backgroundColor: "#25D366" }}
          >
            <i className="ri-whatsapp-line text-sm"></i>
            Start a Conversation
          </a>
        </div>
      </div>

      {/* Floating action button */}
      <a
        href="https://wa.link/9m4r50"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Chat on WhatsApp"
        className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 pointer-events-auto"
        style={{
          backgroundColor: "#25D366",
          boxShadow: "0 6px 28px rgba(37,211,102,0.55)",
        }}
      >
        {/* Slow pulse ring */}
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: "rgba(37,211,102,0.28)",
            animationDuration: "2.2s",
          }}
        />
        {/* Subtle inner highlight */}
        <span
          className="absolute inset-1 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        />
        <i className="ri-whatsapp-line text-white text-[30px] relative z-10"></i>
      </a>
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setScrollPct(pct);
      setVisible(scrollTop > 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - scrollPct * circumference;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed left-4 bottom-[112px] md:left-6 md:bottom-8 z-[9999] cursor-pointer transition-all duration-500 group ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-10 pointer-events-none"
      }`}
    >
      <div className="relative w-12 h-12 md:w-11 md:h-11">
        {/* Scroll-progress ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width="48"
          height="48"
          viewBox="0 0 48 48"
        >
          <defs>
            <linearGradient id="btt-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F69D01" />
              <stop offset="100%" stopColor="#F65901" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx="24" cy="24" r={radius}
            fill="none"
            stroke="rgba(246,157,1,0.22)"
            strokeWidth="3"
          />
          {/* Live progress arc */}
          <circle
            cx="24" cy="24" r={radius}
            fill="none"
            stroke="url(#btt-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>

        {/* Inner pill */}
        <div
          className="absolute inset-[5px] rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
          style={{ background: "linear-gradient(135deg, #F69D01 0%, #F65901 100%)" }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <i className="ri-arrow-up-line text-white text-base"></i>
          </div>
        </div>
      </div>
    </button>
  );
}

function MobileBottomCTA() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9990] md:hidden">
      {/* Thin orange accent line at the very top of the bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#F69D01] to-[#F65901]" />

      <div className="bg-white px-4 py-3 flex items-center justify-between gap-3"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.10)" }}>

        {/* Left: label */}
        <div className="min-w-0">
          <p className="text-[11px] text-gray-400 leading-tight whitespace-nowrap">Leeds Web Design</p>
          <p className="text-[13px] font-bold text-gray-900 leading-tight whitespace-nowrap">Ready to grow online?</p>
        </div>

        {/* Right: buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Call button — secondary */}
          <a
            href="tel:+447427259935"
            aria-label="Call us"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <i className="ri-phone-line text-lg"></i>
            </div>
          </a>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="w-6 h-6 flex items-center justify-center text-gray-300 cursor-pointer active:text-gray-500 shrink-0"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-close-line text-base"></i>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <ScrollToTop />
        <AppRoutes />
        <WhatsAppButton />
        <BackToTop />
        <MobileBottomCTA />
        <LeadPopup />
        <CookieBanner />
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
