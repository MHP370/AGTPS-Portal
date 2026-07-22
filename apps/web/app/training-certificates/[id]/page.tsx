"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TrainingCertificateCanvas } from "@/components/features/trainings/TrainingCertificateCanvas";
import { getMyTrainingCertificate } from "@/lib/trainings";

export default function TrainingCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const { data: certificate, isLoading } = useQuery({ queryKey: ["training-certificate", id], queryFn: () => getMyTrainingCertificate(id) });
  if (isLoading) return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-300">در حال دریافت گواهی...</main>;
  if (!certificate) return <main className="min-h-screen bg-slate-950 p-8 text-center text-slate-300">گواهی پیدا نشد.</main>;
  return <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8" dir="rtl"><div className="mx-auto max-w-5xl space-y-5"><div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link href="/admin/profile" className="inline-flex items-center gap-2 text-cyan-200"><ArrowRight size={17} /> بازگشت به پروفایل</Link><div className="flex gap-2">{certificate.fileUrl && <a href={certificate.fileUrl} target="_blank" rel="noreferrer"><Button variant="secondary"><Download size={17} /> فایل اصلی</Button></a>}<Button onClick={() => window.print()}><Printer size={17} /> چاپ / ذخیره PDF</Button></div></div><TrainingCertificateCanvas certificate={certificate} /><p className="print:hidden text-center text-xs text-slate-500">استعلام عمومی: /training-certificates/verify</p></div></main>;
}
