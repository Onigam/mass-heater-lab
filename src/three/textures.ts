import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { smoothstep } from './common';

// Procedural maps of the house, the machine and the land: no texture file, every map is generated once per page from a seeded lattice and stored as a DataTexture (no canvas, so
// it also builds in Node under vitest). No text in any of them: a film is captured with no interface.

const LN = 256;
const lattice = (() => {
  const r = rng(90210);
  const a = new Float32Array(LN * LN);
  for (let i = 0; i < a.length; i++) a[i] = r();
  return a;
})();

const sm = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise in 0..1 (any real x, y; the lattice repeats every 256 cells). */
export function vnoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = sm(x - ix);
  const fy = sm(y - iy);
  const x0 = ix & 255;
  const x1 = (ix + 1) & 255;
  const y0 = (iy & 255) * LN;
  const y1 = ((iy + 1) & 255) * LN;
  const a = lattice[y0 + x0];
  const b = lattice[y0 + x1];
  const c = lattice[y1 + x0];
  const d = lattice[y1 + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal noise in about 0..1. */
export function fbm(x: number, y: number, octaves = 4, gain = 0.5): number {
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    s += amp * vnoise(x * f + o * 17.3, y * f + o * 9.1);
    norm += amp;
    amp *= gain;
    f *= 2;
  }
  return s / norm;
}

/** Value noise that repeats every `px` cells in x and `py` in y (at most 256): for tileable maps. */
function tn(x: number, y: number, px: number, py: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = sm(x - ix);
  const fy = sm(y - iy);
  const x0 = ((ix % px) + px) % px;
  const x1 = (x0 + 1) % px;
  const y0 = (((iy % py) + py) % py) * LN;
  const y1 = (((((iy % py) + py) % py) + 1) % py) * LN;
  const a = lattice[y0 + x0];
  const b = lattice[y0 + x1];
  const c = lattice[y1 + x0];
  const d = lattice[y1 + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Tileable fractal noise: `cells` lattice cells across the unit square at the first octave. */
export function tf(u: number, v: number, cells: number, octaves = 3, cellsY = cells): number {
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  let cx = cells;
  let cy = cellsY;
  for (let o = 0; o < octaves; o++) {
    s += amp * tn(u * cx + o * 3.7, v * cy + o * 1.9, cx, cy);
    norm += amp;
    amp *= 0.5;
    cx *= 2;
    cy *= 2;
  }
  return s / norm;
}

const hash1 = (a: number, b: number): number => {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const b8 = (x: number): number => Math.max(0, Math.min(255, Math.round(x * 255)));

export interface TextureStat {
  name: string;
  size: number;
  bytes: number;
}
const stats: TextureStat[] = [];
export const textureStats = (): TextureStat[] => stats;

const cache = new Map<string, THREE.DataTexture>();

/** A square RGBA map made once; `fill` returns sRGB components in 0..1. */
function map(
  name: string,
  size: number,
  fill: (u: number, v: number, i: number, j: number) => [number, number, number],
  srgb = true,
): THREE.DataTexture {
  const hit = cache.get(name);
  if (hit) return hit;
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const [r, g, b] = fill(i / size, j / size, i, j);
      const k = (j * size + i) * 4;
      data[k] = b8(r);
      data[k + 1] = b8(g);
      data[k + 2] = b8(b);
      data[k + 3] = 255;
    }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 16;
  t.name = name;
  t.needsUpdate = true;
  cache.set(name, t);
  stats.push({ name, size, bytes: Math.round(size * size * 4 * (4 / 3)) });
  return t;
}

/** A copy of a map with its own repeat (same pixels on the GPU's side of three: `source` is shared). */
export function tiled(t: THREE.Texture, u: number, w = u): THREE.Texture {
  const c = t.clone();
  c.repeat.set(u, w);
  c.needsUpdate = true;
  return c;
}

/** Value of a tileable Voronoi: distance to the nearest of `G` × `G` jittered seeds, the second nearest, and an id. */
function voronoi(u: number, v: number, G: number, GY = G, jitter = 0.8): { d1: number; d2: number; id: number } {
  const gx = u * G;
  const gy = v * GY;
  const cx = Math.floor(gx);
  const cy = Math.floor(gy);
  let d1 = 9;
  let d2 = 9;
  let id = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const wx = (cx + dx + G) % G;
      const wy = (cy + dy + GY) % GY;
      const ox = 0.5 + jitter * (hash1(wx, wy) - 0.5);
      const oy = 0.5 + jitter * (hash1(wy + 7, wx + 3) - 0.5);
      const ex = cx + dx + ox - gx;
      const ey = cy + dy + oy - gy;
      const d = Math.sqrt(ex * ex + ey * ey);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = wx * 31 + wy;
      } else if (d < d2) d2 = d;
    }
  return { d1, d2, id };
}

