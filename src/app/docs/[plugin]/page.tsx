"use client";

import { use } from "react";
import { 
  FileText, 
  Terminal, 
  ShieldCheck, 
  PlayCircle 
} from "lucide-react";

export default function DocPage({ params }: { params: Promise<{ plugin: string }> }) {
  const { plugin } = use(params);

  const docsContent: Record<string, any> = {
    xlib: {
      title: "xLib Core",
      desc: "Librería base para todos los módulos de aifusp.dev.",
      sections: [
        { title: "Instalación", icon: PlayCircle, content: "Sube el xLib.jar a tu carpeta de plugins y reinicia." },
        { title: "Comandos", icon: Terminal, content: "/xlib version - Muestra la versión instalada." },
      ]
    },
    xfoods: {
      title: "xFoods Core",
      desc: "Sistema avanzado de comidas y nutrición.",
      sections: [
        { title: "Creación de Comida", icon: FileText, content: "Usa el Studio Pro para generar tus YAMLs de comida." },
        { title: "Permisos", icon: ShieldCheck, content: "xfoods.admin - Acceso total a comandos." },
      ]
    }
  };

  const doc = docsContent[plugin] || docsContent.xlib;

  return (
    <div className="max-w-3xl space-y-12">
      <header className="space-y-4 border-b border-[#374151] pb-10">
        <h1 className="text-4xl font-extrabold text-white capitalize">{doc.title}</h1>
        <p className="text-lg text-gray-400 leading-relaxed">{doc.desc}</p>
      </header>

      <div className="space-y-16">
        {doc.sections.map((section: any) => (
          <section key={section.title} className="space-y-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <section.icon className="w-5 h-5" />
              <h2 className="text-xl font-bold uppercase tracking-tight">{section.title}</h2>
            </div>
            <div className="bg-[#111827] border border-[#374151] p-6 rounded-xl text-gray-300 leading-relaxed">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
