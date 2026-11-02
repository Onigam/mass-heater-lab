import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { smoothstep } from '../common';
import { HOME } from '../dims';
import { birchBarkMap, fbm, spruceBarkMap, barkMap } from '../textures';
import { patchSnow } from './snow';
import { padDistance, terrainHeight } from './terrain';

// The trees of a foothill, all instanced: spruces with a straight trunk and drooping boughs, tier on tier, that hold the snow; bare birches and ashes in winter, trunk, rising branches and twigs; the stools of a coppice, rods from a stump; a far
// forest of crude spruces. Each species is one unit geometry (height 1, its foot at the origin) with its colours in the vertices. The placement is seeded, every tree stands on the land and keeps off the buildings and the road. From the sand lab's
// village, with the leaves gone: it is January.

export interface Inst {
  x: number;
  y: number;
  z: number;
  s: number;
  w: number;
  rot: number;
  tint: number;
}

export class Mesher {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];
  get n(): number {
    return this.pos.length / 3;
  }
  vert(x: number, y: number, z: number, c: THREE.Color, u = 0, v = 0): number {
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    this.uv.push(u, v);
    return this.n - 1;
  }
  tri(a: number, b: number, c: number): void {
    this.idx.push(a, b, c);
  }
  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

const C = (hex: number): THREE.Color => new THREE.Color(hex);

/** A tapered tube along a polyline: a trunk or a limb. */
export function tube(
  m: Mesher,
  pts: [number, number, number][],
  radii: number[],
  sides: number,
  ca: THREE.Color,
  cb: THREE.Color,
  uvk = 6,
): void {
  const rings: number[][] = [];
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const tmp = new THREE.Color();
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = new THREE.Vector3(...pts[Math.max(0, i - 1)]!);
    const c = new THREE.Vector3(...pts[Math.min(pts.length - 1, i + 1)]!);
    t.subVectors(c, a).normalize();
    const ref = Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    n.crossVectors(t, ref).normalize();
    b.crossVectors(t, n).normalize();
    if (i > 0) len += new THREE.Vector3(...pts[i]!).distanceTo(new THREE.Vector3(...pts[i - 1]!));
    tmp.copy(ca).lerp(cb, i / Math.max(1, pts.length - 1));
    const ring: number[] = [];
    for (let s = 0; s <= sides; s++) {
      const ang = (s / sides) * Math.PI * 2;
      const cx = Math.cos(ang);
      const cz = Math.sin(ang);
      const r = radii[i]!;
      ring.push(
        m.vert(
          pts[i]![0] + (n.x * cx + b.x * cz) * r,
          pts[i]![1] + (n.y * cx + b.y * cz) * r,
          pts[i]![2] + (n.z * cx + b.z * cz) * r,
          tmp,
          s / sides,
          len * uvk,
        ),
      );
    }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++)
    for (let s = 0; s < sides; s++) {
      const a = rings[i]![s]!;
      const b2 = rings[i]![s + 1]!;
      const c = rings[i + 1]![s]!;
      const d = rings[i + 1]![s + 1]!;
      m.tri(a, b2, c);
      m.tri(b2, d, c);
    }
}

