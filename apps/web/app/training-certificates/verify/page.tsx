"use client";

import { useState } from "react";
import { BadgeCheck, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { verifyTrainingCertificate } from "@/lib/trainings";

type Result = Awaited<ReturnType<typeof verifyTrainingCertificate>>;
export default function VerifyCertificatePage() {
  const [number, setNumber] = useState(""); const [result, setResult] = useState<Result | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!number.trim()) return; setLoading(true); setError(""); setResult(null); try { setResult(await verifyTrainingCertificate(number.trim())); } catch { setError("گواهی با این شماره یافت نشد یا معتبر نیست."); } finally { setLoading(false); } }
  return <main className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white" dir="rtl"><div className="w-full max-w-xl rounded-3xl border border-cyan-300/20 bg-slate-900/80 p-6 shadow-2xl"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200"><ShieldCheck /></span><div><h1 className="text-xl font-black">استعلام گواهی آموزش</h1><p className="mt-1 text-xs text-slate-400">شماره گواهی را دقیق وارد کنید.</p></div></div><form onSubmit={submit} className="mt-6 flex gap-2"><Input dir="ltr" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="AGTPS-0000001" /><Button disabled={loading}><Search size={17} />استعلام</Button></form>{error && <p className="mt-4 rounded-xl bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}{result && <section className="mt-5 space-y-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-5"><h2 className="flex items-center gap-2 font-black text-emerald-200"><BadgeCheck />گواهی معتبر است</h2><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">دارنده</dt><dd className="mt-1 font-bold">{result.participantName}</dd></div><div><dt className="text-slate-500">شماره گواهی</dt><dd className="mt-1 font-bold" dir="ltr">{result.certificateNumber}</dd></div><div><dt className="text-slate-500">دوره</dt><dd className="mt-1 font-bold">{result.courseTitle}</dd></div><div><dt className="text-slate-500">کد دوره</dt><dd className="mt-1 font-bold" dir="ltr">{result.courseCode}</dd></div><div><dt className="text-slate-500">تاریخ صدور</dt><dd className="mt-1">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(result.issuedAt))}</dd></div></dl></section>}</div></main>;
}
