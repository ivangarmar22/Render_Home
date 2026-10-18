import * as THREE from 'three';
import { W, BW, D, T, t, H, FF, SL, PITCH, BZ0, BZ1, GZ, OV, ST, STREET_N, setSeed, rnd, detailedQuality } from './config.js';
import { M, mat } from './materials.js';
import { box, rbox, cyl, floor, slab, floorHole, bake } from './geom.js';
import * as Fu from './furniture.js';
import { shrub, hedge, pottedPlant } from './nature.js';
import { buildSite, gardenSeparators, frontYard, oliveTree } from './site.js';
import { model, hasModel, instanceModels } from './models.js';
import { AUDIT, where, item, solid, runAudit } from './audit.js';

const { grp, put } = Fu;

// Plantas
export const LV = {};
for (const [k, y] of [['sot', -FF], ['baja', 0], ['pri', FF], ['cub', 2 * FF]]) {
  const g = new THREE.Group(), base = new THREE.Group(), walls = new THREE.Group(), furn = new THREE.Group();
  g.position.y = y;
  g.add(base, walls, furn);
  LV[k] = { k, y, g, base, walls, furn, rec: [], fp: [] };
}

// hoja de puerta abierta a 90° (lacada en interior, antracita en exterior)
function doorLeaf(L, axis, a, b, c, sign, hinge, m) {
  const w = b - a, lt = 0.04, g = L.walls, h = 2.05;
  const p0 = hinge === 'b' ? b - lt - 0.01 : a + 0.01, c1 = Math.min(c, c + sign * w), c2 = Math.max(c, c + sign * w);
  if (axis === 'x') box(g, p0, 0.01, c1, p0 + lt, h, c2, m);
  else box(g, c1, 0.01, p0, c2, h, p0 + lt, m);
}

// Muro con huecos: axis 'x' fija z=c; axis 'z' fija x=c.
// Cada hueco: [a, b, y0, y1, vidrio, apertura, bisagra ('a' o 'b')].
function wall(L, axis, a0, a1, c, th, h, ops = [], m = M.wall, g = L && L.walls) {
  const pane = (a, b, y0, y1, w, mm) => {
    if (b - a < 0.001 || y1 - y0 < 0.001) return;
    axis === 'x' ? box(g, a, y0, c - w / 2, b, y1, c + w / 2, mm) : box(g, c - w / 2, y0, a, c + w / 2, y1, b, mm);
  };
  const solid = (a, b) => {
    if (b - a < 0.001) return;
    pane(a, b, 0, h, th, m);
    if (L) L.rec.push({ axis, a, b, c, th, kind: 'solid' });
  };
  let cur = a0;
  for (const [a, b, y0 = 0, y1 = 2.1, glass = false, sign = 1, hinge = 'a', leaf = true] of [...ops].sort((p, q) => p[0] - q[0])) {
    solid(cur, a);
    pane(a, b, 0, y0, th, m);
    pane(a, b, y1, h, th, m);
    if (glass && L) {
      const f = 0.05, ft = 0.07;
      pane(a, b, y0, y1, 0.02, M.glass);
      pane(a, b, y0, y0 + f, ft, M.frame); pane(a, b, y1 - f, y1, ft, M.frame);
      pane(a, a + f, y0, y1, ft, M.frame); pane(b - f, b, y0, y1, ft, M.frame);
      if (b - a > 1.6) { const mid = (a + b) / 2; pane(mid - f / 2, mid + f / 2, y0, y1, ft, M.frame); }
      L.rec.push({ axis, a, b, c, th, kind: 'glass' });
    } else if (L) {
      L.rec.push({ axis, a, b, c, th, kind: 'door', sign, hinge, leaf });
      if (leaf) doorLeaf(L, axis, a, b, c, sign, hinge, th >= 0.12 ? M.doorExt : M.door);
    }
    cur = b;
  }
  solid(cur, a1);
}
const iw = (L, axis, a0, a1, c, doors = []) =>
  wall(L, axis, a0, a1, c, t, H, doors.map(([a, b, s = 1, hg = 'a', leaf = true]) => [a, b, 0, 2.1, false, s, hg, leaf]));
function shell(L, h, front = [], back = []) {
  wall(L, 'x', -T, W + T, -T / 2, T, h, front, M.ext);
  wall(L, 'x', -T, W + T, D + T / 2, T, h, back, M.ext);
  wall(L, 'z', 0, D, -T / 2, T, h, [], M.ext);
  wall(L, 'z', 0, D, W + T / 2, T, h, [], M.ext);
}
// aplacado cerámico sobre la cara exterior de la fachada, con los huecos de las ventanas
function cladding(L, ops, h, z = -T - 0.008) {
  wall(null, 'x', -T, W + T, z, 0.016, h, ops.map(([a, b, y0, y1]) => [a - 0.02, b + 0.02, y0 - 0.02, y1 + 0.02]), M.clad, L.walls);
}
// Resaltes de fachada de 15 cm: baja a la izquierda y primera a la derecha.
const LEDGES = { baja: [[-T, 1.08], [-T, 1.27]], pri: [[4.39, W + T], [4.39, W + T]] };
function ledges(g, [[fa, fb], [ba, bb]], y0, y1, L) {
  box(g, fa, y0, -T - 0.15, fb, y1, -T, M.ext);
  box(g, ba, y0, D + T, bb, y1, D + T + 0.15, M.ext);
  if (L) L.rec.push({ axis: 'x', a: fa, b: fb, c: -T - 0.075, th: 0.15, kind: 'solid' }, { axis: 'x', a: ba, b: bb, c: D + T + 0.075, th: 0.15, kind: 'solid' });
}
// persiana enrollable medio bajada (dormitorios)
function shutter(g, a, b, y1, z, drop = 0.42) {
  box(g, a + 0.02, y1 - drop, z - 0.012, b - 0.02, y1, z + 0.012, M.shutter);
  for (let y = y1 - drop + 0.05; y < y1; y += 0.05) box(g, a + 0.02, y - 0.003, z - 0.014, b - 0.02, y, z + 0.014, M.dark);
}

