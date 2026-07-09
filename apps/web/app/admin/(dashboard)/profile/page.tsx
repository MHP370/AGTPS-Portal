"use client";

import { Network, ShieldCheck, UserRound } from "lucide-react";

import { AdminLogoutButton } from "@/components/auth/AdminLogoutButton";
import { Badge } from "@/components/ui/Badge";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { AuthUser } from "@/lib/auth";

function displayName(user?: AuthUser | null) {
  if (!user) return "کاربر";
  return (
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.directoryUser?.displayName ||
    user.username
  );
}

export default function AdminProfilePage() {
  const { data: user, isLoading } = useAuthUser();
  const roleDetails = user?.roleDetails?.length
    ? user.roleDetails
    : (user?.roles.map((role) => ({ id: role, name: role, title: role })) ??
      []);

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">پروفایل کاربری</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            اطلاعات حساب، نوع ورود، نقش‌ها و گروه‌های سازمانی شما در پورتال.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      {isLoading && !user ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
          در حال بارگذاری پروفایل...
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                  <UserRound size={30} />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {displayName(user)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {user?.username} · {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={user?.isActive ? "success" : "danger"}>
                  {user?.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <Badge variant="info">
                  {user?.authSource === "ACTIVE_DIRECTORY"
                    ? "Active Directory"
                    : "داخلی"}
                </Badge>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="text-cyan-200" size={22} />
                <h2 className="text-xl font-black text-white">نقش‌ها</h2>
              </div>
              <div className="space-y-3">
                {roleDetails.length === 0 ? (
                  <p className="text-sm text-slate-500">نقشی ثبت نشده است.</p>
                ) : (
                  roleDetails.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <p className="font-bold text-white">{role.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{role.name}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Network className="text-cyan-200" size={22} />
                <h2 className="text-xl font-black text-white">گروه‌ها</h2>
              </div>
              <div className="space-y-3">
                {user?.directoryGroups?.length ? (
                  user.directoryGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-white">{group.title}</p>
                        <Badge
                          variant={
                            group.source === "ACTIVE_DIRECTORY"
                              ? "info"
                              : "default"
                          }
                        >
                          {group.source === "ACTIVE_DIRECTORY" ? "AD" : "داخلی"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    گروه سازمانی برای این حساب ثبت نشده است.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
