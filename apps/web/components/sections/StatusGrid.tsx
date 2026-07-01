import StatusWidget from "@/components/widgets/StatusWidget";
import { statusWidgets } from "@/lib/dashboard";

export default function StatusGrid() {
  return (
    <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {statusWidgets.map((item) => (
        <StatusWidget
          key={item.title}
          title={item.title}
          value={item.value}
          color={item.color}
        />
      ))}
    </section>
  );
}
