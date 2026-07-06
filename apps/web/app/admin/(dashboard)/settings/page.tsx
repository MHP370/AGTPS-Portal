"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Database,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  useSettings,
  useTestActiveDirectoryConnection,
  useUpdateSettings,
} from "@/hooks/useSettings";
import { Button } from "@/components/ui/Button";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { Input } from "@/components/ui/Input";
import {
  normalizePortalWidgets,
  normalizePortalWidgetsForSave,
  type PortalWidgetSetting,
} from "@/lib/portal-widgets";

const defaultBackgroundImage = "/images/logo/apgt-logo.png";
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;
const savedPasswordMarker = "__KEEP_EXISTING__";

const activeDirectoryStatusLabels: Record<string, string> = {
  connected: "متصل",
  failed: "ناموفق",
  disabled: "غیرفعال",
  missing_config: "تنظیمات ناقص",
};

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`space-y-5 rounded-xl border border-slate-800 bg-slate-900/50 p-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-cyan-200/35 bg-cyan-400/20 text-cyan-100 shadow-[0_0_26px_rgba(34,211,238,0.18)]">
          <Icon size={28} strokeWidth={2.3} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function InlineSectionTitle({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
      <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
        <Icon size={21} strokeWidth={2.3} />
      </span>
      <h3 className="font-black text-slate-100">{title}</h3>
    </div>
  );
}

function IconFormField({
  label,
  required = false,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 shadow-lg shadow-black/10">
      <label className="mb-3 flex items-center gap-3 text-sm font-black text-white">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-cyan-200/35 bg-cyan-400/20 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
          <Icon size={24} strokeWidth={2.4} />
        </span>
        <span className="text-base">{label}</span>
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useSettings();
  const updateSettings = useUpdateSettings();
  const testActiveDirectory = useTestActiveDirectoryConnection();

  const [companyName, setCompanyName] = useState("AGTPS Portal");
  const [logo, setLogo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#22d3ee");
  const [backgroundImageUrl, setBackgroundImageUrl] =
    useState(defaultBackgroundImage);
  const [overlayColor, setOverlayColor] = useState("#020617");
  const [overlayOpacity, setOverlayOpacity] = useState("0.78");
  const [portalWidgets, setPortalWidgets] = useState<PortalWidgetSetting[]>(
    () => normalizePortalWidgets(null),
  );
  const [footerText, setFooterText] = useState("");
  const [adEnabled, setAdEnabled] = useState(false);
  const [adUrl, setAdUrl] = useState("");
  const [adDomain, setAdDomain] = useState("");
  const [adBaseDn, setAdBaseDn] = useState("");
  const [adBindDn, setAdBindDn] = useState("");
  const [adBindPassword, setAdBindPassword] = useState("");
  const [adUserSearchBase, setAdUserSearchBase] = useState("");
  const [adGroupSearchBase, setAdGroupSearchBase] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!settings) return;

    setCompanyName(settings.companyName || "AGTPS Portal");
    setLogo(settings.logo ?? "");
    setPrimaryColor(settings.primaryColor || "#22d3ee");
    setBackgroundImageUrl(
      settings.portalBackgroundImageUrl || defaultBackgroundImage,
    );
    setOverlayColor(settings.portalBackgroundOverlayColor || "#020617");
    setOverlayOpacity(
      String(settings.portalBackgroundOverlayOpacity ?? 0.78),
    );
    setPortalWidgets(normalizePortalWidgets(settings.portalWidgets));
    setFooterText(settings.footerText ?? "");
    setAdEnabled(Boolean(settings.activeDirectoryEnabled));
    setAdUrl(settings.activeDirectoryUrl ?? "");
    setAdDomain(settings.activeDirectoryDomain ?? "");
    setAdBaseDn(settings.activeDirectoryBaseDn ?? "");
    setAdBindDn(settings.activeDirectoryBindDn ?? "");
    setAdBindPassword(
      settings.activeDirectoryBindPassword ? savedPasswordMarker : "",
    );
    setAdUserSearchBase(settings.activeDirectoryUserSearchBase ?? "");
    setAdGroupSearchBase(settings.activeDirectoryGroupSearchBase ?? "");
  }, [settings]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsedOverlayOpacity = Number(overlayOpacity);

    if (!companyName.trim()) {
      setFormError("نام شرکت الزامی است.");
      return;
    }

    if (primaryColor && !hexColorPattern.test(primaryColor)) {
      setFormError("رنگ اصلی باید در قالب HEX مثل #22d3ee باشد.");
      return;
    }

    if (overlayColor && !hexColorPattern.test(overlayColor)) {
      setFormError("رنگ پوشش بکگراند باید در قالب HEX مثل #020617 باشد.");
      return;
    }

    if (
      !Number.isFinite(parsedOverlayOpacity) ||
      parsedOverlayOpacity < 0 ||
      parsedOverlayOpacity > 1
    ) {
      setFormError("شدت پوشش باید عددی بین ۰ و ۱ باشد.");
      return;
    }

    setFormError("");
    setSuccess("");

    try {
      await updateSettings.mutateAsync({
        companyName: companyName.trim(),
        logo: logo.trim() || undefined,
        primaryColor: primaryColor.trim() || undefined,
        portalBackgroundImageUrl:
          backgroundImageUrl.trim() || undefined,
        portalBackgroundOverlayColor: overlayColor.trim() || undefined,
        portalBackgroundOverlayOpacity: parsedOverlayOpacity,
        portalWidgets: normalizePortalWidgetsForSave(portalWidgets),
        footerText: footerText.trim() || undefined,
        activeDirectoryEnabled: adEnabled,
        activeDirectoryUrl: adUrl.trim() || undefined,
        activeDirectoryDomain: adDomain.trim() || undefined,
        activeDirectoryBaseDn: adBaseDn.trim() || undefined,
        activeDirectoryBindDn: adBindDn.trim() || undefined,
        activeDirectoryBindPassword:
          adBindPassword === savedPasswordMarker
            ? savedPasswordMarker
            : adBindPassword.trim() || undefined,
        activeDirectoryUserSearchBase:
          adUserSearchBase.trim() || undefined,
        activeDirectoryGroupSearchBase:
          adGroupSearchBase.trim() || undefined,
      });
      setSuccess("تنظیمات ذخیره شد.");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "ذخیره تنظیمات انجام نشد.",
      );
    }
  }

  async function testConnection() {
    setFormError("");
    setSuccess("");

    try {
      await testActiveDirectory.mutateAsync();
      setSuccess("تست اتصال اکتیو دایرکتوری انجام شد.");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "تست اتصال اکتیو دایرکتوری انجام نشد.",
      );
    }
  }

  function toggleWidget(id: string) {
    setPortalWidgets((widgets) =>
      widgets.map((widget) =>
        widget.id === id
          ? {
              ...widget,
              enabled: !widget.enabled,
            }
          : widget,
      ),
    );
  }

  function moveWidget(id: string, direction: "up" | "down") {
    setPortalWidgets((widgets) => {
      const index = widgets.findIndex((widget) => widget.id === id);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= widgets.length) {
        return widgets;
      }

      const next = [...widgets];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);

      return normalizePortalWidgetsForSave(next);
    });
  }

  if (isLoading) {
    return <div className="py-10 text-center">در حال بارگذاری...</div>;
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">
          بارگذاری تنظیمات انجام نشد
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
      <div className="flex items-start gap-3">
        <span className="grid size-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          <Settings size={24} />
        </span>
        <div>
          <h1 className="text-3xl font-bold">تنظیمات پورتال</h1>
          <p className="mt-2 text-sm text-slate-400">
            بکگراند و تنظیمات ظاهری صفحه اصلی را از این بخش تغییر دهید.
          </p>
        </div>
      </div>

      <form
        id="portal-settings-form"
        onSubmit={submit}
        className="grid gap-6 xl:grid-cols-[1fr_420px]"
      >
        <SettingsSection
          title="تنظیمات عمومی و برندینگ"
          description="نام سازمان، لوگو، رنگ اصلی و متن پایین صفحه را مدیریت کنید."
          icon={Building2}
        >
          {(formError || success) && (
            <div
              className={
                formError
                  ? "rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
                  : "rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200"
              }
            >
              {formError || success}
            </div>
          )}

          <InlineSectionTitle title="هویت سازمان" icon={ShieldCheck} />

          <div className="grid gap-4 md:grid-cols-2">
            <IconFormField label="نام شرکت" icon={Building2} required>
              <Input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                disabled={updateSettings.isPending}
              />
            </IconFormField>

            <IconFormField label="لوگو" icon={Image}>
              <FileUploadField
                value={logo}
                onChange={setLogo}
                folder="settings"
                disabled={updateSettings.isPending}
                placeholder="/images/logo/apgt-logo.png"
              />
            </IconFormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <IconFormField label="رنگ اصلی" icon={Palette}>
              <div className="flex gap-2">
                <Input
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  disabled={updateSettings.isPending}
                  placeholder="#22d3ee"
                />
                <input
                  type="color"
                  value={
                    hexColorPattern.test(primaryColor)
                      ? primaryColor
                      : "#22d3ee"
                  }
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  disabled={updateSettings.isPending}
                  className="h-11 w-14 rounded-lg border border-slate-700 bg-slate-900 p-1 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="انتخاب رنگ اصلی"
                />
              </div>
            </IconFormField>

            <IconFormField label="متن footer" icon={FileText}>
              <Input
                value={footerText}
                onChange={(event) => setFooterText(event.target.value)}
                disabled={updateSettings.isPending}
              />
            </IconFormField>
          </div>

          <InlineSectionTitle title="ظاهر صفحه اصلی" icon={Palette} />

          <IconFormField label="تصویر بکگراند صفحه اصلی" icon={Image}>
            <FileUploadField
              value={backgroundImageUrl}
              onChange={setBackgroundImageUrl}
              folder="settings"
              disabled={updateSettings.isPending}
              placeholder="/images/portal/background.jpg یا https://..."
            />
          </IconFormField>

          <div className="grid gap-4 md:grid-cols-2">
            <IconFormField label="رنگ پوشش بکگراند" icon={Palette}>
              <div className="flex gap-2">
                <Input
                  value={overlayColor}
                  onChange={(event) => setOverlayColor(event.target.value)}
                  disabled={updateSettings.isPending}
                  placeholder="#020617"
                />
                <input
                  type="color"
                  value={
                    hexColorPattern.test(overlayColor)
                      ? overlayColor
                      : "#020617"
                  }
                  onChange={(event) => setOverlayColor(event.target.value)}
                  disabled={updateSettings.isPending}
                  className="h-11 w-14 rounded-lg border border-slate-700 bg-slate-900 p-1 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="انتخاب رنگ پوشش بکگراند"
                />
              </div>
            </IconFormField>

            <IconFormField label="شدت پوشش بکگراند" icon={Settings}>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={overlayOpacity}
                onChange={(event) => setOverlayOpacity(event.target.value)}
                disabled={updateSettings.isPending}
              />
            </IconFormField>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending
                ? "در حال ذخیره..."
                : "ذخیره تنظیمات"}
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="پیش‌نمایش بکگراند"
          description="نمای کلی صفحه اصلی با تصویر و پوشش انتخاب‌شده."
          icon={Image}
        >
          <div
            className="relative min-h-80 overflow-hidden rounded-xl border border-white/10 bg-cover bg-center"
            style={{
              backgroundImage: `url(${backgroundImageUrl || defaultBackgroundImage})`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: overlayColor,
                opacity: Number(overlayOpacity) || 0,
              }}
            />
            <div className="relative z-10 flex min-h-80 flex-col justify-end p-5">
              <p className="text-2xl font-black text-white">
                {companyName || "AGTPS Portal"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                نمونه نمایش بکگراند در صفحه اصلی پورتال
              </p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="ویجت‌های صفحه اصلی"
          description="نمایش ویجت‌های پورتال و ترتیب آن‌ها را مدیریت کنید."
          icon={LayoutDashboard}
          className="xl:col-span-2"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {portalWidgets.map((widget, index) => {
              const columnLabel =
                widget.column === "left"
                  ? "ستون راست محتوای پورتال"
                  : widget.column === "center"
                    ? "ستون مرکزی"
                    : "ستون چپ محتوای پورتال";

              return (
                <div
                  key={widget.id}
                  className={`rounded-2xl border p-4 transition ${
                    widget.enabled
                      ? "border-cyan-300/20 bg-cyan-400/10"
                      : "border-slate-800 bg-slate-950/45 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-white">
                        {widget.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {columnLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleWidget(widget.id)}
                      className={`grid size-9 place-items-center rounded-xl border ${
                        widget.enabled
                          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                          : "border-slate-700 bg-slate-900 text-slate-400"
                      }`}
                      aria-label={
                        widget.enabled ? "غیرفعال کردن" : "فعال کردن"
                      }
                    >
                      {widget.enabled ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={index === 0}
                      onClick={() => moveWidget(widget.id, "up")}
                      className="gap-2"
                    >
                      <ArrowUp size={15} />
                      بالا
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={index === portalWidgets.length - 1}
                      onClick={() => moveWidget(widget.id, "down")}
                      className="gap-2"
                    >
                      <ArrowDown size={15} />
                      پایین
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending
                ? "در حال ذخیره..."
                : "ذخیره چیدمان ویجت‌ها"}
            </Button>
          </div>
        </SettingsSection>
      </form>

      <SettingsSection
        title="اتصال اکتیو دایرکتوری"
        description="تنظیمات اتصال LDAP/AD را وارد کنید و وضعیت اتصال را تست کنید."
        icon={Network}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className={`rounded-full border px-4 py-2 text-sm font-bold ${
              settings?.activeDirectoryLastStatus === "connected"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : settings?.activeDirectoryLastStatus === "failed"
                  ? "border-red-400/30 bg-red-400/10 text-red-200"
                  : "border-slate-600 bg-slate-950/60 text-slate-300"
            }`}
          >
            وضعیت:{" "}
            {settings?.activeDirectoryLastStatus
              ? activeDirectoryStatusLabels[
                  settings.activeDirectoryLastStatus
                ] || settings.activeDirectoryLastStatus
              : "تست نشده"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-base font-black text-white shadow-lg shadow-black/10">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-cyan-200/35 bg-cyan-400/20 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
              <ShieldCheck size={24} strokeWidth={2.4} />
            </span>
            <input
              type="checkbox"
              checked={adEnabled}
              onChange={(event) => setAdEnabled(event.target.checked)}
              disabled={updateSettings.isPending}
            />
            فعال‌سازی اتصال اکتیو دایرکتوری
          </label>

          <IconFormField label="آدرس سرور LDAP" icon={Globe}>
            <Input
              value={adUrl}
              onChange={(event) => setAdUrl(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="ldap://ad.company.local:389"
            />
          </IconFormField>

          <IconFormField label="دامنه" icon={Network}>
            <Input
              value={adDomain}
              onChange={(event) => setAdDomain(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="company.local"
            />
          </IconFormField>

          <IconFormField label="Base DN" icon={Database}>
            <Input
              value={adBaseDn}
              onChange={(event) => setAdBaseDn(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="DC=company,DC=local"
            />
          </IconFormField>

          <IconFormField label="Bind DN" icon={Users}>
            <Input
              value={adBindDn}
              onChange={(event) => setAdBindDn(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="CN=svc-portal,OU=Service Accounts,DC=company,DC=local"
            />
          </IconFormField>

          <IconFormField label="Bind Password" icon={LockKeyhole}>
            <Input
              type="password"
              value={adBindPassword}
              onFocus={() => {
                if (adBindPassword === savedPasswordMarker) {
                  setAdBindPassword("");
                }
              }}
              onChange={(event) => setAdBindPassword(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="رمز سرویس اکانت"
            />
          </IconFormField>

          <IconFormField label="User Search Base" icon={Search}>
            <Input
              value={adUserSearchBase}
              onChange={(event) => setAdUserSearchBase(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="OU=Users,DC=company,DC=local"
            />
          </IconFormField>

          <IconFormField label="Group Search Base" icon={Search}>
            <Input
              value={adGroupSearchBase}
              onChange={(event) => setAdGroupSearchBase(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="OU=Groups,DC=company,DC=local"
            />
          </IconFormField>
        </div>

        {settings?.activeDirectoryLastCheckedAt && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-7 text-slate-300">
            <div>
              آخرین بررسی:{" "}
              {new Date(
                settings.activeDirectoryLastCheckedAt,
              ).toLocaleString("fa-IR")}
            </div>
            {settings.activeDirectoryLastError && (
              <div className="mt-2 text-red-200">
                خطا: {settings.activeDirectoryLastError}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="submit"
            form="portal-settings-form"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending
              ? "در حال ذخیره..."
              : "ذخیره تنظیمات AD"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void testConnection()}
            disabled={testActiveDirectory.isPending}
          >
            {testActiveDirectory.isPending
              ? "در حال تست..."
              : "تست اتصال"}
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}
