import 'lenis/dist/lenis.css';
import './style.css';
import * as THREE from 'three';
import Lenis from 'lenis';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { W, lite, params, clamp01, ease, easeIO } from './config.js';
import { M, allTextures } from './materials.js';
import { LV, buildWorld } from './house.js';
import { makeSheets } from './plan.js';
import { KEYS, V, resolveKeys } from './tour.js';
import { createPost } from './post.js';
import { loadModels } from './models.js';

// Registra la carga antes de iniciar otras tareas para no perder el aviso del gestor.
const assetsReady = new Promise(r => { THREE.DefaultLoadingManager.onLoad = r; setTimeout(r, 15000); });

const PAPER = new THREE.Color('#efebe2'), GROUND = new THREE.Color('#cdc6b6');
const BASE = import.meta.env.BASE_URL;
const $ = id => document.getElementById(id);

// Renderizado
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;   // el tono lo aplica el postprocesado
// Recupera la escena si el navegador restaura el contexto gráfico.
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.body.classList.add('lost'); });
canvas.addEventListener('webglcontextrestored', () => location.reload());

const scene = new THREE.Scene();
scene.background = PAPER.clone();
const ENV_I = 0.8, SUN_I = 2.0;
scene.environmentIntensity = ENV_I;
scene.backgroundIntensity = 1.35;
scene.fog = new THREE.Fog(0xd9d6ce, 170, 560);

const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 900);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enabled: false, enableDamping: true, maxPolarAngle: Math.PI / 2 - 0.03, minDistance: 1.2, maxDistance: 140 });

// Luz y cielo
scene.add(new THREE.HemisphereLight(0xf4f6f8, 0x8d8a84, 0.2));
const sun = new THREE.DirectionalLight(0xfff0e0, 2.0);
const SUN_DIR = new THREE.Vector3(-0.14, 0.82, 0.56).normalize();   // sol alto desde el sur (lado jardín)
sun.castShadow = true;
sun.shadow.mapSize.setScalar(lite ? 2048 : 4096);
sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.025;
Object.assign(sun.shadow.camera, { near: 1, far: 280 });
scene.add(sun, sun.target);
let shadowSize = 0;
// Ajusta el área de sombra al encuadre para aprovechar mejor la resolución.
function aimSun(target, dist) {
  const size = Math.min(75, Math.max(10, dist * 0.8));
  if (Math.abs(size - shadowSize) > 0.4) {
    shadowSize = size;
    Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size });
    sun.shadow.camera.updateProjectionMatrix();
  }
  const texel = (2 * shadowSize) / sun.shadow.mapSize.x;
  sun.target.position.set(Math.round(target.x / texel) * texel, target.y, Math.round(target.z / texel) * texel);
  sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 140);
}

// Se mantiene en escena para evitar recompilar shaders al cambiar de planta.
const basementLights = [[2.8, 1.0], [1.4, 6.6], [4.1, 7.2], [2.8, 9.6]].map(([x, z]) => {
  const l = new THREE.PointLight(0xffe9d2, 0, 8, 2);
  l.position.set(x, -0.55, z);
  scene.add(l);
  return l;
});

let skyTex = null;
new THREE.TextureLoader().load(`${BASE}sky/sky.jpg`, tx => {
  tx.mapping = THREE.EquirectangularReflectionMapping;
  tx.colorSpace = THREE.SRGBColorSpace;
  skyTex = tx;
});
new RGBELoader().load(`${BASE}sky/sky.hdr`, hdr => {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromEquirectangular(hdr).texture;
  hdr.dispose();
  pm.dispose();
});

// Escena
await loadModels();
buildWorld(scene);
resolveKeys(LV);
const post = createPost(renderer, scene, camera);

