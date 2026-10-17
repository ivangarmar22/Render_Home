import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { lite, params } from './config.js';

// Modelos 3D CC0 de Poly Haven (escaneados), optimizados con `npm run models`
const BASE = import.meta.env.BASE_URL;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const LIB = {};

const MODEL_IDS = [
  'island_tree_01', 'island_tree_02', 'tree_small_02', 'potted_plant_01', 'potted_plant_02', 'potted_plant_04',
  'searsia_lucida', 'exterior_aircon_unit', 'ceramic_vase_01', 'outdoor_table_chair_set_01',
];

export function loadModels() {
  if (lite && !params.has('models')) return Promise.resolve();   // en móvil se usan las versiones procedurales
  return Promise.all(MODEL_IDS.map(id => new Promise(resolve => {
    loader.load(`${BASE}models/${id}.glb`, gltf => {
      gltf.scene.traverse(o => {
        if (!o.isMesh) return;
        const m = o.material;
        if (m.map) m.map.anisotropy = 8;
        if (m.alphaTest > 0 || m.transparent) { m.transparent = false; m.alphaTest = Math.max(m.alphaTest, 0.5); m.side = THREE.DoubleSide; }
        m.envMapIntensity = 0.9;
      });
      LIB[id] = gltf.scene;
      resolve();
    }, undefined, () => resolve());
  })));
}

export const hasModel = id => !!LIB[id];

// copia de un modelo (o de uno de sus nodos hijos), apoyada en y=0 y centrada en x/z
export function model(id, { child = null, scale = 1, center = true } = {}) {
  const src = LIB[id];
  if (!src) return null;
  const node = child ? src.getObjectByName(child) : src;
  const inner = node.clone(true);
  inner.position.set(0, 0, 0);
  inner.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(inner);
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
