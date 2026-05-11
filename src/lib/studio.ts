import yaml from 'js-yaml';
import JSZip from 'jszip';

export interface StudioFile {
  name: string;
  content: any;
  type: 'texture' | 'model' | 'config' | 'raw';
  inferredPath: string;
}

export interface EcosystemState {
  projectName: string;
  foods: Record<string, { config: any, folder?: string }>;
  crops: Record<string, { config: any, folder?: string }>;
  iaItems: Record<string, any>;
  machines: Record<string, { config: any, folder?: string }>;
  rawFiles: StudioFile[];
}

export const generateZIP = async (state: EcosystemState): Promise<Blob> => {
  const zip = new JSZip();
  const ns = state.projectName || 'xLib';
  
  // 1. Pack xFoods
  Object.entries(state.foods).forEach(([id, data]) => {
    const folder = data.folder ? `${data.folder}/` : '';
    zip.file(`plugins/xFoods/foods/${folder}${id}.yml`, stringifyYaml(data.config));
  });

  // 2. Pack xCrops
  Object.entries(state.crops).forEach(([id, data]) => {
    const folder = data.folder ? `${data.folder}/` : '';
    zip.file(`plugins/xFoodsCrops/species/${folder}${id}.yml`, stringifyYaml(data.config));
  });

  // 3. Pack Machines
  Object.entries(state.machines).forEach(([id, data]) => {
    const folder = data.folder ? `${data.folder}/` : '';
    zip.file(`plugins/xFoods/machines/${folder}${id}.yml`, stringifyYaml(data.config));
  });

  // 4. Pack ItemsAdder (MODULAR STRUCTURE)
  // Everything goes under plugins/ItemsAdder/contents/[projectName]/
  Object.entries(state.iaItems).forEach(([id, data]) => {
    zip.file(`plugins/ItemsAdder/contents/${ns}/configs/${id}.yml`, stringifyYaml(data));
  });

  // 5. Pack original raw files (textures/models)
  state.rawFiles.forEach(file => {
    // These paths are already prepared to be under contents/[projectName]/
    zip.file(file.inferredPath, file.content);
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
    const path = (file as any).webkitRelativePath || file.name;
    const parts = path.split('/');
    
    // Priority: Find ItemsAdder namespace
    const iaIdx = parts.indexOf('ItemsAdder');
    if (iaIdx !== -1 && parts[iaIdx + 1] === 'contents' && parts[iaIdx + 2]) {
      state.projectName = parts[iaIdx + 2];
      break;
    }

    // Fallback: Look for a folder that isn't xFoods, xFoodsCrops or plugins
    if (parts.length > 1) {
      const topFolder = parts[0];
      if (!['xFoods', 'xFoodsCrops', 'plugins', 'ItemsAdder'].includes(topFolder)) {
        state.projectName = topFolder;
        // Don't break yet, ItemsAdder might be found later and is more reliable
      }
    }
  }

  // Second pass: Parse files
  for (const file of fileList) {
    const path = (file as any).webkitRelativePath || file.name;
    
    if (path.endsWith('.yml') || path.endsWith('.yaml')) {
      const content = await file.text();
      const id = file.name.replace(/\.ya?ml$/, '');

      if (path.includes('xFoods/foods/')) {
        const folderPath = path.split('xFoods/foods/')[1].split('/').slice(0, -1).join('/');
        state.foods[id] = { config: yaml.load(content), folder: folderPath };
      } else if (path.includes('xFoods/machines/')) {
        const folderPath = path.split('xFoods/machines/')[1].split('/').slice(0, -1).join('/');
        state.machines[id] = { config: yaml.load(content), folder: folderPath };
      } else if (path.includes('xFoodsCrops/species/')) {
        const folderPath = path.split('xFoodsCrops/species/')[1].split('/').slice(0, -1).join('/');
        state.crops[id] = { config: yaml.load(content), folder: folderPath };
      } else if (path.includes('ItemsAdder/contents/')) {
        const iaPath = path.split('ItemsAdder/contents/')[1];
        const iaParts = iaPath.split('/');
        if (iaParts.length > 1 && iaParts[1] === 'configs') {
          state.iaItems[id] = yaml.load(content);
        }
      } else if (path.includes(`${state.projectName}/configs/`)) {
        state.iaItems[id] = yaml.load(content);
      }
    } else if (path.match(/\.(png|json|ogg)$/i)) {
      // Preserve assets from the IA content folder
      if (path.includes('ItemsAdder/contents/')) {
        const buffer = await file.arrayBuffer();
        const iaPath = path.split('ItemsAdder/contents/')[1];
        const iaParts = iaPath.split('/');
        const ns = iaParts[0];
        const relativeToNamespace = iaParts.slice(1).join('/');

        state.rawFiles.push({
          name: file.name,
          content: buffer,
          type: 'raw',
          inferredPath: `plugins/ItemsAdder/contents/${ns}/${relativeToNamespace}`
        });
      } else if (path.includes(`${state.projectName}/resourcepack/`)) {
        const buffer = await file.arrayBuffer();
        const relativeToNamespace = path.split(`${state.projectName}/`)[1];
        state.rawFiles.push({
          name: file.name,
          content: buffer,
          type: 'raw',
          inferredPath: `plugins/ItemsAdder/contents/${state.projectName}/${relativeToNamespace}`
        });
      }
    }
  }

  return state;
};

export const stringifyYaml = (obj: any) => {
  return yaml.dump(obj, { indent: 2, lineWidth: -1, noRefs: true });
};
