/** Réplica de cómo queda 'resource' según el orden en que se suban modelo y textura. */
type Resource = { material?: string; generate?: boolean; textures?: string[]; model_path?: string };

function subir(resource: Resource, ficheros: string[], ns='xfoods', carpeta='item/food', nombre='hamburguesa_vaca') {
  const texturasSubidas: string[] = [];
  for (const f of ficheros) {
    if (f.endsWith('.json')) {
      resource.model_path = `${ns}:${carpeta}/${nombre}`;
    } else if (f.endsWith('.png')) {
      texturasSubidas.push(`${ns}:${carpeta}/${nombre}`);
    }
  }
  // --- lógica nueva: se decide al final por la presencia de modelo ---
  if (resource.model_path) {
    resource.generate = false;
    delete resource.textures;
  } else if (texturasSubidas.length > 0) {
    resource.generate = true;
    resource.textures = [texturasSubidas[0]];
  }
  return resource;
}

// Estado tras activar la integración de ItemsAdder en una comida
const inicial = (): Resource => ({ material: 'BREAD', generate: true, textures: ['xfoods:item/food/hamburguesa_vaca'] });

const casos: [string, string[][]][] = [
  ['modelo y textura a la vez',              [['modelo.json','tex.png']]],
  ['primero el modelo, luego la textura',    [['modelo.json'], ['tex.png']]],
  ['primero la textura, luego el modelo',    [['tex.png'], ['modelo.json']]],
  ['re-subir solo la textura (TU CASO)',     [['modelo.json','tex.png'], ['tex.png']]],
  ['solo textura, sin modelo 3D',            [['tex.png']]],
];

let fallos = 0;
for (const [titulo, pasos] of casos) {
  const r = inicial();
  pasos.forEach(p => subir(r, p));
  const conModelo = !!r.model_path;
  const ok = conModelo ? (r.generate === false && !r.textures)
                       : (r.generate === true && !!r.textures);
  if (!ok) fallos++;
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${titulo}`);
  console.log(`        generate=${r.generate}  model_path=${r.model_path ?? '—'}  textures=${r.textures ? r.textures.join(',') : '—'}`);
}
console.log('\n' + (fallos === 0
  ? 'OK: con modelo propio siempre generate:false y sin textures sueltas.'
  : `${fallos} casos incorrectos.`));
