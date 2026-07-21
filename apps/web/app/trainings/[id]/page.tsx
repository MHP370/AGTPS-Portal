"use client";

import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileText,
  GraduationCap,
  ImageIcon,
  PlayCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useTrainingProgress,
  useTrainings,
  useUpsertTrainingProgress,
} from "@/hooks/useTrainings";
import type { TrainingFile, TrainingProgress } from "@/lib/trainings";

function getFileExtension(file?: Pick<TrainingFile, "fileUrl" | "fileType">) {
  const cleanUrl = file?.fileUrl.split("?")[0] ?? "";
  const extension = cleanUrl.split(".").pop()?.toLowerCase() ?? "";

  if (extension && extension !== cleanUrl) return extension;

  const type = file?.fileType?.toLowerCase().replace(/^\./, "");
  const typeMap: Record<string, string> = {
    video: "mp4",
    image: "jpg",
    pdf: "pdf",
    document: "docx",
    spreadsheet: "xlsx",
    presentation: "pptx",
    attachment: "zip",
  };

  return typeMap[type || ""] ?? type ?? "";
}

function getViewerType(file?: Pick<TrainingFile, "fileUrl" | "fileType">) {
  const extension = getFileExtension(file);

  if (["mp4", "webm", "mkv", "mov", "avi"].includes(extension)) {
    return "video";
  }

  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)) {
    return "image";
  }

  if (["pdf"].includes(extension)) {
    return "pdf";
  }

  if (["txt", "csv"].includes(extension)) {
    return "text";
  }

  if (["docx", "doc"].includes(extension)) {
    return "word";
  }

  if (["xlsx", "xls"].includes(extension)) {
    return "spreadsheet";
  }

  return "document";
}

