import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '@onigam/lab-kit/three';
import { TAU, boxAt, joined, lathe, plate, roundedRect, stick, uvMetric, v3 } from '../common';
import { BENCH, CORE, DUCT, MANIFOLD } from '../dims';
import { glowOf } from '../fire/flame';
import type { Rect } from '../section';
import { heatUvByHeight } from '../thermal';
import { fbm } from '../textures';
import type { MachineMaterials } from './materials';

// The core, one function, in its own frame (riser's axis at x = z = 0, y = 0 on the slab): the very pieces `fire-core` shows as parts and `living-room` shows inside its drum and its casing. Each piece is a group at the
// origin of that frame, so the world moves the whole by one translation and its explode by the piece. The section lies in three planes: `core` through the riser's axis, `step` where it steps back past the drum's ring, `bench` on
// the duct's axis. The sizes come from `CORE` and `MANIFOLD` only.

export const CORE_PIECES = [
  'firebrick-base',
  'burn-tunnel',
  'feed-tube',
  'feed-lid',
  'fuel-sticks',
  'ash-bed',
  'heat-riser',
  'riser-insulation',
  'riser-sleeve',
  'core-casing',
  'top-gap',
  'downdraft-annulus',
  'drum-seal',
  'drum-plinth',
  'steel-drum',
  'manifold',
  'manifold-cleanout',
] as const;
export type CorePiece = (typeof CORE_PIECES)[number];

/** Rectangles of a section: `core` and `bench` in (x, y), `step` in (z, y), all in the core's frame. */
export interface CoreCap {
  id: CorePiece;
  plane: 'core' | 'step' | 'bench';
  rects: Rect[];
  material: keyof MachineMaterials;
}

export interface CoreBuild {
  roots: Record<CorePiece, THREE.Group>;
  caps: CoreCap[];
  /** The sticks that stand on the viewer's side of the section: hidden while it is on. */
  sticksFront: THREE.InstancedMesh;
  sticksBack: THREE.InstancedMesh;
  lid: THREE.Group;
  embers: THREE.Mesh;
  /** Where the feet of the sticks are, in the core's frame. */
  fireSeat: THREE.Vector3;
  drive: (d: CoreDrive) => void;
  /** Where a stick's foot stands, per stick (tests). */
  stickFeet: THREE.Vector3[];
  /** Share of the mouth the lid covers as drawn (tests). */
  lidCover: () => number;
}

export interface CoreDrive {
  feedLevel: number;
  emberGlow: number;
  ash: number;
  /** Share of the feed's mouth the lid covers, 0 to 1. */
  cover: number;
  linerT: number;
  /** Temperatures of the gases in the gap and in the fall. */
  gapT: number;
  fallT: number;
  riserT: number;
  chamberT: number;
  burning: boolean;
}

const R = CORE.drumR;
const W = CORE.drumWallDrawn;
const noiseAt = (x: number, y: number) => fbm(x * 9 + 3.1, y * 9 - 1.7, 3) - 0.5;

/** Earth by hand: a little unevenness on the casing, so that it is no extruded plate. */
function hand(g: THREE.BufferGeometry, amount: number): THREE.BufferGeometry {
  const raw = g.index ? g.toNonIndexed() : g;
  raw.deleteAttribute('uv');
  raw.deleteAttribute('normal');
  const m = mergeVertices(raw, 1e-3);
  const p = m.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    if (y < 0.02) continue;
    const n = noiseAt(x + y, z - y);
    p.setXYZ(i, x + n * amount, y + n * amount * 0.5, z + noiseAt(z, x) * amount);
  }
  m.computeVertexNormals();
  return uvMetric(m);
}

/** Part of a turn that a ring around the riser covers: around Y from +Z towards +X. It leaves out the tunnel on −x and the mouth of the manifold on −z. */
const notchPhi = (r: number): number => Math.asin(Math.min(1, CORE.notchHalf / r));
function arcs(r: number): [number, number][] {
  const n = notchPhi(r);
  const open = 30 * (Math.PI / 180);
  // from just past the tunnel (−x is 3π/2) round +z, +x, to the mouth (−z is π)
  const a0 = (3 * Math.PI) / 2 + n;
  return [
    [a0, TAU - a0 + Math.PI - open],
    [Math.PI + open, (3 * Math.PI) / 2 - n - Math.PI - open],
  ];
}

