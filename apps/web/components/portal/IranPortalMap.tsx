import { MapPin } from "lucide-react";
import { portalSites } from "@/lib/portal";

export default function IranPortalMap() {
  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-slate-950/20 p-4 md:min-h-[560px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_35%),linear-gradient(rgba(56,189,248,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.07)_1px,transparent_1px)] bg-[size:100%_100%,56px_56px,56px_56px]" />
      <div className="absolute left-[17%] top-[22%] text-sm font-semibold text-cyan-300/80">دریای خزر</div>
      <div className="absolute bottom-[20%] left-[30%] text-sm font-semibold text-cyan-300/80">خلیج فارس</div>

      <svg viewBox="0 0 760 560" className="relative z-10 h-full min-h-[390px] w-full drop-shadow-[0_0_28px_rgba(56,189,248,0.55)]" role="img" aria-label="نقشه ایران">
        <defs>
          <linearGradient id="iranFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#172554" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path
          d="M144 180 L224 128 L316 120 L385 86 L480 116 L540 96 L610 148 L622 230 L692 284 L642 350 L672 430 L586 446 L525 504 L438 474 L366 505 L312 454 L210 466 L172 388 L92 346 L118 274 Z"
          fill="url(#iranFill)"
          stroke="#7dd3fc"
          strokeWidth="4"
          filter="url(#glow)"
        />
        <path d="M224 128 L250 220 L144 180 M316 120 L330 220 L250 220 L210 300 M385 86 L430 190 L330 220 M480 116 L465 245 L540 300 M610 148 L540 300 L642 350 M118 274 L210 300 L172 388 M312 454 L350 340 L438 474 M525 504 L520 390 L586 446" fill="none" stroke="#bae6fd" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>

      {portalSites.map((site) => (
        <div key={site.title} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: site.x, top: site.y }}>
          <div className={`relative grid size-16 place-items-center rounded-full ${site.color === "cyan" ? "bg-cyan-400/20 text-cyan-200 ring-cyan-300/70" : "bg-amber-400/20 text-amber-200 ring-amber-300/70"} ring-2 shadow-[0_0_34px_currentColor]`}>
            <span className="absolute size-24 animate-ping rounded-full bg-current opacity-20" />
            <MapPin size={34} fill="currentColor" className="relative z-10" />
          </div>
          <div className="absolute right-12 top-5 whitespace-nowrap rounded-xl border border-white/20 bg-slate-950/75 px-5 py-2 text-sm font-bold text-white shadow-2xl backdrop-blur-xl">
            {site.title}
          </div>
        </div>
      ))}
    </div>
  );
}
