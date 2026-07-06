"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { IconPicker } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/Input";
import {
  useAdminSystemStatuses,
  useCreateSystemStatus,
  useDeleteSystemStatus,
  useUpdateSystemStatus,
} from "@/hooks/useSystemStatuses";
import { isUploadedIcon, portalIconMap } from "@/lib/icon-options";
import type { SystemStatusItem } from "@/lib/system-statuses";

export default function SystemStatusesPage() {
  const { data: statuses = [] } = useAdminSystemStatuses();
  const createStatus = useCreateSystemStatus();
  const updateStatus = useUpdateSystemStatus();
  const deleteStatus = useDeleteSystemStatus();
  const [editing, setEditing] = useState<SystemStatusItem | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("CheckCircle2");
  const [color, setColor] = useState("#34d399");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  function resetForm() {
    setEditing(null);
    setTitle("");
    setStatus("");
    setDescription("");
    setIcon("CheckCircle2");
    setColor("#34d399");
    setSortOrder("0");
    setIsActive(true);
    setFormError("");
  }

  function startEdit(item: SystemStatusItem) {
    setEditing(item);
    setTitle(item.title);
    setStatus(item.status);
    setDescription(item.description ?? "");
    setIcon(item.icon ?? "CheckCircle2");
    setColor(item.color ?? "#34d399");
    setSortOrder(String(item.sortOrder ?? 0));
    setIsActive(item.isActive);
    setFormError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsedSortOrder = Number(sortOrder || 0);

    if (!title.trim() || !status.trim()) {
      setFormError("عنوان و وضعیت الزامی هستند.");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setFormError("ترتیب نمایش باید عدد صحیح صفر یا بزرگ‌تر باشد.");
      return;
    }

    const dto = {
      title: title.trim(),
      status: status.trim(),
      description: description.trim() || undefined,
      icon,
      color,
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

    resetForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مدیریت وضعیت سیستم‌ها</h1>
        <p className="mt-2 text-sm text-slate-400">
          وضعیت سرویس‌ها و سامانه‌های مهم پورتال را مدیریت کنید.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <h2 className="text-xl font-bold">
          {editing ? "ویرایش وضعیت" : "افزودن وضعیت"}
        </h2>

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

          <FormField label="وضعیت" required>
            <Input
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              placeholder="مثلا متصل، در دسترس، اختلال"
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
            <Button type="button" variant="secondary" onClick={resetForm}>
              انصراف
            </Button>
          )}
        </div>
      </form>

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
                      <img
                        src={uploadedIcon}
                        alt=""
                        className="size-7 object-contain"
                      />
                    ) : Icon ? (
                      <Icon size={23} />
                    ) : null}
                  </span>
                  <div>
                    <div className="font-bold">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      ترتیب {item.sortOrder}
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
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${item.color || "#34d399"}22`,
                  color: item.color || "#34d399",
                }}
              >
                {item.status}
              </span>
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
    </div>
  );
}
