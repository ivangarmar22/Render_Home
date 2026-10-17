import * as THREE from 'three';
import { W, D, T, BZ0, BZ1, GZ, OV } from './config.js';
import { LV } from './house.js';

const INK = '#1d1d1f';

const ROOMS = [
  { lvl: 'baja', name: 'Aseo', area: '3,03 m²', dims: '1,86 × 1,59', r: [0, 0, 1.86, 1.59], lp: [0.93, 0.7], fs: 0.75 },
  { lvl: 'baja', name: 'Recibidor', area: '', dims: '', r: [1.94, 0, 3.28, 1.67], lp: [2.45, 1.35], fs: 0.7 },
  { lvl: 'baja', name: 'Despacho', area: '8,05 m²', dims: '2,18 × 3,67', r: [3.36, 0, W, 3.62], lp: [4.6, 2.55], fs: 0.8 },
  { lvl: 'baja', name: 'Cocina', area: '', dims: '', r: [0, 1.67, 1.0, 5.0], lp: [1.25, 4.8], fs: 0.75 },
  { lvl: 'baja', name: 'Salón-comedor-cocina', area: '35,26 m²', dims: '5,54 × 3,56', r: [0, 5.91, W, D], lp: [2.3, 9.25], fs: 0.8 },
  { lvl: 'baja', name: 'Terraza', area: '17,20 m²', dims: '5,62 × 3,00', r: [-T, GZ, W + T, GZ + 3], lp: [2.75, GZ + 2.75], out: true },
  { lvl: 'baja', name: 'Jardín', area: '22,94 m²', dims: '5,62 × 4,05', r: [-T, GZ + 3, W + T, GZ + 7.05], lp: [1.9, GZ + 5.0], out: true },
  { lvl: 'baja', name: 'Calle peatonal', area: '', dims: '', r: [-T, -4.4, W + T, -T], lp: [1.6, -3.6], out: true, fs: 0.8 },
  { lvl: 'pri', name: 'Dormitorio 1', area: '14,95 m²', dims: '3,15 × 3,63', r: [2.44, 5.84, W, D], lp: [3.4, 9.1], fs: 0.85 },
  { lvl: 'pri', name: 'Vestidor', area: '', dims: '2,36 × 1,61', r: [0, 5.81, 2.36, 7.445], lp: [1.4, 6.7], fs: 0.6 },
  { lvl: 'pri', name: 'Dormitorio 2', area: '10,85 m²', dims: '3,15 × 2,98', r: [2.44, 0, W, 2.98], lp: [3.65, 2.65], fs: 0.8 },
  { lvl: 'pri', name: 'Dormitorio 3', area: '9,29 m²', dims: '2,36 × 3,30', r: [0, 0, 2.36, 3.28], lp: [1.2, 0.55], fs: 0.8 },
  { lvl: 'pri', name: 'Baño 1', area: '4,41 m²', dims: '2,26 × 1,93', r: [0, 7.525, 2.36, D], lp: [1.55, 8.6], fs: 0.7 },
  { lvl: 'pri', name: 'Baño 2', area: '3,87 m²', dims: '2,30 × 1,65', r: [0, 4.04, 2.36, 5.73], lp: [1.45, 4.5], fs: 0.7 },
  { lvl: 'pri', name: 'Pasillo', area: '2,50 m²', dims: '', r: [2.44, 3.06, 3.28, 5.76], lp: [2.86, 5.3], fs: 0.55 },
  { lvl: 'cub', name: 'Solárium', area: '45,58 m²', dims: '', r: [0, 6.11, W, D + OV], lp: [2.6, 9.6] },
  { lvl: 'cub', name: 'Porche bioclimático', area: '', dims: '', r: [0, -OV, W, 3.59], lp: [2.8, 2.6], fs: 0.75 },
  { lvl: 'cub', name: 'Casetón', area: '1,58 m²', dims: '', r: [2.3, 3.70, W, 5.99], lp: [4.2, 6.45], fs: 0.6 },
  { lvl: 'sot', name: 'Plaza A', area: '14,47 m²', dims: '2,80 × 5,17', r: [0, BZ0, 2.80, 3.555], lp: [1.4, 3.25], fs: 0.8 },
  { lvl: 'sot', name: 'Plaza B', area: '14,50 m²', dims: '2,93 × 4,95', r: [2.80, BZ0, W, 3.555], lp: [4.17, 3.25], fs: 0.8 },
  { lvl: 'sot', name: 'Vestíbulo', area: '1,95 m²', dims: '', r: [0, 3.705, 1.06, 5.33], lp: [0.55, 4.6], fs: 0.55 },
  { lvl: 'sot', name: 'Juegos', area: '', dims: '', r: [0, 5.4, 2.4, 9.0], lp: [1.3, 6.1], fs: 0.75 },
  { lvl: 'sot', name: 'Estudio', area: '', dims: '', r: [3.4, 6.0, W, 9.0], lp: [4.0, 6.35], fs: 0.75 },
  { lvl: 'sot', name: 'Aerotermia', area: '', dims: '', r: [1.14, 3.705, 3.32, 4.715], lp: [2.3, 4.3], fs: 0.5 },
  { lvl: 'sot', name: 'Trastero', area: '7,81 m²', dims: '5,54 × 1,41', r: [0, 9.08, W, BZ1], lp: [1.6, 9.85] },
  { lvl: 'sot', name: 'Calle de garaje', area: '', dims: '', r: [-T, BZ0 - 4.5, W + T, BZ0], lp: [2.75, BZ0 - 2.2], out: true, fs: 0.8 },
];
const COTAS = {
  baja: [[0, -0.7, 1.86, -0.7, '1,86'], [1.94, -0.7, 3.28, -0.7, '1,30'], [3.36, -0.7, W, -0.7, '2,18'], [-0.7, 0, -0.7, 1.59, '1,59'], [-0.7, 1.67, -0.7, D, '7,78'],
    [W + 0.7, 0, W + 0.7, 3.62, '3,67'], [W + 0.7, 5.91, W + 0.7, D, '3,56'], [0, D + 0.7, W, D + 0.7, '5,54'],
    [W + 0.7, GZ, W + 0.7, GZ + 3, '3,00'], [W + 0.7, GZ + 3, W + 0.7, GZ + 7.05, '4,05']],
  pri: [[0, -0.7, 2.36, -0.7, '2,36'], [2.44, -0.7, W, -0.7, '3,15'], [-0.7, 0, -0.7, 3.3, '3,30'],
    [-0.7, 4.04, -0.7, 5.73, '1,65'], [-0.7, 5.81, -0.7, 7.445, '1,61'], [-0.7, 7.525, -0.7, D, '1,93'],
    [W + 0.7, 0, W + 0.7, 2.98, '2,98'], [W + 0.7, 5.84, W + 0.7, D, '3,63'], [2.44, D + 0.7, W, D + 0.7, '3,15']],
  cub: [[0, -OV - 0.5, W, -OV - 0.5, '5,54'], [-0.7, -OV, -0.7, D + OV, '11,36'], [W + 0.7, 3.59, W + 0.7, 6.11, '2,57'], [0, 3.2, 2.24, 3.2, '2,25']],
  sot: [[0, BZ0 - 0.7, 2.8, BZ0 - 0.7, '2,80'], [2.8, BZ0 - 0.7, W, BZ0 - 0.7, '2,93'],
    [W + 0.7, 3.705, W + 0.7, BZ1, '6,75'], [-0.7, 9.08, -0.7, BZ1, '1,41'], [0, BZ1 + 0.7, W, BZ1 + 0.7, '5,54'], [-0.7, 3.705, -0.7, 5.37, '1,62']],
};
const SHEETS = {
  baja: [-1.4, -4.6, W + 1.4, GZ + 7.9],
  pri: [-1.4, -1.5, W + 1.4, D + 1.4],
  cub: [-1.4, -2.0, W + 1.4, D + 1.9],
  sot: [-1.4, BZ0 - 5.2, W + 1.4, BZ1 + 1.5],
};
const TITLES = { baja: 'PLANTA BAJA', pri: 'PLANTA PRIMERA', cub: 'SOLÁRIUM', sot: 'PLANTA BAJO RASANTE' };

