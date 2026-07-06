"use client";

import { useMemo, useState } from "react";

import { NewsForm } from "@/components/features/news/NewsForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { SearchBox } from "@/components/ui/SearchBox";
import {
  useCreateNews,
  useDeleteNews,
  useNews,
  useUpdateNews,
} from "@/hooks/useNews";
import type { CreateNewsDto, NewsItem } from "@/lib/news";

export default function NewsPage() {
  const { data = [], isLoading, isError, error, refetch } = useNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(data.map((item) => item.category).filter(Boolean)),
      ) as string[],
    [data],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((item) => {
      const matchesSearch =
        !keyword ||
        [item.title, item.body, item.category ?? "", item.site?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? item.published : !item.published);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, data, search, statusFilter]);

  async function handleCreate(dto: CreateNewsDto) {
    setFormError("");

    try {
      await createNews.mutateAsync(dto);
      setOpenCreate(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "ایجاد خبر انجام نشد.",
      );
    }
  }

  async function handleUpdate(dto: CreateNewsDto) {
    if (!selectedNews) return;

    setFormError("");

    try {
      await updateNews.mutateAsync({
        id: selectedNews.id,
        dto,
      });
      setOpenEdit(false);
      setSelectedNews(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "ویرایش خبر انجام نشد.",
      );
    }
  }

  async function handleDelete() {
    if (!selectedNews) return;

    setDeleteError("");

    try {
      await deleteNews.mutateAsync(selectedNews.id);
      setOpenDelete(false);
      setSelectedNews(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "حذف خبر انجام نشد.",
      );
    }
  }

  if (isLoading) {
    return <div className="py-10 text-center">در حال بارگذاری...</div>;
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">
          بارگذاری اخبار انجام نشد
        </h1>
        <p className="text-sm text-red-200/80">
          {(error as Error | undefined)?.message ||
            "ارتباط با سرویس برقرار نشد."}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            void refetch();
          }}
        >
          تلاش دوباره
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">مدیریت اخبار</h1>
        <Button onClick={() => setOpenCreate(true)}>افزودن خبر</Button>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {deleteError}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="جستجوی خبر..."
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
        >
          <option value="all">همه دسته‌بندی‌ها</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="published">منتشر شده</option>
          <option value="draft">پیش‌نویس</option>
        </select>
      </div>

      <DataTable
        data={filtered}
        columns={[
          {
            key: "title",
            title: "خبر",
            render: (item) => (
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="mt-1 line-clamp-1 text-xs text-slate-400">
                  {item.category ? `${item.category} · ${item.body}` : item.body}
                </div>
              </div>
            ),
          },
          {
            key: "site",
            title: "سایت",
            render: (item) => item.site?.name ?? "-",
          },
          {
            key: "attachment",
            title: "پیوست",
            render: (item) =>
              item.attachmentUrl ? (
                <a
                  href={item.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 hover:text-cyan-100"
                >
                  مشاهده
                </a>
              ) : (
                "-"
              ),
          },
          {
            key: "published",
            title: "وضعیت",
            render: (item) => (
              <span
                className={
                  item.published
                    ? "rounded-lg bg-emerald-900/40 px-3 py-1 text-xs text-emerald-300"
                    : "rounded-lg bg-red-900/40 px-3 py-1 text-xs text-red-300"
                }
              >
                {item.published ? "منتشر شده" : "پیش‌نویس"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (item) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFormError("");
                    setSelectedNews(item);
                    setOpenEdit(true);
                  }}
                >
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteNews.isPending}
                  onClick={() => {
                    setDeleteError("");
                    setSelectedNews(item);
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

      <Dialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) setFormError("");
        }}
        title="افزودن خبر"
      >
        <NewsForm
          loading={createNews.isPending}
          error={formError}
          onSubmit={handleCreate}
        />
      </Dialog>

      <Dialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) {
            setFormError("");
            setSelectedNews(null);
          }
        }}
        title="ویرایش خبر"
      >
        {selectedNews && (
          <NewsForm
            news={selectedNews}
            loading={updateNews.isPending}
            error={formError}
            onSubmit={handleUpdate}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={(open) => {
          setOpenDelete(open);
          if (!open) setSelectedNews(null);
        }}
        title="حذف خبر"
        description="آیا از حذف این خبر مطمئن هستید؟"
        loading={deleteNews.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
