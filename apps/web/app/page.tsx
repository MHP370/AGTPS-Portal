import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";

import QuickStats from "@/components/sections/QuickStats";
import MapContainer from "@/components/map/MapContainer";
import AppGrid from "@/components/sections/AppGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Header />

      <Container>
        <section className="py-10">
          <QuickStats />

          <MapContainer />

          <AppGrid />
        </section>
      </Container>
    </main>
  );
}
