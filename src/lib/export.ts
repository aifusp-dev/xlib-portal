"use client";

import { generateZIP, stringifyYaml, StudioFile } from "@/lib/studio";

// Extending the StudioPage with actual ZIP generation
// This will be called from the handleDownload in the previous step (integrated mentally)

export async function exportEcosystem(foodData: any, iaEnabled: boolean, iaType: string, iaInferredPath: string, namespace: string) {
  const files: StudioFile[] = [];

  // 1. Add xFoods Config
  const xFoodsYaml = {
    "display-name": foodData.name,
    "lore": foodData.lore.split("\n").map((l: string) => l.trim()),
    "item": {
      "material": foodData.mat,
      "custom-model-data": 0,
      ...(iaEnabled ? { "itemsadder-id": `${namespace}:${foodData.id}` } : {})
    },
    "stats": {
      "food-level": 4,
      "saturation": 2.0,
      "bites": foodData.bites,
      "consumable": foodData.consumable
    }
  };

  files.push({
    name: `${foodData.id}.yml`,
    content: stringifyYaml(xFoodsYaml),
    type: 'config',
    inferredPath: `plugins/xFoods/foods/${foodData.id}.yml`
  });

  // 2. Add ItemsAdder Config if enabled
  if (iaEnabled) {
    const iaYaml = {
      items: {
        [foodData.id]: {
          display_name: foodData.name,
          permission: `${namespace.toLowerCase()}.${foodData.id}`,
          resource: iaType === 'texture' 
            ? { generate: true, textures: [`${namespace}:${iaInferredPath}`] }
            : { generate: false, model_path: `${namespace}:${iaInferredPath}` }
        }
      }
    };

    files.push({
      name: `${foodData.id}_ia.yml`,
      content: stringifyYaml(iaYaml),
      type: 'config',
      inferredPath: `plugins/ItemsAdder/data/resource_pack/${namespace}/items/${foodData.id}.yml`
    });
  }

  const zipBlob = await generateZIP(files);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = `xLib_Studio_Export_${foodData.id}.zip`;
  link.click();
}
