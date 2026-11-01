/**
 * Color determinista por plugin para /roadmap (punto de color + barra de progreso), siguiendo
 * el mismo principio que `plugin: text(...)` en el schema: texto libre, no un enum — un plugin
 * nuevo del ecosistema RPX/xLib no requiere tocar este archivo, solo cae en la paleta por hash.
 * Paleta extendida a partir de los `--color-sec-*` ya definidos en globals.css.
 */
const PALETTE = [
  '#f5b93b', // accent de marca
  '#c084fc',
  '#4ade80',
  '#fb923c',
  '#a3e635',
  '#38bdf8',
  '#f87171',
  '#f472b6',
  '#60a5fa',
  '#2dd4bf',
] as const;

export function colorForPlugin(plugin: string): string {
  let hash = 0;
  for (let i = 0; i < plugin.length; i++) {
    hash = (hash * 31 + plugin.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