/** A closed ring between two radii and heights, on the arcs that clear the tunnel. */
function ringArcs(rIn: number, rOut: number, y0: number, y1: number, seg = 40): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const [start, len] of arcs(rOut)) {
    parts.push(
      lathe(
        [
          [rOut, y0],
          [rOut, y1],
          [rIn, y1],
          [rIn, y0],
          [rOut, y0],
        ],
        seg,
        start,
        len,
      ),
    );
  }
  return joined(parts);
}

export function buildCore(mats: MachineMaterials): CoreBuild {
  const roots = {} as Record<CorePiece, THREE.Group>;
  for (const id of CORE_PIECES) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
  }
  const put = (id: CorePiece, geo: THREE.BufferGeometry, mat: THREE.Material, name?: string): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    if (name) m.name = name;
    roots[id].add(m);
    return m;
  };

  const c = CORE;
  const brickOuter = c.feedFar - c.brick;
  const nearOuter = c.feedNear + c.brick;
  const endX0 = c.boreR;
  const endX1 = c.chamberIn;

  // ---- the firebrick base: the floor the fire sits on, the block behind the feed, the block at the tunnel's end, the inner wall of the chamber
  put(
    'firebrick-base',
    joined([
      boxAt(brickOuter, 0, -c.brickZ, endX1, c.tunnelFloor, c.brickZ),
      boxAt(brickOuter, c.tunnelFloor, -c.feedSide / 2, c.feedFar, c.tunnelRoof, c.feedSide / 2),
      boxAt(endX0, c.tunnelFloor, -c.feedSide / 2, endX1, c.tunnelRoof, c.feedSide / 2),
      ringArcs(c.chamberIn - 0.012, c.chamberIn, c.chamberFloor, c.lidTop),
    ]),
    mats.brick,
  );

  // ---- the tunnel: its two side walls and its roof, with the hole of the riser
  const roofShape = roundedRect(c.feedNear, -c.lidZ, endX1, c.lidZ, 0.002);
  const hole = new THREE.Path();
  hole.absarc(0, 0, c.boreR, 0, TAU, true);
  roofShape.holes.push(hole);
  put(
    'burn-tunnel',
    joined([
      boxAt(brickOuter, c.tunnelFloor, c.feedSide / 2, endX1, c.tunnelRoof, c.brickZ),
      boxAt(brickOuter, c.tunnelFloor, -c.brickZ, endX1, c.tunnelRoof, -c.feedSide / 2),
      plate(roofShape, c.tunnelRoof, c.lidTop, 32),
    ]),
    mats.brick,
  );

  // ---- the feed: four walls of brick up to the mouth, a steel rim
  const fz = c.feedSide / 2;
  put(
    'feed-tube',
    joined([
      boxAt(brickOuter, c.tunnelRoof, -c.brickZ, c.feedFar, c.feedTop, c.brickZ),
      boxAt(c.feedNear, c.tunnelRoof, -c.brickZ, nearOuter, c.feedTop, c.brickZ),
      boxAt(c.feedFar, c.tunnelRoof, fz, c.feedNear, c.feedTop, c.brickZ),
      boxAt(c.feedFar, c.tunnelRoof, -c.brickZ, c.feedNear, c.feedTop, -fz),
    ]),
    mats.brick,
  );
  const rimOut = c.rimOut;
  put(
    'feed-tube',
    joined([
      boxAt(brickOuter - rimOut, c.feedTop, -c.brickZ - rimOut, c.feedFar, c.feedTop + c.rimH, c.brickZ + rimOut),
      boxAt(c.feedNear, c.feedTop, -c.brickZ - rimOut, nearOuter + rimOut, c.feedTop + c.rimH, c.brickZ + rimOut),
      boxAt(c.feedFar, c.feedTop, fz, c.feedNear, c.feedTop + c.rimH, c.brickZ + rimOut),
      boxAt(c.feedFar, c.feedTop, -c.brickZ - rimOut, c.feedNear, c.feedTop + c.rimH, -fz),
    ]),
    mats.steelDark,
    'feed-rim',
  );

  // ---- the lid: a steel plate and a handle, which slides on the rim: `cover` of the mouth under it
  const lid = new THREE.Group();
  lid.name = 'lid';
  roots['feed-lid'].add(lid);
  const lidPlate = new THREE.Mesh(
    joined([
      boxAt(-c.lidW / 2, 0, -c.lidD / 2, c.lidW / 2, c.lidT, c.lidD / 2),
      stick(v3(-0.05, c.lidT, 0), v3(-0.05, c.lidT + 0.03, 0), 0.005, 8),
      stick(v3(0.05, c.lidT, 0), v3(0.05, c.lidT + 0.03, 0), 0.005, 8),
      stick(v3(-0.05, c.lidT + 0.03, 0), v3(0.05, c.lidT + 0.03, 0), 0.006, 8),
    ]),
    mats.steelDark,
  );
  lidPlate.castShadow = true;
  lidPlate.receiveShadow = true;
  lid.add(lidPlate);
  lid.userData.dynamic = true;

  // ---- the sticks: upright in the feed, their feet on the tunnel's floor. Their last slot is lit first by the fire
  const r = rng(41);
  const stickGeo = (() => {
    const g = new THREE.CylinderGeometry(0.82, 1, 1, 9, 6);
    g.translate(0, 0.5, 0);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      // the bark's lumps
      const a = Math.atan2(p.getZ(i), p.getX(i));
      const k = 1 + 0.12 * Math.sin(a * 3 + y * 7) + 0.07 * Math.sin(a * 5 - y * 11);
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
  })();
  const stickMat = mats.bark;
  charPatch(stickMat);
  const slots: { x: number; z: number; tx: number; tz: number; l: number; order: number }[] = [];
  // they stand in the slot the lid leaves on the feed's far side, as the frames of real builds show it: two rows, their tops leaning on the far wall
  const nx = 2;
  const nz = 4;
  const slotW = c.feedSide * (1 - c.slotCover);
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const x = c.feedFar + ((i + 0.5) * slotW) / nx + (r() - 0.5) * 0.004;
      const z = ((j - (nz - 1) / 2) * c.feedSide * 0.9) / nz + (r() - 0.5) * 0.006;
      slots.push({
        x,
        z,
        tx: -0.016 + (r() - 0.5) * 0.012,
        tz: (j - 1.5) * 0.014 + (r() - 0.5) * 0.014,
        l: c.stickL * (0.82 + 0.3 * r()),
        order: r(),
      });
    }
  slots.sort((a, b) => a.order - b.order);
  const back = slots.filter((s) => s.z <= 0.001);
  const front = slots.filter((s) => s.z > 0.001);
  const sticksBack = new THREE.InstancedMesh(stickGeo, stickMat, back.length);
  const sticksFront = new THREE.InstancedMesh(stickGeo, stickMat, Math.max(1, front.length));
  sticksBack.name = 'sticks-back';
  sticksFront.name = 'sticks-front';
  for (const m of [sticksBack, sticksFront]) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    m.userData.dynamic = true;
    roots['fuel-sticks'].add(m);
  }
  const footY = c.tunnelFloor + c.ashH * 0.45;
  const stickFeet = [...back, ...front].map((s) => v3(s.x, footY, s.z));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const placeSticks = (level: number) => {
    const n = slots.length;
    // how many stand, and how far they have burned: they slide down as their feet burn, so they keep their feet on the floor and lose their tops
    const write = (mesh: THREE.InstancedMesh, list: typeof slots) => {
      list.forEach((s, i) => {
        const rank = slots.indexOf(s) / n;
        const on = level > rank * 0.92 + 0.02;
        const left = on ? 0.55 + 0.45 * Math.min(1, level * 1.2) : 0.0001;
        e.set(s.tz * 0.7, 0, -s.tx * 0.7);
        q.setFromEuler(e);
        m4.compose(v3(s.x, footY, s.z), q, v3(c.stickR, on ? s.l * left : 0.0001, c.stickR));
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    };
    write(sticksBack, back);
    write(sticksFront, front);
  };

  // ---- the bed of ash and its embers, on the tunnel's floor
  const ashShape = (() => {
    const nu = 26;
    const nv = 10;
    const x0 = c.feedFar + 0.004;
    const x1 = c.feedNear + 0.2;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const z = (v - 0.5) * (c.feedSide - 0.006);
      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const x = x0 + u * (x1 - x0);
        const edge = Math.sin(Math.PI * v) ** 0.6 * Math.min(1, (1 - u) * 3) * Math.min(1, u * 8);
        const n = 0.7 + 0.6 * fbm(u * 6 + 2, v * 5, 3);
        pos.push(x, c.tunnelFloor + 0.0005 + c.ashH * edge * n, z);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i;
        idx.push(a, a + nu + 1, a + 1, a + 1, a + nu + 1, a + nu + 2);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return uvMetric(g);
  })();
  const ashMesh = put('ash-bed', ashShape, mats.ash, 'ash');
  ashMesh.userData.dynamic = true;
  const emberParts: THREE.BufferGeometry[] = [];
  const re = rng(7);
  for (let i = 0; i < 16; i++) {
    const g = new THREE.IcosahedronGeometry(0.008 + 0.012 * re(), 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const f = 0.75 + 0.5 * fbm(p.getX(k) * 90 + i, p.getY(k) * 90 + p.getZ(k) * 60, 2);
      p.setXYZ(k, p.getX(k) * f, p.getY(k) * f * 0.7, p.getZ(k) * f);
    }
    g.translate(c.feedAxis + (re() - 0.3) * 0.17, c.tunnelFloor + 0.012 + re() * 0.012, (re() - 0.5) * 0.14);
    emberParts.push(g);
  }
  const emberGeo = joined(emberParts);
  emberGeo.computeVertexNormals();
  const embers = put('ash-bed', emberGeo, mats.ember, 'embers');
  embers.userData.dynamic = true;

  // ---- the riser, its insulation, its sleeve
  const linerR1 = c.boreR + c.linerT;
  const sleeveIn = c.sleeveR - c.sleeveWallDrawn;
  put(
    'heat-riser',
    lathe(
      [
        [linerR1, c.riserFoot],
        [linerR1, c.riserTop],
        [c.boreR, c.riserTop],
        [c.boreR, c.riserFoot],
        [linerR1, c.riserFoot],
      ],
      48,
    ),
    mats.liner,
    'liner',
  );
  put(
    'riser-insulation',
    uvMetric(
      lathe(
        [
          [sleeveIn, c.riserFoot],
          [sleeveIn, c.riserTop - 0.004],
          [linerR1, c.riserTop - 0.004],
          [linerR1, c.riserFoot],
          [sleeveIn, c.riserFoot],
        ],
        48,
      ),
    ),
    mats.insulation,
  );
  put(
    'riser-sleeve',
    uvMetric(
      lathe(
        [
          [c.sleeveR, c.riserFoot],
          [c.sleeveR, c.riserTop],
          [linerR1, c.riserTop],
          [linerR1, c.riserTop - 0.004],
          [sleeveIn, c.riserTop - 0.004],
          [sleeveIn, c.riserFoot],
          [c.sleeveR, c.riserFoot],
        ],
        48,
      ),
    ),
    mats.sleeve,
  );

  // ---- the casing of earth: rounded in plan and at its top edge, with its holes for the feed and the drum
  const bevel = 0.045;
  const shape = roundedRect(c.casingX0, c.casingZ0, c.casingX1, c.casingZ1, c.casingR);
  const hFeed = new THREE.Path([
    new THREE.Vector2(brickOuter, -c.brickZ),
    new THREE.Vector2(brickOuter, c.brickZ),
    new THREE.Vector2(nearOuter, c.brickZ),
    new THREE.Vector2(nearOuter, -c.brickZ),
  ]);
  shape.holes.push(hFeed);
  const hDrum = new THREE.Path();
  hDrum.absarc(0, 0, R + 0.002, 0, TAU, true);
  shape.holes.push(hDrum);
  const casing = new THREE.ExtrudeGeometry(shape, {
    depth: c.casingTop - bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 4,
    curveSegments: 30,
  });
  casing.rotateX(Math.PI / 2);
  casing.translate(0, c.casingTop - bevel, 0);
  // its foot flat on the slab: what the bevel took below it is folded back up, so the wall meets the floor square
  {
    const p = casing.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, 0);
  }
  put('core-casing', hand(casing, 0.006), mats.earthSkin, 'casing');

  // ---- the ring the drum stands on, and the chamber's floor
  put(
    'drum-plinth',
    joined([
      ringArcs(c.plinthIn, c.plinthOut, c.chamberFloor, c.drumFoot),
      ringArcs(c.chamberIn, c.plinthOut, 0, c.chamberFloor),
    ]),
    mats.brick,
  );

  // ---- the drum: upside down, its lid on top, its foot notched over the tunnel
  const profile: [number, number][] = [[R, c.lidTop]];
  const y0 = c.drumFoot;
  for (const h of c.hoops) {
    const y = y0 + h * c.drumHeight;
    profile.push(
      [R, y - c.hoopH],
      [R + c.hoopOut * 0.7, y - c.hoopH * 0.5],
      [R + c.hoopOut, y],
      [R + c.hoopOut * 0.7, y + c.hoopH * 0.5],
      [R, y + c.hoopH],
    );
  }
  profile.push([R, c.drumTop - 0.018]);
  const drumParts: THREE.BufferGeometry[] = [
    lathe(profile, 72),
    // the lower wall, round the notch
    lathe(
      [
        [R, c.drumFoot],
        [R, c.lidTop],
      ],
      60,
      (3 * Math.PI) / 2 + notchPhi(R),
      TAU - 2 * notchPhi(R),
    ),
    // the lid, a little dished, and the clamping ring around its rim
    lathe(
      [
        [0, c.drumTop - 0.005],
        [R - 0.03, c.drumTop - 0.005],
        [R - 0.018, c.drumTop],
        [R + 0.002, c.drumTop + 0.002],
        [R + 0.01, c.drumTop - 0.006],
        [R + 0.01, c.drumTop - 0.024],
        [R, c.drumTop - 0.03],
      ],
      72,
    ),
    // the ring's lever
    boxAt(R + 0.008, c.drumTop - 0.026, -0.03, R + 0.024, c.drumTop - 0.004, 0.03),
    stick(v3(R + 0.024, c.drumTop - 0.015, -0.022), v3(R + 0.03, c.drumTop - 0.015, 0.09), 0.005, 8),
  ];
  const drumOuter = new THREE.Mesh(heatUvByHeight(uvDrum(joined(drumParts)), c.drumFoot, c.drumTop), mats.drum);
  drumOuter.name = 'drum';
  drumOuter.castShadow = true;
  drumOuter.receiveShadow = true;
  roots['steel-drum'].add(drumOuter);
  const inner = lathe(
    [
      [R - W, c.lidTop],
      [R - W, c.drumTop - 0.008],
      [0, c.drumTop - 0.008],
    ],
    60,
  );
  const innerLow = lathe(
    [
      [R - W, c.drumFoot],
      [R - W, c.lidTop],
    ],
    48,
    (3 * Math.PI) / 2 + notchPhi(R),
    TAU - 2 * notchPhi(R),
  );
  put('steel-drum', joined([inner, innerLow]), mats.drumInside, 'drum-inside');

  // ---- the lid's gasket, a stove-door rope in the rim
  const seal = new THREE.TorusGeometry(R - 0.007, 0.0075, 10, 80);
  seal.rotateX(Math.PI / 2);
  seal.translate(0, c.drumTop - 0.012, 0);
  put('drum-seal', seal, mats.gasket, 'gasket');

  // ---- the gases as volumes: what turns under the lid, what falls around the sleeve
  const gapG = lathe(
    [
      [0, c.riserTop],
      [R - W - 0.001, c.riserTop],
      [R - W - 0.001, c.drumTop - 0.009],
      [0, c.drumTop - 0.009],
    ],
    48,
  );
  put('top-gap', gapG, mats.gasGap, 'gas-gap').castShadow = false;
  const fallG = lathe(
    [
      [c.sleeveR + 0.002, c.lidTop + 0.002],
      [R - W - 0.002, c.lidTop + 0.002],
      [R - W - 0.002, c.riserTop],
      [c.sleeveR + 0.002, c.riserTop],
      [c.sleeveR + 0.002, c.lidTop + 0.002],
    ],
    48,
  );
  put('downdraft-annulus', fallG, mats.gasFall, 'gas-fall').castShadow = false;

  // ---- the manifold: a steel box behind the drum, a lip into the chamber, a round mouth on the duct's axis
  const mf = MANIFOLD;
  put(
    'manifold',
    joined([
      boxAt(mf.x0, mf.y0, mf.z0, mf.x1, mf.y1, mf.z1),
      boxAt(-0.16, mf.y0, mf.z1, 0.16, c.drumFoot - 0.006, mf.lipZ),
    ]),
    mats.steel,
    'box',
  );
  // ---- the cleanout through the casing's top: a collar from the box up, a gas-tight round door, two dogs
  const hx = mf.hatchX;
  const hz = (mf.z0 + mf.z1) / 2;
  const hr = mf.hatchR;
  const hatch = [
    new THREE.CylinderGeometry(hr, hr, c.casingTop + 0.012 - mf.y1, 32).translate(
      hx,
      (c.casingTop + 0.012 + mf.y1) / 2,
      hz,
    ),
    new THREE.CylinderGeometry(hr + 0.012, hr + 0.012, 0.012, 36).translate(hx, c.casingTop + 0.012, hz),
    boxAt(hx - hr - 0.022, c.casingTop + 0.012, hz - 0.012, hx - hr + 0.02, c.casingTop + 0.026, hz + 0.012),
    boxAt(hx + hr - 0.02, c.casingTop + 0.012, hz - 0.012, hx + hr + 0.022, c.casingTop + 0.026, hz + 0.012),
    stick(v3(hx - 0.04, c.casingTop + 0.018, hz), v3(hx - 0.04, c.casingTop + 0.042, hz), 0.005, 8),
    stick(v3(hx + 0.04, c.casingTop + 0.018, hz), v3(hx + 0.04, c.casingTop + 0.042, hz), 0.005, 8),
    stick(v3(hx - 0.04, c.casingTop + 0.042, hz), v3(hx + 0.04, c.casingTop + 0.042, hz), 0.006, 8),
  ];
  put('manifold-cleanout', joined(hatch), mats.steelDark);

  // ---- the section. Plane `core`, in (x, y), through the riser's axis
  const caps: CoreCap[] = [];
  const add = (id: CorePiece, plane: CoreCap['plane'], material: keyof MachineMaterials, rects: Rect[]) =>
    caps.push({ id, plane, rects, material });
  const top = c.casingTop;
  add('core-casing', 'core', 'cobCut', [
    [c.casingX0, 0, brickOuter, top],
    [nearOuter, c.lidTop, -R, top],
    [R, c.drumFoot, c.stepX, top],
    [c.plinthOut, 0, c.stepX, c.drumFoot],
  ]);
  add('firebrick-base', 'core', 'brickCut', [
    [brickOuter, 0, endX1, c.tunnelFloor],
    [brickOuter, c.tunnelFloor, c.feedFar, c.tunnelRoof],
    [endX0, c.tunnelFloor, endX1, c.tunnelRoof],
    [c.chamberIn - 0.012, c.tunnelFloor, c.chamberIn, c.lidTop],
  ]);
  add('burn-tunnel', 'core', 'brickCut', [
    [c.feedNear, c.tunnelRoof, -c.boreR, c.lidTop],
    [c.boreR, c.tunnelRoof, c.chamberIn - 0.012, c.lidTop],
  ]);
  add('feed-tube', 'core', 'brickCut', [
    [brickOuter, c.tunnelRoof, c.feedFar, c.feedTop],
    [c.feedNear, c.lidTop, nearOuter, c.feedTop],
  ]);
  add('heat-riser', 'core', 'linerCut', [
    [-linerR1, c.riserFoot, -c.boreR, c.riserTop],
    [c.boreR, c.riserFoot, linerR1, c.riserTop],
  ]);
  add('riser-insulation', 'core', 'insulation', [
    [-sleeveIn, c.riserFoot, -linerR1, c.riserTop - 0.004],
    [linerR1, c.riserFoot, sleeveIn, c.riserTop - 0.004],
  ]);
  add('riser-sleeve', 'core', 'sleeve', [
    [-c.sleeveR, c.riserFoot, -sleeveIn, c.riserTop],
    [sleeveIn, c.riserFoot, c.sleeveR, c.riserTop],
    [-c.sleeveR, c.riserTop - 0.004, -linerR1, c.riserTop],
    [linerR1, c.riserTop - 0.004, c.sleeveR, c.riserTop],
  ]);
  add('drum-plinth', 'core', 'brickCut', [
    [c.plinthIn, c.chamberFloor, c.plinthOut, c.drumFoot],
    [c.chamberIn, 0, c.plinthOut, c.chamberFloor],
  ]);
  add('steel-drum', 'core', 'drum', [
    [-R, c.lidTop, -R + W, c.drumTop - 0.003],
    [R - W, c.drumFoot, R, c.drumTop - 0.003],
    [-R, c.drumTop - W - 0.003, R, c.drumTop - 0.003],
  ]);
  add('top-gap', 'core', 'gasGapCut', [[-R + W, c.riserTop, R - W, c.drumTop - W - 0.003]]);
  add('downdraft-annulus', 'core', 'gasFallCut', [
    [-R + W, c.lidTop + 0.001, -c.sleeveR, c.riserTop],
    [c.sleeveR, c.lidTop + 0.001, R - W, c.riserTop],
    [c.chamberIn, c.chamberFloor, c.plinthIn, c.lidTop + 0.001],
  ]);

  // ---- plane `step`, in (z, y), where the section steps back from the core's plane to the duct's
  const zb = BENCH.ductZ - c.z;
  add('core-casing', 'step', 'cobCut', [
    [mf.z1, 0, 0, top],
    [zb, 0, mf.z1, mf.y0],
    [zb, mf.y1, mf.z1, top],
  ]);
  add('manifold', 'step', 'steel', [
    [zb, mf.y1 - mf.wall, mf.z1, mf.y1],
    [zb, mf.y0, mf.z1, mf.y0 + mf.wall],
    [mf.z1 - mf.wall, mf.y0, mf.z1, mf.y1],
  ]);
  // ---- plane `bench`, in (x, y), on the duct's axis, from the step to the bench's first section
  const dTop = DUCT.axisHot + DUCT.r;
  const dBot = DUCT.axisHot - DUCT.r;
  add('core-casing', 'bench', 'cobCut', [
    [c.stepX, 0, c.casingX1, mf.y0],
    [mf.x1, mf.y0, c.casingX1, dBot],
    [mf.x1, dTop, c.casingX1, mf.y1],
    [c.stepX, mf.y1, c.casingX1, top],
  ]);
  add('manifold', 'bench', 'steel', [
    [c.stepX, mf.y1 - mf.wall, mf.x1, mf.y1],
    [c.stepX, mf.y0, mf.x1, mf.y0 + mf.wall],
    [mf.x1 - mf.wall, mf.y0, mf.x1, dBot],
    [mf.x1 - mf.wall, dTop, mf.x1, mf.y1],
  ]);

  placeSticks(1);
  lid.position.set(c.feedAxis, c.feedTop + c.rimH, 0);
  const color = new THREE.Color();
  let drawnCover = 1;
  const drive = (d: CoreDrive) => {
    placeSticks(d.feedLevel);
    // the lid slides on the rim from the drum's side, and stops at the sticks while there are any: the model's `feedCover` counts them in what hides the mouth
    const asked = Math.min(1, Math.max(0, d.cover));
    const cover = d.feedLevel > 0.01 ? Math.min(asked, c.slotCover) : asked;
    drawnCover = cover;
    lid.position.x = c.feedNear + c.lidW / 2 - c.feedSide * cover;
    // the bed grows with the wood the model has burned: 7 oz in 57 lb, so slowly; cleaned, it starts again
    const k = 0.55 + 0.45 * Math.min(1, d.ash / 0.7);
    ashMesh.scale.y = k;
    ashMesh.position.y = c.tunnelFloor * (1 - k);
    mats.ember.emissiveIntensity = 0.1 + 3.4 * d.emberGlow ** 1.2;
    mats.ember.color.setRGB(0.08 + 0.1 * d.emberGlow, 0.05, 0.04);
    embers.visible = d.emberGlow > 0.01 || d.burning;
    CHAR.glow.value = d.burning ? 0.6 + 2.2 * Math.max(d.emberGlow, d.feedLevel * 0.6) : 0;
    const liner = glowOf(d.linerT, color);
    mats.liner.emissive.copy(color);
    mats.liner.emissiveIntensity = liner;
    mats.linerCut.emissive.copy(color);
    mats.linerCut.emissiveIntensity = liner;
    const gas = (ms: THREE.MeshStandardMaterial[], T: number, base: number) => {
      const x = Math.min(1, Math.max(0, (T - 60) / 760));
      for (const m of ms) {
        m.opacity = base * (0.1 + 0.9 * x);
        m.emissiveIntensity = 0.1 + 1.3 * x;
      }
    };
    gas([mats.gasGap, mats.gasGapCut], d.gapT, 0.34);
    gas([mats.gasFall, mats.gasFallCut], d.fallT, 0.26);
    gas([mats.gasRiserCut], d.riserT, 0.32);
    gas([mats.gasTunnelCut], d.chamberT, 0.07);
  };
  return {
    roots,
    caps,
    sticksBack,
    sticksFront,
    lid,
    embers,
    fireSeat: v3(c.feedAxis, footY, 0),
    drive,
    stickFeet,
    lidCover: () => drawnCover,
  };
}

