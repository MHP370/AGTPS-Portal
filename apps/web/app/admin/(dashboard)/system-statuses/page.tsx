"use client";

import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { IconPicker } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/Input";
import {
  useAdminSystemStatuses,
  useCheckSystemStatus,
  useCreateSystemStatus,
  useDeleteSystemStatus,
  useUpdateSystemStatus,
} from "@/hooks/useSystemStatuses";
import { isUploadedIcon, portalIconMap } from "@/lib/icon-options";
import type {
  SystemHealthCheckType,
  SystemHealthState,
  SystemStatusItem,
} from "@/lib/system-statuses";

const checkTypeOptions: Array<{
  value: SystemHealthCheckType;
  label: string;
  description: string;
}> = [
  {
    value: "MANUAL",
    label: "دستی",
    description: "وضعیت توسط ادمین وارد می‌شود.",
  },
  {
    value: "HTTP",
    label: "وب / HTTP",
    description: "برای وب‌سرورها، سامانه‌های داخلی و PowerBI.",
  },
  {
    value: "TCP",
    label: "TCP Port",
    description: "برای VPN، میل‌سرور، دیتابیس یا هر سرویس پورت‌دار.",
  },
  {
    value: "PING",
    label: "Ping",
    description: "برای بررسی در دسترس بودن host با ICMP.",
  },
  {
    value: "SMB",
    label: "فایل شیر SMB",
    description: "برای فایل‌سرور داخلی، پورت پیش‌فرض 445.",
  },
];

const healthStateLabels: Record<SystemHealthState, string> = {
  UNKNOWN: "نامشخص",
  UP: "سالم",
  DEGRADED: "اختلال",
  DOWN: "قطع",
};

const healthStateClassNames: Record<SystemHealthState, string> = {
  UNKNOWN: "bg-slate-700/50 text-slate-200",
  UP: "bg-emerald-500/15 text-emerald-200",
  DEGRADED: "bg-amber-500/15 text-amber-200",
  DOWN: "bg-red-500/15 text-red-200",
};

type SystemStatusTab = "systems" | "healthChecks";

const systemStatusTabs: Array<{
  id: SystemStatusTab;
  label: string;
  description: string;
}> = [
  {
    id: "systems",
    label: "لیست سامانه‌ها",
    description: "مشاهده، ویرایش، حذف و بررسی لحظه‌ای",
  },
  {
    id: "healthChecks",
    label: "تنظیمات Health Check",
    description: "نوع بررسی مناسب برای هر سرویس",
  },
];

