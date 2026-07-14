import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CloudDownload,
  Database,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Headphones,
  HeartPulse,
  House,
  LockKeyhole,
  Mail,
  MonitorCog,
  PieChart,
  Plane,
  ShieldCheck,
  Users,
  Utensils,
  WalletCards,
} from "lucide-react";

export type PortalNavItem = {
  title: string;
  icon: LucideIcon;
  href: string;
  moduleKey?: string;
};

export type PortalNotice = {
  title: string;
  description: string;
  time: string;
  color: string;
};

export type PortalSystemStatus = {
  title: string;
  status: "متصل" | "در دسترس";
  icon: LucideIcon;
};

export type PortalMeeting = {
  title: string;
  location: string;
  time: string;
  color: string;
};

export type PortalDownload = {
  title: string;
  version: string;
  icon: LucideIcon;
  color: string;
};

export type PortalApp = {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

export type PortalSite = {
  title: string;
  subtitle: string;
  x: string;
  y: string;
  color: string;
};

export const portalNavItems: PortalNavItem[] = [
  { title: "خانه", icon: House, href: "/" },
  {
    title: "سامانه ها",
    icon: Database,
    href: "#systems",
    moduleKey: "applications",
  },
  {
    title: "اطلاعیه ها",
    icon: Bell,
    href: "#announcements",
    moduleKey: "announcements",
  },
  { title: "منابع انسانی", icon: Users, href: "#hr", moduleKey: "news" },
  {
    title: "دانلود نرم افزار",
    icon: CloudDownload,
    href: "#downloads",
    moduleKey: "downloads",
  },
  {
    title: "فایل شیر",
    icon: FolderOpen,
    href: "/file-shares",
    moduleKey: "file-shares",
  },
  {
    title: "آموزش",
    icon: GraduationCap,
    href: "#training",
    moduleKey: "training",
  },
  {
    title: "تقویم جلسات",
    icon: CalendarDays,
    href: "#calendar",
    moduleKey: "meetings",
  },
  {
    title: "وضعیت سیستم ها",
    icon: ShieldCheck,
    href: "#status",
    moduleKey: "system-statuses",
  },
];

export const managementNotices: PortalNotice[] = [
  { title: "به‌روزرسانی سیستم مالی", description: "سیستم مالی روز جمعه ساعت ۱۸ به‌روزرسانی می‌شود.", time: "۲ ساعت پیش", color: "bg-rose-400" },
  { title: "قطعی برق موقت", description: "قطعی برق در ساختمان اصلی از ساعت ۱۳ تا ۱۴", time: "۵ ساعت پیش", color: "bg-amber-400" },
  { title: "دسترسی به VPN", description: "برای اتصال به VPN از نرم‌افزار جدید استفاده کنید.", time: "۱ روز پیش", color: "bg-emerald-400" },
  { title: "جلسه عمومی کارکنان", description: "جلسه عمومی ماهانه در روز چهارشنبه برگزار می‌شود.", time: "۲ روز پیش", color: "bg-fuchsia-400" },
];

export const hrNotices: PortalNotice[] = [
  { title: "بخشنامه جدید مرخصی ها", description: "آیین‌نامه جدید مرخصی از اول تیرماه اجرا می‌شود.", time: "منابع انسانی", color: "bg-yellow-500" },
  { title: "تمدید بیمه تکمیلی", description: "مهلت انتخاب بیمه تکمیلی تا ۱۰ تیرماه تمدید شد.", time: "رفاه", color: "bg-pink-500" },
  { title: "پرداخت حقوق تیرماه", description: "حقوق تیرماه در تاریخ ۲۹ تیرماه واریز خواهد شد.", time: "مالی", color: "bg-emerald-500" },
  { title: "ثبت نام دوره آموزشی", description: "دوره مهارت‌های نرم از ۱۵ تیرماه آغاز می‌شود.", time: "آموزش", color: "bg-indigo-500" },
];

export const systemStatuses: PortalSystemStatus[] = [
  { title: "اینترنت", status: "متصل", icon: CheckCircle2 },
  { title: "VPN", status: "متصل", icon: LockKeyhole },
  { title: "سامانه ERP", status: "در دسترس", icon: Database },
  { title: "سامانه مالی", status: "در دسترس", icon: WalletCards },
  { title: "ایمیل سازمانی", status: "در دسترس", icon: Mail },
  { title: "سرور فایل", status: "در دسترس", icon: FileText },
];

export const portalMeetings: PortalMeeting[] = [
  { title: "جلسه بررسی پروژه ERP", location: "سالن کنفرانس طبقه ۳", time: "09:00", color: "border-cyan-400" },
  { title: "جلسه مدیریت", location: "اتاق جلسات", time: "11:00", color: "border-rose-400" },
  { title: "جلسه برنامه‌ریزی منابع انسانی", location: "اتاق HR", time: "14:00", color: "border-fuchsia-400" },
];

export const portalDownloads: PortalDownload[] = [
  { title: "Google Chrome", version: "نسخه 126.0", icon: Globe, color: "text-emerald-300" },
  { title: "AnyDesk", version: "نسخه 8.0.1", icon: Plane, color: "text-rose-300" },
  { title: "FortiClient VPN", version: "نسخه 7.2.4", icon: ShieldCheck, color: "text-sky-300" },
  { title: "Microsoft Office", version: "نسخه 2021", icon: BriefcaseBusiness, color: "text-orange-300" },
];

export const portalApps: PortalApp[] = [
  { title: "ERP", description: "سیستم برنامه‌ریزی منابع", icon: MonitorCog, color: "from-blue-500/40 to-indigo-500/20" },
  { title: "مالی", description: "سیستم مالی و حسابداری", icon: WalletCards, color: "from-emerald-500/40 to-lime-500/20" },
  { title: "منابع انسانی", description: "مدیریت منابع انسانی", icon: Users, color: "from-cyan-500/40 to-blue-500/20" },
  { title: "رزرو غذا", description: "سیستم رزرو غذا", icon: Utensils, color: "from-amber-500/40 to-orange-500/20" },
  { title: "هلپ دسک", description: "درخواست پشتیبانی", icon: Headphones, color: "from-purple-500/40 to-fuchsia-500/20" },
  { title: "CRM", description: "مدیریت ارتباط با مشتری", icon: HeartPulse, color: "from-sky-500/40 to-cyan-500/20" },
  { title: "اتوماسیون اداری", description: "اتوماسیون مکاتبات", icon: FileText, color: "from-violet-500/40 to-purple-500/20" },
  { title: "مدیریت پروژه", description: "پروژه‌ها و وظایف", icon: BriefcaseBusiness, color: "from-orange-500/40 to-yellow-500/20" },
  { title: "مانیتورینگ", description: "پایش سیستم ها", icon: MonitorCog, color: "from-cyan-500/40 to-sky-500/20" },
  { title: "گزارش ساز", description: "گزارش‌های سازمانی", icon: PieChart, color: "from-fuchsia-500/40 to-purple-500/20" },
];

export const portalSites: PortalSite[] = [
  { title: "دفتر تهران", subtitle: "دفتر مرکزی", x: "48%", y: "42%", color: "#22d3ee" },
  { title: "سایت عسلویه", subtitle: "سایت عملیاتی", x: "55%", y: "72%", color: "#fbbf24" },
];

export const iranCalendarEvents = ["روز ملی فناوری اطلاعات", "هفته بهره‌وری سازمانی", "یادآوری جلسات ماهانه"];
