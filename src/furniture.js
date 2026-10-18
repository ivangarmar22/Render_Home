import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M, mat, fabric } from './materials.js';
import { box, rbox, cyl, lathe, sphere } from './geom.js';
import { rnd, detailedQuality } from './config.js';

// Respaldos y cabeceros miran a -z; ry: π/2 oeste, -π/2 este, π sur.
export const grp = () => new THREE.Group();
export const put = (g, o, x, z, ry = 0, y = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };

const leg = (g, x, z, h, m = M.dark, r = 0.018) => cyl(g, r * 0.7, r, h, x, 0, z, m, 12);
// cilindro horizontal centrado en (x, y, z), a lo largo de x o de z
function hcyl(g, r, len, x, y, z, m, axis = 'x', seg = 10) {
  const me = cyl(g, r, r, len, 0, 0, 0, m, seg);
  if (axis === 'x') me.rotation.z = Math.PI / 2; else me.rotation.x = Math.PI / 2;
  me.position.set(x, y, z);
  return me;
}

// Dormitorio
function duvet(g, w, d, y, z, material) {
  const geometry = new THREE.PlaneGeometry(w, d, 36, 44);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), v = positions.getY(i) / d + 0.5, u = x / w + 0.5;
    const broadFold = Math.sin((u * 2.2 + v * 1.4) * Math.PI) * Math.sin(v * Math.PI);
    const fineFold = Math.sin((u * 8.5 - v * 5.2) * Math.PI) * 0.005;
    positions.setZ(i, 0.004 + broadFold * 0.022 + fineFold);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  const cover = new THREE.Mesh(geometry, material);
  cover.rotation.x = -Math.PI / 2;
  cover.position.set(0, y, z);
  g.add(cover);
}

export function bed(w, l, col) {
  const g = grp();
  const coverColor = col;
  const throwColor = detailedQuality ? 0xb9aa94 : 0xd8cdb8;
  const accentColor = detailedQuality ? 0xd8cec0 : 0xa86f4f;
  const frameMaterial = detailedQuality ? M.oakDark : M.oak;
  rbox(g, -w / 2, 0.08, -l / 2, w / 2, 0.3, l / 2, frameMaterial, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, sx * (w / 2 - 0.08), sz * (l / 2 - 0.08), 0.08, detailedQuality ? frameMaterial : M.dark);
  rbox(g, -w / 2 + 0.03, 0.3, -l / 2 + 0.04, w / 2 - 0.03, 0.53, l / 2 - 0.03, detailedQuality ? M.linen : M.white, 0.07, 4);
  rbox(g, -w / 2 - 0.02, 0.48, -l / 2 + 0.6, w / 2 + 0.02, 0.585, l / 2 + 0.04, fabric(coverColor), 0.07, 5);
  if (detailedQuality) duvet(g, w - 0.04, l - 0.58, 0.586, 0.31, fabric(coverColor));
  rbox(g, -w / 2 - 0.015, 0.5, l / 2 - 0.62, w / 2 + 0.015, 0.6, l / 2 - 0.12, fabric(throwColor), 0.04, 4);
  const n = w > 1.3 ? 2 : 1, pw = (w - 0.16) / n;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + 0.08 + (i + 0.5) * pw;
    if (detailedQuality) {
      const pillow = rbox(g, cx - pw * 0.43, 0.59, -l / 2 + 0.13, cx + pw * 0.43, 0.72, -l / 2 + 0.43, fabric(0xded7ca), 0.055, 5);
      pillow.rotation.x = -0.12;
      pillow.rotation.z = i === 0 ? -0.035 : 0.035;
    } else {
      sphere(g, 1, cx, 0.62, -l / 2 + 0.28, fabric(0xf4f1ea), pw * 0.45, 0.09, 0.2).rotation.x = -0.25;
    }
  }
  if (detailedQuality) {
    const accent = rbox(g, w * 0.12 - 0.15, 0.65, -l / 2 + 0.42, w * 0.12 + 0.15, 0.77, -l / 2 + 0.64, fabric(accentColor), 0.05, 5);
    accent.rotation.x = -0.1;
    accent.rotation.z = -0.12;
  } else {
    sphere(g, 1, w * 0.12, 0.66, -l / 2 + 0.48, fabric(accentColor), 0.2, 0.08, 0.13).rotation.x = -0.5;
  }
  rbox(g, -w / 2 - 0.06, 0.12, -l / 2 - 0.1, w / 2 + 0.06, 1.15, -l / 2, M.headboard, 0.04, 4);
  return g;
}
export function nightstand() {
  const g = grp();
  const finish = detailedQuality ? M.oakDark : M.oak;
  const hardware = detailedQuality ? M.steel : M.dark;
  rbox(g, -0.23, 0.12, -0.2, 0.23, 0.5, 0.2, finish, 0.015);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, sx * 0.19, sz * 0.16, 0.12, detailedQuality ? M.lacq : M.dark, 0.012);
  box(g, -0.2, 0.31, 0.2, 0.2, 0.312, 0.202, hardware);
  lathe(g, [[0.07, 0], [0.08, 0.02], [0.05, 0.12], [0.06, 0.2], [0.012, 0.32], [0, 0.32]], 0.05, 0.5, -0.05, M.ceramic, 24);
  lathe(g, [[0.15, 0], [0.11, 0.2], [0.105, 0.2], [0.145, 0]], 0.05, 0.75, -0.05, M.shade, 32);
  box(g, -0.17, 0.5, 0.0, -0.03, 0.53, 0.14, fabric(0x6b5a4a));
  return g;
}
// armario con puertas correderas (memoria de calidades)
export function wardrobe(w, d = 0.6, h = 2.4, m = M.wardrobe) {
  const g = grp();
  box(g, -w / 2, 0, -d / 2, w / 2, h, d / 2 - 0.04, m);
  const n = Math.max(2, Math.round(w / 0.9)), pw = w / n;
  for (let i = 0; i < n; i++) {
    const z = d / 2 - (i % 2 ? 0.04 : 0.015);
    box(g, -w / 2 + i * pw + 0.004, 0.02, z - 0.022, -w / 2 + (i + 1) * pw - 0.004, h - 0.02, z, m);
    box(g, -w / 2 + i * pw + (i % 2 ? pw - 0.07 : 0.05), h * 0.38, z, -w / 2 + i * pw + (i % 2 ? pw - 0.05 : 0.07), h * 0.38 + 0.4, z + 0.006, M.dark);
  }
  return g;
}
// vestidor abierto: baldas, barra, perchas con ropa y cajas
const CLOTH = [0x2f3e4f, 0xd8d2c4, 0x8a6d55, 0xf2efe8, 0x5c6b52, 0xa6413a, 0x1f2328, 0xc7b9a0, 0x6e7f99];
export function openWardrobe(w, d = 0.5, h = 2.4) {
  const g = grp();
  const wood = detailedQuality ? M.oakDark : M.oak;
  box(g, -w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.02, wood);
  box(g, -w / 2, 0, -d / 2, -w / 2 + 0.025, h, d / 2, wood);
  box(g, w / 2 - 0.025, 0, -d / 2, w / 2, h, d / 2, wood);
  box(g, -w / 2 + 0.6, 0, -d / 2, -w / 2 + 0.625, h, d / 2, wood);
  box(g, -w / 2, h - 0.025, -d / 2, w / 2, h, d / 2, wood);
  for (const y of [0.32, 1.95]) box(g, -w / 2, y, -d / 2, w / 2, y + 0.025, d / 2, wood);
  for (const y of [0.75, 1.2, 1.6]) box(g, -w / 2, y, -d / 2, -w / 2 + 0.6, y + 0.02, d / 2, wood);
  hcyl(g, 0.012, w - 0.66, 0.3, 1.85, 0, M.metal, 'x');
  for (let x = -w / 2 + 0.68; x < w / 2 - 0.06; x += rnd(0.05, 0.08)) {
    const len = rnd(0.65, 1.15), col = CLOTH[Math.floor(rnd(0, CLOTH.length))];
    rbox(g, x, 1.83 - len, -d / 2 + 0.07, x + 0.035, 1.83, d / 2 - 0.06, fabric(col, 2), 0.012, 2);
  }
  for (const y of [0.345, 0.77, 1.22]) for (let x = -w / 2 + 0.05; x < -w / 2 + 0.55; x += 0.27) {
    rbox(g, x, y, -d / 2 + 0.06, x + 0.24, y + rnd(0.1, 0.22), d / 2 - 0.08, fabric(CLOTH[Math.floor(rnd(0, CLOTH.length))], 2), 0.02, 2);
  }
  for (let x = -w / 2 + 0.7; x < w / 2 - 0.3; x += 0.25) rbox(g, x, 0.07, -d / 2 + 0.1, x + 0.2, 0.17, d / 2 - 0.12, mat(rnd() > 0.5 ? 0x2a2a2a : 0x8a6a4c, { roughness: 0.5 }), 0.03);
  for (let x = -w / 2 + 0.06; x < w / 2 - 0.4; x += 0.42) rbox(g, x, 1.975, -d / 2 + 0.04, x + 0.36, 2.2, d / 2 - 0.06, M.card, 0.01);
  return g;
}

