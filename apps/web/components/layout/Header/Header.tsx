"use client";

export function Header() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const fullName =
    user
      ? [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
      : "";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-8">
      <div>
        <h2 className="text-lg font-semibold text-white">
          AGTPS Portal
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-left">
          <div className="text-sm font-medium text-white">
            {fullName || user?.username || "Guest"}
          </div>

          <div className="text-xs text-slate-400">
            Administrator
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {(fullName || user?.username || "A")
            .charAt(0)
            .toUpperCase()}
        </div>
      </div>
    </header>
  );
}
