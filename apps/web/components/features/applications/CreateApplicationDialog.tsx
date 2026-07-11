"use client";

import { useState } from "react";

import { useCreateApplication } from "@/hooks/useApplications";
import { type Category, type CreateApplicationDto } from "@/lib/applications";

import { Dialog } from "@/components/ui/Dialog";

import { ApplicationForm } from "./ApplicationForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
}

export function CreateApplicationDialog({
  open,
  onOpenChange,
  categories = [],
}: Props) {
  const [error, setError] = useState("");
  const createApplication = useCreateApplication();

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setError("");
  }

  async function handleSubmit(dto: CreateApplicationDto) {
    setError("");

    try {
      await createApplication.mutateAsync(dto);
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ایجاد سامانه انجام نشد.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="افزودن سامانه"
    >
      <ApplicationForm
        key={open ? "create-application-open" : "create-application-closed"}
        categories={categories}
        loading={createApplication.isPending}
        error={error}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
