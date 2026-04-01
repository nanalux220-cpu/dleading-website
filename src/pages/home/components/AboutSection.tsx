import { Link } from "react-router-dom";
import { brandAssets } from "@/config/media";

export default function AboutSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Top 2-col row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left card — Problem */}
          <div className="bg-[#fdf8f5] rounded-lg p-8 border border-orange-100">
            <img
              src={brandAssets.aboutLogo}
              alt="Dleading Creative Designs"
              className="h-10 w-auto mb-5"
            />
            <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
              Not getting enough customers?
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Most local businesses rely on referrals and word-of-mouth. That's not a system — that's luck. When referrals dry up, so does the work.
            </p>
          </div>

          {/* Right card — Solution intro */}
          <div className="bg-[#1a1a1a] rounded-lg p-8 text-white">
            <h2 className="text-xl font-bold mb-3 leading-snug">
              We turn online searches into <span className="text-[#F69D01]">real paying customers</span>
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We build you a system that generates consistent leads every month — so you're never relying on referrals again. Google Ads, SEO, and a website that converts.
            </p>
          </div>
        </div>

        {/* Bottom 2-col row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problem 2 */}
          <div className="bg-[#fdf8f5] rounded-lg p-8 border border-orange-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
              Relying on referrals but business is slow?
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your competitors are showing up on Google every day and taking customers that should be yours. Without a lead generation system, you're leaving money on the table every single month.
            </p>
          </div>

          {/* Solution — what you get */}
          <div className="bg-[#1a1a1a] rounded-lg p-8 text-white">
            <h2 className="text-xl font-bold mb-4 leading-snug">What you get working with us</h2>
            <ul className="space-y-3">
              {[
                "More calls from customers ready to buy",
                "More bookings, enquiries, and sales",
                "Google Ads that deliver fast results",
                "SEO that grows your business long-term",
                "Google Business profile that builds local trust",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5 shrink-0">
                    <i className="ri-checkbox-circle-fill text-[#F69D01] text-lg"></i>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="mt-6 inline-block px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            >
              Get More Customers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