/** Cast concrete: mottled, a speckle of aggregate. */
export const concreteMap = (): THREE.DataTexture =>
  map('concrete', 256, (u, v, i, j) => {
    const n = tf(u, v, 6, 4) - 0.5;
    const speck = hash1(i, j) > 0.93 ? -0.05 : hash1(j, i) > 0.97 ? 0.04 : 0;
    const k = 0.6 + 0.2 * n + speck;
    return [k * 1.02, k, k * 0.94];
  });

/** Cob as a section shows it: earth with straw and small stones. Tileable, one tile about 0.5 m. */
export const cobMap = (): THREE.DataTexture =>
  map('cob', 512, (u, v, i, j) => {
    const big = tf(u, v, 5, 4) - 0.5;
    const fine = tf(u, v, 48, 2) - 0.5;
    const grain = hash1(i, j) - 0.5;
    let r = 0.47 + 0.22 * big + 0.09 * fine + 0.03 * grain;
    // straw: short dark and pale strokes in every direction
    const cell = voronoi(u, v, 26);
    const ang = hash1(cell.id, 11) * Math.PI;
    const gx = u * 26;
    const gy = v * 26;
    const fx = gx - Math.floor(gx) - 0.5;
    const fy = gy - Math.floor(gy) - 0.5;
    const along = fx * Math.cos(ang) + fy * Math.sin(ang);
    const across = -fx * Math.sin(ang) + fy * Math.cos(ang);
    const straw = hash1(Math.floor(gx), Math.floor(gy)) > 0.72 && Math.abs(across) < 0.035 && Math.abs(along) < 0.42;
    if (straw) r += hash1(cell.id, 3) > 0.5 ? 0.13 : -0.11;
    // small stones, each its own size and broken outline, near the earth's own tones
    const wob = (tf(u, v, 40, 2) - 0.5) * 0.1;
    const st = voronoi(u + wob * 0.05, v - wob * 0.05, 16, 16, 0.9);
    const size = 0.1 + 0.2 * hash1(st.id, 15);
    const stoneOn = hash1(st.id, 5) > 0.8 && st.d1 + wob < size;
    const tone = 0.34 + 0.18 * hash1(st.id, 9) + 0.5 * (r - 0.47);
    if (stoneOn) return [tone * 1.04, tone * 0.92, tone * 0.76];
    return [r * 1.0, r * 0.76, r * 0.53];
  });

/** Earth laid by hand and floated: warm tones that wander, the arcs of the float, flecks of chopped straw. A colour map; a bench and a casing use it as it is. One tile about 1.1 m. */
export const earthMap = (): THREE.DataTexture =>
  map('earth', 512, (u, v, i, j) => {
    const broad = tf(u, v, 3, 3) - 0.5;
    const mid = tf(u, v, 11, 3) - 0.5;
    // arcs of a float: broad, faint, curved strokes
    const arc = Math.sin((u + 0.12 * Math.sin(v * Math.PI * 4 + tf(u, v, 3, 1) * 6)) * Math.PI * 2 * 16 + v * 14);
    const stroke = 0.5 + 0.5 * arc;
    const grain = hash1(i, j) - 0.5;
    let k = 0.62 + 0.16 * broad + 0.07 * mid + 0.012 * stroke + 0.02 * grain;
    // straw: pale short strokes, a few
    const gx = u * 34;
    const gy = v * 34;
    const cx = Math.floor(gx);
    const cy = Math.floor(gy);
    const on = hash1(cx, cy) > 0.86;
    if (on) {
      const ang = hash1(cy, cx + 5) * Math.PI;
      const fx = gx - cx - 0.5;
      const fy = gy - cy - 0.5;
      const along = fx * Math.cos(ang) + fy * Math.sin(ang);
      const across = -fx * Math.sin(ang) + fy * Math.cos(ang);
      if (Math.abs(across) < 0.035 && Math.abs(along) < 0.44) k += 0.16;
    }
    return [k * 1.02, k * 0.83, k * 0.65];
  });

