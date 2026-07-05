"use client";

import {
  getJalaliMonthLength,
  gregorianToJalali,
  jalaliMonthNames,
  jalaliToGregorian,
} from "@/lib/jalali";

interface PersianDateInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function getCurrentJalaliDate() {
  return gregorianToJalali(new Date().toISOString().slice(0, 10)) ?? {
    jy: 1405,
    jm: 1,
    jd: 1,
  };
}

export function PersianDateInput({
  value,
  onChange,
  disabled = false,
}: PersianDateInputProps) {
  const current = getCurrentJalaliDate();
  const selected = gregorianToJalali(value) ?? current;
  const years = Array.from(
    { length: 21 },
    (_, index) => current.jy - 5 + index,
  );
  const daysInMonth = getJalaliMonthLength(selected.jy, selected.jm);
  const day = Math.min(selected.jd, daysInMonth);

  function update(next: Partial<typeof selected>) {
    const jy = next.jy ?? selected.jy;
    const jm = next.jm ?? selected.jm;
    const maxDay = getJalaliMonthLength(jy, jm);
    const jd = Math.min(next.jd ?? day, maxDay);

    onChange(jalaliToGregorian(jy, jm, jd));
  }

  const className =
    "h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
      <select
        value={day}
        onChange={(event) => update({ jd: Number(event.target.value) })}
        disabled={disabled}
        className={className}
        aria-label="روز شمسی"
      >
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
          (item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ),
        )}
      </select>

      <select
        value={selected.jm}
        onChange={(event) => update({ jm: Number(event.target.value) })}
        disabled={disabled}
        className={className}
        aria-label="ماه شمسی"
      >
        {jalaliMonthNames.map((month, index) => (
          <option key={month} value={index + 1}>
            {month}
          </option>
        ))}
      </select>

      <select
        value={selected.jy}
        onChange={(event) => update({ jy: Number(event.target.value) })}
        disabled={disabled}
        className={className}
        aria-label="سال شمسی"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
