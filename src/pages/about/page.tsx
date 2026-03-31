import { useState } from "react";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import CTASection from "../home/components/CTASection";

const team = [
  {
    name: "Elvis Ofori",
    role: "Founder & Lead Designer",
    image: "https://storage.readdy-site.link/project_files/96e1aa26-0276-4892-81dd-6376d47ee6f1/d00a6090-44d0-4dff-bae9-89a3efce30d3_WhatsApp-Image-2026-03-31-at-12.11.48-AM.jpeg?v=8205cb601a2a5211a6c2bbb45a7eeb58",
    bio: "Elvis founded Dleading Creative Designs with one mission — to give every business, no matter its size, a digital presence worthy of its ambition. With over 10 years crafting brands and websites across Leeds and the UK, he leads every project with strategy-first thinking and an obsession for design detail.",
    funFact: "Designed his first logo at 17 for a local barber shop in Leeds.",
    skills: ["React & Next.js", "JavaScript / TypeScript", "WordPress & PHP", "UI/UX Design", "Brand Identity", "Web Strategy"],
    social: { linkedin: "#", instagram: "#" },
    featured: true,
  },
  {
    name: "Sarah Thompson",
    role: "Senior Web Developer",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/02/eglgv189.jpg",
    bio: "Sarah turns design concepts into fast, flawless, responsive websites. Specialising in React, WordPress, and e-commerce platforms, she has built everything from personal portfolios to full online stores — always with performance and accessibility at the core.",
    funFact: "Rebuilt her first WordPress site at 3am on a caffeine-fuelled weekend challenge.",
    skills: ["React & Next.js", "WordPress", "E-commerce", "Web Performance"],
    social: { linkedin: "#", instagram: "#" },
    featured: false,
  },
  {
    name: "James Richards",
    role: "SEO & Digital Marketing Lead",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/02/young-businessman-in-wheelchair-with-colleagues-EWTN4AC.jpg",
    bio: "James is the data guy — obsessed with rankings, click-through rates, and turning traffic into tangible revenue. He leads SEO strategy, Google Ads campaigns, and digital marketing across the agency.",
    funFact: "Ranked a local plumber #1 on Google in under 8 weeks — a personal best.",
    skills: ["Technical SEO", "Google Ads", "Content Strategy", "Analytics"],
    social: { linkedin: "#", instagram: "#" },
    featured: false,
  },
  {
    name: "Aisha Patel",
    role: "Graphic & Brand Designer",
    image: "https://readdy.ai/api/search-image?query=professional%20young%20british%20south%20asian%20woman%20graphic%20designer%20creative%20agency%20smiling%20confidently%20at%20camera%20wearing%20stylish%20casual%20professional%20outfit%20modern%20office%20environment%20warm%20orange%20accent%20lighting%20clean%20background%20Leeds%20UK&width=600&height=750&seq=team_aisha01&orientation=portrait",
    bio: "Aisha is the visual genius behind the logos, brand kits, print designs, and social media graphics that make our clients instantly recognisable. From quick logo briefs to full brand identity systems, she approaches every project like a creative puzzle.",
    funFact: "Has a sketchbook for every year since she was 14 — all still on her shelf.",
    skills: ["Logo Design", "Brand Identity", "Adobe Suite", "Social Media Graphics"],
    social: { linkedin: "#", instagram: "#" },
    featured: false,
  },
  {
    name: "Tom Bradley",
    role: "Social Media & Content Manager",
    image: "https://readdy.ai/api/search-image?query=professional%20young%20british%20man%20social%20media%20manager%20content%20creator%20smiling%20confidently%20camera%20stylish%20smart%20casual%20outfit%20modern%20creative%20agency%20office%20warm%20lighting%20Leeds%20UK%20bright%20clean%20workspace%20background&width=600&height=750&seq=team_tom01&orientation=portrait",
    bio: "Tom lives and breathes social media — from Instagram Reels to TikTok strategy to LinkedIn content that actually gets read. He manages social accounts for multiple clients simultaneously, keeping every feed fresh, on-brand, and growing.",
    funFact: "Created a viral TikTok for a Leeds coffee shop that brought in 300 new customers in a week.",
    skills: ["Content Creation", "Instagram & TikTok", "Community Management", "Paid Social"],
    social: { linkedin: "#", instagram: "#" },
    featured: false,
  },
];

