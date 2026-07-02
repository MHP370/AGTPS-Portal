"use client";

import { Application } from "@/lib/applications";

import { useUpdateApplication } from "@/hooks/useApplications";

import { Dialog } from "@/components/ui/Dialog";

import { ApplicationForm } from "./ApplicationForm";

interface Props {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditApplicationDialog({
  application,
  open,
  onOpenChange,
}: Props) {
  const updateApplication =
    useUpdateApplication();

  if (!open || !application) return null;

  async function handleSubmit(dto: any) {
    await updateApplication.mutateAsync({
      id: application.id,
      dto,
    });

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="ویرایش سامانه"
    >
      <ApplicationForm
        application={application}
        loading={updateApplication.isPending}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
