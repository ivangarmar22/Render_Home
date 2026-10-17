import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SL } from './config.js';

// UV a escala real en las 6 caras de una caja (texturas sin estirar)
function scaleBoxUV(geo, w, h, d, ts) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  const per = uv.count / 6;
  for (let f = 0; f < 6; f++) for (let v = 0; v < per; v++) {
    const i = f * per + v;
    uv.setXY(i, uv.getX(i) * dims[f][0] / ts, uv.getY(i) * dims[f][1] / ts);
  }
}
const at = (g, me, x, y, z) => { me.position.set(x, y, z); g.add(me); return me; };

export function box(g, x0, y0, z0, x1, y1, z1, m) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0, geo = new THREE.BoxGeometry(w, h, d);
  if (m.userData.ts) scaleBoxUV(geo, w, h, d, m.userData.ts);
  return at(g, new THREE.Mesh(geo, m), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
// caja con aristas redondeadas (cojines, tableros, electrodomésticos)
export function rbox(g, x0, y0, z0, x1, y1, z1, m, r = 0.04, seg = 3) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  r = Math.max(0.002, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  return at(g, new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, r), m), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
// cilindro apoyado en y (base)
export function cyl(g, rt, rb, h, x, y, z, m, seg = 28) {
  return at(g, new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m), x, y + h / 2, z);
}
// pieza de revolución a partir de un perfil [[radio, altura], ...]
export function lathe(g, pts, x, y, z, m, seg = 36) {
  return at(g, new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg), m), x, y, z);
}
export function sphere(g, r, x, y, z, m, sx = 1, sy = 1, sz = 1) {
  const me = at(g, new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m), x, y, z);
  me.scale.set(sx, sy, sz);
  return me;
}
// suelo horizontal con UV a escala real
export function floor(g, x0, z0, x1, z1, m, y = 0.003) {
  const w = x1 - x0, d = z1 - z0, ts = m.userData.ts || 1, geo = new THREE.PlaneGeometry(w, d), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w + x0) / ts, (uv.getY(i) * d - z1) / ts);
  const me = new THREE.Mesh(geo, m);
  me.rotation.x = -Math.PI / 2;
  return at(g, me, (x0 + x1) / 2, y, (z0 + z1) / 2);
}
export function slab(g, x0, x1, z0, z1, h, m) {
  if (!h) return box(g, x0, -SL, z0, x1, 0, z1, m);
  box(g, x0, -SL, z0, x1, 0, h.z0, m);
  box(g, x0, -SL, h.z1, x1, 0, z1, m);
  box(g, x0, -SL, h.z0, h.x0, 0, h.z1, m);
  if (x1 > h.x1) box(g, h.x1, -SL, h.z0, x1, 0, h.z1, m);
}
export function floorHole(g, x0, x1, z0, z1, h, m, y) {
  floor(g, x0, z0, x1, h.z0, m, y);
  floor(g, x0, h.z1, x1, z1, m, y);
  floor(g, x0, h.z0, h.x0, h.z1, m, y);
  if (x1 > h.x1) floor(g, h.x1, h.z0, x1, h.z1, m, y);
}

// Fusiona las mallas por material para reducir las llamadas de dibujo.
const KEEP = ['position', 'normal', 'uv', 'color'];
function flipWinding(geo) {
  for (const name of Object.keys(geo.attributes)) {
    const a = geo.attributes[name], s = a.itemSize, arr = a.array;
    for (let i = 0; i < a.count; i += 3) for (let k = 0; k < s; k++) {
      const p = (i + 1) * s + k, q = (i + 2) * s + k, tmp = arr[p];
      arr[p] = arr[q]; arr[q] = tmp;
    }
  }
}
export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map(), done = [];
  root.traverse(o => {
    if (!o.isMesh || o.userData.keep) return;
    const mtx = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(mtx);
    if (mtx.determinant() < 0) flipWinding(g);
    const cast = !o.material.transparent && o.geometry.type !== 'PlaneGeometry' && !o.userData.noCast;
    const key = o.material.uuid + (cast ? '+' : '-');
    if (!buckets.has(key)) buckets.set(key, { m: o.material, cast, geos: [] });
    buckets.get(key).geos.push(g);
    done.push(o);
  });
  for (const o of done) { o.removeFromParent(); o.geometry.dispose(); }
  for (const c of [...root.children]) if (!c.isMesh && !c.userData.keep) root.remove(c);
  for (const { m, cast, geos } of buckets.values()) {
    const merged = mergeGeometries(geos, false);
    geos.forEach(x => x.dispose());
    const mesh = new THREE.Mesh(merged, m);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}
