"use client";

import { useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Mail,
  Play,
  Plus,
  Send,
  Server,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  useCancelQueuedEmail,
  useCreateNotificationTemplate,
  useCreateSmtpServer,
  useDeleteNotificationTemplate,
  useDeleteSmtpServer,
  useEmailQueue,
  useNotificationStats,
  useNotificationRules,
  useNotificationTemplates,
  useProcessEmailQueue,
  useQueueEmail,
  useSendQueuedEmail,
  useSmtpServers,
  useTestSmtpServer,
  useUpdateNotificationRule,
  useUpdateNotificationTemplate,
  useUpdateSmtpServer,
} from "@/hooks/useNotificationCenter";
import type {
  NotificationTemplate,
  NotificationRule,
  QueueStatus,
  SmtpEncryption,
  SmtpServer,
  TemplateCategory,
  TemplateStatus,
} from "@/lib/notification-center";

type Tab = "smtp" | "templates" | "rules" | "queue" | "reports";

const encryptionLabels: Record<SmtpEncryption, string> = {
  NONE: "بدون رمزنگاری",
  SSL: "SSL",
  TLS: "TLS",
  STARTTLS: "STARTTLS",
};

const statusLabels: Record<QueueStatus, string> = {
  PENDING: "در انتظار",
  SENDING: "در حال ارسال",
  SENT: "ارسال شد",
  FAILED: "ناموفق",
  RETRY: "تلاش مجدد",
  CANCELLED: "لغو شده",
};

const templateStatusLabels: Record<TemplateStatus, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشر شده",
  ARCHIVED: "آرشیو",
};

const templateCategories: Array<{ id: TemplateCategory; label: string }> = [
  { id: "GENERAL", label: "عمومی" },
  { id: "ANNOUNCEMENTS", label: "اطلاعیه‌ها" },
  { id: "MEETINGS", label: "جلسات" },
  { id: "TRAINING", label: "آموزش" },
  { id: "POLLS", label: "رای‌گیری" },
  { id: "SURVEYS", label: "نظرسنجی" },
  { id: "BACKUPS", label: "بکاپ" },
  { id: "SYSTEM_ALERTS", label: "هشدار سیستم" },
];

function StatCard({
  title,
  value,
  tone = "cyan",
}: {
  title: string;
  value: number;
  tone?: "cyan" | "emerald" | "rose" | "amber";
}) {
  const tones = {
    cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
    emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    rose: "border-rose-300/20 bg-rose-400/10 text-rose-100",
    amber: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs font-bold opacity-80">{title}</div>
    </div>
  );
}