/** A spruce: whorls of drooping boughs, shorter towards the top, the tall narrow cone of the species; live green at the tip, near-black at the trunk: the shadow inside the tree. */
export function spruceGeometry(tiers: number, boughs: number, seed: number, keels: boolean): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(seed);
  const tipC = C(0x4f6e47);
  const midC = C(0x2c4a30);
  const inC = C(0x121d15);
  const tmp = new THREE.Color();
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const y = 0.09 + 0.87 * f ** 0.92;
    const reach = (0.205 * (1 - f) ** 0.85 + 0.018) * (0.9 + 0.2 * r());
    for (let b = 0; b < boughs; b++) {
      const a = (b / boughs) * Math.PI * 2 + t * 1.1 + r() * 0.5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const rr = reach * (0.82 + 0.34 * r());
      const droop = 0.022 + 0.045 * (1 - f);
      const halfW = rr * 0.5 * (0.85 + 0.3 * r());
      const hx = -sa;
      const hz = ca;
      const base = m.vert(ca * 0.004, y + droop * 0.5, sa * 0.004, inC);
      const sx = ca * rr * 0.55;
      const sz = sa * rr * 0.55;
      const sy = y - droop * 0.9;
      tmp.copy(midC).multiplyScalar(0.85 + 0.3 * r());
      const left = m.vert(sx + hx * halfW, sy, sz + hz * halfW, tmp);
      const right = m.vert(sx - hx * halfW, sy, sz - hz * halfW, tmp);
      tmp.copy(tipC).multiplyScalar(0.8 + 0.4 * r());
      const tip = m.vert(ca * rr, y - droop * (1.1 + 0.3 * r()), sa * rr, tmp);
      m.tri(base, left, tip);
      m.tri(base, tip, right);
      if (!keels) continue;
      const keel = m.vert(ca * rr * 0.4, y - droop * 2.2, sa * rr * 0.4, inC);
      m.tri(base, keel, left);
      m.tri(base, right, keel);
      m.tri(left, keel, tip);
      m.tri(tip, keel, right);
    }
  }
  const top = m.vert(0, 1, 0, tipC);
  const ring: number[] = [];
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    ring.push(m.vert(Math.cos(a) * 0.012, 0.93, Math.sin(a) * 0.012, midC));
  }
  for (let s = 0; s < 5; s++) m.tri(top, ring[(s + 1) % 5]!, ring[s]!);
  return m.build();
}

export function spruceTrunk(): THREE.BufferGeometry {
  const m = new Mesher();
  tube(
    m,
    [
      [0, 0, 0],
      [0, 0.05, 0],
      [0.002, 0.5, 0.001],
      [0, 0.95, 0],
    ],
    [0.018, 0.014, 0.008, 0.002],
    7,
    C(0x4a3a2c),
    C(0x5d4a38),
    2,
  );
  return m.build();
}

/** A far spruce: two stacked narrow cones, dark at the foot, 12 triangles. */
function farSpruce(): THREE.BufferGeometry {
  const m = new Mesher();
  const lo = C(0x263b29);
  const hi = C(0x46624a);
  for (const [y0, y1, rad] of [
    [0.05, 0.64, 0.19],
    [0.42, 1.0, 0.125],
  ] as const) {
    const apex = m.vert(0, y1, 0, hi);
    const ring: number[] = [];
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2 + y0;
      ring.push(m.vert(Math.cos(a) * rad, y0, Math.sin(a) * rad, lo));
    }
    for (let s = 0; s < 6; s++) m.tri(apex, ring[(s + 1) % 6]!, ring[s]!);
  }
  return m.build();
}

