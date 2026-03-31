import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import HeroSection from "./components/HeroSection";
import GoogleReviewsBanner from "./components/GoogleReviewsBanner";
import AboutSection from "./components/AboutSection";
import ServicesSection from "./components/ServicesSection";
import PortfolioSection from "./components/PortfolioSection";
import StatsSection from "./components/StatsSection";
import TestimonialsSection from "./components/TestimonialsSection";
import CTASection from "./components/CTASection";
import HowWeWorkSection from "./components/HowWeWorkSection";
import BeforeAfterSection from "./components/BeforeAfterSection";

import SocialFollowSection from "./components/SocialFollowSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <GoogleReviewsBanner />
        <AboutSection />
        <ServicesSection />
        <PortfolioSection />
        <BeforeAfterSection />
        <StatsSection />
        <HowWeWorkSection />
        <TestimonialsSection />
        <SocialFollowSection />
        <CTASection
          title="Transforming Ideas into Beautiful Designs"
          subtitle="Partner with the Best Web Design Company in Leeds Today"
          buttonLabel="Contact Us"
          buttonLink="/contact"
          dark
        />
      </main>
      <Footer />
    </div>
  );
}
