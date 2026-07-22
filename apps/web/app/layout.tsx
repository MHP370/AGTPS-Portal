import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const apiBaseUrl =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3002/api";

type BrandingSettings = {
  favicon?: string | null;
};

export async function generateMetadata(): Promise<Metadata> {
  let favicon = "/favicon.ico";

  try {
    const response = await fetch(`${apiBaseUrl}/settings`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2_000),
    });

    if (response.ok) {
      const settings = (await response.json()) as BrandingSettings;
      favicon = settings.favicon?.trim() || favicon;
    }
  } catch {
    // Keep the built-in favicon when settings are temporarily unavailable.
  }

  return {
    title: {
      default: "AGTPS Portal",
      template: "%s | AGTPS Portal",
    },
    description: "AGTPS Enterprise Portal",
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${geistMono.variable}`}
    >
     <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
   <QueryProvider>
  {children}
</QueryProvider>
</body>
    </html>
  );
}
