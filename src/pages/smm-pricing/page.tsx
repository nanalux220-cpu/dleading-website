import { useState } from "react";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import CTASection from "../home/components/CTASection";

const packages = [
  {
    name: "Starter",
    tag: "Great for New Businesses",
    tagColor: "bg-green-100 text-green-700",
    price: "£299",
    period: "/month",
    platforms: "Up to 2 platforms",
    postsPerWeek: "3 posts/week",
    description:
      "Perfect for small businesses taking their first steps on social media — professionally managed, consistent, and on-brand without the agency price tag.",
    features: [
      { text: "Up to 2 platforms managed", included: true },
      { text: "3 posts per week per platform", included: true },
      { text: "Monthly content calendar", included: true },
      { text: "Brand voice & tone setup", included: true },
      { text: "Basic community management", included: true },
      { text: "Monthly performance report", included: true },
      { text: "Hashtag research & strategy", included: true },
      { text: "Story & Reel creation", included: false },
      { text: "Paid social ad campaigns", included: false },
      { text: "Dedicated social strategist", included: false },
      { text: "Bi-weekly strategy calls", included: false },
      { text: "Influencer outreach", included: false },
    ],
    highlight: false,
    cta: "Get Started — £299/mo",
    badge: null,
  },
  {
    name: "Growth",
    tag: "Most Popular",
    tagColor: "bg-orange-100 text-[#F65901]",
    price: "£549",
    period: "/month",
    platforms: "Up to 3 platforms",
    postsPerWeek: "Daily posts",
    description:
      "For growing businesses ready to dominate social feeds with daily content, Stories, Reels, and paid campaigns — everything to build a loyal audience fast.",
    features: [
      { text: "Up to 3 platforms managed", included: true },
      { text: "Daily posts (7/week) per platform", included: true },
      { text: "Monthly content calendar", included: true },
      { text: "Brand voice & tone setup", included: true },
      { text: "Full community management & replies", included: true },
      { text: "Bi-weekly performance reports", included: true },
      { text: "Hashtag research & strategy", included: true },
      { text: "Story & Reel creation (up to 6/mo)", included: true },
      { text: "Paid social ad campaigns", included: true },
      { text: "Dedicated social strategist", included: true },
      { text: "Bi-weekly strategy calls", included: false },
      { text: "Influencer outreach", included: false },
    ],
    highlight: true,
    cta: "Get Started — £549/mo",
    badge: "⭐ Most Popular",
  },
  {
    name: "Authority",
    tag: "Full Brand Domination",
    tagColor: "bg-amber-100 text-amber-700",
    price: "£999",
    period: "/month",
    platforms: "Up to 5 platforms",
    postsPerWeek: "Daily + Stories",
    description:
      "The complete social media engine — all platforms, daily content, paid campaigns, influencer outreach, and a dedicated strategist growing your brand every day.",
    features: [
      { text: "Up to 5 platforms managed", included: true },
      { text: "Daily posts (7/week) per platform", included: true },
      { text: "Monthly content calendar", included: true },
      { text: "Brand voice & tone setup", included: true },
      { text: "Full community management & replies", included: true },
      { text: "Weekly performance reports", included: true },
      { text: "Hashtag research & strategy", included: true },
      { text: "Story & Reel creation (unlimited)", included: true },
      { text: "Paid social ad campaigns", included: true },
      { text: "Dedicated social strategist", included: true },
      { text: "Bi-weekly strategy calls", included: true },
      { text: "Influencer outreach & collaboration", included: true },
    ],
    highlight: false,
    cta: "Get Started — £999/mo",
    badge: null,
  },
];

const platforms = [
  { icon: "ri-facebook-fill", name: "Facebook", color: "text-[#1877F2]" },
  { icon: "ri-instagram-line", name: "Instagram", color: "text-[#E1306C]" },
  { icon: "ri-tiktok-fill", name: "TikTok", color: "text-gray-900" },
  { icon: "ri-linkedin-fill", name: "LinkedIn", color: "text-[#0A66C2]" },
  { icon: "ri-twitter-x-fill", name: "X (Twitter)", color: "text-gray-900" },
];

const contentTypes = [
  { icon: "ri-image-line", title: "Graphics & Carousels", desc: "Eye-catching branded images and multi-slide carousels that stop the scroll and tell your story." },
  { icon: "ri-video-line", title: "Short-Form Video & Reels", desc: "Trending Reels and TikToks crafted to reach new audiences and drive massive organic reach." },
  { icon: "ri-sun-line", title: "Stories & Polls", desc: "Daily Stories to keep your audience engaged with polls, Q&As, countdowns and behind-the-scenes." },
  { icon: "ri-article-line", title: "Captions & Copywriting", desc: "Punchy, brand-aligned captions with strategic calls to action and platform-optimised formatting." },
  { icon: "ri-price-tag-3-line", title: "Promotional Content", desc: "Seasonal campaigns, product launches, sales and offers — all designed to drive real business results." },
  { icon: "ri-user-heart-line", title: "Community Engagement", desc: "Replying to comments, DMs and mentions to build genuine relationships with your audience." },
];