// planta real (Poly Haven) con alternativa procedural
function plant(id, s = 1, kind) { return (hasModel(id) && model(id, { scale: s })) || pottedPlant(s * 1.1, kind); }

function diningSet(L, w, l, perSide, x, z) {
  if (!detailedQuality || !hasModel('dining_table') || !hasModel('dining_chair_02')) {
    return F(L, Fu.dining(w, l, perSide, M.oak, M.fabricBeige), x, z);
  }
  const set = grp(), table = model('dining_table', { size: [l, 0.75, w] });
  table.rotation.y = Math.PI / 2;
  set.add(table);
  const step = l / perSide;
  for (let i = 0; i < perSide; i++) {
    const chairZ = -l / 2 + step * (i + 0.5);
    put(set, model('dining_chair_02', { size: [0.44, 0.96, 0.48] }), -w / 2 - 0.12, chairZ, Math.PI / 2);
    put(set, model('dining_chair_02', { size: [0.44, 0.96, 0.48] }), w / 2 + 0.12, chairZ, -Math.PI / 2);
  }
  return F(L, set, x, z);
}

function F(L, o, x, z, ry = 0) {
  o.position.set(x, 0, z);
  o.rotation.y = ry;
  L.furn.add(o);
  const b = new THREE.Box3().setFromObject(o);
  L.fp.push([b.min.x, b.min.z, b.max.x, b.max.z]);
  if (AUDIT) (L.items ||= []).push({ name: where(), b });
  return o;
}

// Escalera en U de mármol: 16 contrahuellas de 18 cm, huella 27 cm, tramos de 0,90 m
function stairs(L) {
  const r = FF / 16, tr = 0.27;
  const step = (x0, x1, z0, z1, i) => {
    rbox(L.furn, x0, (i - 1) * r + 0.11, z0, x1 + 0.02, i * r, z1, M.marble, 0.01, 1);
    L.fp.push([x0, z0, x1, z1]);
    solid(L, `peldaño ${i}`, x0, (i - 1) * r + 0.11, z0, x1, i * r, z1);
  };
  const a0 = ST.z0 + 0.02, a1 = a0 + 0.9, b1 = ST.z1, b0 = b1 - 0.9;            // tramo de llegada (a) y de subida (b)
  for (let i = 1; i <= 6; i++) step(3.36 + (i - 1) * tr, 3.36 + i * tr, b0, b1, i);
  step(4.98, W, b1 - 0.7, b1, 7); step(4.98, W, a0 + 0.7, b1 - 0.7, 8); step(4.98, W, a0, a0 + 0.7, 9);
  for (let i = 10; i <= 15; i++) { const x1 = 4.98 - (i - 10) * tr; step(x1 - tr, x1, a0, a1, i); }
  box(L.walls, 3.36, 0, a1, 4.98, FF, b0, M.wall);                                // muro central
  L.rec.push({ axis: 'x', a: 3.36, b: 4.98, c: (a1 + b0) / 2, th: b0 - a1, kind: 'solid' });
  // pasamanos en el muro central
  const hr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.9, 10), M.handrail);
  hr.rotation.z = Math.PI / 2 + Math.atan2(1.0, 1.62);
  hr.position.set(4.17, 1.55, b0 + 0.03);
  L.furn.add(hr);
}

// Vivienda vecina simplificada con las mismas medidas. x0 = medianera izquierda interior.
function neighbor(L, x0, mirror, north, i, near) {
  const h = grp(), f = grp();
  setSeed(31 + i * 17);
  box(h, -T, 0, -T, W + T, 2.6, D + T, M.ext);
  box(h, -T - 0.01, 2.6, -T - 0.01, W + T + 0.01, 2.9, D + T + 0.01, M.band);
  box(h, -T, 2.9, -T, W + T, 5.5, D + T, M.ext);
  box(h, -T, 2.95, -T - 0.012, W + T, 5.45, -T, M.clad);
  box(h, -T, 5.5, -OV, W + T, 5.8, D + OV, M.band);
  box(h, -T, 5.8, -OV, 0, 6.8, D + OV, M.ext);
  box(h, W, 5.8, -OV, W + T, 6.8, D + OV, M.ext);
  for (const z of [-OV + 0.02, D + OV - 0.02]) { box(h, 0, 5.8, z - 0.01, W, 6.8, z + 0.01, M.glass); box(h, 0, 6.76, z - 0.03, W, 6.82, z + 0.03, M.alu); }
  box(h, 2.18, 5.8, 3.59, W + T, 8.4, 6.11, M.ext);
  box(h, 2.12, 8.4, 3.53, W + T + 0.04, 8.6, 6.17, M.band);
  ledges(h, LEDGES.baja, 0, 2.6);
  ledges(h, LEDGES.pri, 2.9, 5.5);
  const win = (a, b, y0, y1, z, out, sh = false) => {
    box(h, a, y0, z, b, y1, z + out * 0.025, M.frame);
    box(h, a + 0.05, y0 + 0.05, z + out * 0.025, b - 0.05, y1 - 0.05, z + out * 0.035, M.winDark);
    if (sh) shutter(h, a, b, y1 - 0.05, z + out * 0.045, rnd(0.25, 0.7));
  };
  win(1.08, 1.68, 1.2, 2.2, -T, -1); win(3.81, 5.21, 0.6, 2.3, -T, -1, true);
  box(h, 2.06, 0, -T - 0.025, 3.03, 2.2, -T, M.doorExt);
  win(0.70, 2.10, 3.5, 5.2, -T - 0.012, -1, true); win(2.99, 4.39, 3.5, 5.2, -T - 0.012, -1, true);
  win(1.27, 4.87, 0, 2.4, D + T, 1); win(0.97, 2.07, 3.9, 5.1, D + T, 1); win(2.59, 4.39, 3.2, 5.2, D + T, 1, true);
  // terraza cerámica, jardín, tapias, olivo y jardinera de la calle
  floor(f, -T, GZ, W + T, GZ + 3, M.roof, 0.006);
  floor(f, -T, GZ + 3, W + T, GZ + 7.05, M.grass, 0.006);
  oliveTree(f, rnd(1.6, 3.9), GZ + rnd(4.6, 5.6), rnd(0.85, 1.05), near);
  put(f, shrub(1.1), 0.6, GZ + 6.4);
  if (near && hasModel('outdoor_table_chair_set_01')) put(f, model('outdoor_table_chair_set_01'), rnd(2, 3.5), GZ + 1.5, rnd(0, 6));
  else put(f, Fu.table(0.9, 1.6, 0.75, M.teak, M.dark), rnd(2, 3.5), GZ + 1.5, Math.PI / 2);
  frontYard(f, f);
  // mirror y orientación: la cara izquierda del mundo debe coincidir con la "izquierda" pedida
  for (const o of [h, f]) {
    const sx = mirror ? -1 : 1;
    let px;
    if (north) { o.rotation.y = Math.PI; px = sx === 1 ? x0 + W : x0; o.position.z = STREET_N - T; }
    else px = sx === 1 ? x0 : x0 + W;
    o.scale.x = sx;
    o.position.x = px;
  }
  L.walls.add(h);
  L.furn.add(f);
}