// Salón y comedor
export function sofa(w, d, m) {
  const g = grp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, sx * (w / 2 - 0.08), sz * (d / 2 - 0.08), 0.1, M.dark, 0.02);
  rbox(g, -w / 2, 0.1, -d / 2, w / 2, 0.4, d / 2, m, 0.06, 4);
  rbox(g, -w / 2, 0.1, -d / 2, w / 2, 0.78, -d / 2 + 0.2, m, 0.08, 4);
  rbox(g, -w / 2, 0.1, -d / 2, -w / 2 + 0.18, 0.6, d / 2, m, 0.08, 4);
  rbox(g, w / 2 - 0.18, 0.1, -d / 2, w / 2, 0.6, d / 2, m, 0.08, 4);
  const n = w > 1.4 ? (w > 2 ? 3 : 2) : 1, cw = (w - 0.36) / n;
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.18 + i * cw;
    rbox(g, x0 + 0.006, 0.38, -d / 2 + 0.2, x0 + cw - 0.006, 0.53, d / 2 - 0.02, m, 0.07, 4);
    rbox(g, x0 + 0.01, 0.5, -d / 2 + 0.17, x0 + cw - 0.01, 0.9, -d / 2 + 0.4, m, 0.1, 4).rotation.x = -0.12;
  }
  return g;
}
// sofá en L: tramo de 2,60 m y chaise longue en el extremo +x (local)
export function lSofa(m) {
  const g = grp(), w = 2.6, d = 0.95, cl = 1.65;
  box(g, -w / 2 + 0.05, 0, -d / 2 + 0.05, w / 2 - 0.05, 0.1, d / 2 - 0.05, M.dark);
  box(g, w / 2 - 0.88, 0, d / 2 - 0.05, w / 2 - 0.05, 0.1, -d / 2 + cl - 0.05, M.dark);
  rbox(g, -w / 2, 0.1, -d / 2, w / 2, 0.4, d / 2, m, 0.06, 4);
  rbox(g, w / 2 - 0.92, 0.1, d / 2 - 0.12, w / 2, 0.4, -d / 2 + cl, m, 0.06, 4);
  rbox(g, -w / 2, 0.1, -d / 2, w / 2, 0.76, -d / 2 + 0.2, m, 0.08, 4);
  rbox(g, -w / 2, 0.1, -d / 2, -w / 2 + 0.18, 0.6, d / 2, m, 0.08, 4);
  for (let i = 0; i < 3; i++) {
    const x0 = -w / 2 + 0.18 + i * 0.8;
    rbox(g, x0 + 0.006, 0.38, -d / 2 + 0.2, x0 + 0.795, 0.53, d / 2 - 0.02, m, 0.07, 4);
    rbox(g, x0 + 0.01, 0.48, -d / 2 + 0.17, x0 + 0.79, 0.9, -d / 2 + 0.42, m, 0.1, 4).rotation.x = -0.12;
  }
  rbox(g, w / 2 - 0.9, 0.38, d / 2 - 0.04, w / 2 - 0.01, 0.53, -d / 2 + cl - 0.02, m, 0.07, 4);
  sphere(g, 1, -0.75, 0.66, -d / 2 + 0.36, fabric(0xa86f4f), 0.22, 0.2, 0.08).rotation.z = 0.15;
  sphere(g, 1, -0.35, 0.65, -d / 2 + 0.36, fabric(0xe9e3d6), 0.2, 0.18, 0.08).rotation.z = -0.1;
  sphere(g, 1, 0.75, 0.66, -d / 2 + 0.36, fabric(0x7b8a6a), 0.22, 0.2, 0.08).rotation.z = -0.15;
  rbox(g, -1.2, 0.53, -0.1, -0.7, 0.56, 0.4, fabric(0xd8cbb3, 4), 0.02).rotation.y = 0.2;
  return g;
}
export function table(w, l, h = 0.75, top = M.oak, legM = M.dark) {
  const g = grp();
  rbox(g, -w / 2, h - 0.04, -l / 2, w / 2, h, l / 2, top, 0.012);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, sx * (w / 2 - 0.08), sz * (l / 2 - 0.08), h - 0.04, legM, 0.025);
  return g;
}
export function chair(m = M.oak, seat = null) {
  const g = grp();
  rbox(g, -0.21, 0.43, -0.21, 0.21, 0.47, 0.21, m, 0.02);
  if (seat) rbox(g, -0.19, 0.47, -0.19, 0.19, 0.51, 0.19, seat, 0.02);
  const back = rbox(g, -0.2, 0.0, -0.02, 0.2, 0.3, 0.02, m, 0.015);
  back.position.set(0, 0.68, -0.2);
  back.rotation.x = -0.12;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, sx * 0.18, sz * 0.18, 0.43, M.dark, 0.016);
  for (const sx of [-1, 1]) box(g, sx * 0.18 - 0.012, 0.45, -0.22, sx * 0.18 + 0.012, 0.85, -0.19, M.dark);
  return g;
}
export function dining(w, l, perSide, cm = M.oak, seat = null) {
  const g = table(w, l), step = l / perSide;
  for (let i = 0; i < perSide; i++) {
    const z = -l / 2 + step * (i + 0.5);
    put(g, chair(cm, seat), -w / 2 - 0.12, z, Math.PI / 2);
    put(g, chair(cm, seat), w / 2 + 0.12, z, -Math.PI / 2);
  }
  return g;
}
export function coffeeTable(w, d) {
  const g = grp();
  const wood = detailedQuality ? M.oakDark : M.oak;
  rbox(g, -w / 2, 0.34, -d / 2, w / 2, 0.38, d / 2, wood, 0.02);
  rbox(g, -w / 2 + 0.05, 0.1, -d / 2 + 0.05, w / 2 - 0.05, 0.12, d / 2 - 0.05, wood, 0.01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(g, sx * (w / 2 - 0.06), sz * (d / 2 - 0.06), 0.34, M.dark, 0.015);
  books(g, -w / 4, 0.38, 0, 3);
  vase(g, w / 4, 0.38, 0, 0.6);
  return g;
}
// mueble bajo largo de roble con frentes ranurados (trasera contra la pared en -z)
export function woodUnit(w, d = 0.4, h = 0.45, finish = detailedQuality ? M.oakDark : M.oak) {
  const g = grp();
  const wood = finish;
  box(g, -w / 2 + 0.05, 0, -d / 2 + 0.04, w / 2 - 0.05, 0.08, d / 2 - 0.04, M.dark);
  box(g, -w / 2, 0.08, -d / 2, w / 2, 0.08 + h, d / 2 - 0.01, wood);
  for (let x = -w / 2 + 0.02; x < w / 2 - 0.02; x += 0.035) box(g, x, 0.1, d / 2 - 0.01, x + 0.022, 0.06 + h, d / 2, wood);
  vase(g, -w / 2 + 0.25, 0.08 + h, 0, 0.9);
  books(g, w / 2 - 0.35, 0.08 + h, 0, 4);
  return g;
}
export function tvPanel(w = 1.45, h = 0.83, y0 = 1.0) {
  const g = grp();
  rbox(g, -w / 2, y0, -0.035, w / 2, y0 + h, 0.0, M.black, 0.006);
  box(g, -w / 2 + 0.012, y0 + 0.012, 0.0, w / 2 - 0.012, y0 + h - 0.012, 0.001, M.tv);
  return g;
}
export function rug(w, d, col) { const g = grp(); rbox(g, -w / 2, 0, -d / 2, w / 2, 0.015, d / 2, fabric(col, 7), 0.006, 2); return g; }
export function floorLamp() {
  const g = grp();
  cyl(g, 0.16, 0.17, 0.025, 0, 0, 0, M.dark, 32);
  cyl(g, 0.012, 0.012, 1.45, 0, 0.02, 0, M.brass, 12);
  lathe(g, [[0.24, 0], [0.17, 0.3], [0.165, 0.3], [0.235, 0]], 0, 1.35, 0, M.shade, 36);
  return g;
}

// Decoración
const BOOK = [0x8a3b2e, 0x2f4b63, 0xd9cbb0, 0x3c3c3c, 0x6e7f5a, 0xb58a4a];
function books(g, x, y, z, n = 4) {
  let yy = y;
  for (let i = 0; i < n; i++) {
    const w = rnd(0.16, 0.24), h = rnd(0.025, 0.045), d = rnd(0.12, 0.17);
    const b = rbox(g, x - w / 2, yy, z - d / 2, x + w / 2, yy + h, z + d / 2, mat(BOOK[i % BOOK.length], { roughness: 0.7 }), 0.004, 1);
    b.rotation.y = rnd(-0.2, 0.2);
    yy += h;
  }
}
export function vase(g, x, y, z, s = 1) {
  lathe(g, [[0.04 * s, 0], [0.07 * s, 0.05 * s], [0.075 * s, 0.14 * s], [0.035 * s, 0.24 * s], [0.04 * s, 0.27 * s], [0.032 * s, 0.27 * s]], x, y, z, mat(0xd6cfc2, { roughness: 0.6 }), 28);
}
const artCache = [];
function artTexture(i) {
  if (artCache[i]) return artCache[i];
  const c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const g = c.getContext('2d'), pal = [['#e8dfd0', '#b8452a', '#2f3e4f', '#c9a66b'], ['#efe9df', '#5c6b52', '#d9b08c', '#1f2328'], ['#f2ece3', '#7a8ea3', '#c46b4a', '#e6c79c']][i % 3];
  g.fillStyle = pal[0];
  g.fillRect(0, 0, 512, 640);
  for (let k = 0; k < 7; k++) {
    g.fillStyle = pal[1 + (k % 3)];
    g.globalAlpha = 0.85;
    if (k % 2) { g.beginPath(); g.arc(rnd(80, 430), rnd(100, 540), rnd(40, 150), 0, Math.PI * 2); g.fill(); }
    else g.fillRect(rnd(0, 380), rnd(0, 520), rnd(60, 220), rnd(40, 200));
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (artCache[i] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
}
// cuadro enmarcado (la trasera contra la pared en -z)
export function art(w, h, i = 0, y = 1.4) {
  const g = grp();
  box(g, -w / 2, y - h / 2, -0.02, w / 2, y + h / 2, 0.02, M.dark);
  box(g, -w / 2 + 0.03, y - h / 2 + 0.03, 0.02, w / 2 - 0.03, y + h / 2 - 0.03, 0.021, artTexture(i));
  return g;
}
// cortina de lino ondulada (en el plano x, colgando de y=top)
export function curtain(w, h) {
  const g = grp(), geo = new THREE.PlaneGeometry(w, h, Math.max(8, Math.round(w * 22)), 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 26) * 0.035);
  geo.computeVertexNormals();
  const me = new THREE.Mesh(geo, M.linen);
  me.position.y = h / 2;
  me.userData.noCast = true;
  g.add(me);
  const back = me.clone();
  back.rotation.y = Math.PI;
  g.add(back);
  return g;
}
export function towel(w = 0.45, h = 0.55, col = 0xe8e2d6) {
  const g = grp();
  hcyl(g, 0.01, w + 0.1, 0, 1.2, 0.02, M.steel, 'x');
  rbox(g, -w / 2, 1.2 - h, 0.01, w / 2, 1.22, 0.04, fabric(col, 3), 0.01, 2);
  return g;
}

// Despacho y estudio
function officeChair() {
  const g = grp();
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5, l = box(g, -0.018, 0.05, 0, 0.018, 0.075, 0.3, M.dark);
    l.position.set(Math.sin(a) * 0.15, 0.065, Math.cos(a) * 0.15);
    l.rotation.y = a;
    sphere(g, 0.025, Math.sin(a) * 0.3, 0.025, Math.cos(a) * 0.3, M.black);
  }
  cyl(g, 0.025, 0.025, 0.38, 0, 0.08, 0, M.metal);
  rbox(g, -0.25, 0.44, -0.24, 0.25, 0.54, 0.24, M.fabricGrey, 0.05, 4);
  const b = rbox(g, -0.23, 0, -0.04, 0.23, 0.6, 0.04, M.fabricGrey, 0.06, 4);
  b.position.set(0, 0.88, 0.24);
  b.rotation.x = 0.12;
  return g;
}
export function officeDesk(w, d) {
  const g = table(w, d, 0.74, M.oak, M.dark);
  // Tres pantallas en arco: una central de 27" y dos laterales orientadas al puesto.
  rbox(g, -0.09, 0.74, -d / 2 + 0.06, 0.09, 0.752, -d / 2 + 0.2, M.dark, 0.006);
  box(g, -0.018, 0.752, -d / 2 + 0.11, 0.018, 1.06, -d / 2 + 0.14, M.dark);
  box(g, -0.62, 1.04, -d / 2 + 0.115, 0.62, 1.07, -d / 2 + 0.135, M.dark);
  for (const [x, z, ry, sw] of [[-0.62, 0.1, 0.5, 0.56], [0, 0, 0, 0.64], [0.62, 0.1, -0.5, 0.56]]) {
    const s = grp();
    rbox(s, -sw / 2, 0, -0.02, sw / 2, sw * 0.58, 0.0, M.black, 0.006);
    box(s, -sw / 2 + 0.01, 0.01, 0.0, sw / 2 - 0.01, sw * 0.58 - 0.012, 0.002, M.tv);
    put(g, s, x, -d / 2 + 0.17 + z, ry, 0.88);
  }
  rbox(g, -0.24, 0.74, 0.02, 0.24, 0.762, 0.16, M.dark, 0.006);                  // teclado
  rbox(g, 0.34, 0.74, 0.04, 0.42, 0.765, 0.14, M.dark, 0.012);                   // ratón
  rbox(g, 0.28, 0.74, -0.02, 0.62, 0.743, 0.26, fabric(0x2a2b2d, 4), 0.004);      // alfombrilla
  // torre del PC en el lateral de la mesa, con lateral de cristal y luz RGB
  const tw = grp();
  rbox(tw, -0.11, 0.0, -0.24, 0.11, 0.5, 0.24, M.black, 0.01);
  box(tw, 0.111, 0.04, -0.2, 0.113, 0.46, 0.2, M.carGlass);
  box(tw, 0.105, 0.08, -0.17, 0.11, 0.42, 0.17, mat(0x4aa3ff, { emissive: 0x3d7dff, emissiveIntensity: 1.4 }));
  box(tw, -0.06, 0.44, 0.241, 0.06, 0.46, 0.243, mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }));
  put(g, tw, -w / 2 - 0.15, 0.0, 0);
  put(g, officeChair(), 0, d / 2 + 0.3, 0);
  return g;
}
// silla gaming: respaldo alto con orejeras, reposacabezas y detalles en color
function gamingChair(accent = 0xb8452a) {
  const g = grp(), blk = fabric(0x18191b, 4), acc = fabric(accent, 4);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5, l = box(g, -0.02, 0.05, 0, 0.02, 0.08, 0.33, M.dark);
    l.position.set(Math.sin(a) * 0.16, 0.065, Math.cos(a) * 0.16);
    l.rotation.y = a;
    sphere(g, 0.028, Math.sin(a) * 0.33, 0.028, Math.cos(a) * 0.33, M.black);
  }
  cyl(g, 0.028, 0.028, 0.36, 0, 0.08, 0, M.metal);
  rbox(g, -0.27, 0.44, -0.26, 0.27, 0.55, 0.26, blk, 0.05, 4);
  rbox(g, -0.29, 0.5, -0.26, -0.21, 0.6, 0.24, acc, 0.04);
  rbox(g, 0.21, 0.5, -0.26, 0.29, 0.6, 0.24, acc, 0.04);
  const back = grp();
  rbox(back, -0.27, 0, -0.06, 0.27, 0.86, 0.04, blk, 0.06, 4);
  rbox(back, -0.3, 0.05, -0.08, -0.2, 0.62, 0.05, acc, 0.04);
  rbox(back, 0.2, 0.05, -0.08, 0.3, 0.62, 0.05, acc, 0.04);
  rbox(back, -0.12, 0.66, -0.1, 0.12, 0.8, -0.04, acc, 0.05);
  put(g, back, 0, 0.27, 0, 0.55).rotation.x = 0.14;
  for (const sx of [-1, 1]) { box(g, sx * 0.3 - 0.02, 0.55, -0.05, sx * 0.3 + 0.02, 0.72, 0.0, M.dark); rbox(g, sx * 0.3 - 0.045, 0.72, -0.2, sx * 0.3 + 0.045, 0.75, 0.08, M.dark, 0.012); }
  return g;
}
// puesto de estudio: portátil + monitor + silla gaming (la silla mira hacia -z)
export function studyDesk(w, d, accents) {
  const g = table(w, d, 0.74, M.white, M.white);
  const colors = Array.isArray(accents) ? accents : [accents];
  for (let i = 0; i < colors.length; i++) {
    const station = grp(), accent = colors[i], x = (i - (colors.length - 1) / 2) * w / colors.length;
    const mon = grp();
    rbox(mon, -0.1, 0, -0.08, 0.1, 0.012, 0.06, M.dark, 0.006);
    box(mon, -0.015, 0.012, -0.04, 0.015, 0.2, -0.02, M.dark);
    rbox(mon, -0.28, 0.14, -0.045, 0.28, 0.47, -0.025, M.black, 0.006);
    box(mon, -0.27, 0.15, -0.025, 0.27, 0.46, -0.023, M.tv);
    put(station, mon, 0.18, -d / 2 + 0.2, -0.15, 0.74);
    const lap = grp();
    rbox(lap, -0.17, 0, -0.12, 0.17, 0.016, 0.12, M.metal, 0.008);
    box(lap, -0.15, 0.016, -0.02, 0.15, 0.018, 0.1, M.dark);
    const sc = rbox(lap, -0.17, 0, -0.006, 0.17, 0.23, 0.0, M.metal, 0.006);
    sc.position.set(0, 0.016, -0.12);
    sc.rotation.x = -0.3;
    put(station, lap, -0.32, 0.02, 0.25, 0.74);
    rbox(station, 0.0, 0.74, 0.1, 0.4, 0.755, 0.24, M.dark, 0.006);
    rbox(station, 0.47, 0.74, 0.12, 0.53, 0.762, 0.2, M.dark, 0.012);
    cyl(station, 0.015, 0.07, 0.42, w / (2 * colors.length) - 0.12, 0.74, -d / 2 + 0.1, M.dark);
    put(station, gamingChair(accent), 0, d / 2 + 0.3, 0);
    put(g, station, x, 0, 0);
  }
  return g;
}
export function wc() {
  const g = grp();
  rbox(g, -0.18, 0.42, -0.34, 0.18, 0.8, -0.17, M.ceramic, 0.04);
  const bowl = lathe(g, [[0.13, 0], [0.15, 0.18], [0.19, 0.36], [0.2, 0.4], [0.16, 0.4], [0.12, 0.28], [0, 0.26]], 0, 0, 0.0, M.ceramic, 32);
  bowl.scale.z = 1.3;
  const seat = cyl(g, 0.2, 0.2, 0.02, 0, 0.4, 0, M.ceramic, 32);
  seat.scale.z = 1.3;
  return g;
}
export function vanity(w, d = 0.46, n = 1) {
  const g = grp();
  rbox(g, -w / 2, 0.42, -d / 2, w / 2, 0.82, d / 2, M.oak, 0.01);
  box(g, -w / 2 + 0.02, 0.62, d / 2, w / 2 - 0.02, 0.623, d / 2 + 0.002, M.dark);
  rbox(g, -w / 2, 0.82, -d / 2, w / 2, 0.85, d / 2, M.quartz, 0.005);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n;
    const b = lathe(g, [[0.12, 0], [0.17, 0.05], [0.18, 0.11], [0.165, 0.11], [0.15, 0.06], [0, 0.03]], x, 0.85, 0.03, M.ceramic, 32);
    b.scale.z = 0.8;
    cyl(g, 0.012, 0.012, 0.26, x, 0.85, -d / 2 + 0.07, M.steel);
    box(g, x - 0.012, 1.08, -d / 2 + 0.06, x + 0.012, 1.1, -d / 2 + 0.16, M.steel);
  }
  rbox(g, -w / 2 + 0.03, 1.05, -d / 2, w / 2 - 0.03, 1.85, -d / 2 + 0.02, M.mirror, 0.01);
  return g;
}
export function tub(w, l) {
  const g = grp();
  rbox(g, -w / 2, 0, -l / 2, w / 2, 0.55, l / 2, M.ceramic, 0.04, 4);
  rbox(g, -w / 2 + 0.07, 0.15, -l / 2 + 0.07, w / 2 - 0.07, 0.555, l / 2 - 0.07, M.tubIn, 0.12, 4);
  cyl(g, 0.012, 0.012, 0.25, 0, 0.55, -l / 2 + 0.03, M.steel);
  cyl(g, 0.012, 0.012, 1.6, -w / 2 + 0.05, 0.55, -l / 2 + 0.03, M.steel);
  cyl(g, 0.09, 0.09, 0.012, -w / 2 + 0.12, 2.13, -l / 2 + 0.03, M.steel, 28);
  return g;
}

