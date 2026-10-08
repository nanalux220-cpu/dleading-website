// Dleading Growth Engine™ wordmark.
export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#F69D01] to-[#F65901] flex items-center justify-center shadow-md shadow-orange-500/30">
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 16l5-5 4 4 7-7" />
          <path d="M15 8h5v5" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-[15px] font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>Growth Engine<sup className="text-[9px] font-semibold ml-0.5 opacity-70">™</sup></span>
          <span className={`block text-[10.5px] font-medium tracking-wide uppercase ${dark ? "text-white/45" : "text-gray-400"}`}>by Dleading</span>
        </span>
      )}
    </span>
  );
}
export const TAGLINE = "Turn conversations into customers — automatically.";