// muro bajo junto a la escalera que sigue su pendiente (planta baja y sótano)
function slopedStairWall(L) {
  const s = new THREE.Shape();
  s.moveTo(3.28, 0); s.lineTo(W, 0); s.lineTo(W, 2.25); s.lineTo(4.98, 1.99); s.lineTo(3.36, 1.08); s.lineTo(3.28, 1.08); s.closePath();
  const th = 0.15;
  const geo = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false });
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.5, uv.getY(i) / 2.5);
  const me = new THREE.Mesh(geo, M.wall);
  me.position.z = ST.z1;
  L.walls.add(me);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.04, 0.12), M.handrail);
  cap.position.set(4.17, 1.56, ST.z1 + th / 2);
  cap.rotation.z = Math.atan2(0.91, 1.62);
  L.walls.add(cap);
  L.rec.push({ axis: 'x', a: 3.28, b: W, c: ST.z1 + th / 2, th, kind: 'solid' });
}

// Construcción
export function buildWorld(scene) {
  // Sótano
  {
    const L = LV.sot, b = L.base, C = M.concrete;
    slab(b, -T, BW + T, BZ0 - 4.5, BZ1 + T, null, M.slab);
    floor(b, -T, BZ0 - 4.5, BW + T, 3.63, M.garage, 0.004);
    floor(b, 0, 3.63, BW, BZ1, M.wood, 0.004);
    floor(b, 2.77, BZ0, 2.83, 3.5, M.paint, 0.012);
    floor(b, 0, BZ0 - 0.06, BW, BZ0, M.paint, 0.012);
    wall(L, 'z', BZ0, BZ1, -T / 2, T, H, [], C);
    wall(L, 'z', BZ0, BZ1, BW + T / 2, T, H, [], C);
    wall(L, 'x', -T, BW + T, BZ1 + T / 2, T, H, [], C);
    wall(L, 'x', 0, BW, 3.63, 0.15, H, [[0.12, 0.95, 0, 2.1, false, 1, 'a']], C);
    iw(L, 'z', 3.705, 5.37, 1.10);
    iw(L, 'x', 0, 1.14, 5.37, [[0.15, 0.95, -1, 'a']]);
    slopedStairWall(L);
    iw(L, 'x', 0, 1.55, 6.37, [[0.15, 0.95, 1, 'a']]);
    iw(L, 'z', 6.37, BZ1, 1.55);
    // Panel de listones de roble que prolonga el muro de la escalera hasta el vestíbulo.
    const pz = ST.z0 + 1.04;                                                      // eje del muro central de la escalera
    for (let x = 1.14; x < 3.33; x += 0.065) box(L.walls, x, 0.02, pz - 0.025, Math.min(x + 0.045, 3.36), H - 0.02, pz + 0.025, detailedQuality ? M.oakDeep : M.oak);
    box(L.walls, 1.14, 0, pz - 0.03, 3.36, 0.02, pz + 0.03, M.dark);
    box(L.walls, 1.14, H - 0.02, pz - 0.03, 3.36, H, pz + 0.03, M.dark);
    L.rec.push({ axis: 'x', a: 1.14, b: 3.36, c: pz, th: 0.05, kind: 'solid' });
    stairs(L);
    F(L, Fu.bmwX3(), 1.3, 0.97, Math.PI);      // morro hacia la calle de garaje
    F(L, Fu.trailBike(), 2.84, 2.0, Math.PI);
    F(L, Fu.mondeoMk3(), 4.3, 0.98, Math.PI);
    const tank = grp(); cyl(tank, 0.28, 0.28, 1.8, 0, 0, 0, M.white); cyl(tank, 0.29, 0.29, 0.06, 0, 1.78, 0, M.dark); F(L, tank, 1.55, 4.15);
    F(L, Fu.bicycle(0xb8452a), 3.3, 3.89);
    F(L, Fu.bicycle(0x2f6fb5), 3.3, 4.42);
    F(L, Fu.studyDesk(3.9, 0.7, [0xb8452a, 0x2f6fb5]), 3.55, 10.05, Math.PI);
    F(L, Fu.rug(2.2, 2.2, 0x6d7a86), BW - 2.35, 7.25, Math.PI / 2);
    F(L, Fu.woodUnit(2.0, 0.42, 0.42, detailedQuality ? M.oakDeep : M.oak), BW - 0.21, 7.25, -Math.PI / 2);
    F(L, Fu.tvPanel(1.66, 0.95, 0.95), BW - 0.04, 7.25, -Math.PI / 2);
    const console = grp();
    rbox(console, -0.22, 0, -0.14, 0.22, 0.07, 0.14, M.black, 0.025);
    box(console, -0.14, 0.045, 0.141, 0.14, 0.052, 0.144, M.dark);
    cyl(console, 0.012, 0.012, 0.008, 0.17, 0.04, 0.145, M.tv, 12);
    put(L.furn, console, BW - 0.21, 7.25, -Math.PI / 2, 0.53);
    const sofa = detailedQuality && hasModel('Sofa_01')
      ? model('Sofa_01', { size: [1.85, 0.7, 0.82] })
      : Fu.sofa(1.85, 0.82, M.fabricGrey);
    F(L, sofa, BW - 2.35, 7.45, Math.PI / 2);
    F(L, Fu.shelving(3.8, 0.42, 2.0), 0.3, 8.4, Math.PI / 2);
  }

  // Planta baja
  {
    const L = LV.baja, b = L.base;
    slab(b, -T, W + T, -T, D + T, ST, M.slab);
    box(b, ST.x0, -0.06, ST.z0, ST.x1, -0.01, ST.z1, M.dark);          // fondo del hueco de escalera
    floorHole(b, 0, W, 0, D, ST, M.wood, 0.004);                         // laminado (memoria de calidades)
    floor(b, 0, 0, 1.86, 1.59, M.bath, 0.012);
    const front = [[1.08, 1.68, 1.2, 2.2, true], [2.06, 3.03, 0, 2.2, false, 1, 'b'], [3.81, 5.21, 0.6, 2.3, true]];
    shell(L, H, front, [[1.27, 4.87, 0, 2.4, true]]);
    ledges(L.walls, LEDGES.baja, 0, H, L);
    iw(L, 'z', 0, 1.63, 1.90, [[0.05, 0.78, -1, 'a']]);   // aseo
    iw(L, 'x', 0, 1.94, 1.63);
    iw(L, 'z', 0, 3.70, 3.32, [[2.78, 3.55, 1, 'b']]);    // despacho (3,62 de fondo medido)
    iw(L, 'x', 3.28, W, 3.66);
    slopedStairWall(L);
    stairs(L);
    kitchen(L);

    // aseo: inodoro, plato de ducha en la esquina con mampara y lavabo
    F(L, Fu.wc(), 0.33, 0.43, Math.PI / 2);
    rbox(L.furn, 0.02, 0, 0.9, 0.84, 0.05, 1.57, M.ceramic, 0.01);
    box(L.furn, 0.02, 0.05, 0.89, 0.46, 2.0, 0.9, M.screen);
    box(L.furn, 0.84, 0.05, 0.9, 0.85, 2.0, 1.57, M.screen);
    box(L.furn, 0.0, 0, 0.88, 0.01, 2.1, 1.59, M.wallTile);
    box(L.furn, 0.0, 0, 1.58, 0.86, 2.1, 1.59, M.wallTile);
    cyl(L.furn, 0.1, 0.1, 0.012, 0.25, 2.1, 1.3, M.steel);
    L.fp.push([0.02, 0.9, 0.84, 1.57]);
    item(L, 'aseo: plato de ducha y mampara', 0.02, 0, 0.89, 0.85, 2.0, 1.57);
    F(L, Fu.vanity(0.6, 0.42, 1), 1.35, 1.38, Math.PI);
    F(L, Fu.towel(0.4, 0.5), 1.88, 1.2, -Math.PI / 2);

    // despacho
    F(L, Fu.officeDesk(2.0, 0.72), 3.72, 1.15, Math.PI / 2);
    F(L, Fu.wardrobe(1.5, 0.6), W - 0.3, 2.85, -Math.PI / 2);
    F(L, Fu.rug(1.4, 1.8, 0x8c8a84), 4.55, 1.2);
    F(L, Fu.art(0.7, 0.9, 1, 1.5), 4.45, 3.6, Math.PI);

    // salón y comedor
    F(L, Fu.rug(2.6, 2.9, 0xd9d0c0), 4.1, 7.85);
    F(L, Fu.woodUnit(2.0, 0.4, 0.45, detailedQuality ? M.oakDeep : M.oak), W - 0.2, 7.8, -Math.PI / 2);
    F(L, Fu.tvPanel(1.45, 0.83, 1.05), W - 0.036, 7.8, -Math.PI / 2);
    F(L, Fu.lSofa(M.fabricBeige), 3.225, 7.85, Math.PI / 2);
    if (AUDIT) { L.items.pop(); item(L, 'sofá en L: tramo principal', 2.75, 0, 6.55, 3.7, 0.9, 9.15); item(L, 'sofá en L: chaise', 3.7, 0, 6.55, 4.4, 0.6, 7.45); }
    F(L, Fu.coffeeTable(1.0, 0.6), 4.35, 8.25, Math.PI / 2);
    const din = diningSet(L, 0.9, 1.8, 3, 1.4, 7.65);
    Fu.vase(din, 0, 0.75, 0, 1.1);
    Fu.pendant(L.furn, 1.4, 7.2, 1.75);
    Fu.pendant(L.furn, 1.4, 8.1, 1.75);
    F(L, Fu.art(1.3, 0.85, 0, 1.55), 0.01, 7.65, Math.PI / 2);
    F(L, Fu.floorLamp(), W - 0.3, 9.1);
    F(L, plant('potted_plant_01', 1.0), 0.47, 9.0);
    for (const [x, ry] of [[1.12, 0], [4.99, 0]]) F(L, Fu.curtain(0.45, 2.42), x, D - 0.08, ry);

    // terraza y jardín propios
    box(b, -T, -SL, GZ, W + T, 0, GZ + 3, M.slab);
    floor(b, -T, GZ, W + T, GZ + 3, M.roof, 0.004);
    box(b, -T, -SL, GZ + 3, W + T, 0, GZ + 7.05, M.earth);
    floor(b, -T, GZ + 3, W + T, GZ + 7.05, M.grass, 0.004);
    F(L, Fu.dining(0.9, 1.8, 3, M.teak, M.fabricOut), 2.75, GZ + 1.55, Math.PI / 2);
    F(L, plant('potted_plant_02', 1.0, 'terra'), 0.45, GZ + 0.62);
    F(L, plant('potted_plant_01', 0.9, 'round'), W - 0.45, GZ + 0.5);
    if (hasModel('potted_plant_04')) put(L.furn, model('potted_plant_04'), 2.75, GZ + 1.55, 0, 0.75);
    hedge(L.furn, 0.15, GZ + 6.45, W - 0.15, GZ + 6.95, 1.0);
    F(L, shrub(1.2), 0.85, GZ + 3.75);
    frontYard(b, L.furn);

    /* ---------- Urbanización: 25 viviendas en 3 módulos ---------- */
    for (let k = -4; k <= 9; k++) if (k !== 0) neighbor(L, k * PITCH, k % 2 !== 0, false, k + 10, Math.abs(k) <= 2);
    for (let i = 0; i < 5; i++) neighbor(L, -11.62 + i * PITCH, i % 2 === 1, true, 40 + i, i >= 2);
    for (let i = 0; i < 6; i++) neighbor(L, 23.68 + i * PITCH, i % 2 === 1, true, 60 + i, false);
    buildSite(L);
    gardenSeparators(L);
  }

  // Planta primera
  {
    const L = LV.pri, b = L.base;
    slab(b, -T, W + T, -T, D + T, ST, M.slab);
    floorHole(b, 0, W, 0, D, ST, M.wood, 0.004);
    floor(b, 0, 4.04, 2.36, 5.73, M.bath, 0.012);
    floor(b, 0, 7.525, 2.36, D, M.bath, 0.012);
    const front = [[0.70, 2.10, 0.6, 2.3, true], [2.99, 4.39, 0.6, 2.3, true]];
    shell(L, H, front, [[0.97, 2.07, 1.0, 2.2, true], [2.59, 4.39, 0.3, 2.3, true]]);
    cladding(L, front, H);
    ledges(L.walls, LEDGES.pri, 0, H, L);
    shutter(L.walls, 0.70, 2.10, 2.3, -T + 0.03, 0.45);
    shutter(L.walls, 2.99, 4.39, 2.3, -T + 0.03, 0.6);
    shutter(L.walls, 2.59, 4.39, 2.3, D + T - 0.03, 0.35);
    iw(L, 'z', 0, 3.32, 2.40);
    iw(L, 'x', 1.43, 2.44, 3.34, [[1.53, 2.33, -1, 'b']]);   // dormitorio 3 (3,30)
    iw(L, 'z', 3.34, 4.0, 1.47);
    iw(L, 'x', 0, 2.44, 4.0);
    iw(L, 'z', 4.0, 5.80, 2.40, [[4.25, 4.95, -1, 'a']]);    // baño 2
    iw(L, 'x', 0, 2.44, 5.77);                                // baño 2 (1,65) | vestidor
    iw(L, 'x', 2.36, 3.36, 3.02, [[2.47, 3.27, -1, 'a']]);   // dormitorio 2 (2,98)
    iw(L, 'z', 3.02, 3.66, 3.32);
    iw(L, 'x', 3.28, W, 3.66);
    iw(L, 'x', 2.36, W, 5.80, [[2.47, 3.27, 1, 'a', false]]); // dormitorio 1 (3,63): solo hueco, sin puerta
    iw(L, 'x', 0, 2.44, 7.485);                               // vestidor (1,61) | baño 1
    iw(L, 'z', 7.485, D, 2.40, [[8.45, 9.10, 1, 'a', false]]); // baño 1 (1,93): solo hueco, sin puerta
    stairs(L);

    // dormitorio 3: cama de 1,20
    F(L, Fu.bed(1.2, 1.9, 0x9fb4c7), 1.06, 1.3, Math.PI / 2);          // pegada a la ventana
    F(L, Fu.nightstand(), 0.25, 0.36, Math.PI / 2);
    F(L, Fu.wardrobe(1.41, 0.58), 0.72, 3.67, Math.PI);
    F(L, Fu.rug(1.2, 1.6, 0xe0d8ca), 1.6, 1.4);
    F(L, Fu.art(0.6, 0.8, 2, 1.55), 0.01, 1.27, Math.PI / 2);
    F(L, Fu.curtain(0.35, 2.3), 0.62, 0.08);
    F(L, Fu.curtain(0.35, 2.3), 2.18, 0.08);
    // dormitorio 2: cama de 1,20
    F(L, Fu.bed(1.2, 1.9, 0xc9b8a6), W - 1.06, 1.55, -Math.PI / 2);
    F(L, Fu.nightstand(), W - 0.25, 0.64, -Math.PI / 2);
    F(L, Fu.nightstand(), W - 0.25, 2.46, -Math.PI / 2);
    F(L, Fu.wardrobe(2.16, 0.56), 4.44, 3.34, Math.PI);
    F(L, Fu.rug(1.3, 1.7, 0xd8d0c2), 4.0, 1.55);
    F(L, Fu.art(0.9, 0.6, 0, 1.6), W - 0.01, 1.55, -Math.PI / 2);
    F(L, Fu.curtain(0.35, 2.3), 2.9, 0.08);
    F(L, Fu.curtain(0.35, 2.3), 4.48, 0.08);
    // baño 2: bañera con mampara, inodoro y lavabo
    F(L, Fu.tub(0.62, 1.52), 0.33, 4.86);
    screenPanel(L.furn, 'z', 0.655, 4.06, 4.86, 0.55, 2.0);              // mampara corredera de dos hojas
    screenPanel(L.furn, 'z', 0.675, 4.78, 5.6, 0.55, 2.0);
    box(L.furn, 0.0, 0, 4.04, 0.01, 2.1, 5.73, M.wallTile);
    box(L.furn, 0.0, 0.55, 4.04, 0.64, 2.1, 4.05, M.wallTile);
    F(L, Fu.wc(), 1.05, 5.3, Math.PI);
    F(L, Fu.vanity(0.65, 0.45, 1), 1.95, 5.39, Math.PI);
    F(L, Fu.towel(0.45, 0.55, 0xc9d4d8), 2.35, 5.35, -Math.PI / 2);
    // dormitorio 1 y vestidor
    F(L, Fu.rug(2.2, 2.6, 0xe3dccf), 4.4, 7.8);
    F(L, Fu.bed(1.6, 2.0, 0xb7c4b0), W - 1.11, 7.8, -Math.PI / 2);
    F(L, Fu.nightstand(), W - 0.25, 6.7, -Math.PI / 2);
    F(L, Fu.nightstand(), W - 0.25, 8.9, -Math.PI / 2);
    F(L, Fu.wardrobe(0.7, 0.45, 0.8, M.oak), 2.66, 8.0, Math.PI / 2);
    F(L, Fu.art(1.2, 0.7, 1, 1.75), W - 0.01, 7.8, -Math.PI / 2);
    F(L, Fu.curtain(0.4, 2.3), 2.66, D - 0.08);
    F(L, Fu.curtain(0.4, 2.3), 4.4, D - 0.08);
    box(L.walls, 0, 0, 5.81, 0.65, H, 6.30, M.wall);                       // pilar en la esquina del vestidor (el mismo de la cocina)
    L.rec.push({ axis: 'x', a: 0, b: 0.65, c: 6.055, th: 0.49, kind: 'solid' });
    F(L, Fu.openWardrobe(1.6, 0.48), 1.48, 6.055);
    F(L, Fu.openWardrobe(2.25, 0.48), 1.175, 7.205, Math.PI);
    box(L.furn, 0.0, 0.08, 6.36, 0.03, 2.1, 6.9, M.oak);
    box(L.furn, 0.03, 0.12, 6.4, 0.04, 2.06, 6.86, M.mirror);
    // baño 1
    rbox(L.furn, 0.02, 0, 7.545, 0.76, 0.04, D - 0.02, M.ceramic, 0.01);    // plato de ducha de 0,74 × 1,92 m
    box(L.furn, 0.3, 0.041, 9.1, 0.48, 0.043, 9.3, M.steel);
    screenPanel(L.furn, 'z', 0.77, 7.55, 8.8, 0.04, 2.0);                 // mampara fija, entrada por el fondo
    box(L.furn, 0.0, 0, 7.525, 0.01, 2.1, D, M.wallTile);
    box(L.furn, 0.0, 0, 7.525, 0.76, 2.1, 7.535, M.wallTile);
    box(L.furn, 0.0, 0, D - 0.01, 0.76, 2.1, D, M.wallTile);
    cyl(L.furn, 0.15, 0.15, 0.012, 0.38, 2.15, 8.3, M.steel);              // rociador de techo
    cyl(L.furn, 0.012, 0.012, 2.15, 0.04, 0, 8.3, M.steel);
    L.fp.push([0.02, 7.545, 0.76, D - 0.02]);
    item(L, 'baño 1: ducha y mampara', 0.02, 0, 7.545, 0.79, 2.0, D - 0.02);
    F(L, Fu.vanity(1.3, 0.6, 2), 1.68, 7.83);
    F(L, Fu.wc(), 1.62, D - 0.36, Math.PI);
  }

  // Solárium
  {
    const L = LV.cub, b = L.base, Z0 = -OV, Z1 = D + OV;
    slab(b, -T, W + T, Z0, Z1, ST, M.slab);
    floorHole(b, 0, W, Z0, Z1, ST, M.roof, 0.004);
    wall(L, 'z', Z0, Z1, -T / 2, T, 1.0, [], M.ext);
    wall(L, 'z', Z0, Z1, W + T / 2, T, 1.0, [], M.ext);
    wall(L, 'x', 0, W, Z1 - 0.02, 0.04, 1.0, [[0, W, 0, 0.97, true]], M.ext);
    // casetón de escalera (2,57 m de fondo, a 2,25 m de la medianera), sin ventana
    wall(L, 'z', 3.59, 6.11, 2.24, 0.12, 2.6, [[4.41, 5.28, 0, 2.1, false, -1, 'b']], M.ext);
    wall(L, 'x', 2.18, W, 3.65, 0.12, 2.6, [], M.ext);
    wall(L, 'x', 2.18, W, 6.05, 0.12, 2.6, [], M.ext);
    wall(L, 'z', 3.59, 6.11, W + T / 2, T, 2.6, [], M.ext);
    box(L.walls, 2.12, 2.6, 3.53, W + T + 0.04, 2.8, 6.17, M.ext);
    // columna junto a la medianera, enfrente de la salida del casetón (plano de cubierta)
    box(L.walls, 0, 0, 5.73, 0.72, 2.3, 6.5, M.ext);
    box(L.walls, -0.03, 2.3, 5.7, 0.75, 2.38, 6.53, M.band);
    L.rec.push({ axis: 'x', a: 0, b: 0.72, c: 6.115, th: 0.77, kind: 'solid' });

    // porche bioclimático: lamas orientables y cortinas de cristal Lumon
    const p = L.walls, YT = 2.55;
    for (const x of [0, W - 0.12]) box(p, x, 0, Z0, x + 0.12, YT + 0.2, Z0 + 0.12, M.alu);
    box(p, 0, YT, Z0, W, YT + 0.2, Z0 + 0.14, M.alu);
    box(p, 0, YT, Z0, 0.14, YT + 0.2, 3.59, M.alu);
    box(p, W - 0.14, YT, Z0, W, YT + 0.2, 3.59, M.alu);
    box(p, 0, YT, 3.45, 2.18, YT + 0.2, 3.59, M.alu);
    for (let z = Z0 + 0.22; z < 3.45; z += 0.21) {
      const s = box(p, 0.14, -0.012, -0.095, W - 0.14, 0.012, 0.095, M.alu);
      s.position.set(W / 2, YT + 0.1, z);
      s.rotation.x = 0.38;
    }
    lumon(p, 'x', 0.12, W - 0.12, Z0 + 0.07, 0, YT);
    lumon(p, 'z', Z0 + 0.14, 3.59, 0.07, 1.0, YT);
    lumon(p, 'z', Z0 + 0.14, 3.59, W - 0.07, 1.0, YT);
    lumon(p, 'x', 0.14, 2.18, 3.52, 0, YT, [0.85, 1.6]);
    L.rec.push({ axis: 'x', a: 0, b: W, c: Z0 + 0.07, th: 0.04, kind: 'glass' }, { axis: 'x', a: 0.14, b: 2.18, c: 3.52, th: 0.04, kind: 'glass' });
    F(L, Fu.outdoorSofa(2.2, 0.85), 0.5, 1.25, Math.PI / 2);                // sofás en L
    F(L, Fu.outdoorSofa(1.7, 0.85), 2.05, Z0 + 0.6);
    F(L, Fu.dining(0.95, 2.0, 3, M.teak, M.fabricOut), 3.55, 1.45, Math.PI / 2); // mesa de terraza grande
    F(L, Fu.chair(M.teak, M.fabricOut), 2.27, 1.45, Math.PI / 2);
    F(L, Fu.chair(M.teak, M.fabricOut), 4.83, 1.45, -Math.PI / 2);
    box(L.furn, 2.24, 0, 3.03, 2.3, 0.88, 3.63, M.lacq);
    box(L.furn, 3.84, 0, 3.03, 4.0, 0.88, 3.63, M.lacq);
    box(L.furn, 4.9, 0, 3.03, 5.5, 0.88, 3.63, M.lacq);
    box(L.furn, 2.24, 0.88, 3.03, 2.3, 0.92, 3.63, M.quartz);
    box(L.furn, 3.84, 0.88, 3.03, 4.0, 0.92, 3.63, M.quartz);
    box(L.furn, 4.9, 0.88, 3.03, 5.5, 0.92, 3.63, M.quartz);
    F(L, Fu.gymStation(), 4.8, 6.45);
    floor(b, W - 2.0, 6.05, W, 8.05, mat(0x292a2b, { roughness: 0.95 }), 0.014);
    L.fp.push([W - 2.0, 6.05, W, 8.05]);
    F(L, plant('potted_plant_01', 1.1, 'terra'), W - 0.6, Z0 + 0.6);

    // zona al jardín: lavadora, aire acondicionado, fregadero, barbacoa y tendedero
    const sink = grp();
    rbox(sink, -0.75, 0, -0.3, 0.75, 0.88, 0.3, M.lacq, 0.01);
    rbox(sink, -0.77, 0.88, -0.31, 0.77, 0.92, 0.31, M.quartz, 0.005);
    box(sink, -0.45, 0.915, -0.2, 0.05, 0.925, 0.2, M.steel);
    cyl(sink, 0.012, 0.012, 0.3, -0.2, 0.92, -0.25, M.steel);
    F(L, sink, 3.07, 3.33, Math.PI);
    F(L, Fu.bbq(), 4.45, 3.33, Math.PI);
    F(L, Fu.wardrobe(1.2, 0.64, 2.0, M.lacq), 0.32, 7.22, Math.PI / 2);
    for (const z of [8.18, 9.12]) F(L, (hasModel('exterior_aircon_unit') && model('exterior_aircon_unit', { child: 'exterior_aircon_unit' })) || Fu.acUnit(), 0.32, z, Math.PI / 2);
    F(L, Fu.dryingRack(1.32), 3.6, 9.55, Math.PI / 2);
    F(L, plant('potted_plant_02', 1.0, 'round'), 4.9, 9.8);
  }

  // suelo bajo tierra, visible cuando solo se ve el sótano
  const under = floor(new THREE.Group(), -150, -150, 160, 150, M.under, -FF - SL - 0.02);
  under.receiveShadow = true;
  scene.add(under);

  if (AUDIT) runAudit(LV);

  // fusión de geometría: pocas llamadas de dibujo
  for (const L of Object.values(LV)) {
    for (const g of [L.base, L.walls, L.furn]) instanceModels(g);
    bake(L.base);
    bake(L.walls);
    bake(L.furn);
    scene.add(L.g);
  }
}

