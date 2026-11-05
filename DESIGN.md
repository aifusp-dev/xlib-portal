---
name: xLib Portal — Wiki pública
description: Esquema de cableado — la wiki del ecosistema aifusp.dev leída como un plano técnico, no como una plantilla de docs genérica
colors:
  blueprint-ground: "#0a1f33"
  blueprint-panel: "#0d2742"
  blueprint-field: "#11304f"
  blueprint-hover: "#163a5e"
  hairline: "#1e4166"
  hairline-strong: "#2b5681"
  ink-primary: "#eaf2fb"
  ink-secondary: "#a9c2d9"
  ink-tertiary: "#7d96ae"
  signal-cyan: "#5ec8ff"
  signal-cyan-ink: "#061626"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontWeight: 500
rounded:
  sm: "4px"
  md: "6px"
spacing:
  grid: "28px"
components:
  button-primary:
    backgroundColor: "{colors.signal-cyan}"
    textColor: "{colors.signal-cyan-ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.blueprint-panel}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
---

# Design System: xLib Portal — Wiki pública

## Overview

**Creative North Star: "Esquema de cableado"**

La wiki no se lee como un panel de SaaS ni como una plantilla de docs (GitBook, Docusaurus): se lee como el plano técnico del ecosistema de plugins de aifusp.dev. El fondo es un azul-plano profundo, no un gris o un negro genérico; el texto y los bordes son trazos finos cian, nunca sombras blandas; y la relación real entre plugins (todo depende de xLib) se dibuja, no se explica en prosa — una traza ortogonal conecta la "Librería Core" con cada categoría que cuelga de ella en la página de inicio.

Este sistema cubre solo la wiki pública (home, sidebar, páginas de doc de plugin). El Studio (`src/app/studio/*`) tiene su propio sistema de tokens, ya documentado como comentario en `globals.css`, y queda fuera de este documento — es un mundo visual deliberadamente separado, no una inconsistencia.

**Key Characteristics:**
- Fondo azul-plano profundo con una retícula de fondo muy sutil (papel cuadriculado de ingeniería)
- Un único acento: cian señal, reservado para enlaces, estado activo y la traza de dependencia
- Trazos de 1px en vez de sombras — la profundidad se lee por contraste de superficie, no por elevación
- Esquinas casi rectas (6px máximo) — precisión de mesa de dibujo, no redondeo de app de consumo
- Nodos/marcadores cuadrados, nunca círculos — vocabulario de circuito, no de diagrama de flujo

## Colors

Paleta Restrained-hacia-Committed: el fondo satura todo el lienzo (azul-plano, no gris neutro), y un único acento cian hace todo el trabajo funcional — enlaces, foco de teclado, selección de texto, estado activo de navegación y la traza de dependencia.

### Primary
- **Cian señal** (`#5ec8ff`): único acento interactivo — CTA primario, enlaces, icono/indicador de nav activo, la traza de cableado. Texto sobre este color usa **Tinta de plano** (`#061626`), nunca negro puro.

### Neutral
- **Plano base** (`#0a1f33`): fondo de la app (equivalente al `--color-surface-0` del Studio, pero reemplazado dentro de `.wiki-shell`).
- **Panel** (`#0d2742`): sidebar, código, cabeceras de tabla.
- **Campo** (`#11304f`): filas/hover de nav activo.
- **Hover elevado** (`#163a5e`): hover de tarjetas de categoría.
- **Trazo** (`#1e4166`) / **Trazo fuerte** (`#2b5681`): todos los bordes y divisores — nunca sombra.
- **Tinta primaria** (`#eaf2fb`): texto principal, 14.8:1 sobre el fondo.
- **Tinta secundaria** (`#a9c2d9`): texto de apoyo/descripciones, 9.1:1 sobre el fondo — muy por encima del mínimo AA (4.5:1) a propósito, porque la auditoría de accesibilidad previa encontró el `gray-500` original en 3.0–4.0:1.
- **Tinta terciaria** (`#7d96ae`): eyebrows/labels en mayúsculas, 5.4:1.

### Named Rules
**La regla de la traza única.** El cian solo aparece donde hay una acción o una relación de dependencia real que mostrar. Un bloque de color cian decorativo sin función es una violación de esta regla.

**La regla de los códigos de sección.** Los colores de categoría (ámbar=Core, azul=Standalone, verde=xFoods, morado=RPX — reutilizando los tokens `--color-sec-*` ya existentes en el proyecto) se usan solo en un punto de 6-9px, nunca como fondo de tarjeta completo.

## Typography

