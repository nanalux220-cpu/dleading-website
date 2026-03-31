import { Link, useNavigate, useLocation } from "react-router-dom";

const quickLinks = [
  { label: "About Us", path: "/about" },
  { label: "Our Services", path: "/services" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Blog", path: "/blog" },
  { label: "FAQs", path: "/faq" },
  { label: "Contact Us", path: "/contact" },
];

const serviceLinks = [
  { label: "Custom Web Design", path: "/services/web-design" },
  { label: "E-commerce Website", path: "/services/ecommerce" },
  { label: "Web & Mobile Development", path: "/services/web-mobile" },
  { label: "SEO", path: "/services/seo" },
  { label: "Graphic Design Services", path: "/services/graphic" },
  { label: "Website Management", path: "/services/management" },
];

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }
  };

  return (
    <footer className="bg-[#f8f4f0] text-gray-700">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Col 1: Brand */}
        <div>
          <a href="/" onClick={handleLogoClick} className="inline-block mb-4">
            <img
              src="https://storage.readdy-site.link/project_files/00d6bb05-2c0a-47a0-8a61-fb9c4ae4c88b/ca424a1e-e6ed-4c4c-b5de-79f1d503c12f_LOGO.png?v=95ffa72d886a43f132cd00bbd307319d"
              alt="Dleading Creative Designs"
              className="h-12 w-auto cursor-pointer"
            />
          </a>
          <p className="text-sm text-gray-600 leading-relaxed">
            Helping local service businesses in Leeds get more clients online — through websites, SEO, and Google Ads that actually work.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <a href="https://www.facebook.com/share/1RS3XCXbpP/" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F65901] text-white hover:opacity-80 transition-opacity cursor-pointer">
              <i className="ri-facebook-fill text-base"></i>
            </a>
            <a href="https://www.instagram.com/mrelvisofori" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F65901] text-white hover:opacity-80 transition-opacity cursor-pointer">
              <i className="ri-instagram-line text-base"></i>
            </a>
            <a href="https://www.linkedin.com/in/elvis-ofori-967472322" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F65901] text-white hover:opacity-80 transition-opacity cursor-pointer">
              <i className="ri-linkedin-fill text-base"></i>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F65901] text-white hover:opacity-80 transition-opacity cursor-pointer">
              <i className="ri-tiktok-fill text-base"></i>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F65901] text-white hover:opacity-80 transition-opacity cursor-pointer">
              <i className="ri-telegram-fill text-base"></i>
            </a>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wide">Quick Links</h3>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.path} className="text-sm text-gray-600 hover:text-[#F65901] transition-colors cursor-pointer flex items-center gap-2">
                  <i className="ri-arrow-right-s-line text-[#F65901]"></i>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Our Services */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wide">Our Services</h3>
          <ul className="space-y-2">
            {serviceLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.path}
                  className="text-sm text-gray-600 hover:text-[#F65901] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <i className="ri-arrow-right-s-line text-[#F65901]"></i>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Contact Info */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wide">Get In Touch</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 flex items-center justify-center mt-0.5 shrink-0">
                <i className="ri-map-pin-line text-[#F65901] text-base"></i>
              </div>
              Holbeck, Leeds, United Kingdom
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 flex items-center justify-center mt-0.5 shrink-0">
                <i className="ri-whatsapp-line text-[#F65901] text-base"></i>
              </div>
              <a href="https://wa.link/9m4r50" target="_blank" rel="noopener noreferrer" className="hover:text-[#F65901] transition-colors">
                +44 742 725 9935
              </a>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 flex items-center justify-center mt-0.5 shrink-0">
                <i className="ri-mail-line text-[#F65901] text-base"></i>
              </div>
              info@creativedleading.co.uk
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 bg-[#ede8e3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-[72px] md:pb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 text-center sm:text-left">© 2023 Dleading Creative Designs Ltd</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-1.5">
            <Link to="/contact" className="text-xs text-gray-500 hover:text-[#F65901] transition-colors cursor-pointer whitespace-nowrap">Contact Us</Link>
            <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-[#F65901] transition-colors cursor-pointer whitespace-nowrap">Privacy Policy</Link>
            <Link to="/cookie-policy" className="text-xs text-gray-500 hover:text-[#F65901] transition-colors cursor-pointer whitespace-nowrap">Cookie Policy</Link>
            <Link to="/terms" className="text-xs text-gray-500 hover:text-[#F65901] transition-colors cursor-pointer whitespace-nowrap">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
