"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
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
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Upload,
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

const fixedCenterWidgetIds = new Set(["hero", "map", "systems"]);

type SettingsTab =
  | "branding"
  | "widgets"
  | "files"
  | "profile"
  | "activeDirectory";

const settingsTabs: Array<{
  id: SettingsTab;
  label: string;
  description: string;
}> = [
  {
    id: "branding",
    label: "عمومی و ظاهر",
    description: "نام سازمان، لوگو، رنگ و بکگراند",
  },
  {
    id: "widgets",
    label: "ویجت‌های صفحه اصلی",
    description: "نمایش و ترتیب ماژول‌های پرتال",
  },
  {
    id: "files",
    label: "فایل‌ها و آپلود",
    description: "حجم و پسوندهای مجاز آموزش",
  },
  {
    id: "profile",
    label: "پروفایل کاربران",
    description: "اجباری بودن کد پرسنلی و تاریخ تولد",
  },
  {
    id: "activeDirectory",
    label: "اکتیو دایرکتوری",
    description: "LDAP، Bind و تست اتصال",
  },
];

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
  const { data: settings, isLoading, isError, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const testActiveDirectory = useTestActiveDirectoryConnection();

  const [companyName, setCompanyName] = useState("AGTPS Portal");
  const [logo, setLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#22d3ee");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    defaultBackgroundImage,
  );
  const [overlayColor, setOverlayColor] = useState("#020617");
  const [overlayOpacity, setOverlayOpacity] = useState("0.78");
  const [portalHorizontalPaddingPercent, setPortalHorizontalPaddingPercent] = useState("0");
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
  const [adTlsServerName, setAdTlsServerName] = useState("");
  const [adCaCertificate, setAdCaCertificate] = useState("");
  const [adSyncIntervalMinutes, setAdSyncIntervalMinutes] = useState("60");
  const [windowsSsoEnabled, setWindowsSsoEnabled] = useState(false);
  const [requirePortalLogin, setRequirePortalLogin] = useState(false);
  const [trainingMaxUploadSizeMb, setTrainingMaxUploadSizeMb] =
    useState("2048");
  const [trainingAllowedFileExtensions, setTrainingAllowedFileExtensions] =
    useState(
      "mp4,mkv,webm,mov,avi,pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,webp,gif,txt,csv,zip,rar,7z",
    );
  const [requireUserPersonnelCode, setRequireUserPersonnelCode] =
    useState(false);
  const [requireUserBirthDate, setRequireUserBirthDate] = useState(false);
  const [requireUserEmail, setRequireUserEmail] = useState(false);
  const [requireUserMobile, setRequireUserMobile] = useState(false);
  const [topbarUserDisplayMode, setTopbarUserDisplayMode] = useState<
    "FULL_NAME" | "PERSONNEL_CODE" | "USERNAME"
  >("FULL_NAME");
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!settings) return;

    const timer = window.setTimeout(() => {
      setCompanyName(settings.companyName || "AGTPS Portal");
      setLogo(settings.logo ?? "");
      setFavicon(settings.favicon ?? "");
      setPrimaryColor(settings.primaryColor || "#22d3ee");
      setBackgroundImageUrl(
        settings.portalBackgroundImageUrl || defaultBackgroundImage,
      );
      setOverlayColor(settings.portalBackgroundOverlayColor || "#020617");
      setOverlayOpacity(String(settings.portalBackgroundOverlayOpacity ?? 0.78));
      setPortalHorizontalPaddingPercent(String(settings.portalHorizontalPaddingPercent ?? 0));
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
      setAdTlsServerName(settings.activeDirectoryTlsServerName ?? "");
      setAdCaCertificate(settings.activeDirectoryCaCertificate ?? "");
      setAdSyncIntervalMinutes(String(settings.activeDirectorySyncIntervalMinutes ?? 60));
      setWindowsSsoEnabled(Boolean(settings.windowsSsoEnabled));
      setRequirePortalLogin(Boolean(settings.requirePortalLogin));
      setTrainingMaxUploadSizeMb(
        String(settings.trainingMaxUploadSizeMb ?? 2048),
      );
      setTrainingAllowedFileExtensions(
        settings.trainingAllowedFileExtensions ||
          "mp4,mkv,webm,mov,avi,pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,webp,gif,txt,csv,zip,rar,7z",
      );
      setRequireUserPersonnelCode(Boolean(settings.requireUserPersonnelCode));
      setRequireUserBirthDate(Boolean(settings.requireUserBirthDate));
      setRequireUserEmail(Boolean(settings.requireUserEmail));
      setRequireUserMobile(Boolean(settings.requireUserMobile));
      setTopbarUserDisplayMode(settings.topbarUserDisplayMode || "FULL_NAME");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [settings]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsedOverlayOpacity = Number(overlayOpacity);
    const parsedPortalPadding = Number(portalHorizontalPaddingPercent);
    const parsedAdSyncIntervalMinutes = Number(adSyncIntervalMinutes);
    const parsedTrainingMaxUploadSizeMb = Number(trainingMaxUploadSizeMb);

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

    if (!Number.isInteger(parsedAdSyncIntervalMinutes) || parsedAdSyncIntervalMinutes < 5 || parsedAdSyncIntervalMinutes > 10080) {
      setFormError("فاصله همگام‌سازی باید بین ۵ دقیقه تا ۷ روز باشد.");
      return;
    }

    if (
      !Number.isFinite(parsedTrainingMaxUploadSizeMb) ||
      parsedTrainingMaxUploadSizeMb < 1 ||
      parsedTrainingMaxUploadSizeMb > 2048
    ) {
      setFormError("حجم آپلود آموزش باید عددی بین ۱ تا ۲۰۴۸ مگابایت باشد.");
      return;
    }

    setFormError("");
    setSuccess("");

    try {
      await updateSettings.mutateAsync({
        companyName: companyName.trim(),
        logo: logo.trim() || undefined,
        favicon: favicon.trim() || undefined,
        primaryColor: primaryColor.trim() || undefined,
        portalBackgroundImageUrl: backgroundImageUrl.trim() || undefined,
        portalBackgroundOverlayColor: overlayColor.trim() || undefined,
        portalBackgroundOverlayOpacity: parsedOverlayOpacity,
        portalHorizontalPaddingPercent: parsedPortalPadding,
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
        activeDirectoryUserSearchBase: adUserSearchBase.trim() || undefined,
        activeDirectoryGroupSearchBase: adGroupSearchBase.trim() || undefined,
        activeDirectoryTlsServerName: adTlsServerName.trim() || undefined,
        activeDirectoryCaCertificate: adCaCertificate.trim() || undefined,
        activeDirectorySyncIntervalMinutes: parsedAdSyncIntervalMinutes,
        windowsSsoEnabled,
        requirePortalLogin,
        trainingMaxUploadSizeMb: parsedTrainingMaxUploadSizeMb,
        trainingAllowedFileExtensions:
          trainingAllowedFileExtensions.trim() || undefined,
        requireUserPersonnelCode,
        requireUserBirthDate,
        requireUserEmail,
        requireUserMobile,
        topbarUserDisplayMode,
      });
      setSuccess("تنظیمات ذخیره شد.");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "ذخیره تنظیمات انجام نشد.",
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
      const widget = widgets.find((item) => item.id === id);
      if (!widget || fixedCenterWidgetIds.has(id)) return widgets;
      const columnWidgets = widgets
        .filter((item) => item.column === widget.column)
        .sort((first, second) => first.order - second.order);
      const index = columnWidgets.findIndex((item) => item.id === id);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= columnWidgets.length) {
        return widgets;
      }

      const target = columnWidgets[targetIndex];
      const next = widgets.map((item) => {
        if (item.id === widget.id) return { ...item, order: target.order };
        if (item.id === target.id) return { ...item, order: widget.order };
        return item;
      });

      return normalizePortalWidgetsForSave(next);
    });
  }

  function moveWidgetToColumn(id: string, column: PortalWidgetSetting["column"]) {
    setPortalWidgets((widgets) => {
      const widget = widgets.find((item) => item.id === id);
      if (!widget || fixedCenterWidgetIds.has(id) || widget.column === column) return widgets;
      const lastOrder = Math.max(0, ...widgets.filter((item) => item.column === column).map((item) => item.order));
      return normalizePortalWidgetsForSave(
        widgets.map((item) => item.id === id ? { ...item, column, order: lastOrder + 10 } : item),
      );
    });
  }

  if (isLoading) {
    return <div className="py-10 text-center">در حال بارگذاری...</div>;
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-xl border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        <h1 className="text-xl font-semibold">بارگذاری تنظیمات انجام نشد</h1>
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl border p-4 text-right transition ${
              activeTab === tab.id
                ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.14)]"
                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
            }`}
          >
            <span className="block font-black">{tab.label}</span>
            <span className="mt-2 block text-xs leading-6 text-slate-400">
              {tab.description}
            </span>
          </button>
        ))}
      </div>

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

      {activeTab !== "activeDirectory" && (
        <form
          id="portal-settings-form"
          onSubmit={submit}
          className="grid gap-6 xl:grid-cols-[1fr_420px]"
        >
        {activeTab === "branding" && (
          <>
        <SettingsSection
          title="تنظیمات عمومی و برندینگ"
          description="نام سازمان، لوگو، رنگ اصلی و متن پایین صفحه را مدیریت کنید."
          icon={Building2}
        >
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

            <IconFormField label="فاوآیکن مرورگر" icon={Image}>
              <FileUploadField
                value={favicon}
                onChange={setFavicon}
                folder="settings"
                accept="image/png,image/svg+xml,image/webp"
                disabled={updateSettings.isPending}
                placeholder="PNG مربع ۵۱۲×۵۱۲ (پیشنهادی)"
              />
              <p className="mt-2 text-xs leading-6 text-slate-400">
                تصویر مربع PNG با اندازه ۵۱۲×۵۱۲ پیشنهاد می‌شود. پس از ذخیره، برای مشاهده تغییر یک‌بار صفحه را با Ctrl+F5 تازه‌سازی کنید.
              </p>
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

          <IconFormField label="فاصله افقی محتوای پورتال (درصد هر طرف)" icon={Settings}>
            <Input type="number" min={0} max={15} step={0.5} value={portalHorizontalPaddingPercent} onChange={(event) => setPortalHorizontalPaddingPercent(event.target.value)} disabled={updateSettings.isPending} />
            <p className="mt-2 text-xs text-slate-400">صفر یعنی تمام عرض؛ مقدار پیشنهادی ۳ تا ۶ درصد است.</p>
          </IconFormField>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
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
          </>
        )}

        {activeTab === "widgets" && (
        <SettingsSection
          title="ویجت‌های صفحه اصلی"
          description="نمایش ویجت‌های پورتال و ترتیب آن‌ها را مدیریت کنید."
          icon={LayoutDashboard}
          className="xl:col-span-2"
        >
          <div className="grid items-start gap-5 xl:grid-cols-3">
            {(["right", "center", "left"] as const).map((column) => (
              <section
                key={column}
                className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-1 pb-3">
                  <h3 className="font-black text-white">
                    {column === "right"
                      ? "ستون راست"
                      : column === "center"
                        ? "ستون وسط"
                        : "ستون چپ"}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {portalWidgets.filter((item) => item.column === column).length} ویجت
                  </span>
                </div>
            {portalWidgets
              .filter((widget) => widget.column === column)
              .sort((first, second) => first.order - second.order)
              .map((widget) => {
              const columnLabel =
                widget.column === "left"
                  ? "ستون چپ محتوای پورتال"
                  : widget.column === "center"
                    ? "ستون مرکزی"
                    : "ستون راست محتوای پورتال";
              const isFixedCenterWidget = fixedCenterWidgetIds.has(widget.id);
              const widgetsInColumn = portalWidgets
                .filter((item) => item.column === widget.column)
                .sort((first, second) => first.order - second.order);
              const columnIndex = widgetsInColumn.findIndex((item) => item.id === widget.id);
              const widgetDescription =
                widget.id === "systems"
                  ? "با غیرفعال کردن این گزینه، سامانه‌های زیر نقشه از صفحه اصلی مخفی می‌شوند."
                  : isFixedCenterWidget
                    ? "جای این ویجت در ستون وسط ثابت است."
                    : "این ویجت را می‌توانید در همین ستون یا بین ستون‌ها جابه‌جا کنید.";

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
                      <h3 className="font-black text-white">{widget.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {columnLabel}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        {widgetDescription}
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
                      aria-label={widget.enabled ? "غیرفعال کردن" : "فعال کردن"}
                    >
                      {widget.enabled ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={columnIndex === 0 || isFixedCenterWidget}
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
                      disabled={
                        columnIndex === widgetsInColumn.length - 1 ||
                        isFixedCenterWidget
                      }
                      onClick={() => moveWidget(widget.id, "down")}
                      className="gap-2"
                    >
                      <ArrowDown size={15} />
                      پایین
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={widget.column === "right" || isFixedCenterWidget}
                      onClick={() => moveWidgetToColumn(widget.id, widget.column === "left" ? "center" : "right")}
                      className="gap-2"
                    >
                      <ArrowRight size={15} /> ستون راست
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={widget.column === "left" || isFixedCenterWidget}
                      onClick={() => moveWidgetToColumn(widget.id, widget.column === "right" ? "center" : "left")}
                      className="gap-2"
                    >
                      <ArrowLeft size={15} /> ستون چپ
                    </Button>
                  </div>
                </div>
              );
            })}
              </section>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending
                ? "در حال ذخیره..."
                : "ذخیره چیدمان ویجت‌ها"}
            </Button>
          </div>
        </SettingsSection>
        )}

        {activeTab === "files" && (
        <SettingsSection
          title="تنظیمات فایل‌های آموزشی"
          description="حجم مجاز و پسوندهای قابل آپلود در ماژول آموزش را مدیریت کنید."
          icon={Upload}
          className="xl:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <IconFormField label="حداکثر حجم آپلود - مگابایت" icon={Upload}>
              <Input
                type="number"
                min={1}
                max={2048}
                value={trainingMaxUploadSizeMb}
                onChange={(event) =>
                  setTrainingMaxUploadSizeMb(event.target.value)
                }
                disabled={updateSettings.isPending}
              />
            </IconFormField>

            <IconFormField label="پسوندهای مجاز آموزش" icon={FileText}>
              <Input
                value={trainingAllowedFileExtensions}
                onChange={(event) =>
                  setTrainingAllowedFileExtensions(event.target.value)
                }
                disabled={updateSettings.isPending}
                placeholder="mp4,mkv,pdf,docx,pptx"
              />
            </IconFormField>
          </div>

          <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            سقف فنی فعلی ۲۰۴۸ مگابایت است. برای فایل‌های بزرگ بهتر است سرور
            آموزش/SMB استفاده شود تا فایل‌ها مستقیم از مسیر شبکه sync شوند.
          </p>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending
                ? "در حال ذخیره..."
                : "ذخیره تنظیمات فایل آموزشی"}
            </Button>
          </div>
        </SettingsSection>
        )}

        {activeTab === "profile" && (
        <SettingsSection
          title="سیاست پروفایل کاربران"
          description="اجباری بودن تکمیل اطلاعات فردی و نحوه نمایش کاربر در topbar را مدیریت کنید."
          icon={Users}
          className="xl:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm font-black text-white">
              <input
                type="checkbox"
                checked={requireUserPersonnelCode}
                onChange={(event) =>
                  setRequireUserPersonnelCode(event.target.checked)
                }
                disabled={updateSettings.isPending}
              />
              کد پرسنلی اجباری باشد
            </label>

            <label className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm font-black text-white">
              <input
                type="checkbox"
                checked={requireUserBirthDate}
                onChange={(event) =>
                  setRequireUserBirthDate(event.target.checked)
                }
                disabled={updateSettings.isPending}
              />
              تاریخ تولد اجباری باشد
            </label>

            <label className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm font-black text-white">
              <input type="checkbox" checked={requireUserEmail} onChange={(event) => setRequireUserEmail(event.target.checked)} disabled={updateSettings.isPending} />
              ایمیل اجباری باشد
            </label>

            <label className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm font-black text-white">
              <input type="checkbox" checked={requireUserMobile} onChange={(event) => setRequireUserMobile(event.target.checked)} disabled={updateSettings.isPending} />
              شماره موبایل اجباری باشد
            </label>

            <IconFormField label="نمایش کاربر در topbar" icon={Users}>
              <select
                value={topbarUserDisplayMode}
                onChange={(event) =>
                  setTopbarUserDisplayMode(
                    event.target.value as
                      | "FULL_NAME"
                      | "PERSONNEL_CODE"
                      | "USERNAME",
                  )
                }
                disabled={updateSettings.isPending}
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="FULL_NAME">نام و نام خانوادگی</option>
                <option value="PERSONNEL_CODE">کد پرسنلی</option>
                <option value="USERNAME">نام کاربری</option>
              </select>
            </IconFormField>
          </div>

          <p className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">
            اگر گزینه اجباری فعال باشد، کاربرانی که اطلاعاتشان ناقص است بعد از
            ورود، قبل از ادامه کار باید پروفایل خود را تکمیل کنند.
          </p>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending
                ? "در حال ذخیره..."
                : "ذخیره سیاست پروفایل"}
            </Button>
          </div>
        </SettingsSection>
        )}
        </form>
      )}

      {activeTab === "activeDirectory" && (
      <form id="active-directory-settings-form" onSubmit={submit}>
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
          <label className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm text-white">
            <input
              type="checkbox"
              checked={windowsSsoEnabled}
              onChange={(event) => setWindowsSsoEnabled(event.target.checked)}
              disabled={updateSettings.isPending || !adEnabled}
              className="mt-1"
            />
            <span>
              <strong className="block">ورود خودکار ویندوز فعال باشد</strong>
              <span className="mt-1 block leading-6 text-slate-400">
                کاربران عضو دامنه می‌توانند با حساب فعلی ویندوز و Kerberos وارد شوند.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm text-white">
            <input
              type="checkbox"
              checked={requirePortalLogin}
              onChange={(event) => setRequirePortalLogin(event.target.checked)}
              disabled={updateSettings.isPending}
              className="mt-1"
            />
            <span>
              <strong className="block">ورود به پورتال اجباری باشد</strong>
              <span className="mt-1 block leading-6 text-slate-400">
                کاربر مهمان ابتدا صفحه انتخاب ورود خودکار یا دستی را مشاهده می‌کند.
              </span>
            </span>
          </label>
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

          <IconFormField label="نام سرور داخل گواهی TLS" icon={ShieldCheck}>
            <Input
              value={adTlsServerName}
              onChange={(event) => setAdTlsServerName(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="DNS-Main.AGTPS.net"
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

          <div className="md:col-span-2">
            <IconFormField label="گواهی Root CA سازمان (PEM)" icon={ShieldCheck}>
              <textarea
                value={adCaCertificate}
                onChange={(event) => setAdCaCertificate(event.target.value)}
                disabled={updateSettings.isPending}
                rows={6}
                dir="ltr"
                placeholder="-----BEGIN CERTIFICATE-----"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </IconFormField>
          </div>

          <IconFormField label="فاصله همگام‌سازی خودکار (دقیقه)" icon={RefreshCw}>
            <Input
              type="number"
              min="5"
              max="10080"
              value={adSyncIntervalMinutes}
              onChange={(event) => setAdSyncIntervalMinutes(event.target.value)}
              disabled={updateSettings.isPending}
              placeholder="60"
            />
          </IconFormField>
        </div>

        {settings?.activeDirectoryLastCheckedAt && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-7 text-slate-300">
            <div>
              آخرین بررسی:{" "}
              {new Date(settings.activeDirectoryLastCheckedAt).toLocaleString(
                "fa-IR",
              )}
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
            form="active-directory-settings-form"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات AD"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void testConnection()}
            disabled={testActiveDirectory.isPending}
          >
            {testActiveDirectory.isPending ? "در حال تست..." : "تست اتصال"}
          </Button>
        </div>
      </SettingsSection>
      </form>
      )}
    </div>
  );
}
