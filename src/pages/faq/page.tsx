import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";

const categories = ["All", "Web Design", "SEO & Marketing", "Pricing", "Process", "Support"] as const;
type Category = typeof categories[number];

interface FAQ {
  q: string;
  a: string;
  category: Exclude<Category, "All">;
}

const faqs: FAQ[] = [
  // ── Web Design ──
  {
    category: "Web Design",
    q: "How much does a website cost in Leeds?",
    a: "Website costs in Leeds vary based on complexity. A professional small business website typically starts from £500–£1,500. E-commerce stores, custom web applications, or larger multi-page sites range from £1,500–£5,000+. At Dleading Creative Designs, we offer transparent, fixed-price packages tailored to your budget — no hidden fees. Contact us for a free, no-obligation quote.",
  },
  {
    category: "Web Design",
    q: "How long does it take to build a website in Leeds?",
    a: "Most small business websites are completed within 7–21 days from when we receive your content and approval. E-commerce stores typically take 2–5 weeks. Larger custom projects can take 4–8 weeks. Timelines depend on how quickly we receive your content, feedback, and sign-offs. We always agree a target delivery date before we start.",
  },
  {
    category: "Web Design",
    q: "Do you build WordPress websites?",
    a: "Yes — WordPress is one of our primary platforms. We build fully custom WordPress sites (not off-the-shelf templates) that are fast, secure, mobile-responsive, and easy for you to update yourself. We also provide WordPress training and ongoing management if required.",
  },
  {
    category: "Web Design",
    q: "Do you build Shopify or WooCommerce stores?",
    a: "Absolutely. We build both Shopify and WooCommerce e-commerce stores. Shopify is ideal for businesses wanting an easy-to-manage hosted solution, while WooCommerce on WordPress gives more flexibility and ownership. We'll recommend the right platform based on your products, budget, and long-term goals.",
  },
  {
    category: "Web Design",
    q: "Will my website be mobile-friendly and responsive?",
    a: "Yes, every website we build is fully responsive — meaning it automatically adapts to look great and work perfectly on all devices including mobiles, tablets, and desktops. With over 60% of UK web traffic now on mobile, this is non-negotiable for us. All our sites are also tested across major browsers before launch.",
  },
  {
    category: "Web Design",
    q: "Can you redesign my existing website?",
    a: "Yes, website redesigns are one of our most popular services. Whether you have an outdated look, poor mobile experience, slow loading speeds, or simply want a fresh new brand direction, we can redesign your site while preserving your existing SEO rankings and content where possible.",
  },
  {
    category: "Web Design",
    q: "What do I need to provide to get my website built?",
    a: "To get started, we typically need: your logo and brand assets, your written content (text for each page), any images or photos you want to use, and details about your services/products. We can help with copywriting, photography sourcing, and branding if you don't have these yet — just let us know.",
  },
  {
    category: "Web Design",
    q: "Will I be able to update my website myself after launch?",
    a: "Yes. We build all our websites on platforms that give you full control — WordPress sites come with a simple dashboard and we provide basic training. If you'd rather leave the updates to us, we offer affordable monthly website management plans that cover content updates, plugin maintenance, security monitoring, and backups.",
  },

  // ── SEO & Marketing ──
  {
    category: "SEO & Marketing",
    q: "How long does SEO take to show results in Leeds?",
    a: "SEO is a long-term strategy. Most businesses in Leeds begin to see measurable improvements in Google rankings and organic traffic within 3–6 months of consistent SEO work. Competitive industries may take 6–12 months. We provide monthly reports so you can track progress clearly. Unlike paid ads, SEO builds lasting, compounding results over time.",
  },
  {
    category: "SEO & Marketing",
    q: "Can you get my business to number 1 on Google in Leeds?",
    a: "We can't ethically guarantee a #1 ranking — anyone who promises this is not being honest with you. What we can guarantee is a data-driven, proven SEO strategy that has helped multiple Leeds businesses achieve page 1 rankings for their target keywords. Our 5.0 Google rating and 44+ client results speak for themselves.",
  },
  {
    category: "SEO & Marketing",
    q: "What is local SEO and does my Leeds business need it?",
    a: "Local SEO optimises your website and Google Business Profile to appear in searches like 'web designer Leeds' or 'plumber near me'. If you serve customers in a specific geographic area, local SEO is essential. It helps you appear in the Google Map Pack (the 3 map results at the top of local searches) — the highest-converting placement in local search.",
  },
  {
    category: "SEO & Marketing",
    q: "Do you run Google Ads and PPC campaigns?",
    a: "Yes. We create and manage Google Ads (PPC) campaigns for businesses across Leeds and the UK. Our PPC management includes keyword research, ad copywriting, landing page optimisation, bid management, and monthly reporting. We focus on maximising your return on ad spend (ROAS) rather than just impressions or clicks.",
  },
  {
    category: "SEO & Marketing",
    q: "Do you manage social media for businesses in Leeds?",
    a: "Yes — we offer full social media management including content creation, scheduling, community management, and paid social campaigns across Instagram, Facebook, TikTok, and LinkedIn. We tailor our strategies to your audience and business goals, and provide monthly performance reports.",
  },
  {
    category: "SEO & Marketing",
    q: "What's the difference between SEO and PPC?",
    a: "SEO (Search Engine Optimisation) improves your website's organic (free) rankings on Google over time — it's a long-term investment that compounds. PPC (Pay-Per-Click) lets you appear at the top of Google instantly by paying per click — great for immediate leads. Most businesses benefit from both: PPC for quick wins and SEO for long-term, sustainable growth.",
  },

  // ── Pricing ──
  {
    category: "Pricing",
    q: "How much does SEO cost per month in the UK?",
    a: "Our SEO packages start from £299/month for local SEO targeting Leeds and surrounding areas. Comprehensive national SEO campaigns typically range from £500–£1,500/month depending on competitiveness and scope. All our SEO plans include a monthly report and a dedicated account manager. View our full pricing on the Pricing page.",
  },
  {
    category: "Pricing",
    q: "Do you require a deposit before starting work?",
    a: "Yes, we require a 50% non-refundable deposit before work begins. This secures your project slot and covers our initial research, planning, and design work. The remaining 50% is due upon project completion, before the website goes live or final files are delivered.",
  },
  {
    category: "Pricing",
    q: "Are your prices inclusive of VAT?",
    a: "All prices quoted are exclusive of VAT unless stated otherwise. VAT will be added at the prevailing UK rate where applicable. We clearly itemise VAT on all invoices.",
  },
  {
    category: "Pricing",
    q: "Do you offer payment plans?",
    a: "For larger projects, we can discuss a staged payment plan — for example, splitting the project into milestone-based payments. This is assessed on a case-by-case basis. Please mention this when enquiring and we'll do our best to accommodate your budget.",
  },
  {
    category: "Pricing",
    q: "What's included in your website management plans?",
    a: "Our website management plans include: regular content updates, WordPress/plugin updates, security monitoring and malware scanning, daily backups, uptime monitoring, monthly performance reports, and priority support. Plans start from £49/month. This saves you the hassle of keeping your site secure and up-to-date.",
  },

  // ── Process ──
  {
    category: "Process",
    q: "What is your web design process from start to finish?",
    a: "Our process has 6 stages: (1) Discovery call — we learn about your business and goals. (2) Proposal — we send a detailed quote and timeline. (3) Design — we create your design concepts for approval. (4) Development — we build the approved design. (5) Review — you test the site and we make revisions. (6) Launch — we go live and hand over everything you need.",
  },
  {
    category: "Process",
    q: "Do you work with clients across the UK or just in Leeds?",
    a: "While we're based in Holbeck, Leeds, we work with clients across the whole of the UK — and internationally. Most of our collaboration happens remotely via video calls, email, and shared project documents. However, if you're local to Leeds and prefer to meet in person, we're always happy to arrange a face-to-face meeting.",
  },
  {
    category: "Process",
    q: "How many revisions do I get on my website design?",
    a: "We include 2 rounds of revisions on web design per page. Each revision round covers reasonable amends to the approved direction — such as layout tweaks, colour adjustments, and content changes. A complete change of concept or style direction after approval would be treated as a new brief. Additional revision rounds can be purchased at our standard rate.",
  },
  {
    category: "Process",
    q: "Can I see examples of your work before hiring you?",
    a: "Yes — visit our Portfolio page to see a selection of recent projects, including websites, logos, and branding work. We also have 44+ verified Google Reviews from happy clients across Leeds and the UK. We're proud of our 5.0 Google rating and are happy to provide references on request.",
  },

  // ── Support ──
  {
    category: "Support",
    q: "What happens after my website launches?",
    a: "After launch we provide a 30-day post-launch support period for any bugs or issues related to our build. We'll also walk you through how to use your website and provide any training needed. After 30 days, ongoing support is available through our website management plans.",
  },
  {
    category: "Support",
    q: "Do you provide website hosting?",
    a: "We don't host websites directly, but we can recommend and set up reliable UK-based hosting with providers like Kinsta, WP Engine, or SiteGround. We'll handle all the technical setup so you don't need to worry about it. Hosting costs are separate to our design fees and typically range from £10–£50/month depending on your needs.",
  },
  {
    category: "Support",
    q: "What if my website has a problem after launch?",
    a: "If you're on one of our website management plans, we'll fix any issues as part of your plan. If you're not on a plan, we offer one-off support at our standard hourly rate. For any urgent issues within 30 days of launch that are directly related to our build, we'll address these free of charge.",
  },
  {
    category: "Support",
    q: "Do you provide website training after handover?",
    a: "Yes — we provide a training walkthrough (via video call or in person for Leeds-based clients) covering how to update content, add blog posts, manage products, and handle basic maintenance tasks. We also record the session so you have a reference to go back to. Written guides are available on request.",
  },
];

