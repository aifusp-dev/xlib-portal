"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Book, Zap, ChefHat, Sprout, Shield,
  HeartPulse, Coins, Clock, UserCircle, Library,
  Smartphone, Album, Users, Search, ChevronDown, ChevronRight,
  Gavel, Hammer, Swords, Building2, Wrench, Car, Briefcase, Map,
  Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { group: string; items: NavItem[]; collapsible?: boolean };

const navigation: NavGroup[] = [
  {
    group: "General",
    items: [
      { label: "Inicio", href: "/", icon: Home },
    ],
  },
  {
    group: "Librería Core",
    items: [
      { label: "xLib Shared", href: "/docs/xlib", icon: Book },
    ],
  },
  {
    group: "Plugins Standalone",
    items: [
      { label: "xPhone", href: "/docs/xphone", icon: Smartphone },
      { label: "xAlbum", href: "/docs/xalbum", icon: Album },
      { label: "Minedachi", href: "/docs/minedachi", icon: Users },
    ],
  },
  {
    group: "xFoods Ecosystem",
    items: [
      { label: "xFoods Core", href: "/docs/xfoods", icon: ChefHat },
      { label: "xCrops Addon", href: "/docs/xcrops", icon: Sprout },
    ],
  },
  {
    group: "RPX Suite",
    collapsible: true,
    items: [
      { label: "RPX Core", href: "/docs/rpx-core", icon: UserCircle },
      { label: "RPX Economy", href: "/docs/rpx-economy", icon: Coins },
      { label: "RPX Health", href: "/docs/rpx-health", icon: HeartPulse },
      { label: "RPX ClockIn", href: "/docs/rpx-clockin", icon: Clock },
      { label: "Police RPX",    href: "/docs/rpx-police",     icon: Shield },
      { label: "RPX Gangs",     href: "/docs/rpx-gangs",      icon: Swords },
      { label: "RPX RealState", href: "/docs/rpx-realstate",  icon: Building2 },
      { label: "RPX Utils",     href: "/docs/rpx-utils",      icon: Wrench },
      { label: "RPX Vehicles",  href: "/docs/rpx-vehicles",   icon: Car },
      { label: "RPX SimpleJobs",href: "/docs/rpx-simplejobs", icon: Briefcase },
      { label: "RPXCourt",      href: "/docs/rpxcourt",       icon: Gavel },
      { label: "RPXCrafting",   href: "/docs/rpxcrafting",    icon: Hammer },
      { label: "Biblio RPX",    href: "/docs/rpx-biblio",     icon: Library },
      { label: "RPX Names",     href: "/docs/rpx-names",      icon: UserCircle },
    ],
  },
  {
    group: "Studio",
    items: [
      { label: "Studio Workspace", href: "/studio", icon: Zap },
    ],
  },
  {
    group: "Roadmap",
    items: [
      { label: "Roadmap RPX", href: "/roadmap", icon: Map },
    ],
  },
];

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-r-md border-l-2 transition-all duration-150",
        isActive
          ? "border-yellow-400 bg-yellow-400/8 text-yellow-400 font-semibold"
          : "border-transparent text-gray-400 hover:text-gray-100 hover:bg-white/4"
      )}
    >
      <item.icon className="w-3.5 h-3.5 shrink-0" />
      {item.label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle(group: string) {
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));
  }

  return (
    <>
      {/* Botón hamburguesa — solo en móvil, fijo para que exista incluso con el menú cerrado */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-lg bg-[#111827] border border-[#1f2937] text-gray-300"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Fondo oscuro al abrir en móvil, clic para cerrar */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#111827] border-r border-[#1f2937] flex flex-col h-full shrink-0 overflow-hidden transition-transform duration-200 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1f2937] flex items-center justify-between gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">📦</span>
          <div>
            <p className="text-[15px] font-bold text-white leading-tight tracking-tight">xLib Portal</p>
            <p className="text-[10px] font-mono text-yellow-400/80 uppercase tracking-widest">v2.0 Docs</p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-gray-400 hover:text-gray-100"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-[#1f2937]">
        <div className="flex items-center gap-2 bg-[#0b0f19] border border-[#374151] rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-sm text-gray-500">Buscar...</span>
          <span className="ml-auto text-[10px] bg-[#1f2937] text-gray-500 px-1.5 py-0.5 rounded font-mono">⌘K</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navigation.map((group) => {
          const isCollapsed = collapsed[group.group];
          return (
            <div key={group.group}>
              {group.collapsible ? (
                <button
                  onClick={() => toggle(group.group)}
                  className="w-full flex items-center justify-between px-3 mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {group.group}
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                  }
                </button>
              ) : (
                <p className="px-3 mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  {group.group}
                </p>
              )}
              {(!group.collapsible || !isCollapsed) && (
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1f2937]">
        <p className="text-[11px] text-gray-600 text-center">
          © aifusp.dev — <span className="text-yellow-400/50">xLib v2.0</span>
        </p>
      </div>
      </aside>
    </>
  );
}
