import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import CTASection from "../home/components/CTASection";
import { blogPosts } from "../../mocks/blogPosts";

const categories = ["All", "Web Design", "SEO", "Digital Marketing", "Graphic Design"];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Page hero */}
        <section className="relative bg-[#1a1a1a] py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src="https://creativedleading.co.uk/wp-content/uploads/2025/04/web-design-photo.jpg" alt="" className="w-full h-full object-cover object-top" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center">
            <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Insights & Tips</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">Our Blog</h1>
            <p className="text-gray-300 text-base max-w-2xl mx-auto">
              Expert insights, tips, and trends in web design, SEO, digital marketing, and graphic design — straight from our Leeds-based team.
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

        {/* Blog content */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No posts in this category yet.</div>
            ) : (
              <>
                {/* Featured post */}
                {featured && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 bg-[#fdf8f5] rounded-xl overflow-hidden border border-orange-100">
                    <div className="w-full h-64 lg:h-auto overflow-hidden">
                      <img src={featured.image} alt={featured.title} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {featured.category}
                        </span>
                        <span className="text-gray-400 text-xs">{featured.readTime}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-snug">{featured.title}</h2>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{featured.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">{featured.date}</span>
                        <Link
                          to={`/blog/${featured.slug}`}
                          className="text-sm font-semibold text-[#F65901] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other posts grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post) => (
                    <article key={post.id} className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:-translate-y-1 transition-transform duration-300 group">
                      <Link to={`/blog/${post.slug}`} className="block cursor-pointer">
                        <div className="w-full h-48 overflow-hidden">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      </Link>
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-orange-100 text-[#F65901] text-xs font-semibold px-2.5 py-1 rounded-full">{post.category}</span>
                          <span className="text-gray-400 text-xs">{post.readTime}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm mb-2 leading-snug">{post.title}</h3>
                        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">{post.date}</span>
                          <Link
                            to={`/blog/${post.slug}`}
                            className="text-xs font-semibold text-[#F65901] hover:underline cursor-pointer whitespace-nowrap"
                          >
                            Read More →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <CTASection
          title="Need Help With Your Digital Strategy?"
          subtitle="Our team of experts is ready to help your business grow online."
          buttonLabel="Get in Touch"
          buttonLink="/contact"
        />
      </main>
      <Footer />
    </div>
  );
}