/** Earth plaster: fine, warm, faint strokes of the float. To be tinted. */
export const plasterMap = (): THREE.DataTexture =>
  map('plaster', 512, (u, v, i, j) => {
    const broad = tf(u, v, 4, 3) - 0.5;
    const stroke = tf(u, v, 10, 2, 28) - 0.5;
    const grain = hash1(i, j) - 0.5;
    const k = 0.82 + 0.13 * broad + 0.05 * stroke + 0.015 * grain;
    return [k, k * 0.985, k * 0.955];
  });

/** A rubble wall: stones in rough courses, a recessed lime mortar, each stone its own tone and a broken face. Colour map; the same is its relief. One tile is about 1.75 m. */
export const masonryMap = (): THREE.DataTexture =>
  map('masonry', 512, (u, v, i, j) => {
    // courses: the cells are longer than high; the warp breaks their edges
    const warp = (tf(u, v, 22, 3) - 0.5) * 0.028;
    const warp2 = (tf(u + 0.3, v, 44, 2) - 0.5) * 0.009;
    const c = voronoi(u + warp + warp2, v - warp + warp2, 11, 19, 0.66);
    const edge = c.d2 - c.d1;
    const mortar = 1 - smoothstep(0.02, 0.07, edge);
    const tone = hash1(c.id, 13);
    const hue = hash1(c.id, 21);
    // a broken face: the stone's top lit, its foot in shadow, a fine grain
    const face = tf(u, v, 64, 3) - 0.5;
    const big = tf(u, v, 9, 2) - 0.5;
    const relief = smoothstep(0.0, 0.32, edge);
    const fine = tf(u, v, 128, 2) - 0.5;
    const k =
      (0.42 + 0.17 * tone + 0.12 * face + 0.08 * big + 0.13 * fine + 0.03 * (hash1(i, j) - 0.5)) *
      (0.86 + 0.14 * relief);
    const stone: [number, number, number] =
      hue > 0.72
        ? [k * 1.14, k * 0.93, k * 0.72]
        : hue > 0.38
          ? [k * 1.04, k * 0.97, k * 0.86]
          : [k * 0.95, k * 0.95, k * 0.91];
    // the joints lie deep and in shadow, a little lime in them
    const m = 0.3 + 0.05 * face;
    return [
      stone[0] * (1 - mortar) + m * mortar,
      stone[1] * (1 - mortar) + m * 0.95 * mortar,
      stone[2] * (1 - mortar) + m * 0.86 * mortar,
    ];
  });

/** Firebrick: a running bond, buff and mottled, pale joints. One tile holds four courses of two bricks. */
export const brickMap = (): THREE.DataTexture =>
  map('firebrick', 512, (u, v, i, j) => {
    const rows = 4;
    const cols = 2;
    const row = Math.floor(v * rows);
    const uu = (u * cols + (row % 2 ? 0.5 : 0)) % 1;
    const vv = (v * rows) % 1;
    const col = Math.floor(u * cols + (row % 2 ? 0.5 : 0));
    const joint = Math.min(uu, 1 - uu) * 2 < 0.03 || Math.min(vv, 1 - vv) * 2 < 0.06;
    const tone = hash1(row * 5 + col, 7) * 0.5 + 0.5;
    const n = tf(u, v, 24, 3) - 0.5;
    const spots = hash1(i >> 1, j >> 1) > 0.975 ? -0.1 : 0;
    const k = 0.74 * (0.84 + 0.22 * tone) + 0.14 * n + spots;
    if (joint) return [0.62, 0.58, 0.5];
    return [k * 1.0, k * 0.8, k * 0.56];
  });

