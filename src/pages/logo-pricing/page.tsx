import { useState } from "react";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import CTASection from "../home/components/CTASection";

const packages = [
  {
    name: "Starter",
    tag: "Perfect for New Businesses",
    tagColor: "bg-green-100 text-green-700",
    price: "£79",
    description:
      "Everything a brand-new business or sole trader needs to get a professional identity up and running — without breaking the bank.",
    features: [
      { text: "1 unique logo concept", included: true },
      { text: "2 rounds of revisions", included: true },
      { text: "PNG & JPG files (web-ready)", included: true },
      { text: "Basic brand colour palette", included: true },
      { text: "5 business day delivery", included: true },
      { text: "Social media profile images", included: false },
      { text: "Full source files (AI, EPS, SVG)", included: false },
      { text: "Brand guidelines document", included: false },
      { text: "Business card design", included: false },
      { text: "Social media kit", included: false },
    ],
    highlight: false,
    cta: "Get Started — £79",
    badge: null,
  },
  {
    name: "Professional",
    tag: "Most Popular",
    tagColor: "bg-orange-100 text-[#F65901]",
    price: "£199",
    description:
      "For growing businesses that need a polished, versatile brand identity with full file formats and more creative options.",
    features: [
      { text: "3 unique logo concepts", included: true },
      { text: "Unlimited revisions", included: true },
      { text: "PNG & JPG files (web-ready)", included: true },
      { text: "Brand colour palette + typography", included: true },
      { text: "3 business day delivery", included: true },
      { text: "Social media profile images", included: true },
      { text: "Full source files (AI, EPS, SVG)", included: true },
      { text: "Brand guidelines document", included: false },
      { text: "Business card design", included: false },
      { text: "Social media kit", included: false },
    ],
    highlight: true,
    cta: "Get Started — £199",
    badge: "⭐ Most Popular",
  },
  {
    name: "Brand Identity",
    tag: "Complete Package",
    tagColor: "bg-purple-100 text-purple-700",
    price: "£399",
    description:
      "A full end-to-end brand identity package for businesses serious about making a lasting impression across every touchpoint.",
    features: [
      { text: "5 unique logo concepts", included: true },
      { text: "Unlimited revisions", included: true },
      { text: "PNG & JPG files (web-ready)", included: true },
      { text: "Brand colour palette + typography", included: true },
      { text: "Express 2 business day delivery", included: true },
      { text: "Social media profile images", included: true },
      { text: "Full source files (AI, EPS, SVG)", included: true },
      { text: "Brand guidelines document", included: true },
      { text: "Business card design", included: true },
      { text: "Social media kit (6 templates)", included: true },
    ],
    highlight: false,
    cta: "Get Started — £399",
    badge: null,
  },
];

const faqs = [
  {
    q: "What file formats will I receive?",
    a: "The Starter pack includes web-ready PNG & JPG files. The Professional and Brand Identity packages include full vector source files (AI, EPS, SVG) so your logo can be scaled to any size without quality loss — perfect for print and large-format uses.",
  },
  {
    q: "How many revision rounds are included?",
    a: "The Starter package includes 2 rounds of revisions. Professional and Brand Identity packages both include unlimited revisions until you are 100% happy.",
  },
  {
    q: "How long does it take?",
    a: "The Starter pack is delivered within 5 business days. Professional within 3 business days. Brand Identity within 2 business days (express). Timelines begin once we receive your brief and payment.",
  },
  {
    q: "Can I upgrade my package later?",
    a: "Absolutely! If you start with the Starter package and want to upgrade, we'll simply charge the difference. We want to grow with your business.",
  },
  {
    q: "Do I own the logo once it's completed?",
    a: "Yes — once final payment is made, you own full commercial rights to your logo. It's yours entirely.",
  },
];

export default function LogoPricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative bg-[#0d0d0d] py-20 md:py-28 overflow-hidden">
          <div
            className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.18) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-40px] left-[-40px] w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,89,1,0.14) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-[#F69D01] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
              <i className="ri-pen-nib-line"></i>
              Logo Design Packages
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4 leading-tight">
              Simple, Transparent <span className="text-[#F69D01]">Pricing</span>
            </h1>
            <p className="text-gray-400 text-base max-w-xl mx-auto mb-6">
              Professional logo design packages for every budget — from brand-new startups to established businesses ready for a full rebrand.
            </p>
            {/* New business callout */}
            <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/30 text-green-400 text-sm font-semibold px-5 py-2.5 rounded-full">
              <i className="ri-seedling-line"></i>
              New Business? Our Starter pack is just £79 — no hidden fees, ever.
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
                    pkg.highlight
                      ? "border-2 border-[#F69D01]"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Most popular ribbon */}
                  {pkg.badge && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-bold text-center py-1.5 uppercase tracking-widest">
                      {pkg.badge}
                    </div>
                  )}

                  <div className={`p-7 ${pkg.badge ? "pt-10" : ""}`}>
                    {/* Tag */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${pkg.tagColor}`}>
                      {pkg.tag}
                    </span>

                    {/* Name & Price */}
                    <h2 className="text-gray-900 font-bold text-xl mt-4 mb-1">{pkg.name}</h2>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-4xl font-bold text-gray-900">{pkg.price}</span>
                      <span className="text-gray-400 text-sm mb-1">one-time</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">{pkg.description}</p>

                    {/* CTA */}
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

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-5"></div>

                    {/* Features */}
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

            {/* Reassurance strip */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "ri-shield-check-line", text: "No Hidden Fees" },
                { icon: "ri-refresh-line", text: "Satisfaction Guaranteed" },
                { icon: "ri-copyright-line", text: "You Own the Rights" },
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

        {/* Why choose section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Why Dleading</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">What Makes Our Logos Different</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "ri-palette-line", title: "100% Custom Design", desc: "Every logo is created from scratch — no templates, no clip art. Your brand is unique and your logo will be too." },
                { icon: "ri-focus-3-line", title: "Strategy-Led Creativity", desc: "We study your industry, competitors and target audience before designing, so your logo communicates the right message." },
                { icon: "ri-device-line", title: "Works Everywhere", desc: "Your logo will look great on everything — websites, business cards, social media, signage, uniforms and beyond." },
                { icon: "ri-time-line", title: "Fast Turnaround", desc: "We respect your time. Even our entry-level Starter pack is delivered within 5 business days." },
                { icon: "ri-heart-line", title: "Designed in Leeds", desc: "A local team that understands UK businesses, the Leeds market and what resonates with British audiences." },
                { icon: "ri-refresh-line", title: "Revise Until Perfect", desc: "Professional and Brand Identity packages include unlimited revisions. We won't stop until you love it." },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#F69D01]/40 transition-colors duration-300">
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

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Common Questions</h2>
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

        <CTASection
          title="Ready to Build Your Brand?"
          subtitle="Message us on WhatsApp and we'll get your logo started today."
          buttonLabel="Start My Logo — From £79"
          buttonLink="/contact"
        />
      </main>
      <Footer />
    </div>
  );
}
