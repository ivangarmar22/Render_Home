import * as THREE from 'three';
import { W, T, PITCH, GZ, STREET_N, setSeed, rnd } from './config.js';
import { M, mat, fabric } from './materials.js';
import { box, rbox, cyl, floor } from './geom.js';
import * as Fu from './furniture.js';
import { olive, tree, cypress, shrub, hedge, blob, palm, GREENS } from './nature.js';
import { model, hasModel } from './models.js';

const { grp, put } = Fu;

// Coordenadas del plano de urbanización (escala 1:200; 15,75 px/m).
// x va de oeste a este; z, de la calle Laos a la calle Corea.
const XW = -4 * PITCH - T;                  // testero oeste del módulo 1
const PX_E = 61.6, PZ_N = -24.76, PZ_S = 16.83;
const PX_WN = -31.9, PX_WS = -26.2;         // lindero oeste, inclinado
const RAMP = [17.43, PZ_N, 23.53, -8.2];    // acceso de vehículos entre los módulos 2 y 3
const POOL = [-27.91, -21.8, -20.97, -17.36];
const STEPS = [-20.97, -21.8, -19.08, -20.28];
const STAIR1 = [-24.83, -11.45, -23.52, -8.17];   // escalera de evacuación (pabellón)
const STAIR2 = [-24.5, -4.89, -23.52, -1.48];     // escalera de evacuación del garaje
const WALK = [-4.66, -3.2];                        // paseo central de la calle peatonal

const inside = (h, x, z) => x > h[0] && x < h[2] && z > h[1] && z < h[3];
// rectángulo menos huecos rectangulares → lista de rectángulos
function rectsMinus(r, holes) {
  const xs = new Set([r[0], r[2]]), zs = new Set([r[1], r[3]]);
  for (const h of holes) {
    if (h[2] <= r[0] || h[0] >= r[2] || h[3] <= r[1] || h[1] >= r[3]) continue;
    xs.add(Math.max(r[0], h[0])); xs.add(Math.min(r[2], h[2]));
    zs.add(Math.max(r[1], h[1])); zs.add(Math.min(r[3], h[3]));
  }
  const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b), out = [];
  for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Z.length - 1; j++) {
    const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
    if (!holes.some(h => inside(h, cx, cz))) out.push([X[i], Z[j], X[i + 1], Z[j + 1]]);
  }
  return out;
}
const floors = (g, rects, m, y) => rects.forEach(([a, b, c, d]) => floor(g, a, b, c, d, m, y));

// Vegetación: modelos escaneados cerca y geometría procedural a distancia.
export function oliveTree(g, x, z, s = 1, near = true) {
  const id = rnd() > 0.5 ? 'island_tree_01' : 'island_tree_02';
  const m = near && hasModel(id) ? model(id, { scale: (id === 'island_tree_01' ? 0.72 : 0.9) * s }) : null;
  put(g, m || olive(s, false), x, z, rnd(0, 6.28));
}
function bush(g, x, z, s = 1, near = true) {
  const m = near && hasModel('searsia_lucida') ? model('searsia_lucida', { scale: 0.42 * s }) : null;
  put(g, m || shrub(1.3 * s), x, z, rnd(0, 6.28));
}
// Jardineras y parterre delantero de cada vivienda (coordenadas locales).
// Paredes de 5 cm y tierra a 5 cm del borde.
function planterShell(g, w, d, h) {
  const e = 0.05, x = w / 2, z = d / 2, y = h - 0.05;
  rbox(g, -x, 0, -z, x, h, -z + e, M.ext, 0.01);
  rbox(g, -x, 0, z - e, x, h, z, M.ext, 0.01);
  rbox(g, -x, 0, -z + e, -x + e, h, z - e, M.ext, 0.01);
  rbox(g, x - e, 0, -z + e, x, h, z - e, M.ext, 0.01);
  floor(g, -x + e, -z + e, x - e, z - e, M.earth, y);
  return y;
}
// jardinera alargada: fila de matas de boj medio enterradas, sin salirse del hueco
function planterBox(w, d) {
  const g = grp(), y = planterShell(g, w, d, 0.45), iw = w - 0.1, r = (d - 0.1) * 0.4;
  const n = Math.max(1, Math.round(iw / (2.2 * r)));
  for (let i = 0; i < n; i++) blob(g, r, -iw / 2 + (i + 0.5) * iw / n, y + r * 0.3, 0, { sy: 0.75, palette: GREENS.shrub, detail: 2 });
  return g;
}
// jardinera cuadrada: una mata de lavanda de tres bolas, dentro del hueco
function squarePlanter(s) {
  const g = grp(), y = planterShell(g, s, s, 0.5), r = (s - 0.1) * 0.22;
  for (let i = 0; i < 3; i++) {
    const a = i * 2.09 + rnd(-0.3, 0.3);
    blob(g, r, Math.cos(a) * r * 0.65, y + r * 0.45, Math.sin(a) * r * 0.65, { sy: 0.85, palette: GREENS.lavender, detail: 2 });
  }
  return g;
}
export function frontYard(b, f) {
  floor(b, -T, -3.1, 2.0, -T, M.grass, 0.012);
  floor(b, 3.1, -3.1, W + T, -T, M.grass, 0.012);
  for (const [x0, x1] of [[-T, 2.0], [3.1, W + T]]) box(b, x0, 0, -3.16, x1, 0.06, -3.1, M.hedgeStone);
  box(b, 1.94, 0, -3.16, 2.0, 0.06, -T, M.hedgeStone);
  box(b, 3.1, 0, -3.16, 3.16, 0.06, -T, M.hedgeStone);
  put(f, planterBox(1.6, 0.5), 0.9, -2.2);
  put(f, squarePlanter(0.8), 4.55, -1.9);
}

