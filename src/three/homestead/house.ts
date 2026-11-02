import * as THREE from 'three';
import { boxAt, joined, lathe, stick, uvMetric, v3 } from '../common';
import { FLUE, HOUSE, ROOM } from '../dims';
import { BACK_HOLES, FRONT_HOLES, GABLE_HOLES } from '../room/shell';
import { boardsMap, masonryMap, renderMap, shingleMap, tiled } from '../textures';
import { patchSnow } from './snow';

// The house, in the room's own frame: its gable, its back and its front stand where the room's walls stand, its windows where the room's windows are, its chimney where the room's chimney goes. A foothill house, low and wide under its eaves: lime render, a stone plinth, larch boards in the gable,
// shutters, a porch, a roof of wood shingle that holds the snow. Well insulated: the snow stays on it. No sign, no word. The foot of its plinth is on the land.

export interface HouseMaterials {
  render: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  larch: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  shutter: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
}

export function houseMaterials(): HouseMaterials {
  const b = boardsMap();
  const r = renderMap();
  const sh = shingleMap();
  return {
    render: new THREE.MeshStandardMaterial({ color: 0xe6dcc6, map: tiled(r, 1 / 1.6), roughness: 0.95 }),
    stone: patchSnow(
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: tiled(masonryMap(), 1 / 1.6), roughness: 0.96 }),
      { lo: 0.7, hi: 0.95 },
    ),
    larch: new THREE.MeshStandardMaterial({ color: 0x7a5636, map: tiled(b, 1 / 1.4), roughness: 0.85 }),
    roof: patchSnow(new THREE.MeshStandardMaterial({ color: 0x5b4c3e, map: tiled(sh, 1 / 1.2), roughness: 0.88 }), {
      lo: 0.32,
      hi: 0.62,
    }),
    frame: new THREE.MeshStandardMaterial({ color: 0xece4d2, roughness: 0.62 }),
    shutter: new THREE.MeshStandardMaterial({ color: 0x4a5f52, map: tiled(b, 1 / 0.8), roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x2a343b,
      roughness: 0.16,
      metalness: 0.55,
      emissive: 0xffb45e,
      emissiveIntensity: 0,
    }),
    door: new THREE.MeshStandardMaterial({ color: 0x6a4427, map: tiled(b, 1 / 1.0), roughness: 0.74 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.55, metalness: 0.6 }),
    timber: patchSnow(new THREE.MeshStandardMaterial({ color: 0x6d4c30, map: tiled(b, 1 / 0.8), roughness: 0.82 }), {
      lo: 0.6,
      hi: 0.9,
    }),
  };
}

/** The height of the roof's top face at a place in the room frame. */
export const roofY = (z: number): number => {
  const mid = (HOUSE.z0 + HOUSE.z1) / 2;
  const half = (HOUSE.z1 - HOUSE.z0) / 2;
  return HOUSE.ridge - (Math.abs(z - mid) * (HOUSE.ridge - HOUSE.eave)) / half;
};

