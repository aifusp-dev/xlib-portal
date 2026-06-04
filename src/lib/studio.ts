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
  iaBlocks: Record<string, Record<string, unknown>>;
  iaFurnitures: Record<string, Record<string, unknown>>;
  machines: Record<string, { config: Record<string, unknown>, folder?: string }>;
  rawFiles: StudioFile[];
}

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

  // 3. Pack Machines
  Object.entries(state.machines).forEach(([id, data]) => {
    zip.file(`xFoods/machines/${id}.yml`, stringifyYaml(data.config));
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
  const state: EcosystemState = {
    projectName: 'xLib',
    foods: {},
    crops: {},
    iaItems: {},
    iaBlocks: {},
    iaFurnitures: {},
    machines: {},
    rawFiles: []
  };

  const fileList = Array.from(files);

  // First pass: Detect project name (Namespace) - Just use the first valid ItemsAdder namespace found as default
  for (const file of fileList) {
    const path = (file as any).webkitRelativePath || file.name;
    const parts = path.split('/');
    const iaIdx = parts.indexOf('ItemsAdder');
    if (iaIdx !== -1 && parts[iaIdx + 1] === 'contents' && parts[iaIdx + 2] && parts[iaIdx + 2] !== '__iainternal') {
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
          } else if (path.includes('ItemsAdder/contents/')) {
            const iaPath = path.split('ItemsAdder/contents/')[1];
            const iaParts = iaPath.split('/');
            const namespace = sanitizePath(iaParts[0]);
            
            // Skip internal namespace
            if (namespace === '__iainternal') continue;

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
        if (ns === '__iainternal') continue;

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
