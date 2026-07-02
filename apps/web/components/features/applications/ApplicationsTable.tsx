"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { SearchBox } from "@/components/ui/SearchBox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { Application } from "@/lib/applications";

import { CreateApplicationDialog } from "./CreateApplicationDialog";
import { EditApplicationDialog } from "./EditApplicationDialog";

import { useDeleteApplication } from "@/hooks/useApplications";

interface Props {
  applications: Application[];
}

export function ApplicationsTable({
  applications,
}: Props) {
  const [search, setSearch] = useState("");

  const [openCreate, setOpenCreate] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  // 🟢 DELETE STATE
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deleteApplication = useDeleteApplication();

  const data = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return applications;

    return applications.filter((app) =>
      [app.title, app.key, app.category.name]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [applications, search]);

  async function handleDelete() {
    if (!selectedId) return;

    await deleteApplication.mutateAsync(selectedId);

    setOpenDelete(false);
    setSelectedId(null);
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="جستجوی سامانه..."
          />

          <Button onClick={() => setOpenCreate(true)}>
            افزودن سامانه
          </Button>
        </div>

        <DataTable
          data={data}
          columns={[
            {
              key: "title",
              title: "عنوان",
              render: (app) => (
                <div>
                  <div className="font-semibold">
                    {app.title}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {app.key}
                  </div>
                </div>
              ),
            },
            {
              key: "category",
              title: "دسته‌بندی",
              render: (app) => app.category.name,
            },
            {
              key: "network",
              title: "شبکه",
              render: (app) => (
                <span className="rounded-lg bg-sky-900/40 px-3 py-1 text-xs text-sky-300">
                  {app.networkType}
                </span>
              ),
            },
            {
              key: "status",
              title: "وضعیت",
              render: (app) => (
                <span
                  className={
                    app.status === "ACTIVE"
                      ? "rounded-lg bg-emerald-900/40 px-3 py-1 text-xs text-emerald-300"
                      : "rounded-lg bg-red-900/40 px-3 py-1 text-xs text-red-300"
                  }
                >
                  {app.status}
                </span>
              ),
            },
            {
              key: "actions",
              title: "عملیات",
              render: (app) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedApplication(app);
                      setOpenEdit(true);
                    }}
                  >
                    ویرایش
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedId(app.id);
                      setOpenDelete(true);
                    }}
                  >
                    حذف
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* CREATE */}
      <CreateApplicationDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
      />

      {/* EDIT */}
      <EditApplicationDialog
        application={selectedApplication}
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) setSelectedApplication(null);
        }}
      />

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="حذف سامانه"
        description="آیا از حذف این سامانه مطمئن هستید؟"
        loading={deleteApplication.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
