import { useEffect, useRef, useState } from "react";

const reviewers = [
  { initials: "ST", color: "#4285F4", name: "Sarah T.", snippet: "Absolutely fantastic — transformed our site!" },
  { initials: "JR", color: "#EA4335", name: "James R.", snippet: "Best web design company in Leeds, hands down!" },
  { initials: "MW", color: "#34A853", name: "Michael W.", snippet: "Delivered beyond every expectation." },
  { initials: "PS", color: "#FBBC05", name: "Priya S.", snippet: "Sales went up significantly after launch." },
  { initials: "TB", color: "#9C27B0", name: "Tom B.", snippet: "Professional, on time and outstanding results." },
  { initials: "KO", color: "#FF5722", name: "Karen O.", snippet: "Real growth in just the first month!" },
  { initials: "AL", color: "#00BCD4", name: "Amy L.", snippet: "My brand identity looks incredible now." },
  { initials: "DM", color: "#E91E63", name: "Dan M.", snippet: "5 stars isn't enough — truly world class." },
];

function GoogleG() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function StarRow({ size = 16 }: { size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#FBBC05">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function GoogleReviewsBanner() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Continuous marquee scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = () => {
      if (!hovered) {
        posRef.current -= 0.55;
        const halfWidth = track.scrollWidth / 2;
        if (Math.abs(posRef.current) >= halfWidth) posRef.current = 0;
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hovered]);

  const doubled = [...reviewers, ...reviewers];

  return (
    <div className="w-full bg-white border-b border-gray-100 overflow-hidden">
      {/* Top trust strip */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left — rating block */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <GoogleG />
            <span className="text-gray-800 font-bold text-sm">Google Reviews</span>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-gray-900 leading-none">5.0</span>
            <div className="flex flex-col gap-0.5">
              <StarRow size={14} />
              <span className="text-gray-400 text-xs">Based on 8 reviews</span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
          {/* Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-[#F69D01]/10 border border-[#F69D01]/30 rounded-full px-3 py-1.5">
            <i className="ri-award-fill text-[#F69D01] text-sm"></i>
            <span className="text-[#F65901] text-xs font-bold whitespace-nowrap">#1 Rated in Leeds</span>
          </div>
        </div>

        {/* Right — CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          <a
            href="https://share.google/kfJuUauOxEG4F0bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#4285F4] hover:text-[#4285F4] transition-colors cursor-pointer whitespace-nowrap"
          >
            <GoogleG />
            Read Reviews
          </a>
          <a
            href="https://share.google/kfJuUauOxEG4F0bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#F69D01] to-[#F65901] text-sm font-bold text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <i className="ri-star-line text-sm"></i>
            Leave a Review
          </a>
        </div>
      </div>

      {/* Scrolling reviewer strip */}
      <div
        className="relative w-full overflow-hidden py-3 bg-gray-50 border-t border-gray-100"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #f9fafb, transparent)" }}
        />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #f9fafb, transparent)" }}
        />

        <div ref={trackRef} className="flex items-center gap-4 w-max will-change-transform">
          {doubled.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-full pl-1.5 pr-4 py-1.5 shrink-0"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: r.color }}
              >
                {r.initials}
              </div>
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} width="11" height="11" viewBox="0 0 24 24" fill="#FBBC05">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              {/* Name + snippet */}
              <span className="text-gray-700 text-xs font-semibold whitespace-nowrap">{r.name}</span>
              <span className="text-gray-400 text-xs whitespace-nowrap hidden sm:inline">&mdash; &ldquo;{r.snippet}&rdquo;</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
