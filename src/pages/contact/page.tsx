import { useState, FormEvent } from "react";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import { getFormActionUrl } from "@/config/forms";
import { stockImages } from "@/config/media";

const contactDetails = [
  {
    icon: "ri-map-pin-2-line",
    title: "Our Office",
    lines: ["Holbeck, Leeds", "West Yorkshire, United Kingdom"],
    link: null,
  },
  {
    icon: "ri-whatsapp-line",
    title: "WhatsApp Us",
    lines: ["+44 742 725 9935"],
    link: "https://wa.link/9m4r50",
  },
  {
    icon: "ri-mail-send-line",
    title: "Email Address",
    lines: ["info@creativedleading.co.uk"],
    link: "mailto:info@creativedleading.co.uk",
  },
  {
    icon: "ri-time-line",
    title: "Working Hours",
    lines: ["Mon – Fri: 9:00am – 6:00pm", "Sat: 10:00am – 3:00pm"],
    link: null,
  },
];

const services = [
  "Custom Website Design",
  "Web & Mobile Development",
  "E-commerce Development",
  "Search Engine Optimization (SEO)",
  "Website Management",
  "Graphic Design Services",
  "Other",
];

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [charCount, setCharCount] = useState(0);
  const [contactErrorMsg, setContactErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContactErrorMsg("");
    const url = getFormActionUrl("contact");
    if (!url) {
      setContactErrorMsg(
        "Contact form is not configured yet. Please email info@creativedleading.co.uk or message us on WhatsApp."
      );
      setStatus("error");
      return;
    }
    setStatus("sending");
    const form = e.currentTarget;
    const data = new URLSearchParams();
    const formData = new FormData(form);
    formData.forEach((value, key) => data.append(key, value.toString()));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString(),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
        setCharCount(0);
      } else {
        setContactErrorMsg("Something went wrong. Please try again or reach us on WhatsApp.");
        setStatus("error");
      }
    } catch {
      setContactErrorMsg("Something went wrong. Please try again or reach us on WhatsApp.");
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* ── Hero banner ── */}
      <section className="relative bg-[#111] overflow-hidden">
        {/* bg image */}
        <img
          src={stockImages.contactHero}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

        {/* radial glow */}
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#F69D01]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 bg-[#F69D01]/20 text-[#F69D01] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <i className="ri-chat-3-line"></i> Let&apos;s Talk
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Get In Touch <br />
              <span className="text-[#F69D01]">With Our Team</span>
            </h1>
            <p className="text-gray-300 text-sm mt-4 max-w-xl leading-relaxed">
              Ready to grow your business online? Our Leeds-based web design &amp; digital marketing team is here and ready to make it happen.
            </p>
          </div>
          {/* Quick trust pills */}
          <div className="flex flex-wrap gap-3 shrink-0">
            {["5★ Google Rated", "#1 in Leeds", "Reply in &lt;2hrs", "Free Consultation"].map((pill) => (
              <span
                key={pill}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-4 py-2 rounded-full whitespace-nowrap"
                dangerouslySetInnerHTML={{ __html: pill }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Main split section ── */}
      <section className="flex flex-col lg:flex-row lg:min-h-[700px]">

        {/* ────────── LEFT PANEL (dark) ────────── */}
        <div className="relative lg:w-[42%] bg-[#111] flex flex-col overflow-hidden">
          {/* decorative glows */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#F69D01]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#F65901]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 p-8 md:p-12 flex-1 flex flex-col">
            {/* heading */}
            <div className="mb-8">
              <p className="text-[#F69D01] text-xs font-semibold uppercase tracking-widest mb-2">Contact Information</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                We&apos;re Always <br />
                <span className="text-[#F69D01]">Here For You</span>
              </h2>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Drop us a message, give us a call, or pop into our Leeds studio. We love meeting new clients.
              </p>
            </div>

            {/* contact info cards */}
            <div className="space-y-4 mb-8">
              {contactDetails.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 bg-white/5 hover:bg-white/10 transition-colors duration-200 rounded-lg p-4 group"
                >
                  <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0">
                    <i className={`${item.icon} text-lg`}></i>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">{item.title}</p>
                    {item.lines.map((line, i) =>
                      item.link && i === 0 ? (
                        <a
                          key={i}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-white font-medium hover:text-[#F69D01] transition-colors cursor-pointer"
                        >
                          {line}
                        </a>
                      ) : (
                        <p key={i} className="text-sm text-white font-medium">{line}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* social links */}
            <div className="mb-8">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Follow Us</p>
              <div className="flex items-center gap-3">
                {[
                  { href: "https://www.facebook.com/share/1RS3XCXbpP/", icon: "ri-facebook-fill", label: "Facebook" },
                  { href: "https://www.instagram.com/mrelvisofori", icon: "ri-instagram-line", label: "Instagram" },
                  { href: "https://www.linkedin.com/in/elvis-ofori-967472322", icon: "ri-linkedin-fill", label: "LinkedIn" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/20 text-gray-300 hover:bg-[#F65901] hover:border-[#F65901] hover:text-white transition-all duration-200 cursor-pointer"
                  >
                    <i className={`${s.icon} text-base`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* divider */}
            <div className="border-t border-white/10 mb-6" />

            {/* CTA WhatsApp */}
            <a
              href="https://wa.link/9m4r50"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5a] transition-colors text-white text-sm font-semibold py-3 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-whatsapp-line text-lg"></i>
              </div>
              Chat on WhatsApp Now
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-arrow-right-line text-base"></i>
              </div>
            </a>
          </div>

          {/* ── Embedded Google Map ── */}
          <div className="relative w-full h-[280px] lg:h-[320px] overflow-hidden">
            {/* dark overlay tint to match the panel */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-[#111]/40 to-transparent" />
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2357.0!2d-1.5554!3d53.7922!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48795c2ed2f84a11%3A0x3df498ba60b2f9c8!2sHolbeck%2C%20Leeds!5e0!3m2!1sen!2suk!4v1680000000000"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(30%) contrast(1.1)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Dleading Creative Designs - Holbeck, Leeds"
            />
            {/* address pill over map */}
            <div className="absolute bottom-4 left-4 z-20 bg-[#111]/90 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <i className="ri-map-pin-2-fill text-[#F69D01] text-sm"></i>
              </div>
              <span className="text-white text-xs font-medium">Holbeck, Leeds, West Yorkshire</span>
            </div>
          </div>
        </div>

        {/* ────────── RIGHT PANEL (form) ────────── */}
        <div className="lg:w-[58%] bg-[#fdf8f4] flex items-start justify-center py-12 px-4 md:px-10 lg:px-14">
          <div className="w-full max-w-2xl">

            {/* form header */}
            <div className="mb-8">
              <span className="inline-block bg-[#F69D01]/15 text-[#F65901] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                Free Consultation
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Fill in the form below and we&apos;ll get back to you within <strong className="text-gray-700">2 business hours</strong>. No obligation, no hard sell — just a friendly chat.
              </p>
            </div>

            {status === "success" ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-orange-100">
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-green-50 mx-auto mb-4">
                  <i className="ri-check-double-line text-green-500 text-4xl"></i>
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">Message Received!</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                  Thanks for reaching out. Our team will get back to you within 2 business hours.
                </p>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setContactErrorMsg("");
                  }}
                  className="mt-6 px-7 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                id="contact-form-dleading"
                className="space-y-5"
              >
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name <span className="text-[#F65901]">*</span></label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      placeholder="Your full name"
                      className="w-full border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email Address <span className="text-[#F65901]">*</span></label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="your@email.com"
                      className="w-full border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+44 000 000 0000"
                      className="w-full border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Company / Website</label>
                    <input
                      type="text"
                      name="company"
                      placeholder="Your company or URL"
                      className="w-full border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Service select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Service You&apos;re Interested In</label>
                  <div className="relative">
                    <select
                      name="service"
                      className="w-full border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all appearance-none text-gray-700 cursor-pointer pr-10"
                    >
                      <option value="">Select a service...</option>
                      {services.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none text-gray-400">
                      <i className="ri-arrow-down-s-line text-lg"></i>
                    </div>
                  </div>
                </div>

                {/* Budget range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Estimated Budget</label>
                  <div className="flex flex-wrap gap-2">
                    {["Under £500", "£500 – £1,000", "£1,000 – £2,500", "£2,500+", "Not Sure"].map((b) => (
                      <label key={b} className="cursor-pointer">
                        <input type="radio" name="budget" value={b} className="sr-only peer" />
                        <span className="inline-block border border-gray-200 bg-white text-gray-600 text-xs font-medium px-4 py-2 rounded-full peer-checked:border-[#F69D01] peer-checked:bg-[#F69D01]/10 peer-checked:text-[#F65901] hover:border-[#F69D01]/50 transition-all cursor-pointer whitespace-nowrap">
                          {b}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Your Message <span className="text-[#F65901]">*</span></label>
                    <span className={`text-xs ${charCount > 450 ? "text-[#F65901]" : "text-gray-400"}`}>{charCount}/500</span>
                  </div>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    maxLength={500}
                    onChange={(e) => setCharCount(e.target.value.length)}
                    placeholder="Tell us about your project, goals, timeline, or any questions you have..."
                    className="w-full border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#F69D01] focus:ring-2 focus:ring-[#F69D01]/20 transition-all resize-none"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <div className="w-5 h-5 flex items-center justify-center text-red-500 shrink-0">
                      <i className="ri-error-warning-line text-base"></i>
                    </div>
                    <p className="text-red-600 text-sm">
                      {contactErrorMsg || "Something went wrong. Please try again or reach us on WhatsApp."}
                    </p>
                  </div>
                )}

                {/* Submit row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    {status === "sending" ? (
                      <>
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-loader-4-line text-base animate-spin"></i>
                        </div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-send-plane-fill text-sm"></i>
                        </div>
                        Send Message
                      </>
                    )}
                  </button>
                  <a
                    href="https://wa.link/9m4r50"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-bold text-white bg-[#25D366] hover:bg-[#1ebe5a] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-whatsapp-line text-base"></i>
                    </div>
                    WhatsApp Instead
                  </a>
                </div>

                {/* privacy note */}
                <p className="text-center text-xs text-gray-400 pt-1">
                  <i className="ri-lock-line mr-1"></i>
                  Your information is safe with us. We&apos;ll never share your details with anyone.
                </p>
              </form>
            )}

            {/* trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-gray-200 pt-6">
              {[
                { icon: "ri-star-fill", label: "5.0 Google Rating", sub: "44+ verified reviews" },
                { icon: "ri-shield-check-line", label: "100% Satisfaction", sub: "Money-back guarantee" },
                { icon: "ri-timer-flash-line", label: "2hr Response", sub: "Mon–Fri, 9am–6pm" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center text-center gap-1">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F69D01]/10 text-[#F69D01]">
                    <i className={`${b.icon} text-base`}></i>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{b.label}</p>
                  <p className="text-xs text-gray-400">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom FAQ strip ── */}
      <section className="bg-white py-14 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-8">
            <span className="text-[#F65901] text-xs font-semibold uppercase tracking-widest">Before You Reach Out</span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-2">Quick Answers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                q: "How quickly will you respond?",
                a: "We respond to all enquiries within 2 business hours during our working hours (Mon–Fri, 9am–6pm).",
              },
              {
                q: "Do you work with small businesses?",
                a: "Absolutely — the majority of our clients are small and medium-sized businesses across Leeds and the UK.",
              },
              {
                q: "Is the initial consultation free?",
                a: "Yes! Your first consultation is 100% free and there's no obligation to proceed afterwards.",
              },
            ].map((item) => (
              <div key={item.q} className="bg-[#fdf8f4] rounded-xl p-6 border border-orange-50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#F69D01]/20 text-[#F69D01] shrink-0 mt-0.5">
                    <i className="ri-question-line text-sm"></i>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{item.q}</h4>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed pl-9">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