/** Two slopes with a thickness, eaves and verges, the ridge along X; UVs in metres down the slope. */
export function roofGeometry(
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  eave: number,
  ridge: number,
  over: number,
  thick = 0.14,
): THREE.BufferGeometry {
  const mid = (z0 + z1) / 2;
  const half = (z1 - z0) / 2;
  const slope = (ridge - eave) / half;
  const X0 = x0 - over;
  const X1 = x1 + over;
  const zb = z0 - over;
  const zf = z1 + over;
  const yEave = ridge - slope * (half + over);
  const pos: number[] = [];
  const uv: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[], uu: number, vv: number) => {
    for (const [q, u, v] of [
      [a, 0, 0],
      [b, uu, 0],
      [c, uu, vv],
      [a, 0, 0],
      [c, uu, vv],
      [d, 0, vv],
    ] as [number[], number, number][]) {
      pos.push(q[0]!, q[1]!, q[2]!);
      uv.push(u, v);
    }
  };
  const L = X1 - X0;
  const s = Math.hypot(half + over, ridge - yEave);
  // top faces
  quad([X0, yEave, zf], [X1, yEave, zf], [X1, ridge, mid], [X0, ridge, mid], L, s);
  quad([X1, yEave, zb], [X0, yEave, zb], [X0, ridge, mid], [X1, ridge, mid], L, s);
  // undersides
  quad([X1, yEave - thick, zf], [X0, yEave - thick, zf], [X0, ridge - thick, mid], [X1, ridge - thick, mid], L, s);
  quad([X0, yEave - thick, zb], [X1, yEave - thick, zb], [X1, ridge - thick, mid], [X0, ridge - thick, mid], L, s);
  // eaves and verges
  quad([X0, yEave - thick, zf], [X1, yEave - thick, zf], [X1, yEave, zf], [X0, yEave, zf], L, thick);
  quad([X1, yEave - thick, zb], [X0, yEave - thick, zb], [X0, yEave, zb], [X1, yEave, zb], L, thick);
  quad([X1, yEave - thick, zf], [X1, ridge - thick, mid], [X1, ridge, mid], [X1, yEave, zf], s, thick);
  quad([X1, ridge - thick, mid], [X1, yEave - thick, zb], [X1, yEave, zb], [X1, ridge, mid], s, thick);
  quad([X0, ridge - thick, mid], [X0, yEave - thick, zf], [X0, yEave, zf], [X0, ridge, mid], s, thick);
  quad([X0, yEave - thick, zb], [X0, ridge - thick, mid], [X0, ridge, mid], [X0, yEave, zb], s, thick);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

interface Win {
  /** On which wall, where along it, and its size. */
  wall: 'front' | 'back' | 'gable' | 'gable-w';
  u: number;
  w: number;
  y0: number;
  y1: number;
  shutters?: boolean;
}

export interface HouseBuild {
  group: THREE.Group;
  /** What glows at dusk. */
  glass: THREE.MeshStandardMaterial;
  mats: HouseMaterials;
  /** The foot of the walls' plinth, in the frame of the group. */
  plinthBottom: number;
}

