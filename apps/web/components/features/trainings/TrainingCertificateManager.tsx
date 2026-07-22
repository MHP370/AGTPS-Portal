"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, BadgeCheck, ExternalLink, FileCheck2, Image as ImageIcon, Palette, PenTool, Plus, Save, Search, Stamp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  useCertificateSignatories, useCertificateTemplates, useCreateCertificateSignatory,
  useCreateCertificateTemplate, useGenerateCourseCertificates, useIssueTrainingCertificate, useUpdateCertificateTemplate,
} from "@/hooks/useTrainings";
import { verifyTrainingCertificate, type InPersonTraining, type TrainingCertificateTemplate } from "@/lib/trainings";

type CertificateTab = "templates" | "signatories" | "issue" | "verify";
type PositionKey = "logo" | "organization" | "heading" | "body" | "location" | "issueDate" | "duration" | "certificateNumber" | "signatures" | "footer";
type PositionValue = { x: number; y: number; width: number; fontSize: number; align: "right" | "center" | "left"; icon?: string };
type LayoutForm = { primaryColor: string; accentColor: string; logoUrl: string; organizationName: string; heading: string; bodyText: string; footerText: string; orientation: "landscape" | "portrait"; showScore: boolean; showPersonnelCode: boolean; showDuration: boolean; showCertificateNumber: boolean; positions: Record<PositionKey, PositionValue> };

const emptyLayout: LayoutForm = { primaryColor: "#0e7490", accentColor: "#d4af37", logoUrl: "", organizationName: "شرکت مخازن سبز پتروشیمی عسلویه", heading: "گواهی پایان دوره", bodyText: "گواهی می‌شود آقای/خانم {FULL_NAME} دوره {COURSE_TITLE} را با موفقیت به پایان رسانده است.", footerText: "این گواهی به صورت الکترونیکی صادر شده است.", orientation: "landscape", showScore: true, showPersonnelCode: true, showDuration: true, showCertificateNumber: true, positions: { logo: { x: 45, y: 5, width: 10, fontSize: 12, align: "center" }, organization: { x: 25, y: 15, width: 50, fontSize: 14, align: "center" }, heading: { x: 20, y: 23, width: 60, fontSize: 30, align: "center" }, body: { x: 15, y: 38, width: 70, fontSize: 18, align: "center" }, location: { x: 8, y: 68, width: 22, fontSize: 12, align: "right", icon: "map-pin" }, issueDate: { x: 8, y: 76, width: 22, fontSize: 12, align: "right", icon: "calendar" }, duration: { x: 39, y: 76, width: 22, fontSize: 12, align: "center", icon: "clock" }, certificateNumber: { x: 70, y: 76, width: 24, fontSize: 12, align: "left", icon: "hash" }, signatures: { x: 30, y: 62, width: 40, fontSize: 12, align: "center" }, footer: { x: 20, y: 90, width: 60, fontSize: 10, align: "center" } } };

