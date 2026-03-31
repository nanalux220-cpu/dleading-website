import { useEffect, useRef, useState } from "react";

const stats = [
  {
    icon: "ri-group-line",
    value: 44,
    suffix: "+",
    label: "Clients Winning Online",
    desc: "Local businesses now getting consistent leads",
    color: "from-[#F69D01] to-[#F65901]",
  },
  {
    icon: "ri-layout-line",
    value: 45,
    suffix: "+",
    label: "Projects Delivered",
    desc: "Websites, campaigns & brands launched",
    color: "from-[#F69D01] to-[#F65901]",
  },
  {
    icon: "ri-calendar-check-line",
    value: 10,
    suffix: "+",
    label: "Years Experience",
    desc: "Helping local businesses grow since 2013",
    color: "from-[#F69D01] to-[#F65901]",
  },
  {
    icon: "ri-star-fill",
    value: 5,
    suffix: ".0",
    label: "Google Rating",
    desc: "Every client left happier than they came",
    color: "from-[#F69D01] to-[#F65901]",
  },
  {
    icon: "ri-percent-line",
    value: 100,
    suffix: "%",
    label: "Client Satisfaction",
    desc: "We don't stop until you're thrilled with results",
    color: "from-[#F69D01] to-[#F65901]",
  },
  {
    icon: "ri-timer-flash-line",
    value: 14,
    suffix: " days",
    label: "Avg. Launch Time",
    desc: "Your new site live and generating leads fast",
    color: "from-[#F69D01] to-[#F65901]",
  },
];

// Ease-out cubic for satisfying deceleration
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number, duration = 2200, active = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(easeOutCubic(progress) * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active]);

  return count;
}

function StatCard({
  icon,
  value,
  suffix,
  label,
  desc,
  active,
  index,
}: {
  icon: string;
  value: number;
  suffix: string;
  label: string;
  desc: string;
  active: boolean;
  index: number;
}) {
  const count = useCountUp(value, 2000 + index * 120, active);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setEntered(true), index * 100);
      return () => clearTimeout(t);
    }
  }, [active, index]);

  return (
    <div
      className={`relative group flex flex-col items-start p-7 rounded-2xl border transition-all duration-700 ${
        entered
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      } border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#F69D01]/40`}
    >
      {/* Subtle corner glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(circle at top left, rgba(246,157,1,0.08) 0%, transparent 60%)" }}
      />

      {/* Icon */}
      <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white mb-5 shrink-0">
        <i className={`${icon} text-xl`}></i>
      </div>

      {/* Counter */}
      <div className="flex items-end gap-1 mb-1">
        <span className="text-5xl font-black text-white leading-none tabular-nums">
          {count}
        </span>
        <span className="text-2xl font-black text-[#F69D01] leading-none mb-1">
          {suffix}
        </span>
      </div>

      {/* Label */}
      <div className="text-white font-bold text-base mb-1">{label}</div>

      {/* Description */}
      <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-[#F69D01]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

export default function StatsSection() {
  const [active, setActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-24 bg-[#0d0d0d] relative overflow-hidden">
      {/* Background glows */}
      <div
        className="absolute top-[-80px] left-[10%] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(246,157,1,0.09) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-60px] right-[10%] w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(246,89,1,0.07) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-[#F65901]"></div>
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">
                By the Numbers
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Real Numbers. <span className="text-[#F69D01]">Real Results.</span>
            </h2>
            <p className="text-gray-500 text-sm mt-3 max-w-lg leading-relaxed">
              Every number here is a real business that gets more calls, bookings, and sales every month.
            </p>
          </div>

          {/* Google rating pill */}
          <div className="shrink-0 flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBC05">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <span className="text-white text-sm font-bold">5.0</span>
            <div className="w-px h-4 bg-white/20"></div>
            <span className="text-gray-400 text-xs">44+ Happy Clients</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} active={active} index={i} />
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Guarantee offer */}
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <p className="text-white font-bold text-base">
              Get 5–15 new enquiries in 30 days
            </p>
            <p className="text-gray-500 text-sm">
              or we keep working with you until you do. Simple.
            </p>
          </div>
          <a
            href="https://wa.link/9m4r50"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <i className="ri-whatsapp-line text-base"></i>
            Get More Customers Now
          </a>
        </div>
      </div>
    </section>
  );
}
