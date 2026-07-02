"use client";

import { useState } from "react";

import { useApplications } from "@/hooks/useApplications";
import { useCategories } from "@/hooks/useCategories";

import { ApplicationsTable } from "@/components/features/applications/ApplicationsTable";
import { CreateApplicationDialog } from "@/components/features/applications/CreateApplicationDialog";
import { EditApplicationDialog } from "@/components/features/applications/EditApplicationDialog";

import { Application } from "@/lib/applications";

export default function ApplicationsPage() {
  const { data = [], isLoading: appsLoading } = useApplications();
  const { data: categories, isLoading: catLoading } = useCategories();

  const safeCategories = categories ?? [];

  console.log("CATEGORIES:", safeCategories);
  console.log("APPLICATIONS:", data);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  if (appsLoading || catLoading) {
    return (
      <div className="py-10 text-center">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          مدیریت سامانه‌ها
        </h1>
      </div>

      <ApplicationsTable applications={data} />

      <CreateApplicationDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        categories={safeCategories}
      />

      <EditApplicationDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        application={selectedApplication}
        categories={safeCategories}
      />

    </div>
  );
}
