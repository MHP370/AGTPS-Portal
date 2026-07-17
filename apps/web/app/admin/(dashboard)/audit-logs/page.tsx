"use client";

import { ShieldCheck } from "lucide-react";

import { DataTable } from "@/components/ui/DataTable";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import type { AuditAction } from "@/lib/audit-logs";

const actionLabels: Record<AuditAction, string> = {
  LOGIN_SUCCESS: "ورود موفق",
  LOGIN_FAILED: "ورود ناموفق",
  USER_UPDATED: "ویرایش کاربر",
  PASSWORD_CHANGED: "تغییر رمز",
  BACKUP_CREATED: "ساخت بکاپ",
  BACKUP_DELETED: "حذف بکاپ",
  BACKUP_RESTORED: "Restore بکاپ",
  NOTIFICATION_RULE_UPDATED: "تغییر قانون اعلان",
  DIRECT_MANAGER_CREATED: "تعریف مدیر",
  DIRECT_MANAGER_UPDATED: "ویرایش مدیر",
  DIRECT_MANAGER_DELETED: "حذف مدیر",
  FORBIDDEN_WORD_CREATED: "افزودن کلمه ممنوعه",
  FORBIDDEN_WORD_UPDATED: "ویرایش کلمه ممنوعه",
  FORBIDDEN_WORD_DELETED: "حذف کلمه ممنوعه",
};

export default function AuditLogsPage() {
  const { data: logs = [] } = useAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-cyan-200">Audit Log</p>
        <h1 className="mt-2 text-3xl font-black">گزارش رویدادها</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          عملیات حساس مدیریتی در این بخش ثبت می‌شود. محتوای پیام‌ها، رمزها و
          داده‌های محرمانه در Audit ذخیره نمی‌شود.
        </p>
      </div>

      <DataTable
        data={logs}
        columns={[
          {
            key: "action",
            title: "عملیات",
            render: (item) => (
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-100">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <div className="font-black">
                    {actionLabels[item.action] ?? item.action}
                  </div>
                  <div className="mt-1 text-xs text-slate-400" dir="ltr">
                    {item.action}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "actor",
            title: "کاربر",
            render: (item) =>
              item.actorUsername || item.actorEmail || item.actorUserId || "-",
          },
          {
            key: "entity",
            title: "موجودیت",
            render: (item) => (
              <span dir="ltr">
                {item.entityType}
                {item.entityId ? ` / ${item.entityId.slice(0, 8)}` : ""}
              </span>
            ),
          },
          {
            key: "summary",
            title: "خلاصه",
            render: (item) => item.summary || "-",
          },
          {
            key: "ipAddress",
            title: "IP",
            render: (item) => <span dir="ltr">{item.ipAddress || "-"}</span>,
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
    </div>
  );
}
