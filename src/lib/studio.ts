import yaml from 'js-yaml';
import JSZip from 'jszip';

export interface StudioFile {
  name: string;
  content: string | ArrayBuffer;
  type: 'texture' | 'model' | 'config';
  inferredPath: string;
}

export const generateZIP = async (files: StudioFile[]): Promise<Blob> => {
  const zip = new JSZip();
  
  files.forEach(file => {
    zip.file(file.inferredPath, file.content);
  });
  
  return await zip.generateAsync({ type: 'blob' });
};

export const parseYaml = (content: string) => {
  try {
    return yaml.load(content);
  } catch (e) {
    console.error("Error parsing YAML", e);
    return null;
  }
};

export const stringifyYaml = (obj: any) => {
  return yaml.dump(obj, { indent: 2, lineWidth: -1 });
};
