// ?audit activa la comprobación de colisiones antes de fusionar la geometría.
import * as THREE from 'three';
import { params } from './config.js';
import { M } from './materials.js';

export const AUDIT = params.has('audit');
const TOL = 0.015;   // tolerancia: contactos de hasta 1,5 cm se consideran apoyos, no choques

// Devuelve la ubicación desde la que se registró el objeto.
export function where() {
  const m = (new Error().stack.split('\n')[3] || '').match(/(https?:\/\/[^\s)]+):(\d+):(\d+)/);
  return m ? `${m[1]}#${m[2]}` : '?';
}
// Recupera el texto de la línea asociada a cada objeto.
async function labeler(names) {
  const texts = {};
  for (const n of new Set(names)) {
    const [url] = n.split('#');
    if (url.startsWith('http') && !(url in texts)) texts[url] = (await (await fetch(url)).text()).split('\n');
  }
  return n => {
    const [url, ln] = n.split('#');
    return texts[url] ? texts[url][+ln - 1].trim().slice(0, 95) : n;
  };
}
export function item(L, name, x0, y0, z0, x1, y1, z1) {
  if (!AUDIT) return;
  (L.items ||= []).push({ name, b: new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)) });
}
export function solid(L, name, x0, y0, z0, x1, y1, z1) {
  if (!AUDIT) return;
  (L.extra ||= []).push({ name, b: new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)) });
}

const pen = (a, b) => Math.min(
  Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x),
  Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y),
  Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z));
const fmt = b => `[${[b.min.x, b.min.z, b.max.x, b.max.z].map(v => v.toFixed(2)).join(', ')}]`;

export async function runAudit(LV) {
  // Guarda sólidos y huecos antes de fusionar la geometría.
  const names = new Map(Object.entries(M).map(([k, v]) => [v, k]));
  const levels = Object.values(LV).map(L => {
    // Incluye muros, pilares, puertas, vidrios, pérgolas y peldaños.
    const solids = [...(L.extra || [])];
    L.walls.updateMatrixWorld(true);
    L.walls.traverse(o => {
      if (!o.isMesh) return;
      solids.push({ name: names.get(o.material) || 'muro', b: new THREE.Box3().setFromObject(o) });
    });
    // Comprueba que las puertas y sus márgenes de 20 cm queden libres.
    const holes = L.rec.filter(r => r.kind === 'door').map(r => {
      const e = r.th / 2 + 0.2;
      const b = r.axis === 'x'
        ? new THREE.Box3(new THREE.Vector3(r.a + 0.02, 0.05, r.c - e), new THREE.Vector3(r.b - 0.02, 2.0, r.c + e))
        : new THREE.Box3(new THREE.Vector3(r.c - e, 0.05, r.a + 0.02), new THREE.Vector3(r.c + e, 2.0, r.b - 0.02));
      return { name: `hueco de puerta ${r.a.toFixed(2)}–${r.b.toFixed(2)}`, b };
    });
    return { L, items: L.items || [], solids, holes };
  });
  // Asigna nombres a los muebles y comprueba las intersecciones.
  const label = await labeler(levels.flatMap(l => l.items.map(i => i.name)));
  const out = [];
  for (const { L, items, solids, holes } of levels) {
    for (const i of items) i.name = label(i.name);
    for (const it of items) {
      const flat = it.b.max.y - it.b.min.y < 0.03;   // alfombras: solo cuentan contra muros
      for (const s of solids) {
        const p = pen(it.b, s.b);
        if (p > TOL) out.push(`${L.k} · ${it.name} ${fmt(it.b)} atraviesa ${s.name} ${fmt(s.b)} (${(p * 100).toFixed(0)} cm)`);
      }
      if (flat) continue;
      for (const h of holes) {
        const p = pen(it.b, h.b);
        if (p > TOL) out.push(`${L.k} · ${it.name} ${fmt(it.b)} invade el ${h.name} (${(p * 100).toFixed(0)} cm)`);
      }
    }
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (a.b.max.y - a.b.min.y < 0.03 || b.b.max.y - b.b.min.y < 0.03) continue;
      const p = pen(a.b, b.b);
      if (p > 0.02) out.push(`${L.k} · ${a.name} ${fmt(a.b)} choca con ${b.name} ${fmt(b.b)} (${(p * 100).toFixed(0)} cm)`);
    }
  }
  const pre = document.createElement('pre');
  pre.id = 'audit';
  pre.textContent = out.length ? out.join('\n') : 'SIN COLISIONES';
  pre.style.cssText = 'position:fixed;inset:0;z-index:99;overflow:auto;background:#fff;color:#000;font:12px monospace;padding:16px;margin:0';
  document.body.appendChild(pre);
  console.log(`[audit] ${out.length} incidencias`);
  return out;
}
