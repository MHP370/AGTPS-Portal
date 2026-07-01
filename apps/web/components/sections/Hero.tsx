import GlassCard from "@/components/ui/GlassCard";

export default function Hero() {
  return (
    <section className="py-20">

      <h1 className="text-center text-5xl font-bold">
        خوش آمدید به پرتال سازمانی AGTPS
      </h1>

      <p className="mt-4 text-center text-gray-400">
        نقطه شروع تمام سامانه‌های سازمان
      </p>

      <GlassCard className="mt-12 flex h-[340px] w-full items-center justify-center">
        <h2 className="text-3xl font-bold text-gray-400">
          🗺️ نقشه تعاملی ایران (بزودی)
        </h2>
      </GlassCard>

    </section>
  );
}
