"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from "framer-motion";
import {
  AlarmClock,
  Bell,
  CalendarClock,
  ChevronLeft,
  CloudDownload,
  Download,
  GraduationCap,
  ListTodo,
  LogOut,
  Plus,
  PlayCircle,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Logo from "@/components/layout/Logo";
import PersianClock from "@/components/portal/PersianClock";
import IranPortalMap from "@/components/portal/IranPortalMap";
import PortalApplicationsGrid from "@/components/portal/PortalApplicationsGrid";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useDownloads } from "@/hooks/useDownloads";
import { useMeetings } from "@/hooks/useMeetings";
import { useNews } from "@/hooks/useNews";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { useEnabledPortalModules } from "@/hooks/usePortalModules";
import { useSettings } from "@/hooks/useSettings";
import { useSliders } from "@/hooks/useSliders";
import { useSystemStatuses } from "@/hooks/useSystemStatuses";
import { useTrainings } from "@/hooks/useTrainings";
import {
  useCreateNote,
  useCreateReminder,
  useCreateTask,
  useNotes,
  useReminders,
  useTasks,
  useUpdateReminder,
  useUpdateTask,
} from "@/hooks/useWorkspace";
import {
  hrNotices,
  managementNotices,
  portalDownloads,
  portalNavItems,
  systemStatuses,
} from "@/lib/portal";
import {
  getIranCalendarEvents,
  iranFixedCalendarEvents,
} from "@/lib/iran-calendar-events";
import { isUploadedIcon, portalIconMap } from "@/lib/icon-options";
import {
  normalizePortalWidgets,
  type PortalWidgetId,
} from "@/lib/portal-widgets";
import { clearAuthSession, getStoredAuthUser, type AuthUser } from "@/lib/auth";
import {
  getJalaliMonthLength,
  gregorianToJalali,
  jalaliMonthNames,
  jalaliToGregorian,
} from "@/lib/jalali";
import {
  getNotificationTargetDate,
  type PortalNotification,
} from "@/lib/notifications";

type PortalContentItem = {
  title: string;
  body: string;
  meta?: string;
  image?: string;
  attachmentUrl?: string | null;
};
type PortalWidgetEntry = {
  id: PortalWidgetId;
  node: React.ReactNode;
};

type QuickAction = "note" | "reminder" | "task";
type CalendarView = "day" | "month" | "year";

const calendarViewLabels: Record<CalendarView, string> = {
  day: "روزانه",
  month: "ماهانه",
  year: "سالانه",
};

const calendarViewMotion = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
};

const notificationTypeMeta: Record<
  string,
  {
    label: string;
    color: string;
    icon: typeof Bell;
  }
> = {
  MEETING_INVITE: {
    label: "دعوت جلسه",
    color: "text-cyan-200 bg-cyan-400/10 border-cyan-300/20",
    icon: CalendarClock,
  },
  MEETING_UPDATE: {
    label: "به‌روزرسانی جلسه",
    color: "text-cyan-200 bg-cyan-400/10 border-cyan-300/20",
    icon: CalendarClock,
  },
  REMINDER: {
    label: "یادآوری",
    color: "text-amber-200 bg-amber-400/10 border-amber-300/20",
    icon: AlarmClock,
  },
  TASK: {
    label: "تسک",
    color: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20",
    icon: ListTodo,
  },
};

const portalWidgetModuleKeys: Record<PortalWidgetId, string | null> = {
  hero: "sliders",
  announcements: "announcements",
  news: "news",
  map: "sites",
  systems: "applications",
  training: "training",
  status: "system-statuses",
  calendar: "meetings",
  workspace: "workspace",
  downloads: "downloads",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function fromLocalDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function isSameLocalDay(date: Date, value?: string | null) {
  if (!value) return false;
  return toLocalDateKey(date) === toLocalDateKey(new Date(value));
}

function getWeekdayName(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date);
}

function getPersianTime(value: string) {
  return new Date(value).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getJalaliParts(date: Date) {
  return gregorianToJalali(toLocalDateKey(date));
}

function formatJalaliDate(date: Date) {
  const jalali = getJalaliParts(date);
  if (!jalali) return "";
  return `${jalali.jd} ${jalaliMonthNames[jalali.jm - 1]} ${jalali.jy}`;
}

function isAnnouncementVisible({
  published,
  startDate,
  endDate,
}: {
  published: boolean;
  startDate: string;
  endDate?: string | null;
}) {
  if (!published) return false;

  const now = new Date();
  const startsAt = new Date(startDate);
  const endsAt = endDate ? new Date(endDate) : null;

  startsAt.setHours(0, 0, 0, 0);

  if (now < startsAt) return false;

  if (endsAt) {
    endsAt.setHours(23, 59, 59, 999);
    if (now > endsAt) return false;
  }

  return true;
}

function SectionHeader({
  title,
  onViewAll,
  viewAllHref,
}: {
  title: string;
  onViewAll?: () => void;
  viewAllHref?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-lg font-black text-white">{title}</h2>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="text-xs font-bold text-cyan-300 hover:text-cyan-100"
        >
          مشاهده همه
        </Link>
      ) : (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-cyan-300 hover:text-cyan-100"
        >
          مشاهده همه
        </button>
      )}
    </div>
  );
}