// Mobiliario urbano
function bars(g, a, b, y0, y1, step = 0.13, z = 0) {
  for (let x = a + 0.05; x < b - 0.03; x += step) box(g, x, y0, z - 0.012, x + 0.025, y1, z + 0.012, M.alu);
  box(g, a, y1 - 0.05, z - 0.025, b, y1, z + 0.025, M.alu);
  box(g, a, y0, z - 0.025, b, y0 + 0.04, z + 0.025, M.alu);
}
// Murete de hormigón y valla de barrotes antracita.
function fenceLine(g, x0, z0, x1, z1, gaps = []) {
  const len = Math.hypot(x1 - x0, z1 - z0), seg = grp();
  let cur = 0;
  const ranges = [];
  for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) { if (a > cur) ranges.push([cur, a]); cur = b; }
  if (cur < len) ranges.push([cur, len]);
  for (const [a, b] of ranges) {
    box(seg, a, 0, -0.13, b, 0.9, 0.13, M.plinth);
    box(seg, a, 0.9, -0.15, b, 0.95, 0.15, M.hedgeStone);
    bars(seg, a, b, 0.95, 1.9);
    for (let x = a + 0.02; x < b; x += 2.4) box(seg, x, 0.95, -0.035, x + 0.06, 1.95, 0.035, M.alu);
  }
  seg.position.set(x0, 0, z0);
  seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  g.add(seg);
}
function pier(g, x, z, h = 2.3) {
  rbox(g, x - 0.22, 0, z - 0.22, x + 0.22, h, z + 0.22, M.ext, 0.02);
  box(g, x - 0.25, h, z - 0.25, x + 0.25, h + 0.06, z + 0.25, M.hedgeStone);
  box(g, x - 0.08, h - 0.5, z - 0.225, x + 0.08, h - 0.4, z - 0.22, M.light);
}
function sunLounger() {
  const g = grp();
  rbox(g, -0.34, 0.2, -0.95, 0.34, 0.27, 0.95, M.white, 0.03);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, sx * 0.3 - 0.02, 0, sz * 0.85 - 0.02, sx * 0.3 + 0.02, 0.2, sz * 0.85 + 0.02, M.alu);
  rbox(g, -0.32, 0.27, -0.35, 0.32, 0.34, 0.93, fabric(0xf0ebe0, 3), 0.04, 3);
  const back = rbox(g, -0.32, 0, -0.33, 0.32, 0.07, 0.33, fabric(0xf0ebe0, 3), 0.04, 3);
  back.position.set(0, 0.5, -0.62);
  back.rotation.x = 0.85;
  rbox(g, -0.15, 0.6, -0.86, 0.15, 0.7, -0.74, fabric(0xb8452a, 2), 0.04).rotation.x = 0.85;
  return g;
}
function parasol(r = 1.3) {
  const g = grp();
  cyl(g, 0.22, 0.25, 0.08, 0, 0, 0, M.dark);
  cyl(g, 0.022, 0.022, 2.4, 0, 0, 0, M.alu, 12);
  const c = new THREE.Mesh(new THREE.ConeGeometry(r, 0.42, 8, 1, true), M.canvasOut);
  c.position.y = 2.32;
  g.add(c);
  return g;
}
function streetLight() {
  const g = grp();
  cyl(g, 0.06, 0.09, 5.2, 0, 0, 0, M.alu, 16);
  box(g, -0.04, 5.1, -0.04, 0.04, 5.18, 0.9, M.alu);
  rbox(g, -0.14, 5.04, 0.75, 0.14, 5.14, 1.2, M.alu, 0.03);
  box(g, -0.12, 5.03, 0.78, 0.12, 5.04, 1.17, M.light);
  return g;
}
function streetTree(g, x, z) {
  box(g, x - 0.6, 0.001, z - 0.6, x + 0.6, 0.015, z + 0.6, M.dark);
  put(g, tree(rnd(0.8, 1.0)), x, z, rnd(0, 6.28));
}
function zebra(g, x0, z0, x1, z1, alongX, y) {
  // franjas blancas: alongX = franjas alargadas en x, repetidas a lo largo de z
  if (alongX) for (let z = z0 + 0.2; z < z1 - 0.3; z += 0.85) box(g, x0, y, z, x1, y + 0.012, z + 0.45, M.paint);
  else for (let x = x0 + 0.2; x < x1 - 0.3; x += 0.85) box(g, x, y, z0, x + 0.45, y + 0.012, z1, M.paint);
}

