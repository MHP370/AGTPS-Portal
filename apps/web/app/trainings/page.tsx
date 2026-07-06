"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, PlayCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/Input";
import { useTrainings } from "@/hooks/useTrainings";

export default function TrainingLibraryPage() {
  const { data: trainings = [] } = useTrainings();
  const [query, setQuery] = useState("");

  const filteredTrainings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return trainings;

    return trainings.filter((training) =>
      [
        training.title,
        training.description,
        training.category?.name,
        training.instructor,
        training.department,
        training.level,
        ...training.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, trainings]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-100">
              <GraduationCap size={25} />
            </span>
            <div>
              <h1 className="text-3xl font-black">کتابخانه آموزش</h1>
              <p className="mt-2 text-sm text-slate-400">
                آموزش‌های منتشرشده سازمانی را مشاهده و دنبال کنید.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row md:items-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200 hover:bg-white/[0.08]"
            >
              بازگشت به پرتال
              <ArrowRight size={17} />
            </Link>
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجوی آموزش..."
                className="pr-10"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredTrainings.map((training) => (
            <Link
              key={training.id}
              href={`/trainings/${training.id}`}
              className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 transition hover:border-cyan-300/40 hover:bg-slate-800"
            >
              <div
                className="relative h-40 bg-slate-800 bg-cover bg-center"
                style={{
                  backgroundImage: training.thumbnail
                    ? `url(${training.thumbnail})`
                    : undefined,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
                <span className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/30">
                  {training.contentType === "VIDEO" ? (
                    <PlayCircle size={23} />
                  ) : (
                    <GraduationCap size={23} />
                  )}
                </span>
              </div>
              <div className="space-y-3 p-4 text-right">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                    {training.category?.name || "آموزش"}
                  </span>
                  {training.isRequired && (
                    <span className="rounded-full bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-100">
                      اجباری
                    </span>
                  )}
                </div>
                <h2 className="line-clamp-2 text-lg font-black">
                  {training.title}
                </h2>
                <p className="line-clamp-2 text-sm leading-7 text-slate-400">
                  {training.description || "محتوای آموزشی سازمانی"}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {training.durationMinutes
                      ? `${training.durationMinutes} دقیقه`
                      : "بدون زمان"}
                  </span>
                  <span>{training.files.length} فایل</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredTrainings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
            آموزشی برای نمایش پیدا نشد.
          </div>
        )}
      </div>
    </main>
  );
}
