"use client";

import { useState } from "react";
import { FolderOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { IconPicker } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/Input";
import { useDirectoryGroups, useDirectoryUsers } from "@/hooks/useDirectory";
import {
  useAdminFileShares,
  useCreateFileShare,
  useDeleteFileShare,
  useUpdateFileShare,
} from "@/hooks/useFileShares";
import type { FileShare } from "@/lib/file-shares";

export default function AdminFileSharesPage() {
  const { data: shares = [] } = useAdminFileShares();
  const { data: users = [] } = useDirectoryUsers();
  const { data: groups = [] } = useDirectoryGroups();
  const createShare = useCreateFileShare();
  const updateShare = useUpdateFileShare();
  const deleteShare = useDeleteFileShare();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FileShare | null>(null);
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [icon, setIcon] = useState("FolderOpen");
  const [color, setColor] = useState("#38bdf8");
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowUpload, setAllowUpload] = useState(false);
  const [allowDelete, setAllowDelete] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  function resetForm() {
    setEditing(null);
    setKey("");
    setTitle("");
    setDescription("");
    setRootPath("");
    setIcon("FolderOpen");
    setColor("#38bdf8");
    setAllowDownload(true);
    setAllowUpload(false);
    setAllowDelete(false);
    setIsActive(true);
    setSortOrder("0");
    setSelectedUserIds([]);
    setSelectedGroupIds([]);
    setError("");
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(share: FileShare) {
    setEditing(share);
    setKey(share.key);
    setTitle(share.title);
    setDescription(share.description ?? "");
    setRootPath(share.rootPath ?? "");
    setIcon(share.icon ?? "FolderOpen");
    setColor(share.color ?? "#38bdf8");
    setAllowDownload(share.allowDownload);
    setAllowUpload(share.allowUpload);
    setAllowDelete(share.allowDelete);
    setIsActive(Boolean(share.isActive));
    setSortOrder(String(share.sortOrder ?? 0));
    setSelectedUserIds(
      share.userAccesses?.map((access) => access.directoryUserId) ?? [],
    );
    setSelectedGroupIds(
      share.groupAccesses?.map((access) => access.directoryGroupId) ?? [],
    );
    setError("");
    setDialogOpen(true);
  }

  function toggleUser(id: string) {
    setSelectedUserIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!key.trim() || !title.trim() || !rootPath.trim()) {
      setError("کلید، عنوان و مسیر ریشه الزامی هستند.");
      return;
    }

    const dto = {
      key: key.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      rootPath: rootPath.trim(),
      icon,
      color,
      allowDownload,
      allowUpload,
      allowDelete,
      isActive,
      sortOrder: Number(sortOrder || 0),
      userAccesses: selectedUserIds.map((id) => ({
        id,
        canRead: true,
        canDownload: allowDownload,
        canUpload: allowUpload,
        canDelete: allowDelete,
      })),
      groupAccesses: selectedGroupIds.map((id) => ({
        id,
        canRead: true,
        canDownload: allowDownload,
        canUpload: allowUpload,
        canDelete: allowDelete,
      })),
    };

    if (editing) {
      await updateShare.mutateAsync({
        id: editing.id,
        dto,
      });
    } else {
      await createShare.mutateAsync(dto);
    }

    setDialogOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">مدیریت فایل شیر SMB</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            مسیر SMB را روی سرور mount کنید، سپس مسیر mount شده را اینجا به
            عنوان Share تعریف کنید و دسترسی کاربران یا گروه‌ها را مشخص کنید.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={18} />
          افزودن فایل شیر
        </Button>
      </div>

      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">
        نمونه مسیر Linux: <span dir="ltr">/mnt/shares/public</span>. برای
        استفاده واقعی، share شبکه را با سیستم‌عامل mount کنید تا API فایل‌ها
        را از همان مسیر stream کند.
      </div>

      <DataTable
        data={shares}
        columns={[
          {
            key: "title",
            title: "Share",
            render: (share) => (
              <div className="flex items-center gap-3">
                <span
                  className="grid size-11 place-items-center rounded-xl bg-white/[0.04]"
                  style={{ color: share.color ?? "#38bdf8" }}
                >
                  <FolderOpen size={23} />
                </span>
                <div>
                  <div className="font-bold">{share.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{share.key}</div>
                </div>
              </div>
            ),
          },
          {
            key: "rootPath",
            title: "مسیر",
            render: (share) => (
              <span dir="ltr" className="text-xs text-slate-300">
                {share.rootPath}
              </span>
            ),
          },
          {
            key: "access",
            title: "دسترسی",
            render: (share) =>
              `${share.userAccesses?.length ?? 0} کاربر · ${
                share.groupAccesses?.length ?? 0
              } گروه`,
          },
          {
            key: "isActive",
            title: "وضعیت",
            render: (share) => (share.isActive ? "فعال" : "غیرفعال"),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (share) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEdit(share)}
                >
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteShare.isPending}
                  onClick={() => deleteShare.mutate(share.id)}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
        title={editing ? "ویرایش فایل شیر" : "افزودن فایل شیر"}
        className="max-w-5xl bg-slate-950/95"
      >
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Input value={key} onChange={(event) => setKey(event.target.value)} placeholder="کلید یکتا مثل public-files" />
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان" />
            <Input value={rootPath} onChange={(event) => setRootPath(event.target.value)} placeholder="/mnt/shares/public" />
            <Input type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} placeholder="ترتیب نمایش" />
            <Input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </div>

          <IconPicker value={icon} onChange={setIcon} folder="icons" />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            placeholder="توضیحات"
          />

          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["فعال باشد", isActive, setIsActive],
              ["دانلود مجاز باشد", allowDownload, setAllowDownload],
              ["آپلود مجاز باشد", allowUpload, setAllowUpload],
              ["حذف مجاز باشد", allowDelete, setAllowDelete],
            ].map(([label, checked, setter]) => (
              <label
                key={String(label)}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm text-slate-200"
              >
                <span>{String(label)}</span>
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(event) =>
                    (setter as React.Dispatch<React.SetStateAction<boolean>>)(
                      event.target.checked,
                    )
                  }
                />
              </label>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-black">دسترسی کاربران</h3>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3 text-sm"
                  >
                    <span>
                      <span className="block font-bold">
                        {user.displayName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {user.username}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-black">دسترسی گروه‌ها</h3>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {groups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3 text-sm"
                  >
                    <span>
                      <span className="block font-bold">{group.title}</span>
                      <span className="text-xs text-slate-500">
                        {group.name}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={createShare.isPending || updateShare.isPending}
            >
              ذخیره
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
