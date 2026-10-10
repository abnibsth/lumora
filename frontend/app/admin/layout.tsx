import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
export const metadata: Metadata = { title: "CMS Admin", description: "Prototype administrasi LUMORA", robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen w-full bg-[#f5f2e9] text-[#14382f]" style={{ "--primary": "#123f32", "--primary-foreground": "#ffffff", "--background": "#f5f2e9", "--foreground": "#14382f", "--sidebar": "#fbfaf6", "--sidebar-foreground": "#14382f", "--sidebar-accent": "#e7efe9", "--sidebar-accent-foreground": "#123f32", "--sidebar-border": "#d8d8cf", "--sidebar-ring": "#123f32", "--muted": "#e7efe9", "--muted-foreground": "#66736d", "--border": "#d8d8cf", "--ring": "#123f32" } as CSSProperties}>{children}</div>;
}
