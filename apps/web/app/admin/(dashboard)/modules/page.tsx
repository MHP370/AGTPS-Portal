"use client";

import {
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  Power,
  Puzzle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  useAdminPortalModules,
  useUpdatePortalModule,
} from "@/hooks/usePortalModules";
import { portalIconMap } from "@/lib/icon-options";

export default function ModulesPage() {
  const {
    data: modules = [],
    isLoading,
    error,
  } = useAdminPortalModules();
  const updateModule = useUpdatePortalModule();

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center justify-end gap-3">
            <h1 className="text-3xl font-black text-white">ماژول‌ها</h1>
            <span className="grid size-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <Puzzle size={24} />
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            هر بخش اصلی پرتال به‌صورت ماژول ثبت می‌شود تا بتوان آن را به شکل
            کنترل‌شده فعال، غیرفعال، نصب منطقی یا از دسترس خارج کرد.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-100">
          حذف کد در زمان اجرا انجام نمی‌شود؛ غیرفعال‌سازی، منو و عملکردهای
          ماژول را از دسترس خارج می‌کند.
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          بارگذاری ماژول‌ها انجام نشد.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
              />
            ))
          : modules.map((module) => {
              const Icon = portalIconMap[module.icon || "Puzzle"] ?? Puzzle;
              const enabled = module.isInstalled && module.isEnabled;

              return (
                <article
                  key={module.key}
                  className={`flex min-h-56 flex-col justify-between rounded-2xl border p-5 ${
                    enabled
                      ? "border-cyan-300/20 bg-slate-900"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`grid size-12 place-items-center rounded-2xl border ${
                          enabled
                            ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                            : "border-slate-700 bg-slate-950 text-slate-500"
                        }`}
                      >
                        <Icon size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {module.isCore && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                              <LockKeyhole size={13} />
                              هسته‌ای
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                              enabled
                                ? "bg-emerald-400/10 text-emerald-200"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {enabled ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <AlertCircle size={13} />
                            )}
                            {enabled ? "فعال" : "غیرفعال"}
                          </span>
                        </div>

                        <h2 className="mt-3 truncate text-xl font-black text-white">
                          {module.title}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          {module.key}
                        </p>
                      </div>
                    </div>

                    <p className="min-h-14 text-sm leading-7 text-slate-400">
                      {module.description || "توضیحی برای این ماژول ثبت نشده است."}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs leading-6 text-slate-500">
                      {module.route ? `مسیر: ${module.route}` : "بدون مسیر مستقیم"}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={enabled ? "outline" : "primary"}
                      disabled={module.isCore || updateModule.isPending}
                      onClick={() =>
                        updateModule.mutate({
                          key: module.key,
                          dto: {
                            isEnabled: !enabled,
                            isInstalled: true,
                          },
                        })
                      }
                      className="gap-2"
                    >
                      <Power size={15} />
                      {enabled ? "غیرفعال کردن" : "فعال کردن"}
                    </Button>
                  </div>
                </article>
              );
            })}
      </div>
    </div>
  );
}
