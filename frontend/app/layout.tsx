import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LUMORA | Cerita Bisnis, Peluang Nyata",
    template: "%s | LUMORA",
  },
  description:
    "Temukan UMKM Indonesia, pelajari perjalanan usahanya, dan mulai percakapan dengan pemilik bisnis melalui LUMORA.",
  icons: {
    icon: "/img/logo.png",
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink">
        {children}
      </body>
    </html>
  );
}