**Body Font:** Inter (con fallback a system-ui) — se mantiene del sistema anterior, es una sans de taller perfectamente adecuada para un modo Operate; no se introduce ninguna fuente display nueva.
**Label/Mono Font:** pila monoespaciada del sistema (sin importar una fuente mono con personalidad) — se usa solo para IDs, comandos, versiones y coordenadas, nunca como "disfraz" decorativo de lo técnico.

**Character:** Sobria y funcional. La personalidad del sistema vive en el color, los trazos y la traza de dependencia — no en la tipografía, que se mantiene como una herramienta de lectura, no de marca.

### Hierarchy
- **Display** (extrabold, 2.25rem/36px, leading-tight): título H1 de la home.
- **Title** (bold, 1.875rem/30px): H1 de página de doc.
- **Headline** (bold, 1.25rem/20px): H2 de sección.
- **Body** (regular, 15–16px, leading-7): párrafos de contenido, medida máxima 65–75ch.
- **Label** (bold, 11px, uppercase, tracking-widest, mono para IDs): eyebrows de categoría, headers de tabla.

## Layout

Columna central `max-w-4xl`/`max-w-5xl` según página, con el sidebar fijo de 256px a la izquierda (sin cambios de comportamiento respecto al sistema anterior). Ritmo de espaciado: `space-y-10` entre grupos de categoría, más espacio encima de un heading que debajo. Retícula de fondo de 28px solo decorativa, nunca estructural (el contenido no se alinea a ella).

## Elevation & Depth

Sistema plano por contrato: cero `box-shadow` en toda la superficie de la wiki. La profundidad se lee por el salto de valor entre `blueprint-ground` → `blueprint-panel` → `blueprint-field` → `blueprint-hover`, y por trazos de 1px, nunca por sombra difusa.

### Named Rules
**La regla de la sombra cero.** Ninguna tarjeta, botón o panel de la wiki usa `box-shadow`. Si algo necesita destacar, sube de superficie o se le añade un trazo — nunca una sombra.

## Shapes

Esquinas casi rectas: `rounded-md` (6px) es el máximo en toda la wiki — tarjetas, botones, inputs, badges de código. Nada usa `rounded-xl`/`rounded-full` salvo elementos deliberadamente circulares ajenos a este sistema (ninguno en esta superficie). Los marcadores de nodo de la traza de dependencia son cuadrados de 9×9px, nunca círculos.

## Components

### Buttons
- **Shape:** `rounded-md` (6px).
- **Primary:** fondo `signal-cyan`, texto `signal-cyan-ink`, `hover:brightness-110`.
- **Secondary:** fondo `blueprint-panel`, borde `hairline-strong`, texto `ink-primary`, `hover:bg-blueprint-field`.

### Cards / Containers
- **Corner Style:** `rounded-md` (6px).
- **Background:** `blueprint-panel`, sube a `blueprint-field` en hover.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** `hairline` en reposo, `hairline-strong` en hover — nunca un borde lateral coloreado decorativo.

### Navigation (sidebar)
- Fondo `blueprint-panel`, trazo divisorio `hairline` entre logo/búsqueda/nav/footer.
- Item inactivo: `ink-secondary`, hover `ink-primary` + fondo `blueprint-panel`.
- Item activo: borde izquierdo de 2px `signal-cyan` (indicador de estado funcional, no decoración), fondo `blueprint-field`, icono en cian.

### Traza de dependencia (componente de firma)
Línea vertical `hairline-strong` de 1px que recorre la lista de categorías de la home, con un ramal horizontal ortogonal (nunca curvo) hacia cada grupo. El nodo de "Librería Core" (xLib, la dependencia real de todo lo demás) se marca en cian; el resto de nodos usan su color de sección a bajo punto de contacto. Este es el único elemento verdaderamente distintivo del sistema — todo lo demás es vocabulario de plano técnico aplicado con disciplina, no inventado por página.

## Do's and Don'ts

### Do:
- **Do** usar `rounded-md` (6px) como techo de radio en toda la wiki.
- **Do** reservar el cian para acción/estado/relación real — nunca decoración.
- **Do** usar trazos de 1px para toda separación visual.
- **Do** mantener Inter + mono de sistema; no introducir fuentes display nuevas en un surface Operate.

### Don't:
- **Don't** añadir `box-shadow` a ningún componente de la wiki.
- **Don't** usar un borde izquierdo/derecho coloreado de más de 1px como acento decorativo en tarjetas o callouts (es el patrón genérico de docs-SaaS que este sistema existe para rechazar).
- **Don't** tocar los tokens compartidos de `:root` en `globals.css` para cambiar el look de la wiki — todo override vive dentro de `.wiki-shell`, porque el Studio depende de los valores originales.
- **Don't** usar emoji como sustituto de un icono real (la librería del proyecto es `lucide-react`).
