import { emptyState, generateZIP, parseUploadedFiles } from '../src/lib/studio';
import JSZip from 'jszip';
import yaml from 'js-yaml';

// Regresión del bug: los bloques creados en la pestaña "Bloques" del Studio se guardaban bajo una
// clave raíz "blocks:" que ItemsAdder no reconoce — solo entiende "items:" (confirmado
// decompilando ItemsAdder_4.0.17.jar, ver comentario junto a currentIAKeyName en
// src/app/studio/page.tsx). Este test reproduce exactamente lo que handleCreateNew escribe hoy
// para un bloque nuevo y comprueba que lo exportado es lo que ItemsAdder de verdad carga.

const NS = 'rpx';
const FILE_ID = 'created_blocks';
const BLOCK_ID = 'ruby_ore';

const state = emptyState();
state.projectName = NS;
state.iaBlocks[`${NS}/${FILE_ID}`] = {
  info: { namespace: NS },
  items: {
    [BLOCK_ID]: {
      enabled: true,
      display_name: 'Ruby Ore',
      permission: `${NS}.block.${BLOCK_ID}`,
      resource: { material: 'PAPER', generate: true, textures: [`${NS}:block/${BLOCK_ID}`] },
      behaviours: {
        block: {
          placed_model: { type: 'REAL_NOTE' },
          hardness: 1.5,
          drop_when_mined: true,
        },
      },
    },
  },
};

const zip = await JSZip.loadAsync(Buffer.from(await (await generateZIP(state)).arrayBuffer()));
const path = `ItemsAdder/contents/${NS}/configs/blocks/${FILE_ID}.yml`;
const entry = zip.file(path);

console.log('--- EXPORTACION DE BLOQUE ---');
console.log('  fichero generado en', path + ':', !!entry);

if (!entry) {
  console.error('  FALLO: no se generó el fichero esperado.');
  process.exit(1);
}

const parsed = yaml.load(await entry.async('string')) as Record<string, unknown>;
const rootKeys = Object.keys(parsed);
console.log('  claves de nivel superior:', rootKeys.join(', '));

const tieneItems = 'items' in parsed && (parsed as any).items?.[BLOCK_ID];
const tieneBlocksInvalido = 'blocks' in parsed;

console.log('  usa la clave "items" (la que ItemsAdder reconoce):', !!tieneItems);
console.log('  NO usa la clave "blocks" (ItemsAdder la ignoraría por completo):', !tieneBlocksInvalido);

// Roundtrip: lo que exporta el Studio, reimportado, debe reconocerse de nuevo como bloque.
const buffer = await entry.async('arraybuffer');
const file = {
  name: `${FILE_ID}.yml`,
  webkitRelativePath: path,
  text: async () => Buffer.from(buffer).toString('utf8'),
  arrayBuffer: async () => buffer,
};
const reimported = await parseUploadedFiles([file] as any);
const roundtripOk = !!(reimported.iaBlocks[`${NS}/${FILE_ID}`] as any)?.items?.[BLOCK_ID];
console.log('  roundtrip (reimportar el export reconoce el bloque):', roundtripOk);

const ok = !!tieneItems && !tieneBlocksInvalido && roundtripOk;
console.log('\n  TEST', ok ? 'OK' : 'FALLO');
if (!ok) process.exit(1);