// Exterior y vehículos (perfil lateral extruido; morro hacia +x local).
const paint = (color, metal = 0.55) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: metal, clearcoat: 1, clearcoatRoughness: 0.06 });
const glassDark = new THREE.MeshPhysicalMaterial({ color: 0x121820, roughness: 0.04, metalness: 0.6, clearcoat: 1 });
const ledWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f7ff, emissiveIntensity: 1.6 });
const ledRed = new THREE.MeshStandardMaterial({ color: 0x8a0d12, emissive: 0xc0151d, emissiveIntensity: 0.9, roughness: 0.3 });
const plateM = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 });

// Perfil de la carrocería (x, y), extruido en z con pasos de rueda.
// Suaviza las esquinas, la caída del techo y los bajos.
function rounder(geo, belt, top, len) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    let k = 1 - 0.1 * Math.pow(Math.min(1, Math.abs(x) / (len / 2)), 5);
    if (y > belt) k -= 0.17 * Math.pow(Math.min(1, (y - belt) / (top - belt)), 1.2);
    if (y < 0.5) k -= 0.05 * (0.5 - y) / 0.5;
    p.setZ(i, p.getZ(i) * k);
  }
}
function smooth(geo) {
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  return mergeVertices(geo, 1e-4);
}
let BODY = { belt: 1.1, top: 1.66, len: 4.8 };
function profile(g, pts, arches, width, m, bevel = 0.07) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  // fondo de delante hacia atrás con los arcos de rueda
  for (const [cx, r] of [...arches].sort((p, q) => p[0] - q[0])) { s.lineTo(cx - r, 0.4); s.absarc(cx, 0.4, r, Math.PI, 0, true); }
  s.closePath();
  let geo = new THREE.ExtrudeGeometry(s, { depth: width - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 16 });
  geo.translate(0, 0, -(width - 2 * bevel) / 2);
  geo = smooth(geo);
  rounder(geo, BODY.belt, BODY.top, BODY.len);
  geo.computeVertexNormals();
  const me = new THREE.Mesh(geo, m);
  g.add(me);
  return me;
}
// lámina de cristal entre dos puntos del perfil (parabrisas, luneta)
function glassPanel(g, [x0, y0], [x1, y1], width) {
  const len = Math.hypot(x1 - x0, y1 - y0), me = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, width * 0.84), glassDark);
  const a = Math.atan2(y1 - y0, x1 - x0);
  me.rotation.z = a;
  me.position.set((x0 + x1) / 2 + Math.sin(a) * 0.012, (y0 + y1) / 2 - Math.cos(a) * 0.012, 0);
  g.add(me);
}
// ventanillas laterales: silueta extruida un poco más ancha que la carrocería
function sideWindows(g, pts, width) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
  geo.translate(0, 0, -width / 2);
  rounder(geo, BODY.belt, BODY.top, BODY.len);
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, glassDark));
}
function wheel(g, x, z, r, w, rimM = M.metal) {
  const tire = new THREE.Mesh(new THREE.TorusGeometry(r - 0.07, 0.075, 14, 36), M.tire);
  tire.scale.z = w / 0.15;
  tire.position.set(x, r, z);
  g.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.66, r * 0.66, w * 0.92, 32), rimM);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(x, r, z);
  g.add(rim);
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, r * 0.6, 0.02), M.dark);
    sp.position.set(x, r, z + Math.sign(z) * (w * 0.46 + 0.006));
    sp.rotation.z = (i / 5) * Math.PI * 2;
    sp.translateY(r * 0.32);
    g.add(sp);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, w * 0.95, 16), M.dark);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(x, r, z);
  g.add(hub);
}
function carDetails(g, W, arches, doors, belt, trimM) {
  const zs = y => (W / 2) * (1 - (y < 0.5 ? 0.05 * (0.5 - y) / 0.5 : 0)) + 0.004;
  for (const [cx, r] of arches) for (const sz of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 28, Math.PI), trimM);
    t.position.set(cx, 0.4, sz * (W / 2 - 0.02));
    g.add(t);
  }
  for (const x of doors) for (const sz of [-1, 1]) {
    const z = sz * zs(0.75);
    box(g, x - 0.004, 0.45, z - 0.003, x + 0.004, belt + 0.02, z + 0.003, M.black);
    rbox(g, x - 0.28, belt - 0.12, z - 0.008 * sz - 0.006, x - 0.12, belt - 0.09, z + 0.006, M.steel, 0.008);
  }
}
function plate(g, x, y, face) {
  box(g, x - 0.005, y - 0.055, -0.26, x + 0.005, y + 0.055, 0.26, plateM);
  box(g, x + face * 0.006 - 0.002, y - 0.055, -0.26, x + face * 0.006 + 0.002, y + 0.055, -0.21, mat(0x1f3c8f));
}

