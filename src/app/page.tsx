import { ArrowRight, Zap, Book, Globe } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 py-12">
      <section className="space-y-6 text-center lg:text-left">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Bienvenido al Portal de <span className="text-yellow-400">xLib</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
          El centro de control unificado para tus plugins favoritos de Minecraft. 
          Documentación técnica, herramientas de configuración avanzada y mercado en tiempo real.
        </p>
        <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
          <Link 
            href="/studio" 
            className="flex items-center gap-2 bg-yellow-400 text-black px-8 py-3.5 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"
          >
            Abrir Studio Pro <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/docs/xlib" 
            className="flex items-center gap-2 bg-[#1f2937] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#374151] transition-all border border-[#374151]"
          >
            Leer Wiki <Book className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-[#374151] p-8 rounded-2xl space-y-4 hover:border-yellow-400/50 transition-colors">
          <div className="bg-yellow-400/10 p-3 rounded-xl w-fit">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Configuración Instantánea</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Genera YAMLs complejos de ItemsAdder y xFoods con solo arrastrar tus archivos visuales.
          </p>
        </div>

        <div className="bg-[#111827] border border-[#374151] p-8 rounded-2xl space-y-4 hover:border-accent/50 transition-colors">
          <div className="bg-blue-400/10 p-3 rounded-xl w-fit">
            <Globe className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Wiki Centralizada</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Toda la información de comandos, permisos y mecánicas de RPX y xFoods en un solo lugar.
          </p>
        </div>

        <div className="bg-[#111827] border border-[#374151] p-8 rounded-2xl space-y-4 hover:border-green-400/50 transition-colors">
          <div className="bg-green-400/10 p-3 rounded-xl w-fit">
            <Book className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Control de Versiones</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Gestión optimizada del ecosistema xLib v2.0 para servidores premium de alto rendimiento.
          </p>
        </div>
      </div>
    </div>
  );
}
