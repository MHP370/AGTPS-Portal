"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getMe, hasAuthSession, setStoredAuthUser } from "@/lib/auth";

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!hasAuthSession()) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/admin/login${next}`);
      return;
    }

    let mounted = true;

    getMe()
      .then((user) => {
        setStoredAuthUser(user);
        window.dispatchEvent(new Event("auth-user-updated"));
      })
      .catch(() => {})
      .finally(() => {
        if (!mounted) return;
        setAllowed(true);
      });

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-5 text-center shadow-xl">
          <p className="text-lg font-semibold">در حال بررسی دسترسی...</p>
          <p className="mt-2 text-sm text-slate-400">
            برای مشاهده پنل مدیریت باید وارد شوید.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
