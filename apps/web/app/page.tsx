import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Header />

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-20">
        <h1 className="mb-4 text-center text-5xl font-bold">
          به پرتال سازمانی AGTPS خوش آمدید
        </h1>

        <p className="mb-16 max-w-3xl text-center text-gray-400">
          نقطه شروع تمام سامانه‌های سازمان
        </p>

        <div className="flex h-80 w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <span className="text-3xl text-gray-500">
            🗺️ نقشه تعاملی ایران (به‌زودی)
          </span>
        </div>
      </section>
    </main>
  );
}