/** A bare broad-leaved tree: trunk, forking branches, thin twigs. `white` gives a birch's trunk, otherwise the grey-brown of an ash. */
function bareTree(seed: number, white: boolean, twigs: boolean): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(seed);
  const foot = C(white ? 0x5c5348 : 0x4c4238);
  const bark = C(white ? 0xffffff : 0x6d6157);
  const twig = C(white ? 0x4b3a30 : 0x45382d);
  tube(
    m,
    [
      [0, 0, 0],
      [0.003, 0.04, 0],
      [0.012, 0.22, 0.004],
      [0.004, 0.46, 0.012],
      [0.012, 0.72, 0.006],
      [0.006, 0.97, 0.002],
    ],
    white ? [0.024, 0.02, 0.016, 0.012, 0.007, 0.002] : [0.034, 0.028, 0.022, 0.016, 0.009, 0.003],
    8,
    foot,
    bark,
    4,
  );
  const branches = 15;
  for (let i = 0; i < branches; i++) {
    const f = i / (branches - 1);
    const y0 = 0.28 + 0.62 * f;
    const a = i * 2.399 + r() * 0.3;
    const L = (0.28 - 0.17 * f) * (0.85 + 0.3 * r());
    const out = (s: number) =>
      [
        Math.cos(a) * L * s,
        y0 + L * (0.34 + 0.75 * f) * s + (s > 0.5 ? -L * 0.12 * (s - 0.5) * (1 - f) : 0),
        Math.sin(a) * L * s,
      ] as [number, number, number];
    tube(m, [out(0), out(0.33), out(0.68), out(1)], [0.005, 0.0035, 0.0024, 0.0008], 4, twig, twig, 6);
    for (let t = 0; twigs && t < 3; t++) {
      const s = 0.5 + t * 0.2;
      const b = out(s);
      const a2 = a + (t - 1) * 0.9;
      const l2 = L * 0.34;
      tube(
        m,
        [
          b,
          [b[0] + Math.cos(a2) * l2 * 0.5, b[1] - l2 * 0.05, b[2] + Math.sin(a2) * l2 * 0.5],
          [b[0] + Math.cos(a2) * l2, b[1] - l2 * 0.32, b[2] + Math.sin(a2) * l2],
        ],
        [0.0018, 0.0012, 0.0006],
        3,
        twig,
        twig,
        6,
      );
    }
  }
  return m.build();
}

/** Where the forest stands: dense to the north, broken groves around, the plot kept open. */
export function forestMask(x: number, z: number): number {
  const d = Math.hypot(x - 2, z + 2);
  const clear = smoothstep(38, 80, d);
  const north = smoothstep(-34, -56, z);
  const groves = smoothstep(0.47, 0.58, fbm(x * 0.008 + 2, z * 0.008 - 3, 3));
  const road = smoothstep(4, 14, Math.abs(z - HOME.road.z));
  return Math.min(1, (clear * groves + north * 0.95) * road);
}

const inst = (x: number, z: number, s: number, w: number, r: () => number): Inst => ({
  x,
  y: terrainHeight(x, z),
  z,
  s,
  w,
  rot: r() * Math.PI * 2,
  tint: r(),
});

export interface VegetationPlan {
  spruces: Inst[];
  bare: Inst[];
  forest: Inst[];
  young: Inst[];
  stools: Inst[];
}

/** Clear of the home view, seen from the south-east. */
const inView = (x: number, z: number): boolean => z > -4 && x > -24 && x < 68 && z < 98;

export function planVegetation(): VegetationPlan {
  const r = rng(2026);
  const plan: VegetationPlan = { spruces: [], bare: [], forest: [], young: [], stools: [] };
  let tries = 0;
  while (plan.spruces.length < 420 && tries++ < 26000) {
    const ang = r() * Math.PI * 2;
    const d = 30 + r() * 320;
    const x = 2 + Math.cos(ang) * d * 1.3;
    const z = -2 + Math.sin(ang) * d;
    if (r() > forestMask(x, z) * 1.3 + 0.002) continue;
    if (padDistance(x, z) < 5 || inView(x, z)) continue;
    plan.spruces.push(inst(x, z, 14 + 14 * r(), 0.92 + 0.25 * r(), r));
  }
  tries = 0;
  while (plan.bare.length < 48 && tries++ < 9000) {
    const x = -90 + r() * 190;
    const z = -48 + r() * 100;
    const f = forestMask(x, z);
    if (f > 0.72 || (f < 0.08 && r() > 0.25)) continue;
    if (padDistance(x, z) < 4.5 || inView(x, z) || Math.abs(z - HOME.road.z) < HOME.road.width / 2 + 2) continue;
    plan.bare.push(inst(x, z, 9 + 8 * r(), 0.85 + 0.3 * r(), r));
  }
  tries = 0;
  while (plan.forest.length < 3000 && tries++ < 30000) {
    const ang = r() * Math.PI * 2;
    const d = 210 + 1500 * r() ** 0.8;
    const x = 2 + Math.cos(ang) * d * 1.25;
    const z = -30 + Math.sin(ang) * d;
    if (r() > forestMask(x, z) * 1.25 + 0.12) continue;
    plan.forest.push(inst(x, z, 14 + 13 * r(), 0.95 + 0.2 * r(), r));
  }
  tries = 0;
  while (plan.young.length < 110 && tries++ < 7000) {
    const x = -110 + r() * 230;
    const z = -64 + r() * 90;
    if (padDistance(x, z) < 3 || inView(x, z)) continue;
    const f = forestMask(x, z);
    if (f < 0.04 || f > 0.8 || r() > 0.8) continue;
    plan.young.push(inst(x, z, 1.6 + 3.2 * r(), 1.05, r));
  }
  // the stools of the coppice, in rows of the lot
  const c = HOME.coppice;
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 4; j++) {
      const x = c.x - c.width / 2 + 1.5 + ((c.width - 3) * (i + 0.15 * r())) / 6;
      const z = c.z - c.depth / 2 + 1.2 + ((c.depth - 2.4) * (j + 0.15 * r())) / 3;
      plan.stools.push(inst(x, z, 3.4 + 2.4 * r(), 1, r));
    }
  return plan;
}

