"use client";

import { useMemo, useState } from "react";

import { MeetingForm } from "@/components/features/meetings/MeetingForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import { SearchBox } from "@/components/ui/SearchBox";
import {
  useAdminMeetings,
  useCreateMeeting,
  useDeleteMeeting,
  useUpdateMeeting,
} from "@/hooks/useMeetings";
import type {
  CreateMeetingDto,
  Meeting,
  MeetingStatus,
  MeetingVisibility,
} from "@/lib/meetings";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const statusLabel: Record<string, string> = {
  SCHEDULED: "برنامه‌ریزی شده",
  DONE: "برگزار شده",
  CANCELLED: "لغو شده",
};

type StatusFilter = "ALL" | MeetingStatus;
type VisibilityFilter = "ALL" | MeetingVisibility;
type PublishFilter = "ALL" | "PUBLISHED" | "DRAFT";

function getDateBoundary(value: string, boundary: "start" | "end") {
  if (!value) return null;

  const date = new Date(
    boundary === "start" ? `${value}T00:00:00` : `${value}T23:59:59`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function MeetingsPage() {
  const { data = [], isLoading, isError, error, refetch } = useAdminMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("ALL");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const fromBoundary = getDateBoundary(dateFrom, "start");
    const toBoundary = getDateBoundary(dateTo, "end");

    return data.filter((meeting) => {
      const meetingStart = new Date(meeting.startAt);
      const searchableText = [
        meeting.title,
        meeting.description ?? "",
        meeting.location ?? "",
        ...meeting.participants.map((participant) => participant.displayName),
      ]
        .join(" ")
        .toLowerCase();

      if (keyword && !searchableText.includes(keyword)) return false;
      if (statusFilter !== "ALL" && meeting.status !== statusFilter) {
        return false;
      }
      if (
        visibilityFilter !== "ALL" &&
        meeting.visibility !== visibilityFilter
      ) {
        return false;
      }
      if (publishFilter === "PUBLISHED" && !meeting.isPublished) {
        return false;
      }
      if (publishFilter === "DRAFT" && meeting.isPublished) {
        return false;
      }
      if (fromBoundary && meetingStart < fromBoundary) return false;
      if (toBoundary && meetingStart > toBoundary) return false;

      return true;
    });
  }, [
    data,
    dateFrom,
    dateTo,
    publishFilter,
    search,
    statusFilter,
    visibilityFilter,
  ]);

  const activeFilterCount = [
    search.trim(),
    statusFilter !== "ALL",
    visibilityFilter !== "ALL",
    publishFilter !== "ALL",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setVisibilityFilter("ALL");
    setPublishFilter("ALL");
    setDateFrom("");
    setDateTo("");
  }

  async function handleCreate(dto: CreateMeetingDto) {
    setFormError("");

    try {
      await createMeeting.mutateAsync(dto);
      setOpenCreate(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "ایجاد جلسه انجام نشد.",
      );
    }
  }

  async function handleUpdate(dto: CreateMeetingDto) {
    if (!selectedMeeting) return;

    setFormError("");

    try {
      await updateMeeting.mutateAsync({
        id: selectedMeeting.id,
        dto,
      });
      setOpenEdit(false);
      setSelectedMeeting(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "ویرایش جلسه انجام نشد.",
      );
    }
  }

  async function handleDelete() {
    if (!selectedMeeting) return;

    setDeleteError("");

    try {
      await deleteMeeting.mutateAsync(selectedMeeting.id);
      setOpenDelete(false);
      setSelectedMeeting(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "حذف جلسه انجام نشد.",
      );
    }
  }

  if (isLoading) {
    return <div className="py-10 text-center">در حال بارگذاری...</div>;
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">بارگذاری جلسات انجام نشد</h1>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">تقویم جلسات</h1>
        <Button onClick={() => setOpenCreate(true)}>افزودن جلسه</Button>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {deleteError}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.3fr)_repeat(3,minmax(150px,0.8fr))]">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="جستجوی جلسه، محل یا عضو..."
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="SCHEDULED">برنامه‌ریزی شده</option>
            <option value="DONE">برگزار شده</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
          <select
            value={visibilityFilter}
            onChange={(event) =>
              setVisibilityFilter(event.target.value as VisibilityFilter)
            }
            className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">عمومی و خصوصی</option>
            <option value="PUBLIC">فقط عمومی</option>
            <option value="PRIVATE">فقط خصوصی</option>
          </select>
          <select
            value={publishFilter}
            onChange={(event) =>
              setPublishFilter(event.target.value as PublishFilter)
            }
            className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">همه انتشارها</option>
            <option value="PUBLISHED">منتشر شده</option>
            <option value="DRAFT">منتشر نشده</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_auto] md:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              از تاریخ
            </label>
            <PersianDateInput value={dateFrom} onChange={setDateFrom} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              تا تاریخ
            </label>
            <PersianDateInput value={dateTo} onChange={setDateTo} />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
          >
            پاک کردن فیلترها
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            نمایش {filtered.length.toLocaleString("fa-IR")} جلسه از{" "}
            {data.length.toLocaleString("fa-IR")} جلسه
          </span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 font-bold text-cyan-200">
              {activeFilterCount.toLocaleString("fa-IR")} فیلتر فعال
            </span>
          )}
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={[
          {
            key: "title",
            title: "جلسه",
            render: (meeting) => (
              <div>
                <div className="font-semibold">{meeting.title}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {meeting.location || "بدون محل"}
                </div>
              </div>
            ),
          },
          {
            key: "startAt",
            title: "زمان",
            render: (meeting) => (
              <span className="text-sm text-slate-300">
                {formatDateTime(meeting.startAt)}
              </span>
            ),
          },
          {
            key: "participants",
            title: "اعضا",
            render: (meeting) => (
              <span className="text-sm text-slate-300">
                {meeting.participants.length} نفر
              </span>
            ),
          },
          {
            key: "status",
            title: "وضعیت",
            render: (meeting) => (
              <div className="space-y-2">
                <span className="inline-flex rounded-lg bg-cyan-900/40 px-3 py-1 text-xs text-cyan-200">
                  {statusLabel[meeting.status]}
                </span>
                <span
                  className={
                    meeting.visibility === "PRIVATE"
                      ? "block text-xs font-bold text-amber-300"
                      : "block text-xs font-bold text-emerald-300"
                  }
                >
                  {meeting.visibility === "PRIVATE" ? "خصوصی" : "عمومی"}
                </span>
                <span
                  className={
                    meeting.isPublished
                      ? "block text-xs font-bold text-cyan-300"
                      : "block text-xs font-bold text-slate-400"
                  }
                >
                  {meeting.isPublished ? "منتشر شده" : "منتشر نشده"}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (meeting) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFormError("");
                    setSelectedMeeting(meeting);
                    setOpenEdit(true);
                  }}
                >
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteMeeting.isPending}
                  onClick={() => {
                    setDeleteError("");
                    setSelectedMeeting(meeting);
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
        title="افزودن جلسه"
      >
        <MeetingForm
          loading={createMeeting.isPending}
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
            setSelectedMeeting(null);
          }
        }}
        title="ویرایش جلسه"
      >
        {selectedMeeting && (
          <MeetingForm
            meeting={selectedMeeting}
            loading={updateMeeting.isPending}
            error={formError}
            onSubmit={handleUpdate}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={(open) => {
          setOpenDelete(open);
          if (!open) setSelectedMeeting(null);
        }}
        title="حذف جلسه"
        description="آیا از حذف این جلسه مطمئن هستید؟"
        loading={deleteMeeting.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
