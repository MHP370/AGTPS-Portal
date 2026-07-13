"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { SearchBox } from "@/components/ui/SearchBox";

import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/lib/categories";

import { CreateCategoryDialog } from "@/components/features/categories/CreateCategoryDialog";
import { EditCategoryDialog } from "@/components/features/categories/EditCategoryDialog";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import {
  useDeleteCategory,
} from "@/hooks/useCategories";

export default function CategoriesPage() {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useCategories();

  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const filtered = data.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete() {
    if (!selectedCategory) return;

    setDeleteError("");

    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "حذف دسته‌بندی انجام نشد.",
      );
      return;
    }

    setOpenDelete(false);
    setSelectedCategory(null);
  }

  if (isLoading) {
    return (
      <div className="py-10 text-center">
        در حال بارگذاری...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">
          بارگذاری دسته‌بندی‌ها انجام نشد
        </h1>
        <p className="text-sm text-red-200/80">
          {(error as Error | undefined)?.message || "ارتباط با سرویس برقرار نشد."}
        </p>
        <Button variant="secondary" onClick={() => void refetch()}>
          تلاش دوباره
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          مدیریت دسته‌بندی‌ها
        </h1>

        <Button onClick={() => setOpenCreate(true)}>
          افزودن دسته‌بندی
        </Button>
      </div>

      {/* SEARCH */}
      {deleteError && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {deleteError}
        </div>
      )}

      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="جستجوی دسته‌بندی..."
      />

      {/* TABLE */}
      <DataTable
        data={filtered}
        columns={[
          {
            key: "name",
            title: "نام",
            render: (c: Category) => (
              <div className="font-semibold">
                {c.name}
              </div>
            ),
          },
          {
            key: "slug",
            title: "اسلاگ",
            render: (c: Category) => (
              <span className="text-slate-400">
                {c.slug}
              </span>
            ),
          },
          {
            key: "status",
            title: "وضعیت",
            render: (c: Category) => (
              <span
                className={
                  c.isActive
                    ? "rounded-lg bg-emerald-900/40 px-3 py-1 text-xs text-emerald-300"
                    : "rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300"
                }
              >
                {c.isActive ? "فعال" : "غیرفعال"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (c: Category) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedCategory(c);
                    setOpenEdit(true);
                  }}
                >
                  ویرایش
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setDeleteError("");
                    setSelectedCategory(c);
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

      {/* CREATE */}
      <CreateCategoryDialog
        key={openCreate ? "create-category-open" : "create-category-closed"}
        open={openCreate}
        onOpenChange={setOpenCreate}
      />

      {/* EDIT */}
      <EditCategoryDialog
        key={selectedCategory?.id ?? "no-category-selected"}
        open={openEdit}
        onOpenChange={setOpenEdit}
        category={selectedCategory}
      />

      {/* DELETE */}
      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="حذف دسته‌بندی"
        description="آیا از حذف این دسته‌بندی مطمئن هستید؟"
        loading={deleteCategory.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