const howItWorks = [
  { step: "01", icon: "ri-team-line", title: "Brand Discovery", desc: "We deep-dive into your brand, target audience, tone of voice, and competitors before creating a single piece of content." },
  { step: "02", icon: "ri-draft-line", title: "Content Strategy", desc: "We build a monthly content calendar tailored to your goals — planned, approved, and scheduled in advance." },
  { step: "03", icon: "ri-edit-box-line", title: "Create & Schedule", desc: "Our designers and copywriters create everything. You review and approve, then we publish at the optimal times." },
  { step: "04", icon: "ri-bar-chart-2-line", title: "Report & Refine", desc: "You receive clear performance reports. We analyse what&apos;s working and constantly refine to grow your audience." },
];

const stats = [
  { value: "2.4×", label: "Average follower growth in first 3 months" },
  { value: "68%", label: "Average increase in post engagement after month 1" },
  { value: "100%", label: "Content created and approved before it goes live" },
  { value: "24hr", label: "Response time for community management & DMs" },
];

const faqs = [
  {
    q: "Do I get to approve content before it's posted?",
    a: "Absolutely. Every month we send you the full content calendar for approval before anything goes live. You can request changes and we'll revise until you're happy. Nothing gets posted without your sign-off.",
  },
  {
    q: "What platforms do you manage?",
    a: "We manage Facebook, Instagram, TikTok, LinkedIn, and X (Twitter). Your package determines how many platforms are included. You choose which ones matter most for your business.",
  },
  {
    q: "Do I need to provide photos or videos?",
    a: "Not necessarily — our team can create graphics, designed posts, and short animations using your brand assets. However, if you can provide real photos or footage of your business, products, or team, it significantly boosts authenticity and engagement.",
  },
  {
    q: "Is the ad spend for paid campaigns included?",
    a: "No — the management fee covers our time to build and manage the ad campaigns. The actual ad spend (money paid to Facebook/Instagram/TikTok) is a separate budget paid directly by you. We recommend a minimum of £150-300/mo for meaningful results.",
  },
  {
    q: "How long before I see results?",
    a: "Organic growth takes time — most clients see noticeable engagement improvements within 4-6 weeks and strong follower growth within 3 months. Paid campaigns can drive immediate traffic and profile visits from day one.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. We work on rolling monthly agreements with 30 days notice. We believe in earning your business each month through results — no long-term lock-ins.",
  },
];

