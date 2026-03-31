import { Link } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";

const lastUpdated = "29 March 2026";

interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
  type: string;
}

const necessaryCookies: CookieRow[] = [
  { name: "_session", provider: "creativedleading.co.uk", purpose: "Maintains your session state across page requests.", expiry: "Session", type: "HTTP" },
  { name: "dleading_cookie_consent_v1", provider: "creativedleading.co.uk", purpose: "Stores your cookie consent preferences.", expiry: "1 year", type: "Local Storage" },
  { name: "dleading_lead_captured_v2", provider: "creativedleading.co.uk", purpose: "Prevents the lead capture popup from showing after dismissal.", expiry: "1 year", type: "Local Storage" },
];

const analyticsCookies: CookieRow[] = [
  { name: "_ga", provider: "Google Analytics", purpose: "Registers a unique ID to generate statistical data on how you use the site.", expiry: "2 years", type: "HTTP" },
  { name: "_gid", provider: "Google Analytics", purpose: "Registers a unique ID to generate statistical data on how you use the site.", expiry: "24 hours", type: "HTTP" },
  { name: "_gat", provider: "Google Analytics", purpose: "Used by Google Analytics to throttle request rate.", expiry: "1 minute", type: "HTTP" },
];

const marketingCookies: CookieRow[] = [
  { name: "_fbp", provider: "Meta (Facebook)", purpose: "Used by Meta to deliver advertising and track conversions from Facebook Ads.", expiry: "90 days", type: "HTTP" },
  { name: "fr", provider: "Meta (Facebook)", purpose: "Used by Meta for advertising and retargeting.", expiry: "90 days", type: "HTTP" },
  { name: "ads/ga-audiences", provider: "Google Ads", purpose: "Used by Google Ads to re-engage visitors likely to convert.", expiry: "Session", type: "Pixel" },
];

const preferencesCookies: CookieRow[] = [
  { name: "dleading_popup_dismissed", provider: "creativedleading.co.uk", purpose: "Remembers whether you have dismissed any on-site pop-up or notification.", expiry: "1 year", type: "Local Storage" },
];