export function buildHouse(m: HouseMaterials): HouseBuild {
  const group = new THREE.Group();
  group.name = 'house';
  const { x0, x1, z0, z1, eave, ridge, overhang: over, plinth } = HOUSE;
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, cast = true) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  // ---- plinth and walls
  add(boxAt(x0 - 0.04, -plinth, z0 - 0.04, x1 + 0.04, 0.03, z1 + 0.04), m.stone);
  add(boxAt(x0, 0.03, z0, x1, eave, z1), m.render);
  // ---- the gable boards, from the eave to the ridge, a hair proud of the wall
  const gableBoards = (x: number, sign: number): THREE.BufferGeometry => {
    const zm = (z0 + z1) / 2;
    const pos = [x, eave - 0.02, z0, x, eave - 0.02, z1, x, ridge - 0.08, zm];
    const uv = [z0, eave, z1, eave, zm, ridge];
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        sign > 0 ? [pos[3]!, pos[4]!, pos[5]!, pos[0]!, pos[1]!, pos[2]!, pos[6]!, pos[7]!, pos[8]!] : pos,
        3,
      ),
    );
    g.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(sign > 0 ? [uv[2]!, uv[3]!, uv[0]!, uv[1]!, uv[4]!, uv[5]!] : uv, 2),
    );
    g.computeVertexNormals();
    return g;
  };
  add(gableBoards(x1 + 0.02, 1), m.larch);
  add(gableBoards(x0 - 0.02, -1), m.larch);
  // the walls' top triangles
  add(gableBoards(x1, 1), m.render, false);
  // ---- the roof
  add(roofGeometry(x0, x1, z0, z1, eave, ridge, over), m.roof);
  // the rafters' ends under the eaves, every metre
  const rafters: THREE.BufferGeometry[] = [];
  const midZ = (z0 + z1) / 2;
  const half = (z1 - z0) / 2;
  const slope = (ridge - eave) / half;
  for (let x = x0 + 0.2; x < x1; x += 1.1) {
    for (const s of [-1, 1]) {
      const zIn = s > 0 ? z1 - 0.05 : z0 + 0.05;
      const zOut = s > 0 ? z1 + over - 0.04 : z0 - over + 0.04;
      const yIn = ridge - slope * Math.abs(zIn - midZ) - 0.2;
      const yOut = ridge - slope * Math.abs(zOut - midZ) - 0.2;
      const g = new THREE.BoxGeometry(0.08, 0.1, Math.hypot(zOut - zIn, yOut - yIn));
      g.rotateX(s * Math.atan2(yIn - yOut, Math.abs(zOut - zIn)) * -1);
      g.translate(x, (yIn + yOut) / 2 - 0.0, (zIn + zOut) / 2);
      rafters.push(uvMetric(g));
    }
  }
  add(joined(rafters), m.timber);

  // ---- windows, each with a frame, a glazing bar, shutters folded back, and a sill
  const frames: THREE.BufferGeometry[] = [];
  const panes: THREE.BufferGeometry[] = [];
  const shutters: THREE.BufferGeometry[] = [];
  const place = (w: Win) => {
    const depth = 0.04;
    const { y0, y1 } = w;
    const hw = w.w / 2;
    const f = 0.05;
    // in the wall's plane: u along it, n out of it
    const P = (u: number, y: number, d: number): THREE.Vector3 => {
      if (w.wall === 'front') return v3(u, y, z1 + d);
      if (w.wall === 'back') return v3(u, y, z0 - d);
      if (w.wall === 'gable') return v3(x1 + d, y, u);
      return v3(x0 - d, y, u);
    };
    const bx = (u0: number, y_0: number, u1: number, y_1: number, d0: number, d1: number) => {
      const a = P(u0, y_0, d0);
      const b = P(u1, y_1, d1);
      return boxAt(
        Math.min(a.x, b.x),
        Math.min(a.y, b.y),
        Math.min(a.z, b.z),
        Math.max(a.x, b.x),
        Math.max(a.y, b.y),
        Math.max(a.z, b.z),
      );
    };
    panes.push(bx(w.u - hw + f, y0 + f, w.u + hw - f, y1 - f, 0.002, 0.008));
    frames.push(
      bx(w.u - hw, y0, w.u + hw, y0 + f, 0, depth),
      bx(w.u - hw, y1 - f, w.u + hw, y1, 0, depth),
      bx(w.u - hw, y0, w.u - hw + f, y1, 0, depth),
      bx(w.u + hw - f, y0, w.u + hw, y1, 0, depth),
      bx(w.u - 0.018, y0, w.u + 0.018, y1, 0, depth),
      bx(w.u - hw + f, y0 + (y1 - y0) * 0.62 - 0.012, w.u + hw - f, y0 + (y1 - y0) * 0.62 + 0.012, 0, depth * 0.8),
    );
    frames.push(bx(w.u - hw - 0.06, y0 - 0.05, w.u + hw + 0.06, y0, 0, 0.11));
    if (w.shutters !== false) {
      shutters.push(
        bx(w.u - hw - w.w * 0.5, y0 - 0.02, w.u - hw - 0.01, y1 + 0.02, 0.005, 0.04),
        bx(w.u + hw + 0.01, y0 - 0.02, w.u + hw + w.w * 0.5, y1 + 0.02, 0.005, 0.04),
      );
    }
  };
  const sill = ROOM.windowSill;
  const head = ROOM.windowHead;
  // the room's windows, where they are in the room
  for (const h of BACK_HOLES) place({ wall: 'back', u: (h.u0 + h.u1) / 2, w: h.u1 - h.u0, y0: h.y0, y1: h.y1 });
  for (const h of GABLE_HOLES) place({ wall: 'gable', u: (h.u0 + h.u1) / 2, w: h.u1 - h.u0, y0: h.y0, y1: h.y1 });
  void FRONT_HOLES;
  // and the rest of the house
  for (const u of [-8.6, -6.6, -4.2, -1.2, 2.2]) place({ wall: 'front', u, w: 1.1, y0: sill, y1: head });
  for (const u of [-8.2, -5.2]) place({ wall: 'back', u, w: 0.95, y0: sill, y1: head });
  place({ wall: 'gable-w', u: midZ, w: 1.1, y0: sill, y1: head });
  // a small window in each gable's boards
  place({ wall: 'gable', u: midZ, w: 0.7, y0: eave + 0.3, y1: eave + 0.95, shutters: false });
  place({ wall: 'gable-w', u: midZ, w: 0.7, y0: eave + 0.3, y1: eave + 0.95, shutters: false });
  add(joined(frames), m.frame);
  add(joined(panes), m.glass, false);
  add(joined(shutters), m.shutter);

  // ---- the door on the front, a stone step, a small porch on two posts, its roof tied to the wall
  const dx = 0.15;
  const dw = 0.95;
  const stepZ = z1 + 0.5;
  add(boxAt(dx - dw / 2 - 0.1, 0, z1, dx + dw / 2 + 0.1, 2.14, z1 + 0.02), m.frame);
  add(boxAt(dx - dw / 2, 0.02, z1 + 0.02, dx + dw / 2, 2.1, z1 + 0.05), m.door);
  add(stick(v3(dx + dw / 2 - 0.1, 1.04, z1 + 0.05), v3(dx + dw / 2 - 0.1, 1.04, z1 + 0.1), 0.012, 8), m.iron);
  add(boxAt(dx - 0.8, -plinth, z1, dx + 0.8, 0.0, stepZ + 0.25), m.stone);
  add(boxAt(dx - 0.8, -plinth, stepZ + 0.25, dx + 0.8, -plinth * 0.5, stepZ + 0.55), m.stone);
  // the wide eave is the porch's roof: two posts and a beam carry it over the step
  const slope0 = (ridge - eave) / ((z1 - z0) / 2);
  const underEave = eave - slope0 * 0.72 - 0.14;
  add(
    joined([
      boxAt(dx - 0.88, -plinth * 0.5, z1 + 0.68, dx - 0.78, underEave, z1 + 0.78),
      boxAt(dx + 0.78, -plinth * 0.5, z1 + 0.68, dx + 0.88, underEave, z1 + 0.78),
      boxAt(dx - 1.0, underEave - 0.1, z1 + 0.68, dx + 1.0, underEave, z1 + 0.78),
    ]),
    m.timber,
  );
  // ---- the flashing round the chimney, on the roof
  const y = roofY(FLUE.z);
  add(
    lathe(
      [
        [FLUE.outerR + 0.22, y - 0.1],
        [FLUE.outerR + 0.04, y + 0.12],
        [FLUE.outerR + 0.002, y + 0.18],
      ],
      28,
    ).translate(FLUE.x, 0, FLUE.z),
    m.iron,
  );
  return { group, glass: m.glass, mats: m, plinthBottom: -plinth };
}

