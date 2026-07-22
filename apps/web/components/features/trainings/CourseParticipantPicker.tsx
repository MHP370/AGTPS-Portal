"use client";

import { Search, UserCheck, Users } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useEligibleTrainingParticipants, useEnrollDirectoryUsers } from "@/hooks/useTrainings";
import type { InPersonTraining } from "@/lib/trainings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";

export function CourseParticipantPicker({ courses }: { courses: InPersonTraining[] }) {
  const [trainingId, setTrainingId] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const { data, isLoading } = useEligibleTrainingParticipants(deferredSearch, page);
  const enroll = useEnrollDirectoryUsers();
  const selectedCourse = courses.find((course) => course.id === trainingId);
  const enrolledIds = useMemo(
    () =>
      new Set(
        selectedCourse?.participants
          .map((participant) => participant.directoryUserId)
          .filter((id): id is string => Boolean(id)) ?? [],
      ),
    [selectedCourse],
  );

  useEffect(() => setPage(1), [deferredSearch]);
  useEffect(() => {
    setSelectedIds(new Set());
    setMessage("");
  }, [trainingId]);

  async function submit() {
    if (!trainingId || selectedIds.size === 0) return;
    const result = await enroll.mutateAsync({
      trainingId,
      directoryUserIds: [...selectedIds],
    });
    setSelectedIds(new Set());
    setMessage(
      `${result.added.toLocaleString("fa-IR")} نفر اضافه شد${result.skipped ? ` و ${result.skipped.toLocaleString("fa-IR")} مورد تکراری نادیده گرفته شد` : ""}.`,
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-400/15 bg-slate-900/60 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-100"><Users size={21} /></span>
          <div>
            <h2 className="text-xl font-black text-white">انتخاب شرکت‌کنندگان Active Directory</h2>
            <p className="mt-1 text-xs text-slate-400">فقط کاربران فعال و همگام‌شده دامنه نمایش داده می‌شوند.</p>
          </div>
        </div>
        <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">
          {selectedIds.size.toLocaleString("fa-IR")} نفر انتخاب شده
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Select
          value={trainingId}
          onValueChange={setTrainingId}
          placeholder="ابتدا دوره را انتخاب کنید"
          options={courses.map((course) => ({ value: course.id, label: course.title }))}
        />
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی نام، نام کاربری، ایمیل یا واحد" className="pr-10" />
        </div>
      </div>

      {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</div>}

      <div className="grid max-h-[420px] gap-2 overflow-auto sm:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((user) => {
          const alreadyEnrolled = enrolledIds.has(user.id);
          const selected = selectedIds.has(user.id);
          return (
            <label key={user.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${selected ? "border-cyan-300/30 bg-cyan-400/10" : "border-slate-800 bg-slate-950/50"} ${alreadyEnrolled || !trainingId ? "cursor-not-allowed opacity-55" : "hover:border-slate-600"}`}>
              <input
                type="checkbox"
                checked={selected}
                disabled={alreadyEnrolled || !trainingId}
                onChange={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(user.id)) next.delete(user.id); else next.add(user.id); return next; })}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-white">{user.displayName}</p>
                <p className="mt-1 truncate text-xs text-cyan-100" dir="ltr">{user.username}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{user.department || user.title || "واحد ثبت نشده"}</p>
                {alreadyEnrolled && <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-200"><UserCheck size={13} /> قبلاً ثبت شده</span>}
              </div>
            </label>
          );
        })}
        {!isLoading && data?.items.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">کاربری پیدا نشد.</div>}
        {isLoading && <div className="col-span-full p-5 text-center text-sm text-slate-400">در حال دریافت کاربران...</div>}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Pagination page={page} pageSize={data?.pageSize || 12} totalItems={data?.total || 0} onPageChange={setPage} />
        <Button type="button" onClick={submit} disabled={!trainingId || selectedIds.size === 0 || enroll.isPending}>
          ثبت {selectedIds.size.toLocaleString("fa-IR")} شرکت‌کننده در دوره
        </Button>
      </div>
    </section>
  );
}
