import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "dleading_cookie_consent_v1";

interface CookiePrefs {
  necessary: boolean;   // always true
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const defaultPrefs: CookiePrefs = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const cookieCategories = [
  {
    key: "necessary" as keyof CookiePrefs,
    label: "Strictly Necessary",
    description:
      "Essential for the website to function. Cannot be disabled. These include session management and security cookies.",
    always: true,
  },
  {
    key: "analytics" as keyof CookiePrefs,
    label: "Analytics & Performance",
    description:
      "Help us understand how visitors interact with the site (e.g. Google Analytics). All data is anonymised.",
    always: false,
  },
  {
    key: "marketing" as keyof CookiePrefs,
    label: "Marketing & Advertising",
    description:
      "Used to show relevant ads and measure campaign performance across platforms like Google and Meta.",
    always: false,
  },
  {
    key: "preferences" as keyof CookiePrefs,
    label: "Functionality & Preferences",
    description:
      "Remember your choices such as language, region, or saved settings to personalise your experience.",
    always: false,
  },
];

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(defaultPrefs);
  const [showReopener, setShowReopener] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't flash instantly on load
    const t = setTimeout(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setShow(true);
      } else {
        setShowReopener(true);
      }
      setMounted(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const save = (accepted: CookiePrefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accepted));
    setShow(false);
    setShowManage(false);
    setTimeout(() => setShowReopener(true), 600);
  };

  const acceptAll = () =>
    save({ necessary: true, analytics: true, marketing: true, preferences: true });

  const rejectAll = () => save({ ...defaultPrefs });

  const saveCustom = () => save(prefs);

  const reopen = () => {
    setShowReopener(false);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setPrefs(JSON.parse(saved)); } catch { setPrefs(defaultPrefs); }
    }
    setShowManage(true);
    setShow(true);
  };

  const toggle = (key: keyof CookiePrefs) => {
    if (key === "necessary") return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cookieFadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        .cookie-slide-up { animation: cookieSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .cookie-fade-in  { animation: cookieFadeIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ── Main banner ── */}
      {show && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000] cookie-slide-up">
          {/* Backdrop blur strip */}
          <div className="bg-[#0d0d0d]/95 backdrop-blur-md border-t border-white/10">

            {/* ── Manage preferences panel (expandable) ── */}
            {showManage && (
              <div className="border-b border-white/10">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-sm">Manage Cookie Preferences</h3>
                    <button
                      onClick={() => setShowManage(false)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      aria-label="Close manage panel"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cookieCategories.map((cat) => (
                      <div
                        key={cat.key}
                        className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/8"
                      >
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-xs font-semibold">{cat.label}</span>
                            {cat.always && (
                              <span className="text-[10px] font-bold text-[#F69D01] bg-[#F69D01]/15 px-2 py-0.5 rounded-full whitespace-nowrap">
                                Always On
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">{cat.description}</p>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => toggle(cat.key)}
                          disabled={cat.always}
                          aria-label={`Toggle ${cat.label}`}
                          className={`relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200 mt-0.5 ${
                            cat.always
                              ? "bg-[#F69D01] cursor-not-allowed"
                              : prefs[cat.key]
                              ? "bg-[#F69D01] cursor-pointer"
                              : "bg-white/20 cursor-pointer"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              prefs[cat.key] ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Save custom row */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={saveCustom}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      Save My Preferences
                    </button>
                    <button
                      onClick={acceptAll}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white border border-white/20 hover:border-[#F69D01]/60 hover:text-[#F69D01] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Accept All Cookies
                    </button>
                    <button
                      onClick={rejectAll}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Reject Non-Essential
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Main banner row ── */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center gap-4">

              {/* Icon + text */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F69D01]/15 text-[#F69D01] shrink-0 mt-0.5">
                  <i className="ri-shield-keyhole-line text-base"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold mb-0.5">We value your privacy</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    We use cookies to enhance your browsing experience, serve personalised content, and analyse site traffic.
                    By clicking <strong className="text-gray-300">"Accept All"</strong> you consent to our use of cookies.{" "}
                    <Link to="/cookie-policy" className="text-[#F69D01] hover:underline cursor-pointer whitespace-nowrap">Cookie Policy</Link>
                    {" "}·{" "}
                    <Link to="/privacy-policy" className="text-[#F69D01] hover:underline cursor-pointer whitespace-nowrap">Privacy Policy</Link>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => { setShowManage((v) => !v); }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-300 border border-white/15 hover:border-white/30 hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <i className="ri-settings-3-line text-sm"></i>
                  Manage Preferences
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 border border-white/10 hover:border-white/25 hover:text-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Reject All
                </button>
                <button
                  onClick={acceptAll}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
