import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    icon: "ri-lightbulb-line",
    title: "Free Strategy Call",
    description:
      "We learn about your business, your customers, and your goals. No obligation — just a clear plan for getting you more customers.",
    color: "#F69D01",
    tags: ["Free Consultation", "Goal Setting", "Market Research"],
  },
  {
    number: "02",
    icon: "ri-draft-line",
    title: "We Build Your Plan",
    description:
      "We create a tailored growth plan — Google Ads, SEO, or a new website — whatever gets you customers fastest.",
    color: "#F67D01",
    tags: ["Google Ads", "SEO Strategy", "Website Plan"],
  },
  {
    number: "03",
    icon: "ri-code-s-slash-line",
    title: "We Go Live",
    description:
      "Your campaigns go live or your site launches. Fast turnaround. Everything set up to generate calls and bookings from day one.",
    color: "#F65901",
    tags: ["Fast Launch", "Mobile-First", "SEO Ready"],
  },
  {
    number: "04",
    icon: "ri-bar-chart-line",
    title: "You Get Customers",
    description:
      "Calls come in. Bookings increase. Sales grow. We track everything and report clearly so you always see your results.",
    color: "#E54D01",
    tags: ["More Calls", "More Bookings", "Clear Reporting"],
  },
  {
    number: "05",
    icon: "ri-rocket-line",
    title: "We Scale What Works",
    description:
      "Once leads are flowing, we double down on what's working. More ads, better rankings, more customers every month.",
    color: "#D44301",
    tags: ["Scale Up", "Optimise", "More Revenue"],
  },
  {
    number: "06",
    icon: "ri-customer-service-2-line",
    title: "Ongoing Support",
    description:
      "We don't disappear after launch. We're with you every step — maintaining, optimising, and growing your lead flow.",
    color: "#C33A01",
    tags: ["Dedicated Support", "Monthly Growth", "No Lock-in"],
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export default function HowWeWorkSection() {
  const { ref: sectionRef, inView } = useInView(0.05);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-[#0f0f0f] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#F69D01]"></div>
            <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Our Process</span>
            <div className="h-px w-8 bg-[#F69D01]"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            How We <span className="text-[#F69D01]">Get You Customers</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            A simple, proven process from first call to consistent customers — fast.
          </p>
        </div>

        {/* Timeline — Desktop */}
        <div className="hidden lg:block relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#F69D01]/60 via-[#F65901]/40 to-transparent"></div>

          <div className="space-y-12">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={step.number}
                  className={`relative flex items-center gap-0 transition-all duration-700 ${
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  {/* Left side */}
                  <div className={`w-1/2 ${isLeft ? "pr-16 text-right" : "pr-16 opacity-0 pointer-events-none"}`}>
                    {isLeft && (
                      <StepCard step={step} align="right" />
                    )}
                  </div>

                  {/* Centre node */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#F69D01]/40"
                      style={{ backgroundColor: step.color }}
                    >
                      <i className={`${step.icon} text-white text-xl`}></i>
                    </div>
                    <div className="mt-1 text-[#F69D01] text-xs font-bold tracking-widest">{step.number}</div>
                  </div>

                  {/* Right side */}
                  <div className={`w-1/2 ${!isLeft ? "pl-16" : "pl-16 opacity-0 pointer-events-none"}`}>
                    {!isLeft && (
                      <StepCard step={step} align="left" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline — Mobile / Tablet */}
        <div className="lg:hidden relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#F69D01]/60 via-[#F65901]/40 to-transparent"></div>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`relative flex gap-6 transition-all duration-700 ${
                  inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Node */}
                <div className="flex flex-col items-center shrink-0 z-10">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#F69D01]/30"
                    style={{ backgroundColor: step.color }}
                  >
                    <i className={`${step.icon} text-white text-lg`}></i>
                  </div>
                  <div className="mt-1 text-[#F69D01] text-xs font-bold">{step.number}</div>
                </div>

                {/* Card */}
                <div className="flex-1 pb-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#F69D01]/40 transition-colors duration-300">
                    <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">{step.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-[#F69D01] border border-[#F69D01]/30 whitespace-nowrap"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 text-sm mb-5">Ready to start getting more customers?</p>
          <a
            href="https://wa.link/9m4r50"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <i className="ri-whatsapp-line text-base"></i>
            Book a Free Call Today
          </a>
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, align }: { step: typeof steps[number]; align: "left" | "right" }) {
  return (
    <div
      className={`bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#F69D01]/40 transition-colors duration-300 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-4">{step.description}</p>
      <div className={`flex flex-wrap gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
        {step.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-[#F69D01] border border-[#F69D01]/30 whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
