"use client";

import { useState } from "react";
import {
  Inbox,
  MessageSquareLock,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useDirectoryUsers } from "@/hooks/useDirectory";
import {
  useDirectConversations,
  useCreateDirectManager,
  useCreateForbiddenWord,
  useDeleteDirectManager,
  useDeleteForbiddenWord,
  useDirectMessagingConfig,
  useDirectManagers,
  useForbiddenWords,
  useUpdateDirectConversationStatus,
  useUpdateDirectManager,
  useUpdateForbiddenWord,
} from "@/hooks/useDirectCommunication";
import { useUsers } from "@/hooks/useUsers";
import type {
  DirectCommunicationManager,
  DirectForbiddenWord,
} from "@/lib/direct-communication";

const statusLabels = {
  OPEN: "باز",
  RESOLVED: "حل‌شده",
  ARCHIVED: "آرشیو",
  CLOSED: "بسته",
} as const;

const modeLabels = {
  NORMAL: "عادی",
  CONFIDENTIAL: "محرمانه",
  ANONYMOUS: "ناشناس",
} as const;

const priorityLabels = {
  LOW: "کم",
  NORMAL: "معمولی",
  HIGH: "بالا",
  URGENT: "فوری",
} as const;

const categoryLabels = {
  SUGGESTION: "پیشنهاد",
  COMPLAINT: "شکایت",
  VIOLATION_REPORT: "گزارش تخلف",
  IMPROVEMENT_IDEA: "ایده بهبود",
  REQUEST: "درخواست",
  CONFIDENTIAL_REPORT: "گزارش محرمانه",
  GENERAL_MESSAGE: "پیام عمومی",
} as const;

type Tab = "messages" | "managers" | "forbiddenWords" | "security";

function getManagerName(manager: DirectCommunicationManager) {
  if (manager.portalUser) {
    return (
      [manager.portalUser.firstName, manager.portalUser.lastName]
        .filter(Boolean)
        .join(" ") ||
      manager.portalUser.username ||
      manager.portalUser.email
    );
  }

  return manager.directoryUser?.displayName || "-";
}

