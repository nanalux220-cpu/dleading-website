import { Link } from "react-router-dom";

const services = [
  {
    title: "Google Ads",
    description: "Start getting customers fast. We run targeted campaigns that put your business in front of people searching for your service right now.",
    image: "https://readdy.ai/api/search-image?query=Google%20Ads%20dashboard%20on%20laptop%20screen%20showing%20pay-per-click%20campaign%20performance%20charts%20and%20metrics%20modern%20office%20desk%20setup%20professional%20digital%20marketing%20environment%20with%20warm%20orange%20ambient%20lighting%20clean%20background&width=600&height=400&seq=gads01&orientation=landscape",
    hash: "digital-marketing",
  },
  {
    title: "SEO",
    description: "Grow your business long-term. We get your website ranking on Google so customers find you — without paying for every click.",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/seo.jpg",
    hash: "seo",
  },
  {
    title: "Google Business Optimisation",
    description: "Get found locally and build trust. We optimise your Google Business profile so you appear in local searches and stand out from competitors.",
    image: "https://readdy.ai/api/search-image?query=Google%20Business%20Profile%20on%20mobile%20phone%20showing%20five%20star%20reviews%20and%20local%20business%20listing%20clean%20minimal%20white%20background%20with%20orange%20accent%20lighting%20professional%20business%20photography%20modern%20smartphone&width=600&height=400&seq=gbp01&orientation=landscape",
    hash: "web-design",
  },
  {
    title: "Website Optimisation",
    description: "Turn visitors into customers. We improve your existing site — speed, layout, and copy — so more people call, book, and buy.",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/web-design.jpg",
    hash: "web-design",
  },
  {
    title: "Custom Website Design",
    description: "A website built to convert — fast, mobile-ready, and designed to generate real enquiries for your business.",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/web-design-photo.jpg",
    hash: "web-design",
  },
  {
    title: "E-commerce Website Development",
    description: "Online stores built to sell. Every page designed to reduce drop-off and increase orders.",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/E-commerce-website.jpg",
    hash: "ecommerce",
  },
  {
    title: "Website Management",
    description: "We handle updates, security, and performance so your site stays fast and never loses a customer.",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/wordpress-management.jpg",
    hash: "management",
  },
  {
    title: "Logo & Brand Design",
    description: "A strong brand builds instant trust. Stand out from every competitor in your area.",
    image: "https://readdy.ai/api/search-image?query=professional%20logo%20design%20creative%20studio%20workspace%20with%20sketches%20branding%20concepts%20color%20palettes%20typography%20samples%20on%20clean%20white%20desk%20modern%20minimalist%20design%20agency%20environment%20with%20orange%20accent%20colors&width=600&height=400&seq=logo01&orientation=landscape",
    hash: "logo",
  },
  {
    title: "Video Animation",
    description: "Explain what you do in 60 seconds and turn more website visitors into paying customers.",
    image: "https://readdy.ai/api/search-image?query=professional%20video%20animation%20production%20studio%20with%20motion%20graphics%20on%20screen%20digital%20creative%20workspace%20with%20orange%20lighting%20accents%20modern%20design%20agency%20producing%20animated%20explainer%20videos%20and%20brand%20content&width=600&height=400&seq=video01&orientation=landscape",
    hash: "video",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Services That Get You More Customers</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">More calls. More bookings. More sales.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.title} className="bg-white rounded-lg overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-full h-52 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-base mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.description}</p>
                <a
                  href={`/services#${service.hash}`}
                  className="inline-block px-5 py-2 rounded-md text-xs font-semibold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  Get Started
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/services"
            className="inline-block px-8 py-3 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            See All Services
          </Link>
        </div>
      </div>
    </section>
  );
}
