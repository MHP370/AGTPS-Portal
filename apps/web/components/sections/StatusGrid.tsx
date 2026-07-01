import StatusWidget from "@/components/widgets/StatusWidget";

export default function StatusGrid() {
  return (
    <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

      <StatusWidget
        title="کاربران آنلاین"
        value="154"
        color="bg-green-500"
      />

      <StatusWidget
        title="سامانه‌های فعال"
        value="28"
        color="bg-cyan-500"
      />

      <StatusWidget
        title="هشدارهای امنیتی"
        value="2"
        color="bg-red-500"
      />

      <StatusWidget
        title="درخواست‌های امروز"
        value="413"
        color="bg-yellow-500"
      />

    </section>
  );
}
