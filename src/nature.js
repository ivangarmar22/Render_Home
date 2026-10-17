import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M, mat } from './materials.js';
import { fbm, noise3 } from './noise.js';
import { cyl, lathe } from './geom.js';
import { rnd } from './config.js';

const grp = () => new THREE.Group();
const _v = new THREE.Vector3(), _c = new THREE.Color(), _a = new THREE.Color(), _b = new THREE.Color();

// Paletas (sombra → luz)
export const GREENS = {
  leaf: [0x2f4a22, 0x86a457], olive: [0x55634a, 0xb3b896], cypress: [0x1f3520, 0x4d6b38],
  hedge: [0x324d24, 0x7e9c4c], shrub: [0x3a5527, 0x9ab066], lavender: [0x5b6150, 0x9a93b8],
};

// Deforma una geometría con ruido y la pinta con un degradado de sombra a luz
function organic(geo, { amp = 0.25, freq = 1.6, s = 1, palette = GREENS.leaf, bump = 0.07 }) {
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  _a.setHex(palette[0]); _b.setHex(palette[1]);
  let ymin = Infinity, ymax = -Infinity;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i);
    const n = fbm(_v.x * freq + s * 7.1, _v.y * freq + s * 3.3, _v.z * freq - s * 1.7, 3);
    const b = noise3(_v.x * 7 + s, _v.y * 7, _v.z * 7 - s) - 0.5;
    _v.multiplyScalar(1 + amp * (n - 0.5) * 2 + bump * b);
    p.setXYZ(i, _v.x, _v.y, _v.z);
    const h = (p.getY(i) - ymin) / Math.max(1e-6, ymax - ymin);
    _c.copy(_a).lerp(_b, Math.min(1, Math.max(0, h * 0.75 + (n - 0.5) * 1.4 + 0.15)));
    col.set([_c.r, _c.g, _c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

// masa de hojas orgánica
export function blob(g, r, x, y, z, { sy = 1, sx = 1, palette = GREENS.leaf, amp = 0.28, freq = 1.5, detail = 3 } = {}) {
  const geo = organic(new THREE.IcosahedronGeometry(1, detail), { amp, freq, s: rnd(0, 100), palette });
  geo.scale(r * sx, r * sy, r * sx);
  const me = new THREE.Mesh(geo, M.leaf);
  me.position.set(x, y, z);
  me.rotation.y = rnd(0, 6.28);
  g.add(me);
  return me;
}

// tronco curvado y ahusado
function trunk(g, h, r, bend = 0.25, x = 0, z = 0, lean = 0) {
  const geo = new THREE.CylinderGeometry(r * 0.55, r, h, 10, 8, true);
  const p = geo.attributes.position, ph = rnd(0, 6);
  for (let i = 0; i < p.count; i++) {
    const yy = p.getY(i) / h + 0.5;
    p.setX(i, p.getX(i) + Math.sin(yy * 2.4 + ph) * bend * yy + lean * yy * h);
    p.setZ(i, p.getZ(i) + Math.cos(yy * 1.7 + ph) * bend * 0.6 * yy);
  }
  geo.computeVertexNormals();
  const me = new THREE.Mesh(geo, M.bark);
  me.position.set(x, h / 2, z);
  g.add(me);
  return me;
}

export function tree(s = 1) {
  const g = grp();
  trunk(g, 2.2 * s, 0.13 * s, 0.25 * s);
  const n = 6 + Math.floor(rnd(0, 3));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.28 + rnd(-0.3, 0.3), d = rnd(0.25, 0.7) * s;
    blob(g, rnd(0.55, 0.85) * s, Math.cos(a) * d, (2.3 + rnd(-0.2, 0.7)) * s, Math.sin(a) * d, { sy: 0.85 });
  }
  blob(g, 0.8 * s, 0, 2.9 * s, 0, { sy: 0.9 });
  return g;
}

// olivo: tronco retorcido en varias ramas y copa plateada y ancha
export function olive(s = 1, withPlanter = true) {
  const g = grp();
  if (withPlanter) {
    lathe(g, [[0.82, 0], [0.82, 0.32], [0.74, 0.32], [0.74, 0.29], [0, 0.29]], 0, 0, 0, M.ext);
    cyl(g, 0.73, 0.73, 0.02, 0, 0.29, 0, M.earth);
  }
  for (let i = 0; i < 3; i++) trunk(g, 1.5 * s, 0.09 * s, 0.18 * s, rnd(-0.08, 0.08), rnd(-0.08, 0.08), (i - 1) * 0.18);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.28 + rnd(-0.3, 0.3), d = rnd(0.3, 0.9) * s;
    blob(g, rnd(0.45, 0.7) * s, Math.cos(a) * d, (1.75 + rnd(-0.15, 0.4)) * s, Math.sin(a) * d, { sy: 0.65, palette: GREENS.olive, amp: 0.35 });
  }
  return g;
}

export function cypress(h = 5) {
  const g = grp();
  trunk(g, 0.6, 0.1, 0);
  blob(g, 0.55, 0, h * 0.52, 0, { sy: h / 1.1, palette: GREENS.cypress, amp: 0.18, freq: 2.2 });
  return g;
}

export function shrub(s = 1, palette = GREENS.shrub) {
  const g = grp();
  const n = 2 + Math.floor(rnd(0, 3));
  for (let i = 0; i < n; i++) blob(g, rnd(0.25, 0.4) * s, rnd(-0.25, 0.25) * s, rnd(0.2, 0.35) * s, rnd(-0.25, 0.25) * s, { sy: 0.8, palette, detail: 2 });
  return g;
}

