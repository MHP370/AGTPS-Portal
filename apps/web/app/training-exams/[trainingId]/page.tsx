"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMyTrainingExam, useStartTrainingExam, useSubmitTrainingExam } from "@/hooks/useTrainings";

export default function TrainingExamPage() {
  const params = useParams<{ trainingId: string }>();
  const trainingId = params.trainingId;
  const { data: exam, isLoading, refetch } = useMyTrainingExam(trainingId);
  const start = useStartTrainingExam();
  const submit = useSubmitTrainingExam();
  const [attemptId, setAttemptId] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{ score?: number | null; passed?: boolean | null } | null>(null);

  async function begin() {
    const attempt = await start.mutateAsync(trainingId);
    setAttemptId(attempt.id);
  }

  async function finish() {
    if (!attemptId || !exam) return;
    const saved = await submit.mutateAsync({
      attemptId,
      answers: exam.questions.map((question) => ({ questionId: question.id || "", value: answers[question.id || ""] ?? null })),
    });
    setResult(saved);
    setAttemptId("");
    await refetch();
  }

  if (isLoading) return <main className="min-h-screen bg-slate-950 p-6 text-center text-slate-300">در حال دریافت آزمون...</main>;
  if (!exam) return <main className="min-h-screen bg-slate-950 p-6 text-center text-slate-300">آزمون در دسترس نیست.</main>;

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white" dir="rtl">
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/profile" className="inline-flex items-center gap-2 text-sm text-cyan-200"><ArrowRight size={17} /> بازگشت به پروفایل</Link>
      <section className="rounded-3xl border border-cyan-400/15 bg-slate-900/75 p-6">
        <div className="flex items-center gap-3"><ClipboardCheck className="text-cyan-200" /><div><h1 className="text-2xl font-black">{exam.title}</h1><p className="mt-1 text-sm text-slate-400">حدنصاب {exam.passingScore.toLocaleString("fa-IR")}٪ · {exam.durationMinutes ? `${exam.durationMinutes.toLocaleString("fa-IR")} دقیقه` : "بدون محدودیت زمان"} · {exam.remainingAttempts?.toLocaleString("fa-IR")} تلاش باقی‌مانده</p></div></div>
        {exam.description && <p className="mt-5 leading-8 text-slate-300">{exam.description}</p>}
      </section>

      {result && <section className={`rounded-2xl border p-5 ${result.passed ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-amber-400/20 bg-amber-400/10 text-amber-100"}`}><p className="flex items-center gap-2 font-black"><CheckCircle2 /> نتیجه آزمون: {result.score == null ? "پس از بررسی اعلام می‌شود" : `${result.score.toLocaleString("fa-IR")}٪ - ${result.passed ? "قبول" : "مردود"}`}</p></section>}

      {!attemptId ? <Button onClick={begin} disabled={start.isPending || (exam.remainingAttempts ?? 0) <= 0}>شروع آزمون</Button> : <section className="space-y-5">
        {exam.questions.map((question, index) => <article key={question.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="font-black">{index + 1}. {question.title} <span className="text-xs text-slate-500">({question.points} امتیاز)</span></h2>
          {question.description && <p className="text-sm text-slate-400">{question.description}</p>}
          {question.type === "SHORT_TEXT" ? <Input value={String(answers[question.id || ""] ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [question.id || ""]: event.target.value }))} /> : <div className="grid gap-2 sm:grid-cols-2">
            {(question.options ?? []).map((option) => {
              const current = answers[question.id || ""];
              const checked = question.type === "MULTIPLE_CHOICE" ? Array.isArray(current) && current.includes(option.label) : current === option.label;
              return <label key={option.id} className={`cursor-pointer rounded-xl border p-3 ${checked ? "border-cyan-300/30 bg-cyan-400/10" : "border-slate-700"}`}><input type={question.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={question.id} checked={checked} onChange={() => setAnswers((state) => {
                if (question.type !== "MULTIPLE_CHOICE") return { ...state, [question.id || ""]: option.label };
                const values = Array.isArray(state[question.id || ""]) ? state[question.id || ""] as string[] : [];
                return { ...state, [question.id || ""]: values.includes(option.label) ? values.filter((value) => value !== option.label) : [...values, option.label] };
              })} className="ml-2" />{option.label}</label>;
            })}
          </div>}
        </article>)}
        <Button onClick={finish} disabled={submit.isPending}>ثبت نهایی پاسخ‌ها</Button>
      </section>}
    </div>
  </main>;
}
