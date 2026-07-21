"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  Moon,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { usePortalWeather } from "@/hooks/useSites";
import type { PortalSiteWeather } from "@/lib/sites";

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getWeatherVisual(
  code: number | undefined,
  isDay: boolean,
): { Icon: LucideIcon; label: string } {
  const weatherCode = code ?? 0;

  if ([95, 96, 99].includes(weatherCode)) {
    return { Icon: CloudLightning, label: "رعدوبرق" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return { Icon: CloudSnow, label: "برفی" };
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return { Icon: CloudRain, label: weatherCode >= 80 ? "رگبار" : "بارانی" };
  }
  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return { Icon: CloudDrizzle, label: "نم‌نم باران" };
  }
  if ([45, 48].includes(weatherCode)) {
    return { Icon: CloudFog, label: "مه‌آلود" };
  }
  if (weatherCode === 3) {
    return { Icon: Cloud, label: "ابری" };
  }
  if ([1, 2].includes(weatherCode)) {
    return {
      Icon: isDay ? CloudSun : CloudMoon,
      label: weatherCode === 1 ? "کمی ابری" : "نیمه‌ابری",
    };
  }
  return { Icon: isDay ? Sun : Moon, label: "صاف" };
}

export default function PersianClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const { data: weather = [], isLoading } = usePortalWeather();

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const display = useMemo(() => {
    if (!now) {
      return { time: "--:--:--", date: "در حال دریافت تاریخ" };
    }

    return {
      time: timeFormatter.format(now),
      date: dateFormatter.format(now),
    };
  }, [now]);
  const hour = now?.getHours() ?? 12;
  const isDay = hour >= 6 && hour < 18;
  const primaryWeather = weather.find((item) => item.available);
  const topBarWeather = getWeatherVisual(
    primaryWeather?.weatherCode,
    primaryWeather?.isDay ?? isDay,
  );
  const TopBarWeatherIcon = topBarWeather.Icon;

  function WeatherIcon({ item }: { item: PortalSiteWeather }) {
    const { Icon } = getWeatherVisual(item.weatherCode, item.isDay ?? isDay);
    return <Icon size={22} />;
  }

  return (
    <div
      className="relative flex items-center gap-4 text-left ltr:flex-row-reverse"
      onMouseEnter={() => setWeatherOpen(true)}
      onMouseLeave={() => setWeatherOpen(false)}
      onFocus={() => setWeatherOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setWeatherOpen(false);
      }}
    >
      <div className="hidden text-left md:block">
        <p className="font-sans text-lg font-black tracking-wide text-white">{display.time}</p>
        <p className="mt-1 text-[11px] text-slate-300">{display.date}</p>
      </div>
      <button
        type="button"
        onClick={() => setWeatherOpen((open) => !open)}
        className={`grid size-10 place-items-center rounded-2xl ring-1 transition focus:outline-none focus:ring-2 ${
          (primaryWeather?.isDay ?? isDay)
            ? "bg-amber-400/10 text-amber-300 ring-amber-300/30 focus:ring-amber-200"
            : "bg-indigo-400/10 text-indigo-200 ring-indigo-300/30 focus:ring-indigo-200"
        }`}
        aria-label={`نمایش آب‌وهوای سایت‌ها؛ ${topBarWeather.label}`}
        aria-expanded={weatherOpen}
      >
        <TopBarWeatherIcon size={23} />
      </button>

      {weatherOpen && (
        <div className="absolute left-0 top-[calc(100%+14px)] z-[100] w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-cyan-200/20 bg-slate-950/95 text-right shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-gradient-to-l from-cyan-400/10 to-indigo-400/10 px-5 py-4">
            <h2 className="font-black text-white">آب‌وهوای سایت‌ها</h2>
            <p className="mt-1 text-[11px] text-slate-400">بروزرسانی خودکار هر ۱۰ دقیقه</p>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto p-4">
            {isLoading && <p className="py-6 text-center text-sm text-slate-400">در حال دریافت اطلاعات هواشناسی...</p>}
            {!isLoading && weather.map((item) => (
              <div key={item.siteId} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={17} className="text-cyan-300" />
                    <span className="font-black text-white">{item.siteName}</span>
                  </div>
                  {item.available && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">
                        {getWeatherVisual(item.weatherCode, item.isDay ?? isDay).label}
                      </span>
                      <span className={item.isDay ? "text-amber-300" : "text-indigo-200"}>
                        <WeatherIcon item={item} />
                      </span>
                    </div>
                  )}
                </div>
                {item.available ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-cyan-400/10 p-2">
                      <p className="text-lg font-black text-cyan-100">{Math.round(item.temperature ?? 0)}°</p>
                      <p className="text-[10px] text-slate-400">دمای فعلی</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-2">
                      <p className="flex items-center justify-center gap-1 font-black"><Droplets size={14} /> {item.humidity ?? 0}٪</p>
                      <p className="mt-1 text-[10px] text-slate-400">رطوبت</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-2">
                      <p className="flex items-center justify-center gap-1 font-black"><Wind size={14} /> {Math.round(item.windSpeed ?? 0)}</p>
                      <p className="mt-1 text-[10px] text-slate-400">کیلومتر/ساعت</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-amber-400/10 px-3 py-2 text-xs leading-6 text-amber-100">
                    {item.reason === "missing_coordinates"
                      ? "مختصات جغرافیایی این سایت در تنظیمات ثبت نشده است."
                      : "اطلاعات هواشناسی موقتاً در دسترس نیست."}
                  </p>
                )}
              </div>
            ))}
            {!isLoading && weather.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">سایت فعالی برای نمایش آب‌وهوا وجود ندارد.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
