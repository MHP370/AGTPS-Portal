"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { portalSites } from "@/lib/portal";
import { useSites } from "@/hooks/useSites";
import type { Site } from "@/lib/sites";

type MapSite = {
  title: string;
  subtitle: string;
  x: string;
  y: string;
  color: string;
};

const knownSitePositions: Record<string, Pick<MapSite, "x" | "y">> = {
  teh: {
    x: "48%",
    y: "42%",
  },
  tehran: {
    x: "48%",
    y: "42%",
  },
  asl: {
    x: "55%",
    y: "72%",
  },
  asaluyeh: {
    x: "55%",
    y: "72%",
  },
  assaluyeh: {
    x: "55%",
    y: "72%",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function coordinateToPosition(site: Site, index: number) {
  if (
    typeof site.latitude === "number" &&
    typeof site.longitude === "number"
  ) {
    const longitudeRatio = (site.longitude - 44) / (64 - 44);
    const latitudeRatio = (40 - site.latitude) / (40 - 25);

    return {
      x: `${clamp(18 + longitudeRatio * 64, 18, 82).toFixed(1)}%`,
      y: `${clamp(20 + latitudeRatio * 58, 20, 78).toFixed(1)}%`,
    };
  }

  const normalizedCode = site.code.trim().toLowerCase();
  const normalizedName = site.name.trim().toLowerCase();
  const knownPosition =
    knownSitePositions[normalizedCode] ??
    knownSitePositions[normalizedName];

  if (knownPosition) {
    return knownPosition;
  }

  return {
    x: `${38 + (index % 4) * 8}%`,
    y: `${36 + Math.floor(index / 4) * 10}%`,
  };
}

function toMapSite(site: Site, index: number): MapSite {
  return {
    title: site.name,
    subtitle: site.description || site.code,
    color: site.color || (index % 2 === 0 ? "#22d3ee" : "#fbbf24"),
    ...coordinateToPosition(site, index),
  };
}

export default function IranPortalMap() {
  const { data: sites = [], isLoading, isError } = useSites();
  const mapSites = useMemo(() => {
    const activeSites = sites
      .filter((site) => site.isActive)
      .map(toMapSite);

    return activeSites.length > 0 ? activeSites : portalSites;
  }, [sites]);

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

      <div className="absolute right-5 top-5 z-20 rounded-full border border-white/15 bg-slate-950/70 px-4 py-2 text-xs font-bold text-slate-200 backdrop-blur-xl">
        {isLoading
          ? "در حال دریافت سایت‌ها..."
          : isError
            ? "نمایش داده پیش‌فرض"
            : `${mapSites.length} سایت فعال`}
      </div>

      {mapSites.map((site) => (
        <div key={site.title} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: site.x, top: site.y }}>
          <div
            className="relative grid size-16 place-items-center rounded-full bg-current/20 ring-2"
            style={{
              color: site.color,
              boxShadow: `0 0 34px ${site.color}`,
            }}
          >
            <span className="absolute size-24 animate-ping rounded-full bg-current opacity-20" />
            <MapPin size={34} fill="currentColor" className="relative z-10" />
          </div>
          <div className="absolute right-12 top-5 whitespace-nowrap rounded-xl border border-white/20 bg-slate-950/75 px-5 py-2 text-sm font-bold text-white shadow-2xl backdrop-blur-xl">
            <span>{site.title}</span>
            <span className="mt-1 block text-[11px] font-medium text-slate-400">
              {site.subtitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