/** Wide oak boards along U: a grain, end joints, dark gaps. One tile: 1.28 m of four boards across. */
export const oakMap = (): THREE.DataTexture =>
  map('oak', 512, (u, v, i, j) => {
    const boards = 4;
    const b = Math.floor(v * boards);
    const off = hash1(b, 41);
    const uu = (u + off) % 1;
    const fv = (v * boards) % 1;
    const gap = Math.min(fv, 1 - fv) * boards * 4 < 0.05 || Math.min(uu, 1 - uu) < 0.002;
    const grain = tn(uu * 16 + b * 19, v * 90, 256, 90);
    const cathedral = Math.sin((fv + 0.18 * tn(uu * 5 + b * 3, 3.3, 256, 8)) * 26 + b * 2.1);
    const tone = 0.82 + 0.3 * hash1(b, 77);
    // a quiet grain, and joints only a little darker: strong lines on a floor crawl as the camera moves
    const k =
      (0.5 + 0.07 * (grain - 0.5) + 0.018 * cathedral + 0.006 * (hash1(i, j) - 0.5)) * (0.93 + 0.07 * (tone / 0.97));
    if (gap) return [0.3, 0.21, 0.14];
    return [k * 1.0, k * 0.72, k * 0.46];
  });

/** Plain wood for furniture, grey to be tinted: grain along U. */
export const woodMap = (): THREE.DataTexture =>
  map('wood', 256, (u, v, i, j) => {
    const grain = tn(u * 8, v * 64, 256, 64);
    const ring = Math.sin((v + 0.2 * tn(u * 4, v * 3, 256, 256)) * 44);
    const k = 0.78 + 0.2 * (grain - 0.5) + 0.05 * ring + 0.02 * (hash1(i, j) - 0.5);
    return [k, k, k];
  });

/** A woven rug: bands and lozenges in madder, ochre and indigo, a fine weave. No word, no sign. */
export const rugMap = (): THREE.DataTexture =>
  map('rug', 512, (u, v, i, j) => {
    const weave = 1 + 0.02 * (((i >> 1) + (j >> 1)) % 2);
    const bx = Math.abs(u - 0.5) * 2;
    const by = Math.abs(v - 0.5) * 2;
    const edge = Math.max(bx, by);
    const lozenges = Math.abs(((u * 4 + 0.5) % 1) - 0.5) + Math.abs(((v * 6 + 0.5) % 1) - 0.5);
    const madder: [number, number, number] = [0.46, 0.13, 0.1];
    const ochre: [number, number, number] = [0.72, 0.5, 0.2];
    const indigo: [number, number, number] = [0.14, 0.17, 0.29];
    const cream: [number, number, number] = [0.8, 0.72, 0.58];
    let c = madder;
    if (edge > 0.93) c = indigo;
    else if (edge > 0.88) c = cream;
    else if (edge > 0.8) c = ochre;
    else if (lozenges < 0.14) c = cream;
    else if (lozenges < 0.28) c = indigo;
    else if (lozenges < 0.34) c = ochre;
    const wear = 0.88 + 0.22 * (tf(u, v, 7, 3) - 0.5) + 0.04 * (hash1(i, j) - 0.5);
    return [c[0] * weave * wear, c[1] * weave * wear, c[2] * weave * wear];
  });

/** Cloth: a fine weave, grey to be tinted. */
export const clothMap = (): THREE.DataTexture =>
  map('cloth', 256, (u, v, i, j) => {
    const w = ((i >> 1) + (j >> 1)) % 2 === 0 ? 1 : 0.9;
    const k = (0.86 + 0.12 * (tf(u, v, 10, 2) - 0.5)) * w + 0.02 * (hash1(i, j) - 0.5);
    return [k, k, k];
  });