// v: 0 oculta, 1 plano, 2 construida.
let useSky = false;
function applyLevels(vs, rising) {
  let built = 0;
  for (const k in LV) {
    const L = LV[k], v = vs[k], up = rising ? rising[k] : true;
    const vis = up ? v > 0.001 : v > 1.001;
    L.g.visible = vis;
    if (!vis) continue;
    const plan = clamp01(v), r = clamp01(v - 1);
    built = Math.max(built, r);
    L.walls.scale.y = Math.max(0.001, ease(r));
    L.furn.scale.y = Math.max(0.001, ease(clamp01((r - 0.35) / 0.65)));
    const op = up ? plan * (1 - clamp01(r / 0.5)) : 0;
    if (L.sheet) { L.sheet.material.opacity = op; L.sheet.visible = op > 0.002; }
    if (L.big) { L.big.material.opacity = op; L.big.visible = op > 0.002; }
  }
  // Bajo rasante, sustituye la luz exterior por la iluminación del sótano.
  const sotOn = LV.sot.g.visible && !LV.baja.g.visible ? ease(clamp01(vs.sot - 1)) : 0;
  for (const l of basementLights) l.intensity = 14 * sotOn;
  sun.intensity = SUN_I * (1 - 0.8 * sotOn);
  scene.environmentIntensity = ENV_I * (1 - 0.55 * sotOn);
  const rb = LV.baja.g.visible ? clamp01(vs.baja - 1) : 0;
  M.ground.color.copy(PAPER).lerp(GROUND, ease(rb));
  scene.background = useSky && skyTex ? skyTex : PAPER;
  post.setBuilt(ease(built));
  // Renderiza el plano a resolución nativa para mantener nítidas las etiquetas.
  if ((built < 0.001) !== paperView) {
    paperView = built < 0.001;
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(innerWidth, innerHeight, false);
    post.composer.setSize(innerWidth, innerHeight);
  }
}
let paperView = true;
const pixelRatio = () => Math.min(devicePixelRatio, paperView ? 2 : lite ? 1.25 : 1.5);

// Aleja el plano cercano con la cámara para evitar solapamientos visibles.
function setCamera(pos, tgt, fov) {
  camera.position.copy(pos);
  camera.lookAt(tgt);
  const d = pos.distanceTo(tgt);
  camera.near = Math.min(2, Math.max(0.05, d * 0.015));
  camera.far = Math.max(700, d * 12);
  if (fov) camera.fov = fov;
  camera.updateProjectionMatrix();
  aimSun(tgt, d);
}

// Recorrido
let aspect = 1, total = 0;
const fovFor = f => 2 * Math.atan(Math.tan(f * Math.PI / 360) * Math.pow(Math.max(1, 1.4 / aspect), 0.6)) * 180 / Math.PI;
const track = $('track');
const touch = matchMedia('(pointer: coarse)').matches;
// En vertical, desplaza la imagen para dejar espacio al texto.
const isPortrait = () => innerWidth < innerHeight && innerWidth <= 1100;
// Reserva más espacio en tablet, donde la ficha muestra también su descripción.
const portraitShift = () => (innerWidth <= 760 ? 0.06 : 0.12);
function viewShift() {
  if (isPortrait() && !free) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * portraitShift(), innerWidth, innerHeight);
  else camera.clearViewOffset();
}
// Ignora los cambios pequeños de innerHeight al aparecer o desaparecer la barra del navegador.
let vh = innerHeight, vw = innerWidth;
function layout() {
  if (!touch || innerWidth !== vw || Math.abs(innerHeight - vh) > 0.25 * vh) { vh = innerHeight; vw = innerWidth; }
  aspect = innerWidth / innerHeight;
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(innerWidth, innerHeight, false);
  post.composer.setSize(innerWidth, innerHeight);
  camera.aspect = aspect;
  viewShift();
  camera.updateProjectionMatrix();
  // En vertical, centra el plano en la parte superior; en horizontal, colócalo junto al texto.
  const portrait = isPortrait(), h = KEYS[0], f = fovFor(h.fov);
  const visH = portrait ? Math.max(22, 9 / aspect) : Math.max(13.5, 9 / aspect);
  const dist = visH / (2 * Math.tan(f * Math.PI / 360)), off = aspect > 1.15 ? 0.2 * visH * aspect : 0;
  const up = portrait ? (0.12 - portraitShift()) * visH : 0;
  h.P.set(W / 2 - off, dist, 4.85 + up);
  h.Tg.set(W / 2 - off, 0, 4.8 + up);
  let u = 0;
  KEYS.forEach(k => { k.h0 = u; u += k.hold; k.h1 = u; u += k.go; });
  total = KEYS[KEYS.length - 1].h1;
  track.style.height = (total + 1) * vh + 'px';
  placeMarks();
}
function sample(u) {
  for (let i = 0; i < KEYS.length; i++) {
    const k = KEYS[i], n = KEYS[i + 1];
    if (u <= k.h1 || !n) return { i, f: 0, hold: true };
    if (u < n.h0) return { i, f: (u - k.h1) / (n.h0 - k.h1), hold: false };
  }
}

