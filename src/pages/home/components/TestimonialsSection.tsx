import { useState, useEffect, useRef } from "react";

const googleReviews = [
  {
    name: "Mark Evans",
    initials: "ME",
    color: "#4285F4",
    date: "1 week ago",
    rating: 5,
    text: "Started getting calls within days of the new site going live. Best money I've spent on my plumbing business. Highly recommend.",
    local: "Local Guide · 9 reviews",
  },
  {
    name: "Sarah Thompson",
    initials: "ST",
    color: "#EA4335",
    date: "2 weeks ago",
    rating: 5,
    text: "Now we get customers every week without chasing referrals. The Google Ads campaign paid for itself in the first month.",
    local: "Local Guide · 12 reviews",
  },
  {
    name: "James Richardson",
    initials: "JR",
    color: "#34A853",
    date: "1 month ago",
    rating: 5,
    text: "We went from zero Google presence to page one in Leeds. The phone hasn't stopped ringing. Best investment I've made for my business.",
    local: "5 reviews",
  },
  {
    name: "Priya Sharma",
    initials: "PS",
    color: "#FBBC05",
    date: "2 months ago",
    rating: 5,
    text: "Our cleaning business was struggling to get bookings. After they optimised our Google Business profile and ran ads, we're fully booked two weeks ahead. Game changer.",
    local: "Local Guide · 8 reviews",
  },
  {
    name: "Tom Bradley",
    initials: "TB",
    color: "#9C27B0",
    date: "3 months ago",
    rating: 5,
    text: "More calls, more bookings, more sales. That's exactly what they promised and exactly what we got. Simple as that.",
    local: "7 reviews",
  },
  {
    name: "Karen Osei",
    initials: "KO",
    color: "#FF5722",
    date: "3 months ago",
    rating: 5,
    text: "Three months in and we're generating consistent leads every week. These guys actually focus on results, not just deliverables.",
    local: "Local Guide · 15 reviews",
  },
];

function StarRating({ count, size = "text-sm" }: { count: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <i
          key={i}
          className={`${i < count ? "ri-star-fill text-[#FBBC05]" : "ri-star-line text-gray-300"} ${size}`}
        ></i>
      ))}
    </div>
  );
}

function GoogleLogo() {
  return (
    <div className="flex items-center gap-1">
      <span style={{ fontFamily: "Product Sans, Arial, sans-serif", fontSize: "18px", fontWeight: 700 }}>
        <span style={{ color: "#4285F4" }}>G</span>
        <span style={{ color: "#EA4335" }}>o</span>
        <span style={{ color: "#FBBC05" }}>o</span>
        <span style={{ color: "#4285F4" }}>g</span>
        <span style={{ color: "#34A853" }}>l</span>
        <span style={{ color: "#EA4335" }}>e</span>
      </span>
    </div>
  );
}

export default function TestimonialsSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const visibleCount = 3;
  const maxSlide = googleReviews.length - visibleCount;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAuto = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setActiveSlide((s) => (s >= maxSlide ? 0 : s + 1));
        setMobileSlide((s) => (s >= googleReviews.length - 1 ? 0 : s + 1));
      }
    }, 3500);
  };

  useEffect(() => {
    startAuto();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const prev = () => {
    setActiveSlide((s) => (s <= 0 ? maxSlide : s - 1));
    setMobileSlide((s) => (s <= 0 ? googleReviews.length - 1 : s - 1));
  };
  const next = () => {
    setActiveSlide((s) => (s >= maxSlide ? 0 : s + 1));
    setMobileSlide((s) => (s >= googleReviews.length - 1 ? 0 : s + 1));
  };

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-8 bg-[#F65901]"></div>
            <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Reviews</span>
            <div className="h-px w-8 bg-[#F65901]"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
          <p className="text-gray-500 text-sm">Real businesses. Real results. Every week.</p>
        </div>

        {/* Google Rating Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12 bg-gray-50 rounded-xl py-8 px-6">
          <div className="flex flex-col items-center">
            <GoogleLogo />
            <div className="mt-2 text-6xl font-bold text-gray-900">5.0</div>
            <StarRating count={5} size="text-xl" />
            <div className="text-gray-500 text-sm mt-1">Based on 8 reviews</div>
          </div>
          <div className="hidden sm:block w-px h-24 bg-gray-200"></div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = star === 5 ? 8 : 0;
              const pct = (count / 8) * 100;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{star}</span>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-star-fill text-[#FBBC05] text-xs"></i>
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FBBC05] rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 w-4">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="hidden sm:block w-px h-24 bg-gray-200"></div>
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-600 text-sm text-center max-w-[180px]">Got more clients after working with us? Tell the world.</p>
            <a
              href="https://share.google/kfJuUauOxEG4F0bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <GoogleLogo />
              <span>Write a Review</span>
            </a>
          </div>
        </div>

        {/* Review Cards — Desktop slider */}
        <div
          className="relative hidden md:block"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex gap-5 transition-transform duration-500"
              style={{ transform: `translateX(calc(-${activeSlide} * (33.333% + 20px)))` }}
            >
              {googleReviews.map((review, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[calc(33.333%-14px)] bg-white rounded-xl border border-gray-200 p-5 hover:-translate-y-1 transition-transform duration-300"
                >
                  {/* Reviewer info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: review.color }}
                      >
                        {review.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                        <div className="text-gray-400 text-xs">{review.local}</div>
                      </div>
                    </div>
                    <GoogleLogo />
                  </div>
                  {/* Stars + date */}
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating count={review.rating} />
                    <span className="text-gray-400 text-xs">{review.date}</span>
                  </div>
                  {/* Review text */}
                  <p className="text-gray-600 text-sm leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nav arrows */}
          <div className="flex items-center justify-center gap-3 mt-7">
            <button
              onClick={prev}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-[#F65901] hover:text-[#F65901] transition-all cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            {Array.from({ length: maxSlide + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`rounded-full transition-all cursor-pointer ${i === activeSlide ? "w-6 h-2.5 bg-[#F65901]" : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"}`}
              />
            ))}
            <button
              onClick={next}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-[#F65901] hover:text-[#F65901] transition-all cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
          </div>
        </div>

        {/* Mobile carousel */}
        <div
          className="md:hidden"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: googleReviews[mobileSlide].color }}
                >
                  {googleReviews[mobileSlide].initials}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{googleReviews[mobileSlide].name}</div>
                  <div className="text-gray-400 text-xs">{googleReviews[mobileSlide].local}</div>
                </div>
              </div>
              <GoogleLogo />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <StarRating count={googleReviews[mobileSlide].rating} />
              <span className="text-gray-400 text-xs">{googleReviews[mobileSlide].date}</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">&ldquo;{googleReviews[mobileSlide].text}&rdquo;</p>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {googleReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileSlide(i)}
                className={`rounded-full transition-all cursor-pointer ${i === mobileSlide ? "w-6 h-2.5 bg-[#F65901]" : "w-2.5 h-2.5 bg-gray-300"}`}
              />
            ))}
          </div>
        </div>

        {/* See all on Google */}
        <div className="text-center mt-8">
          <a
            href="https://share.google/kfJuUauOxEG4F0bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#F65901] transition-colors cursor-pointer"
          >
            <i className="ri-external-link-line"></i>
            See all reviews on Google
          </a>
        </div>
      </div>
    </section>
  );
}
