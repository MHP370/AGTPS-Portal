"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import { Button } from "@/components/ui/Button";
import { useAuthUser, useUpdateProfile } from "@/hooks/useAuthUser";

export function ProfileCompletionDialog() {
  const { data: user } = useAuthUser();
  const updateProfile = useUpdateProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [personnelCode, setPersonnelCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const missingFields = user?.missingProfileFields ?? [];
  const open = Boolean(user?.profileCompletionRequired);

  useEffect(() => {
    if (!user) return;

    const timer = window.setTimeout(() => {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPersonnelCode(user.personnelCode ?? "");
      setBirthDate(user.birthDate ?? "");
      setError("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (missingFields.includes("personnelCode") && !personnelCode.trim()) {
      setError("کد پرسنلی الزامی است.");
      return;
    }

    if (missingFields.includes("birthDate") && !birthDate) {
      setError("تاریخ تولد الزامی است.");
      return;
    }

    setError("");

    try {
      await updateProfile.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        personnelCode: personnelCode.trim() || undefined,
        birthDate: birthDate || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ذخیره اطلاعات پروفایل انجام نشد.",
      );
    }
  }

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={() => undefined}
      title="تکمیل اطلاعات کاربری"
      className="max-w-2xl bg-slate-950/95"
    >
      <form onSubmit={submit} className="space-y-5 text-right" dir="rtl">
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-100">
            <UserRound size={24} />
          </span>
          <div>
            <h3 className="font-black text-cyan-50">
              اطلاعات پایه حساب شما کامل نیست
            </h3>
            <p className="mt-2 text-sm leading-7 text-cyan-100/75">
              برای ادامه استفاده از پورتال، لطفا اطلاعات الزامی را تکمیل کنید.
              این پیام بیشتر برای کاربران اکتیو دایرکتوری در اولین ورود کاربرد
              دارد.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200">نام</span>
            <Input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              disabled={updateProfile.isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200">
              نام خانوادگی
            </span>
            <Input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              disabled={updateProfile.isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200">
              کد پرسنلی
              {missingFields.includes("personnelCode") && (
                <span className="mr-1 text-red-400">*</span>
              )}
            </span>
            <Input
              value={personnelCode}
              onChange={(event) => setPersonnelCode(event.target.value)}
              disabled={updateProfile.isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-200">
              تاریخ تولد
              {missingFields.includes("birthDate") && (
                <span className="mr-1 text-red-400">*</span>
              )}
            </span>
            <PersianDateInput
              value={birthDate}
              onChange={setBirthDate}
              disabled={updateProfile.isPending}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "در حال ذخیره..." : "ذخیره و ادامه"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
