"use client";

import { type FormEvent, useMemo, useState } from "react";

import {
  type Application,
  type Category,
  type CreateApplicationDto,
} from "@/lib/applications";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

const statusOptions = [
  { value: "ACTIVE", label: "فعال" },
  { value: "INACTIVE", label: "غیرفعال" },
  { value: "MAINTENANCE", label: "در حال نگهداری" },
];

const networkOptions = [
  { value: "INTRANET", label: "اینترانت" },
  { value: "INTERNET", label: "اینترنت" },
  { value: "BOTH", label: "هر دو" },
];

interface Props {
  application?: Application;
  categories?: Category[];
  loading?: boolean;
  error?: string;
  onSubmit: (dto: CreateApplicationDto) => Promise<void>;
}

export function ApplicationForm({
  application,
  categories = [],
  loading = false,
  error,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(application?.title ?? "");
  const [key, setKey] = useState(application?.key ?? "");
  const [slug, setSlug] = useState(application?.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    application?.category?.id ?? categories[0]?.id ?? "",
  );
  const [status, setStatus] = useState(application?.status ?? "ACTIVE");
  const [networkType, setNetworkType] = useState(
    application?.networkType ?? "INTRANET",
  );
  const [formError, setFormError] = useState("");

  const categoryExists = useMemo(
    () => categories.some((category) => category.id === categoryId),
    [categories, categoryId],
  );

  async function submit(e: FormEvent) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedKey = key.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedTitle || !trimmedKey || !trimmedSlug) {
      setFormError("عنوان، Key و Slug الزامی هستند.");
      return;
    }

    if (!categoryId || !categoryExists) {
      setFormError("لطفاً یک دسته‌بندی معتبر انتخاب کنید.");
      return;
    }

    setFormError("");

    await onSubmit({
      title: trimmedTitle,
      key: trimmedKey,
      slug: trimmedSlug,
      categoryId,
      status,
      networkType,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {(error || formError) && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error || formError}
        </div>
      )}

      <FormField label="عنوان" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </FormField>

      <FormField label="Key" required>
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={loading}
        />
      </FormField>

      <FormField label="Slug" required>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={loading}
        />
      </FormField>

      <FormField label="دسته‌بندی" required>
        <select
          value={categoryId || ""}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || categories.length === 0}
        >
          <option value="">انتخاب دسته‌بندی</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="وضعیت" required>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="شبکه" required>
          <select
            value={networkType}
            onChange={(e) => setNetworkType(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {networkOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || !categoryId || categories.length === 0}
        >
          {loading
            ? "در حال ذخیره..."
            : application
              ? "ذخیره تغییرات"
              : "ایجاد سامانه"}
        </Button>
      </div>
    </form>
  );
}
