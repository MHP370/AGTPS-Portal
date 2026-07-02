"use client";

import { Search } from "lucide-react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder = "جستجو...",
}: SearchBoxProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search
        size={18}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pr-10 pl-4 text-sm outline-none transition focus:border-emerald-500"
      />
    </div>
  );
}
