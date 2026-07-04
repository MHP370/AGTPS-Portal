"use client";

import { useState } from "react";

import {
  Application,
  type Category,
  type CreateApplicationDto,
} from "@/lib/applications";

import { useUpdateApplication } from "@/hooks/useApplications";

import { Dialog } from "@/components/ui/Dialog";

import { ApplicationForm } from "./ApplicationForm";

interface Props {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
}

export function EditApplicationDialog({
  application,
  open,
  onOpenChange,
  categories = [],
}: Props) {
  const [error, setError] = useState("");
  const updateApplication = useUpdateApplication();

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setError("");
  }

  if (!open || !application) return null;

  const selectedApplication = application;

  async function handleSubmit(dto: CreateApplicationDto) {
    setError("");

    try {
      await updateApplication.mutateAsync({
        id: selectedApplication.id,
        dto,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ویرایش سامانه انجام نشد.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="ویرایش سامانه"
    >
      <ApplicationForm
        application={selectedApplication}
        categories={categories}
        loading={updateApplication.isPending}
        error={error}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
