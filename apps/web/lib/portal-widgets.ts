export type PortalWidgetId =
  | "hero"
  | "announcements"
  | "news"
  | "map"
  | "systems"
  | "training"
  | "file-shares"
  | "poll-survey"
  | "status"
  | "calendar"
  | "workspace"
  | "downloads";

export type PortalWidgetColumn = "left" | "center" | "right";

export interface PortalWidgetSetting {
  id: PortalWidgetId;
  title: string;
  enabled: boolean;
  order: number;
  column: PortalWidgetColumn;
}

export const defaultPortalWidgets: PortalWidgetSetting[] = [
  {
    id: "announcements",
    title: "آخرین اطلاعیه‌ها",
    enabled: true,
    order: 10,
    column: "left",
  },
  {
    id: "news",
    title: "اخبار سایت‌ها",
    enabled: true,
    order: 20,
    column: "left",
  },
  {
    id: "hero",
    title: "بنر پیام مدیریت",
    enabled: true,
    order: 10,
    column: "center",
  },
  {
    id: "map",
    title: "نقشه سایت‌ها",
    enabled: true,
    order: 20,
    column: "center",
  },
  {
    id: "systems",
    title: "دسترسی سریع به سامانه‌ها",
    enabled: true,
    order: 30,
    column: "center",
  },
  {
    id: "training",
    title: "کتابخانه آموزش",
    enabled: true,
    order: 40,
    column: "center",
  },
  {
    id: "file-shares",
    title: "فایل شیر سازمانی",
    enabled: true,
    order: 45,
    column: "right",
  },
  {
    id: "poll-survey",
    title: "نظرسنجی و رای‌گیری",
    enabled: true,
    order: 5,
    column: "right",
  },
  {
    id: "status",
    title: "وضعیت سیستم‌ها",
    enabled: true,
    order: 10,
    column: "right",
  },
  {
    id: "calendar",
    title: "تقویم جلسات",
    enabled: true,
    order: 20,
    column: "right",
  },
  {
    id: "workspace",
    title: "دفترچه و کارهای من",
    enabled: true,
    order: 30,
    column: "right",
  },
  {
    id: "downloads",
    title: "دانلود نرم‌افزارها",
    enabled: true,
    order: 40,
    column: "right",
  },
];

export function normalizePortalWidgets(value: unknown): PortalWidgetSetting[] {
  const incoming = Array.isArray(value) ? value : [];

  return defaultPortalWidgets
    .map((widget) => {
      const saved = incoming.find(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          item.id === widget.id,
      ) as Partial<PortalWidgetSetting> | undefined;

      return {
        ...widget,
        enabled:
          typeof saved?.enabled === "boolean" ? saved.enabled : widget.enabled,
        order: typeof saved?.order === "number" ? saved.order : widget.order,
      };
    })
    .sort((first, second) => first.order - second.order);
}

export function normalizePortalWidgetsForSave(widgets: PortalWidgetSetting[]) {
  return widgets.map((widget, index) => ({
    id: widget.id,
    title: widget.title,
    enabled: widget.enabled,
    order: (index + 1) * 10,
    column: widget.column,
  }));
}
