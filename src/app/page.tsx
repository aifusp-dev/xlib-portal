import { ArrowRight, Book, Smartphone, Album, Users, ChefHat, Shield, Sprout } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const categories = [
  {
    label: "Librería Core",
    dot: "var(--color-sec-foods)",
    items: [
      { title: "xLib Shared", desc: "Base de dependencias compartidas para todos los plugins.", href: "/docs/xlib", icon: Book },
    ],
  },
  {
    label: "Plugins Standalone",
    dot: "var(--color-info)",
    items: [
      { title: "xPhone", desc: "Smartphone roleplay con apps, SIM, mensajes y red social.", href: "/docs/xphone", icon: Smartphone },
      { title: "xAlbum", desc: "Sistema de álbum de colección con categorías y desbloqueos.", href: "/docs/xalbum", icon: Album },
      { title: "Minedachi", desc: "Ciudad virtual estilo Tomodachi Life con parcelas y economía.", href: "/docs/minedachi", icon: Users },
    ],
  },
  {
    label: "xFoods Ecosystem",
    dot: "var(--color-sec-crops)",
    items: [
      { title: "xFoods Core", desc: "Nutrición avanzada, bites múltiples y maquinaria de cocina.", href: "/docs/xfoods", icon: ChefHat },
      { title: "xCrops Addon", desc: "Cultivos avanzados que extienden xFoods con parcelas premium.", href: "/docs/xcrops", icon: Sprout },
    ],
  },
  {
    label: "RPX Suite",
    dot: "var(--color-sec-ia)",
    items: [
      { title: "RPX Core",       desc: "Núcleo del roleplay: ciudadanos, empleos y API centralizada.",      href: "/docs/rpx-core",       icon: Shield },
      { title: "RPX Economy",    desc: "Banca multicuenta, efectivo físico, datáfonos y suscripciones.",   href: "/docs/rpx-economy",    icon: Shield },
      { title: "RPX Health",     desc: "Sistema médico con enfermedades, diagnósticos y herramientas EMS.",href: "/docs/rpx-health",     icon: Shield },
      { title: "Police RPX",     desc: "PDA policial, celdas, multas y equipamiento táctico.",             href: "/docs/rpx-police",     icon: Shield },
      { title: "RPX Gangs",      desc: "Bandas criminales con territorios, generadores y calor policial.", href: "/docs/rpx-gangs",      icon: Shield },
      { title: "RPX RealState",  desc: "Propiedades inmobiliarias con hologramas y pagos automáticos.",    href: "/docs/rpx-realstate",  icon: Shield },
      { title: "RPX Utils",      desc: "SmartDoors, GPS con partículas, papeleras y cajas fuertes.",       href: "/docs/rpx-utils",      icon: Shield },
      { title: "RPX Vehicles",   desc: "Vehículos con matrícula, combustible y persistencia en BD.",       href: "/docs/rpx-vehicles",   icon: Shield },
      { title: "RPX SimpleJobs", desc: "Trabajos freelance guiados por GPS con pago inmediato.",           href: "/docs/rpx-simplejobs", icon: Shield },
      { title: "RPXCourt",       desc: "Contratos firmados y sistema judicial para el servidor.",          href: "/docs/rpxcourt",       icon: Shield },
      { title: "RPXCrafting",    desc: "Crafting avanzado con stages, componentes rpx: y fábrica de vehículos.", href: "/docs/rpxcrafting", icon: Shield },
      { title: "Biblio RPX",     desc: "Biblioteca nacional: publica y lee libros escritos in-game.",      href: "/docs/rpx-biblio",     icon: Shield },
      { title: "RPX Names",      desc: "Identidad IC con hologramas y apodos personales por ciudadano.",   href: "/docs/rpx-names",      icon: Shield },
    ],
  },
];

export default function Home() {
  return (
    <div className="wiki-shell wiki-grid-bg min-h-full">
      <div className="max-w-4xl mx-auto w-full px-8 py-14 animate-wiki">
        {/* Hero */}
        <div className="mb-14">
          <h1 className="text-4xl font-extrabold text-ink tracking-tight mb-4 leading-tight">
            Wiki oficial de <span className="text-accent">xLib</span>
          </h1>
          <p className="text-ink-2 text-lg leading-relaxed max-w-2xl mb-8">
            Documentación técnica de todos los plugins del ecosistema aifusp.dev — comandos, permisos, configuración y API para desarrolladores.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs/xlib"
              className="inline-flex items-center gap-2 bg-accent text-accent-ink px-5 py-2.5 rounded-md text-sm font-bold hover:brightness-110 transition-all"
            >
              Empezar con xLib <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs/xphone"
              className="inline-flex items-center gap-2 bg-surface-1 text-ink border border-line-strong px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-surface-2 transition-colors"
            >
              Ver todos los plugins
            </Link>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-line mb-12" />

        {/* Category list — xLib es el origen; cada grupo cuelga de la misma
            traza vertical, como las ramas de un esquema de cableado. */}
        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-line-strong" aria-hidden />
          <div className="space-y-10">
            {categories.map((cat, i) => (
              <div key={cat.label} className="relative pl-7">
                <span className="absolute left-0 top-[11px] w-[15px] h-px bg-line-strong" aria-hidden />
                <span
                  className="absolute left-[3px] top-[7px] w-[9px] h-[9px] border-2 border-surface-0"
                  style={{ background: i === 0 ? "var(--color-accent)" : cat.dot }}
                  aria-hidden
                />
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 text-ink-2">
                  <span className="w-1.5 h-1.5 shrink-0" style={{ background: cat.dot }} aria-hidden />
                  {cat.label}
                  {i === 0 && (
                    <span className="font-mono normal-case tracking-normal text-[10px] text-ink-3">— base compartida</span>
                  )}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-start gap-3 p-4 rounded-md border border-line bg-surface-1",
                        "hover:border-line-strong hover:bg-surface-2 transition-colors"
                      )}
                    >
                      <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-ink-2 group-hover:text-accent transition-colors" />
                      <div>
                        <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">{item.title}</p>
                        <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
