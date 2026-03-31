import { useState } from "react";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import CTASection from "../home/components/CTASection";
import { portfolioItems } from "../../mocks/portfolioItems";

const categories = ["All", "Web Design", "E-commerce", "Photography", "SEO"];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightbox, setLightbox] = useState<null | typeof portfolioItems[0]>(null);

  const filtered = activeCategory === "All"
    ? portfolioItems
    : portfolioItems.filter((p) => p.category === activeCategory);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Page hero */}
        <section className="relative bg-[#1a1a1a] py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src="https://creativedleading.co.uk/wp-content/uploads/2025/04/graphic-design-website.jpg" alt="" className="w-full h-full object-cover object-top" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center">
            <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Our Work</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">Our Portfolio</h1>
            <p className="text-gray-300 text-base max-w-2xl mx-auto">
              Explore our impressive design portfolio and see the digital experiences we've crafted for businesses across Leeds and beyond.
            </p>
          </div>
        </section>

        {/* Filter tabs */}
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#F65901]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg overflow-hidden cursor-pointer relative"
                  onClick={() => setLightbox(item)}
                >
                  <div className="w-full h-64 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <span className="text-[#F69D01] text-xs font-semibold uppercase tracking-widest mb-1">{item.category}</span>
                    <h3 className="text-white font-bold text-base">{item.title}</h3>
                    <p className="text-gray-300 text-xs mt-1 line-clamp-2">{item.description}</p>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap self-start"
                      >
                        <i className="ri-external-link-line"></i>
                        Visit Live Site
                      </a>
                    )}
                  </div>
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {item.category}
                  </div>
                  {item.url && (
                    <div className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-[#F65901]">
                      <i className="ri-external-link-line text-sm"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="bg-white rounded-xl overflow-hidden max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full h-72 overflow-hidden">
                <img src={lightbox.image} alt={lightbox.title} className="w-full h-full object-cover object-top" />
              </div>
              <div className="p-6">
                <span className="text-[#F65901] text-xs font-semibold uppercase tracking-widest">{lightbox.category}</span>
                <h3 className="font-bold text-gray-900 text-lg mt-1 mb-2">{lightbox.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{lightbox.description}</p>
                <div className="flex items-center gap-3 mt-5">
                  {lightbox.url && (
                    <a
                      href={lightbox.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-external-link-line"></i>
                      Visit Live Site
                    </a>
                  )}
                  <button
                    onClick={() => setLightbox(null)}
                    className="px-6 py-2.5 rounded-md text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <CTASection
          title="Have a Project in Mind?"
          subtitle="Let's turn your idea into a beautiful digital experience."
          buttonLabel="Start a Project"
          buttonLink="/contact"
        />
      </main>
      <Footer />
    </div>
  );
}
