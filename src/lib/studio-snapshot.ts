import { EcosystemState } from './studio';

/**
 * projectState solo vivía en memoria de React: navegar a /discover y volver (o cualquier otra
 * navegación de página completa) lo perdía sin avisar, incluido lo que se acababa de traer con
 * `/xlib upload`. Este snapshot en sessionStorage (no localStorage: es de "esta pestaña, esta
 * sesión", no algo que deba sobrevivir para siempre) permite recuperarlo al volver.
 */
const KEY = 'xlib_studio_snapshot_v1';

const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const base64ToArrayBuffer = (b64: string): ArrayBuffer => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

export const saveSnapshot = (state: EcosystemState) => {
  try {
    const serializable = {
      ...state,
      rawFiles: state.rawFiles.map((f) => ({
        ...f,
        content: f.content instanceof ArrayBuffer
          ? { __b64: arrayBufferToBase64(f.content) }
          : f.content,
      })),
    };
    sessionStorage.setItem(KEY, JSON.stringify(serializable));
  } catch (err) {
    // Proyecto demasiado grande para sessionStorage (~5-10MB según navegador), u otro fallo de
    // cuota: se pierde la recuperación automática, pero no debe romper la edición en curso.
    console.warn('[Studio] No se pudo guardar el snapshot local:', err);
  }
};

export const loadSnapshot = (): EcosystemState | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    parsed.rawFiles = (parsed.rawFiles || []).map((f: any) => ({
      ...f,
      content: f.content && typeof f.content === 'object' && '__b64' in f.content
        ? base64ToArrayBuffer(f.content.__b64)
        : f.content,
    }));
    return parsed as EcosystemState;
  } catch (err) {
    console.warn('[Studio] No se pudo recuperar el snapshot local:', err);
    return null;
  }
};

export const clearSnapshot = () => {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
};