export function TrainingCertificateManager({ courses }: { courses: InPersonTraining[] }) {
  const { data: templates = [] } = useCertificateTemplates();
  const { data: signatories = [] } = useCertificateSignatories();
  const createTemplate = useCreateCertificateTemplate();
  const updateTemplate = useUpdateCertificateTemplate();
  const createSignatory = useCreateCertificateSignatory();
  const issue = useIssueTrainingCertificate();
  const generate = useGenerateCourseCertificates();
  const [tab, setTab] = useState<CertificateTab>("templates");
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [layout, setLayout] = useState<LayoutForm>(emptyLayout);
  const [selectedSignatoryIds, setSelectedSignatoryIds] = useState<string[]>([]);
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [stampUrl, setStampUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateFile, setCertificateFile] = useState("");
  const [message, setMessage] = useState("");
  const [verifyNumber, setVerifyNumber] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyResult, setVerifyResult] = useState<Awaited<ReturnType<typeof verifyTrainingCertificate>> | null>(null);
  const selectedCourse = useMemo(() => courses.find((item) => item.id === courseId), [courseId, courses]);
  const editingTemplate = templates.find((item) => item.id === editingTemplateId);

  useEffect(() => {
    if (!editingTemplate) return;
    const saved = editingTemplate.layout as Partial<LayoutForm>;
    setTitle(editingTemplate.title); setDescription(editingTemplate.description || ""); setBackgroundUrl(editingTemplate.backgroundUrl || "");
    setLayout({ ...emptyLayout, ...saved, positions: { ...emptyLayout.positions, ...(saved.positions || {}) } }); setSelectedSignatoryIds(editingTemplate.signatories?.map((item) => item.signatoryId) || []);
  }, [editingTemplate]);

  function resetTemplate() { setEditingTemplateId(""); setTitle(""); setDescription(""); setBackgroundUrl(""); setLayout(emptyLayout); setSelectedSignatoryIds([]); }

  async function saveTemplate(event: React.FormEvent) {
    event.preventDefault(); if (!title.trim()) return;
    const dto: Omit<TrainingCertificateTemplate, "id"> = { title: title.trim(), description: description.trim(), backgroundUrl, layout, isDefault: false, isActive: true, signatories: selectedSignatoryIds.map((signatoryId, index) => ({ signatoryId, sortOrder: index, position: { slot: index + 1 }, signatory: signatories.find((item) => item.id === signatoryId)! })) };
    if (editingTemplateId) await updateTemplate.mutateAsync({ id: editingTemplateId, dto }); else await createTemplate.mutateAsync(dto);
    setMessage(editingTemplateId ? "قالب ویرایش شد." : "قالب جدید ایجاد شد."); resetTemplate();
  }

  async function addSignatory(event: React.FormEvent) {
    event.preventDefault(); if (!signatoryName.trim() || !signatoryTitle.trim()) return;
    await createSignatory.mutateAsync({ fullName: signatoryName.trim(), jobTitle: signatoryTitle.trim(), signatureUrl, stampUrl, isActive: true, validFrom: null, validUntil: null, sortOrder: signatories.length });
    setSignatoryName(""); setSignatoryTitle(""); setSignatureUrl(""); setStampUrl(""); setMessage("امضاکننده ذخیره شد.");
  }

  async function issueManual(event: React.FormEvent) {
    event.preventDefault(); if (!participantId || !certificateNumber.trim()) return;
    try {
      await issue.mutateAsync({ participantId, templateId: templateId || undefined, certificateNumber: certificateNumber.trim(), title: selectedCourse?.title, fileUrl: certificateFile || undefined, mimeType: certificateFile.toLowerCase().endsWith(".pdf") ? "application/pdf" : certificateFile ? "image/*" : undefined });
      setMessage("گواهی دستی ثبت شد."); setCertificateNumber(""); setCertificateFile("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "شماره گواهی تکراری است یا ثبت گواهی انجام نشد."); }
  }

  async function verifyInsideAdmin(event: React.FormEvent) {
    event.preventDefault();
    if (!verifyNumber.trim()) return;
    setVerifyLoading(true); setVerifyError(""); setVerifyResult(null);
    try { setVerifyResult(await verifyTrainingCertificate(verifyNumber.trim())); }
    catch { setVerifyError("گواهی با این شماره یافت نشد یا معتبر نیست."); }
    finally { setVerifyLoading(false); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">{([{ id: "templates", label: "طراحی قالب", icon: Palette }, { id: "signatories", label: "امضاکنندگان", icon: PenTool }, { id: "issue", label: "صدور و آپلود", icon: Award }, { id: "verify", label: "استعلام گواهی", icon: BadgeCheck }] as const).map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${tab === item.id ? "bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-300/25" : "text-slate-400 hover:bg-slate-800"}`}><item.icon size={17} />{item.label}</button>)}</div>
    {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p>}

    {tab === "templates" && <div className="grid gap-6 2xl:grid-cols-[1fr_1.2fr]">
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-white">قالب‌های گواهی</h2><p className="mt-1 text-xs text-slate-400">قالب‌های استفاده‌شده حذف نمی‌شوند و برای حفظ گواهی‌های قبلی غیرفعال خواهند شد.</p></div><Button size="sm" onClick={resetTemplate}><Plus size={16} /> قالب جدید</Button></div><div className="grid gap-3 sm:grid-cols-2">{templates.map((template) => <button type="button" key={template.id} onClick={() => setEditingTemplateId(template.id)} className={`rounded-xl border p-3 text-right ${editingTemplateId === template.id ? "border-cyan-300/40 bg-cyan-400/10" : "border-slate-800 bg-slate-950/40"}`}><div className="aspect-[1.414] rounded-lg bg-white bg-cover bg-center" style={template.backgroundUrl ? { backgroundImage: `url(${template.backgroundUrl})` } : undefined}><div className="flex h-full items-center justify-center text-center text-slate-700"><div><strong className="text-sm">{String(template.layout.heading || "گواهی پایان دوره")}</strong><p className="mt-2 text-[10px]">نام شرکت‌کننده</p></div></div></div><p className="mt-3 font-bold text-white">{template.title}</p><p className="mt-1 text-[11px] text-slate-500">{template._count?.certificates || 0} گواهی · {template._count?.trainings || 0} دوره</p></button>)}</div></section>
      <form onSubmit={saveTemplate} className="space-y-5 rounded-2xl border border-cyan-400/15 bg-slate-900/60 p-5"><h2 className="flex items-center gap-2 text-xl font-black text-white"><Palette className="text-cyan-200" />{editingTemplateId ? "ویرایش قالب" : "طراحی قالب جدید"}</h2><div className="grid gap-4 sm:grid-cols-2"><FormField label="نام قالب" required><Input value={title} onChange={(e) => setTitle(e.target.value)} /></FormField><FormField label="توضیحات"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></FormField></div><div className="grid gap-4 md:grid-cols-2"><FormField label="پس‌زمینه"><FileUploadField folder="training" accept="image/*" value={backgroundUrl} onChange={setBackgroundUrl} /><p className="mt-2 text-xs leading-6 text-slate-400">ابعاد A4 افقی: ۳۵۰۸×۲۴۸۰ پیکسل؛ عمودی: ۲۴۸۰×۳۵۰۸ پیکسل با کیفیت 300DPI.</p></FormField><FormField label="لوگوی سازمان"><FileUploadField folder="training" accept="image/*" value={layout.logoUrl} onChange={(value) => setLayout({ ...layout, logoUrl: value })} /></FormField></div><div className="grid gap-4 sm:grid-cols-2"><FormField label="نام سازمان"><Input value={layout.organizationName} onChange={(e) => setLayout({ ...layout, organizationName: e.target.value })} /></FormField><FormField label="عنوان اصلی"><Input value={layout.heading} onChange={(e) => setLayout({ ...layout, heading: e.target.value })} /></FormField></div><FormField label="متن گواهی"><textarea className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm" value={layout.bodyText} onChange={(e) => setLayout({ ...layout, bodyText: e.target.value })} /><p className="mt-2 text-xs text-slate-500" dir="ltr">Variables: {'{FULL_NAME}'} {'{PERSONNEL_CODE}'} {'{COURSE_TITLE}'} {'{SCORE}'} {'{DURATION}'} {'{CERTIFICATE_NUMBER}'} {'{ISSUE_DATE}'}</p></FormField><FormField label="متن پایین گواهی"><Input value={layout.footerText} onChange={(e) => setLayout({ ...layout, footerText: e.target.value })} /></FormField><div className="grid gap-4 sm:grid-cols-3"><FormField label="رنگ اصلی"><Input type="color" value={layout.primaryColor} onChange={(e) => setLayout({ ...layout, primaryColor: e.target.value })} /></FormField><FormField label="رنگ تأکیدی"><Input type="color" value={layout.accentColor} onChange={(e) => setLayout({ ...layout, accentColor: e.target.value })} /></FormField><FormField label="جهت"><Select value={layout.orientation} onValueChange={(value) => setLayout({ ...layout, orientation: value as "landscape" | "portrait" })} options={[{ value: "landscape", label: "افقی" }, { value: "portrait", label: "عمودی" }]} /></FormField></div><CertificatePositionEditor layout={layout} setLayout={setLayout} backgroundUrl={backgroundUrl} /><div><p className="mb-2 text-sm font-bold text-white">امضاکنندگان قالب</p><div className="grid gap-2 sm:grid-cols-2">{signatories.filter((item) => item.isActive).map((item) => <label key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-800 p-3 text-sm"><input type="checkbox" checked={selectedSignatoryIds.includes(item.id)} onChange={() => setSelectedSignatoryIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /><span><strong className="block text-white">{item.fullName}</strong><small className="text-slate-500">{item.jobTitle}</small></span></label>)}</div></div><div className="flex flex-wrap gap-3">{([['showPersonnelCode','کد پرسنلی'],['showScore','نمره'],['showDuration','مدت دوره'],['showCertificateNumber','شماره گواهی']] as const).map(([key, label]) => <label key={key} className="rounded-xl border border-slate-800 p-3 text-sm"><input className="ml-2" type="checkbox" checked={layout[key]} onChange={(e) => setLayout({ ...layout, [key]: e.target.checked })} />{label}</label>)}</div><Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}><Save size={17} /> ذخیره قالب</Button></form>
    </div>}

    {tab === "signatories" && <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="flex items-center gap-2 text-xl font-black text-white"><PenTool className="text-cyan-200" /> فهرست امضاکنندگان</h2><div className="mt-5 space-y-3">{signatories.map((item) => <article key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="flex h-16 w-24 items-center justify-center rounded-lg bg-white p-2">{item.signatureUrl ? <img src={item.signatureUrl} alt={`امضای ${item.fullName}`} className="max-h-full max-w-full object-contain" /> : <PenTool className="text-slate-400" />}</div><div className="min-w-0 flex-1"><strong className="text-white">{item.fullName}</strong><p className="mt-1 text-xs text-slate-500">{item.jobTitle}</p></div>{item.stampUrl && <Stamp className="text-amber-200" />}</article>)}</div></section><form onSubmit={addSignatory} className="space-y-4 rounded-2xl border border-cyan-400/15 bg-slate-900/60 p-5"><h2 className="text-xl font-black text-white">ثبت امضاکننده</h2><div className="grid gap-4 sm:grid-cols-2"><FormField label="نام و نام خانوادگی" required><Input value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} /></FormField><FormField label="سمت سازمانی" required><Input value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} placeholder="مدیرعامل یا مدیر منابع انسانی" /></FormField></div><FormField label="تصویر امضا"><FileUploadField folder="training" accept="image/*" value={signatureUrl} onChange={setSignatureUrl} /></FormField><FormField label="تصویر مهر (اختیاری)"><FileUploadField folder="training" accept="image/*" value={stampUrl} onChange={setStampUrl} /></FormField><Button type="submit" disabled={createSignatory.isPending}><Plus size={17} /> ثبت امضاکننده</Button></form></div>}

    {tab === "issue" && <div className="grid gap-6 xl:grid-cols-2"><section className="space-y-4 rounded-2xl border border-emerald-400/15 bg-slate-900/60 p-5"><h2 className="flex items-center gap-2 text-xl font-black text-white"><FileCheck2 className="text-emerald-200" /> صدور گروهی آنلاین</h2><p className="text-sm leading-7 text-slate-400">برای دوره‌های «آنلاین با تأیید مسئول»، گواهی افراد واجد شرایط را یکجا صادر کنید. دوره‌های خودکار پس از قبولی آزمون صادر می‌شوند.</p><FormField label="دوره"><Select value={courseId} onValueChange={(value) => { setCourseId(value); setParticipantId(""); }} options={courses.filter((item) => item.hasCertificate).map((item) => ({ value: item.id, label: item.title }))} placeholder="دوره را انتخاب کنید" /></FormField><Button disabled={!courseId || generate.isPending} onClick={async () => { const result = await generate.mutateAsync({ id: courseId }); setMessage(`${result.issued.toLocaleString("fa-IR")} گواهی صادر و ${result.skipped.toLocaleString("fa-IR")} مورد رد شد.`); }}>صدور برای افراد واجد شرایط</Button></section><form onSubmit={issueManual} className="space-y-4 rounded-2xl border border-amber-400/15 bg-slate-900/60 p-5"><h2 className="flex items-center gap-2 text-xl font-black text-white"><ImageIcon className="text-amber-200" /> ثبت گواهی دستی</h2><FormField label="دوره"><Select value={courseId} onValueChange={(value) => { setCourseId(value); setParticipantId(""); }} options={courses.filter((item) => item.hasCertificate).map((item) => ({ value: item.id, label: item.title }))} /></FormField><FormField label="شرکت‌کننده"><Select value={participantId} onValueChange={setParticipantId} options={(selectedCourse?.participants || []).map((item) => ({ value: item.id, label: `${item.displayName} · ${item.personnelCode || "بدون کد"}` }))} /></FormField><FormField label="قالب"><Select value={templateId} onValueChange={setTemplateId} options={templates.filter((item) => item.isActive).map((item) => ({ value: item.id, label: item.title }))} /></FormField><FormField label="شماره گواهی" required><Input value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)} /></FormField><FormField label="PDF یا تصویر گواهی"><FileUploadField folder="training" accept="image/*,.pdf,application/pdf" value={certificateFile} onChange={setCertificateFile} /></FormField><Button type="submit" disabled={!participantId || issue.isPending}>ثبت گواهی دستی</Button></form></div>}
    {tab === "verify" && <section className="mx-auto max-w-3xl rounded-2xl border border-cyan-300/20 bg-slate-900/60 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-xl font-black text-white"><BadgeCheck className="text-cyan-200" />استعلام گواهی آموزش</h2><p className="mt-2 text-sm text-slate-400">شماره گواهی را وارد کنید تا اعتبار و مشخصات آن بررسی شود.</p></div><a href="/training-certificates/verify" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-200"><ExternalLink size={15} />صفحه استعلام عمومی</a></div><form onSubmit={verifyInsideAdmin} className="mt-5 flex flex-col gap-2 sm:flex-row"><Input dir="ltr" value={verifyNumber} onChange={(event) => setVerifyNumber(event.target.value)} placeholder="AGTPS-0000001" /><Button disabled={verifyLoading || !verifyNumber.trim()}><Search size={17} />{verifyLoading ? "در حال بررسی" : "استعلام"}</Button></form>{verifyError && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{verifyError}</p>}{verifyResult && <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-5"><h3 className="flex items-center gap-2 font-black text-emerald-200"><BadgeCheck />گواهی معتبر است</h3><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">دارنده گواهی</dt><dd className="mt-1 font-bold text-white">{verifyResult.participantName}</dd></div><div><dt className="text-slate-500">شماره گواهی</dt><dd className="mt-1 font-bold text-white" dir="ltr">{verifyResult.certificateNumber}</dd></div><div><dt className="text-slate-500">عنوان دوره</dt><dd className="mt-1 font-bold text-white">{verifyResult.courseTitle}</dd></div><div><dt className="text-slate-500">کد دوره</dt><dd className="mt-1 font-bold text-white" dir="ltr">{verifyResult.courseCode}</dd></div><div><dt className="text-slate-500">تاریخ صدور</dt><dd className="mt-1 text-slate-200">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(verifyResult.issuedAt))}</dd></div></dl></div>}</section>}
  </div>;
}


