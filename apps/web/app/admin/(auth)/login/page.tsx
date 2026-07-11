"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { hasAuthSession, login, setAuthSession } from "@/lib/auth";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import Logo from "@/components/layout/Logo";
import { useSettings } from "@/hooks/useSettings";

function AdminLoginForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const { data: settings } = useSettings();
  const requestedNextPath = searchParams.get("next");
  const nextPath =
    requestedNextPath?.startsWith("/admin/") &&
    !requestedNextPath.startsWith("/admin/login")
      ? requestedNextPath
      : "/admin/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const backgroundImageUrl =
    settings?.portalBackgroundImageUrl || "/images/logo/apgt-logo.png";
  const overlayColor = settings?.portalBackgroundOverlayColor || "#020617";
  const overlayOpacity = settings?.portalBackgroundOverlayOpacity ?? 0.78;

  useEffect(() => {
    if (hasAuthSession()) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login({
        username,
        password,
      });

      setAuthSession(result);

      router.push(nextPath);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "نام کاربری یا رمز عبور اشتباه است.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.92))]" />

      <motion.section
        initial={
          reduceMotion
            ? false
            : { opacity: 0, y: 24, scale: 0.98, filter: "blur(10px)" }
        }
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
        }
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/35 backdrop-blur-2xl"
      >
        <div className="mb-8 flex flex-col items-center gap-5 text-center">
          <Logo compact />
          <div>
            <h1 className="text-3xl font-black text-white">AGTPS Portal</h1>
            <p className="mt-2 text-sm text-slate-400">ورود به پنل مدیریت</p>
          </div>
        </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <FormField
              label="نام کاربری"
              required
            >
              <Input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="نام کاربری"
                autoComplete="username"
              />
            </FormField>

            <FormField
              label="رمز عبور"
              required
            >
              <Input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="رمز عبور"
                autoComplete="current-password"
              />
            </FormField>

            {error && (
              <AnimatePresence>
                <motion.div
                  initial={
                    reduceMotion ? false : { opacity: 0, y: -8, height: 0 }
                  }
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-6 text-red-100"
                >
                  {error}
                </motion.div>
              </AnimatePresence>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
      </motion.section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