// BMW X3 (G45, 2025) blanco: 4,76 × 1,92 × 1,66 m · batalla 2,87 m · llanta 19"
export function bmwX3(color = 0xf3f3f0) {
  const g = grp(), c = grp(), W = 1.92, m = paint(color, color === 0xf3f3f0 ? 0.25 : 0.6), FA = 1.45, RA = -1.415, R = 0.385;
  BODY = { belt: 1.12, top: 1.665, len: 4.8 };
  profile(c, [[2.36, 0.42], [2.39, 0.72], [2.34, 0.9], [2.06, 1.02], [1.32, 1.13], [0.62, 1.6], [0.35, 1.665], [-1.85, 1.645], [-2.12, 1.54], [-2.28, 1.1], [-2.39, 0.98], [-2.4, 0.66], [-2.37, 0.42]],
    [[FA, 0.47], [RA, 0.47]], W, m);
  box(c, -2.36, 0.25, -W / 2 + 0.08, 2.34, 0.44, W / 2 - 0.08, M.dark);                 // bajos y taloneras
  sideWindows(c, [[-2.0, 1.12], [1.18, 1.14], [0.6, 1.55], [0.34, 1.6], [-1.78, 1.59], [-2.02, 1.48]], W + 0.014);
  glassPanel(c, [1.3, 1.135], [0.63, 1.585], W - 0.22);
  glassPanel(c, [-2.12, 1.52], [-2.27, 1.13], W - 0.26);
  for (const z of [-0.62, 0.62]) box(c, -1.7, 1.665, z - 0.02, 0.2, 1.7, z + 0.02, M.dark);  // barras de techo
  for (const z of [-W / 2 - 0.05, W / 2 + 0.05]) rbox(c, 0.88, 1.08, z - 0.06, 1.08, 1.2, z + 0.06, m, 0.03); // retrovisores
  for (const z of [-1, 1]) {
    rbox(c, 2.28, 0.72, z * 0.68 - 0.2, 2.4, 0.82, z * 0.68 + 0.2, glassDark, 0.02);         // faros
    box(c, 2.38, 0.79, z * 0.68 - 0.19, 2.405, 0.805, z * 0.68 + 0.17, ledWhite);
    rbox(c, 2.3, 0.5, z * 0.19 - 0.17, 2.41, 0.76, z * 0.19 + 0.17, M.black, 0.05);           // riñones BMW
    rbox(c, -2.42, 0.86, z * 0.66 - 0.24, -2.36, 0.98, z * 0.66 + 0.24, ledRed, 0.02);        // pilotos
  }
  carDetails(c, W, [[FA, 0.47], [RA, 0.47]], [0.72, -0.4], 1.12, M.black);
  plate(c, 2.41, 0.4, 1);
  plate(c, -2.42, 0.62, -1);
  for (const x of [FA, RA]) for (const z of [-0.83, 0.83]) wheel(c, x, z, R, 0.26, M.metal);
  c.scale.set(0.963, 0.957, 1);                 // el biselado suma ~7 cm por extremo: medidas reales 4,755 × 1,66
  c.rotation.y = -Math.PI / 2;
  g.add(c);
  return g;
}

