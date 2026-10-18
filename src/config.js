// Medidas reales de la vivienda 10 (m). x: medianera a medianera; z: fachada a jardín.
export const W = 5.54, D = 9.48;              // ancho y fondo interiores según las cotas generales del plano
export const BW = 5.66;                        // ancho acotado de la planta bajo rasante
export const T = 0.15, t = 0.08;              // muro exterior / tabique
export const H = 2.6, FF = 2.9, SL = 0.3;     // altura libre, planta a planta, forjado
export const PITCH = W + 2 * T;               // 5,84 m de fachada por vivienda
export const BZ0 = -1.40, BZ1 = 10.45;        // el sótano sobresale bajo la calle y la terraza
export const GZ = D + T;                      // arranque de la terraza
export const OV = 0.94;                       // vuelo de la cubierta (11,36 m de solárium)
export const ST = { x0: 3.32, x1: W, z0: 3.70, z1: 5.76 }; // hueco de la escalera en U: 0,90 + 0,26 + 0,90
export const STREET_N = -7.6;                 // fachada del módulo de enfrente (calle peatonal de 7,45 m)

export const params = new URLSearchParams(location.search);
export const coarse = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
export const detailedQuality = globalThis.graphicsQuality === 'detailed';
export const lite = params.has('lite') || (coarse && !detailedQuality);

export const clamp01 = v => Math.min(1, Math.max(0, v));
export const ease = v => v * v * (3 - 2 * v);
export const easeIO = v => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

// Mantiene igual la distribución aleatoria en cada carga.
let seed = 7;
export const setSeed = s => { seed = Math.max(1, Math.floor(s)) % 2147483647; };
export const rnd = (a = 0, b = 1) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
