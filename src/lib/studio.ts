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
  foods: Record<string, any>;
  crops: Record<string, any>;
  iaItems: Record<string, any>;
  machines: Record<string, any>;
  rawFiles: StudioFile[];
}

export const generateZIP = async (state: EcosystemState): Promise<Blob> => {
  const zip = new JSZip();
  const ns = state.projectName || 'xLib';
  
  // 1. Pack xFoods
  Object.entries(state.foods).forEach(([id, data]) => {
    zip.file(`plugins/xFoods/foods/${id}.yml`, stringifyYaml(data));
  });

  // 2. Pack xCrops
  Object.entries(state.crops).forEach(([id, data]) => {
    zip.file(`plugins/xFoodsCrops/species/${id}.yml`, stringifyYaml(data));
  });

  // 3. Pack Machines
  Object.entries(state.machines).forEach(([id, data]) => {
    zip.file(`plugins/xFoodsCrops/machines/${id}.yml`, stringifyYaml(data));
  });

  // 4. Pack ItemsAdder (Content Folder Structure)
  // We recreate the 'contents/namespace' structure
  Object.entries(state.iaItems).forEach(([id, data]) => {
    zip.file(`plugins/ItemsAdder/contents/${ns}/configs/${id}.yml`, stringifyYaml(data));
  });

  // 5. Pack original raw files (textures/models)
  state.rawFiles.forEach(file => {
    // If it's from the uploaded content, we keep it in the same relative spot
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
        state.foods[id] = yaml.load(content);
      } else if (path.includes('xFoodsCrops/species/')) {
        state.crops[id] = yaml.load(content);
      } else if (path.includes('configs/')) {
        // Assume it's an ItemsAdder config inside the content folder
        state.iaItems[id] = yaml.load(content);
      }
    } else if (path.match(/\.(png|json|ogg)$/i)) {
      // Store raw assets to preserve them in the ZIP
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
