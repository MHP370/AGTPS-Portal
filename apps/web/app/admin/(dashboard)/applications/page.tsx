"use client";

import { useState } from "react";

import { useApplications } from "@/hooks/useApplications";
import { useCategories } from "@/hooks/useCategories";

import { ApplicationsTable } from "@/components/features/applications/ApplicationsTable";
import { CreateApplicationDialog } from "@/components/features/applications/CreateApplicationDialog";
import { EditApplicationDialog } from "@/components/features/applications/EditApplicationDialog";
import { Button } from "@/components/ui/Button";

import { Application } from "@/lib/applications";

export default function ApplicationsPage() {
  const {
    data = [],
    isLoading: appsLoading,
    isError: appsError,
    error: applicationsError,
    refetch: refetchApplications,
  } = useApplications();

  const {
    data: categories = [],
    isLoading: catLoading,
    isError: categoriesError,
    error: categoryError,
    refetch: refetchCategories,
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

  if (appsError || categoriesError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">
          بارگذاری اطلاعات سامانه‌ها انجام نشد
        </h1>

        <p className="text-sm text-red-200/80">
          {(applicationsError as Error | undefined)?.message ||
            (categoryError as Error | undefined)?.message ||
            "ارتباط با سرویس برقرار نشد."}
        </p>

        <Button
          variant="secondary"
          onClick={() => {
            void refetchApplications();
            void refetchCategories();
          }}
        >
          تلاش دوباره
        </Button>
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
