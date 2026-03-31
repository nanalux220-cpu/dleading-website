import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import CTASection from "../home/components/CTASection";
import { servicesData } from "../../mocks/servicesData";

const services = servicesData;

export default function Services() {
  const [activeService, setActiveService] = useState(services[0].id);
  const selected = services.find((s) => s.id === activeService) ?? services[0];
  const [auditStatus, setAuditStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [charCount, setCharCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && services.find((s) => s.id === hash)) {
      setActiveService(hash);
    }
  }, []);

  const handleAuditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const textarea = form.querySelector("textarea[name='extra_notes']") as HTMLTextAreaElement;
    if (textarea && textarea.value.length > 500) return;

    setAuditStatus("submitting");
    const data = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      data.append(key, value as string);
    });

    try {
      const res = await fetch("https://readdy.ai/api/form/d74mg72vu4krcbn3b8ug", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString(),
      });
      if (res.ok) {
        setAuditStatus("success");
        form.reset();
        setCharCount(0);
      } else {
        setAuditStatus("error");
      }
    } catch {
      setAuditStatus("error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Page hero */}
        <section className="relative bg-[#1a1a1a] py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src="https://creativedleading.co.uk/wp-content/uploads/2025/04/web-design.jpg" alt="" className="w-full h-full object-cover object-top" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center">
            <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">What We Do</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">Services That Get You More Clients</h1>
            <p className="text-gray-300 text-base max-w-2xl mx-auto">
              Every service we offer is built around one outcome — more leads, more calls, and more customers for your local business.
            </p>
          </div>
        </section>

        {/* Services grid overview */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Our Expertise</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Everything You Need to Win Online</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s) => (
                <div
                  key={s.id}
                  id={s.id}
                  onClick={() => navigate(`/services/${s.id}`)}
                  className="rounded-lg overflow-hidden cursor-pointer border-2 border-transparent transition-all duration-300 hover:-translate-y-1 hover:border-[#F65901]/40"
                >
                  <div className="w-full h-44 overflow-hidden">
                    <img src={s.image} alt={s.title} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="p-5 bg-white">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white mb-3">
                      <i className={`${s.icon} text-lg`}></i>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.shortDesc}</p>
                    <div className="mt-3 flex items-center gap-1 text-[#F65901] text-xs font-semibold">
                      Learn More <i className="ri-arrow-right-line"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Selected service detail */}
        <section id="service-detail" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="w-full h-72 md:h-96 rounded-lg overflow-hidden">
                <img src={selected.image} alt={selected.title} className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white mb-5">
                  <i className={`${selected.icon} text-xl`}></i>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{selected.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{selected.fullDesc}</p>
                <ul className="space-y-2 mb-7">
                  {selected.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <i className="ri-checkbox-circle-fill text-[#F69D01] text-lg"></i>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.link/9m4r50"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  Get Started Today
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FREE WEBSITE AUDIT FORM ── */}
        <section id="free-website-audit" className="py-20 bg-[#0d0d0d] relative overflow-hidden">
          <div
            className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.13) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,89,1,0.10) 0%, transparent 70%)" }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="lg:sticky lg:top-28">
                <div className="inline-flex items-center gap-2 bg-[#F69D01]/10 border border-[#F69D01]/30 text-[#F69D01] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
                  <i className="ri-gift-line"></i>
                  100% Free — No Commitment
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
                  Get Your Free <span className="text-[#F69D01]">Website Audit</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Not sure why your website isn&apos;t converting visitors into customers? Our experts will analyse your site from top to bottom and tell you exactly what&apos;s holding it back — completely free, no sales pressure.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: "ri-speed-line", title: "Performance & Speed Check", desc: "We test your site speed on mobile and desktop and highlight exactly what&apos;s slowing you down." },
                    { icon: "ri-search-2-line", title: "SEO Health Review", desc: "Identify missing tags, poor structure, weak keywords and quick wins to improve your Google rankings." },
                    { icon: "ri-smartphone-line", title: "Mobile Usability Audit", desc: "Over 60% of web traffic is mobile — we check your site works flawlessly on every device." },
                    { icon: "ri-shield-check-line", title: "Security & Trust Signals", desc: "SSL, outdated plugins, missing trust signals — we flag anything that puts visitors off or puts you at risk." },
                    { icon: "ri-funds-line", title: "Conversion Optimisation Tips", desc: "We review your calls-to-action, contact forms and layout to identify why visitors aren&apos;t converting." },
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
                    <i className="ri-time-line text-[#F69D01] text-xl"></i>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    <strong className="text-white">Report delivered within 24 hours.</strong> A plain-English PDF with actionable recommendations — yours to keep.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8">
                {auditStatus === "success" ? (
                  <div className="flex flex-col items-center justify-center text-center py-14">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-5">
                      <i className="ri-checkbox-circle-fill text-4xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Audit Request Received!</h3>
                    <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                      Brilliant! Our team will analyse your website and send your free audit report within 24 hours.
                    </p>
                    <button
                      onClick={() => setAuditStatus("idle")}
                      className="mt-6 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Request Your Free Audit</h3>
                      <p className="text-gray-500 text-xs">Fill in the details below — takes under 2 minutes.</p>
                    </div>
                    <form data-readdy-form id="website-audit-form" onSubmit={handleAuditSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                          <input type="text" name="full_name" required placeholder="e.g. James Patel" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                          <input type="email" name="email" required placeholder="you@yourcompany.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                          <input type="tel" name="phone" placeholder="+44 7700 000000" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Website URL <span className="text-red-500">*</span></label>
                          <input type="url" name="website_url" required placeholder="https://yourwebsite.co.uk" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Website Platform <span className="text-red-500">*</span></label>
                        <select name="website_platform" required defaultValue="" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#F69D01] transition-colors cursor-pointer">
                          <option value="" disabled>Select your platform...</option>
                          <option value="WordPress">WordPress</option>
                          <option value="Shopify">Shopify</option>
                          <option value="Wix">Wix</option>
                          <option value="Squarespace">Squarespace</option>
                          <option value="Webflow">Webflow</option>
                          <option value="Custom / Other">Custom / Other</option>
                          <option value="Not sure">Not sure</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">What&apos;s your biggest website challenge? <span className="text-red-500">*</span></label>
                        <select name="biggest_challenge" required defaultValue="" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#F69D01] transition-colors cursor-pointer">
                          <option value="" disabled>Select your challenge...</option>
                          <option value="Not getting enough traffic">Not getting enough traffic</option>
                          <option value="Traffic but no conversions / enquiries">Traffic but no conversions / enquiries</option>
                          <option value="Site loads too slowly">Site loads too slowly</option>
                          <option value="Looks outdated or unprofessional">Looks outdated or unprofessional</option>
                          <option value="Not ranking on Google">Not ranking on Google</option>
                          <option value="Poor mobile experience">Poor mobile experience</option>
                          <option value="Security concerns">Security concerns</option>
                          <option value="Not sure — just want a full review">Not sure — just want a full review</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Which areas should we focus on? <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                        <div className="grid grid-cols-2 gap-2">
                          {["SEO & Rankings","Page Speed","Mobile Usability","Design & UX","Security","Conversion Rate"].map((area) => (
                            <label key={area} className="flex items-center gap-2 cursor-pointer group">
                              <input type="checkbox" name="focus_areas" value={area} className="w-4 h-4 rounded border-gray-300 accent-[#F69D01] cursor-pointer" />
                              <span className="text-xs text-gray-700 group-hover:text-[#F65901] transition-colors">{area}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Anything else you&apos;d like us to look at?
                          <span className="ml-1 text-gray-400 font-normal">({charCount}/500)</span>
                        </label>
                        <textarea name="extra_notes" rows={3} maxLength={500} onChange={(e) => setCharCount(e.target.value.length)} placeholder="e.g. Our contact form stopped working last week..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F69D01] transition-colors resize-none" />
                        {charCount > 500 && <p className="text-red-500 text-xs mt-1">Please keep your notes under 500 characters.</p>}
                      </div>
                      {auditStatus === "error" && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                          <i className="ri-error-warning-line text-red-500 text-base shrink-0"></i>
                          <p className="text-red-600 text-xs">Something went wrong. Please try again or message us on WhatsApp.</p>
                        </div>
                      )}
                      <button type="submit" disabled={auditStatus === "submitting" || charCount > 500} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed">
                        {auditStatus === "submitting" ? <><i className="ri-loader-4-line animate-spin text-base"></i>Sending Your Request...</> : <><i className="ri-send-plane-line text-base"></i>Get My Free Website Audit</>}
                      </button>
                      <p className="text-center text-gray-400 text-xs">No spam, ever. We&apos;ll only contact you about your audit results.</p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <CTASection
          title="Stop Losing Clients to Competitors Online"
          subtitle="Let's get your business in front of local customers who are already searching for what you offer."
          buttonLabel="Get a Free Strategy Call"
          buttonLink="/contact"
        />
      </main>
      <Footer />
    </div>
  );
}
