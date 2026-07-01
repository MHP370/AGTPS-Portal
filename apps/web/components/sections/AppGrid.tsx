import AppCard from "@/components/cards/AppCard";
import {
  Building2,
  Database,
  Shield,
} from "lucide-react";

export default function AppGrid() {
  return (
    <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

      <AppCard
        icon={<Building2 size={30} />}
        title="دفتر مرکزی"
        description="ورود به سامانه‌های دفتر مرکزی"
      />

      <AppCard
        icon={<Database size={30} />}
        title="سایت عسلویه"
        description="ورود به سامانه‌های نیروگاه"
        color="bg-cyan-500"
      />

      <AppCard
        icon={<Shield size={30} />}
        title="مرکز مانیتورینگ"
        description="امنیت، مانیتورینگ و گزارش‌ها"
        color="bg-orange-500"
      />

    </section>
  );
}