/** A coppice stool: a low wide stump, many straight rods from it, thin and rising; `age` in the instance's scale. Unit: height 1. */
function stoolGeometry(seed: number): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(seed);
  const stump = C(0x54473a);
  const rod = C(0x7a6250);
  const tip = C(0x8d5e3e);
  // the stump, as wide as a tenth of the rods
  tube(
    m,
    [
      [0, -0.02, 0],
      [0, 0.03, 0],
      [0, 0.062, 0],
    ],
    [0.1, 0.09, 0.05],
    9,
    stump,
    stump,
    2,
  );
  const n = 17;
  for (let i = 0; i < n; i++) {
    const a = i * 2.399 + r();
    const b0 = 0.02 + r() * 0.05;
    const lean = 0.05 + 0.12 * r();
    const h = 0.72 + 0.28 * r();
    const px = Math.cos(a);
    const pz = Math.sin(a);
    tube(
      m,
      [
        [px * b0, 0.05, pz * b0],
        [px * (b0 + lean * 0.3), 0.05 + h * 0.34, pz * (b0 + lean * 0.3)],
        [px * (b0 + lean * 0.7), 0.05 + h * 0.68, pz * (b0 + lean * 0.7)],
        [px * (b0 + lean * 1.1), 0.05 + h, pz * (b0 + lean * 1.1)],
      ],
      [0.0085, 0.0065, 0.004, 0.0012],
      4,
      rod,
      tip,
      5,
    );
  }
  return m.build();
}

export interface Vegetation {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
  counts: Record<string, number>;
  /** The coppice's stools, one mesh: a part of the world. */
  stools: THREE.InstancedMesh;
  /** The plan, for the tests. */
  plan: VegetationPlan;
}