// Parcela completa
export function buildSite(L) {
  const b = L.base, w = L.walls, f = L.furn;
  setSeed(99);
  const ROAD = -0.12;

  // Terreno, parcela y calles
  floors(b, rectsMinus([-170, -170, 180, 170], [[-32.2, PZ_N - 0.3, PX_E + 0.3, PZ_S + 0.3]]), M.ground, ROAD - 0.02);
  floors(b, rectsMinus([-32.2, PZ_N, PX_E, PZ_S], [POOL, STEPS, RAMP, STAIR1, STAIR2]), M.grass, -0.02);
  floor(b, XW - 2.6, STREET_N, PX_E, -T, M.pave, 0.004);                               // calle peatonal interior
  // calles perimetrales: acera (+0), aparcamiento y calzada (-0,12) y bordillos
  const street = (rects, sw) => { floors(b, rects.road, M.asphalt, ROAD); floors(b, rects.walk, M.pave, 0.0); sw.forEach(([a, c, d, e]) => box(b, a, ROAD, c, d, 0.0, e, M.hedgeStone)); };
  street({ road: [[-60, -37.3, 95, -27.6]], walk: [[-60, -27.6, 95, PZ_N - 0.25], [-60, -39.8, 95, -37.3]] }, [[-60, -27.75, 95, -27.6], [-60, -37.3, 95, -37.15]]);     // calle Laos
  street({ road: [[-60, 19.6, 95, 29.3]], walk: [[-60, PZ_S + 0.25, 95, 19.6], [-60, 29.3, 95, 31.8]] }, [[-60, 19.6, 95, 19.75], [-60, 29.15, 95, 29.3]]);            // calle Corea
  street({ road: [[64.4, -60, 74, 60]], walk: [[PX_E + 0.25, -27.6, 64.4, 19.6], [74, -60, 76.5, 60]] }, [[64.25, -27.6, 64.4, 19.6], [74, -60, 74.15, 60]]);          // calle India
  street({ road: [[-42, -60, -34.6, 60]], walk: [[-34.6, -27.6, -32.2, 19.6], [-44.5, -60, -42, 60]] }, [[-34.6, -27.6, -34.45, 19.6]]);                              // avenida de China
  box(w, -60, 0, -40.0, 95, 1.6, -39.8, M.plinth);                                    // muro de la parcela de enfrente
  // aparcamiento en línea y pasos de cebra
  for (let x = -26; x < 60; x += 5) { box(b, x, ROAD, -36.9, x + 0.1, ROAD + 0.012, -34.9, M.paint); box(b, x, ROAD, 19.75, x + 0.1, ROAD + 0.012, 21.9, M.paint); }
  box(b, -26, ROAD, -34.95, 60, ROAD + 0.012, -34.85, M.paint);
  box(b, -26, ROAD, 21.85, 60, ROAD + 0.012, 21.95, M.paint);
  zebra(b, -27, -37.3, -24, -27.6, true, ROAD);
  zebra(b, 55, -37.3, 58, -27.6, true, ROAD);
  zebra(b, -22, 19.6, -19, 29.3, true, ROAD);
  zebra(b, 54, 19.6, 57, 29.3, true, ROAD);
  zebra(b, 64.4, 11.5, 74, 14.5, false, ROAD);
  for (let x = -24; x < 60; x += 9) { streetTree(f, x, -26.5); streetTree(f, x + 4, 18.4); }
  for (let z = -20; z < 18; z += 9) streetTree(f, 63.2, z);
  for (let x = -20; x < 60; x += 18) { put(f, streetLight(), x, -26.3, Math.PI); put(f, streetLight(), x + 9, 18.6, 0); }
  // coches aparcados en la calle
  const parked = [[Fu.bmwX3, 0x1d2a3a], [Fu.mondeoMk3, 0x8c9196], [Fu.bmwX3, 0xc7c9c8], [Fu.mondeoMk3, 0x6b1f22], [Fu.bmwX3, 0x2b2d30], [Fu.mondeoMk3, 0xe8e6e1]];
  parked.forEach(([fn, col], i) => {
    const south = i % 2 === 0, x = -14 + i * 11;
    put(f, fn(col), x, south ? 20.85 : -36.05, south ? Math.PI / 2 : -Math.PI / 2);
  });

  // Cerramiento perimetral y accesos
  const tWest = z => (z - PZ_N) / (PZ_S - PZ_N) * Math.hypot(PX_WS - PX_WN, PZ_S - PZ_N);
  fenceLine(w, PX_WN, PZ_N, PX_E, PZ_N, [[RAMP[0] - PX_WN, RAMP[2] - PX_WN]]);                 // norte (calle Laos)
  fenceLine(w, PX_E, PZ_N, PX_E, PZ_S, [[WALK[0] - PZ_N, WALK[1] - PZ_N]]);                   // este (calle India)
  fenceLine(w, PX_WS, PZ_S, PX_E, PZ_S);                                                      // sur (calle Corea)
  fenceLine(w, PX_WN, PZ_N, PX_WS, PZ_S, [[tWest(-6.3), tWest(-5.0)]]);                       // oeste (avda. de China)

  // acceso peatonal (calle India): pilares, cancela, muro técnico con buzones y contadores, pérgola
  pier(w, PX_E, WALK[0] - 0.22);
  pier(w, PX_E, WALK[1] + 0.22);
  const gate = grp(); bars(gate, 0, 1.0, 0.05, 1.95); put(w, gate, PX_E, WALK[0], -Math.PI / 2);
  rbox(w, PX_E - 0.4, 0, -7.55, PX_E + 0.14, 2.1, WALK[0] - 0.45, M.ext, 0.02);
  for (const [z0, z1] of [[-7.4, -6.7], [-6.6, -5.9], [-5.8, -5.2]]) box(w, PX_E + 0.14, 0.4, z0, PX_E + 0.16, 1.7, z1, M.shutter);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) box(w, PX_E - 0.42, 0.7 + j * 0.3, -7.4 + i * 0.36, PX_E - 0.4, 0.96 + j * 0.3, -7.08 + i * 0.36, M.doorExt);
  for (const [x, z] of [[PX_E - 0.2, WALK[0] - 0.3], [PX_E - 2.6, WALK[0] - 0.3], [PX_E - 0.2, WALK[1] + 0.3], [PX_E - 2.6, WALK[1] + 0.3]]) box(w, x - 0.05, 0, z - 0.05, x + 0.05, 2.7, z + 0.05, M.alu);
  for (let x = PX_E - 2.6; x < PX_E; x += 0.18) box(w, x, 2.7, WALK[0] - 0.35, x + 0.06, 2.8, WALK[1] + 0.35, M.alu);
  oliveTree(f, PX_E - 1.7, -12, 0.85, false);
  oliveTree(f, PX_E - 1.7, 6, 0.85, false);

  // acceso de vehículos (calle Laos): portón corredero, puerta de la «salida 1» y rampa al garaje
  pier(w, RAMP[0] + 0.22, PZ_N);
  pier(w, RAMP[2] - 0.22, PZ_N);
  pier(w, 21.95, PZ_N, 2.1);
  const big = grp(); bars(big, 0, 4.0, 0.05, 1.95, 0.1); put(w, big, RAMP[0] + 0.45, PZ_N);
  const small = grp(); bars(small, 0, 1.0, 0.05, 1.95); put(w, small, 22.2, PZ_N);
  const ry = z => (z <= -19.8 ? -0.04 * (z - PZ_N) : -0.198 - 0.14 * (z + 19.8));
  {
    const x0 = RAMP[0] + 0.2, x1 = RAMP[2] - 0.2, len = RAMP[3] - PZ_N;
    const geo = new THREE.PlaneGeometry(x1 - x0, len, 1, 40);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i) + (PZ_N + RAMP[3]) / 2;
      p.setY(i, ry(z));
      uv.setXY(i, (p.getX(i) + (x0 + x1) / 2) / 3, z / 3);
    }
    geo.computeVertexNormals();
    const me = new THREE.Mesh(geo, M.concrete);
    me.position.set((x0 + x1) / 2, 0, (PZ_N + RAMP[3]) / 2);
    b.add(me);
    for (const [a, c] of [[RAMP[0], RAMP[0] + 0.2], [RAMP[2] - 0.2, RAMP[2]]]) {
      box(w, a, -2.0, PZ_N, c, 0.08, RAMP[3], M.plinth);
      box(w, a - 0.02, 0.08, PZ_N, c + 0.02, 1.1, RAMP[3], M.ext);
    }
    box(b, RAMP[0], -0.35, RAMP[3], RAMP[2], 0.0, STREET_N, M.slab);                  // dintel bajo la calle
    floor(b, RAMP[0], RAMP[3], RAMP[2], STREET_N, M.pave, 0.004);
    box(b, x0, -2.0, RAMP[3], x1, -0.35, RAMP[3] + 3, mat(0x060606, { roughness: 1 }));  // boca del garaje
  }

  // Calle peatonal, pérgola y balizas
  const YP = 2.75, Z1 = WALK[0] + 0.06, Z2 = WALK[1] - 0.06;
  for (let x = XW + 1.5; x <= PX_E - 2.5; x += 4.2) {
    if (x > RAMP[0] - 0.5 && x < RAMP[2] + 0.5) continue;
    for (const z of [Z1, Z2]) box(w, x - 0.05, 0, z - 0.05, x + 0.05, YP, z + 0.05, M.alu);
  }
  for (const z of [Z1, Z2]) box(w, XW + 1.4, YP, z - 0.06, PX_E - 2.4, YP + 0.16, z + 0.06, M.alu);
  for (let x = XW + 1.5; x <= PX_E - 2.5; x += 0.42) box(w, x - 0.02, YP + 0.16, Z1 - 0.2, x + 0.02, YP + 0.28, Z2 + 0.2, M.alu);
  for (let x = XW + 3.5; x < PX_E - 3; x += 6.5) for (const z of [WALK[0] + 0.18, WALK[1] - 0.18]) put(f, Fu.bollard(), x, z);

  // Piscina comunitaria
  const deck = M.poolDeck;
  const DECK = [[-29.07, -22.99, -17.97, -19.10], [-29.07, -19.10, -20.97, -16.12], [-19.61, -19.10, -17.97, -12.59],
    [-26.02, -16.12, -20.97, -13.98], [-26.02, -13.98, -23.45, -6.40], [-29.12, -6.40, -23.44, -4.89]];
  for (const r of DECK) floors(b, rectsMinus(r, [POOL, STEPS, STAIR1]), deck, 0.012);
  // vaso: paredes y fondo de gresite, escalera de obra y lámina de agua
  const PD = -1.4;
  const basin = (r, y) => {
    box(b, r[0], y, r[1], r[2], y + 0.02, r[3], M.poolTile);
    box(b, r[0], y, r[1] - 0.02, r[2], 0.0, r[1], M.poolTile);
    box(b, r[0], y, r[3], r[2], 0.0, r[3] + 0.02, M.poolTile);
    box(b, r[0] - 0.02, y, r[1], r[0], 0.0, r[3], M.poolTile);
    box(b, r[2], y, r[1], r[2] + 0.02, 0.0, r[3], M.poolTile);
  };
  basin(POOL, PD);
  basin(STEPS, PD);
  for (let i = 0; i < 3; i++) {
    const x1 = STEPS[2] - i * 0.63;
    box(b, x1 - 0.63, PD, STEPS[1], x1, -0.35 - i * 0.35, STEPS[3], M.poolTile);
  }
  box(b, POOL[0], -0.12, POOL[1], POOL[2], -0.1, POOL[3], M.water);
  box(b, STEPS[0], -0.12, STEPS[1], STEPS[2], -0.1, STEPS[3], M.water);
  // coronación de piedra
  const cope = (a, c, d, e) => rbox(b, a, -0.02, c, d, 0.05, e, M.hedgeStone, 0.015);
  cope(POOL[0] - 0.3, POOL[1] - 0.3, STEPS[2] + 0.3, POOL[1]);
  cope(POOL[0] - 0.3, POOL[3], POOL[2] + 0.3, POOL[3] + 0.3);
  cope(POOL[0] - 0.3, POOL[1], POOL[0], POOL[3]);
  cope(POOL[2], STEPS[3], POOL[2] + 0.3, POOL[3]);
  cope(POOL[2] + 0.3, STEPS[3], STEPS[2] + 0.3, STEPS[3] + 0.3);
  cope(STEPS[2], STEPS[1], STEPS[2] + 0.3, STEPS[3]);
  for (const z of [-21.2, -20.85]) {   // barandillas de la escalera
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 24, Math.PI), M.steel);
    r.position.set(STEPS[2] - 0.15, 0.05, z);
    r.rotation.y = Math.PI / 2;
    b.add(r);
  }
  // hamacas, sombrillas, duchas, palmeras y setos
  put(f, parasol(), -25.6, -22.5);
  for (let i = 0; i < 2; i++) put(f, sunLounger(), -28.4 + i * 1.6, -15.2, Math.PI);
  put(f, parasol(), -26.9, -14.6);
  for (const z of [-17.51, -16.62]) { cyl(f, 0.03, 0.03, 2.1, -19.15, 0, z, M.steel, 12); cyl(f, 0.09, 0.09, 0.03, -19.05, 2.05, z, M.steel, 16); }
  for (const [x, z] of [[-30.4, -18.2], [-18.6, -23.6], [-30.2, -12.6], [-16.8, -18.0]]) put(f, palm(rnd(5.5, 7)), x, z);
  hedge(f, -31.2, -24.35, -13.5, -23.6, 1.3);
  hedge(f, -31.5, -23.5, -30.75, -13.5, 1.3);
  for (const [x, z] of [[-26.8, -10.5], [-28.5, -2.6]]) oliveTree(f, x, z, 0.9, true);
  oliveTree(f, -16.3, -14.2, 0.85, true);
  for (let z = -2; z < 16; z += 3.4) bush(f, -29.6 + (z + 2) * 0.12, z, 1, false);

  // pabellón de aseos con pérgola y zona de estar
  rbox(w, -17.77, 0, -12.59, -14.86, 2.8, -6.4, M.ext, 0.02);
  box(w, -17.95, 2.8, -12.75, -14.7, 3.0, -6.25, M.band);
  for (const z of [-11.8, -10.2, -8.6]) box(w, -17.8, 0, z, -17.77, 2.1, z + 0.85, M.doorExt);
  for (const z of [-12.2, -7.4]) box(w, -14.86, 2.0, z, -14.83, 2.5, z + 0.7, M.winDark);
  floor(b, -23.44, -12.59, -17.77, -6.4, M.poolDeck, 0.014);
  for (const [x, z] of [[-23.3, -12.45], [-23.3, -6.55], [-17.95, -12.45], [-17.95, -6.55]]) box(w, x - 0.06, 0, z - 0.06, x + 0.06, 2.7, z + 0.06, M.alu);
  for (const z of [-12.45, -6.55]) box(w, -23.36, 2.7, z - 0.06, -17.89, 2.86, z + 0.06, M.alu);
  for (let x = -23.2; x < -17.95; x += 0.3) box(w, x, 2.86, -12.5, x + 0.08, 2.94, -6.5, M.alu);
  put(f, Fu.outdoorSofa(1.8, 0.85), -21.2, -12.0);
  put(f, Fu.outdoorSofa(0.8, 0.8), -22.7, -10.6, Math.PI / 2);
  put(f, Fu.outdoorSofa(0.8, 0.8), -19.7, -10.6, -Math.PI / 2);
  put(f, Fu.coffeeTable(1.0, 0.6), -21.2, -10.7);
  if (hasModel('outdoor_table_chair_set_01')) put(f, model('outdoor_table_chair_set_01'), -20.4, -8.0, 0.4);
  // escaleras de evacuación del garaje, ascensor, salida 2 y contadores
  const stairWell = (r, alongZ) => {
    const n = 10, len = alongZ ? r[3] - r[1] : r[2] - r[0];
    for (let i = 0; i < n; i++) {
      const a = alongZ ? r[1] + i * len / n : r[0] + i * len / n, c = a + len / n, y = -0.18 * (i + 1);
      if (alongZ) box(b, r[0], y - 0.18, a, r[2], y, c, M.plinth); else box(b, a, y - 0.18, r[1], c, y, r[3], M.plinth);
    }
    box(b, r[0] - 0.12, -2.0, r[1] - 0.12, r[0], 0.02, r[3] + 0.12, M.plinth);
    box(b, r[2], -2.0, r[1] - 0.12, r[2] + 0.12, 0.02, r[3] + 0.12, M.plinth);
    const rail = grp(); bars(rail, 0, r[3] - r[1], 0.0, 1.0, 0.12); put(w, rail, r[2] + 0.06, r[1], -Math.PI / 2);
    const rail2 = grp(); bars(rail2, 0, r[3] - r[1], 0.0, 1.0, 0.12); put(w, rail2, r[0] - 0.06, r[1], -Math.PI / 2);
  };
  stairWell(STAIR1, true);
  stairWell(STAIR2, true);
  rbox(w, -24.8, 0, -7.97, -23.5, 2.5, -6.86, M.alu, 0.02);
  box(w, -24.82, 0.1, -7.9, -24.79, 2.3, -6.93, M.glass);
  box(w, -29.65, 0, -8.22, -29.1, 1.6, -6.45, M.ext);
  box(w, -29.1, 0.2, -8.1, -29.08, 1.45, -7.4, M.shutter);
  box(w, -29.1, 0.2, -7.3, -29.08, 1.45, -6.6, M.shutter);
  const g2 = grp(); bars(g2, 0, 1.25, 0.05, 1.95); put(w, g2, -28.9, -6.3, -Math.PI / 2 + 0.14);

  // zonas verdes comunes al este y en los extremos de las hileras
  for (const z of [-20, -14, 10, 14]) bush(f, PX_E - 1.4, z, 1, false);
  for (const [x, z] of [[-17.2, 13.5], [-16, -20.5], [16.2, -22], [24.8, -22]]) put(f, cypress(rnd(4.2, 5.2)), x, z);
}

