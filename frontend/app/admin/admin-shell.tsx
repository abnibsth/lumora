"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Store,
  BookOpen,
  Handshake,
  CircleHelp,
  Images,
  Users,
  Settings,
  ArrowUpRight,
  LogOut,
  Search,
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const sections = [
  { title: "Dashboard", icon: LayoutDashboard, badge: undefined },
  { title: "Manajemen Beranda", icon: PanelsTopLeft, badge: undefined },
  { title: "Manajemen UMKM", icon: Store, badge: "12 Baru" },
  { title: "Cerita Usaha", icon: BookOpen, badge: undefined },
  { title: "Peluang & Mitra", icon: Handshake, badge: "3 Pending" },
  { title: "FAQ", icon: CircleHelp, badge: undefined },
  { title: "Media Library", icon: Images, badge: undefined },
  { title: "Pengguna & Role", icon: Users, badge: undefined },
  { title: "Pengaturan Website", icon: Settings, badge: undefined },
];

function AdminNavigation({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu className="gap-1">
      {sections.map((item, index) => {
        const isActive = active === index;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              id={`admin-nav-${index}`}
              tooltip={item.title}
              isActive={isActive}
              onClick={() => {
                onSelect(index);
                setOpenMobile(false);
              }}
              className={`min-h-10 rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#123f32] text-white hover:bg-[#123f32] hover:text-white"
                  : "text-[#14382f] hover:bg-[#e7efe9] hover:text-[#123f32]"
              }`}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.title}</span>
              {item.badge ? (
                <span className="ml-auto rounded-full bg-[#b7df68]/40 px-2 py-0.5 text-[10px] font-semibold text-[#123f32] group-data-[collapsible=icon]:hidden">
                  {item.badge}
                </span>
              ) : null}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset" className="border-r border-[#d8d8cf] bg-[#fbfaf6]">
          {/* Sidebar Header */}
          <SidebarHeader className="border-b border-[#d8d8cf] px-4 py-3.5">
            <Link href="/admin" className="flex items-center gap-3 font-semibold">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#123f32] text-sm font-bold text-[#b7df68] shadow-xs">
                L
              </span>
              <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="font-display text-base font-bold tracking-tight text-forest">
                  LUMORA
                </span>
                <span className="text-[11px] font-normal text-[#66736d]">
                  CMS Administrasi
                </span>
              </div>
            </Link>
          </SidebarHeader>

          {/* Sidebar Navigation */}
          <SidebarContent className="px-3 py-4">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#66736d] group-data-[collapsible=icon]:hidden">
              Menu Utama
            </div>
            <AdminNavigation active={active} onSelect={setActive} />
          </SidebarContent>

          {/* Sidebar Footer */}
          <SidebarFooter className="border-t border-[#d8d8cf] p-3">
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Lihat Website Publik"
                  className="min-h-9 rounded-lg text-xs font-medium text-[#66736d] hover:bg-[#e7efe9] hover:text-forest"
                >
                  <Link href="/" target="_blank">
                    <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                    <span>Lihat Website Publik</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Halaman Login Admin"
                  className="min-h-9 rounded-lg text-xs font-medium text-[#66736d] hover:bg-[#e7efe9] hover:text-forest"
                >
                  <Link href="/admin/login">
                    <LogOut className="size-4 shrink-0" aria-hidden="true" />
                    <span>Halaman Login</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0 bg-[#f5f2e9]">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[#d8d8cf] bg-[#fbfaf6]/95 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger
                id="admin-sidebar-toggle"
                aria-label="Buka atau tutup sidebar"
                className="rounded-lg text-forest hover:bg-[#e7efe9]"
              />
              <div className="h-4 w-px bg-[#d8d8cf]" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#66736d]">CMS</span>
                <span className="text-[#66736d]">/</span>
                <span className="font-semibold text-forest">
                  {sections[active].title}
                </span>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-[#d8d8cf] bg-[#f5f2e9] px-3 py-1.5 text-xs text-[#66736d] md:flex">
                <Search className="size-3.5" />
                <span>Cari di CMS... (⌘K)</span>
              </div>
              <button
                type="button"
                aria-label="Notifikasi"
                className="flex size-9 items-center justify-center rounded-lg border border-[#d8d8cf] text-[#66736d] hover:bg-[#e7efe9] hover:text-forest"
              >
                <Bell className="size-4" />
              </button>
              <Badge
                variant="outline"
                className="hidden border-forest/30 bg-[#e7efe9] font-medium text-forest sm:inline-flex"
              >
                Prototype Mode
              </Badge>
            </div>
          </header>

          {/* Main Content Area */}
          <main id="admin-main" className="p-4 sm:p-6 lg:p-8">
            {active === 0 ? (
              children
            ) : (
              <motion.section
                key={active}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.3 }}
                className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 sm:p-8 shadow-xs"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#66736d]">
                  <span className="size-2 rounded-full bg-[#b7df68]" />
                  <span>Modul Sedang Dirancang</span>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-forest sm:text-3xl">
                  {sections[active].title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#66736d]">
                  Tampilan antarmuka dan formulir manajemen untuk <strong>{sections[active].title}</strong> siap diintegrasikan begitu kontrak API CRUD dan arsitektur backend Go / database PostgreSQL telah didefinisikan.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    id="admin-back-dashboard"
                    type="button"
                    onClick={() => setActive(0)}
                    className="min-h-10 rounded-xl bg-[#123f32] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0b3027]"
                  >
                    Kembali ke Dashboard Overview
                  </button>
                  <Link
                    href="/"
                    className="inline-flex min-h-10 items-center rounded-xl border border-[#d8d8cf] px-4 text-sm font-semibold text-forest hover:bg-[#e7efe9]"
                  >
                    Pratinjau Halaman Publik
                  </Link>
                </div>
              </motion.section>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