// Build schema.org JSON-LD
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

function AccordionItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? "border-[#F69D01]/40 bg-[#fffbf2]" : "border-gray-100 bg-white hover:border-gray-200"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 px-5 py-4 text-left cursor-pointer group"
        aria-expanded={isOpen}
      >
        <div className={`w-6 h-6 flex items-center justify-center rounded-full shrink-0 mt-0.5 transition-colors duration-200 ${isOpen ? "bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-orange-50 group-hover:text-[#F69D01]"}`}>
          <i className={`ri-${isOpen ? "subtract" : "add"}-line text-sm`}></i>
        </div>
        <span className={`flex-1 text-sm font-semibold leading-snug transition-colors duration-200 ${isOpen ? "text-[#F65901]" : "text-gray-800 group-hover:text-gray-900"}`}>
          {faq.q}
        </span>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pl-[3.75rem]">
          <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
          {faq.category === "Web Design" && (
            <Link to="/contact" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#F65901] hover:underline cursor-pointer">
              Get a free quote <i className="ri-arrow-right-line"></i>
            </Link>
          )}
          {faq.category === "SEO & Marketing" && (
            <Link to="/pricing" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#F65901] hover:underline cursor-pointer">
              View SEO pricing <i className="ri-arrow-right-line"></i>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  // Inject Schema.org JSON-LD + meta tags
  useEffect(() => {
    const prev = document.getElementById("faq-schema");
    if (prev) prev.remove();
    const script = document.createElement("script");
    script.id = "faq-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    const prevTitle = document.title;
    document.title = "Web Design Leeds FAQ | Dleading Creative Designs";

    return () => {
      document.getElementById("faq-schema")?.remove();
      document.title = prevTitle;
    };
  }, []);

  const filtered = useMemo(() => {
    return faqs.filter((f, _i) => {
      const matchCat = activeCategory === "All" || f.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const toggle = (idx: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const expandAll = () => setOpenIds(new Set(filtered.map((_, i) => i)));
  const collapseAll = () => setOpenIds(new Set());

  const categoryCount = (cat: Category) =>
    cat === "All" ? faqs.length : faqs.filter((f) => f.category === cat).length;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Schema.org is injected via useEffect above */}

      {/* ── Hero ── */}
      <section className="relative bg-[#111] overflow-hidden py-16 md:py-24">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(246,157,1,0.13) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(246,89,1,0.10) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#F69D01]/15 text-[#F69D01] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <i className="ri-question-answer-line"></i> Help Centre
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Frequently Asked <br />
            <span className="text-[#F69D01]">Questions</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto mb-8">
            Everything you need to know about web design, SEO, pricing, and working with our Leeds-based creative agency.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 pointer-events-none">
              <i className="ri-search-line text-base"></i>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions... e.g. how much does a website cost"
              className="w-full bg-white/10 backdrop-blur-sm border border-white/15 text-white placeholder-gray-500 text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#F69D01]/60 focus:bg-white/15 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                <i className="ri-close-line text-base"></i>
              </button>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { value: `${faqs.length}`, label: "Questions Answered" },
              { value: "5.0★", label: "Google Rating" },
              { value: "44+", label: "Happy Clients" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-bold text-[#F69D01]">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="py-12 md:py-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#F65901]"
                }`}
              >
                {cat}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeCategory === cat ? "bg-white/25 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {categoryCount(cat)}
                </span>
              </button>
            ))}
          </div>
          {/* Expand/Collapse controls — separate row so they never crowd the tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button onClick={expandAll} className="text-xs text-gray-400 hover:text-[#F65901] cursor-pointer whitespace-nowrap transition-colors">
              Expand all
            </button>
            <span className="text-gray-300 text-xs">·</span>
            <button onClick={collapseAll} className="text-xs text-gray-400 hover:text-[#F65901] cursor-pointer whitespace-nowrap transition-colors">
              Collapse all
            </button>
          </div>

          {/* Results count */}
          {(search || activeCategory !== "All") && (
            <p className="text-xs text-gray-400 mb-4">
              Showing <strong className="text-gray-700">{filtered.length}</strong> question{filtered.length !== 1 ? "s" : ""}
              {search && <> matching &quot;<strong className="text-gray-700">{search}</strong>&quot;</>}
              {activeCategory !== "All" && <> in <strong className="text-gray-700">{activeCategory}</strong></>}
            </p>
          )}

          {/* FAQ accordion */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((faq, i) => (
                <AccordionItem
                  key={`${faq.category}-${i}`}
                  faq={faq}
                  isOpen={openIds.has(i)}
                  onToggle={() => toggle(i)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
                <i className="ri-search-line text-gray-400 text-2xl"></i>
              </div>
              <p className="font-semibold text-gray-800 mb-1">No results found</p>
              <p className="text-gray-500 text-sm">Try a different search term or browse all categories.</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="mt-4 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* ── Still have questions CTA ── */}
          <div className="mt-14 rounded-2xl overflow-hidden">
            <div className="bg-[#111] p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(246,157,1,0.12) 0%, transparent 70%)" }} />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <p className="text-[#F69D01] text-xs font-semibold uppercase tracking-widest mb-2">Still Not Sure?</p>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Didn&apos;t find your answer?</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Drop us a message or chat on WhatsApp — our Leeds team responds within 2 hours and we&apos;re happy to answer anything before you commit.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-mail-send-line text-base"></i>
                    Ask a Question
                  </Link>
                  <a
                    href="https://wa.link/9m4r50"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#1ebe5a] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-whatsapp-line text-base"></i>
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
            {/* Trust strip */}
            <div className="bg-[#fdf8f4] border border-t-0 border-orange-100 rounded-b-2xl px-8 py-4 flex flex-wrap items-center gap-6">
              {[
                { icon: "ri-star-fill text-[#FBBC05]", text: "5.0 Google Rating" },
                { icon: "ri-timer-flash-line text-[#F69D01]", text: "Reply within 2 hours" },
                { icon: "ri-map-pin-line text-[#F69D01]", text: "Based in Leeds, UK" },
                { icon: "ri-shield-check-line text-[#F69D01]", text: "Free, no-obligation quote" },
              ].map((t) => (
                <div key={t.text} className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`${t.icon} text-sm`}></i>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{t.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related pages */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Our Services", path: "/services", icon: "ri-service-line" },
              { label: "View Pricing", path: "/pricing", icon: "ri-price-tag-3-line" },
              { label: "Our Portfolio", path: "/portfolio", icon: "ri-layout-masonry-line" },
              { label: "Get a Quote", path: "/contact", icon: "ri-send-plane-line" },
            ].map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#F69D01]/40 hover:bg-[#fffbf2] transition-all duration-200 cursor-pointer group text-center"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-[#F69D01]/15 text-gray-400 group-hover:text-[#F69D01] transition-colors duration-200">
                  <i className={`${l.icon} text-base`}></i>
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-[#F65901] transition-colors duration-200 whitespace-nowrap">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