// Ford Mondeo MK3 berlina (2004) champán: 4,73 × 1,81 × 1,43 m · batalla 2,75 m · llanta 16"
export function mondeoMk3(color = 0xd6c5a6) {
  const g = grp(), c = grp(), W = 1.81, m = paint(color, 0.7), FA = 1.43, RA = -1.32, R = 0.32;
  BODY = { belt: 1.0, top: 1.43, len: 4.78 };
  profile(c, [[2.34, 0.36], [2.38, 0.56], [2.33, 0.74], [2.12, 0.84], [1.25, 0.99], [0.6, 1.38], [0.32, 1.43], [-0.78, 1.42], [-1.08, 1.36], [-1.56, 1.02], [-2.22, 0.99], [-2.35, 0.89], [-2.39, 0.62], [-2.36, 0.36]],
    [[FA, 0.4], [RA, 0.4]], W, m, 0.06);
  box(c, -2.34, 0.22, -W / 2 + 0.07, 2.32, 0.38, W / 2 - 0.07, M.dark);
  sideWindows(c, [[-1.48, 1.03], [1.12, 1.02], [0.57, 1.34], [0.31, 1.39], [-0.76, 1.38], [-1.03, 1.33]], W + 0.014);
  glassPanel(c, [1.24, 0.995], [0.62, 1.375], W - 0.2);
  glassPanel(c, [-1.07, 1.355], [-1.55, 1.03], W - 0.24);
  for (const z of [-W / 2 - 0.05, W / 2 + 0.05]) rbox(c, 0.86, 0.98, z - 0.05, 1.04, 1.08, z + 0.05, m, 0.03);
  box(c, 2.35, 0.6, -0.42, 2.39, 0.66, 0.42, M.steel);                                       // calandra cromada
  box(c, 2.39, 0.6, -0.06, 2.4, 0.66, 0.06, mat(0x1f3c8f, { roughness: 0.3 }));            // óvalo Ford
  for (const z of [-1, 1]) {
    rbox(c, 2.2, 0.66, z * 0.62 - 0.2, 2.37, 0.78, z * 0.62 + 0.18, glassDark, 0.03);
    box(c, 2.34, 0.7, z * 0.62 - 0.12, 2.37, 0.75, z * 0.62 + 0.05, mat(0xfff3d9, { emissive: 0xfff0d0, emissiveIntensity: 0.5 }));
    rbox(c, -2.4, 0.78, z * 0.62 - 0.22, -2.32, 0.94, z * 0.62 + 0.2, ledRed, 0.02);
  }
  carDetails(c, W, [[FA, 0.4], [RA, 0.4]], [0.78, -0.32], 1.0, m);
  plate(c, 2.39, 0.44, 1);
  plate(c, -2.4, 0.66, -1);
  for (const x of [FA, RA]) for (const z of [-0.76, 0.76]) wheel(c, x, z, R, 0.21, M.steel);
  c.scale.set(0.966, 0.96, 1);                  // medidas reales 4,73 × 1,43
  c.rotation.y = -Math.PI / 2;
  g.add(c);
  return g;
}

