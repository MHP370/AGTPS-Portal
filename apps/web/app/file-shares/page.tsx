"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  useFileShareItems,
  useFileShares,
} from "@/hooks/useFileShares";
import {
  fetchFileShareFile,
  type FileShareItem,
} from "@/lib/file-shares";

function formatSize(size: number | null) {
  if (size == null) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileKind(item?: FileShareItem | null) {
  const extension = item?.extension ?? "";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(extension)) {
    return "image";
  }
  if ([".mp4", ".webm"].includes(extension)) return "video";
  if (extension === ".pdf") return "pdf";
  if ([".txt", ".csv", ".json"].includes(extension)) return "text";
  return "document";
}

export default function FileSharesPage() {
  const {
    data: shares = [],
    isLoading: sharesLoading,
    error: sharesError,
  } = useFileShares();
  const [selectedShareId, setSelectedShareId] = useState<string>("");
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileShareItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [search, setSearch] = useState("");
  const selectedShare = shares.find((share) => share.id === selectedShareId);
  const { data, isLoading: itemsLoading, error: itemsError } = useFileShareItems(
    selectedShareId,
    currentPath,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedShareId && shares.length > 0) {
        setSelectedShareId(shares[0].id);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedShareId, shares]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPath("");
      setSelectedFile(null);
      setSearch("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedShareId]);

  useEffect(() => {
    let objectUrl = "";

    async function loadPreview() {
      setPreviewUrl("");
      setPreviewError("");
      if (!selectedShareId || !selectedFile) return;

      try {
        const blob = await fetchFileShareFile(
          selectedShareId,
          selectedFile.path,
          "inline",
        );
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (error) {
        setPreviewError(
          error instanceof Error ? error.message : "نمایش فایل انجام نشد.",
        );
      }
    }

    void loadPreview();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, selectedShareId]);

  const parentPath = useMemo(() => {
    if (!currentPath) return "";
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    return parts.join("/");
  }, [currentPath]);
  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split("/").filter(Boolean);

    return [
      {
        label: selectedShare?.title ?? "ریشه",
        path: "",
      },
      ...parts.map((part, index) => ({
        label: part,
        path: parts.slice(0, index + 1).join("/"),
      })),
    ];
  }, [currentPath, selectedShare?.title]);
  const visibleItems = useMemo(() => {
    const items = data?.items ?? [];
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [item.name, item.extension ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [data?.items, search]);

  async function downloadSelectedFile() {
    if (!selectedFile || !selectedShareId) return;
    const blob = await fetchFileShareFile(
      selectedShareId,
      selectedFile.path,
      "download",
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = selectedFile.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 p-4 lg:p-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-cyan-300/15 bg-slate-900/80 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-cyan-50"
            >
              <ArrowRight size={18} />
              بازگشت به پرتال
            </Link>
            <h1 className="mt-4 text-3xl font-black">فایل شیر سازمانی</h1>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              فولدرهای مجاز شما بر اساس کاربر و گروه سازمانی نمایش داده می‌شود.
            </p>
          </div>
          <FolderOpen className="text-cyan-200" size={42} />
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[280px_1fr_420px]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="mb-4 text-lg font-black">Shareها</h2>
            {sharesLoading ? (
              <p className="text-sm text-slate-400">در حال بارگذاری...</p>
            ) : sharesError ? (
              <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm leading-7 text-red-200">
                {sharesError.message}
              </p>
            ) : shares.length === 0 ? (
              <p className="text-sm leading-7 text-slate-400">
                برای دسترسی به فایل‌شیر باید با حساب Active Directory وارد شوید.
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <button
                    key={share.id}
                    type="button"
                    onClick={() => setSelectedShareId(share.id)}
                    className={`w-full rounded-2xl border p-3 text-right transition ${
                      share.id === selectedShareId
                        ? "border-cyan-300/50 bg-cyan-400/15"
                        : "border-slate-800 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="block font-black">{share.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {share.description ?? share.key}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  {selectedShare?.title ?? "فایل‌ها"}
                </h2>
                <p className="mt-1 text-xs text-slate-500" dir="ltr">
                  /{currentPath}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جستجو در همین فولدر..."
                  className="h-10 min-w-52 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500"
                />
                {currentPath && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCurrentPath(parentPath);
                      setSelectedFile(null);
                    }}
                  >
                    پوشه قبلی
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <button
                  key={`${crumb.path}-${index}`}
                  type="button"
                  onClick={() => {
                    setCurrentPath(crumb.path);
                    setSelectedFile(null);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                    index === breadcrumbs.length - 1
                      ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
                      : "border-slate-800 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {crumb.label}
                </button>
              ))}
            </div>

            {itemsLoading ? (
              <p className="text-sm text-slate-400">در حال خواندن فولدر...</p>
            ) : itemsError ? (
              <p className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm leading-7 text-red-200">
                {itemsError.message}
              </p>
            ) : (
              <div className="grid gap-2">
                {visibleItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      if (item.type === "folder") {
                        setCurrentPath(item.path);
                        setSelectedFile(null);
                        setSearch("");
                        return;
                      }
                      setSelectedFile(item);
                    }}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-right transition ${
                      selectedFile?.path === item.path
                        ? "border-cyan-300/50 bg-cyan-400/15"
                        : "border-slate-800 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {item.type === "folder" ? (
                        <Folder className="shrink-0 text-cyan-200" size={22} />
                      ) : fileKind(item) === "image" ? (
                        <ImageIcon className="shrink-0 text-emerald-200" size={22} />
                      ) : fileKind(item) === "video" ? (
                        <PlayCircle className="shrink-0 text-amber-200" size={22} />
                      ) : (
                        <FileText className="shrink-0 text-slate-300" size={22} />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {formatSize(item.size)}
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">نمایش فایل</h2>
              {selectedFile && data?.share.access?.canDownload && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void downloadSelectedFile()}
                  className="gap-2"
                >
                  <Download size={16} />
                  دانلود
                </Button>
              )}
            </div>

            {!selectedFile ? (
              <p className="text-sm leading-7 text-slate-400">
                یک فایل را انتخاب کنید تا پیش‌نمایش آن اینجا نمایش داده شود.
              </p>
            ) : previewError ? (
              <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
                {previewError}
              </p>
            ) : !previewUrl ? (
              <p className="text-sm text-slate-400">در حال آماده‌سازی...</p>
            ) : fileKind(selectedFile) === "image" ? (
              <img
                src={previewUrl}
                alt={selectedFile.name}
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
            ) : fileKind(selectedFile) === "video" ? (
              <video
                src={previewUrl}
                controls
                className="w-full rounded-2xl"
              />
            ) : fileKind(selectedFile) === "pdf" ? (
              <iframe
                src={previewUrl}
                title={selectedFile.name}
                className="h-[70vh] w-full rounded-2xl border border-slate-800"
              />
            ) : fileKind(selectedFile) === "text" ? (
              <iframe
                src={previewUrl}
                title={selectedFile.name}
                className="h-[70vh] w-full rounded-2xl border border-slate-800 bg-white"
              />
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm leading-7 text-slate-300">
                پیش‌نمایش مستقیم این نوع فایل وابسته به مرورگر است. برای فایل‌های
                Word/Excel/PowerPoint از دکمه دانلود استفاده کنید تا با نرم‌افزار
                سیستم باز شود. در فاز بعد می‌توانیم Office Online یا OnlyOffice
                را به عنوان editor/viewer تحت وب وصل کنیم.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