function CookieTable({ rows }: { rows: CookieRow[] }) {
  return (
    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#fdf8f4] border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Cookie Name</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Provider</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Purpose</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Expiry</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-4 py-3 font-mono text-[11px] text-gray-800 whitespace-nowrap">{row.name}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.provider}</td>
              <td className="px-4 py-3 text-gray-500 hidden md:table-cell leading-relaxed">{row.purpose}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.expiry}</td>
              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{row.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const categoryBadges: Record<string, string> = {
  necessary: "bg-green-100 text-green-700",
  analytics: "bg-amber-100 text-amber-700",
  marketing: "bg-red-100 text-red-700",
  preferences: "bg-violet-100 text-violet-700",
};

export default function CookiePolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#111] py-16 md:py-20 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(246,89,1,0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 bg-[#F69D01]/15 text-[#F69D01] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <i className="ri-shield-keyhole-line"></i> Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Cookie Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
          <p className="text-gray-300 text-sm mt-3 max-w-2xl leading-relaxed">
            This policy explains what cookies are, which ones we use, and how you can control them on the Dleading Creative Designs website.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-12">

          {/* What are cookies */}
          <div id="what-are-cookies" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">1. What Are Cookies?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cookies are small text files placed on your device (computer, tablet, or phone) when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give site owners statistical information about how their site is used.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Some cookies are placed by us directly; others are placed by third-party services that appear on our pages (such as Google Analytics or Meta Pixel). Cookies can be &quot;session cookies&quot; (deleted when you close your browser) or &quot;persistent cookies&quot; (which remain on your device for a set period).
            </p>
          </div>

          {/* How we use cookies */}
          <div id="how-we-use" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">2. How We Use Cookies</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              We use cookies and similar technologies (such as Local Storage) to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: "ri-settings-3-line", color: "green", label: "Strictly Necessary", desc: "Keep the site working correctly and securely." },
                { icon: "ri-bar-chart-2-line", color: "amber", label: "Analytics", desc: "Understand how visitors use our site so we can improve it." },
                { icon: "ri-advertisement-line", color: "red", label: "Marketing", desc: "Deliver relevant ads and measure campaign performance." },
                { icon: "ri-user-settings-line", color: "violet", label: "Preferences", desc: "Remember your settings and personalise your experience." },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 bg-[#fdf8f4] rounded-xl p-4 border border-orange-50">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F69D01]/15 text-[#F69D01] shrink-0">
                    <i className={`${item.icon} text-sm`}></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cookie tables */}
          {[
            {
              id: "necessary-cookies",
              num: "3",
              key: "necessary",
              label: "Strictly Necessary Cookies",
              badge: categoryBadges.necessary,
              rows: necessaryCookies,
              note: "These cookies are required for the website to function. They cannot be disabled via our cookie banner.",
            },
            {
              id: "analytics-cookies",
              num: "4",
              key: "analytics",
              label: "Analytics & Performance Cookies",
              badge: categoryBadges.analytics,
              rows: analyticsCookies,
              note: "These cookies help us understand visitor behaviour. All data is aggregated and anonymised where possible.",
            },
            {
              id: "marketing-cookies",
              num: "5",
              key: "marketing",
              label: "Marketing & Advertising Cookies",
              badge: categoryBadges.marketing,
              rows: marketingCookies,
              note: "These cookies are set by advertising networks to build a profile of your interests and show relevant ads on other sites.",
            },
            {
              id: "preferences-cookies",
              num: "6",
              key: "preferences",
              label: "Functionality & Preferences Cookies",
              badge: categoryBadges.preferences,
              rows: preferencesCookies,
              note: "These cookies remember your choices to personalise your experience on future visits.",
            },
          ].map((cat) => (
            <div key={cat.id} id={cat.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">{cat.num}. {cat.label}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${cat.badge}`}>
                  {cat.key === "necessary" ? "Always On" : "Optional"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1 leading-relaxed">{cat.note}</p>
              <CookieTable rows={cat.rows} />
            </div>
          ))}

          {/* Managing cookies */}
          <div id="managing-cookies" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">7. How to Manage Cookies</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              You have several options for controlling cookies:
            </p>
            <div className="space-y-4">
              <div className="bg-[#fdf8f4] rounded-xl p-5 border border-orange-100">
                <p className="font-semibold text-gray-800 text-sm mb-1.5 flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center text-[#F69D01]">
                    <i className="ri-settings-3-line text-base"></i>
                  </div>
                  Our Cookie Banner
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Use the cookie preferences banner at the bottom of this page to accept, reject, or customise which cookies we set. You can revisit your choices at any time via the &quot;Cookie Settings&quot; button in the bottom-left corner of the screen.
                </p>
              </div>
              <div className="bg-[#fdf8f4] rounded-xl p-5 border border-orange-100">
                <p className="font-semibold text-gray-800 text-sm mb-1.5 flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center text-[#F69D01]">
                    <i className="ri-computer-line text-base"></i>
                  </div>
                  Browser Settings
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Most browsers allow you to refuse or delete cookies via their settings. Note that disabling all cookies may affect how some parts of this website work. Links to cookie management pages for major browsers:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647" },
                    { label: "Mozilla Firefox", href: "https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" },
                    { label: "Apple Safari", href: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
                    { label: "Microsoft Edge", href: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
                  ].map((b) => (
                    <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#F65901] border border-[#F69D01]/30 px-3 py-1.5 rounded-full hover:bg-[#F69D01]/10 transition-colors cursor-pointer whitespace-nowrap">
                      {b.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Changes */}
          <div id="changes" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">8. Changes to This Cookie Policy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update this Cookie Policy periodically to reflect changes in the cookies we use or for legal, operational, or regulatory reasons. Please check this page regularly to stay informed. The &quot;Last Updated&quot; date above shows when this policy was last revised.
            </p>
          </div>

          {/* Contact */}
          <div id="contact" className="scroll-mt-24">
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">9. Contact Us</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              If you have any questions about our use of cookies or this policy, please contact us:
            </p>
            <div className="bg-[#fdf8f4] rounded-2xl p-6 border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F69D01]/15 text-[#F69D01] shrink-0">
                <i className="ri-mail-send-line text-base"></i>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Dleading Creative Designs</p>
                <p className="text-gray-500 text-xs mt-0.5">Holbeck, Leeds, West Yorkshire, United Kingdom</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <a href="mailto:info@creativedleading.co.uk"
                  className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap">
                  Email Us
                </a>
                <Link to="/privacy-policy"
                  className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-700 border border-gray-200 hover:border-[#F69D01]/50 hover:text-[#F65901] transition-colors cursor-pointer whitespace-nowrap">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
