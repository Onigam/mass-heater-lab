import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { TAU, boxAt, joined, lathe, stick, v3 } from '../common';
import { FLUE, HOME, HOUSE } from '../dims';
import { buildBasket } from '../room/items';
import type { MachineMaterials } from '../machine/materials';
import { barkMap, endGrainMap, shingleMap, tiled } from '../textures';
import { patchSnow } from './snow';
import { roofGeometry, roofY, type HouseMaterials } from './house';

// The small things of the homestead. All in the frame of the land, each foot on the ground the terrain says (all these stand on the flat pad), from `HOME`.

export interface ShedBuild {
  shed: THREE.Group;
  stack: THREE.Group;
  /** The stack's logs, in the order they are burned: `count` falls as the season goes. */
  logs: THREE.InstancedMesh[];
  capacity: number;
}

/** The woodshed: posts, a tie, a shingle roof that holds the snow, slatted back and ends so that the wind goes through; a season's wood stacked inside, and one day's basket beside it. */
export function buildShed(m: HouseMaterials, mm: MachineMaterials, snowy = true): ShedBuild {
  const S = HOME.woodshed;
  const L = S.length;
  const Dp = S.depth;
  const shed = new THREE.Group();
  shed.name = 'woodshed';
  const add = (g: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, cast = true) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  const posts: THREE.BufferGeometry[] = [];
  const th = 0.11;
  for (const x of [-L / 2, -L / 6, L / 6, L / 2])
    for (const z of [-Dp / 2, Dp / 2]) posts.push(boxAt(x - th / 2, 0, z - th / 2, x + th / 2, S.wallH, z + th / 2));
  posts.push(boxAt(-L / 2 - th / 2, S.wallH - 0.11, -Dp / 2 - th / 2, L / 2 + th / 2, S.wallH, -Dp / 2 + th / 2));
  posts.push(boxAt(-L / 2 - th / 2, S.wallH - 0.11, Dp / 2 - th / 2, L / 2 + th / 2, S.wallH, Dp / 2 + th / 2));
  for (const x of [-L / 2, -L / 6, L / 6, L / 2])
    posts.push(boxAt(x - th / 2, S.wallH - 0.11, -Dp / 2, x + th / 2, S.wallH, Dp / 2));
  add(shed, joined(posts), m.timber);
  // the slats of the back: gaps let the wind through
  const slats: THREE.BufferGeometry[] = [];
  for (let y = 0.1; y < S.wallH - 0.16; y += 0.2)
    slats.push(boxAt(-L / 2, y, -Dp / 2 - 0.05, L / 2, y + 0.12, -Dp / 2 - 0.03));
  for (let y = 0.1; y < S.wallH - 0.16; y += 0.2) {
    slats.push(boxAt(-L / 2 - 0.05, y, -Dp / 2, -L / 2 - 0.03, y + 0.12, Dp / 2));
    slats.push(boxAt(L / 2 + 0.03, y, -Dp / 2, L / 2 + 0.05, y + 0.12, Dp / 2));
  }
  add(shed, joined(slats), m.larch);
  // a floor of planks on bearers, so the wood stays off the ground
  add(shed, boxAt(-L / 2 + 0.05, 0.0, -Dp / 2 + 0.05, L / 2 - 0.05, 0.08, Dp / 2 - 0.05), m.larch, false);
  const roof = roofGeometry(-L / 2, L / 2, -Dp / 2, Dp / 2, S.wallH, S.wallH + S.roofH, 0.42, 0.09);
  const roofMat = patchSnow(
    new THREE.MeshStandardMaterial({ color: 0x6c5a47, map: tiled(shingleMap(), 1 / 1.2), roughness: 0.88 }),
    { lo: 0.3, hi: 0.6, gain: snowy ? 1 : 0 },
  );
  add(shed, roof, roofMat);

  // ---- the stack: a season's split wood, the ends of the logs towards the open side. Two ranks deep is what shows: the second rank is a dark mass behind. To scale: `HOME.stack`.
  const stack = new THREE.Group();
  stack.name = 'cordwood-stack';
  const st = HOME.stack;
  const r = rng(99);
  const rLog = 0.058;
  const cols = Math.floor(st.length / (rLog * 1.92));
  const rows = Math.floor(st.height / (rLog * 1.65));
  const items: THREE.Matrix4[] = [];
  const tint: number[] = [];
  const z = -Dp / 2 + 0.12 + st.depth;
  const base = 0.08;
  // the top rows are burned first: from the top right
  for (let j = rows - 1; j >= 0; j--)
    for (let i = cols - 1; i >= 0; i--) {
      const x = -st.length / 2 + (i + 0.5) * (st.length / cols) + (j % 2 ? rLog * 0.45 : 0) + (r() - 0.5) * 0.012;
      const y = base + rLog * 0.9 + j * rLog * 1.64 + (r() - 0.5) * 0.01;
      const s = rLog * (0.8 + 0.34 * r());
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (r() - 0.5) * 0.05, r() * TAU));
      const m4 = new THREE.Matrix4().compose(
        v3(x, y, z + (r() - 0.5) * 0.028),
        q,
        v3(s, s * (0.82 + 0.3 * r()), st.depth),
      );
      items.push(m4);
      tint.push(r());
    }
  const end = new THREE.CircleGeometry(1, 6);
  const side = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  side.rotateX(Math.PI / 2);
  side.translate(0, 0, -0.5);
  const ends = new THREE.InstancedMesh(
    end,
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: endGrainMap(), roughness: 0.92 }),
    items.length,
  );
  const sides = new THREE.InstancedMesh(
    side,
    new THREE.MeshStandardMaterial({ color: 0x8a7a68, map: tiled(barkMap(), 1, 1), roughness: 1 }),
    items.length,
  );
  const c = new THREE.Color();
  items.forEach((m4, i) => {
    ends.setMatrixAt(i, m4);
    sides.setMatrixAt(i, m4);
    const t = tint[i]!;
    ends.setColorAt(i, c.setRGB(0.82 + 0.3 * t, 0.76 + 0.26 * t, 0.66 + 0.22 * t));
  });
  ends.castShadow = false;
  ends.receiveShadow = true;
  sides.castShadow = true;
  sides.receiveShadow = true;
  ends.frustumCulled = sides.frustumCulled = false;
  ends.userData.noShadow = true;
  stack.add(ends, sides);
  // the dark mass behind, so that no daylight shows between the two ranks
  add(
    stack,
    boxAt(-st.length / 2, base, -Dp / 2 + 0.12, st.length / 2, base + st.height - 0.06, z - st.depth + 0.12),
    m.larch,
    false,
  );
  // one day's wood beside a season's: the same basket as in the room, on the shed's plank floor
  const basket = buildBasket(mm);
  basket.position.set(st.length / 2 + 0.05 - 0.55, 0.08, Dp / 2 + 0.1 - 0.2);
  stack.add(basket);
  const place = (g: THREE.Group) => {
    g.position.set(S.x, 0, S.z);
    g.rotation.y = S.yaw;
  };
  place(shed);
  place(stack);
  return { shed, stack, logs: [ends, sides], capacity: items.length };
}