function TrainingFileViewer({
  file,
  progress,
  onProgress,
}: {
  file?: TrainingFile;
  progress?: TrainingProgress | null;
  onProgress: (value: {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    progressPercent?: number;
    lastPositionSeconds?: number;
    durationSeconds?: number;
    lastFileUrl?: string;
  }) => void;
}) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [documentHtml, setDocumentHtml] = useState("");
  const [documentError, setDocumentError] = useState("");
  const lastVideoProgressSentAt = useRef(0);
  const lastViewedFileRef = useRef("");
  const viewerType = getViewerType(file);

  useEffect(() => {
    let cancelled = false;

    async function loadDocumentPreview() {
      setDocumentHtml("");
      setDocumentError("");

      if (!file || !["word", "spreadsheet", "text"].includes(viewerType)) {
        return;
      }

      try {
        const response = await fetch(file.fileUrl);

        if (!response.ok) {
          throw new Error("فایل قابل دریافت نیست.");
        }

        if (viewerType === "text") {
          const text = await response.text();
          if (!cancelled) {
            setDocumentHtml(
              `<pre class="whitespace-pre-wrap break-words">${text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</pre>`,
            );
          }
          return;
        }

        const arrayBuffer = await response.arrayBuffer();

        if (viewerType === "word") {
          const mammoth = await import("mammoth/mammoth.browser");
          const result = await mammoth.convertToHtml({
            arrayBuffer,
          });

          if (!cancelled) {
            setDocumentHtml(result.value);
          }
          return;
        }

        if (viewerType === "spreadsheet") {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(arrayBuffer, {
            type: "array",
          });
          const firstSheetName = workbook.SheetNames[0];
          const firstSheet = workbook.Sheets[firstSheetName];
          const html = XLSX.utils.sheet_to_html(firstSheet);

          if (!cancelled) {
            setDocumentHtml(html);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setDocumentError(
            error instanceof Error
              ? error.message
              : "پیش‌نمایش داکیومنت انجام نشد.",
          );
        }
      }
    }

    void loadDocumentPreview();

    return () => {
      cancelled = true;
    };
  }, [file, viewerType]);

  useEffect(() => {
    if (!file || viewerType === "video") return;
    if (lastViewedFileRef.current === file.fileUrl) return;

    lastViewedFileRef.current = file.fileUrl;

    onProgress({
      status: "COMPLETED",
      progressPercent: 100,
      lastFileUrl: file.fileUrl,
    });
  }, [file, onProgress, viewerType]);

  if (!file) {
    return (
      <div className="grid min-h-96 place-items-center rounded-3xl border border-dashed border-slate-700 bg-slate-900 text-slate-400">
        فایلی برای نمایش انتخاب نشده است.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-white">{file.title}</h2>
          <p className="mt-1 break-all text-xs text-slate-500">
            {file.fileType || getFileExtension(file) || "file"} · {file.fileUrl}
          </p>
        </div>
        <a
          href={`${file.fileUrl}${file.fileUrl.includes("?") ? "&" : "?"}download=1`}
          download
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white hover:bg-cyan-400"
        >
          دانلود فایل
          <Download size={17} />
        </a>
      </div>

      <div className="bg-slate-950 p-4">
        {viewerType === "video" && (
          <div className="rounded-2xl border border-white/10 bg-black p-3">
            <video
              src={file.fileUrl}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                if (
                  progress?.lastFileUrl === file.fileUrl &&
                  progress.lastPositionSeconds &&
                  progress.lastPositionSeconds < video.duration - 5
                ) {
                  video.currentTime = progress.lastPositionSeconds;
                }
              }}
              onTimeUpdate={(event) => {
                const now = Date.now();
                if (now - lastVideoProgressSentAt.current < 5000) return;

                const video = event.currentTarget;
                if (!Number.isFinite(video.duration) || video.duration <= 0) {
                  return;
                }

                const progressPercent = Math.min(
                  100,
                  Math.round((video.currentTime / video.duration) * 100),
                );
                lastVideoProgressSentAt.current = now;

                onProgress({
                  status:
                    progressPercent >= 95 ? "COMPLETED" : "IN_PROGRESS",
                  progressPercent,
                  lastPositionSeconds: Math.floor(video.currentTime),
                  durationSeconds: Math.floor(video.duration),
                  lastFileUrl: file.fileUrl,
                });
              }}
              onEnded={(event) => {
                const video = event.currentTarget;
                onProgress({
                  status: "COMPLETED",
                  progressPercent: 100,
                  lastPositionSeconds: Math.floor(video.duration || 0),
                  durationSeconds: Math.floor(video.duration || 0),
                  lastFileUrl: file.fileUrl,
                });
              }}
              className="aspect-video w-full rounded-xl bg-black"
            />
          </div>
        )}

        {viewerType === "image" && (
          <>
            <button
              type="button"
              onClick={() => {
                setZoomScale(1);
                setZoomOpen(true);
              }}
              className="grid h-[560px] w-full place-items-center overflow-hidden rounded-2xl bg-slate-900"
            >
              <img
                src={file.fileUrl}
                alt={file.title}
                className="h-full max-h-full w-full max-w-full object-contain"
              />
            </button>

            {zoomOpen && (
              <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="font-black text-white">{file.title}</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setZoomScale((value) => Math.max(0.5, value - 0.25))
                      }
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black"
                    >
                      کوچک‌تر
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setZoomScale((value) => Math.min(4, value + 0.25))
                      }
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black"
                    >
                      بزرگ‌تر
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomOpen(false)}
                      className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-black"
                    >
                      بستن
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto rounded-2xl bg-black">
                  <div className="grid min-h-full place-items-center p-6">
                    <img
                      src={file.fileUrl}
                      alt={file.title}
                      style={{
                        transform: `scale(${zoomScale})`,
                      }}
                      className="max-h-[80vh] max-w-full origin-center object-contain transition-transform"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {viewerType === "pdf" && (
          <iframe
            src={file.fileUrl}
            title={file.title}
            className="h-[72vh] w-full rounded-2xl border border-white/10 bg-white"
          />
        )}

        {["word", "spreadsheet", "text"].includes(viewerType) && (
          <div className="h-[72vh] overflow-auto rounded-2xl border border-white/10 bg-white p-6 text-slate-950">
            {documentError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {documentError}
              </div>
            ) : documentHtml ? (
              <div
                className="prose max-w-none prose-slate [&_table]:w-full [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2"
                dangerouslySetInnerHTML={{ __html: documentHtml }}
              />
            ) : (
              <div className="text-sm text-slate-500">
                در حال آماده‌سازی پیش‌نمایش...
              </div>
            )}
          </div>
        )}

        {viewerType === "document" && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-sm leading-7 text-amber-100">
            پیش‌نمایش این فرمت داخل مرورگر پشتیبانی نمی‌شود. برای PowerPoint و
            بعضی فرمت‌های خاص باید در فاز بعد تبدیل به PDF یا viewer سازمانی
            اضافه شود. دانلود فایل از دکمه بالا امکان‌پذیر است.
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrainingDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: trainings = [] } = useTrainings();
  const { data: progress } = useTrainingProgress(params.id);
  const { mutate: mutateProgress } = useUpsertTrainingProgress(params.id);
  const training = trainings.find((item) => item.id === params.id);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const saveProgress = useCallback(
    (value: Parameters<typeof mutateProgress>[0]) => {
      mutateProgress(value);
    },
    [mutateProgress],
  );

  if (!training) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-black">آموزش پیدا نشد</h1>
          <Link
            href="/trainings"
            className="mt-5 inline-flex rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-white"
          >
            بازگشت به کتابخانه آموزش
          </Link>
        </div>
      </main>
    );
  }

  const primaryFile =
    training.files.find((file) => file.isPrimary) ?? training.files[0];
  const selectedFile =
    training.files.find((file) => file.fileUrl === selectedFileUrl) ??
    primaryFile;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/trainings"
            className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.08]"
          >
            بازگشت به کتابخانه
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.08]"
          >
            بازگشت به پرتال
            <ArrowRight size={16} />
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
          <div
            className="relative min-h-72 bg-slate-800 bg-cover bg-center"
            style={{
              backgroundImage: training.thumbnail
                ? `url(${training.thumbnail})`
                : undefined,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            <div className="relative z-10 flex min-h-72 flex-col justify-end p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  {training.category?.name || "آموزش"}
                </span>
                {training.isRequired && (
                  <span className="rounded-full bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-100">
                    اجباری
                  </span>
                )}
              </div>
              <h1 className="max-w-4xl text-3xl font-black md:text-4xl">
                {training.title}
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-300">
                {training.description || "محتوای آموزشی سازمانی"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-white">وضعیت پیشرفت شما</h2>
              <p className="mt-1 text-xs text-slate-400">
                {progress?.status === "COMPLETED"
                  ? "این آموزش تکمیل شده است."
                  : progress?.status === "IN_PROGRESS"
                    ? "در حال مشاهده آموزش هستید."
                    : "هنوز این آموزش را شروع نکرده‌اید."}
              </p>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100">
              {progress?.progressPercent ?? 0}٪
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{
                width: `${progress?.progressPercent ?? 0}%`,
              }}
            />
          </div>
          {progress?.lastPositionSeconds &&
            progress.lastPositionSeconds > 0 && (
              <p className="mt-3 text-xs text-slate-400">
                ادامه از حدود دقیقه{" "}
                {Math.floor(progress.lastPositionSeconds / 60).toLocaleString(
                  "fa-IR",
                )}
              </p>
            )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <TrainingFileViewer
              file={selectedFile}
              progress={progress}
              onProgress={saveProgress}
            />
          </section>

          <aside className="space-y-4">
          <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900 p-5">
            <h2 className="text-xl font-black">فایل‌های آموزش</h2>

            {primaryFile && (
              <button
                type="button"
                onClick={() => setSelectedFileUrl(primaryFile.fileUrl)}
                className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-5 hover:bg-cyan-400/15"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100">
                    {training.contentType === "VIDEO" ? (
                      <PlayCircle size={25} />
                    ) : (
                      <FileText size={25} />
                    )}
                  </span>
                  <div>
                    <h3 className="font-black">{primaryFile.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">فایل اصلی</p>
                  </div>
                </div>
                <PlayCircle size={20} className="text-cyan-200" />
              </button>
            )}

            <div className="space-y-3">
              {training.files.map((file) => (
                <button
                  key={`${file.fileUrl}-${file.title}`}
                  type="button"
                  onClick={() => setSelectedFileUrl(file.fileUrl)}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08]"
                >
                  <div className="text-right">
                    <h3 className="font-bold">{file.title}</h3>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {file.fileType || "file"} · {file.fileUrl}
                    </p>
                  </div>
                  {getViewerType(file) === "image" ? (
                    <ImageIcon size={18} className="shrink-0 text-cyan-200" />
                  ) : getViewerType(file) === "video" ? (
                    <PlayCircle size={18} className="shrink-0 text-cyan-200" />
                  ) : (
                    <FileText size={18} className="shrink-0 text-cyan-200" />
                  )}
                </button>
              ))}
            </div>

            {training.externalUrl && (
              <a
                href={training.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black hover:bg-white/[0.08]"
              >
                مشاهده لینک خارجی
              </a>
            )}
          </section>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900 p-5">
            <div className="grid size-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <GraduationCap size={28} />
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <div>مدرس: {training.instructor || "ثبت نشده"}</div>
              <div>دپارتمان: {training.department || "ثبت نشده"}</div>
              <div>سطح: {training.level || "ثبت نشده"}</div>
              <div>
                مدت زمان:{" "}
                {training.durationMinutes
                  ? `${training.durationMinutes} دقیقه`
                  : "ثبت نشده"}
              </div>
              <div>تعداد فایل: {training.files.length}</div>
            </div>
            {training.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {training.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
