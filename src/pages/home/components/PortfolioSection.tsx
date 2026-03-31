import { Link } from "react-router-dom";

const projects = [
  {
    title: "All Believers Chapel",
    image: "https://image.thum.io/get/width/800/crop/900/https://church-allbelievers.vercel.app/",
    category: "Web Design",
    url: "https://church-allbelievers.vercel.app/",
  },
  {
    title: "Photography Website",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/photography-website.jpg",
    category: "Photography",
    url: null,
  },
  {
    title: "Cleaning Website",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/cleaning-website.jpg",
    category: "E-commerce",
    url: null,
  },
  {
    title: "E-Commerce Platform",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/E-commerce-website.jpg",
    category: "E-commerce",
    url: null,
  },
];

export default function PortfolioSection() {
  return (
    <section className="py-16 md:py-20 bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Proven Results</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-2">Sites We've Built That Generate Leads</h2>
            <p className="text-gray-400 text-sm">Real websites. Real businesses. Real clients coming through the door.</p>
          </div>
          <Link
            to="/portfolio"
            className="inline-block px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            See More Proof
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div key={project.title} className="relative group rounded-lg overflow-hidden cursor-pointer">
              <div className="w-full h-72 md:h-80">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-[#F69D01] text-xs font-semibold uppercase tracking-widest mb-1">{project.category}</span>
                <h3 className="text-white font-bold text-lg mb-2">{project.title}</h3>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap self-start"
                  >
                    <i className="ri-external-link-line"></i>
                    Visit Live Site
                  </a>
                )}
              </div>
              {/* Category tag */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-semibold px-3 py-1 rounded-full">
                {project.category}
              </div>
              {/* Live badge for projects with URL */}
              {project.url && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
                  Live Site
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