/** The chopping block with its small wood and a hatchet: a section of a trunk on the ground, kindling stood against it. */
export function buildBlock(m: HouseMaterials): THREE.Group {
  const B = HOME.block;
  const g = new THREE.Group();
  g.name = 'kindling-block';
  const bark = new THREE.MeshStandardMaterial({ color: 0x8a7863, map: tiled(barkMap(), 2, 1), roughness: 1 });
  const top = new THREE.MeshStandardMaterial({ color: 0xffffff, map: endGrainMap(), roughness: 0.9 });
  const trunk = new THREE.CylinderGeometry(B.r, B.r * 1.08, B.h, 16, 1, true);
  trunk.translate(0, B.h / 2, 0);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  add(trunk, bark);
  const cap = new THREE.CircleGeometry(B.r, 18);
  cap.rotateX(-Math.PI / 2);
  cap.translate(0, B.h, 0);
  add(cap, top);
  // the hatchet, its blade in the block, the handle up at an angle
  const iron = m.iron;
  add(joined([boxAt(-0.012, B.h - 0.014, -0.05, 0.012, B.h + 0.07, 0.05)]), iron);
  add(
    stick(v3(0.0, B.h + 0.06, 0.0), v3(0.24, B.h + 0.36, 0.05), 0.013, 8),
    new THREE.MeshStandardMaterial({ color: 0xc09a68, roughness: 0.6 }),
  );
  // kindling, thin dry sticks: a small heap on the ground, a few on the block's side
  const r = rng(11);
  const wood = new THREE.MeshStandardMaterial({ color: 0xcaa778, roughness: 0.9 });
  const sticks: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 26; i++) {
    const a = (r() - 0.5) * 0.7;
    const L = 0.3 + 0.14 * r();
    const x = -0.52 + (i % 8) * 0.04 + (r() - 0.5) * 0.02;
    const z = 0.12 + (r() - 0.5) * 0.05;
    const y = 0.022 + Math.floor(i / 8) * 0.03 + r() * 0.004;
    sticks.push(
      stick(v3(x, y, z - (L / 2) * Math.cos(a)), v3(x + (L / 2) * Math.sin(a), y, z + (L / 2) * Math.cos(a)), 0.012, 5),
    );
  }
  add(joined(sticks), wood);
  g.position.set(B.x, 0, B.z);
  return g;
}

