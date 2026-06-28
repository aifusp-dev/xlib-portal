"use client";

import { use, useState } from "react";
import { Copy, Check, ChevronRight, Info, AlertTriangle, Lightbulb, Terminal, Zap, Package, Code2, Settings, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── types ─────────────────────────────────────────────────── */
interface Command { cmd: string; perm: string; desc: string }
interface TocEntry { id: string; label: string }
interface Callout  { type: "info" | "tip" | "warn" | "danger"; text: string }
interface CodeBlock { lang: string; code: string }

type Block =
  | { kind: "p";       text: string }
  | { kind: "h3";      id: string; text: string }
  | { kind: "callout"; callout: Callout }
  | { kind: "code";    block: CodeBlock }
  | { kind: "ul";      items: string[] }
  | { kind: "commands"; list: Command[] };

interface Section { id: string; title: string; blocks: Block[] }
interface DocData {
  title: string;
  category: string;
  version: string;
  badge?: string;
  desc: string;
  toc: TocEntry[];
  sections: Section[];
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
}

/* ─── small components ───────────────────────────────────────── */
function Callout({ type, text }: Callout) {
  const styles = {
    info:   { bg: "bg-blue-950/40",   border: "border-blue-500/40",   icon: Info,          label: "Información", lc: "text-blue-400" },
    tip:    { bg: "bg-emerald-950/40", border: "border-emerald-500/40", icon: Lightbulb,     label: "Consejo",     lc: "text-emerald-400" },
    warn:   { bg: "bg-amber-950/40",   border: "border-amber-500/40",  icon: AlertTriangle, label: "Atención",    lc: "text-amber-400" },
    danger: { bg: "bg-red-950/40",     border: "border-red-500/40",    icon: AlertCircle,   label: "Importante",  lc: "text-red-400" },
  }[type];
  const Icon = styles.icon;
  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border my-5", styles.bg, styles.border)}>
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", styles.lc)} />
      <div>
        <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", styles.lc)}>{styles.label}</p>
        <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function CodeBlock({ lang, code }: CodeBlock) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-xl border border-[#374151] overflow-hidden my-5 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#374151]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{lang}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-200 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="p-4 text-[13px] font-mono leading-relaxed text-gray-300 overflow-x-auto"><code>{code}</code></pre>
    </div>
  );
}

function CommandsTable({ list }: { list: Command[] }) {
  return (
    <div className="rounded-xl border border-[#374151] overflow-hidden my-5">
      <table className="w-full text-sm">
        <thead className="bg-[#161b22] border-b border-[#374151]">
          <tr>
            {["Comando", "Permiso", "Descripción"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f2937]">
          {list.map((c, i) => (
            <tr key={i} className="hover:bg-white/2 transition-colors">
              <td className="px-4 py-3 font-mono text-[13px] text-yellow-400 font-semibold whitespace-nowrap">{c.cmd}</td>
              <td className="px-4 py-3"><span className="text-[11px] font-mono bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">{c.perm}</span></td>
              <td className="px-4 py-3 text-gray-400 text-sm">{c.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(block: Block, i: number) {
  switch (block.kind) {
    case "p":        return <p key={i} className="text-gray-400 leading-7 text-[15px] mb-4">{block.text}</p>;
    case "h3":       return <h3 key={i} id={block.id} className="text-base font-bold text-gray-100 mt-6 mb-3 scroll-mt-20">{block.text}</h3>;
    case "callout":  return <Callout key={i} {...block.callout} />;
    case "code":     return <CodeBlock key={i} {...block.block} />;
    case "commands": return <CommandsTable key={i} list={block.list} />;
    case "ul":       return (
      <ul key={i} className="space-y-1.5 my-4 ml-1">
        {block.items.map((it, j) => (
          <li key={j} className="flex items-start gap-2.5 text-sm text-gray-400">
            <span className="mt-2 w-1 h-1 rounded-full bg-yellow-400/60 shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    );
  }
}

/* ─── docs data ─────────────────────────────────────────────── */
const docs: Record<string, DocData> = {
  // ── keep non-RPX entries ──────────────────────────────────────
  xlib: {
    title: "xLib Shared",
    category: "Librería Core",
    version: "2.0",
    badge: "Core",
    desc: "Librería base que centraliza dependencias compartidas y utilidades para todos los plugins del ecosistema aifusp.dev.",
    toc: [
      { id: "intro",    label: "¿Qué es xLib?" },
      { id: "install",  label: "Instalación" },
      { id: "features", label: "Características" },
      { id: "dev",      label: "Para Desarrolladores" },
    ],
    sections: [
      {
        id: "intro", title: "¿Qué es xLib?",
        blocks: [
          { kind: "p", text: "xLib es la columna vertebral de todos los plugins desarrollados por aifusp.dev. Su objetivo principal es centralizar dependencias (ACF, InventoryFramework, NBTAPI, Adventure, HikariCP) en un único jar, evitando conflictos de ClassLoader y reduciendo el consumo de RAM del servidor." },
          { kind: "callout", callout: { type: "warn", text: "Todos los plugins del ecosistema requieren xLib instalado. Debe cargarse antes que el resto de plugins (la 'x' inicial garantiza orden alfabético)." } },
        ],
      },
      {
        id: "install", title: "Instalación",
        blocks: [
          { kind: "ul", items: [
            "Descarga xLib.jar desde el panel de tu servidor.",
            "Colócalo en la carpeta /plugins/ de tu servidor Spigot/Paper.",
            "Reinicia el servidor — xLib no requiere configuración adicional.",
          ]},
          { kind: "callout", callout: { type: "info", text: "Compatible con Paper 1.20+ y Spigot 1.20+. Requiere Java 17 o superior." } },
        ],
      },
      {
        id: "features", title: "Características",
        blocks: [
          { kind: "h3", id: "textutils", text: "TextUtils" },
          { kind: "p",  text: "Soporte completo para MiniMessage, Legacy codes y gradientes RGB en un único método." },
          { kind: "code", block: { lang: "java", code: `// MiniMessage
player.sendMessage(TextUtils.parse("<gradient:gold:yellow>¡Bienvenido!</gradient>"));

// Legacy directo
player.sendMessage(TextUtils.parseToLegacy("&aVerde &b→ &cRojo"));` } },
          { kind: "h3", id: "db", text: "Gestor de Base de Datos" },
          { kind: "p",  text: "Pool de conexiones HikariCP listo para SQLite y MySQL. Los plugins solo necesitan extender el manager sin configurar drivers." },
          { kind: "code", block: { lang: "java", code: `public class MyDatabaseManager extends XLibDatabaseManager {
    public MyDatabaseManager(JavaPlugin plugin) {
        super(plugin); // Lee config.yml automáticamente
    }
}` } },
        ],
      },
      {
        id: "dev", title: "Para Desarrolladores",
        blocks: [
          { kind: "p", text: "Añade xLib como dependencia de compilación usando compileOnly (no la incluyas en tu shadowJar)." },
          { kind: "code", block: { lang: "groovy", code: `// build.gradle
dependencies {
    compileOnly 'org.aifusp.dev:xLib:2.0'
}` } },
          { kind: "callout", callout: { type: "tip", text: "Declara xLib en tu plugin.yml como 'depend: [xLib]' para que Bukkit garantice el orden de carga." } },
        ],
      },
    ],
    next: { label: "xPhone", href: "/docs/xphone" },
  },

  xphone: {
    title: "xPhone",
    category: "Plugins Standalone",
    version: "1.0",
    badge: "Standalone",
    desc: "Plugin de smartphone roleplay con sistema de SIM, apps modulares, mensajes, llamadas y red social xBird.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "sim",      label: "SIM Cards" },
      { id: "apps",     label: "Sistema de Apps" },
      { id: "commands", label: "Comandos" },
      { id: "api",      label: "API — Crear Apps" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "xPhone transforma un ítem de Minecraft en un smartphone funcional para servidores de roleplay. Cada teléfono necesita una SIM card activa para operar; sin ella, las funciones de red (mensajes, llamadas, xBird) quedan desactivadas." },
          { kind: "ul", items: [
            "Interfaz springboard (pantalla principal con iconos de apps)",
            "Sistema de contactos por número de SIM",
            "Mensajes SMS y llamadas con soporte de VoiceChat",
            "Red social xBird (tweets de hasta 280 caracteres)",
            "App Store para cargar apps de terceros como JARs externos",
            "Soporte PlaceholderAPI (%xphone_number%, etc.)",
          ]},
        ],
      },
      {
        id: "sim", title: "SIM Cards",
        blocks: [
          { kind: "p", text: "Cada SIM card tiene un número único de 4-7 dígitos generado aleatoriamente y almacenado en base de datos. Un jugador puede tener múltiples SIMs pero solo una activa a la vez en la mano." },
          { kind: "callout", callout: { type: "info", text: "El número de SIM es la identidad del jugador en xPhone. Compártelo para recibir mensajes o aparecer en la red xBird." } },
          { kind: "h3", id: "sim-profile", text: "Perfil de SIM" },
          { kind: "p", text: "Cada SIM tiene un perfil personalizable: nombre para mostrar (DisplayName) y biografía (Bio). Ambos son visibles para otros jugadores en xBird y al recibir mensajes." },
        ],
      },
      {
        id: "apps", title: "Sistema de Apps",
        blocks: [
          { kind: "p", text: "xPhone tiene un sistema de apps modular. Las apps nativas se registran al arrancar el plugin; terceros pueden registrar sus propias apps desde cualquier plugin usando la AppRegistry." },
          { kind: "h3", id: "apps-native", text: "Apps Nativas" },
          { kind: "ul", items: [
            "Contacts — gestión de la agenda de contactos",
            "Messages — hilo de SMS por número",
            "xBird — red social (timeline, publicar, seguir)",
            "Meet People — descubrir jugadores online con SIM activa",
            "Settings — ajustes del teléfono (idioma, notificaciones)",
            "App Store — tienda/instalador de apps externas",
          ]},
          { kind: "callout", callout: { type: "tip", text: "xBird integra VoiceChat si el plugin SimpleVoiceChat está instalado, permitiendo llamadas de audio en tiempo real." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/phone",            perm: "xphone.use",   desc: "Muestra ayuda del comando base." },
            { cmd: "/phone give",       perm: "xphone.admin", desc: "Entrega un teléfono al jugador." },
            { cmd: "/phone givesim",    perm: "xphone.admin", desc: "Genera y entrega una SIM card nueva." },
            { cmd: "/phone reload",     perm: "xphone.admin", desc: "Recarga apps y configuración." },
            { cmd: "/phone post <msg>", perm: "xphone.use",   desc: "Publica en xBird (máx 280 chars)." },
            { cmd: "/phone sms <nº> <msg>", perm: "xphone.use", desc: "Envía un SMS a otro número." },
            { cmd: "/phone addcontact <nº> <nombre>", perm: "xphone.use", desc: "Añade un contacto a la agenda." },
            { cmd: "/phone setname <nombre>", perm: "xphone.use", desc: "Cambia el nombre del perfil SIM." },
            { cmd: "/phone setbio <texto>",   perm: "xphone.use", desc: "Cambia la bio del perfil SIM." },
          ]},
        ],
      },
      {
        id: "api", title: "API — Crear Apps",
        blocks: [
          { kind: "p", text: "Cualquier plugin puede registrar una PhoneApp en xPhone. Solo necesita implementar la interfaz PhoneApp y registrarla al arrancar." },
          { kind: "code", block: { lang: "java", code: `public class MiApp implements PhoneApp {

    @Override
    public String getId()    { return "mi_app"; }
    @Override
    public String getName()  { return "Mi App"; }
    @Override
    public Material getIcon() { return Material.EMERALD; }

    @Override
    public void onOpen(Player player, int simNumber) {
        // Abrir tu GUI aquí
    }
}

// En tu onEnable():
xPhoneAPI api = (xPhoneAPI) Bukkit.getPluginManager().getPlugin("xPhone");
api.getAppRegistry().registerApp(this, new MiApp());` } },
          { kind: "callout", callout: { type: "warn", text: "Declara xPhone como softdepend en tu plugin.yml si la app es opcional, o depend si es obligatoria." } },
        ],
      },
    ],
    prev: { label: "xLib",   href: "/docs/xlib"   },
    next: { label: "xAlbum", href: "/docs/xalbum" },
  },

  xalbum: {
    title: "xAlbum",
    category: "Plugins Standalone",
    version: "1.0",
    badge: "Standalone",
    desc: "Sistema de álbum de colección standalone. Los jugadores desbloquean entradas por descubrimiento o comandos de admin.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "config",   label: "Configuración" },
      { id: "commands", label: "Comandos" },
      { id: "api",      label: "API" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "xAlbum añade un álbum de colección persistente para jugadores. Las entradas se organizan por categorías y pueden desbloquearse automáticamente (a través de listeners de descubrimiento) o manualmente con comandos de admin." },
          { kind: "ul", items: [
            "Categorías configurables en entries.yml",
            "Desbloqueo por evento (matar mob, recoger ítem, etc.) con DiscoveryListener",
            "Interfaz GUI por categorías con InventoryFramework",
            "Persistencia de progreso por UUID en SQLite vía xLib",
            "API pública para desbloquear entradas desde otros plugins",
          ]},
          { kind: "callout", callout: { type: "info", text: "xAlbum no depende de RPX ni de ningún otro plugin del ecosistema — solo de xLib." } },
        ],
      },
      {
        id: "config", title: "Configuración",
        blocks: [
          { kind: "p", text: "Las entradas se definen en entries.yml. Cada entrada tiene una categoría, nombre, descripción e ícono." },
          { kind: "code", block: { lang: "yaml", code: `# entries.yml
animales:crabo_ermitano:
  name: "Cangrejo Ermitaño"
  description: "Encontraste un cangrejo ermitaño en la playa."
  icon: TURTLE_EGG
  custom-model-data: 3401

fauna:lobo_negro:
  name: "Lobo Negro"
  description: "Avistaste un lobo negro en el bosque oscuro."
  icon: BONE
  custom-model-data: 0` } },
          { kind: "callout", callout: { type: "tip", text: "La clave de una entrada es 'categoria:id'. Usa este formato en los comandos de admin para referenciarla." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/album",                   perm: "—",             desc: "Abre el álbum de colección (menú de categorías)." },
            { cmd: "/album give <jugador> <entrada>", perm: "xalbum.admin", desc: "Desbloquea manualmente una entrada para un jugador." },
            { cmd: "/album reload",            perm: "xalbum.admin", desc: "Recarga entries.yml sin reiniciar." },
          ]},
        ],
      },
      {
        id: "api", title: "API",
        blocks: [
          { kind: "p", text: "Desbloquea entradas desde cualquier plugin usando AlbumAPI." },
          { kind: "code", block: { lang: "java", code: `AlbumAPI api = AlbumAPI.getInstance();

// Desbloquear una entrada
boolean unlocked = api.unlock(player, "animales:crabo_ermitano");
if (unlocked) {
    player.sendMessage("§a¡Nueva entrada descubierta!");
}

// Comprobar si ya la tiene
boolean has = api.hasEntry(player.getUniqueId(), "animales:crabo_ermitano");` } },
        ],
      },
    ],
    prev: { label: "xPhone",    href: "/docs/xphone"    },
    next: { label: "Minedachi", href: "/docs/minedachi" },
  },

  minedachi: {
    title: "Minedachi",
    category: "Plugins Standalone",
    version: "0.1",
    badge: "Beta",
    desc: "Ciudad virtual estilo Tomodachi Life. Los jugadores tienen su propia parcela en un mundo generado, con relaciones y economía interna.",
    toc: [
      { id: "intro",   label: "Concepto" },
      { id: "world",   label: "Sistema de Mundo" },
      { id: "plots",   label: "Parcelas" },
      { id: "economy", label: "Economía" },
    ],
    sections: [
      {
        id: "intro", title: "Concepto",
        blocks: [
          { kind: "p", text: "Minedachi es un plugin inspirado en Tomodachi Life (Nintendo DS). Cada jugador habita una parcela en una ciudad compartida, puede relacionarse con otros ciudadanos y gestiona una economía interna independiente del servidor principal." },
          { kind: "ul", items: [
            "Cada jugador tiene un Tomodachi (personaje) con datos persistentes",
            "Mundo de ciudad generado con generator propio (isla plana + schemáticas)",
            "Parcelas (plots) asignadas y cargadas dinámicamente",
            "Sistema de relaciones entre ciudadanos (Relacion.java)",
            "Economía con múltiples divisas configurables",
            "Desinstalación automática de mundos inactivos",
          ]},
          { kind: "callout", callout: { type: "warn", text: "Minedachi está en fase Beta. La API y la estructura de datos pueden cambiar entre versiones." } },
        ],
      },
      {
        id: "world", title: "Sistema de Mundo",
        blocks: [
          { kind: "p", text: "El plugin genera o copia un mundo de ciudad al inicializarse. Usa FolderCopyCityWorldManager para duplicar una plantilla de mundo en lugar de generarla desde cero, lo que permite diseñar la ciudad en el editor." },
          { kind: "h3", id: "idle-unload", text: "Descarga por inactividad" },
          { kind: "p",  text: "El mundo se comprueba cada minuto. Si no hay jugadores activos en la ciudad, se descarga automáticamente para liberar memoria RAM." },
          { kind: "code", block: { lang: "java", code: `// Intervalo configurado en Minedachi.java
long checkIntervalTicks = 20L * 60; // cada 60 segundos
Bukkit.getScheduler().runTaskTimer(this,
    cityWorldManager::runIdleUnloadCheck,
    checkIntervalTicks, checkIntervalTicks);` } },
        ],
      },
      {
        id: "plots", title: "Parcelas",
        blocks: [
          { kind: "p", text: "Cada parcela tiene un anchor (coordenadas del origen), tamaño configurable en plot-config.yml y se le asigna a un jugador cuando entra al mundo por primera vez." },
          { kind: "code", block: { lang: "yaml", code: `# plot-config.yml
plot-size: 32
plot-height: 48
spawn-offset:
  x: 16
  z: 16` } },
          { kind: "callout", callout: { type: "tip", text: "Las schemáticas de las casas se colocan automáticamente al asignar una parcela usando SchematicService." } },
        ],
      },
      {
        id: "economy", title: "Economía",
        blocks: [
          { kind: "p", text: "Minedachi usa su propia divisa interna (definida en Currency.java) separada del vault del servidor principal. El coste de ampliar slots de parcela se calcula dinámicamente con SlotCostCalculator." },
          { kind: "code", block: { lang: "yaml", code: `# config.yml
economy:
  base-slot-cost: 500
  cost-multiplier: 1.5
  currency-name: "Monedas Mina"
  currency-symbol: "🪙"` } },
        ],
      },
    ],
    prev: { label: "xAlbum",   href: "/docs/xalbum" },
    next: { label: "xFoods Core", href: "/docs/xfoods" },
  },

  xfoods: {
    title: "xFoods Core",
    category: "xFoods Ecosystem",
    version: "2.0",
    badge: "Ecosystem",
    desc: "Sistema avanzado de nutrición, bites múltiples, maquinaria de cocina interactiva y estadísticas nutricionales.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "bites",    label: "Sistema de Bites" },
      { id: "nutrition",label: "Nutrición" },
      { id: "commands", label: "Comandos" },
      { id: "config",   label: "Configuración YAML" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "xFoods redefine el sistema de alimentación de Minecraft. Las comidas pueden tener múltiples mordiscos (bites), estadísticas nutricionales complejas y cocinarse en máquinas interactivas con minijuegos de precisión." },
          { kind: "callout", callout: { type: "info", text: "xFoods requiere xLib instalado. Las comidas se definen en archivos YAML dentro de la carpeta /plugins/xFoods/foods/." } },
        ],
      },
      {
        id: "bites", title: "Sistema de Bites",
        blocks: [
          { kind: "p", text: "Cada comida tiene un número de bites configurables. Al consumirse, el ítem no desaparece — su estado (bites restantes) se guarda en los NBT del ítem y se muestra en la UI." },
        ],
      },
      {
        id: "nutrition", title: "Nutrición",
        blocks: [
          { kind: "p", text: "Las comidas tienen cuatro estadísticas nutricionales: Proteínas, Carbohidratos, Azúcares y Vitaminas. Estas afectan directamente las mecánicas del módulo RPX Health si está instalado." },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/xfoods menu",         perm: "xfoods.admin", desc: "Abre el editor visual de comidas." },
            { cmd: "/xfoods give <id>",    perm: "xfoods.admin", desc: "Entrega una comida personalizada." },
            { cmd: "/xfoods reload",       perm: "xfoods.admin", desc: "Recarga todas las configuraciones." },
          ]},
        ],
      },
      {
        id: "config", title: "Configuración YAML",
        blocks: [
          { kind: "code", block: { lang: "yaml", code: `# foods/hamburguesa.yml
display-name: "Hamburguesa Premium"
item:
  material: COOKED_BEEF
  custom-model-data: 101
stats:
  food-level: 10
  saturation: 5.0
  bites: 4
nutrition:
  proteins: 20
  carbs: 15
  sugars: 3
  vitamins: 5` } },
        ],
      },
    ],
    prev: { label: "Minedachi", href: "/docs/minedachi" },
    next: { label: "xCrops",   href: "/docs/xcrops" },
  },

  xcrops: {
    title: "xCrops Addon",
    category: "xFoods Ecosystem",
    version: "1.0",
    badge: "Addon",
    desc: "Módulo de agricultura avanzada para xFoods con ciclos visuales, cuidados y plagas.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "features", label: "Características" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "xCrops añade un sistema de agricultura realista donde las plantas tienen ciclos de vida visuales usando ItemDisplays, requieren cuidados específicos y pueden infectarse con plagas." },
          { kind: "callout", callout: { type: "warn", text: "xCrops requiere tanto xLib como xFoods Core instalados." } },
        ],
      },
      {
        id: "features", title: "Características",
        blocks: [
          { kind: "ul", items: [
            "Fases visuales con ItemDisplays — el crecimiento se muestra bloque a bloque",
            "Necesidad de agua, luz solar y fertilizantes",
            "Fertilizantes químicos (crecimiento rápido) y orgánicos (mejor calidad)",
            "Sistema de plagas: infección progresiva que requiere pesticidas",
            "Integración con las recetas de cocina de xFoods",
          ]},
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/crops admin givepod <id>",  perm: "xfoodscrops.admin", desc: "Entrega un macetero especial." },
            { cmd: "/crops admin giveseed <id>", perm: "xfoodscrops.admin", desc: "Entrega semillas personalizadas." },
          ]},
        ],
      },
    ],
    prev: { label: "xFoods Core", href: "/docs/xfoods" },
    next: { label: "RPX Core",    href: "/docs/rpx-core" },
  },

  "rpx-core": {
    title: "RPX Core",
    category: "RPX Suite",
    version: "2.0",
    badge: "Core",
    desc: "Núcleo del ecosistema de roleplay. Gestiona personajes (ciudadanos), empleos, mobiliario, necesidades vitales, identidad IC y la API centralizada para todos los módulos RPX.",
    toc: [
      { id: "intro",       label: "Introducción" },
      { id: "ciudadanos",  label: "Sistema de Personajes" },
      { id: "chat",        label: "Chat Roleplay" },
      { id: "empleos",     label: "Empleos y Rangos" },
      { id: "necesidades", label: "Necesidades Vitales" },
      { id: "commands",    label: "Comandos" },
      { id: "permisos",    label: "Permisos LuckPerms" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Core es el cimiento sobre el que se construye todo el ecosistema RPX. Proporciona la gestión de ciudadanos (personajes IC), empleos jerarquizados, mobiliario interactivo registrado, necesidades vitales y una API pública utilizada por todos los módulos adicionales." },
          { kind: "callout", callout: { type: "warn", text: "Todos los módulos RPX (Economy, Health, Police, ClockIn, RealState, Gangs…) dependen de RPX Core. Debe cargarse primero." } },
          { kind: "ul", items: [
            "Sistema multi-personaje por jugador (slots configurables vía LuckPerms)",
            "Integración nativa con LuckPerms para permisos por rango/empleo",
            "API pública RPXAPI para acceso desde cualquier módulo o plugin externo",
            "CitizenManager, JobManager, ActiveCitizenManager y FurnitureManager centralizados",
          ]},
        ],
      },
      {
        id: "ciudadanos", title: "Sistema de Personajes",
        blocks: [
          { kind: "p", text: "Cada jugador puede tener múltiples personajes (ciudadanos). Solo uno está activo a la vez. El modelo Citizen contiene el nombre IC (rolName), DNI, género, fecha de nacimiento y el empleo asignado." },
          { kind: "h3", id: "ciudadanos-slots", text: "Slots de personajes" },
          { kind: "p", text: "El número máximo de personajes se controla con un permiso de LuckPerms. Por defecto es 1; los admins pueden ampliarlo con /rpx setlimit." },
          { kind: "code", block: { lang: "text", code: "rpx.chars.limit.1   → 1 personaje (por defecto)\nrpx.chars.limit.3   → 3 personajes\nrpx.chars.limit.21  → 21 personajes (máximo)" } },
          { kind: "h3", id: "ciudadanos-dni", text: "DNI Físico" },
          { kind: "p", text: "El comando /dni genera un ítem físico con los datos del personaje activo. El ítem lleva NBT 'rpx_dni' con el ID del ciudadano para que otros módulos puedan leerlo." },
          { kind: "callout", callout: { type: "tip", text: "Usa /dni show <id> para consultar el perfil de cualquier ciudadano sin necesidad de que esté conectado." } },
        ],
      },
      {
        id: "chat", title: "Chat Roleplay",
        blocks: [
          { kind: "p", text: "RPX Core incluye cuatro comandos de chat IC que generan hologramas encima del jugador o mensajes de área. Todos requieren un personaje activo." },
          { kind: "commands", list: [
            { cmd: "/me <mensaje>",      perm: "rpx.chat.me",      desc: "Muestra '* mensaje *' en cian como holograma encima del jugador (emote)." },
            { cmd: "/do <mensaje>",      perm: "rpx.chat.do",      desc: "Describe el entorno o resultado de una acción." },
            { cmd: "/ooc <mensaje>",     perm: "rpx.chat.ooc",     desc: "Mensaje fuera de personaje con prefijo [OOC]." },
            { cmd: "/entorno <mensaje>", perm: "rpx.chat.entorno", desc: "Describe el entorno a jugadores cercanos. Útil para eventos." },
          ]},
          { kind: "callout", callout: { type: "info", text: "Los hologramas de /me y /do se eliminan automáticamente tras unos segundos. La distancia visible es configurable en config.yml." } },
        ],
      },
      {
        id: "empleos", title: "Empleos y Rangos",
        blocks: [
          { kind: "p", text: "El JobManager define los empleos disponibles. Cada empleo tiene un ID único, nombre, salario base y una jerarquía de rangos con permisos propios." },
          { kind: "code", block: { lang: "yaml", code: "# jobs.yml\npolicia:\n  display-name: \"Policía Nacional\"\n  salary-base: 1500.0\n  ranks:\n    - id: agente\n      level: 1\n      permission: rpxpolice.pda\n    - id: inspector\n      level: 3\n      permission: rpxpolice.admin\n\nmedico:\n  display-name: \"Médico EMS\"\n  salary-base: 1800.0\n  ranks:\n    - id: enfermero\n      level: 1\n      permission: rpxhealth.ems" } },
          { kind: "callout", callout: { type: "warn", text: "Los IDs de empleo deben coincidir exactamente con los usados en RPX ClockIn (/clockin <jobId>) y en los datáfonos de RPX Economy." } },
        ],
      },
      {
        id: "necesidades", title: "Necesidades Vitales",
        blocks: [
          { kind: "p", text: "RPX Core rastrea hambre, sed y fatiga del personaje activo de forma independiente a la barra de hambre vanilla." },
          { kind: "ul", items: [
            "Hambre: se reduce con el tiempo y actividad física. Se recupera comiendo (integración xFoods).",
            "Sed: requiere beber agua u otros líquidos. Afecta al rendimiento del personaje.",
            "Fatiga: acumulada por no dormir. A nivel máximo puede causar efectos de debilidad.",
          ]},
          { kind: "callout", callout: { type: "info", text: "Los valores persisten en la base de datos junto al ciudadano y sobreviven a reinicios del servidor." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/personaje",                  perm: "rpx.citizen.use",  desc: "Abre el menú de selección y creación de personajes." },
            { cmd: "/rpx setlimit <jugador> <n>", perm: "rpx.admin",        desc: "Establece el límite de personajes (1-21) vía LuckPerms." },
            { cmd: "/rpx reload",                 perm: "rpx.admin",        desc: "Recarga la configuración sin reiniciar el servidor." },
            { cmd: "/dni",                        perm: "rpx.dni.use",      desc: "Obtiene el DNI físico del personaje activo." },
            { cmd: "/dni show <id>",              perm: "rpx.admin",        desc: "Muestra el perfil de un ciudadano por su ID numérico." },
            { cmd: "/me <mensaje>",               perm: "rpx.chat.me",      desc: "Holograma de acción propia (emote IC)." },
            { cmd: "/do <mensaje>",               perm: "rpx.chat.do",      desc: "Holograma de descripción de entorno/acción." },
            { cmd: "/ooc <mensaje>",              perm: "rpx.chat.ooc",     desc: "Mensaje fuera de personaje." },
            { cmd: "/entorno <mensaje>",          perm: "rpx.chat.entorno", desc: "Descripción de entorno a jugadores cercanos." },
            { cmd: "/work",                       perm: "rpx.work.use",     desc: "Abre el panel de trabajo del personaje activo." },
          ]},
        ],
      },
      {
        id: "permisos", title: "Permisos LuckPerms",
        blocks: [
          { kind: "code", block: { lang: "text", code: "# Acceso general\nrpx.admin               → Comandos administrativos\nrpx.citizen.use         → Crear/seleccionar personajes\nrpx.chat.me / .do / .ooc / .entorno → Comandos de chat IC\nrpx.dni.use             → Obtener DNI físico\nrpx.work.use            → Panel de trabajo\n\n# Slots de personajes (asignar solo UNO por jugador)\nrpx.chars.limit.1       → 1 personaje\nrpx.chars.limit.2       → 2 personajes\nrpx.chars.limit.5       → 5 personajes" } },
          { kind: "callout", callout: { type: "tip", text: "Asigna rpx.chars.limit.1 al grupo 'default' para que todos los jugadores puedan crear al menos un personaje." } },
        ],
      },
    ],
    prev: { label: "xCrops Addon", href: "/docs/xcrops" },
    next: { label: "RPX Economy",  href: "/docs/rpx-economy" },
  },

  "rpx-economy": {
    title: "RPX Economy",
    category: "RPX Suite",
    version: "2.0",
    badge: "Core",
    desc: "Sistema financiero avanzado para roleplay: banca multicuenta, efectivo físico, datáfonos TPV, suscripciones recurrentes y registro bancario completo.",
    toc: [
      { id: "intro",         label: "Introducción" },
      { id: "cuentas",       label: "Cuentas Bancarias" },
      { id: "efectivo",      label: "Efectivo Físico" },
      { id: "datafonos",     label: "Datáfonos" },
      { id: "suscripciones", label: "Suscripciones" },
      { id: "commands",      label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Economy reemplaza el sistema de economía vanilla e introduce banca física y digital. Los ciudadanos gestionan múltiples cuentas, pueden retirar dinero como billetes y monedas físicas, y los negocios cobran mediante datáfonos colocables." },
          { kind: "callout", callout: { type: "warn", text: "RPX Economy requiere RPX Core instalado. No es compatible con Vault directamente; usa la API de RPX Economy para interacciones desde otros plugins." } },
          { kind: "ul", items: [
            "Cuentas personales y de empresa por ciudadano",
            "Efectivo físico retiable del banco como ítems (billetes y monedas)",
            "Datáfonos (TPV) colocables en locales comerciales",
            "Suscripciones y cobros recurrentes automáticos",
            "Log bancario completo con timestamps y tipos de transacción",
          ]},
        ],
      },
      {
        id: "cuentas", title: "Cuentas Bancarias",
        blocks: [
          { kind: "p", text: "Cada ciudadano puede tener múltiples cuentas bancarias. Cada cuenta tiene un ID único, nombre visual, saldo y un flag 'isJobAccount' que indica si pertenece a una empresa/empleo." },
          { kind: "ul", items: [
            "Cuenta personal: asociada directamente al ciudadano. Se crea automáticamente al registrarse.",
            "Cuenta de empresa: flag isJobAccount=true. Compartida por todos los miembros de un empleo con acceso.",
            "Cuenta especial: ej. 'inmobiliaria' para recibir pagos de alquiler de RPX RealState.",
          ]},
          { kind: "callout", callout: { type: "tip", text: "Los admins pueden consultar el historial completo de una cuenta desde el panel de /eco bank → seleccionar cuenta → Historial." } },
        ],
      },
      {
        id: "efectivo", title: "Efectivo Físico",
        blocks: [
          { kind: "p", text: "Currency.giveMoney() genera ítems de billetes y monedas en el inventario del jugador. Los jugadores pueden intercambiarlos entre sí o depositarlos en el banco. El sistema calcula automáticamente la combinación óptima de denominaciones." },
          { kind: "code", block: { lang: "yaml", code: "# economy.yml\nbills:\n  - amount: 1000\n    material: PAPER\n    custom-model-data: 2001\n    name: \"<gold>Billete de $1.000\"\n  - amount: 500\n    material: PAPER\n    custom-model-data: 2002\n    name: \"<yellow>Billete de $500\"\ncoins:\n  - amount: 50\n    material: GOLD_NUGGET\n    custom-model-data: 2010\n    name: \"<yellow>Moneda de $50\"" } },
        ],
      },
      {
        id: "datafonos", title: "Datáfonos (TPV)",
        blocks: [
          { kind: "p", text: "Los datáfonos son bloques con NBT 'is_dataphone'=true que los dueños de negocios colocan en su local. Cuando un cliente interactúa, se le cobra un importe directamente de su cuenta bancaria." },
          { kind: "ul", items: [
            "El admin ejecuta /eco givedataphone <accountId> [jobId] para obtener el ítem.",
            "Se coloca el datáfono como bloque. Al interactuar, pide al cliente el importe.",
            "El pago se registra en BankLog con tipo DATAPHONE_PAYMENT.",
          ]},
          { kind: "callout", callout: { type: "warn", text: "El datáfono solo puede cobrar a ciudadanos con cuenta bancaria y saldo suficiente. Sin cuenta, la transacción falla." } },
        ],
      },
      {
        id: "suscripciones", title: "Suscripciones Recurrentes",
        blocks: [
          { kind: "p", text: "Las suscripciones permiten cobros automáticos periódicos. Se usan principalmente para alquileres (RPX RealState) pero pueden configurarse para cualquier servicio recurrente." },
          { kind: "code", block: { lang: "java", code: "// Desde otro módulo (ej. RPX RealState al aceptar alquiler):\nRPXEconomy.getInstance().getSubscriptionManager().subscribe(\n    \"rs_prop_\" + prop.getId(),   // ID único\n    \"Alquiler: \" + prop.getName(), // Nombre visible\n    prop.getPricePerCycle(),       // Importe por ciclo\n    prop.getCycleDays(),           // Cada cuántos días\n    receiverAccountId,             // Cuenta que recibe\n    payerAccountId                 // Cuenta que paga\n);" } },
          { kind: "callout", callout: { type: "info", text: "Si un ciudadano no tiene saldo cuando vence la suscripción, queda marcada como impagada y puede generar una notificación automática." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/eco bank",                                perm: "rpx.eco.use",   desc: "Abre el selector de cuentas bancarias del personaje activo." },
            { cmd: "/eco getMoney <cantidad>",                 perm: "rpx.eco.admin", desc: "Genera efectivo físico (billetes/monedas) por el importe indicado." },
            { cmd: "/eco givedataphone [cuentaId] [jobId]",   perm: "rpx.eco.admin", desc: "Entrega un datáfono vinculado a una cuenta y/o empleo." },
            { cmd: "/pay <jugador> <cantidad>",                perm: "rpx.eco.use",   desc: "Paga una cantidad en efectivo a otro jugador directamente." },
          ]},
        ],
      },
    ],
    prev: { label: "RPX Core",    href: "/docs/rpx-core" },
    next: { label: "RPX ClockIn", href: "/docs/rpx-clockin" },
  },

  "rpx-health": {
    title: "RPX Health",
    category: "RPX Suite",
    version: "2.0",
    badge: "RPX",
    desc: "Sistema médico realista con enfermedades progresivas por niveles, pruebas diagnósticas, medicamentos y herramientas EMS para personal sanitario.",
    toc: [
      { id: "intro",      label: "Introducción" },
      { id: "diseases",   label: "Sistema de Enfermedades" },
      { id: "medicines",  label: "Medicamentos" },
      { id: "tests",      label: "Pruebas Médicas" },
      { id: "ems",        label: "Comandos EMS" },
      { id: "admin",      label: "Comandos Admin" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Health añade una capa de realismo médico al servidor de roleplay. Los ciudadanos tienen un estado de salud persistente con enfermedades que evolucionan por niveles, resistencia general que sube o baja según el estilo de vida, y un sistema de contagio por proximidad. El personal de EMS dispone de herramientas específicas para diagnosticar y prescribir tratamientos." },
          { kind: "ul", items: [
            "Enfermedades con múltiples niveles de progresión y efectos de poción por nivel",
            "Contagio por proximidad configurable (radio en bloques + probabilidad por tick)",
            "Resistencia general (0.0–1.0) que afecta la probabilidad de infectarse",
            "Inmunidad temporal (escudo) y permanente (vacuna) por enfermedad",
            "Supresión de síntomas sin curar la enfermedad subyacente",
            "Integración con xFoods: comida caducada puede transmitir enfermedades",
          ]},
          { kind: "callout", callout: { type: "warn", text: "RPX Health requiere RPX Core instalado. Lee diseases.yml y tests.yml antes de iniciar el servidor — si están vacíos, ningún ciudadano podrá enfermar." } },
        ],
      },
      {
        id: "diseases", title: "Sistema de Enfermedades",
        blocks: [
          { kind: "p", text: "Cada enfermedad se define en diseases.yml con un ID único, niveles de progresión y parámetros de contagio. El DiseaseTickTask avanza la enfermedad cada tick sumando y restando puntos." },
          { kind: "code", block: { lang: "yaml", code: "# diseases.yml\ngripe:\n  display-name: \"Gripe Estacional\"\n  base-effectiveness: 0.05\n  regeneration-points: 2\n  contagion-radius: 4.0\n  contagion-chance: 0.08\n  detection-tests:\n    analisis_sangre: 0.75\n    termometro: 0.95\n  levels:\n    1:\n      threshold: 20\n      effects:\n        - SLOWNESS:1:0\n    2:\n      threshold: 60\n      effects:\n        - SLOWNESS:2:0\n        - WEAKNESS:1:0\n    3:\n      threshold: 120\n      effects:\n        - SLOWNESS:3:0\n        - WEAKNESS:2:0\n        - HUNGER:1:0" } },
          { kind: "callout", callout: { type: "info", text: "ContagionTask comprueba cada N ticks si jugadores dentro del contagionRadius están sin inmunidad. Si la probabilidad se cumple y su resistencia es baja, quedan infectados." } },
        ],
      },
      {
        id: "medicines", title: "Medicamentos",
        blocks: [
          { kind: "p", text: "Los medicamentos son ítems físicos con NBT que el personal sanitario entrega a los pacientes. Al consumirlos se aplica el efecto correspondiente. Se generan con /salud admin givemedicine." },
          { kind: "commands", list: [
            { cmd: "/salud admin givemedicine <j> cure <enf> <puntos>", perm: "rpxhealth.admin", desc: "Da un medicamento que cura N puntos de progresión de la enfermedad indicada." },
            { cmd: "/salud admin givemedicine <j> suppressor <seg>",    perm: "rpxhealth.admin", desc: "Da un supresor que anula síntomas durante N segundos sin curar la enfermedad." },
            { cmd: "/salud admin givemedicine <j> shield <seg>",        perm: "rpxhealth.admin", desc: "Da un escudo inmunológico que bloquea nuevas infecciones N segundos." },
            { cmd: "/salud admin givemedicine <j> vaccine <enf>",       perm: "rpxhealth.admin", desc: "Da una vacuna que otorga inmunidad permanente contra esa enfermedad." },
          ]},
        ],
      },
      {
        id: "tests", title: "Pruebas Médicas",
        blocks: [
          { kind: "p", text: "Las pruebas médicas son ítems configurados en tests.yml. Cada prueba tiene una probabilidad de detectar cada enfermedad. Sin diagnóstico, la enfermedad aparece como 'Desconocida' en la UI del paciente." },
          { kind: "ul", items: [
            "Sin muestra (isRequiresSample=false) — se usa directamente haciendo Shift+Click sobre el paciente.",
            "Con muestra (isRequiresSample=true) — el paciente toma la muestra y el médico la analiza.",
          ]},
          { kind: "commands", list: [
            { cmd: "/salud admin givetest <jugador> <testId>", perm: "rpxhealth.admin", desc: "Entrega una prueba médica al jugador." },
            { cmd: "/salud admin reload",                      perm: "rpxhealth.admin", desc: "Recarga diseases.yml y tests.yml en caliente." },
          ]},
        ],
      },
      {
        id: "ems", title: "Comandos EMS",
        blocks: [
          { kind: "p", text: "El personal EMS dispone del comando /ems. El diagnóstico incluye una animación de BossBar de 4 segundos que se cancela si el médico se aleja más de 5 bloques del paciente." },
          { kind: "commands", list: [
            { cmd: "/ems diagnosticar <jugador>", perm: "rpxhealth.ems", desc: "Inicia diagnóstico con barra de progreso. Al completarse abre el HealthMenu del paciente." },
            { cmd: "/ems recetar <jugador>",      perm: "rpxhealth.ems", desc: "Abre el MedicalPrescriptionMenu para entregar medicamentos al paciente." },
            { cmd: "/salud",                      perm: "—",             desc: "Abre el HealthMenu del propio ciudadano (resistencia, enfermedades, estados)." },
          ]},
        ],
      },
      {
        id: "admin", title: "Comandos Admin",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/salud admin infect <jugador> <enf>", perm: "rpxhealth.admin", desc: "Infecta al jugador con 10 puntos de progresión inicial." },
            { cmd: "/salud admin clear [jugador]",        perm: "rpxhealth.admin", desc: "Elimina todas las enfermedades y resetea resistencia a 1.0." },
            { cmd: "/salud admin reload",                 perm: "rpxhealth.admin", desc: "Recarga diseases.yml y tests.yml." },
            { cmd: "/salud admin config",                 perm: "rpxhealth.admin", desc: "Abre el hub de configuración visual del sistema." },
          ]},
          { kind: "callout", callout: { type: "danger", text: "/salud admin clear es irreversible — borra el historial médico completo incluyendo vacunas. Úsalo solo para testing o emergencias." } },
        ],
      },
    ],
    prev: { label: "RPX ClockIn", href: "/docs/rpx-clockin" },
    next: { label: "Police RPX",  href: "/docs/rpx-police" },
  },

  "rpx-clockin": {
    title: "RPX ClockIn",
    category: "RPX Suite",
    version: "1.0",
    badge: "Módulo",
    desc: "Sistema de fichaje de asistencia para trabajadores. Registra entradas y salidas, calcula horas trabajadas y genera la base del cómputo salarial por turnos.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "flujo",    label: "Flujo de Fichaje" },
      { id: "salarios", label: "Cómputo Salarial" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX ClockIn añade un sistema de fichaje de asistencia para funcionarios y empleados de empresas privadas. Los trabajadores fichan entrada y salida mediante GUI, y el sistema registra los tiempos para calcular las horas trabajadas." },
          { kind: "callout", callout: { type: "warn", text: "RPX ClockIn requiere RPX Core. El ID de empleo usado en /clockin debe existir en el JobManager de RPX Core." } },
          { kind: "ul", items: [
            "Fichaje de entrada y salida por empleo mediante GUI",
            "Registro de timestamps de entrada/salida en base de datos",
            "Cálculo automático de horas trabajadas por turno",
            "Panel administrativo con logs por empleado y por empleo",
            "Compatible con el sistema salarial de RPX Economy",
          ]},
        ],
      },
      {
        id: "flujo", title: "Flujo de Fichaje",
        blocks: [
          { kind: "ul", items: [
            "1. El trabajador ejecuta /clockin <jobId> → se abre ClockInMainMenu.",
            "2. Pulsa 'Iniciar Turno' → se registra el timestamp de entrada en la BD.",
            "3. Durante el turno puede consultar el tiempo transcurrido desde el menú.",
            "4. Pulsa 'Terminar Turno' → se registra la salida y se calcula la duración.",
            "5. Las horas se acumulan en el registro del ciudadano para el período de pago.",
          ]},
          { kind: "callout", callout: { type: "tip", text: "Si el jugador se desconecta sin fichar la salida, el sistema puede configurarse para cerrar el turno automáticamente al tiempo de desconexión." } },
          { kind: "callout", callout: { type: "info", text: "El ID de empleo debe coincidir con el jobId en jobs.yml de RPX Core. Ejemplo: /clockin policia, /clockin medico." } },
        ],
      },
      {
        id: "salarios", title: "Cómputo Salarial",
        blocks: [
          { kind: "p", text: "Las horas fichadas se acumulan en la BD. Al final del período de pago, el sistema calcula el salario multiplicando las horas trabajadas por la tarifa del empleo." },
          { kind: "code", block: { lang: "yaml", code: "# clockin.yml\npay-period-days: 7\npay-day: SATURDAY\npay-time: \"20:00\"\nauto-close-shift-on-logout: true\nmax-shift-hours: 8  # Máximo de horas que cuenta un turno (anti-AFK)" } },
          { kind: "callout", callout: { type: "warn", text: "El campo salary-base en jobs.yml se interpreta como referencia mensual. RPX ClockIn lo convierte a tarifa por hora para el cómputo real." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/clockin <jobId>",                         perm: "rpx.clockin.use",   desc: "Abre el menú de fichaje para el empleo indicado." },
            { cmd: "/clockin admin logs <jobId>",              perm: "rpx.clockin.admin", desc: "Registros de fichaje del período actual para un empleo." },
            { cmd: "/clockin admin logs <jobId> <ciudadanoId>",perm: "rpx.clockin.admin", desc: "Historial de turnos de un ciudadano específico." },
            { cmd: "/clockin admin close <jugador>",           perm: "rpx.clockin.admin", desc: "Fuerza el cierre del turno activo del jugador." },
            { cmd: "/clockin admin delete <turnoId>",          perm: "rpx.clockin.admin", desc: "Elimina un registro de turno incorrecto de la BD." },
          ]},
        ],
      },
    ],
    prev: { label: "RPX Economy", href: "/docs/rpx-economy" },
    next: { label: "RPX Health",  href: "/docs/rpx-health" },
  },

  "rpx-realstate": {
    title: "RPX RealState",
    category: "RPX Suite",
    version: "1.0",
    badge: "RPX",
    desc: "Sistema inmobiliario completo: alquiler y compra de propiedades con WorldEdit, WorldGuard, hologramas y pagos automáticos vía suscripción bancaria.",
    toc: [
      { id: "intro",     label: "Introducción" },
      { id: "setup",     label: "Crear una Propiedad" },
      { id: "flujo",     label: "Flujo de Alquiler/Compra" },
      { id: "roommates", label: "Convivientes" },
      { id: "commands",  label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX RealState gestiona propiedades inmobiliarias directamente desde Minecraft. Los administradores definen zonas con WorldEdit, el plugin crea la región WorldGuard automáticamente y muestra un holograma flotante con el precio y estado. Los jugadores alquilan o compran a través de agentes inmobiliarios." },
          { kind: "callout", callout: { type: "warn", text: "Requiere WorldEdit y WorldGuard. También se integra con RPXEconomy para pagos automáticos y RPXUtils para SmartDoors." } },
          { kind: "ul", items: [
            "Hologramas TextDisplay flotantes con precio y estado en tiempo real",
            "Modo alquiler con ciclos automáticos vía Suscripciones de RPXEconomy",
            "Modo compra con pago único y propiedad permanente",
            "Propiedades multi-zona (pisos extra, balcones) con addregion",
            "Sistema de convivientes con permisos granulares",
            "App integrada en xPhone para gestión desde el móvil",
          ]},
        ],
      },
      {
        id: "setup", title: "Crear una Propiedad",
        blocks: [
          { kind: "ul", items: [
            "1. Selecciona el interior de la propiedad con //wand (WorldEdit).",
            "2. Ejecuta /rs admin create <id> <edificio> <€/ciclo> <días> <nombre>.",
            "3. Mira la puerta de hierro y ejecuta /rs admin linkdoor <id>.",
            "4. Mueve el holograma si hace falta: /rs admin movehologram <id>.",
            "5. Para pisos extra, selecciona la zona con //wand y usa /rs admin addregion <id>.",
          ]},
          { kind: "code", block: { lang: "bash", code: "# 2. Crea la propiedad (selección WE activa)\n/rs admin create casa_01 edificio_centro 800 30 \"Piso Centro\"\n#                ^ID       ^edificio    ^€    ^días ^nombre\n\n# 3. Vincula la puerta de hierro (mirándola)\n/rs admin linkdoor casa_01\n\n# Precio de compra único opcional\n/rs admin setbuyprice casa_01 15000" } },
          { kind: "callout", callout: { type: "info", text: "Los flags de WorldGuard (sin PVP, sin mobs, construcción permitida para miembros) se aplican automáticamente al crear la propiedad." } },
        ],
      },
      {
        id: "flujo", title: "Flujo de Alquiler/Compra",
        blocks: [
          { kind: "p", text: "Un agente inmobiliario (permiso rpx.realstate.agent) gestiona las transacciones. Abre el menú de agente, selecciona una propiedad y envía una oferta al jugador cliente." },
          { kind: "h3", id: "rent", text: "Alquiler" },
          { kind: "ul", items: [
            "El agente envía la oferta desde RealEstateAgentMenu.",
            "El cliente ejecuta /alquiler accept <propertyId>.",
            "Se crea una Suscripción en RPXEconomy que cobra cada cycleDays días.",
            "El jugador es añadido como miembro de la región WorldGuard.",
            "El holograma cambia a 'Ocupado' con el nombre del inquilino.",
          ]},
          { kind: "h3", id: "buy", text: "Compra" },
          { kind: "ul", items: [
            "El agente envía la oferta de compra.",
            "El cliente ejecuta /alquiler accept <propertyId>.",
            "Se realiza el pago único. La propiedad queda marcada como owned=true.",
          ]},
          { kind: "callout", callout: { type: "tip", text: "El pago va a la cuenta bancaria marcada como 'inmobiliaria' (isJobAccount + nombre 'inmobiliaria'). Asegúrate de tenerla configurada en RPXEconomy." } },
        ],
      },
      {
        id: "roommates", title: "Convivientes",
        blocks: [
          { kind: "p", text: "El inquilino principal puede añadir convivientes desde el menú de gestión. Cada conviviente queda como miembro de la región WorldGuard y pierde el acceso al finalizar el contrato." },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/alquiler",                                        perm: "—",                   desc: "Abre el menú de propiedades disponibles." },
            { cmd: "/rs admin create <id> <edif> <€> <días> <nombre>",perm: "rpx.realstate.admin", desc: "Crea propiedad desde selección WorldEdit activa." },
            { cmd: "/rs admin addregion <id>",                        perm: "rpx.realstate.admin", desc: "Añade zona extra (piso, balcón) a una propiedad existente." },
            { cmd: "/rs admin linkdoor <id>",                         perm: "rpx.realstate.admin", desc: "Vincula la puerta de hierro que miras a la propiedad." },
            { cmd: "/rs admin setbuyprice <id> <precio>",             perm: "rpx.realstate.admin", desc: "Establece precio de compra definitiva." },
            { cmd: "/rs admin movehologram <id>",                     perm: "rpx.realstate.admin", desc: "Mueve el holograma a tu posición." },
            { cmd: "/rs agent",                                        perm: "rpx.realstate.agent", desc: "Menú de agente inmobiliario." },
            { cmd: "/alquiler accept <id>",                           perm: "—",                   desc: "Acepta una oferta de alquiler o compra pendiente." },
            { cmd: "/alquiler reject <id>",                           perm: "—",                   desc: "Rechaza una oferta pendiente." },
          ]},
        ],
      },
    ],
    prev: { label: "RPX Gangs",  href: "/docs/rpx-gangs" },
    next: { label: "RPX Utils",  href: "/docs/rpx-utils" },
  },

  "rpx-utils": {
    title: "RPX Utils",
    category: "RPX Suite",
    version: "1.0",
    badge: "RPX",
    desc: "Utilidades de roleplay: puertas inteligentes con PIN/keycard/ganzúa, navegación GPS con partículas, papeleras y cajas fuertes.",
    toc: [
      { id: "intro",      label: "Introducción" },
      { id: "smartdoors", label: "SmartDoors" },
      { id: "gps",        label: "GPS y Navegación" },
      { id: "trash",      label: "Sistema de Basuras" },
      { id: "safes",      label: "Cajas Fuertes" },
      { id: "commands",   label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Utils añade cuatro sistemas independientes: puertas inteligentes con seguridad por PIN o tarjeta, navegación GPS con partículas, gestión de papeleras urbanas y cajas fuertes con contraseña." },
          { kind: "callout", callout: { type: "info", text: "RPX Utils no depende de RPXCore directamente, pero varios sistemas se integran con RPXRealState (SmartDoors tipo HOUSE) y RPXSimpleJobs (GPS del basurero)." } },
        ],
      },
      {
        id: "smartdoors", title: "SmartDoors",
        blocks: [
          { kind: "p", text: "Las SmartDoors convierten puertas de hierro en puertas inteligentes con distintos mecanismos de acceso. Solo las puertas de hierro son compatibles." },
          { kind: "ul", items: [
            "KEYPAD — acceso por PIN numérico. Al hacer clic, se abre un menú teclado.",
            "HOUSE — tipo asignado por RPXRealState al vincular una propiedad. Se abre con la llave de la casa.",
            "KEYCARD — acceso solo con la tarjeta keycard registrada en la puerta.",
          ]},
          { kind: "h3", id: "lockpick", text: "Ganzúa (Lockpick)" },
          { kind: "p", text: "El ítem ganzúa permite intentar abrir una SmartDoor mediante un minijuego. El ítem y su apariencia son configurables en config.yml." },
          { kind: "h3", id: "keycards", text: "Keycards" },
          { kind: "code", block: { lang: "bash", code: "# 1. Ten en la mano el ítem que actuará como llave\n/sd savekey llave_vip\n\n# 2. Configura la puerta con esa llave (desde AdminUtilsMenu)\n\n# 3. Entrega la llave a quien quieras\n/sd getkey llave_vip" } },
        ],
      },
      {
        id: "gps", title: "GPS y Navegación",
        blocks: [
          { kind: "p", text: "El sistema GPS guía a los jugadores hacia puntos de interés mediante partículas visibles. Los waypoints públicos los crean los admins; los jugadores los consultan y usan." },
          { kind: "h3", id: "gps-emergency", text: "GPS de Emergencia" },
          { kind: "p", text: "Cuando se activa una alerta de emergencia, la ubicación queda guardada. Cualquier jugador puede usar /gps aceptar para fijar su GPS en ese punto automáticamente. Ideal para policía y EMS." },
          { kind: "callout", callout: { type: "tip", text: "RPXSimpleJobs (basurero) usa el NavigationManager internamente para guiar al trabajador hacia papeleras. La app GpsApp en xPhone también usa este sistema." } },
        ],
      },
      {
        id: "trash", title: "Sistema de Basuras",
        blocks: [
          { kind: "p", text: "Gestiona papeleras físicas en la ciudad como furniture de ItemsAdder (rpx:trash_bin). Cada papelera tiene su propio inventario. El trabajo de basurero de RPXSimpleJobs usa este sistema para vaciarlas." },
        ],
      },
      {
        id: "safes", title: "Cajas Fuertes",
        blocks: [
          { kind: "p", text: "Las cajas fuertes son furniture de ItemsAdder que, al interactuar, solicitan un PIN numérico. Si el PIN es correcto, se abre un inventario de 27 slots persistente en BD." },
          { kind: "callout", callout: { type: "info", text: "Las cajas fuertes se registran al colocar el furniture. El ownerCitizenId se asigna automáticamente al ciudadano que la coloca." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "h3", id: "cmds-doors", text: "SmartDoors (/sd)" },
          { kind: "commands", list: [
            { cmd: "/sd",                  perm: "rpx.utils.doors.admin", desc: "Panel de administración de puertas." },
            { cmd: "/sd create <nombre>",  perm: "rpx.utils.doors.admin", desc: "Registra la puerta de hierro que miras como SmartDoor." },
            { cmd: "/sd setpin <pin>",     perm: "rpx.utils.doors.admin", desc: "Cambia el PIN de la puerta que miras." },
            { cmd: "/sd savekey <id>",     perm: "rpx.utils.doors.admin", desc: "Guarda el ítem en mano como llave con ese ID." },
            { cmd: "/sd getkey <id>",      perm: "rpx.utils.doors.admin", desc: "Recibe la llave guardada con ese ID." },
            { cmd: "/sd givepick [j]",     perm: "rpx.utils.admin",       desc: "Entrega una ganzúa al jugador." },
          ]},
          { kind: "h3", id: "cmds-gps", text: "GPS (/gps)" },
          { kind: "commands", list: [
            { cmd: "/gps <ubicación>",  perm: "—",               desc: "Inicia navegación hacia el punto de interés." },
            { cmd: "/gps stop",         perm: "—",               desc: "Detiene la navegación activa." },
            { cmd: "/gps aceptar",      perm: "—",               desc: "Fija el GPS en la última alerta de emergencia." },
            { cmd: "/gps set <nombre>", perm: "rpx.utils.admin", desc: "Crea un punto de interés en tu posición." },
          ]},
        ],
      },
    ],
    prev: { label: "RPX RealState", href: "/docs/rpx-realstate" },
    next: { label: "RPX Vehicles",  href: "/docs/rpx-vehicles" },
  },

  "rpx-vehicles": {
    title: "RPX Vehicles",
    category: "RPX Suite",
    version: "1.0",
    badge: "RPX",
    desc: "Sistema de vehículos con matrícula única por ciudadano, combustible, daño y persistencia de posición en base de datos.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "model",    label: "Modelo de Vehículo" },
      { id: "workflow", label: "Flujo de Uso" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Vehicles gestiona vehículos con propiedad por ciudadano, matrícula autogenerada, combustible consumible, salud del vehículo y guardado automático de la última posición. Los vehículos se definen en VehicleRegistry y se spawnan como entidades en el mundo." },
          { kind: "callout", callout: { type: "warn", text: "Para spawnear vehículos en producción los jugadores deben adquirirlos mediante RPXCrafting (fábrica de vehículos). El comando /vehicle spawn es solo para administradores." } },
          { kind: "ul", items: [
            "Matrícula única autogenerada por propietario (ciudadano IC)",
            "Combustible consumible — el vehículo se detiene al vaciarse",
            "Salud del vehículo — daño por colisiones o disparos",
            "lastLocation persistente — los vehículos conservan su posición al reiniciar",
            "Modo stored: el vehículo puede estar en el 'garage' hasta que el jugador lo saque",
          ]},
        ],
      },
      {
        id: "model", title: "Modelo de Vehículo",
        blocks: [
          { kind: "code", block: { lang: "java", code: "// Vehicle.java\nint    id              // ID interno BD\nint    ownerCitizenId  // ciudadano propietario (IC)\nString plate           // matrícula autogenerada\nString modelId         // ref a VehicleRegistry (ej: \"sedan_rojo\")\ndouble fuel            // 0.0 - 100.0\ndouble health          // 0.0 - 100.0\nString lastLocation    // \"world,x,y,z,yaw,pitch\"\nboolean stored         // true = en garage, false = en el mundo" } },
          { kind: "p", text: "VehicleRegistry almacena la configuración de cada tipo (velocidad máxima, capacidad de combustible, pasajeros, modelo 3D en ItemsAdder)." },
        ],
      },
      {
        id: "workflow", title: "Flujo de Uso",
        blocks: [
          { kind: "ul", items: [
            "El jugador fabrica o adquiere un vehículo → se crea una entrada en BD con stored=true.",
            "Al usar el vehículo, VehicleManager spawnea la entidad en el mundo y stored pasa a false.",
            "El VehicleManager consume combustible periódicamente. Al llegar a 0 el vehículo se para.",
            "Al guardar el vehículo, lastLocation se actualiza y stored vuelve a true.",
            "La matrícula se vincula al ciudadano — puede consultarse desde la PDA policial.",
          ]},
          { kind: "callout", callout: { type: "tip", text: "Para repostar, los jugadores deben interactuar con una gasolinera (furniture configurado) que use VehicleManager.addFuel()." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/vehicle spawn <modelId>", perm: "rpxvehicles.admin", desc: "Spawnea un vehículo del modelo indicado en tu posición. Devuelve la matrícula generada." },
          ]},
          { kind: "callout", callout: { type: "info", text: "Los jugadores normales interactúan con sus vehículos a través de inventario y menús contextuales, no por comandos directos." } },
        ],
      },
    ],
    prev: { label: "RPX Utils",      href: "/docs/rpx-utils" },
    next: { label: "RPX SimpleJobs", href: "/docs/rpx-simplejobs" },
  },

  "rpx-simplejobs": {
    title: "RPX SimpleJobs",
    category: "RPX Suite",
    version: "1.0",
    badge: "RPX",
    desc: "Sistema de trabajos freelance activables por el jugador: únete a un turno, realiza tareas guiadas por GPS y recibe pago automático.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "basurero", label: "Trabajo: Basurero" },
      { id: "api",      label: "API — Crear Trabajos" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX SimpleJobs ofrece trabajos freelance (sin contrato permanente) que cualquier jugador puede iniciar y abandonar libremente. Cada trabajo asigna tareas, guía al jugador con GPS de RPXUtils y le paga al completarlas." },
          { kind: "ul", items: [
            "Trabajos instanciados por jugador — varios pueden trabajar a la vez sin interferencia",
            "GPS de RPXUtils integrado para guía visual mediante partículas",
            "Pago inmediato vía Currency.giveMoney() al completar cada tarea",
            "El trabajo de basurero incluido es un ejemplo funcional completo",
            "API pública para añadir trabajos personalizados desde otros plugins",
          ]},
        ],
      },
      {
        id: "basurero", title: "Trabajo: Basurero",
        blocks: [
          { kind: "p", text: "El Recolector de Residuos es el trabajo incluido por defecto. El jugador recibe una ruta hacia papeleras registradas (furniture rpx:trash_bin de RPXUtils) y cobra por vaciarlas." },
          { kind: "ul", items: [
            "/jobs join basurero → se asigna la papelera más cercana y se activa el GPS.",
            "Al acercarse a menos de 2.5 bloques → se comprueba el inventario de la papelera.",
            "Papelera vacía → cobras $2 (bonus de desinfección).",
            "Papelera con basura → los objetos pasan a tu inventario + cobras $5 + $1.50 por ítem.",
            "Tras 3 segundos se asigna la siguiente papelera automáticamente.",
            "/jobs leave → fin del turno, GPS desactivado.",
          ]},
          { kind: "callout", callout: { type: "info", text: "Para que el basurero funcione necesitas papeleras registradas como furniture rpx:trash_bin en RPXCore y al menos un punto de basura configurado en RPXUtils (/basura add)." } },
        ],
      },
      {
        id: "api", title: "API — Crear Trabajos",
        blocks: [
          { kind: "p", text: "Crea trabajos personalizados implementando la interfaz SimpleJob y registrándolos en JobRegistry desde tu plugin:" },
          { kind: "code", block: { lang: "java", code: "public class MecanicoJob implements SimpleJob {\n    @Override public String getId()          { return \"mecanico\"; }\n    @Override public String getDisplayName() { return \"§eMecánico\"; }\n    @Override public ItemStack getIcon()     { return new ItemStack(Material.IRON_PICKAXE); }\n\n    @Override public void onStart(Player player) { /* asignar primera tarea */ }\n    @Override public void onStop(Player player)  { /* limpiar estado */ }\n    @Override public void onTick(Player player)  { /* comprobar proximidad, completar tarea… */ }\n}\n\n// En onEnable():\nRPXSimpleJobs.getInstance().getJobRegistry().registerJob(new MecanicoJob());" } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/jobs",              perm: "—", desc: "Lista los trabajos freelance disponibles." },
            { cmd: "/jobs join <jobId>", perm: "—", desc: "Inicia turno en el trabajo indicado." },
            { cmd: "/jobs leave",        perm: "—", desc: "Abandona el trabajo actual." },
          ]},
        ],
      },
    ],
    prev: { label: "RPX Vehicles", href: "/docs/rpx-vehicles" },
    next: { label: "RPXCourt",     href: "/docs/rpxcourt" },
  },

  rpxcourt: {
    title: "RPXCourt",
    category: "RPX Suite",
    version: "1.0",
    desc: "Sistema de contratos y juzgado. Empresas y ciudadanos formalizan acuerdos vinculantes con libro firmado como prueba.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "contracts",label: "Contratos" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPXCourt implementa un sistema judicial y de contratos para servidores de roleplay. Los contratos se firman mediante libros (BookMeta) y quedan registrados en base de datos como prueba jurídica en el servidor." },
          { kind: "callout", callout: { type: "info", text: "El patrón 'empresa = Job / jefe' de RPX Core se usa para determinar quién puede firmar contratos en nombre de una empresa." } },
        ],
      },
      {
        id: "contracts", title: "Contratos",
        blocks: [
          { kind: "p", text: "Un contrato es un documento firmado por dos partes (ciudadano o empresa). Al firmarse, se genera un libro físico sellado y se registra el hash del contrato en la BD para evitar modificaciones." },
          { kind: "ul", items: [
            "Contratos de trabajo (empleador ↔ empleado)",
            "Contratos de alquiler (propietario ↔ inquilino)",
            "Acuerdos comerciales entre empresas",
            "Sistema de demandas al juzgado con resolución de admin",
          ]},
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/court contract new",      perm: "rpxcourt.use",   desc: "Inicia la creación de un nuevo contrato." },
            { cmd: "/court contract list",     perm: "rpxcourt.use",   desc: "Lista tus contratos activos." },
            { cmd: "/court demand <jugador>",  perm: "rpxcourt.use",   desc: "Presenta una demanda contra un ciudadano." },
            { cmd: "/court admin resolve <id>",perm: "rpxcourt.admin", desc: "Resuelve una demanda pendiente." },
          ]},
        ],
      },
    ],
    prev: { label: "RPX SimpleJobs", href: "/docs/rpx-simplejobs" },
    next: { label: "RPXCrafting",    href: "/docs/rpxcrafting" },
  },

  rpxcrafting: {
    title: "RPXCrafting",
    category: "RPX Suite",
    version: "1.0",
    desc: "Sistema de crafting avanzado con componentes rpx:, stages, fábrica de vehículos (RPXVehicles) y herramientas especiales.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "stages",   label: "Stages de Crafting" },
      { id: "vehicles", label: "RPXVehicles" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPXCrafting (antes RPXItems) reemplaza el sistema de crafting de Minecraft con recetas avanzadas de múltiples etapas. Los ítems se identifican con el namespace rpx: para distinguirlos de los ítems vanilla." },
          { kind: "callout", callout: { type: "info", text: "Anteriormente conocido como RPXItems. Renombrado a RPXCrafting en v1.0 para reflejar mejor su función." } },
        ],
      },
      {
        id: "stages", title: "Stages de Crafting",
        blocks: [
          { kind: "p", text: "Las recetas avanzadas pueden tener múltiples etapas (stages). Por ejemplo: fundir metal → moldear → templar → ensamblar. Cada stage puede requerir una máquina distinta o herramientas específicas." },
          { kind: "code", block: { lang: "yaml", code: `# Ejemplo de receta con stages
rpx:motor_v8:
  stages:
    - id: fundir
      machine: fundicion
      inputs: [rpx:lingote_acero x4]
      output: rpx:bloque_motor
    - id: ensamblar
      machine: taller_mecanico
      inputs: [rpx:bloque_motor, rpx:pistones x8]
      output: rpx:motor_v8` } },
        ],
      },
      {
        id: "vehicles", title: "RPXVehicles",
        blocks: [
          { kind: "p", text: "RPXCrafting incluye el submódulo RPXVehicles. Los vehículos (coches, motos, etc.) se fabrican como cualquier ítem avanzado y luego se despliegan en el mundo como entidades." },
          { kind: "ul", items: [
            "Vehículos basados en ArmorStand / Display entities",
            "Velocidades y consumo de combustible configurables",
            "Registro de matrículas vinculado a RPX Core (ciudadano propietario)",
            "Soporte para asientos de pasajeros",
          ]},
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/rpxcraft give <id>",     perm: "rpxcrafting.admin", desc: "Entrega un ítem rpx: al jugador." },
            { cmd: "/rpxcraft list",          perm: "rpxcrafting.admin", desc: "Lista todos los ítems registrados." },
            { cmd: "/rpxcraft reload",        perm: "rpxcrafting.admin", desc: "Recarga las recetas del disco." },
            { cmd: "/vehicle spawn <id>",     perm: "rpxvehicles.admin", desc: "Spawnea un vehículo en tu posición." },
            { cmd: "/vehicle despawn <uuid>", perm: "rpxvehicles.admin", desc: "Elimina un vehículo del mundo." },
          ]},
        ],
      },
    ],
    prev: { label: "RPXCourt",    href: "/docs/rpxcourt" },
    next: { label: "Biblio RPX",  href: "/docs/rpx-biblio" },
  },

  "rpx-police": {
    title: "Police RPX",
    category: "RPX Suite",
    version: "2.0",
    badge: "RPX",
    desc: "Herramientas completas para las fuerzas de seguridad: PDA policial con base de datos de ciudadanos, sistema de multas, arrestos, celdas y equipamiento táctico.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "pda",      label: "PDA Policial" },
      { id: "jail",     label: "Celdas y Arrestos" },
      { id: "economy",  label: "Integración Económica" },
      { id: "commands", label: "Comandos" },
      { id: "setup",    label: "Configuración Inicial" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "Police RPX proporciona al cuerpo policial herramientas de roleplay realistas: una PDA con acceso a la base de datos de ciudadanos, sistema de multas que se cobran directamente de cuentas bancarias, procesado de arrestos con tiempo de condena y acciones sobre el nivel de calor de bandas (RPXGangs)." },
          { kind: "ul", items: [
            "PDA policial con 6 módulos: base de datos, expedientes, notas, multas, casos activos y procesado de arrestos",
            "Sistema de celdas registradas con punto de liberación configurable",
            "Equipamiento táctico: esposas y porra",
            "Multas deducidas automáticamente de la cuenta bancaria del ciudadano (RPXEconomy)",
            "Integración con RPXGangs: acciones policiales incrementan el calor de bandas",
          ]},
          { kind: "callout", callout: { type: "warn", text: "Police RPX requiere RPX Core y RPX Economy. Sin RPXGangs el GangHeatListener no tendrá efecto pero el plugin funcionará igualmente." } },
        ],
      },
      {
        id: "pda", title: "PDA Policial",
        blocks: [
          { kind: "p", text: "La PDA es el centro de operaciones del policía. Se abre con /pda o haciendo clic derecho con el ítem. Contiene seis módulos accesibles desde el menú principal." },
          { kind: "ul", items: [
            "Base de Datos (CitizenDatabaseMenu) — búsqueda de cualquier ciudadano por nombre IC o ID",
            "Expediente (CitizenExpedientMenu) — historial completo: multas, arrestos previos, notas",
            "Notas Internas (CitizenNotesMenu) — anotaciones confidenciales visibles solo para policías",
            "Crear Multa (FineCreationMenu) — imponer sanción económica cobrada de la cuenta bancaria",
            "Casos y Multas (CasesAndFinesMenu) — gestión de multas activas y casos abiertos",
            "Procesar Arresto (JailProcessingMenu) — seleccionar celda y duración de condena",
          ]},
          { kind: "callout", callout: { type: "tip", text: "Usa /pda directamente (sin tener el ítem) si tienes el permiso rpxpolice.pda — abre el menú sin necesidad del ítem físico." } },
        ],
      },
      {
        id: "jail", title: "Celdas y Arrestos",
        blocks: [
          { kind: "p", text: "Las celdas se registran con su ubicación en la BD. Al procesar un arresto desde la PDA, el ciudadano es teletransportado a la celda. Al cumplir la condena, es teletransportado al punto de liberación." },
          { kind: "ul", items: [
            "Sitúate en el interior de la celda y ejecuta /policia celda crear <id>.",
            "Repite para cada celda de la comisaría.",
            "Define el punto de liberación con /policia celda setliberacion desde la zona de salida.",
          ]},
          { kind: "callout", callout: { type: "info", text: "El punto de liberación es global (uno para todo el servidor). Si tienes varias comisarías, ponlo en una zona pública neutral." } },
        ],
      },
      {
        id: "economy", title: "Integración Económica",
        blocks: [
          { kind: "p", text: "Cuando se crea una multa desde la PDA, el importe se deduce directamente de la cuenta bancaria principal del ciudadano. La transacción queda registrada en el BankLog de RPXEconomy." },
          { kind: "h3", id: "heat", text: "Calor de bandas (Gang Heat)" },
          { kind: "p", text: "El GangHeatListener detecta acciones policiales contra miembros de bandas (arrestos, multas) e incrementa el heatLevel de su banda en RPXGangs." },
          { kind: "callout", callout: { type: "warn", text: "Si el ciudadano no tiene fondos suficientes, la multa queda pendiente como deuda. Asegúrate de que RPXEconomy gestione las deudas correctamente." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/pda",                         perm: "rpxpolice.pda",   desc: "Abre la PDA policial sin necesitar el ítem." },
            { cmd: "/policia pda",                 perm: "rpxpolice.pda",   desc: "Entrega el ítem PDA al inventario." },
            { cmd: "/policia equipo",              perm: "rpxpolice.pda",   desc: "Entrega esposas y porra." },
            { cmd: "/policia celda crear <id>",    perm: "rpxpolice.admin", desc: "Registra una celda en tu posición actual." },
            { cmd: "/policia celda setliberacion", perm: "rpxpolice.admin", desc: "Establece el punto de teletransporte al salir de prisión." },
            { cmd: "/policia admin",               perm: "rpxpolice.admin", desc: "Acceso al panel de administración policial." },
          ]},
        ],
      },
      {
        id: "setup", title: "Configuración Inicial",
        blocks: [
          { kind: "ul", items: [
            "Instala RPXCore, RPXEconomy y Police RPX en /plugins/.",
            "Construye la comisaría y las celdas en el mapa.",
            "En cada celda ejecuta /policia celda crear <id>.",
            "En la puerta de salida ejecuta /policia celda setliberacion.",
            "Asigna rpxpolice.pda (policías) y rpxpolice.admin (jefes/admins) con LuckPerms.",
          ]},
          { kind: "callout", callout: { type: "tip", text: "Crea un rank de LuckPerms 'policia' con rpxpolice.pda y un rank 'capitan' con rpxpolice.admin para gestionar permisos fácilmente." } },
        ],
      },
    ],
    prev: { label: "RPX Health",  href: "/docs/rpx-health" },
    next: { label: "RPX Gangs",   href: "/docs/rpx-gangs" },
  },

  "rpx-gangs": {
    title: "RPX Gangs",
    category: "RPX Suite",
    version: "1.0",
    badge: "RPX",
    desc: "Sistema completo de bandas criminales con territorios WorldGuard, rangos jerárquicos, generadores de recursos, reputación y calor policial.",
    toc: [
      { id: "intro",       label: "Introducción" },
      { id: "gangs",       label: "Crear y Gestionar Bandas" },
      { id: "members",     label: "Miembros y Rangos" },
      { id: "territories", label: "Territorios y Generadores" },
      { id: "heat",        label: "Reputación y Calor" },
      { id: "commands",    label: "Comandos Completos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPXGangs implementa un ecosistema criminal completo. Las bandas pueden controlar territorios definidos como regiones WorldGuard, instalar generadores de recursos en esos territorios y gestionar su reputación. Las acciones policiales incrementan el calor, que penaliza a la banda mientras sea alto." },
          { kind: "ul", items: [
            "Bandas con nombre, tag, color, líder y jerarquía de rangos personalizable",
            "Territorios basados en regiones WorldGuard — disputas y control del mapa",
            "Generadores de recursos (nivel 1-3) que depositan items en cofres vinculados",
            "Sistema de reputación que crece con territorios controlados y operaciones exitosas",
            "Calor policial (0-100) que aumenta con arrestos/multas de miembros de la banda",
            "Tablet Ilegal para acceso a menús clandestinos",
            "Integración con Police RPX vía GangHeatListener",
          ]},
          { kind: "callout", callout: { type: "warn", text: "RPXGangs requiere RPX Core y WorldGuard. Los territorios son regiones WG existentes — créalas con WorldGuard antes de asignarlas a una banda." } },
        ],
      },
      {
        id: "gangs", title: "Crear y Gestionar Bandas",
        blocks: [
          { kind: "p", text: "Solo los administradores pueden crear o disolver bandas. El líder inicial debe estar conectado con un personaje activo." },
          { kind: "commands", list: [
            { cmd: "/banda admin crear <nombre> <tag> <color> <líder>", perm: "rpxgangs.admin", desc: "Crea una nueva banda. Color en formato & (ej. &8). El líder debe estar online con personaje activo." },
            { cmd: "/banda admin disolver <nombre>",                    perm: "rpxgangs.admin", desc: "Disuelve la banda, expulsa a todos los miembros y libera sus territorios." },
          ]},
          { kind: "callout", callout: { type: "info", text: "El color del tag se aplica en el chat y la interfaz. Usa códigos §/& seguidos de un carácter hexadecimal (0-9, a-f)." } },
        ],
      },
      {
        id: "members", title: "Miembros y Rangos",
        blocks: [
          { kind: "p", text: "Cada banda tiene un sistema de rangos personalizable con niveles numéricos. El nivel 1 es el líder." },
          { kind: "commands", list: [
            { cmd: "/banda admin rango crear <banda> <nivel> <nombre>", perm: "rpxgangs.admin", desc: "Crea o actualiza un rango. Nivel 1 = líder." },
            { cmd: "/banda admin rango eliminar <banda> <nivel>",       perm: "rpxgangs.admin", desc: "Elimina un rango. No se puede eliminar el nivel 1." },
            { cmd: "/banda rango <jugador> <nivel>",                    perm: "rpxgangs.use",   desc: "El líder cambia el rango de un miembro de su banda." },
            { cmd: "/banda invitar <jugador>",                          perm: "rpxgangs.use",   desc: "Invita a un jugador (requiere rango ≤ 2)." },
            { cmd: "/banda aceptar / rechazar",                         perm: "rpxgangs.use",   desc: "Acepta o rechaza una invitación pendiente." },
            { cmd: "/banda salir",                                      perm: "rpxgangs.use",   desc: "Abandona la banda. El líder no puede salir si quedan miembros." },
            { cmd: "/banda expulsar <jugador>",                         perm: "rpxgangs.use",   desc: "Expulsa a un miembro de rango inferior al tuyo." },
          ]},
        ],
      },
      {
        id: "territories", title: "Territorios y Generadores",
        blocks: [
          { kind: "p", text: "Los territorios son regiones WorldGuard asignadas a una banda. Cada territorio puede tener un generador que deposita recursos periódicamente en un cofre vinculado." },
          { kind: "ul", items: [
            "Crea la región en WorldGuard con //sel + /region define <nombre>.",
            "Asígnala a una banda: /banda admin territorio asignar <región> <banda>.",
            "Coloca un cofre y míralo: /banda admin generador cofre <región>.",
            "Establece el tipo: /banda admin generador tipo <región> <TIPO>.",
            "Establece el nivel (1-3): /banda admin generador nivel <región> <nivel>.",
          ]},
          { kind: "callout", callout: { type: "tip", text: "El generador deposita items en el cofre automáticamente. Si el cofre está lleno los recursos se pierden hasta que se vacíe." } },
        ],
      },
      {
        id: "heat", title: "Reputación y Calor Policial",
        blocks: [
          { kind: "p", text: "El calor (heatLevel, 0-100) crece cuando policías arrestan o multan a miembros de la banda. La reputación crece con los territorios controlados." },
          { kind: "ul", items: [
            "0-30: Calor bajo — la banda opera con normalidad.",
            "31-60: Calor medio — mayor presencia policial en sus territorios.",
            "61-90: Calor alto — generadores producen menos (penalización).",
            "91-100: Calor crítico — los territorios pueden perder protección temporal.",
          ]},
          { kind: "callout", callout: { type: "info", text: "El calor decae gradualmente si no hay nuevas acciones policiales. La integración con Police RPX es automática vía GangHeatListener." } },
        ],
      },
      {
        id: "commands", title: "Comandos Completos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/banda menu",                                        perm: "rpxgangs.use",   desc: "Menú principal de la banda." },
            { cmd: "/banda info [banda]",                                perm: "rpxgangs.use",   desc: "Info pública: miembros, territorios, reputación y barra de calor." },
            { cmd: "/banda admin crear <n> <tag> <color> <líder>",      perm: "rpxgangs.admin", desc: "Crear una nueva banda." },
            { cmd: "/banda admin disolver <banda>",                      perm: "rpxgangs.admin", desc: "Disolver banda y liberar territorios." },
            { cmd: "/banda admin tablet <jugador>",                      perm: "rpxgangs.admin", desc: "Entregar Tablet Ilegal." },
            { cmd: "/banda admin rango crear <banda> <nivel> <nombre>",  perm: "rpxgangs.admin", desc: "Crear/actualizar rango." },
            { cmd: "/banda admin territorio asignar <región> <banda>",  perm: "rpxgangs.admin", desc: "Asignar región WG a banda." },
            { cmd: "/banda admin territorio liberar <región>",           perm: "rpxgangs.admin", desc: "Liberar un territorio." },
            { cmd: "/banda admin generador tipo <región> <tipo>",        perm: "rpxgangs.admin", desc: "Tipo de generador." },
            { cmd: "/banda admin generador nivel <región> <1-3>",        perm: "rpxgangs.admin", desc: "Nivel del generador (1-3)." },
            { cmd: "/banda admin generador cofre <región>",              perm: "rpxgangs.admin", desc: "Vincular cofre mirándolo." },
          ]},
        ],
      },
    ],
    prev: { label: "Police RPX",    href: "/docs/rpx-police" },
    next: { label: "RPX RealState", href: "/docs/rpx-realstate" },
  },

  "rpx-biblio": {
    title: "Biblio RPX",
    category: "RPX Suite",
    version: "1.0",
    badge: "RPX",
    desc: "Biblioteca nacional del servidor: sube libros escritos in-game, organízalos por etiquetas y permite que cualquier ciudadano los lea.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "subir",    label: "Subir un Libro" },
      { id: "leer",     label: "Explorar y Leer" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "Biblio RPX permite crear una biblioteca persistente dentro del servidor. Los jugadores con permiso de admin o bibliotecario pueden subir libros escritos in-game; el resto de ciudadanos puede explorar el catálogo y leer cualquier obra guardada." },
          { kind: "ul", items: [
            "Serialización universal de libros escritos via YamlConfiguration + Base64",
            "Metadatos: título, autor, etiquetas y fecha de subida",
            "Exploración por categorías/etiquetas desde un menú GUI",
            "Lectura directa: el libro se abre como libro nativo de Minecraft sin necesitar el ítem",
            "Persistencia en SQLite vía BookRepository",
          ]},
          { kind: "callout", callout: { type: "info", text: "Solo los libros de tipo WRITTEN_BOOK (ya firmados) son válidos. Los libros en blanco o sin firmar no son aceptados." } },
        ],
      },
      {
        id: "subir", title: "Subir un Libro",
        blocks: [
          { kind: "p", text: "Ten el libro firmado en la mano principal y ejecuta /biblio subir. El sistema serializa automáticamente todas las páginas, el título y el autor." },
          { kind: "code", block: { lang: "bash", code: "# Libro en mano, ejecuta:\n/biblio subir\n\n# Con etiquetas separadas por coma:\n/biblio subir historia,leyenda,ciudad" } },
          { kind: "callout", callout: { type: "tip", text: "Usa etiquetas consistentes: 'historia', 'leyenda', 'noticia', 'ficcion', 'derecho'… Ayudan a los lectores a filtrar por temática." } },
        ],
      },
      {
        id: "leer", title: "Explorar y Leer",
        blocks: [
          { kind: "p", text: "Cualquier jugador puede abrir la biblioteca con /biblio. El menú muestra el catálogo organizado por etiquetas. Al seleccionar un libro, el plugin deserializa el contenido Base64 y te lo abre directamente sin necesidad del ítem físico." },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/biblio",              perm: "—",                desc: "Abre el menú de la biblioteca." },
            { cmd: "/biblio subir [tags]", perm: "rpx.biblio.admin", desc: "Sube el libro escrito que tienes en mano. Tags separados por coma." },
          ]},
        ],
      },
    ],
    prev: { label: "RPXCrafting", href: "/docs/rpxcrafting" },
    next: { label: "RPX Names",   href: "/docs/rpx-names" },
  },

  "rpx-names": {
    title: "RPX Names",
    category: "RPX Suite",
    version: "1.0",
    badge: "RPX",
    desc: "Identidad IC: nombres In Character sobre la cabeza mediante hologramas, sistema de amigos para ver apodos personalizados en lugar de IDs.",
    toc: [
      { id: "intro",     label: "Introducción" },
      { id: "holograms", label: "Hologramas de Nombre" },
      { id: "friends",   label: "Sistema de Amigos" },
      { id: "commands",  label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Names gestiona la identidad visual IC de los jugadores. En lugar del nombre de Minecraft sobre la cabeza, los ciudadanos ven el nombre de rol (rolName del Citizen) mediante hologramas TextDisplay. Además, permite guardar apodos personales para cada ciudadano conocido." },
          { kind: "ul", items: [
            "Holograma IC sobre la cabeza con el rolName del personaje activo",
            "Se actualiza automáticamente al cambiar de personaje activo",
            "Sistema de amigos: cada jugador puede asignar un apodo propio a cada ciudadano",
            "Los apodos son privados: solo los ve el jugador que los define",
            "Integración total con CitizenManager de RPXCore",
          ]},
          { kind: "callout", callout: { type: "info", text: "El nick de Minecraft queda oculto durante el juego — solo se muestra el nombre IC. Esto refuerza la inmersión en servidores de roleplay." } },
        ],
      },
      {
        id: "holograms", title: "Hologramas de Nombre",
        blocks: [
          { kind: "p", text: "HologramManager crea y actualiza una entidad TextDisplay por cada jugador online con personaje activo. El texto muestra el Citizen.getRolName() con el formato configurado." },
          { kind: "ul", items: [
            "Se crean al conectarse o al seleccionar personaje activo.",
            "Se actualizan al cambiar de personaje o si el admin edita el rolName.",
            "Se eliminan al desconectarse o al deseleccionar personaje.",
          ]},
          { kind: "callout", callout: { type: "tip", text: "Si un holograma queda desincronizado, el admin puede usar /rpx reload (RPXCore) para forzar una actualización de todos los personajes activos." } },
        ],
      },
      {
        id: "friends", title: "Sistema de Amigos",
        blocks: [
          { kind: "p", text: "El sistema de amigos permite personalizar cómo ves a otros ciudadanos. En lugar del ID numérico, puedes asociarle un apodo que solo tú verás." },
          { kind: "code", block: { lang: "bash", code: "# El ciudadano 482 se llama IC \"Carlos Mendez\"\n/addfriend 482 Carlos\n# Ahora verás \"Carlos\" donde aparecería el ID 482\n\n# Actualizar el apodo\n/editfriend 482 \"Carlos Mendez\"" } },
          { kind: "callout", callout: { type: "info", text: "FriendManager guarda la relación viewer_citizenId → target_citizenId → nickname. Los apodos son completamente privados." } },
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/addfriend <id> <apodo>",        perm: "—", desc: "Asocia un apodo personal al ciudadano con ese ID." },
            { cmd: "/editfriend <id> <nuevo_apodo>", perm: "—", desc: "Actualiza el apodo de un ciudadano ya guardado." },
          ]},
        ],
      },
    ],
    prev: { label: "Biblio RPX", href: "/docs/rpx-biblio" },
  },
};

