"use client";

import { LockKeyhole, Network, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminLogoutButton } from "@/components/auth/AdminLogoutButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import {
  useAuthUser,
  useChangeOwnPassword,
  useUpdateProfile,
} from "@/hooks/useAuthUser";
import type { AuthUser } from "@/lib/auth";

function displayName(user?: AuthUser | null) {
  if (!user) return "کاربر";
  return (
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.directoryUser?.displayName ||
    user.username
  );
}

export default function AdminProfilePage() {
  const { data: user, isLoading } = useAuthUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangeOwnPassword();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [personnelCode, setPersonnelCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const roleDetails = user?.roleDetails?.length
    ? user.roleDetails
    : (user?.roles.map((role) => ({ id: role, name: role, title: role })) ??
      []);

  useEffect(() => {
    if (!user) return;

    const timer = window.setTimeout(() => {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
      setPersonnelCode(user.personnelCode ?? "");
      setBirthDate(user.birthDate ?? "");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  async function submitProfile(event: React.FormEvent) {
    event.preventDefault();
    setFormMessage("");
    setFormError("");

    try {
      await updateProfile.mutateAsync({
        email: user?.allowEmailChange ? email.trim() || undefined : undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        personnelCode: personnelCode.trim() || undefined,
        birthDate: birthDate || undefined,
      });
      setFormMessage("اطلاعات پروفایل ذخیره شد.");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "ذخیره پروفایل انجام نشد.",
      );
    }
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("رمز جدید باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("رمز عبور تغییر کرد.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "تغییر رمز انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">پروفایل کاربری</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            اطلاعات حساب، نوع ورود، نقش‌ها و گروه‌های سازمانی شما در پورتال.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      {isLoading && !user ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
          در حال بارگذاری پروفایل...
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                  <UserRound size={30} />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {displayName(user)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {user?.username} · {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={user?.isActive ? "success" : "danger"}>
                  {user?.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <Badge variant="info">
                  {user?.authSource === "ACTIVE_DIRECTORY"
                    ? "Active Directory"
                    : "داخلی"}
                </Badge>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
              <div className="mb-4 flex items-center gap-3">
                <UserRound className="text-cyan-200" size={22} />
                <h2 className="text-xl font-black text-white">
                  اطلاعات فردی
                </h2>
              </div>

              <form onSubmit={submitProfile} className="space-y-4">
                {(formError || formMessage) && (
                  <div
                    className={
                      formError
                        ? "rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
                        : "rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200"
                    }
                  >
                    {formError || formMessage}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-bold text-slate-200">
                      ایمیل
                    </span>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={
                        updateProfile.isPending || !user?.allowEmailChange
                      }
                    />
                    {!user?.allowEmailChange && (
                      <span className="block text-xs text-slate-500">
                        تغییر ایمیل برای این حساب توسط ادمین غیرفعال شده است.
                      </span>
                    )}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-200">
                      نام
                    </span>
                    <Input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      disabled={
                        updateProfile.isPending || !user?.allowProfileEdit
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-200">
                      نام خانوادگی
                    </span>
                    <Input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      disabled={
                        updateProfile.isPending || !user?.allowProfileEdit
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-200">
                      کد پرسنلی
                    </span>
                    <Input
                      value={personnelCode}
                      onChange={(event) =>
                        setPersonnelCode(event.target.value)
                      }
                      disabled={
                        updateProfile.isPending || !user?.allowProfileEdit
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-200">
                      تاریخ تولد
                    </span>
                    <PersianDateInput
                      value={birthDate}
                      onChange={setBirthDate}
                      disabled={
                        updateProfile.isPending || !user?.allowProfileEdit
                      }
                    />
                  </label>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending
                      ? "در حال ذخیره..."
                      : "ذخیره اطلاعات فردی"}
                  </Button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
              <div className="mb-4 flex items-center gap-3">
                <LockKeyhole className="text-cyan-200" size={22} />
                <h2 className="text-xl font-black text-white">تغییر رمز</h2>
              </div>

              {user?.authSource === "ACTIVE_DIRECTORY" ? (
                <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
                  رمز کاربران اکتیو دایرکتوری باید از مسیر رسمی AD تغییر کند.
                </p>
              ) : !user?.allowPasswordChange ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-7 text-slate-400">
                  تغییر رمز برای این حساب توسط ادمین غیرفعال شده است.
                </p>
              ) : (
                <form onSubmit={submitPassword} className="space-y-4">
                  {(passwordError || passwordMessage) && (
                    <div
                      className={
                        passwordError
                          ? "rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
                          : "rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200"
                      }
                    >
                      {passwordError || passwordMessage}
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="رمز فعلی"
                    />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="رمز جدید حداقل ۸ کاراکتر"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={
                        changePassword.isPending ||
                        !currentPassword ||
                        newPassword.length < 8
                      }
                    >
                      {changePassword.isPending
                        ? "در حال تغییر..."
                        : "تغییر رمز"}
                    </Button>
                  </div>
                </form>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="text-cyan-200" size={22} />
                <h2 className="text-xl font-black text-white">نقش‌ها</h2>
              </div>
              <div className="space-y-3">
                {roleDetails.length === 0 ? (
                  <p className="text-sm text-slate-500">نقشی ثبت نشده است.</p>
                ) : (
                  roleDetails.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <p className="font-bold text-white">{role.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{role.name}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Network className="text-cyan-200" size={22} />
                <h2 className="text-xl font-black text-white">گروه‌ها</h2>
              </div>
              <div className="space-y-3">
                {user?.directoryGroups?.length ? (
                  user.directoryGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-white">{group.title}</p>
                        <Badge
                          variant={
                            group.source === "ACTIVE_DIRECTORY"
                              ? "info"
                              : "default"
                          }
                        >
                          {group.source === "ACTIVE_DIRECTORY" ? "AD" : "داخلی"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    گروه سازمانی برای این حساب ثبت نشده است.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
