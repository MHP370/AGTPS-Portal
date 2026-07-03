"use client";

import { useState, useEffect } from "react";

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

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (!category) return;

    setName(category.name);
    setSlug(category.slug);
  }, [category]);

  if (!category) return null;

  const currentCategory = category;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    await updateCategory.mutateAsync({
      id: currentCategory.id,
      dto: {
        name,
        slug,
      },
    });

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open && !!category}
      onOpenChange={onOpenChange}
      title="ویرایش دسته‌بندی"
    >
      <form onSubmit={submit} className="space-y-5">
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
          <Button type="submit">
            ذخیره تغییرات
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
