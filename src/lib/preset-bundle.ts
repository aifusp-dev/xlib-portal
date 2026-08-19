import {
  EcosystemState,
  PluginEditor,
  EDITOR_MAPS,
  emptyState,
  generateZIP,
  leafId,
  sanitizePath,
  XFOODS_NAMESPACE,
} from './studio';

/**
 * Construye un EcosystemState acotado a una sola entrada (comida/cultivo/
 * máquina/maceta/automatización) más, si la tiene, su vínculo de ItemsAdder
 * (ítem o mueble) y los assets (modelo/textura) que referencia. Reutiliza
 * generateZIP tal cual — un preset publicado es, literalmente, el mismo
 * formato de zip que ya produce el Studio para el proyecto entero.
 */
export const extractPresetBundle = (
  state: EcosystemState,
  editor: PluginEditor,
  itemId: string
): Promise<Blob> => {
  const category = EDITOR_MAPS[editor];
  const entry = state[category][itemId];
  if (!entry) throw new Error(`No existe "${itemId}" en la sección "${editor}"`);

  const scoped = emptyState();
  scoped.projectName = state.projectName;
  (scoped[category] as Record<string, unknown>)[itemId] = entry;

  // Igual que linkedIaItemEntry/linkedIaFurnitureEntry en el Studio: el
  // vínculo IA (si existe) vive en iaItems o iaFurnitures bajo la misma
  // clave "namespace/leafId", nunca en los dos a la vez.
  const iaFullKey = `${XFOODS_NAMESPACE}/${leafId(itemId)}`;
  if (state.iaItems[iaFullKey]) scoped.iaItems[iaFullKey] = state.iaItems[iaFullKey];
  if (state.iaFurnitures[iaFullKey]) scoped.iaFurnitures[iaFullKey] = state.iaFurnitures[iaFullKey];

  // Los ficheros de modelo/textura se nombran a partir del id del ítem (ver
  // handleIAFileUpload en el Studio: modelName = sanitizePath(entryItemId),
  // con sufijo "_<original>" cuando hay varias texturas). Basta con mirar el
  // nombre de fichero, la carpeta no importa aquí.
  const modelName = sanitizePath(leafId(itemId));
  scoped.rawFiles = state.rawFiles.filter((file) => {
    const fileName = file.inferredPath.split('/').pop() || '';
    return fileName === `${modelName}.json` || fileName.startsWith(`${modelName}.png`) || fileName.startsWith(`${modelName}_`);
  });

  return generateZIP(scoped);
};
