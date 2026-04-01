import { stockImages } from "@/config/media";

export interface ServiceItem {
  id: string;
  title: string;
  icon: string;
  image: string;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  process: { step: number; title: string; desc: string }[];
  benefits: { icon: string; title: string; desc: string }[];
}

export const servicesData: ServiceItem[] = [
  {
    id: "web-design",
    title: "Custom Website Design",
    icon: "ri-layout-line",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/web-design.jpg",
    shortDesc: "Visually stunning, responsive designs tailored to your brand and business needs.",
    fullDesc: "We craft bespoke websites that reflect your brand identity and engage your audience. Every design is built mobile-first, ensuring a flawless experience across all devices. From wireframes to final launch, we collaborate closely with you at every stage — creating websites that don't just look incredible but actually convert visitors into paying customers.",
    features: ["Custom UI/UX Design", "Mobile-First Approach", "Brand-Aligned Aesthetics", "CMS Integration", "Speed Optimised", "SEO-Ready Structure", "Accessible & WCAG Compliant"],
    process: [
      { step: 1, title: "Discovery Call", desc: "We learn about your business, goals, target audience, and design preferences." },
      { step: 2, title: "Wireframes & Concepts", desc: "We sketch the layout and structure before any pixel is designed." },
      { step: 3, title: "Design Mockups", desc: "Full high-fidelity designs presented for your review and feedback." },
      { step: 4, title: "Development & Testing", desc: "We build your site, test across all devices, and squash every bug." },
      { step: 5, title: "Launch & Handover", desc: "We go live and walk you through managing your new website." },
    ],
    benefits: [
      { icon: "ri-smartphone-line", title: "Fully Responsive", desc: "Pixel-perfect on every device — desktop, tablet, and mobile." },
      { icon: "ri-speed-line", title: "Lightning Fast", desc: "Optimised for Core Web Vitals and Google PageSpeed." },
      { icon: "ri-search-eye-line", title: "Built for SEO", desc: "Clean structure, semantic markup, and meta-optimised from day one." },
    ],
  },
  {
    id: "web-mobile",
    title: "Web & Mobile Development",
    icon: "ri-code-s-slash-line",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/Mobile-apps.jpg",
    shortDesc: "Powerful websites and applications built for speed, security, and performance.",
    fullDesc: "Our development team builds robust web and mobile applications using the latest technologies. Whether you need a complex web app or a cross-platform mobile solution, we deliver scalable, maintainable code that stands the test of time. We work with React, Next.js, Node.js, and Flutter to give you the best fit for your project.",
    features: ["React & Next.js Development", "iOS & Android Apps", "API Integration", "Secure Architecture", "Ongoing Maintenance", "Cloud Hosting Setup", "Performance Monitoring"],
    process: [
      { step: 1, title: "Requirements Gathering", desc: "We map out every feature, user journey, and technical requirement." },
      { step: 2, title: "Architecture Planning", desc: "We design the system architecture for scalability and security." },
      { step: 3, title: "Agile Development", desc: "Build in sprints with regular demos so you always see progress." },
      { step: 4, title: "QA & Testing", desc: "Rigorous testing across browsers, devices, and edge cases." },
      { step: 5, title: "Deployment & Support", desc: "Smooth deployment and ongoing technical support post-launch." },
    ],
    benefits: [
      { icon: "ri-shield-check-line", title: "Secure by Default", desc: "Industry best practices for authentication, data protection, and GDPR." },
      { icon: "ri-scales-line", title: "Built to Scale", desc: "Architecture that grows with your business without expensive rewrites." },
      { icon: "ri-customer-service-2-line", title: "Ongoing Support", desc: "We don\'t disappear after launch — we\'re here when you need us." },
    ],
  },
  {
    id: "ecommerce",
    title: "E-commerce Website Development",
    icon: "ri-shopping-cart-line",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/E-commerce-website.jpg",
    shortDesc: "Online stores built to convert, scale, and grow with your business.",
    fullDesc: "We build high-converting e-commerce platforms that make buying easy and selling effortless. From product pages to checkout flows, every element is optimised for maximum conversion. We work with WooCommerce, Shopify, and custom solutions — always with a laser focus on turning visitors into customers and customers into repeat buyers.",
    features: ["WooCommerce & Shopify", "Custom Checkout Flows", "Product Management", "Payment Gateway Integration", "Inventory Management", "Abandoned Cart Recovery", "Multi-Currency Support"],
    process: [
      { step: 1, title: "Platform Selection", desc: "We help you choose the right platform for your products and goals." },
      { step: 2, title: "Store Design", desc: "Conversion-focused design that builds trust and drives sales." },
      { step: 3, title: "Product Setup", desc: "Full catalogue setup with optimised images, descriptions, and categories." },
      { step: 4, title: "Payments & Shipping", desc: "Integrate payment gateways and configure shipping rules and zones." },
      { step: 5, title: "Launch & Marketing", desc: "Go live with an SEO foundation and launch marketing strategy." },
    ],
    benefits: [
      { icon: "ri-funds-line", title: "Conversion Optimised", desc: "Every page element is designed to reduce friction and increase sales." },
      { icon: "ri-lock-line", title: "Secure Checkout", desc: "PCI-compliant, SSL-secured, and trusted payment integrations." },
      { icon: "ri-bar-chart-line", title: "Analytics Ready", desc: "Full GA4 and ecommerce tracking so you know exactly what\'s selling." },
    ],
  },
  {
    id: "seo",
    title: "Search Engine Optimization (SEO)",
    icon: "ri-search-line",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/seo.jpg",
    shortDesc: "Get found on Google and drive organic traffic with expert SEO strategies.",
    fullDesc: "Our SEO specialists use data-driven strategies to help your business rank higher in search results. We focus on sustainable, white-hat techniques that deliver long-term growth — from technical SEO audits to content strategy and link building. Whether you\'re a local business in Leeds or targeting a national audience, we build an SEO strategy tailored specifically to your goals.",
    features: ["Keyword Research", "On-Page Optimisation", "Technical SEO Audits", "Local SEO (Leeds)", "Monthly Reporting", "Link Building", "Content Strategy"],
    process: [
      { step: 1, title: "SEO Audit", desc: "Comprehensive audit of your current site — technical, on-page, and off-page." },
      { step: 2, title: "Keyword Strategy", desc: "Research and map high-intent keywords to your key pages." },
      { step: 3, title: "On-Page Optimisation", desc: "Optimise titles, meta, headings, content, and internal linking." },
      { step: 4, title: "Technical Fixes", desc: "Fix site speed, crawlability, structured data, and mobile issues." },
      { step: 5, title: "Monitor & Report", desc: "Monthly reports showing rankings, traffic growth, and ROI." },
    ],
    benefits: [
      { icon: "ri-trophy-line", title: "Top Google Rankings", desc: "Proven track record of getting clients to page 1 for competitive terms." },
      { icon: "ri-leaf-line", title: "Long-Term Results", desc: "White-hat strategies that compound over time — no shortcuts." },
      { icon: "ri-map-pin-2-line", title: "Local SEO Experts", desc: "Specialists in Leeds and UK local SEO to dominate your area." },
    ],
  },
  {
    id: "management",
    title: "Website Management",
    icon: "ri-settings-4-line",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/wordpress-management.jpg",
    shortDesc: "Ongoing care, updates, and protection to keep your site running smoothly.",
    fullDesc: "Keep your website secure, fast, and up-to-date with our comprehensive website management packages. We handle plugin updates, security monitoring, backups, content updates, and performance optimisation so you can focus on running your business. Think of us as your dedicated web team — available whenever you need us.",
    features: ["Security Monitoring", "Regular Backups", "Plugin & CMS Updates", "Performance Optimisation", "Content Updates", "24/7 Uptime Monitoring", "Emergency Support"],
    process: [
      { step: 1, title: "Site Audit", desc: "We assess your current setup, identify risks, and create a maintenance plan." },
      { step: 2, title: "Security Hardening", desc: "Install protections, firewalls, and monitoring tools." },
      { step: 3, title: "Backup System", desc: "Set up automated daily backups stored securely off-site." },
      { step: 4, title: "Regular Maintenance", desc: "Monthly updates, speed checks, and security scans." },
      { step: 5, title: "Report & Review", desc: "Monthly reports and proactive recommendations." },
    ],
    benefits: [
      { icon: "ri-alarm-warning-line", title: "Proactive Monitoring", desc: "We catch issues before they become problems — often before you even notice." },
      { icon: "ri-time-line", title: "Saves You Time", desc: "Stop worrying about updates and security — we handle everything." },
      { icon: "ri-refresh-line", title: "Always Up-to-Date", desc: "Plugins, themes, and CMS always on the latest secure versions." },
    ],
  },
  {
    id: "graphic",
    title: "Graphic Design Services",
    icon: "ri-palette-line",
    image: "https://creativedleading.co.uk/wp-content/uploads/2025/04/web-design-photo.jpg",
    shortDesc: "Logos, branding, flyers, and everything in between to bring your brand to life.",
    fullDesc: "From logo design to full brand identity packages, our graphic designers create visuals that make your business unforgettable. We produce everything from business cards and flyers to social media graphics and presentation decks. Great design isn\'t just pretty — it communicates your values, builds trust, and sets you apart from the competition.",
    features: ["Logo & Brand Identity", "Social Media Graphics", "Print Design", "Marketing Materials", "Brand Guidelines", "Business Cards & Stationery", "Packaging Design"],
    process: [
      { step: 1, title: "Brand Discovery", desc: "We dig into your brand values, audience, and visual preferences." },
      { step: 2, title: "Concept Development", desc: "Multiple initial concepts presented for your feedback." },
      { step: 3, title: "Design Refinement", desc: "Iterate based on your feedback until the design is perfect." },
      { step: 4, title: "Final Delivery", desc: "All files delivered in every format you\'ll ever need." },
      { step: 5, title: "Brand Guidelines", desc: "A full guide on how to use your brand consistently." },
    ],
    benefits: [
      { icon: "ri-award-line", title: "Stand Out", desc: "Distinctive visuals that make you instantly recognisable in a crowded market." },
      { icon: "ri-heart-line", title: "Build Trust", desc: "Professional design signals quality and credibility to potential customers." },
      { icon: "ri-folder-check-line", title: "All Files Included", desc: "Full source files (AI, EPS, SVG, PDF, PNG) — yours to keep forever." },
    ],
  },
  {
    id: "video",
    title: "Video Animation",
    icon: "ri-film-line",
    image: stockImages.mockVideo,
    shortDesc: "Captivating animated videos that tell your brand story, explain products, and engage audiences.",
    fullDesc: "From explainer animations to full brand videos, we bring your message to life through motion. Our animation team crafts visually compelling content that captures attention on social media, websites, and presentations. We handle everything from scripting and storyboarding to final delivery in any format you need.",
    features: ["Explainer Videos", "Social Media Animations", "Motion Graphics & Intros", "Brand Story Videos", "Script & Storyboard Included", "Voice-Over Services", "Multi-Format Delivery"],
    process: [
      { step: 1, title: "Brief & Script", desc: "We write a compelling script that communicates your message clearly." },
      { step: 2, title: "Storyboard", desc: "Visual storyboard shows exactly how the animation will flow." },
      { step: 3, title: "Design & Animation", desc: "Our animators bring the storyboard to life with motion and sound." },
      { step: 4, title: "Review & Revisions", desc: "Watch the draft, give feedback, we refine until it\'s spot on." },
      { step: 5, title: "Final Delivery", desc: "Delivered in MP4, MOV, GIF, and any other format you need." },
    ],
    benefits: [
      { icon: "ri-play-circle-line", title: "Boost Engagement", desc: "Video content gets 5x more engagement than static posts on social media." },
      { icon: "ri-lightbulb-line", title: "Explain Anything", desc: "Complex products or services explained simply and memorably in 60–90 seconds." },
      { icon: "ri-global-line", title: "Works Everywhere", desc: "Optimised for website, YouTube, Instagram, LinkedIn, and more." },
    ],
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    icon: "ri-megaphone-line",
    image: stockImages.mockDigitalMarketing,
    shortDesc: "Data-driven digital marketing strategies that grow your audience, increase leads, and boost revenue.",
    fullDesc: "Reach the right people at the right time with our comprehensive digital marketing services. We develop tailored strategies across social media, email, paid ads, and content marketing to drive measurable results. Every campaign is tracked, analysed, and continuously optimised to maximise your return on investment.",
    features: ["Social Media Marketing", "Google & Meta Ads (PPC)", "Email Marketing Campaigns", "Content Marketing Strategy", "Monthly Analytics Reports", "Audience Research", "Competitor Analysis"],
    process: [
      { step: 1, title: "Strategy & Goals", desc: "Define your KPIs, audience, and channels for maximum impact." },
      { step: 2, title: "Campaign Planning", desc: "Build a multi-channel plan with content calendar and ad creatives." },
      { step: 3, title: "Launch Campaigns", desc: "Go live across chosen platforms with A/B tested ad variations." },
      { step: 4, title: "Optimise & Scale", desc: "Analyse performance data weekly and double down on what works." },
      { step: 5, title: "Monthly Reporting", desc: "Clear ROI reports showing exactly what your budget achieved." },
    ],
    benefits: [
      { icon: "ri-target-line", title: "Precision Targeting", desc: "Reach exactly the right people with laser-targeted audience segments." },
      { icon: "ri-pie-chart-line", title: "Full Transparency", desc: "Every metric tracked and reported — no vanity numbers, real ROI." },
      { icon: "ri-rocket-line", title: "Scalable Growth", desc: "Start small, prove results, then scale your budget with confidence." },
    ],
  },
  {
    id: "ppc",
    title: "Pay Per Click Advertising (PPC)",
    icon: "ri-cursor-line",
    image: stockImages.mockPpc,
    shortDesc: "Instant visibility on Google and social platforms with highly targeted ad campaigns that deliver measurable ROI.",
    fullDesc: "Stop waiting for organic traffic — PPC puts your business in front of the right people immediately. Our certified Google Ads and Meta Ads specialists build laser-targeted campaigns that maximise every penny of your ad spend. From keyword research and ad copywriting to landing page optimisation and daily bid management, we handle everything while you watch the leads roll in.",
    features: ["Google Ads (Search & Display)", "Meta Ads (Facebook & Instagram)", "Keyword Research & Bid Strategy", "Ad Copywriting & Creative", "Landing Page Optimisation", "Daily Campaign Management", "Monthly ROI Reports"],
    process: [
      { step: 1, title: "Audit & Research", desc: "Analyse your market, competitors, and best-performing keywords." },
      { step: 2, title: "Campaign Setup", desc: "Build tightly themed ad groups with compelling ad copy." },
      { step: 3, title: "Landing Pages", desc: "Create or optimise landing pages for maximum conversion rate." },
      { step: 4, title: "Launch & Monitor", desc: "Launch campaigns and monitor performance from day one." },
      { step: 5, title: "Optimise & Report", desc: "Continuous bid optimisation, A/B testing, and monthly ROI reports." },
    ],
    benefits: [
      { icon: "ri-flashlight-line", title: "Instant Results", desc: "Appear on page 1 of Google within 24 hours of campaign launch." },
      { icon: "ri-money-pound-circle-line", title: "Every Penny Tracked", desc: "Know exactly what each click, lead, and sale costs you." },
      { icon: "ri-user-star-line", title: "Certified Specialists", desc: "Google and Meta certified ads managers running your campaigns." },
    ],
  },
  {
    id: "social-media-marketing",
    title: "Social Media Marketing",
    icon: "ri-instagram-line",
    image: stockImages.mockSmm,
    shortDesc: "Build a loyal community and grow your brand across Facebook, Instagram, TikTok, and LinkedIn.",
    fullDesc: "Social media is where your customers spend their time — and we make sure your brand is there, looking brilliant. Our social media team creates engaging, on-brand content tailored to each platform, manages your community, and runs data-driven campaigns to grow your following and generate real business leads.",
    features: ["Facebook & Instagram Management", "TikTok & LinkedIn Strategy", "Content Creation & Scheduling", "Community Management & Replies", "Paid Social Ad Campaigns", "Hashtag & Audience Research", "Monthly Growth Analytics"],
    process: [
      { step: 1, title: "Social Audit", desc: "Review your existing profiles, audience, and competitors." },
      { step: 2, title: "Content Strategy", desc: "Develop a content calendar aligned with your brand and goals." },
      { step: 3, title: "Content Creation", desc: "Produce scroll-stopping graphics, videos, and captions for every post." },
      { step: 4, title: "Scheduling & Publishing", desc: "Post at optimal times for maximum reach and engagement." },
      { step: 5, title: "Engage & Grow", desc: "Respond to comments, grow your following, and report monthly." },
    ],
    benefits: [
      { icon: "ri-group-line", title: "Build Community", desc: "Turn followers into fans who advocate for your brand organically." },
      { icon: "ri-brush-line", title: "On-Brand Content", desc: "Every post looks professionally designed and consistent with your identity." },
      { icon: "ri-line-chart-line", title: "Measurable Growth", desc: "Track follower growth, reach, engagement rate, and leads generated." },
    ],
  },
];
