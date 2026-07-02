"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { SearchBox } from "@/components/ui/SearchBox";

import { Application } from "@/lib/applications";
import { CreateApplicationDialog } from "./CreateApplicationDialog";

interface Props {
  applications: Application[];
}

export function ApplicationsTable({
  applications,
}: Props) {
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

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

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
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
                  <div className="font-semibold">{app.title}</div>

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
              render: (app) => app.networkType,
            },
            {
              key: "status",
              title: "وضعیت",
              render: (app) => (
                <span className="rounded-lg bg-emerald-900/30 px-3 py-1 text-xs text-emerald-300">
                  {app.status}
                </span>
              ),
            },
            {
              key: "actions",
              title: "عملیات",
              render: () => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                  >
                    ویرایش
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                  >
                    حذف
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <CreateApplicationDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
      />
    </>
  );
}
