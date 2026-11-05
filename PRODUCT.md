# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hoy: solo aifusp (dueño único del ecosistema de plugins de Minecraft). Consulta la wiki mientras desarrolla o da soporte, y usa el Studio ("bridge") para editar en caliente los archivos de contenido de los plugins (ItemsAdder, crafting, drops, etc.) conectado al servidor real.

Hoja de ruta confirmada: xLib Portal se convertirá en un portal multi-desarrollador. Otros creadores de plugins del ecosistema podrán leer las wikis, subir sus propias configuraciones/plugins, y habrá staff administrando y moderando esas publicaciones.

## Product Purpose

Wiki técnica oficial de todos los plugins del ecosistema aifusp.dev (xLib, xPhone, xAlbum, Minedachi, xFoods, suite RPX): comandos, permisos, configuración y API para desarrolladores. Ya tiene elementos embrionarios de portal de archivos compartidos (subida/publicación de contenido), que crecerán con el tiempo.

## Positioning

No es una wiki genérica de plugin de Minecraft: documenta un ecosistema propio completo (una librería compartida + más de 15 plugins interdependientes) con una herramienta de edición en vivo ("Studio"/bridge) que conecta la web directamente con el servidor de producción, algo que una wiki estática tipo GitBook no ofrece.

## Operating Context

- Wiki pública: navegación por sidebar con categorías (Librería Core, Plugins Standalone, xFoods Ecosystem, RPX Suite), páginas de doc individuales por plugin con bloques de comando, tablas y bloques de código.
- Studio (fuera de alcance de este rediseño): panel autenticado con editores especializados (crafting, hologramas, drops, sonidos IA, recetas de máquinas...) que escriben directamente en el servidor en producción vía bridge. El propio usuario describe su UI actual como "muy mejorable" — candidato a una fase de rediseño propia y separada.

## Capabilities and Constraints

- Next.js 16 (Turbopack) + Tailwind v4 con sistema de tokens ya definido en `globals.css` (`--color-surface-*`, `--color-ink-*`, `--color-line*`, `--color-accent`), pensado originalmente para el Studio pero reutilizable en toda la app.
- Sin modo claro: el producto es dark-only hoy.
- Sin imágenes/activos de marca más allá del emoji original (ya sustituido por un icono real durante el pulido previo).

## Brand Commitments

Ninguna restricción vinculante declarada por el usuario ("carta blanca"): paleta, tipografía, estructura de navegación y cualquier otro elemento visual pueden cambiar por completo en este rediseño.

## Product Principles

1. Entender y encontrar lo que se busca rápido es la prioridad número uno — es documentación técnica de uso frecuente, no una landing de marketing.
2. Mantener personalidad/estética propia sin sacrificar velocidad de escaneo: no es sitio genérico de docs.
3. El diseño debe aguantar crecer de "un dev, consulta propia" a "portal multi-dev con publicaciones y moderación" sin romperse conceptualmente (jerarquía de categorías, roles, estados de publicación).
4. El Studio/bridge es la pieza más valiosa del producto hoy, pero queda fuera de esta pasada de rediseño por su criticidad operativa (edita producción en vivo).

## Accessibility & Inclusion

Pasada de accesibilidad ya aplicada 2026-11-05 (contraste AA en texto secundario, landmarks `<header>`/`<footer>`, foco de teclado visible con color de marca, touch targets ≥24px). El rediseño debe mantener estos mínimos, no solo el aspecto visual.
