"use client";

import { generateZIP, EcosystemState, StudioFile } from "@/lib/studio";

export async function exportEcosystem(foodData: any, iaEnabled: boolean, iaType: string, iaInferredPath: string, namespace: string) {
  const state: EcosystemState = {
    foods: {},
    crops: {},
    iaItems: {},
    machines: {},
    rawFiles: []
  };

  // 1. Add xFoods Config
  state.foods[foodData.id] = {
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

  // 2. Add ItemsAdder Config if enabled
  if (iaEnabled) {
    state.iaItems[foodData.id] = {
      namespace: namespace,
      config: {
        items: {
          [foodData.id]: {
            display_name: foodData.name,
            permission: `${namespace.toLowerCase()}.${foodData.id}`,
            resource: iaType === 'texture' 
              ? { generate: true, textures: [`${namespace}:${iaInferredPath}`] }
              : { generate: false, model_path: `${namespace}:${iaInferredPath}` }
          }
        }
      }
    };
  }

  const zipBlob = await generateZIP(state);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = `xLib_Studio_Export_${foodData.id}.zip`;
  link.click();
}
