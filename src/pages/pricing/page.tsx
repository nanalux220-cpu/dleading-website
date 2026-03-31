import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";

/* ─── DATA ─── */

const logoPackages = [
  {
    name: "Starter",
    tag: "New Businesses",
    tagColor: "bg-green-100 text-green-700",
    price: "£79",
    sub: "one-time",
    badge: null,
    highlight: false,
    highlights: [
      "1 unique logo concept",
      "2 rounds of revisions",
      "PNG & JPG web-ready files",
      "Basic brand colour palette",
      "5 business day delivery",
    ],
  },
  {
    name: "Professional",
    tag: "Most Popular",
    tagColor: "bg-orange-100 text-[#F65901]",
    price: "£199",
    sub: "one-time",
    badge: "⭐ Most Popular",
    highlight: true,
    highlights: [
      "3 unique logo concepts",
      "Unlimited revisions",
      "Full source files (AI, EPS, SVG)",
      "Brand colour palette + typography",
      "Social media profile images",
    ],
  },
  {
    name: "Brand Identity",
    tag: "Complete Package",
    tagColor: "bg-amber-100 text-amber-700",
    price: "£399",
    sub: "one-time",
    badge: null,
    highlight: false,
    highlights: [
      "5 unique logo concepts",
      "Brand guidelines document",
      "Business card design",
      "Social media kit (6 templates)",
      "Express 2-day delivery",
    ],
  },
];

const ppcPackages = [
  {
    name: "Starter",
    tag: "Small Businesses",
    tagColor: "bg-green-100 text-green-700",
    price: "£299",
    sub: "/month",
    badge: null,
    highlight: false,
    adBudget: "£300–£600/mo ad spend",
    highlights: [
      "Google Search Ads management",
      "Up to 1 campaign / 3 ad groups",
      "Keyword research (50 keywords)",
      "Monthly performance report",
      "Conversion tracking setup",
    ],
  },
  {
    name: "Growth",
    tag: "Most Popular",
    tagColor: "bg-orange-100 text-[#F65901]",
    price: "£499",
    sub: "/month",
    badge: "⭐ Most Popular",
    highlight: true,
    adBudget: "£600–£1,500/mo ad spend",
    highlights: [
      "Google + Meta Ads management",
      "Up to 3 campaigns / 9 ad groups",
      "Remarketing campaigns",
      "Dedicated account manager",
      "Bi-weekly performance reports",
    ],
  },
  {
    name: "Scale",
    tag: "Maximum Growth",
    tagColor: "bg-amber-100 text-amber-700",
    price: "£899",
    sub: "/month",
    badge: null,
    highlight: false,
    adBudget: "£1,500+/mo ad spend",
    highlights: [
      "Unlimited campaigns & ad groups",
      "Google + Meta Ads + Remarketing",
      "Custom landing page design",
      "Weekly performance reports",
      "Bi-weekly strategy calls",
    ],
  },
];

const smmPackages = [
  {
    name: "Starter",
    tag: "New to Social",
    tagColor: "bg-green-100 text-green-700",
    price: "£299",
    sub: "/month",
    badge: null,
    highlight: false,
    platforms: "Up to 2 platforms",
    highlights: [
      "3 posts per week per platform",
      "Monthly content calendar",
      "Basic community management",
      "Hashtag research & strategy",
      "Monthly performance report",
    ],
  },
  {
    name: "Growth",
    tag: "Most Popular",
    tagColor: "bg-orange-100 text-[#F65901]",
    price: "£549",
    sub: "/month",
    badge: "⭐ Most Popular",
    highlight: true,
    platforms: "Up to 3 platforms",
    highlights: [
      "Daily posts (7/week) per platform",
      "Story & Reel creation (up to 6/mo)",
      "Full community management",
      "Paid social ad campaigns",
      "Dedicated social strategist",
    ],
  },
  {
    name: "Authority",
    tag: "Brand Domination",
    tagColor: "bg-amber-100 text-amber-700",
    price: "£999",
    sub: "/month",
    badge: null,
    highlight: false,
    platforms: "Up to 5 platforms",
    highlights: [
      "Daily posts + unlimited Stories/Reels",
      "Influencer outreach & collaboration",
      "Paid social campaigns included",
      "Bi-weekly strategy calls",
      "Weekly performance reports",
    ],
  },
];

