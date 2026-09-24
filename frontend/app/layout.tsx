import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";

// Geist leads and Inter follows, per PRD 8.3. Geist ships with Next.js so it
// costs no extra request, and both are self-hosted by next/font so the browser
// never calls Google. Geist Mono is deliberately not loaded: nothing in the
// design uses monospace.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// The PRD wrote the title with an em dash. R-02 bans that character in text the
// agent writes, so the separator is a pipe instead. Same meaning, allowed glyph.
export const metadata: Metadata = {
  title: {
    default: "LUMORA | Digital Pitching untuk UMKM",
    template: "%s | LUMORA",
  },
  description:
    "Bangun profil bisnis UMKM yang lebih profesional, ceritakan perjalanan usahamu, dan temukan peluang kolaborasi bersama LUMORA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink">
        {children}
      </body>
    </html>
  );
}
