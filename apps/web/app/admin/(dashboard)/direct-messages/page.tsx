"use client";

import { useMemo, useState } from "react";
import { Inbox, MessageSquareLock, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import {
  useAvailableDirectManagers,
  useCreateMyDirectConversation,
  useDirectMessagingConfig,
  useMyDirectConversationDetail,
  useMyDirectConversations,
  useMyDirectContext,
  useMyDirectInbox,
  useReplyToMyDirectConversation,
  useUpdateMyDirectInboxStatus,
} from "@/hooks/useDirectCommunication";
import type {
  DirectCommunicationCategory,
  DirectCommunicationMode,
  DirectCommunicationPriority,
  DirectConversation,
} from "@/lib/direct-communication";

type Tab = "send" | "sent" | "inbox";

const modeLabels: Record<DirectCommunicationMode, string> = {
  NORMAL: "عادی",
  CONFIDENTIAL: "محرمانه",
  ANONYMOUS: "ناشناس",
};

const categoryLabels: Record<DirectCommunicationCategory, string> = {
  SUGGESTION: "پیشنهاد",
  COMPLAINT: "شکایت",
  VIOLATION_REPORT: "گزارش تخلف",
  IMPROVEMENT_IDEA: "ایده بهبود",
  REQUEST: "درخواست",
  CONFIDENTIAL_REPORT: "گزارش محرمانه",
  GENERAL_MESSAGE: "پیام عمومی",
};

const priorityLabels: Record<DirectCommunicationPriority, string> = {
  LOW: "کم",
  NORMAL: "معمولی",
  HIGH: "بالا",
  URGENT: "فوری",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function ConversationSummary({ conversation }: { conversation: DirectConversation }) {
  return (
    <div>
      <div className="font-black">{conversation.subject}</div>
      <div className="mt-1 text-xs text-slate-400">
        {categoryLabels[conversation.category]} · {modeLabels[conversation.mode]} ·{" "}
        {priorityLabels[conversation.priority]}
      </div>
    </div>
  );
}

export default function DirectMessagesPage() {
  const { data: messagingConfig } = useDirectMessagingConfig();
  const { data: managers = [] } = useAvailableDirectManagers();
  const { data: sentConversations = [] } = useMyDirectConversations();
  const { data: directContext } = useMyDirectContext();
  const { data: inboxConversations = [] } = useMyDirectInbox(Boolean(directContext?.isManager));
  const createConversation = useCreateMyDirectConversation();
  const replyToConversation = useReplyToMyDirectConversation();
  const updateInboxStatus = useUpdateMyDirectInboxStatus();
  const [tab, setTab] = useState<Tab>("send");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const { data: selectedConversation } =
    useMyDirectConversationDetail(selectedConversationId);
  const [replyMessage, setReplyMessage] = useState("");
  const [form, setForm] = useState({
    managerId: "",
    mode: "NORMAL" as DirectCommunicationMode,
    category: "GENERAL_MESSAGE" as DirectCommunicationCategory,
    priority: "NORMAL" as DirectCommunicationPriority,
    subject: "",
    message: "",
  });
  const [notice, setNotice] = useState("");
  const messagingEnabled = Boolean(messagingConfig?.enabled);
  const isManager = Boolean(directContext?.isManager);
  const defaultManagerId = managers[0]?.id ?? "";

  const inboxOpenCount = useMemo(
    () => inboxConversations.filter((item) => item.status === "OPEN").length,
    [inboxConversations],
  );
  const messageTabs: Array<{ id: Tab; label: string; icon: typeof Inbox }> = [
    { id: "send", label: "ارسال پیام", icon: SendHorizontal },
    { id: "sent", label: "پیام‌های من", icon: MessageSquareLock },
    ...(isManager
      ? [{
          id: "inbox" as const,
          label: "دریافتی مدیر" + (inboxOpenCount ? " (" + inboxOpenCount + ")" : ""),
          icon: Inbox,
        }]
      : []),
  ];

  async function submitMessage(event: React.FormEvent) {
    event.preventDefault();
    setNotice("");
    await createConversation.mutateAsync({
      managerId: form.managerId || defaultManagerId,
      mode: form.mode,
      category: form.category,
      priority: form.priority,
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setForm((current) => ({
      ...current,
      subject: "",
      message: "",
    }));
    setNotice("پیام ثبت شد و برای مدیر مربوطه نوتیفیکیشن ارسال شد.");
    setTab("sent");
    setSelectedConversationId(null);
  }

  async function submitReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedConversationId || !replyMessage.trim()) {
      return;
    }

    await replyToConversation.mutateAsync({
      id: selectedConversationId,
      message: replyMessage.trim(),
    });
    setReplyMessage("");
    setNotice("پاسخ ثبت شد.");
  }

  const conversationColumns = [
    {
      key: "subject",
      title: "موضوع",
      render: (conversation: DirectConversation) => (
        <ConversationSummary conversation={conversation} />
      ),
    },
    {
      key: "manager",
      title: "مدیر",
      render: (conversation: DirectConversation) => conversation.manager.title,
    },
    {
      key: "status",
      title: "وضعیت",
      render: (conversation: DirectConversation) =>
        conversation.status === "OPEN"
          ? "باز"
          : conversation.status === "RESOLVED"
            ? "حل‌شده"
            : conversation.status === "ARCHIVED"
              ? "آرشیو"
              : "بسته",
    },
    {
      key: "date",
      title: "آخرین پیام",
      render: (conversation: DirectConversation) =>
        formatDate(conversation.lastMessageAt ?? conversation.createdAt),
    },
    {
      key: "view",
      title: "جزئیات",
      render: (conversation: DirectConversation) => (
        <Button
          size="sm"
          variant={
            selectedConversationId === conversation.id ? "primary" : "secondary"
          }
          onClick={() => setSelectedConversationId(conversation.id)}
        >
          مشاهده
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-cyan-200">Direct Messages</p>
        <h1 className="mt-2 text-3xl font-black text-white">
          ارتباط مستقیم با مدیران
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          کاربران از این بخش پیام ارسال می‌کنند. مدیران و مدیرعامل نیز فقط
          پیام‌های دریافتی مربوط به خودشان را در همین صفحه می‌بینند.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {messageTabs.map((item) => {
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

      {notice && (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      {tab === "send" && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          {!messagingEnabled && (
            <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              {messagingConfig?.reason ??
                "ارسال پیام مستقیم فعلا غیرفعال شده است."}
            </div>
          )}
          <form onSubmit={submitMessage} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={form.managerId || defaultManagerId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    managerId: event.target.value,
                  }))
                }
                disabled={!messagingEnabled || managers.length === 0}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
              >
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.isCeo ? "مدیرعامل - " : ""}
                    {manager.title}
                    {manager.department ? ` (${manager.department})` : ""}
                  </option>
                ))}
              </select>
              <Input
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                disabled={!messagingEnabled}
                placeholder="موضوع پیام"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={form.mode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mode: event.target.value as DirectCommunicationMode,
                  }))
                }
                disabled={!messagingEnabled}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
              >
                {Object.entries(modeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as DirectCommunicationCategory,
                  }))
                }
                disabled={!messagingEnabled}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as DirectCommunicationPriority,
                  }))
                }
                disabled={!messagingEnabled}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              disabled={!messagingEnabled}
              rows={7}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-7 text-white disabled:opacity-50"
              placeholder="متن پیام"
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !messagingEnabled ||
                  createConversation.isPending ||
                  managers.length === 0 ||
                  !form.subject.trim() ||
                  !form.message.trim()
                }
                className="gap-2"
              >
                <SendHorizontal size={17} />
                ارسال پیام
              </Button>
            </div>
          </form>
        </section>
      )}

      {tab === "sent" && (
        <DataTable data={sentConversations} columns={conversationColumns} />
      )}

      {tab === "inbox" && (
        <DataTable
          data={inboxConversations}
          columns={[
            ...conversationColumns,
            {
              key: "actions",
              title: "عملیات",
              render: (conversation) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      conversation.status === "RESOLVED" ||
                      updateInboxStatus.isPending
                    }
                    onClick={() =>
                      updateInboxStatus.mutate({
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
                      updateInboxStatus.isPending
                    }
                    onClick={() =>
                      updateInboxStatus.mutate({
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
      )}

      {selectedConversation && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold text-cyan-200">جزئیات مکالمه</p>
              <h2 className="mt-2 text-xl font-black text-white">
                {selectedConversation.subject}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {selectedConversation.manager.title} ·{" "}
                {categoryLabels[selectedConversation.category]} ·{" "}
                {modeLabels[selectedConversation.mode]}
              </p>
            </div>
            <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
              {selectedConversation.status === "OPEN"
                ? "باز"
                : selectedConversation.status === "RESOLVED"
                  ? "حل‌شده"
                  : selectedConversation.status === "ARCHIVED"
                    ? "آرشیو"
                    : "بسته"}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl border p-4 ${
                  message.senderType === "MANAGER"
                    ? "border-violet-300/20 bg-violet-400/10"
                    : "border-cyan-300/20 bg-cyan-400/10"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-black text-white">
                    {message.senderType === "MANAGER"
                      ? "پاسخ مدیر"
                      : "پیام کاربر"}
                  </span>
                  <span className="text-slate-400">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                  {message.body || "متن پیام با نسخه فعلی قابل نمایش نیست."}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={submitReply} className="mt-5 space-y-3">
            {!messagingEnabled && (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
                {messagingConfig?.reason ??
                  "ثبت پاسخ فعلا غیرفعال شده است."}
              </div>
            )}
            <textarea
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              disabled={
                !messagingEnabled ||
                selectedConversation.status === "ARCHIVED" ||
                selectedConversation.status === "CLOSED"
              }
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-7 text-white disabled:opacity-50"
              placeholder="پاسخ خود را بنویسید"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !messagingEnabled ||
                  !replyMessage.trim() ||
                  replyToConversation.isPending ||
                  selectedConversation.status === "ARCHIVED" ||
                  selectedConversation.status === "CLOSED"
                }
              >
                ثبت پاسخ
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
