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
    desc: "Infraestructura base del servidor de roleplay: ciudadanos, persistencia y sistema de trabajos jerárquico.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "features", label: "Características" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Core es el núcleo del ecosistema de roleplay. Gestiona ciudadanos, persistencia de datos y el sistema de empleos. Todos los módulos RPX dependen de este plugin." },
        ],
      },
      {
        id: "features", title: "Características",
        blocks: [
          { kind: "ul", items: [
            "Sistema de ciudadanos vinculados a UUID",
            "Trabajos y rangos con salarios y permisos configurables",
            "API centralizada para todos los módulos RPX",
            "Base de datos compartida gestionada por xLib",
          ]},
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/rpx citizen <jugador>",        perm: "rpx.admin", desc: "Ver información de un ciudadano." },
            { cmd: "/job set <jugador> <trabajo>",  perm: "rpx.admin", desc: "Asignar un empleo a un jugador." },
          ]},
        ],
      },
    ],
    prev: { label: "xCrops",     href: "/docs/xcrops" },
    next: { label: "RPX Economy", href: "/docs/rpx-economy" },
  },

  "rpx-economy": {
    title: "RPX Economy",
    category: "RPX Suite",
    version: "2.0",
    desc: "Sistema financiero avanzado: banca multicuenta, efectivo físico, datáfonos y suscripciones recurrentes.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "features", label: "Características" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Economy introduce el concepto de banca física y digital. Los ciudadanos gestionan múltiples cuentas, retiran efectivo físico y los negocios pueden cobrar directamente con datáfonos." },
        ],
      },
      {
        id: "features", title: "Características",
        blocks: [
          { kind: "ul", items: [
            "Banca multicuenta (ahorro, empresa, etc.) con interfaz GUI",
            "Efectivo físico: billetes y monedas retirables del banco",
            "Datáfonos: bloques para cobrar directamente a la cuenta de un cliente",
            "Suscripciones y cobros automáticos recurrentes (alquileres, servicios)",
          ]},
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/eco bank",                perm: "rpx.eco.use",   desc: "Abre el selector de cuentas bancarias." },
            { cmd: "/eco getmoney <cantidad>", perm: "rpx.eco.admin", desc: "Genera dinero físico en billetes/monedas." },
            { cmd: "/eco givedataphone",       perm: "rpx.eco.admin", desc: "Entrega un datáfono vinculado a una cuenta." },
          ]},
        ],
      },
    ],
  },

  "rpx-health": {
    title: "RPX Health",
    category: "RPX Suite",
    version: "2.0",
    desc: "Sistema médico realista: constantes vitales persistentes, enfermedades, diagnósticos y herramientas EMS.",
    toc: [
      { id: "intro",    label: "Introducción" },
      { id: "features", label: "Características" },
      { id: "commands", label: "Comandos" },
    ],
    sections: [
      {
        id: "intro", title: "Introducción",
        blocks: [
          { kind: "p", text: "RPX Health añade una capa de realismo médico con constantes vitales (sangre, pulso, temperatura) y un sistema de enfermedades que evoluciona si no se trata. Integra con xFoods para enfermedades por comida en mal estado." },
        ],
      },
      {
        id: "features", title: "Características",
        blocks: [
          { kind: "ul", items: [
            "Constantes vitales: sangre, pulso y temperatura persistentes",
            "Vectores de infección desde comida en mal estado (xFoods)",
            "EMS Toolbox: BossBar de diagnóstico y menú de prescripción",
            "Resistencia general mejorada por buena alimentación y cuidados",
          ]},
        ],
      },
      {
        id: "commands", title: "Comandos",
        blocks: [
          { kind: "commands", list: [
            { cmd: "/ems diag <jugador>",    perm: "rpxhealth.ems",   desc: "Diagnóstico médico detallado." },
            { cmd: "/ems recetar <jugador>", perm: "rpxhealth.ems",   desc: "Menú de prescripción de medicamentos." },
            { cmd: "/salud admin infect",    perm: "rpxhealth.admin", desc: "Fuerza la infección de un ciudadano." },
          ]},
        ],
      },
    ],
  },

  "rpx-clockin": {
    title: "RPX ClockIn",
    category: "RPX Suite",
    version: "1.0",
    desc: "Gestión de asistencia y turnos para trabajadores del servidor de roleplay.",
    toc: [{ id: "intro", label: "Introducción" }, { id: "commands", label: "Comandos" }],
    sections: [
      { id: "intro", title: "Introducción", blocks: [
        { kind: "p", text: "Permite a los trabajadores fichar entrada y salida mediante carteles o bloques interactivos. Las horas trabajadas se registran para calcular salarios." },
      ]},
      { id: "commands", title: "Comandos", blocks: [
        { kind: "commands", list: [{ cmd: "/fichar", perm: "rpx.clockin.use", desc: "Fichar entrada o salida." }]},
      ]},
    ],
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
  },

  "rpx-police": {
    title: "Police RPX",
    category: "RPX Suite",
    version: "1.0",
    desc: "Herramientas para fuerzas de seguridad: celdas, PDA policial y equipamiento táctico.",
    toc: [{ id: "intro", label: "Introducción" }, { id: "commands", label: "Comandos" }],
    sections: [
      { id: "intro", title: "Introducción", blocks: [
        { kind: "ul", items: [
          "Sistema de celdas con tiempos de condena automáticos",
          "PDA policial: multas, búsqueda de ciudadanos y registro de arrestos",
          "Equipamiento táctico: esposas, porra y táser funcionales",
        ]},
      ]},
      { id: "commands", title: "Comandos", blocks: [
        { kind: "commands", list: [
          { cmd: "/police pda",               perm: "rpxpolice.pda",   desc: "Recibir la PDA policial." },
          { cmd: "/police celda crear <id>",  perm: "rpxpolice.admin", desc: "Definir una celda de prisión." },
        ]},
      ]},
    ],
  },

  "rpx-biblio": {
    title: "Biblio RPX",
    category: "RPX Suite",
    version: "1.0",
    desc: "Biblioteca nacional para jugadores: publicación y lectura de libros escritos in-game.",
    toc: [{ id: "intro", label: "Introducción" }],
    sections: [
      { id: "intro", title: "Introducción", blocks: [
        { kind: "p", text: "Permite crear una biblioteca nacional donde los jugadores pueden publicar libros escritos y otros ciudadanos pueden leerlos o comprarlos. Los libros se serializan en Base64 para su preservación en BD." },
        { kind: "ul", items: [
          "Serialización universal de libros escritos (Base64/BookMeta)",
          "Interfaz GUI para explorar categorías y autores",
          "Sistema de compra de libros entre ciudadanos",
        ]},
      ]},
    ],
  },

  "rpx-names": {
    title: "RPX Names",
    category: "RPX Suite",
    version: "1.0",
    desc: "Identidad IC: nombres In Character sobre la cabeza, DNI y pasaporte como ítems físicos.",
    toc: [{ id: "intro", label: "Introducción" }],
    sections: [
      { id: "intro", title: "Introducción", blocks: [
        { kind: "p", text: "Gestiona los nombres IC (In Character) de los jugadores, ocultando el nick de Minecraft y mostrando el nombre real configurado mediante Team Tags." },
        { kind: "ul", items: [
          "Nombres IC visibles sobre la cabeza (Team Tags)",
          "DNI y Pasaporte como ítems físicos con datos del ciudadano",
          "Generación de foto de perfil mediante mapa personalizado",
        ]},
      ]},
    ],
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
