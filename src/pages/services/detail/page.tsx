import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../../../components/feature/Navbar";
import Footer from "../../../components/feature/Footer";
import { servicesData } from "../../../mocks/servicesData";
import { servicesPricing } from "../../../mocks/servicesPricing";

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const service = servicesData.find((s) => s.id === serviceId);
  const plans = serviceId ? (servicesPricing[serviceId] ?? []) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!service) {
      navigate("/services", { replace: true });
    }
  }, [serviceId, service, navigate]);

  if (!service) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative min-h-[380px] md:min-h-[460px] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16 w-full">
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-5">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <i className="ri-arrow-right-s-line" />
              <Link to="/services" className="hover:text-white transition-colors">Services</Link>
              <i className="ri-arrow-right-s-line" />
              <span className="text-white">{service.title}</span>
            </nav>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0">
                <i className={`${service.icon} text-2xl`} />
              </div>
              <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Our Services</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">{service.title}</h1>
            <p className="text-gray-300 text-sm md:text-base max-w-xl leading-relaxed mb-7">{service.shortDesc}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://wa.link/9m4r50"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
              >
                Get a Free Quote
              </a>
              <Link
                to="/contact"
                className="px-7 py-3 rounded-md text-sm font-bold text-white border border-white/30 hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        {/* ── Overview ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left — full description */}
            <div>
              <p className="text-[#F65901] text-xs font-semibold uppercase tracking-widest mb-3">Overview</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-snug">What We Do</h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">{service.fullDesc}</p>
            </div>

            {/* Right — features checklist */}
            <div>
              <p className="text-[#F65901] text-xs font-semibold uppercase tracking-widest mb-3">What&apos;s Included</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-snug">Key Features</h2>
              <ul className="space-y-3">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0">
                      <i className="ri-check-line text-xs" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Process ── */}
        <section className="bg-[#fafafa] py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <p className="text-[#F65901] text-xs font-semibold uppercase tracking-widest mb-2">How It Works</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Process</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {service.process.map((step, idx) => (
                <div key={step.step} className="relative flex flex-col items-center text-center">
                  {/* Connector line — hidden on last item */}
                  {idx < service.process.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-[calc(50%+24px)] right-0 h-px border-t-2 border-dashed border-orange-200" />
                  )}
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white font-bold text-sm mb-4 shrink-0 z-10">
                    {step.step}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="text-center mb-12">
            <p className="text-[#F65901] text-xs font-semibold uppercase tracking-widest mb-2">Why Us</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why Choose Dleading</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {service.benefits.map((b) => (
              <div key={b.title} className="rounded-lg border border-gray-100 p-6">
                <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01]/15 to-[#F65901]/15 mb-4">
                  <i className={`${b.icon} text-xl text-[#F65901]`} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        {plans.length > 0 && (
          <section className="bg-[#fafafa] py-14 md:py-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="text-center mb-12">
                <p className="text-[#F65901] text-xs font-semibold uppercase tracking-widest mb-2">Transparent Pricing</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Choose Your Plan</h2>
                <p className="text-gray-500 text-sm max-w-lg mx-auto">
                  Whether you&apos;re just starting out or ready to scale, we have a package that fits your budget and goals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative flex flex-col rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 ${
                      plan.highlight
                        ? "bg-gradient-to-b from-[#F69D01] to-[#F65901] text-white"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    {/* Tag badge */}
                    <div className={`px-6 pt-6 pb-0`}>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${
                          plan.highlight
                            ? "bg-white/20 text-white"
                            : plan.tag === "Great Value"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {plan.tag}
                      </span>
                      <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs leading-relaxed mb-5 ${plan.highlight ? "text-white/80" : "text-gray-500"}`}>
                        {plan.description}
                      </p>

                      {/* Price */}
                      <div className="flex items-end gap-1 mb-6">
                        <span className={`text-4xl font-black leading-none ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                          {plan.price}
                        </span>
                        {plan.period && plan.period !== "one-time" && plan.period !== "quote" && (
                          <span className={`text-sm font-medium mb-1 ${plan.highlight ? "text-white/70" : "text-gray-400"}`}>
                            {plan.period}
                          </span>
                        )}
                        {plan.period === "one-time" && (
                          <span className={`text-xs mb-1 ${plan.highlight ? "text-white/70" : "text-gray-400"}`}>one-time</span>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className={`mx-6 mb-5 h-px ${plan.highlight ? "bg-white/20" : "bg-gray-100"}`} />

                    {/* Features list */}
                    <div className="px-6 flex-1">
                      <ul className="space-y-3 mb-6">
                        {plan.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 flex items-center justify-center rounded-full shrink-0 mt-0.5 ${
                              plan.highlight ? "bg-white/20" : "bg-gradient-to-br from-[#F69D01]/15 to-[#F65901]/15"
                            }`}>
                              <i className={`ri-check-line text-[10px] ${plan.highlight ? "text-white" : "text-[#F65901]"}`} />
                            </div>
                            <span className={`text-xs leading-relaxed ${plan.highlight ? "text-white/90" : "text-gray-600"}`}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA button */}
                    <div className="px-6 pb-7 mt-auto">
                      <a
                        href="https://wa.link/9m4r50"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block w-full text-center py-3 rounded-md text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                          plan.highlight
                            ? "bg-white text-[#F65901] hover:bg-gray-50"
                            : "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white hover:opacity-90"
                        }`}
                      >
                        {plan.price === "Custom" ? "Get a Custom Quote" : "Get Started"}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <p className="text-center text-xs text-gray-400 mt-8">
                Not sure which plan fits? <a href="https://wa.link/9m4r50" target="_blank" rel="noopener noreferrer" className="text-[#F65901] hover:underline cursor-pointer">Chat with us on WhatsApp</a> — we&apos;ll help you choose the right option.
              </p>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="bg-gradient-to-r from-[#F69D01] to-[#F65901] py-14 md:py-16">
          <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Get Started?</h2>
            <p className="text-white/80 text-sm md:text-base mb-8">
              Let&apos;s talk about how our <strong className="text-white">{service.title}</strong> service can help grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.link/9m4r50"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 rounded-md text-sm font-bold text-[#F65901] bg-white hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="px-8 py-3 rounded-md text-sm font-bold text-white border-2 border-white/50 hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
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
