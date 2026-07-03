"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { useCreateSite } from "@/hooks/useSites";
import type { CreateSiteDto } from "@/lib/sites";
import { SiteForm } from "./SiteForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSiteDialog({
  open,
  onOpenChange,
}: Props) {
  const [error, setError] = useState("");
  const createSite = useCreateSite();

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setError("");
  }

  async function handleSubmit(dto: CreateSiteDto) {
    setError("");

    try {
      await createSite.mutateAsync(dto);
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ایجاد سایت انجام نشد.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="افزودن سایت"
    >
      <SiteForm
        loading={createSite.isPending}
        error={error}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