// Interfaz
const card = $('card'), hero = $('hero'), hint = $('hint'), finale = $('finale'), ruler = $('ruler'), rulerNow = $('rulerNow'), progressNow = $('progressNow');
const countB = $('count').querySelector('b');
$('countTotal').textContent = KEYS.filter(k => k.card && k.card.no).length;
const marks = [];
const lenis = new Lenis({ lerp: 0.07, smoothWheel: true, wheelMultiplier: 0.9 });
KEYS.forEach((k, i) => {
  if (!k.card) return;
  const b = document.createElement('button');
  b.className = 'ruler__mark';
  b.innerHTML = `<span>${k.card.title}</span>`;
  b.setAttribute('aria-label', `Ir a ${k.card.title}`);
  b.addEventListener('click', () => lenis.scrollTo((k.h0 + k.hold * 0.5) * vh, { duration: 2.2 }));
  ruler.appendChild(b);
  marks.push({ b, i });
});
function placeMarks() { marks.forEach(({ b, i }) => { const k = KEYS[i]; b.style.top = ((k.h0 + k.h1) / 2 / total) * 100 + '%'; }); }

let shownCard = -1;
function showCard(i) {
  if (i === shownCard) return;
  shownCard = i;
  const c = i >= 0 ? KEYS[i].card : null;
  card.classList.remove('show');
  if (!c) return;
  $('cardNo').textContent = (c.no ? String(c.no).padStart(2, '0') + ' · ' : '') + c.kick;
  $('cardTitle').textContent = c.title;
  $('cardMeta').textContent = c.meta;
  $('cardText').textContent = c.text;
  requestAnimationFrame(() => card.classList.add('show'));
}

const _p = new THREE.Vector3(), _t = new THREE.Vector3(), lastTarget = new THREE.Vector3();
function applyScroll(u) {
  const st = sample(u), a = KEYS[st.i], b = KEYS[Math.min(st.i + 1, KEYS.length - 1)], e = easeIO(st.f);
  _p.lerpVectors(a.P, b.P, e);
  _t.lerpVectors(a.Tg, b.Tg, e);
  lastTarget.copy(_t);
  useSky = u > 0.35;
  setCamera(_p, _t, fovFor(a.fov + (b.fov - a.fov) * e));
  const vs = {}, rising = {};
  for (const k in LV) { vs[k] = a.v[k] + (b.v[k] - a.v[k]) * e; rising[k] = b.v[k] >= a.v[k]; }
  applyLevels(vs, rising);

  const ci = st.hold ? st.i : st.f < 0.18 ? st.i : st.f > 0.82 ? st.i + 1 : -1;
  showCard(ci >= 0 && KEYS[ci].card ? ci : -1);
  let no = 0;
  for (let i = 0; i <= (ci >= 0 ? ci : st.i); i++) if (KEYS[i].card && KEYS[i].card.no) no = KEYS[i].card.no;
  countB.textContent = String(no).padStart(2, '0');
  marks.forEach(m => m.b.classList.toggle('on', m.i === ci));
  rulerNow.style.top = clamp01(u / total) * 100 + '%';
  progressNow.style.transform = `scaleX(${clamp01(u / total)})`;
  const heroOp = 1 - clamp01(u / 0.5);
  hero.style.opacity = heroOp;
  hero.style.pointerEvents = heroOp > 0.5 ? '' : 'none';
  hint.style.opacity = 1 - clamp01(u / 0.3);
  finale.classList.toggle('show', u > KEYS[KEYS.length - 1].h0 - 0.15);
}

