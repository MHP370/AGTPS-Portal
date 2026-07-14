"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import type {
  CreateMeetingDto,
  Meeting,
  MeetingStatus,
  MeetingVisibility,
} from "@/lib/meetings";

type ParticipantFormRow = {
  directoryUserId: string;
  displayName: string;
  email: string;
};

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toTimeInputValue(value?: string | null) {
  return value ? value.slice(11, 16) : "";
}

function combineDateTime(date: string, time: string) {
  return `${date}T${time || "09:00"}:00`;
}

interface MeetingFormProps {
  meeting?: Meeting;
  loading?: boolean;
  error?: string;
  onSubmit: (dto: CreateMeetingDto) => Promise<void>;
}

export function MeetingForm({
  meeting,
  loading = false,
  error,
  onSubmit,
}: MeetingFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<MeetingStatus>("SCHEDULED");
  const [visibility, setVisibility] = useState<MeetingVisibility>("PUBLIC");
  const [organizerDirectoryUserId, setOrganizerDirectoryUserId] =
    useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [participants, setParticipants] = useState<ParticipantFormRow[]>([
    { directoryUserId: "", displayName: "", email: "" },
  ]);
  const [formError, setFormError] = useState("");
  const { data: directoryUsers = [] } = useDirectoryUsers();
  const activeDirectoryUsers = directoryUsers.filter((user) => user.isActive);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (meeting) {
        setTitle(meeting.title);
        setDescription(meeting.description ?? "");
        setLocation(meeting.location ?? "");
        setStartDate(toDateInputValue(meeting.startAt));
        setStartTime(toTimeInputValue(meeting.startAt) || "09:00");
        setEndDate(toDateInputValue(meeting.endAt));
        setEndTime(toTimeInputValue(meeting.endAt));
        setStatus(meeting.status);
        setVisibility(meeting.visibility);
        setOrganizerDirectoryUserId(meeting.organizerDirectoryUserId ?? "");
        setIsPublished(meeting.isPublished);
        setParticipants(
          meeting.participants.length > 0
            ? meeting.participants.map((participant) => ({
                directoryUserId: participant.directoryUserId ?? "",
                displayName: participant.displayName,
                email: participant.email ?? "",
              }))
            : [{ directoryUserId: "", displayName: "", email: "" }],
        );
        setFormError("");
        return;
      }

      setTitle("");
      setDescription("");
      setLocation("");
      setStartDate(new Date().toISOString().slice(0, 10));
      setStartTime("09:00");
      setEndDate("");
      setEndTime("");
      setStatus("SCHEDULED");
      setVisibility("PUBLIC");
      setOrganizerDirectoryUserId("");
      setIsPublished(true);
      setParticipants([{ directoryUserId: "", displayName: "", email: "" }]);
      setFormError("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [meeting]);

  function updateParticipant(
    index: number,
    field: keyof ParticipantFormRow,
    value: string,
  ) {
    setParticipants((current) =>
      current.map((participant, participantIndex) =>
        participantIndex === index
          ? { ...participant, [field]: value }
          : participant,
      ),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !startDate || !startTime) {
      setFormError("عنوان، تاریخ و ساعت شروع الزامی هستند.");
      return;
    }

    const cleanParticipants = participants
      .map((participant) => {
        const directoryUser = activeDirectoryUsers.find(
          (user) => user.id === participant.directoryUserId,
        );

        return {
          directoryUserId: participant.directoryUserId || undefined,
          displayName:
            directoryUser?.displayName ?? participant.displayName.trim(),
          email: directoryUser?.email ?? participant.email.trim(),
        };
      })
      .filter((participant) => participant.displayName);

    setFormError("");

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startAt: combineDateTime(startDate, startTime),
      endAt:
        endDate || endTime
          ? combineDateTime(endDate || startDate, endTime || startTime)
          : undefined,
      status,
      visibility,
      organizerDirectoryUserId: organizerDirectoryUserId || undefined,
      isPublished,
      participants: cleanParticipants.map((participant) => ({
        directoryUserId: participant.directoryUserId,
        displayName: participant.displayName,
        email: participant.email || undefined,
      })),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {(error || formError) && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error || formError}
        </div>
      )}

      <FormField label="عنوان جلسه" required>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={loading}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="محل جلسه">
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={loading}
            placeholder="سالن جلسات، Teams، ..."
          />
        </FormField>

        <FormField label="برگزارکننده">
          <select
            value={organizerDirectoryUserId}
            onChange={(event) =>
              setOrganizerDirectoryUserId(event.target.value)
            }
            disabled={loading}
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">انتخاب برگزارکننده</option>
            {activeDirectoryUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="وضعیت">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as MeetingStatus)
            }
            disabled={loading}
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="SCHEDULED">برنامه‌ریزی شده</option>
            <option value="DONE">برگزار شده</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
        </FormField>

        <FormField label="نوع نمایش">
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as MeetingVisibility)
            }
            disabled={loading}
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="PUBLIC">عمومی؛ نمایش برای همه</option>
            <option value="PRIVATE">خصوصی؛ فقط اعضا</option>
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FormField label="تاریخ شروع" required>
          <PersianDateInput
            value={startDate}
            onChange={setStartDate}
            disabled={loading}
          />
        </FormField>

        <FormField label="ساعت شروع" required>
          <Input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="تاریخ پایان">
          <PersianDateInput
            value={endDate}
            onChange={setEndDate}
            disabled={loading}
          />
        </FormField>

        <FormField label="ساعت پایان">
          <Input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <FormField label="توضیحات">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={loading}
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-100">اعضای جلسه</h3>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setParticipants((current) => [
                ...current,
                { directoryUserId: "", displayName: "", email: "" },
              ])
            }
          >
            افزودن عضو
          </Button>
        </div>

        {participants.map((participant, index) => {
          const selectedDirectoryUser = activeDirectoryUsers.find(
            (user) => user.id === participant.directoryUserId,
          );

          return (
          <div key={index} className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
            <select
              value={participant.directoryUserId}
              onChange={(event) => {
                const directoryUser = activeDirectoryUsers.find(
                  (user) => user.id === event.target.value,
                );
                updateParticipant(
                  index,
                  "directoryUserId",
                  event.target.value,
                );
                updateParticipant(
                  index,
                  "displayName",
                  directoryUser?.displayName ?? "",
                );
                updateParticipant(index, "email", directoryUser?.email ?? "");
              }}
              disabled={loading}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">انتخاب عضو از دایرکتوری</option>
              {activeDirectoryUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
            <Input
              type="email"
              value={selectedDirectoryUser?.email ?? participant.email}
              onChange={(event) =>
                updateParticipant(index, "email", event.target.value)
              }
              disabled={loading}
              placeholder="email@example.com"
            />
            <Button
              type="button"
              variant="ghost"
              disabled={loading || participants.length === 1}
              onClick={() =>
                setParticipants((current) =>
                  current.filter((_, participantIndex) => participantIndex !== index),
                )
              }
            >
              حذف
            </Button>
          </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            disabled={loading}
          />
          جلسه در پورتال نمایش داده شود
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "در حال ذخیره..." : "ذخیره جلسه"}
        </Button>
      </div>
    </form>
  );
}
