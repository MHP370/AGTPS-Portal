"use client";

import { useState } from "react";

import {
  Application,
  type Category,
  type CreateApplicationDto,
} from "@/lib/applications";
import type { Site } from "@/lib/sites";

import { useUpdateApplication } from "@/hooks/useApplications";

import { Dialog } from "@/components/ui/Dialog";

import { ApplicationForm } from "./ApplicationForm";
import { ApplicationSiteUrls } from "./ApplicationSiteUrls";

interface Props {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
  sites?: Site[];
}

export function EditApplicationDialog({
  application,
  open,
  onOpenChange,
  categories = [],
  sites = [],
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

      <div className="mt-6">
        <ApplicationSiteUrls
          application={selectedApplication}
          sites={sites}
        />
      </div>
    </Dialog>
  );
}