/** Knitted wool: ribs across, a soft grain, grey to be tinted. */
export const knitMap = (): THREE.DataTexture =>
  map('knit', 256, (u, v) => {
    const rib =
      0.8 + 0.2 * Math.sin(v * Math.PI * 2 * 24) * Math.sin(u * Math.PI * 2 * 18 + Math.sin(v * Math.PI * 2 * 24));
    const k = rib * (0.92 + 0.14 * (tf(u, v, 12, 2) - 0.5));
    return [k, k, k];
  });

/** Stove paint on steel: nearly black, mottled by heat, a faint rust on the bare spots. */
export const drumPaintMap = (): THREE.DataTexture =>
  map('drum-paint', 512, (u, v, i, j) => {
    const big = tf(u, v, 6, 4, 4) - 0.5;
    const fine = tf(u, v, 64, 2) - 0.5;
    const k = 0.17 + 0.09 * big + 0.03 * fine + 0.008 * (hash1(i, j) - 0.5);
    // the paint has gone in places, a dull brown: never a glow
    const rust = smoothstep(0.64, 0.8, tf(u, v, 14, 3, 9));
    return [k * (1 + 0.35 * rust) + 0.012 * rust, k * (1 + 0.1 * rust), k * (1 - 0.08 * rust)];
  });

/** Plain spiral duct: bare steel, a seam every 0.15 m round the helix, dull from the mill. U runs round, V along. */
export const spiralMap = (): THREE.DataTexture =>
  map('spiral', 256, (u, v, i, j) => {
    const w = (u + v * 2) % 1;
    const seam = Math.abs(w - 0.5) < 0.02 ? 0.72 : Math.abs(w - 0.5) < 0.05 ? 1.12 : 1;
    const k = (0.62 + 0.14 * (tf(u, v, 8, 3) - 0.5) + 0.02 * (hash1(i, j) - 0.5)) * seam;
    return [k, k * 0.99, k * 0.96];
  });

/** Bark of split wood: long fissures, brown-grey, in U round the trunk and V along it. */
export const barkMap = (): THREE.DataTexture =>
  map('bark', 256, (u, v, i, j) => {
    const fiss = tf(u, v, 22, 3, 4);
    const k = 0.3 + 0.26 * smoothstep(0.34, 0.62, fiss) + 0.05 * (hash1(i, j) - 0.5);
    return [k * 1.1, k * 0.92, k * 0.72];
  });

/** The end of a log, seen on a stack: rings around the middle, radial checks. On a unit disc: (u, v) in 0..1. */
export const endGrainMap = (): THREE.DataTexture =>
  map('end-grain', 256, (u, v) => {
    const dx = u - 0.5;
    const dy = v - 0.5;
    const r = Math.hypot(dx, dy) * 2;
    const a = Math.atan2(dy, dx);
    const ring = 0.5 + 0.5 * Math.sin(r * 34 + 2 * Math.sin(a * 3));
    const check = Math.abs(Math.sin(a * 4 + 0.7)) < 0.03 && r < 0.85 ? 0.62 : 1;
    const k = (0.66 + 0.16 * ring) * check;
    return [k * 1.0, k * 0.82, k * 0.58];
  });

/** Sheets of wood shingle or slate on the roof, to be tinted: rows offset by half. */
export const shingleMap = (): THREE.DataTexture =>
  map('shingle', 256, (u, v, i, j) => {
    const rows = 8;
    const r = Math.floor(v * rows);
    const uu = (u * 6 + (r % 2 ? 0.5 : 0)) % 1;
    const col = Math.floor(u * 6 + (r % 2 ? 0.5 : 0));
    const vv = (v * rows) % 1;
    const tone = 0.78 + 0.34 * hash1(r * 13 + col, 3);
    const edge = (Math.min(uu, 1 - uu) < 0.03 ? 0.66 : 1) * (vv < 0.1 ? 0.62 : 1);
    const k = tone * edge * (0.9 + 0.1 * (hash1(i, j) - 0.5));
    return [k, k, k];
  });

