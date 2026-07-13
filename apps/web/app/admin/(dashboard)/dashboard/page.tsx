"use client";

import Link from "next/link";
import {
  Activity,
  Bell,
  CalendarDays,
  CloudDownload,
  Database,
  FileText,
  Globe2,
  LayoutDashboard,
  MonitorCog,
  Newspaper,
  ShieldCheck,
  ToggleRight,
  Users,
  Vote,
} from "lucide-react";

import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useApplications } from "@/hooks/useApplications";
import { useCategories } from "@/hooks/useCategories";
import { useAdminDownloads } from "@/hooks/useDownloads";
import { useAdminMeetings } from "@/hooks/useMeetings";
import { useNews } from "@/hooks/useNews";
import { useAdminPollSurveys } from "@/hooks/usePollSurveys";
import { useAdminPortalModules } from "@/hooks/usePortalModules";
import { useSites } from "@/hooks/useSites";
import { useSliders } from "@/hooks/useSliders";
import { useAdminSystemStatuses } from "@/hooks/useSystemStatuses";
import { useUsers } from "@/hooks/useUsers";

function formatDateTime(value?: string | null) {
  if (!value) return "ثبت نشده";

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number | string;
  hint: string;
  icon: typeof LayoutDashboard;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-cyan-400/35 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h2 className="mt-3 text-3xl font-black text-white">{value}</h2>
        </div>
        <span
          className="grid size-11 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon size={23} />
        </span>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">{hint}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: applications = [], isLoading: applicationsLoading } =
    useApplications();
  const { data: categories = [] } = useCategories();
  const { data: sites = [] } = useSites();
  const { data: news = [], isLoading: newsLoading } = useNews();
  const { data: announcements = [], isLoading: announcementsLoading } =
    useAnnouncements();
  const { data: downloads = [] } = useAdminDownloads();
  const { data: meetings = [] } = useAdminMeetings();
  const { data: users = [] } = useUsers();
  const { data: sliders = [] } = useSliders();
  const { data: modules = [] } = useAdminPortalModules();
  const { data: statuses = [], isLoading: statusesLoading } =
    useAdminSystemStatuses();
  const { data: polls = [] } = useAdminPollSurveys();

  const activeModules = modules.filter(
    (module) => module.isInstalled && module.isEnabled,
  );
  const activeApplications = applications.filter((item) => item.isActive);
  const activeStatuses = statuses.filter((item) => item.isActive);
  const downStatuses = activeStatuses.filter(
    (item) => item.lastHealthState === "DOWN",
  );
  const degradedStatuses = activeStatuses.filter(
    (item) => item.lastHealthState === "DEGRADED",
  );
  const runningPolls = polls.filter((item) => item.status === "RUNNING");
  const upcomingMeetings = meetings
    .filter((meeting) => new Date(meeting.startAt) >= new Date())
    .sort(
      (first, second) =>
        new Date(first.startAt).getTime() - new Date(second.startAt).getTime(),
    )
    .slice(0, 5);
  const latestContent = [
    ...news.slice(0, 4).map((item) => ({
      id: `news-${item.id}`,
      title: item.title,
      type: "خبر",
      date: item.createdAt,
      href: "/admin/news",
      color: "bg-cyan-300",
    })),
    ...announcements.slice(0, 4).map((item) => ({
      id: `announcement-${item.id}`,
      title: item.title,
      type: "اطلاعیه",
      date: item.createdAt,
      href: "/admin/announcements",
      color: "bg-amber-300",
    })),
  ]
    .sort(
      (first, second) =>
        new Date(second.date).getTime() - new Date(first.date).getTime(),
    )
    .slice(0, 6);

  const isLoading =
    applicationsLoading || newsLoading || announcementsLoading || statusesLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-200">AGTPS Administration</p>
          <h1 className="mt-2 text-3xl font-black text-white">
            داشبورد مدیریت
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            نمای سریع وضعیت پورتال، محتواها، ماژول‌ها و سلامت سامانه‌ها.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
        >
          <Globe2 size={18} />
          نمایش پورتال
        </Link>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          در حال بارگذاری داده‌های داشبورد...
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="سامانه‌ها"
          value={applications.length}
          hint={`${activeApplications.length} سامانه فعال، ${categories.length} دسته‌بندی`}
          icon={Database}
          color="#22d3ee"
          href="/admin/applications"
        />
        <StatCard
          title="سایت‌ها"
          value={sites.length}
          hint="سایت‌ها و موقعیت‌های قابل نمایش روی نقشه"
          icon={MonitorCog}
          color="#34d399"
          href="/admin/sites"
        />
        <StatCard
          title="محتوا"
          value={news.length + announcements.length}
          hint={`${news.length} خبر و ${announcements.length} اطلاعیه`}
          icon={Newspaper}
          color="#f59e0b"
          href="/admin/news"
        />
        <StatCard
          title="کاربران"
          value={users.length}
          hint="کاربران داخلی و آماده اتصال به اکتیو دایرکتوری"
          icon={Users}
          color="#a78bfa"
          href="/admin/directory"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="وضعیت سیستم‌ها"
          value={activeStatuses.length}
          hint={`${downStatuses.length} قطع، ${degradedStatuses.length} دارای اختلال`}
          icon={ShieldCheck}
          color={downStatuses.length > 0 ? "#f87171" : "#34d399"}
          href="/admin/system-statuses"
        />
        <StatCard
          title="ماژول‌ها"
          value={activeModules.length}
          hint={`${modules.length} ماژول ثبت‌شده در سیستم`}
          icon={ToggleRight}
          color="#38bdf8"
          href="/admin/modules"
        />
        <StatCard
          title="نظرسنجی و رای‌گیری"
          value={polls.length}
          hint={`${runningPolls.length} مورد فعال در حال اجرا`}
          icon={Vote}
          color="#fb7185"
          href="/admin/polls"
        />
        <StatCard
          title="دانلودها و اسلایدر"
          value={downloads.length + sliders.length}
          hint={`${downloads.length} فایل دانلود و ${sliders.length} اسلاید`}
          icon={CloudDownload}
          color="#60a5fa"
          href="/admin/downloads"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-white">سلامت سامانه‌ها</h2>
            <Link
              href="/admin/system-statuses"
              className="text-xs font-bold text-cyan-200 hover:text-cyan-100"
            >
              مدیریت وضعیت‌ها
            </Link>
          </div>
          <div className="space-y-3">
            {activeStatuses.slice(0, 6).map((item) => {
              const color =
                item.lastHealthState === "DOWN"
                  ? "#f87171"
                  : item.lastHealthState === "DEGRADED"
                    ? "#fbbf24"
                    : item.lastHealthState === "UP"
                      ? "#34d399"
                      : "#94a3b8";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.lastCheckedAt
                        ? `آخرین بررسی: ${formatDateTime(item.lastCheckedAt)}`
                        : "هنوز بررسی نشده"}
                      {item.lastResponseTimeMs != null
                        ? ` · ${item.lastResponseTimeMs}ms`
                        : ""}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-black"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
            {activeStatuses.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                هنوز سامانه‌ای برای بررسی وضعیت ثبت نشده است.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-white">آخرین محتواها</h2>
            <div className="flex gap-3 text-xs font-bold">
              <Link href="/admin/news" className="text-cyan-200 hover:text-cyan-100">
                اخبار
              </Link>
              <Link href="/admin/announcements" className="text-amber-200 hover:text-amber-100">
                اطلاعیه‌ها
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {latestContent.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition hover:bg-slate-950/70"
              >
                <span className={`size-2.5 rounded-full ${item.color}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {item.type} · {formatDateTime(item.date)}
                  </span>
                </span>
              </Link>
            ))}
            {latestContent.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                هنوز خبر یا اطلاعیه‌ای ثبت نشده است.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays className="text-cyan-200" size={20} />
            <h2 className="text-xl font-black text-white">جلسات پیش‌رو</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {upcomingMeetings.map((meeting) => (
              <Link
                href="/admin/meetings"
                key={meeting.id}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition hover:bg-slate-950/70"
              >
                <p className="font-bold text-white">{meeting.title}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDateTime(meeting.startAt)} · {meeting.location || "بدون محل"}
                </p>
              </Link>
            ))}
            {upcomingMeetings.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400 md:col-span-2">
                جلسه پیش‌رویی ثبت نشده است.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-xl font-black text-white">میانبرهای سریع</h2>
          <div className="mt-5 grid gap-3">
            {[
              { title: "افزودن سامانه", href: "/admin/applications", icon: Database },
              { title: "ثبت اطلاعیه", href: "/admin/announcements", icon: Bell },
              { title: "ثبت خبر", href: "/admin/news", icon: FileText },
              { title: "وضعیت سیستم‌ها", href: "/admin/system-statuses", icon: Activity },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-950/70 hover:text-cyan-100"
                >
                  <span>{item.title}</span>
                  <Icon size={18} />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