/** A moisture meter: a yellow hand-held box, its two pins in the end of a split log lying on the ground by the block; a small grey screen, no word. Its pins touch the wood. */
export function buildMeter(): { group: THREE.Group; screen: THREE.MeshStandardMaterial } {
  const B = HOME.block;
  const g = new THREE.Group();
  g.name = 'moisture-meter';
  const logMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: endGrainMap(), roughness: 0.9 });
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x8a7a66, map: tiled(barkMap(), 1, 1), roughness: 1 });
  const logR = 0.06;
  const logL = 0.34;
  const lx = 0.22;
  const lz = 0.46;
  const body = new THREE.CylinderGeometry(logR, logR, logL, 7, 1, true);
  body.rotateZ(Math.PI / 2);
  body.translate(lx, logR, lz);
  const face = new THREE.CircleGeometry(logR, 7);
  face.rotateY(Math.PI / 2);
  face.translate(lx + logL / 2, logR, lz);
  const logM = new THREE.Mesh(body, barkMat);
  const faceM = new THREE.Mesh(face, logMat);
  logM.castShadow = faceM.castShadow = true;
  logM.receiveShadow = faceM.receiveShadow = true;
  g.add(logM, faceM);
  // the meter, its pins into the log's end
  const yellow = new THREE.MeshStandardMaterial({ color: 0xd9a51f, roughness: 0.48 });
  const xPin = lx + logL / 2;
  const meter = new THREE.Mesh(
    boxAt(xPin + 0.024, logR - 0.018, lz - 0.03, xPin + 0.15, logR + 0.018, lz + 0.03),
    yellow,
  );
  const pins = new THREE.Mesh(
    joined([
      stick(v3(xPin - 0.012, logR + 0.006, lz - 0.014), v3(xPin + 0.026, logR + 0.006, lz - 0.014), 0.0025, 6),
      stick(v3(xPin - 0.012, logR + 0.006, lz + 0.014), v3(xPin + 0.026, logR + 0.006, lz + 0.014), 0.0025, 6),
    ]),
    new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.35, metalness: 0.85 }),
  );
  const screen = new THREE.MeshStandardMaterial({
    color: 0x3d4a42,
    roughness: 0.3,
    emissive: 0x8bb28b,
    emissiveIntensity: 0.25,
  });
  screen.userData.noShare = true;
  const scr = new THREE.Mesh(
    boxAt(xPin + 0.06, logR + 0.018, lz - 0.02, xPin + 0.12, logR + 0.0195, lz + 0.02),
    screen,
  );
  scr.userData.dynamic = true;
  meter.castShadow = true;
  g.add(meter, pins, scr);
  g.position.set(B.x, 0, B.z);
  return { group: g, screen };
}

