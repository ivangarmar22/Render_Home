import * as THREE from 'three';
import { lite } from './config.js';

// Texturas CC0 de Poly Haven; se descargan con `npm run textures`.
const loader = new THREE.TextureLoader();
const BASE = import.meta.env.BASE_URL;
const texCache = new Map();

export const allTextures = () => [...texCache.values()];

// En escritorio, las superficies más visibles usan texturas 2K.
const HI = new Set(['wood', 'porc', 'plaster', 'roof', 'pave', 'grass', 'asphalt', 'oak', 'fabric', 'plinth']);
const texUrl = (key, map) => `${BASE}${!lite && HI.has(key) ? 'tex2k' : 'tex'}/${key}/${map}.jpg`;

function tex(key, map, repeat = 1) {
  const id = `${key}/${map}/${repeat}`;
  if (texCache.has(id)) return texCache.get(id);
  const t = loader.load(texUrl(key, map));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (repeat !== 1) t.repeat.set(repeat, repeat);
  if (map === 'diff') t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(id, t);
  return t;
}

// Material PBR. ts = metros que cubre la textura (las UV se generan a escala real).
function pbr(key, { color = 0xffffff, rough = 1, ns = 1, ts = 1, diff = true, arm = true, ao = 0.7, physical = false, ...o } = {}) {
  const C = physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const m = new C({ color, roughness: rough, metalness: 0, ...o });
  if (diff) m.map = tex(key, 'diff');
  m.normalMap = tex(key, 'nor');
  m.normalScale.set(ns, ns);
  if (arm) { const a = tex(key, 'arm'); m.roughnessMap = a; m.aoMap = a; m.aoMapIntensity = ao; }
  m.userData.ts = ts;
  return m;
}

// Aclara el difuso sin perder los matices de la textura.
function softened(key, amount, base = 236) {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  new THREE.ImageLoader().load(texUrl(key, 'diff'), img => {
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    let mean = 0;
    for (let i = 0; i < a.length; i += 4 * 97) mean += (a[i] + a[i + 1] + a[i + 2]) / 3;
    mean /= a.length / (4 * 97);
    for (let i = 0; i < a.length; i += 4) for (let k = 0; k < 3; k++) a[i + k] = Math.max(0, Math.min(255, base + (a[i + k] - mean) * amount));
    g.putImageData(d, 0, 0);
    t.needsUpdate = true;
  });
  texCache.set(key + '/soft', t);
  return t;
}

// Materiales lisos reutilizados (un único material por color y acabado)
const matCache = new Map();
export function mat(color, o = {}) {
  const id = color + JSON.stringify(o);
  if (!matCache.has(id)) matCache.set(id, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }));
  return matCache.get(id);
}

// Tejido con relieve y brillo aterciopelado (sheen), uno por color
const fabCache = new Map();
export function fabric(color, rep = 3) {
  const id = `${color}/${rep}`;
  if (!fabCache.has(id)) {
    fabCache.set(id, new THREE.MeshPhysicalMaterial({
      color, roughness: 1, normalMap: tex('fabric', 'nor', rep), normalScale: new THREE.Vector2(0.8, 0.8),
      roughnessMap: tex('fabric', 'arm', rep), sheen: 0.6, sheenRoughness: 0.75, sheenColor: new THREE.Color(0xffffff),
    }));
  }
  return fabCache.get(id);
}

