"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApplicationDialog({
  open,
  onOpenChange,
}: Props) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [slug, setSlug] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();

    console.log({
      title,
      key,
      slug,
    });

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="افزودن سامانه"
    >
      <form
        onSubmit={submit}
        className="space-y-5"
      >
        <FormField
          label="عنوان"
          required
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField
          label="Key"
          required
        >
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </FormField>

        <FormField
          label="Slug"
          required
        >
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>

          <Button type="submit">
            ذخیره
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