const services = [
  {
    id: "logo",
    icon: "ri-pen-nib-line",
    label: "Logo Design",
    from: "From £79",
    color: "from-[#F69D01] to-[#F65901]",
    detailPath: "/logo-pricing",
  },
  {
    id: "ppc",
    icon: "ri-cursor-line",
    label: "PPC Advertising",
    from: "From £299/mo",
    color: "from-[#F69D01] to-[#F65901]",
    detailPath: "/ppc-pricing",
  },
  {
    id: "social",
    icon: "ri-instagram-line",
    label: "Social Media",
    from: "From £299/mo",
    color: "from-[#F69D01] to-[#F65901]",
    detailPath: "/smm-pricing",
  },
];

const whoIsItFor = [
  {
    icon: "ri-pen-nib-line",
    title: "I need a logo or brand identity",
    desc: "Starting a new business, rebranding, or just need a professional logo that works across all media? Our one-time logo packages cover you from £79.",
    tag: "Logo Design",
    path: "/logo-pricing",
    color: "bg-orange-50 border-orange-200",
    iconBg: "bg-gradient-to-br from-[#F69D01] to-[#F65901]",
  },
  {
    icon: "ri-cursor-line",
    title: "I want instant Google visibility & more leads",
    desc: "Already have a website but not getting enough enquiries? PPC puts you in front of people actively searching for what you offer — from day one.",
    tag: "PPC Advertising",
    path: "/ppc-pricing",
    color: "bg-amber-50 border-amber-200",
    iconBg: "bg-gradient-to-br from-[#F69D01] to-[#F65901]",
  },
  {
    icon: "ri-instagram-line",
    title: "I want to grow my social media presence",
    desc: "Struggling to stay consistent on social? We handle the content, posting, and community management so your brand shows up every single day.",
    tag: "Social Media",
    path: "/smm-pricing",
    color: "bg-green-50 border-green-200",
    iconBg: "bg-gradient-to-br from-[#F69D01] to-[#F65901]",
  },
];

const faqs = [
  {
    q: "Can I combine multiple services at a discounted rate?",
    a: "Yes! Clients who take on two or more services get priority scheduling and we'll put together a custom bundle quote. Message us on WhatsApp and we'll work something out that fits your budget.",
  },
  {
    q: "Are there any setup fees on top of the monthly prices?",
    a: "No setup fees, ever. The monthly management fee covers everything — setup, strategy, execution, and reporting. For logo design packages, the price shown is the single one-time payment with nothing extra.",
  },
  {
    q: "Do you offer payment plans for logo design?",
    a: "Yes. For our Professional and Brand Identity packages, we offer a 50% deposit upfront and 50% on final delivery. Just mention this when you get in touch.",
  },
  {
    q: "How do I get started?",
    a: "The quickest way is to message us on WhatsApp. We typically respond within a few hours, and we can have a brief discovery call or just get straight into the details via chat — whatever works for you.",
  },
  {
    q: "What areas do you serve?",
    a: "We're based in Leeds but work with clients across the UK and internationally. All our services are delivered remotely, so location is no barrier.",
  },
];

/* ─── COMPACT PRICING CARD ─── */

