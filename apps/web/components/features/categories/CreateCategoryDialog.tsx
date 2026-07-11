"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

import { useCreateCategory } from "@/hooks/useCategories";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
}: Props) {
  const createCategory = useCreateCategory();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

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
      await createCategory.mutateAsync({
        name: trimmedName,
        slug: trimmedSlug,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ایجاد دسته‌بندی انجام نشد.",
      );
      return;
    }

    setName("");
    setSlug("");

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="افزودن دسته‌بندی"
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
          <Button type="submit" disabled={createCategory.isPending}>
            {createCategory.isPending ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
