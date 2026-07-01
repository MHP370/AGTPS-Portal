import {
  Minus,
  Plus,
  RotateCcw,
  LocateFixed,
} from "lucide-react";

export default function MapToolbar() {
  return (
    <div className="absolute left-6 top-6 z-10 flex flex-col gap-3">

      <button className="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:bg-slate-800">
        <Plus size={18} />
      </button>

      <button className="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:bg-slate-800">
        <Minus size={18} />
      </button>

      <button className="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:bg-slate-800">
        <RotateCcw size={18} />
      </button>

      <button className="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:bg-slate-800">
        <LocateFixed size={18} />
      </button>

    </div>
  );
}