/** Wooden boards, grey to be tinted: vertical boards, a grain, a dark joint. */
export const boardsMap = (): THREE.DataTexture =>
  map('boards', 256, (u, v, i) => {
    const boards = 8;
    const b = Math.floor(u * boards);
    const joint = Math.abs(((u * boards) % 1) - 0.5) > 0.46 ? 0.62 : 1;
    const grain = tn(u * 40 + b * 7.3, v * 4, 256, 4);
    const tone = 0.9 + 0.14 * hash1(b, 3) + 0.04 * Math.sin(i * 0.9 + b);
    const k = (0.82 + 0.16 * grain) * tone * joint;
    return [k, k, k];
  });

/** Lime render on the outside walls, to be tinted: broad patches, a roughcast grain. */
export const renderMap = (): THREE.DataTexture =>
  map('render', 256, (u, v, i, j) => {
    const k = 0.84 + 0.16 * (tf(u, v, 5, 4) - 0.5) + 0.05 * (hash1(i, j) - 0.5);
    return [k, k * 0.985, k * 0.95];
  });

/** Ash: a fine grey powder with a little charcoal. */
export const ashMap = (): THREE.DataTexture =>
  map('ash', 256, (u, v, i, j) => {
    const dark = hash1(i >> 1, j >> 1) > 0.965;
    const k = 0.62 + 0.2 * (tf(u, v, 18, 3) - 0.5) + 0.06 * (hash1(i, j) - 0.5);
    return dark ? [0.1, 0.09, 0.09] : [k, k * 0.98, k * 0.94];
  });

/** Round pebbles in earth, as a pebble bench shows in section. */
export const pebbleMap = (): THREE.DataTexture =>
  map('pebble', 512, (u, v, i, j) => {
    const c = voronoi(u, v, 11, 11, 0.85);
    const round = 1 - smoothstep(0.0, 0.11, c.d2 - c.d1);
    const tone = 0.42 + 0.42 * hash1(c.id, 9);
    const hue = hash1(c.id, 2);
    const bump = 1 - 0.32 * c.d1;
    const surf = 0.03 * (hash1(i, j) - 0.5) + 0.12 * (tf(u, v, 40, 2) - 0.5);
    const k = tone * bump + surf;
    const stone: [number, number, number] = hue > 0.5 ? [k * 1.05, k, k * 0.9] : [k * 0.96, k * 0.97, k * 0.97];
    const e = 0.24 + 0.1 * (tf(u, v, 20, 2) - 0.5);
    const earth: [number, number, number] = [e * 1.25, e * 0.95, e * 0.66];
    return [
      stone[0] * (1 - round) + earth[0] * round,
      stone[1] * (1 - round) + earth[1] * round,
      stone[2] * (1 - round) + earth[2] * round,
    ];
  });

/** A closed green ground under the snow, with the grain the eye reads close up. */
export const grassMap = (): THREE.DataTexture =>
  map(
    'grass',
    256,
    (u, v, i, j) => {
      const blade = tn(u * 90, v * 30, 90, 30);
      const k = 0.5 + 0.5 * ((tf(u, v, 20, 3) - 0.5) * 0.9 + (blade - 0.5) * 0.5 + (hash1(i, j) - 0.5) * 0.14);
      return [k, k, k];
    },
    false,
  );

/** Bark of a birch: white, black lenticels running across the trunk, darker fissures to the foot. */
export const birchBarkMap = (): THREE.DataTexture =>
  map('birch-bark', 128, (u, v, i, j) => {
    const n = tf(u, v, 8, 3, 16);
    const lenticel = hash1(Math.floor(j / 4), Math.floor(i / 22)) > 0.72 && j % 4 < 2 ? 0.34 : 1;
    const scar = smoothstep(0.66, 0.74, tf(u, v, 6, 2, 3)) * 0.8;
    const k = 0.86 * lenticel * (1 - scar) + 0.1 * n;
    return [k, k * 0.98, k * 0.92];
  });

/** Bark of a spruce: scaly, brown-grey. */
export const spruceBarkMap = (): THREE.DataTexture =>
  map('spruce-bark', 128, (u, v, i, j) => {
    const n = tf(u, v, 12, 4, 20);
    const k = 0.22 + 0.32 * n + 0.04 * (hash1(i, j) - 0.5);
    return [k * 1.08, k * 0.95, k * 0.82];
  });
