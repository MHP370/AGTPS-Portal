"use client";

import { useState } from "react";

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
  const [error, setError] = useState("");

  if (!category) return null;

  const selectedCategory = category;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName || !trimmedSlug) {
      setError("نام و اسلاگ الزامی هستند.");
      return;
    }

    setError("");

    try {
      await updateCategory.mutateAsync({
        id: selectedCategory.id,
        dto: {
          name: trimmedName,
          slug: trimmedSlug,
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

        <div className="flex justify-end">
          <Button type="submit" disabled={updateCategory.isPending}>
            {updateCategory.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
