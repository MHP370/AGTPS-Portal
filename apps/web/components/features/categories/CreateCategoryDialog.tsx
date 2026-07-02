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

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    await createCategory.mutateAsync({
      name,
      slug,
    });

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
            ذخیره
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
