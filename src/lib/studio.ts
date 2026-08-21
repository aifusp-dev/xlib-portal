import yaml from 'js-yaml';
import JSZip from 'jszip';

export interface StudioFile {
  name: string;
  content: string | ArrayBuffer | Blob;
  type: 'texture' | 'model' | 'config' | 'raw';
  inferredPath: string;
}

export type ConfigEntry = { config: Record<string, unknown>, folder?: string, recipe?: CraftRecipeConfig | null };

/**
 * Receta de crafteo (mesa vanilla) de un macetero o una estación, editada visualmente en el grid
 * de {@link CraftingGridEditor}. Espejo en TypeScript del esquema YAML que lee
 * {@code org.aifusp.dev.xLib.crafting.CraftingRecipeLoader} en el plugin: "shape" es un array de
 * 1 a 3 líneas de igual longitud (espacio = hueco vacío), "ingredients" mapea cada símbolo a un
 * ref "namespace:key" (o "vanilla:MATERIAL"). Solo se soporta el modo shaped desde el Studio — el
 * motor también entiende "ingredients-list" (shapeless) pero eso hay que escribirlo a mano.
 */
export interface CraftRecipeConfig {
  shape: string[];
  ingredients: Record<string, string>;
}

/** Ausencia de receta = el ítem no es crafteable, solo se consigue por comando. */
export const isCraftable = (recipe: CraftRecipeConfig | null | undefined): boolean =>
  !!recipe && recipe.shape.length > 0 && Object.keys(recipe.ingredients).length > 0;

/** Id de resultado tal y como lo resuelve CustomItemFactories en el plugin: sin la carpeta. */
export const craftResultRef = (kind: 'pod' | 'machine', id: string): string =>
  kind === 'pod' ? `xfoodscrops:pod:${leafId(id)}` : `xfoods:machine:${leafId(id)}`;

/**
 * Un fichero del proyecto que el Studio reconoce como suyo pero para el que todavía no hay
 * editor (categories.yml, market.yml, config.yml...). Se guarda tal cual y se vuelve a escribir
 * sin tocarlo, para que pasar el proyecto por el Studio nunca pierda nada.
 */
export interface PassthroughFile {
  /** Ruta relativa a plugins/, p.ej. "xFoods/categories.yml". */
  path: string;
  content: string;
}

export interface EcosystemState {
  projectName: string;
  foods: Record<string, ConfigEntry>;
  crops: Record<string, ConfigEntry>;
  iaItems: Record<string, Record<string, unknown>>;
  iaBlocks: Record<string, Record<string, unknown>>;
  iaFurnitures: Record<string, Record<string, unknown>>;
  machines: Record<string, ConfigEntry>;
  /** Maceteros de xFoodsCrops (pods/*.yml). */
  pods: Record<string, ConfigEntry>;
  /** Máquinas de automatización de xFoodsCrops (machines/*.yml). */
  cropMachines: Record<string, ConfigEntry>;
  /** Ficheros reconocidos sin editor propio; se conservan intactos. */
  extraFiles: PassthroughFile[];
  rawFiles: StudioFile[];
}

/** Estado vacío. Centralizado para que añadir una sección nueva no se olvide en ningún sitio. */
export const emptyState = (): EcosystemState => ({
  projectName: 'xLib',
  foods: {},
  crops: {},
  iaItems: {},
  iaBlocks: {},
  iaFurnitures: {},
  machines: {},
  pods: {},
  cropMachines: {},
  extraFiles: [],
  rawFiles: []
});

export type PluginEditor = 'xfoods' | 'xcrops' | 'xmachines' | 'xpods' | 'xautomation';

export const EDITOR_MAPS: Record<PluginEditor, keyof Pick<EcosystemState, 'foods' | 'crops' | 'machines' | 'pods' | 'cropMachines'>> = {
  xfoods: 'foods',
  xcrops: 'crops',
  xmachines: 'machines',
  xpods: 'pods',
  xautomation: 'cropMachines',
};

/** Nombre legible de cada sección, para Descubrir/Moderar/el selector de paquete al publicar. */
export const EDITOR_LABELS: Record<PluginEditor, string> = {
  xfoods: 'Comida (xFoods)',
  xcrops: 'Cultivo (xCrops)',
  xmachines: 'Estación (xFoods)',
  xpods: 'Macetero (xCrops)',
  xautomation: 'Automatización (xCrops)',
};

/**
 * Devuelve el mapa de configuraciones de la sección activa.
 * Antes esto era un ternario anidado repetido en cinco sitios, y añadir una sección obligaba a
 * acordarse de tocarlos todos: por eso los maceteros y la automatización nunca llegaron a
 * aparecer en el Studio.
 */
