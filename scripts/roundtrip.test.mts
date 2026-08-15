import { parseUploadedFiles, generateZIP } from '../src/lib/studio';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const CORE  = '/root/minecraft-dev/xFoods/xFoods/src/main/resources';
const CROPS = '/root/minecraft-dev/xFoods/xFoodsCrops/src/main/resources';

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// Simula los File del navegador con webkitRelativePath, como al arrastrar la carpeta plugins/
const mk = (abs: string, rel: string) => ({
  name: path.basename(abs),
  webkitRelativePath: rel,
  text: async () => fs.readFileSync(abs, 'utf8'),
  arrayBuffer: async () => { const b = fs.readFileSync(abs); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); },
});

const files = [
  ...walk(CORE).map(p  => mk(p, 'xFoods/' + path.relative(CORE, p))),
  ...walk(CROPS).map(p => mk(p, 'xFoodsCrops/' + path.relative(CROPS, p))),
];

const entradaYml = files.filter(f => f.webkitRelativePath.endsWith('.yml'))
                        .map(f => f.webkitRelativePath).sort();

const state = await parseUploadedFiles(files as any);
const blob  = await generateZIP(state);
const zip   = await JSZip.loadAsync(Buffer.from(await blob.arrayBuffer()));
const salidaYml = Object.keys(zip.files).filter(n => n.endsWith('.yml')).sort();

console.log('--- ESTADO PARSEADO ---');
console.log('  comidas:', Object.keys(state.foods).length);
console.log('  cultivos:', Object.keys(state.crops).length);
console.log('  estaciones:', Object.keys(state.machines).length);
console.log('  maceteros:', Object.keys(state.pods).length);
console.log('  automatizacion:', Object.keys(state.cropMachines).length);
console.log('  passthrough:', state.extraFiles.map(f => f.path).join(', ') || '(ninguno)');

const ignorables = (p: string) => p.endsWith('/plugin.yml') || p.includes('ItemsAdder/');
const esperados = entradaYml.filter(p => !ignorables(p));
const perdidos  = esperados.filter(p => !salidaYml.includes(p));
const extra     = salidaYml.filter(p => !esperados.includes(p) && !p.includes('ItemsAdder/'));

console.log('\n--- IDA Y VUELTA ---');
console.log('  .yml de entrada (sin plugin.yml):', esperados.length);
console.log('  .yml en el ZIP exportado:', salidaYml.length);
console.log('  PERDIDOS:', perdidos.length ? perdidos.join(', ') : 'ninguno');
console.log('  inesperados:', extra.length ? extra.join(', ') : 'ninguno');

// Comprobar que un fichero passthrough sale byte a byte igual
const cat = zip.file('xFoods/categories.yml');
if (cat) {
  const orig = fs.readFileSync(path.join(CORE, 'categories.yml'), 'utf8');
  console.log('  categories.yml intacto (comentarios incluidos):', (await cat.async('string')) === orig);
}
console.log('\n' + (perdidos.length === 0 ? 'OK: no se pierde ningun fichero.' : 'FALLO: hay perdidas.'));
