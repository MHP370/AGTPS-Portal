import AppCard from "@/components/cards/AppCard";
import { appCards } from "@/lib/dashboard";

import {
  Building2,
  Database,
  Shield,
} from "lucide-react";

const icons = {
  building: <Building2 size={30} />,
  database: <Database size={30} />,
  shield: <Shield size={30} />,
};

export default function AppGrid() {
  return (
    <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {appCards.map((item) => (
        <AppCard
          key={item.title}
          icon={icons[item.icon as keyof typeof icons]}
          title={item.title}
          description={item.description}
          color={item.color}
        />
      ))}
    </section>
  );
}
