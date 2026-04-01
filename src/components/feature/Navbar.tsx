import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { brandAssets } from "@/config/media";

const serviceDropdownItems = [
  { label: "Custom Website Design", path: "/services/web-design", hash: "", icon: "ri-layout-line" },
  { label: "Web & Mobile Development", path: "/services/web-mobile", hash: "", icon: "ri-code-s-slash-line" },
  { label: "E-commerce Development", path: "/services/ecommerce", hash: "", icon: "ri-shopping-cart-line" },
  { label: "Search Engine Optimization", path: "/services/seo", hash: "", icon: "ri-search-line" },
  { label: "Website Management", path: "/services/management", hash: "", icon: "ri-settings-4-line" },
  { label: "Graphic Design Services", path: "/services/graphic", hash: "", icon: "ri-palette-line" },
  { label: "Logo Design & Pricing", path: "/logo-pricing", hash: "", icon: "ri-pen-nib-line" },
  { label: "Video Animation", path: "/services/video", hash: "", icon: "ri-film-line" },
  { label: "Digital Marketing", path: "/services/digital-marketing", hash: "", icon: "ri-megaphone-line" },
  { label: "Pay Per Click (PPC)", path: "/services/ppc", hash: "", icon: "ri-cursor-line" },
  { label: "PPC Management Pricing", path: "/ppc-pricing", hash: "", icon: "ri-price-tag-3-line" },
  { label: "Social Media Marketing", path: "/services/social-media-marketing", hash: "", icon: "ri-instagram-line" },
  { label: "Social Media Pricing", path: "/smm-pricing", hash: "", icon: "ri-price-tag-3-line" },
];

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Blog", path: "/blog" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isHome = location.pathname === "/";
  const topBarOffset = isMobile ? "0px" : "40px";
  // When mobile menu is open, always treat as non-transparent so the
  // coloured logo shows correctly against the white menu panel
  const isTransparent = isHome && !scrolled && !mobileOpen;

  const handleServiceClick = (hash: string, path: string) => {
    setServicesOpen(false);
    setMobileOpen(false);
    navigate(path);
    if (hash) {
      // Give the page a tick to mount before scrolling to the section
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };

  return (
    <>
      {/* Top bar */}
      <div className="w-full bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs sm:text-sm py-2 px-4 hidden sm:flex flex-row items-center justify-between gap-1">
        <span className="font-medium text-center sm:text-left">
          <span className="hidden sm:inline">Contact Us on WhatsApp: </span>+44 742 725 9935
        </span>
        <div className="flex items-center gap-4">
          <a href="https://wa.link/9m4r50" target="_blank" rel="noopener noreferrer" className="hover:underline whitespace-nowrap">My Account</a>
          <Link to="/contact" className="hover:underline whitespace-nowrap">Contact Us</Link>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`w-full z-50 transition-all duration-300 ${
          isTransparent
            ? "absolute top-[40px] bg-transparent"
            : "sticky top-0 bg-white shadow-sm"
        } ${scrolled && isHome ? "fixed top-0 bg-white shadow-sm" : ""}`}
        style={{ position: isHome && !scrolled && !mobileOpen ? "absolute" : "sticky", top: isHome && !scrolled && !mobileOpen ? topBarOffset : "0" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-[70px]">
          {/* Logo — cross-fades between white and colour versions */}
          <Link
            to="/"
            className="flex items-center"
            onClick={(e) => {
              // Always scroll to very top on logo click (especially important on mobile)
              if (location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              setMobileOpen(false);
            }}
          >
            <div className="relative h-10" style={{ minWidth: "130px" }}>
              {/* White logo — visible on transparent navbar */}
              <img
                src={brandAssets.logoWhite}
                alt="Dleading Creative Designs"
                className={`h-10 w-auto transition-opacity duration-400 ${isTransparent ? "opacity-100" : "opacity-0"}`}
              />
              {/* Colour logo — visible on scrolled/sticky navbar */}
              <img
                src={brandAssets.logo}
                alt="Dleading Creative Designs"
                className={`h-10 w-auto absolute top-0 left-0 transition-opacity duration-400 ${isTransparent ? "opacity-0" : "opacity-100"}`}
              />
            </div>
          </Link>

          {/* Desktop nav — order: Home, About, Services, Portfolio, Blog, Contact */}
          <div className="hidden md:flex items-center gap-6">
            {/* Home */}
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                location.pathname === "/" ? "text-[#F65901]" : isTransparent ? "text-white hover:text-[#F69D01]" : "text-gray-800 hover:text-[#F65901]"
              }`}
            >
              Home
            </Link>

            {/* About */}
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                location.pathname === "/about" ? "text-[#F65901]" : isTransparent ? "text-white hover:text-[#F69D01]" : "text-gray-800 hover:text-[#F65901]"
              }`}
            >
              About
            </Link>

            {/* Services dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                onMouseEnter={() => setServicesOpen(true)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                  location.pathname.startsWith("/services") ? "text-[#F65901]" : isTransparent ? "text-white hover:text-[#F69D01]" : "text-gray-800 hover:text-[#F65901]"
                }`}
              >
                Services
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`ri-arrow-down-s-line text-base transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}></i>
                </div>
              </button>

              {servicesOpen && (
                <div
                  onMouseLeave={() => setServicesOpen(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-lg overflow-hidden z-50"
                  style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100"></div>
                  <div className="py-2 relative z-10 bg-white">
                    {serviceDropdownItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleServiceClick(item.hash, item.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F65901] transition-colors duration-150 cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white shrink-0">
                          <i className={`${item.icon} text-xs`}></i>
                        </div>
                        <span className="whitespace-nowrap">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio, Blog, Contact */}
            {navLinks.slice(2).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                  location.pathname === link.path
                    ? "text-[#F65901]"
                    : isTransparent
                    ? "text-white hover:text-[#F69D01]"
                    : "text-gray-800 hover:text-[#F65901]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <a
              href="https://wa.link/9m4r50"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-5 py-2 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
            >
              Get a Quote
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden w-8 h-8 flex items-center justify-center cursor-pointer ${isTransparent ? "text-white" : "text-gray-800"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <i className={`ri-${mobileOpen ? "close" : "menu"}-line text-2xl`}></i>
          </button>
        </div>

        {/* Mobile menu — order: Home, About, Services, Portfolio, Blog, Contact */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-24 max-h-[80vh] overflow-y-auto">
            {/* Home */}
            <Link to="/" onClick={() => setMobileOpen(false)} className={`block py-3 text-sm font-medium border-b border-gray-50 cursor-pointer ${location.pathname === "/" ? "text-[#F65901]" : "text-gray-800 hover:text-[#F65901]"}`}>Home</Link>

            {/* About */}
            <Link to="/about" onClick={() => setMobileOpen(false)} className={`block py-3 text-sm font-medium border-b border-gray-50 cursor-pointer ${location.pathname === "/about" ? "text-[#F65901]" : "text-gray-800 hover:text-[#F65901]"}`}>About</Link>

            {/* Mobile services accordion */}
            <div className="border-b border-gray-50">
              <button
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                className={`w-full flex items-center justify-between py-3 text-sm font-medium cursor-pointer text-left ${location.pathname.startsWith("/services") ? "text-[#F65901]" : "text-gray-800"}`}
              >
                Services
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className={`ri-arrow-down-s-line transition-transform duration-200 ${mobileServicesOpen ? "rotate-180" : ""}`}></i>
                </div>
              </button>
              {mobileServicesOpen && (
                <div className="pl-4 pb-2 space-y-1">
                  {serviceDropdownItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleServiceClick(item.hash, item.path)}
                      className="w-full flex items-center gap-2 py-2 text-xs text-gray-600 hover:text-[#F65901] cursor-pointer text-left"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className={`${item.icon} text-[#F69D01]`}></i>
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio, Blog, Contact */}
            {navLinks.slice(2).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 text-sm font-medium border-b border-gray-50 cursor-pointer ${
                  location.pathname === link.path ? "text-[#F65901]" : "text-gray-800 hover:text-[#F65901]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <a
              href="https://wa.link/9m4r50"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center px-5 py-2 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] cursor-pointer"
            >
              Get a Quote
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
