"use client";

import { useEffect, useMemo, useState } from "react";
import { Sun } from "lucide-react";

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

export default function PersianClock() {
  const [now, setNow] = useState<Date | null>(null);

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

  return (
    <div className="flex items-center gap-4 text-left ltr:flex-row-reverse">
      <div className="hidden text-left md:block">
        <p className="font-mono text-lg font-black tracking-wider text-white">{display.time}</p>
        <p className="mt-1 text-[11px] text-slate-300">{display.date}</p>
      </div>
      <div className="grid size-10 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-300/30">
        <Sun size={23} />
      </div>
    </div>
  );
}
