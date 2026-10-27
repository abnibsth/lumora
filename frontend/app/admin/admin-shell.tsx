"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { logoutApi, type AdminOverview } from "@/lib/api";
import type { User } from "@/types/user";
import HomepageEditor from "./homepage-editor";
import BusinessManagementView from "./business-management-view";
import BusinessStoriesView from "./business-stories-view";
import BusinessPartnershipsView from "./business-partnerships-view";
import FaqManagementView from "./faq-management-view";
import MediaLibraryView from "./media-library-view";
import UserManagementView from "./user-management-view";
import WebsiteSettingsView from "./website-settings-view";

// Navigation Context so child components (like DashboardView) can navigate tabs with filters
interface AdminNavContextType {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  tabFilter: string | null;
  setTabFilter: (filter: string | null) => void;
  navigateToTab: (tab: number, filter?: string | null) => void;
}

const AdminNavContext = createContext<AdminNavContextType>({
  activeTab: 0,
  setActiveTab: () => {},
  tabFilter: null,
  setTabFilter: () => {},
  navigateToTab: () => {},
});

export function useAdminNav() {
  return useContext(AdminNavContext);
}

const sections = [
  { title: "Dashboard", icon: LayoutDashboard, badge: undefined },
  { title: "Manajemen Beranda", icon: PanelsTopLeft, badge: undefined },
  { title: "Manajemen UMKM", icon: Store, badge: undefined },
  { title: "Cerita Usaha", icon: BookOpen, badge: undefined },
  { title: "Peluang & Mitra", icon: Handshake, badge: undefined },
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

export default function AdminShell({
  children,
  user,
  overview,
  initialTab = 0,
}: {
  children: ReactNode;
  user: User;
  overview?: AdminOverview;
  initialTab?: number;
}) {
  const [active, setActive] = useState(initialTab);
  const [tabFilter, setTabFilter] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const router = useRouter();


  function navigateToTab(tab: number, filter?: string | null) {
    setActive(tab);
    setTabFilter(filter ?? null);
  }

  async function logout() {
    if (await logoutApi()) {
      router.replace("/admin/login");
      router.refresh();
    }
  }


  return (
    <AdminNavContext.Provider
      value={{
        activeTab: active,
        setActiveTab: setActive,
        tabFilter,
        setTabFilter,
        navigateToTab,
      }}
    >
      <TooltipProvider delayDuration={200}>
        <SidebarProvider>
          <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-[#d8d8cf] bg-[#fbfaf6]"
          >
            {/* Sidebar Header */}
            <SidebarHeader className="border-b border-[#d8d8cf] px-4 py-3.5">
              <Link href="/admin" className="flex items-center gap-3 font-semibold">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#123f32] text-sm font-bold text-[#b7df68] shadow-xs">
                  L
                </span>
                <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                  <span className="text-base font-bold tracking-tight text-[#123f32]">
                    LUMORA
                  </span>
                  <span className="text-[11px] font-medium text-[#4a5550]">
                    CMS Administrasi
                  </span>
                </div>
              </Link>
            </SidebarHeader>

            {/* Sidebar Navigation */}
            <SidebarContent className="px-3 py-4">
              <div className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-[#526059] group-data-[collapsible=icon]:hidden">
                Menu Utama
              </div>
              <AdminNavigation
                active={active}
                onSelect={(idx) => {
                  setActive(idx);
                  if (idx !== 2) setTabFilter(null);
                }}
              />
            </SidebarContent>

            {/* Sidebar Footer */}
            <SidebarFooter className="border-t border-[#d8d8cf] p-3">
              <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Lihat Website Publik"
                    className="min-h-9 rounded-lg text-xs font-medium text-[#4a5550] hover:bg-[#e7efe9] hover:text-[#123f32]"
                  >
                    <Link href="/" target="_blank">
                      <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                      <span>Lihat Website Publik</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Keluar"
                    onClick={logout}
                    className="min-h-9 rounded-lg text-xs font-medium text-[#4a5550] hover:bg-[#e7efe9] hover:text-[#123f32]"
                  >
                    <LogOut className="size-4 shrink-0" aria-hidden="true" />
                    <span>Keluar</span>
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
                  className="rounded-lg text-[#123f32] hover:bg-[#e7efe9]"
                />
                <div className="h-4 w-px bg-[#d8d8cf]" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#526059]">CMS</span>
                  <span className="text-[#d8d8cf]">/</span>
                  <span className="font-semibold text-[#123f32]">
                    {sections[active].title}
                  </span>
                  {active === 2 && tabFilter === "unverified" && (
                    <>
                      <span className="text-[#d8d8cf]">/</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 border border-amber-300">
                        Belum Diverifikasi
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Notifikasi"
                  className="flex size-9 items-center justify-center rounded-lg border border-[#d8d8cf] text-[#4a5550] hover:bg-[#e7efe9] hover:text-[#123f32]"
                >
                  <Bell className="size-4" />
                </button>
                <Badge
                  variant="outline"
                  className="hidden border-[#123f32]/30 bg-[#e7efe9] font-medium text-[#123f32] sm:inline-flex"
                >
                  {user.name}
                </Badge>
              </div>
            </header>

            {/* Main Content Area */}
            <main id="admin-main" className="p-4 sm:p-6 lg:p-8">
              {active === 0 ? (
                children
              ) : active === 1 ? (
                <HomepageEditor />
              ) : active === 2 ? (
                <BusinessManagementView
                  overview={overview}
                  initialFilter={tabFilter}
                  onClearFilter={() => setTabFilter(null)}
                />
              ) : active === 3 ? (
                <BusinessStoriesView overview={overview} />
              ) : active === 4 ? (
                <BusinessPartnershipsView overview={overview} />
              ) : active === 5 ? (
                <FaqManagementView overview={overview} />
              ) : active === 6 ? (
                <MediaLibraryView overview={overview} />
              ) : active === 7 ? (
                <UserManagementView user={user} overview={overview} />
              ) : active === 8 ? (
                <WebsiteSettingsView overview={overview} />
              ) : (
                /* Standard Module Placeholder */
                <motion.section
                  key={active}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.25 }}
                  className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 sm:p-8 shadow-xs"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#526059]">
                    <span className="size-2 rounded-full bg-[#b7df68]" />
                    <span>Modul Sedang Dirancang</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
                    {sections[active].title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4a5550]">
                    Modul <strong>{sections[active].title}</strong> belum memiliki kontrak API mutasi aktif. Overview dashboard tetap berstatus read-only sampai aturan produk dan audit mutasi ditetapkan.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      id="admin-back-dashboard"
                      type="button"
                      onClick={() => {
                        setActive(0);
                        setTabFilter(null);
                      }}
                      className="min-h-10 rounded-xl bg-[#123f32] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0b3027]"
                    >
                      Kembali ke Dashboard Overview
                    </button>
                    <Link
                      href="/"
                      className="inline-flex min-h-10 items-center rounded-xl border border-[#d8d8cf] px-4 text-sm font-semibold text-[#123f32] hover:bg-[#e7efe9]"
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
    </AdminNavContext.Provider>
  );
}