/** The ash bucket: a lidded steel pail on a flat stone, well away from any wall. */
export function buildBucket(m: HouseMaterials): THREE.Group {
  const K = HOME.bucket;
  const g = new THREE.Group();
  g.name = 'ash-bucket';
  const steel = patchSnow(new THREE.MeshStandardMaterial({ color: 0x777b7e, roughness: 0.48, metalness: 0.74 }), {
    lo: 0.6,
    hi: 0.9,
  });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  add(boxAt(-0.27, 0, -0.27, 0.27, 0.05, 0.27), m.stone);
  add(
    lathe(
      [
        [0, 0.05],
        [K.r * 0.9, 0.05],
        [K.r * 0.92, 0.056],
        [K.r, 0.05 + K.h],
        [K.r + 0.008, 0.05 + K.h + 0.004],
        [K.r + 0.008, 0.05 + K.h + 0.018],
        [K.r * 0.32, 0.05 + K.h + 0.042],
        [0.014, 0.05 + K.h + 0.044],
        [0, 0.05 + K.h + 0.044],
      ],
      28,
    ),
    steel,
  );
  const handle = new THREE.TorusGeometry(K.r + 0.012, 0.0045, 6, 18, Math.PI);
  handle.rotateY(0.5);
  handle.translate(0, 0.05 + K.h - 0.01, 0);
  add(handle, m.iron);
  add(stick(v3(-0.03, 0.05 + K.h + 0.05, 0), v3(0.03, 0.05 + K.h + 0.05, 0), 0.006, 6), m.iron);
  g.position.set(K.x, 0, K.z);
  return g;
}

/** The air inlet on the gable, low: a round steel hood, a sleeve into the wall. */
export function buildInlet(m: HouseMaterials): THREE.Group {
  const I = HOME.inlet;
  const g = new THREE.Group();
  g.name = 'outside-air-inlet';
  const steel = new THREE.MeshStandardMaterial({ color: 0xb1b3b4, roughness: 0.38, metalness: 0.82 });
  const hood = lathe(
    [
      [0, 0.09],
      [I.r * 0.94, 0.09],
      [I.r * 1.02, 0.05],
      [I.r * 1.02, 0.0],
    ],
    24,
  );
  hood.rotateZ(-Math.PI / 2);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  add(hood, steel);
  const louvre: THREE.BufferGeometry[] = [];
  for (let i = -2; i <= 2; i++)
    louvre.push(boxAt(0.094, i * 0.022 - 0.005, -I.r * 0.75, 0.098, i * 0.022 + 0.005, I.r * 0.75));
  add(joined(louvre), m.iron);
  add(stick(v3(-0.05, 0, 0), v3(0.01, 0, 0), I.r * 0.96, 24), steel);
  return g;
}

