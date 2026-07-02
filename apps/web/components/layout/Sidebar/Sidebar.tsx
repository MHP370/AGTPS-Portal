"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menu = [
  { title: "داشبورد", href: "/admin/dashboard" },
  { title: "سامانه‌ها", href: "/admin/applications" },
  { title: "دسته‌بندی‌ها", href: "/admin/categories" },
  { title: "سایت‌ها", href: "/admin/sites" },
  { title: "اخبار", href: "/admin/news" },
  { title: "اطلاعیه‌ها", href: "/admin/announcements" },
  { title: "اسلایدر", href: "/admin/sliders" },
  { title: "تنظیمات", href: "/admin/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 flex-col border-l border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-white">
          AGTPS
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Enterprise Portal
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-xl px-4 py-3 text-sm transition-all",
                active
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 text-xs text-slate-500">
        AGTPS Portal v1.0
      </div>
    </aside>
  );
}
