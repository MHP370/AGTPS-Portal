"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";

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

interface PersianDateTimeInputProps extends PersianDateInputProps {
  minuteStep?: number;
}

const MIN_JALALI_YEAR = 1300;
const MAX_JALALI_YEAR = 1500;

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
  const [open, setOpen] = useState(false);
  const current = getCurrentJalaliDate();
  const selected = gregorianToJalali(value) ?? current;
  const years = Array.from(
    { length: MAX_JALALI_YEAR - MIN_JALALI_YEAR + 1 },
    (_, index) => MIN_JALALI_YEAR + index,
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

  const controlClassName =
    "h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white transition hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <CalendarDays size={18} className="text-cyan-200" />
          {value
            ? `${day} ${jalaliMonthNames[selected.jm - 1]} ${selected.jy}`
            : "انتخاب تاریخ"}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
          <div className="grid grid-cols-[1fr_1.35fr] gap-2">
            <select
              value={selected.jy}
              onChange={(event) => update({ jy: Number(event.target.value) })}
              className={controlClassName}
              aria-label="سال شمسی"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={selected.jm}
              onChange={(event) => update({ jm: Number(event.target.value) })}
              className={controlClassName}
              aria-label="ماه شمسی"
            >
              {jalaliMonthNames.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    update({ jd: item });
                    setOpen(false);
                  }}
                  className={`grid h-9 place-items-center rounded-lg text-sm font-bold transition ${
                    item === day
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function splitDateTime(value: string) {
  const [date = "", time = ""] = value.split("T");
  return {
    date,
    time: time.slice(0, 5) || "08:00",
  };
}

export function PersianDateTimeInput({
  value,
  onChange,
  disabled = false,
  minuteStep = 5,
}: PersianDateTimeInputProps) {
  const { date, time } = splitDateTime(value);

  function updateDate(nextDate: string) {
    onChange(nextDate ? `${nextDate}T${time}` : "");
  }

  function updateTime(nextTime: string) {
    if (!date) {
      const today = new Date().toISOString().slice(0, 10);
      onChange(`${today}T${nextTime}`);
      return;
    }

    onChange(`${date}T${nextTime}`);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
      <PersianDateInput value={date} onChange={updateDate} disabled={disabled} />
      <input
        type="time"
        value={time}
        step={minuteStep * 60}
        onChange={(event) => updateTime(event.target.value)}
        disabled={disabled}
        className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="ساعت"
      />
    </div>
  );
}
