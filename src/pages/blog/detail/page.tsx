import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import { blogPosts } from "@/mocks/blogPosts";

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const post = blogPosts.find((p) => p.slug === slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-40 bg-white">
          <div className="text-center px-4">
            <p className="text-6xl font-bold text-[#F65901] mb-4">404</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog post not found</h1>
            <p className="text-gray-500 mb-8">This article doesn&apos;t exist or may have been moved.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white font-semibold rounded-lg cursor-pointer whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              <i className="ri-arrow-left-line"></i> Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedPosts = blogPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  const otherPosts = blogPosts
    .filter((p) => p.id !== post.id)
    .slice(0, 3 - relatedPosts.length);

  const suggestedPosts = [...relatedPosts, ...otherPosts].slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero banner */}
        <section className="relative bg-[#1a1a1a] overflow-hidden" style={{ minHeight: "380px" }}>
          <div className="absolute inset-0">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
          <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 py-20 md:py-28">
            {/* Back link */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-orange-300 hover:text-white text-sm font-medium mb-6 cursor-pointer transition-colors"
            >
              <i className="ri-arrow-left-line"></i> Back to Blog
            </Link>

            {/* Category + read time */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                {post.category}
              </span>
              <span className="text-gray-300 text-xs flex items-center gap-1 whitespace-nowrap">
                <i className="ri-time-line"></i> {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              {post.title}
            </h1>

            {/* Author + date */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901]">
                  <i className="ri-user-line text-white text-sm"></i>
                </div>
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-calendar-line text-[#F69D01]"></i>
                </div>
                <span>{post.date}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Article body */}
        <section className="py-14 bg-white">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            {/* Excerpt / intro highlight */}
            <div className="border-l-4 border-[#F69D01] pl-5 mb-10 bg-orange-50 py-4 pr-4 rounded-r-lg">
              <p className="text-gray-700 text-base leading-relaxed italic">{post.excerpt}</p>
            </div>

            {/* Full content */}
            <div
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Share row */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-semibold text-gray-700">Share this article:</p>
              <div className="flex items-center gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer"
                >
                  <i className="ri-whatsapp-line text-base"></i>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <i className="ri-facebook-fill text-base"></i>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <i className="ri-twitter-x-line text-base"></i>
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-[#F65901] transition-colors cursor-pointer"
                  title="Copy link"
                >
                  <i className="ri-links-line text-base"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-14 bg-gradient-to-r from-[#F69D01] to-[#F65901]">
          <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Get More Customers?
            </h2>
            <p className="text-white/90 text-sm mb-6 max-w-xl mx-auto">
              We help local businesses in Leeds generate consistent leads every month — using Google Ads, SEO, and websites that actually convert.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://wa.link/9m4r50"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#F65901] font-bold rounded-lg cursor-pointer whitespace-nowrap hover:bg-orange-50 transition-colors"
              >
                <i className="ri-whatsapp-line text-lg"></i> Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 border border-white text-white font-semibold rounded-lg cursor-pointer whitespace-nowrap hover:bg-white/30 transition-colors"
              >
                Get a Free Strategy Call
              </Link>
            </div>
          </div>
        </section>

        {/* Related posts */}
        {suggestedPosts.length > 0 && (
          <section className="py-16 bg-[#fdf8f5]">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedPosts.map((related) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.slug}`}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:-translate-y-1 transition-transform duration-300 group block cursor-pointer"
                  >
                    <div className="w-full h-44 overflow-hidden">
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-orange-100 text-[#F65901] text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                          {related.category}
                        </span>
                        <span className="text-gray-400 text-xs whitespace-nowrap">{related.readTime}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2">{related.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{related.excerpt}</p>
                      <span className="text-xs font-semibold text-[#F65901] group-hover:underline whitespace-nowrap">
                        Read More →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-10">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-lg border-2 border-[#F65901] text-[#F65901] font-semibold text-sm hover:bg-[#F65901] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line"></i> View All Articles
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
