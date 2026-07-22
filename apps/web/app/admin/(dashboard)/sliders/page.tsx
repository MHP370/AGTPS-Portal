"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import {
  useCreateSlider,
  useDeleteSlider,
  useSliders,
  useUpdateSlider,
} from "@/hooks/useSliders";
import type { Slider } from "@/lib/sliders";

export default function SlidersPage() {
  const { data: sliders = [] } = useSliders();
  const createSlider = useCreateSlider();
  const updateSlider = useUpdateSlider();
  const deleteSlider = useDeleteSlider();
  const [editing, setEditing] = useState<Slider | null>(null);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [url, setUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  function resetForm() {
    setEditing(null);
    setTitle("");
    setImage("");
    setUrl("");
    setSortOrder("0");
    setIsActive(true);
    setFormError("");
  }

  function startEdit(slider: Slider) {
    setEditing(slider);
    setTitle(slider.title);
    setImage(slider.image);
    setUrl(slider.url ?? "");
    setSortOrder(String(slider.sortOrder ?? 0));
    setIsActive(slider.isActive);
    setFormError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsedSortOrder = Number(sortOrder || 0);

    if (!title.trim() || !image.trim()) {
      setFormError("عنوان و تصویر بنر الزامی هستند.");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setFormError("ترتیب نمایش باید عدد صحیح صفر یا بزرگ‌تر باشد.");
      return;
    }

    const dto = {
      title: title.trim(),
      image: image.trim(),
      url: url.trim() || undefined,
      sortOrder: parsedSortOrder,
      isActive,
    };

    setFormError("");

    if (editing) {
      await updateSlider.mutateAsync({
        id: editing.id,
        dto,
      });
    } else {
      await createSlider.mutateAsync(dto);
    }

    resetForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مدیریت اسلایدر</h1>
        <p className="mt-2 text-sm text-slate-400">
          بنرهای پیام مدیریت صفحه اصلی را از این بخش مدیریت کنید.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <h2 className="text-xl font-bold">
          {editing ? "ویرایش بنر" : "افزودن بنر"}
        </h2>

        {formError && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
            {formError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="عنوان بنر" required>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>

          <FormField label="ترتیب نمایش">
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </FormField>
        </div>

        <FormField
          label="تصویر بنر"
          required
          hint="اندازه پیشنهادی ۱۶۰۰×۵۰۰ پیکسل برای بنر عریض؛ محتوای مهم در مرکز تصویر، فرمت WebP یا JPEG و حجم ترجیحاً کمتر از ۲ مگابایت."
        >
          <FileUploadField
            value={image}
            onChange={setImage}
            folder="sliders"
            placeholder="/uploads/sliders/banner.jpg یا https://..."
          />
        </FormField>

        {image && (
          <div
            className="h-48 rounded-2xl border border-white/10 bg-cover bg-center"
            style={{
              backgroundImage: `url(${image})`,
            }}
          />
        )}

        <FormField label="لینک بنر">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="#announcements یا https://..."
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          فعال باشد
        </label>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={createSlider.isPending || updateSlider.isPending}
          >
            {editing ? "ذخیره ویرایش" : "افزودن بنر"}
          </Button>
          {editing && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              انصراف
            </Button>
          )}
        </div>
      </form>

      <DataTable
        data={sliders}
        columns={[
          {
            key: "title",
            title: "بنر",
            render: (slider) => (
              <div className="flex items-center gap-3">
                <div
                  className="size-16 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${slider.image})` }}
                />
                <div>
                  <div className="font-bold">{slider.title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    ترتیب {slider.sortOrder}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "url",
            title: "لینک",
            render: (slider) =>
              slider.url ? (
                <a
                  href={slider.url}
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
            key: "isActive",
            title: "وضعیت",
            render: (slider) => (slider.isActive ? "فعال" : "غیرفعال"),
          },
          {
            key: "actions",
            title: "عملیات",
            render: (slider) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEdit(slider)}
                >
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={deleteSlider.isPending}
                  onClick={() => deleteSlider.mutate(slider.id)}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
