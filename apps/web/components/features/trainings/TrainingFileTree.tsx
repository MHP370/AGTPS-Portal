"use client";

import {
  ChevronDown,
  ChevronLeft,
  Download,
  File,
  FileAudio,
  FileText,
  Folder,
  FolderOpen,
  ImageIcon,
  Play,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAdminTrainingTree } from "@/hooks/useTrainings";
import type { TrainingFile, TrainingTreeNode } from "@/lib/trainings";

function extensionOf(file?: TrainingFile) {
  const sourceExtension = file?.sourcePath
    ?.split(".")
    .pop()
    ?.toLowerCase()
    .replace(/^\./, "");
  if (sourceExtension) return sourceExtension;

  const declaredType = file?.fileType?.toLowerCase().replace(/^\./, "");
  if (declaredType) return declaredType;

  const cleanUrl = file?.fileUrl.split("?")[0] || "";
  const filename = cleanUrl.split("/").pop() || "";
  return filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase() || ""
    : "";
}

function FileIcon({ file }: { file?: TrainingFile }) {
  const extension = extensionOf(file);
  if (["mp4", "mkv", "webm", "mov", "avi"].includes(extension)) return <Play size={17} />;
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(extension)) return <FileAudio size={17} />;
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)) return <ImageIcon size={17} />;
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(extension)) return <FileText size={17} />;
  return <File size={17} />;
}

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  onSelect,
  selectedId,
}: {
  node: TrainingTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: TrainingTreeNode) => void;
  selectedId?: string;
}) {
  const open = expanded.has(node.id);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onSelect(node);
          if (node.type === "folder") onToggle(node.id);
        }}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition ${
          selectedId === node.id
            ? "bg-cyan-400/15 text-cyan-100"
            : "text-slate-200 hover:bg-white/[0.06]"
        }`}
        style={{ paddingInlineStart: `${12 + depth * 20}px` }}
      >
        {node.type === "folder" ? (
          <>
            {open ? <ChevronDown size={15} /> : <ChevronLeft size={15} />}
            {open ? <FolderOpen size={18} /> : <Folder size={18} />}
          </>
        ) : (
          <span className="ms-[23px]"><FileIcon file={node.file} /></span>
        )}
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {node.type === "folder" && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
            {node.children.length.toLocaleString("fa-IR")}
          </span>
        )}
      </button>
      {node.type === "folder" && open && node.children.map((child) => (
        <TreeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}

function FilePreview({ file }: { file: TrainingFile }) {
  const extension = extensionOf(file);
  const url = file.fileUrl;
  const downloadUrl = `${url}${url.includes("?") ? "&" : "?"}download=1`;
  const officePreviewUrl = url.replace("/content?", "/preview?");

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        {["mp4", "mkv", "webm", "mov", "avi"].includes(extension) ? (
          <video src={url} controls playsInline className="aspect-video w-full" />
        ) : ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(extension) ? (
          <div className="p-6"><audio src={url} controls className="w-full" /></div>
        ) : ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension) ? (
          <img src={url} alt={file.title} className="max-h-[55vh] w-full object-contain" />
        ) : extension === "pdf" ? (
          <iframe src={url} title={file.title} className="h-[55vh] w-full bg-white" />
        ) : ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension) && url.includes("/content?") ? (
          <iframe src={officePreviewUrl} title={file.title} className="h-[55vh] w-full bg-white" />
        ) : ["txt", "csv", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension) ? (
          <div className="p-5 text-sm leading-7 text-slate-300">پیش‌نمایش سروری برای فایل‌های SMB فعال است؛ این فایل را می‌توانید دانلود کنید.</div>
        ) : (
          <div className="p-5 text-sm text-slate-400">برای این نوع فایل پیش‌نمایش مستقیم وجود ندارد.</div>
        )}
      </div>
      <a href={downloadUrl} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white">
        <Download size={16} /> دانلود فایل
      </a>
    </div>
  );
}

export function TrainingFileTree({
  trainingId,
  standaloneSubfolders,
  onStandaloneSubfoldersChange,
}: {
  trainingId: string;
  standaloneSubfolders: string[];
  onStandaloneSubfoldersChange: (paths: string[]) => void;
}) {
  const { data, isLoading, isError } = useAdminTrainingTree(trainingId);
  const [selected, setSelected] = useState<TrainingTreeNode>();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    setExpanded(new Set([data.root.id]));
    setSelected(data.root);
  }, [data]);

  const allFolderIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (node: TrainingTreeNode) => {
      if (node.type === "folder") ids.push(node.id);
      node.children.forEach(walk);
    };
    if (data) walk(data.root);
    return ids;
  }, [data]);

  if (isLoading) return <div className="rounded-2xl border border-slate-800 p-5 text-sm text-slate-400">در حال ساخت درخت فایل‌ها...</div>;
  if (isError || !data) return <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-100">درخت فایل‌های این آموزش دریافت نشد.</div>;

  const selectedPromotionPath = selected?.promotionPath;
  const isStandalone = Boolean(selectedPromotionPath && standaloneSubfolders.includes(selectedPromotionPath));
  return (
    <section className="space-y-4 rounded-2xl border border-cyan-400/15 bg-slate-950/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-white">ساختار فایل‌های منبع</h3>
          <p className="mt-1 text-xs text-slate-400">{data.sourceName || "منبع SMB"} · مسیر واقعی شبکه</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setExpanded(new Set(allFolderIds))} className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-bold">باز کردن همه</button>
          <button type="button" onClick={() => setExpanded(new Set([data.root.id]))} className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-bold">بستن همه</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
        <div className="max-h-[620px] overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-2" dir="rtl">
          <TreeRow node={data.root} depth={0} expanded={expanded} onToggle={(id) => setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} onSelect={setSelected} selectedId={selected?.id} />
        </div>

        <div className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          {selected && (
            <>
              <div>
                <div className="text-lg font-black text-white">{selected.name}</div>
                <dl className="mt-3 space-y-3 text-xs">
                  <div><dt className="text-slate-500">مسیر نسبی</dt><dd className="mt-1 break-all rounded-lg bg-slate-950 p-2 text-slate-200" dir="ltr">{selected.relativePath}</dd></div>
                  <div><dt className="text-slate-500">مسیر کامل شبکه</dt><dd className="mt-1 break-all rounded-lg bg-slate-950 p-2 text-cyan-100" dir="ltr">{selected.fullPath}</dd></div>
                </dl>
              </div>
              {selected.type === "folder" && selectedPromotionPath && (
                <button
                  type="button"
                  onClick={() => onStandaloneSubfoldersChange(isStandalone ? standaloneSubfolders.filter((path) => path !== selectedPromotionPath) : [...standaloneSubfolders, selectedPromotionPath])}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-black ${isStandalone ? "bg-amber-400/15 text-amber-100" : "bg-cyan-500 text-white"}`}
                >
                  {isStandalone ? "لغو آموزش مستقل برای این پوشه" : "این پوشه یک آموزش مستقل باشد"}
                </button>
              )}
              {selected.type === "file" && selected.file && <FilePreview file={selected.file} />}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
