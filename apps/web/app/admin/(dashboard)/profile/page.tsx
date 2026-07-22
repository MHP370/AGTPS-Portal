"use client";

import Link from "next/link";
import { Award, CalendarDays, GraduationCap, LockKeyhole, Network, ShieldCheck, UserRound } from "lucide-react";
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
import { useMyCourses } from "@/hooks/useTrainings";
import type { MyCourseParticipation } from "@/lib/trainings";

function displayName(user?: AuthUser | null) {
  if (!user) return "کاربر";
  return (
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.directoryUser?.displayName ||
    user.username
  );
}

function formatCourseDate(value?: string | null) {
  if (!value) return "ثبت نشده";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function courseStage(item: MyCourseParticipation) {
  if (item.training.status === "CANCELLED") return "لغو شده";
  if (item.attendanceStatus === "ABSENT") return "غایب";
  if (item.result === "PASSED") return "پایان موفق";
  if (item.result === "FAILED") return "نیازمند پیگیری";
  if (item.attendanceStatus === "ATTENDED") return "شرکت کرده";
  if (item.training.status === "COMPLETED") return "نتیجه در انتظار ثبت";
  if (["APPROVED", "OPEN"].includes(item.training.status)) return "ثبت‌نام شده";
  return "برنامه‌ریزی شده";
}

export default function AdminProfilePage() {
  const { data: user, isLoading } = useAuthUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangeOwnPassword();
  const { data: myCourses = [], isLoading: myCoursesLoading } = useMyCourses();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
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
      setMobile(user.mobile ?? "");
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
        email: user?.allowEmailChange || user?.authSource === "ACTIVE_DIRECTORY" ? email.trim() || undefined : undefined,
        mobile: mobile.trim() || undefined,
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
            اطلاعات حساب و مشخصات فردی شما در پورتال.
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
                        updateProfile.isPending || (!user?.allowEmailChange && user?.authSource !== "ACTIVE_DIRECTORY")
                      }
                    />
                    {!user?.allowEmailChange && user?.authSource !== "ACTIVE_DIRECTORY" && (
                      <span className="block text-xs text-slate-500">
                        تغییر ایمیل برای این حساب توسط ادمین غیرفعال شده است.
                      </span>
                    )}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-200">{"\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644"}</span>
                    <Input value={mobile} onChange={(event) => setMobile(event.target.value)} dir="ltr" inputMode="tel" disabled={updateProfile.isPending || !user?.allowProfileEdit} />
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
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="text-cyan-200" size={24} />
                  <div>
                    <h2 className="text-xl font-black text-white">آموزش‌ها و دوره‌های من</h2>
                    <p className="mt-1 text-xs text-slate-400">وضعیت حضور، نتیجه آزمون و اطلاعات گواهی شما به‌صورت زنده نمایش داده می‌شود.</p>
                  </div>
                </div>
                <Badge variant="info">{myCourses.length.toLocaleString("fa-IR")} دوره</Badge>
              </div>

              {myCoursesLoading ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">در حال دریافت سوابق آموزشی...</p>
              ) : myCourses.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">هنوز دوره‌ای برای شما ثبت نشده است.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {myCourses.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-white">{item.training.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">{item.training.category?.name ?? "بدون دسته"}</p>
                        </div>
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">{courseStage(item)}</span>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <p className="flex items-center gap-2 text-slate-300"><CalendarDays size={16} className="text-cyan-200" />{formatCourseDate(item.training.startDate)}</p>
                        <p className="text-slate-300">حضور: {{ REGISTERED: "ثبت‌نام شده", ATTENDED: "حاضر", ABSENT: "غایب", EXCUSED: "موجه" }[item.attendanceStatus]}</p>
                        <p className="text-slate-300">نتیجه: {{ NO_EXAM: "بدون آزمون / ثبت نشده", PASSED: "قبول", FAILED: "مردود" }[item.result]}</p>
                        <p className="text-slate-300">نمره: {item.score == null ? "ثبت نشده" : item.score.toLocaleString("fa-IR")}</p>
                      </div>
                      {item.training.hasCertificate && (
                        <div className="mt-4 space-y-2 rounded-xl border border-amber-300/15 bg-amber-400/[0.06] p-3 text-sm text-amber-100">
                          <div className="flex items-center gap-2">
                          <Award size={18} />
                          {item.certificateNumber ? `شماره گواهی: ${item.certificateNumber}` : "گواهی هنوز صادر نشده است."}
                          </div>
                          {item.certificates?.map((certificate) => (
                            <Link key={certificate.id} href={`/training-certificates/${certificate.id}`} className="block text-xs font-bold text-cyan-200 underline">مشاهده، چاپ یا دانلود گواهی {certificate.certificateNumber}</Link>
                          ))}
                        </div>
                      )}
                      {item.training.exam?.isPublished && (
                        <Link href={`/training-exams/${item.training.id}`} className="mt-4 inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300">
                          شرکت در آزمون دوره
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              )}
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

            {user?.permissions.includes("directory.manage") && (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
