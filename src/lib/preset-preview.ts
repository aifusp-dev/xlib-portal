import 'server-only';
import JSZip from 'jszip';

export interface PresetPreview {
  ymlFiles: { path: string; content: string }[];
  /** Texturas del bundle como data URI, para mostrarlas sin tener que instalar nada. */
  textures: { path: string; dataUri: string }[];
  modelCount: number;
}

/** Desempaqueta un bundle (el mismo zip que genera extractPresetBundle) para previsualizarlo
 * en /moderar y en /discover, sin necesidad de instalarlo. */
export async function buildInstallPreview(bundleBase64: string): Promise<PresetPreview> {
  const zip = await JSZip.loadAsync(Buffer.from(bundleBase64, 'base64'));

  const ymlFiles: PresetPreview['ymlFiles'] = [];
  const textures: PresetPreview['textures'] = [];
  let modelCount = 0;

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    if (/\.ya?ml$/i.test(path)) {
      ymlFiles.push({ path, content: await zipEntry.async('text') });
    } else if (/\.png$/i.test(path)) {
      const base64 = await zipEntry.async('base64');
      textures.push({ path, dataUri: `data:image/png;base64,${base64}` });
    } else if (/\.json$/i.test(path) && path.includes('/models/')) {
      modelCount++;
    }
  }

  ymlFiles.sort((a, b) => a.path.localeCompare(b.path));
  return { ymlFiles, textures, modelCount };
}
