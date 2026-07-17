"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  Database,
  Download,
  HardDrive,
  Mail,
  Play,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  useBackups,
  useBackupRestoreJobs,
  useBackupSettings,
  useCreateBackup,
  useDeleteBackup,
  useRestoreBackup,
  useUpdateBackupSettings,
} from "@/hooks/useBackups";
import {
  downloadBackup,
  type BackupJob,
  type BackupRestoreStatus,
  type BackupScheduleFrequency,
  type BackupStatus,
  type BackupType,
} from "@/lib/backups";

const typeLabels: Record<BackupType, string> = {
  DATABASE: "دیتابیس",
  FILES: "فایل‌ها",
  FULL: "کامل",
};

const frequencyLabels: Record<BackupScheduleFrequency, string> = {
  HOURLY: "ساعتی",
  DAILY: "روزانه",
  WEEKLY: "هفتگی",
  MONTHLY: "ماهانه",
};

const weekDayLabels = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const statusLabels: Record<BackupStatus, string> = {
  PENDING: "در انتظار",
  RUNNING: "در حال اجرا",
  SUCCESS: "موفق",
  FAILED: "ناموفق",
  DELETED: "حذف شده",
};

const statusClasses: Record<BackupStatus, string> = {
  PENDING: "bg-amber-400/10 text-amber-200",
  RUNNING: "bg-cyan-400/10 text-cyan-200",
  SUCCESS: "bg-emerald-400/10 text-emerald-200",
  FAILED: "bg-rose-400/10 text-rose-200",
  DELETED: "bg-slate-700 text-slate-300",
};

const restoreStatusLabels: Record<BackupRestoreStatus, string> = {
  PENDING: "در انتظار",
  RUNNING: "در حال اجرا",
  SUCCESS: "موفق",
  FAILED: "ناموفق",
};

const restoreStatusClasses: Record<BackupRestoreStatus, string> = {
  PENDING: "bg-amber-400/10 text-amber-200",
  RUNNING: "bg-cyan-400/10 text-cyan-200",
  SUCCESS: "bg-emerald-400/10 text-emerald-200",
  FAILED: "bg-rose-400/10 text-rose-200",
};

