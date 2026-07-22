"use client";

import { useMemo, useState } from "react";
import { Award, BookOpenCheck, CalendarDays, ChevronLeft, ChevronRight, Eye, LockKeyhole, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { PersianDateTimeInput } from "@/components/ui/PersianDateInput";
import { Select } from "@/components/ui/Select";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAdminInPersonTrainings, useCertificateTemplates, useCreateInPersonTraining, useEligibleTrainingParticipants, useInPersonTrainingDetail, useUnlockInPersonTraining, useUpdateInPersonTraining } from "@/hooks/useTrainings";
import type { CreateInPersonTrainingDto, InPersonTraining, InPersonTrainingStatus, TrainingCategory, TrainingCertificateMode, TrainingCertificateNumberStrategy, TrainingCertificateTemplate } from "@/lib/trainings";

const statuses: Record<InPersonTrainingStatus, { label: string; color: string }> = {
  PLANNED: { label: "پیش‌نویس", color: "bg-slate-500/15 text-slate-200" },
  APPROVED: { label: "تأیید و منتشرشده", color: "bg-emerald-500/15 text-emerald-100" },
  OPEN: { label: "ثبت‌نام باز", color: "bg-cyan-500/15 text-cyan-100" },
  CLOSED: { label: "ثبت‌نام بسته", color: "bg-amber-500/15 text-amber-100" },
  IN_PROGRESS: { label: "در حال برگزاری", color: "bg-blue-500/15 text-blue-100" },
  CANCELLED: { label: "لغوشده", color: "bg-red-500/15 text-red-100" },
  COMPLETED: { label: "پایان‌یافته", color: "bg-emerald-500/15 text-emerald-100" },
  ARCHIVED: { label: "بایگانی", color: "bg-violet-500/15 text-violet-100" },
};

const initialCourse: CreateInPersonTrainingDto = {
  courseCode: "", title: "", description: "", categoryId: null, instructorName: "", organizerDepartment: "", location: "",
  startDate: "", endDate: null, hasExam: false, hasCertificate: false, status: "PLANNED", directoryUserIds: [],
  certificateMode: "NONE", certificateTemplateId: null, certificateNumberStrategy: "SEQUENTIAL", certificateNumberStart: 1,
  certificateNumberPattern: "AGTPS-{YEAR}-{COURSE}-{SEQ:5}", certificateValidationRegex: null,
  certificateRequiresCompletion: true, certificateRequiresPass: true,
  notificationReminderMinutes: [1440, 60],
};

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "ثبت نشده";
}

function isLocked(course: InPersonTraining) {
  if (!["IN_PROGRESS", "COMPLETED", "ARCHIVED"].includes(course.status) && !course.lockedAt) return false;
  return !course.unlockedAt || Boolean(course.lockedAt && new Date(course.unlockedAt) <= new Date(course.lockedAt));
}