function formatCheckTime(value?: string | null) {
  if (!value) return "هنوز بررسی نشده";

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SystemStatusesPage() {
  const { data: statuses = [] } = useAdminSystemStatuses();
  const createStatus = useCreateSystemStatus();
  const updateStatus = useUpdateSystemStatus();
  const deleteStatus = useDeleteSystemStatus();
  const checkStatus = useCheckSystemStatus();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemStatusItem | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("CheckCircle2");
  const [color, setColor] = useState("#34d399");
  const [checkType, setCheckType] =
    useState<SystemHealthCheckType>("MANUAL");
  const [target, setTarget] = useState("");
  const [method, setMethod] = useState("GET");
  const [expectedStatusCodes, setExpectedStatusCodes] =
    useState("200-399");
  const [expectedKeyword, setExpectedKeyword] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState("300");
  const [timeoutMs, setTimeoutMs] = useState("5000");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState<SystemStatusTab>("systems");

  function resetForm() {
    setEditing(null);
    setTitle("");
    setStatus("");
    setDescription("");
    setIcon("CheckCircle2");
    setColor("#34d399");
    setCheckType("MANUAL");
    setTarget("");
    setMethod("GET");
    setExpectedStatusCodes("200-399");
    setExpectedKeyword("");
    setIntervalSeconds("300");
    setTimeoutMs("5000");
    setSortOrder("0");
    setIsActive(true);
    setFormError("");
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    resetForm();
  }

  function startEdit(item: SystemStatusItem) {
    setEditing(item);
    setTitle(item.title);
    setStatus(item.status);
    setDescription(item.description ?? "");
    setIcon(item.icon ?? "CheckCircle2");
    setColor(item.color ?? "#34d399");
    setCheckType(item.checkType ?? "MANUAL");
    setTarget(item.target ?? "");
    setMethod(item.method ?? "GET");
    setExpectedStatusCodes(item.expectedStatusCodes ?? "200-399");
    setExpectedKeyword(item.expectedKeyword ?? "");
    setIntervalSeconds(String(item.intervalSeconds ?? 300));
    setTimeoutMs(String(item.timeoutMs ?? 5000));
    setSortOrder(String(item.sortOrder ?? 0));
    setIsActive(item.isActive);
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsedSortOrder = Number(sortOrder || 0);
    const parsedIntervalSeconds = Number(intervalSeconds || 300);
    const parsedTimeoutMs = Number(timeoutMs || 5000);

    if (!title.trim()) {
      setFormError("عنوان الزامی است.");
      return;
    }

    if (checkType === "MANUAL" && !status.trim()) {
      setFormError("برای Healthcheck دستی، وضعیت الزامی است.");
      return;
    }

    if (checkType !== "MANUAL" && !target.trim()) {
      setFormError("برای بررسی خودکار، آدرس یا host سامانه الزامی است.");
      return;
    }

    if (
      !Number.isInteger(parsedIntervalSeconds) ||
      parsedIntervalSeconds < 30 ||
      parsedIntervalSeconds > 86400
    ) {
      setFormError("بازه بررسی باید بین ۳۰ ثانیه تا ۲۴ ساعت باشد.");
      return;
    }

    if (
      !Number.isInteger(parsedTimeoutMs) ||
      parsedTimeoutMs < 1000 ||
      parsedTimeoutMs > 60000
    ) {
      setFormError("Timeout باید بین ۱۰۰۰ تا ۶۰۰۰۰ میلی‌ثانیه باشد.");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setFormError("ترتیب نمایش باید عدد صحیح صفر یا بزرگ‌تر باشد.");
      return;
    }

    const dto = {
      title: title.trim(),
      status:
        checkType === "MANUAL"
          ? status.trim()
          : editing?.status || "نامشخص",
      description: description.trim() || undefined,
      icon,
      color,
      checkType,
      target: target.trim() || undefined,
      method: method.trim().toUpperCase() || "GET",
      expectedStatusCodes: expectedStatusCodes.trim() || "200-399",
      expectedKeyword: expectedKeyword.trim() || undefined,
      intervalSeconds: parsedIntervalSeconds,
      timeoutMs: parsedTimeoutMs,
      sortOrder: parsedSortOrder,
      isActive,
    };

    setFormError("");

    if (editing) {
      await updateStatus.mutateAsync({
        id: editing.id,
        dto,
      });
    } else {
      await createStatus.mutateAsync(dto);
    }

    closeForm();
  }

  async function handleCheckNow(id: string) {
    setActionError("");

    try {
      await checkStatus.mutateAsync(id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "بررسی سامانه انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">مدیریت وضعیت سیستم‌ها</h1>
          <p className="mt-2 text-sm text-slate-400">
            وضعیت سرویس‌ها و سامانه‌های مهم پورتال را مدیریت کنید و نوع
            بررسی سلامت هر سامانه را جداگانه انتخاب کنید.
          </p>
        </div>

        <Button onClick={openCreateForm}>
          افزودن سامانه
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {systemStatusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl border p-4 text-right transition ${
              activeTab === tab.id
                ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.14)]"
                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
            }`}
          >
            <span className="block font-black">{tab.label}</span>
            <span className="mt-2 block text-xs leading-6 text-slate-400">
              {tab.description}
            </span>
          </button>
        ))}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (open) {
            setFormOpen(true);
            return;
          }

          closeForm();
        }}
        title={editing ? "ویرایش سامانه" : "افزودن سامانه"}
        className="max-w-5xl bg-slate-950/95"
      >
        <form onSubmit={submit} className="space-y-5">

        {formError && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
            {formError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="عنوان" required>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثلا اینترنت"
            />
          </FormField>

          <FormField
            label="وضعیت دستی"
            required={checkType === "MANUAL"}
          >
            <Input
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={checkType !== "MANUAL"}
              placeholder="مثلا در دسترس، اختلال، قطع"
            />
          </FormField>

          <FormField label="رنگ">
            <Input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </FormField>

          <FormField label="ترتیب نمایش">
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </FormField>
        </div>

        <FormField label="آیکن">
          <IconPicker
            value={icon}
            onChange={setIcon}
            folder="icons"
          />
        </FormField>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <h3 className="font-bold text-cyan-100">تنظیمات Healthcheck</h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">
            برای وب‌سرورها از HTTP، برای VPN و میل‌سرور از TCP، برای بررسی
            در دسترس بودن host از Ping، و برای فایل شیر از SMB استفاده کنید.
            اگر وضعیت باید دستی باشد، نوع را دستی بگذارید.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="نوع بررسی">
              <select
                value={checkType}
                onChange={(event) =>
                  setCheckType(event.target.value as SystemHealthCheckType)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {checkTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label={
	                checkType === "HTTP"
	                  ? "URL"
	                  : checkType === "SMB"
	                    ? "آدرس فایل‌سرور"
	                    : checkType === "PING"
	                      ? "Host یا IP"
	                      : "Host:Port"
              }
            >
              <Input
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                disabled={checkType === "MANUAL"}
                placeholder={
	                  checkType === "HTTP"
	                    ? "https://example.local"
	                    : checkType === "SMB"
	                      ? "fileserver.local"
	                      : checkType === "PING"
	                        ? "10.10.10.1 یا server.local"
	                        : "vpn.example.com:443"
                }
              />
            </FormField>

            <FormField label="HTTP Method">
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                disabled={checkType !== "HTTP"}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="GET">GET</option>
                <option value="HEAD">HEAD</option>
                <option value="POST">POST</option>
              </select>
            </FormField>

            <FormField label="Status Code قابل قبول">
              <Input
                value={expectedStatusCodes}
                onChange={(event) =>
                  setExpectedStatusCodes(event.target.value)
                }
                disabled={checkType !== "HTTP"}
                placeholder="200-399 یا 200,401"
              />
            </FormField>

            <FormField label="کلمه مورد انتظار در صفحه">
              <Input
                value={expectedKeyword}
                onChange={(event) => setExpectedKeyword(event.target.value)}
                disabled={checkType !== "HTTP"}
                placeholder="اختیاری"
              />
            </FormField>

            <FormField label="بازه بررسی - ثانیه">
              <Input
                type="number"
                min={30}
                max={86400}
                value={intervalSeconds}
                onChange={(event) =>
                  setIntervalSeconds(event.target.value)
                }
                disabled={checkType === "MANUAL"}
              />
            </FormField>

            <FormField label="Timeout - میلی‌ثانیه">
              <Input
                type="number"
                min={1000}
                max={60000}
                value={timeoutMs}
                onChange={(event) => setTimeoutMs(event.target.value)}
                disabled={checkType === "MANUAL"}
              />
            </FormField>
          </div>
        </div>

        <FormField label="توضیحات">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          فعال باشد
        </label>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={createStatus.isPending || updateStatus.isPending}
          >
            {editing ? "ذخیره ویرایش" : "افزودن وضعیت"}
          </Button>
	          {editing && (
	            <Button type="button" variant="secondary" onClick={closeForm}>
	              انصراف
	            </Button>
	          )}
	        </div>
	      </form>
      </Dialog>

      {activeTab === "healthChecks" && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checkTypeOptions.map((option) => (
            <div
              key={option.value}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-white">
                  {option.label}
                </h2>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  {option.value}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {option.description}
              </p>
              <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-6 text-slate-500">
                برای افزودن سامانه جدید، دکمه «افزودن سامانه» را بزنید و در
                مودال، نوع بررسی را از همین گزینه‌ها انتخاب کنید.
              </p>
            </div>
          ))}
        </section>
      )}

      {activeTab === "systems" && actionError && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {actionError}
        </div>
      )}

      {activeTab === "systems" && (
      <DataTable
        data={statuses}
        columns={[
          {
            key: "title",
            title: "سیستم",
            render: (item) => {
              const Icon = portalIconMap[item.icon || "CheckCircle2"];
              const uploadedIcon = isUploadedIcon(item.icon)
                ? item.icon
                : null;

              return (
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 place-items-center rounded-xl bg-white/[0.04]"
                    style={{ color: item.color || "#34d399" }}
                  >
	                    {uploadedIcon ? (
	                      <Image
	                        src={uploadedIcon}
	                        alt=""
	                        width={28}
	                        height={28}
	                        unoptimized
	                        className="size-7 object-contain"
	                      />
                    ) : Icon ? (
                      <Icon size={23} />
                    ) : null}
                  </span>
                  <div>
                    <div className="font-bold">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.checkType === "MANUAL"
                        ? "وضعیت دستی"
                        : `${checkTypeOptions.find((option) => option.value === item.checkType)?.label ?? item.checkType} · ${item.target || "بدون آدرس"}`}
                    </div>
                  </div>
                </div>
              );
            },
          },
          {
            key: "status",
            title: "وضعیت",
            render: (item) => (
              <div className="space-y-2">
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: `${item.color || "#34d399"}22`,
                    color: item.color || "#34d399",
                  }}
                >
                  {item.status}
                </span>
                <div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${healthStateClassNames[item.lastHealthState]}`}
                  >
                    {healthStateLabels[item.lastHealthState]}
                  </span>
                </div>
              </div>
            ),
          },
          {
            key: "lastCheck",
            title: "آخرین بررسی",
            render: (item) => (
              <div className="text-xs leading-6 text-slate-300">
                <div>{formatCheckTime(item.lastCheckedAt)}</div>
                {item.lastResponseTimeMs != null && (
                  <div className="text-slate-500">
                    {item.lastResponseTimeMs} ms
                  </div>
                )}
                {item.lastError && (
                  <div className="max-w-64 truncate text-red-300">
                    {item.lastError}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "isActive",
            title: "نمایش",
            render: (item) => (item.isActive ? "فعال" : "غیرفعال"),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (item) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEdit(item)}
                >
                  ویرایش
                </Button>
                {item.checkType !== "MANUAL" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={checkStatus.isPending}
                    onClick={() => void handleCheckNow(item.id)}
                  >
                    بررسی الان
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteStatus.isPending}
                  onClick={() => deleteStatus.mutate(item.id)}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]}
      />
      )}
    </div>
  );
}
