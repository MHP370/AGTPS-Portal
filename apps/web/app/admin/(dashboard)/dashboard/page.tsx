export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          داشبورد مدیریت
        </h1>

        <p className="mt-2 text-slate-400">
          به پنل مدیریت AGTPS Portal خوش آمدید.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-400">سامانه‌ها</p>

          <h2 className="mt-4 text-4xl font-bold">
            0
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-400">سایت‌ها</p>

          <h2 className="mt-4 text-4xl font-bold">
            0
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-400">اخبار</p>

          <h2 className="mt-4 text-4xl font-bold">
            0
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-400">اطلاعیه‌ها</p>

          <h2 className="mt-4 text-4xl font-bold">
            0
          </h2>
        </div>

      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h3 className="text-xl font-semibold">
          وضعیت سیستم
        </h3>

        <div className="mt-6 space-y-4">

          <div className="flex items-center justify-between">
            <span className="text-slate-400">
              Backend API
            </span>

            <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm">
              Online
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">
              Database
            </span>

            <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm">
              Connected
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
