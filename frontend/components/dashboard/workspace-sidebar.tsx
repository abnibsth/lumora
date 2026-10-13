"use client";

import { LayoutDashboard, Store, BookOpen, PanelsTopLeft, Handshake, Sparkles, ChartNoAxesCombined, Settings, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/layout/logo";
import type { WorkspaceView } from "@/lib/dashboard";
import styles from "./workspace.module.css";

const groups = [
  { label: "Menu utama", items: [{ label: "Dashboard", view: "overview", icon: LayoutDashboard }, { label: "Profil Bisnis", view: "profiles", icon: Store }, { label: "Cerita Usaha", view: "story", icon: BookOpen }, { label: "Business Model Canvas", view: "canvas", icon: PanelsTopLeft }] },
  { label: "Pengembangan bisnis", items: [{ label: "Peluang & Mitra", view: "saved", icon: Handshake }, { label: "Lumora AI", view: "ai", icon: Sparkles }, { label: "Analitik Profil", view: null, icon: ChartNoAxesCombined }] },
  { label: "Akun", items: [{ label: "Pengaturan Akun", view: "settings", icon: Settings }] },
] as const;

export function WorkspaceSidebar({ view, onNavigate }: { view: WorkspaceView; onNavigate: (view: WorkspaceView) => void }) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={`${styles.navigation} flex h-full min-h-0 flex-col`}>
        <SidebarHeader className={collapsed ? "items-center px-3 py-4" : "p-4"}>
          <div className={collapsed ? "flex w-full justify-center" : "flex items-center justify-between rounded-lg bg-ivory p-3"}>
            {collapsed ? (
              <Link href="/" aria-label="LUMORA — beranda" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ivory">
                <Image src="/img/logo-symbol.png" alt="" width={301} height={422} loading="eager" sizes="26px" className="h-9 w-auto object-contain" />
              </Link>
            ) : <Logo />}
            {isMobile ? <button type="button" aria-label="Tutup navigasi" className="flex size-11 items-center justify-center text-forest" onClick={() => setOpenMobile(false)}><X className="size-5" /></button> : null}
          </div>
          {!collapsed ? <p className="px-2 pt-2 text-xs tracking-wide text-white/75">Business Workspace</p> : null}
        </SidebarHeader>
        <SidebarContent className={`gap-3 ${collapsed ? "px-3" : "px-2"}`}>
          <nav aria-label="Navigasi workspace">
            {groups.map((group) => (
              <SidebarGroup key={group.label} className="px-0">
                {!collapsed ? <SidebarGroupLabel className="text-[11px] font-medium tracking-wide text-white/65">{group.label}</SidebarGroupLabel> : null}
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton size="lg" className={`${styles.menuButton} min-h-11 ${collapsed ? "justify-center" : ""} hover:bg-white/10 ${view === item.view ? "bg-lime text-forest" : "text-white"}`} isActive={view === item.view} aria-current={view === item.view ? "page" : undefined} aria-label={item.view ? item.label : `${item.label} — Segera Hadir`} aria-disabled={!item.view || undefined} onClick={(event) => { if (!item.view) { event.preventDefault(); return; } onNavigate(item.view); setOpenMobile(false); }}>
                        <item.icon aria-hidden="true" />{!collapsed ? <span>{item.label}</span> : null}
                        {!item.view && !collapsed ? <span className="ml-auto text-[9px]">Segera Hadir</span> : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/15 p-3">
          <SidebarMenuButton asChild size="lg" className={`${styles.menuButton} min-h-11 text-white hover:bg-white/10 ${collapsed ? "justify-center" : ""}`}><Link href="/" aria-label="Lihat website"><ArrowUpRight aria-hidden="true" />{!collapsed ? <span>Lihat website</span> : null}</Link></SidebarMenuButton>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
