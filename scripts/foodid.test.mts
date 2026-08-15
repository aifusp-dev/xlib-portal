import { parseUploadedFiles, leafId, XFOODS_NAMESPACE, isInternalNamespace } from '../src/lib/studio';

const mk = (rel: string, body: string) => ({
  name: rel.split('/').pop()!, webkitRelativePath: rel,
  text: async () => body,
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
});

// Reproduce el caso real: comida en subcarpeta + el namespace interno presente en el proyecto
const files = [
  mk('plugins/xFoods/foods/consumibles/hamburguesa_cerdo.yml',
     'display-name: "Hamburguesa de Cerdo"\nitem:\n  material: BREAD\n'),
  mk('plugins/xFoods/foods/ingredientes/queso.yml',
     'display-name: "Queso"\nitem:\n  material: HONEYCOMB\n'),
  mk('plugins/ItemsAdder/contents/_iainternal/configs/x.yml',
     'info:\n  namespace: _iainternal\nitems:\n  x:\n    display_name: "interno"\n'),
];

const state = await parseUploadedFiles(files as any);

console.log('--- CLAVES DEL STUDIO (rutas, para reescribir el fichero) ---');
Object.keys(state.foods).forEach(k => console.log('  ' + k));

console.log('\n--- IDENTIDAD (lo que el plugin registra y las recetas usan) ---');
Object.keys(state.foods).forEach(k => console.log(`  ${k}  ->  ${leafId(k)}`));

console.log('\n--- NAMESPACE ---');
console.log('  autodetectado (era la fuente del bug):', state.projectName);
console.log('  _iainternal se cuela como projectName?:', isInternalNamespace(state.projectName));
console.log('  namespace usado para comidas:', XFOODS_NAMESPACE);

// Simula lo que escribe el toggle de ItemsAdder con el codigo nuevo
const selectedItem = 'consumibles/hamburguesa_cerdo';
const itemId = leafId(selectedItem);
const generado = {
  info: { namespace: XFOODS_NAMESPACE },
  items: {
    [itemId]: {
      permission: `${XFOODS_NAMESPACE}.${itemId}`,
      resource: { textures: [`${XFOODS_NAMESPACE}:item/food/${itemId}`] },
    },
  },
};
console.log('\n--- CONFIG DE ITEMSADDER GENERADO ---');
console.log(JSON.stringify(generado, null, 2).split('\n').map(l=>'  '+l).join('\n'));

const clave = Object.keys(generado.items)[0];
console.log('\n  nombre de item sin "/":', !clave.includes('/'));
console.log('  namespace correcto:', generado.info.namespace === 'xfoods');
console.log('  itemsadder-id que iria al YAML de la comida:', `${XFOODS_NAMESPACE}:${itemId}`);
