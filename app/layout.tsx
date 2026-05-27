import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Snoxium",
    template: "%s · Snoxium",
  },
  description: "Connected worlds, games, and experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#05050a] text-zinc-100 selection:bg-fuchsia-500/30 selection:text-zinc-50">
        <div className="relative flex min-h-full flex-col">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-600/25 via-cyan-400/10 to-indigo-500/25 blur-3xl" />
            <div className="absolute -bottom-48 right-[-12rem] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-cyan-400/12 via-indigo-500/10 to-fuchsia-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_42%),radial-gradient(circle_at_bottom,rgba(217,70,239,0.12),transparent_40%)]" />
          </div>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
