import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
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

export const metadata: Metadata = {
  title: {
    default: "AGTPS Portal",
    template: "%s | AGTPS Portal",
  },
  description: "AGTPS Enterprise Portal",
};

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
