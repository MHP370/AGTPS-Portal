import Logo from "./Logo";
import Container from "../ui/Container";
import { Bell, Search, User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Search */}
        <div className="hidden w-full max-w-xl items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 md:flex">

          <Search
            size={18}
            className="mr-3 text-gray-400"
          />

          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
            placeholder="جستجو در سامانه‌ها..."
          />

          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-400">
            Ctrl + K
          </span>

        </div>

        {/* Right */}
        <div className="flex items-center gap-5">

          <button className="relative">
            <Bell
              size={22}
              className="text-gray-300"
            />

            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs">
              3
            </span>

          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
            <User size={20} />
          </div>

        </div>

      </Container>
    </header>
  );
}
