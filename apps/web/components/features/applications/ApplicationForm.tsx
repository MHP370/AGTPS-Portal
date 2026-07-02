"use client";

import { useEffect, useState } from "react";

import {
  Application,
  CreateApplicationDto,
} from "@/lib/applications";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface Props {
  application?: Application;
  loading?: boolean;

  categories?: {
    id: string;
    name: string;
  }[];

  onSubmit: (dto: CreateApplicationDto) => Promise<void>;
}

export function ApplicationForm({
  application,
  loading = false,
  categories = [],
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // ✅ وقتی edit هست
useEffect(() => {
  if (!application) return;

  setTitle(application.title);
  setKey(application.key);
  setSlug(application.slug);
  setCategoryId(application.category.id);
}, [application]);
  // ✅ وقتی create هست (auto select)
  useEffect(() => {
    if (!application && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, application]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      title,
      key,
      slug,
      categoryId,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">

      <FormField label="عنوان" required>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>

      <FormField label="Key" required>
        <Input value={key} onChange={(e) => setKey(e.target.value)} />
      </FormField>

      <FormField label="Slug" required>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
      </FormField>

      {/* CATEGORY */}
      <FormField label="دسته‌بندی" required>
        <select
          value={categoryId || ""}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg bg-slate-800 p-2"
        >
          <option value="">انتخاب دسته‌بندی</option>

          {categories.length === 0 ? (
            <option disabled>در حال بارگذاری...</option>
          ) : (
            categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
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
