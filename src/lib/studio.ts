import yaml from 'js-yaml';
import JSZip from 'jszip';

export interface StudioFile {
  name: string;
  content: any;
  type: 'texture' | 'model' | 'config' | 'raw';
  inferredPath: string;
  folderPath?: string; // New: preserves hierarchical organization
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

  // 3. Pack Machines (xFoods Core)
  Object.entries(state.machines).forEach(([id, data]) => {
    const folder = data.folder ? `${data.folder}/` : '';
    zip.file(`plugins/xFoods/machines/${folder}${id}.yml`, stringifyYaml(data.config));
  });

  // 4. Pack ItemsAdder (Content Folder Structure)
  Object.entries(state.iaItems).forEach(([id, data]) => {
    zip.file(`plugins/ItemsAdder/contents/${ns}/configs/${id}.yml`, stringifyYaml(data));
  });

  // 5. Pack original raw files (textures/models)
  state.rawFiles.forEach(file => {
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

  for (const file of Array.from(files)) {
    const path = (file as any).webkitRelativePath || file.name;
    const parts = path.split('/');
    
    // Attempt to infer project name from the top-level folder if it's an IA content folder
    if (state.projectName === 'xLib' && parts.length > 1) {
       state.projectName = parts[0];
    }

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
      } else if (path.includes('configs/')) {
        state.iaItems[id] = yaml.load(content);
      }
    } else if (path.match(/\.(png|json|ogg)$/i)) {
      const buffer = await file.arrayBuffer();
      state.rawFiles.push({
        name: file.name,
        content: buffer,
        type: 'raw',
        inferredPath: `plugins/ItemsAdder/contents/${state.projectName}/${parts.slice(1).join('/')}`
      });
    }
  }

  return state;
};

export const stringifyYaml = (obj: any) => {
  return yaml.dump(obj, { indent: 2, lineWidth: -1, noRefs: true });
};
