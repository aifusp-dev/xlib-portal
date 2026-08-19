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

export interface PresetItemRef {
  editor: PluginEditor;
  itemId: string;
}

/**
 * Añade una entrada (comida/cultivo/máquina/maceta/automatización) al EcosystemState acotado que
 * se está construyendo, junto con su vínculo de ItemsAdder (ítem o mueble) y los assets
 * (modelo/textura) que referencia, si los tiene.
 */
const addItemToScope = (scoped: EcosystemState, state: EcosystemState, { editor, itemId }: PresetItemRef) => {
  const category = EDITOR_MAPS[editor];
  const entry = state[category][itemId];
  if (!entry) throw new Error(`No existe "${itemId}" en la sección "${editor}"`);
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
  for (const file of state.rawFiles) {
    const fileName = file.inferredPath.split('/').pop() || '';
    const belongsToItem = fileName === `${modelName}.json` || fileName.startsWith(`${modelName}.png`) || fileName.startsWith(`${modelName}_`);
    if (belongsToItem && !scoped.rawFiles.some((f) => f.inferredPath === file.inferredPath)) {
      scoped.rawFiles.push(file);
    }
  }
};

/**
 * Construye un EcosystemState acotado a un "paquete" de entradas (p.ej. una Estación + la
 * comida que produce, o un cultivo + el ítem que da al cosecharlo) más sus vínculos de
 * ItemsAdder y assets. Reutiliza generateZIP tal cual — un preset publicado es, literalmente,
 * el mismo formato de zip que ya produce el Studio para el proyecto entero.
 */
export const extractPresetBundle = (state: EcosystemState, items: PresetItemRef[]): Promise<Blob> => {
  if (items.length === 0) throw new Error('No hay ningún ítem seleccionado para publicar.');

  const scoped = emptyState();
  scoped.projectName = state.projectName;
  for (const ref of items) addItemToScope(scoped, state, ref);

  return generateZIP(scoped);
};

/** Categorías con ids "con nombre" que pueden chocar al instalar un preset sobre un proyecto
 * que ya tenga un elemento con el mismo id. rawFiles se resuelve aparte (ver abajo): no tiene
 * un id que mostrarle al usuario, así que ahí el entrante simplemente gana.
 */
const NAMED_CATEGORIES = ['foods', 'crops', 'machines', 'pods', 'cropMachines', 'iaItems', 'iaBlocks', 'iaFurnitures'] as const;

/**
 * Mergea un EcosystemState descargado (el resultado de parseUploadedFiles sobre el zip de un
 * preset) dentro del proyecto actual del Studio. Es el inverso de extractPresetBundle: mismo
 * formato de zip, sin ningún parser nuevo.
 *
 * onConflict decide qué hacer cuando el id ya existe en el proyecto actual — la UI lo resuelve
 * con un confirm() por id en conflicto (ver src/app/studio/page.tsx).
 */
export const mergePresetIntoState = (
  current: EcosystemState,
  incoming: EcosystemState,
  onConflict: (category: string, id: string) => 'overwrite' | 'skip'
): EcosystemState => {
  const next: EcosystemState = { ...current };

  for (const category of NAMED_CATEGORIES) {
    const currentMap = { ...(current[category] as Record<string, unknown>) };
    const incomingMap = incoming[category] as Record<string, unknown>;

    for (const [id, value] of Object.entries(incomingMap)) {
      if (currentMap[id] && onConflict(category, id) === 'skip') continue;
      currentMap[id] = value;
    }
    (next[category] as Record<string, unknown>) = currentMap;
  }

  // Los rawFiles no tienen un id que mostrar en un conflicto: por ruta, el entrante gana.
  const rawFiles = [...current.rawFiles];
  for (const file of incoming.rawFiles) {
    const idx = rawFiles.findIndex((f) => f.inferredPath === file.inferredPath);
    if (idx !== -1) rawFiles[idx] = file;
    else rawFiles.push(file);
  }
  next.rawFiles = rawFiles;

  return next;
};
