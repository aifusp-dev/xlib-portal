import 'server-only';
import JSZip from 'jszip';

/** Extrae solo los .yml/.yaml de un bundle (para previsualizar en /moderar sin descargar el zip). */
export async function previewPresetBundle(bundleBase64: string): Promise<{ path: string; content: string }[]> {
  const zip = await JSZip.loadAsync(Buffer.from(bundleBase64, 'base64'));
  const entries: { path: string; content: string }[] = [];

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    if (!/\.ya?ml$/i.test(path)) continue;
    entries.push({ path, content: await zipEntry.async('text') });
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}
