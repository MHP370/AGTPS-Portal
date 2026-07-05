"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { SearchBox } from "@/components/ui/SearchBox";
import { CreateSiteDialog } from "@/components/features/sites/CreateSiteDialog";
import { EditSiteDialog } from "@/components/features/sites/EditSiteDialog";
import { useDeleteSite, useSites } from "@/hooks/useSites";
import type { Site } from "@/lib/sites";

export default function SitesPage() {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSites();

  const deleteSite = useDeleteSite();

  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return data;

    return data.filter((site) =>
      [
        site.name,
        site.code,
        site.baseUrl ?? "",
        site.ipRange ?? "",
        site.address ?? "",
        site.phone ?? "",
        site.email ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [data, search]);

  async function handleDelete() {
    if (!selectedSite) return;

    setDeleteError("");

    try {
      await deleteSite.mutateAsync(selectedSite.id);
      setOpenDelete(false);
      setSelectedSite(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "حذف سایت انجام نشد.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="py-10 text-center">
        در حال بارگذاری...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">
          بارگذاری سایت‌ها انجام نشد
        </h1>

        <p className="text-sm text-red-200/80">
          {(error as Error | undefined)?.message ||
            "ارتباط با سرویس برقرار نشد."}
        </p>

        <Button
          variant="secondary"
          onClick={() => {
            void refetch();
          }}
        >
          تلاش دوباره
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          مدیریت سایت‌ها
        </h1>

        <Button onClick={() => setOpenCreate(true)}>
          افزودن سایت
        </Button>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {deleteError}
        </div>
      )}

      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="جستجوی سایت..."
      />

      <DataTable
        data={filtered}
        columns={[
          {
            key: "name",
            title: "نام",
            render: (site) => (
              <div>
                <div className="font-semibold">
                  {site.name}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {site.code}
                </div>
              </div>
            ),
          },
          {
            key: "connection",
            title: "ارتباط",
            render: (site) => (
              <div className="space-y-1 text-sm text-slate-300">
                <div>{site.baseUrl || "-"}</div>
                <div className="text-xs text-slate-500">
                  {site.ipRange || "بدون IP Range"}
                </div>
              </div>
            ),
          },
          {
            key: "contact",
            title: "تماس",
            render: (site) => (
              <div className="space-y-1 text-sm text-slate-300">
                <div>{site.phone || "-"}</div>
                <div className="text-xs text-slate-500">
                  {site.email || site.address || "بدون اطلاعات تماس"}
                </div>
              </div>
            ),
          },
          {
            key: "location",
            title: "موقعیت نقشه",
            render: (site) => (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor: site.color || "#22d3ee",
                  }}
                />
                <span>
                  {site.latitude !== undefined &&
                  site.longitude !== undefined
                    ? `${site.latitude}, ${site.longitude}`
                    : "پیش‌فرض"}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            title: "وضعیت",
            render: (site) => (
              <span
                className={
                  site.isActive
                    ? "rounded-lg bg-emerald-900/40 px-3 py-1 text-xs text-emerald-300"
                    : "rounded-lg bg-red-900/40 px-3 py-1 text-xs text-red-300"
                }
              >
                {site.isActive ? "فعال" : "غیرفعال"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (site) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedSite(site);
                    setOpenEdit(true);
                  }}
                >
                  ویرایش
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteSite.isPending}
                  onClick={() => {
                    setDeleteError("");
                    setSelectedSite(site);
                    setOpenDelete(true);
                  }}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]}
      />

      <CreateSiteDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
      />

      <EditSiteDialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) setSelectedSite(null);
        }}
        site={selectedSite}
      />

      <ConfirmDialog
        open={openDelete}
        onOpenChange={(open) => {
          setOpenDelete(open);
          if (!open) setSelectedSite(null);
        }}
        title="حذف سایت"
        description="آیا از حذف این سایت مطمئن هستید؟"
        loading={deleteSite.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
