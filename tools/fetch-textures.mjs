// Descarga y optimiza texturas CC0 de Poly Haven.
// Uso: npm run textures
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = new URL('../public/', import.meta.url);

// clave → ids de Poly Haven, mapas, disponibilidad de 2K y mapas 4K
const TEXTURES = {
  wood: [['laminate_floor_02'], ['diff', 'nor', 'arm'], true],
  porc: [['marble_01'], ['diff', 'nor', 'arm'], true],
  bath: [['grey_tiles'], ['diff', 'nor', 'arm'], true],
  wallTile: [['long_white_tiles'], ['diff', 'nor', 'arm'], true],
  plaster: [['white_plaster_02'], ['diff', 'nor', 'arm'], true, true],
  roof: [['large_floor_tiles_02'], ['diff', 'nor', 'arm'], true],
  pave: [['rectangular_paving'], ['diff', 'nor', 'arm'], true],
  grass: [['leafy_grass'], ['diff', 'nor', 'arm'], true],
  garage: [['concrete_floor_worn_001'], ['diff', 'nor', 'arm'], true],
  asphalt: [['asphalt_02'], ['diff', 'nor', 'arm'], true],
  oak: [['oak_veneer_01'], ['diff', 'nor', 'arm'], true, true],
  fabric: [['fabric_pattern_05'], ['nor', 'arm'], true],
  bark: [['bark_willow_02', 'bark_brown_01', 'pine_bark', 'bark_willow'], ['diff', 'nor']],
  plinth: [['concrete_wall_008', 'rough_concrete', 'concrete_wall_004'], ['diff', 'nor', 'arm'], true],
};
const SKY = 'qwantani_late_afternoon_puresky';
const SIZE = {
  '1k': { diff: 1024, nor: 1024, arm: 512 },
  '2k': { diff: 2048, nor: 2048, arm: 1024 },
  '4k': { diff: 4096 },
};
const API_KEY = { diff: 'Diffuse', nor: 'nor_gl', arm: 'arm' };
const only = process.argv.slice(2);
const selected = Object.entries(TEXTURES).filter(([key]) => !only.length || only.includes(key));
const unknown = only.filter(key => !TEXTURES[key]);
if (unknown.length) throw new Error(`Texturas desconocidas: ${unknown.join(', ')}`);

const json = async u => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const bin = async u => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return Buffer.from(await r.arrayBuffer()); };

for (const [key, [ids, maps, hi, ultra]] of selected) {
  let files = null, used = null;
  for (const id of ids) {
    try { files = await json(`https://api.polyhaven.com/files/${id}`); used = id; break; } catch { /* siguiente */ }
  }
  if (!files) { console.warn('✗ no encontrada', key); continue; }
  for (const res of hi ? (ultra ? ['1k', '2k', '4k'] : ['1k', '2k']) : ['1k']) {
    const dirName = res === '4k' ? 'tex4k' : res === '2k' ? 'tex2k' : 'tex';
    const dir = new URL(`${dirName}/${key}/`, OUT);
    await mkdir(dir, { recursive: true });
    for (const m of maps.filter(map => res !== '4k' || map === 'diff')) {
      const url = files[API_KEY[m]]?.[res]?.jpg?.url;
      if (!url) { console.warn(`  · ${key}: sin mapa ${m} ${res}`); continue; }
      await sharp(await bin(url)).resize(SIZE[res][m], SIZE[res][m]).jpeg({ quality: m === 'nor' ? 88 : 82, mozjpeg: true })
        .toFile(fileURLToPath(new URL(`${m}.jpg`, dir)));
    }
  }
  console.log('✓', key, '←', used, hi ? (ultra ? '(1K + 2K + 4K)' : '(1K + 2K)') : '(1K)');
}

if (only.length) process.exit(0);

const sky = await json(`https://api.polyhaven.com/files/${SKY}`);
const skyDir = new URL('sky/', OUT);
await mkdir(skyDir, { recursive: true });
const p = f => fileURLToPath(new URL(f, skyDir));
await writeFile(p('sky.hdr'), await bin(sky.hdri['1k'].hdr.url));
await sharp(await bin(sky.tonemapped.url)).resize(2048, 1024).jpeg({ quality: 84, mozjpeg: true }).toFile(p('sky.jpg'));
console.log('✓ cielo', SKY);
