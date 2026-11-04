import * as THREE from 'three';
import { PartRegistry, rng } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HeaterState } from '../../sim/types';
import { TAU, boxAt, joined, lathe, plate, polyShape, stick, v3 } from '../common';
import { contactShadow } from '../detail';
import { BENCH, DUCT, FLUE, ROOM, ductAxis, MACHINE as M } from '../dims';
import { Followers } from '../followers';
import { GasFlow, gasColor, type GasNode } from '../fire/gas';
import { benchProfile, ductJoints, tubeAlong } from '../machine/bench';
import { buildDial, buildFlue, type FlueBuild } from '../machine/flue';
import { machineMaterials, type MachineMaterials } from '../machine/materials';
import { mergeStatic } from '../merge';
import { roomMaterials } from '../room/shell';
import { Caps, ClipSet, capRects } from '../section';
import { concreteMap, fbm, knitMap, pebbleMap, tiled } from '../textures';
import { Field, SLICE_H, SLICE_W, ThermalView, rampBar, rampY, sliceT, writeSlice } from '../thermal';
import { anchor, box, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { DEFAULT_PARAMS, type HeaterOptions } from '../room/stage';

// The `bench-section` world: where the heat goes. The bench at human scale, cut like a cake: two slices side by side with their faces towards you, the hot run under its thick cover and the cold run under its thin one, the same profile, the same duct as the bench of `living-room`.
// Each face carries the heat map of the model, always, the stones and the earth still showing under it: the colours move inward during a fire, then outward. The section tool opens the slices lengthwise, showing the gases in the duct and the joints. Behind them a corner of the bench
// is laid open from above, at the height of its duct, as a mason sees it before closing it: the bend, a joint, the cleanout, the tee at the chimney's foot and its drain. A third slice in a wooden form shows the other school, pebbles, with no temperature: no source gives it one.

export const BENCH_PARTS = [
  'duct-hot-run',
  'duct-cold-run',
  'duct-bend',
  'duct-joint',
  'cob-casing',
  'stone-filler',
  'earthen-plaster',
  'floor-barrier',
  'bench-cleanout',
  'chimney-tee',
  'condensate-drain',
  'temperature-lance',
  'pebble-section',
] as const;
export type BenchPart = (typeof BENCH_PARTS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'duct-hot-run', fr: 'Conduit chaud', en: 'Hot run' },
  { id: 'duct-cold-run', fr: 'Conduit froid', en: 'Cold run' },
  { id: 'pebble-section', fr: 'Galets', en: 'Pebbles' },
  { id: 'chimney-tee', fr: 'Té', en: 'Tee' },
  { id: 'cob-casing#t20', fr: '20 °C', en: '20 °C' },
  { id: 'cob-casing#t60', fr: '60 °C', en: '60 °C' },
  { id: 'cob-casing', fr: 'La terre qui garde', en: 'The cob casing', minor: true },
  { id: 'duct-bend', fr: 'Le coude', en: 'The bend', minor: true },
  { id: 'duct-joint', fr: 'Le raccord', en: 'The duct joint', minor: true },
  { id: 'stone-filler', fr: 'Les pierres', en: 'The stones', minor: true },
  { id: 'earthen-plaster', fr: 'L’enduit de terre', en: 'The earthen plaster', minor: true },
  { id: 'floor-barrier', fr: 'La couche sur la dalle', en: 'The floor layer', minor: true },
  { id: 'bench-cleanout', fr: 'Trappe du banc', en: 'The bench cleanout', minor: true },
  { id: 'condensate-drain', fr: 'La purge', en: 'The drain', minor: true },
  { id: 'temperature-lance', fr: 'La sonde', en: 'The probe', minor: true },
];

export const EXPLODE: Record<BenchPart, [number, number, number]> = {
  'temperature-lance': [0, 0.72, 0],
  'earthen-plaster': [0, 1.05, 0],
  'stone-filler': [0, 0.42, 0.42],
  'cob-casing': [0, 0.62, 0],
  'duct-hot-run': [0, 0.24, 0.72],
  'duct-cold-run': [0, 0.24, 0.72],
  'duct-joint': [0, 0.44, 0.72],
  'duct-bend': [0, 0.5, 0],
  'bench-cleanout': [0, 0.3, 0.42],
  'chimney-tee': [0, 0.55, 0.2],
  'condensate-drain': [-0.3, 0, 0.1],
  'floor-barrier': [0, -0.02, 0.5],
  'pebble-section': [0.42, 0.25, 0.3],
};

/**
 * How each part is framed. The slices show their faces to +z, and what is laid open behind them is looked at from above, over the slices and past the chimney. A part spread over the world is framed on the face of the hot slice, where it
 * reads, or on one of its joints: its whole box would take the camera back from the home view. The voice frames the two runs together, then the earth and its stones, keeping the direction it arrived with. Directions found by rendering
 * each part with and without itself from a grid of directions (`docs/3d.md`).
 */
export const FRAMING: Record<BenchPart, PartFraming> = {
  'duct-hot-run': { viewDir: viewFrom(18, 0), frame: box(-1.85, 0, -0.3, -1.2, 0.45, 0) },
  'duct-cold-run': { viewDir: viewFrom(18, 0), frame: box(-0.62, 0, -0.3, -0.1, 0.45, 0) },
  'duct-bend': { viewDir: viewFrom(55, -30) },
  'duct-joint': { viewDir: viewFrom(60, -30), frame: box(0.3, 0.1, -3.3, 0.85, 0.42, -2.9) },
  'cob-casing': { viewDir: viewFrom(18, 0), frame: box(-1.95, 0, -0.3, -1.2, 0.45, 0) },
  'stone-filler': { viewDir: viewFrom(12, 0), frame: box(-1.95, 0.05, -0.3, -1.2, 0.42, 0) },
  'earthen-plaster': { viewDir: viewFrom(30, 20), frame: box(-1.95, 0.25, -0.5, -1.2, 0.47, 0) },
  'floor-barrier': { viewDir: viewFrom(10, 0), frame: box(-1.95, 0, -0.25, -1.45, 0.12, 0) },
  'bench-cleanout': { viewDir: viewFrom(18, 0) },
  'chimney-tee': { viewDir: viewFrom(30, -60) },
  'condensate-drain': { viewDir: viewFrom(18, 0) },
  'temperature-lance': { viewDir: viewFrom(18, 0) },
  'pebble-section': { viewDir: viewFrom(18, 30), frame: box(0.72, 0, -0.7, 1.22, 0.45, 0) },
};