/* ─── page ───────────────────────────────────────────────────── */
export default function DocPage({ params }: { params: Promise<{ plugin: string }> }) {
  const { plugin } = use(params);
  const doc = docs[plugin] ?? docs["xlib"];

  const badgeColors: Record<string, string> = {
    Core:       "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
    Standalone: "bg-blue-400/15   text-blue-400   border-blue-400/30",
    Addon:      "bg-green-400/15  text-green-400  border-green-400/30",
    Ecosystem:  "bg-teal-400/15   text-teal-400   border-teal-400/30",
    Beta:       "bg-orange-400/15 text-orange-400 border-orange-400/30",
    default:    "bg-gray-400/15   text-gray-400   border-gray-400/30",
  };
  const badgeCls = badgeColors[doc.badge ?? "default"] ?? badgeColors.default;

  return (
    <div className="flex animate-wiki max-w-5xl mx-auto w-full">
      {/* ── Article ── */}
      <article className="flex-1 min-w-0 px-8 py-10 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-300 transition-colors">Docs</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-400">{doc.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-200 font-medium">{doc.title}</span>
        </nav>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {doc.badge && (
              <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border", badgeCls)}>
                {doc.badge}
              </span>
            )}
            <span className="text-[10px] font-mono text-gray-600 border border-[#374151] px-2 py-0.5 rounded">
              v{doc.version}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">{doc.title}</h1>
          <p className="text-gray-400 text-[15px] leading-relaxed border-l-2 border-yellow-400/40 pl-4">{doc.desc}</p>
        </div>

        <hr className="border-[#1f2937] mb-8" />

        {/* Sections */}
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-10 scroll-mt-20">
            <h2 className="text-xl font-bold text-gray-100 mb-5 pb-2.5 border-b border-[#1f2937]">
              {section.title}
            </h2>
            {section.blocks.map((block, i) => renderBlock(block, i))}
          </section>
        ))}

        {/* Prev / Next */}
        {(doc.prev || doc.next) && (
          <>
            <hr className="border-[#1f2937] mt-10 mb-6" />
            <div className="flex justify-between gap-4">
              {doc.prev ? (
                <Link href={doc.prev.href} className="group flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span><span className="block text-[11px] text-gray-600 uppercase tracking-wider">Anterior</span>{doc.prev.label}</span>
                </Link>
              ) : <span />}
              {doc.next && (
                <Link href={doc.next.href} className="group flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors text-right">
                  <span><span className="block text-[11px] text-gray-600 uppercase tracking-wider">Siguiente</span>{doc.next.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </>
        )}
      </article>

      {/* ── TOC ── */}
      {doc.toc.length > 0 && (
        <aside className="hidden xl:block w-52 shrink-0 py-10 pr-6">
          <div className="sticky top-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">En esta página</p>
            <nav className="space-y-0.5">
              {doc.toc.map(entry => (
                <a
                  key={entry.id}
                  href={`#${entry.id}`}
                  className="block text-sm text-gray-500 hover:text-gray-200 pl-3 py-1 border-l-2 border-transparent hover:border-gray-600 transition-all"
                >
                  {entry.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
