import { Bell, Search, User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <div>
          <h1 className="text-xl font-bold text-emerald-400">
            AGTPS Portal
          </h1>

          <p className="text-xs text-gray-400">
            Assaluyeh Gas Turbine Power Station
          </p>
        </div>

        {/* Search */}
        <div className="hidden w-full max-w-md items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 md:flex">
          <Search size={18} className="mr-2 text-gray-400" />

          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
            placeholder="جستجو در سامانه‌ها..."
          />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">

          <Bell
            size={20}
            className="cursor-pointer text-gray-300 transition hover:text-white"
          />

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
            <User size={18} />
          </div>

        </div>

      </div>
    </header>
  );
}
