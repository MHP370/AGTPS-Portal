export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          ورود به AGTPS Portal
        </h1>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            placeholder="نام کاربری"
          />

          <input
            type="password"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            placeholder="رمز عبور"
          />

          <button className="w-full rounded-xl bg-emerald-500 py-3 font-semibold transition hover:bg-emerald-600">
            ورود
          </button>
        </div>
      </div>
    </main>
  );
}
