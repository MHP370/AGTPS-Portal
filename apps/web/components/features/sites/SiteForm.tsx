"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { CreateSiteDto, Site } from "@/lib/sites";

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

interface Props {
  site?: Site;
  loading?: boolean;
  error?: string;
  onSubmit: (dto: CreateSiteDto) => Promise<void>;
}

export function SiteForm({
  site,
  loading = false,
  error,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [ipRange, setIpRange] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logo, setLogo] = useState("");
  const [image, setImage] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [color, setColor] = useState("#22d3ee");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!site) return;

    setName(site.name);
    setCode(site.code);
    setBaseUrl(site.baseUrl ?? "");
    setIpRange(site.ipRange ?? "");
    setDescription(site.description ?? "");
    setAddress(site.address ?? "");
    setPhone(site.phone ?? "");
    setEmail(site.email ?? "");
    setLogo(site.logo ?? "");
    setImage(site.image ?? "");
    setLatitude(site.latitude === undefined || site.latitude === null ? "" : String(site.latitude));
    setLongitude(site.longitude === undefined || site.longitude === null ? "" : String(site.longitude));
    setColor(site.color || "#22d3ee");
    setSortOrder(String(site.sortOrder ?? 0));
    setIsActive(site.isActive);
    setFormError("");
  }, [site]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    const parsedSortOrder = Number(sortOrder || 0);
    const parsedLatitude = latitude.trim() ? Number(latitude) : undefined;
    const parsedLongitude = longitude.trim() ? Number(longitude) : undefined;
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedCode) {
      setFormError("نام سایت و کد سایت الزامی هستند.");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setFormError("ترتیب نمایش باید عدد صحیح صفر یا بزرگ‌تر باشد.");
      return;
    }

    if (
      parsedLatitude !== undefined &&
      (!Number.isFinite(parsedLatitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90)
    ) {
      setFormError("عرض جغرافیایی باید عددی بین ۹۰- تا ۹۰ باشد.");
      return;
    }

    if (
      parsedLongitude !== undefined &&
      (!Number.isFinite(parsedLongitude) ||
        parsedLongitude < -180 ||
        parsedLongitude > 180)
    ) {
      setFormError("طول جغرافیایی باید عددی بین ۱۸۰- تا ۱۸۰ باشد.");
      return;
    }

    if (color.trim() && !hexColorPattern.test(color.trim())) {
      setFormError("رنگ نشانگر باید در قالب HEX مثل #22d3ee باشد.");
      return;
    }

    if (
      trimmedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      setFormError("ایمیل سایت معتبر نیست.");
      return;
    }

    setFormError("");

    await onSubmit({
      name: trimmedName,
      code: trimmedCode,
      baseUrl: baseUrl.trim() || undefined,
      ipRange: ipRange.trim() || undefined,
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: trimmedEmail || undefined,
      logo: logo.trim() || undefined,
      image: image.trim() || undefined,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      color: color.trim() || undefined,
      sortOrder: parsedSortOrder,
      isActive,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {(error || formError) && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
          {error || formError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="نام سایت" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="کد سایت" required>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Base URL">
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            disabled={loading}
            placeholder="http://10.1.1.10"
          />
        </FormField>

        <FormField label="IP Range">
          <Input
            value={ipRange}
            onChange={(e) => setIpRange(e.target.value)}
            disabled={loading}
            placeholder="10.1.0.0/16"
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="آدرس">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            placeholder="تهران، ساختمان مرکزی"
          />
        </FormField>

        <FormField label="تلفن">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            placeholder="021..."
          />
        </FormField>

        <FormField label="ایمیل">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="site@example.com"
          />
        </FormField>
      </div>

      <FormField label="توضیحات">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="لوگوی سایت">
          <FileUploadField
            value={logo}
            onChange={setLogo}
            folder="sites"
            disabled={loading}
            placeholder="/uploads/sites/logo.png"
          />
        </FormField>

        <FormField label="تصویر سایت">
          <FileUploadField
            value={image}
            onChange={setImage}
            folder="sites"
            disabled={loading}
            placeholder="/uploads/sites/image.png"
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="عرض جغرافیایی">
          <Input
            type="number"
            step="0.000001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            disabled={loading}
            placeholder="35.6892"
          />
        </FormField>

        <FormField label="طول جغرافیایی">
          <Input
            type="number"
            step="0.000001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            disabled={loading}
            placeholder="51.3890"
          />
        </FormField>

        <FormField label="رنگ نشانگر">
          <div className="flex gap-2">
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={loading}
              placeholder="#22d3ee"
            />
            <input
              type="color"
              value={hexColorPattern.test(color) ? color : "#22d3ee"}
              onChange={(e) => setColor(e.target.value)}
              disabled={loading}
              className="h-11 w-14 rounded-lg border border-slate-700 bg-slate-900 p-1 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="انتخاب رنگ نشانگر سایت"
            />
          </div>
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="ترتیب نمایش">
          <Input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <label className="mt-7 flex h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={loading}
          />
          سایت فعال باشد
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading
            ? "در حال ذخیره..."
            : site
              ? "ذخیره تغییرات"
              : "ایجاد سایت"}
        </Button>
      </div>
    </form>
  );
}
