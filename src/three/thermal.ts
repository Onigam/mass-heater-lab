import * as THREE from 'three';
import { THERMAL_RAMP } from '../sim/machine';
import { heatRampGlsl, heatRgb } from '../sim/thermal/ramp';
import type { HeaterState } from '../sim/types';
import { BENCH_SEGMENTS } from './dims';
import { patch } from './detail';

// The thermal view, the lab's « aha ». A switch (`params.thermalView`, read through an option of each world) turns every surface of a world to the colours of the simulation: one ramp, fixed in °C (`THERMAL_RAMP`,
// 15 to 65 °C), so that a colour means the same at any hour and in every world. Only false colour: the bench does not glow, and nothing here is drawn to look warmer than the model says.
// A surface reads its temperature from a number (`TempRef`) or from a small field texture (`Field`), read through the attribute `aHeatUv` and the hardware's linear filter. A part of the colour stays emissive, so a shadow
// never hides a temperature. The materials stay plain MeshStandardMaterials, which the kit can swap for its ghost in X-ray.

/** A number a material reads. */
export interface TempRef {
  value: number;
}

/** Values in °C on a grid, half-float, read with a linear filter so that isotherms stay smooth. */
export class Field {
  readonly texture: THREE.DataTexture;
  readonly data: Uint16Array;
  constructor(
    readonly w: number,
    readonly h: number,
    fill = 20,
  ) {
    this.data = new Uint16Array(w * h).fill(THREE.DataUtils.toHalfFloat(fill));
    this.texture = new THREE.DataTexture(this.data, w, h, THREE.RedFormat, THREE.HalfFloatType);
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.wrapS = this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
  }
  set(i: number, j: number, T: number): void {
    this.data[i + this.w * j] = THREE.DataUtils.toHalfFloat(T);
  }
  read(i: number, j: number): number {
    return THREE.DataUtils.fromHalfFloat(this.data[i + this.w * j]!);
  }
  /** The value at a point of the texture, read as the linear filter does (tests). */
  at(u: number, v: number): number {
    const x = Math.min(this.w - 1, Math.max(0, u * this.w - 0.5));
    const y = Math.min(this.h - 1, Math.max(0, v * this.h - 0.5));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(this.w - 1, x0 + 1);
    const y1 = Math.min(this.h - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;
    return (
      (this.read(x0, y0) * (1 - fx) + this.read(x1, y0) * fx) * (1 - fy) +
      (this.read(x0, y1) * (1 - fx) + this.read(x1, y1) * fx) * fy
    );
  }
  commit(): void {
    this.texture.needsUpdate = true;
  }
}

/** The cell of the bench's grid, °C. The duct's cell holds the gas: inside the earth it stands for the mean of its neighbours. */
export function cellT(s: HeaterState, col: number, row: number, seg: number): number {
  const c = s.benchCols;
  const r = s.benchRows;
  const cl = Math.min(c - 1, Math.max(0, col));
  const rw = Math.min(r - 1, Math.max(0, row));
  const at = (a: number, b: number) => s.benchT[a + c * b + c * r * seg]!;
  if (cl === s.ductCol && rw === s.ductRow) {
    return (at(cl - 1, rw) + at(cl + 1, rw) + at(cl, rw - 1) + at(cl, rw + 1)) / 4;
  }
  return at(cl, rw);
}

const COLS = new Float64Array(16);
const ROWS = new Float64Array(16);

/**
 * The earth's temperature in a slice of the bench, °C, at (x, y): x from the back wall to the front, y from the slab to the seat, m. Bilinear between the centres of the model's cells, reaching the model's own
 * surface temperatures at the seat and at the front.
 */
export function sliceT(s: HeaterState, seg: number, x: number, y: number): number {
  const ce = s.benchColEdges;
  const re = s.benchRowEdges[seg]!;
  const nc = s.benchCols;
  const nr = s.benchRows;
  for (let i = 0; i < nc; i++) COLS[i] = (ce[i]! + ce[i + 1]!) / 2;
  for (let j = 0; j < nr; j++) ROWS[j] = (re[j]! + re[j + 1]!) / 2;
  const depth = ce[nc]!;
  const height = re[nr]!;
  // the fractional place among the centres, with one more node at the front and at the seat
  let i0 = 0;
  while (i0 < nc - 1 && x > COLS[i0 + 1]!) i0++;
  let j0 = 0;
  while (j0 < nr - 1 && y > ROWS[j0 + 1]!) j0++;
  const xNext = i0 < nc - 1 ? COLS[i0 + 1]! : depth;
  const yNext = j0 < nr - 1 ? ROWS[j0 + 1]! : height;
  const fx = Math.min(1, Math.max(0, (x - COLS[i0]!) / Math.max(1e-6, xNext - COLS[i0]!)));
  const fy = Math.min(1, Math.max(0, (y - ROWS[j0]!) / Math.max(1e-6, yNext - ROWS[j0]!)));
  const node = (a: number, b: number): number => {
    if (a >= nc && b >= nr) return (s.seatT[seg]! + s.frontT[seg]!) / 2;
    if (a >= nc) return s.frontT[seg]!;
    if (b >= nr) return s.seatT[seg]!;
    return cellT(s, a, b, seg);
  };
  const v00 = node(i0, j0);
  const v10 = node(i0 + 1, j0);
  const v01 = node(i0, j0 + 1);
  const v11 = node(i0 + 1, j0 + 1);
  return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
}

/** The size of a field along the depth and the height of a slice. */
export const SLICE_W = 26;
export const SLICE_H = 24;

/** Write a slice of the bench into a field: the mean of two neighbouring segments by `seg` (a fraction). */
export function writeSlice(f: Field, s: HeaterState, seg: number, depth: number, height: number): void {
  const a = Math.max(0, Math.min(s.benchSegments - 1, Math.floor(seg)));
  const b = Math.min(s.benchSegments - 1, a + 1);
  const t = Math.max(0, Math.min(1, seg - a));
  for (let j = 0; j < f.h; j++) {
    const y = ((j + 0.5) / f.h) * height;
    for (let i = 0; i < f.w; i++) {
      const x = ((i + 0.5) / f.w) * depth;
      f.set(i, j, sliceT(s, a, x, y) * (1 - t) + sliceT(s, b, x, y) * t);
    }
  }
  f.commit();
}

/** Write the plane of the duct's axis along the whole run into a field: (distance along the run, height). */
export function writeLong(f: Field, s: HeaterState, depth: number, height: number): void {
  const n = s.benchSegments;
  for (let j = 0; j < f.h; j++) {
    const y = ((j + 0.5) / f.h) * height;
    for (let i = 0; i < f.w; i++) {
      const u = ((i + 0.5) / f.w) * n - 0.5;
      const a = Math.max(0, Math.min(n - 1, Math.floor(u)));
      const b = Math.min(n - 1, a + 1);
      const t = Math.max(0, Math.min(1, u - a));
      f.set(i, j, sliceT(s, a, depth / 2, y) * (1 - t) + sliceT(s, b, depth / 2, y) * t);
    }
  }
  f.commit();
}

export interface ThermalOptions {
  /** How much of the colour stays when no light reaches it. */
  glow?: number;
  /** Isotherms each this many K on a field. */
  iso?: number;
  /** At least this much of the false colour, even with the switch off: the heat map of a cut face, its stones and earth still showing through. */
  min?: number;
}

/** What a world's thermal view holds: the switch, the numbers and the fields of the model. */
export class ThermalView {
  /** 0 is the world's own look, 1 the false colour. */
  readonly on: TempRef = { value: 0 };
  readonly surface: TempRef = { value: 20 };
  readonly stone: TempRef = { value: 20 };
  readonly outside: TempRef = { value: 2 };
  readonly drumLid: TempRef = { value: 20 };
  readonly flue: TempRef = { value: 20 };
  readonly casing: TempRef = { value: 20 };
  readonly slab: TempRef = { value: 20 };
  readonly seat: TempRef = { value: 25 };
  readonly air: TempRef = { value: 20 };
  /** The duct's steel holds next to nothing: it is at the gas's temperature, over the whole run, on the hot run, on the cold run. */
  readonly duct: TempRef = { value: 25 };
  readonly ductHot: TempRef = { value: 25 };
  readonly ductCold: TempRef = { value: 25 };
  /** Between the drum and the wall: half-way by the air gap the shield is there for. An estimate of the picture, the model has no node for it. */
  readonly shield: TempRef = { value: 20 };
  /** The seat (row 0) and the front (row 1) by segment. */
  readonly bench = new Field(BENCH_SEGMENTS, 2, 25);
  /** The drum from its foot to its lid. */
  readonly drum = new Field(1, 12, 20);
  private want = 0;
  private since = Infinity;
  /** How many times the fields were written (tests). */
  writes = 0;
  /** Extra fields a world writes with the same state and at the same rate. */
  readonly onWrite: ((s: HeaterState) => void)[] = [];

