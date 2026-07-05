"use client";

import { useMemo, useState } from "react";

import { MeetingForm } from "@/components/features/meetings/MeetingForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { SearchBox } from "@/components/ui/SearchBox";
import {
  useAdminMeetings,
  useCreateMeeting,
  useDeleteMeeting,
  useUpdateMeeting,
} from "@/hooks/useMeetings";
import type { CreateMeetingDto, Meeting } from "@/lib/meetings";

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

export default function MeetingsPage() {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<Meeting | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return data;

    return data.filter((meeting) =>
      [
        meeting.title,
        meeting.description ?? "",
        meeting.location ?? "",
        ...meeting.participants.map((participant) => participant.displayName),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [data, search]);

  async function handleCreate(dto: CreateMeetingDto) {
    setFormError("");

    try {
      await createMeeting.mutateAsync(dto);
      setOpenCreate(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "ایجاد جلسه انجام نشد.",
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
        err instanceof Error
          ? err.message
          : "ویرایش جلسه انجام نشد.",
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
        <h1 className="text-xl font-semibold">
          بارگذاری جلسات انجام نشد
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
        <h1 className="text-3xl font-bold">تقویم جلسات</h1>
        <Button onClick={() => setOpenCreate(true)}>افزودن جلسه</Button>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {deleteError}
        </div>
      )}

      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="جستجوی جلسه..."
      />

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