const certificateItems: Array<{ key: PositionKey; label: string; variable: string; sample: string; icons?: boolean }> = [
  { key: "logo", label: "لوگوی سازمان", variable: "{LOGO}", sample: "لوگو" },
  { key: "organization", label: "نام سازمان", variable: "{ORGANIZATION_NAME}", sample: "نام سازمان" },
  { key: "heading", label: "عنوان گواهی", variable: "{CERTIFICATE_TITLE}", sample: "گواهی پایان دوره" },
  { key: "body", label: "متن اصلی", variable: "{BODY_TEXT}", sample: "متن گواهی و نام شرکت‌کننده" },
  { key: "location", label: "محل برگزاری", variable: "{LOCATION}", sample: "محل برگزاری", icons: true },
  { key: "issueDate", label: "تاریخ صدور", variable: "{ISSUE_DATE}", sample: "تاریخ صدور", icons: true },
  { key: "duration", label: "مدت دوره", variable: "{DURATION}", sample: "مدت دوره", icons: true },
  { key: "certificateNumber", label: "شماره گواهی", variable: "{CERTIFICATE_NUMBER}", sample: "شماره گواهی", icons: true },
  { key: "signatures", label: "امضاها و مهر", variable: "{SIGNATORIES}", sample: "امضاها" },
  { key: "footer", label: "متن پایین", variable: "{FOOTER_TEXT}", sample: "متن پایین گواهی" },
];

