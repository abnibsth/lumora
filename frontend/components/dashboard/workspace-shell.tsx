"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ChevronDown, LogOut, PanelLeft, Settings, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { WorkspaceView } from "@/lib/dashboard";
import type { User } from "@/types/user";
import { WorkspaceSidebar } from "./workspace-sidebar";
import styles from "./workspace.module.css";

const titles: Record<WorkspaceView, string> = { overview: "Dashboard", profiles: "Profil Bisnis", story: "Cerita Usaha", canvas: "Business Model Canvas", saved: "Peluang & Mitra", ai: "Lumora AI", settings: "Pengaturan Akun" };

function WorkspaceHeader({ user, view, onViewChange, onLogout, logoutPending }: Omit<ShellProps, "children" | "defaultSidebarOpen">) {
  const { toggleSidebar, open, isMobile, openMobile } = useSidebar();
  const menuRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isMobile && wasOpen.current && !openMobile) menuRef.current?.focus();
    wasOpen.current = openMobile;
  }, [isMobile, openMobile]);
  return <header className="sticky top-0 z-20 border-b border-line/60 bg-ivory/95 backdrop-blur-sm"><div className="flex min-h-18 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
    <div className="flex min-w-0 items-center gap-3">
      <button ref={menuRef} type="button" onClick={toggleSidebar} aria-label={isMobile ? "Buka navigasi" : open ? "Ciutkan sidebar" : "Perluas sidebar"} aria-expanded={isMobile ? openMobile : open} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-forest hover:bg-soft-green"><PanelLeft className="size-5" /></button>
      <div className="min-w-0"><p className="hidden text-[10px] font-medium uppercase tracking-[.15em] text-muted sm:block">LUMORA / Workspace</p><p className="truncate text-sm font-semibold text-forest">{titles[view]}</p></div>
    </div>
    <DropdownMenu><DropdownMenuTrigger className="flex min-h-11 max-w-[50%] items-center gap-2 rounded-lg px-2 text-left hover:bg-soft-green" aria-label={`Menu akun ${user.name}`}>
      <Avatar className="size-9 bg-soft-green"><AvatarFallback className="bg-soft-green text-sm font-semibold text-forest">{user.name.trim().slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
      <span className="hidden min-w-0 sm:block"><span className="block max-w-40 truncate text-sm font-medium">{user.name}</span><span className="block text-[11px] text-muted">{user.role === "umkm" ? "Pemilik UMKM" : "Akun LUMORA"}</span></span><ChevronDown className="size-4 shrink-0" aria-hidden="true" />
    </DropdownMenuTrigger><DropdownMenuContent align="end" className={`${styles.portal} w-64 border border-line p-2 shadow-lg`}>
      <DropdownMenuLabel className="break-all">{user.email}</DropdownMenuLabel><DropdownMenuSeparator className="bg-line" />
      <DropdownMenuItem className="min-h-11 cursor-pointer" onSelect={() => onViewChange("settings")}><Settings />Pengaturan akun</DropdownMenuItem>
      <DropdownMenuItem asChild className="min-h-11"><Link href="/"><ArrowUpRight />Lihat website</Link></DropdownMenuItem>
      <DropdownMenuSeparator className="bg-line" /><DropdownMenuItem disabled={logoutPending} className="min-h-11 cursor-pointer text-red-700" onSelect={onLogout}><LogOut />{logoutPending ? "Keluar..." : "Keluar"}</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
  </div></header>;
}

type ShellProps = { user: User; view: WorkspaceView; onViewChange: (view: WorkspaceView) => void; onLogout: () => void; logoutPending?: boolean; defaultSidebarOpen?: boolean; children: ReactNode };

export function WorkspaceShell({ children, defaultSidebarOpen = true, ...props }: ShellProps) {
  const reduced = useReducedMotion();
  return <MotionConfig reducedMotion="user"><TooltipProvider><SidebarProvider defaultOpen={defaultSidebarOpen} className={styles.workspace} style={{ "--sidebar-width": "17rem", "--sidebar-width-icon": "4.5rem" } as CSSProperties}>
    <a href="#workspace-main" className="sr-only z-50 bg-surface p-4 text-forest focus:not-sr-only focus:fixed">Lewati navigasi</a>
    <WorkspaceSidebar view={props.view} onNavigate={props.onViewChange} />
    <SidebarInset className="min-w-0 bg-ivory">
      <WorkspaceHeader {...props} />
      <motion.main id="workspace-main" tabIndex={-1} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .2 }} className="w-full px-4 py-6 outline-none sm:px-6 lg:px-8">{children}</motion.main>
    </SidebarInset>
  </SidebarProvider></TooltipProvider></MotionConfig>;
}
