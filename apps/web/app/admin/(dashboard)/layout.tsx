"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CloudDownload,
  Database,
  FileText,
  FolderTree,
  GraduationCap,
  House,
  MapPin,
  Network,
  PanelsTopLeft,
  Puzzle,
  Settings,
  ShieldCheck,
  UserRound,
  Activity,
  Vote,
  type LucideIcon,
} from "lucide-react";

import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard";
import { AdminLogoutButton } from "@/components/auth/AdminLogoutButton";
import { getStoredAuthUser, type AuthUser } from "@/lib/auth";
import { useEnabledPortalModules } from "@/hooks/usePortalModules";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  moduleKey?: string;
};

const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin/profile",
    label: "پروفایل",
    icon: UserRound,
  },
  {
    href: "/admin/dashboard",
    label: "داشبورد",
    icon: House,
    moduleKey: "dashboard",
  },
  {
    href: "/admin/applications",
    label: "سامانه‌ها",
    icon: Database,
    permission: "applications.manage",
    moduleKey: "applications",
  },
  {
    href: "/admin/categories",
    label: "دسته‌بندی‌ها",
    icon: FolderTree,
    permission: "categories.manage",
    moduleKey: "categories",
  },
  {
    href: "/admin/sites",
    label: "سایت‌ها",
    icon: MapPin,
    permission: "sites.manage",
    moduleKey: "sites",
  },
  {
    href: "/admin/news",
    label: "اخبار",
    icon: FileText,
    permission: "news.publish",
    moduleKey: "news",
  },
  {
    href: "/admin/meetings",
    label: "جلسات",
    icon: CalendarDays,
    permission: "meetings.manage",
    moduleKey: "meetings",
  },
  {
    href: "/admin/trainings",
    label: "آموزش",
    icon: GraduationCap,
    permission: "training.manage",
    moduleKey: "training",
  },
  {
    href: "/admin/polls",
    label: "نظرسنجی و رای‌گیری",
    icon: Vote,
    permission: "poll.manage",
    moduleKey: "poll-survey",
  },
  {
    href: "/admin/workspace",
    label: "فضای کاری",
    icon: BriefcaseBusiness,
    moduleKey: "workspace",
  },
  {
    href: "/admin/downloads",
    label: "دانلودها",
    icon: CloudDownload,
    permission: "downloads.manage",
    moduleKey: "downloads",
  },
  {
    href: "/admin/system-statuses",
    label: "وضعیت سیستم‌ها",
    icon: Activity,
    permission: "system-statuses.manage",
    moduleKey: "system-statuses",
  },
  {
    href: "/admin/directory",
    label: "اکتیو دایرکتوری",
    icon: Network,
    permission: "directory.manage",
    moduleKey: "directory",
  },
  {
    href: "/admin/access",
    label: "دسترسی‌ها",
    icon: ShieldCheck,
    permission: "access.manage",
    moduleKey: "access",
  },
  {
    href: "/admin/announcements",
    label: "اطلاعیه‌ها",
    icon: Bell,
    permission: "announcements.publish",
    moduleKey: "announcements",
  },
  {
    href: "/admin/sliders",
    label: "اسلایدر",
    icon: PanelsTopLeft,
    permission: "sliders.manage",
    moduleKey: "sliders",
  },
  {
    href: "/admin/modules",
    label: "ماژول‌ها",
    icon: Puzzle,
    permission: "modules.manage",
    moduleKey: "modules",
  },
  {
    href: "/admin/settings",
    label: "تنظیمات",
    icon: Settings,
    permission: "settings.manage",
    moduleKey: "settings",
  },
];

function hasPermission(user: AuthUser | null, permission?: string) {
  if (!permission) return true;
  return user?.permissions.includes(permission) ?? false;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const { data: enabledModules } = useEnabledPortalModules();

  useEffect(() => {
    const syncUser = () => setUser(getStoredAuthUser());

    syncUser();
    window.addEventListener("focus", syncUser);
    window.addEventListener("auth-user-updated", syncUser);

    return () => {
      window.removeEventListener("focus", syncUser);
      window.removeEventListener("auth-user-updated", syncUser);
    };
  }, []);

  const enabledModuleKeys = enabledModules
    ? new Set(enabledModules.map((module) => module.key))
    : null;
  const visibleNavItems = adminNavItems.filter((item) => {
    const moduleIsEnabled =
      !enabledModuleKeys ||
      !item.moduleKey ||
      enabledModuleKeys.has(item.moduleKey);

    return moduleIsEnabled && hasPermission(user, item.permission);
  });
  const currentNavItem = adminNavItems
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((first, second) => second.href.length - first.href.length)[0];
  const currentModuleIsEnabled =
    !enabledModuleKeys ||
    !currentNavItem?.moduleKey ||
    enabledModuleKeys.has(currentNavItem.moduleKey);
  const canViewCurrentPage =
    currentModuleIsEnabled && hasPermission(user, currentNavItem?.permission);

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <aside className="w-72 border-l border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h1 className="text-2xl font-bold">AGTPS</h1>
            <p className="mt-1 text-sm text-slate-400">Admin Panel</p>
          </div>

          <nav className="flex flex-col gap-2 p-4">
            {visibleNavItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 transition ${
                    active
                      ? "bg-cyan-500/15 text-cyan-100"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="font-bold">{item.label}</span>
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg border ${
                      active
                        ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100"
                        : "border-white/10 bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-5">
            <h2 className="text-xl font-semibold">AGTPS Administration</h2>

            <div className="flex items-center gap-4">
              <Link
                href="/admin/profile"
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
              >
                {user?.fullName ||
                  user?.firstName ||
                  user?.directoryUser?.displayName ||
                  user?.username ||
                  "کاربر"}
              </Link>
              <AdminLogoutButton />
            </div>
          </header>

          <div className="p-8">
            {canViewCurrentPage ? (
              children
            ) : (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-right">
                <h1 className="text-2xl font-black text-rose-100">
                  دسترسی مجاز نیست
                </h1>
                <p className="mt-3 text-sm leading-7 text-rose-100/75">
                  برای مشاهده این بخش باید ماژول فعال باشد و دسترسی لازم توسط
                  مدیر سیستم به نقش یا گروه کاربری شما اضافه شود.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