  constructor(private readonly patched = new WeakSet<THREE.Material>()) {}

  /** `dt` in real seconds. The switch fades in half a second; with dt = 0 nothing moves. The fields are written a few times a second: a bench moves over hours. */
  update(s: HeaterState, want: boolean, dt: number, force = false): void {
    this.want = want ? 1 : 0;
    const k = Math.min(1, dt / 0.5);
    this.on.value += Math.max(-k, Math.min(k, this.want - this.on.value));
    if (this.on.value < 1e-4) this.on.value = 0;
    this.since += dt;
    if (!force && this.since < 0.12) return;
    this.since = 0;
    this.write(s);
  }

  write(s: HeaterState): void {
    this.writes++;
    this.surface.value = s.surfaceT;
    this.stone.value = s.stoneT;
    this.outside.value = s.outsideT;
    this.drumLid.value = s.drumLidT;
    this.flue.value = s.flueInT;
    this.casing.value = s.casingT;
    this.air.value = s.roomT;
    this.shield.value = 0.5 * (s.surfaceT + s.drumUpperT);
    this.slab.value = 0.5 * (s.surfaceT + s.seatColdT);
    let seat = 0;
    let gas = 0;
    for (let i = 0; i < BENCH_SEGMENTS; i++) {
      this.bench.set(i, 0, s.seatT[i]!);
      this.bench.set(i, 1, s.frontT[i]!);
      seat += s.seatT[i]!;
      gas += s.ductGasT[i]!;
    }
    this.seat.value = seat / BENCH_SEGMENTS;
    this.duct.value = gas / BENCH_SEGMENTS;
    this.ductHot.value = s.ductGasT[1]!;
    this.ductCold.value = s.ductGasT[BENCH_SEGMENTS - 2]!;
    this.bench.commit();
    const n = this.drum.h;
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1);
      // the lower wall at the foot, the upper wall above the middle, the lid at the very top
      const wall = s.drumLowerT + (s.drumUpperT - s.drumLowerT) * Math.min(1, Math.max(0, (t - 0.2) / 0.55));
      this.drum.set(0, j, j === n - 1 ? s.drumLidT : wall);
    }
    this.drum.commit();
    for (const fn of this.onWrite) fn(s);
  }

  /** Teach a material the false colour: `source` is a number or a field read through `aHeatUv`. */
  patch(mat: THREE.Material, source: TempRef | Field, o: ThermalOptions = {}): void {
    if (this.patched.has(mat)) return;
    this.patched.add(mat);
    const std = mat as THREE.MeshStandardMaterial;
    if (!std.isMeshStandardMaterial) return;
    const isField = source instanceof Field;
    const glow = o.glow ?? 0.72;
    const iso = o.iso ?? 5;
    const min = o.min ?? 0;
    const on = this.on;
    patch(mat, `thermal-${isField ? 'field' : 'const'}-${glow}-${iso}-${min}`, (shader) => {
      shader.uniforms.uThOn = on;
      if (isField) shader.uniforms.uThField = { value: source.texture };
      else shader.uniforms.uThT = source;
      if (isField) {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nattribute vec2 aHeatUv;\nvarying vec2 vThUv;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvThUv = aHeatUv;');
      }
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `#include <common>
          uniform float uThOn;
          ${isField ? 'uniform sampler2D uThField; varying vec2 vThUv;' : 'uniform float uThT;'}
          ${heatRampGlsl(THERMAL_RAMP)}
          vec3 gThGlow;`,
        )
        .replace(
          '#include <color_fragment>',
          /* glsl */ `#include <color_fragment>
          gThGlow = vec3( 0.0 );
          float thMix = max( uThOn, ${min.toFixed(3)} );
          if ( thMix > 0.0 ) {
            ${isField ? 'float thT = texture2D( uThField, vThUv ).r;' : 'float thT = uThT;'}
            vec3 thC = heatRamp( thT );
            ${
              isField
                ? `float thW = max( fwidth( thT ), 1e-3 );
            float thD = abs( fract( thT / ${iso.toFixed(1)} + 0.5 ) - 0.5 ) * ${iso.toFixed(1)} / thW;
            thC *= 1.0 - 0.24 * ( 1.0 - smoothstep( 0.5, 1.5, thD ) ) * ( 1.0 - smoothstep( 1.2, 3.5, thW ) );`
                : ''
            }
            float thLuma = dot( diffuseColor.rgb, vec3( 0.3, 0.6, 0.1 ) );
            // under the map the material's own grain still reads: stones in the earth, the plaster's skin
            diffuseColor.rgb = mix( diffuseColor.rgb, thC * ( 0.3 + 0.9 * thLuma * ( 1.0 - uThOn ) ), thMix );
            gThGlow = thC * ${glow.toFixed(3)} * thMix * ( 0.55 + 0.8 * thLuma );
          }`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, 1.0, max( uThOn, ${min.toFixed(3)} ) );`,
        )
        .replace(
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>\nmetalnessFactor = mix( metalnessFactor, 0.0, max( uThOn, ${min.toFixed(3)} ) );`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>\ntotalEmissiveRadiance = mix( totalEmissiveRadiance, gThGlow, max( uThOn, ${min.toFixed(3)} ) );`,
        );
    });
  }

  /** Every material under `root` that has no false colour yet reads this number. */
  patchAll(root: THREE.Object3D, source: TempRef): void {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        const s = mat as THREE.MeshStandardMaterial;
        if (s.isMeshStandardMaterial) this.patch(s, source);
      }
    });
  }
}

/** The colour of a temperature on the ramp, linear RGB, as a THREE.Color. */
export function rampColor(T: number, out = new THREE.Color()): THREE.Color {
  const c = heatRgb(THERMAL_RAMP, T);
  return out.setRGB(c[0], c[1], c[2]);
}

/** Tag a geometry with `aHeatUv`: (0.5, height along [y0, y1]). */
export function heatUvByHeight(g: THREE.BufferGeometry, y0: number, y1: number): THREE.BufferGeometry {
  const p = g.attributes.position as THREE.BufferAttribute;
  const a = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    a[i * 2] = 0.5;
    a[i * 2 + 1] = (p.getY(i) - y0) / (y1 - y0);
  }
  g.setAttribute('aHeatUv', new THREE.BufferAttribute(a, 2));
  return g;
}

/** A bar of the ramp on a stand, with the kit's labels: no text on it. Stands on y = 0 of its group. */
export function rampBar(height: number, width: number, y0: number, frame: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = 'thermal-scale';
  const steps = 40;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const Tmin = THERMAL_RAMP[0]![0];
  const Tmax = THERMAL_RAMP[THERMAL_RAMP.length - 1]![0];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    rampColor(Tmin + t * (Tmax - Tmin), c);
    const y = y0 + t * height;
    pos.push(-width / 2, y, 0.012, width / 2, y, 0.012);
    col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i < steps) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  // the bar is its own light: a thermal camera's scale
  const bar = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }),
  );
  bar.userData.noShadow = true;
  bar.castShadow = false;
  g.add(bar);
  const board = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, height + 0.04, 0.02), frame);
  board.position.y = y0 + height / 2;
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.03, y0, 0.03), frame);
  foot.position.y = y0 / 2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.018, 24), frame);
  base.position.y = 0.009;
  g.add(board, foot, base);
  return g;
}

/** Height of a temperature on the bar. */
export const rampY = (T: number, height: number, y0: number): number => {
  const Tmin = THERMAL_RAMP[0]![0];
  const Tmax = THERMAL_RAMP[THERMAL_RAMP.length - 1]![0];
  return y0 + ((T - Tmin) / (Tmax - Tmin)) * height;
};