const values = [
  { icon: "ri-lightbulb-line", title: "Innovation", desc: "We stay ahead of digital trends to deliver creative, forward-thinking solutions for every client." },
  { icon: "ri-heart-line", title: "Passion", desc: "We genuinely care about the success of your business and pour dedication into every project we take on." },
  { icon: "ri-shield-check-line", title: "Integrity", desc: "Transparent pricing, honest communication, and no hidden surprises — always." },
  { icon: "ri-customer-service-2-line", title: "Support", desc: "Our relationship does not end at launch. We provide ongoing care to ensure your website continues to grow." },
];

const milestones = [
  { year: "2014", title: "Where It All Began", desc: "Elvis started freelancing from a small desk in Leeds, building websites for local businesses on a shoestring budget and a big dream." },
  { year: "2017", title: "First Agency Clients", desc: "Word-of-mouth spread fast. Dleading took on its first retainer clients — a Leeds restaurant chain and a regional law firm — and never looked back." },
  { year: "2019", title: "The Team Grows", desc: "We hired our first full-time developer and designer, officially becoming a multi-discipline creative agency with a proper team behind the name." },
  { year: "2021", title: "Hitting 100 Projects", desc: "Completed our 100th client project — a milestone celebrated with the whole team. SEO and digital marketing became core service offerings." },
  { year: "2023", title: "Company Registered", desc: "Dleading Creative Designs Ltd was officially incorporated, cementing our commitment to professionalism, growth, and long-term client partnerships." },
  { year: "2025", title: "Going Stronger", desc: "Now a team of 5 specialists delivering web design, SEO, social media, and branding to businesses across Leeds and the whole of the UK." },
];

const whyUs = [
  { icon: "ri-focus-3-line", title: "Strategy First, Design Second", desc: "Every project starts with a clear plan. We understand your goals before we open a single design tool." },
  { icon: "ri-hand-heart-line", title: "We Treat Every Client Like a Partner", desc: "You will always speak to a real person who knows your project inside out — no outsourcing, no call centres." },
  { icon: "ri-map-pin-2-line", title: "Proud to Be Leeds-Based", desc: "We understand the local market, the local customer, and what it takes to stand out in a competitive UK landscape." },
  { icon: "ri-trophy-line", title: "Results You Can Actually Measure", desc: "We track rankings, traffic, leads, and conversions — so you always know exactly what your investment is delivering." },
  { icon: "ri-time-line", title: "On Time, Every Time", desc: "Deadlines are not suggestions. We deliver on schedule and keep you informed every step of the way." },
  { icon: "ri-price-tag-3-line", title: "Fair, Transparent Pricing", desc: "No confusing packages or surprise invoices. You know exactly what you are paying for and why." },
];

