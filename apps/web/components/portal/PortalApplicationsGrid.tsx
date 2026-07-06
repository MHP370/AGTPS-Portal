"use client";

import Link from "next/link";
import { MonitorCog } from "lucide-react";

import { usePortalApplications } from "@/hooks/useApplications";
import { useSites } from "@/hooks/useSites";
import { isUploadedIcon, portalIconMap } from "@/lib/icon-options";
import type { Application } from "@/lib/applications";
import { portalApps } from "@/lib/portal";

const fallbackColors = [
  "#2563eb",
  "#059669",
  "#0891b2",
  "#d97706",
  "#9333ea",
  "#0284c7",
];

function isHexColor(value?: string) {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));
}

function getApplicationUrl(
  application: Application,
  selectedSiteId?: string | null,
) {
  const activeSite = selectedSiteId
    ? application.sites.find(
        (site) => site.isActive && site.site.id === selectedSiteId,
      )
    : application.sites.find((site) => site.isActive);

  return activeSite?.url || "#";
}

function getApplicationIcon(application: Application) {
  return application.icon
    ? portalIconMap[application.icon] ?? MonitorCog
    : MonitorCog;
}

function PortalApplicationCard({
  application,
  index,
  selectedSiteId,
}: {
  application: Application;
  index: number;
  selectedSiteId?: string | null;
}) {
  const Icon = getApplicationIcon(application);
  const uploadedIcon = isUploadedIcon(application.icon) ? application.icon : null;
  const href = getApplicationUrl(application, selectedSiteId);
  const color = isHexColor(application.color)
    ? application.color
    : fallbackColors[index % fallbackColors.length];

  return (
    <Link
      href={href}
      target={application.openInNewTab && href !== "#" ? "_blank" : undefined}
      rel={application.openInNewTab && href !== "#" ? "noreferrer" : undefined}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center transition hover:-translate-y-1 hover:border-cyan-200/40 hover:bg-white/[0.08]"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}55, rgba(15,23,42,0.18))`,
      }}
    >
      <div
        className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-slate-950/30"
        style={{ color }}
      >
        {uploadedIcon ? (
          <img
            src={uploadedIcon}
            alt=""
            className="size-8 object-contain"
          />
        ) : (
          <Icon size={30} />
        )}
      </div>
      <h3 className="font-black text-white">{application.title}</h3>
      <p className="mt-1 min-h-10 text-xs leading-5 text-slate-300">
        {application.description || application.category?.name || application.key}
      </p>
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-bold">
        {application.isNew && (
          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-200">
            جدید
          </span>
        )}
        {application.isFeatured && (
          <span className="rounded-full bg-amber-400/15 px-2 py-1 text-amber-200">
            ویژه
          </span>
        )}
      </div>
    </Link>
  );
}

function FallbackApplicationCard({
  app,
}: {
  app: (typeof portalApps)[number];
}) {
  const Icon = app.icon;

  return (
    <Link
      href="#"
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${app.color} p-4 text-center transition hover:-translate-y-1 hover:border-cyan-200/40`}
    >
      <Icon className="mx-auto mb-2 text-cyan-100" size={34} />
      <h3 className="font-black">{app.title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-300">{app.description}</p>
    </Link>
  );
}

interface PortalApplicationsGridProps {
  selectedSiteId?: string | null;
  onSiteSelect?: (siteId: string | null) => void;
}

export default function PortalApplicationsGrid({
  selectedSiteId,
  onSiteSelect,
}: PortalApplicationsGridProps) {
  const { data: applications = [], isLoading, isError } = usePortalApplications();
  const { data: sites = [] } = useSites();
  const activeSites = sites.filter((site) => site.isActive);
  const selectedSite = activeSites.find((site) => site.id === selectedSiteId);
  const visibleApplications = applications.filter((application) => {
    if (!application.isActive) return false;

    if (!selectedSiteId) return true;

    return application.sites.some(
      (site) => site.isActive && site.site.id === selectedSiteId,
    );
  });
  const shouldUseFallback = visibleApplications.length === 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-cyan-200">
            دسترسی سریع به سامانه ها
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {selectedSite
              ? `نمایش لینک‌های سایت ${selectedSite.name}`
              : "نمایش همه سایت‌ها؛ بعداً این انتخاب می‌تواند از AD انجام شود."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onSiteSelect?.(null)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
              !selectedSiteId
                ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            همه سایت‌ها
          </button>
          {activeSites.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => onSiteSelect?.(site.id)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                selectedSiteId === site.id
                  ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {site.name}
            </button>
          ))}
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">
            {isLoading
              ? "در حال دریافت..."
              : isError
                ? "داده پیش‌فرض"
                : `${visibleApplications.length} سامانه فعال`}
          </span>
        </div>
      </div>

      {shouldUseFallback && selectedSiteId && !isLoading && !isError ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-sm leading-7 text-amber-100">
          برای سایت انتخاب‌شده هنوز آدرس فعالی برای سامانه‌ها ثبت نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {shouldUseFallback
            ? portalApps.map((app) => (
                <FallbackApplicationCard key={app.title} app={app} />
              ))
            : visibleApplications.map((application, index) => (
                <PortalApplicationCard
                  key={application.id}
                  application={application}
                  index={index}
                  selectedSiteId={selectedSiteId}
                />
              ))}
        </div>
      )}
    </>
  );
}