// Moto trail negra tipo Voge 525 DSX: 2,20 m de largo · llanta delantera 19" y trasera 17"
export function trailBike() {
  const g = grp(), b = grp(), black = paint(0x141516, 0.4), grey = mat(0x4a4d51, { roughness: 0.5, metalness: 0.5 });
  const spokeWheel = (x, r) => {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(r - 0.055, 0.055, 12, 40), M.tire);
    tire.position.set(x, r, 0);
    b.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.105, 0.012, 8, 40), M.steel);
    rim.position.set(x, r, 0);
    b.add(rim);
    for (let i = 0; i < 16; i++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, r - 0.11, 4), M.steel);
      sp.position.set(x, r, 0);
      sp.rotation.z = (i / 16) * Math.PI * 2;
      sp.translateY((r - 0.11) / 2);
      sp.rotation.x = (i % 2 ? 0.06 : -0.06);
      b.add(sp);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), grey);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, r, 0);
    b.add(hub);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.006, 32), M.steel);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(x, r, 0.08);
    b.add(disc);
  };
  const tube = (p0, p1, r, m) => {
    const a = new THREE.Vector3(...p0), c = new THREE.Vector3(...p1), len = a.distanceTo(c);
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), m);
    me.position.copy(a).add(c).multiplyScalar(0.5);
    me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(a).normalize());
    b.add(me);
  };
  spokeWheel(0.76, 0.37);
  spokeWheel(-0.76, 0.34);
  for (const z of [-0.09, 0.09]) tube([0.76, 0.37, z], [0.5, 1.02, z], 0.024, M.steel);            // horquilla
  for (const z of [-0.08, 0.08]) tube([-0.76, 0.34, z], [-0.05, 0.47, z], 0.022, black);           // basculante
  tube([-0.12, 0.5, 0], [-0.3, 0.86, 0], 0.03, M.dark);                                           // amortiguador
  tube([0.48, 0.98, 0], [0.05, 0.62, 0], 0.035, black);                                            // chasis
  tube([0.48, 0.98, 0], [-0.55, 0.9, 0], 0.03, black);
  rbox(b, -0.2, 0.3, -0.15, 0.28, 0.66, 0.15, grey, 0.05);                                         // motor
  rbox(b, 0.05, 0.6, -0.12, 0.3, 0.78, 0.12, grey, 0.04);
  tube([0.2, 0.42, 0.1], [-0.15, 0.32, 0.17], 0.03, M.steel);                                      // escape
  tube([-0.15, 0.32, 0.17], [-0.62, 0.5, 0.18], 0.032, M.steel);
  const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.36, 20), M.dark);
  muffler.rotation.z = Math.PI / 2 + 0.35;
  muffler.position.set(-0.68, 0.55, 0.19);
  b.add(muffler);
  rbox(b, 0.02, 0.84, -0.19, 0.5, 1.13, 0.19, black, 0.09, 4);                                     // depósito
  rbox(b, 0.18, 0.8, -0.22, 0.52, 1.02, -0.18, grey, 0.03);
  rbox(b, 0.18, 0.8, 0.18, 0.52, 1.02, 0.22, grey, 0.03);
  rbox(b, -0.56, 0.88, -0.15, 0.08, 0.98, 0.15, fabric(0x1b1b1c, 3), 0.05, 4);                   // asiento
  rbox(b, -0.92, 0.9, -0.1, -0.5, 0.99, 0.1, black, 0.04);                                         // colín
  box(b, -0.9, 0.99, -0.12, -0.58, 1.01, 0.12, M.dark);                                            // parrilla
  box(b, -0.95, 0.9, -0.06, -0.93, 0.94, 0.06, ledRed);
  const beak = rbox(b, 0.62, 0.66, -0.08, 1.02, 0.72, 0.08, black, 0.03);                          // pico
  beak.rotation.z = -0.3;
  const fairing = rbox(b, 0.42, 0.95, -0.18, 0.66, 1.22, 0.18, black, 0.06, 4);                    // carenado
  fairing.rotation.z = -0.35;
  box(b, 0.6, 1.0, -0.1, 0.64, 1.08, 0.1, ledWhite);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.32, 0.34), new THREE.MeshPhysicalMaterial({ color: 0x223040, transparent: true, opacity: 0.45, roughness: 0.05 }));
  screen.position.set(0.5, 1.33, 0);
  screen.rotation.z = 0.45;
  b.add(screen);
  tube([0.36, 1.2, -0.42], [0.36, 1.2, 0.42], 0.013, M.dark);                                      // manillar
  for (const z of [-0.4, 0.4]) rbox(b, 0.3, 1.16, z - 0.03, 0.44, 1.24, z + 0.03, black, 0.02);    // paramanos
  for (const z of [-0.2, 0.2]) tube([0.38, 1.22, z], [0.33, 1.36, z * 1.4], 0.006, M.dark);
  tube([-0.02, 0.32, -0.12], [-0.12, 0.02, -0.33], 0.012, M.dark);                                  // pata de cabra
  b.rotation.x = -0.1;                                                                              // apoyada en la pata
  b.rotation.y = -Math.PI / 2;
  g.add(b);
  return g;
}

