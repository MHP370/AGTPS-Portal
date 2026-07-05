"use client";

import { useMemo, useState } from "react";

import { AnnouncementForm } from "@/components/features/announcements/AnnouncementForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { SearchBox } from "@/components/ui/SearchBox";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/useAnnouncements";
import type {
  Announcement,
  CreateAnnouncementDto,
} from "@/lib/announcements";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("fa-IR") : "-";
}

export default function AnnouncementsPage() {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return data;

    return data.filter((item) =>
      [item.title, item.body].join(" ").toLowerCase().includes(keyword),
    );
  }, [data, search]);

  async function handleCreate(dto: CreateAnnouncementDto) {
    setFormError("");

    try {
      await createAnnouncement.mutateAsync(dto);
      setOpenCreate(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "ایجاد اطلاعیه انجام نشد.",
      );
    }
  }

  async function handleUpdate(dto: CreateAnnouncementDto) {
    if (!selectedAnnouncement) return;

    setFormError("");

    try {
      await updateAnnouncement.mutateAsync({
        id: selectedAnnouncement.id,
        dto,
      });
      setOpenEdit(false);
      setSelectedAnnouncement(null);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "ویرایش اطلاعیه انجام نشد.",
      );
    }
  }

  async function handleDelete() {
    if (!selectedAnnouncement) return;

    setDeleteError("");

    try {
      await deleteAnnouncement.mutateAsync(selectedAnnouncement.id);
      setOpenDelete(false);
      setSelectedAnnouncement(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "حذف اطلاعیه انجام نشد.",
      );
    }
  }

  if (isLoading) {
    return <div className="py-10 text-center">در حال بارگذاری...</div>;
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">
          بارگذاری اطلاعیه‌ها انجام نشد
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
        <h1 className="text-3xl font-bold">مدیریت اطلاعیه‌ها</h1>
        <Button onClick={() => setOpenCreate(true)}>
          افزودن اطلاعیه
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
        placeholder="جستجوی اطلاعیه..."
      />

      <DataTable
        data={filtered}
        columns={[
          {
            key: "title",
            title: "اطلاعیه",
            render: (item) => (
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="mt-1 line-clamp-1 text-xs text-slate-400">
                  {item.body}
                </div>
              </div>
            ),
          },
          {
            key: "date",
            title: "بازه نمایش",
            render: (item) => (
              <span className="text-sm text-slate-300">
                {formatDate(item.startDate)} تا {formatDate(item.endDate)}
              </span>
            ),
          },
          {
            key: "priority",
            title: "اولویت",
          },
          {
            key: "published",
            title: "وضعیت",
            render: (item) => (
              <span
                className={
                  item.published
                    ? "rounded-lg bg-emerald-900/40 px-3 py-1 text-xs text-emerald-300"
                    : "rounded-lg bg-red-900/40 px-3 py-1 text-xs text-red-300"
                }
              >
                {item.published ? "منتشر شده" : "پیش‌نویس"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (item) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFormError("");
                    setSelectedAnnouncement(item);
                    setOpenEdit(true);
                  }}
                >
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteAnnouncement.isPending}
                  onClick={() => {
                    setDeleteError("");
                    setSelectedAnnouncement(item);
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

      <Dialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) setFormError("");
        }}
        title="افزودن اطلاعیه"
      >
        <AnnouncementForm
          loading={createAnnouncement.isPending}
          error={formError}
          onSubmit={handleCreate}
        />
      </Dialog>

      <Dialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) {
            setFormError("");
            setSelectedAnnouncement(null);
          }
        }}
        title="ویرایش اطلاعیه"
      >
        {selectedAnnouncement && (
          <AnnouncementForm
            announcement={selectedAnnouncement}
            loading={updateAnnouncement.isPending}
            error={formError}
            onSubmit={handleUpdate}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={(open) => {
          setOpenDelete(open);
          if (!open) setSelectedAnnouncement(null);
        }}
        title="حذف اطلاعیه"
        description="آیا از حذف این اطلاعیه مطمئن هستید؟"
        loading={deleteAnnouncement.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
