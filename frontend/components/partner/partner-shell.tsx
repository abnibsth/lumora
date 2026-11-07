"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Building2,
  SlidersHorizontal,
  Handshake,
  MessageSquare,
  History,
  Bell,
  Settings,
  LogOut,
  PanelLeft,
  ArrowUpRight,
  ChevronDown,
  X,
  LucideIcon,
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
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/layout/logo";
import type { PartnerDashboardView } from "@/types/partner";
import type { User } from "@/types/user";
import styles from "../dashboard/workspace.module.css";

const titles: Record<PartnerDashboardView, string> = {
  dashboard: "Partner Dashboard",
  explore: "Jelajahi UMKM",
  saved: "Bisnis Tersimpan",
  profile: "Profil Mitra",
  preferences: "Preferensi Kemitraan",
  requests: "Permintaan Kolaborasi",
  inbox: "Inbox & Pesan",
  history: "Riwayat Kemitraan",
  notifications: "Notifikasi",
  settings: "Pengaturan Akun",
};

interface NavItem {
  label: string;
  view: PartnerDashboardView | null;
  icon: LucideIcon;
  badge?: string;
  count?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function PartnerSidebar({
  view,
  onNavigate,
  savedCount = 0,
  unreadNotifCount = 0,
}: {
  view: PartnerDashboardView;
  onNavigate: (view: PartnerDashboardView) => void;
  savedCount?: number;
  unreadNotifCount?: number;
}) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";

