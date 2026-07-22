"use client";

import { CalendarDays, Clock3, Hash, MapPin } from "lucide-react";
import type { MyTrainingCertificate } from "@/lib/trainings";

type Position = { x: number; y: number; width: number; fontSize: number; align: "right" | "center" | "left"; icon?: string };
type PositionKey = "logo" | "organization" | "heading" | "body" | "location" | "issueDate" | "duration" | "certificateNumber" | "signatures" | "footer";
const defaults: Record<PositionKey, Position> = { logo: { x: 45, y: 5, width: 10, fontSize: 12, align: "center" }, organization: { x: 25, y: 15, width: 50, fontSize: 14, align: "center" }, heading: { x: 20, y: 23, width: 60, fontSize: 30, align: "center" }, body: { x: 15, y: 38, width: 70, fontSize: 18, align: "center" }, location: { x: 8, y: 68, width: 22, fontSize: 12, align: "right", icon: "map-pin" }, issueDate: { x: 8, y: 76, width: 22, fontSize: 12, align: "right", icon: "calendar" }, duration: { x: 39, y: 76, width: 22, fontSize: 12, align: "center", icon: "clock" }, certificateNumber: { x: 70, y: 76, width: 24, fontSize: 12, align: "left", icon: "hash" }, signatures: { x: 30, y: 62, width: 40, fontSize: 12, align: "center" }, footer: { x: 20, y: 90, width: 60, fontSize: 10, align: "center" } };
const icons = { "map-pin": MapPin, calendar: CalendarDays, clock: Clock3, hash: Hash };
const faDate = (value?: string | Date | null) => value ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(value)) : "—";

export function TrainingCertificateCanvas({ certificate }: { certificate: MyTrainingCertificate }) {
  const layout = certificate.snapshot?.template?.layout ?? certificate.template?.layout ?? {};
  const savedPositions = (layout.positions || {}) as Partial<Record<PositionKey, Position>>;
  const positions = { ...defaults, ...savedPositions };
  const training = certificate.snapshot?.training;
  const participantName = certificate.snapshot?.participant?.displayName || certificate.participant.displayName;
  const personnelCode = certificate.snapshot?.participant?.personnelCode;
  const score = certificate.snapshot?.result?.score;
  const values: Record<string, string> = { FULL_NAME: participantName, PERSONNEL_CODE: personnelCode || "—", COURSE_TITLE: training?.title || certificate.participant.training.title, COURSE_CODE: training?.courseCode || certificate.participant.training.courseCode || "—", SCORE: score == null ? "—" : String(score), DURATION: training?.durationHours == null ? "—" : `${training.durationHours} ساعت`, LOCATION: training?.location || "—", START_DATE: faDate(training?.startDate), END_DATE: faDate(training?.endDate), ISSUE_DATE: faDate(certificate.issuedAt), CERTIFICATE_NUMBER: certificate.certificateNumber, ORGANIZER_DEPARTMENT: training?.organizerDepartment || "—" };
  const replace = (text: string) => Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), text);
  const styleFor = (key: PositionKey): React.CSSProperties => ({ position: "absolute", zIndex: 10, right: `${positions[key].x}%`, top: `${positions[key].y}%`, width: `${positions[key].width}%`, fontSize: `clamp(7px, ${positions[key].fontSize / 60}vw, ${positions[key].fontSize}px)`, textAlign: positions[key].align });
  const Meta = ({ itemKey, text }: { itemKey: PositionKey; text: string }) => { const Icon = positions[itemKey].icon ? icons[positions[itemKey].icon as keyof typeof icons] : undefined; return <div style={styleFor(itemKey)} className="flex items-center gap-1" dir="rtl">{Icon ? <Icon className="shrink-0" size="1.1em" /> : null}<span>{text}</span></div>; };
  const backgroundUrl = certificate.snapshot?.template?.backgroundUrl || certificate.template?.backgroundUrl;
  const orientation = layout.orientation === "portrait" ? "portrait" : "landscape";
  const pageWidth = orientation === "portrait" ? "210mm" : "297mm";
  const pageHeight = orientation === "portrait" ? "297mm" : "210mm";
  return <><style>{`@page { size: A4 ${orientation}; margin: 0; } @media print { html, body { width: ${pageWidth} !important; height: ${pageHeight} !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: white !important; } body * { visibility: hidden !important; } .training-certificate-a4, .training-certificate-a4 * { visibility: visible !important; } .training-certificate-a4 { position: fixed !important; inset: 0 auto auto 0 !important; width: ${pageWidth} !important; height: ${pageHeight} !important; max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; transform: none !important; break-inside: avoid !important; page-break-inside: avoid !important; } }`}</style><section className="training-certificate-a4 relative isolate overflow-hidden rounded-2xl bg-transparent text-slate-900 shadow-2xl [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:rounded-none print:shadow-none" style={{ aspectRatio: orientation === "portrait" ? "210 / 297" : "297 / 210" }}>
    {backgroundUrl ? <img src={backgroundUrl} alt="پس‌زمینه گواهی" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill [print-color-adjust:exact] [-webkit-print-color-adjust:exact]" /> : null}
    {layout.logoUrl ? <img src={String(layout.logoUrl)} alt="لوگوی سازمان" className="absolute z-10 object-contain" style={{ ...styleFor("logo"), height: "12%" }} /> : null}
    <p style={{ ...styleFor("organization"), color: String(layout.primaryColor || "#0e7490") }} className="font-bold">{String(layout.organizationName || "AGTPS PORTAL")}</p>
    <h1 style={{ ...styleFor("heading"), color: String(layout.primaryColor || "#0e7490") }} className="font-black leading-tight">{String(layout.heading || "گواهی پایان دوره")}</h1>
    <p style={styleFor("body")} className="leading-relaxed">{replace(String(layout.bodyText || "گواهی می‌شود آقای/خانم {FULL_NAME} دوره {COURSE_TITLE} را با موفقیت به پایان رسانده است."))}</p>
    <Meta itemKey="location" text={`محل برگزاری: ${values.LOCATION}`} /><Meta itemKey="issueDate" text={`تاریخ صدور: ${values.ISSUE_DATE}`} />
    {Boolean(layout.showDuration ?? true) && <Meta itemKey="duration" text={`مدت دوره: ${values.DURATION}`} />}
    {Boolean(layout.showCertificateNumber ?? true) && <Meta itemKey="certificateNumber" text={`شماره گواهی: ${certificate.certificateNumber}`} />}
    <div style={styleFor("signatures")} className="flex justify-center gap-4">{certificate.snapshot?.signatories?.map((signatory) => <div key={`${signatory.fullName}-${signatory.jobTitle}`} className="text-center">{signatory.signatureUrl ? <img src={signatory.signatureUrl} alt={`امضای ${signatory.fullName}`} className="mx-auto h-10 max-w-28 object-contain" /> : null}<strong className="block text-[0.9em]">{signatory.fullName}</strong><span className="block text-[0.75em]">{signatory.jobTitle}</span>{signatory.stampUrl ? <img src={signatory.stampUrl} alt="مهر" className="mx-auto h-8 object-contain" /> : null}</div>)}</div>
    {layout.footerText ? <p style={styleFor("footer")}>{replace(String(layout.footerText))}</p> : null}
  </section></>;
}
