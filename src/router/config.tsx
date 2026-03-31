import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import About from "../pages/about/page";
import Services from "../pages/services/page";
import ServiceDetail from "../pages/services/detail/page";
import Portfolio from "../pages/portfolio/page";
import Blog from "../pages/blog/page";
import BlogDetail from "../pages/blog/detail/page";
import Contact from "../pages/contact/page";
import LogoPricing from "../pages/logo-pricing/page";
import PPCPricing from "../pages/ppc-pricing/page";
import SMMPricing from "../pages/smm-pricing/page";
import Pricing from "../pages/pricing/page";
import PrivacyPolicy from "../pages/privacy-policy/page";
import CookiePolicy from "../pages/cookie-policy/page";
import TermsConditions from "../pages/terms/page";
import FAQPage from "../pages/faq/page";

const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "/about", element: <About /> },
  { path: "/services", element: <Services /> },
  { path: "/services/:serviceId", element: <ServiceDetail /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/logo-pricing", element: <LogoPricing /> },
  { path: "/ppc-pricing", element: <PPCPricing /> },
  { path: "/smm-pricing", element: <SMMPricing /> },
  { path: "/portfolio", element: <Portfolio /> },
  { path: "/blog", element: <Blog /> },
  { path: "/blog/:slug", element: <BlogDetail /> },
  { path: "/contact", element: <Contact /> },
  { path: "/privacy-policy", element: <PrivacyPolicy /> },
  { path: "/cookie-policy", element: <CookiePolicy /> },
  { path: "/terms", element: <TermsConditions /> },
  { path: "/faq", element: <FAQPage /> },
  { path: "*", element: <NotFound /> },
];

export default routes;
