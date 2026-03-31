const socials = [
  {
    platform: "TikTok",
    handle: "@dleadingdesigns",
    icon: "ri-tiktok-fill",
    followers: "Follow us",
    description: "Behind-the-scenes builds, design tips & creative processes.",
    href: "#",
    gradient: "from-[#010101] to-[#2d2d2d]",
    accent: "#ffffff",
    pill: "bg-white/10 text-white",
  },
  {
    platform: "Instagram",
    handle: "@mrelvisofori",
    icon: "ri-instagram-line",
    followers: "Follow us",
    description: "Portfolio highlights, brand reveals & design inspiration daily.",
    href: "https://www.instagram.com/mrelvisofori",
    gradient: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
    accent: "#ffffff",
    pill: "bg-white/10 text-white",
  },
  {
    platform: "Facebook",
    handle: "Dleading Creative Designs",
    icon: "ri-facebook-fill",
    followers: "Follow us",
    description: "Updates, offers, client success stories & community posts.",
    href: "https://www.facebook.com/share/1RS3XCXbpP/",
    gradient: "from-[#1877f2] to-[#0a5dba]",
    accent: "#ffffff",
    pill: "bg-white/10 text-white",
  },
  {
    platform: "LinkedIn",
    handle: "Elvis Ofori",
    icon: "ri-linkedin-fill",
    followers: "Connect",
    description: "Industry insights, company news & professional achievements.",
    href: "https://www.linkedin.com/in/elvis-ofori-967472322",
    gradient: "from-[#0077b5] to-[#004f7c]",
    accent: "#ffffff",
    pill: "bg-white/10 text-white",
  },
  {
    platform: "Telegram",
    handle: "@dleadingdesigns",
    icon: "ri-telegram-fill",
    followers: "Join us",
    description: "Exclusive deals, early project drops & direct team updates.",
    href: "#",
    gradient: "from-[#0088cc] to-[#005f8e]",
    accent: "#ffffff",
    pill: "bg-white/10 text-white",
  },
];

export default function SocialFollowSection() {
  return (
    <section className="py-20 md:py-24 bg-[#fdf8f5] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#F65901]/10 text-[#F65901] text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest mb-4">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-heart-fill text-xs animate-pulse"></i>
            </div>
            Stay Connected
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Follow & See <span className="text-[#F69D01]">What's Possible</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
            Behind-the-scenes builds, client wins, and digital tips that help local businesses grow. Follow us and never miss what's working right now.
          </p>
        </div>

        {/* TikTok hero card */}
        <div className="relative rounded-2xl overflow-hidden mb-6 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-[#010101] to-[#2d2d2d]" />
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Glow blob */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-30"
            style={{ background: "radial-gradient(circle, #69C9D0 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle, #EE1D52 0%, transparent 70%)" }}
          />

          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 md:px-14 py-12"
          >
            {/* Left */}
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              {/* TikTok icon */}
              <div className="w-20 h-20 flex items-center justify-center rounded-2xl shrink-0"
                style={{ background: "linear-gradient(135deg, #EE1D52 0%, #69C9D0 100%)" }}>
                <div className="w-20 h-20 flex items-center justify-center">
                  <i className="ri-tiktok-fill text-white text-4xl"></i>
                </div>
              </div>
              <div>
                <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">TikTok</div>
                <h3 className="text-white text-2xl md:text-3xl font-black mb-2 leading-tight">
                  Follow Us on TikTok
                </h3>
                <p className="text-white/60 text-sm max-w-md leading-relaxed">
                  Watch us transform real websites live, reveal brand builds, and share quick tips that help local businesses get more clients online.
                </p>
              </div>
            </div>

            {/* Right CTA */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div
                className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white transition-transform group-hover:scale-105 duration-300 whitespace-nowrap"
                style={{ background: "linear-gradient(90deg, #EE1D52 0%, #69C9D0 100%)" }}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-tiktok-fill text-base"></i>
                </div>
                Follow on TikTok
              </div>
              <span className="text-white/30 text-xs">@dleadingdesigns</span>
            </div>
          </a>
        </div>

        {/* Other socials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {socials.slice(1).map((s) => (
            <a
              key={s.platform}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-300" />

              <div className="relative z-10 p-6 flex flex-col gap-4 h-full">
                {/* Icon + platform */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/15">
                    <i className={`${s.icon} text-white text-2xl`}></i>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    <span className="text-white text-xs font-semibold whitespace-nowrap">{s.followers}</span>
                  </div>
                </div>

                {/* Text */}
                <div>
                  <div className="text-white font-bold text-base mb-1">{s.platform}</div>
                  <div className="text-white/60 text-xs mb-2 font-medium">{s.handle}</div>
                  <p className="text-white/70 text-xs leading-relaxed">{s.description}</p>
                </div>

                {/* Arrow */}
                <div className="mt-auto flex items-center gap-1 text-white/50 text-xs font-semibold group-hover:text-white/90 transition-colors duration-200">
                  <span>Follow Now</span>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-arrow-right-line text-sm group-hover:translate-x-1 transition-transform duration-200"></i>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <div className="w-5 h-5 flex items-center justify-center text-[#F65901]">
            <i className="ri-sparkling-2-line text-base"></i>
          </div>
          <p className="text-gray-500 text-sm">
            Follow for{" "}
            <strong className="text-gray-900">free tips, client transformations & lead generation strategies</strong>{" "}
            — all helping local businesses grow.
          </p>
        </div>

      </div>
    </section>
  );
}