export function bicycle(accent = 0xb8452a) {
  const g = grp(), wheelRadius = 0.34, wheelbase = 1.05;
  const tube = (p0, p1, radius, material) => {
    const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), length = a.distanceTo(b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.add(mesh);
  };
  for (const x of [-wheelbase / 2, wheelbase / 2]) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius - 0.035, 0.035, 8, 28), M.tire);
    tire.position.set(x, wheelRadius, 0);
    g.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius - 0.07, 0.008, 6, 24), M.steel);
    rim.position.set(x, wheelRadius, 0);
    g.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 10), M.steel);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, wheelRadius, 0);
    g.add(hub);
  }
  const rear = [-wheelbase / 2, wheelRadius, 0], front = [wheelbase / 2, wheelRadius, 0];
  const crank = [-0.05, 0.34, 0], seat = [-0.28, 0.79, 0], head = [0.34, 0.77, 0];
  for (const z of [-0.018, 0.018]) {
    tube(rear, [crank[0], crank[1], z], 0.018, accent);
    tube([crank[0], crank[1], z], seat, 0.018, accent);
    tube(seat, rear, 0.018, accent);
    tube(seat, head, 0.018, accent);
    tube(head, [crank[0], crank[1], z], 0.018, accent);
    tube(head, front, 0.015, M.steel);
  }
  tube(seat, [seat[0], 0.91, 0], 0.018, M.dark);
  rbox(g, -0.42, 0.9, -0.13, -0.12, 0.94, 0.13, M.black, 0.025);
  tube(head, [0.4, 0.91, 0], 0.014, M.dark);
  tube([0.4, 0.91, -0.23], [0.4, 0.91, 0.23], 0.012, M.dark);
  tube(crank, [crank[0], crank[1], 0.14], 0.012, M.dark);
  tube([crank[0], crank[1], 0.14], [crank[0] - 0.12, 0.34, 0.14], 0.012, M.dark);
  tube([crank[0], crank[1], -0.14], [crank[0] + 0.12, 0.34, -0.14], 0.012, M.dark);
  return g;
}

