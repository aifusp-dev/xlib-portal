import yaml from 'js-yaml';
import JSZip from 'jszip';

export interface StudioFile {
  name: string;
  content: string | ArrayBuffer | Blob;
  type: 'texture' | 'model' | 'config' | 'raw';
  inferredPath: string;
}

export interface EcosystemState {
  projectName: string;
  foods: Record<string, { config: Record<string, unknown>, folder?: string }>;
  crops: Record<string, { config: Record<string, unknown>, folder?: string }>;
  iaItems: Record<string, Record<string, unknown>>;
  machines: Record<string, { config: Record<string, unknown>, folder?: string }>;
  rawFiles: StudioFile[];
}

export const generateZIP = async (state: EcosystemState): Promise<Blob> => {
  const zip = new JSZip();
  const ns = state.projectName || 'xLib';
  
  // 1. Pack xFoods
  Object.entries(state.foods).forEach(([id, data]) => {
    zip.file(`xFoods/foods/${id}.yml`, stringifyYaml(data.config));
  });

  // 2. Pack xCrops
  Object.entries(state.crops).forEach(([id, data]) => {
    zip.file(`xFoodsCrops/species/${id}.yml`, stringifyYaml(data.config));
  });

  // 3. Pack Machines
  Object.entries(state.machines).forEach(([id, data]) => {
    zip.file(`xFoods/machines/${id}.yml`, stringifyYaml(data.config));
  });

  // 4. Pack ItemsAdder (MODULAR STRUCTURE)
  // Everything goes under ItemsAdder/contents/[projectName]/
  Object.entries(state.iaItems).forEach(([id, data]) => {
    zip.file(`ItemsAdder/contents/${ns}/configs/${id}.yml`, stringifyYaml(data));
  });

  // 5. Pack original raw files (textures/models)
  state.rawFiles.forEach(file => {
    // These paths are already prepared to be under contents/[projectName]/
    // We remove the 'plugins/' prefix if it exists in the inferredPath
    const cleanPath = file.inferredPath.replace(/^plugins\//, '');
    zip.file(cleanPath, file.content as string | ArrayBuffer | Blob);
  });
  
  return await zip.generateAsync({ type: 'blob' });
};

export const parseUploadedFiles = async (files: FileList | File[]): Promise<EcosystemState> => {
  const state: EcosystemState = {
    projectName: 'xLib',
    foods: {},
    crops: {},
    iaItems: {},
    machines: {},
    rawFiles: []
  };

  const fileList = Array.from(files);

  // First pass: Detect project name (Namespace)
  for (const file of fileList) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const parts = path.split('/');
    
    // Priority: Find ItemsAdder namespace
    const iaIdx = parts.indexOf('ItemsAdder');
    if (iaIdx !== -1 && parts[iaIdx + 1] === 'contents' && parts[iaIdx + 2]) {
      state.projectName = sanitizePath(parts[iaIdx + 2]);
      break;
    }

    // Fallback: Look for a folder that isn't xFoods, xFoodsCrops or plugins
    if (parts.length > 1) {
      const topFolder = parts[0];
      if (!['xFoods', 'xFoodsCrops', 'plugins', 'ItemsAdder'].includes(topFolder)) {
        state.projectName = sanitizePath(topFolder);
        // Don't break yet, ItemsAdder might be found later and is more reliable
      }
    }
  }

  // Second pass: Parse files
  for (const file of fileList) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    
    if (path.endsWith('.yml') || path.endsWith('.yaml')) {
      const content = await file.text();
      const id = file.name.replace(/\.ya?ml$/, '');

      const loadedConfig = yaml.load(content);
      const config = (loadedConfig && typeof loadedConfig === 'object') ? (loadedConfig as Record<string, unknown>) : {};

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
      } else if (path.includes('ItemsAdder/contents/')) {
        const iaPath = path.split('ItemsAdder/contents/')[1];
        const iaParts = iaPath.split('/');
        if (iaParts.length > 1 && iaParts[1] === 'configs') {
          const relativeIdPath = iaParts.slice(2).join('/');
          const fullId = sanitizePath(relativeIdPath.replace(/\.ya?ml$/, ''));
          state.iaItems[fullId] = config;
        }
      } else if (path.includes(`${state.projectName}/configs/`)) {
        const relativeIdPath = path.split(`${state.projectName}/configs/`)[1];
        const fullId = sanitizePath(relativeIdPath.replace(/\.ya?ml$/, ''));
        state.iaItems[fullId] = config;
      }
    } else if (path.match(/\.(png|json|ogg)$/i)) {
      // Preserve assets from the IA content folder
      if (path.includes('ItemsAdder/contents/')) {
        const buffer = await file.arrayBuffer();
        const iaPath = path.split('ItemsAdder/contents/')[1];
        const iaParts = iaPath.split('/');
        const ns = sanitizePath(iaParts[0]);
        const relativeToNamespace = sanitizePath(iaParts.slice(1).join('/'));

        // Normalize resourcepack -> resource_pack if needed
        const normalizedPath = relativeToNamespace.replace(/^resourcepack\//, 'resource_pack/');

        state.rawFiles.push({
          name: sanitizePath(file.name),
          content: buffer,
          type: 'raw',
          inferredPath: `plugins/ItemsAdder/contents/${ns}/${normalizedPath}`
        });
      } else if (path.includes(`${state.projectName}/resourcepack/`) || path.includes(`${state.projectName}/resource_pack/`)) {
        const buffer = await file.arrayBuffer();
        const isLegacy = path.includes('/resourcepack/');
        const relativeToNamespace = sanitizePath(path.split(isLegacy ? '/resourcepack/' : '/resource_pack/')[1]);
        
        state.rawFiles.push({
          name: sanitizePath(file.name),
          content: buffer,
          type: 'raw',
          inferredPath: `plugins/ItemsAdder/contents/${state.projectName}/resource_pack/${relativeToNamespace}`
        });
      }
    }
  }

  return state;
};

export const stringifyYaml = (obj: Record<string, unknown> | unknown) => {
  return yaml.dump(obj, { indent: 2, lineWidth: -1, noRefs: true });
};

export const sanitizePath = (path: string) => {
    return path.toLowerCase()
               .replace(/\s+/g, '_')
               .replace(/[^a-z0-9/._:-]/g, '');
};

