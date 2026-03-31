import { Link } from "react-router-dom";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonLink?: string;
  dark?: boolean;
}

export default function CTASection({
  title = "Ready to Grow Your Business?",
  subtitle = "Simple. Fast. Results-driven.",
  buttonLabel = "Get More Customers",
  buttonLink = "/contact",
  dark = false,
}: CTASectionProps) {
  return (
    <section className={`py-16 md:py-20 ${dark ? "bg-[#1a1a1a]" : "bg-gradient-to-r from-[#F69D01] to-[#F65901]"}`}>
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{title}</h2>
        <p className={`text-base mb-8 ${dark ? "text-gray-400" : "text-white/90"}`}>{subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={buttonLink}
            className={`inline-block px-10 py-3.5 rounded-md text-sm font-bold cursor-pointer whitespace-nowrap transition-all ${
              dark
                ? "text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90"
                : "text-[#F65901] bg-white hover:bg-gray-100"
            }`}
          >
            {buttonLabel}
          </Link>
          <a
            href="https://wa.link/9m4r50"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-sm font-bold cursor-pointer whitespace-nowrap transition-all border ${
              dark
                ? "border-white/20 text-white hover:border-[#F69D01] hover:text-[#F69D01]"
                : "border-white/50 text-white hover:bg-white/10"
            }`}
          >
            <i className="ri-whatsapp-line text-base"></i>
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