// mampara de vidrio con perfiles de aluminio (a lo largo de z, en x = c)
function screenPanel(g, axis, c, a, b, y0, y1) {
  box(g, c - 0.005, y0, a, c + 0.005, y1, b, M.screen);
  box(g, c - 0.012, y1 - 0.03, a, c + 0.012, y1, b, M.metal);
  box(g, c - 0.012, y0, a, c + 0.012, y0 + 0.025, b, M.metal);
  box(g, c - 0.012, y0, b - 0.02, c + 0.012, y1, b, M.metal);
  box(g, c - 0.006, (y0 + y1) / 2 - 0.15, b - 0.05, c + 0.025, (y0 + y1) / 2 + 0.15, b - 0.035, M.steel);
}

// Cocina en L
function kitchen(L) {
  const g = L.furn, d = 0.62, z0 = 1.67, z1 = 5.0;
  box(g, 0, 0, z0, d - 0.06, 0.1, z1, M.dark);
  box(g, 0, 0.1, z0, d - 0.02, 0.88, z1, M.cabinet);
  rbox(g, 0, 0.88, z0, d, 0.92, z1, M.quartz, 0.004);
  box(g, d - 0.06, 0, z0, 0.96, 0.1, 2.23, M.dark);
  box(g, d - 0.02, 0.1, z0, 0.96, 0.88, 2.29, M.cabinet);
  rbox(g, d, 0.88, z0, 0.97, 0.92, 2.29, M.quartz, 0.004);
  // frigorífico americano de 0,90 m al final de la L
  rbox(g, 0.98, 0, z0 + 0.01, 1.88, 1.82, 2.4, M.steel, 0.025);
  box(g, 1.428, 0.05, 2.4, 1.432, 1.78, 2.405, M.dark);
  for (const x of [1.39, 1.47]) rbox(g, x - 0.012, 0.85, 2.41, x + 0.012, 1.5, 2.44, M.metal, 0.008);
  box(g, 1.15, 1.1, 2.4, 1.32, 1.42, 2.404, M.black);
  // fregadero bajo encimera, grifo y placa
  box(g, 0.1, 0.915, 2.5, 0.5, 0.925, 3.1, M.steel);
  const tap = cyl(g, 0.012, 0.012, 0.32, 0.06, 0.92, 2.8, M.steel);
  tap.scale.y = 1;
  rbox(g, 0.06, 1.2, 2.78, 0.22, 1.24, 2.82, M.steel, 0.01);
  rbox(g, 0.07, 0.92, 3.6, 0.55, 0.928, 4.2, M.black, 0.004);
  // muebles altos y campana
  box(g, 0, 1.5, z0, 0.35, 2.25, 3.5, M.cabinet);
  box(g, 0, 1.5, 4.3, 0.35, 2.25, z1, M.cabinet);
  for (let z = z0 + 0.6; z < 3.5; z += 0.6) box(g, 0.35, 1.52, z - 0.003, 0.352, 2.23, z + 0.003, M.dark);
  rbox(g, 0, 1.58, 3.55, 0.5, 1.7, 4.25, M.steel, 0.01);
  box(g, 0, 1.7, 3.75, 0.28, 2.6, 4.05, M.steel);
  // columnas de horno y despensa
  box(g, 0, 0, z1, 0.64, 2.25, 5.81, M.cabinet);                     // torre de horno + microondas integrado
  // columna de obra (el mismo pilar que en el vestidor de arriba)
  box(L.walls, 0, 0, 5.81, 0.65, H, 6.30, M.wall);
  L.rec.push({ axis: 'x', a: 0, b: 0.65, c: 6.055, th: 0.49, kind: 'solid' });
  box(g, 0.64, 0.8, 5.06, 0.65, 1.4, 5.6, M.black);
  box(g, 0.64, 1.46, 5.06, 0.65, 1.82, 5.6, M.black);
  box(g, 0.645, 1.36, 5.1, 0.66, 1.38, 5.56, M.steel);
  for (let z = 2.89; z < z1 - 0.1; z += 0.6) box(g, d - 0.02, 0.12, z - 0.003, d - 0.014, 0.86, z + 0.003, M.dark);
  // pequeños detalles
  cyl(g, 0.07, 0.08, 0.2, 0.3, 0.92, 4.5, M.steel);
  rbox(g, 0.15, 0.92, 2.0, 0.5, 0.94, 2.3, M.oak, 0.008);
  Fu.vase(g, 0.25, 0.92, 4.8, 0.8);
  L.fp.push([0, z0, d, z1], [d, z0, 0.96, 2.29], [0.98, z0, 1.88, 2.4], [0, z1, 0.65, 5.81]);
  item(L, 'cocina: frente largo', 0, 0, z0, d, 0.92, z1);
  item(L, 'cocina: tramo de la L', d, 0, z0, 0.97, 0.92, 2.29);
  item(L, 'cocina: frigorífico', 0.98, 0, z0 + 0.01, 1.88, 1.82, 2.43);
  item(L, 'cocina: torre de horno', 0, 0, z1, 0.65, 2.25, 5.81);
  item(L, 'cocina: altos y campana', 0, 1.5, z0, 0.5, 2.6, z1);
  box(g, 1.655, 0, 3.35, 2.035, 0.1, 5.35, M.dark);
  box(g, 1.645, 0.1, 3.35, 2.045, 0.88, 5.35, M.cabinet);
  rbox(g, 1.62, 0.88, 3.35, 2.07, 0.91, 5.35, M.quartz, 0.006);
  for (let z = 3.35 + 0.4; z < 5.35; z += 0.4) for (const x of [1.642, 2.048]) box(g, x - 0.004, 0.12, z - 0.003, x + 0.004, 0.86, z + 0.003, M.dark);
  fruitBowl(g, 1.845, 0.91, 4.35);
  L.fp.push([1.62, 3.35, 2.07, 5.35]);
  item(L, 'cocina: isla', 1.62, 0, 3.35, 2.07, 0.91, 5.35);
  Fu.pendant(g, 1.845, 3.85);
  Fu.pendant(g, 1.845, 4.85);
}
// frutero sobre la isla
function fruitBowl(g, x, y, z) {
  const geo = new THREE.LatheGeometry([[0.0, 0], [0.12, 0.01], [0.16, 0.07], [0.155, 0.075], [0.11, 0.015], [0, 0.012]].map(([a, b]) => new THREE.Vector2(a, b)), 32);
  const me = new THREE.Mesh(geo, M.ceramic);
  me.position.set(x, y, z);
  g.add(me);
  for (let i = 0; i < 5; i++) {
    const fr = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mat([0xe0902f, 0xc0392b, 0x9fbf3a][i % 3], { roughness: 0.45 }));
    fr.position.set(x + rnd(-0.06, 0.06), y + 0.06, z + rnd(-0.06, 0.06));
    g.add(fr);
  }
}

// Cortinas de cristal Lumon
function lumon(g, axis, a0, a1, c, y0, y1, gap = null) {
  const n = Math.max(1, Math.round((a1 - a0) / 0.7)), pw = (a1 - a0) / n;
  const piece = (a, b, ya, yb, th, m) => axis === 'x' ? box(g, a, ya, c - th / 2, b, yb, c + th / 2, m) : box(g, c - th / 2, ya, a, c + th / 2, yb, b, m);
  for (let i = 0; i < n; i++) {
    const a = a0 + i * pw + 0.006, b = a0 + (i + 1) * pw - 0.006;
    if (gap && a < gap[1] && b > gap[0]) continue;
    piece(a, b, y0 + 0.04, y1 - 0.04, 0.012, M.glass);
  }
  piece(a0, a1, y0, y0 + 0.04, 0.05, M.alu);
  piece(a0, a1, y1 - 0.05, y1, 0.06, M.alu);
}
