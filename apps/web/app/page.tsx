"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Vote,
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
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { useEnabledPortalModules } from "@/hooks/usePortalModules";
import {
  usePollSurveys,
  usePublicPollSurveyResults,
  useSubmitPollSurveyResponse,
} from "@/hooks/usePollSurveys";
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
import type { PollSurvey, PollSurveyQuestion } from "@/lib/poll-surveys";

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
type PollAnswerValue = string | string[] | number | boolean;
type NotificationReadFilter = "all" | "unread" | "read";

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

const notificationModuleKeys: Record<string, string> = {
  MEETING_INVITE: "meetings",
  MEETING_UPDATE: "meetings",
  REMINDER: "workspace",
  TASK: "workspace",
};

const portalWidgetModuleKeys: Record<PortalWidgetId, string | null> = {
  hero: "sliders",
  announcements: "announcements",
  news: "news",
  map: "sites",
  systems: "applications",
  training: "training",
  "poll-survey": "poll-survey",
  status: "system-statuses",
  calendar: "meetings",
  workspace: "workspace",
  downloads: "downloads",
};

const fixedCenterWidgetOrder: PortalWidgetId[] = [
  "hero",
  "map",
  "systems",
  "training",
];

const dismissedHeroStorageKey = "portal-hero-dismissed";
const submittedPollSurveysStorageKey = "portal-poll-surveys-submitted";