export function TrainingCourseManager({ categories }: { categories: TrainingCategory[] }) {
  const { data: courses = [] } = useAdminInPersonTrainings();
  const { data: templates = [] } = useCertificateTemplates();
  const { data: authUser } = useAuthUser();
  const createCourse = useCreateInPersonTraining();
  const updateCourse = useUpdateInPersonTraining();
  const unlockMutation = useUnlockInPersonTraining();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InPersonTraining | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CreateInPersonTrainingDto>(initialCourse);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const { data: eligible } = useEligibleTrainingParticipants(userSearch, userPage);
  const [detailId, setDetailId] = useState("");
  const { data: detail, isLoading: detailLoading } = useInPersonTrainingDetail(detailId);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantPage, setParticipantPage] = useState(1);
  const [unlockReason, setUnlockReason] = useState("");
  const [message, setMessage] = useState("");
  const selectedIds = new Set(form.directoryUserIds || []);
  const canOverride = authUser?.permissions.includes("training.course.override") ?? false;
  const participants = useMemo(() => {
    const term = participantSearch.trim().toLocaleLowerCase("fa-IR");
    return (detail?.participants || []).filter((item) => !term || [item.displayName, item.personnelCode, item.email, item.directoryUser?.username].some((value) => value?.toLocaleLowerCase("fa-IR").includes(term)));
  }, [detail?.participants, participantSearch]);
  const visibleParticipants = participants.slice((participantPage - 1) * 10, participantPage * 10);

  function openCreate() {
    setEditing(null); setForm({ ...initialCourse, directoryUserIds: [] }); setStep(1); setMessage(""); setFormOpen(true);
  }

  function openEdit(course: InPersonTraining) {
    setEditing(course);
    setForm({
      courseCode: course.courseCode, title: course.title, description: course.description || "", categoryId: course.categoryId || null,
      instructorName: course.instructorName || "", organizerDepartment: course.organizerDepartment || "", location: course.location || "",
      startDate: course.startDate, endDate: course.endDate || null, durationHours: course.durationHours || undefined,
      hasExam: course.hasExam, hasCertificate: course.hasCertificate, status: course.status, directoryUserIds: [],
      certificateMode: course.certificateMode || "NONE", certificateTemplateId: course.certificateTemplateId || null,
      certificateNumberStrategy: course.certificateNumberStrategy || "SEQUENTIAL", certificateNumberStart: course.certificateNumberStart || 1,
      certificateNumberPattern: course.certificateNumberPattern || initialCourse.certificateNumberPattern,
      certificateValidationRegex: course.certificateValidationRegex || null,
      certificateRequiresCompletion: course.certificateRequiresCompletion, certificateRequiresPass: course.certificateRequiresPass,
      notificationReminderMinutes: course.notificationReminderMinutes || [1440, 60],
    });
    setStep(1); setMessage(""); setFormOpen(true);
  }

  async function save() {
    if (!form.courseCode.trim() || !form.title.trim() || !form.startDate) return setMessage("کد دوره، عنوان و زمان شروع دوره الزامی است.");
    try {
      if (editing) await updateCourse.mutateAsync({ id: editing.id, dto: form });
      else await createCourse.mutateAsync(form);
      setFormOpen(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "ثبت دوره انجام نشد."); }
  }

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-2xl border border-cyan-400/15 bg-slate-900/60 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="flex items-center gap-2 text-xl font-black text-white"><CalendarDays className="text-cyan-200" />مدیریت دوره‌ها</h2><p className="mt-2 text-sm text-slate-400">برای مشاهده نفرات، نتیجه آزمون، گواهی و تاریخچه روی جزئیات دوره بزنید.</p></div>
      <Button onClick={openCreate}><Plus size={17} />افزودن دوره</Button>
    </header>
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {courses.map((course) => <article key={course.id} className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5 hover:border-cyan-400/25">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-lg font-black text-white">{course.title}</h3><p className="mt-1 text-xs text-slate-500" dir="ltr">{course.courseCode}</p></div><span className={`rounded-full px-3 py-1 text-xs ${statuses[course.status].color}`}>{statuses[course.status].label}</span></div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs"><Metric icon={Users} value={course._count?.participants ?? course.participants.length} label="نفر" /><Metric icon={BookOpenCheck} value={course.exam?._count?.attempts || 0} label="پاسخ" /><Metric icon={Award} value={course.hasCertificate ? "دارد" : "ندارد"} label="گواهی" /></div>
        <p className="mt-4 text-xs text-slate-400">شروع: {formatDate(course.startDate)}</p>
        <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => { setDetailId(course.id); setParticipantPage(1); }}><Eye size={15} />جزئیات</Button><Button size="sm" variant="secondary" disabled={isLocked(course)} onClick={() => openEdit(course)}>{isLocked(course) && <LockKeyhole size={15} />}ویرایش</Button></div>
      </article>)}
      {!courses.length && <p className="col-span-full rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">هنوز دوره‌ای ثبت نشده است.</p>}
    </div>

    <Dialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "ویرایش دوره" : "افزودن دوره جدید"} className="max-w-5xl">
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">{["مشخصات", "شرکت‌کنندگان", "گواهی", "مرور نهایی"].map((label, index) => <button key={label} onClick={() => setStep(index + 1)} className={`rounded-xl border p-3 text-xs ${step === index + 1 ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-slate-800 text-slate-400"}`}>{label}</button>)}</div>
      {step === 1 && <CourseBasics form={form} setForm={setForm} categories={categories} />}
      {step === 2 && <div className="space-y-4"><div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><Input className="pr-10" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1); }} placeholder="نام، نام کاربری، ایمیل، واحد یا کد پرسنلی" /></div><div className="grid max-h-[390px] gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">{eligible?.items.map((user) => <label key={user.id} className={`flex gap-3 rounded-xl border p-3 ${selectedIds.has(user.id) ? "border-cyan-300/40 bg-cyan-400/10" : "border-slate-800"}`}><input type="checkbox" disabled={Boolean(editing)} checked={selectedIds.has(user.id)} onChange={() => { const next = new Set(form.directoryUserIds || []); next.has(user.id) ? next.delete(user.id) : next.add(user.id); setForm({ ...form, directoryUserIds: [...next] }); }} /><span className="min-w-0"><strong className="block truncate text-white">{user.displayName}</strong><small className="block truncate text-cyan-200" dir="ltr">{user.username}</small><small className="text-slate-500">کد پرسنلی: {user.personnelCode || "ثبت نشده"}</small></span></label>)}</div><Pagination page={userPage} pageSize={eligible?.pageSize || 12} totalItems={eligible?.total || 0} onPageChange={setUserPage} />{editing && <p className="rounded-xl bg-amber-400/10 p-3 text-xs text-amber-100">انتخاب همزمان نفرات فقط هنگام ایجاد دوره انجام می‌شود.</p>}</div>}
      {step === 3 && <CertificateOptions form={form} setForm={setForm} templates={templates} />}
      {step === 4 && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Summary label="کد دوره" value={form.courseCode || "ثبت نشده"} /><Summary label="عنوان" value={form.title || "ثبت نشده"} /><Summary label="شروع" value={formatDate(form.startDate)} /><Summary label="نفرات جدید" value={`${form.directoryUserIds?.length || 0} نفر`} /><Summary label="آزمون" value={form.hasExam ? "دارد" : "ندارد"} /><Summary label="گواهی" value={form.hasCertificate ? "دارد" : "ندارد"} /><Summary label="روش صدور" value={form.certificateMode || "NONE"} /></div><p className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 text-sm text-blue-100"><ShieldCheck className="ml-2 inline" size={17} />پس از شروع دوره، اطلاعات دوره و اعضا قفل می‌شوند.</p></div>}
      {message && <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-100">{message}</p>}
      <div className="mt-6 flex justify-between"><Button variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}><ChevronRight size={16} />قبلی</Button>{step < 4 ? <Button onClick={() => setStep(step + 1)}>بعدی<ChevronLeft size={16} /></Button> : <Button disabled={createCourse.isPending || updateCourse.isPending} onClick={save}>ثبت دوره</Button>}</div>
    </Dialog>

    <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId("")} title={detail?.title || "جزئیات دوره"} className="max-w-6xl">
      {detailLoading && <p className="p-8 text-center text-slate-400">در حال دریافت...</p>}
      {detail && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Summary label="وضعیت" value={statuses[detail.status].label} /><Summary label="مدرس" value={detail.instructorName || "ثبت نشده"} /><Summary label="شروع" value={formatDate(detail.startDate)} /><Summary label="نفرات" value={`${detail.participants.length} نفر`} /></div>
        {isLocked(detail) && <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4"><p className="font-bold text-amber-100"><LockKeyhole className="ml-2 inline" size={17} />دوره قفل است.</p>{canOverride && <div className="mt-3 flex gap-2"><Input value={unlockReason} onChange={(event) => setUnlockReason(event.target.value)} placeholder="دلیل بازکردن اضطراری" /><Button size="sm" disabled={unlockReason.trim().length < 5} onClick={async () => { await unlockMutation.mutateAsync({ id: detail.id, reason: unlockReason }); setUnlockReason(""); }}>بازکردن قفل</Button></div>}</div>}
        <div className="rounded-2xl border border-slate-800 p-4"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-black text-white">شرکت‌کنندگان</h3><Input className="sm:w-80" value={participantSearch} onChange={(event) => { setParticipantSearch(event.target.value); setParticipantPage(1); }} placeholder="جستجوی نام، کد پرسنلی یا نام کاربری" /></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right text-sm"><thead className="text-xs text-slate-500"><tr><th className="p-3">کاربر</th><th className="p-3">کد پرسنلی</th><th className="p-3">حضور</th><th className="p-3">آزمون</th><th className="p-3">نتیجه</th><th className="p-3">گواهی</th></tr></thead><tbody>{visibleParticipants.map((participant) => { const attempt = participant.examAttempts?.[0]; const certificate = participant.certificates?.[0]; return <tr key={participant.id} className="border-t border-slate-800"><td className="p-3"><strong className="text-white">{participant.displayName}</strong><small className="block text-slate-500" dir="ltr">{participant.directoryUser?.username || participant.email}</small></td><td className="p-3 text-cyan-100">{participant.personnelCode || "—"}</td><td className="p-3">{participant.attendanceStatus}</td><td className="p-3">{attempt ? `تلاش ${attempt.attemptNumber}` : "شروع نشده"}</td><td className="p-3">{attempt?.score != null ? `${attempt.score}٪ · ${attempt.passed ? "قبول" : "مردود"}` : participant.result}</td><td className="p-3 text-emerald-200">{certificate?.certificateNumber || "صادر نشده"}</td></tr>; })}</tbody></table></div><Pagination page={participantPage} pageSize={10} totalItems={participants.length} onPageChange={setParticipantPage} /></div>
        <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-slate-800 p-4"><h3 className="font-black text-white">آزمون و گواهی</h3><p className="mt-3 text-sm text-slate-400">آزمون: {detail.exam?.title || "ندارد"}</p><p className="mt-2 text-sm text-slate-400">پاسخ‌ها: {detail.exam?.attempts?.length || 0}</p><p className="mt-2 text-sm text-slate-400">قالب: {detail.certificateTemplate?.title || "انتخاب نشده"}</p></section><section className="rounded-xl border border-slate-800 p-4"><h3 className="font-black text-white">تاریخچه کنترلی</h3><div className="mt-3 max-h-48 space-y-2 overflow-auto">{detail.auditEvents?.map((event) => <div key={event.id} className="rounded-lg bg-slate-950/50 p-3 text-xs"><strong className="text-cyan-100">{event.action}</strong><span className="float-left text-slate-500">{formatDate(event.createdAt)}</span><p className="mt-1 text-slate-400">{event.reason || event.actor?.username || "سیستم"}</p></div>)}</div></section></div>
      </div>}
    </Dialog>
  </div>;
}

function CourseBasics({ form, setForm, categories }: { form: CreateInPersonTrainingDto; setForm: (value: CreateInPersonTrainingDto) => void; categories: TrainingCategory[] }) {
  const toggleReminder = (minutes: number) => setForm({ ...form, notificationReminderMinutes: (form.notificationReminderMinutes || []).includes(minutes) ? (form.notificationReminderMinutes || []).filter((item) => item !== minutes) : [...(form.notificationReminderMinutes || []), minutes] });
  return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><FormField label="کد دوره" required><Input dir="ltr" value={form.courseCode} onChange={(event) => setForm({ ...form, courseCode: event.target.value.toUpperCase() })} placeholder="TR-1405-001" /></FormField><FormField label="عنوان" required><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormField><FormField label="دسته"><Select value={form.categoryId || "none"} onValueChange={(value) => setForm({ ...form, categoryId: value === "none" ? null : value })} options={[{ value: "none", label: "بدون دسته" }, ...categories.map((item) => ({ value: item.id, label: item.name }))]} /></FormField><FormField label="وضعیت"><Select value={form.status || "PLANNED"} onValueChange={(value) => setForm({ ...form, status: value as InPersonTrainingStatus })} options={Object.entries(statuses).map(([value, meta]) => ({ value, label: meta.label }))} /></FormField><FormField label="مدرس"><Input value={form.instructorName || ""} onChange={(event) => setForm({ ...form, instructorName: event.target.value })} /></FormField><FormField label="واحد برگزارکننده"><Input value={form.organizerDepartment || ""} onChange={(event) => setForm({ ...form, organizerDepartment: event.target.value })} /></FormField><FormField label="محل"><Input value={form.location || ""} onChange={(event) => setForm({ ...form, location: event.target.value })} /></FormField><FormField label="شروع" required><PersianDateTimeInput value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} /></FormField><FormField label="پایان"><PersianDateTimeInput value={form.endDate || ""} onChange={(value) => setForm({ ...form, endDate: value || null })} /></FormField><FormField label="مدت / ساعت"><Input type="number" step="0.5" value={form.durationHours || ""} onChange={(event) => setForm({ ...form, durationHours: event.target.value ? Number(event.target.value) : undefined })} /></FormField></div><FormField label="توضیحات"><textarea className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField><div className="flex flex-wrap gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3"><span className="w-full text-xs font-bold text-cyan-100">یادآوری قبل از شروع دوره</span>{[[10080, "یک هفته"], [1440, "یک روز"], [60, "یک ساعت"]].map(([minutes, label]) => <label key={minutes} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs"><input type="checkbox" checked={(form.notificationReminderMinutes || []).includes(Number(minutes))} onChange={() => toggleReminder(Number(minutes))} />{label}</label>)}</div><label className="inline-flex gap-2 rounded-xl border border-slate-700 p-3 text-sm"><input type="checkbox" checked={form.hasExam} onChange={(event) => setForm({ ...form, hasExam: event.target.checked })} />آزمون دارد</label></div>;
}

function CertificateOptions({ form, setForm, templates }: { form: CreateInPersonTrainingDto; setForm: (value: CreateInPersonTrainingDto) => void; templates: TrainingCertificateTemplate[] }) {
  return <div className="space-y-5"><label className="inline-flex gap-2 rounded-xl border border-slate-700 p-3 text-sm"><input type="checkbox" checked={form.hasCertificate} onChange={(event) => setForm({ ...form, hasCertificate: event.target.checked, certificateMode: event.target.checked ? "ONLINE_AUTO" : "NONE" })} />گواهی دارد</label>{form.hasCertificate && <><div className="grid gap-4 md:grid-cols-2"><FormField label="روش صدور"><Select value={form.certificateMode || "NONE"} onValueChange={(value) => setForm({ ...form, certificateMode: value as TrainingCertificateMode })} options={[{ value: "ONLINE_AUTO", label: "آنلاین خودکار" }, { value: "ONLINE_APPROVAL", label: "آنلاین با تأیید مسئول" }, { value: "OFFLINE_UPLOAD", label: "آفلاین و آپلود دستی" }]} /></FormField><FormField label="قالب"><Select value={form.certificateTemplateId || ""} onValueChange={(value) => setForm({ ...form, certificateTemplateId: value })} options={templates.filter((item) => item?.isActive).map((item) => ({ value: item!.id, label: item!.title }))} /></FormField></div><div className="grid gap-3 sm:grid-cols-3">{templates.filter(Boolean).map((template) => <button key={template!.id} type="button" onClick={() => setForm({ ...form, certificateTemplateId: template!.id })} className={`group relative rounded-xl border p-3 text-right ${form.certificateTemplateId === template!.id ? "border-amber-300/50 bg-amber-400/10" : "border-slate-800"}`}><strong className="text-white">{template!.title}</strong><div className="mt-2 h-10 rounded bg-white bg-cover" style={template!.backgroundUrl ? { backgroundImage: `url(${template!.backgroundUrl})` } : undefined} /><div className="absolute bottom-full left-1/2 z-[80] mb-2 hidden w-72 -translate-x-1/2 rounded-xl border border-slate-600 bg-slate-950 p-3 shadow-2xl group-hover:block"><div className="aspect-[1.414] bg-white bg-cover" style={template!.backgroundUrl ? { backgroundImage: `url(${template!.backgroundUrl})` } : undefined} /></div></button>)}</div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><FormField label="روش شماره"><Select value={form.certificateNumberStrategy || "SEQUENTIAL"} onValueChange={(value) => setForm({ ...form, certificateNumberStrategy: value as TrainingCertificateNumberStrategy })} options={[{ value: "SEQUENTIAL", label: "ترتیبی عمومی" }, { value: "YEARLY_SEQUENTIAL", label: "ترتیبی سالانه" }, { value: "COURSE_SEQUENTIAL", label: "ترتیبی دوره" }, { value: "RANDOM", label: "تصادفی" }, { value: "CUSTOM_PATTERN", label: "الگوی سفارشی" }]} /></FormField><FormField label="شروع"><Input type="number" min="1" value={form.certificateNumberStart || 1} onChange={(event) => setForm({ ...form, certificateNumberStart: Number(event.target.value) })} /></FormField><FormField label="الگو"><Input dir="ltr" value={form.certificateNumberPattern || ""} onChange={(event) => setForm({ ...form, certificateNumberPattern: event.target.value })} /></FormField><FormField label="Regex دستی"><Input dir="ltr" value={form.certificateValidationRegex || ""} onChange={(event) => setForm({ ...form, certificateValidationRegex: event.target.value || null })} /></FormField></div><div className="flex flex-wrap gap-3"><label className="rounded-xl border border-slate-700 p-3 text-sm"><input className="ml-2" type="checkbox" checked={form.certificateRequiresCompletion} onChange={(event) => setForm({ ...form, certificateRequiresCompletion: event.target.checked })} />نیازمند تکمیل</label><label className="rounded-xl border border-slate-700 p-3 text-sm"><input className="ml-2" type="checkbox" checked={form.certificateRequiresPass} onChange={(event) => setForm({ ...form, certificateRequiresPass: event.target.checked })} />نیازمند قبولی</label></div></>}</div>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: number | string; label: string }) { return <div className="rounded-xl bg-slate-950/55 p-3"><Icon className="mx-auto text-cyan-200" size={17} /><strong className="mt-1 block text-base text-white">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</strong>{label}</div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4"><small className="text-slate-500">{label}</small><strong className="mt-2 block text-white">{value}</strong></div>; }
