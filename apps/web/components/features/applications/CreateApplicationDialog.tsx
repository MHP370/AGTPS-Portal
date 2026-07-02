"use client";

import { useCreateApplication } from "@/hooks/useApplications";

import { Dialog } from "@/components/ui/Dialog";

import { ApplicationForm } from "./ApplicationForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // 🔥 اضافه شد
  categories?: {
    id: string;
    name: string;
  }[];
}

export function CreateApplicationDialog({
  open,
  onOpenChange,
  categories = [], // 🔥 مهم
}: Props) {
  const createApplication = useCreateApplication();

  async function handleSubmit(dto: any) {
    await createApplication.mutateAsync(dto);

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="افزودن سامانه"
    >
      <ApplicationForm
        categories={categories}   // ✅ حالا درست شد
        loading={createApplication.isPending}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