function TeamCard({ member }: { member: typeof team[0] }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
    >
      {/* Photo */}
      <div className="relative w-full h-80 overflow-hidden">
        <img
          src={member.image}
          alt={member.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/30 to-transparent" />

        {member.featured && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-bold px-3 py-1.5 rounded-full">
            <i className="ri-vip-crown-line text-xs"></i>
            Founder
          </div>
        )}

        {/* Hover bio overlay */}
        <div
          className={`absolute inset-0 flex flex-col justify-end p-5 transition-all duration-400 ${flipped ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(to top, rgba(13,13,13,0.97) 55%, rgba(13,13,13,0.5) 80%, transparent 100%)" }}
        >
          <p className="text-gray-300 text-xs leading-relaxed mb-3 line-clamp-4">{member.bio}</p>
          <div className="flex items-center gap-2 text-[#F69D01] text-xs font-semibold">
            <i className="ri-lightbulb-flash-line"></i>
            <span className="italic text-gray-400 line-clamp-1">&ldquo;{member.funFact}&rdquo;</span>
          </div>
        </div>

        {/* Name & role — bottom */}
        <div className={`absolute bottom-0 left-0 right-0 p-5 transition-all duration-300 ${flipped ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          <div className="text-[#F69D01] text-xs font-bold uppercase tracking-widest mb-1">{member.role}</div>
          <h3 className="text-white font-bold text-lg leading-tight">{member.name}</h3>
        </div>
      </div>

      {/* Card footer */}
      <div className="bg-white border-x border-b border-gray-100 rounded-b-2xl px-5 pt-4 pb-5">
        <div className="mb-3 md:hidden">
          <div className="text-[#F65901] text-xs font-bold uppercase tracking-widest">{member.role}</div>
          <h3 className="text-gray-900 font-bold text-base mt-0.5">{member.name}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {member.skills.map((skill) => (
            <span key={skill} className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1 whitespace-nowrap">
              {skill}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href={member.social.linkedin} onClick={(e) => e.preventDefault()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#0A66C2] hover:text-white transition-colors cursor-pointer">
              <i className="ri-linkedin-fill text-sm"></i>
            </a>
            <a href={member.social.instagram} onClick={(e) => e.preventDefault()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#E1306C] hover:text-white transition-colors cursor-pointer">
              <i className="ri-instagram-line text-sm"></i>
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-gray-400 text-xs">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative min-h-[480px] md:min-h-[560px] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://readdy.ai/api/search-image?query=modern%20creative%20digital%20agency%20office%20Leeds%20UK%20interior%20warm%20orange%20lighting%20designer%20team%20working%20at%20desks%20with%20large%20monitors%20stylish%20workspace%20minimalist%20decor%20professional%20bright%20atmosphere&width=1440&height=560&seq=about_hero_01&orientation=landscape"
              alt="Dleading Creative Designs team workspace"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28">
            <span className="inline-flex items-center gap-2 text-[#F69D01] text-sm font-semibold uppercase tracking-widest mb-4">
              <span className="h-px w-6 bg-[#F69D01]"></span>
              Our Story
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-5 max-w-2xl">
              Dleading Creative Designs — Built in Leeds, Trusted Across the UK
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-xl leading-relaxed mb-8">
              We are a passionate team of designers, developers, and digital marketers dedicated to helping businesses grow online with beautiful, results-driven digital solutions.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://wa.link/9m4r50" target="_blank" rel="noopener noreferrer"
                className="px-6 py-3 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap">
                Work With Us
              </a>
              <a href="/portfolio"
                className="px-6 py-3 rounded-md text-sm font-bold text-white border border-white/30 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap">
                View Our Work
              </a>
            </div>
          </div>
        </section>

        {/* ── STATS BANNER ── */}
        <section className="bg-gradient-to-r from-[#F69D01] to-[#F65901] py-10">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
              {[
                { number: "10+", label: "Years of Experience" },
                { number: "150+", label: "Projects Delivered" },
                { number: "5", label: "Specialist Team Members" },
                { number: "98%", label: "Client Satisfaction Rate" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <span className="text-3xl md:text-4xl font-black">{stat.number}</span>
                  <span className="text-white/80 text-xs md:text-sm font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── OUR STORY ── */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">About Us</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-5">
                  Built on Passion, Driven by Results
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Founded in the heart of Holbeck, Leeds, Dleading Creative Designs was born from a simple but powerful idea — every business, regardless of size or budget, deserves a stunning, high-performing digital presence. We combine strategy, creativity, and cutting-edge technology to deliver solutions that truly make a difference.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Over the years, we have helped over 150 businesses across Leeds and the wider UK establish powerful online presences — from ambitious local startups to established enterprises looking to scale. Our approach is always collaborative, transparent, and laser-focused on measurable results.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Whether you need a brand-new website, a full e-commerce platform, ongoing SEO management, or a bold new brand identity, we are here to make it happen. We do not just build websites — we build digital experiences that convert visitors into loyal customers.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-check-line text-[#F65901] text-base font-bold"></i>
                    </div>
                    No contracts — flexible plans
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-check-line text-[#F65901] text-base font-bold"></i>
                    </div>
                    UK-based team, real support
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-check-line text-[#F65901] text-base font-bold"></i>
                    </div>
                    Results you can measure
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="w-full h-80 md:h-[420px] rounded-2xl overflow-hidden">
                  <img
                    src="https://creativedleading.co.uk/wp-content/uploads/2025/04/web-design-photo.jpg"
                    alt="Dleading Creative Designs team at work"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-5 -left-5 bg-gradient-to-r from-[#F69D01] to-[#F65901] rounded-xl p-5 text-white hidden md:block">
                  <div className="text-3xl font-black">10+</div>
                  <div className="text-xs font-semibold">Years of Excellence</div>
                </div>
                {/* Second badge */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 text-gray-900 hidden md:flex flex-col items-center" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
                  <div className="text-2xl font-black text-[#F65901]">150+</div>
                  <div className="text-xs text-gray-500 font-medium">Happy Clients</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── JOURNEY TIMELINE ── */}
        <section className="py-16 md:py-24 bg-[#faf8f6]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">How We Got Here</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Our Journey</h2>
              <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto">From a one-man freelance operation to a full-service creative agency — here is how it all unfolded.</p>
            </div>

            <div className="relative">
              {/* Vertical centre line — desktop */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#F69D01] via-[#F65901] to-transparent -translate-x-1/2" />

              <div className="flex flex-col gap-8 md:gap-0">
                {milestones.map((m, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div key={m.year} className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
                      {/* Card */}
                      <div className={`w-full md:w-[calc(50%-2rem)] bg-white rounded-xl p-6 border border-gray-100 hover:-translate-y-1 transition-transform duration-300 ${isLeft ? "md:mr-8" : "md:ml-8"}`}
                        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                        <div className="text-[#F65901] text-xs font-bold uppercase tracking-widest mb-1">{m.year}</div>
                        <h3 className="text-gray-900 font-bold text-base mb-2">{m.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{m.desc}</p>
                      </div>

                      {/* Centre dot */}
                      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full items-center justify-center bg-gradient-to-br from-[#F69D01] to-[#F65901] z-10" style={{ boxShadow: "0 0 0 4px #faf8f6, 0 0 0 6px rgba(246,89,1,0.25)" }}>
                        <span className="text-white text-[10px] font-black">{m.year.slice(2)}</span>
                      </div>

                      {/* Spacer for opposite side */}
                      <div className="hidden md:block w-[calc(50%-2rem)]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── CORE VALUES ── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">What Drives Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Our Core Values</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => (
                <div key={v.title} className="bg-[#faf8f6] rounded-xl p-6 text-center border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white mx-auto mb-4">
                    <i className={`${v.icon} text-2xl`}></i>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY CHOOSE US ── */}
        <section className="py-16 md:py-24 bg-[#1a1a1a] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.08) 0%, transparent 70%)" }} />
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <span className="text-[#F69D01] text-sm font-semibold uppercase tracking-widest">Why Dleading</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Why Businesses Choose Us</h2>
              <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto">We are not just another agency. Here is what makes working with Dleading Creative Designs genuinely different.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {whyUs.map((item) => (
                <div key={item.title}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#F69D01] to-[#F65901] text-white mb-4">
                    <i className={`${item.icon} text-xl`}></i>
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MEET THE TEAM ── */}
        <section className="py-16 md:py-24 bg-[#0d0d0d] relative overflow-hidden">
          <div className="absolute top-[-60px] right-[-60px] w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,157,1,0.10) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-40px] left-[-40px] w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(246,89,1,0.08) 0%, transparent 70%)" }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-8 bg-[#F65901]"></div>
                  <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">The People Behind the Work</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Meet Our <span className="text-[#F69D01]">Team</span>
                </h2>
                <p className="text-gray-500 text-sm mt-3 max-w-xl leading-relaxed">
                  A tight-knit crew of designers, developers, and marketers based in Leeds — each one obsessively good at what they do. Tap a card to learn more.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                {[
                  { icon: "ri-team-line", label: "5 Specialists" },
                  { icon: "ri-map-pin-line", label: "Based in Leeds" },
                  { icon: "ri-time-line", label: "10+ Years Together" },
                ].map((p) => (
                  <div key={p.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                    <div className="w-5 h-5 flex items-center justify-center text-[#F69D01]">
                      <i className={`${p.icon} text-sm`}></i>
                    </div>
                    <span className="text-white text-xs font-semibold whitespace-nowrap">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {team.map((member) => (
                <TeamCard key={member.name} member={member} />
              ))}
            </div>

            {/* Join the team strip */}
            <div className="mt-14 bg-white/5 border border-white/10 rounded-2xl px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div>
                <div className="text-white font-bold text-base mb-1">Want to join the team?</div>
                <p className="text-gray-500 text-sm">We are always open to talented creatives and developers who share our passion for great digital work.</p>
              </div>
              <a href="mailto:info@creativedleading.co.uk"
                className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap">
                <i className="ri-mail-send-line text-base"></i>
                Send Your CV
              </a>
            </div>
          </div>
        </section>

        <CTASection
          title="Ready to Elevate Your Online Presence?"
          subtitle="Let us build something amazing together. Get in touch with the Dleading team today."
          buttonLabel="Get a Free Quote"
          buttonLink="/contact"
        />
      </main>
      <Footer />
    </div>
  );
}
