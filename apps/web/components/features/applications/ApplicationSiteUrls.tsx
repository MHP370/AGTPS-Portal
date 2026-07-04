"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useCreateApplicationSite,
  useDeleteApplicationSite,
  useUpdateApplicationSite,
} from "@/hooks/useApplications";
import type { Application } from "@/lib/applications";
import type { Site } from "@/lib/sites";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type SiteUrlState = {
  url: string;
  isActive: boolean;
};

interface Props {
  application: Application;
  sites: Site[];
}

export function ApplicationSiteUrls({
  application,
  sites,
}: Props) {
  const createApplicationSite = useCreateApplicationSite();
  const updateApplicationSite = useUpdateApplicationSite();
  const deleteApplicationSite = useDeleteApplicationSite();

  const [values, setValues] = useState<Record<string, SiteUrlState>>({});
  const [error, setError] = useState("");
  const [savingSiteId, setSavingSiteId] = useState<string | null>(null);

  const applicationSitesBySiteId = useMemo(() => {
    return new Map(
      application.sites.map((applicationSite) => [
        applicationSite.site.id,
        applicationSite,
      ]),
    );
  }, [application.sites]);

  useEffect(() => {
    const nextValues: Record<string, SiteUrlState> = {};

    for (const site of sites) {
      const applicationSite = applicationSitesBySiteId.get(site.id);

      nextValues[site.id] = {
        url: applicationSite?.url ?? "",
        isActive: applicationSite?.isActive ?? true,
      };
    }

    setValues(nextValues);
    setError("");
  }, [applicationSitesBySiteId, sites]);

  const isSaving =
    createApplicationSite.isPending ||
    updateApplicationSite.isPending ||
    deleteApplicationSite.isPending;

  async function saveSiteUrl(site: Site) {
    const value = values[site.id] ?? {
      url: "",
      isActive: true,
    };
    const trimmedUrl = value.url.trim();
    const existing = applicationSitesBySiteId.get(site.id);

    setError("");
    setSavingSiteId(site.id);

    try {
      if (!trimmedUrl) {
        if (existing) {
          await deleteApplicationSite.mutateAsync(existing.id);
        }

        return;
      }

      if (existing) {
        await updateApplicationSite.mutateAsync({
          id: existing.id,
          dto: {
            url: trimmedUrl,
            isActive: value.isActive,
          },
        });
      } else {
        await createApplicationSite.mutateAsync({
          applicationId: application.id,
          siteId: site.id,
          url: trimmedUrl,
          isActive: value.isActive,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ذخیره آدرس سامانه برای سایت انجام نشد.",
      );
    } finally {
      setSavingSiteId(null);
    }
  }

  if (sites.length === 0) {
    return (
      <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-100">
        برای ثبت آدرس سامانه، ابتدا حداقل یک سایت تعریف کنید.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div>
        <h3 className="text-lg font-semibold text-white">
          آدرس سامانه در سایت‌ها
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          برای هر سایت، آدرس دسترسی همان سامانه را وارد کنید.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {sites.map((site) => {
          const value = values[site.id] ?? {
            url: "",
            isActive: true,
          };
          const existing = applicationSitesBySiteId.get(site.id);
          const isRowSaving = isSaving && savingSiteId === site.id;

          return (
            <div
              key={site.id}
              className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 lg:grid-cols-[180px_1fr_130px_100px]"
            >
              <div>
                <div className="font-semibold text-slate-100">
                  {site.name}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {site.code}
                </div>
              </div>

              <Input
                value={value.url}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [site.id]: {
                      ...value,
                      url: event.target.value,
                    },
                  }))
                }
                disabled={isSaving}
                placeholder="http://erp.site.local"
              />

              <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={value.isActive}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [site.id]: {
                        ...value,
                        isActive: event.target.checked,
                      },
                    }))
                  }
                  disabled={isSaving}
                />
                فعال
              </label>

              <Button
                type="button"
                variant={existing ? "secondary" : "primary"}
                disabled={isSaving}
                onClick={() => {
                  void saveSiteUrl(site);
                }}
              >
                {isRowSaving
                  ? "ذخیره..."
                  : existing
                    ? value.url.trim()
                      ? "ذخیره"
                      : "حذف"
                    : "افزودن"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
