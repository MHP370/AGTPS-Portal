import Link from "next/link";
import { ReactNode } from "react";

import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard";
import { AdminLogoutButton } from "@/components/auth/AdminLogoutButton";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <aside className="w-72 border-l border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h1 className="text-2xl font-bold">AGTPS</h1>
            <p className="mt-1 text-sm text-slate-400">Admin Panel</p>
          </div>

          <nav className="flex flex-col p-4 gap-2">
            <Link
              href="/admin/dashboard"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              داشبورد
            </Link>

            <Link
              href="/admin/applications"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              سامانه‌ها
            </Link>

            <Link
              href="/admin/categories"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              دسته‌بندی‌ها
            </Link>

            <Link
              href="/admin/sites"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              سایت‌ها
            </Link>

            <Link
              href="/admin/news"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              اخبار
            </Link>

            <Link
              href="/admin/meetings"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              جلسات
            </Link>

            <Link
              href="/admin/workspace"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              فضای کاری
            </Link>

            <Link
              href="/admin/directory"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              اکتیو دایرکتوری
            </Link>

            <Link
              href="/admin/announcements"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              اطلاعیه‌ها
            </Link>

            <Link
              href="/admin/sliders"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              اسلایدر
            </Link>

            <Link
              href="/admin/settings"
              className="rounded-lg px-4 py-3 hover:bg-slate-800 transition"
            >
              تنظیمات
            </Link>
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-5">
            <h2 className="text-xl font-semibold">
              AGTPS Administration
            </h2>

            <AdminLogoutButton />
          </header>

          <section className="p-8">{children}</section>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
