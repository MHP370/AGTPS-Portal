"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";

import Logo from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/hooks/useSettings";
import {
  detectWindowsIdentity,
  getLoginOptions,
  hasAuthSession,
  loginWithWindowsIdentity,
  setAuthSession,
  type WindowsIdentity,
} from "@/lib/auth";

function PortalLoginChooser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: settings } = useSettings();
  const requestedNext = searchParams.get("next");
  const nextPath = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/";
  const [identity, setIdentity] = useState<WindowsIdentity | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const backgroundImageUrl =
    settings?.portalBackgroundImageUrl || "/images/logo/apgt-logo.png";
  const overlayColor = settings?.portalBackgroundOverlayColor || "#020617";
  const overlayOpacity = settings?.portalBackgroundOverlayOpacity ?? 0.78;

  useEffect(() => {
    if (hasAuthSession()) {
      router.replace(nextPath);
      return;
    }
    getLoginOptions()
      .then((options) => {
        if (!options.windowsSso.enabled) {
          setError("ورود خودکار ویندوز در تنظیمات سامانه فعال نیست.");
          return null;
        }
        return detectWindowsIdentity();
      })
      .then((detectedIdentity) => {
        if (detectedIdentity) setIdentity(detectedIdentity);
      })
      .catch(() => setError("حساب دامنه ویندوز شناسایی نشد. می‌توانید ورود دستی را انتخاب کنید."))
      .finally(() => setDetecting(false));
  }, [nextPath, router]);

  async function confirmWindowsLogin() {
    setLoggingIn(true);
    setError("");
    try {
      const session = await loginWithWindowsIdentity();
      setAuthSession(session);
      router.replace(nextPath);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "ورود خودکار انجام نشد.");
    } finally {
      setLoggingIn(false);
    }
  }

  const manualUrl = `/admin/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-4 text-white sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
      <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.14),transparent_32%)]" />
      <section className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo compact />
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">ورود به پورتال AGTPS</h1>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              برای استفاده از پورتال، روش ورود خود را انتخاب کنید.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 shrink-0 text-cyan-300" />
              <div className="min-w-0 flex-1">
                <h2 className="font-black">ورود خودکار با حساب ویندوز</h2>
                {detecting ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                    <LoaderCircle className="animate-spin" size={17} /> در حال شناسایی حساب دامنه...
                  </p>
                ) : identity ? (
                  <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                    ورود به عنوان <strong className="text-white">{identity.displayName}</strong>{" "}
                    <span dir="ltr">({identity.username}@{identity.domain})</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-400">حساب دامنه قابل شناسایی نیست.</p>
                )}
              </div>
            </div>
            <Button
              type="button"
              className="mt-5 w-full"
              disabled={!identity || detecting || loggingIn}
              onClick={confirmWindowsLogin}
            >
              <LogIn size={18} />
              {loggingIn ? "در حال ورود..." : "تأیید و ورود خودکار"}
            </Button>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => router.push(manualUrl)}
          >
            <KeyRound size={18} /> ورود دستی با نام کاربری و رمز عبور
          </Button>

          {error && (
            <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default function PortalLoginPage() {
  return <Suspense><PortalLoginChooser /></Suspense>;
}
