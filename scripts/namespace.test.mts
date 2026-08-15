import { parseUploadedFiles, generateZIP, isInternalNamespace, XFOODS_NAMESPACE } from '../src/lib/studio';
import JSZip from 'jszip';

const mkText = (rel: string, body: string) => ({
  name: rel.split('/').pop()!, webkitRelativePath: rel,
  text: async () => body,
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
});

console.log('--- FILTRO DE NAMESPACE INTERNO ---');
for (const n of ['_iainternal', '__iainternal', '_IAInternal', 'iainternal', 'rpx', 'xfoods', '']) {
  console.log(`  ${JSON.stringify(n).padEnd(16)} interno? ${isInternalNamespace(n)}`);
}

// Proyecto simulado: un pack propio (rpx), el interno de IA (_iainternal) y una comida
const files = [
  mkText('plugins/ItemsAdder/contents/rpx/configs/cosa.yml',
         'info:\n  namespace: rpx\nitems:\n  cosa:\n    display_name: "Cosa"\n'),
  mkText('plugins/ItemsAdder/contents/_iainternal/configs/interno.yml',
         'info:\n  namespace: _iainternal\nitems:\n  interno:\n    display_name: "NO DEBE APARECER"\n'),
  mkText('plugins/ItemsAdder/contents/_iainternal/resource_pack/assets/_iainternal/textures/item/x.png', 'fake'),
  mkText('plugins/xFoods/foods/pan.yml', 'display-name: "Pan"\nitem:\n  material: BREAD\n'),
];

const state = await parseUploadedFiles(files as any);
console.log('\n--- PARSEO ---');
console.log('  namespace autodetectado:', state.projectName);
console.log('  configs de IA:', Object.keys(state.iaItems).join(', ') || '(ninguno)');
console.log('  assets crudos:', state.rawFiles.map(f=>f.inferredPath).join(', ') || '(ninguno)');

const hayInterno = Object.keys(state.iaItems).some(k => isInternalNamespace(k.split('/')[0]))
  || state.rawFiles.some(f => f.inferredPath.includes('iainternal'));
console.log('  _iainternal filtrado:', !hayInterno);

const zip = await JSZip.loadAsync(Buffer.from(await (await generateZIP(state)).arrayBuffer()));
const enZip = Object.keys(zip.files).filter(n=>!n.endsWith('/'));
console.log('\n--- EXPORTACION ---');
enZip.forEach(n=>console.log('  '+n));
console.log('\n  el ZIP no lleva nada interno:', !enZip.some(n=>n.includes('iainternal')));
console.log('  namespace fijo de xFoods:', XFOODS_NAMESPACE);