export function buildVegetation(plan: VegetationPlan): Vegetation {
  const group = new THREE.Group();
  group.name = 'vegetation';
  const meshes: THREE.InstancedMesh[] = [];
  const counts: Record<string, number> = {};
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const colour = new THREE.Color();
  const make = (
    name: string,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    list: Inst[],
    opts: {
      shadow?: boolean;
      tint: (i: Inst) => THREE.Color;
      size?: (i: Inst, s: THREE.Vector3) => void;
      parent?: THREE.Object3D;
    },
  ): THREE.InstancedMesh => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    im.count = list.length;
    im.name = name;
    list.forEach((it, i) => {
      q.setFromAxisAngle(up, it.rot);
      (opts.size ?? ((a, s) => s.set(a.s * a.w, a.s, a.s * a.w)))(it, scl);
      pos.set(it.x, it.y - 0.06, it.z);
      m4.compose(pos, q, scl);
      im.setMatrixAt(i, m4);
      im.setColorAt(i, opts.tint(it));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = opts.shadow ?? false;
    // a tree's many small faces under a shadow's edge are what crawls first: only the bare wood and the stools receive
    im.receiveShadow = !name.startsWith('spruce') && name !== 'forest' && name !== 'young-spruces';
    im.frustumCulled = false;
    im.userData.noShadow = !opts.shadow;
    counts[name] = list.length;
    (opts.parent ?? group).add(im);
    meshes.push(im);
    return im;
  };
  const nearOf = (it: Inst) => Math.hypot(it.x - 2, it.z + 2) < 95;
  const spruceTint = (it: Inst) => colour.setHSL(0.31 + 0.05 * it.tint, 0.25, 0.86 + 0.24 * it.tint);
  const boughs = (lo: number, hi: number, gain: number) =>
    patchSnow(
      new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
      { lo, hi, gain, far: [60, 170], mean: [0.05, 0.085, 0.055] },
    );
  make('spruce-boughs', spruceGeometry(12, 7, 9, true), boughs(0.3, 0.8, 0.62), plan.spruces.filter(nearOf), {
    shadow: true,
    tint: spruceTint,
  });
  make(
    'spruce-mid',
    spruceGeometry(9, 6, 13, false),
    boughs(0.4, 0.95, 0.34),
    plan.spruces.filter((it) => !nearOf(it)),
    { shadow: true, tint: spruceTint },
  );
  const bark = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: spruceBarkMap(),
    vertexColors: true,
    roughness: 1,
  });
  make('spruce-trunk', spruceTrunk(), bark, plan.spruces, { shadow: true, tint: () => colour.set(0xffffff) });

  const birch = plan.bare.filter((_, i) => i % 2 === 0);
  const ash = plan.bare.filter((_, i) => i % 2 === 1);
  const birchBark = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: birchBarkMap(),
    vertexColors: true,
    roughness: 0.9,
  });
  const ashBark = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: barkMap(),
    vertexColors: true,
    roughness: 0.96,
  });
  const near = (it: Inst) => Math.hypot(it.x - 2, it.z + 2) < 42;
  make('birch-near', bareTree(3, true, true), birchBark, birch.filter(near), {
    shadow: true,
    tint: () => colour.set(0xffffff),
  });
  make(
    'birch-far',
    bareTree(3, true, false),
    birchBark,
    birch.filter((i) => !near(i)),
    { shadow: true, tint: () => colour.set(0xffffff) },
  );
  make('ash-near', bareTree(17, false, true), ashBark, ash.filter(near), {
    shadow: true,
    tint: () => colour.set(0xffffff),
  });
  make(
    'ash-far',
    bareTree(17, false, false),
    ashBark,
    ash.filter((i) => !near(i)),
    { shadow: true, tint: () => colour.set(0xffffff) },
  );

  make(
    'forest',
    farSpruce(),
    patchSnow(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1 }), {
      lo: 0.1,
      hi: 0.6,
      gain: 0.3,
      far: [150, 420],
    }),
    plan.forest,
    { tint: (it) => colour.setHSL(0.33 + 0.05 * it.tint, 0.2, 0.8 + 0.28 * it.tint) },
  );
  make('young-spruces', spruceGeometry(7, 6, 21, false), boughs(0.4, 0.95, 0.45), plan.young, {
    shadow: true,
    tint: (it) => colour.setHSL(0.3 + 0.05 * it.tint, 0.28, 0.92 + 0.24 * it.tint),
  });
  const stoolGroup = new THREE.Group();
  stoolGroup.name = 'coppice-stools';
  const stools = make(
    'stools',
    stoolGeometry(31),
    new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: barkMap(), roughness: 0.95 }),
    plan.stools,
    {
      shadow: true,
      size: (i, s) => s.set(i.s * 0.62, i.s, i.s * 0.62),
      tint: () => colour.set(0xffffff),
      parent: stoolGroup,
    },
  );
  stools.position.y = 0;
  return { group, meshes, counts, stools, plan };
}
