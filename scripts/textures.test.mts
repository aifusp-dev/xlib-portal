import { sanitizePath } from '../src/lib/studio';

/** Réplica de la lógica de nombrado de texturas de handleModelUpload. */
function nombrar(modelTextures: Record<string,string>, modelName: string, pngs: string[]) {
  const nombreBase = (v: unknown) => sanitizePath(String(v).split('/').pop() || String(v)).replace('.png','');
  const imagenesDistintas = new Set(Object.values(modelTextures).map(nombreBase));
  const usarSufijo = imagenesDistintas.size > 1;

  const map: Record<string,string> = {};
  const refsFinales: Record<string,string> = {};
  for (const k of Object.keys(modelTextures)) {
    const original = nombreBase(modelTextures[k]);
    const nuevo = usarSufijo ? `${modelName}_${original}` : modelName;
    map[original] = nuevo;
    refsFinales[k] = nuevo;
  }
  const esperadas = new Set(Object.values(map));
  const guardados = pngs.map(f => {
    const original = sanitizePath(f).replace('.png','');
    return map[original] || (esperadas.size <= 1 ? modelName : original);
  });
  return { refsFinales, guardados, esperadas: [...esperadas] };
}

const casos: [string, Record<string,string>, string[]][] = [
  ['Blockbench típico: textura + particle duplicada (TU CASO)',
   { '2': 'xfoods:item/food/grandtasty', particle: 'xfoods:item/food/grandtasty' }, ['grandtasty.png']],
  ['El PNG subido tiene otro nombre',
   { '1': 'algo:item/burger_tex' }, ['mi_textura_final.png']],
  ['Dos texturas de verdad',
   { '0': 'ns:item/pan', '1': 'ns:item/carne' }, ['pan.png', 'carne.png']],
];

let fallos = 0;
for (const [titulo, texturas, pngs] of casos) {
  const r = nombrar(texturas, 'hamburguesa_vaca', pngs);
  const refs = [...new Set(Object.values(r.refsFinales))].sort();
  const files = [...new Set(r.guardados)].sort();
  const ok = JSON.stringify(refs) === JSON.stringify(files);
  if (!ok) fallos++;
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${titulo}`);
  console.log(`        modelo referencia: ${refs.join(', ')}`);
  console.log(`        ficheros guardados: ${files.join(', ')}`);
}
console.log('\n' + (fallos === 0
  ? 'OK: en todos los casos el modelo apunta a las texturas que se guardan.'
  : `${fallos} casos con desajuste.`));
