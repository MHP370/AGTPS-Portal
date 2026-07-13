"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

import { Category } from "@/lib/categories";

import { useUpdateCategory } from "@/hooks/useCategories";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
}: Props) {
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setName(category?.name ?? "");
      setSlug(category?.slug ?? "");
      setSortOrder(String(category?.sortOrder ?? 0));
      setIsActive(category?.isActive ?? true);
      setError("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [category]);

  if (!category) return null;

  const selectedCategory = category;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const parsedSortOrder = Number(sortOrder || 0);

    if (!trimmedName || !trimmedSlug) {
      setError("نام و اسلاگ الزامی هستند.");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setError("ترتیب نمایش باید عدد صحیح صفر یا بزرگ‌تر باشد.");
      return;
    }

    setError("");

    try {
      await updateCategory.mutateAsync({
        id: selectedCategory.id,
        dto: {
          name: trimmedName,
          slug: trimmedSlug,
          sortOrder: parsedSortOrder,
          isActive,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ویرایش دسته‌بندی انجام نشد.",
      );
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open && !!category}
      onOpenChange={onOpenChange}
      title="ویرایش دسته‌بندی"
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        <FormField label="نام" required>
          <Input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
        </FormField>

        <FormField label="اسلاگ" required>
          <Input
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value)
            }
          />
        </FormField>

        <FormField label="ترتیب نمایش">
          <Input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={updateCategory.isPending}
          />
        </FormField>

        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={updateCategory.isPending}
          />
          فعال باشد
        </label>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateCategory.isPending}>
            {updateCategory.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
