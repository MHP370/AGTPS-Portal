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
  useFileShareAudit,
  useTestFileShare,
  useUpdateFileShare,
} from "@/hooks/useFileShares";
import type { FileShare, ShareAccess } from "@/lib/file-shares";

type AdminFileShareTab = "shares" | "history";

const accessLabels: Array<{
  key: keyof Omit<ShareAccess, "id">;
  label: string;
}> = [
  { key: "canRead", label: "خواندن" },
  { key: "canDownload", label: "دانلود" },
  { key: "canUpload", label: "آپلود" },
  { key: "canDelete", label: "حذف" },
];

const actionLabels: Record<string, string> = {
  LIST: "مرور فولدر",
  PREVIEW: "نمایش فایل",
  DOWNLOAD: "دانلود",
  UPLOAD: "آپلود",
  DELETE: "حذف",
};

export default function AdminFileSharesPage() {
  const { data: shares = [] } = useAdminFileShares();
  const { data: audit = [] } = useFileShareAudit();
  const { data: users = [] } = useDirectoryUsers();
  const { data: groups = [] } = useDirectoryGroups();
  const createShare = useCreateFileShare();
  const updateShare = useUpdateFileShare();
  const deleteShare = useDeleteFileShare();
  const testShare = useTestFileShare();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminFileShareTab>("shares");
  const [editing, setEditing] = useState<FileShare | null>(null);
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [uncPath, setUncPath] = useState("");
  const [authMode, setAuthMode] = useState("KERBEROS");
  const [realm, setRealm] = useState("AGTPS.NET");
  const [sharedUsername, setSharedUsername] = useState("");
  const [sharedPassword, setSharedPassword] = useState("");
  const [icon, setIcon] = useState("FolderOpen");
  const [color, setColor] = useState("#38bdf8");
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowUpload, setAllowUpload] = useState(false);
  const [allowDelete, setAllowDelete] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [userAccesses, setUserAccesses] = useState<ShareAccess[]>([]);
  const [groupAccesses, setGroupAccesses] = useState<ShareAccess[]>([]);
  const [error, setError] = useState("");

  function resetForm() {
    setEditing(null);
    setKey("");
    setTitle("");
    setDescription("");
    setRootPath("");
    setUncPath("");
    setAuthMode("KERBEROS");
    setRealm("AGTPS.NET");
    setSharedUsername("");
    setSharedPassword("");
    setIcon("FolderOpen");
    setColor("#38bdf8");
    setAllowDownload(true);
    setAllowUpload(false);
    setAllowDelete(false);
    setIsActive(true);
    setSortOrder("0");
    setUserAccesses([]);
    setGroupAccesses([]);
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
    setUncPath(share.uncPath ?? (share.rootPath?.startsWith("\\") ? share.rootPath : ""));
    setAuthMode(share.authMode ?? "KERBEROS");
    setRealm(share.realm ?? "AGTPS.NET");
    setSharedUsername(share.sharedUsername ?? "");
    setSharedPassword(share.sharedPassword ?? "");
    setIcon(share.icon ?? "FolderOpen");
    setColor(share.color ?? "#38bdf8");
    setAllowDownload(share.allowDownload);
    setAllowUpload(share.allowUpload);
    setAllowDelete(share.allowDelete);
    setIsActive(Boolean(share.isActive));
    setSortOrder(String(share.sortOrder ?? 0));
    setUserAccesses(
      share.userAccesses?.map((access) => ({
        id: access.directoryUserId,
        canRead: access.canRead,
        canDownload: access.canDownload,
        canUpload: access.canUpload,
        canDelete: access.canDelete,
      })) ?? [],
    );
    setGroupAccesses(
      share.groupAccesses?.map((access) => ({
        id: access.directoryGroupId,
        canRead: access.canRead,
        canDownload: access.canDownload,
        canUpload: access.canUpload,
        canDelete: access.canDelete,
      })) ?? [],
    );
    setError("");
    setDialogOpen(true);
  }

  function toggleAccess(
    id: string,
    type: "user" | "group",
  ) {
    const setter = type === "user" ? setUserAccesses : setGroupAccesses;

    setter((current) =>
      current.some((item) => item.id === id)
        ? current.filter((item) => item.id !== id)
        : [
            ...current,
            {
              id,
              canRead: true,
              canDownload: allowDownload,
              canUpload: false,
              canDelete: false,
            },
          ],
    );
  }

  function updateAccessFlag(
    id: string,
    type: "user" | "group",
    key: keyof Omit<ShareAccess, "id">,
    checked: boolean,
  ) {
    const setter = type === "user" ? setUserAccesses : setGroupAccesses;

    setter((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: checked,
            }
          : item,
      ),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!key.trim() || !title.trim() || !uncPath.trim()) {
      setError("کلید، عنوان و مسیر ریشه الزامی هستند.");
      return;
    }

    const dto = {
      key: key.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      rootPath: rootPath.trim() || "/mnt/file-shares/" + key.trim(),
      uncPath: uncPath.trim(),
      authMode,
      realm: realm.trim() || undefined,
      sharedUsername:
        authMode === "SHARED_ACCOUNT" ? sharedUsername.trim() : undefined,
      sharedPassword:
        authMode === "SHARED_ACCOUNT" ? sharedPassword : undefined,
      icon,
      color,
      allowDownload: authMode === "KERBEROS" ? true : allowDownload,
      allowUpload: authMode === "KERBEROS" ? true : allowUpload,
      allowDelete: authMode === "KERBEROS" ? true : allowDelete,
      isActive,
      sortOrder: Number(sortOrder || 0),
      userAccesses: ["KERBEROS", "SHARED_ACCOUNT"].includes(authMode) ? [] : userAccesses,
      groupAccesses: ["KERBEROS", "SHARED_ACCOUNT"].includes(authMode) ? [] : groupAccesses,
    };

    try {
      if (editing) {
        await updateShare.mutateAsync({
          id: editing.id,
          dto,
        });
      } else {
        await createShare.mutateAsync(dto);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ذخیره فایل شیر انجام نشد.",
      );
      return;
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
            مسیر SMB را تعریف کنید؛ در حالت Kerberos، مجوزها مستقیماً از ACL
            ویندوز و هویت کاربر دامنه گرفته می‌شوند.
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

      <div className="grid gap-3 md:grid-cols-2">
        {[
          {
            id: "shares" as const,
            label: "Shareها",
            description: "تعریف مسیرها با ACL ویندوز یا دسترسی مدیریت‌شده",
          },
          {
            id: "history" as const,
            label: "History",
            description: "آخرین مرورها، نمایش‌ها و دانلودهای کاربران",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl border p-4 text-right transition ${
              activeTab === tab.id
                ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-50"
                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span className="block font-black">{tab.label}</span>
            <span className="mt-2 block text-xs leading-6 text-slate-400">
              {tab.description}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "shares" && (
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
                {share.uncPath || share.rootPath}
              </span>
            ),
          },
          {
            key: "access",
            title: "دسترسی",
            render: (share) =>
              share.authMode === "KERBEROS"
                ? "ACL ویندوز"
                : share.authMode === "SHARED_ACCOUNT"
                  ? "حساب مشترک"
                : `${share.userAccesses?.length ?? 0} کاربر · ${
                    share.groupAccesses?.length ?? 0
                  } گروه`,
          },
          {
            key: "isActive",
            title: "وضعیت",
            render: (share) => share.lastConnectionStatus ? share.lastConnectionStatus + (share.lastConnectionError ? " - " + share.lastConnectionError : "") : (share.isActive ? "فعال؛ تست نشده" : "غیرفعال"),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (share) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={testShare.isPending} onClick={() => testShare.mutate(share.id)}>تست اتصال</Button>
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
      )}

      {activeTab === "history" && (
        <DataTable
          data={audit}
          columns={[
            {
              key: "action",
              title: "عملیات",
              render: (item) => actionLabels[item.action] ?? item.action,
            },
            {
              key: "share",
              title: "Share",
              render: (item) => (
                <div>
                  <div className="font-bold">{item.share.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.share.key}
                  </div>
                </div>
              ),
            },
            {
              key: "user",
              title: "کاربر",
              render: (item) =>
                item.user
                  ? [item.user.firstName, item.user.lastName]
                      .filter(Boolean)
                      .join(" ") || item.user.username
                  : "-",
            },
            {
              key: "path",
              title: "مسیر",
              render: (item) => (
                <span dir="ltr" className="text-xs text-slate-300">
                  {item.path}
                </span>
              ),
            },
            {
              key: "createdAt",
              title: "زمان",
              render: (item) =>
                new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(item.createdAt)),
            },
          ]}
        />
      )}

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
            <Input value={uncPath} onChange={(event) => setUncPath(event.target.value)} placeholder="\\fileserver.agtps.net\department" dir="ltr" />
            <select value={authMode} onChange={(event) => setAuthMode(event.target.value)} className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"><option value="KERBEROS">Kerberos - ACL واقعی کاربر</option><option value="SHARED_ACCOUNT">حساب مشترک برای همه کاربران</option><option value="SERVICE_ACCOUNT">دسترسی مدیریت‌شده پورتال</option></select>
            <Input value={realm} onChange={(event) => setRealm(event.target.value)} placeholder="AGTPS.NET" dir="ltr" />
            <Input type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} placeholder="ترتیب نمایش" />
            <Input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </div>

          {authMode === "SHARED_ACCOUNT" && (
            <div className="space-y-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <p className="text-sm leading-7 text-amber-100">
                در این حالت همه کاربران واردشده، فایل‌ها را با مجوز همین حساب سرویس می‌بینند؛ ACL شخصی کاربر اعمال نمی‌شود.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={sharedUsername} onChange={(event) => setSharedUsername(event.target.value)} placeholder="AGTPS\\svc-fileshare" dir="ltr" />
                <Input type="password" value={sharedPassword} onChange={(event) => setSharedPassword(event.target.value)} placeholder={editing ? "برای حفظ رمز تغییر ندهید" : "رمز حساب سرویس"} dir="ltr" />
              </div>
            </div>
          )}

          <IconPicker value={icon} onChange={setIcon} folder="icons" />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            placeholder="توضیحات"
          />

          {authMode === "KERBEROS" ? (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">
              کاربران، گروه‌ها و سطح عملیات در این حالت از Active Directory و
              ACL خود فایل‌سرور خوانده می‌شوند و در پورتال قابل تغییر نیستند.
            </div>
          ) : (
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
          )}

          {authMode !== "KERBEROS" && (
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
                      checked={userAccesses.some((item) => item.id === user.id)}
                      onChange={() => toggleAccess(user.id, "user")}
                    />
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                {userAccesses.map((access) => {
                  const user = users.find((item) => item.id === access.id);
                  if (!user) return null;

                  return (
                    <div
                      key={access.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <div className="mb-2 text-sm font-bold">
                        {user.displayName}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-4">
                        {accessLabels.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2 py-2 text-xs"
                          >
                            {item.label}
                            <input
                              type="checkbox"
                              checked={Boolean(access[item.key])}
                              onChange={(event) =>
                                updateAccessFlag(
                                  access.id,
                                  "user",
                                  item.key,
                                  event.target.checked,
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                      checked={groupAccesses.some((item) => item.id === group.id)}
                      onChange={() => toggleAccess(group.id, "group")}
                    />
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                {groupAccesses.map((access) => {
                  const group = groups.find((item) => item.id === access.id);
                  if (!group) return null;

                  return (
                    <div
                      key={access.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <div className="mb-2 text-sm font-bold">
                        {group.title}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-4">
                        {accessLabels.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2 py-2 text-xs"
                          >
                            {item.label}
                            <input
                              type="checkbox"
                              checked={Boolean(access[item.key])}
                              onChange={(event) =>
                                updateAccessFlag(
                                  access.id,
                                  "group",
                                  item.key,
                                  event.target.checked,
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
          )}

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
