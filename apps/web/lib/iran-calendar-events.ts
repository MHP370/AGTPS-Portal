export type IranCalendarEvent = {
  id: string;
  month: number;
  day: number;
  title: string;
  isHoliday: boolean;
};

export const iranFixedCalendarEvents: IranCalendarEvent[] = [
  { id: "farvardin-1", month: 1, day: 1, title: "آغاز نوروز", isHoliday: true },
  { id: "farvardin-2", month: 1, day: 2, title: "تعطیل نوروز", isHoliday: true },
  { id: "farvardin-3", month: 1, day: 3, title: "تعطیل نوروز", isHoliday: true },
  { id: "farvardin-4", month: 1, day: 4, title: "تعطیل نوروز", isHoliday: true },
  { id: "farvardin-12", month: 1, day: 12, title: "روز جمهوری اسلامی ایران", isHoliday: true },
  { id: "farvardin-13", month: 1, day: 13, title: "روز طبیعت", isHoliday: true },
  { id: "ordibehesht-2", month: 2, day: 2, title: "روز زمین پاک", isHoliday: false },
  { id: "ordibehesht-12", month: 2, day: 12, title: "روز معلم", isHoliday: false },
  { id: "khordad-14", month: 3, day: 14, title: "رحلت امام خمینی", isHoliday: true },
  { id: "khordad-15", month: 3, day: 15, title: "قیام ۱۵ خرداد", isHoliday: true },
  { id: "tir-7", month: 4, day: 7, title: "روز قوه قضاییه", isHoliday: false },
  { id: "tir-8", month: 4, day: 8, title: "روز مبارزه با سلاح‌های شیمیایی", isHoliday: false },
  { id: "mordad-17", month: 5, day: 17, title: "روز خبرنگار", isHoliday: false },
  { id: "shahrivar-4", month: 6, day: 4, title: "روز کارمند", isHoliday: false },
  { id: "mehr-7", month: 7, day: 7, title: "روز آتش‌نشانی و ایمنی", isHoliday: false },
  { id: "aban-13", month: 8, day: 13, title: "روز دانش‌آموز", isHoliday: false },
  { id: "azar-16", month: 9, day: 16, title: "روز دانشجو", isHoliday: false },
  { id: "dey-5", month: 10, day: 5, title: "روز ایمنی در برابر زلزله", isHoliday: false },
  { id: "bahman-22", month: 11, day: 22, title: "پیروزی انقلاب اسلامی", isHoliday: true },
  { id: "esfand-29", month: 12, day: 29, title: "روز ملی شدن صنعت نفت", isHoliday: true },
];

export function getIranCalendarEvents(month: number, day: number) {
  return iranFixedCalendarEvents.filter(
    (event) => event.month === month && event.day === day,
  );
}