/** The slices: where each one's wall side stands along X, how long it is, its place along the run. */
export const SLICES = {
  L: 1.3,
  /** estimate: a stub of the wall behind each slice, in section. */
  wall: 0.24,
  wallH: 0.52,
  wallL: 0.42,
  hot: { x0: -1.95, s: 1.5, hot: true },
  cold: { x0: -0.62, s: 6.75, hot: false },
  pebble: { x0: 0.72 },
  /** The corner, in the frame of the slices: the duct's axis along Z and along X. */
  corner: { ductZ: -3.1, ductX: 1.0, start: -1.25, teeZ: -1.75 },
  /** estimate: the floor they all stand on. */
  slab: { x0: -2.55, x1: 2.1, z0: -3.72, z1: 0.42 },
};

const D = BENCH.depth;
const H = BENCH.height;
const P = BENCH.plaster;
const B = BENCH.barrier;
const R = DUCT.r + DUCT.wall;

export interface BenchSectionScene extends SceneModule<HeaterState> {
  thermal: ThermalView;
  gas: GasFlow;
  slices: { hot: SliceBuild; cold: SliceBuild };
  flue: FlueBuild;
  followers: Followers;
  caps: Caps;
  fields: { hot: Field; cold: Field };
  scale: THREE.Group;
  section(): boolean;
  scenery(): THREE.Object3D[];
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** A slice's outer outline, from the wall's foot round the seat to the front's foot. */
function outerOutline(): [number, number][] {
  const prof = benchProfile();
  return [[0, 0], ...prof.map((p): [number, number] => [p.d, p.y])];
}

/** The earth's outline, inside its plaster, on its layer. */
function cobOutline(): [number, number][] {
  const r = Math.max(0.005, BENCH.edgeR - P);
  const pts: [number, number][] = [
    [0, B],
    [0, H - P],
    [D - P - r, H - P],
  ];
  for (let i = 1; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    pts.push([D - P - r + r * Math.sin(a), H - P - r + r * Math.cos(a)]);
  }
  pts.push([D - P, B]);
  return pts;
}

/** A closed polygon of a circle, for a hole. */
const circle = (cx: number, cy: number, r: number, n = 36): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = -(i / n) * TAU;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
};

/** A flat face in the plane z = z0, with `aHeatUv` = (x / depth, y / height) and UVs in metres. */
function face(
  outline: readonly (readonly [number, number])[],
  holes: (readonly (readonly [number, number])[])[],
  x0: number,
  z0: number,
): THREE.BufferGeometry {
  const g = new THREE.ShapeGeometry(polyShape(outline, holes), 12);
  const p = g.attributes.position as THREE.BufferAttribute;
  const heat = new Float32Array(p.count * 2);
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    heat[i * 2] = p.getX(i) / D;
    heat[i * 2 + 1] = p.getY(i) / H;
    uv[i * 2] = p.getX(i);
    uv[i * 2 + 1] = p.getY(i);
  }
  g.setAttribute('aHeatUv', new THREE.BufferAttribute(heat, 2));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.translate(x0, 0, z0);
  return g;
}

/** Irregular stones in a face: a star-shaped outline each, kept off the duct and the skin. Returns their outlines. */
function stoneOutlines(
  seed: number,
  axis: number,
  n: number,
  zone: { x0: number; x1: number; y0: number; y1: number },
  keep: (x: number, y: number, r: number) => boolean,
): [number, number][][] {
  const r = rng(seed);
  const out: [number, number][][] = [];
  const centres: [number, number, number][] = [];
  let tries = 0;
  while (out.length < n && tries++ < 700) {
    const cx = zone.x0 + r() * (zone.x1 - zone.x0);
    const cy = zone.y0 + r() * (zone.y1 - zone.y0);
    const rad = 0.022 + 0.042 * r() ** 1.5;
    if (!keep(cx, cy, rad)) continue;
    if (cx - rad * 1.3 < zone.x0 || cx + rad * 1.3 > zone.x1 || cy - rad * 1.1 < zone.y0 || cy + rad * 1.1 > zone.y1)
      continue;
    if (centres.some(([a, b, c]) => Math.hypot(a - cx, b - cy) < (c + rad) * 1.25)) continue;
    centres.push([cx, cy, rad]);
    const pts: [number, number][] = [];
    const m = 9;
    const off = r() * 9;
    const squash = 0.68 + 0.3 * r();
    for (let i = 0; i < m; i++) {
      const a = -(i / m) * TAU;
      const k = 0.78 + 0.45 * fbm(Math.cos(a) * 1.4 + off, Math.sin(a) * 1.4 + off, 2);
      pts.push([cx + Math.cos(a) * rad * k * 1.2, cy + Math.sin(a) * rad * k * squash]);
    }
    out.push(pts);
  }
  void axis;
  return out;
}

