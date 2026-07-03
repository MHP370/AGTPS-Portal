"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { useUpdateSite } from "@/hooks/useSites";
import type { CreateSiteDto, Site } from "@/lib/sites";
import { SiteForm } from "./SiteForm";

interface Props {
  site: Site | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSiteDialog({
  site,
  open,
  onOpenChange,
}: Props) {
  const [error, setError] = useState("");
  const updateSite = useUpdateSite();

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setError("");
  }

  if (!open || !site) return null;

  async function handleSubmit(dto: CreateSiteDto) {
    setError("");

    try {
      await updateSite.mutateAsync({
        id: site.id,
        dto,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ویرایش سایت انجام نشد.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="ویرایش سایت"
    >
      <SiteForm
        site={site}
        loading={updateSite.isPending}
        error={error}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