/** A simpler house of the neighbourhood, for a hamlet: its foot at y = 0, its ridge along X. */
export function simpleHouse(
  m: HouseMaterials,
  length: number,
  width: number,
  wallH: number,
  roofH: number,
  seed: number,
  chimney = true,
): THREE.Group {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  const x0 = -length / 2;
  const x1 = length / 2;
  const z0 = -width / 2;
  const z1 = width / 2;
  add(boxAt(x0 - 0.03, 0, z0 - 0.03, x1 + 0.03, 0.42, z1 + 0.03), m.stone);
  add(boxAt(x0, 0.42, z0, x1, wallH, z1), m.render);
  add(roofGeometry(x0, x1, z0, z1, wallH, wallH + roofH, 0.65), m.roof);
  const frames: THREE.BufferGeometry[] = [];
  const panes: THREE.BufferGeometry[] = [];
  const n = Math.round(length / 2.8);
  for (let i = 0; i < n; i++) {
    const u = x0 + ((i + 0.5) * length) / n;
    panes.push(boxAt(u - 0.42, 1.3, z1, u + 0.42, 2.25, z1 + 0.02));
    frames.push(
      boxAt(u - 0.48, 1.24, z1, u + 0.48, 1.3, z1 + 0.05),
      boxAt(u - 0.48, 2.25, z1, u + 0.48, 2.31, z1 + 0.05),
      boxAt(u - 0.48, 1.24, z1, u - 0.42, 2.31, z1 + 0.05),
      boxAt(u + 0.42, 1.24, z1, u + 0.48, 2.31, z1 + 0.05),
    );
  }
  add(joined(frames), m.frame);
  add(joined(panes), m.glass);
  if (chimney)
    add(
      boxAt(
        x1 * 0.4 - 0.25,
        wallH,
        -0.25 + (seed % 2 ? 0.8 : -0.8),
        x1 * 0.4 + 0.25,
        wallH + roofH + 0.9,
        0.25 + (seed % 2 ? 0.8 : -0.8),
      ),
      m.stone,
    );
  return g;
}
