"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Book, 
  Layers, 
  Zap, 
  Settings, 
  ChefHat, 
  Sprout, 
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { group: "General", items: [
    { label: "Inicio", href: "/", icon: Home },
    { label: "Configuración", href: "/settings", icon: Settings },
  ]},
  { group: "Wiki (Documentación)", items: [
    { label: "xLib Core", href: "/docs/xlib", icon: Book },
    { label: "xFoods Core", href: "/docs/xfoods", icon: ChefHat },
    { label: "xCrops Addon", href: "/docs/xcrops", icon: Sprout },
    { label: "RPX Modules", href: "/docs/rpx", icon: Layers },
  ]},
  { group: "Studio (Herramientas)", items: [
    { label: "Dashboard Pro", href: "/studio", icon: Zap },
    { label: "Mercado Live", href: "/studio/market", icon: TrendingUp },
  ]}
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#111827] border-r border-[#374151] flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="text-3xl">📦</div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">xLib Portal</h2>
          <p className="text-[10px] text-yellow-400 font-mono font-semibold uppercase tracking-wider">v2.0 Premium</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8">
        {menuItems.map((group) => (
          <div key={group.group}>
            <h3 className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/10" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-[#374151] bg-[#0b0f19]/50">
        <p className="text-[11px] text-gray-500 text-center">
          Desarrollado con ❤️ para <b>aifusp.dev</b>
        </p>
      </div>
    </aside>
  );
}
