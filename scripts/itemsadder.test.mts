import { parseUploadedFiles, generateZIP } from '../src/lib/studio';
import fs from 'fs'; import path from 'path'; import JSZip from 'jszip'; import yaml from 'js-yaml';

const CORE='/root/minecraft-dev/xFoods/xFoods/src/main/resources';
function walk(d:string,o:string[]=[]):string[]{ if(!fs.existsSync(d))return o;
  for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
    e.isDirectory()?walk(p,o):o.push(p);} return o; }
const mk=(abs:string,rel:string)=>({name:path.basename(abs),webkitRelativePath:rel,
  text:async()=>fs.readFileSync(abs,'utf8'),
  arrayBuffer:async()=>{const b=fs.readFileSync(abs);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}});

const files = walk(CORE).map(p=>mk(p,'xFoods/'+path.relative(CORE,p)));
const state = await parseUploadedFiles(files as any);

console.log('--- PARSEO DE ITEMSADDER ---');
console.log('  namespace detectado:', state.projectName);
console.log('  configs de items:', Object.keys(state.iaItems).join(', ') || '(ninguno)');
console.log('  bloques:', Object.keys(state.iaBlocks).length);
console.log('  muebles:', Object.keys(state.iaFurnitures).length);
console.log('  assets crudos (png/json):');
state.rawFiles.forEach(f=>console.log('     '+f.inferredPath));

const zip=await JSZip.loadAsync(Buffer.from(await (await generateZIP(state)).arrayBuffer()));
const iaEnZip=Object.keys(zip.files).filter(n=>n.includes('ItemsAdder')&&!n.endsWith('/')).sort();
console.log('\n--- EXPORTACION ---');
iaEnZip.forEach(n=>console.log('  '+n));

// El sync descomprime en plugins/, asi que la ruta debe ser la que ItemsAdder lee de verdad
const ok = iaEnZip.every(n=>n.startsWith('ItemsAdder/contents/'));
console.log('\n  rutas correctas para plugins/ItemsAdder/contents/:', ok);

// El remapeo de texturas del modelo 3D
const modelo = iaEnZip.find(n=>n.endsWith('.json'));
if (modelo) {
  const j = JSON.parse(await zip.file(modelo)!.async('string'));
  console.log('  texturas del modelo tras remapear:', JSON.stringify(j.textures));
}
// El config yml debe seguir apuntando al modelo
const cfg = iaEnZip.find(n=>n.endsWith('.yml'));
if (cfg) {
  const y:any = yaml.load(await zip.file(cfg)!.async('string'));
  const items = y.items || {};
  for (const [k,v] of Object.entries<any>(items)) {
    console.log(`  item '${k}': resource=`, JSON.stringify(v.resource));
  }
}

// --- fidelidad: yaml, modelo json y textura binaria ---
console.log('\n--- FIDELIDAD ---');
const IA=CORE+'/ItemsAdder/contents/rpx';
const cmpYaml=(a:string,b:string)=>JSON.stringify(yaml.load(a))===JSON.stringify(yaml.load(b));

const yOrig=fs.readFileSync(IA+'/configs/starbucks/capsula_cafe.yml','utf8');
const yZip=await zip.file('ItemsAdder/contents/rpx/configs/starbucks/capsula_cafe.yml')!.async('string');
console.log('  config yml equivalente:', cmpYaml(yOrig,yZip));

const jOrig=JSON.parse(fs.readFileSync(IA+'/resource_pack/assets/rpx/models/item/food/capsula_cafe.json','utf8'));
const jZip=JSON.parse(await zip.file('ItemsAdder/contents/rpx/resource_pack/assets/rpx/models/item/food/capsula_cafe.json')!.async('string'));
console.log('  modelo json equivalente:', JSON.stringify(jOrig)===JSON.stringify(jZip));
console.log('    elementos:', jZip.elements?.length, '| display keys:', Object.keys(jZip.display||{}).length);

const pOrig=fs.readFileSync(IA+'/resource_pack/assets/rpx/textures/item/food/capsula_cafe.png');
const pZip=Buffer.from(await zip.file('ItemsAdder/contents/rpx/resource_pack/assets/rpx/textures/item/food/capsula_cafe.png')!.async('nodebuffer'));
console.log('  textura png byte a byte:', pOrig.equals(pZip), `(${pOrig.length} bytes)`);
