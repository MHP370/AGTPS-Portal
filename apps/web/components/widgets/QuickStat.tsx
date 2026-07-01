import { ReactNode } from "react";

type QuickStatProps = {
  title: string;
  value: string;
  icon: ReactNode;
};

export default function QuickStat({
  title,
  value,
  icon,
}: QuickStatProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:bg-white/10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500">
        {icon}
      </div>

      <div>
        <p className="text-sm text-gray-400">
          {title}
        </p>

        <h3 className="mt-1 text-2xl font-bold">
          {value}
        </h3>
      </div>
    </div>
  );
}