function formatSize(value?: string | number | null) {
  if (!value) return "-";
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function BackupsPage() {
  const { data: backups = [] } = useBackups();
  const { data: restoreJobs = [] } = useBackupRestoreJobs();
  const { data: settings } = useBackupSettings();
  const createBackup = useCreateBackup();
  const deleteBackupMutation = useDeleteBackup();
  const restoreBackup = useRestoreBackup();
  const updateSettings = useUpdateBackupSettings();
  const [includeDatabase, setIncludeDatabase] = useState(true);
  const [includeUploads, setIncludeUploads] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<BackupJob | null>(null);
  const [restoreDraft, setRestoreDraft] = useState({
    restoreDatabase: true,
    restoreUploads: true,
    confirmation: "",
  });
  const [settingsDraft, setSettingsDraft] = useState({
    autoEnabled: false,
    frequency: "DAILY" as BackupScheduleFrequency,
    scheduleTime: "02:00",
    weeklyDayOfWeek: "6",
    monthlyDayOfMonth: "1",
    type: "FULL" as BackupType,
    includeDatabase: true,
    includeUploads: true,
    retentionCount: "10",
    notifyEmails: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!settings) return;

    const timer = window.setTimeout(() => {
      setSettingsDraft({
        autoEnabled: settings.autoEnabled,
        frequency: settings.frequency,
        scheduleTime: settings.scheduleTime,
        weeklyDayOfWeek: String(settings.weeklyDayOfWeek),
        monthlyDayOfMonth: String(settings.monthlyDayOfMonth),
        type: settings.type,
        includeDatabase: settings.includeDatabase,
        includeUploads: settings.includeUploads,
        retentionCount: String(settings.retentionCount),
        notifyEmails: settings.notifyEmails ?? "",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [settings]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    const type: BackupType =
      includeDatabase && includeUploads
        ? "FULL"
        : includeDatabase
          ? "DATABASE"
          : "FILES";

    const result = await createBackup.mutateAsync({
      type,
      includeDatabase,
      includeUploads,
      notifyEmail: notifyEmail.trim() || undefined,
    });

    setMessage(
      result.status === "SUCCESS"
        ? "بکاپ با موفقیت ساخته شد."
        : `بکاپ ناموفق بود: ${result.error || "خطای نامشخص"}`,
    );
  }

  async function handleDownload(backup: BackupJob) {
    setMessage("");
    const result = await downloadBackup(backup.id);
    downloadBlob(result.blob, result.filename);
  }

  function openRestoreDialog(backup: BackupJob) {
    setRestoreTarget(backup);
    setRestoreDraft({
      restoreDatabase: backup.includeDatabase,
      restoreUploads: backup.includeUploads,
      confirmation: "",
    });
    setRestoreDialogOpen(true);
  }

  async function submitRestore(event: React.FormEvent) {
    event.preventDefault();
    if (!restoreTarget) return;
    setMessage("");

    const result = await restoreBackup.mutateAsync({
      id: restoreTarget.id,
      dto: restoreDraft,
    });

    setRestoreDialogOpen(false);
    setMessage(
      result.status === "SUCCESS"
        ? "بازگردانی با موفقیت انجام شد."
        : `بازگردانی ناموفق بود: ${result.error || "خطای نامشخص"}`,
    );
  }

  async function saveAutoSettings(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const saved = await updateSettings.mutateAsync({
      autoEnabled: settingsDraft.autoEnabled,
      frequency: settingsDraft.frequency,
      scheduleTime: settingsDraft.scheduleTime,
      weeklyDayOfWeek: Number(settingsDraft.weeklyDayOfWeek || 6),
      monthlyDayOfMonth: Number(settingsDraft.monthlyDayOfMonth || 1),
      type: settingsDraft.type,
      includeDatabase: settingsDraft.includeDatabase,
      includeUploads: settingsDraft.includeUploads,
      retentionCount: Number(settingsDraft.retentionCount || 10),
      notifyEmails: settingsDraft.notifyEmails,
    });
    setMessage(
      saved.autoEnabled
        ? "بکاپ خودکار فعال شد."
        : "تنظیمات بکاپ خودکار ذخیره شد.",
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-cyan-200">Backup Center</p>
        <h1 className="mt-2 text-3xl font-black">مرکز بکاپ</h1>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          بکاپ دیتابیس و فایل‌های مهم خارج از public ذخیره می‌شود و دانلود فقط
          از مسیر امن API انجام می‌شود.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:grid-cols-[1fr_auto]"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-white/[0.03] p-4 text-sm">
            <span className="flex items-center gap-2 font-bold">
              <Database size={18} />
              دیتابیس
            </span>
            <input
              type="checkbox"
              checked={includeDatabase}
              onChange={(event) => setIncludeDatabase(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-white/[0.03] p-4 text-sm">
            <span className="flex items-center gap-2 font-bold">
              <HardDrive size={18} />
              uploads
            </span>
            <input
              type="checkbox"
              checked={includeUploads}
              onChange={(event) => setIncludeUploads(event.target.checked)}
            />
          </label>
          <label className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4 text-sm">
            <span className="mb-2 flex items-center gap-2 font-bold">
              <Mail size={18} />
              ایمیل نتیجه
            </span>
            <Input
              value={notifyEmail}
              onChange={(event) => setNotifyEmail(event.target.value)}
              placeholder="admin@company.local"
              dir="ltr"
            />
          </label>
        </div>

        <Button
          type="submit"
          disabled={
            createBackup.isPending || (!includeDatabase && !includeUploads)
          }
          className="h-full gap-2"
        >
          <Play size={18} />
          گرفتن بکاپ دستی
        </Button>
      </form>

      <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
        برای اجرای بکاپ دیتابیس، ابزار <span dir="ltr">pg_dump</span> باید روی
        سرور API نصب باشد. برای بازگردانی دیتابیس هم ابزار{" "}
        <span dir="ltr">psql</span> لازم است. در Dockerfile پروژه این ابزارها
        اضافه شده‌اند.
      </div>

      <form
        onSubmit={saveAutoSettings}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">بکاپ خودکار</h2>
            <p className="mt-1 text-sm text-slate-400">
              API هر دقیقه زمان‌بندی را بررسی می‌کند و در ساعت تعیین‌شده بکاپ
              را اجرا می‌کند.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-white/[0.03] px-4 py-3 text-sm">
            <span>فعال باشد</span>
            <input
              type="checkbox"
              checked={settingsDraft.autoEnabled}
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  autoEnabled: event.target.checked,
                }))
              }
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="font-bold">تناوب اجرا</span>
            <select
              value={settingsDraft.frequency}
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  frequency: event.target.value as BackupScheduleFrequency,
                }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            >
              {Object.entries(frequencyLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-bold">
              {settingsDraft.frequency === "HOURLY"
                ? "دقیقه اجرا"
                : "ساعت اجرا"}
            </span>
            <Input
              type="time"
              value={settingsDraft.scheduleTime}
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  scheduleTime: event.target.value,
                }))
              }
            />
            {settingsDraft.frequency === "HOURLY" && (
              <span className="block text-xs leading-6 text-slate-400">
                در حالت ساعتی، دقیقه این فیلد استفاده می‌شود.
              </span>
            )}
          </label>
          {settingsDraft.frequency === "WEEKLY" && (
            <label className="space-y-2 text-sm">
              <span className="font-bold">روز هفته</span>
              <select
                value={settingsDraft.weeklyDayOfWeek}
                onChange={(event) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    weeklyDayOfWeek: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
              >
                {weekDayLabels.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {settingsDraft.frequency === "MONTHLY" && (
            <label className="space-y-2 text-sm">
              <span className="font-bold">روز ماه</span>
              <Input
                type="number"
                min={1}
                max={31}
                value={settingsDraft.monthlyDayOfMonth}
                onChange={(event) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    monthlyDayOfMonth: event.target.value,
                  }))
                }
              />
            </label>
          )}
          <label className="space-y-2 text-sm">
            <span className="font-bold">نوع بکاپ</span>
            <select
              value={settingsDraft.type}
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  type: event.target.value as BackupType,
                }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            >
              {Object.entries(typeLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-bold">تعداد نگهداری</span>
            <Input
              type="number"
              min={1}
              value={settingsDraft.retentionCount}
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  retentionCount: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-bold">اجرای بعدی</span>
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-300">
              {settings?.nextRunAt
                ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(settings.nextRunAt))
                : "-"}
            </div>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
            <span>دیتابیس در بکاپ خودکار باشد</span>
            <input
              type="checkbox"
              checked={settingsDraft.includeDatabase}
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  includeDatabase: event.target.checked,
                }))
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
            <span>uploads در بکاپ خودکار باشد</span>
            <input
              type="checkbox"
              checked={settingsDraft.includeUploads}
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  includeUploads: event.target.checked,
                }))
              }
            />
          </label>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-bold">ایمیل‌های دریافت نتیجه</span>
          <textarea
            value={settingsDraft.notifyEmails}
            onChange={(event) =>
              setSettingsDraft((draft) => ({
                ...draft,
                notifyEmails: event.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            placeholder="admin@company.local, it@company.local"
            dir="ltr"
          />
        </label>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending}>
            ذخیره تنظیمات خودکار
          </Button>
        </div>
      </form>

      <DataTable
        data={backups}
        columns={[
          {
            key: "fileName",
            title: "بکاپ",
            render: (backup) => (
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-100">
                  <Archive size={22} />
                </span>
                <div>
                  <div className="font-black">
                    {backup.fileName || `Backup ${backup.id.slice(0, 8)}`}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {typeLabels[backup.type]} · {formatSize(backup.fileSize)}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            title: "وضعیت",
            render: (backup) => (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  statusClasses[backup.status]
                }`}
              >
                {statusLabels[backup.status]}
              </span>
            ),
          },
          {
            key: "parts",
            title: "محتوا",
            render: (backup) =>
              [
                backup.includeDatabase ? "دیتابیس" : null,
                backup.includeUploads ? "uploads" : null,
              ]
                .filter(Boolean)
                .join(" + "),
          },
          {
            key: "createdAt",
            title: "زمان",
            render: (backup) =>
              new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(backup.createdAt)),
          },
          {
            key: "error",
            title: "خطا",
            render: (backup) => (
              <span className="line-clamp-2 text-xs text-rose-200">
                {backup.error || "-"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (backup) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={backup.status !== "SUCCESS" || !backup.fileName}
                  onClick={() => void handleDownload(backup)}
                  className="gap-1"
                >
                  <Download size={15} />
                  دانلود
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={backup.status !== "SUCCESS" || !backup.fileName}
                  onClick={() => openRestoreDialog(backup)}
                  className="gap-1"
                >
                  <RotateCcw size={15} />
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteBackupMutation.isPending}
                  onClick={() => deleteBackupMutation.mutate(backup.id)}
                  className="gap-1"
                >
                  <Trash2 size={15} />
                  حذف
                </Button>
              </div>
            ),
          },
        ]}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black">تاریخچه Restore</h2>
          <p className="mt-1 text-sm text-slate-400">
            قبل از هر Restore، یک بکاپ اضطراری کامل ساخته می‌شود.
          </p>
        </div>
        <DataTable
          data={restoreJobs}
          columns={[
            {
              key: "backup",
              title: "بکاپ مبدا",
              render: (job) =>
                job.backup?.fileName || `Backup ${job.backupId.slice(0, 8)}`,
            },
            {
              key: "status",
              title: "وضعیت",
              render: (job) => (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    restoreStatusClasses[job.status]
                  }`}
                >
                  {restoreStatusLabels[job.status]}
                </span>
              ),
            },
            {
              key: "parts",
              title: "بخش‌ها",
              render: (job) =>
                [
                  job.restoreDatabase ? "دیتابیس" : null,
                  job.restoreUploads ? "uploads" : null,
                ]
                  .filter(Boolean)
                  .join(" + "),
            },
            {
              key: "emergencyBackupId",
              title: "بکاپ اضطراری",
              render: (job) =>
                job.emergencyBackupId
                  ? job.emergencyBackupId.slice(0, 8)
                  : "-",
            },
            {
              key: "createdAt",
              title: "زمان",
              render: (job) =>
                new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(job.createdAt)),
            },
            {
              key: "error",
              title: "خطا",
              render: (job) => (
                <span className="line-clamp-2 text-xs text-rose-200">
                  {job.error || "-"}
                </span>
              ),
            },
          ]}
        />
      </section>

      <Dialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="بازگردانی بکاپ"
        className="max-w-2xl"
      >
        <form onSubmit={submitRestore} className="space-y-4">
          <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm leading-7 text-rose-100">
            <div className="mb-2 flex items-center gap-2 font-black">
              <ShieldAlert size={18} />
              عملیات حساس
            </div>
            Restore می‌تواند دیتابیس و فایل‌های فعلی را با محتوای بکاپ جایگزین
            کند. قبل از اجرا، سیستم یک بکاپ اضطراری کامل می‌گیرد.
          </div>

          <div className="rounded-2xl border border-slate-800 bg-white/[0.03] p-4 text-sm">
            <div className="font-black">
              {restoreTarget?.fileName || "-"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {restoreTarget
                ? `${typeLabels[restoreTarget.type]} · ${formatSize(
                    restoreTarget.fileSize,
                  )}`
                : "-"}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
              <span>دیتابیس بازگردانی شود</span>
              <input
                type="checkbox"
                checked={restoreDraft.restoreDatabase}
                disabled={!restoreTarget?.includeDatabase}
                onChange={(event) =>
                  setRestoreDraft((draft) => ({
                    ...draft,
                    restoreDatabase: event.target.checked,
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
              <span>uploads بازگردانی شود</span>
              <input
                type="checkbox"
                checked={restoreDraft.restoreUploads}
                disabled={!restoreTarget?.includeUploads}
                onChange={(event) =>
                  setRestoreDraft((draft) => ({
                    ...draft,
                    restoreUploads: event.target.checked,
                  }))
                }
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-bold">
              برای تایید عبارت RESTORE را وارد کنید
            </span>
            <Input
              value={restoreDraft.confirmation}
              onChange={(event) =>
                setRestoreDraft((draft) => ({
                  ...draft,
                  confirmation: event.target.value,
                }))
              }
              placeholder="RESTORE"
              dir="ltr"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRestoreDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={
                restoreBackup.isPending ||
                restoreDraft.confirmation !== "RESTORE" ||
                (!restoreDraft.restoreDatabase && !restoreDraft.restoreUploads)
              }
            >
              شروع Restore
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
