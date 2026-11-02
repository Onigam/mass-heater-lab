import * as THREE from 'three';
import { boxAt, joined, plate, polyShape, stick, uvMetric, v3 } from '../common';
import { patch } from '../detail';
import { BENCH, CORE, FLUE, HOUSE, MACHINE, ROOM } from '../dims';
import { boardsMap, concreteMap, masonryMap, oakMap, plasterMap, renderMap, tiled } from '../textures';

// The room as a set: floor, slab, the plastered back and gable walls with their deep windows, the stone wall, the beam, the front wall and the ceiling. A wall is drawn only while the camera is on its room's side: orbit anywhere and the
// walls between the eye and the room step aside by themselves, with no tool and no change of material. Their tops show what a section of them shows: plaster, insulation, render.

export interface RoomMaterials {
  plaster: THREE.MeshStandardMaterial;
  plasterFront: THREE.MeshStandardMaterial;
  plasterGable: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  gable: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  oak: THREE.MeshStandardMaterial;
  beam: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  slab: THREE.MeshStandardMaterial;
  insul: THREE.MeshStandardMaterial;
  footing: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  render: THREE.MeshStandardMaterial;
}

export function roomMaterials(): RoomMaterials {
  const plaster = plasterMap();
  const wood = boardsMap();
  const m = (o: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => {
    const s = new THREE.MeshStandardMaterial(o);
    s.userData.noShare = true;
    return s;
  };
  const stone = masonryMap();
  const oak = oakMap();
  const conc = concreteMap();
  return {
    plaster: m({ color: 0xece4d4, map: tiled(plaster, 1 / 1.6), roughness: 0.93 }),
    plasterFront: m({ color: 0xece4d4, map: tiled(plaster, 1 / 1.6), roughness: 0.93 }),
    plasterGable: m({ color: 0xece4d4, map: tiled(plaster, 1 / 1.6), roughness: 0.93 }),
    ceiling: m({ color: 0xb78a5c, map: tiled(wood, 1 / 1.2), roughness: 0.85 }),
    gable: m({ color: 0x8c6a48, map: tiled(wood, 1 / 1.2), roughness: 0.88 }),
    stone: m({
      color: 0xffffff,
      map: tiled(stone, 1 / 1.75),
      bumpMap: tiled(stone, 1 / 1.75),
      bumpScale: 0.8,
      roughness: 0.96,
    }),
    oak: m({ color: 0xffffff, map: tiled(oak, 1 / 1.28), roughness: 0.62, metalness: 0 }),
    beam: m({ color: 0x6a4a30, map: tiled(wood, 1 / 0.8), roughness: 0.82 }),
    frame: m({ color: 0xcdb48c, map: tiled(wood, 1 / 0.5), roughness: 0.7 }),
    glass: m({ color: 0x9fb4c4, roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.2, depthWrite: false }),
    slab: m({ color: 0xbfb9ac, map: tiled(conc, 1 / 1.3), roughness: 0.9 }),
    insul: m({ color: 0xcdb483, map: tiled(renderMap(), 1 / 0.6), roughness: 1 }),
    footing: m({ color: 0x8f8a80, map: tiled(conc, 1 / 1.2), roughness: 0.96 }),
    door: m({ color: 0x7c5532, map: tiled(wood, 1 / 0.9), roughness: 0.74 }),
    render: m({ color: 0xc9c3b4, map: tiled(renderMap(), 1 / 1.2), roughness: 0.96 }),
  };
}

/** A material that shows only from the room's side of a plane. One program for all the walls: the plane is a uniform. */
export function roomSide<T extends THREE.Material>(
  mat: T,
  at: [number, number, number],
  inward: [number, number, number],
): T {
  if (mat.userData.roomSide) return mat;
  mat.userData.roomSide = true;
  const uAt = { value: new THREE.Vector3(...at) };
  const uIn = { value: new THREE.Vector3(...inward) };
  patch(mat, 'room-side', (shader) => {
    shader.uniforms.uRoomAt = uAt;
    shader.uniforms.uRoomIn = uIn;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRoomAt;\nuniform vec3 uRoomIn;')
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
      if ( dot( cameraPosition - uRoomAt, uRoomIn ) < 0.0 ) discard;`,
      );
  });
  return mat;
}

/** A click passes through a wall that does not show: its meshes ask the camera first. */
export function roomSideRaycast(
  root: THREE.Object3D,
  at: [number, number, number],
  inward: [number, number, number],
): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.raycast = function raycast(rc, hits) {
      const cam = (rc.camera as THREE.Camera | undefined)?.position ?? rc.ray.origin;
      const d = (cam.x - at[0]) * inward[0] + (cam.y - at[1]) * inward[1] + (cam.z - at[2]) * inward[2];
      if (d >= 0) THREE.Mesh.prototype.raycast.call(m, rc, hits);
    };
  });
}

export interface Hole {
  u0: number;
  u1: number;
  y0: number;
  y1: number;
}

/**
 * A wall as a plate with holes: `u` runs along it, from (x0, z0) to (x1, z1); it is `t` thick towards `out` (unit plan vector). The shape's outline is [u, y] pairs, the holes rectangles.
 */
export function wallPlate(
  outline: readonly (readonly [number, number])[],
  holes: readonly Hole[],
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  t: number,
  out: [number, number],
): THREE.BufferGeometry {
  const shape = polyShape(
    outline,
    holes.map((h) => [
      [h.u0, h.y0],
      [h.u1, h.y0],
      [h.u1, h.y1],
      [h.u0, h.y1],
    ]),
  );
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 4 });
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ux = (x1 - x0) / len;
  const uz = (z1 - z0) / len;
  const m = new THREE.Matrix4().set(ux, 0, out[0], x0, 0, 1, 0, 0, uz, 0, out[1], z0, 0, 0, 0, 1);
  g.applyMatrix4(m);
  if (m.determinant() < 0) {
    // the plate was mirrored by the frame: turn its faces back
    const idx = g.index;
    const pos = g.attributes.position as THREE.BufferAttribute;
    const nor = g.attributes.normal as THREE.BufferAttribute;
    if (!idx) {
      for (let i = 0; i < pos.count; i += 3) {
        const ax = pos.getX(i + 1);
        const ay = pos.getY(i + 1);
        const az = pos.getZ(i + 1);
        pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
        pos.setXYZ(i + 2, ax, ay, az);
        const nx = nor.getX(i + 1);
        const ny = nor.getY(i + 1);
        const nz = nor.getZ(i + 1);
        nor.setXYZ(i + 1, nor.getX(i + 2), nor.getY(i + 2), nor.getZ(i + 2));
        nor.setXYZ(i + 2, nx, ny, nz);
      }
    }
  }
  g.computeVertexNormals();
  return uvMetric(g);
}

/** A window in a wall: a frame in the middle of the wall's thickness, two casements, panes, a sill inside. In the wall's own (u, y, depth) frame, then placed by `place`. */
function windowParts(
  h: Hole,
  place: (u: number, y: number, d: number) => THREE.Vector3,
  t: number,
  mats: RoomMaterials,
): { frame: THREE.BufferGeometry; glass: THREE.BufferGeometry } {
  const F = 0.05;
  const depth = 0.06;
  const dMid = t * 0.42;
  const frame: THREE.BufferGeometry[] = [];
  const bar = (u0: number, y0: number, u1: number, y1: number, d0: number, d1: number) => {
    const a = place(u0, y0, d0);
    const b = place(u1, y1, d1);
    frame.push(
      boxAt(
        Math.min(a.x, b.x),
        Math.min(a.y, b.y),
        Math.min(a.z, b.z),
        Math.max(a.x, b.x),
        Math.max(a.y, b.y),
        Math.max(a.z, b.z),
      ),
    );
  };
  const um = (h.u0 + h.u1) / 2;
  const d0 = dMid - depth / 2;
  const d1 = dMid + depth / 2;
  bar(h.u0, h.y0, h.u1, h.y0 + F, d0, d1);
  bar(h.u0, h.y1 - F, h.u1, h.y1, d0, d1);
  bar(h.u0, h.y0, h.u0 + F, h.y1, d0, d1);
  bar(h.u1 - F, h.y0, h.u1, h.y1, d0, d1);
  bar(um - F / 2, h.y0, um + F / 2, h.y1, d0, d1);
  // one glazing bar in each casement
  const ym = h.y0 + (h.y1 - h.y0) * 0.62;
  bar(h.u0 + F, ym - 0.012, um - F / 2, ym + 0.012, d0 + 0.012, d1 - 0.012);
  bar(um + F / 2, ym - 0.012, h.u1 - F, ym + 0.012, d0 + 0.012, d1 - 0.012);
  // the inside sill, a wooden board that reaches into the room a little
  bar(h.u0 - 0.03, h.y0 - 0.03, h.u1 + 0.03, h.y0, -0.05, dMid);
  const a = place(h.u0 + F, h.y0 + F, dMid);
  const b = place(h.u1 - F, h.y1 - F, dMid + 0.004);
  const glass = boxAt(
    Math.min(a.x, b.x),
    Math.min(a.y, b.y),
    Math.min(a.z, b.z),
    Math.max(a.x, b.x),
    Math.max(a.y, b.y),
    Math.max(a.z, b.z),
  );
  void mats;
  return { frame: joined(frame), glass };
}

export interface RoomShell {
  /** Everything but the stone wall and the slab, which are parts in `living-room` and scenery elsewhere. */
  group: THREE.Group;
  back: THREE.Group;
  gable: THREE.Group;
  front: THREE.Group;
  ceiling: THREE.Group;
  doorWall: THREE.Group;
  floor: THREE.Group;
  beam: THREE.Group;
  /** The parts. */
  stone: THREE.Group;
  slab: THREE.Group;
  windows: THREE.BufferGeometry[];
  /** The panes of the three walls with windows. */
  panes: THREE.Mesh[];
  /** The windows' holes, for the curtains: wall, (u0, u1, y0, y1). */
  holes: { back: Hole[]; gable: Hole[]; front: Hole[] };
}

const H = ROOM.height;
const T = ROOM.outerWall;
const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = ROOM;

export const BACK_HOLES: Hole[] = [
  { u0: -0.45, u1: 0.65, y0: ROOM.windowSill, y1: ROOM.windowHead },
  { u0: 1.2, u1: 2.3, y0: ROOM.windowSill, y1: ROOM.windowHead },
];
export const GABLE_HOLES: Hole[] = [{ u0: -0.7, u1: 0.7, y0: ROOM.windowSill, y1: ROOM.windowHead }];
export const FRONT_HOLES: Hole[] = [
  { u0: -1.7, u1: -0.4, y0: ROOM.windowSill, y1: ROOM.windowHead },
  { u0: 0.7, u1: 2.0, y0: ROOM.windowSill, y1: ROOM.windowHead },
];
/** The door in the rest of the left wall, beyond the 4 m of stone. */
export const DOOR = { z0: ROOM.z0 + ROOM.stoneWidth + 0.08, z1: ROOM.z1 - 0.08, y1: 2.05 };

/** The slab's outline in plan: under the whole machine, the bench, the core and an apron in front of the feed and the drum. */
export const SLAB_OUTLINE: readonly (readonly [number, number])[] = [
  [X0, Z0],
  [X1, Z0],
  [X1, 2.42],
  [BENCH.ductX - 0.62, 2.42],
  [BENCH.ductX - 0.62, Z0 + BENCH.depth + 0.26],
  [CORE.x + 1.05, Z0 + BENCH.depth + 0.26],
  [CORE.x + 1.05, CORE.z + 1.05],
  [X0, CORE.z + 1.05],
];

export function buildRoomShell(mats: RoomMaterials): RoomShell {
  const group = new THREE.Group();
  group.name = 'room';
  const part = (name: string) => {
    const g = new THREE.Group();
    g.name = name;
    group.add(g);
    return g;
  };
  const back = part('wall-back');
  const gable = part('wall-gable');
  const front = part('wall-front');
  const ceiling = part('ceiling');
  const doorWall = part('wall-door');
  const floor = part('floor');
  const beam = part('beam');
  const add = (g: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, cast = true): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // ---- the floor: boards, insulation, footing, as a section of them shows at the front edge
  const fx0 = X0 - ROOM.stoneT;
  const fx1 = X1 + T;
  const fz0 = Z0 - T;
  const fz1 = Z1 + T;
  add(floor, boxAt(fx0, -0.03, fz0, fx1, -ROOM.floorDrop, fz1), mats.oak, false);
  add(floor, boxAt(fx0, -0.28, fz0, fx1, -0.03, fz1), mats.insul, false);
  add(floor, boxAt(fx0 - 0.02, -ROOM.floorDepth, fz0 - 0.02, fx1 + 0.02, -0.28, fz1 + 0.02), mats.footing, false);

  // ---- the slab: under the whole machine
  const slab = new THREE.Group();
  slab.name = 'hearth-slab';
  add(slab, plate(polyShape(SLAB_OUTLINE), -MACHINE.slab, 0, 4), mats.slab, false);

  // ---- the back wall, plaster, two windows
  const wallOutline = (a: number, b: number): [number, number][] => [
    [a, 0],
    [b, 0],
    [b, H],
    [a, H],
  ];
  // u = x, depth towards −z
  add(back, wallPlate(wallOutline(X0 - ROOM.stoneT, X1 + T), BACK_HOLES, 0, Z0, 1, Z0, T, [0, -1]), mats.plaster);
  // the top shows what the wall is made of
  const wallTop = (g: THREE.Group, x0: number, z0: number, x1: number, z1: number, outX: number, outZ: number) => {
    const layer = (d0: number, d1: number, mat: THREE.Material) =>
      add(
        g,
        boxAt(
          outX ? x0 + outX * d0 : x0,
          H,
          outZ ? z0 + outZ * d0 : z0,
          outX ? x1 + outX * d1 : x1,
          H + 0.006,
          outZ ? z1 + outZ * d1 : z1,
        ),
        mat,
        false,
      );
    layer(0, 0.02, mats.frame);
    layer(0.02, T - 0.03, mats.insul);
    layer(T - 0.03, T, mats.render);
  };
  wallTop(back, X0 - ROOM.stoneT, Z0, X1 + T, Z0, 0, -1);

  // ---- the gable, plaster to the ceiling and boards above it, up to the roof's line; a window
  const roofAt = (z: number) => {
    const ridgeZ = (HOUSE.z0 + HOUSE.z1) / 2;
    const slope = (HOUSE.ridge - HOUSE.eave) / ((HOUSE.z1 - HOUSE.z0) / 2);
    return HOUSE.ridge - Math.abs(z - ridgeZ) * slope;
  };
  const gableZ1 = Z1 + T;
  add(gable, wallPlate(wallOutline(Z0 - T, gableZ1), GABLE_HOLES, X1, 0, X1, 1, T, [1, 0]), mats.plasterGable);
  wallTop(gable, X1, Z0 - T, X1, gableZ1, 1, 0);
  const ridgeZ = (HOUSE.z0 + HOUSE.z1) / 2;
  add(
    gable,
    wallPlate(
      [
        [Z0 - T, H],
        [gableZ1, H],
        [gableZ1, roofAt(gableZ1)],
        [ridgeZ, HOUSE.ridge],
        [Z0 - T, roofAt(Z0 - T)],
      ],
      [],
      X1,
      0,
      X1,
      1,
      T * 0.45,
      [1, 0],
    ),
    mats.gable,
  );

  // ---- the front wall, seen only from behind the room; no shadow: it stands between the key light and the room
  add(
    front,
    wallPlate(wallOutline(X0 - ROOM.stoneT, X1 + T), FRONT_HOLES, 0, Z1, 1, Z1, T, [0, 1]),
    mats.plasterFront,
    false,
  );

  // ---- the door in the rest of the left wall: frame, planks, latch; an earth wall above it
  const dT = ROOM.stoneT;
  add(
    doorWall,
    wallPlate(
      wallOutline(Z0 + ROOM.stoneWidth, Z1 + T),
      [{ u0: DOOR.z0, u1: DOOR.z1, y0: 0, y1: DOOR.y1 }],
      X0,
      0,
      X0,
      1,
      dT,
      [-1, 0],
    ),
    mats.plasterFront,
  );
  add(
    doorWall,
    joined([
      boxAt(X0 - 0.09, 0, DOOR.z0 - 0.06, X0 + 0.015, DOOR.y1 + 0.06, DOOR.z0),
      boxAt(X0 - 0.09, 0, DOOR.z1, X0 + 0.015, DOOR.y1 + 0.06, DOOR.z1 + 0.06),
      boxAt(X0 - 0.09, DOOR.y1, DOOR.z0, X0 + 0.015, DOOR.y1 + 0.06, DOOR.z1),
    ]),
    mats.frame,
  );
  const planks: THREE.BufferGeometry[] = [];
  const nPl = 5;
  for (let i = 0; i < nPl; i++) {
    const a = DOOR.z0 + ((DOOR.z1 - DOOR.z0) * i) / nPl;
    const b = DOOR.z0 + ((DOOR.z1 - DOOR.z0) * (i + 1)) / nPl;
    planks.push(boxAt(X0 - 0.06, 0.004, a + 0.002, X0 - 0.02, DOOR.y1, b - 0.002));
  }
  planks.push(
    boxAt(X0 - 0.02, 0.28, DOOR.z0, X0 - 0.002, 0.42, DOOR.z1),
    boxAt(X0 - 0.02, 1.6, DOOR.z0, X0 - 0.002, 1.74, DOOR.z1),
  );
  add(doorWall, joined(planks), mats.door);
  add(
    doorWall,
    joined([
      stick(v3(X0 + 0.0, 1.02, DOOR.z1 - 0.1), v3(X0 + 0.045, 1.02, DOOR.z1 - 0.1), 0.006, 8),
      stick(v3(X0 + 0.045, 1.02, DOOR.z1 - 0.14), v3(X0 + 0.045, 1.02, DOOR.z1 - 0.07), 0.009, 8),
    ]),
    new THREE.MeshStandardMaterial({ color: 0x30302e, roughness: 0.5, metalness: 0.7 }),
  );

  // ---- the stone wall, 4 m of it
  const stone = new THREE.Group();
  stone.name = 'inner-stone-wall';
  add(stone, boxAt(X0 - ROOM.stoneT, 0, Z0, X0, H, Z0 + ROOM.stoneWidth), mats.stone);
  add(stone, boxAt(X0 - ROOM.stoneT, H, Z0, X0, H + 0.006, Z0 + ROOM.stoneWidth), mats.footing, false);

  // ---- the ceiling, boards, seen only from under it; no shadow: the key light comes down through it
  add(ceiling, boxAt(X0 - ROOM.stoneT, H, Z0, X1 + T, H + 0.05, Z1 + T), mats.ceiling, false);

  // ---- the ledger along the back wall and the gable: the ceiling's joists bear on it, the smoke alarm hangs under it; no beam crosses the view
  add(
    beam,
    joined([
      boxAt(X0, H - ROOM.beamH, Z0, X1, H, Z0 + ROOM.beamW),
      boxAt(X1 - ROOM.beamW, H - ROOM.beamH, Z0 + ROOM.beamW, X1, H, FLUE.z - FLUE.crossingHalf - 0.03),
    ]),
    mats.beam,
    false,
  );

  // ---- windows in the back, the gable and the front walls
  const frames: THREE.BufferGeometry[] = [];
  const panes: THREE.BufferGeometry[] = [];
  for (const h of BACK_HOLES) {
    const w = windowParts(h, (u, y, d) => v3(u, y, Z0 - d), T, mats);
    frames.push(w.frame);
    panes.push(w.glass);
  }
  for (const h of GABLE_HOLES) {
    const w = windowParts(h, (u, y, d) => v3(X1 + d, y, u), T, mats);
    frames.push(w.frame);
    panes.push(w.glass);
  }
  const frontFrames: THREE.BufferGeometry[] = [];
  for (const h of FRONT_HOLES) {
    const w = windowParts(h, (u, y, d) => v3(u, y, Z1 + d), T, mats);
    frontFrames.push(w.frame);
    panes.push(w.glass);
  }
  const backFrames = frames.slice(0, BACK_HOLES.length);
  const gableFrames = frames.slice(BACK_HOLES.length);
  add(back, joined(backFrames), mats.frame.clone());
  add(gable, joined(gableFrames), mats.frame.clone());
  add(front, joined(frontFrames), mats.frame.clone(), false);
  // the panes step aside with their wall
  const paneSet = (g: THREE.Group, list: THREE.BufferGeometry[]) => {
    const m = new THREE.Mesh(joined(list), mats.glass.clone());
    m.renderOrder = 3;
    m.castShadow = false;
    m.name = 'panes';
    m.raycast = () => {};
    g.add(m);
    return m;
  };
  const panesBack = paneSet(back, panes.slice(0, BACK_HOLES.length));
  const panesGable = paneSet(gable, panes.slice(BACK_HOLES.length, BACK_HOLES.length + GABLE_HOLES.length));
  const panesFront = paneSet(front, panes.slice(BACK_HOLES.length + GABLE_HOLES.length));

  return {
    group,
    back,
    gable,
    front,
    ceiling,
    doorWall,
    floor,
    beam,
    stone,
    slab,
    windows: frames,
    panes: [panesBack, panesGable, panesFront],
    holes: { back: BACK_HOLES, gable: GABLE_HOLES, front: FRONT_HOLES },
  };
}

/** The planes of the walls, for `roomSide`: a point of each and the normal towards the room. */
export const WALL_PLANES = {
  back: { at: [0, 0, Z0] as [number, number, number], in: [0, 0, 1] as [number, number, number] },
  gable: { at: [X1, 0, 0] as [number, number, number], in: [-1, 0, 0] as [number, number, number] },
  front: { at: [0, 0, Z1] as [number, number, number], in: [0, 0, -1] as [number, number, number] },
  left: { at: [X0, 0, 0] as [number, number, number], in: [1, 0, 0] as [number, number, number] },
  ceiling: { at: [0, H, 0] as [number, number, number], in: [0, -1, 0] as [number, number, number] },
};
