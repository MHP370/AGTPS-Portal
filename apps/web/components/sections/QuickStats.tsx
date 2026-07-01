import {
  Users,
  Server,
  Bell,
  Activity,
} from "lucide-react";

import QuickStat from "@/components/widgets/QuickStat";

export default function QuickStats() {
  return (
    <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

      <QuickStat
        title="کاربران آنلاین"
        value="154"
        icon={<Users size={28} />}
      />

      <QuickStat
        title="سرویس‌های فعال"
        value="28"
        icon={<Server size={28} />}
      />

      <QuickStat
        title="هشدارهای فعال"
        value="2"
        icon={<Bell size={28} />}
      />

      <QuickStat
        title="سلامت سامانه"
        value="99.9%"
        icon={<Activity size={28} />}
      />

    </section>
  );
}
