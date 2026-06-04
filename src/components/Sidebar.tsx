"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Book, 
  Zap, 
  Settings, 
  ChefHat, 
  Sprout, 
  Shield,
  HeartPulse,
  Coins,
  Clock,
  UserCircle,
  Library,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
  { group: "General", items: [
    { label: "Inicio", href: "/", icon: Home },
    { label: "Configuración", href: "/settings", icon: Settings },
  ]},
  { group: "Wiki (Plugins Core)", items: [
    { label: "xLib Shared", href: "/docs/xlib", icon: Book },
    { label: "xFoods Core", href: "/docs/xfoods", icon: ChefHat },
    { label: "xCrops Addon", href: "/docs/xcrops", icon: Sprout },
  ]},
];

const rpxModules = [
  { label: "RPX Core", href: "/docs/rpx-core", icon: UserCircle },
  { label: "RPX Economy", href: "/docs/rpx-economy", icon: Coins },
  { label: "RPX Health", href: "/docs/rpx-health", icon: HeartPulse },
  { label: "RPX ClockIn", href: "/docs/rpx-clockin", icon: Clock },
  { label: "Police RPX", href: "/docs/rpx-police", icon: Shield },
  { label: "Biblio RPX", href: "/docs/rpx-biblio", icon: Library },
  { label: "RPX Names", href: "/docs/rpx-names", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isRpxOpen, setIsRpxOpen] = useState(true);

  return (
    <aside className="w-72 bg-[#111827] border-r border-[#374151] flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="text-3xl">📦</div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">xLib Portal</h2>
          <p className="text-[10px] text-yellow-400 font-mono font-semibold uppercase tracking-wider">v2.0 Premium</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
        {/* Core Groups */}
        {menuItems.map((group) => (
          <div key={group.group}>
            <h3 className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
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

        {/* RPX Expandable Group */}
        <div>
          <button 
            onClick={() => setIsRpxOpen(!isRpxOpen)}
            className="w-full flex items-center justify-between px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 hover:text-gray-300 transition-colors"
          >
            Módulos RPX
            <span className={cn("transition-transform duration-200", isRpxOpen ? "rotate-90" : "")}>
              <ArrowRight className="w-3 h-3" />
            </span>
          </button>
          
          {isRpxOpen && (
            <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
              {rpxModules.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/10" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Tools */}
        <div>
          <h3 className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
            Studio
          </h3>
          <div className="space-y-1">
            <Link
              href="/studio"
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                pathname.startsWith("/studio") 
                  ? "bg-accent text-white shadow-lg shadow-accent/10" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Zap className="w-4 h-4" />
              Studio Workspace
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-[#374151] bg-[#0b0f19]/50">
        <p className="text-[11px] text-gray-500 text-center">
          Propiedad de <b>aifusp.dev</b>
        </p>
      </div>
    </aside>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
