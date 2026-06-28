import { ArrowRight, Book, Smartphone, Album, Users, ChefHat, Shield, Zap } from "lucide-react";
import Link from "next/link";

const categories = [
  {
    label: "Librería Core",
    color: "yellow",
    items: [
      { title: "xLib Shared", desc: "Base de dependencias compartidas para todos los plugins.", href: "/docs/xlib", icon: Book },
    ],
  },
  {
    label: "Plugins Standalone",
    color: "blue",
    items: [
      { title: "xPhone", desc: "Smartphone roleplay con apps, SIM, mensajes y red social.", href: "/docs/xphone", icon: Smartphone },
      { title: "xAlbum", desc: "Sistema de álbum de colección con categorías y desbloqueos.", href: "/docs/xalbum", icon: Album },
      { title: "Minedachi", desc: "Ciudad virtual estilo Tomodachi Life con parcelas y economía.", href: "/docs/minedachi", icon: Users },
    ],
  },
  {
    label: "xFoods Ecosystem",
    color: "green",
    items: [
      { title: "xFoods Core", desc: "Nutrición avanzada, bites múltiples y maquinaria de cocina.", href: "/docs/xfoods", icon: ChefHat },
    ],
  },
  {
    label: "RPX Suite",
    color: "purple",
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

const colorMap: Record<string, { border: string; text: string; bg: string }> = {
  yellow: { border: "border-yellow-400/30", text: "text-yellow-400", bg: "bg-yellow-400/8" },
  blue:   { border: "border-blue-400/30",   text: "text-blue-400",   bg: "bg-blue-400/8"   },
  green:  { border: "border-green-400/30",  text: "text-green-400",  bg: "bg-green-400/8"  },
  purple: { border: "border-purple-400/30", text: "text-purple-400", bg: "bg-purple-400/8" },
};

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto w-full px-8 py-14 animate-wiki">
      {/* Hero */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-yellow-400/70 bg-yellow-400/8 border border-yellow-400/20 px-3 py-1 rounded-full mb-5">
          <Zap className="w-3 h-3" /> v2.0 · aifusp.dev
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Wiki oficial de <span className="text-yellow-400">xLib</span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mb-8">
          Documentación técnica de todos los plugins del ecosistema aifusp.dev — comandos, permisos, configuración y API para desarrolladores.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/xlib"
            className="inline-flex items-center gap-2 bg-yellow-400 text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors"
          >
            Empezar con xLib <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs/xphone"
            className="inline-flex items-center gap-2 bg-[#1f2937] text-gray-200 border border-[#374151] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-colors"
          >
            Ver todos los plugins
          </Link>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-[#1f2937] mb-12" />

      {/* Category grid */}
      <div className="space-y-10">
        {categories.map((cat) => {
          const c = colorMap[cat.color];
          return (
            <div key={cat.label}>
              <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${c.text}`}>
                {cat.label}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-start gap-3 p-4 rounded-xl border ${c.border} ${c.bg} hover:brightness-110 transition-all`}
                  >
                    <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${c.text}`} />
                    <div>
                      <p className={`text-sm font-semibold ${c.text} group-hover:underline`}>{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