/** What the sweep needs: a steel roof ladder from the eave to the chimney, hooked on the shingles, a small step beside the flue. In the room frame, moved with the house. */
export function buildSweepAccess(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'sweep-access';
  const iron = patchSnow(new THREE.MeshStandardMaterial({ color: 0x6a6d70, roughness: 0.5, metalness: 0.7 }), {
    lo: 0.7,
    hi: 0.95,
    gain: 0.4,
  });
  const x = FLUE.x - 0.5;
  const zEave = HOUSE.z1 + HOUSE.overhang - 0.1;
  const zTop = FLUE.z + 0.35;
  const off = 0.05;
  const rails: THREE.BufferGeometry[] = [];
  const hw = 0.2;
  const P = (dx: number, z: number) => v3(x + dx, roofY(z) + off, z);
  rails.push(stick(P(-hw, zEave), P(-hw, zTop), 0.014, 8), stick(P(hw, zEave), P(hw, zTop), 0.014, 8));
  const nRungs = Math.floor((zEave - zTop) / 0.3);
  for (let i = 0; i <= nRungs; i++) {
    const z = zEave - (i * (zEave - zTop)) / nRungs;
    rails.push(stick(P(-hw, z), P(hw, z), 0.011, 6));
  }
  // its feet on the roof: short standoffs along it
  for (let i = 0; i <= 4; i++) {
    const z = zEave - (i * (zEave - zTop)) / 4;
    for (const s of [-hw, hw]) rails.push(stick(P(s, z), v3(x + s, roofY(z) - 0.02, z), 0.012, 6));
  }
  // the step at the chimney's side, at the top of the ladder: a grating on brackets, its near edge on the rails
  const yStep = roofY(zTop) + off;
  rails.push(boxAt(x - hw - 0.05, yStep, zTop - 0.24, FLUE.x - FLUE.outerR + 0.0, yStep + 0.022, zTop + 0.04));
  rails.push(stick(v3(x, yStep, zTop - 0.2), v3(x, roofY(zTop - 0.2) - 0.02, zTop - 0.2), 0.012, 6));
  const m = new THREE.Mesh(joined(rails), iron);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return g;
}

/** The neighbour: a house on its shelf, a big masonry chimney on it. */
export function chimneyMouth(): THREE.Vector3 {
  const N = HOME.neighbour;
  return v3(
    N.x + Math.cos(N.yaw) * (N.length * 0.2),
    0.6 + N.chimneyH + 0.02,
    N.z - Math.sin(N.yaw) * (N.length * 0.2),
  );
}

/** The coppice's small things: a stack of poles at its edge, a line of posts around the lot, cut stumps. */
export function buildCoppiceDressing(m: HouseMaterials, y: (x: number, z: number) => number): THREE.Group {
  const C = HOME.coppice;
  const g = new THREE.Group();
  g.name = 'coppice-dressing';
  const parts: THREE.BufferGeometry[] = [];
  const x0 = C.x - C.width / 2 - 0.5;
  const x1 = C.x + C.width / 2 + 0.5;
  const z0 = C.z - C.depth / 2 - 0.5;
  const z1 = C.z + C.depth / 2 + 0.5;
  const post = (x: number, z: number) => {
    const h = y(x, z);
    parts.push(stick(v3(x, h - 0.1, z), v3(x, h + 0.95, z), 0.05, 7));
  };
  for (let x = x0; x <= x1; x += 3) {
    post(x, z1);
    post(x, z0);
  }
  for (let z = z0; z <= z1; z += 3) {
    post(x0, z);
    post(x1, z);
  }
  // the top rail along the south side
  let xa = x0;
  while (xa < x1 - 0.1) {
    const xb = Math.min(x1, xa + 3);
    parts.push(stick(v3(xa, y(xa, z1) + 0.82, z1), v3(xb, y(xb, z1) + 0.82, z1), 0.028, 6));
    parts.push(stick(v3(xa, y(xa, z1) + 0.42, z1), v3(xb, y(xb, z1) + 0.42, z1), 0.024, 6));
    xa = xb;
  }
  // a stack of cut poles at the corner
  const r = rng(61);
  const px = x0 + 4.2;
  const pz = z1 + 1.4;
  const py = y(px, pz);
  for (let i = 0; i < 16; i++) {
    const row = i < 7 ? 0 : i < 12 ? 1 : 2;
    const k = row === 0 ? i : row === 1 ? i - 7 : i - 12;
    const yy = py + 0.05 + row * 0.085;
    const z = pz + (k - 3 + row * 0.5) * 0.095;
    parts.push(stick(v3(px - 1.5 + r() * 0.2, yy, z), v3(px + 1.5 + r() * 0.2, yy, z), 0.04 + r() * 0.012, 6));
  }
  const mesh = new THREE.Mesh(joined(parts), m.timber);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}
