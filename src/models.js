import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { lite, detailedQuality, params } from './config.js';

// Modelos 3D CC0 de Poly Haven (escaneados), optimizados con `npm run models`
const BASE = import.meta.env.BASE_URL;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const LIB = {};

function recoloredAlbedo(texture, base) {
  if (!texture?.image || !texture.image.width || !texture.image.height) {
    throw new Error('La textura difusa del sofá no está disponible.');
  }
  const source = texture.image, canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo preparar la textura beige del sofá.');
  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  let mean = 0;
  for (let i = 0; i < pixels.length; i += 4) mean += pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
  mean /= pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    const luma = pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
    const shade = (luma - mean) * 0.58;
    for (let k = 0; k < 3; k++) pixels[i + k] = THREE.MathUtils.clamp(base[k] + shade + (pixels[i + k] - luma) * 0.12, 0, 255);
  }
  context.putImageData(imageData, 0, 0);
  const albedo = texture.clone();
  albedo.image = canvas;
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.needsUpdate = true;
  return albedo;
}

function sofaAlbedo(texture) {
  return recoloredAlbedo(texture, [201, 188, 170]);
}

function sofaMaterial(source) {
  const material = new THREE.MeshPhysicalMaterial().copy(source);
  material.color.set(0xffffff);
  material.map = sofaAlbedo(source.map);
  material.roughness = 0.94;
  material.metalness = 0;
  material.clearcoat = 0;
  material.sheen = 0.24;
  material.sheenRoughness = 0.9;
  material.sheenColor.set(0xffffff);
  material.envMapIntensity = 0.45;
  if (material.normalMap) material.normalScale.multiplyScalar(1.15);
  return material;
}

function diningChairMaterial(source) {
  const material = new THREE.MeshPhysicalMaterial().copy(source);
  material.color.set(0xffffff);
  material.map = recoloredAlbedo(source.map, [221, 210, 193]);
  material.roughness = 0.9;
  material.metalness = 0;
  material.clearcoat = 0;
  material.sheen = 0.18;
  material.sheenRoughness = 0.9;
  material.sheenColor.set(0xffffff);
  material.envMapIntensity = 0.45;
  return material;
}

const MODEL_IDS = [
  'island_tree_01', 'island_tree_02', 'tree_small_02', 'potted_plant_01', 'potted_plant_02', 'potted_plant_04',
  'searsia_lucida', 'exterior_aircon_unit', 'ceramic_vase_01', 'outdoor_table_chair_set_01',
];
const DETAILED_MODEL_IDS = ['Sofa_01', 'dining_table', 'dining_chair_02'];

export function loadModels() {
  if (lite && !params.has('models')) return Promise.resolve();   // en móvil se usan las versiones procedurales
  const ids = detailedQuality ? [...MODEL_IDS, ...DETAILED_MODEL_IDS] : MODEL_IDS;
  return Promise.all(ids.map(id => new Promise(resolve => {
    loader.load(`${BASE}models/${id}.glb`, gltf => {
      gltf.scene.traverse(o => {
        if (!o.isMesh) return;
        if (id === 'Sofa_01' && detailedQuality) {
          o.material = Array.isArray(o.material) ? o.material.map(sofaMaterial) : sofaMaterial(o.material);
        }
        if (id === 'dining_chair_02' && detailedQuality) {
          o.material = Array.isArray(o.material) ? o.material.map(diningChairMaterial) : diningChairMaterial(o.material);
        }
        const m = o.material;
        if (m.map) m.map.anisotropy = detailedQuality ? 16 : 8;
        if (m.alphaTest > 0 || m.transparent) { m.transparent = false; m.alphaTest = Math.max(m.alphaTest, 0.5); m.side = THREE.DoubleSide; }
        m.envMapIntensity = (id === 'Sofa_01' || id === 'dining_chair_02') && detailedQuality ? 0.45 : 0.9;
      });
      LIB[id] = gltf.scene;
      resolve();
    }, undefined, () => resolve());
  })));
}

export const hasModel = id => !!LIB[id];

// copia de un modelo (o de uno de sus nodos hijos), apoyada en y=0 y centrada en x/z
export function model(id, { child = null, scale = 1, size = null, center = true } = {}) {
  const src = LIB[id];
  if (!src) return null;
  const node = child ? src.getObjectByName(child) : src;
  const inner = node.clone(true);
  inner.position.set(0, 0, 0);
  inner.updateMatrixWorld(true);
  let b = new THREE.Box3().setFromObject(inner);
  if (size) {
    const dimensions = b.getSize(new THREE.Vector3());
    inner.scale.set(size[0] / dimensions.x, size[1] / dimensions.y, size[2] / dimensions.z);
    inner.updateMatrixWorld(true);
    b = new THREE.Box3().setFromObject(inner);
  }
  const c = b.getCenter(new THREE.Vector3());
  if (center) inner.position.set(-c.x, -b.min.y, -c.z);
  else inner.position.y = -b.min.y;
  const g = new THREE.Group();
  g.add(inner);
  g.scale.setScalar(scale);
  g.userData.model = id + (child || '');
  return g;
}

// Agrupa las copias de cada modelo en un InstancedMesh.
export function instanceModels(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const byKey = new Map(), done = [];
  root.traverse(o => {
    if (!o.userData.model) return;
    done.push(o);
    o.traverse(m => {
      if (!m.isMesh) return;
      const key = o.userData.model + '|' + m.geometry.uuid + '|' + m.material.uuid;
      if (!byKey.has(key)) byKey.set(key, { geo: m.geometry, mat: m.material, mats: [] });
      const mm = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      if (mm.determinant() < 0) mm.multiply(new THREE.Matrix4().makeScale(-1, 1, 1));   // las copias en espejo se dibujan sin invertir
      byKey.get(key).mats.push(mm);
    });
  });
  for (const o of done) o.removeFromParent();
  for (const { geo, mat, mats } of byKey.values()) {
    const im = new THREE.InstancedMesh(geo, mat, mats.length);
    mats.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = true;
    im.receiveShadow = true;
    im.userData.keep = true;
    im.computeBoundingSphere();
    root.add(im);
  }
}
