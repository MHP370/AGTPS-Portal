"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import type {
  Announcement,
  CreateAnnouncementDto,
} from "@/lib/announcements";

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

interface AnnouncementFormProps {
  announcement?: Announcement;
  loading?: boolean;
  error?: string;
  onSubmit: (dto: CreateAnnouncementDto) => Promise<void>;
}

export function AnnouncementForm({
  announcement,
  loading = false,
  error,
  onSubmit,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("1");
  const [published, setPublished] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setBody(announcement.body);
      setStartDate(toDateInputValue(announcement.startDate));
      setEndDate(toDateInputValue(announcement.endDate));
      setPriority(String(announcement.priority ?? 1));
      setPublished(announcement.published);
      setFormError("");
      return;
    }

    setTitle("");
    setBody("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setPriority("1");
    setPublished(true);
    setFormError("");
  }, [announcement]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsedPriority = Number(priority || 1);

    if (!title.trim() || !body.trim() || !startDate) {
      setFormError("عنوان، متن و تاریخ شروع الزامی هستند.");
      return;
    }

    if (!Number.isInteger(parsedPriority) || parsedPriority < 1) {
      setFormError("اولویت باید عدد صحیح بزرگ‌تر از صفر باشد.");
      return;
    }

    setFormError("");

    await onSubmit({
      title: title.trim(),
      body: body.trim(),
      startDate,
      endDate: endDate || undefined,
      priority: parsedPriority,
      published,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {(error || formError) && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error || formError}
        </div>
      )}

      <FormField label="عنوان اطلاعیه" required>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={loading}
        />
      </FormField>

      <FormField label="متن اطلاعیه" required>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={loading}
          rows={5}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_150px]">
        <FormField label="شروع نمایش" required>
          <PersianDateInput
            value={startDate}
            onChange={setStartDate}
            disabled={loading}
          />
        </FormField>

        <FormField label="پایان نمایش">
          <div className="space-y-2">
            <PersianDateInput
              value={endDate}
              onChange={setEndDate}
              disabled={loading}
            />
            {endDate && (
              <button
                type="button"
                className="text-xs font-bold text-slate-400 hover:text-cyan-200"
                onClick={() => setEndDate("")}
                disabled={loading}
              >
                حذف تاریخ پایان
              </button>
            )}
          </div>
        </FormField>

        <FormField label="اولویت">
          <Input
            type="number"
            min={1}
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            disabled={loading}
          />
          اطلاعیه منتشر شود
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "در حال ذخیره..." : "ذخیره اطلاعیه"}
        </Button>
      </div>
    </form>
  );
}