function CertificatePositionEditor({ layout, setLayout, backgroundUrl }: { layout: LayoutForm; setLayout: (value: LayoutForm) => void; backgroundUrl: string }) {
  const [selected, setSelected] = useState<PositionKey>("heading");
  const current = layout.positions[selected];
  const update = (patch: Partial<PositionValue>) => setLayout({ ...layout, positions: { ...layout.positions, [selected]: { ...current, ...patch } } });
  return <section className="space-y-4 rounded-2xl border border-cyan-300/20 bg-slate-950/40 p-4">
    <div><h3 className="font-black text-white">جای‌گذاری آیتم‌های گواهی</h3><p className="mt-1 text-xs leading-6 text-slate-400">آیتم را از پیش‌نمایش یا فهرست انتخاب کنید و موقعیت آن را با درصد تنظیم کنید؛ مختصات روی همه اندازه‌ها ثابت می‌ماند.</p></div>
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-transparent bg-center" style={{ aspectRatio: layout.orientation === "portrait" ? "210 / 297" : "297 / 210", ...(backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "100% 100%" } : {}) }}>
        {certificateItems.map((item) => { const position = layout.positions[item.key]; return <button key={item.key} type="button" onClick={() => setSelected(item.key)} className={`absolute overflow-hidden border border-dashed px-1 text-center transition ${selected === item.key ? "border-cyan-300 bg-cyan-400/15 text-cyan-950 ring-2 ring-cyan-300/30" : "border-slate-500/60 bg-white/10 text-slate-800"}`} style={{ right: `${position.x}%`, top: `${position.y}%`, width: `${position.width}%`, fontSize: `${Math.max(7, position.fontSize / 2.2)}px`, textAlign: position.align }}>{item.sample}</button>; })}
      </div>
      <div className="space-y-3"><div className="grid max-h-48 grid-cols-2 gap-2 overflow-auto">{certificateItems.map((item) => <button type="button" key={item.key} onClick={() => setSelected(item.key)} className={`rounded-lg border p-2 text-right text-xs ${selected === item.key ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100" : "border-slate-800 text-slate-400"}`}><strong className="block">{item.label}</strong><span dir="ltr" className="mt-1 block text-[10px] text-slate-500">{item.variable}</span></button>)}</div>
        <div className="grid grid-cols-2 gap-3"><FormField label="فاصله از راست ٪"><Input type="number" min={0} max={95} value={current.x} onChange={(e) => update({ x: Number(e.target.value) })} /></FormField><FormField label="فاصله از بالا ٪"><Input type="number" min={0} max={95} value={current.y} onChange={(e) => update({ y: Number(e.target.value) })} /></FormField><FormField label="عرض ٪"><Input type="number" min={5} max={100} value={current.width} onChange={(e) => update({ width: Number(e.target.value) })} /></FormField><FormField label="اندازه متن"><Input type="number" min={8} max={72} value={current.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} /></FormField></div>
        <FormField label="تراز"><Select value={current.align} onValueChange={(value) => update({ align: value as PositionValue["align"] })} options={[{ value: "right", label: "راست" }, { value: "center", label: "وسط" }, { value: "left", label: "چپ" }]} /></FormField>
        {certificateItems.find((item) => item.key === selected)?.icons && <FormField label="آیکن آیتم"><Select value={current.icon || "none"} onValueChange={(value) => update({ icon: value === "none" ? undefined : value })} options={[{ value: "none", label: "بدون آیکن" }, { value: "map-pin", label: "مکان" }, { value: "calendar", label: "تقویم" }, { value: "clock", label: "ساعت" }, { value: "hash", label: "شماره" }]} /></FormField>}
      </div>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{[
      ["نام و نام خانوادگی", "{FULL_NAME}"], ["کد پرسنلی", "{PERSONNEL_CODE}"], ["عنوان دوره", "{COURSE_TITLE}"], ["کد دوره", "{COURSE_CODE}"], ["نمره", "{SCORE}"], ["مدت دوره", "{DURATION}"], ["محل برگزاری", "{LOCATION}"], ["تاریخ شروع", "{START_DATE}"], ["تاریخ پایان", "{END_DATE}"], ["تاریخ صدور", "{ISSUE_DATE}"], ["شماره گواهی", "{CERTIFICATE_NUMBER}"], ["واحد برگزارکننده", "{ORGANIZER_DEPARTMENT}"],
    ].map(([label, variable]) => <button key={variable} type="button" title="برای کپی کلیک کنید" onClick={() => navigator.clipboard?.writeText(variable)} className="rounded-lg border border-slate-800 p-2 text-right text-xs"><span className="text-slate-300">{label}</span><code className="float-left text-cyan-200" dir="ltr">{variable}</code></button>)}</div>
  </section>;
}
