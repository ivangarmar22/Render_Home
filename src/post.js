import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, Effect, BlendFunction,
  BloomEffect, VignetteEffect, NoiseEffect, ChromaticAberrationEffect, SMAAEffect, SMAAPreset,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { lite } from './config.js';

// Conserva el color del plano y aplica un tono cálido a la escena construida.
class FinishEffect extends Effect {
  constructor() {
    super('FinishEffect', /* glsl */ `
      uniform float built;
      uniform float expo;
      vec3 softClip(vec3 c) { vec3 k = vec3(0.88); vec3 o = max(c - k, 0.0); return min(c, k) + (1.0 - k) * (1.0 - exp(-o / (1.0 - k))); }
      vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 c = max(inputColor.rgb, 0.0);
        vec3 film = aces(c * expo * vec3(1.02, 1.0, 0.97));
        float l = dot(film, vec3(0.2126, 0.7152, 0.0722));
        film = mix(vec3(l), film, 1.06);
        film = film * film * (3.0 - 2.0 * film) * 0.35 + film * 0.65;   // algo más de contraste
        outputColor = vec4(mix(softClip(c), film, built), inputColor.a);
      }`, { uniforms: new Map([['built', new THREE.Uniform(0)], ['expo', new THREE.Uniform(0.6)]]) });
  }
}

export function createPost(renderer, scene, camera) {
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
  composer.addPass(new RenderPass(scene, camera));

  let ao = null;
  if (!lite) {
    ao = new N8AOPostPass(scene, camera, 1, 1);
    Object.assign(ao.configuration, {
      screenSpaceRadius: true, aoRadius: 34, distanceFalloff: 0.22, intensity: 2.6,
      transparencyAware: false, gammaCorrection: false, halfRes: false,
    });
    ao.setQualityMode('Medium');
    composer.addPass(ao);
  }

  const finish = new FinishEffect();
  const bloom = new BloomEffect({ mipmapBlur: true, intensity: 0.35, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, radius: 0.72 });
  composer.addPass(new EffectPass(camera, bloom, finish));
  const smaa = new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH }));
  composer.addPass(smaa);

  const grain = new NoiseEffect({ premultiply: false, blendFunction: BlendFunction.OVERLAY });
  grain.blendMode.opacity.value = 0.09;
  const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.42 });
  const chroma = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0006, 0.0006), radialModulation: true, modulationOffset: 0.35 });
  composer.addPass(new EffectPass(camera, chroma, vignette, grain));

  return {
    composer,
    setBuilt(v) {
      finish.uniforms.get('built').value = v;
      // SMAA difumina las etiquetas del plano; se activa solo en la vista construida.
      grain.blendMode.opacity.value = 0.06 + 0.01 * v;
      chroma.offset.set(0.0006 * v, 0.0006 * v);
      smaa.enabled = v > 0.001;
    },
  };
}
