// Ruido 3D de valor suavizado y fbm para dar formas orgánicas a la vegetación.
function hash(x, y, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const fade = f => f * f * (3 - 2 * f);
const lerp = (a, b, k) => a + (b - a) * k;

export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

export function fbm(x, y, z, octaves = 3) {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let i = 0; i < octaves; i++) { s += a * noise3(x * f, y * f, z * f); n += a; f *= 2.03; a *= 0.5; }
  return s / n;
}