export default function DirectCommunicationPage() {
  const { data: managers = [] } = useDirectManagers();
  const { data: forbiddenWords = [] } = useForbiddenWords();
  const { data: messagingConfig } = useDirectMessagingConfig();
  const { data: conversations = [] } = useDirectConversations();
  const { data: users = [] } = useUsers();
  const { data: directoryUsers = [] } = useDirectoryUsers();
  const updateConversationStatus = useUpdateDirectConversationStatus();
  const createManager = useCreateDirectManager();
  const updateManager = useUpdateDirectManager();
  const deleteManager = useDeleteDirectManager();
  const createWord = useCreateForbiddenWord();
  const updateWord = useUpdateForbiddenWord();
  const deleteWord = useDeleteForbiddenWord();
  const [tab, setTab] = useState<Tab>("messages");
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [wordDialogOpen, setWordDialogOpen] = useState(false);
  const [editingManager, setEditingManager] =
    useState<DirectCommunicationManager | null>(null);
  const [editingWord, setEditingWord] = useState<DirectForbiddenWord | null>(
    null,
  );
  const [managerForm, setManagerForm] = useState({
    title: "",
    department: "",
    description: "",
    isCeo: false,
    isActive: true,
    identityType: "directory" as "directory" | "portal",
    portalUserId: "",
    directoryUserId: "",
  });
  const [wordForm, setWordForm] = useState({
    word: "",
    description: "",
    isActive: true,
  });
  const [message, setMessage] = useState("");

  function openCreateManager() {
    setEditingManager(null);
    setManagerForm({
      title: "",
      department: "",
      description: "",
      isCeo: false,
      isActive: true,
      identityType: "directory",
      portalUserId: "",
      directoryUserId: "",
    });
    setManagerDialogOpen(true);
  }

  function openEditManager(manager: DirectCommunicationManager) {
    setEditingManager(manager);
    setManagerForm({
      title: manager.title,
      department: manager.department ?? "",
      description: manager.description ?? "",
      isCeo: manager.isCeo,
      isActive: manager.isActive,
      identityType: manager.portalUserId ? "portal" : "directory",
      portalUserId: manager.portalUserId ?? "",
      directoryUserId: manager.directoryUserId ?? "",
    });
    setManagerDialogOpen(true);
  }

  async function submitManager(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const dto = {
      title: managerForm.title.trim(),
      department: managerForm.department.trim() || undefined,
      description: managerForm.description.trim() || undefined,
      isCeo: managerForm.isCeo,
      isActive: managerForm.isActive,
      portalUserId:
        managerForm.identityType === "portal"
          ? managerForm.portalUserId || undefined
          : undefined,
      directoryUserId:
        managerForm.identityType === "directory"
          ? managerForm.directoryUserId || undefined
          : undefined,
    };

    if (editingManager) {
      await updateManager.mutateAsync({
        id: editingManager.id,
        dto,
      });
    } else {
      await createManager.mutateAsync(dto);
    }
    setManagerDialogOpen(false);
  }

  function openCreateWord() {
    setEditingWord(null);
    setWordForm({
      word: "",
      description: "",
      isActive: true,
    });
    setWordDialogOpen(true);
  }

  function openEditWord(word: DirectForbiddenWord) {
    setEditingWord(word);
    setWordForm({
      word: word.word,
      description: word.description ?? "",
      isActive: word.isActive,
    });
    setWordDialogOpen(true);
  }

  async function submitWord(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const dto = {
      word: wordForm.word.trim(),
      description: wordForm.description.trim() || undefined,
      isActive: wordForm.isActive,
    };

    if (editingWord) {
      await updateWord.mutateAsync({
        id: editingWord.id,
        dto,
      });
    } else {
      await createWord.mutateAsync(dto);
    }
    setWordDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-cyan-200">
          Direct Communication
        </p>
        <h1 className="mt-2 text-3xl font-black">ارتباط مستقیم مدیران</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          مدیرعامل، مدیران بخش‌ها، فیلتر کلمات ممنوعه و زیرساخت مکالمه
          رمزنگاری‌شده از این بخش مدیریت می‌شود.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { id: "messages" as const, label: "پیام‌ها", icon: Inbox },
          { id: "managers" as const, label: "مدیران", icon: MessageSquareLock },
          { id: "forbiddenWords" as const, label: "کلمات ممنوعه", icon: ShieldAlert },
          { id: "security" as const, label: "امنیت پیام‌ها", icon: ShieldAlert },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center justify-between rounded-2xl border p-4 text-right transition ${
                tab === item.id
                  ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-50"
                  : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <span className="font-black">{item.label}</span>
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {tab === "messages" && (
        <section className="space-y-4">
          <div
            className={`rounded-2xl border p-4 text-sm leading-7 ${
              messagingConfig?.enabled
                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                : "border-amber-300/20 bg-amber-400/10 text-amber-100"
            }`}
          >
            <div className="font-black">
              {messagingConfig?.enabled
                ? "ارسال پیام فعال است"
                : "ارسال پیام فعلا غیرفعال است"}
            </div>
            <p className="mt-1">
              {messagingConfig?.reason ??
                "مکالمه‌ها با payload رمزنگاری‌شده ذخیره می‌شوند."}
            </p>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              {(messagingConfig?.securityNotes ?? []).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <DataTable
            data={conversations}
            columns={[
              {
                key: "subject",
                title: "موضوع",
                render: (conversation) => (
                  <div>
                    <div className="font-black">{conversation.subject}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {categoryLabels[conversation.category]} ·{" "}
                      {modeLabels[conversation.mode]} ·{" "}
                      {priorityLabels[conversation.priority]}
                    </div>
                  </div>
                ),
              },
              {
                key: "manager",
                title: "گیرنده",
                render: (conversation) => conversation.manager.title,
              },
              {
                key: "messages",
                title: "پیام‌ها",
                render: (conversation) => `${conversation._count.messages} پیام`,
              },
              {
                key: "status",
                title: "وضعیت",
                render: (conversation) => statusLabels[conversation.status],
              },
              {
                key: "actions",
                title: "عملیات",
                render: (conversation) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        conversation.status === "RESOLVED" ||
                        updateConversationStatus.isPending
                      }
                      onClick={() =>
                        updateConversationStatus.mutate({
                          id: conversation.id,
                          status: "RESOLVED",
                        })
                      }
                    >
                      حل شد
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        conversation.status === "ARCHIVED" ||
                        updateConversationStatus.isPending
                      }
                      onClick={() =>
                        updateConversationStatus.mutate({
                          id: conversation.id,
                          status: "ARCHIVED",
                        })
                      }
                    >
                      آرشیو
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      {tab === "managers" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateManager} className="gap-2">
              <Plus size={17} />
              افزودن مدیر
            </Button>
          </div>
          <DataTable
            data={managers}
            columns={[
              {
                key: "title",
                title: "عنوان",
                render: (manager) => (
                  <div>
                    <div className="font-black">{manager.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {manager.isCeo ? "مدیرعامل" : manager.department || "-"}
                    </div>
                  </div>
                ),
              },
              {
                key: "user",
                title: "کاربر",
                render: (manager) => getManagerName(manager),
              },
              {
                key: "status",
                title: "وضعیت",
                render: (manager) => (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      manager.isActive
                        ? "bg-emerald-400/10 text-emerald-200"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {manager.isActive ? "فعال" : "غیرفعال"}
                  </span>
                ),
              },
              {
                key: "actions",
                title: "عملیات",
                render: (manager) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditManager(manager)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deleteManager.isPending}
                      onClick={() => deleteManager.mutate(manager.id)}
                      className="gap-1"
                    >
                      <Trash2 size={14} />
                      حذف
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      {tab === "forbiddenWords" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateWord} className="gap-2">
              <Plus size={17} />
              افزودن کلمه
            </Button>
          </div>
          <DataTable
            data={forbiddenWords}
            columns={[
              { key: "word", title: "کلمه/عبارت" },
              { key: "normalizedWord", title: "نرمال‌شده" },
              {
                key: "status",
                title: "وضعیت",
                render: (word) => (word.isActive ? "فعال" : "غیرفعال"),
              },
              {
                key: "actions",
                title: "عملیات",
                render: (word) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditWord(word)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deleteWord.isPending}
                      onClick={() => deleteWord.mutate(word.id)}
                    >
                      حذف
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      {tab === "security" && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-sm leading-8 text-amber-100">
          پیاده‌سازی پیام محرمانه و ناشناس با رمزنگاری واقعی باید در فاز جدا
          انجام شود. در این فاز فقط تنظیمات مدیران و فیلتر کلمات آماده شده تا
          قبل از ذخیره هر پیام حساس، معماری کلید خصوصی، Recovery Key، rotation
          و عدم دسترسی DB Admin دقیق طراحی شود.
        </div>
      )}

      <Dialog
        open={managerDialogOpen}
        onOpenChange={setManagerDialogOpen}
        title={editingManager ? "ویرایش مدیر" : "افزودن مدیر"}
        className="max-w-3xl"
      >
        <form onSubmit={submitManager} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={managerForm.title}
              onChange={(event) =>
                setManagerForm((form) => ({ ...form, title: event.target.value }))
              }
              placeholder="عنوان مثل مدیرعامل یا مدیر منابع انسانی"
            />
            <Input
              value={managerForm.department}
              onChange={(event) =>
                setManagerForm((form) => ({
                  ...form,
                  department: event.target.value,
                }))
              }
              placeholder="بخش/واحد"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={managerForm.identityType}
              onChange={(event) =>
                setManagerForm((form) => ({
                  ...form,
                  identityType: event.target.value as "directory" | "portal",
                  portalUserId: "",
                  directoryUserId: "",
                }))
              }
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            >
              <option value="directory">کاربر دایرکتوری</option>
              <option value="portal">کاربر داخلی پورتال</option>
            </select>
            {managerForm.identityType === "directory" ? (
              <select
                value={managerForm.directoryUserId}
                onChange={(event) =>
                  setManagerForm((form) => ({
                    ...form,
                    directoryUserId: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
              >
                <option value="">انتخاب کاربر</option>
                {directoryUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} - {user.username}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={managerForm.portalUserId}
                onChange={(event) =>
                  setManagerForm((form) => ({
                    ...form,
                    portalUserId: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
              >
                <option value="">انتخاب کاربر</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName || user.lastName
                      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`
                      : user.username}
                  </option>
                ))}
              </select>
            )}
          </div>

          <textarea
            value={managerForm.description}
            onChange={(event) =>
              setManagerForm((form) => ({
                ...form,
                description: event.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            placeholder="توضیحات اختیاری"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
              <span>مدیرعامل است</span>
              <input
                type="checkbox"
                checked={managerForm.isCeo}
                onChange={(event) =>
                  setManagerForm((form) => ({
                    ...form,
                    isCeo: event.target.checked,
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
              <span>فعال باشد</span>
              <input
                type="checkbox"
                checked={managerForm.isActive}
                onChange={(event) =>
                  setManagerForm((form) => ({
                    ...form,
                    isActive: event.target.checked,
                  }))
                }
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createManager.isPending || updateManager.isPending}
            >
              ذخیره
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={wordDialogOpen}
        onOpenChange={setWordDialogOpen}
        title={editingWord ? "ویرایش کلمه ممنوعه" : "افزودن کلمه ممنوعه"}
        className="max-w-2xl"
      >
        <form onSubmit={submitWord} className="space-y-4">
          <Input
            value={wordForm.word}
            onChange={(event) =>
              setWordForm((form) => ({ ...form, word: event.target.value }))
            }
            placeholder="کلمه یا عبارت"
          />
          <textarea
            value={wordForm.description}
            onChange={(event) =>
              setWordForm((form) => ({
                ...form,
                description: event.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
            placeholder="توضیح اختیاری"
          />
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
            <span>فعال باشد</span>
            <input
              type="checkbox"
              checked={wordForm.isActive}
              onChange={(event) =>
                setWordForm((form) => ({
                  ...form,
                  isActive: event.target.checked,
                }))
              }
            />
          </label>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createWord.isPending || updateWord.isPending}
            >
              ذخیره
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
