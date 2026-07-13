"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  Application,
  Category,
  CreateApplicationDto,
} from "@/lib/applications";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { IconPicker } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/Input";

const statusOptions = [
  { value: "ACTIVE", label: "فعال" },
  { value: "MAINTENANCE", label: "در حال نگهداری" },
  { value: "OFFLINE", label: "آفلاین" },
  { value: "DISABLED", label: "غیرفعال" },
];

const networkOptions = [
  { value: "INTRANET", label: "اینترانت" },
  { value: "INTERNET", label: "اینترنت" },
  { value: "VPN", label: "VPN" },
];

interface Props {
  application?: Application;
  loading?: boolean;
  error?: string;
  categories?: Category[];
  onSubmit: (dto: CreateApplicationDto) => Promise<void>;
}

export function ApplicationForm({
  application,
  loading = false,
  error,
  categories = [],
  onSubmit,
}: Props) {
  const initialCategoryId =
    application?.category?.id ?? categories[0]?.id ?? "";
  const [title, setTitle] = useState(application?.title ?? "");
  const [key, setKey] = useState(application?.key ?? "");
  const [slug, setSlug] = useState(application?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [status, setStatus] = useState(application?.status || "ACTIVE");
  const [networkType, setNetworkType] = useState(
    application?.networkType || "INTRANET",
  );
  const [description, setDescription] = useState(
    application?.description ?? "",
  );
  const [icon, setIcon] = useState(application?.icon ?? "MonitorCog");
  const [color, setColor] = useState(application?.color ?? "#0891b2");
  const [version, setVersion] = useState(application?.version ?? "");
  const [owner, setOwner] = useState(application?.owner ?? "");
  const [supportDepartment, setSupportDepartment] = useState(
    application?.supportDepartment ?? "",
  );
  const [guideUrl, setGuideUrl] = useState(application?.guideUrl ?? "");
  const [sortOrder, setSortOrder] = useState(
    String(application?.sortOrder ?? 0),
  );
  const [isActive, setIsActive] = useState(application?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(
    application?.isFeatured ?? false,
  );
  const [isNew, setIsNew] = useState(application?.isNew ?? false);
  const [openInNewTab, setOpenInNewTab] = useState(
    application?.openInNewTab ?? true,
  );
  const [formError, setFormError] = useState("");

  const categoryExists = useMemo(
    () => categories.some((category) => category.id === categoryId),
    [categories, categoryId],
  );
  const effectiveCategoryId =
    categoryId && categoryExists ? categoryId : categories[0]?.id ?? "";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTitle(application?.title ?? "");
      setKey(application?.key ?? "");
      setSlug(application?.slug ?? "");
      setCategoryId(application?.category?.id ?? categories[0]?.id ?? "");
      setStatus(application?.status || "ACTIVE");
      setNetworkType(application?.networkType || "INTRANET");
      setDescription(application?.description ?? "");
      setIcon(application?.icon ?? "MonitorCog");
      setColor(application?.color ?? "#0891b2");
      setVersion(application?.version ?? "");
      setOwner(application?.owner ?? "");
      setSupportDepartment(application?.supportDepartment ?? "");
      setGuideUrl(application?.guideUrl ?? "");
      setSortOrder(String(application?.sortOrder ?? 0));
      setIsActive(application?.isActive ?? true);
      setIsFeatured(application?.isFeatured ?? false);
      setIsNew(application?.isNew ?? false);
      setOpenInNewTab(application?.openInNewTab ?? true);
      setFormError("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [application, categories]);

  function resetCreateForm() {
    setTitle("");
    setKey("");
    setSlug("");
    setCategoryId(categories[0]?.id ?? "");
    setStatus("ACTIVE");
    setNetworkType("INTRANET");
    setDescription("");
    setIcon("MonitorCog");
    setColor("#0891b2");
    setVersion("");
    setOwner("");
    setSupportDepartment("");
    setGuideUrl("");
    setSortOrder("0");
    setIsActive(true);
    setIsFeatured(false);
    setIsNew(false);
    setOpenInNewTab(true);
    setFormError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedKey = key.trim();
    const trimmedSlug = slug.trim();
    const parsedSortOrder = Number(sortOrder || 0);

    if (!trimmedTitle || !trimmedKey || !trimmedSlug) {
      setFormError("عنوان، Key و Slug الزامی هستند.");
      return;
    }

    if (!effectiveCategoryId) {
      setFormError("لطفاً یک دسته‌بندی معتبر انتخاب کنید.");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setFormError("ترتیب نمایش باید عدد صحیح صفر یا بزرگ‌تر باشد.");
      return;
    }

    setFormError("");

    await onSubmit({
      title: trimmedTitle,
      key: trimmedKey,
      slug: trimmedSlug,
      categoryId: effectiveCategoryId,
      status,
      networkType,
      description: description.trim() || undefined,
      icon: icon.trim() || undefined,
      color: color.trim() || undefined,
      version: version.trim() || undefined,
      owner: owner.trim() || undefined,
      supportDepartment: supportDepartment.trim() || undefined,
      guideUrl: guideUrl.trim() || undefined,
      sortOrder: parsedSortOrder,
      isActive,
      isFeatured,
      isNew,
      openInNewTab,
    });

    if (!application) {
      resetCreateForm();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {(error || formError) && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error || formError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Slug" required>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="دسته‌بندی" required>
          <select
            value={effectiveCategoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || categories.length === 0}
          >
            <option value="">انتخاب دسته‌بندی</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive === false ? " (غیرفعال)" : ""}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="توضیحات">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <FormField label="آیکن سامانه">
        <IconPicker
          value={icon}
          onChange={setIcon}
          folder="icons"
          disabled={loading}
        />
      </FormField>

      <FormField label="رنگ کارت و آیکن">
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={loading}
        />
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

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="نسخه">
          <Input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="مالک سامانه">
          <Input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="واحد پشتیبان">
          <Input
            value={supportDepartment}
            onChange={(e) => setSupportDepartment(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="لینک راهنما">
          <Input
            value={guideUrl}
            onChange={(e) => setGuideUrl(e.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <FormField label="ترتیب نمایش">
        <Input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          disabled={loading}
        />
      </FormField>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={loading}
          />
          فعال باشد
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={openInNewTab}
            onChange={(e) => setOpenInNewTab(e.target.checked)}
            disabled={loading}
          />
          در تب جدید باز شود
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            disabled={loading}
          />
          سامانه ویژه
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
            disabled={loading}
          />
          سامانه جدید
        </label>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || !effectiveCategoryId || categories.length === 0}
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
