// Parseo "best-effort" de MiniMessage (el subconjunto que genera HologramTextEditor: color,
// bold/italic/underlined/strikethrough, gradient, rainbow) + códigos legacy (&c, &l...) para
// poder previsualizar en el navegador cómo se verá un texto sin depender de ningún parser real
// de Adventure (no hay ninguno en npm para esto). El plugin sigue usando
// org.aifusp.dev.xLib.utils.TextUtils (MiniMessage real) para el render de verdad en el juego —
// esto es solo una aproximación visual en la web.

export interface TextSegment {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
}

const NAMED_COLORS: Record<string, string> = {
  black: '#000000', dark_blue: '#0000AA', dark_green: '#00AA00', dark_aqua: '#00AAAA',
  dark_red: '#AA0000', dark_purple: '#AA00AA', gold: '#FFAA00', gray: '#AAAAAA', grey: '#AAAAAA',
  dark_gray: '#555555', dark_grey: '#555555', blue: '#5555FF', green: '#55FF55', aqua: '#55FFFF',
  red: '#FF5555', light_purple: '#FF55FF', pink: '#FF55FF', yellow: '#FFFF55', white: '#FFFFFF',
};

const LEGACY_CODES: Record<string, string> = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', a: '#55FF55', b: '#55FFFF',
  c: '#FF5555', d: '#FF55FF', e: '#FFFF55', f: '#FFFFFF',
};

function resolveColor(token: string): string | null {
  const t = token.trim().toLowerCase().replace(/^color:/, '');
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  if (/^[0-9a-f]{6}$/.test(t)) return `#${t}`;
  if (NAMED_COLORS[t]) return NAMED_COLORS[t];
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

/** Quita cualquier tag/código reconocido, para el contenido de un gradient/rainbow (sin colores anidados en el preview). */
function stripTags(s: string): string {
  return s.replace(/<\/?[a-z0-9_#:]+>/gi, '').replace(/&[0-9a-fklmnor]/gi, '');
}

type Style = { bold: boolean; italic: boolean; underlined: boolean; strikethrough: boolean };

function gradientSegments(text: string, stops: string[], style: Style): TextSegment[] {
  const chars = Array.from(text);
  if (stops.length < 2 || chars.length === 0) {
    return [{ text, color: stops[0], ...style }];
  }
  const segCount = stops.length - 1;
  return chars.map((ch, idx) => {
    const t = chars.length <= 1 ? 0 : (idx / (chars.length - 1)) * segCount;
    const segIdx = Math.min(Math.floor(t), segCount - 1);
    const localT = t - segIdx;
    const c1 = hexToRgb(stops[segIdx]);
    const c2 = hexToRgb(stops[segIdx + 1]);
    const mixed = c1.map((v, k) => v + (c2[k] - v) * localT);
    return { text: ch, color: rgbToHex(mixed), ...style };
  });
}

function rainbowSegments(text: string, style: Style): TextSegment[] {
  const chars = Array.from(text);
  return chars.map((ch, idx) => ({
    text: ch,
    color: hslToHex((idx / Math.max(1, chars.length)) * 360, 1, 0.65),
    ...style,
  }));
}

export function parseFormattedText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let i = 0;
  let color: string | undefined;
  let bold = false, italic = false, underlined = false, strikethrough = false;

  const push = (t: string) => {
    if (!t) return;
    segments.push({ text: t, color, bold, italic, underlined, strikethrough });
  };

  while (i < text.length) {
    // Códigos legacy: &c, &l... (aplican "hacia delante", sin cierre propio; &r resetea).
    if (text[i] === '&' && i + 1 < text.length) {
      const code = text[i + 1].toLowerCase();
      if (LEGACY_CODES[code]) { color = LEGACY_CODES[code]; i += 2; continue; }
      if (code === 'l') { bold = true; i += 2; continue; }
      if (code === 'o') { italic = true; i += 2; continue; }
      if (code === 'n') { underlined = true; i += 2; continue; }
      if (code === 'm') { strikethrough = true; i += 2; continue; }
      if (code === 'r') { color = undefined; bold = italic = underlined = strikethrough = false; i += 2; continue; }
    }

    if (text[i] === '<') {
      const close = text.indexOf('>', i);
      if (close !== -1) {
        const tag = text.slice(i + 1, close).trim();
        const tagLower = tag.toLowerCase();
        const style: Style = { bold, italic, underlined, strikethrough };

        if (tagLower === 'rainbow' || tagLower.startsWith('gradient')) {
          const endTag = tagLower === 'rainbow' ? '</rainbow>' : '</gradient>';
          const endIdx = text.toLowerCase().indexOf(endTag, close + 1);
          const innerRaw = endIdx !== -1 ? text.slice(close + 1, endIdx) : text.slice(close + 1);
          const inner = stripTags(innerRaw);

          if (tagLower === 'rainbow') {
            segments.push(...rainbowSegments(inner, style));
          } else {
            const stops = tag.split(':').slice(1).map(resolveColor).filter((c): c is string => !!c);
            segments.push(...gradientSegments(inner, stops, style));
          }
          i = endIdx !== -1 ? endIdx + endTag.length : text.length;
          continue;
        }

        if (tagLower === 'bold') { bold = true; i = close + 1; continue; }
        if (tagLower === '/bold') { bold = false; i = close + 1; continue; }
        if (tagLower === 'italic') { italic = true; i = close + 1; continue; }
        if (tagLower === '/italic') { italic = false; i = close + 1; continue; }
        if (tagLower === 'underlined') { underlined = true; i = close + 1; continue; }
        if (tagLower === '/underlined') { underlined = false; i = close + 1; continue; }
        if (tagLower === 'strikethrough') { strikethrough = true; i = close + 1; continue; }
        if (tagLower === '/strikethrough') { strikethrough = false; i = close + 1; continue; }
        if (tagLower === 'reset' || tagLower === '/color') { color = undefined; i = close + 1; continue; }

        const resolved = resolveColor(tag);
        if (resolved) { color = resolved; i = close + 1; continue; }
        // Tag no reconocida: se ignora (no se muestra ni se rompe el parseo) para no ensuciar el preview.
        i = close + 1;
        continue;
      }
    }

    let j = i;
    while (j < text.length && text[j] !== '&' && text[j] !== '<') j++;
    if (j === i) j = i + 1;
    push(text.slice(i, j));
    i = j;
  }

  return segments;
}
