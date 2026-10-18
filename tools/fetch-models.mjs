// Descarga modelos CC0 de Poly Haven y los optimiza a GLB.
// Uso: npm run models
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const OUT = fileURLToPath(new URL('../public/models/', import.meta.url));
// id → [tamaño máximo de textura, proporción de vértices que se conserva]
const MODELS = {
  island_tree_01: [1024, 0.1], island_tree_02: [1024, 0.1], tree_small_02: [1024, 0.08],
  potted_plant_01: [1024, 0.6], potted_plant_02: [1024, 0.6], potted_plant_04: [1024, 0.6],
  searsia_lucida: [1024, 0.2],
  exterior_aircon_unit: [1024, 1], ceramic_vase_01: [512, 1],
  outdoor_table_chair_set_01: [1024, 1], modular_street_seating: [1024, 1],
  Sofa_01: [2048, 0.85], dining_table: [2048, 0.9], dining_chair_02: [2048, 0.9],
};
const json = async u => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const bin = async u => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return Buffer.from(await r.arrayBuffer()); };

await mkdir(OUT, { recursive: true });
const only = process.argv.slice(2);   // opcional: npm run models -- id1 id2
for (const [id, [tsize, ratio]] of Object.entries(MODELS)) {
  if (only.length && !only.includes(id)) continue;
  const files = await json(`https://api.polyhaven.com/files/${id}`);
  const g = (files.gltf?.['2k'] || files.gltf?.['1k'])?.gltf;
  if (!g) { console.warn('✗ sin glTF', id); continue; }
  const dir = join(tmpdir(), 'ph-models', id);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${id}.gltf`), await bin(g.url));
  for (const [path, f] of Object.entries(g.include || {})) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), await bin(f.url));
  }
  const args = ['gltf-transform', 'optimize', join(dir, `${id}.gltf`), join(OUT, `${id}.glb`),
    '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(tsize)];
  if (ratio < 1) args.push('--simplify', 'true', '--simplify-ratio', String(ratio), '--simplify-error', ratio <= 0.2 ? '0.02' : '0.004');
  else args.push('--simplify', 'false');
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { stdio: 'ignore', shell: process.platform === 'win32' });
  console.log('✓', id);
}