export default function NotificationCenterPage() {
  const [tab, setTab] = useState<Tab>("smtp");
  const [smtpDialogOpen, setSmtpDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingSmtp, setEditingSmtp] = useState<SmtpServer | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [message, setMessage] = useState("");

  const { data: stats } = useNotificationStats();
  const { data: smtpServers = [] } = useSmtpServers();
  const { data: templates = [] } = useNotificationTemplates();
  const { data: rules = [] } = useNotificationRules();
  const { data: queue = [] } = useEmailQueue();
  const createSmtp = useCreateSmtpServer();
  const updateSmtp = useUpdateSmtpServer();
  const deleteSmtp = useDeleteSmtpServer();
  const testSmtp = useTestSmtpServer();
  const createTemplate = useCreateNotificationTemplate();
  const updateTemplate = useUpdateNotificationTemplate();
  const deleteTemplate = useDeleteNotificationTemplate();
  const updateRule = useUpdateNotificationRule();
  const queueEmailMutation = useQueueEmail();
  const processQueue = useProcessEmailQueue();
  const sendQueued = useSendQueuedEmail();
  const cancelQueued = useCancelQueuedEmail();

  const [smtpForm, setSmtpForm] = useState({
    name: "",
    host: "",
    port: "587",
    username: "",
    password: "",
    senderName: "",
    senderEmail: "",
    replyTo: "",
    encryption: "STARTTLS" as SmtpEncryption,
    timeoutMs: "10000",
    maxRetry: "3",
    priority: "100",
    isActive: true,
    isPrimary: false,
  });
  const [templateForm, setTemplateForm] = useState({
    key: "",
    title: "",
    category: "GENERAL" as TemplateCategory,
    status: "DRAFT" as TemplateStatus,
    subject: "",
    htmlBody: "",
    textBody: "",
  });
  const [emailForm, setEmailForm] = useState({
    recipientEmail: "",
    recipientName: "",
    templateId: "",
    subject: "",
    htmlBody: "",
    textBody: "",
  });

  function openCreateSmtp() {
    setEditingSmtp(null);
    setSmtpForm({
      name: "",
      host: "",
      port: "587",
      username: "",
      password: "",
      senderName: "",
      senderEmail: "",
      replyTo: "",
      encryption: "STARTTLS",
      timeoutMs: "10000",
      maxRetry: "3",
      priority: "100",
      isActive: true,
      isPrimary: false,
    });
    setSmtpDialogOpen(true);
  }

  function openEditSmtp(server: SmtpServer) {
    setEditingSmtp(server);
    setSmtpForm({
      name: server.name,
      host: server.host,
      port: String(server.port),
      username: server.username ?? "",
      password: server.password ? "__KEEP_EXISTING__" : "",
      senderName: server.senderName ?? "",
      senderEmail: server.senderEmail,
      replyTo: server.replyTo ?? "",
      encryption: server.encryption,
      timeoutMs: String(server.timeoutMs),
      maxRetry: String(server.maxRetry),
      priority: String(server.priority),
      isActive: server.isActive,
      isPrimary: server.isPrimary,
    });
    setSmtpDialogOpen(true);
  }

  async function submitSmtp(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const dto = {
      name: smtpForm.name.trim(),
      host: smtpForm.host.trim(),
      port: Number(smtpForm.port),
      username: smtpForm.username.trim() || undefined,
      password: smtpForm.password || undefined,
      senderName: smtpForm.senderName.trim() || undefined,
      senderEmail: smtpForm.senderEmail.trim(),
      replyTo: smtpForm.replyTo.trim() || undefined,
      encryption: smtpForm.encryption,
      timeoutMs: Number(smtpForm.timeoutMs || 10000),
      maxRetry: Number(smtpForm.maxRetry || 3),
      priority: Number(smtpForm.priority || 100),
      isActive: smtpForm.isActive,
      isPrimary: smtpForm.isPrimary,
    };

    if (editingSmtp) {
      await updateSmtp.mutateAsync({ id: editingSmtp.id, dto });
    } else {
      await createSmtp.mutateAsync(dto);
    }
    setSmtpDialogOpen(false);
  }

  function openCreateTemplate() {
    setEditingTemplate(null);
    setTemplateForm({
      key: "",
      title: "",
      category: "GENERAL",
      status: "DRAFT",
      subject: "",
      htmlBody: "",
      textBody: "",
    });
    setTemplateDialogOpen(true);
  }

  function openEditTemplate(template: NotificationTemplate) {
    setEditingTemplate(template);
    setTemplateForm({
      key: template.key,
      title: template.title,
      category: template.category,
      status: template.status,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody ?? "",
    });
    setTemplateDialogOpen(true);
  }

  async function submitTemplate(event: React.FormEvent) {
    event.preventDefault();
    const dto = {
      ...templateForm,
      textBody: templateForm.textBody || undefined,
    };

    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, dto });
    } else {
      await createTemplate.mutateAsync(dto);
    }
    setTemplateDialogOpen(false);
  }

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    await queueEmailMutation.mutateAsync({
      recipientEmail: emailForm.recipientEmail,
      recipientName: emailForm.recipientName || undefined,
      templateId: emailForm.templateId || undefined,
      subject: emailForm.subject || undefined,
      htmlBody: emailForm.htmlBody || undefined,
      textBody: emailForm.textBody || undefined,
    });
    setEmailDialogOpen(false);
  }

  async function patchRule(
    rule: NotificationRule,
    dto: Parameters<typeof updateRule.mutateAsync>[0]["dto"],
  ) {
    await updateRule.mutateAsync({
      id: rule.id,
      dto,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-200">Notification Center</p>
          <h1 className="mt-2 text-3xl font-black">مرکز اعلان‌ها</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            همه ماژول‌ها باید ارسال ایمیل و اعلان را از این مرکز انجام دهند.
            کانال فعلی ایمیل است و ساختار برای SMS، Teams و Push قابل توسعه است.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEmailDialogOpen(true)} className="gap-2">
            <Send size={17} />
            ایمیل جدید
          </Button>
          <Button
            variant="secondary"
            onClick={() => processQueue.mutate()}
            disabled={processQueue.isPending}
            className="gap-2"
          >
            <Play size={17} />
            پردازش صف
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <StatCard title="SMTP فعال" value={stats?.smtpCount ?? 0} />
        <StatCard title="قالب‌ها" value={stats?.templateCount ?? 0} />
        <StatCard title="در انتظار" value={stats?.pending ?? 0} tone="amber" />
        <StatCard title="ارسال شده" value={stats?.sent ?? 0} tone="emerald" />
        <StatCard title="ناموفق" value={stats?.failed ?? 0} tone="rose" />
      </div>

      {message && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-5">
        {[
          { id: "smtp" as const, label: "SMTP", icon: Server },
          { id: "templates" as const, label: "قالب‌ها", icon: Mail },
          { id: "rules" as const, label: "قوانین", icon: BellRing },
          { id: "queue" as const, label: "صف ایمیل", icon: Send },
          { id: "reports" as const, label: "گزارش", icon: BellRing },
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

      {tab === "smtp" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateSmtp} className="gap-2">
              <Plus size={17} />
              افزودن SMTP
            </Button>
          </div>
          <DataTable
            data={smtpServers}
            columns={[
              {
                key: "name",
                title: "سرور",
                render: (server) => (
                  <div>
                    <div className="font-black">{server.name}</div>
                    <div className="mt-1 text-xs text-slate-400" dir="ltr">
                      {server.host}:{server.port}
                    </div>
                  </div>
                ),
              },
              {
                key: "senderEmail",
                title: "فرستنده",
              },
              {
                key: "encryption",
                title: "رمزنگاری",
                render: (server) => encryptionLabels[server.encryption],
              },
              {
                key: "status",
                title: "وضعیت",
                render: (server) => (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      server.isActive
                        ? "bg-emerald-400/10 text-emerald-200"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {server.isPrimary ? "اصلی · " : ""}
                    {server.isActive ? "فعال" : "غیرفعال"}
                  </span>
                ),
              },
              {
                key: "test",
                title: "تست",
                render: (server) => (
                  <div className="flex items-center gap-2">
                    {server.lastTestStatus === "success" ? (
                      <CheckCircle2 className="text-emerald-300" size={18} />
                    ) : server.lastTestStatus === "failed" ? (
                      <XCircle className="text-rose-300" size={18} />
                    ) : null}
                    <span className="text-xs text-slate-400">
                      {server.lastTestStatus || "-"}
                    </span>
                  </div>
                ),
              },
              {
                key: "actions",
                title: "عملیات",
                render: (server) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditSmtp(server)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={testSmtp.isPending}
                      onClick={async () => {
                        const result = await testSmtp.mutateAsync({
                          id: server.id,
                          dto: { recipientEmail: testRecipient || undefined },
                        });
                        setMessage(
                          result.ok
                            ? "تست SMTP موفق بود."
                            : `تست SMTP ناموفق بود: ${result.error}`,
                        );
                      }}
                    >
                      تست
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deleteSmtp.isPending}
                      onClick={() => deleteSmtp.mutate(server.id)}
                    >
                      حذف
                    </Button>
                  </div>
                ),
              },
            ]}
          />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <label className="mb-2 block text-sm font-bold text-slate-200">
              ایمیل گیرنده تست
            </label>
            <Input
              value={testRecipient}
              onChange={(event) => setTestRecipient(event.target.value)}
              placeholder="it@company.local"
            />
          </div>
        </section>
      )}

      {tab === "templates" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateTemplate} className="gap-2">
              <Plus size={17} />
              افزودن قالب
            </Button>
          </div>
          <DataTable
            data={templates}
            columns={[
              { key: "title", title: "عنوان" },
              { key: "key", title: "کلید" },
              {
                key: "category",
                title: "دسته",
                render: (template) =>
                  templateCategories.find((item) => item.id === template.category)
                    ?.label ?? template.category,
              },
              {
                key: "status",
                title: "وضعیت",
                render: (template) => templateStatusLabels[template.status],
              },
              {
                key: "actions",
                title: "عملیات",
                render: (template) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditTemplate(template)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deleteTemplate.isPending}
                      onClick={() => deleteTemplate.mutate(template.id)}
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

      {tab === "rules" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">
            هر ماژول فقط رویداد را به مرکز اعلان اعلام می‌کند. روشن یا خاموش
            بودن کانال‌ها از این بخش کنترل می‌شود.
          </div>
          <DataTable
            data={rules}
            columns={[
              {
                key: "title",
                title: "رویداد",
                render: (rule) => (
                  <div>
                    <div className="font-black">{rule.title}</div>
                    <div className="mt-1 text-xs text-slate-400" dir="ltr">
                      {rule.eventKey}
                    </div>
                    {rule.description && (
                      <div className="mt-1 text-xs text-slate-500">
                        {rule.description}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "moduleKey",
                title: "ماژول",
                render: (rule) => rule.moduleKey ?? "-",
              },
              {
                key: "isActive",
                title: "فعال",
                render: (rule) => (
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    disabled={updateRule.isPending}
                    onChange={(event) =>
                      void patchRule(rule, { isActive: event.target.checked })
                    }
                  />
                ),
              },
              {
                key: "portalEnabled",
                title: "پرتال",
                render: (rule) => (
                  <input
                    type="checkbox"
                    checked={rule.portalEnabled}
                    disabled={updateRule.isPending}
                    onChange={(event) =>
                      void patchRule(rule, {
                        portalEnabled: event.target.checked,
                      })
                    }
                  />
                ),
              },
              {
                key: "emailEnabled",
                title: "ایمیل",
                render: (rule) => (
                  <input
                    type="checkbox"
                    checked={rule.emailEnabled}
                    disabled={updateRule.isPending}
                    onChange={(event) =>
                      void patchRule(rule, { emailEnabled: event.target.checked })
                    }
                  />
                ),
              },
              {
                key: "emailTemplateId",
                title: "قالب ایمیل",
                render: (rule) => (
                  <select
                    value={rule.emailTemplateId ?? ""}
                    disabled={updateRule.isPending}
                    onChange={(event) =>
                      void patchRule(rule, {
                        emailTemplateId: event.target.value || null,
                      })
                    }
                    className="min-w-48 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="">قالب پیش‌فرض رویداد</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                key: "priority",
                title: "اولویت",
                render: (rule) => (
                  <Input
                    type="number"
                    min={0}
                    value={String(rule.priority)}
                    disabled={updateRule.isPending}
                    onChange={(event) =>
                      void patchRule(rule, {
                        priority: Number(event.target.value || 100),
                      })
                    }
                    className="w-24"
                  />
                ),
              },
            ]}
          />
        </section>
      )}

      {tab === "queue" && (
        <DataTable
          data={queue}
          columns={[
            { key: "recipientEmail", title: "گیرنده" },
            { key: "subject", title: "موضوع" },
            {
              key: "status",
              title: "وضعیت",
              render: (item) => statusLabels[item.status],
            },
            {
              key: "retry",
              title: "تلاش",
              render: (item) => `${item.retryCount}/${item.maxRetry}`,
            },
            {
              key: "smtp",
              title: "SMTP",
              render: (item) => item.smtpServer?.name ?? "-",
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
            {
              key: "actions",
              title: "عملیات",
              render: (item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={sendQueued.isPending || item.status === "SENT"}
                    onClick={() => sendQueued.mutate(item.id)}
                  >
                    ارسال
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={cancelQueued.isPending}
                    onClick={() => cancelQueued.mutate(item.id)}
                  >
                    لغو
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {tab === "reports" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm leading-7 text-slate-300">
          گزارش‌های پایه از کارت‌های بالای صفحه قابل مشاهده است. گزارش‌های
          پیشرفته مثل نرخ تحویل روزانه، بیشترین قالب‌های استفاده‌شده و خروجی
          Excel/PDF را در فاز توسعه بعدی اضافه می‌کنیم.
        </div>
      )}

      <Dialog
        open={smtpDialogOpen}
        onOpenChange={setSmtpDialogOpen}
        title={editingSmtp ? "ویرایش SMTP" : "افزودن SMTP"}
        className="max-w-4xl"
      >
        <form onSubmit={submitSmtp} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={smtpForm.name} onChange={(event) => setSmtpForm((form) => ({ ...form, name: event.target.value }))} placeholder="نام سرور" />
            <Input value={smtpForm.host} onChange={(event) => setSmtpForm((form) => ({ ...form, host: event.target.value }))} placeholder="Host" dir="ltr" />
            <Input type="number" value={smtpForm.port} onChange={(event) => setSmtpForm((form) => ({ ...form, port: event.target.value }))} placeholder="Port" />
            <select value={smtpForm.encryption} onChange={(event) => setSmtpForm((form) => ({ ...form, encryption: event.target.value as SmtpEncryption }))} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white">
              {Object.entries(encryptionLabels).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
            <Input value={smtpForm.username} onChange={(event) => setSmtpForm((form) => ({ ...form, username: event.target.value }))} placeholder="Username" dir="ltr" />
            <Input type="password" value={smtpForm.password} onChange={(event) => setSmtpForm((form) => ({ ...form, password: event.target.value }))} placeholder="Password" />
            <Input value={smtpForm.senderName} onChange={(event) => setSmtpForm((form) => ({ ...form, senderName: event.target.value }))} placeholder="نام فرستنده" />
            <Input value={smtpForm.senderEmail} onChange={(event) => setSmtpForm((form) => ({ ...form, senderEmail: event.target.value }))} placeholder="ایمیل فرستنده" dir="ltr" />
            <Input value={smtpForm.replyTo} onChange={(event) => setSmtpForm((form) => ({ ...form, replyTo: event.target.value }))} placeholder="Reply-To" dir="ltr" />
            <Input type="number" value={smtpForm.priority} onChange={(event) => setSmtpForm((form) => ({ ...form, priority: event.target.value }))} placeholder="اولویت" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
              <span>فعال باشد</span>
              <input type="checkbox" checked={smtpForm.isActive} onChange={(event) => setSmtpForm((form) => ({ ...form, isActive: event.target.checked }))} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm">
              <span>SMTP اصلی باشد</span>
              <input type="checkbox" checked={smtpForm.isPrimary} onChange={(event) => setSmtpForm((form) => ({ ...form, isPrimary: event.target.checked }))} />
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createSmtp.isPending || updateSmtp.isPending}>
              ذخیره SMTP
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        title={editingTemplate ? "ویرایش قالب" : "افزودن قالب"}
        className="max-w-5xl"
      >
        <form onSubmit={submitTemplate} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={templateForm.key} onChange={(event) => setTemplateForm((form) => ({ ...form, key: event.target.value }))} placeholder="کلید قالب مثل backup-success" dir="ltr" />
            <Input value={templateForm.title} onChange={(event) => setTemplateForm((form) => ({ ...form, title: event.target.value }))} placeholder="عنوان" />
            <select value={templateForm.category} onChange={(event) => setTemplateForm((form) => ({ ...form, category: event.target.value as TemplateCategory }))} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white">
              {templateCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
            <select value={templateForm.status} onChange={(event) => setTemplateForm((form) => ({ ...form, status: event.target.value as TemplateStatus }))} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white">
              {Object.entries(templateStatusLabels).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <Input value={templateForm.subject} onChange={(event) => setTemplateForm((form) => ({ ...form, subject: event.target.value }))} placeholder="موضوع ایمیل، مثلا {{CompanyName}}" />
          <textarea value={templateForm.htmlBody} onChange={(event) => setTemplateForm((form) => ({ ...form, htmlBody: event.target.value }))} rows={10} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white" placeholder="HTML قالب" dir="ltr" />
          <textarea value={templateForm.textBody} onChange={(event) => setTemplateForm((form) => ({ ...form, textBody: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white" placeholder="متن ساده اختیاری" />
          <p className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-xs leading-6 text-cyan-100">
            متغیرها: {"{{UserName}}"}، {"{{PortalUrl}}"}، {"{{CompanyName}}"}، {"{{CurrentDate}}"}
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
              ذخیره قالب
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        title="ایجاد ایمیل در صف"
        className="max-w-4xl"
      >
        <form onSubmit={submitEmail} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={emailForm.recipientEmail} onChange={(event) => setEmailForm((form) => ({ ...form, recipientEmail: event.target.value }))} placeholder="ایمیل گیرنده" dir="ltr" />
            <Input value={emailForm.recipientName} onChange={(event) => setEmailForm((form) => ({ ...form, recipientName: event.target.value }))} placeholder="نام گیرنده" />
          </div>
          <select value={emailForm.templateId} onChange={(event) => setEmailForm((form) => ({ ...form, templateId: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white">
            <option value="">بدون قالب</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.title}</option>
            ))}
          </select>
          {!emailForm.templateId && (
            <>
              <Input value={emailForm.subject} onChange={(event) => setEmailForm((form) => ({ ...form, subject: event.target.value }))} placeholder="موضوع" />
              <textarea value={emailForm.htmlBody} onChange={(event) => setEmailForm((form) => ({ ...form, htmlBody: event.target.value }))} rows={8} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white" placeholder="HTML ایمیل" dir="ltr" />
              <textarea value={emailForm.textBody} onChange={(event) => setEmailForm((form) => ({ ...form, textBody: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white" placeholder="متن ساده اختیاری" />
            </>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={queueEmailMutation.isPending}>
              افزودن به صف
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
