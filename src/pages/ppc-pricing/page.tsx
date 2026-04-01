import { useState, FormEvent } from "react";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import CTASection from "../home/components/CTASection";
import { getFormActionUrl } from "@/config/forms";
import { stockImages } from "@/config/media";

const packages = [
  {
    name: "Starter",
    tag: "Perfect for Small Businesses",
    tagColor: "bg-green-100 text-green-700",
    price: "£299",
    period: "/month",
    adBudget: "£300 – £600",
    description:
      "Ideal for local businesses and sole traders wanting to get in front of Google searchers fast, without a huge monthly commitment.",
    features: [
      { text: "Google Search Ads setup & management", included: true },
      { text: "Up to 1 campaign / 3 ad groups", included: true },
      { text: "Keyword research (up to 50 keywords)", included: true },
      { text: "Ad copywriting (2 variations per group)", included: true },
      { text: "Monthly performance report", included: true },
      { text: "Conversion tracking setup", included: true },
      { text: "Landing page recommendations", included: true },
      { text: "Meta Ads (Facebook & Instagram)", included: false },
      { text: "Remarketing / retargeting campaigns", included: false },
      { text: "Dedicated account manager", included: false },
      { text: "Bi-weekly strategy calls", included: false },
    ],
    highlight: false,
    cta: "Get Started — £299/mo",
    badge: null,
  },
  {
    name: "Growth",
    tag: "Most Popular",
    tagColor: "bg-orange-100 text-[#F65901]",
    price: "£499",
    period: "/month",
    adBudget: "£600 – £1,500",
    description:
      "For growing businesses ready to scale leads across both Google and Meta — with remarketing to capture warm audiences.",
    features: [
      { text: "Google Search Ads setup & management", included: true },
      { text: "Up to 3 campaigns / 9 ad groups", included: true },
      { text: "Keyword research (up to 150 keywords)", included: true },
      { text: "Ad copywriting (4 variations per group)", included: true },
      { text: "Monthly performance report", included: true },
      { text: "Conversion tracking setup", included: true },
      { text: "Landing page recommendations", included: true },
      { text: "Meta Ads (Facebook & Instagram)", included: true },
      { text: "Remarketing / retargeting campaigns", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Bi-weekly strategy calls", included: false },
    ],
    highlight: true,
    cta: "Get Started — £499/mo",
    badge: "⭐ Most Popular",
  },
  {
    name: "Scale",
    tag: "Maximum Growth",
    tagColor: "bg-amber-100 text-amber-700",
    price: "£899",
    period: "/month",
    adBudget: "£1,500+",
    description:
      "A fully managed, multi-platform advertising engine for established businesses serious about dominating their market.",
    features: [
      { text: "Google Search Ads setup & management", included: true },
      { text: "Unlimited campaigns & ad groups", included: true },
      { text: "Keyword research (unlimited)", included: true },
      { text: "Ad copywriting (unlimited variations)", included: true },
      { text: "Weekly performance reports", included: true },
      { text: "Advanced conversion tracking", included: true },
      { text: "Custom landing page design", included: true },
      { text: "Meta Ads (Facebook & Instagram)", included: true },
      { text: "Remarketing / retargeting campaigns", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Bi-weekly strategy calls", included: true },
    ],
    highlight: false,
    cta: "Get Started — £899/mo",
    badge: null,
  },
];

const howItWorks = [
  {
    step: "01",
    icon: "ri-search-eye-line",
    title: "Discovery & Audit",
    desc: "We dig into your business, competitors, and target audience to identify the highest-value keywords and audiences.",
  },
  {
    step: "02",
    icon: "ri-draft-line",
    title: "Campaign Build",
    desc: "Our team builds your campaigns from scratch — ad groups, copy, extensions, tracking and landing pages all set up correctly.",
  },
  {
    step: "03",
    icon: "ri-rocket-line",
    title: "Go Live & Monitor",
    desc: "Campaigns go live and we monitor performance daily — adjusting bids, pausing underperformers, and scaling winners.",
  },
  {
    step: "04",
    icon: "ri-bar-chart-2-line",
    title: "Report & Optimise",
    desc: "You receive clear monthly reports with plain-English insights. We continuously refine to lower cost-per-click and increase ROI.",
  },
];

const stats = [
  { value: "3.8×", label: "Average ROI on Google Ads for our clients" },
  { value: "47%", label: "Average reduction in cost-per-click after month 2" },
  { value: "72hrs", label: "Average time from brief to campaigns going live" },
  { value: "100%", label: "Transparent — you own your ad accounts always" },
];

const faqs = [
  {
    q: "Is the ad spend included in your management fee?",
    a: "No — the management fee covers our time, strategy, and expertise. Your ad spend (the money paid directly to Google or Meta) is separate and paid directly by you. This keeps things fully transparent — you can see exactly where every penny goes.",
  },
  {
    q: "How long before I see results?",
    a: "Most clients see initial traffic and leads within the first 48–72 hours of going live. However, campaigns typically reach peak performance at the 4–8 week mark once we've gathered enough data to optimise bids and refine targeting.",
  },
  {
    q: "What platforms do you run ads on?",
    a: "Our Starter pack focuses on Google Search Ads. The Growth and Scale packages also include Meta Ads (Facebook & Instagram). We can also manage LinkedIn and TikTok Ads as add-ons upon request.",
  },
  {
    q: "Do I need a minimum contract length?",
    a: "We operate on rolling monthly agreements — no long-term lock-in. We'd rather earn your continued business through results. We do recommend a minimum of 3 months to properly optimise campaigns.",
  },
  {
    q: "Who owns the ad accounts?",
    a: "You do — always. We set up campaigns inside your own Google Ads and Meta Business accounts. If you ever leave (though we hope you won't!), you keep everything.",
  },
  {
    q: "Can I change my package later?",
    a: "Absolutely. You can upgrade or downgrade at the start of any new monthly billing cycle. As your business grows, we grow with you.",
  },
];

export default function PPCPricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [ppcFormError, setPpcFormError] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleAuditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const textarea = form.querySelector("textarea[name='business_description']") as HTMLTextAreaElement;
    if (textarea && textarea.value.length > 500) return;

    setPpcFormError("");
    const url = getFormActionUrl("ppcPricing");
    if (!url) {
      setPpcFormError(
        "This form is not configured yet. Email info@creativedleading.co.uk or message us on WhatsApp."
      );
      setFormStatus("error");
      return;
    }

    setFormStatus("submitting");
    const data = new URLSearchParams();
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      data.append(key, value as string);
    });

    // Collect checkboxes manually
    const checked = Array.from(form.querySelectorAll<HTMLInputElement>("input[name='platforms']:checked"))
      .map((cb) => cb.value)
      .join(", ");
    if (checked) data.set("platforms", checked);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString(),
      });
      if (res.ok) {
        setFormStatus("success");
        form.reset();
        setCharCount(0);
      } else {
        setPpcFormError("Something went wrong. Please try again or message us on WhatsApp.");
        setFormStatus("error");
      }
    } catch {
      setPpcFormError("Something went wrong. Please try again or message us on WhatsApp.");
      setFormStatus("error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative bg-[#0d0d0d] py-20 md:py-28 overflow-hidden">
          <div
            className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.16) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,89,1,0.12) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-[#F69D01] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
              <i className="ri-cursor-line"></i>
              Pay Per Click Management
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4 leading-tight">
              PPC Pricing That&apos;s <span className="text-[#F69D01]">Actually Transparent</span>
            </h1>
            <p className="text-gray-400 text-base max-w-2xl mx-auto mb-6">
              Flat monthly management fees — no percentage of spend, no hidden charges.
              Just expert campaign management that puts your budget to work.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 bg-[#F69D01]/10 border border-[#F69D01]/30 text-[#F69D01] text-sm font-semibold px-5 py-2.5 rounded-full">
                <i className="ri-information-line"></i>
                Ad spend is paid directly to Google / Meta — kept separate from our fee
              </div>
            </div>

            {/* Quick stat strip */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-5">
                  <div className="text-2xl font-bold text-[#F69D01] mb-1">{s.value}</div>
                  <div className="text-gray-400 text-xs leading-relaxed">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad budget explainer banner */}
        <section className="bg-[#1a1a1a] py-6">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F69D01]/20 shrink-0">
                  <i className="ri-lightbulb-line text-[#F69D01] text-xl"></i>
                </div>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">How PPC pricing works:</strong> Our fee = our management work. Your ad spend = money going directly to Google/Meta to show your ads. Both are needed, neither is hidden.
                </p>
              </div>
              <a
                href="https://wa.link/9m4r50"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-5 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
              >
                Ask Us Anything
              </a>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Our Packages</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Choose Your Growth Tier</h2>
              <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">All packages include full campaign setup. Ad spend shown is your recommended monthly budget paid to the platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
                    pkg.highlight ? "border-2 border-[#F69D01]" : "border border-gray-200"
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-bold text-center py-1.5 uppercase tracking-widest">
                      {pkg.badge}
                    </div>
                  )}
                  <div className={`p-7 ${pkg.badge ? "pt-10" : ""}`}>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${pkg.tagColor}`}>
                      {pkg.tag}
                    </span>

                    <h2 className="text-gray-900 font-bold text-xl mt-4 mb-1">{pkg.name}</h2>

                    {/* Price */}
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-4xl font-bold text-gray-900">{pkg.price}</span>
                      <span className="text-gray-400 text-sm mb-1">{pkg.period}</span>
                    </div>

                    {/* Ad budget indicator */}
                    <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      <i className="ri-funds-line text-sm"></i>
                      Recommended ad spend: {pkg.adBudget}/mo
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{pkg.description}</p>

                    <a
                      href="https://wa.link/9m4r50"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-opacity cursor-pointer whitespace-nowrap mb-6 ${
                        pkg.highlight
                          ? "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white hover:opacity-90"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      <i className="ri-whatsapp-line text-base"></i>
                      {pkg.cta}
                    </a>

                    <div className="h-px bg-gray-100 mb-5"></div>

                    <ul className="space-y-3">
                      {pkg.features.map((f) => (
                        <li key={f.text} className="flex items-start gap-3 text-sm">
                          <div className={`w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 ${f.included ? "text-[#F69D01]" : "text-gray-300"}`}>
                            <i className={f.included ? "ri-checkbox-circle-fill text-lg" : "ri-close-circle-line text-lg"}></i>
                          </div>
                          <span className={f.included ? "text-gray-700" : "text-gray-400 line-through decoration-gray-300"}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "ri-shield-check-line", text: "No Hidden Fees" },
                { icon: "ri-user-line", text: "You Own Your Accounts" },
                { icon: "ri-calendar-line", text: "No Long-Term Contract" },
                { icon: "ri-customer-service-2-line", text: "Dedicated Support" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 text-[#F69D01]">
                    <i className={`${item.icon} text-xl`}></i>
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Our Process</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">How We Run Your Campaigns</h2>
              <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">From day one brief to ongoing optimisation — here&apos;s exactly what happens when you work with us.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step) => (
                <div key={step.step} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#F69D01]/40 transition-colors duration-300 relative overflow-hidden">
                  <span className="absolute top-4 right-5 text-5xl font-black text-gray-100 leading-none select-none">{step.step}</span>
                  <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white mb-4 relative z-10">
                    <i className={`${step.icon} text-lg`}></i>
                  </div>
                  <h3 className="text-gray-900 font-bold text-base mb-2 relative z-10">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed relative z-10">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why PPC with us */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Why Dleading</span>
                <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-5">
                  We Don&apos;t Just Run Ads —<br />
                  <span className="text-[#F69D01]">We Drive Real Business Results</span>
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Lots of agencies will happily take your money and deliver impressions. We focus on what actually matters —
                  phone calls, form fills, and sales. Every decision we make is tied back to your business goals, not vanity metrics.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: "ri-focus-3-line", text: "Campaigns built around your goals — not industry averages" },
                    { icon: "ri-eye-line", text: "Full transparency — you see every click, every penny, every day" },
                    { icon: "ri-map-pin-line", text: "Local Leeds expertise — we know the UK market inside out" },
                    { icon: "ri-phone-line", text: "Call tracking included so you know which ads drive calls" },
                    { icon: "ri-tools-line", text: "Google Partner certified — we know the platforms deeply" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F69D01]/10 shrink-0 text-[#F69D01]">
                        <i className={`${item.icon} text-base`}></i>
                      </div>
                      <span className="text-gray-700 text-sm leading-relaxed pt-1">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="w-full h-80 md:h-96 rounded-xl overflow-hidden">
                  <img
                    src={stockImages.ppcWhy}
                    alt="PPC Campaign Management"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* floating stat card */}
                <div className="absolute -bottom-5 -left-5 bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-3" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0">
                    <i className="ri-arrow-up-line text-lg"></i>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">3.8× ROI</div>
                    <div className="text-xs text-gray-500">Average client return</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FREE PPC AUDIT FORM ── */}
        <section id="free-audit" className="py-20 bg-[#0d0d0d] relative overflow-hidden">
          {/* Background glows */}
          <div
            className="absolute top-[-60px] left-[-60px] w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.14) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-40px] right-[-40px] w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,89,1,0.10) 0%, transparent 70%)" }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Left — pitch */}
              <div className="lg:sticky lg:top-28">
                <div className="inline-flex items-center gap-2 bg-[#F69D01]/10 border border-[#F69D01]/30 text-[#F69D01] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
                  <i className="ri-gift-line"></i>
                  100% Free — No Obligation
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
                  Get Your Free <span className="text-[#F69D01]">PPC Account Audit</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Already running Google or Meta Ads? Let our experts dig into your account and identify exactly where you&apos;re wasting budget and where the hidden growth opportunities are — completely free, no strings attached.
                </p>

                <ul className="space-y-4 mb-8">
                  {[
                    { icon: "ri-search-eye-line", title: "Full Account Review", desc: "We audit your campaigns, keywords, ad copy, bids, and targeting settings." },
                    { icon: "ri-money-pound-circle-line", title: "Wasted Spend Report", desc: "See exactly which keywords and placements are draining your budget with no return." },
                    { icon: "ri-lightbulb-line", title: "Growth Opportunities", desc: "We highlight quick wins and long-term strategies specific to your business." },
                    { icon: "ri-file-text-line", title: "Plain-English Report", desc: "No jargon. A clear report you can actually understand and act on." },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0 mt-0.5">
                        <i className={`${item.icon} text-base`}></i>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm mb-0.5">{item.title}</div>
                        <div className="text-gray-400 text-xs leading-relaxed">{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F69D01]/20 shrink-0">
                    <i className="ri-time-line text-[#F69D01] text-lg"></i>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    <strong className="text-white">We&apos;ll get back to you within 24 hours</strong> with your personalised audit report — delivered straight to your inbox.
                  </p>
                </div>
              </div>

              {/* Right — form */}
              <div className="bg-white rounded-2xl p-8">
                {formStatus === "success" ? (
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-5">
                      <i className="ri-checkbox-circle-fill text-4xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Audit Request Received!</h3>
                    <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                      Thanks! Our PPC team will review your details and send your free audit report within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setFormStatus("idle");
                        setPpcFormError("");
                      }}
                      className="mt-6 px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Request Your Free Audit</h3>
                      <p className="text-gray-500 text-xs">Fill in the form below — takes less than 2 minutes.</p>
                    </div>

                    <form
                      id="ppc-audit-form"
                      onSubmit={handleAuditSubmit}
                      className="space-y-4"
                    >
                      {/* Name + Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="full_name"
                            required
                            placeholder="e.g. Sarah Johnson"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                          <input
                            type="email"
                            name="email"
                            required
                            placeholder="you@yourcompany.com"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Phone + Website */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            placeholder="+44 7700 000000"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Website URL <span className="text-red-500">*</span></label>
                          <input
                            type="url"
                            name="website_url"
                            required
                            placeholder="https://yourwebsite.co.uk"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Monthly ad spend */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Monthly Ad Spend <span className="text-red-500">*</span></label>
                        <select
                          name="monthly_ad_spend"
                          required
                          defaultValue=""
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#F69D01] transition-colors cursor-pointer"
                        >
                          <option value="" disabled>Select your current spend...</option>
                          <option value="Not running ads yet">Not running ads yet</option>
                          <option value="Under £300/mo">Under £300/mo</option>
                          <option value="£300 – £600/mo">£300 – £600/mo</option>
                          <option value="£600 – £1,500/mo">£600 – £1,500/mo</option>
                          <option value="£1,500 – £5,000/mo">£1,500 – £5,000/mo</option>
                          <option value="£5,000+/mo">£5,000+/mo</option>
                        </select>
                      </div>

                      {/* Platforms */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Which platforms are you advertising on? <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Google Ads", "Meta Ads (Facebook/Instagram)", "TikTok Ads", "LinkedIn Ads"].map((platform) => (
                            <label key={platform} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                name="platforms"
                                value={platform}
                                className="w-4 h-4 rounded border-gray-300 accent-[#F69D01] cursor-pointer"
                              />
                              <span className="text-xs text-gray-700 group-hover:text-[#F65901] transition-colors">{platform}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Main goal */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">What&apos;s your main advertising goal? <span className="text-red-500">*</span></label>
                        <select
                          name="main_goal"
                          required
                          defaultValue=""
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#F69D01] transition-colors cursor-pointer"
                        >
                          <option value="" disabled>Select your goal...</option>
                          <option value="Generate more leads">Generate more leads</option>
                          <option value="Drive more online sales">Drive more online sales</option>
                          <option value="Lower my cost per click">Lower my cost per click</option>
                          <option value="Increase brand awareness">Increase brand awareness</option>
                          <option value="Improve ROAS / ROI">Improve ROAS / ROI</option>
                        </select>
                      </div>

                      {/* Business description */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Tell us briefly about your business
                          <span className="ml-1 text-gray-400 font-normal">({charCount}/500)</span>
                        </label>
                        <textarea
                          name="business_description"
                          rows={3}
                          maxLength={500}
                          onChange={(e) => setCharCount(e.target.value.length)}
                          placeholder="e.g. We're a Leeds-based plumbing company looking to get more emergency call-out bookings through Google Ads..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors resize-none"
                        />
                        {charCount > 500 && (
                          <p className="text-red-500 text-xs mt-1">Please keep your description under 500 characters.</p>
                        )}
                      </div>

                      {formStatus === "error" && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                          <div className="w-5 h-5 flex items-center justify-center text-red-500 shrink-0">
                            <i className="ri-error-warning-line text-base"></i>
                          </div>
                          <p className="text-red-600 text-xs">
                            {ppcFormError || "Something went wrong. Please try again or message us on WhatsApp."}
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={formStatus === "submitting" || charCount > 500}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {formStatus === "submitting" ? (
                          <>
                            <i className="ri-loader-4-line animate-spin text-base"></i>
                            Sending Your Request...
                          </>
                        ) : (
                          <>
                            <i className="ri-send-plane-line text-base"></i>
                            Get My Free PPC Audit
                          </>
                        )}
                      </button>

                      <p className="text-center text-gray-400 text-xs">
                        No spam, ever. We&apos;ll only use your details to prepare your free audit.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Common PPC Questions</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-900 font-semibold text-sm">{faq.q}</span>
                    <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[#F69D01]">
                      <i className={`text-lg transition-transform duration-200 ${openFaq === i ? "ri-subtract-line" : "ri-add-line"}`}></i>
                    </div>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection
          title="Ready to Turn Clicks Into Customers?"
          subtitle="Message us on WhatsApp and we'll put together a free PPC strategy for your business."
          buttonLabel="Get My Free PPC Strategy"
          buttonLink="/contact"
        />
      </main>
      <Footer />
    </div>
  );
}
