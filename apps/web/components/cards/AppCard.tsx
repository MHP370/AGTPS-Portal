import { ArrowLeft } from "lucide-react";

type AppCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
};

export default function AppCard({
  icon,
  title,
  description,
  color = "bg-emerald-500",
}: AppCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-white/10">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
      >
        {icon}
      </div>

      <h3 className="mb-2 text-xl font-bold text-white">
        {title}
      </h3>

      <p className="mb-6 text-sm text-gray-400">
        {description}
      </p>

      <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold transition hover:bg-emerald-600">
        ورود
        <ArrowLeft size={16} />
      </button>
    </div>
  );
}
