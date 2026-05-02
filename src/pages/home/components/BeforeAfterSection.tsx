import { useState, useRef, useCallback, useEffect } from "react";
import { stockImages } from "@/config/media";

const projects = [
  {
    id: 1,
    title: "Photography Portfolio",
    category: "Web Design",
    after: stockImages.beforeAfterPhotography,
    before: stockImages.beforeAfterPhotography,
    beforeFilter: "grayscale(1) contrast(0.65) brightness(0.75) sepia(0.3)",
    description: "Turned a flat, untrustworthy site into an immersive portfolio with a built-in booking system. Client saw enquiries double in the first 30 days.",
  },
  {
    id: 2,
    title: "Cleaning Company Website",
    category: "Local Business",
    after: stockImages.beforeAfterCleaning,
    before: stockImages.beforeAfterCleaning,
    beforeFilter: "grayscale(1) contrast(0.6) brightness(0.7) sepia(0.4)",
    description: "Replaced an outdated template with a trust-first site featuring online booking and live reviews. Bookings increased within the first week of going live.",
  },
  {
    id: 3,
    title: "E-Commerce Platform",
    category: "E-commerce",
    after: stockImages.beforeAfterEcommerce,
    before: stockImages.beforeAfterEcommerce,
    beforeFilter: "grayscale(1) contrast(0.55) brightness(0.65) sepia(0.35)",
    description: "Rebuilt a slow, leaking store into a high-converting platform. Revenue grew significantly after launch with a streamlined checkout flow.",
  },
  {
    id: 4,
    title: "Graphic Design Studio",
    category: "Web Design",
    after: stockImages.beforeAfterGraphicDesign,
    before: stockImages.beforeAfterGraphicDesign,
    beforeFilter: "grayscale(1) contrast(0.6) brightness(0.7) sepia(0.3)",
    description: "Transformed a basic portfolio into a premium studio site that attracts higher-paying clients and commands better project rates.",
  },
];

interface SliderProps {
  project: typeof projects[number];
}

function BeforeAfterSlider({ project }: SliderProps) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPercent = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return 50;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    return Math.min(Math.max(pct, 2), 98);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onTouchStart = () => setDragging(true);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      setPos(getPercent(e.clientX));
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      setPos(getPercent(e.touches[0].clientX));
    };
    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, getPercent]);

  const handleContainerClick = (e: React.MouseEvent) => {
    setPos(getPercent(e.clientX));
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full h-[420px] md:h-[520px] rounded-xl overflow-hidden select-none cursor-col-resize"
      style={{ userSelect: "none" }}
    >
      {/* BEFORE — full width, filtered */}
      <div className="absolute inset-0">
        <img
          src={project.before}
          alt="Before"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top"
          style={{ filter: project.beforeFilter }}
          draggable={false}
        />
        {/* Before overlay grain */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* AFTER — clipped to right of divider */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      >
        <img
          src={project.after}
          alt="After"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 z-20"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="w-0.5 h-full bg-white/80"></div>
      </div>

      {/* Drag handle */}
      <div
        className={`absolute top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ${dragging ? "scale-110" : "scale-100"}`}
        style={{ left: `${pos}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <i className="ri-arrow-left-right-line text-gray-800 text-lg"></i>
          </div>
        </div>
      </div>

      {/* BEFORE label */}
      <div
        className="absolute top-4 left-4 z-10 transition-opacity duration-200"
        style={{ opacity: pos > 12 ? 1 : 0 }}
      >
        <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-sm">
          Before
        </span>
      </div>

      {/* AFTER label */}
      <div
        className="absolute top-4 right-4 z-10 transition-opacity duration-200"
        style={{ opacity: pos < 88 ? 1 : 0 }}
      >
        <span className="bg-gradient-to-r from-[#F69D01] to-[#F65901] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
          After
        </span>
      </div>

      {/* Hint text — fades out after drag */}
      {!dragging && pos === 50 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 whitespace-nowrap">
            <i className="ri-drag-move-line"></i>
            Drag to compare
          </span>
        </div>
      )}
    </div>
  );
}

export default function BeforeAfterSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#F65901]"></div>
            <span className="text-[#F65901] text-sm font-semibold uppercase tracking-widest">Transformations</span>
            <div className="h-px w-8 bg-[#F65901]"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Before <span className="text-[#F69D01]">&</span> After
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Drag the slider and see the difference. Every transformation is designed to get our clients more enquiries.
          </p>
        </div>

        {/* Slider */}
        <BeforeAfterSlider project={projects[active]} />

        {/* Active project info */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[#F65901] text-xs font-semibold uppercase tracking-widest">{projects[active].category}</span>
            <h3 className="text-gray-900 font-bold text-xl mt-0.5">{projects[active].title}</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-lg">{projects[active].description}</p>
          </div>
          <a
            href="https://wa.link/9m4r50"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#F69D01] to-[#F65901] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-right-line"></i>
            Transform My Website
          </a>
        </div>

        {/* Project selector thumbnails */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className={`relative rounded-lg overflow-hidden cursor-pointer group transition-all duration-300 ${
                i === active ? "ring-2 ring-[#F65901] ring-offset-2" : "opacity-60 hover:opacity-90"
              }`}
            >
              <div className="w-full h-20 sm:h-24">
                <img
                  src={p.after}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                <span className="text-white text-xs font-semibold leading-tight line-clamp-2">{p.title}</span>
              </div>
              {i === active && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#F65901] flex items-center justify-center">
                  <i className="ri-check-line text-white text-xs"></i>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
