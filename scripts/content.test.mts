import { parseUploadedFiles, generateZIP } from '../src/lib/studio';
import fs from 'fs'; import path from 'path'; import JSZip from 'jszip'; import yaml from 'js-yaml';

const CORE='/root/minecraft-dev/xFoods/xFoods/src/main/resources';
const CROPS='/root/minecraft-dev/xFoods/xFoodsCrops/src/main/resources';
function walk(d:string,o:string[]=[]):string[]{ if(!fs.existsSync(d))return o;
  for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
    e.isDirectory()?walk(p,o):o.push(p);} return o; }
const mk=(abs:string,rel:string)=>({name:path.basename(abs),webkitRelativePath:rel,
  text:async()=>fs.readFileSync(abs,'utf8'),
  arrayBuffer:async()=>{const b=fs.readFileSync(abs);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}});

const files=[...walk(CORE).map(p=>mk(p,'xFoods/'+path.relative(CORE,p))),
             ...walk(CROPS).map(p=>mk(p,'xFoodsCrops/'+path.relative(CROPS,p)))];

const zip=await JSZip.loadAsync(Buffer.from(await (await generateZIP(await parseUploadedFiles(files as any))).arrayBuffer()));

// Compara el YAML original con el reexportado, campo a campo
const rutas:[string,string][]=[
  ['xFoods/foods/ingredientes/carne_cerdo_cruda.yml', CORE+'/foods/ingredientes/carne_cerdo_cruda.yml'],
  ['xFoods/foods/consumibles/hamburguesa_vaca.yml',   CORE+'/foods/consumibles/hamburguesa_vaca.yml'],
  ['xFoods/machines/plancha_hamburguesas.yml',        CORE+'/machines/plancha_hamburguesas.yml'],
  ['xFoodsCrops/species/tomate.yml',                  CROPS+'/species/tomate.yml'],
  ['xFoodsCrops/pods/macetero_hidroponico.yml',       CROPS+'/pods/macetero_hidroponico.yml'],
  ['xFoodsCrops/machines/iluminador.yml',             CROPS+'/machines/iluminador.yml'],
];
let fallos=0;
for(const [enZip,orig] of rutas){
  const f=zip.file(enZip);
  if(!f){console.log('FALTA en el zip:',enZip);fallos++;continue;}
  const a=yaml.load(fs.readFileSync(orig,'utf8'));
  const b=yaml.load(await f.async('string'));
  const igual=JSON.stringify(a)===JSON.stringify(b);
  console.log((igual?'OK  ':'DIFF')+'  '+enZip);
  if(!igual){fallos++; console.log('   orig:',JSON.stringify(a)); console.log('   zip :',JSON.stringify(b));}
}
console.log('\n'+(fallos===0?'OK: el contenido de cada fichero se conserva exacto.':fallos+' ficheros con diferencias.'));
