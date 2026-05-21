"use client";

import { use } from "react";
import { 
  FileText, 
  Terminal, 
  PlayCircle,
  Database,
  UserCircle,
  CheckCircle2,
  AlertCircle,
  Code2,
  Copy,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  cmd: string;
  perm: string;
  desc: string;
}

interface Feature {
  title: string;
  desc: string;
}

interface DocContent {
  title: string;
  desc: string;
  longDesc?: string;
  installation?: string[];
  features: Feature[];
  commands?: Command[];
  config?: string;
  developer?: { title: string; code: string; }[];
}

export default function DocPage({ params }: { params: Promise<{ plugin: string }> }) {
  const { plugin } = use(params);

  const docsContent: Record<string, DocContent> = {
    "xlib": {
      title: "xLib Shared",
      desc: "Librería base y proveedora de dependencias para todo el ecosistema aifusp.dev.",
      longDesc: "xLib es la columna vertebral de todos los plugins desarrollados por aifusp.dev. Su objetivo principal es evitar la duplicidad de librerías en el servidor, reduciendo el consumo de RAM y previniendo errores de ClassLoader (LinkageError).",
      installation: [
        "Descarga xLib.jar desde el panel.",
        "Colócalo en la carpeta /plugins/ de tu servidor.",
        "Asegúrate de que es la primera librería en cargar (alfabéticamente ya está configurada)."
      ],
      features: [
        { title: "Sombreado Centralizado", desc: "Contiene ACF, InventoryFramework, NBTAPI, Adventure y HikariCP relocalizados." },
        { title: "TextUtils Pro", desc: "Soporte nativo para MiniMessage, Legacy y colores RGB con un solo método." },
        { title: "Base de Datos", desc: "Gestor de conexiones SQLite y MySQL optimizado con pool de conexiones." },
      ],
      developer: [
        { title: "Maven / Gradle", code: "compileOnly 'org.aifusp.dev:xLib:2.0'" },
        { title: "Uso de TextUtils", code: "player.sendMessage(TextUtils.parseToLegacy(\"<gradient:gold:yellow>¡Hola!</gradient>\"));" }
      ]
    },
    "xfoods": {
      title: "xFoods Core",
      desc: "Sistema avanzado de nutrición y cocina personalizada.",
      longDesc: "xFoods redefine el sistema de alimentación de Minecraft, permitiendo crear comidas con múltiples usos (bites), efectos de estado, nutrición compleja y un sistema de maquinaria de cocina interactiva con minijuegos.",
      installation: [
        "Requiere xLib instalado.",
        "Crea tus comidas en la carpeta /foods/ usando archivos YAML.",
        "Configura tus máquinas en /machines/."
      ],
      features: [
        { title: "Sistema de Bites", desc: "Las comidas no desaparecen al primer uso; pueden tener múltiples mordiscos." },
        { title: "Nutrición", desc: "Estadísticas de Proteínas, Carbohidratos, Azúcares y Vitaminas que afectan al jugador." },
        { title: "Maquinaria", desc: "Estaciones de cocina con BossBar, minijuegos de precisión y estados de quemado." },
      ],
      commands: [
        { cmd: "/xfoods menu", perm: "xfoods.admin", desc: "Abre el editor visual de comidas." },
        { cmd: "/xfoods give <id>", perm: "xfoods.admin", desc: "Entrega una comida personalizada." },
        { cmd: "/xfoods reload", perm: "xfoods.admin", desc: "Recarga todas las configuraciones." },
      ],
      config: `display-name: "Hamburguesa Premium"
item:
  material: COOKED_BEEF
  custom-model-data: 101
stats:
  food-level: 10
  saturation: 5.0
  bites: 4
nutrition:
  proteins: 20
  carbs: 15`
    },
    "xcrops": {
      title: "xCrops Addon",
      desc: "Módulo de agricultura avanzada para xFoods.",
      longDesc: "xCrops añade un sistema de agricultura realista donde las plantas tienen ciclos de vida visuales, requieren cuidados específicos y pueden ser procesadas por las máquinas de xFoods.",
      features: [
        { title: "Fases Visuales", desc: "Uso de ItemDisplays para mostrar el crecimiento real de la planta bloque a bloque." },
        { title: "Cuidados", desc: "Necesidad de agua, luz y fertilizantes químicos u orgánicos." },
        { title: "Plagas", desc: "Sistema de infecciones que requiere el uso de pesticidas para salvar la cosecha." },
      ],
      commands: [
        { cmd: "/crops admin givepod <id>", perm: "xfoodscrops.admin", desc: "Entrega un macetero especial." },
        { cmd: "/crops admin giveseed <id>", perm: "xfoodscrops.admin", desc: "Entrega semillas personalizadas." },
      ]
    },
    "rpx-core": {
      title: "RPX Core",
      desc: "El corazón del sistema Roleplay.",
      longDesc: "RPX Core gestiona la infraestructura básica del servidor de rol: ciudadanos, persistencia de datos y el sistema de trabajos jerárquico.",
      features: [
        { title: "Sistema de Ciudadanos", desc: "Vinculación de perfiles de usuario con datos persistentes en base de datos." },
        { title: "Trabajos y Rangos", desc: "Configuración flexible de empleos con salarios y permisos por rango." },
        { title: "API para Módulos", desc: "Punto de entrada único para todos los addons oficiales de RPX." },
      ],
      commands: [
        { cmd: "/rpx citizen <jugador>", perm: "rpx.admin", desc: "Ver info de un ciudadano." },
        { cmd: "/job set <jugador> <trabajo>", perm: "rpx.admin", desc: "Asignar un empleo." },
      ]
    },
    "rpx-economy": {
      title: "RPX Economy",
      desc: "Sistema financiero avanzado y bancario.",
      longDesc: "RPX Economy extiende las capacidades económicas del servidor introduciendo el concepto de banca física y digital. Permite la gestión de ahorros, préstamos, datáfonos para negocios y un sistema de suscripciones recurrentes.",
      features: [
        { title: "Banca Multicuenta", desc: "Los ciudadanos pueden abrir y gestionar múltiples cuentas (ahorro, empresa, etc.) desde una interfaz GUI." },
        { title: "Efectivo Físico", desc: "Generación de billetes y monedas con valores reales que se pueden retirar del banco o usar para transacciones directas." },
        { title: "Datáfonos", desc: "Bloques interactivos que permiten a los negocios cobrar directamente a la cuenta bancaria de un cliente." },
        { title: "Suscripciones", desc: "Cobros automáticos recurrentes (ej: alquileres, servicios) configurables por administradores." }
      ],
      commands: [
        { cmd: "/eco bank", perm: "rpx.eco.use", desc: "Abre el selector de cuentas bancarias." },
        { cmd: "/eco getmoney <cant>", perm: "rpx.eco.admin", desc: "Genera dinero físico en billetes/monedas." },
        { cmd: "/eco givedataphone", perm: "rpx.eco.admin", desc: "Entrega un datáfono vinculado a una cuenta." },
      ]
    },
    "rpx-health": {
      title: "RPX Health",
      desc: "Sistema de salud, constantes vitales y medicina.",
      longDesc: "Este módulo añade una capa de realismo médico. Los ciudadanos tienen constantes vitales persistentes y un sistema de enfermedades que evoluciona con el tiempo si no se trata adecuadamente.",
      features: [
        { title: "Constantes Vitales", desc: "Seguimiento de sangre, pulso y temperatura. Afecta al rendimiento del jugador." },
        { title: "Vectores de Infección", desc: "Integración con xFoods para que la comida en mal estado pueda transmitir enfermedades específicas." },
        { title: "EMS Toolbox", desc: "Herramientas de diagnóstico con BossBars dinámicas y menús de prescripción médica." },
        { title: "Resistencia General", desc: "Sistema que premia la buena alimentación y cuidados, haciendo al jugador menos propenso a enfermar." }
      ],
      commands: [
        { cmd: "/ems diag <jugador>", perm: "rpxhealth.ems", desc: "Realiza un diagnóstico médico detallado." },
        { cmd: "/ems recetar <jugador>", perm: "rpxhealth.ems", desc: "Abre el menú de prescripción de medicamentos." },
        { cmd: "/salud admin infect", perm: "rpxhealth.admin", desc: "Fuerza la infección de un ciudadano." },
      ]
    },
    "rpx-clockin": {
      title: "RPX ClockIn",
      desc: "Gestión de asistencia y turnos.",
      longDesc: "Módulo para que los trabajadores de servicios públicos o empresas privadas fichen su entrada y salida, calculando horas trabajadas para el salario.",
      features: [
        { title: "Fichaje Visual", desc: "Uso de carteles o bloques interactivos para marcar el inicio de turno." },
        { title: "Logs de Actividad", desc: "Registro detallado para administradores sobre quién ha trabajado y cuánto." },
      ],
      commands: [
        { cmd: "/fichar", perm: "rpx.clockin.use", desc: "Fichar entrada/salida." },
      ]
    },
    "rpx-police": {
      title: "Police RPX",
      desc: "Herramientas avanzadas para policía.",
      longDesc: "Proporciona a las fuerzas de seguridad herramientas para arrestos, gestión de celdas, PDAs con base de datos de antecedentes y equipamiento táctico.",
      features: [
        { title: "Sistema de Celdas", desc: "Creación dinámica de zonas de prisión con tiempos de condena automáticos." },
        { title: "PDA Policial", desc: "Consulta de multas, búsqueda de ciudadanos y registro de arrestos en tiempo real." },
        { title: "Equipamiento", desc: "Esposas funcionales, porras y táser integrados." },
      ],
      commands: [
        { cmd: "/police pda", perm: "rpxpolice.pda", desc: "Recibir la PDA policial." },
        { cmd: "/police celda crear <id>", perm: "rpxpolice.admin", desc: "Definir una celda." },
      ]
    },
    "rpx-biblio": {
      title: "Biblio RPX",
      desc: "Gestión de cultura y documentos.",
      longDesc: "Permite la creación de una biblioteca nacional donde los jugadores pueden subir libros escritos y otros ciudadanos pueden comprarlos o leerlos.",
      features: [
        { title: "Base de Datos de Libros", desc: "Serialización universal de libros escritos (Base64) para su preservación." },
        { title: "Interfaz de Lectura", desc: "Menú GUI para explorar categorías y autores." },
      ]
    },
    "rpx-names": {
      title: "RPX Names",
      desc: "Identidad y Nombres Reales.",
      longDesc: "Gestiona los nombres 'IC' (In Character) de los jugadores, ocultando el nick de Minecraft y mostrando el nombre real configurado.",
      features: [
        { title: "Namespaces IC", desc: "Visualización de nombres sobre la cabeza mediante Team Tags." },
        { title: "DNI / Pasaporte", desc: "Generación de ítems de identidad con foto (mapa) y datos del ciudadano." },
      ]
    }
  };

  const doc = docsContent[plugin] || docsContent["xlib"];

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in duration-700 pb-20">
      {/* Hero Section */}
      <header className="space-y-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
              <FileText className="w-8 h-8 text-yellow-400" />
           </div>
           <div>
              <h1 className="text-5xl font-black text-white tracking-tighter">{doc.title}</h1>
              <div className="flex gap-2 mt-2">
                 <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-lg border border-yellow-400/20 uppercase tracking-widest">Documentación Oficial</span>
                 <span className="bg-blue-400/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-lg border border-blue-400/20 uppercase tracking-widest">v2.1</span>
              </div>
           </div>
        </div>
        <p className="text-xl text-gray-400 leading-relaxed font-medium border-l-4 border-yellow-400/30 pl-6">
          {doc.desc}
        </p>
      </header>

      {/* Main Content Grid */}
      <div className="space-y-16 text-gray-300">
        
        {/* Long Description */}
        {doc.longDesc && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <PlayCircle className="w-6 h-6 text-yellow-400" />
              Introducción
            </h2>
            <p className="text-gray-400 leading-8 text-lg">
              {doc.longDesc}
            </p>
          </section>
        )}

        {/* Installation */}
        {doc.installation && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              Instalación
            </h2>
            <div className="bg-[#0b0f19] border border-[#374151] rounded-2xl overflow-hidden">
               {doc.installation.map((step, i) => (
                 <div key={i} className="flex items-start gap-4 p-5 border-b border-[#374151] last:border-0 hover:bg-white/5 transition-colors">
                    <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center mt-1">{i + 1}</span>
                    <p className="text-sm font-medium">{step}</p>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* Features Table */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            Características Principales
          </h2>
          <div className="grid gap-4">
            {doc.features.map((f, i) => (
              <div key={i} className="group p-6 bg-[#0b0f19] border border-[#374151] rounded-2xl hover:border-yellow-400/30 transition-all">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Commands Table */}
        {doc.commands && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Terminal className="w-6 h-6 text-blue-400" />
              Comandos y Permisos
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-[#374151]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0b0f19] text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-[#374151]">
                  <tr>
                    <th className="px-6 py-4">Comando</th>
                    <th className="px-6 py-4">Permiso</th>
                    <th className="px-6 py-4">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#374151]">
                  {doc.commands.map((c, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-yellow-400 font-bold">{c.cmd}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-400/10 text-blue-400 rounded text-[10px] font-bold border border-blue-400/20">{c.perm}</span></td>
                      <td className="px-6 py-4 text-gray-400">{c.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Config Example */}
        {doc.config && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Database className="w-6 h-6 text-purple-400" />
              Ejemplo de Configuración
            </h2>
            <div className="relative group">
               <pre className="bg-[#0b0f19] border border-[#374151] p-6 rounded-2xl font-mono text-sm text-gray-400 overflow-x-auto leading-relaxed">
                  <code>{doc.config}</code>
               </pre>
               <button className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                  <Copy className="w-4 h-4" />
               </button>
            </div>
          </section>
        )}

        {/* Developer Info */}
        {doc.developer && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Code2 className="w-6 h-6 text-pink-400" />
              Para Desarrolladores (API)
            </h2>
            <div className="space-y-4">
              {doc.developer.map((dev, i) => (
                <div key={i} className="space-y-3">
                   <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">{dev.title}</h4>
                   <pre className="bg-black/40 border border-[#374151] p-4 rounded-xl font-mono text-[13px] text-pink-400/80 overflow-x-auto">
                      <code>{dev.code}</code>
                   </pre>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Navigation Footer */}
      <footer className="pt-16 border-t border-[#374151] flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-500 font-medium">Documentación técnica oficial de aifusp.dev</p>
            <p className="text-[10px] text-gray-600 font-mono">Última actualización: Mayo 2026</p>
         </div>
         <div className="flex gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-300 transition-all border border-white/5">
               <AlertCircle className="w-4 h-4" /> Reportar Error
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-yellow-400/20">
               <ExternalLink className="w-4 h-4" /> Ver GitHub
            </button>
         </div>
      </footer>
    </div>
  );
}

