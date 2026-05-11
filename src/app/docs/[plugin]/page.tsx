"use client";

import { use } from "react";
import { 
  FileText, 
  Terminal, 
  PlayCircle,
  Database,
  Coins,
  HeartPulse,
  Clock,
  Shield,
  Library,
  UserCircle,
  LucideIcon
} from "lucide-react";

interface DocSection {
  title: string;
  icon: LucideIcon;
  content: string;
}

interface DocContent {
  title: string;
  desc: string;
  sections: DocSection[];
}

export default function DocPage({ params }: { params: Promise<{ plugin: string }> }) {
  const { plugin } = use(params);

  const docsContent: Record<string, DocContent> = {
    "xlib": {
      title: "xLib Shared",
      desc: "Librería base y proveedora de dependencias para todo el ecosistema aifusp.dev.",
      sections: [
        { title: "Resumen", icon: PlayCircle, content: "xLib es una Fat-JAR que contiene ACF, InventoryFramework, NBTAPI y Adventure. Proporciona utilidades compartidas como el ItemBuilder y TextUtils." },
        { title: "Paquete Base", icon: Database, content: "org.aifusp.dev.xLib" },
      ]
    },
    "xfoods": {
      title: "xFoods Core",
      desc: "Sistema avanzado de nutrición y cocina personalizada.",
      sections: [
        { title: "Comidas", icon: FileText, content: "Define ítems consumibles en /foods/*.yml. Soporta bites, efectos, comandos y NBT." },
        { title: "Maquinaria", icon: Terminal, content: "/xfoods givemachine <id> - Entrega una estación de cocina (Parrilla, Mesa de Preparación, etc)." },
      ]
    },
    "xcrops": {
      title: "xCrops Addon",
      desc: "Módulo de agricultura avanzada y automatización para xFoods.",
      sections: [
        { title: "Cultivos", icon: PlayCircle, content: "Sistema de crecimiento por fases visuales con requisitos de agua, luz y fertilizantes." },
        { title: "Automatización", icon: Terminal, content: "Incluye Autoregadores, Iluminadores y Recolectores automáticos alimentados por ítems de xFoods." },
      ]
    },
    "rpx-core": {
      title: "RPX Core",
      desc: "El corazón del sistema Roleplay.",
      sections: [
        { title: "Gestión", icon: UserCircle, content: "Control de ciudadanos, base de datos SQLite y sistema de trabajos base." },
        { title: "DB Manager", icon: Database, content: "Accesible mediante RPXCore.getInstance().getDatabaseManager()" },
      ]
    },
    "rpx-economy": {
      title: "RPX Economy",
      desc: "Sistema financiero avanzado.",
      sections: [
        { title: "Bancos", icon: Coins, content: "Gestión de cuentas bancarias, préstamos e integración total con Vault." },
      ]
    },
    "rpx-health": {
      title: "RPX Health",
      desc: "Sistema de salud y enfermedades.",
      sections: [
        { title: "Medicina", icon: HeartPulse, content: "Control de constantes vitales e integración con xFoods para vectores de enfermedad." },
      ]
    },
    "rpx-clockin": {
      title: "RPX ClockIn",
      desc: "Gestión de asistencia y turnos.",
      sections: [
        { title: "Fichaje", icon: Clock, content: "Permite a los trabajadores fichar la entrada y salida de sus puestos de trabajo." },
      ]
    },
    "rpx-police": {
      title: "Police RPX",
      desc: "Módulo para fuerzas de seguridad.",
      sections: [
        { title: "Ley", icon: Shield, content: "Gestión de multas, arrestos y equipamiento policial avanzado." },
      ]
    },
    "rpx-biblio": {
      title: "Biblio RPX",
      desc: "Gestión de documentos y libros.",
      sections: [
        { title: "Cultura", icon: Library, content: "Sistema de bibliotecas y gestión de metadatos para libros escritos por jugadores." },
      ]
    },
    "rpx-names": {
      title: "RPX Names",
      desc: "Identidad Roleplay.",
      sections: [
        { title: "Identidad", icon: UserCircle, content: "Gestión de nombres reales, DNI y visualización sobre la cabeza del jugador." },
      ]
    }
  };

  const doc = docsContent[plugin] || docsContent["xlib"];

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
      <header className="space-y-4 border-b border-[#374151] pb-10">
        <div className="flex items-center gap-4">
           <h1 className="text-4xl font-extrabold text-white tracking-tight">{doc.title}</h1>
           <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-yellow-400/20 uppercase">Wiki</span>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">{doc.desc}</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {doc.sections.map((section) => (
          <section key={section.title} className="bg-[#111827] border border-[#374151] p-8 rounded-2xl space-y-4 hover:border-yellow-400/30 transition-all group">
            <div className="flex items-center gap-3 text-yellow-400 group-hover:scale-105 transition-transform origin-left">
              <section.icon className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-widest">{section.title}</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {section.content}
            </p>
          </section>
        ))}
      </div>
      
      <footer className="pt-10 border-t border-[#374151] flex justify-between items-center text-[11px] text-gray-500">
         <p>© 2026 aifusp-dev. Todos los derechos reservados.</p>
         <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
         </div>
      </footer>
    </div>
  );
}
