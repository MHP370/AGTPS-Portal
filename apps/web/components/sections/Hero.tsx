import MapContainer from "@/components/map/MapContainer";

export default function Hero() {
  return (
    <section className="py-20">

      <h1 className="text-center text-5xl font-bold">
        خوش آمدید به پرتال سازمانی AGTPS
      </h1>

      <p className="mt-4 text-center text-gray-400">
        نقطه شروع تمام سامانه‌های سازمان
      </p>

      <MapContainer />

    </section>
  );
}
