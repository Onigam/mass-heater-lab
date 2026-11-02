import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { TAU, boxAt, joined, lathe, softBox, stick, tubeGeometry, v3 } from '../common';
import { BENCH, ROOM } from '../dims';
import { clothMap, knitMap, rugMap, tiled, woodMap } from '../textures';
import { BACK_HOLES, GABLE_HOLES } from './shell';

// What makes the room a room where people live: a rug, an armchair, a low table with two mugs and a book, a bookcase on the stone wall, a floor lamp, a pendant under the beam, a plant, curtains on their rods, pictures with no words,
// a wall clock whose hands follow the model's hour, the tools of the fire on their stand, a stool, slippers, and on the warm bench a folded blanket, wool socks drying. Everything stands on what carries it, foot on the
// floor (`FLOOR`), on the slab or on the bench, and nothing is a part: the parts of the room are built in `items.ts`. Sizes are a house's, never a figure from the model.

/** The top of the boards. */
export const FLOOR = -ROOM.floorDrop;

export interface FurnitureBuild {
  group: THREE.Group;
  /** The hour and minute hands of the clock turn around their own axis. */
  hourHand: THREE.Mesh;
  minuteHand: THREE.Mesh;
  /** The shades of the lamps: they glow at dusk. */
  shades: THREE.MeshStandardMaterial;
  /** Where the low table's lamp gives its light. */
  pendant: THREE.Vector3;
  floorLamp: THREE.Vector3;
  /** The lowest point of each thing as built, and what it stands on, for the tests. */
  rests: { name: string; low: number; on: number }[];
}