/** The drum's paint in metres round and up, so its mottling keeps its size. */
function uvDrum(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    uv.setXY(i, a * R, p.getY(i));
  }
  return g;
}

/** The sticks burn at their feet: char from the foot up, and an ember's glow where they touch the fire. The strength is a uniform of the world. */
export const CHAR = { glow: { value: 0 } };
function charPatch(mat: THREE.MeshStandardMaterial): void {
  if (mat.userData.char) return;
  mat.userData.char = true;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uEmber = CHAR.glow;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vStickY;\nvarying vec3 vStickP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvStickY = position.y;\nvStickP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vStickY;\nvarying vec3 vStickP;\nuniform float uEmber;',
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          float n = sin( vStickP.x * 3.0 + vStickY * 13.0 ) * 0.5 + sin( vStickP.z * 3.0 + vStickY * 19.0 ) * 0.5;
          float charred = 1.0 - smoothstep( 0.2, 0.4, vStickY + n * 0.02 );
          diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.035, 0.03, 0.028 ), charred );
          // the sawn top of a stick shows its pale wood
          diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.66, 0.5, 0.31 ), smoothstep( 0.9995, 1.0, vStickY ) );
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
        {
          float foot = 1.0 - smoothstep( 0.03, 0.15, vStickY );
          totalEmissiveRadiance += vec3( 1.0, 0.27, 0.04 ) * foot * uEmber * 0.7;
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'stick-char';
}