/** A stone's body behind the face: the outline moved back and narrowed into the earth, a rounded half-rock. Colours in the vertices. */
function stoneBody(outline: [number, number][], x0: number, depth: number, tone: THREE.Color): THREE.BufferGeometry {
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
  const cy = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  const pos: number[] = [];
  const idx: number[] = [];
  const steps = 3;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const s = Math.sqrt(Math.max(0.02, 1 - t * t));
    for (const [x, y] of outline) pos.push(x0 + cx + (x - cx) * s, cy + (y - cy) * s, -t * depth);
  }
  const n = outline.length;
  for (let k = 0; k < steps; k++)
    for (let i = 0; i < n; i++) {
      const a = k * n + i;
      const b = k * n + ((i + 1) % n);
      idx.push(a, b, a + n, b, b + n, a + n);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  void tone;
  return g;
}

export interface SliceBuild {
  x0: number;
  axis: number;
  clip: ClipSet;
  field: Field;
  long: Field;
  /** Where along the run it lies, as a fractional segment of the model. */
  seg: number;
  bore: THREE.MeshStandardMaterial;
}

export function createBenchSectionScene(opts: HeaterOptions = {}): BenchSectionScene {
  const params = opts.params ?? DEFAULT_PARAMS;
  const scene = new THREE.Scene();
  scene.name = 'bench-section';
  // the room's back stops at the ceiling, which is not drawn: above it the plaster's tone goes on, and the night with the thermal view
  const backdrop = new THREE.Color(0xc9bda9);
  const backdropThermal = new THREE.Color(0x07090d);
  scene.background = backdrop.clone();
  scene.fog = new THREE.Fog(0xc9bda9, 14, 34);
  scene.userData.wantsEnv = true;
  scene.userData.look = { toneMapping: 'aces', exposure: 1.1, environment: 'paper', ao: true, aoRadius: 0.2 };

  const hemi = new THREE.HemisphereLight(0xfff0dc, 0x5e4e40, 0.78);
  const key = new THREE.DirectionalLight(0xffeeda, 1.75);
  key.position.set(-2.4, 6.2, 5.2);
  key.target.position.set(0, 0.3, -1.3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -4.4;
  sc.right = 4.4;
  sc.top = 4.4;
  sc.bottom = -4.4;
  sc.near = 0.5;
  sc.far = 16;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.016;
  key.shadow.radius = 3;
  const warm = new THREE.PointLight(0xffc28a, 3.2, 7, 1.8);
  warm.position.set(-0.4, 1.5, 1.9);
  scene.add(hemi, key, key.target, warm);

  const registry = new PartRegistry();
  const thermal = new ThermalView();
  const caps = new Caps();
  const mats: MachineMaterials = machineMaterials();
  const rm = roomMaterials();

  const roots = {} as Record<BenchPart, THREE.Group>;
  for (const id of BENCH_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
    scene.add(g);
  }
  const add = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, cast = true): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // ---- what they stand on: one floor, one slab, a stub of wall, a plain room's back
  const setting = new THREE.Group();
  setting.name = 'setting';
  scene.add(setting);
  const S = SLICES.slab;
  add(setting, boxAt(S.x0 - 3, -0.03, S.z0 - 2, S.x1 + 3, -ROOM.floorDrop, S.z1 + 4), rm.oak, false);
  add(setting, boxAt(S.x0, -M.slab, S.z0, S.x1, 0, S.z1), rm.slab, false);
  add(setting, boxAt(S.x0, -0.3, S.z0, S.x1, -M.slab, S.z1), rm.insul, false);
  // the room's back, its plaster, its window: what the corner leans against
  const backZ = SLICES.corner.ductZ - D / 2;
  const sideX = SLICES.corner.ductX + D / 2;
  add(setting, boxAt(S.x0 - 3, 0, backZ - ROOM.outerWall, sideX + ROOM.outerWall, ROOM.height, backZ), rm.plaster);
  add(setting, boxAt(sideX, 0, backZ, sideX + ROOM.outerWall, ROOM.height, SLICES.corner.teeZ + 0.38), rm.plasterGable);
  // a window in it, its sill, a shelf on the wall with a few books: the room is lived in here too
  const winX0 = -1.3;
  const winX1 = -0.1;
  const y0w = ROOM.windowSill;
  const y1w = ROOM.windowHead;
  const fr: THREE.BufferGeometry[] = [
    boxAt(winX0, y0w, backZ, winX1, y0w + 0.06, backZ + 0.05),
    boxAt(winX0, y1w - 0.06, backZ, winX1, y1w, backZ + 0.05),
    boxAt(winX0, y0w, backZ, winX0 + 0.06, y1w, backZ + 0.05),
    boxAt(winX1 - 0.06, y0w, backZ, winX1, y1w, backZ + 0.05),
    boxAt((winX0 + winX1) / 2 - 0.03, y0w, backZ, (winX0 + winX1) / 2 + 0.03, y1w, backZ + 0.05),
    boxAt(winX0 - 0.06, y0w - 0.04, backZ, winX1 + 0.06, y0w, backZ + 0.13),
  ];
  add(setting, joined(fr), rm.frame);
  const nightGlass = new THREE.MeshStandardMaterial({
    color: 0x1a2534,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x2a3b55,
    emissiveIntensity: 0.35,
  });
  add(setting, boxAt(winX0 + 0.04, y0w + 0.04, backZ, winX1 - 0.04, y1w - 0.04, backZ + 0.005), nightGlass, false);
  const shelfX = 0.25;
  add(setting, boxAt(shelfX, 1.52, backZ, shelfX + 0.72, 1.55, backZ + 0.2), rm.frame);
  const bookColors = [0x6c2b22, 0x2b4a44, 0x8f6c2e, 0x37384e, 0x9d5a2c];
  let bx = shelfX + 0.05;
  for (let i = 0; i < 9; i++) {
    const w = 0.03 + (i % 3) * 0.009;
    const h = 0.17 + ((i * 7) % 4) * 0.018;
    add(
      setting,
      boxAt(bx, 1.55, backZ + 0.03, bx + w, 1.55 + h, backZ + 0.17),
      new THREE.MeshStandardMaterial({ color: bookColors[i % bookColors.length], roughness: 0.82 }),
      false,
    );
    bx += w + 0.002;
  }

  // ---- one slice of the bench, hot or cold: the face towards the viewer, the body behind it
  const stoneMat = (): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color: 0x8d877a, map: tiled(concreteMap(), 1 / 0.22), roughness: 0.94 });
    m.userData.noShare = true;
    return m;
  };
  const makeSlice = (o: { x0: number; s: number; hot: boolean }): SliceBuild => {
    const x0 = o.x0;
    const axis = ductAxis(M.bore, o.hot);
    const L = SLICES.L;
    const clip = new ClipSet([{ normal: [-1, 0, 0], at: [x0 + D / 2, 0, 0] }]);
    const field = new Field(SLICE_W, SLICE_H, 25);
    const long = new Field(10, SLICE_H, 25);
    const seg = (o.s / M.ductLength) * M.ductLegs.length * 3 - 0.5;
    const clone = (m: THREE.Material) => {
      const c = m.clone();
      c.userData = { noShare: true };
      clip.clipMaterial(c);
      return c as THREE.MeshStandardMaterial;
    };
    // the wall behind it, in section: plaster, insulation, render
    const wall = new THREE.Group();
    wall.name = 'wall-stub';
    const wh = SLICES.wallH;
    const w = SLICES.wall;
    const wl = SLICES.wallL;
    add(wall, boxAt(x0 - w, 0, -wl, x0 - w + 0.03, wh, 0), rm.render);
    add(wall, boxAt(x0 - w + 0.03, 0, -wl, x0 - 0.02, wh, 0), rm.insul);
    add(wall, boxAt(x0 - 0.02, 0, -wl, x0, wh, 0), rm.plaster);
    setting.add(wall);

    // ---- the face
    const hole = circle(D / 2, axis, R);
    const cobMat = clone(mats.cobCut);
    const cob = add(roots['cob-casing'], face(cobOutline(), [hole], x0, 0), cobMat, false);
    cob.name = 'cob-face';
    thermal.patch(cobMat, field, { min: 0.72, glow: 0.62 });
    const skin = clone(mats.plasterCut);
    const outer = outerOutline().slice(1);
    const innerRev = cobOutline()
      .slice(1)
      .reverse()
      .map((p): [number, number] => [p[0], p[1]]);
    const skinPoly: [number, number][] = [...outer, [D - P, 0], ...innerRev];
    add(roots['earthen-plaster'], face(skinPoly, [], x0, 0), skin, false);
    thermal.patch(skin, field, { min: 0.72, glow: 0.62 });
    const barr = clone(mats.barrierCut);
    add(
      roots['floor-barrier'],
      face(
        [
          [0, 0],
          [D, 0],
          [D, B],
          [0, B],
        ],
        [],
        x0,
        0,
      ),
      barr,
      false,
    );
    thermal.patch(barr, field, { min: 0.45, glow: 0.5 });

    // ---- the stones in the earth
    const outlines = stoneOutlines(
      o.hot ? 101 : 202,
      axis,
      o.hot ? 16 : 13,
      { x0: 0.012, x1: D - P - 0.012, y0: B + 0.012, y1: H - P - 0.012 },
      (x, y, r) => Math.hypot(x - D / 2, y - axis) > R + r + 0.016 && !(x > D - P - 0.05 && y > H - P - 0.05),
    );
    const stoneFaces: THREE.BufferGeometry[] = [];
    const stoneBodies: THREE.BufferGeometry[] = [];
    for (const out of outlines) {
      stoneFaces.push(face(out, [], x0, 0.0016));
      stoneBodies.push(stoneBody(out, x0, 0.05, new THREE.Color(0xffffff)));
    }
    const sMat = clone(stoneMat());
    thermal.patch(sMat, field, { min: 0.55, glow: 0.42 });
    add(roots['stone-filler'], joined(stoneFaces), sMat, false);
    const bodyMat = clone(stoneMat());
    thermal.patch(bodyMat, thermal.seat);
    add(roots['stone-filler'], joined(stoneBodies), bodyMat, false);

    // ---- the body behind the face: the plastered top and front, a closed end
    const prof = benchProfile();
    const pos: number[] = [];
    const heat: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const segs = 6;
    const sFrac = o.s / M.ductLength;
    for (let i = 0; i <= segs; i++) {
      const z = (-L * i) / segs;
      let arc = 0;
      prof.forEach((p, j) => {
        if (j > 0) arc += Math.hypot(p.d - prof[j - 1]!.d, p.y - prof[j - 1]!.y);
        pos.push(x0 + p.d, p.y, z);
        heat.push(sFrac, 0.25 + 0.5 * p.f);
        uv.push(z, arc);
      });
    }
    const np = prof.length;
    for (let i = 0; i < segs; i++)
      for (let j = 0; j < np - 1; j++) {
        const a = i * np + j;
        idx.push(a, a + np, a + 1, a + 1, a + np, a + np + 1);
      }
    const body = new THREE.BufferGeometry();
    body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    body.setAttribute('aHeatUv', new THREE.Float32BufferAttribute(heat, 2));
    body.setIndex(idx);
    body.computeVertexNormals();
    const earth = clone(mats.earthSkin);
    thermal.patch(earth, thermal.bench);
    add(roots['earthen-plaster'], body, earth);
    // the far end, closed in plaster
    const endMat = clone(mats.earthSkin);
    thermal.patch(endMat, thermal.seat);
    add(roots['earthen-plaster'], face(outerOutline(), [], x0, -L), endMat, false);

    // ---- the layer on the slab, along the slice
    const layerMat = clone(mats.concrete);
    thermal.patch(layerMat, thermal.slab);
    add(roots['floor-barrier'], boxAt(x0, 0, -L, x0 + D, B * 0.5, 0), layerMat, false);

    // ---- the duct in it: bare steel outside, dark inside, its collar
    const ductPart = roots[o.hot ? 'duct-hot-run' : 'duct-cold-run'];
    const path = [v3(x0 + D / 2, axis, -L), v3(x0 + D / 2, axis, -L / 2), v3(x0 + D / 2, axis, 0.002)];
    const steelMat = clone(mats.duct);
    thermal.patch(steelMat, o.hot ? thermal.ductHot : thermal.ductCold);
    add(ductPart, tubeAlong(path, DUCT.r + DUCT.wall, 32), steelMat);
    const inside = clone(mats.ductInside);
    inside.color.set(0x1c1714);
    inside.emissive = new THREE.Color(0xff6a20);
    inside.emissiveIntensity = 0;
    add(ductPart, tubeAlong(path, DUCT.r, 32), inside, false);
    // the bore's far end: dark, the eye reads a long tube
    const stopper = new THREE.CircleGeometry(DUCT.r, 32);
    stopper.translate(x0 + D / 2, axis, -L + 0.012);
    const stopMat = clone(mats.ductInside);
    add(ductPart, stopper, stopMat, false);
    const lip = lathe(
      [
        [DUCT.r, 0],
        [R, 0],
      ],
      36,
    );
    lip.rotateX(Math.PI / 2);
    lip.translate(x0 + D / 2, axis, 0.0025);
    const lipMat = clone(mats.steel);
    add(ductPart, lip, lipMat, false);
    // the joint, a third of the way along: it shows when the section opens the slice
    const collar = stick(
      v3(x0 + D / 2, axis, -L * 0.62 - DUCT.collarL / 2),
      v3(x0 + D / 2, axis, -L * 0.62 + DUCT.collarL / 2),
      DUCT.collarR,
      32,
    );
    const collarMat = clone(mats.flueBand);
    add(roots['duct-joint'], collar, collarMat);

    // ---- what the section tool shows: the slice opened lengthwise, in the plane of the duct's axis
    const placeLong = (a: number, b: number): [number, number, number] => [x0 + D / 2, b, a];
    const heatLong = (a: number, b: number): [number, number] => [-a / L, b / H];
    const longCob = capRects(
      [
        [-L, B, 0, axis - R],
        [-L, axis + R, 0, H - P],
      ],
      placeLong,
      heatLong,
    );
    const lcMat = mats.cobCut.clone();
    lcMat.side = THREE.DoubleSide;
    lcMat.userData = { noShare: true };
    thermal.patch(lcMat, long, { min: 0.72, glow: 0.62 });
    caps.add('cob-casing', roots['cob-casing'], longCob, lcMat);
    const lpMat = mats.plasterCut.clone();
    lpMat.side = THREE.DoubleSide;
    lpMat.userData = { noShare: true };
    thermal.patch(lpMat, long, { min: 0.72, glow: 0.62 });
    caps.add('earthen-plaster', roots['earthen-plaster'], capRects([[-L, H - P, 0, H]], placeLong, heatLong), lpMat);
    const lbMat = mats.barrierCut.clone();
    lbMat.side = THREE.DoubleSide;
    lbMat.userData = { noShare: true };
    thermal.patch(lbMat, long, { min: 0.45, glow: 0.5 });
    caps.add('floor-barrier', roots['floor-barrier'], capRects([[-L, 0, 0, B]], placeLong, heatLong), lbMat);
    const ldMat = mats.steel.clone();
    ldMat.side = THREE.DoubleSide;
    ldMat.userData = { noShare: true };
    caps.add(
      o.hot ? 'duct-hot-run' : 'duct-cold-run',
      ductPart,
      capRects(
        [
          [-L, axis - R, 0, axis - DUCT.r],
          [-L, axis + DUCT.r, 0, axis + R],
        ],
        placeLong,
      ),
      ldMat,
    );
    return { x0, axis, clip, field, long, seg, bore: inside };
  };

  const hot = makeSlice(SLICES.hot);
  const cold = makeSlice(SLICES.cold);

  // ---- the probe in the hot slice: a steel rod from a dial on the seat, down to the earth by the duct; its needle reads the model's cell
  const lanceX = SLICES.hot.x0 + D * 0.74;
  const lanceBottom = hot.axis + 0.02;
  add(
    roots['temperature-lance'],
    stick(v3(lanceX, lanceBottom, -0.0015), v3(lanceX, H + 0.06, -0.0015), 0.0055, 10),
    mats.steel,
  );
  const dial = buildDial(mats, 0.04);
  dial.group.position.set(lanceX, H + 0.095, 0.03 - 0.0015);
  roots['temperature-lance'].add(dial.group);

  // ---- the pebble slice: the other school, in a wooden form; its face carries no temperature, no source gives it one
  const pebbleX = SLICES.pebble.x0;
  {
    const L = SLICES.L;
    const pb = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tiled(pebbleMap(), 1 / 0.42), roughness: 0.92 });
    pb.userData.noShare = true;
    const axis = hot.axis;
    const pSide = 0.03;
    const top: [number, number][] = [
      [pSide, B],
      [pSide, H - 0.02],
      [D - pSide, H - 0.02],
      [D - pSide, B],
    ];
    add(roots['pebble-section'], face(top, [circle(D / 2, axis, R)], pebbleX, 0), pb, false);
    // the form: boards on the front and the back, a cap on the top, a foot
    const board = new THREE.MeshStandardMaterial({ color: 0xb48957, map: tiled(knitMap(), 3), roughness: 0.8 });
    board.map = rm.frame.map;
    const parts: THREE.BufferGeometry[] = [
      boxAt(pebbleX, 0, -L, pebbleX + pSide, H, 0),
      boxAt(pebbleX + D - pSide, 0, -L, pebbleX + D, H, 0),
      boxAt(pebbleX, H - 0.02, -L, pebbleX + D, H, 0),
      boxAt(pebbleX, 0, -L, pebbleX + D, B, 0),
    ];
    add(roots['pebble-section'], joined(parts), board);
    const pTube = [v3(pebbleX + D / 2, axis, -L), v3(pebbleX + D / 2, axis, 0.002)];
    add(roots['pebble-section'], tubeAlong(pTube, R, 32), mats.duct);
    add(roots['pebble-section'], tubeAlong(pTube, DUCT.r, 32), mats.ductInside, false);
    const pStop = new THREE.CircleGeometry(DUCT.r, 32);
    pStop.translate(pebbleX + D / 2, axis, -L + 0.012);
    add(roots['pebble-section'], pStop, mats.ductInside, false);
    const wallStub = new THREE.Group();
    wallStub.name = 'wall-stub';
    add(
      wallStub,
      boxAt(pebbleX - SLICES.wall, 0, -SLICES.wallL, pebbleX - SLICES.wall + 0.03, SLICES.wallH, 0),
      rm.render,
    );
    add(wallStub, boxAt(pebbleX - SLICES.wall + 0.03, 0, -SLICES.wallL, pebbleX - 0.02, SLICES.wallH, 0), rm.insul);
    add(wallStub, boxAt(pebbleX - 0.02, 0, -SLICES.wallL, pebbleX, SLICES.wallH, 0), rm.plaster);
    setting.add(wallStub);
  }

  // ---- the corner, laid open at the height of the duct: the same radii, the same bend
  const C = SLICES.corner;
  const axisC = DUCT.axisCold;
  const planEarth = polyShape([
    [C.start, C.ductZ - D / 2],
    [C.ductX + D / 2, C.ductZ - D / 2],
    [C.ductX + D / 2, C.teeZ - 0.2],
    [C.ductX - D / 2, C.teeZ - 0.2],
    [C.ductX - D / 2, C.ductZ + D / 2],
    [C.start, C.ductZ + D / 2],
  ]);
  const planMat = mats.cobCut.clone();
  planMat.userData = { noShare: true };
  add(roots['cob-casing'], plate(planEarth, B, axisC, 4), planMat);
  thermal.patch(planMat, thermal.seat);
  add(roots['floor-barrier'], plate(planEarth, 0, B, 4), mats.barrierCut);

  // the stones on the open earth
  const planStones: THREE.BufferGeometry[] = [];
  {
    const ol = stoneOutlines(
      303,
      0,
      34,
      { x0: C.start + 0.02, x1: C.ductX + D / 2 - 0.02, y0: C.ductZ - D / 2 + 0.02, y1: C.teeZ - 0.22 },
      (x, y, r) => {
        const inLegA = y < C.ductZ + D / 2 && Math.abs(y - C.ductZ) > DUCT.r + r + 0.02;
        const inLegB = x > C.ductX - D / 2 && Math.abs(x - C.ductX) > DUCT.r + r + 0.02 && y > C.ductZ - 0.02;
        const notOnBend =
          Math.hypot(x - (C.ductX - DUCT.bendR), y - (C.ductZ + DUCT.bendR)) > DUCT.bendR + DUCT.r + r + 0.02 ||
          y < C.ductZ - DUCT.r - r ||
          x > C.ductX + DUCT.r + r;
        const onLegAOnly = y < C.ductZ + D / 2 && x < C.ductX - D / 2 - 0.02;
        return (
          (inLegA || inLegB) &&
          notOnBend &&
          (onLegAOnly ||
            (x >= C.ductX - D / 2 && (Math.abs(x - C.ductX) > DUCT.r + r + 0.02 || y < C.ductZ - DUCT.r - r)))
        );
      },
    );
    for (const out of ol) {
      const g = new THREE.ShapeGeometry(polyShape(out), 4);
      // shape (x, y) to the plan (x, z), just over the earth; its normal up
      g.rotateX(Math.PI / 2);
      const p = g.attributes.position as THREE.BufferAttribute;
      const n = g.attributes.normal as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        p.setY(i, axisC + 0.0015);
        n.setXYZ(i, 0, 1, 0);
      }
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
      // turned to face up
      const ix = g.index;
      if (ix) {
        for (let i = 0; i < ix.count; i += 3) {
          const b = ix.getX(i + 1);
          ix.setX(i + 1, ix.getX(i + 2));
          ix.setX(i + 2, b);
        }
      }
      planStones.push(g);
    }
  }
  const planStone = stoneMat();
  planStone.side = THREE.DoubleSide;
  if (planStones.length) add(roots['stone-filler'], joined(planStones), planStone, false).receiveShadow = false;

  // the duct, laid in the earth: two straight runs, the bend, joints at each end of it
  const rb = DUCT.bendR;
  const legA = [v3(C.start, axisC, C.ductZ), v3(C.ductX - rb, axisC, C.ductZ)];
  const legB = [v3(C.ductX, axisC, C.ductZ + rb), v3(C.ductX, axisC, C.teeZ - 0.12)];
  const bendPath: THREE.Vector3[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * (Math.PI / 2);
    bendPath.push(v3(C.ductX - rb + rb * Math.sin(a), axisC, C.ductZ + rb - rb * Math.cos(a)));
  }
  add(roots['duct-cold-run'], tubeAlong(legA, DUCT.r, 28), mats.duct.clone());
  add(roots['duct-cold-run'], tubeAlong(legB, DUCT.r, 28), mats.duct.clone());
  const bendMat = mats.duct.clone();
  add(roots['duct-bend'], tubeAlong(bendPath, DUCT.r + 0.0015, 28), bendMat);
  const collarsPath = [legA[0]!, legA[1]!, ...bendPath.slice(1), legB[1]!];
  add(roots['duct-joint'], ductJoints(collarsPath.map((p) => p.clone())), mats.flueBand);
  add(
    roots['duct-joint'],
    stick(
      v3(C.ductX - rb - DUCT.collarL / 2, axisC, C.ductZ),
      v3(C.ductX - rb + DUCT.collarL / 2, axisC, C.ductZ),
      DUCT.collarR,
      28,
    ),
    mats.flueBand,
  );
  add(
    roots['duct-joint'],
    stick(
      v3(C.ductX, axisC, C.ductZ + rb - DUCT.collarL / 2),
      v3(C.ductX, axisC, C.ductZ + rb + DUCT.collarL / 2),
      DUCT.collarR,
      28,
    ),
    mats.flueBand,
  );

  // the cleanout: a branch from the duct, to the front of the bench, its cap and its handle
  const clX = C.ductX - (BENCH.ductX - BENCH.cleanoutX);
  const clZ1 = C.ductZ + D / 2;
  add(
    roots['bench-cleanout'],
    stick(v3(clX, axisC, C.ductZ), v3(clX, axisC, clZ1 + 0.005), BENCH.cleanoutR - 0.012, 22),
    mats.duct.clone(),
  );
  add(
    roots['bench-cleanout'],
    joined([
      stick(v3(clX, axisC, clZ1), v3(clX, axisC, clZ1 + 0.014), BENCH.cleanoutR, 28),
      stick(v3(clX, axisC, clZ1 + 0.014), v3(clX, axisC, clZ1 + 0.024), BENCH.cleanoutR - 0.018, 24),
      stick(v3(clX - 0.035, axisC, clZ1 + 0.03), v3(clX + 0.035, axisC, clZ1 + 0.03), 0.006, 8),
    ]),
    mats.steel,
  );

  // ---- the chimney's foot, the same function as everywhere: the tee, the drain, the foot's cup; the flue cut at the eye's height
  const flue = buildFlue(mats);
  const fdx = C.ductX - FLUE.x;
  const fdz = C.teeZ - FLUE.z;
  const footFrame = new THREE.Group();
  footFrame.name = 'chimney-foot';
  footFrame.position.set(fdx, 0, fdz);
  scene.add(footFrame);
  for (const id of ['tee', 'drain', 'foot-cap', 'indoor'] as const) footFrame.add(flue.roots[id]);
  const cutY = 1.62;
  const flueCut = new ClipSet([{ normal: [0, -1, 0], at: [0, cutY, 0] }]);
  flueCut.set(true);
  flueCut.clip(flue.roots.indoor);
  const flueRing = lathe(
    [
      [FLUE.r, 0],
      [FLUE.outerR, 0],
    ],
    28,
  );
  flueRing.translate(FLUE.x, cutY - 0.0005, FLUE.z);
  const ringMat = mats.insulation.clone();
  ringMat.side = THREE.DoubleSide;
  add(flue.roots.indoor, flueRing, ringMat, false);
  // the parts here: the tee and the drain; move their groups into the parts' roots, keeping their place
  roots['chimney-tee'].add(flue.roots.tee);
  roots['chimney-tee'].position.set(fdx, 0, fdz);
  roots['condensate-drain'].add(flue.roots.drain);
  roots['condensate-drain'].position.set(fdx, 0, fdz);

  // ---- contact on the slab
  const contact = (w: number, d: number, x: number, z: number) => {
    const c = contactShadow(w, d, 0.26, 0.34);
    c.position.set(x, 0.0015, z);
    scene.add(c);
  };
  for (const x of [SLICES.hot.x0, SLICES.cold.x0, pebbleX]) contact(D, SLICES.L, x + D / 2, -SLICES.L / 2);

  // ---- the scale of the false colour
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f1b18, roughness: 0.7 });
  const BAR_H = 0.62;
  const BAR_Y0 = 0.3;
  const scale = rampBar(BAR_H, 0.08, BAR_Y0, frameMat);
  // on the slab behind the hot slice, where no label goes
  scale.position.set(SLICES.hot.x0 + 0.1, 0, -2.5);
  scale.rotation.y = 0.0;
  scene.add(scale);

  // ---- merge what stays together, then the false colour of the rest
  const scope = 'bench-section';
  mergeStatic(setting, { name: 'setting', scope, colours: false });
  mergeStatic(roots['pebble-section'], { name: 'pebble', scope, colours: false });
  for (const id of ['tee', 'foot-cap', 'drain'] as const)
    mergeStatic(flue.roots[id], { name: `flue-${id}`, scope, colours: false });
  thermal.patchAll(setting, thermal.surface);
  thermal.patchAll(roots['pebble-section'], thermal.surface);
  thermal.patchAll(footFrame, thermal.flue);
  thermal.patchAll(roots['chimney-tee'], thermal.flue);
  thermal.patchAll(roots['condensate-drain'], thermal.flue);
  thermal.patchAll(roots['temperature-lance'], thermal.seat);
  thermal.patchAll(roots['duct-hot-run'], thermal.ductHot);
  thermal.patchAll(roots['duct-cold-run'], thermal.ductCold);
  thermal.patchAll(roots['duct-bend'], thermal.ductCold);
  thermal.patchAll(roots['duct-joint'], thermal.ductCold);
  thermal.patchAll(roots['bench-cleanout'], thermal.ductCold);
  thermal.patchAll(roots['stone-filler'], thermal.seat);
  thermal.patchAll(roots['floor-barrier'], thermal.slab);

  // ---- the labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: BenchPart, x: number, y: number, z: number) => {
    anchors[id] = anchor(roots[id], x, y, z, `${id}-label`);
  };
  const xh = SLICES.hot.x0;
  const xc = SLICES.cold.x0;
  at('duct-hot-run', xh + 0.06, H + 0.01, -0.95);
  at('duct-cold-run', xc + D / 2, cold.axis - DUCT.r * 0.2, 0.02);
  at('cob-casing', xh + 0.09, 0.14, 0.01);
  at('stone-filler', xh + 0.38, 0.13, 0.01);
  at('earthen-plaster', xh + 0.2, H, -0.2);
  at('floor-barrier', xh + 0.03, B * 0.5, 0.02);
  at('temperature-lance', lanceX, H + 0.15, 0.03);
  at('pebble-section', pebbleX + D / 2, B + 0.06, 0.01);
  at('duct-bend', C.ductX - rb * 0.3, axisC + DUCT.r, C.ductZ + rb * 0.3);
  at('duct-joint', C.ductX - rb, axisC + DUCT.collarR, C.ductZ);
  at('bench-cleanout', clX, axisC + 0.06, clZ1 + 0.02);
  at('chimney-tee', FLUE.x, FLUE.teeY + 0.17, FLUE.z + FLUE.r);
  at('condensate-drain', FLUE.x - FLUE.capR - 0.12, FLUE.drainY + 0.02, FLUE.z);
  anchors['cob-casing#t20'] = anchor(scale, 0.06, rampY(20, BAR_H, BAR_Y0), 0.02, 't20');
  anchors['cob-casing#t60'] = anchor(scale, 0.06, rampY(60, BAR_H, BAR_Y0), 0.02, 't60');

  for (const id of BENCH_PARTS) {
    registry.add(id, roots[id], V(...EXPLODE[id]), undefined, FRAMING[id]);
  }

  // ---- the gases: along each slice's duct, along the corner, to the tee and up to the cut; on with the section and with « Flux »
  const A = Math.PI * DUCT.r * DUCT.r;
  const stS = (s: number) => 7 + 1.8 * (s / M.ductLength);
  const run = (pts: THREE.Vector3[], st0: number, st1: number): GasNode[] => {
    const n = pts.length - 1;
    return pts.map((p, i) => ({ p, st: st0 + ((st1 - st0) * i) / Math.max(1, n), A, h: DUCT.r }));
  };
  const gas = new GasFlow(280, 4.5);
  gas.addRun(run([v3(xh + D / 2, hot.axis, -SLICES.L), v3(xh + D / 2, hot.axis, 0)], stS(1), stS(2)), 45);
  gas.addRun(run([v3(xc + D / 2, cold.axis, -SLICES.L), v3(xc + D / 2, cold.axis, 0)], stS(6), stS(7)), 45);
  const lPath = [legA[0]!, legA[1]!, ...bendPath.slice(1), legB[1]!, v3(C.ductX, axisC, C.teeZ)];
  gas.addRun(run(lPath, stS(6.8), 8.8), 90);
  gas.addRun(run([v3(C.ductX, axisC, C.teeZ), v3(C.ductX, cutY, C.teeZ)], 8.8, 9.6), 28);
  scene.add(gas.group);

  // ---- fields
  thermal.onWrite.push((s) => {
    writeSlice(hot.field, s, hot.seg, D, H);
    writeSlice(cold.field, s, cold.seg, D, H);
    for (const sl of [hot, cold]) {
      const f = sl.long;
      for (let j = 0; j < f.h; j++) {
        const y = ((j + 0.5) / f.h) * H;
        for (let i = 0; i < f.w; i++) {
          const seg = sl.seg + ((i + 0.5) / f.w - 0.5) * 0.8;
          const a = Math.max(0, Math.min(s.benchSegments - 1, Math.floor(seg)));
          const b = Math.min(s.benchSegments - 1, a + 1);
          const t = Math.max(0, Math.min(1, seg - a));
          f.set(i, j, sliceT(s, a, D / 2, y) * (1 - t) + sliceT(s, b, D / 2, y) * t);
        }
      }
      f.commit();
    }
  });

  const followers = new Followers();
  followers.add('chimney-tee', flue.roots['foot-cap']);
  followers.add('chimney-tee', flue.roots['indoor'], { explode: 1 });

  let sectionOn = false;
  let dialAngle = -2.35;
  const glowCol = new THREE.Color();

  const mod: BenchSectionScene = {
    id: 'bench-section',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    thermal,
    gas,
    slices: { hot, cold },
    flue,
    followers,
    caps,
    fields: { hot: hot.field, cold: cold.field },
    scale,
    section: () => sectionOn,
    scenery: () => [setting, footFrame],
    home: { position: V(-0.32, 1.95, 4.6), target: V(-0.32, 0.32, -1.1) },
    minDistance: 0.3,
    maxDistance: 11,
    homePadding: 0.8,
    update(s, dt, view) {
      const p = params();
      thermal.update(s, p.thermalView, dt);
      const th = thermal.on.value;
      (scene.background as THREE.Color).copy(backdrop).lerp(backdropThermal, th);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      const lit = 1 - 0.72 * th;
      hemi.intensity = 0.78 * lit;
      key.intensity = 1.75 * lit;
      warm.intensity = 3.2 * lit;
      scene.environmentIntensity = 0.55 * lit;

      sectionOn = view.cutaway;
      hot.clip.set(sectionOn);
      cold.clip.set(sectionOn);
      caps.update(sectionOn, registry);
      followers.update(registry);

      // the bore shows the gas of the model's segment
      for (const sl of [hot, cold]) {
        const a = Math.max(0, Math.min(s.benchSegments - 1, Math.round(sl.seg)));
        const T = s.ductGasT[a] ?? 25;
        // the wall of the bore keeps dark: only the hottest gas of a burn tints it, at the far end of the eye's reach
        gasColor(T, glowCol);
        sl.bore.emissive.copy(glowCol);
        sl.bore.emissiveIntensity = Math.min(0.03, Math.max(0, (T - 60) / 4000));
      }

      // the probe's needle reads the earth at its tip, 15 to 65 °C over its 270°
      const tip = sliceT(s, Math.round(hot.seg), D * 0.74, hot.axis + 0.04);
      const wantDial = -2.356 + 4.712 * Math.min(1, Math.max(0, (tip - 15) / 50));
      dialAngle += (wantDial - dialAngle) * Math.min(1, dt * 4);
      dial.needle.rotation.z = -dialAngle;

      gas.update(s, dt, view.slowMo, view.schematic || sectionOn);
    },
  };
  return mod;
}