const calendarTypeStyles = {
  meeting: {
    label: "جلسات کاری",
    dot: "bg-cyan-300",
    border: "border-cyan-300/35",
    bg: "bg-cyan-400/12",
    text: "text-cyan-50",
  },
  reminder: {
    label: "یادآوری‌ها",
    dot: "bg-amber-300",
    border: "border-amber-300/35",
    bg: "bg-amber-400/12",
    text: "text-amber-50",
  },
  task: {
    label: "تسک‌ها",
    dot: "bg-emerald-300",
    border: "border-emerald-300/35",
    bg: "bg-emerald-400/12",
    text: "text-emerald-50",
  },
  note: {
    label: "یادداشت‌ها",
    dot: "bg-violet-300",
    border: "border-violet-300/35",
    bg: "bg-violet-400/12",
    text: "text-violet-50",
  },
  occasion: {
    label: "مناسبت‌ها و تعطیلات",
    dot: "bg-rose-300",
    border: "border-rose-300/35",
    bg: "bg-rose-400/12",
    text: "text-rose-50",
  },
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

function formatPersianDateTime(value?: string | null) {
  if (!value) return "بدون مهلت";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSubmittedPollSurveyIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const parsed = JSON.parse(
      localStorage.getItem(submittedPollSurveysStorageKey) || "[]",
    );

    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

function storeSubmittedPollSurveyId(id: string) {
  if (typeof window === "undefined") return new Set<string>();

  const next = getSubmittedPollSurveyIds();
  next.add(id);
  localStorage.setItem(
    submittedPollSurveysStorageKey,
    JSON.stringify(Array.from(next)),
  );

  return next;
}

function isChoiceQuestion(question: PollSurveyQuestion) {
  return (
    question.type === "SINGLE_CHOICE" ||
    question.type === "MULTIPLE_CHOICE" ||
    question.type === "YES_NO"
  );
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

function WidgetState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
      <div className="font-bold text-white">{title}</div>
      {description && <div className="mt-1 text-xs text-slate-400">{description}</div>}
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
  const [pollSurveyListOpen, setPollSurveyListOpen] = useState(false);
  const [selectedPollSurveyResultId, setSelectedPollSurveyResultId] =
    useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationReadFilter, setNotificationReadFilter] =
    useState<NotificationReadFilter>("all");
  const [notificationTypeFilter, setNotificationTypeFilter] = useState("all");
  const [notificationSearch, setNotificationSearch] = useState("");
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickBody, setQuickBody] = useState("");
  const [quickDate, setQuickDate] = useState(toLocalDateKey(new Date()));
  const [quickTime, setQuickTime] = useState("09:00");
  const [quickNotifyBefore, setQuickNotifyBefore] = useState("0");
  const [heroDismissed, setHeroDismissed] = useState(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [pollSurveyModal, setPollSurveyModal] = useState<PollSurvey | null>(
    null,
  );
  const [pollSurveyStep, setPollSurveyStep] = useState(0);
  const [pollAnswers, setPollAnswers] = useState<
    Record<string, PollAnswerValue>
  >({});
  const [submittedPollSurveyIds, setSubmittedPollSurveyIds] = useState<
    Set<string>
  >(() => new Set());
  const handledNotificationDeepLink = useRef(false);
  const { data: settings } = useSettings();
  const { data: enabledModules } = useEnabledPortalModules();
  const { data: sliders = [] } = useSliders();
  const {
    data: managedSystemStatuses = [],
    isLoading: systemStatusesLoading,
    isError: systemStatusesError,
  } = useSystemStatuses();
  const {
    data: announcements = [],
    isLoading: announcementsLoading,
    isError: announcementsError,
  } = useAnnouncements();
  const { data: news = [], isLoading: newsLoading, isError: newsError } =
    useNews();
  const {
    data: downloads = [],
    isLoading: downloadsLoading,
    isError: downloadsError,
  } = useDownloads();
  const {
    data: trainings = [],
    isLoading: trainingsLoading,
    isError: trainingsError,
  } = useTrainings();
  const {
    data: pollSurveys = [],
    isLoading: pollSurveysLoading,
    isError: pollSurveysError,
  } = usePollSurveys();
  const { data: publicPollSurveyResult } = usePublicPollSurveyResults(
    selectedPollSurveyResultId ?? undefined,
  );
  const { data: meetings = [] } = useMeetings();
  const { data: notes = [] } = useNotes();
  const { data: reminders = [] } = useReminders();
  const { data: tasks = [] } = useTasks();
  const { data: notifications = [] } = useNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const browserNotifications = useBrowserNotifications(notifications);
  const createNote = useCreateNote();
  const createReminder = useCreateReminder();
  const createTask = useCreateTask();
  const updateReminder = useUpdateReminder();
  const updateTask = useUpdateTask();
  const submitPollSurvey = useSubmitPollSurveyResponse(pollSurveyModal?.id);
  const backgroundImageUrl =
    settings?.portalBackgroundImageUrl || "/images/logo/apgt-logo.png";
  const overlayColor = settings?.portalBackgroundOverlayColor || "#020617";
  const overlayOpacity = settings?.portalBackgroundOverlayOpacity ?? 0.72;
  const portalWidgetSettings = useMemo(
    () => normalizePortalWidgets(settings?.portalWidgets),
    [settings?.portalWidgets],
  );
  const portalWidgetOrder = useMemo(
    () => new Map(portalWidgetSettings.map((widget) => [widget.id, widget.order])),
    [portalWidgetSettings],
  );
  const enabledPortalWidgets = useMemo(
    () =>
      new Set(
        portalWidgetSettings
          .filter((widget) => widget.enabled)
          .map((widget) => widget.id),
      ),
    [portalWidgetSettings],
  );
  const enabledModuleKeys = useMemo(
    () =>
      enabledModules
        ? new Set(enabledModules.map((module) => module.key))
        : null,
    [enabledModules],
  );
  const moduleIsEnabled = useCallback(
    (moduleKey?: string | null) =>
      !enabledModuleKeys || !moduleKey || enabledModuleKeys.has(moduleKey),
    [enabledModuleKeys],
  );
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
  const getFixedCenterWidgets = (widgets: PortalWidgetEntry[]) =>
    fixedCenterWidgetOrder
      .map((id) => widgets.find((widget) => widget.id === id))
      .filter((widget): widget is PortalWidgetEntry => Boolean(widget))
      .filter(
        (widget) =>
          enabledPortalWidgets.has(widget.id) &&
          moduleIsEnabled(portalWidgetModuleKeys[widget.id]) &&
          (widget.id !== "hero" || !heroDismissed),
      );
  const visiblePortalNavItems = portalNavItems.filter((item) =>
    moduleIsEnabled(item.moduleKey),
  );
  const activeAnnouncements = announcements.filter(isAnnouncementVisible);
  const activeSliders = useMemo(
    () =>
      sliders
        .filter((slider) => slider.isActive)
        .sort((first, second) => first.sortOrder - second.sortOrder),
    [sliders],
  );
  const heroSliderSignature = useMemo(
    () =>
      activeSliders
        .map((slider) =>
          [
            slider.id,
            slider.title,
            slider.image,
            slider.url ?? "",
            slider.sortOrder,
            slider.isActive ? "1" : "0",
          ].join(":"),
        )
        .join("|"),
    [activeSliders],
  );
  const heroSlider = activeSliders[heroSlideIndex] ?? activeSliders[0];
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
  const selectedMonthEventDays = selectedMonthDays.map((day) => {
    const dayMeetings = visibleCalendarMeetings.filter((meeting) =>
      isSameLocalDay(day.gregorianDate, meeting.startAt),
    );
    const dayReminders = reminders.filter((reminder) =>
      isSameLocalDay(day.gregorianDate, reminder.remindAt),
    );
    const dayTasks = tasks.filter((task) =>
      isSameLocalDay(day.gregorianDate, task.dueDate),
    );
    const dayNotes = notes.filter(
      (note) =>
        isSameLocalDay(day.gregorianDate, note.updatedAt) ||
        isSameLocalDay(day.gregorianDate, note.createdAt),
    );

    return {
      ...day,
      meetings: dayMeetings,
      reminders: dayReminders,
      tasks: dayTasks,
      notes: dayNotes,
      isHoliday: day.occasions.some((event) => event.isHoliday),
      hasItems:
        dayMeetings.length > 0 ||
        dayReminders.length > 0 ||
        dayTasks.length > 0 ||
        dayNotes.length > 0 ||
        day.occasions.length > 0,
    };
  });
  type UpcomingCalendarItem = {
    id: string;
    type: "meeting" | "reminder" | "task";
    title: string;
    date: string;
    detail: string;
  };

  const upcomingCalendarItems: UpcomingCalendarItem[] = [
    ...visibleCalendarMeetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      type: "meeting" as const,
      title: meeting.title,
      date: meeting.startAt,
      detail: meeting.location || "بدون محل",
    })),
    ...reminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      type: "reminder" as const,
      title: reminder.title,
      date: reminder.remindAt,
      detail: "یادآوری",
    })),
    ...tasks
      .filter((task) => Boolean(task.dueDate))
      .map((task) => ({
        id: `task-${task.id}`,
        type: "task" as const,
        title: task.title,
        date: task.dueDate as string,
        detail: `اولویت ${task.priority}`,
      })),
  ]
    .filter((item) => new Date(item.date) >= startOfLocalDay(new Date()))
    .sort(
      (first, second) =>
        new Date(first.date).getTime() - new Date(second.date).getTime(),
    )
    .slice(0, 6);
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
  const notificationTypes = Array.from(
    new Set(notifications.map((notification) => notification.type)),
  );
  const filteredNotifications = notifications.filter((notification) => {
    const matchesReadState =
      notificationReadFilter === "all" ||
      (notificationReadFilter === "unread" && !notification.readAt) ||
      (notificationReadFilter === "read" && Boolean(notification.readAt));
    const matchesType =
      notificationTypeFilter === "all" ||
      notification.type === notificationTypeFilter;
    const search = notificationSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      [notification.title, notification.body]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);

    return matchesReadState && matchesType && matchesSearch;
  });
  const selectedNotification =
    notifications.find((item) => item.id === selectedNotificationId) ??
    filteredNotifications[0] ??
    null;
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
  const activePollSurveys = pollSurveys
    .filter((item) => !pollSurveyIsSubmitted(item))
    .slice(0, 4);
  const pollSurveyStats = {
    total: pollSurveys.length,
    pending: pollSurveys.filter((item) => !pollSurveyIsSubmitted(item)).length,
    submitted: pollSurveys.filter((item) => pollSurveyIsSubmitted(item)).length,
  };
  const requiredPollSurvey = pollSurveys.find(
    (item) =>
      item.required &&
      item.popupEnforced &&
      !pollSurveyIsSubmitted(item),
  );
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
  const portalLayoutTransition: Transition = reduceMotion
    ? { duration: 0 }
    : {
        layout: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.12, ease: "linear" },
        y: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
      };

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      setSubmittedPollSurveyIds(getSubmittedPollSurveyIds());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      if (!heroSliderSignature) {
        setHeroDismissed(false);
        setHeroSlideIndex(0);
        return;
      }

      setHeroDismissed(
        window.sessionStorage.getItem(dismissedHeroStorageKey) ===
          heroSliderSignature,
      );
      setHeroSlideIndex((index) =>
        Math.min(index, Math.max(activeSliders.length - 1, 0)),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSliders.length, heroSliderSignature]);

  useEffect(() => {
    if (reduceMotion || heroDismissed || activeSliders.length <= 1) return;

    const timer = window.setInterval(() => {
      setHeroSlideIndex((index) => (index + 1) % activeSliders.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [activeSliders.length, heroDismissed, reduceMotion]);

  useEffect(() => {
    if (
      moduleIsEnabled("poll-survey") &&
      requiredPollSurvey &&
      !pollSurveyModal
    ) {
      const timer = window.setTimeout(() => {
        setPollSurveyStep(0);
        setPollSurveyModal(requiredPollSurvey);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [moduleIsEnabled, pollSurveyModal, requiredPollSurvey]);

  function dismissHeroSlider() {
    setHeroDismissed(true);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        dismissedHeroStorageKey,
        heroSliderSignature || "dismissed",
      );
    }
  }

  function openPollSurvey(item: PollSurvey) {
    setPollAnswers({});
    setPollSurveyStep(0);
    setPollSurveyModal(item);
  }

  function pollSurveyIsSubmitted(item: PollSurvey) {
    return item.hasSubmitted || submittedPollSurveyIds.has(item.id);
  }

  function getPollSurveyUserStatus(item: PollSurvey) {
    if (pollSurveyIsSubmitted(item)) {
      return {
        label: "پاسخ داده‌اید",
        className: "bg-emerald-400/15 text-emerald-100",
      };
    }

    if (item.deadline && new Date(item.deadline) < new Date()) {
      return {
        label: "مهلت تمام شده",
        className: "bg-slate-400/15 text-slate-200",
      };
    }

    if (item.required) {
      return {
        label: "در انتظار پاسخ اجباری",
        className: "bg-rose-400/15 text-rose-100",
      };
    }

    return {
      label: "در انتظار پاسخ",
      className: "bg-cyan-400/15 text-cyan-100",
    };
  }

  function pollSurveyIsAnswerable(item: PollSurvey) {
    return (
      !pollSurveyIsSubmitted(item) &&
      (!item.deadline || new Date(item.deadline) >= new Date())
    );
  }

  function pollSurveyResultsAreVisible(item: PollSurvey) {
    return item.allowResultViewing || item.allowLiveResults;
  }

  function updatePollAnswer(questionId: string, value: PollAnswerValue) {
    setPollAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  function togglePollAnswer(questionId: string, optionId: string) {
    setPollAnswers((current) => {
      const currentValue = current[questionId];
      const currentOptions = Array.isArray(currentValue) ? currentValue : [];
      const nextOptions = currentOptions.includes(optionId)
        ? currentOptions.filter((id) => id !== optionId)
        : [...currentOptions, optionId];

      return {
        ...current,
        [questionId]: nextOptions,
      };
    });
  }

  function questionHasAnswer(question: PollSurveyQuestion) {
    const value = pollAnswers[question.id];

    if (question.type === "MULTIPLE_CHOICE") {
      return Array.isArray(value) && value.length > 0;
    }

    if (question.type === "NUMBER" || question.type === "RATING") {
      return typeof value === "number" && Number.isFinite(value);
    }

    if (question.type === "YES_NO") {
      return typeof value === "boolean";
    }

    return typeof value === "string" && value.trim().length > 0;
  }

  function currentQuestionIsReady() {
    if (!pollSurveyModal || pollSurveyModal.type !== "SURVEY") return true;

    const question = pollSurveyModal.questions[pollSurveyStep];
    if (!question || !question.isRequired) return true;

    return questionHasAnswer(question);
  }

  function pollSurveyCanSubmit() {
    if (!pollSurveyModal) return false;

    if (pollSurveyModal.type === "SURVEY") {
      return currentQuestionIsReady();
    }

    return pollSurveyModal.questions.every(
      (question) => !question.isRequired || questionHasAnswer(question),
    );
  }

  function renderPollSurveyQuestion(question: PollSurveyQuestion) {
    const value = pollAnswers[question.id];

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="font-black text-white">{question.title}</h3>
        {question.description && (
          <p className="mt-1 text-xs leading-6 text-slate-400">
            {question.description}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {question.type === "YES_NO" && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "بله", value: true },
                { label: "خیر", value: false },
              ].map((option) => (
                <motion.button
                  key={option.label}
                  type="button"
                  onClick={() => updatePollAnswer(question.id, option.value)}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
                    value === option.value
                      ? "border-cyan-300 bg-cyan-400/20 text-cyan-50 shadow-lg shadow-cyan-500/15"
                      : "border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          )}

          {isChoiceQuestion(question) &&
            question.type !== "YES_NO" &&
            question.options.map((option) => {
              const selected =
                question.type === "MULTIPLE_CHOICE"
                  ? Array.isArray(value) && value.includes(option.id)
                  : value === option.id;

              return (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    question.type === "MULTIPLE_CHOICE"
                      ? togglePollAnswer(question.id, option.id)
                      : updatePollAnswer(question.id, option.id)
                  }
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  animate={
                    selected && !reduceMotion
                      ? { scale: 1.01 }
                      : { scale: 1 }
                  }
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right text-sm transition ${
                    selected
                      ? "border-cyan-300 bg-cyan-400/20 text-cyan-50 shadow-lg shadow-cyan-500/15"
                      : "border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <span className="font-bold">{option.label}</span>
                  <span
                    className={`size-3 rounded-full ${
                      selected ? "bg-cyan-200" : "bg-white/20"
                    }`}
                  />
                </motion.button>
              );
            })}

          {question.type === "RATING" && (
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((rate) => (
                <motion.button
                  key={rate}
                  type="button"
                  onClick={() => updatePollAnswer(question.id, rate)}
                  whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                  className={`rounded-xl border px-3 py-3 text-lg font-black transition ${
                    value === rate
                      ? "border-amber-300 bg-amber-400/20 text-amber-50 shadow-lg shadow-amber-500/15"
                      : "border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {rate}
                </motion.button>
              ))}
            </div>
          )}

          {question.type === "NUMBER" && (
            <Input
              type="number"
              value={typeof value === "number" ? value : ""}
              onChange={(event) =>
                updatePollAnswer(question.id, Number(event.target.value))
              }
            />
          )}

          {question.type === "DATE" && (
            <PersianDateInput
              value={typeof value === "string" ? value : ""}
              onChange={(nextDate) => updatePollAnswer(question.id, nextDate)}
            />
          )}

          {(question.type === "TEXT" ||
            question.type === "PARAGRAPH" ||
            question.type === "MATRIX") && (
            <textarea
              value={typeof value === "string" ? value : ""}
              onChange={(event) =>
                updatePollAnswer(question.id, event.target.value)
              }
              className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            />
          )}
        </div>
      </div>
    );
  }

  function closePollSurveyModal() {
    setPollSurveyModal(null);
    setPollAnswers({});
    setPollSurveyStep(0);
  }

  function submitCurrentPollSurvey() {
    if (!pollSurveyModal) return;

    submitPollSurvey.mutate(
      {
        answers: pollSurveyModal.questions.map((question) => {
          const value = pollAnswers[question.id];

          if (question.type === "MULTIPLE_CHOICE") {
            return {
              questionId: question.id,
              optionIds: Array.isArray(value) ? value : [],
            };
          }

          if (question.type === "YES_NO") {
            return {
              questionId: question.id,
              booleanValue: typeof value === "boolean" ? value : undefined,
            };
          }

          if (question.type === "SINGLE_CHOICE") {
            return {
              questionId: question.id,
              optionId: typeof value === "string" ? value : undefined,
            };
          }

          if (question.type === "RATING" || question.type === "NUMBER") {
            return {
              questionId: question.id,
              numberValue:
                typeof value === "number"
                  ? value
                  : Number(value || 0) || undefined,
            };
          }

          if (question.type === "DATE") {
            return {
              questionId: question.id,
              dateValue: typeof value === "string" ? value : undefined,
            };
          }

          return {
            questionId: question.id,
            textValue: typeof value === "string" ? value : undefined,
          };
        }),
      },
      {
        onSuccess: () => {
          setSubmittedPollSurveyIds(
            storeSubmittedPollSurveyId(pollSurveyModal.id),
          );
          setPollSurveyModal(null);
          setPollAnswers({});
          setPollSurveyStep(0);
        },
      },
    );
  }

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

  const openNotification = useCallback((notification: PortalNotification) => {
    if (!notification.readAt) {
      markNotificationRead.mutate(notification.id);
    }

    const requiredModuleKey = notificationModuleKeys[notification.type];

    if (requiredModuleKey && !moduleIsEnabled(requiredModuleKey)) {
      return;
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
  }, [markNotificationRead, moduleIsEnabled]);

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
    const timer = window.setTimeout(() => {
      openNotification(notification);
      url.searchParams.delete("notification");
      url.searchParams.delete("type");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [notifications, openNotification]);

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
              رفتن به داشبورد
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
                      {announcementsLoading && (
                        <WidgetState title="در حال بارگذاری اطلاعیه‌ها..." />
                      )}
                      {announcementsError && (
                        <WidgetState
                          title="بارگذاری اطلاعیه‌ها انجام نشد"
                          description="اطلاعیه‌های نمونه تا رفع اتصال نمایش داده می‌شوند."
                        />
                      )}
                      {!announcementsLoading &&
                      !announcementsError &&
                      visibleAnnouncements.length > 0
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
                        : !announcementsLoading &&
                          managementNotices.map((notice) => (
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
                      {newsLoading && (
                        <WidgetState title="در حال بارگذاری اخبار..." />
                      )}
                      {newsError && (
                        <WidgetState
                          title="بارگذاری اخبار انجام نشد"
                          description="اخبار نمونه تا رفع اتصال نمایش داده می‌شوند."
                        />
                      )}
                      {!newsLoading && !newsError && visibleNews.length > 0
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
                        : !newsLoading &&
                          hrNotices.map((notice) => (
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

          <section className="relative flex flex-col gap-5">
            <AnimatePresence initial={false} mode="popLayout">
              {getFixedCenterWidgets([
                {
                  id: "hero",
                  node: (
                    <motion.div
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? undefined
                          : { opacity: 0, scale: 0.98, y: -10 }
                      }
                      transition={portalLayoutTransition}
                      className="overflow-hidden"
                    >
                      <GlassPanel className="relative mx-auto w-full max-w-3xl !p-3">
                        <button
                          type="button"
                          onClick={dismissHeroSlider}
                          className="absolute left-6 top-6 z-20 grid size-9 place-items-center rounded-full border border-white/15 bg-slate-950/60 text-slate-200 backdrop-blur transition hover:border-rose-300/40 hover:bg-rose-500/15 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                          aria-label="حذف پیام اسلایدر"
                        >
                          <X size={18} />
                        </button>
                        {heroSlider ? (
                          <div className="relative overflow-hidden rounded-2xl">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={heroSlider.id}
                                initial={
                                  reduceMotion
                                    ? false
                                    : {
                                        opacity: 0,
                                        x: -24,
                                        filter: "blur(8px)",
                                      }
                                }
                                animate={{
                                  opacity: 1,
                                  x: 0,
                                  filter: "blur(0px)",
                                }}
                                exit={
                                  reduceMotion
                                    ? undefined
                                    : {
                                        opacity: 0,
                                        x: 24,
                                        filter: "blur(8px)",
                                      }
                                }
                                transition={
                                  reduceMotion
                                    ? { duration: 0 }
                                    : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                                }
                              >
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
                              </motion.div>
                            </AnimatePresence>

                            {activeSliders.length > 1 && (
                              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-2 backdrop-blur">
                                {activeSliders.map((slider, index) => (
                                  <button
                                    key={slider.id}
                                    type="button"
                                    onClick={() => setHeroSlideIndex(index)}
                                    className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                                      index === heroSlideIndex
                                        ? "w-6 bg-cyan-300"
                                        : "w-2 bg-white/35 hover:bg-white/60"
                                    }`}
                                    aria-label={`نمایش اسلاید ${index + 1}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-6 rounded-2xl bg-white/[0.04] p-3">
                            <div className="hidden h-36 w-56 rounded-2xl bg-gradient-to-br from-sky-200 via-slate-500 to-slate-900 md:block" />
                            <div className="flex-1 py-4">
                              <h1 className="text-2xl font-black">
                                پیام مدیریت
                              </h1>
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
                    </motion.div>
                  ),
                },

                {
                  id: "map",
                  node: (
                    <IranPortalMap
                      selectedSiteId={selectedSiteId}
                      onSiteSelect={setSelectedSiteId}
                      showApplications={moduleIsEnabled("applications")}
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
                        {trainingsLoading && (
                          <WidgetState title="در حال بارگذاری آموزش‌ها..." />
                        )}
                        {trainingsError && (
                          <WidgetState
                            title="بارگذاری آموزش‌ها انجام نشد"
                            description="لطفا اتصال API را بررسی کنید."
                          />
                        )}
                        {!trainingsLoading &&
                          !trainingsError &&
                          visibleTrainings.map((training) => {
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
                      {!trainingsLoading &&
                        !trainingsError &&
                        visibleTrainings.length === 0 && (
                          <WidgetState title="هنوز آموزش منتشرشده‌ای برای نمایش در پرتال وجود ندارد." />
                      )}
                    </GlassPanel>
                  ),
                },
              ]).map((widget) => (
                <motion.div
                  key={widget.id}
                  layout="position"
                  transition={portalLayoutTransition}
                >
                  {widget.node}
                </motion.div>
              ))}
            </AnimatePresence>
          </section>

          <aside className="space-y-5">
            {sortPortalWidgets([
              {
                id: "poll-survey",
                node: (
                  <GlassPanel id="poll-survey">
                    <SectionHeader
                      title="نظرسنجی و رای‌گیری"
                      onViewAll={() => setPollSurveyListOpen(true)}
                    />
                    <div className="mb-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                        <div className="font-black text-white">
                          {pollSurveyStats.total}
                        </div>
                        <div className="mt-1 text-slate-400">کل</div>
                      </div>
                      <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-2">
                        <div className="font-black text-cyan-100">
                          {pollSurveyStats.pending}
                        </div>
                        <div className="mt-1 text-cyan-100/70">در انتظار</div>
                      </div>
                      <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-2">
                        <div className="font-black text-emerald-100">
                          {pollSurveyStats.submitted}
                        </div>
                        <div className="mt-1 text-emerald-100/70">
                          پاسخ داده
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {pollSurveysLoading && (
                        <WidgetState title="در حال بارگذاری نظرسنجی‌ها..." />
                      )}
                      {pollSurveysError && (
                        <WidgetState
                          title="بارگذاری نظرسنجی و رای‌گیری انجام نشد"
                          description="بعد از اتصال API دوباره تلاش کنید."
                        />
                      )}
                      {!pollSurveysLoading &&
                        !pollSurveysError &&
                        activePollSurveys.map((item) => (
                          <button
                          key={item.id}
                          type="button"
                          onClick={() => openPollSurvey(item)}
                          className={`w-full rounded-2xl border p-4 text-right transition hover:border-cyan-300/35 hover:bg-white/[0.08] ${
                            item.required
                              ? "border-rose-300/25 bg-rose-400/10"
                              : "border-white/10 bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/20">
                              <Vote size={22} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-black text-white">
                                  {item.title}
                                </span>
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                                  {item.type === "POLL"
                                    ? "رای‌گیری"
                                    : "نظرسنجی"}
                                </span>
                                {item.required && (
                                  <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] font-bold text-rose-100">
                                    اجباری
                                  </span>
                                )}
                              </span>
                              <span className="mt-2 line-clamp-2 block text-xs leading-6 text-slate-300">
                                {item.description || "برای ثبت پاسخ کلیک کنید."}
                              </span>
                              <span className="mt-2 block text-[11px] text-slate-500">
                                {item.anonymous ? "ناشناس" : "با نام"} ·{" "}
                                {item.deadline
                                  ? `مهلت ${formatPersianDateTime(item.deadline)}`
                                  : "بدون مهلت"}
                              </span>
                              <span
                                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getPollSurveyUserStatus(item).className}`}
                              >
                                {getPollSurveyUserStatus(item).label}
                              </span>
                            </span>
                          </div>
                          </button>
                        ))}

                      {!pollSurveysLoading &&
                        !pollSurveysError &&
                        activePollSurveys.length === 0 && (
                          <WidgetState title="رای‌گیری یا نظرسنجی فعالی برای شما وجود ندارد." />
                      )}
                    </div>
                  </GlassPanel>
                ),
              },
              {
                id: "status",
                node: (
                  <GlassPanel id="status">
                    <SectionHeader title="وضعیت سیستم ها" />
                    <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
                      {systemStatusesLoading && (
                        <div className="p-3">
                          <WidgetState title="در حال بررسی وضعیت سیستم‌ها..." />
                        </div>
                      )}
                      {systemStatusesError && (
                        <div className="p-3">
                          <WidgetState
                            title="بارگذاری وضعیت سیستم‌ها انجام نشد"
                            description="در صورت ادامه خطا، API را بررسی کنید."
                          />
                        </div>
                      )}
                      {!systemStatusesLoading &&
                        !systemStatusesError &&
                        visibleSystemStatuses.map((item) => {
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
                                  <Image
                                    src={uploadedIcon}
                                    alt=""
                                    width={20}
                                    height={20}
                                    unoptimized
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
                      {downloadsLoading && (
                        <WidgetState title="در حال بارگذاری دانلودها..." />
                      )}
                      {downloadsError && (
                        <WidgetState
                          title="بارگذاری دانلودها انجام نشد"
                          description="بعد از اتصال API دوباره بررسی کنید."
                        />
                      )}
                      {!downloadsLoading &&
                        !downloadsError &&
                        visibleDownloads.map((item) => {
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
                                <Image
                                  src={uploadedIcon}
                                  alt=""
                                  width={32}
                                  height={32}
                                  unoptimized
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
        open={pollSurveyListOpen}
        onOpenChange={(open) => {
          setPollSurveyListOpen(open);
          if (!open) setSelectedPollSurveyResultId(null);
        }}
        title="همه نظرسنجی‌ها و رای‌گیری‌ها"
        className="max-w-5xl bg-slate-950/95"
      >
        <div className="space-y-5 text-right" dir="rtl">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs text-slate-400">کل موارد</div>
              <div className="mt-2 text-2xl font-black text-white">
                {pollSurveyStats.total}
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
              <div className="text-xs text-cyan-100/70">در انتظار پاسخ</div>
              <div className="mt-2 text-2xl font-black text-cyan-100">
                {pollSurveyStats.pending}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
              <div className="text-xs text-emerald-100/70">پاسخ داده‌شده</div>
              <div className="mt-2 text-2xl font-black text-emerald-100">
                {pollSurveyStats.submitted}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
              {pollSurveys.map((item) => {
                const status = getPollSurveyUserStatus(item);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-white">
                            {item.title}
                          </h3>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                            {item.type === "POLL" ? "رای‌گیری" : "نظرسنجی"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-300">
                          {item.description || "بدون توضیح"}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500">
                          {item.anonymous ? "ناشناس" : "با نام"} ·{" "}
                          {item.deadline
                            ? `مهلت ${formatPersianDateTime(item.deadline)}`
                            : "بدون مهلت"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {pollSurveyIsAnswerable(item) && (
                          <button
                            type="button"
                            onClick={() => {
                              setPollSurveyListOpen(false);
                              openPollSurvey(item);
                            }}
                            className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-black text-white hover:bg-cyan-400"
                          >
                            پاسخ دادن
                          </button>
                        )}
                        {pollSurveyResultsAreVisible(item) && (
                          <button
                            type="button"
                            onClick={() => setSelectedPollSurveyResultId(item.id)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                          >
                            مشاهده نتیجه
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {pollSurveys.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-300">
                  موردی برای نمایش وجود ندارد.
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              {publicPollSurveyResult ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-cyan-200">
                      نتیجه قابل مشاهده
                    </div>
                    <h3 className="mt-1 font-black text-white">
                      {publicPollSurveyResult.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {publicPollSurveyResult.totalResponses} پاسخ ثبت شده
                    </p>
                  </div>
                  <div className="max-h-[46vh] space-y-4 overflow-y-auto pr-1">
                    {publicPollSurveyResult.questions.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                      >
                        <div className="text-sm font-bold text-white">
                          {question.title}
                        </div>
                        <div className="mt-3 space-y-2">
                          {question.options.map((option) => {
                            const percent = publicPollSurveyResult.totalResponses
                              ? (option.count /
                                  publicPollSurveyResult.totalResponses) *
                                100
                              : 0;

                            return (
                              <div key={option.id}>
                                <div className="mb-1 flex justify-between gap-2 text-[11px] text-slate-300">
                                  <span>{option.label}</span>
                                  <span>{Math.round(percent)}٪</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className="h-full rounded-full bg-cyan-400"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {question.average !== null && (
                            <div className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                              میانگین: {question.average.toFixed(1)}
                            </div>
                          )}
                          {question.options.length === 0 &&
                            question.average === null && (
                              <div className="text-xs leading-6 text-slate-400">
                                پاسخ‌های متنی در نمای عمومی نمایش داده
                                نمی‌شوند.
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid h-full min-h-56 place-items-center rounded-xl border border-dashed border-white/15 p-6 text-center text-sm leading-7 text-slate-400">
                  برای مواردی که اجازه نمایش نتیجه دارند، دکمه مشاهده نتیجه را
                  بزنید.
                </div>
              )}
            </aside>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(pollSurveyModal)}
        onOpenChange={(open) => {
          if (
            !open &&
            pollSurveyModal?.required &&
            pollSurveyModal.popupEnforced
          ) {
            return;
          }

          if (!open) {
            closePollSurveyModal();
          }
        }}
        title={pollSurveyModal?.title ?? "نظرسنجی و رای‌گیری"}
        className="max-w-3xl bg-slate-950/95"
      >
        {pollSurveyModal && (
          <div className="space-y-5 text-right" dir="rtl">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  {pollSurveyModal.type === "POLL" ? "رای‌گیری" : "نظرسنجی"}
                </span>
                {pollSurveyModal.required && (
                  <span className="rounded-full bg-rose-400/15 px-3 py-1 text-xs font-bold text-rose-100">
                    اجباری
                  </span>
                )}
                {pollSurveyModal.anonymous && (
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100">
                    ناشناس
                  </span>
                )}
              </div>
              {pollSurveyModal.description && (
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {pollSurveyModal.description}
                </p>
              )}
            </div>

            {submitPollSurvey.isError && (
              <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-3 text-sm font-bold leading-7 text-rose-100">
                {submitPollSurvey.error instanceof Error
                  ? submitPollSurvey.error.message
                  : "ثبت پاسخ انجام نشد. دوباره تلاش کنید."}
              </div>
            )}

            {pollSurveyModal.type === "SURVEY" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
                  <span>
                    سوال {pollSurveyStep + 1} از{" "}
                    {pollSurveyModal.questions.length}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-cyan-400"
                      animate={{
                        width: `${((pollSurveyStep + 1) / Math.max(pollSurveyModal.questions.length, 1)) * 100}%`,
                      }}
                      transition={reduceMotion ? { duration: 0 } : undefined}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {pollSurveyModal.questions[pollSurveyStep] && (
                    <motion.div
                      key={pollSurveyModal.questions[pollSurveyStep].id}
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, x: -20, filter: "blur(6px)" }
                      }
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={
                        reduceMotion
                          ? undefined
                          : { opacity: 0, x: 20, filter: "blur(6px)" }
                      }
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.2, ease: "easeOut" }
                      }
                    >
                      {renderPollSurveyQuestion(
                        pollSurveyModal.questions[pollSurveyStep],
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-3">
                {pollSurveyModal.questions.map((question) => (
                  <motion.div
                    key={question.id}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: 10, filter: "blur(4px)" }
                    }
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={reduceMotion ? { duration: 0 } : undefined}
                  >
                    {renderPollSurveyQuestion(question)}
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              {(!pollSurveyModal.required ||
                !pollSurveyModal.popupEnforced) && (
                <button
                  type="button"
                  onClick={closePollSurveyModal}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
                >
                  بعدا
                </button>
              )}
              {pollSurveyModal.type === "SURVEY" &&
                pollSurveyStep > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPollSurveyStep((step) => Math.max(step - 1, 0))
                    }
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
                  >
                    قبلی
                  </button>
                )}
              {pollSurveyModal.type === "SURVEY" &&
              pollSurveyStep < pollSurveyModal.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setPollSurveyStep((step) =>
                      Math.min(step + 1, pollSurveyModal.questions.length - 1),
                    )
                  }
                  disabled={!currentQuestionIsReady()}
                  className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-black text-white hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  بعدی
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitCurrentPollSurvey}
                  disabled={
                    submitPollSurvey.isPending || !pollSurveyCanSubmit()
                  }
                  className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-black text-white hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ثبت پاسخ
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>

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
        onOpenChange={(open) => {
          setNotificationsOpen(open);
          if (!open) setSelectedNotificationId(null);
        }}
        title="مرکز اعلان‌ها"
        className="max-w-5xl bg-slate-950/95"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs text-slate-400">کل اعلان‌ها</div>
              <div className="mt-2 text-2xl font-black text-white">
                {notifications.length}
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
              <div className="text-xs text-cyan-100/70">نخوانده</div>
              <div className="mt-2 text-2xl font-black text-cyan-100">
                {unreadNotifications.length}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
              <div className="text-xs text-emerald-100/70">خوانده‌شده</div>
              <div className="mt-2 text-2xl font-black text-emerald-100">
                {notifications.length - unreadNotifications.length}
              </div>
            </div>
            <button
              type="button"
              onClick={() => markAllNotificationsRead.mutate()}
              disabled={
                unreadNotifications.length === 0 ||
                markAllNotificationsRead.isPending
              }
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              همه خوانده شد
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <Input
              value={notificationSearch}
              onChange={(event) => setNotificationSearch(event.target.value)}
              placeholder="جستجو در عنوان و متن اعلان..."
            />
            <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
              {[
                { id: "all", label: "همه" },
                { id: "unread", label: "نخوانده" },
                { id: "read", label: "خوانده‌شده" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setNotificationReadFilter(
                      item.id as NotificationReadFilter,
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                    notificationReadFilter === item.id
                      ? "bg-cyan-400/20 text-cyan-50"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setNotificationTypeFilter("all")}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black transition ${
                  notificationTypeFilter === "all"
                    ? "bg-cyan-400/20 text-cyan-50"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                همه نوع‌ها
              </button>
              {notificationTypes.map((type) => {
                const meta = notificationTypeMeta[type] ?? {
                  label: "اعلان",
                  color: "text-slate-200 bg-white/[0.04] border-white/10",
                  icon: Bell,
                };

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNotificationTypeFilter(type)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black transition ${
                      notificationTypeFilter === type
                        ? "bg-cyan-400/20 text-cyan-50"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              نوتیفیکیشنی وجود ندارد.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {filteredNotifications.map((notification) => {
                    const meta = notificationTypeMeta[notification.type] ?? {
                      label: "اعلان",
                      color: "text-slate-200 bg-white/[0.04] border-white/10",
                      icon: Bell,
                    };
                    const Icon = meta.icon;
                    const active = selectedNotificationId === notification.id;

                    return (
                      <motion.button
                        key={notification.id}
                        type="button"
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        onClick={() => setSelectedNotificationId(notification.id)}
                        className={`w-full rounded-2xl border p-4 text-right transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                          active
                            ? "border-cyan-300/40 bg-cyan-400/12 text-white"
                            : notification.readAt
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
                              <span className="font-black">
                                {notification.title}
                              </span>
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
                              <span className="mt-2 line-clamp-2 block text-sm leading-7">
                                {notification.body}
                              </span>
                            )}
                            <span className="mt-2 block text-xs text-slate-500">
                              {new Date(notification.createdAt).toLocaleString(
                                "fa-IR",
                              )}
                            </span>
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {filteredNotifications.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-300">
                    اعلان مطابق فیلترها پیدا نشد.
                  </div>
                )}
              </div>

              <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                {selectedNotification ? (
                  (() => {
                    const meta = notificationTypeMeta[
                      selectedNotification.type
                    ] ?? {
                      label: "اعلان",
                      color: "text-slate-200 bg-white/[0.04] border-white/10",
                      icon: Bell,
                    };
                    const Icon = meta.icon;
                    const targetDate =
                      getNotificationTargetDate(selectedNotification);
                    const requiredModuleKey =
                      notificationModuleKeys[selectedNotification.type];
                    const actionEnabled =
                      !requiredModuleKey || moduleIsEnabled(requiredModuleKey);

                    return (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`grid size-12 shrink-0 place-items-center rounded-2xl border ${meta.color}`}
                          >
                            <Icon size={22} />
                          </span>
                          <div className="min-w-0">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                            <h3 className="mt-2 text-lg font-black text-white">
                              {selectedNotification.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(
                                selectedNotification.createdAt,
                              ).toLocaleString("fa-IR")}
                            </p>
                          </div>
                        </div>

                        {selectedNotification.body && (
                          <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-200">
                            {selectedNotification.body}
                          </p>
                        )}

                        <div className="space-y-2 text-xs text-slate-400">
                          <div>
                            وضعیت:{" "}
                            {selectedNotification.readAt
                              ? "خوانده‌شده"
                              : "نخوانده"}
                          </div>
                          {targetDate && (
                            <div>
                              زمان مقصد:{" "}
                              {new Date(targetDate).toLocaleString("fa-IR")}
                            </div>
                          )}
                          {!actionEnabled && (
                            <div className="text-amber-200">
                              ماژول مقصد این اعلان غیرفعال است.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!selectedNotification.readAt && (
                            <button
                              type="button"
                              onClick={() =>
                                markNotificationRead.mutate(
                                  selectedNotification.id,
                                )
                              }
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                            >
                              خوانده شد
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openNotification(selectedNotification)}
                            disabled={!actionEnabled}
                            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-white hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            باز کردن مقصد
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid h-full min-h-56 place-items-center rounded-xl border border-dashed border-white/15 p-6 text-center text-sm leading-7 text-slate-400">
                    یک اعلان را برای مشاهده جزئیات انتخاب کنید.
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
        title="تقویم کامل"
        className="max-w-[1500px] bg-slate-950/95 p-4 sm:p-5"
      >
        <div className="grid max-h-[78vh] gap-4 overflow-hidden text-right xl:grid-cols-[260px_1fr_320px]" dir="rtl">
          <aside className="hidden space-y-4 overflow-y-auto pl-1 xl:block">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="text-sm font-black text-cyan-100">نمایش تقویم</h3>
              <div className="mt-4 space-y-2">
                {(Object.keys(calendarViewLabels) as CalendarView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setCalendarView(view)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                      calendarView === view
                        ? "border-cyan-300/45 bg-cyan-400/18 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.16)]"
                        : "border-white/10 bg-slate-950/35 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span>{calendarViewLabels[view]}</span>
                    <CalendarClock size={18} />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="text-sm font-black text-cyan-100">تقویم‌های من</h3>
              <div className="mt-4 space-y-2">
                {(Object.keys(calendarTypeStyles) as Array<keyof typeof calendarTypeStyles>).map((type) => {
                  const style = calendarTypeStyles[type];

                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3 text-xs font-bold text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                      <span className={`grid size-5 place-items-center rounded-md ${style.bg} ${style.text}`}>
                        ✓
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <button
              type="button"
              onClick={() => setCalendarView("month")}
              className="flex w-full items-center justify-between rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/18 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
            >
              مدیریت تقویم‌ها
              <Settings size={18} />
            </button>
          </aside>

          <main className="min-h-0 overflow-y-auto rounded-3xl border border-cyan-300/15 bg-slate-950/45 p-3 sm:p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate((date) => addDays(date, -30))}
                  className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                  aria-label="ماه قبل"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate((date) => addDays(date, 30))}
                  className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                  aria-label="ماه بعد"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-cyan-100/70">{selectedDateLabel}</p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {selectedJalaliDate
                    ? `${jalaliMonthNames[selectedJalaliDate.jm - 1]} ${selectedJalaliDate.jy}`
                    : "تقویم"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate(new Date())}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={() => openQuickAction("reminder")}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-white transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                >
                  رویداد جدید +
                </button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1 xl:hidden">
              {(Object.keys(calendarViewLabels) as CalendarView[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCalendarView(view)}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    calendarView === view
                      ? "bg-cyan-400/20 text-cyan-50"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {calendarViewLabels[view]}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {calendarView === "month" && (
                <motion.div
                  key="calendar-board-month"
                  variants={calendarViewMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={calendarMotionTransition}
                  className="overflow-hidden rounded-2xl border border-white/10"
                >
                  <div className="grid grid-cols-7 bg-cyan-950/30 text-center text-xs font-black text-slate-300">
                    {["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"].map((dayName) => (
                      <div key={dayName} className="border-l border-white/10 px-2 py-3 last:border-l-0">
                        {dayName}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {selectedMonthEventDays.map((day) => {
                      const dayKey = toLocalDateKey(day.gregorianDate);
                      const isSelected = dayKey === selectedDateKey;
                      const isToday = dayKey === todayKey;

                      return (
                        <motion.button
                          key={dayKey}
                          type="button"
                          onClick={() => setSelectedCalendarDate(day.gregorianDate)}
                          whileHover={reduceMotion ? undefined : { y: -2 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                          transition={calendarMotionTransition}
                          className={`min-h-28 border-l border-t border-white/10 p-2 text-right transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 sm:min-h-36 ${
                            isSelected
                              ? "bg-cyan-400/18 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.55)]"
                              : "bg-white/[0.025] hover:bg-white/[0.055]"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span
                              className={`grid size-7 place-items-center rounded-full text-sm font-black ${
                                isSelected
                                  ? "bg-cyan-400 text-slate-950"
                                  : isToday
                                    ? "border border-cyan-300 text-cyan-100"
                                    : day.isHoliday
                                      ? "text-rose-200"
                                      : "text-white"
                              }`}
                            >
                              {day.jalaliDay}
                            </span>
                            {day.isHoliday && <span className="text-[10px] font-bold text-rose-200">تعطیل</span>}
                          </div>

                          <div className="space-y-1">
                            {day.meetings.slice(0, 2).map((meeting) => (
                              <span key={meeting.id} className={`block rounded-lg border px-2 py-1 text-[10px] leading-5 ${calendarTypeStyles.meeting.border} ${calendarTypeStyles.meeting.bg} ${calendarTypeStyles.meeting.text}`}>
                                {meeting.title}
                              </span>
                            ))}
                            {day.reminders.slice(0, 1).map((reminder) => (
                              <span key={reminder.id} className={`block rounded-lg border px-2 py-1 text-[10px] leading-5 ${calendarTypeStyles.reminder.border} ${calendarTypeStyles.reminder.bg} ${calendarTypeStyles.reminder.text}`}>
                                {reminder.title}
                              </span>
                            ))}
                            {day.tasks.slice(0, 1).map((task) => (
                              <span key={task.id} className={`block rounded-lg border px-2 py-1 text-[10px] leading-5 ${calendarTypeStyles.task.border} ${calendarTypeStyles.task.bg} ${calendarTypeStyles.task.text}`}>
                                {task.title}
                              </span>
                            ))}
                            {day.occasions.slice(0, 1).map((occasion) => (
                              <span key={occasion.id} className={`block rounded-lg border px-2 py-1 text-[10px] leading-5 ${calendarTypeStyles.occasion.border} ${calendarTypeStyles.occasion.bg} ${calendarTypeStyles.occasion.text}`}>
                                {occasion.title}
                              </span>
                            ))}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {calendarView === "day" && (
                <motion.div
                  key="calendar-board-day"
                  variants={calendarViewMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={calendarMotionTransition}
                  className="space-y-3"
                >
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                    <p className="text-xs text-cyan-100/75">روز انتخاب‌شده</p>
                    <h3 className="mt-1 text-lg font-black text-cyan-50">{selectedDateLabel}</h3>
                  </div>
                  {[
                    ...selectedMeetings.map((meeting) => ({ id: meeting.id, type: "meeting" as const, title: meeting.title, detail: `${getPersianTime(meeting.startAt)} · ${meeting.location || "بدون محل"}` })),
                    ...selectedReminders.map((reminder) => ({ id: reminder.id, type: "reminder" as const, title: reminder.title, detail: `یادآوری در ${getPersianTime(reminder.remindAt)}` })),
                    ...selectedTasks.map((task) => ({ id: task.id, type: "task" as const, title: task.title, detail: `اولویت ${task.priority}` })),
                    ...selectedNotes.map((note) => ({ id: note.id, type: "note" as const, title: note.title, detail: note.body })),
                    ...selectedOccasions.map((occasion) => ({ id: occasion.id, type: "occasion" as const, title: occasion.title, detail: occasion.isHoliday ? "تعطیل رسمی" : "مناسبت تقویم ایران" })),
                  ].map((item) => {
                    const style = calendarTypeStyles[item.type];

                    return (
                      <motion.div
                        key={`${item.type}-${item.id}`}
                        whileHover={reduceMotion ? undefined : { x: -2 }}
                        transition={calendarMotionTransition}
                        className={`rounded-2xl border p-4 ${style.border} ${style.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 size-2.5 shrink-0 rounded-full ${style.dot}`} />
                          <div className="min-w-0">
                            <h3 className={`font-black ${style.text}`}>{item.title}</h3>
                            <p className="mt-1 line-clamp-3 text-xs leading-6 text-slate-300">{item.detail}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {!selectedDayHasItems && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
                      برای این روز موردی ثبت نشده است.
                    </div>
                  )}
                </motion.div>
              )}

              {calendarView === "year" && (
                <motion.div
                  key="calendar-board-year"
                  variants={calendarViewMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={calendarMotionTransition}
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                  {selectedYearMonthCalendars.map((month) => (
                    <motion.section
                      key={month.month}
                      whileHover={reduceMotion ? undefined : { y: -3 }}
                      transition={calendarMotionTransition}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedJalaliDate) return;
                          setSelectedCalendarDate(fromLocalDateKey(jalaliToGregorian(selectedJalaliDate.jy, month.month, 1)));
                          setCalendarView("month");
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-right transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                      >
                        <span className="font-black text-white">{month.monthName}</span>
                        <span className="text-[11px] font-bold text-cyan-100/70">مشاهده ماه</span>
                      </button>
                      <div className="mt-3 grid grid-cols-7 gap-1">
                        {month.days.map((day) => {
                          const dayKey = toLocalDateKey(day.gregorianDate);
                          const isSelected = dayKey === selectedDateKey;
                          const isToday = dayKey === todayKey;
                          const hasItems = day.meetingsCount > 0 || day.workCount > 0 || day.occasions.length > 0;

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
                              {hasItems && <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-cyan-300" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.section>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <aside className="space-y-4 overflow-y-auto pr-1">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate((date) => addDays(date, -30))}
                  className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10"
                  aria-label="ماه قبل"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </button>
                <h3 className="font-black text-cyan-100">
                  {selectedJalaliDate
                    ? `${jalaliMonthNames[selectedJalaliDate.jm - 1]} ${selectedJalaliDate.jy}`
                    : "ماه"}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate((date) => addDays(date, 30))}
                  className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10"
                  aria-label="ماه بعد"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
                {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((dayName) => (
                  <span key={dayName}>{dayName}</span>
                ))}
                {selectedMonthEventDays.map((day) => {
                  const dayKey = toLocalDateKey(day.gregorianDate);
                  const isSelected = dayKey === selectedDateKey;
                  const isToday = dayKey === todayKey;

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => setSelectedCalendarDate(day.gregorianDate)}
                      className={`relative aspect-square rounded-lg text-xs font-black transition ${
                        isSelected
                          ? "bg-cyan-400 text-slate-950"
                          : day.isHoliday
                            ? "text-rose-200 hover:bg-rose-400/15"
                            : "text-slate-200 hover:bg-white/10"
                      } ${isToday ? "ring-1 ring-cyan-300/50" : ""}`}
                    >
                      {day.jalaliDay}
                      {day.hasItems && <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-cyan-300" />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="font-black text-cyan-100">رویدادهای روز {selectedDateLabel}</h3>
              <div className="mt-4 space-y-2">
                {[
                  ...selectedMeetings.map((meeting) => ({ id: meeting.id, type: "meeting" as const, title: meeting.title, time: getPersianTime(meeting.startAt), place: meeting.location || "بدون محل" })),
                  ...selectedReminders.map((reminder) => ({ id: reminder.id, type: "reminder" as const, title: reminder.title, time: getPersianTime(reminder.remindAt), place: "یادآوری" })),
                  ...selectedTasks.map((task) => ({ id: task.id, type: "task" as const, title: task.title, time: "", place: `اولویت ${task.priority}` })),
                  ...selectedOccasions.map((occasion) => ({ id: occasion.id, type: "occasion" as const, title: occasion.title, time: "", place: occasion.isHoliday ? "تعطیل رسمی" : "مناسبت" })),
                ].slice(0, 6).map((item) => {
                  const style = calendarTypeStyles[item.type];

                  return (
                    <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 size-2.5 shrink-0 rounded-full ${style.dot}`} />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-white">{item.title}</h4>
                          <p className="mt-1 text-xs text-slate-400">{item.time} {item.place}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!selectedDayHasItems && <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-slate-400">رویدادی برای این روز ثبت نشده است.</div>}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="font-black text-cyan-100">رویدادهای پیش رو</h3>
              <div className="mt-4 space-y-2">
                {upcomingCalendarItems.map((item) => {
                  const style = calendarTypeStyles[item.type];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCalendarDate(startOfLocalDay(new Date(item.date)))}
                      className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-right transition hover:bg-white/10"
                    >
                      <span className={`mt-1 h-9 w-1 shrink-0 rounded-full ${style.dot}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-white">{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-400">{formatJalaliDate(new Date(item.date))} · {item.detail}</span>
                      </span>
                    </button>
                  );
                })}
                {upcomingCalendarItems.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-slate-400">رویداد پیش‌رویی ثبت نشده است.</div>}
              </div>
            </section>
          </aside>
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