function drawSheet(L, maxAniso, maxTex) {
  const [x0, z0, x1, z1] = SHEETS[L.k], s = 110;
  // la planta baja es la portada: se dibuja a ~2,5× (sin pasar del máximo de la GPU)
  const k = Math.min(L.k === 'baja' ? 2.5 : 1.6, maxTex / ((Math.max(x1 - x0, z1 - z0)) * s));
  const c = document.createElement('canvas');
  c.width = Math.round((x1 - x0) * s * k);
  c.height = Math.round((z1 - z0) * s * k);
  const g = c.getContext('2d'), X = x => (x - x0) * s, Z = z => (z - z0) * s;
  g.scale(k, k);
  const serif = px => `${px}px "Instrument Serif", Georgia, serif`;
  const mono = px => `${px}px "Geist Mono", ui-monospace, monospace`;

  g.fillStyle = '#efebe2';
  g.fillRect(0, 0, c.width / k, c.height / k);
  g.strokeStyle = 'rgba(29,29,31,.05)';
  g.lineWidth = 1;
  for (let x = Math.ceil(x0); x <= x1; x++) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), c.height / k); g.stroke(); }
  for (let z = Math.ceil(z0); z <= z1; z++) { g.beginPath(); g.moveTo(0, Z(z)); g.lineTo(c.width / k, Z(z)); g.stroke(); }

  g.setLineDash([8, 6]);
  g.strokeStyle = 'rgba(29,29,31,.35)';
  g.lineWidth = 1.5;
  ROOMS.filter(r => r.lvl === L.k && r.out).forEach(({ r: [a, b, cc, d] }) => g.strokeRect(X(a), Z(b), (cc - a) * s, (d - b) * s));
  g.setLineDash([]);

  g.strokeStyle = 'rgba(29,29,31,.4)';
  g.lineWidth = 1.4;
  L.fp.forEach(([a, b, cc, d]) => {
    if (a < x0 - 1 || cc > x1 + 1 || b < z0 - 1 || d > z1 + 1) return;
    g.strokeRect(X(a), Z(b), (cc - a) * s, (d - b) * s);
  });

  for (const w of L.rec) {
    const [ra, rb, rc, rd] = w.axis === 'x'
      ? [w.a, w.c - w.th / 2, w.b, w.c + w.th / 2]
      : [w.c - w.th / 2, w.a, w.c + w.th / 2, w.b];
    if (rc < x0 || ra > x1 || rd < z0 || rb > z1) continue;
    if (w.kind === 'solid') {
      g.fillStyle = INK;
      g.fillRect(X(ra), Z(rb), (rc - ra) * s, (rd - rb) * s);
    } else if (w.kind === 'glass') {
      g.strokeStyle = INK;
      g.lineWidth = 1.2;
      g.strokeRect(X(ra), Z(rb), (rc - ra) * s, (rd - rb) * s);
      g.beginPath();
      if (w.axis === 'x') { g.moveTo(X(w.a), Z(w.c)); g.lineTo(X(w.b), Z(w.c)); }
      else { g.moveTo(X(w.c), Z(w.a)); g.lineTo(X(w.c), Z(w.b)); }
      g.stroke();
    } else if (w.leaf !== false) {
      // puerta: hoja + arco de apertura, con bisagra en 'a' o en 'b'
      const r = (w.b - w.a) * s, sg = w.sign, hb = w.hinge === 'b';
      g.strokeStyle = 'rgba(29,29,31,.65)';
      g.lineWidth = 1.3;
      g.beginPath();
      if (w.axis === 'x') {
        const hx = X(hb ? w.b : w.a), hy = Z(w.c);
        g.moveTo(hx, hy); g.lineTo(hx, hy + sg * r);
        if (!hb) { g.moveTo(hx + r, hy); g.arc(hx, hy, r, 0, sg > 0 ? Math.PI / 2 : -Math.PI / 2, sg < 0); }
        else { g.moveTo(hx - r, hy); g.arc(hx, hy, r, Math.PI, sg > 0 ? Math.PI / 2 : Math.PI * 1.5, sg > 0); }
      } else {
        const hx = X(w.c), hy = Z(hb ? w.b : w.a);
        g.moveTo(hx, hy); g.lineTo(hx + sg * r, hy);
        if (!hb) { g.moveTo(hx, hy + r); g.arc(hx, hy, r, Math.PI / 2, sg > 0 ? 0 : Math.PI, sg > 0); }
        else { g.moveTo(hx, hy - r); g.arc(hx, hy, r, -Math.PI / 2, sg > 0 ? 0 : -Math.PI, sg < 0); }
      }
      g.stroke();
    }
  }

  g.textAlign = 'center';
  ROOMS.filter(r => r.lvl === L.k).forEach(rm => {
    const [a, b, cc, d] = rm.r, [lx, lz] = rm.lp || [(a + cc) / 2, (b + d) / 2], fs = rm.fs || 1;
    const px = X(lx), py = Z(lz);
    g.fillStyle = INK;
    g.font = serif(Math.round(36 * fs));
    g.fillText(rm.name, px, py);
    g.fillStyle = 'rgba(29,29,31,.86)';
    g.font = mono(Math.round(17 * fs));
    const sub = [rm.area, rm.dims && rm.dims + ' m'].filter(Boolean).join(' · ');
    if (sub) g.fillText(sub, px, py + 22 * fs);
  });

  g.font = mono(16);
  for (const [ax, az, bx, bz, txt] of COTAS[L.k] || []) {
    const p1 = [X(ax), Z(az)], p2 = [X(bx), Z(bz)];
    g.strokeStyle = 'rgba(29,29,31,.8)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(...p1); g.lineTo(...p2);
    for (const [x, y] of [p1, p2]) { g.moveTo(x - 6, y + 6); g.lineTo(x + 6, y - 6); }
    g.stroke();
    g.save();
    g.translate((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
    if (Math.abs(p2[0] - p1[0]) < Math.abs(p2[1] - p1[1])) g.rotate(-Math.PI / 2);
    g.fillStyle = INK;
    g.fillText(txt, 0, -7);
    g.restore();
  }

  g.textAlign = 'left';
  g.fillStyle = INK;
  g.font = mono(18);
  g.fillText(TITLES[L.k], X(x0 + 0.3), Z(z0 + 0.5));
  g.fillStyle = 'rgba(29,29,31,.6)';
  g.font = mono(14);
  g.fillText('ASIANPARK 25 · VIVIENDA 10 · COTAS EN METROS', X(x0 + 0.3), Z(z0 + 0.72));

  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = maxAniso;
  return tx;
}

// hojas de papel con el plano de cada planta + papel infinito de la portada
export function makeSheets(renderer, paperColor) {
  const aniso = renderer.capabilities.getMaxAnisotropy(), maxTex = renderer.capabilities.maxTextureSize;
  for (const k in LV) {
    const L = LV[k], [x0, z0, x1, z1] = SHEETS[k];
    const m = new THREE.MeshBasicMaterial({ map: drawSheet(L, aniso, maxTex), transparent: true, depthWrite: false, fog: false });
    // muestreo con sesgo de mipmap: el plano se lee de un nivel más detallado y el texto no se emborrona
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
        '#ifdef USE_MAP\n  diffuseColor *= texture2D( map, vMapUv, -0.9 );\n#endif');
    };
    const me = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m);
    me.rotation.x = -Math.PI / 2;
    me.position.set((x0 + x1) / 2, 0.035, (z0 + z1) / 2);
    me.renderOrder = 2;
    L.g.add(me);
    L.sheet = me;
  }
  const big = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({ color: paperColor, transparent: true, depthWrite: false, fog: false }));
  big.rotation.x = -Math.PI / 2;
  big.position.set(W / 2, 0.03, D / 2);
  big.renderOrder = 1;
  LV.baja.g.add(big);
  LV.baja.big = big;
}
