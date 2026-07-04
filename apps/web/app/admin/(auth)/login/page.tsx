"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { hasAuthSession, login, setAuthSession } from "@/lib/auth";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    } catch (err: any) {
      setError(
        err?.message || "نام کاربری یا رمز عبور اشتباه است.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-center text-3xl font-bold text-white">
            AGTPS Portal
          </h1>

          <p className="mt-2 text-center text-slate-400">
            ورود به پنل مدیریت
          </p>
        </CardHeader>

        <CardContent>
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
              <div className="rounded-lg border border-red-700 bg-red-900/20 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
        </CardContent>
      </Card>
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