export default function SMMPricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
              <i className="ri-instagram-line"></i>
              Social Media Management Packages
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4 leading-tight">
              Social Media Pricing That <span className="text-[#F69D01]">Drives Real Growth</span>
            </h1>
            <p className="text-gray-400 text-base max-w-2xl mx-auto mb-8">
              Fully managed social media across every major platform — from daily content creation to community management and paid campaigns.
              You focus on running your business, we build your audience.
            </p>

            {/* Platform pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {platforms.map((p) => (
                <div key={p.name} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className={`${p.icon} text-base ${p.color}`}></i>
                  </div>
                  <span className="text-white text-xs font-medium">{p.name}</span>
                </div>
              ))}
            </div>

            {/* Quick stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-5">
                  <div className="text-2xl font-bold text-[#F69D01] mb-1">{s.value}</div>
                  <div className="text-gray-400 text-xs leading-relaxed">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Our Packages</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Choose Your Growth Level</h2>
              <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">All packages include full content creation, scheduling, and community management. You own your accounts — always.</p>
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

                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-bold text-gray-900">{pkg.price}</span>
                      <span className="text-gray-400 text-sm mb-1">{pkg.period}</span>
                    </div>

                    {/* Platform & post count badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-[#F65901] text-xs font-semibold px-3 py-1 rounded-full">
                        <i className="ri-layout-grid-line text-xs"></i>
                        {pkg.platforms}
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                        <i className="ri-edit-2-line text-xs"></i>
                        {pkg.postsPerWeek}
                      </div>
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
                { icon: "ri-calendar-check-line", text: "Content Approved Before Posting" },
                { icon: "ri-user-line", text: "You Own Your Accounts" },
                { icon: "ri-refresh-line", text: "Cancel Any Time" },
                { icon: "ri-customer-service-2-line", text: "Dedicated Account Manager" },
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

        {/* What kind of content we create */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Content We Create</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Every Type of Content. All Included.</h2>
              <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">From thumb-stopping graphics to viral Reels — our team handles the full creative process so your feeds are always fresh.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentTypes.map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#F69D01]/40 transition-colors duration-300"
                >
                  <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white mb-4">
                    <i className={`${item.icon} text-lg`}></i>
                  </div>
                  <h3 className="text-gray-900 font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Our Process</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">How We Manage Your Social Media</h2>
              <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">
                From onboarding to daily posting — a smooth, fully managed process that requires minimal effort on your end.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step) => (
                <div
                  key={step.step}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-[#F69D01]/40 transition-colors duration-300 relative overflow-hidden"
                >
                  <span className="absolute top-4 right-5 text-5xl font-black text-gray-100 leading-none select-none">
                    {step.step}
                  </span>
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

        {/* Why Dleading */}
        <section className="py-16 bg-[#0d0d0d] relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.10) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left — image */}
              <div className="relative order-2 lg:order-1">
                <div className="w-full h-80 md:h-[420px] rounded-xl overflow-hidden">
                  <img
                    src="https://readdy.ai/api/search-image?query=social%20media%20marketing%20team%20creative%20agency%20working%20on%20content%20calendar%20phone%20photography%20instagram%20reels%20filming%20setup%20with%20warm%20orange%20studio%20lighting%20professional%20environment%20modern%20workspace%20Leeds%20UK%20digital%20marketing&width=700&height=500&seq=smmwhy01&orientation=landscape"
                    alt="Social Media Marketing Team"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Floating engagement card */}
                <div
                  className="absolute -bottom-5 -right-4 bg-white rounded-xl px-5 py-4 flex items-center gap-3"
                  style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0">
                    <i className="ri-heart-line text-lg"></i>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">+68%</div>
                    <div className="text-xs text-gray-500">Avg engagement uplift</div>
                  </div>
                </div>
                {/* Floating follower card */}
                <div
                  className="absolute -top-5 -left-4 bg-white rounded-xl px-5 py-4 flex items-center gap-3"
                  style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0">
                    <i className="ri-user-add-line text-lg"></i>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">2.4×</div>
                    <div className="text-xs text-gray-500">Follower growth, 3 months</div>
                  </div>
                </div>
              </div>

              {/* Right — copy */}
              <div className="order-1 lg:order-2">
                <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Why Dleading</span>
                <h2 className="text-3xl font-bold text-white mt-2 mb-5 leading-tight">
                  We Don&apos;t Just Post Content —<br />
                  <span className="text-[#F69D01]">We Build Communities</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-7">
                  Anyone can schedule posts. We build strategies that connect your brand with real people, spark genuine conversations, and turn followers into loyal customers.
                  Every piece of content we create is designed with a purpose — not just to fill a feed.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: "ri-palette-line", text: "On-brand content designed by professional graphic designers — not templates" },
                    { icon: "ri-shield-check-line", text: "You approve everything before it goes live — full control, always" },
                    { icon: "ri-map-pin-line", text: "Leeds-based team that understands UK audiences and culture" },
                    { icon: "ri-bar-chart-line", text: "Data-led decisions — we track what works and double down on it" },
                    { icon: "ri-chat-3-line", text: "We reply to your comments and DMs so your audience feels heard" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F69D01]/10 shrink-0 text-[#F69D01]">
                        <i className={`${item.icon} text-base`}></i>
                      </div>
                      <span className="text-gray-300 text-sm leading-relaxed pt-1">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Platform strip */}
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-center text-gray-400 text-xs font-semibold uppercase tracking-widest mb-6">Platforms We Manage</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: "ri-facebook-fill", name: "Facebook", bg: "bg-[#1877F2]/10", color: "text-[#1877F2]" },
                { icon: "ri-instagram-line", name: "Instagram", bg: "bg-pink-50", color: "text-[#E1306C]" },
                { icon: "ri-tiktok-fill", name: "TikTok", bg: "bg-gray-100", color: "text-gray-900" },
                { icon: "ri-linkedin-fill", name: "LinkedIn", bg: "bg-[#0A66C2]/10", color: "text-[#0A66C2]" },
                { icon: "ri-twitter-x-fill", name: "X / Twitter", bg: "bg-gray-100", color: "text-gray-900" },
              ].map((p) => (
                <div key={p.name} className="flex flex-col items-center gap-2">
                  <div className={`w-14 h-14 flex items-center justify-center rounded-2xl ${p.bg}`}>
                    <i className={`${p.icon} text-2xl ${p.color}`}></i>
                  </div>
                  <span className="text-gray-600 text-xs font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Common Questions</h2>
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

        {/* Pricing comparison teaser */}
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="bg-gradient-to-r from-[#0d0d0d] to-[#1a1a1a] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[#F69D01] text-xs font-bold uppercase tracking-widest mb-2">Complete Pricing Suite</p>
                <h3 className="text-white font-bold text-xl mb-1">Need Logo Design or PPC too?</h3>
                <p className="text-gray-400 text-sm">We offer transparent pricing across all our services — no surprises, ever.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a
                  href="/logo-pricing"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap text-center"
                >
                  Logo Pricing
                </a>
                <a
                  href="/ppc-pricing"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap text-center"
                >
                  PPC Pricing
                </a>
              </div>
            </div>
          </div>
        </section>

        <CTASection
          title="Ready to Grow Your Social Media?"
          subtitle="Message us on WhatsApp and we&apos;ll put together a free social media strategy for your business."
          buttonLabel="Get My Free Social Strategy"
          buttonLink="/contact"
        />
      </main>
      <Footer />
    </div>
  );
}
