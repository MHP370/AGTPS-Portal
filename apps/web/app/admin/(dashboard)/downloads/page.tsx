"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import {
  useAdminDownloads,
  useCreateDownload,
  useDeleteDownload,
  useUpdateDownload,
} from "@/hooks/useDownloads";
import type { PortalDownloadItem } from "@/lib/downloads";

const iconOptions = [
  "CloudDownload",
  "Globe",
  "Plane",
  "ShieldCheck",
  "BriefcaseBusiness",
  "FileText",
];

export default function DownloadsPage() {
  const { data: downloads = [] } = useAdminDownloads();
  const createDownload = useCreateDownload();
  const updateDownload = useUpdateDownload();
  const deleteDownload = useDeleteDownload();
  const [editing, setEditing] = useState<PortalDownloadItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [category, setCategory] = useState("");
  const [icon, setIcon] = useState("CloudDownload");
  const [color, setColor] = useState("text-cyan-300");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setVersion("");
    setFileUrl("");
    setCategory("");
    setIcon("CloudDownload");
    setColor("text-cyan-300");
    setSortOrder("0");
    setIsActive(true);
  }

  function startEdit(download: PortalDownloadItem) {
    setEditing(download);
    setTitle(download.title);
    setDescription(download.description ?? "");
    setVersion(download.version ?? "");
    setFileUrl(download.fileUrl);
    setCategory(download.category ?? "");
    setIcon(download.icon ?? "CloudDownload");
    setColor(download.color ?? "text-cyan-300");
    setSortOrder(String(download.sortOrder ?? 0));
    setIsActive(download.isActive);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;

    const dto = {
      title: title.trim(),
      description: description.trim() || undefined,
      version: version.trim() || undefined,
      fileUrl: fileUrl.trim(),
      category: category.trim() || undefined,
      icon,
      color,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    if (editing) {
      await updateDownload.mutateAsync({
        id: editing.id,
        dto,
      });
    } else {
      await createDownload.mutateAsync(dto);
    }

    resetForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مدیریت دانلودها</h1>
        <p className="mt-2 text-sm text-slate-400">
          فایل‌ها، نرم‌افزارها، فرم‌ها و مستندات پرکاربرد پورتال را مدیریت کنید.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <h2 className="text-xl font-bold">
          {editing ? "ویرایش دانلود" : "افزودن دانلود"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="عنوان" required>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </FormField>
          <FormField label="نسخه">
            <Input value={version} onChange={(event) => setVersion(event.target.value)} />
          </FormField>
          <FormField label="دسته‌بندی">
            <Input value={category} onChange={(event) => setCategory(event.target.value)} />
          </FormField>
          <FormField label="ترتیب نمایش">
            <Input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </FormField>
          <FormField label="آیکن">
            <select
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
            >
              {iconOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="رنگ آیکن">
            <Input value={color} onChange={(event) => setColor(event.target.value)} />
          </FormField>
        </div>

        <FormField label="فایل یا لینک دانلود" required>
          <FileUploadField
            value={fileUrl}
            onChange={setFileUrl}
            folder="downloads"
            placeholder="/uploads/downloads/file.zip یا https://..."
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
          <Button type="submit" disabled={createDownload.isPending || updateDownload.isPending}>
            {editing ? "ذخیره ویرایش" : "افزودن دانلود"}
          </Button>
          {editing && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              انصراف
            </Button>
          )}
        </div>
      </form>

      <DataTable
        data={downloads}
        columns={[
          {
            key: "title",
            title: "عنوان",
            render: (download) => (
              <div>
                <div className="font-bold">{download.title}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {download.category || "بدون دسته"} · {download.version || "بدون نسخه"}
                </div>
              </div>
            ),
          },
          {
            key: "fileUrl",
            title: "لینک",
            render: (download) => (
              <a
                href={download.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 hover:text-cyan-100"
              >
                مشاهده
              </a>
            ),
          },
          {
            key: "isActive",
            title: "وضعیت",
            render: (download) => (download.isActive ? "فعال" : "غیرفعال"),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (download) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(download)}>
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => deleteDownload.mutate(download.id)}
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