export const mapFor = (state: EcosystemState, editor: PluginEditor): Record<string, ConfigEntry> =>
  state[EDITOR_MAPS[editor]] as Record<string, ConfigEntry>;

export const generateZIP = async (state: EcosystemState): Promise<Blob> => {
  const zip = new JSZip();
  const defaultNs = state.projectName || 'xLib';
  
  // 1. Pack xFoods
  Object.entries(state.foods).forEach(([id, data]) => {
    zip.file(`xFoods/foods/${id}.yml`, stringifyYaml(data.config));
  });

  // 2. Pack xCrops
  Object.entries(state.crops).forEach(([id, data]) => {
    zip.file(`xFoodsCrops/species/${id}.yml`, stringifyYaml(data.config));
  });

  // 3. Pack Machines (cocina)
  Object.entries(state.machines).forEach(([id, data]) => {
    zip.file(`xFoods/machines/${id}.yml`, stringifyYaml(data.config));
  });

  // 3b. Pack maceteros y máquinas de automatización de xCrops.
  // Antes no se empaquetaban: subir el proyecto al Studio y volver a exportarlo perdía los
  // 3 maceteros y las 6 máquinas de automatización sin ningún aviso.
  Object.entries(state.pods).forEach(([id, data]) => {
    zip.file(`xFoodsCrops/pods/${id}.yml`, stringifyYaml(data.config));
  });
  Object.entries(state.cropMachines).forEach(([id, data]) => {
    zip.file(`xFoodsCrops/machines/${id}.yml`, stringifyYaml(data.config));
  });

  // 3d. Recetas de crafteo (mesa vanilla) de maceteros y estaciones, editadas visualmente en el
  // Studio. Van en su propia carpeta ("recipes/"), separada de "pods/"/"machines/" porque así
  // las lee org.aifusp.dev.xLib.crafting.RecipeManager en cada plugin. Un macetero/estación sin
  // receta (isCraftable == false) simplemente no escribe fichero: no es crafteable, solo se
  // consigue por comando, que es el estado por defecto.
  Object.entries(state.pods).forEach(([id, data]) => {
    if (!isCraftable(data.recipe)) return;
    zip.file(`xFoodsCrops/recipes/${leafId(id)}.yml`, stringifyYaml({
      result: craftResultRef('pod', id),
      shape: data.recipe!.shape,
      ingredients: data.recipe!.ingredients,
    }));
  });
  Object.entries(state.machines).forEach(([id, data]) => {
    if (!isCraftable(data.recipe)) return;
    zip.file(`xFoods/recipes/${leafId(id)}.yml`, stringifyYaml({
      result: craftResultRef('machine', id),
      shape: data.recipe!.shape,
      ingredients: data.recipe!.ingredients,
    }));
  });

  // 3c. Ficheros sin editor propio (categories.yml, market.yml, config.yml...): se devuelven
  // exactamente como entraron, comentarios incluidos.
  state.extraFiles.forEach(file => {
    zip.file(file.path, file.content);
  });

  // 4. Pack ItemsAdder (MODULAR STRUCTURE)
  // General configs - Key is "namespace/fileId"
  Object.entries(state.iaItems).forEach(([fullId, data]) => {
    const parts = fullId.split('/');
    if (parts.length > 1) {
        const ns = parts[0];
        const fileId = parts.slice(1).join('/');
        zip.file(`ItemsAdder/contents/${ns}/configs/${fileId}.yml`, stringifyYaml(data));
    } else {
        zip.file(`ItemsAdder/contents/${defaultNs}/configs/${fullId}.yml`, stringifyYaml(data));
    }
  });

  // Blocks
  Object.entries(state.iaBlocks).forEach(([fullId, data]) => {
    const parts = fullId.split('/');
    if (parts.length > 1) {
        const ns = parts[0];
        const fileId = parts.slice(1).join('/');
        zip.file(`ItemsAdder/contents/${ns}/configs/blocks/${fileId}.yml`, stringifyYaml(data));
    } else {
        zip.file(`ItemsAdder/contents/${defaultNs}/configs/blocks/${fullId}.yml`, stringifyYaml(data));
    }
  });

  // Furnitures
  Object.entries(state.iaFurnitures).forEach(([fullId, data]) => {
    const parts = fullId.split('/');
    if (parts.length > 1) {
        const ns = parts[0];
        const fileId = parts.slice(1).join('/');
        zip.file(`ItemsAdder/contents/${ns}/configs/furnitures/${fileId}.yml`, stringifyYaml(data));
    } else {
        zip.file(`ItemsAdder/contents/${defaultNs}/configs/furnitures/${fullId}.yml`, stringifyYaml(data));
    }
  });

  // 5. Pack original raw files (textures/models) with final JSON remapping
  state.rawFiles.forEach(file => {
    const cleanPath = file.inferredPath.replace(/^plugins\//, '');
    let finalContent: string | ArrayBuffer | Blob = file.content;

    // IF JSON model, perform final texture remapping
    if (file.name.endsWith('.json')) {
      try {
        const text = new TextDecoder().decode(file.content as ArrayBuffer);
        const model = JSON.parse(text);
        
        if (model.textures) {
          Object.keys(model.textures).forEach(key => {
            const texPath = model.textures[key] as string;
            // Extract just the filename and sanitize it
            const fileName = sanitizePath(texPath.split('/').pop() || texPath);
            
            // Find where this texture actually is in our project
            const actualTexFile = state.rawFiles.find(f => 
              f.name.toLowerCase() === `${fileName}.png` || 
              f.name.toLowerCase() === fileName
            );

            if (actualTexFile) {
                // Extract subfolder and namespace from actual file path
                const parts = actualTexFile.inferredPath.split('/');
                const assetsIdx = parts.indexOf('assets');
                if (assetsIdx !== -1 && parts.length > assetsIdx + 3) {
                    const ns = parts[assetsIdx + 1];
                    const texturesIdx = parts.indexOf('textures', assetsIdx);
                    if (texturesIdx !== -1) {
                        // Extract everything AFTER "textures" up to the filename
                        const actualSubfolder = parts.slice(texturesIdx + 1, -1).join('/'); 
                        model.textures[key] = `${ns}:${actualSubfolder}/${fileName}`;
                    }
                }
            }
          });
          finalContent = new TextEncoder().encode(JSON.stringify(model, null, 2)).buffer;
        }
      } catch (e) {
        console.error("Failed final remapping for", file.name, e);
      }
    }

    zip.file(cleanPath, finalContent);
  });
  
  return await zip.generateAsync({ type: 'blob' });
};

export const parseUploadedFiles = async (files: FileList | File[] | any[]): Promise<EcosystemState> => {
  const state: EcosystemState = emptyState();

  // Recetas de crafteo leídas de "recipes/*.yml", guardadas por leafId aparte porque el fichero
  // de la receta puede procesarse antes o después que el del pod/estación al que pertenece (el
  // orden de fileList no está garantizado). Se enganchan a su pod/estación en una segunda pasada,
  // cuando ya se sabe que todos los pods/estaciones están cargados.
  const pendingPodRecipes: Record<string, CraftRecipeConfig> = {};
  const pendingMachineRecipes: Record<string, CraftRecipeConfig> = {};

  const fileList = Array.from(files);

  // First pass: Detect project name (Namespace) - Just use the first valid ItemsAdder namespace found as default
  for (const file of fileList) {
    const path = (file as any).webkitRelativePath || file.name;
    const parts = path.split('/');
    const iaIdx = parts.indexOf('ItemsAdder');
    if (iaIdx !== -1 && parts[iaIdx + 1] === 'contents' && parts[iaIdx + 2] && !isInternalNamespace(parts[iaIdx + 2])) {
      state.projectName = sanitizePath(parts[iaIdx + 2]);
      break;
    }
  }

  // Second pass: Parse files
  for (const file of fileList) {
    const path = (file as any).webkitRelativePath || file.name;
    
    if (path.endsWith('.yml') || path.endsWith('.yaml')) {
      const content = await file.text();

      try {
          const docs = yaml.loadAll(content);
          const config = (docs.find(d => d && typeof d === 'object') || {}) as Record<string, unknown>;

          if (path.includes('xFoods/foods/')) {
            const relativePath = path.split('xFoods/foods/')[1];
            const fullId = sanitizePath(relativePath.replace(/\.ya?ml$/, ''));
            const folderPath = fullId.split('/').slice(0, -1).join('/');
            state.foods[fullId] = { config, folder: folderPath };
          } else if (path.includes('xFoods/machines/')) {
            const relativePath = path.split('xFoods/machines/')[1];
            const fullId = sanitizePath(relativePath.replace(/\.ya?ml$/, ''));
            const folderPath = fullId.split('/').slice(0, -1).join('/');
            state.machines[fullId] = { config, folder: folderPath };
          } else if (path.includes('xFoodsCrops/species/')) {
            const relativePath = path.split('xFoodsCrops/species/')[1];
            const fullId = sanitizePath(relativePath.replace(/\.ya?ml$/, ''));
            const folderPath = fullId.split('/').slice(0, -1).join('/');
            state.crops[fullId] = { config, folder: folderPath };
          } else if (path.includes('xFoodsCrops/pods/')) {
            const relativePath = path.split('xFoodsCrops/pods/')[1];
            const fullId = sanitizePath(relativePath.replace(/\.ya?ml$/, ''));
            state.pods[fullId] = { config, folder: fullId.split('/').slice(0, -1).join('/') };
          } else if (path.includes('xFoodsCrops/machines/')) {
            const relativePath = path.split('xFoodsCrops/machines/')[1];
            const fullId = sanitizePath(relativePath.replace(/\.ya?ml$/, ''));
            state.cropMachines[fullId] = { config, folder: fullId.split('/').slice(0, -1).join('/') };
          } else if (path.includes('xFoodsCrops/recipes/')) {
            const relativePath = path.split('xFoodsCrops/recipes/')[1];
            const recipe = parseCraftRecipe(config);
            if (recipe) pendingPodRecipes[sanitizePath(relativePath.replace(/\.ya?ml$/, ''))] = recipe;
          } else if (path.includes('xFoods/recipes/')) {
            const relativePath = path.split('xFoods/recipes/')[1];
            const recipe = parseCraftRecipe(config);
            if (recipe) pendingMachineRecipes[sanitizePath(relativePath.replace(/\.ya?ml$/, ''))] = recipe;
          } else if (path.includes('ItemsAdder/contents/')) {
            const iaPath = path.split('ItemsAdder/contents/')[1];
            const iaParts = iaPath.split('/');
            const namespace = sanitizePath(iaParts[0]);
            
            // Skip internal namespace
            if (isInternalNamespace(namespace)) continue;

            if (iaParts.length > 1 && iaParts[1] === 'configs') {
              const relativeIdPath = iaParts.slice(2).join('/');
              const fileId = sanitizePath(relativeIdPath.replace(/\.ya?ml$/, ''));
              const fullKey = `${namespace}/${fileId}`;
              
              if (path.includes('/configs/blocks/')) {
                state.iaBlocks[fullKey.replace('blocks/', '')] = config;
              } else if (path.includes('/configs/furnitures/')) {
                state.iaFurnitures[fullKey.replace('furnitures/', '')] = config;
              } else {
                state.iaItems[fullKey] = config;
              }
            }
          } else {
            // Red de seguridad: cualquier otro .yml de xFoods/xFoodsCrops (categories.yml,
            // market.yml, config.yml y lo que venga en el futuro) se conserva tal cual.
            // Sin esto, un fichero sin editor propio desaparecía al reexportar el proyecto.
            const relPath = pluginRelativePath(path);
            if (relPath) {
              state.extraFiles.push({ path: relPath, content });
            }
          }
      } catch (e) {
          console.error("Error parsing YAML file:", path, e);
      }
    } else if (path.match(/\.(png|json|ogg)$/i)) {
      if (path.includes('ItemsAdder/contents/')) {
        const buffer = await file.arrayBuffer();
        const iaPath = path.split('ItemsAdder/contents/')[1];
        const iaParts = iaPath.split('/');
        const ns = sanitizePath(iaParts[0]);
        if (isInternalNamespace(ns)) continue;

        const relativeToNamespace = sanitizePath(iaParts.slice(1).join('/'));
        const normalizedPath = relativeToNamespace.replace(/^resourcepack\//, 'resource_pack/');

        state.rawFiles.push({
          name: sanitizePath(file.name),
          content: buffer,
          type: 'raw',
          inferredPath: `plugins/ItemsAdder/contents/${ns}/${normalizedPath}`
        });
      }
    }
  }

  // Engancha cada receta pendiente al pod/estación cuyo leafId coincide con el nombre del
  // fichero de receta (result: no se usa para el match porque nada garantiza que el admin no lo
  // haya tocado a mano; el nombre de fichero es la misma identidad que usa el plugin).
  const attachRecipes = (map: Record<string, ConfigEntry>, recipes: Record<string, CraftRecipeConfig>) => {
    Object.keys(map).forEach((fullId) => {
      const recipe = recipes[leafId(fullId)];
      if (recipe) map[fullId].recipe = recipe;
    });
  };
  attachRecipes(state.pods, pendingPodRecipes);
  attachRecipes(state.machines, pendingMachineRecipes);

  return state;
};

/**
 * Lee un fichero de receta ya parseado a objeto. Solo entiende el modo "shaped" (shape +
 * ingredients) que produce {@link CraftingGridEditor} — una receta "ingredients-list" (shapeless)
 * escrita a mano por fuera del Studio se conserva en el servidor pero no se puede editar aquí, así
 * que se ignora en vez de intentar representarla a medias.
 */
const parseCraftRecipe = (config: Record<string, unknown>): CraftRecipeConfig | null => {
  const shape = config.shape;
  const ingredients = config.ingredients;
  if (!Array.isArray(shape) || shape.length === 0) return null;
  if (typeof ingredients !== 'object' || ingredients === null) return null;
  return {
    shape: shape.map(String),
    ingredients: ingredients as Record<string, string>,
  };
};

/**
 * Devuelve la ruta relativa a plugins/ de un fichero de xFoods o xFoodsCrops, o null si el
 * fichero no pertenece a ninguno de los dos.
 *
 * plugin.yml se descarta a propósito: vive dentro del JAR y no debe acabar nunca en
 * plugins/xFoods/, o el sync lo dejaría suelto en la carpeta de datos.
 */
const pluginRelativePath = (path: string): string | null => {
  // xFoodsCrops va primero: "xFoods" es un prefijo suyo y si no, todo xFoodsCrops
  // se detectaría como xFoods.
  for (const plugin of ['xFoodsCrops', 'xFoods']) {
    const marker = `${plugin}/`;
    const idx = path.indexOf(marker);
    if (idx === -1) continue;

    const rel = path.slice(idx);
    const fileName = rel.split('/').pop() || '';

    if (fileName === 'plugin.yml') return null;
    if (RUNTIME_STATE_FILES.has(fileName)) return null;

    return rel;
  }
  return null;
};

/**
 * Ficheros que el plugin escribe solo, con el estado vivo del servidor (máquinas colocadas,
 * maceteros plantados, precios actuales). Nunca deben viajar en un pack del Studio: reimportarlos
 * sobrescribiría el estado real de la partida con una foto vieja.
 */
const RUNTIME_STATE_FILES = new Set([
  'active_machines.yml',
  'pods_data.yml',
  'automation_data.yml',
  'market_prices.yml',
]);

export const stringifyYaml = (obj: Record<string, unknown> | unknown) => {
  return yaml.dump(obj, { indent: 2, lineWidth: -1, noRefs: true });
};

/**
 * Namespaces internos de ItemsAdder, que nunca deben aparecer en el Studio ni viajar en un pack.
 *
 * La carpeta real se llama "_iainternal", con UN guion bajo. El código filtraba "__iainternal"
 * con dos, así que el filtro no coincidía nunca y el namespace interno acababa listado en el
 * desplegable de la web. Se compara de forma tolerante para que dé igual el número de guiones
 * o las mayúsculas.
 */
/**
 * Namespace de ItemsAdder al que van SIEMPRE los ítems generados desde las secciones de xFoods
 * y xCrops, independientemente del pack que se haya detectado al importar el proyecto.
 *
 * Antes se usaba el namespace autodetectado (el primero que apareciera en la carpeta, p.ej.
 * "rpx"), así que los modelos de las comidas acababan mezclados dentro del pack de otro plugin.
 * Los ítems creados a mano desde la pestaña de ItemsAdder siguen yendo al namespace elegido en
 * el desplegable.
 *
 * En minúsculas porque ItemsAdder trata los namespaces como rutas de carpeta.
 */
export const XFOODS_NAMESPACE = 'xfoods';

/**
 * Identidad real de una comida, cultivo o máquina: el nombre del fichero sin su carpeta.
 *
 * En el Studio la clave incluye la subcarpeta ("consumibles/hamburguesa_cerdo") porque hace falta
 * para volver a escribir el fichero en su sitio. Pero el plugin NO usa la carpeta: FoodManager
 * hace {@code file.getName().replace(".yml","")}, así que su id es solo "hamburguesa_cerdo", y es
 * ese el que aparece en las recetas ({@code xfoods:hamburguesa_cerdo}) y en las cosechas.
 *
 * Usar la clave completa como identidad generaba ids que el plugin no resuelve, y nombres de ítem
 * de ItemsAdder con "/" dentro, que no son válidos.
 */
export const leafId = (fullId: string): string => {
  const parts = fullId.split('/');
  return parts[parts.length - 1] || fullId;
};

export const isInternalNamespace = (namespace: string | undefined | null): boolean => {
  if (!namespace) return false;
  return namespace.toLowerCase().replace(/^_+/, '') === 'iainternal';
};

export const sanitizePath = (path: string) => {
    return path.toLowerCase()
               .replace(/\s+/g, '_')
               .replace(/[^a-z0-9/._:-]/g, '');
};