// seto recortado con superficie irregular
export function hedge(g, x0, z0, x1, z1, h, palette = GREENS.hedge) {
  const w = x1 - x0, d = z1 - z0;
  let geo = new RoundedBoxGeometry(1, 1, 1, 6, 0.18);
  geo.scale(w, h, d);
  geo = organic(geo, { amp: 0.04, freq: 2.5, s: rnd(0, 50), palette, bump: 0.05 });
  const me = new THREE.Mesh(geo, M.leaf);
  me.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
  g.add(me);
  return me;
}

// planta de interior con hojas grandes (tipo costilla de Adán / ficus)
const leafGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.12, 0.08, 0.14, 0.28, 0, 0.42);
  s.bezierCurveTo(-0.14, 0.28, -0.12, 0.08, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 8);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, -0.35 * y * y + 0.3 * x * x); }
  geo.computeVertexNormals();
  return geo;
})();
function leafColors(geo, hex) {
  const g = geo.clone(), c = new THREE.Color(hex), arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < g.attributes.position.count; i++) {
    const k = 0.75 + 0.35 * (g.attributes.position.getY(i) / 0.42);
    arr.set([c.r * k, c.g * k, c.b * k], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
export function pottedPlant(s = 1, kind = 'leafy') {
  const g = grp();
  const potM = kind === 'terra' ? M.terracotta : rnd() > 0.5 ? M.pot : M.potDark;
  const h = 0.4 * s, r = 0.19 * s;
  lathe(g, [[r * 0.75, 0], [r, h * 0.85], [r * 1.05, h], [r * 0.95, h], [0, h * 0.92]], 0, 0, 0, potM);
  if (kind === 'round') { blob(g, 0.32 * s, 0, h + 0.28 * s, 0, { palette: GREENS.shrub, detail: 2 }); return g; }
  const n = Math.round(9 * s + 4);
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + rnd(-0.2, 0.2), tilt = rnd(0.35, 0.95), len = rnd(0.3, 0.65) * s;
    const stem = new THREE.Group();
    stem.position.set(0, h, 0);
    stem.rotation.set(0, a, 0);
    const st = cyl(stem, 0.006, 0.008, len, 0, 0, 0, mat(0x4a6b33, { roughness: 0.7 }));
    st.rotation.z = -tilt * 0.6;
    st.position.set(Math.sin(tilt * 0.6) * len / 2, Math.cos(tilt * 0.6) * len / 2 - len / 2, 0);
    const lf = new THREE.Mesh(leafColors(leafGeo, rnd() > 0.5 ? 0x4b7a35 : 0x3b6a2c), M.leafSolid);
    lf.scale.setScalar(rnd(0.9, 1.4) * s);
    lf.position.set(Math.sin(tilt * 0.6) * len, Math.cos(tilt * 0.6) * len, 0);
    lf.rotation.set(-0.3, Math.PI / 2, -tilt);
    stem.add(lf);
    g.add(stem);
  }
  // Limita la planta a 0,4·s de radio para que no atraviese los muros cercanos.
  const b = new THREE.Box3().setFromObject(g), ext = Math.max(-b.min.x, b.max.x, -b.min.z, b.max.z);
  if (ext > 0.4 * s) g.scale.setScalar(0.4 * s / ext);
  return g;
}

// palmera: tronco anillado y corona de palmas arqueadas
const frondGeo = (() => {
  const g = new THREE.PlaneGeometry(2.3, 0.7, 18, 4);
  g.rotateX(-Math.PI / 2);
  g.translate(1.15, 0, 0);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), k = x / 2.3;
    const width = Math.sin(Math.min(1, k * 1.15) * Math.PI) * (1 - k * 0.35);
    p.setZ(i, z * width);
    p.setY(i, -0.9 * k * k - Math.abs(z * width) * 0.35);
    c.setHex(0x3f6b2e).lerp(new THREE.Color(0x8aa955), k * 0.7 + Math.abs(z) * 0.4);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();
export function palm(h = 6) {
  const g = grp(), lean = rnd(-0.06, 0.06), lz = rnd(-0.06, 0.06);
  const geo = new THREE.CylinderGeometry(0.15, 0.22, h, 12, 24, true), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = p.getY(i) / h + 0.5, ring = 1 + 0.06 * Math.sin(k * h * 9);
    p.setX(i, p.getX(i) * ring + lean * k * k * h);
    p.setZ(i, p.getZ(i) * ring + lz * k * k * h);
  }
  geo.computeVertexNormals();
  const tr = new THREE.Mesh(geo, M.bark);
  tr.position.y = h / 2;
  g.add(tr);
  const top = new THREE.Vector3(lean * h, h, lz * h);
  for (let i = 0; i < 16; i++) {
    const fr = new THREE.Mesh(frondGeo, M.leafSolid);
    fr.position.copy(top);
    fr.rotation.set(0, (i / 16) * Math.PI * 2 + rnd(-0.15, 0.15), rnd(-0.1, 0.55));
    fr.scale.setScalar(rnd(0.85, 1.15));
    g.add(fr);
  }
  blob(g, 0.28, top.x, top.y - 0.1, top.z, { palette: [0x5b4a32, 0x7a6448], detail: 1, amp: 0.2 });
  return g;
}
