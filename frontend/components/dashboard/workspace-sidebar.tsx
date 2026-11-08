"use client";

import {
  LayoutDashboard,
  Store,
  BookOpen,
  PanelsTopLeft,
  Handshake,
  Sparkles,
  Send,
  MessageSquare,
  History,
  Bell,
  Settings,
  X,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/layout/logo";
import type { WorkspaceView } from "@/lib/dashboard";
import styles from "./workspace.module.css";

interface WorkspaceNavItem {
  label: string;
  view: WorkspaceView;
  icon: LucideIcon;
}

interface WorkspaceNavGroup {
  label: string;
  items: WorkspaceNavItem[];
}

const groups: WorkspaceNavGroup[] = [
  {
    label: "Menu utama",
    items: [
      { label: "Dashboard", view: "overview", icon: LayoutDashboard },
      { label: "Profil Bisnis", view: "profiles", icon: Store },
      { label: "Cerita Usaha", view: "story", icon: BookOpen },
      { label: "Business Model Canvas", view: "canvas", icon: PanelsTopLeft },
    ],
  },
  {
    label: "Kemitraan & Kolaborasi",
    items: [
      { label: "Peluang & Mitra", view: "saved", icon: Handshake },
      { label: "Permintaan Kolaborasi", view: "requests", icon: Send },
      { label: "Inbox / Pesan", view: "inbox", icon: MessageSquare },
      { label: "Riwayat Kemitraan", view: "history", icon: History },
      { label: "Notifikasi", view: "notifications", icon: Bell },
      { label: "Lumora AI", view: "ai", icon: Sparkles },
    ],
  },
  {
    label: "Akun",
    items: [{ label: "Pengaturan Akun", view: "settings", icon: Settings }],
  },
];

export function WorkspaceSidebar({
  view,
  onNavigate,
}: {
  view: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
}) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={`${styles.navigation} flex h-full min-h-0 flex-col`}>
        <SidebarHeader className={collapsed ? "items-center px-3 py-4" : "p-3 sm:p-4"}>
          <div
            className={
              collapsed
                ? "flex w-full justify-center"
                : "flex items-center justify-between rounded-xl bg-ivory px-3.5 py-2"
            }
          >
            {collapsed ? (
              <button
                type="button"
                onClick={() => onNavigate("overview")}
                aria-label="LUMORA — beranda"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ivory focus-visible:outline-2 focus-visible:outline-forest"
              >
                <Image
                  src="/img/logo-symbol.png"
                  alt=""
                  width={301}
                  height={422}
                  loading="eager"
                  sizes="26px"
                  className="h-9 w-auto object-contain"
                />
              </button>
            ) : (
              <Logo
                onClick={() => {
                  onNavigate("overview");
                  if (isMobile) setOpenMobile(false);
                }}
              />
            )}
            {isMobile ? (
              <button
                type="button"
                aria-label="Tutup navigasi"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-forest hover:bg-forest/10 transition-colors ml-2"
                onClick={() => setOpenMobile(false)}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </SidebarHeader>
        <SidebarContent className={`gap-3 ${collapsed ? "px-3" : "px-2"}`}>
          <nav aria-label="Navigasi workspace">
            {groups.map((group) => (
              <SidebarGroup key={group.label} className="px-0">
                {!collapsed ? (
                  <SidebarGroupLabel className="text-[11px] font-medium tracking-wide text-white/65">
                    {group.label}
                  </SidebarGroupLabel>
                ) : null}
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        size="lg"
                        className={`${styles.menuButton} min-h-11 ${
                          collapsed ? "justify-center" : ""
                        } hover:bg-white/10 ${
                          view === item.view ? "bg-lime text-forest font-semibold" : "text-white"
                        }`}
                        isActive={view === item.view}
                        aria-current={view === item.view ? "page" : undefined}
                        aria-label={item.label}
                        onClick={() => {
                          onNavigate(item.view);
                          setOpenMobile(false);
                        }}
                      >
                        <item.icon aria-hidden="true" />
                        {!collapsed ? <span>{item.label}</span> : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/15 p-3 pb-8 sm:pb-3">
          <SidebarMenuButton
            asChild
            size="lg"
            className={`${styles.menuButton} min-h-11 text-white hover:bg-white/10 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Link href="/" aria-label="Lihat website">
              <ArrowUpRight aria-hidden="true" />
              {!collapsed ? <span>Lihat website</span> : null}
            </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