export function buildFurniture(): FurnitureBuild {
  const group = new THREE.Group();
  group.name = 'furniture';
  const rests: FurnitureBuild['rests'] = [];
  const box = new THREE.Box3();
  const rest = (name: string, object: THREE.Object3D, on: number) => {
    object.updateWorldMatrix(true, true);
    rests.push({ name, low: box.setFromObject(object, true).min.y, on });
  };
  const wood = woodMap();
  const cloth = clothMap();
  const knit = knitMap();
  const woodMat = (hex: number, rough = 0.62): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: hex, map: tiled(wood, 1 / 0.7), roughness: rough });
  const oak = woodMat(0xa77a4c);
  const walnut = woodMat(0x5f3f28);
  const pale = woodMat(0xcfb48c);
  // a thin round leg takes no map: the grain would ring it like a rope
  const legDark = new THREE.MeshStandardMaterial({ color: 0x4a3120, roughness: 0.6 });
  const legOak = new THREE.MeshStandardMaterial({ color: 0x8f6a42, roughness: 0.62 });
  const clothOf = (hex: number): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: hex, map: tiled(cloth, 1 / 0.24), roughness: 0.96 });
  const wool = (hex: number): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: hex, map: tiled(knit, 1 / 0.2), roughness: 1 });
  const glazed = (hex: number) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.32 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x28282a, roughness: 0.55, metalness: 0.6 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xa8833f, roughness: 0.38, metalness: 0.85 });

  const unit = (name: string): THREE.Group => {
    const g = new THREE.Group();
    g.name = name;
    group.add(g);
    return g;
  };
  const put = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // ---- the rug
  const rug = unit('rug');
  const rugX0 = -0.95;
  const rugX1 = 1.65;
  const rugZ0 = -0.62;
  const rugZ1 = 1.28;
  const rugGeo = new THREE.BoxGeometry(rugX1 - rugX0, 0.008, rugZ1 - rugZ0);
  rugGeo.translate((rugX0 + rugX1) / 2, FLOOR + 0.004, (rugZ0 + rugZ1) / 2);
  put(rug, rugGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, map: rugMap(), roughness: 1 }), false);
  rest('rug', rug, FLOOR);

  // ---- the armchair, at an angle, towards the drum: frame, seat, back, arms, a cushion
  const chair = unit('armchair');
  chair.position.set(-0.45, FLOOR, 1.12);
  chair.rotation.y = -Math.PI * 0.72;
  const uphol = clothOf(0x6f4632);
  const legs = [
    [-0.31, -0.31],
    [0.31, -0.31],
    [-0.31, 0.31],
    [0.31, 0.31],
  ];
  for (const [x, z] of legs)
    put(chair, new THREE.CylinderGeometry(0.018, 0.012, 0.16, 8).translate(x!, 0.08, z!), legDark);
  put(chair, softBox(0, 0.23, 0, 0.72, 0.16, 0.72, 0.05, 3), uphol);
  put(chair, softBox(0, 0.36, 0.03, 0.54, 0.12, 0.58, 0.05, 3), clothOf(0x7c5240));
  put(chair, softBox(0, 0.56, -0.3, 0.72, 0.56, 0.14, 0.06, 3), uphol);
  put(chair, softBox(-0.31, 0.38, 0.02, 0.11, 0.28, 0.66, 0.05, 3), uphol);
  put(chair, softBox(0.31, 0.38, 0.02, 0.11, 0.28, 0.66, 0.05, 3), uphol);
  put(chair, softBox(0.08, 0.53, -0.14, 0.34, 0.26, 0.14, 0.05, 3), wool(0xa86a2c));
  rest('armchair', chair, FLOOR);

  // ---- the low table: a top, four legs, two mugs, a book, a small tray
  const table = unit('table');
  table.position.set(0.55, FLOOR, 0.32);
  const th = 0.38;
  put(table, softBox(0, th - 0.02, 0, 1.0, 0.04, 0.56, 0.012, 2), oak);
  for (const [x, z] of [
    [-0.44, -0.22],
    [0.44, -0.22],
    [-0.44, 0.22],
    [0.44, 0.22],
  ])
    put(table, new THREE.CylinderGeometry(0.022, 0.016, th - 0.04, 10).translate(x!, (th - 0.04) / 2, z!), legDark);
  put(table, boxAt(-0.42, 0.13, -0.2, 0.42, 0.15, 0.2), oak);
  const mug = (x: number, z: number, hex: number) => {
    const mat = glazed(hex);
    put(
      table,
      lathe(
        [
          [0, th],
          [0.036, th],
          [0.04, th + 0.008],
          [0.041, th + 0.085],
          [0.037, th + 0.085],
          [0.036, th + 0.012],
          [0, th + 0.012],
        ],
        22,
      ).translate(x, 0, z),
      mat,
    );
    const handle = new THREE.TorusGeometry(0.022, 0.005, 8, 14);
    handle.translate(x + 0.04, th + 0.045, z);
    put(table, handle, mat);
  };
  mug(0.27, 0.08, 0x2c4a56);
  mug(0.04, -0.12, 0xc9a87a);
  const book = (
    g: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    t: number,
    hex: number,
    rot = 0,
  ) => {
    const b = new THREE.Group();
    b.position.set(x, y, z);
    b.rotation.y = rot;
    put(b, boxAt(-w / 2, 0, -d / 2, w / 2, t, d / 2), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8 }));
    put(
      b,
      boxAt(-w / 2 + 0.004, 0.003, -d / 2 + 0.003, w / 2 + 0.001, t - 0.003, d / 2 - 0.003),
      new THREE.MeshStandardMaterial({ color: 0xe9e0c8, roughness: 0.95 }),
    );
    g.add(b);
  };
  book(table, -0.28, th, 0.06, 0.21, 0.15, 0.028, 0x7b2d26, 0.3);
  book(table, -0.3, th + 0.028, 0.05, 0.19, 0.13, 0.022, 0x2a4b45, -0.2);
  rest('table', table, FLOOR);

  // ---- the bookcase on the stone wall
  const shelf = unit('bookcase');
  const sx0 = ROOM.x0;
  const sx1 = ROOM.x0 + 0.3;
  const sz0 = 0.22;
  const sz1 = 1.36;
  const sh = 1.86;
  const planks: THREE.BufferGeometry[] = [
    boxAt(sx0, FLOOR, sz0, sx1, FLOOR + sh, sz0 + 0.03),
    boxAt(sx0, FLOOR, sz1 - 0.03, sx1, FLOOR + sh, sz1),
    boxAt(sx0, FLOOR, sz0, sx0 + 0.012, FLOOR + sh, sz1),
    boxAt(sx0, FLOOR + sh - 0.03, sz0, sx1, FLOOR + sh, sz1),
  ];
  const levels = [0.07, 0.43, 0.79, 1.15, 1.51];
  for (const y of levels) planks.push(boxAt(sx0, FLOOR + y, sz0 + 0.03, sx1, FLOOR + y + 0.024, sz1 - 0.03));
  put(shelf, joined(planks), oak);
  const r = rng(3);
  const COVERS = [0x6c2b22, 0x2b4a44, 0x8f6c2e, 0x37384e, 0x9d5a2c, 0x54452f, 0x7a7160, 0x233a2b, 0xa8947a];
  const bookMats = COVERS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.82 }));
  const perMat: THREE.BufferGeometry[][] = COVERS.map(() => []);
  for (const y of levels) {
    let z = sz0 + 0.04;
    const fill = 0.62 + 0.34 * r();
    const zEnd = sz0 + 0.03 + (sz1 - sz0 - 0.06) * fill;
    while (z < zEnd) {
      const t = 0.022 + 0.034 * r();
      const h = 0.2 + 0.11 * r();
      const dp = 0.16 + 0.07 * r();
      const c = Math.floor(r() * COVERS.length);
      const lean = z > zEnd - 0.08 ? 0.1 : 0;
      const b = boxAt(sx0 + 0.02, 0, -t / 2, sx0 + 0.02 + dp, h, t / 2);
      b.rotateX(lean);
      b.translate(0, FLOOR + y + 0.024, z + t / 2);
      perMat[c]!.push(b);
      z += t + 0.002;
    }
  }
  perMat.forEach((list, i) => list.length && put(shelf, joined(list), bookMats[i]!));
  // a small jar and a wooden box among them
  put(
    shelf,
    lathe(
      [
        [0, 0],
        [0.05, 0],
        [0.056, 0.05],
        [0.045, 0.13],
        [0.022, 0.15],
        [0.026, 0.17],
      ],
      20,
    ).translate(sx0 + 0.15, FLOOR + 0.79 + 0.024, sz1 - 0.15),
    glazed(0x46625c),
  );
  put(shelf, softBox(sx0 + 0.15, FLOOR + 1.15 + 0.024 + 0.05, sz1 - 0.14, 0.2, 0.1, 0.16, 0.006, 1), walnut);
  rest('bookcase', shelf, FLOOR);

  // ---- the floor lamp, its shade glows at dusk
  const lamp = unit('floor-lamp');
  const lx = -1.85;
  const lz = 2.02;
  put(
    lamp,
    lathe(
      [
        [0, FLOOR],
        [0.13, FLOOR],
        [0.135, FLOOR + 0.012],
        [0.03, FLOOR + 0.03],
        [0, FLOOR + 0.03],
      ],
      24,
    ).translate(lx, 0, lz),
    iron,
  );
  put(lamp, stick(v3(lx, FLOOR, lz), v3(lx, FLOOR + 1.42, lz), 0.009, 8), brass);
  const shades = new THREE.MeshStandardMaterial({
    color: 0xe9d7b0,
    roughness: 0.9,
    emissive: 0xffb25e,
    emissiveIntensity: 0.9,
    side: THREE.DoubleSide,
    map: tiled(cloth, 1 / 0.2),
  });
  shades.userData.noShare = true;
  put(
    lamp,
    lathe(
      [
        [0.17, FLOOR + 1.34],
        [0.11, FLOOR + 1.56],
      ],
      24,
    ).translate(lx, 0, lz),
    shades,
    false,
  );
  const floorLamp = v3(lx, FLOOR + 1.44, lz);
  rest('floor-lamp', lamp, FLOOR);

  // ---- a small lamp on the low table
  const tlamp = unit('table-lamp');
  const tlx = -0.02;
  const tlz = 0.42;
  const tly = FLOOR + 0.38;
  put(
    tlamp,
    lathe(
      [
        [0, 0],
        [0.05, 0],
        [0.052, 0.008],
        [0.016, 0.022],
        [0.012, 0.1],
        [0.02, 0.15],
        [0.008, 0.18],
        [0, 0.18],
      ],
      18,
    ).translate(tlx, tly, tlz),
    glazed(0x7d4a2c),
  );
  put(
    tlamp,
    lathe(
      [
        [0.1, 0.13],
        [0.062, 0.27],
      ],
      20,
    ).translate(tlx, tly, tlz),
    shades,
    false,
  );
  const pendant = v3(tlx, tly + 0.2, tlz);

  // ---- the plant, in a big pot on a saucer: stems, long leaves
  const plant = unit('plant');
  plant.position.set(1.72, FLOOR, 1.86);
  put(
    plant,
    lathe(
      [
        [0, 0],
        [0.16, 0],
        [0.17, 0.012],
        [0.12, 0.016],
        [0.13, 0.28],
        [0.15, 0.3],
        [0.13, 0.3],
        [0.12, 0.28],
        [0, 0.28],
      ],
      24,
    ),
    new THREE.MeshStandardMaterial({ color: 0xa9623c, roughness: 0.9 }),
  );
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f6a3c, roughness: 0.72, side: THREE.DoubleSide });
  const leaves: THREE.BufferGeometry[] = [];
  const stems: THREE.BufferGeometry[] = [];
  const rp = rng(11);
  for (let i = 0; i < 16; i++) {
    const a = i * 2.399;
    const h = 0.55 + 0.75 * rp();
    const out = 0.18 + 0.32 * rp();
    const top = v3(Math.cos(a) * out, 0.28 + h, Math.sin(a) * out);
    const mid = v3(Math.cos(a) * out * 0.35, 0.28 + h * 0.62, Math.sin(a) * out * 0.35);
    stems.push(tubeGeometry([v3(0, 0.28, 0), mid, top], 0.0055, 8, 5));
    // a long leaf that droops from the stem's tip
    const L = 0.28 + 0.14 * rp();
    const W = 0.058 + 0.02 * rp();
    const pos: number[] = [];
    const idx: number[] = [];
    const seg = 7;
    for (let s = 0; s <= seg; s++) {
      const t = s / seg;
      const cx = top.x + Math.cos(a) * L * t;
      const cz = top.z + Math.sin(a) * L * t;
      const cy = top.y + L * 0.3 * t - L * 0.75 * t * t;
      const w = W * Math.sin(Math.PI * Math.min(1, t * 1.02)) ** 0.6;
      pos.push(cx - Math.sin(a) * w, cy, cz + Math.cos(a) * w, cx + Math.sin(a) * w, cy, cz - Math.cos(a) * w);
      if (s < seg) {
        const b = s * 2;
        idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    lg.setIndex(idx);
    lg.computeVertexNormals();
    leaves.push(lg);
  }
  put(plant, joined(stems), new THREE.MeshStandardMaterial({ color: 0x4f5a2d, roughness: 0.85 }));
  put(plant, joined(leaves), leafMat);
  rest('plant', plant, FLOOR);

  // ---- curtains on their rods, either side of each window: the rod ends in two brackets on the wall, the cloth hangs from it
  const curtains = unit('curtains');
  const linen = clothOf(0xc8b58f);
  const folds = (u0: number, u1: number, y0: number, y1: number, depth: number): THREE.BufferGeometry => {
    const nu = 36;
    const nv = 6;
    const pos: number[] = [];
    const idx: number[] = [];
    const uv: number[] = [];
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const y = y0 + (y1 - y0) * v;
      for (let i = 0; i <= nu; i++) {
        const t = i / nu;
        const u = u0 + (u1 - u0) * t;
        const d = depth * (1.1 + 0.9 * Math.sin(t * Math.PI * 12 + v * 0.8));
        pos.push(u, y, d);
        uv.push(t * 2, v * 3);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i;
        idx.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  linen.side = THREE.DoubleSide;
  const rodY = ROOM.windowHead + 0.11;
  const clothGeos: THREE.BufferGeometry[] = [];
  const rods: THREE.BufferGeometry[] = [];
  for (const h of BACK_HOLES) {
    const a = h.u0 - 0.2;
    const b = h.u1 + 0.2;
    const offs = 0.055;
    rods.push(
      stick(v3(a, rodY, ROOM.z0 + offs), v3(b, rodY, ROOM.z0 + offs), 0.009, 8),
      stick(v3(a + 0.04, rodY, ROOM.z0), v3(a + 0.04, rodY, ROOM.z0 + offs), 0.006, 6),
      stick(v3(b - 0.04, rodY, ROOM.z0), v3(b - 0.04, rodY, ROOM.z0 + offs), 0.006, 6),
    );
    for (const [u0, u1] of [
      [a + 0.015, h.u0 + 0.1],
      [h.u1 - 0.1, b - 0.015],
    ]) {
      const g = folds(u0!, u1!, BENCH.height + BENCH.backrestHeight + 0.02, rodY, 0.016);
      g.translate(0, 0, ROOM.z0 + offs);
      clothGeos.push(g);
    }
  }
  for (const h of GABLE_HOLES) {
    const a = h.u0 - 0.2;
    const b = h.u1 + 0.2;
    const offs = 0.055;
    rods.push(
      stick(v3(ROOM.x1 - offs, rodY, a), v3(ROOM.x1 - offs, rodY, b), 0.009, 8),
      stick(v3(ROOM.x1, rodY, a + 0.04), v3(ROOM.x1 - offs, rodY, a + 0.04), 0.006, 6),
      stick(v3(ROOM.x1, rodY, b - 0.04), v3(ROOM.x1 - offs, rodY, b - 0.04), 0.006, 6),
    );
    for (const [u0, u1] of [
      [a + 0.015, h.u0 + 0.1],
      [h.u1 - 0.1, b - 0.015],
    ]) {
      const g = folds(u0!, u1!, BENCH.height + BENCH.backrestHeight + 0.02, rodY, 0.016);
      g.rotateY(-Math.PI / 2);
      g.translate(ROOM.x1 - offs, 0, 0);
      clothGeos.push(g);
    }
  }
  put(curtains, joined(rods), iron);
  put(curtains, joined(clothGeos), linen);

  // ---- on the sills: a pot of herbs, a candle
  const sill = unit('on-the-sills');
  const sillY = ROOM.windowSill;
  const sillZ = ROOM.z0 - 0.03;
  put(
    sill,
    lathe(
      [
        [0, sillY],
        [0.055, sillY],
        [0.07, sillY + 0.09],
        [0.06, sillY + 0.09],
        [0, sillY + 0.08],
      ],
      20,
    ).translate(BACK_HOLES[0]!.u0 + 0.2, 0, sillZ),
    new THREE.MeshStandardMaterial({ color: 0xb06b42, roughness: 0.9 }),
  );
  const herbs: THREE.BufferGeometry[] = [];
  const rh = rng(5);
  for (let i = 0; i < 18; i++) {
    const g = new THREE.IcosahedronGeometry(0.024 + 0.012 * rh(), 0);
    g.translate(BACK_HOLES[0]!.u0 + 0.2 + (rh() - 0.5) * 0.11, sillY + 0.1 + rh() * 0.085, sillZ + (rh() - 0.5) * 0.09);
    herbs.push(g);
  }
  put(sill, joined(herbs), new THREE.MeshStandardMaterial({ color: 0x5c7e43, roughness: 0.85, flatShading: true }));
  const cx = BACK_HOLES[1]!.u1 - 0.22;
  put(
    sill,
    lathe(
      [
        [0, sillY],
        [0.05, sillY],
        [0.052, sillY + 0.01],
        [0.02, sillY + 0.016],
        [0, sillY + 0.016],
      ],
      16,
    ).translate(cx, 0, sillZ),
    brass,
  );
  put(
    sill,
    new THREE.CylinderGeometry(0.019, 0.019, 0.1, 12).translate(cx, sillY + 0.066, sillZ),
    new THREE.MeshStandardMaterial({ color: 0xede2c4, roughness: 0.7 }),
  );

  // ---- pictures with no words: a dark frame, a landscape in three bands
  const pictures = unit('pictures');
  const picture = (x: number, y: number, w: number, h: number, bands: number[]) => {
    const z = ROOM.z0;
    put(pictures, boxAt(x - w / 2, y - h / 2, z, x + w / 2, y + h / 2, z + 0.018), walnut);
    bands.forEach((c, i) => {
      const y0 = y - h / 2 + 0.03 + ((h - 0.06) * i) / bands.length;
      const y1 = y - h / 2 + 0.03 + ((h - 0.06) * (i + 1)) / bands.length;
      put(
        pictures,
        boxAt(x - w / 2 + 0.03, y0, z + 0.018, x + w / 2 - 0.03, y1, z + 0.02),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }),
        false,
      );
    });
  };
  picture(-0.96, 1.42, 0.5, 0.36, [0x5d6b4b, 0x8f9a86, 0xd6c6a0]);
  picture(0.92, 1.42, 0.3, 0.4, [0x4a3c32, 0xa2613a, 0xdcb477]);

  // ---- the clock on the stone wall: a round wooden case, a pale face with marks, two hands: no figures
  const clock = unit('clock');
  const ck = v3(ROOM.x0, 1.86, -0.25);
  const crad = 0.17;
  const caseG = new THREE.CylinderGeometry(crad, crad, 0.04, 40);
  caseG.rotateZ(Math.PI / 2);
  caseG.translate(ck.x + 0.02, ck.y, ck.z);
  put(clock, caseG, walnut);
  const faceG = new THREE.CircleGeometry(crad - 0.016, 40);
  faceG.rotateY(Math.PI / 2);
  faceG.translate(ck.x + 0.0405, ck.y, ck.z);
  put(clock, faceG, new THREE.MeshStandardMaterial({ color: 0xe9e0c8, roughness: 0.65 }), false);
  const marks: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const long = i % 3 === 0;
    const g = new THREE.BoxGeometry(0.001, long ? 0.028 : 0.014, long ? 0.006 : 0.003);
    g.translate(0, crad - 0.04, 0);
    g.rotateX(-a);
    g.translate(ck.x + 0.042, ck.y, ck.z);
    marks.push(g);
  }
  put(clock, joined(marks), new THREE.MeshStandardMaterial({ color: 0x241d16, roughness: 0.7 }), false);
  const hand = (len: number, w: number): THREE.Mesh => {
    const g = new THREE.BoxGeometry(0.002, len, w);
    g.translate(0, len / 2 - 0.012, 0);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1c1712, roughness: 0.55 }));
    m.position.set(ck.x + 0.0445, ck.y, ck.z);
    m.userData.dynamic = true;
    m.userData.keep = true;
    return m;
  };
  const hourHand = hand(0.075, 0.009);
  const minuteHand = hand(0.118, 0.006);
  group.add(hourHand, minuteHand);

  // ---- the tools of the fire, on a stand on the slab, beside the feed
  const tools = unit('fire-tools');
  const tx = -1.42;
  const tz = -1.05;
  put(
    tools,
    lathe(
      [
        [0, 0],
        [0.085, 0],
        [0.09, 0.012],
        [0.02, 0.03],
        [0, 0.03],
      ],
      18,
    ).translate(tx, 0, tz),
    iron,
  );
  put(
    tools,
    joined([
      stick(v3(tx, 0, tz), v3(tx, 0.72, tz), 0.008, 8),
      stick(v3(tx - 0.075, 0.68, tz), v3(tx + 0.075, 0.68, tz), 0.006, 6),
    ]),
    iron,
  );
  put(
    tools,
    joined([
      stick(v3(tx - 0.075, 0.68, tz), v3(tx - 0.075, 0.1, tz + 0.02), 0.0055, 6),
      stick(v3(tx - 0.075, 0.1, tz + 0.02), v3(tx - 0.075, 0.06, tz + 0.06), 0.0055, 6),
    ]),
    iron,
  );
  put(tools, joined([stick(v3(tx + 0.075, 0.68, tz), v3(tx + 0.075, 0.16, tz), 0.006, 6)]), legDark);
  const brush: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 14; i++)
    brush.push(
      stick(
        v3(tx + 0.075 + (i - 7) * 0.003, 0.17, tz + ((i * 7) % 5) * 0.003 - 0.006),
        v3(tx + 0.075 + (i - 7) * 0.006, 0.05, tz + ((i * 3) % 5) * 0.006 - 0.012),
        0.0018,
        4,
      ),
    );
  put(tools, joined(brush), new THREE.MeshStandardMaterial({ color: 0x8d6b3e, roughness: 1 }));
  rest('fire-tools', tools, 0);

  // ---- a stool by the feed, on the slab
  const stool = unit('stool');
  stool.position.set(-1.72, 0, -1.0);
  put(stool, softBox(0, 0.36, 0, 0.3, 0.035, 0.24, 0.012, 2), pale);
  for (const [x, z] of [
    [-0.11, -0.08],
    [0.11, -0.08],
    [-0.11, 0.08],
    [0.11, 0.08],
  ])
    put(stool, new THREE.CylinderGeometry(0.014, 0.018, 0.345, 8).translate(x!, 0.1725, z!), legOak);
  rest('stool', stool, 0);

  // ---- slippers by the door
  const slip = unit('slippers');
  const slipper = (x: number, z: number, rot: number) => {
    const s = new THREE.Group();
    s.position.set(x, FLOOR, z);
    s.rotation.y = rot;
    put(s, softBox(0, 0.014, 0, 0.1, 0.028, 0.27, 0.012, 2), walnut);
    const upper = new THREE.SphereGeometry(0.055, 12, 8);
    upper.scale(0.95, 0.75, 1.5);
    upper.translate(0, 0.04, 0.05);
    put(s, upper, wool(0x8d3b2c));
    slip.add(s);
  };
  slipper(-2.72, 1.3 + 0.32, 1.45);
  slipper(-2.66, 1.3 + 0.48, 1.65);

  // ---- on the warm bench: a folded blanket, a pair of wool socks drying, a sleeping cat on the blanket
  const onBench = unit('on-the-bench');
  const seat = BENCH.height + 0.002;
  const zSeat = ROOM.z0 + BENCH.depth * 0.56;
  const blanketX = -0.72;
  const blanket = [0, 1, 2].map((i) => softBox(blanketX, seat + 0.018 + i * 0.03, zSeat, 0.56, 0.032, 0.42, 0.014, 2));
  put(onBench, joined(blanket), wool(0x8c3f2b));
  // a wool sock lying flat: a leg, a heel, a foot, a ribbed cuff in another colour
  const sockWool = wool(0x35546b);
  const cuffWool = wool(0xc9b48a);
  const socks = (x: number, z: number, rot: number) => {
    const s = new THREE.Group();
    s.position.set(x, seat, z);
    s.rotation.y = rot;
    const path = new THREE.CatmullRomCurve3([
      v3(-0.13, 0, 0),
      v3(-0.03, 0, 0),
      v3(0.015, 0, 0.012),
      v3(0.03, 0, 0.06),
      v3(0.03, 0, 0.14),
    ]);
    const tube = new THREE.TubeGeometry(path, 24, 0.034, 10, false);
    const flat = (g: THREE.BufferGeometry) => {
      g.scale(1, 0.34, 1);
      g.translate(0, 0.012, 0);
      g.computeVertexNormals();
      return g;
    };
    put(s, flat(tube), sockWool);
    const toe = new THREE.SphereGeometry(0.034, 10, 8);
    toe.translate(0.03, 0, 0.14);
    put(s, flat(toe), sockWool);
    const cuff = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12);
    cuff.rotateZ(Math.PI / 2);
    cuff.translate(-0.135, 0, 0);
    put(s, flat(cuff), cuffWool);
    onBench.add(s);
  };
  socks(-0.16, zSeat - 0.06, 0.2);
  socks(-0.13, zSeat + 0.1, -0.1);

  return { group, hourHand, minuteHand, shades, pendant, floorLamp, rests };
}
