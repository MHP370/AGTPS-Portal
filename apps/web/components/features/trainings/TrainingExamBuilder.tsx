"use client";

import { ClipboardCheck, LockKeyhole, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAdminTrainingExam, useAdminTrainingExams, useSaveTrainingExam } from "@/hooks/useTrainings";
import type { InPersonTraining, TrainingExamQuestion, TrainingExamQuestionType } from "@/lib/trainings";

type EditableQuestion = TrainingExamQuestion & { optionsText: string; correctText: string };

function emptyQuestion(index: number): EditableQuestion {
  return { type: "SINGLE_CHOICE", title: "", description: "", options: [], correctAnswer: "", points: 1, sortOrder: index, isRequired: true, optionsText: "", correctText: "" };
}

export function TrainingExamBuilder({ courses }: { courses: InPersonTraining[] }) {
  const { data: exams = [] } = useAdminTrainingExams();
  const [trainingId, setTrainingId] = useState("");
  const { data: exam, isLoading } = useAdminTrainingExam(trainingId);
  const saveExam = useSaveTrainingExam();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState("60");
  const [duration, setDuration] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [shuffle, setShuffle] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [published, setPublished] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [message, setMessage] = useState("");
  const selectedExamSummary = exams.find((item) => item.trainingId === trainingId);
  const locked = Boolean(selectedExamSummary?._count.attempts);

  useEffect(() => {
    if (!trainingId || isLoading) return;
    setTitle(exam?.title ?? courses.find((course) => course.id === trainingId)?.title ?? "");
    setDescription(exam?.description ?? "");
    setPassingScore(String(exam?.passingScore ?? 60));
    setDuration(String(exam?.durationMinutes ?? ""));
    setMaxAttempts(String(exam?.maxAttempts ?? 1));
    setShuffle(Boolean(exam?.shuffleQuestions));
    setShowResult(exam?.showResultImmediately ?? true);
    setPublished(Boolean(exam?.isPublished));
    setQuestions((exam?.questions ?? []).map((question) => ({
      ...question,
      optionsText: (question.options ?? []).map((option) => option.label).join("، "),
      correctText: Array.isArray(question.correctAnswer) ? question.correctAnswer.join("، ") : String(question.correctAnswer ?? ""),
    })));
  }, [courses, exam, isLoading, trainingId]);

  function updateQuestion(index: number, patch: Partial<EditableQuestion>) {
    setQuestions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!trainingId || !title.trim() || questions.some((question) => !question.title.trim())) return;
    await saveExam.mutateAsync({
      trainingId,
      dto: {
        title: title.trim(), description: description.trim(), passingScore: Number(passingScore),
        durationMinutes: duration ? Number(duration) : null, maxAttempts: Number(maxAttempts),
        shuffleQuestions: shuffle, showResultImmediately: showResult, isPublished: published,
        questions: questions.map((question, index) => {
          const labels = question.type === "TRUE_FALSE" ? ["درست", "نادرست"] : question.optionsText.split(/[،,\n]/).map((item) => item.trim()).filter(Boolean);
          const options = labels.map((label, optionIndex) => ({ id: String(optionIndex + 1), label }));
          const rawCorrect = question.correctText.split(/[،,\n]/).map((item) => item.trim()).filter(Boolean);
          return {
            type: question.type, title: question.title.trim(), description: question.description?.trim(),
            options: question.type === "SHORT_TEXT" ? [] : options,
            correctAnswer: question.type === "MULTIPLE_CHOICE" ? rawCorrect : (rawCorrect[0] ?? ""),
            points: Number(question.points), sortOrder: index, isRequired: question.isRequired,
          };
        }),
      },
    });
    setMessage("آزمون و سؤال‌ها ذخیره شدند.");
  }

  return (
    <div className="space-y-5">
    <section className="space-y-5 rounded-2xl border border-cyan-400/15 bg-slate-900/60 p-5">
      <div className="flex items-center gap-3"><ClipboardCheck className="text-cyan-200" /><div><h2 className="text-xl font-black text-white">آزمون‌ساز دوره‌ها</h2><p className="mt-1 text-xs text-slate-400">آزمون تا زمان فعال‌کردن «انتشار» برای شرکت‌کنندگان نمایش داده نمی‌شود.</p></div></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{exams.map((item) => <button type="button" key={item.id} onClick={() => setTrainingId(item.trainingId)} className={`rounded-xl border p-4 text-right transition ${trainingId === item.trainingId ? "border-cyan-300/40 bg-cyan-400/10" : "border-slate-800 bg-slate-950/40"}`}><div className="flex items-start justify-between gap-3"><strong className="text-white">{item.title}</strong><span className={`rounded-full px-2 py-1 text-[10px] ${item.isPublished ? "bg-emerald-400/10 text-emerald-100" : "bg-slate-700 text-slate-300"}`}>{item.isPublished ? "منتشرشده" : "پیش‌نویس"}</span></div><p className="mt-2 text-xs text-slate-500">{item.training.title}</p><div className="mt-3 flex gap-3 text-xs text-slate-400"><span>{item._count.questions.toLocaleString("fa-IR")} سؤال</span><span>{item._count.attempts.toLocaleString("fa-IR")} پاسخ</span>{item._count.attempts > 0 && <LockKeyhole size={14} className="text-amber-200" />}</div></button>)}</div>
      <Select value={trainingId} onValueChange={(value) => { setTrainingId(value); setMessage(""); }} placeholder="دوره را انتخاب کنید" options={courses.filter((course) => course.hasExam).map((course) => ({ value: course.id, label: course.title }))} />
      {trainingId && <form onSubmit={submit} className="space-y-5">
        {locked && <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-amber-100"><LockKeyhole className="ml-2 inline" size={17} />این آزمون پاسخ ثبت‌شده دارد و برای حفظ صحت نتایج قابل ویرایش یا حذف نیست.</div>}
        <fieldset disabled={locked} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="عنوان آزمون" required><Input value={title} onChange={(event) => setTitle(event.target.value)} /></FormField>
          <FormField label="حدنصاب قبولی"><Input type="number" min="0" max="100" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} /></FormField>
          <FormField label="زمان / دقیقه"><Input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} /></FormField>
          <FormField label="تعداد مجاز تلاش"><Input type="number" min="1" max="20" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} /></FormField>
        </div>
        <FormField label="توضیحات"><textarea className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white" value={description} onChange={(event) => setDescription(event.target.value)} /></FormField>
        <div className="flex flex-wrap gap-3 text-sm text-slate-200">
          <label className="rounded-xl border border-slate-700 p-3"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} className="ml-2" />ترتیب تصادفی سؤال‌ها</label>
          <label className="rounded-xl border border-slate-700 p-3"><input type="checkbox" checked={showResult} onChange={(event) => setShowResult(event.target.checked)} className="ml-2" />نمایش فوری نتیجه</label>
          <label className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} className="ml-2" />انتشار آزمون</label>
        </div>
        <div className="space-y-4">
          {questions.map((question, index) => <article key={index} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex items-center justify-between"><h3 className="font-black text-white">سؤال {index + 1}</h3><Button type="button" size="sm" variant="danger" onClick={() => setQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /> حذف</Button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="نوع سؤال"><Select value={question.type} onValueChange={(value) => updateQuestion(index, { type: value as TrainingExamQuestionType })} options={[{value:"SINGLE_CHOICE",label:"تک‌گزینه‌ای"},{value:"MULTIPLE_CHOICE",label:"چندگزینه‌ای"},{value:"TRUE_FALSE",label:"درست / نادرست"},{value:"SHORT_TEXT",label:"پاسخ کوتاه"}]} /></FormField>
              <FormField label="امتیاز"><Input type="number" min="0.25" step="0.25" value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} /></FormField>
              <label className="mt-7 text-sm text-slate-300"><input type="checkbox" checked={question.isRequired} onChange={(event) => updateQuestion(index, { isRequired: event.target.checked })} className="ml-2" />پاسخ اجباری</label>
            </div>
            <FormField label="متن سؤال" required><Input value={question.title} onChange={(event) => updateQuestion(index, { title: event.target.value })} /></FormField>
            {question.type !== "TRUE_FALSE" && question.type !== "SHORT_TEXT" && <FormField label="گزینه‌ها؛ با ویرگول یا خط جدید جدا کنید"><textarea className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white" value={question.optionsText} onChange={(event) => updateQuestion(index, { optionsText: event.target.value })} /></FormField>}
            <FormField label={question.type === "MULTIPLE_CHOICE" ? "پاسخ‌های صحیح؛ جداشده با ویرگول" : "پاسخ صحیح"}><Input value={question.correctText} onChange={(event) => updateQuestion(index, { correctText: event.target.value })} placeholder={question.type === "TRUE_FALSE" ? "درست یا نادرست" : "متن دقیق پاسخ"} /></FormField>
          </article>)}
        </div>
        <div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={() => setQuestions((items) => [...items, emptyQuestion(items.length)])}><Plus size={17} /> افزودن سؤال</Button><Button type="submit" disabled={saveExam.isPending || questions.length === 0}>ذخیره آزمون</Button></div>
        </fieldset>
        {message && <p className="rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p>}
      </form>}
    </section>
    </div>
  );
}
