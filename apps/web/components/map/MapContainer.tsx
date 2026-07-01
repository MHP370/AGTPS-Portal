import GlassCard from "@/components/ui/GlassCard";
import IranMap from "./IranMap";

export default function MapContainer() {
  return (
    <GlassCard className="mt-12 overflow-hidden">

      <div className="border-b border-white/10 p-5">

        <h2 className="text-xl font-bold">
          نقشه عملیاتی کشور
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          وضعیت آنلاین سایت‌ها و نیروگاه‌ها
        </p>

      </div>

      <div className="h-[520px]">

        <IranMap />

      </div>

    </GlassCard>
  );
}
