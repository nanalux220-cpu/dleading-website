import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const services = [
  "More Customers",
  "More Calls",
  "More Bookings",
  "Google Ads",
  "SEO Results",
  "Local Visibility",
  "More Sales",
  "More Revenue",
];

const stats = [
  { value: "44+", label: "Happy Clients" },
  { value: "45+", label: "Projects Done" },
  { value: "10+", label: "Years Experience" },
  { value: "5.0", label: "Google Rating" },
];

export default function HeroSection() {
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTagIndex((i) => (i + 1) % services.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-full min-h-[92vh] flex items-center overflow-hidden bg-[#0d0d0d]">

      {/* Decorative orange glow blobs */}
      <div
        className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(246,157,1,0.18) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-60px] right-[-60px] w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(246,89,1,0.15) 0%, transparent 70%)" }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vertical orange accent line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-48 w-1 bg-gradient-to-b from-transparent via-[#F69D01] to-transparent hidden lg:block" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-[#F69D01] text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#F69D01] animate-pulse inline-block shrink-0"></span>
              <span className="leading-tight">Helping Local Businesses Get More Customers Online</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Get More Customers{" "}
              <br />
              for Your{" "}
              <span className="relative inline-block">
                <span className="text-[#F69D01]">Local Business</span>
                <span
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#F69D01] to-[#F65901]"
                />
              </span>
            </h1>

            {/* Animated service tag */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-gray-400 text-sm">We deliver</span>
              <span
                key={tagIndex}
                className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] animate-[fadeSlide_0.4s_ease-out]"
              >
                {services[tagIndex]}
              </span>
            </div>

            <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-lg">
              We help plumbers, cleaners, restaurants, and local businesses
              generate more calls, bookings, and sales — using Google Ads, SEO,
              and Google Business optimisation.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.link/9m4r50"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              >
                <i className="ri-user-add-line text-base"></i>
                Get More Customers
              </a>
              <a
                href="https://wa.link/9m4r50"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-sm font-bold text-white border border-white/20 hover:border-[#F69D01] hover:text-[#F69D01] transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-whatsapp-line text-base"></i>
                Chat on WhatsApp
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <div className="w-4 h-4 flex items-center justify-center text-[#F69D01]">
                  <i className="ri-shield-check-line"></i>
                </div>
                No Hidden Fees
              </div>
              <div className="w-px h-3 bg-gray-700"></div>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <div className="w-4 h-4 flex items-center justify-center text-[#F69D01]">
                  <i className="ri-time-line"></i>
                </div>
                Results in 30 Days
              </div>
              <div className="w-px h-3 bg-gray-700"></div>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <div className="w-4 h-4 flex items-center justify-center text-[#F69D01]">
                  <i className="ri-map-pin-line"></i>
                </div>
                Based in Leeds, UK
              </div>
            </div>
          </div>

          {/* Right — stats cards + floating service pills */}
          <div className="hidden lg:flex flex-col gap-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="relative rounded-xl p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-white/[0.02] hover:from-[#F69D01]/80 hover:via-[#F67501]/50 hover:to-[#F65901]/20 transition-all duration-500 group cursor-default"
                >
                  {/* ── Corner bracket accents ── */}
                  {/* top-left */}
                  <span className="absolute top-[3px] left-[3px] pointer-events-none z-20">
                    <span className="absolute top-0 left-0 w-3 h-[2px] bg-[#F69D01] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75"></span>
                    <span className="absolute top-0 left-0 h-3 w-[2px] bg-[#F69D01] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75"></span>
                  </span>
                  {/* top-right */}
                  <span className="absolute top-[3px] right-[3px] pointer-events-none z-20">
                    <span className="absolute top-0 right-0 w-3 h-[2px] bg-[#F69D01] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100"></span>
                    <span className="absolute top-0 right-0 h-3 w-[2px] bg-[#F69D01] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100"></span>
                  </span>
                  {/* bottom-left */}
                  <span className="absolute bottom-[3px] left-[3px] pointer-events-none z-20">
                    <span className="absolute bottom-0 left-0 w-3 h-[2px] bg-[#F65901] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150"></span>
                    <span className="absolute bottom-0 left-0 h-3 w-[2px] bg-[#F65901] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150"></span>
                  </span>
                  {/* bottom-right */}
                  <span className="absolute bottom-[3px] right-[3px] pointer-events-none z-20">
                    <span className="absolute bottom-0 right-0 w-3 h-[2px] bg-[#F65901] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-[175ms]"></span>
                    <span className="absolute bottom-0 right-0 h-3 w-[2px] bg-[#F65901] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-[175ms]"></span>
                  </span>

                  {/* ── Inner card ── */}
                  <div className="relative bg-[#111] rounded-[11px] p-5 overflow-hidden">
                    {/* Top-edge shimmer line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F69D01]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {/* Subtle inner radial glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: "radial-gradient(ellipse at top left, rgba(246,157,1,0.07) 0%, transparent 65%)" }}
                    />

                    <div className="relative z-10">
                      <div className="text-3xl font-bold text-white group-hover:text-[#F69D01] transition-colors duration-300 mb-1">{s.value}</div>
                      <div className="text-gray-400 text-xs font-medium">{s.label}</div>
                      {/* Expanding accent line */}
                      <div className="mt-2.5 h-[2px] rounded-full overflow-hidden bg-white/5">
                        <div className="h-full w-8 group-hover:w-full bg-gradient-to-r from-[#F69D01] to-[#F65901] rounded-full transition-all duration-500 ease-out"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Services pill cloud */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-semibold">We Deliver</p>
              <div className="flex flex-wrap gap-2">
                {services.map((s, i) => (
                  <span
                    key={s}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-default transition-colors whitespace-nowrap ${
                      i === tagIndex
                        ? "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white border-transparent"
                        : "border-white/10 text-gray-400 hover:border-[#F69D01]/50 hover:text-[#F69D01]"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Google rating strip */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-[#FBBC05] text-sm"></i>
                ))}
              </div>
              <div className="text-white text-sm font-bold">5.0</div>
              <div className="text-gray-400 text-xs">Google Reviews</div>
              <a
                href="https://share.google/kfJuUauOxEG4F0bot"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs font-semibold text-[#F69D01] hover:underline cursor-pointer whitespace-nowrap"
              >
                Read Reviews →
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
