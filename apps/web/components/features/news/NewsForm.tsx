"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useSites } from "@/hooks/useSites";
import type { CreateNewsDto, NewsItem } from "@/lib/news";

interface NewsFormProps {
  news?: NewsItem;
  loading?: boolean;
  error?: string;
  onSubmit: (dto: CreateNewsDto) => Promise<void>;
}

export function NewsForm({
  news,
  loading = false,
  error,
  onSubmit,
}: NewsFormProps) {
  const { data: sites = [] } = useSites();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [siteId, setSiteId] = useState("");
  const [image, setImage] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (news) {
        setTitle(news.title);
        setBody(news.body);
        setCategory(news.category ?? "");
        setSiteId(news.siteId);
        setImage(news.image ?? "");
        setAttachmentUrl(news.attachmentUrl ?? "");
        setPublished(news.published);
        setFormError("");
        return;
      }

      setTitle("");
      setBody("");
      setCategory("");
      setSiteId("");
      setImage("");
      setAttachmentUrl("");
      setPublished(true);
      setFormError("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [news]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !body.trim() || !siteId) {
      setFormError("عنوان، متن خبر و سایت الزامی هستند.");
      return;
    }

    setFormError("");

    await onSubmit({
      title: title.trim(),
      body: body.trim(),
      category: category.trim() || undefined,
      siteId,
      image: image.trim() || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
      published,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {(error || formError) && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error || formError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="عنوان خبر" required>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="سایت" required>
          <select
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
            disabled={loading}
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">انتخاب سایت</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="دسته‌بندی خبر">
        <Input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={loading}
          placeholder="مثلا فناوری اطلاعات، منابع انسانی، عملیات"
        />
      </FormField>

      <FormField label="تصویر خبر">
        <FileUploadField
          value={image}
          onChange={setImage}
          folder="news"
          disabled={loading}
          placeholder="/uploads/news/image.png"
        />
      </FormField>

      <FormField label="پیوست خبر">
        <FileUploadField
          value={attachmentUrl}
          onChange={setAttachmentUrl}
          folder="news"
          accept=".pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
          disabled={loading}
          placeholder="/uploads/news/attachment.pdf"
        />
      </FormField>

      <FormField label="متن خبر" required>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={loading}
          rows={6}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <div className="flex items-center justify-between gap-4">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            disabled={loading}
          />
          خبر منتشر شود
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "در حال ذخیره..." : "ذخیره خبر"}
        </Button>
      </div>
    </form>
  );
}