// Texturas dibujadas: mármol de la escalera y aplacado cerámico de fachada (memoria de calidades)
function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const r = (a, b) => a + Math.random() * (b - a);
const marbleTex = canvasTex(1024, (g, s) => {
  g.fillStyle = '#efeeeb';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 30; i++) {
    let x = r(0, s), y = r(0, s), a = r(0, 6.28);
    g.strokeStyle = `rgba(${r(110, 150)},${r(110, 150)},${r(115, 155)},${r(0.08, 0.35)})`;
    g.lineWidth = r(0.6, 2.6);
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 60; k++) { a += r(-0.45, 0.45); x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); }
    g.stroke();
  }
});
const cladTex = canvasTex(1024, (g, s) => {
  const cols = 2, rows = 4, w = s / cols, h = s / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const v = Math.round(r(196, 210));
    g.fillStyle = `rgb(${v},${v},${v - 2})`;
    g.fillRect(i * w, j * h, w, h);
    for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(0,0,0,${r(0, 0.05)})`; g.fillRect(i * w + r(0, w), j * h + r(0, h), 2, 2); }
  }
  g.strokeStyle = 'rgba(70,70,72,.55)';
  g.lineWidth = 3;
  for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w, s); g.stroke(); }
  for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * h); g.lineTo(s, j * h); g.stroke(); }
});

// hojas: patrón en grises que se tiñe con el color de cada vértice (setos y arbustos)
const leafTex = canvasTex(512, (g, s) => {
  g.fillStyle = '#7d7d7d';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 3200; i++) {
    const v = Math.round(r(120, 255)), l = r(7, 15);
    g.save();
    g.translate(r(0, s), r(0, s));
    g.rotate(r(0, 6.28));
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath();
    g.ellipse(0, 0, l, l * 0.42, 0, 0, 6.28);
    g.fill();
    g.restore();
  }
});
leafTex.repeat.set(3, 3);

// gresite de la piscina: teselas de 2,5 cm en turquesas
const poolTex = canvasTex(512, (g, s) => {
  const n = 24, w = s / n;
  g.fillStyle = '#d9e6e8';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = `hsl(${r(186, 196)},${r(45, 65)}%,${r(52, 66)}%)`;
    g.fillRect(i * w + 1.5, j * w + 1.5, w - 3, w - 3);
  }
});

export const M = {
  marble: Object.assign(new THREE.MeshPhysicalMaterial({ map: marbleTex, roughness: 0.14, clearcoat: 0.6, clearcoatRoughness: 0.15 }), { userData: { ts: 1.2 } }),
  clad: Object.assign(new THREE.MeshStandardMaterial({ map: cladTex, roughness: 0.55 }), { userData: { ts: 2.4 } }),
  wall: pbr('plaster', { color: 0xf0ece6, ns: 0.6, ts: 2.5, diff: false, map: softened('plaster', 0.2) }),
  ext: pbr('plaster', { color: 0xf6f3ee, ns: 1.0, ts: 2.5, diff: false, map: softened('plaster', 0.28, 234) }),
  plinth: pbr('plinth', { color: 0xf2efe9, ts: 2.0, ns: 1.2 }),
  poolDeck: pbr('porc', { color: 0xfbf7f0, rough: 0.7, ts: 2.4 }),
  poolTile: Object.assign(new THREE.MeshStandardMaterial({ map: poolTex, roughness: 0.2 }), { userData: { ts: 0.75 } }),
  canvasOut: mat(0xf0ebe0, { side: THREE.DoubleSide, roughness: 0.95 }),
  hedgeStone: mat(0xd9d4cb, { roughness: 0.9 }),
  band: mat(0xd5d0c8, { roughness: 0.7 }), slab: mat(0xd3cfc7),
  concrete: pbr('garage', { color: 0xf2f0ec, ts: 3 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xe8f2f6, transparent: true, opacity: 0.14, roughness: 0.02, metalness: 0, depthWrite: false, envMapIntensity: 1.6 }),
  screen: new THREE.MeshPhysicalMaterial({ color: 0xeef6f8, transparent: true, opacity: 0.18, roughness: 0.02, depthWrite: false, envMapIntensity: 1.6 }),
  winDark: mat(0x26303a, { roughness: 0.05, metalness: 0.75 }),
  frame: mat(0x2b2e31, { roughness: 0.4, metalness: 0.5 }), alu: mat(0x3a3d40, { roughness: 0.35, metalness: 0.7 }),
  doorExt: mat(0x3b3d40, { roughness: 0.45, metalness: 0.35 }), shutter: mat(0x8e9296, { roughness: 0.5, metalness: 0.3 }),
  oak: pbr('oak', { rough: 0.85, ts: 1.2 }), teak: pbr('oak', { color: 0xa8957e, rough: 0.95, ts: 1.2 }),
  white: mat(0xebebe8, { roughness: 0.25 }), lacq: mat(0xe6e3dd, { roughness: 0.38 }),
  quartz: new THREE.MeshPhysicalMaterial({ color: 0xf2f0ec, roughness: 0.15, clearcoat: 0.4, clearcoatRoughness: 0.2 }),
  ceramic: new THREE.MeshPhysicalMaterial({ color: 0xfbfbfa, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }),
  dark: mat(0x2c2e31, { roughness: 0.55 }), metal: mat(0xb0b5ba, { roughness: 0.28, metalness: 0.85 }),
  black: mat(0x0f1012, { roughness: 0.12 }), steel: mat(0xc6cacd, { roughness: 0.2, metalness: 0.9 }),
  brass: mat(0xb08d57, { roughness: 0.3, metalness: 0.9 }),
  tv: new THREE.MeshPhysicalMaterial({ color: 0x07080a, roughness: 0.05, clearcoat: 1 }),
  mirror: mat(0xe3ebf0, { roughness: 0.02, metalness: 1 }),
  tubIn: mat(0xedf1f3, { roughness: 0.12 }), wardrobe: mat(0xe2ddd5, { roughness: 0.5 }),
  pot: mat(0xc9b9a3, { roughness: 0.9 }), terracotta: mat(0xb86f4c, { roughness: 0.9 }), potDark: mat(0x3d3b38, { roughness: 0.7 }),
  tire: mat(0x151515, { roughness: 0.9 }), carGlass: mat(0x1c252d, { roughness: 0.04, metalness: 0.7 }),
  light: new THREE.MeshStandardMaterial({ color: 0xfff6e6, emissive: 0xffe8c8, emissiveIntensity: 1.2 }),
  card: mat(0xc6a674), paint: mat(0xffffff), earth: mat(0x5e4a38, { roughness: 1 }),
  shade: new THREE.MeshPhysicalMaterial({ color: 0xf4ecdc, roughness: 0.9, sheen: 0.4 }),
  door: mat(0xf1efea, { roughness: 0.35 }),
  ground: mat(0xcdc6b6, { roughness: 1 }), under: mat(0x9c958a, { roughness: 1 }),
  water: new THREE.MeshPhysicalMaterial({ color: 0x46b9d8, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.55, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.02 }),
  linen: fabric(0xeee8dc, 2), fabricBeige: fabric(0xc9b393), fabricGrey: fabric(0x7c8288), fabricOut: fabric(0xe9e4d9),
  headboard: fabric(0xcbbfab),
  wood: pbr('wood', { rough: 0.9, ts: 2.0 }),
  bath: pbr('bath', { color: 0xf2efea, rough: 0.7, ts: 1.6 }), wallTile: pbr('wallTile', { rough: 0.5, ts: 1.4 }),
  roof: pbr('roof', { color: 0xf1ece4, ts: 2.4 }),
  pave: pbr('pave', { color: 0xf4efe8, ts: 2.6 }),
  grass: pbr('grass', { color: 0xc6dc9c, ts: 2.5, ns: 1.2 }), garage: pbr('garage', { ts: 3 }),
  asphalt: pbr('asphalt', { ts: 5 }),
  bark: pbr('bark', { color: 0xb8a58f, ts: 1, arm: false, rough: 0.95 }),
  leaf: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, map: leafTex }),
  leafSolid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }),
};
M.bark.userData.ts = 0;
M.stair = M.marble;