function PricingCard({
  pkg,
  detailPath,
  extraBadge,
}: {
  pkg: typeof logoPackages[0] & { adBudget?: string; platforms?: string };
  detailPath: string;
  extraBadge?: string;
}) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1 ${
        pkg.highlight ? "border-2 border-[#F69D01]" : "border border-gray-200"
      }`}
    >
      {pkg.badge && (
        <div className="bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-bold text-center py-1.5 uppercase tracking-widest">
          {pkg.badge}
        </div>
      )}
      <div className={`p-6 flex flex-col flex-1 ${pkg.badge ? "" : ""}`}>
        <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block mb-3 ${pkg.tagColor}`}>
          {pkg.tag}
        </span>
        <h3 className="text-gray-900 font-bold text-lg mb-1">{pkg.name}</h3>
        <div className="flex items-end gap-1 mb-1">
          <span className="text-3xl font-bold text-gray-900">{pkg.price}</span>
          <span className="text-gray-400 text-sm mb-1">{pkg.sub}</span>
        </div>

        {/* extra info badge */}
        {(pkg.adBudget || pkg.platforms) && (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit">
            <i className={`${pkg.adBudget ? "ri-funds-line" : "ri-layout-grid-line"} text-xs`}></i>
            {pkg.adBudget ?? pkg.platforms}
          </div>
        )}

        <ul className="space-y-2 mb-5 flex-1">
          {pkg.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm">
              <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-[#F69D01]">
                <i className="ri-checkbox-circle-fill text-base"></i>
              </div>
              <span className="text-gray-700">{h}</span>
            </li>
          ))}
        </ul>

        <a
          href="https://wa.link/9m4r50"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-opacity cursor-pointer whitespace-nowrap mb-3 ${
            pkg.highlight
              ? "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white hover:opacity-90"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          <i className="ri-whatsapp-line text-base"></i>
          Get Started
        </a>
        <Link
          to={detailPath}
          className="text-center text-xs font-semibold text-[#F65901] hover:underline cursor-pointer"
        >
          Full pricing details →
        </Link>
      </div>
    </div>
  );
}

/* ─── SERVICE SECTION ─── */

