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
  const { data = [], isLoading } = useCategories();

  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const filtered = data.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete() {
    if (!selectedCategory) return;

    await deleteCategory.mutateAsync(selectedCategory.id);

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
        open={openCreate}
        onOpenChange={setOpenCreate}
      />

      {/* EDIT */}
      <EditCategoryDialog
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
