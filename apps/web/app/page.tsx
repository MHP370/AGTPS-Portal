"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft,
  CloudDownload,
  Download,
  Settings,
  X,
} from "lucide-react";
import Logo from "@/components/layout/Logo";
import PersianClock from "@/components/portal/PersianClock";
import IranPortalMap from "@/components/portal/IranPortalMap";
import PortalApplicationsGrid from "@/components/portal/PortalApplicationsGrid";
import { useSettings } from "@/hooks/useSettings";
import {
  hrNotices,
  iranCalendarEvents,
  managementNotices,
  portalDownloads,
  portalMeetings,
  portalNavItems,
  systemStatuses,
} from "@/lib/portal";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <Link href="#" className="text-xs font-bold text-cyan-300 hover:text-cyan-100">
        مشاهده همه
      </Link>
    </div>
  );
}

function GlassPanel({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-3xl border border-white/10 bg-slate-900/45 p-5 shadow-2xl shadow-black/25 backdrop-blur-2xl ${className}`}>
      {children}
    </section>
  );
}

export default function Home() {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const { data: settings } = useSettings();
  const weekDays = ["یکشنبه", "دوشنبه", "امروز", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
  const monthDays = ["۸", "۹", "۱۰", "۱۱", "۱۲", "۱۳", "۱۴"];
  const backgroundImageUrl =
    settings?.portalBackgroundImageUrl || "/images/logo/apgt-logo.png";
  const overlayColor =
    settings?.portalBackgroundOverlayColor || "#020617";
  const overlayOpacity =
    settings?.portalBackgroundOverlayOpacity ?? 0.72;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061528] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(124,58,237,0.35),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.3),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(2,6,23,0.95))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1920px] flex-col px-4 py-4">
        <header className="mb-5 flex min-h-24 flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/45 px-5 py-4 shadow-2xl backdrop-blur-2xl">
          <Logo />
          <nav className="order-3 flex w-full flex-wrap justify-center gap-2 xl:order-2 xl:w-auto">
            {portalNavItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-100 ${index === 0 ? "bg-cyan-400/15 text-cyan-100 shadow-[inset_0_-2px_0_rgba(34,211,238,0.8)]" : ""}`}>
                  <Icon size={19} />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <div className="order-2 flex items-center gap-4 xl:order-3">
            <PersianClock />
            <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-2xl border border-cyan-300/40 bg-cyan-500/10 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(14,165,233,0.18)] hover:bg-cyan-500/20">
              پنل مدیریت
              <Settings size={22} />
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[460px_1fr_500px]">
          <aside className="space-y-5">
            <GlassPanel id="announcements">
              <SectionHeader title="آخرین اطلاعیه ها" />
              <div className="space-y-3">
                {managementNotices.map((notice) => (
                  <div key={notice.title} className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="font-bold">{notice.title}</h3>
                      <span className={`size-2.5 rounded-full ${notice.color}`} />
                    </div>
                    <p className="text-sm leading-7 text-slate-300">{notice.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{notice.time}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel id="hr">
              <SectionHeader title="اطلاعیه های منابع انسانی" />
              <div className="space-y-3">
                {hrNotices.map((notice) => (
                  <div key={notice.title} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
                      <CloudDownload size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold">{notice.title}</h3>
                      <p className="mt-1 text-xs leading-6 text-slate-300">{notice.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </aside>

          <section className="relative flex flex-col justify-between gap-5">
            <GlassPanel className="mx-auto w-full max-w-3xl !p-3">
              <div className="flex items-center gap-6 rounded-2xl bg-white/[0.04] p-3">
                <button className="grid size-10 place-items-center rounded-full text-slate-200 hover:bg-white/10" aria-label="بستن پیام"><X size={22} /></button>
                <div className="hidden h-36 w-56 rounded-2xl bg-gradient-to-br from-sky-200 via-slate-500 to-slate-900 md:block" />
                <div className="flex-1 py-4">
                  <h1 className="text-2xl font-black">پیام مدیریت</h1>
                  <p className="mt-3 text-xl font-bold">به پورتال سازمان خوش آمدید</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">در تلاش هستیم تا با ارائه بهترین خدمات، بهره‌وری سازمان را افزایش دهیم.</p>
                </div>
                <Link href="#announcements" className="hidden rounded-xl bg-gradient-to-l from-violet-600 to-sky-500 px-6 py-3 text-sm font-black md:inline-flex">اطلاعات بیشتر</Link>
              </div>
            </GlassPanel>

            <IranPortalMap
              selectedSiteId={selectedSiteId}
              onSiteSelect={setSelectedSiteId}
            />

            <GlassPanel id="systems" className="!p-4">
              <PortalApplicationsGrid
                selectedSiteId={selectedSiteId}
                onSiteSelect={setSelectedSiteId}
              />
            </GlassPanel>
          </section>

          <aside className="space-y-5">
            <GlassPanel id="status">
              <SectionHeader title="وضعیت سیستم ها" />
              <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
                {systemStatuses.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center justify-between bg-white/[0.03] px-4 py-3">
                      <div className="flex items-center gap-3"><Icon size={21} className="text-sky-200" /><span className="font-bold">{item.title}</span></div>
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{item.status}</span>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>

            <GlassPanel id="calendar">
              <SectionHeader title="تقویم جلسات" />
              <div className="mb-4 grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                  <div key={day} className={`rounded-2xl border p-3 text-center ${day === "امروز" ? "border-cyan-300 bg-cyan-400/20" : "border-white/10 bg-white/[0.04]"}`}>
                    <p className="text-[11px] text-slate-400">{day}</p>
                    <p className="mt-1 text-xl font-black">{monthDays[index]}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {portalMeetings.map((meeting) => (
                  <div key={meeting.title} className={`flex items-center justify-between border-r-2 ${meeting.color} rounded-2xl bg-white/[0.04] p-4`}>
                    <div><h3 className="font-bold">{meeting.title}</h3><p className="mt-1 text-xs text-slate-400">{meeting.location}</p></div>
                    <span className="font-mono text-lg">{meeting.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-cyan-400/10 p-3 text-xs leading-6 text-cyan-100">مناسبت‌ها: {iranCalendarEvents.join("، ")}</div>
            </GlassPanel>

            <GlassPanel id="downloads">
              <SectionHeader title="دانلود نرم افزارها" />
              <div className="grid grid-cols-2 gap-3">
                {portalDownloads.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href="#" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4 hover:bg-white/10">
                      <div className="flex items-center gap-3"><Icon size={30} className={item.color} /><div><h3 className="text-sm font-black">{item.title}</h3><p className="mt-1 text-xs text-slate-400">{item.version}</p></div></div>
                      <Download size={18} className="text-cyan-300" />
                    </Link>
                  );
                })}
              </div>
            </GlassPanel>
          </aside>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span>تمامی حقوق محفوظ است - واحد فناوری اطلاعات</span>
          <span className="h-4 w-px bg-white/20" />
          <span>نسخه 3.2.0</span>
          <span className="inline-flex items-center gap-1 text-cyan-300">مشاهده تقویم کامل <ChevronLeft size={14} /></span>
        </footer>
      </div>
    </main>
  );
}