function ServiceSection({
  id,
  icon,
  title,
  subtitle,
  description,
  packages: pkgs,
  detailPath,
  detailLabel,
  bgLight,
}: {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  packages: (typeof logoPackages[0] & { adBudget?: string; platforms?: string })[];
  detailPath: string;
  detailLabel: string;
  bgLight: boolean;
}) {
  return (
    <section id={id} className={`py-16 md:py-20 ${bgLight ? "bg-white" : "bg-gray-50"}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white">
                <i className={`${icon} text-lg`}></i>
              </div>
              <span className="text-[#F65901] text-sm font-bold uppercase tracking-widest">{subtitle}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-lg leading-relaxed">{description}</p>
          </div>
          <Link
            to={detailPath}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            {detailLabel}
            <i className="ri-arrow-right-line text-base"></i>
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pkgs.map((pkg) => (
            <PricingCard key={pkg.name} pkg={pkg} detailPath={detailPath} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN PAGE ─── */

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("logo");
  const sectionIds = ["logo", "ppc", "social"];
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.4 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative bg-[#0d0d0d] py-20 md:py-28 overflow-hidden">
          <div
            className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.14) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,89,1,0.10) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-[#F69D01] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
              <i className="ri-price-tag-3-line"></i>
              Transparent Pricing — No Hidden Fees
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mt-2 mb-5 leading-tight">
              All Our Pricing.<br />
              <span className="text-[#F69D01]">One Place.</span>
            </h1>
            <p className="text-gray-400 text-base max-w-2xl mx-auto mb-10">
              No quotes that ghost you. No mystery invoices. Every service we offer has a clear, upfront price —
              so you know exactly what you&apos;re getting before you commit to a single penny.
            </p>

            {/* Jump-to pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="group flex items-center gap-2.5 bg-white/5 border border-white/10 hover:border-[#F69D01]/50 hover:bg-white/10 px-5 py-3 rounded-full transition-all duration-200 cursor-pointer"
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0">
                    <i className={`${s.icon} text-xs`}></i>
                  </div>
                  <div className="text-left">
                    <div className="text-white text-sm font-semibold whitespace-nowrap">{s.label}</div>
                    <div className="text-[#F69D01] text-xs font-medium whitespace-nowrap">{s.from}</div>
                  </div>
                  <div className="w-4 h-4 flex items-center justify-center text-gray-500 group-hover:text-[#F69D01] transition-colors">
                    <i className="ri-arrow-down-line text-sm"></i>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── STICKY SECTION NAV ── */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0">
              {[
                { id: "logo", label: "Logo Design", icon: "ri-pen-nib-line" },
                { id: "ppc", label: "PPC Advertising", icon: "ri-cursor-line" },
                { id: "social", label: "Social Media", icon: "ri-instagram-line" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollTo(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-200 cursor-pointer ${
                    activeSection === tab.id
                      ? "border-[#F65901] text-[#F65901]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`${tab.icon} text-base`}></i>
                  </div>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── LOGO DESIGN SECTION ── */}
        <ServiceSection
          id="logo"
          icon="ri-pen-nib-line"
          title="Logo Design Packages"
          subtitle="Logo Design"
          description="One-time investment. Your logo is the face of your business — every package is 100% custom, no templates ever."
          packages={logoPackages}
          detailPath="/logo-pricing"
          detailLabel="Full Logo Pricing"
          bgLight
        />

        {/* ── PPC SECTION ── */}
        <ServiceSection
          id="ppc"
          icon="ri-cursor-line"
          title="Pay Per Click (PPC) Packages"
          subtitle="PPC Advertising"
          description="Flat monthly management fee — no percentage-of-spend model. Ad spend is paid directly to Google/Meta by you, completely separately."
          packages={ppcPackages}
          detailPath="/ppc-pricing"
          detailLabel="Full PPC Pricing"
          bgLight={false}
        />

        {/* ── SMM SECTION ── */}
        <ServiceSection
          id="social"
          icon="ri-instagram-line"
          title="Social Media Management Packages"
          subtitle="Social Media Marketing"
          description="Fully managed social presence across Facebook, Instagram, TikTok, LinkedIn, and X. Content approved before every post."
          packages={smmPackages}
          detailPath="/smm-pricing"
          detailLabel="Full SMM Pricing"
          bgLight
        />

        {/* ── WHICH SERVICE IS RIGHT FOR YOU ── */}
        <section className="py-16 bg-[#0d0d0d] relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(246,157,1,0.08) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Not Sure Where to Start?</span>
              <h2 className="text-3xl font-bold text-white mt-2">Which Service Is Right for You?</h2>
              <p className="text-gray-400 text-sm mt-3 max-w-lg mx-auto">Pick the challenge that sounds most like yours and we&apos;ll point you in the right direction.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whoIsItFor.map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-7 flex flex-col hover:-translate-y-1 transition-transform duration-300">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${item.iconBg} text-white mb-5`}>
                    <i className={`${item.icon} text-xl`}></i>
                  </div>
                  <span className="text-xs font-bold text-[#F65901] uppercase tracking-widest mb-2">{item.tag}</span>
                  <h3 className="text-gray-900 font-bold text-base mb-3 leading-snug">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{item.desc}</p>
                  <Link
                    to={item.path}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#F65901] hover:text-[#F69D01] transition-colors cursor-pointer"
                  >
                    See pricing
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-arrow-right-line text-base"></i>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BUNDLE CALLOUT ── */}
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="relative bg-gradient-to-r from-[#0d0d0d] to-[#1a1a1a] rounded-2xl p-8 md:p-10 overflow-hidden">
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(246,157,1,0.15) 0%, transparent 70%)" }}
              />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F69D01]/20">
                      <i className="ri-gift-2-line text-[#F69D01] text-lg"></i>
                    </div>
                    <span className="text-[#F69D01] text-xs font-bold uppercase tracking-widest">Bundle & Save</span>
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-2">Need more than one service?</h3>
                  <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                    Clients who combine Logo Design + PPC or Social Media get priority onboarding and a custom bundle rate.
                    Message us and we&apos;ll put together a quote that works for your budget.
                  </p>
                </div>
                <a
                  href="https://wa.link/9m4r50"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-whatsapp-line text-base"></i>
                  Ask About Bundle Pricing
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <section className="py-8 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "ri-shield-check-line", text: "No Hidden Fees — Ever" },
                { icon: "ri-calendar-line", text: "No Long-Term Contracts" },
                { icon: "ri-user-line", text: "You Own Your Accounts" },
                { icon: "ri-customer-service-2-line", text: "Respond Within 24 Hours" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 text-[#F69D01]">
                    <i className={`${item.icon} text-xl`}></i>
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Pricing Questions Answered</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
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

        {/* ── FINAL CTA ── */}
        <section className="py-16 bg-[#0d0d0d] relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(246,157,1,0.10) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-[#F69D01]/10 border border-[#F69D01]/30 text-[#F69D01] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
              <i className="ri-chat-3-line"></i>
              Let&apos;s Talk
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Not Sure Which Package to Choose?
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto leading-relaxed">
              Drop us a message on WhatsApp — no pushy sales calls, just a straight conversation about what you need and what will actually work for your budget.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.link/9m4r50"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              >
                <i className="ri-whatsapp-line text-lg"></i>
                Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                Send Us a Message
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