// Modo libre
let free = false;
const FLOORS = [['todo', 'Todo'], ['cub', 'Solárium'], ['pri', 'Primera'], ['baja', 'Baja'], ['sot', 'Sótano']];
const floorsEl = $('floors');
FLOORS.forEach(([k, label]) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.dataset.k = k;
  b.addEventListener('click', () => setFreeFloor(k));
  floorsEl.appendChild(b);
});
function setFreeFloor(k) {
  const order = ['baja', 'pri', 'cub'], vs = V({});
  if (k === 'sot') vs.sot = 2;
  else {
    const top = k === 'todo' ? 2 : order.indexOf(k);
    order.forEach((o, i) => { vs[o] = i <= top ? 2 : 0; });
  }
  applyLevels(vs);
  const y = k === 'todo' ? 2.5 : LV[k].y + 0.3, dy = y - controls.target.y;
  controls.target.y += dy;
  camera.position.y += dy;
  floorsEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
}
function enterFree() {
  free = true;
  lenis.stop();
  document.body.classList.add('free');
  useSky = true;
  controls.target.copy(lastTarget);
  controls.enabled = true;
  viewShift();
  controls.update();
  setFreeFloor('todo');
}
function exitFree() {
  free = false;
  controls.enabled = false;
  document.body.classList.remove('free');
  viewShift();
  lenis.start();
}
$('freeBtn').addEventListener('click', enterFree);
$('freeBtn2').addEventListener('click', enterFree);
$('exitFree').addEventListener('click', exitFree);
$('toTop').addEventListener('click', e => { e.preventDefault(); if (free) exitFree(); lenis.scrollTo(0, { duration: 2.5 }); });
// textos de manejo para pantallas táctiles
if (touch) {
  $('freehint').textContent = 'Arrastra para girar · Pellizca para acercar · Dos dedos para desplazar';
  document.querySelectorAll('[data-touch]').forEach(e => { e.textContent = e.dataset.touch; });
}

// Arranque
addEventListener('resize', layout);
layout();

// ?stop=N deja la cámara fija en una parada del recorrido.
const stop = params.get('stop');
const fixedU = stop !== null && KEYS[+stop] ? KEYS[+stop].h0 + KEYS[+stop].hold * 0.5 : null;

function frame(now) {
  requestAnimationFrame(frame);
  lenis.raf(now);
  if (!free) applyScroll(fixedU ?? lenis.animatedScroll / vh);
  else {
    controls.update();
    const d = camera.position.distanceTo(controls.target);
    camera.near = Math.min(2, Math.max(0.05, d * 0.015));
    camera.updateProjectionMatrix();
    aimSun(controls.target, d);
  }
  post.composer.render();
}

const fontsReady = Promise.race([
  Promise.all([document.fonts.load('36px "Instrument Serif"'), document.fonts.load('17px "Geist Mono"')]),
  new Promise(r => setTimeout(r, 2500)),
]).catch(() => {});

Promise.all([fontsReady, assetsReady]).then(async () => {
  makeSheets(renderer, PAPER);
  // Prepara texturas y shaders antes de mostrar la escena.
  allTextures().forEach(tx => renderer.initTexture(tx));
  for (const L of Object.values(LV)) L.g.visible = true;
  try { await renderer.compileAsync(scene, camera); } catch { /* sin soporte: se compila al vuelo */ }
  requestAnimationFrame(frame);
  if (stop !== null) $('loader').classList.add('done', 'instant');
  else setTimeout(() => $('loader').classList.add('done'), 350);
});
