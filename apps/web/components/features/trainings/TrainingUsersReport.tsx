"use client";

import { useState } from "react";
import { Award, BookOpenCheck, CheckCircle2, ClipboardCheck, Search, Users, XCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { useCourseReports, useTrainingUsers } from "@/hooks/useTrainings";

function date(value: string) { return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value)); }

export function TrainingUsersPanel() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTrainingUsers(search, page);
  return <section className="space-y-5 rounded-2xl border border-cyan-400/15 bg-slate-900/60 p-5">
    <div><h2 className="flex items-center gap-2 text-xl font-black text-white"><Users className="text-cyan-200" /> سوابق کاربران آموزش</h2><p className="mt-2 text-sm text-slate-400">جستجو بر اساس نام، نام کاربری، ایمیل یا کد پرسنلی و مشاهده تاریخچه کامل دوره‌ها.</p></div>
    <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><Input className="pr-10" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="جستجوی کاربر یا کد پرسنلی" /></div>
    <div className="grid gap-4 lg:grid-cols-2">{data?.items.map((user) => <article key={user.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-black text-white">{user.displayName}</h3><p className="mt-1 text-xs text-cyan-200" dir="ltr">{user.username || user.email}</p></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">کد: {user.personnelCode || "ثبت نشده"}</span></div><p className="mt-2 text-xs text-slate-500">{user.department || "واحد سازمانی ثبت نشده"}</p><div className="mt-4 max-h-52 space-y-2 overflow-auto">{user.history.map((item) => <div key={item.id} className="rounded-xl border border-slate-800 p-3 text-xs"><div className="flex items-center justify-between gap-3"><strong className="text-white">{item.training?.title || "دوره"}</strong><span className={item.result === "PASSED" ? "text-emerald-200" : item.result === "FAILED" ? "text-red-200" : "text-slate-400"}>{item.result}</span></div><div className="mt-2 flex flex-wrap gap-3 text-slate-500"><span>نمره: {item.score?.toLocaleString("fa-IR") || "—"}</span><span>آزمون: {item.examAttempts?.length || 0}</span><span>گواهی: {item.certificates?.length ? "صادر شده" : "ندارد"}</span></div></div>)}</div></article>)}{!isLoading && !data?.items.length && <p className="col-span-full rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">کاربری پیدا نشد.</p>}</div>
    <Pagination page={page} pageSize={data?.pageSize || 15} totalItems={data?.total || 0} onPageChange={setPage} />
  </section>;
}

export function TrainingReportsPanel() {
  const { data, isLoading } = useCourseReports();
  if (isLoading || !data) return <div className="rounded-2xl border border-slate-800 p-8 text-center text-slate-400">در حال آماده‌سازی گزارش...</div>;
  const cards = [
    { label: "دوره‌ها", value: data.totals.courses, icon: BookOpenCheck, color: "text-cyan-200" },
    { label: "ثبت‌نام‌ها", value: data.totals.participants, icon: Users, color: "text-blue-200" },
    { label: "آزمون‌های ثبت‌شده", value: data.totals.attempts, icon: ClipboardCheck, color: "text-amber-200" },
    { label: "قبول‌شده", value: data.totals.passed, icon: CheckCircle2, color: "text-emerald-200" },
    { label: "مردود", value: data.totals.failed, icon: XCircle, color: "text-red-200" },
    { label: "گواهی صادرشده", value: data.totals.certificates, icon: Award, color: "text-violet-200" },
  ];
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{cards.map((card) => <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><card.icon className={card.color} size={20} /><strong className="mt-3 block text-2xl text-white">{card.value.toLocaleString("fa-IR")}</strong><span className="text-xs text-slate-500">{card.label}</span></div>)}</div><section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="text-xl font-black text-white">گزارش دوره‌ها</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[780px] text-right text-sm"><thead className="text-xs text-slate-500"><tr><th className="p-3">دوره</th><th className="p-3">تاریخ</th><th className="p-3">شرکت‌کننده</th><th className="p-3">قبول</th><th className="p-3">مردود</th><th className="p-3">گواهی</th></tr></thead><tbody>{data.recentCourses.map((course) => <tr key={course.id} className="border-t border-slate-800"><td className="p-3 font-bold text-white">{course.title}</td><td className="p-3 text-slate-400">{date(course.startDate)}</td><td className="p-3">{(course._count?.participants || 0).toLocaleString("fa-IR")}</td><td className="p-3 text-emerald-200">{course.participants.filter((item) => item.result === "PASSED").length.toLocaleString("fa-IR")}</td><td className="p-3 text-red-200">{course.participants.filter((item) => item.result === "FAILED").length.toLocaleString("fa-IR")}</td><td className="p-3 text-violet-200">{course.participants.filter((item) => item.certificates?.length).length.toLocaleString("fa-IR")}</td></tr>)}</tbody></table></div></section></div>;
}
