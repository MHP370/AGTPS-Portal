import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";

import Hero from "@/components/sections/Hero";
import StatusGrid from "@/components/sections/StatusGrid";
import AppGrid from "@/components/sections/AppGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Header />

      <Container>
        <Hero />

        <StatusGrid />

        <AppGrid />
      </Container>
    </main>
  );
}
