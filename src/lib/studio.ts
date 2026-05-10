import yaml from 'js-yaml';
import JSZip from 'jszip';

export interface StudioFile {
  name: string;
  content: any;
  type: 'texture' | 'model' | 'config';
  inferredPath: string;
}

export interface EcosystemState {
  foods: Record<string, any>;
  crops: Record<string, any>;
  iaItems: Record<string, any>;
  machines: Record<string, any>;
  rawFiles: StudioFile[];
}

export const generateZIP = async (state: EcosystemState): Promise<Blob> => {
  const zip = new JSZip();
  
  // 1. Pack xFoods
  Object.entries(state.foods).forEach(([id, data]) => {
    zip.file(`plugins/xFoods/foods/${id}.yml`, yaml.dump(data));
  });

  // 2. Pack xCrops
  Object.entries(state.crops).forEach(([id, data]) => {
    zip.file(`plugins/xFoodsCrops/species/${id}.yml`, yaml.dump(data));
  });

  // 3. Pack Machines
  Object.entries(state.machines).forEach(([id, data]) => {
    zip.file(`plugins/xFoodsCrops/machines/${id}.yml`, yaml.dump(data));
  });

  // 4. Pack ItemsAdder (simplified structure for this example)
  // In a real scenario, we'd need to know namespaces
  Object.entries(state.iaItems).forEach(([id, data]) => {
    const namespace = data.namespace || 'xLib';
    zip.file(`plugins/ItemsAdder/data/resource_pack/${namespace}/items/${id}.yml`, yaml.dump(data.config));
  });

  // 5. Pack original raw files (textures/models)
  state.rawFiles.forEach(file => {
    zip.file(file.inferredPath, file.content);
  });
  
  return await zip.generateAsync({ type: 'blob' });
};

export const parseUploadedFiles = async (files: FileList | File[]): Promise<EcosystemState> => {
  const state: EcosystemState = {
    foods: {},
    crops: {},
    iaItems: {},
    machines: {},
    rawFiles: []
  };

  for (const file of Array.from(files)) {
    const path = (file as any).webkitRelativePath || file.name;
    const content = await file.text();

    if (path.includes('xFoods/foods/') && path.endsWith('.yml')) {
      const id = file.name.replace('.yml', '');
      state.foods[id] = yaml.load(content);
    } else if (path.includes('xFoodsCrops/species/') && path.endsWith('.yml')) {
      const id = file.name.replace('.yml', '');
      state.crops[id] = yaml.load(content);
    } else if (path.includes('ItemsAdder/data/resource_pack/') && path.endsWith('.yml')) {
       // logic to extract namespace and items
    }
  }

  return state;
};

export const stringifyYaml = (obj: any) => {
  return yaml.dump(obj, { indent: 2, lineWidth: -1, noRefs: true });
};