// Separación entre jardines: muro en la terraza y seto sobre murete.
export function gardenSeparators(L) {
  const w = L.walls, f = L.furn;
  const sep = (x, zt0, zt1, zg0, zg1) => {
    box(w, x - T / 2, 0, Math.min(zt0, zt1), x + T / 2, 1.8, Math.max(zt0, zt1), M.ext);
    box(w, x - 0.07, 0, Math.min(zg0, zg1), x + 0.07, 0.35, Math.max(zg0, zg1), M.plinth);
    hedge(f, x - 0.3, Math.min(zg0, zg1) + 0.1, x + 0.3, Math.max(zg0, zg1) - 0.1, 1.55);
  };
  // hilera sur (módulo 1): terrazas z GZ…GZ+3, jardines hasta el cerramiento
  for (let k = -4; k <= 10; k++) sep(k * PITCH - T / 2, GZ, GZ + 3, GZ + 3, PZ_S);
  // hilera norte (módulos 2 y 3)
  const zt0 = STREET_N - T - GZ, zt1 = zt0 - 3;
  for (let i = 0; i <= 5; i++) sep(-11.62 + i * PITCH - T / 2, zt0, zt1, zt1, PZ_N);
  for (let i = 0; i <= 6; i++) sep(23.68 + i * PITCH - T / 2, zt0, zt1, zt1, PZ_N);
}
