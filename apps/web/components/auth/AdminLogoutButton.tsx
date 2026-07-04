"use client";

import { useRouter } from "next/navigation";

import { clearAuthSession } from "@/lib/auth";

export function AdminLogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearAuthSession();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
    >
      خروج
    </button>
  );
}