export function shelving(w, d = 0.45, h = 2) {
  const g = grp();
  for (const x of [-w / 2, w / 2 - 0.04]) box(g, x, 0, -d / 2, x + 0.04, h, d / 2, M.metal);
  for (let k = 0; k < 5; k++) {
    const y = 0.05 + k * (h - 0.1) / 4;
    box(g, -w / 2, y, -d / 2, w / 2, y + 0.03, d / 2, M.metal);
    if (k < 4) for (let x = -w / 2 + 0.1; x < w / 2 - 0.45; x += rnd(0.35, 0.6)) {
      rbox(g, x, y + 0.03, -d / 2 + 0.04, x + rnd(0.25, 0.4), y + 0.03 + rnd(0.18, 0.35), d / 2 - 0.04, M.card, 0.01);
    }
  }
  return g;
}
export function acUnit() {
  const g = grp();
  rbox(g, -0.42, 0.08, -0.15, 0.42, 0.68, 0.15, M.white, 0.02);
  box(g, -0.38, 0, -0.13, -0.3, 0.08, 0.13, M.dark);
  box(g, 0.3, 0, -0.13, 0.38, 0.08, 0.13, M.dark);
  const f = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.01, 32), M.dark);
  f.rotation.x = Math.PI / 2;
  f.position.set(-0.1, 0.38, 0.151);
  g.add(f);
  for (let i = -3; i <= 3; i++) box(g, -0.1 + i * 0.06 - 0.004, 0.17, 0.152, -0.1 + i * 0.06 + 0.004, 0.6, 0.158, M.white);
  return g;
}
export function bbq() {
  const g = grp();
  rbox(g, -0.42, 0, -0.28, 0.42, 0.85, 0.28, M.dark, 0.02);
  rbox(g, -0.45, 0.85, -0.3, 0.45, 0.88, 0.3, M.steel, 0.01);
  const lid = rbox(g, -0.35, 0.88, -0.25, 0.35, 1.2, 0.22, M.black, 0.12, 4);
  lid.scale.y = 1;
  hcyl(g, 0.012, 0.5, 0, 1.12, 0.26, M.steel, 'x');
  for (const x of [-0.25, 0, 0.25]) hcyl(g, 0.025, 0.03, x, 0.7, 0.29, M.steel, 'z');
  return g;
}
export function gymStation() {
  const g = grp();
  for (const x of [-0.64, 0.64]) for (const z of [-0.32, 0.32]) {
    box(g, x - 0.035, 0, z - 0.035, x + 0.035, 2.12, z + 0.035, M.dark);
  }
  for (const z of [-0.32, 0.32]) {
    box(g, -0.72, 0.04, z - 0.04, 0.72, 0.1, z + 0.04, M.metal);
    box(g, -0.67, 2.04, z - 0.045, 0.67, 2.12, z + 0.045, M.metal);
    box(g, -0.67, 0.88, z - 0.035, 0.67, 0.94, z + 0.035, M.metal);
  }
  hcyl(g, 0.025, 1.7, 0, 1.62, -0.28, M.steel, 'x', 16);
  for (const x of [-0.58, 0.58]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 24), M.dark);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(x, 1.62, -0.28);
    g.add(plate);
  }
  box(g, 0.28, 0.15, -0.27, 0.88, 0.95, 0.25, M.metal);
  for (const y of [0.25, 0.4, 0.55, 0.7, 0.85]) box(g, 0.34, y, -0.3, 0.82, y + 0.025, -0.24, M.dark);
  for (const [x, y, z] of [[0.55, 2.0, -0.2], [0.55, 1.02, -0.2], [0.55, 0.9, 0.22]]) {
    const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 20), M.dark);
    pulley.rotation.x = Math.PI / 2;
    pulley.position.set(x, y, z);
    g.add(pulley);
  }
  box(g, 0.53, 1.05, -0.18, 0.57, 1.95, -0.14, M.steel);
  box(g, 0.53, 0.93, 0.18, 0.57, 1.0, 0.22, M.steel);
  rbox(g, -0.28, 0.48, 0.35, 0.28, 0.57, 1.55, M.black, 0.035);
  box(g, -0.24, 0.08, 0.48, -0.18, 0.49, 0.54, M.metal);
  box(g, 0.18, 0.08, 0.48, 0.24, 0.49, 0.54, M.metal);
  box(g, -0.24, 0.08, 1.36, -0.18, 0.49, 1.42, M.metal);
  box(g, 0.18, 0.08, 1.36, 0.24, 0.49, 1.42, M.metal);
  return g;
}
export function outdoorSofa(w, d = 0.85) {
  const g = grp();
  rbox(g, -w / 2, 0.1, -d / 2, w / 2, 0.3, d / 2, M.teak, 0.015);
  rbox(g, -w / 2, 0.3, -d / 2, w / 2, 0.72, -d / 2 + 0.07, M.teak, 0.015);
  rbox(g, -w / 2, 0.3, -d / 2, -w / 2 + 0.07, 0.6, d / 2, M.teak, 0.015);
  rbox(g, w / 2 - 0.07, 0.3, -d / 2, w / 2, 0.6, d / 2, M.teak, 0.015);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, sx * (w / 2 - 0.05) - 0.03, 0, sz * (d / 2 - 0.05) - 0.03, sx * (w / 2 - 0.05) + 0.03, 0.1, sz * (d / 2 - 0.05) + 0.03, M.teak);
  rbox(g, -w / 2 + 0.07, 0.3, -d / 2 + 0.07, w / 2 - 0.07, 0.45, d / 2 - 0.01, M.fabricOut, 0.06, 4);
  const n = Math.max(1, Math.round((w - 0.14) / 0.7));
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.07 + i * (w - 0.14) / n;
    rbox(g, x0 + 0.01, 0.42, -d / 2 + 0.07, x0 + (w - 0.14) / n - 0.01, 0.82, -d / 2 + 0.25, M.fabricOut, 0.08, 4).rotation.x = -0.1;
  }
  return g;
}
export function dryingRack(height = 1.5) {
  const g = grp();
  for (const z of [-0.75, 0.75]) {
    box(g, -0.03, 0, z - 0.03, 0.03, 1.5, z + 0.03, M.metal);
    box(g, -0.55, 1.47, z - 0.02, 0.55, 1.5, z + 0.02, M.metal);
  }
  for (let i = 0; i < 6; i++) hcyl(g, 0.004, 1.5, -0.5 + i * 0.2, 1.485, 0, M.white, 'z', 6);
  rbox(g, -0.33, 0.95, -0.4, -0.29, 1.49, 0.2, fabric(0x7aa6c2, 2), 0.01);
  rbox(g, 0.07, 1.05, 0.0, 0.11, 1.49, 0.55, fabric(0xe8d9b5, 2), 0.01);
  rbox(g, 0.27, 1.12, -0.6, 0.31, 1.49, -0.1, fabric(0xffffff, 2), 0.01);
  g.scale.y = height / 1.5;
  return g;
}
export function pendant(g, x, z, y = 1.7) {
  cyl(g, 0.004, 0.004, 2.6 - y - 0.25, x, y + 0.25, z, M.dark, 6);
  lathe(g, [[0.17, 0], [0.12, 0.08], [0.06, 0.2], [0.05, 0.25], [0.045, 0.25], [0.055, 0.2], [0.115, 0.08], [0.165, 0]], x, y, z, M.dark, 36);
  sphere(g, 0.045, x, y + 0.04, z, M.light);
}
export function bollard() {
  const g = grp();
  cyl(g, 0.07, 0.07, 0.8, 0, 0, 0, M.alu, 20);
  cyl(g, 0.072, 0.072, 0.06, 0, 0.62, 0, M.light, 20);
  return g;
}