  const groups: NavGroup[] = [
    {
      label: "Menu Utama",
      items: [
        { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
        { label: "Jelajahi UMKM", view: "explore", icon: Compass },
        {
          label: "Bisnis Tersimpan",
          view: "saved",
          icon: Bookmark,
          count: savedCount,
        },
      ],
    },
    {
      label: "Kemitraan & Komunikasi",
      items: [
        { label: "Profil Mitra", view: "profile", icon: Building2 },
        { label: "Preferensi Kemitraan", view: "preferences", icon: SlidersHorizontal },
        { label: "Permintaan Kolaborasi", view: "requests", icon: Handshake },
        { label: "Inbox / Pesan", view: "inbox", icon: MessageSquare },
        { label: "Riwayat Kemitraan", view: "history", icon: History },
        {
          label: "Notifikasi",
          view: "notifications",
          icon: Bell,
          count: unreadNotifCount && unreadNotifCount > 0 ? unreadNotifCount : undefined,
        },
      ],
    },
    {
      label: "Akun",
      items: [{ label: "Pengaturan Akun", view: "settings", icon: Settings }],
    },
  ];

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
                onClick={() => onNavigate("dashboard")}
                aria-label="LUMORA — Dashboard"
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
                  onNavigate("dashboard");
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
          <nav aria-label="Navigasi workspace mitra">
            {groups.map((group) => (
              <SidebarGroup key={group.label} className="px-0">
                {!collapsed ? (
                  <SidebarGroupLabel className="text-[11px] font-medium tracking-wide text-white/65">
                    {group.label}
                  </SidebarGroupLabel>
                ) : null}
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => {
                    const isActive = view === item.view;
                    const isDisabled = item.view === null;

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          size="lg"
                          className={`${styles.menuButton} min-h-11 ${
                            collapsed ? "justify-center" : ""
                          } ${
                            isDisabled
                              ? "cursor-not-allowed opacity-60 text-white/60 hover:bg-transparent"
                              : isActive
                                ? "bg-lime text-forest font-semibold"
                                : "text-white hover:bg-white/10"
                          }`}
                          isActive={isActive}
                          aria-current={isActive ? "page" : undefined}
                          aria-label={
                            isDisabled ? `${item.label} — ${item.badge}` : item.label
                          }
                          aria-disabled={isDisabled || undefined}
                          onClick={(event) => {
                            if (isDisabled || !item.view) {
                              event.preventDefault();
                              return;
                            }
                            onNavigate(item.view);
                            setOpenMobile(false);
                          }}
                        >
                          <item.icon aria-hidden="true" />
                          {!collapsed ? <span>{item.label}</span> : null}
                          {!collapsed && typeof item.count === "number" && item.count > 0 ? (
                            <span
                              className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isActive ? "bg-forest text-lime" : "bg-white/20 text-white"
                              }`}
                            >
                              {item.count}
                            </span>
                          ) : null}
                          {!collapsed && item.badge ? (
                            <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-white/70">
                              {item.badge}
                            </span>
                          ) : null}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
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

function PartnerHeader({
  user,
  view,
  onViewChange,
  onLogout,
  logoutPending,
}: {
  user: User;
  view: PartnerDashboardView;
  onViewChange: (view: PartnerDashboardView) => void;
  onLogout: () => void;
  logoutPending?: boolean;
}) {
  const { toggleSidebar, open, isMobile, openMobile } = useSidebar();
  const menuRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isMobile && wasOpen.current && !openMobile) menuRef.current?.focus();
    wasOpen.current = openMobile;
  }, [isMobile, openMobile]);

  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-ivory/95 backdrop-blur-sm">
      <div className="flex min-h-18 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={menuRef}
            type="button"
            onClick={toggleSidebar}
            aria-label={
              isMobile
                ? "Buka navigasi"
                : open
                  ? "Ciutkan sidebar"
                  : "Perluas sidebar"
            }
            aria-expanded={isMobile ? openMobile : open}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-forest hover:bg-soft-green transition-colors"
          >
            <PanelLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="hidden text-[10px] font-medium uppercase tracking-[.15em] text-muted sm:block">
              LUMORA / Partner Workspace
            </p>
            <p className="truncate text-sm font-semibold text-forest">
              {titles[view]}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex min-h-11 max-w-[60%] items-center gap-2 rounded-lg px-2 text-left hover:bg-soft-green transition-colors"
            aria-label={`Menu akun ${user.name}`}
          >
            <Avatar className="size-9 bg-soft-green border border-forest/20">
              <AvatarFallback className="bg-forest text-sm font-semibold text-lime">
                {user.name.trim().slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-40 truncate text-sm font-medium text-forest">
                {user.name}
              </span>
              <span className="block text-[11px] text-muted">
                Mitra Bisnis
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={`${styles.portal} w-64 border border-line p-2 shadow-lg bg-surface`}
          >
            <DropdownMenuLabel className="break-all font-normal">
              <div className="font-semibold text-forest">{user.name}</div>
              <div className="text-xs text-muted">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-line" />
            <DropdownMenuItem
              className="min-h-11 cursor-pointer text-forest"
              onSelect={() => onViewChange("profile")}
            >
              <Building2 className="size-4 mr-2" />
              Profil Mitra
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11 cursor-pointer text-forest"
              onSelect={() => onViewChange("preferences")}
            >
              <SlidersHorizontal className="size-4 mr-2" />
              Preferensi Kemitraan
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11 cursor-pointer text-forest"
              onSelect={() => onViewChange("settings")}
            >
              <Settings className="size-4 mr-2" />
              Pengaturan Akun
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-11 text-forest">
              <Link href="/">
                <ArrowUpRight className="size-4 mr-2" />
                Lihat Website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-line" />
            <DropdownMenuItem
              disabled={logoutPending}
              className="min-h-11 cursor-pointer text-red-700 hover:text-red-800"
              onSelect={onLogout}
            >
              <LogOut className="size-4 mr-2" />
              {logoutPending ? "Keluar..." : "Keluar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function PartnerShell({
  user,
  view,
  onViewChange,
  onLogout,
  logoutPending,
  savedCount = 0,
  unreadNotifCount = 0,
  defaultSidebarOpen = true,
  children,
}: {
  user: User;
  view: PartnerDashboardView;
  onViewChange: (view: PartnerDashboardView) => void;
  onLogout: () => void;
  logoutPending?: boolean;
  savedCount?: number;
  unreadNotifCount?: number;
  defaultSidebarOpen?: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <TooltipProvider>
        <SidebarProvider
          defaultOpen={defaultSidebarOpen}
          className={styles.workspace}
          style={
            {
              "--sidebar-width": "17.5rem",
              "--sidebar-width-icon": "4.5rem",
            } as CSSProperties
          }
        >
          <a
            href="#workspace-main"
            className="sr-only z-50 bg-surface p-4 text-forest focus:not-sr-only focus:fixed"
          >
            Lewati navigasi
          </a>
          <PartnerSidebar
            view={view}
            onNavigate={onViewChange}
            savedCount={savedCount}
            unreadNotifCount={unreadNotifCount}
          />
          <SidebarInset className="min-w-0 bg-ivory">
            <PartnerHeader
              user={user}
              view={view}
              onViewChange={onViewChange}
              onLogout={onLogout}
              logoutPending={logoutPending}
            />
            <main
              id="workspace-main"
              tabIndex={-1}
              className="flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 focus:outline-none"
            >
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}

