"use client";

import { generateZIP, EcosystemState, stringifyYaml } from "@/lib/studio";

export async function exportEcosystem(projectState: EcosystemState) {
  const zipBlob = await generateZIP(projectState);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = `xLib_Studio_Export_${projectState.projectName}.zip`;
  link.click();
}
