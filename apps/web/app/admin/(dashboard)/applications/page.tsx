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
  const {
    data: categories = [],
    isLoading: catLoading,
  } = useCategories();

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

      <ApplicationsTable
        applications={data}
        onCreate={() => setOpenCreate(true)}
        onEdit={(application) => {
          setSelectedApplication(application);
          setOpenEdit(true);
        }}
      />

      <CreateApplicationDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        categories={categories}
      />

      <EditApplicationDialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) setSelectedApplication(null);
        }}
        application={selectedApplication}
        categories={categories}
      />
    </div>
  );
}