function GlassPanel({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-3xl border border-white/10 bg-slate-900/45 p-5 shadow-2xl shadow-black/25 backdrop-blur-2xl ${className}`}
    >
      {children}
    </section>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() =>
    startOfLocalDay(new Date()),
  );
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>("day");
  const [selectedContent, setSelectedContent] =
    useState<PortalContentItem | null>(null);
  const [listModal, setListModal] = useState<"announcements" | "news" | null>(
    null,
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickBody, setQuickBody] = useState("");
  const [quickDate, setQuickDate] = useState(toLocalDateKey(new Date()));
  const [quickTime, setQuickTime] = useState("09:00");
  const [quickNotifyBefore, setQuickNotifyBefore] = useState("0");
  const handledNotificationDeepLink = useRef(false);
  const { data: settings } = useSettings();
  const { data: enabledModules } = useEnabledPortalModules();
  const { data: sliders = [] } = useSliders();
  const { data: managedSystemStatuses = [] } = useSystemStatuses();
  const { data: announcements = [] } = useAnnouncements();
  const { data: news = [] } = useNews();
  const { data: downloads = [] } = useDownloads();
  const { data: trainings = [] } = useTrainings();
  const { data: meetings = [] } = useMeetings();
  const { data: notes = [] } = useNotes();
  const { data: reminders = [] } = useReminders();
  const { data: tasks = [] } = useTasks();
  const { data: notifications = [] } = useNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const browserNotifications = useBrowserNotifications(notifications);
  const createNote = useCreateNote();
  const createReminder = useCreateReminder();
  const createTask = useCreateTask();
  const updateReminder = useUpdateReminder();
  const updateTask = useUpdateTask();
  const backgroundImageUrl =
    settings?.portalBackgroundImageUrl || "/images/logo/apgt-logo.png";
  const overlayColor = settings?.portalBackgroundOverlayColor || "#020617";
  const overlayOpacity = settings?.portalBackgroundOverlayOpacity ?? 0.72;
  const portalWidgetSettings = normalizePortalWidgets(settings?.portalWidgets);
  const portalWidgetOrder = new Map(
    portalWidgetSettings.map((widget) => [widget.id, widget.order]),
  );
  const enabledPortalWidgets = new Set(
    portalWidgetSettings
      .filter((widget) => widget.enabled)
      .map((widget) => widget.id),
  );
  const enabledModuleKeys = enabledModules
    ? new Set(enabledModules.map((module) => module.key))
    : null;
  const moduleIsEnabled = (moduleKey?: string | null) =>
    !enabledModuleKeys || !moduleKey || enabledModuleKeys.has(moduleKey);
  const sortPortalWidgets = (widgets: PortalWidgetEntry[]) =>
    widgets
      .filter(
        (widget) =>
          enabledPortalWidgets.has(widget.id) &&
          moduleIsEnabled(portalWidgetModuleKeys[widget.id]),
      )
      .sort(
        (first, second) =>
          (portalWidgetOrder.get(first.id) ?? 0) -
          (portalWidgetOrder.get(second.id) ?? 0),
      );
  const visiblePortalNavItems = portalNavItems.filter((item) =>
    moduleIsEnabled(item.moduleKey),
  );
  const activeAnnouncements = announcements.filter(isAnnouncementVisible);
  const activeSliders = sliders.filter((slider) => slider.isActive);
  const heroSlider = activeSliders[0];
  const latestNews = news.filter((item) => item.published);
  const visibleAnnouncements = activeAnnouncements.slice(0, 4);
  const visibleNews = latestNews.slice(0, 4);
  const announcementItems: PortalContentItem[] =
    activeAnnouncements.length > 0
      ? activeAnnouncements.map((item) => ({
          title: item.title,
          body: item.body,
          meta: item.category
            ? `${item.category} · اولویت ${item.priority}`
            : `اولویت ${item.priority}`,
          attachmentUrl: item.attachmentUrl,
        }))
      : managementNotices.map((item) => ({
          title: item.title,
          body: item.description,
          meta: item.time,
        }));
  const newsItems: PortalContentItem[] =
    latestNews.length > 0
      ? latestNews.map((item) => ({
          title: item.title,
          body: item.body,
          meta: item.category
            ? `${item.category} · ${item.site?.name ?? "خبر سازمانی"}`
            : (item.site?.name ?? "خبر سازمانی"),
          image: item.image,
          attachmentUrl: item.attachmentUrl,
        }))
      : hrNotices.map((item) => ({
          title: item.title,
          body: item.description,
          meta: item.time,
        }));
  const todayKey = toLocalDateKey(new Date());
  const selectedDateKey = toLocalDateKey(selectedCalendarDate);
  const selectedJalaliDate = getJalaliParts(selectedCalendarDate);
  const selectedDateLabel = formatJalaliDate(selectedCalendarDate);
  const calendarDays = Array.from({ length: 7 }, (_, index) =>
    addDays(selectedCalendarDate, index - 3),
  );
  const visibleCalendarMeetings = meetings.filter(
    (meeting) => meeting.isPublished && meeting.status === "SCHEDULED",
  );
  const selectedMeetings = visibleCalendarMeetings
    .filter((meeting) => isSameLocalDay(selectedCalendarDate, meeting.startAt))
    .sort(
      (first, second) =>
        new Date(first.startAt).getTime() - new Date(second.startAt).getTime(),
    );
  const selectedReminders = reminders
    .filter((reminder) =>
      isSameLocalDay(selectedCalendarDate, reminder.remindAt),
    )
    .sort(
      (first, second) =>
        new Date(first.remindAt).getTime() -
        new Date(second.remindAt).getTime(),
    );
  const selectedTasks = tasks.filter((task) =>
    isSameLocalDay(selectedCalendarDate, task.dueDate),
  );
  const selectedNotes = notes.filter(
    (note) =>
      isSameLocalDay(selectedCalendarDate, note.updatedAt) ||
      isSameLocalDay(selectedCalendarDate, note.createdAt),
  );
  const selectedOccasions = selectedJalaliDate
    ? getIranCalendarEvents(selectedJalaliDate.jm, selectedJalaliDate.jd)
    : [];
  const selectedDayHasItems =
    selectedMeetings.length > 0 ||
    selectedReminders.length > 0 ||
    selectedTasks.length > 0 ||
    selectedNotes.length > 0 ||
    selectedOccasions.length > 0;
  const selectedMonthDays = selectedJalaliDate
    ? Array.from(
        {
          length: getJalaliMonthLength(
            selectedJalaliDate.jy,
            selectedJalaliDate.jm,
          ),
        },
        (_, index) => {
          const jalaliDay = index + 1;
          return {
            jalaliDay,
            gregorianDate: fromLocalDateKey(
              jalaliToGregorian(
                selectedJalaliDate.jy,
                selectedJalaliDate.jm,
                jalaliDay,
              ),
            ),
            occasions: getIranCalendarEvents(selectedJalaliDate.jm, jalaliDay),
          };
        },
      )
    : [];
  const selectedYearMonths = selectedJalaliDate
    ? jalaliMonthNames.map((monthName, index) => {
        const month = index + 1;
        const eventsCount = iranFixedCalendarEvents.filter(
          (event) => event.month === month,
        ).length;
        const meetingsCount = visibleCalendarMeetings.filter((meeting) => {
          const jalali = getJalaliParts(new Date(meeting.startAt));
          return jalali?.jy === selectedJalaliDate.jy && jalali?.jm === month;
        }).length;

        return {
          month,
          monthName,
          eventsCount,
          meetingsCount,
        };
      })
    : [];
  const selectedYearMonthCalendars = selectedJalaliDate
    ? jalaliMonthNames.map((monthName, index) => {
        const month = index + 1;
        const days = Array.from(
          {
            length: getJalaliMonthLength(selectedJalaliDate.jy, month),
          },
          (_, dayIndex) => {
            const jalaliDay = dayIndex + 1;
            const gregorianDate = fromLocalDateKey(
              jalaliToGregorian(selectedJalaliDate.jy, month, jalaliDay),
            );
            const occasions = getIranCalendarEvents(month, jalaliDay);
            const meetingsCount = visibleCalendarMeetings.filter((meeting) =>
              isSameLocalDay(gregorianDate, meeting.startAt),
            ).length;
            const workCount =
              reminders.filter((reminder) =>
                isSameLocalDay(gregorianDate, reminder.remindAt),
              ).length +
              tasks.filter((task) =>
                isSameLocalDay(gregorianDate, task.dueDate),
              ).length;

            return {
              jalaliDay,
              gregorianDate,
              occasions,
              meetingsCount,
              workCount,
              isHoliday: occasions.some((event) => event.isHoliday),
            };
          },
        );

        return {
          month,
          monthName,
          days,
        };
      })
    : [];
  const visibleNotes = notes.slice(0, 2);
  const visibleReminders = reminders
    .filter((reminder) => !reminder.completed)
    .slice(0, 3);
  const visibleTasks = tasks
    .filter((task) => task.status !== "DONE")
    .slice(0, 4);
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );
  const authUserName =
    authUser?.fullName ||
    [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") ||
    authUser?.directoryUser?.displayName ||
    authUser?.username;
  const visibleDownloads =
    downloads.length > 0
      ? downloads
      : portalDownloads.map((item) => ({
          id: item.title,
          title: item.title,
          version: item.version,
          description: null,
          category: null,
          fileUrl: "#",
          icon: item.icon.name,
          color: item.color,
          isActive: true,
          sortOrder: 0,
          createdAt: "",
          updatedAt: "",
        }));
  const visibleTrainings = trainings.slice(0, 4);
  const visibleSystemStatuses =
    managedSystemStatuses.length > 0
      ? managedSystemStatuses
      : systemStatuses.map((item, index) => ({
          id: item.title,
          title: item.title,
          status: item.status,
          icon: item.icon.name,
          color: [
            "#34d399",
            "#38bdf8",
            "#22d3ee",
            "#f59e0b",
            "#a78bfa",
            "#60a5fa",
          ][index % 6],
        }));
  const calendarMotionTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] };

  useEffect(() => {
    const syncAuthUser = () => setAuthUser(getStoredAuthUser());

    syncAuthUser();
    window.addEventListener("auth-user-updated", syncAuthUser);
    window.addEventListener("focus", syncAuthUser);

    return () => {
      window.removeEventListener("auth-user-updated", syncAuthUser);
      window.removeEventListener("focus", syncAuthUser);
    };
  }, []);

  function openQuickAction(action: QuickAction) {
    setQuickAction(action);
    setQuickTitle("");
    setQuickBody("");
    setQuickDate(toLocalDateKey(selectedCalendarDate));
    setQuickTime("09:00");
    setQuickNotifyBefore("0");
  }

  function logoutFromPortal() {
    clearAuthSession();
    setAuthUser(null);
    window.dispatchEvent(new Event("auth-user-updated"));
  }

  function openNotification(notification: PortalNotification) {
    if (!notification.readAt) {
      markNotificationRead.mutate(notification.id);
    }

    const targetDate = getNotificationTargetDate(notification);

    if (targetDate) {
      const date = new Date(targetDate);

      if (!Number.isNaN(date.getTime())) {
        setSelectedCalendarDate(date);
        setCalendarView("day");
        setCalendarModalOpen(true);
      }
    }

    setNotificationsOpen(false);
  }

  useEffect(() => {
    if (
      handledNotificationDeepLink.current ||
      typeof window === "undefined" ||
      notifications.length === 0
    ) {
      return;
    }

    const url = new URL(window.location.href);
    const notificationTargetId = url.searchParams.get("notification");

    if (!notificationTargetId) return;

    const notification = notifications.find(
      (item) =>
        item.id === notificationTargetId ||
        item.meetingId === notificationTargetId ||
        item.reminderId === notificationTargetId ||
        item.taskId === notificationTargetId,
    );

    if (!notification) return;

    handledNotificationDeepLink.current = true;
    openNotification(notification);
    url.searchParams.delete("notification");
    url.searchParams.delete("type");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [notifications]);

  async function submitQuickAction(event: React.FormEvent) {
    event.preventDefault();
    if (!quickAction || !quickTitle.trim()) return;

    const notifyBeforeMinutes = Number(quickNotifyBefore || 0);

    if (quickAction === "note") {
      await createNote.mutateAsync({
        title: quickTitle.trim(),
        body: quickBody.trim() || quickTitle.trim(),
        isPinned: true,
      });
    }

    if (quickAction === "reminder") {
      await createReminder.mutateAsync({
        title: quickTitle.trim(),
        description: quickBody.trim() || undefined,
        remindAt: `${quickDate}T${quickTime}:00`,
        notifyBeforeMinutes,
      });
    }

    if (quickAction === "task") {
      await createTask.mutateAsync({
        title: quickTitle.trim(),
        description: quickBody.trim() || undefined,
        dueDate: quickDate ? `${quickDate}T${quickTime}:00` : undefined,
        status: "TODO",
        priority: 1,
        notifyBeforeMinutes,
      });
    }

    setQuickAction(null);
  }

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
        <header className="mb-5 flex min-h-24 flex-nowrap items-center justify-between gap-4 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/45 px-5 py-4 shadow-2xl backdrop-blur-2xl">
          <Logo />
          <nav className="flex min-w-0 flex-1 flex-nowrap justify-center gap-2 overflow-x-auto">
            {visiblePortalNavItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-cyan-400/10 hover:text-cyan-100 ${index === 0 ? "bg-cyan-400/15 text-cyan-100 shadow-[inset_0_-2px_0_rgba(34,211,238,0.8)]" : ""}`}
                >
                  <Icon size={19} />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-4">
            <PersianClock />
            {authUser ? (
              <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 md:flex">
                <Link
                  href="/admin/profile"
                  className="flex items-center gap-2 text-xs font-black text-slate-100 hover:text-cyan-100"
                >
                  <UserRound size={17} />
                  <span className="max-w-32 truncate">{authUserName}</span>
                </Link>
                <button
                  type="button"
                  onClick={logoutFromPortal}
                  className="grid size-8 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-rose-200"
                  aria-label="خروج"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login?next=%2F"
                className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-slate-200 hover:bg-white/[0.08] md:flex"
              >
                <UserRound size={17} />
                ورود دستی
              </Link>
            )}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative grid size-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
              aria-label="نوتیفیکیشن‌ها"
            >
              <Bell size={22} />
              {unreadNotifications.length > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            {browserNotifications.isSupported &&
              browserNotifications.permission !== "granted" && (
                <button
                  type="button"
                  onClick={() => {
                    void browserNotifications.requestPermission();
                  }}
                  className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-slate-200 hover:bg-white/[0.08] md:inline-flex"
                >
                  فعال‌سازی اعلان
                </button>
              )}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 rounded-2xl border border-cyan-300/40 bg-cyan-500/10 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(14,165,233,0.18)] hover:bg-cyan-500/20"
            >
              پنل مدیریت
              <Settings size={22} />
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[460px_1fr_500px]">
          <aside className="space-y-5">
            {sortPortalWidgets([
              {
                id: "announcements",
                node: (
                  <GlassPanel id="announcements">
                    <SectionHeader
                      title="آخرین اطلاعیه ها"
                      onViewAll={() => setListModal("announcements")}
                    />
                    <div className="space-y-3">
                      {visibleAnnouncements.length > 0
                        ? visibleAnnouncements.map((notice) => (
                            <button
                              key={notice.id}
                              type="button"
                              onClick={() =>
                                setSelectedContent({
                                  title: notice.title,
                                  body: notice.body,
                                  meta: notice.category
                                    ? `${notice.category} · اولویت ${notice.priority}`
                                    : `اولویت ${notice.priority}`,
                                  attachmentUrl: notice.attachmentUrl,
                                })
                              }
                              className="w-full rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-right transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                            >
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <h3 className="font-bold">{notice.title}</h3>
                                <span className="size-2.5 rounded-full bg-cyan-300" />
                              </div>
                              <p className="text-sm leading-7 text-slate-300">
                                {notice.body}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                اولویت {notice.priority}
                              </p>
                            </button>
                          ))
                        : managementNotices.map((notice) => (
                            <button
                              key={notice.title}
                              type="button"
                              onClick={() =>
                                setSelectedContent({
                                  title: notice.title,
                                  body: notice.description,
                                  meta: notice.time,
                                })
                              }
                              className="w-full rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-right transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                            >
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <h3 className="font-bold">{notice.title}</h3>
                                <span
                                  className={`size-2.5 rounded-full ${notice.color}`}
                                />
                              </div>
                              <p className="text-sm leading-7 text-slate-300">
                                {notice.description}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                {notice.time}
                              </p>
                            </button>
                          ))}
                    </div>
                  </GlassPanel>
                ),
              },

              {
                id: "news",
                node: (
                  <GlassPanel id="hr">
                    <SectionHeader
                      title="اخبار سایت‌ها"
                      onViewAll={() => setListModal("news")}
                    />
                    <div className="space-y-3">
                      {visibleNews.length > 0
                        ? visibleNews.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                setSelectedContent({
                                  title: item.title,
                                  body: item.body,
                                  meta: item.category
                                    ? `${item.category} · ${item.site?.name ?? "خبر سازمانی"}`
                                    : (item.site?.name ?? "خبر سازمانی"),
                                  image: item.image,
                                  attachmentUrl: item.attachmentUrl,
                                })
                              }
                              className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-right transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                            >
                              <div
                                className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cover bg-center text-white"
                                style={{
                                  backgroundImage: item.image
                                    ? `url(${item.image})`
                                    : undefined,
                                }}
                              >
                                {!item.image && <CloudDownload size={24} />}
                              </div>
                              <div>
                                <h3 className="font-bold">{item.title}</h3>
                                <p className="mt-1 text-xs leading-6 text-slate-300">
                                  {item.body}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  {item.site?.name ?? "خبر سازمانی"}
                                </p>
                              </div>
                            </button>
                          ))
                        : hrNotices.map((notice) => (
                            <button
                              key={notice.title}
                              type="button"
                              onClick={() =>
                                setSelectedContent({
                                  title: notice.title,
                                  body: notice.description,
                                  meta: notice.time,
                                })
                              }
                              className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-right transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                            >
                              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
                                <CloudDownload size={24} />
                              </div>
                              <div>
                                <h3 className="font-bold">{notice.title}</h3>
                                <p className="mt-1 text-xs leading-6 text-slate-300">
                                  {notice.description}
                                </p>
                              </div>
                            </button>
                          ))}
                    </div>
                  </GlassPanel>
                ),
              },
            ]).map((widget) => (
              <Fragment key={widget.id}>{widget.node}</Fragment>
            ))}
          </aside>

          <section className="relative flex flex-col justify-between gap-5">
            {sortPortalWidgets([
              {
                id: "hero",
                node: (
                  <GlassPanel className="mx-auto w-full max-w-3xl !p-3">
                    {heroSlider ? (
                      <Link
                        href={heroSlider.url || "#announcements"}
                        target={
                          heroSlider.url?.startsWith("http")
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          heroSlider.url?.startsWith("http")
                            ? "noreferrer"
                            : undefined
                        }
                        className="relative block min-h-48 overflow-hidden rounded-2xl bg-cover bg-center p-5"
                        style={{
                          backgroundImage: `url(${heroSlider.image})`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-l from-slate-950/85 via-slate-950/45 to-transparent" />
                        <div className="relative z-10 flex min-h-40 flex-col justify-end">
                          <p className="text-sm font-black text-cyan-200">
                            پیام مدیریت
                          </p>
                          <h1 className="mt-2 text-2xl font-black text-white">
                            {heroSlider.title}
                          </h1>
                          <span className="mt-4 w-fit rounded-xl bg-cyan-400/15 px-4 py-2 text-xs font-black text-cyan-100">
                            مشاهده جزئیات
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-6 rounded-2xl bg-white/[0.04] p-3">
                        <button
                          className="grid size-10 place-items-center rounded-full text-slate-200 hover:bg-white/10"
                          aria-label="بستن پیام"
                        >
                          <X size={22} />
                        </button>
                        <div className="hidden h-36 w-56 rounded-2xl bg-gradient-to-br from-sky-200 via-slate-500 to-slate-900 md:block" />
                        <div className="flex-1 py-4">
                          <h1 className="text-2xl font-black">پیام مدیریت</h1>
                          <p className="mt-3 text-xl font-bold">
                            به پورتال سازمان خوش آمدید
                          </p>
                          <p className="mt-4 text-sm leading-7 text-slate-300">
                            در تلاش هستیم تا با ارائه بهترین خدمات، بهره‌وری
                            سازمان را افزایش دهیم.
                          </p>
                        </div>
                        <Link
                          href="#announcements"
                          className="hidden rounded-xl bg-gradient-to-l from-violet-600 to-sky-500 px-6 py-3 text-sm font-black md:inline-flex"
                        >
                          اطلاعات بیشتر
                        </Link>
                      </div>
                    )}
                  </GlassPanel>
                ),
              },

              {
                id: "map",
                node: (
                  <IranPortalMap
                    selectedSiteId={selectedSiteId}
                    onSiteSelect={setSelectedSiteId}
                  />
                ),
              },

              {
                id: "systems",
                node: (
                  <GlassPanel id="systems" className="!p-4">
                    <PortalApplicationsGrid
                      selectedSiteId={selectedSiteId}
                      onSiteSelect={setSelectedSiteId}
                    />
                  </GlassPanel>
                ),
              },

              {
                id: "training",
                node: (
                  <GlassPanel id="training">
                    <SectionHeader
                      title="کتابخانه آموزش"
                      viewAllHref="/trainings"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      {visibleTrainings.map((training) => {
                        return (
                          <Link
                            key={training.id}
                            href={`/trainings/${training.id}`}
                            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-right transition hover:border-cyan-300/40 hover:bg-white/[0.08]"
                          >
                            <div
                              className="relative h-28 bg-slate-800 bg-cover bg-center"
                              style={{
                                backgroundImage: training.thumbnail
                                  ? `url(${training.thumbnail})`
                                  : undefined,
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-slate-950/10" />
                              <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/30">
                                {training.contentType === "VIDEO" ? (
                                  <PlayCircle size={22} />
                                ) : (
                                  <GraduationCap size={22} />
                                )}
                              </span>
                            </div>
                            <div className="p-4">
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-bold text-cyan-100">
                                  {training.category?.name || "آموزش"}
                                </span>
                                {training.isRequired && (
                                  <span className="rounded-full bg-rose-400/10 px-3 py-1 text-[11px] font-bold text-rose-100">
                                    اجباری
                                  </span>
                                )}
                              </div>
                              <h3 className="line-clamp-1 font-black text-white">
                                {training.title}
                              </h3>
                              <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-300">
                                {training.description ||
                                  "محتوای آموزشی سازمانی"}
                              </p>
                              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span>
                                  {training.durationMinutes
                                    ? `${training.durationMinutes} دقیقه`
                                    : "بدون زمان"}
                                </span>
                                <span>{training.files.length} فایل</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    {visibleTrainings.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm leading-7 text-slate-300">
                        هنوز آموزش منتشرشده‌ای برای نمایش در پرتال وجود ندارد.
                      </div>
                    )}
                  </GlassPanel>
                ),
              },
            ]).map((widget) => (
              <Fragment key={widget.id}>{widget.node}</Fragment>
            ))}
          </section>

          <aside className="space-y-5">
            {sortPortalWidgets([
              {
                id: "status",
                node: (
                  <GlassPanel id="status">
                    <SectionHeader title="وضعیت سیستم ها" />
                    <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
                      {visibleSystemStatuses.map((item) => {
                        const Icon =
                          portalIconMap[item.icon || "CheckCircle2"] ??
                          ShieldCheck;
                        const uploadedIcon = isUploadedIcon(item.icon)
                          ? item.icon
                          : null;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-white/[0.03] px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="grid size-8 place-items-center rounded-lg bg-white/[0.04]"
                                style={{ color: item.color || "#38bdf8" }}
                              >
                                {uploadedIcon ? (
                                  <img
                                    src={uploadedIcon}
                                    alt=""
                                    className="size-5 object-contain"
                                  />
                                ) : (
                                  <Icon size={21} />
                                )}
                              </span>
                              <span className="font-bold">{item.title}</span>
                            </div>
                            <span
                              className="rounded-full px-3 py-1 text-xs font-bold"
                              style={{
                                backgroundColor: `${item.color || "#34d399"}22`,
                                color: item.color || "#34d399",
                              }}
                            >
                              {item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </GlassPanel>
                ),
              },

              {
                id: "calendar",
                node: (
                  <GlassPanel id="calendar">
                    <SectionHeader
                      title="تقویم جلسات"
                      onViewAll={() => setCalendarModalOpen(true)}
                    />
                    <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCalendarDate((date) => addDays(date, -7))
                          }
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                        >
                          هفته قبل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCalendarDate(new Date())}
                          className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                        >
                          امروز
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">روز انتخاب‌شده</p>
                        <p className="mt-1 text-sm font-black text-cyan-100">
                          {selectedDateLabel}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCalendarDate((date) => addDays(date, 7))
                          }
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                        >
                          هفته بعد
                        </button>
                      </div>
                    </div>
                    <div className="mb-4 grid grid-cols-7 gap-2">
                      {calendarDays.map((date) => {
                        const jalali = getJalaliParts(date);
                        const dateKey = toLocalDateKey(date);
                        const isSelected = dateKey === selectedDateKey;
                        const isToday = dateKey === todayKey;
                        const dayOccasions = jalali
                          ? getIranCalendarEvents(jalali.jm, jalali.jd)
                          : [];
                        const isHoliday = dayOccasions.some(
                          (event) => event.isHoliday,
                        );

                        return (
                          <motion.button
                            key={dateKey}
                            type="button"
                            onClick={() => setSelectedCalendarDate(date)}
                            whileHover={reduceMotion ? undefined : { y: -2 }}
                            whileTap={
                              reduceMotion ? undefined : { scale: 0.96 }
                            }
                            transition={calendarMotionTransition}
                            className={`min-w-0 rounded-2xl border p-2 text-center transition ${
                              isSelected
                                ? "border-cyan-300 bg-cyan-400/20 shadow-[0_0_22px_rgba(34,211,238,0.18)]"
                                : "border-white/10 bg-white/[0.04] hover:border-cyan-300/30"
                            }`}
                          >
                            <p
                              className={`truncate text-[10px] ${
                                isHoliday ? "text-rose-300" : "text-slate-400"
                              }`}
                            >
                              {isToday ? "امروز" : getWeekdayName(date)}
                            </p>
                            <p
                              className={`mt-1 text-lg font-black ${
                                isHoliday ? "text-rose-200" : "text-white"
                              }`}
                            >
                              {jalali?.jd ?? "-"}
                            </p>
                            {(dayOccasions.length > 0 ||
                              visibleCalendarMeetings.some((meeting) =>
                                isSameLocalDay(date, meeting.startAt),
                              ) ||
                              tasks.some((task) =>
                                isSameLocalDay(date, task.dueDate),
                              ) ||
                              reminders.some((reminder) =>
                                isSameLocalDay(date, reminder.remindAt),
                              )) && (
                              <span className="mx-auto mt-1 block size-1.5 rounded-full bg-cyan-300" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                    <motion.div
                      key={selectedDateKey}
                      variants={calendarViewMotion}
                      initial="initial"
                      animate="animate"
                      transition={calendarMotionTransition}
                      className="space-y-3"
                    >
                      {selectedOccasions.map((event) => (
                        <motion.div
                          key={event.id}
                          whileHover={reduceMotion ? undefined : { x: -2 }}
                          transition={calendarMotionTransition}
                          className={`rounded-2xl border p-4 ${
                            event.isHoliday
                              ? "border-rose-300/25 bg-rose-400/10 text-rose-100"
                              : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
                          }`}
                        >
                          <h3 className="font-bold">{event.title}</h3>
                          <p className="mt-1 text-xs opacity-80">
                            {event.isHoliday
                              ? "تعطیل رسمی"
                              : "مناسبت تقویم ایران"}
                          </p>
                        </motion.div>
                      ))}

                      {selectedMeetings.map((meeting) => (
                        <motion.div
                          key={meeting.id}
                          whileHover={reduceMotion ? undefined : { x: -2 }}
                          transition={calendarMotionTransition}
                          className="flex items-center justify-between rounded-2xl border-r-2 border-cyan-400 bg-white/[0.04] p-4"
                        >
                          <div>
                            <h3 className="font-bold">{meeting.title}</h3>
                            <p className="mt-1 text-xs text-slate-400">
                              {meeting.location || "بدون محل"} -{" "}
                              {meeting.participants.length} عضو
                            </p>
                          </div>
                          <span className="font-mono text-lg">
                            {getPersianTime(meeting.startAt)}
                          </span>
                        </motion.div>
                      ))}

                      {selectedReminders.map((reminder) => (
                        <motion.div
                          key={reminder.id}
                          whileHover={reduceMotion ? undefined : { x: -2 }}
                          transition={calendarMotionTransition}
                          className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
                        >
                          <h3 className="font-bold text-amber-100">
                            {reminder.title}
                          </h3>
                          <p className="mt-1 text-xs text-amber-100/75">
                            یادآوری در {getPersianTime(reminder.remindAt)}
                          </p>
                        </motion.div>
                      ))}

                      {selectedTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          whileHover={reduceMotion ? undefined : { x: -2 }}
                          transition={calendarMotionTransition}
                          className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4"
                        >
                          <h3 className="font-bold text-emerald-100">
                            {task.title}
                          </h3>
                          <p className="mt-1 text-xs text-emerald-100/75">
                            اولویت {task.priority}
                          </p>
                        </motion.div>
                      ))}

                      {selectedNotes.map((note) => (
                        <motion.div
                          key={note.id}
                          whileHover={reduceMotion ? undefined : { x: -2 }}
                          transition={calendarMotionTransition}
                          className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4"
                        >
                          <h3 className="font-bold text-violet-100">
                            {note.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-6 text-violet-100/75">
                            {note.body}
                          </p>
                        </motion.div>
                      ))}

                      {!selectedDayHasItems && (
                        <motion.div
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={
                            reduceMotion ? undefined : { opacity: 1, y: 0 }
                          }
                          transition={calendarMotionTransition}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300"
                        >
                          برای این روز جلسه، مناسبت، یادآوری، تسک یا یادداشتی
                          ثبت نشده است.
                        </motion.div>
                      )}
                    </motion.div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openQuickAction("reminder")}
                        className="rounded-xl bg-amber-400/15 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-400/25"
                      >
                        افزودن یادآوری
                      </button>
                      <button
                        type="button"
                        onClick={() => openQuickAction("task")}
                        className="rounded-xl bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-400/25"
                      >
                        افزودن تسک
                      </button>
                    </div>
                  </GlassPanel>
                ),
              },

              {
                id: "workspace",
                node: (
                  <GlassPanel id="workspace">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-black text-white">
                        دفترچه و کارهای من
                      </h2>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openQuickAction("note")}
                          className="grid size-8 place-items-center rounded-full bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25"
                          aria-label="افزودن یادداشت"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openQuickAction("reminder")}
                          className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-100 hover:bg-amber-400/25"
                        >
                          یادآوری
                        </button>
                        <button
                          type="button"
                          onClick={() => openQuickAction("task")}
                          className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100 hover:bg-emerald-400/25"
                        >
                          تسک
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {visibleNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <h3 className="font-bold text-cyan-100">
                            {note.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-300">
                            {note.body}
                          </p>
                        </div>
                      ))}

                      {visibleReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-amber-100">
                                {reminder.title}
                              </h3>
                              <p className="mt-1 text-xs text-amber-100/75">
                                {new Date(reminder.remindAt).toLocaleString(
                                  "fa-IR",
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                updateReminder.mutate({
                                  id: reminder.id,
                                  dto: { completed: true },
                                })
                              }
                              className="shrink-0 rounded-full bg-amber-300/20 px-3 py-1 text-[11px] font-black text-amber-50 hover:bg-amber-300/30"
                            >
                              انجام شد
                            </button>
                          </div>
                        </div>
                      ))}

                      {visibleTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div>
                            <h3 className="font-bold">{task.title}</h3>
                            <p className="mt-1 text-xs text-slate-400">
                              اولویت {task.priority}
                            </p>
                          </div>
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-bold text-cyan-200">
                            {task.status === "TODO"
                              ? "برای انجام"
                              : "در حال انجام"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateTask.mutate({
                                id: task.id,
                                dto: { status: "DONE" },
                              })
                            }
                            className="shrink-0 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/20"
                          >
                            انجام شد
                          </button>
                        </div>
                      ))}

                      {visibleNotes.length === 0 &&
                        visibleReminders.length === 0 &&
                        visibleTasks.length === 0 && (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
                            هنوز یادداشت، یادآوری یا کاری ثبت نشده است.
                          </div>
                        )}
                    </div>
                  </GlassPanel>
                ),
              },

              {
                id: "downloads",
                node: (
                  <GlassPanel id="downloads">
                    <SectionHeader title="دانلود نرم افزارها" />
                    <div className="grid grid-cols-2 gap-3">
                      {visibleDownloads.map((item) => {
                        const Icon =
                          portalIconMap[item.icon || "CloudDownload"] ??
                          CloudDownload;
                        const uploadedIcon = isUploadedIcon(item.icon)
                          ? item.icon
                          : null;
                        return (
                          <Link
                            key={item.id}
                            href={item.fileUrl}
                            target={item.fileUrl === "#" ? undefined : "_blank"}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4 hover:bg-white/10"
                          >
                            <div className="flex items-center gap-3">
                              {uploadedIcon ? (
                                <img
                                  src={uploadedIcon}
                                  alt=""
                                  className="size-8 rounded-lg object-contain"
                                />
                              ) : (
                                <Icon
                                  size={30}
                                  className={item.color || "text-cyan-300"}
                                />
                              )}
                              <div>
                                <h3 className="text-sm font-black">
                                  {item.title}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                  {item.version || item.category || "دانلود"}
                                </p>
                              </div>
                            </div>
                            <Download size={18} className="text-cyan-300" />
                          </Link>
                        );
                      })}
                    </div>
                  </GlassPanel>
                ),
              },
            ]).map((widget) => (
              <Fragment key={widget.id}>{widget.node}</Fragment>
            ))}
          </aside>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span>تمامی حقوق محفوظ است - واحد فناوری اطلاعات</span>
          <span className="h-4 w-px bg-white/20" />
          <span>نسخه 3.2.0</span>
          <span className="inline-flex items-center gap-1 text-cyan-300">
            مشاهده تقویم کامل <ChevronLeft size={14} />
          </span>
        </footer>
      </div>

      <Dialog
        open={Boolean(selectedContent)}
        onOpenChange={(open) => {
          if (!open) setSelectedContent(null);
        }}
        title={selectedContent?.title ?? ""}
      >
        {selectedContent && (
          <div className="space-y-4 text-right" dir="rtl">
            {selectedContent.image && (
              <div
                className="h-56 rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage: `url(${selectedContent.image})`,
                }}
              />
            )}
            {selectedContent.meta && (
              <p className="text-xs font-bold text-cyan-200">
                {selectedContent.meta}
              </p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-8 text-slate-200">
              {selectedContent.body}
            </p>
            {selectedContent.attachmentUrl && (
              <a
                href={selectedContent.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 hover:bg-cyan-400/20"
              >
                مشاهده پیوست
              </a>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={Boolean(listModal)}
        onOpenChange={(open) => {
          if (!open) setListModal(null);
        }}
        title={listModal === "news" ? "همه اخبار" : "همه اطلاعیه‌ها"}
      >
        <div className="space-y-3 text-right" dir="rtl">
          {(listModal === "news" ? newsItems : announcementItems).map(
            (item) => (
              <button
                key={`${item.title}-${item.meta ?? ""}`}
                type="button"
                onClick={() => {
                  setListModal(null);
                  setSelectedContent(item);
                }}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
              >
                {item.image && (
                  <div
                    className="size-16 shrink-0 rounded-xl bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${item.image})`,
                    }}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-6 text-slate-300">
                    {item.body}
                  </span>
                  {item.meta && (
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {item.meta}
                    </span>
                  )}
                </span>
              </button>
            ),
          )}
        </div>
      </Dialog>

      <Dialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        title="نوتیفیکیشن‌ها"
      >
        <div className="space-y-3 text-right" dir="rtl">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              نوتیفیکیشنی وجود ندارد.
            </div>
          ) : (
            notifications.map((notification) => {
              const meta = notificationTypeMeta[notification.type] ?? {
                label: "اعلان",
                color: "text-slate-200 bg-white/[0.04] border-white/10",
                icon: Bell,
              };
              const Icon = meta.icon;
              const targetDate = getNotificationTargetDate(notification);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={`w-full rounded-2xl border p-4 text-right transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                    notification.readAt
                      ? "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                      : "border-cyan-300/30 bg-cyan-400/10 text-white hover:bg-cyan-400/15"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl border ${meta.color}`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-black">{notification.title}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        {!notification.readAt && (
                          <span className="size-2 rounded-full bg-cyan-300" />
                        )}
                      </span>
                      {notification.body && (
                        <span className="mt-2 block text-sm leading-7">
                          {notification.body}
                        </span>
                      )}
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          {new Date(notification.createdAt).toLocaleString(
                            "fa-IR",
                          )}
                        </span>
                        {targetDate && (
                          <span className="text-cyan-200/80">
                            باز کردن در تقویم
                          </span>
                        )}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Dialog>

      <Dialog
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
        title="تقویم کامل"
        className="max-w-6xl bg-slate-950/95"
      >
        <div className="space-y-5 text-right" dir="rtl">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
            {(Object.keys(calendarViewLabels) as CalendarView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCalendarView(view)}
                className={`relative overflow-hidden rounded-xl px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                  calendarView === view
                    ? "text-cyan-50"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {calendarView === view && (
                  <motion.span
                    layoutId="calendar-view-active"
                    className="absolute inset-0 rounded-xl bg-cyan-400/20"
                    transition={calendarMotionTransition}
                  />
                )}
                <span className="relative z-10">
                  {calendarViewLabels[view]}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {calendarView === "day" && (
              <motion.div
                key="calendar-day"
                variants={calendarViewMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={calendarMotionTransition}
                className="space-y-3"
              >
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                  <p className="text-xs text-cyan-100/75">روز انتخاب‌شده</p>
                  <h3 className="mt-1 text-lg font-black text-cyan-50">
                    {selectedDateLabel}
                  </h3>
                </div>

                {selectedOccasions.map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={reduceMotion ? undefined : { x: -2 }}
                    transition={calendarMotionTransition}
                    className={`rounded-2xl border p-4 ${
                      event.isHoliday
                        ? "border-rose-300/25 bg-rose-400/10 text-rose-100"
                        : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
                    }`}
                  >
                    <h3 className="font-bold">{event.title}</h3>
                    <p className="mt-1 text-xs opacity-80">
                      {event.isHoliday ? "تعطیل رسمی" : "مناسبت تقویم ایران"}
                    </p>
                  </motion.div>
                ))}

                {selectedMeetings.map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    whileHover={reduceMotion ? undefined : { x: -2 }}
                    transition={calendarMotionTransition}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black text-white">{meeting.title}</h3>
                      <span className="font-mono text-cyan-100">
                        {getPersianTime(meeting.startAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      {meeting.location || "بدون محل"} -{" "}
                      {meeting.participants.length} عضو
                    </p>
                  </motion.div>
                ))}

                {[...selectedReminders, ...selectedTasks, ...selectedNotes].map(
                  (item) => (
                    <motion.div
                      key={item.id}
                      whileHover={reduceMotion ? undefined : { x: -2 }}
                      transition={calendarMotionTransition}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <h3 className="font-bold text-white">{item.title}</h3>
                      {"body" in item && (
                        <p className="mt-1 text-xs leading-6 text-slate-300">
                          {item.body}
                        </p>
                      )}
                      {"description" in item && item.description && (
                        <p className="mt-1 text-xs leading-6 text-slate-300">
                          {item.description}
                        </p>
                      )}
                    </motion.div>
                  ),
                )}

                {!selectedDayHasItems && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={calendarMotionTransition}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300"
                  >
                    برای این روز موردی ثبت نشده است.
                  </motion.div>
                )}
              </motion.div>
            )}

            {calendarView === "month" && (
              <motion.div
                key="calendar-month"
                variants={calendarViewMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={calendarMotionTransition}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCalendarDate((date) => addDays(date, -30))
                    }
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                  >
                    ماه قبل
                  </button>
                  <h3 className="text-base font-black text-white">
                    {selectedJalaliDate
                      ? `${jalaliMonthNames[selectedJalaliDate.jm - 1]} ${selectedJalaliDate.jy}`
                      : ""}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCalendarDate((date) => addDays(date, 30))
                    }
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                  >
                    ماه بعد
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {selectedMonthDays.map((day) => {
                    const dayKey = toLocalDateKey(day.gregorianDate);
                    const meetingsCount = visibleCalendarMeetings.filter(
                      (meeting) =>
                        isSameLocalDay(day.gregorianDate, meeting.startAt),
                    ).length;
                    const workCount =
                      reminders.filter((reminder) =>
                        isSameLocalDay(day.gregorianDate, reminder.remindAt),
                      ).length +
                      tasks.filter((task) =>
                        isSameLocalDay(day.gregorianDate, task.dueDate),
                      ).length;
                    const isSelected = dayKey === selectedDateKey;
                    const isToday = dayKey === todayKey;
                    const isHoliday = day.occasions.some(
                      (event) => event.isHoliday,
                    );

                    return (
                      <motion.button
                        key={dayKey}
                        type="button"
                        onClick={() => {
                          setSelectedCalendarDate(day.gregorianDate);
                          setCalendarView("day");
                        }}
                        whileHover={reduceMotion ? undefined : { y: -2 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                        transition={calendarMotionTransition}
                        className={`min-h-20 rounded-xl border p-2 text-right transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                          isSelected
                            ? "border-cyan-300 bg-cyan-400/20 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                            : "border-white/10 bg-white/[0.04] hover:border-cyan-300/30"
                        } ${isToday ? "ring-1 ring-cyan-300/40" : ""}`}
                      >
                        <span
                          className={`text-sm font-black ${
                            isHoliday ? "text-rose-200" : "text-white"
                          }`}
                        >
                          {day.jalaliDay}
                        </span>
                        <span className="mt-2 block text-[10px] leading-5 text-slate-400">
                          {meetingsCount > 0 && `${meetingsCount} جلسه`}
                          {meetingsCount > 0 && workCount > 0 ? "، " : ""}
                          {workCount > 0 && `${workCount} کار`}
                          {day.occasions.length > 0 && (
                            <span className="block text-rose-200">مناسبت</span>
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {calendarView === "year" && (
              <motion.div
                key="calendar-year"
                variants={calendarViewMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={calendarMotionTransition}
                className="space-y-4"
              >
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-xs text-cyan-100/70">نمای سالانه</p>
                    <h3 className="mt-1 text-lg font-black text-white">
                      سال {selectedJalaliDate?.jy}
                    </h3>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selectedYearMonthCalendars.map((month) => (
                    <motion.section
                      key={month.month}
                      whileHover={reduceMotion ? undefined : { y: -3 }}
                      transition={calendarMotionTransition}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_55px_rgba(0,0,0,0.18)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedJalaliDate) return;
                          setSelectedCalendarDate(
                            fromLocalDateKey(
                              jalaliToGregorian(
                                selectedJalaliDate.jy,
                                month.month,
                                1,
                              ),
                            ),
                          );
                          setCalendarView("month");
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-right transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                      >
                        <span className="font-black text-white">
                          {month.monthName}
                        </span>
                        <span className="text-[11px] font-bold text-cyan-100/70">
                          مشاهده ماه
                        </span>
                      </button>
                      <div className="mt-3 grid grid-cols-7 gap-1">
                        {month.days.map((day) => {
                          const dayKey = toLocalDateKey(day.gregorianDate);
                          const isSelected = dayKey === selectedDateKey;
                          const isToday = dayKey === todayKey;
                          const hasItems =
                            day.meetingsCount > 0 ||
                            day.workCount > 0 ||
                            day.occasions.length > 0;

                          return (
                            <button
                              key={dayKey}
                              type="button"
                              onClick={() => {
                                setSelectedCalendarDate(day.gregorianDate);
                                setCalendarView("day");
                              }}
                              className={`relative aspect-square rounded-lg text-[11px] font-black transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                                isSelected
                                  ? "bg-cyan-400 text-slate-950"
                                  : day.isHoliday
                                    ? "bg-rose-400/12 text-rose-100 hover:bg-rose-400/20"
                                    : "bg-white/[0.035] text-slate-200 hover:bg-cyan-400/12"
                              } ${isToday ? "ring-1 ring-cyan-300/50" : ""}`}
                            >
                              {day.jalaliDay}
                              {hasItems && (
                                <span
                                  className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${
                                    day.isHoliday
                                      ? "bg-rose-200"
                                      : "bg-cyan-300"
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.section>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(quickAction)}
        onOpenChange={(open) => {
          if (!open) setQuickAction(null);
        }}
        title={
          quickAction === "note"
            ? "افزودن یادداشت"
            : quickAction === "reminder"
              ? "افزودن یادآوری"
              : "افزودن تسک"
        }
      >
        <form
          onSubmit={submitQuickAction}
          className="space-y-4 text-right"
          dir="rtl"
        >
          <Input
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder="عنوان"
          />
          <textarea
            value={quickBody}
            onChange={(event) => setQuickBody(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="توضیحات"
          />
          {quickAction !== "note" && (
            <div className="grid gap-3 md:grid-cols-3">
              <PersianDateInput value={quickDate} onChange={setQuickDate} />
              <Input
                type="time"
                value={quickTime}
                onChange={(event) => setQuickTime(event.target.value)}
              />
              <select
                value={quickNotifyBefore}
                onChange={(event) => setQuickNotifyBefore(event.target.value)}
                className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="0">همان زمان</option>
                <option value="60">۱ ساعت قبل</option>
                <option value="180">۳ ساعت قبل</option>
                <option value="1440">۱ روز قبل</option>
                <option value="2880">۲ روز قبل</option>
              </select>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500"
            >
              ذخیره
            </button>
          </div>
        </form>
      </Dialog>
    </main>
  );
}
