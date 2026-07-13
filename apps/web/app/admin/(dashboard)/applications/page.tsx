"use client";

import { useState } from "react";

import { useApplications } from "@/hooks/useApplications";
import { useCategories } from "@/hooks/useCategories";
import { useSites } from "@/hooks/useSites";

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

  const {
    data: sites = [],
    isLoading: sitesLoading,
    isError: sitesError,
    error: sitesLoadError,
    refetch: refetchSites,
  } = useSites();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [pageMessage, setPageMessage] = useState("");

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  if (appsLoading || catLoading || sitesLoading) {
    return (
      <div className="py-10 text-center">
        در حال بارگذاری...
      </div>
    );
  }

  if (appsError || categoriesError || sitesError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">
          بارگذاری اطلاعات سامانه‌ها انجام نشد
        </h1>

        <p className="text-sm text-red-200/80">
          {(applicationsError as Error | undefined)?.message ||
            (categoryError as Error | undefined)?.message ||
            (sitesLoadError as Error | undefined)?.message ||
            "ارتباط با سرویس برقرار نشد."}
        </p>

        <Button
          variant="secondary"
          onClick={() => {
            void refetchApplications();
            void refetchCategories();
            void refetchSites();
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
        onCreate={() => {
          if (categories.length === 0) {
            setPageMessage(
              "برای افزودن سامانه، ابتدا حداقل یک دسته‌بندی بسازید.",
            );
            return;
          }

          setPageMessage("");
          setOpenCreate(true);
        }}
        onEdit={(application) => {
          setPageMessage("");
          setSelectedApplication(application);
          setOpenEdit(true);
        }}
      />

      {pageMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {pageMessage}
        </div>
      )}

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
        sites={sites}
      />
    </div>
  );
}
