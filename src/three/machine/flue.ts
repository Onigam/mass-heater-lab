import * as THREE from 'three';
import { TAU, boxAt, joined, lathe, stick, uvMetric, v3 } from '../common';
import { BENCH, DUCT, FLUE, ROOM } from '../dims';
import type { MachineMaterials } from './materials';
import { tubeAlong } from './bench';

// The chimney, one function, in the room frame: the tee where the duct meets it, the foot with its cleanout and its drain, the double-wall flue with its bands, the crossing of the ceiling, the brackets on the gable and the cap.
// `living-room`, `bench-section` and `homestead` call it and register what is theirs.

export const FLUE_PIECES = ['tee', 'foot-cap', 'drain', 'indoor', 'upper', 'crossing', 'cap'] as const;
export type FluePiece = (typeof FLUE_PIECES)[number];

export interface FlueBuild {
  roots: Record<FluePiece, THREE.Group>;
}

const O = FLUE.outerR;

export function buildFlue(mats: MachineMaterials): FlueBuild {
  const roots = {} as Record<FluePiece, THREE.Group>;
  for (const id of FLUE_PIECES) {
    const g = new THREE.Group();
    g.name = `flue-${id}`;
    roots[id] = g;
  }
  const put = (id: FluePiece, geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    roots[id].add(m);
    return m;
  };
  const x = FLUE.x;
  const z = FLUE.z;
  const cyl = (y0: number, y1: number, r: number, seg = 28) => stick(v3(x, y0, z), v3(x, y1, z), r, seg, false);
  const collar = (y: number, r: number, h = 0.03) =>
    lathe(
      [
        [r, y - h / 2],
        [r + 0.004, y - h / 2 + 0.004],
        [r + 0.004, y + h / 2 - 0.004],
        [r, y + h / 2],
      ],
      28,
    ).translate(x, 0, z);

  // ---- the tee: a body round the flue's axis, a branch to the duct, its band
  const teeTop = FLUE.teeY + 0.17;
  const branch = [v3(x, FLUE.teeY, BENCH.casingEndZ), v3(x, FLUE.teeY, z - FLUE.r * 0.9)];
  put(
    'tee',
    joined([
      cyl(FLUE.footY + 0.1, teeTop, FLUE.r + 0.006),
      tubeAlong(branch, DUCT.r + 0.002, 24),
      collar(teeTop, FLUE.r + 0.006),
      collar(FLUE.footY + 0.1, FLUE.r + 0.006),
      stick(v3(x, FLUE.teeY, z - 0.17), v3(x, FLUE.teeY, z - 0.115), DUCT.collarR, 24),
    ]),
    mats.duct,
  );
  // ---- the foot under the tee, a removable cup with its handle, standing on a small stone block
  put(
    'foot-cap',
    joined([
      cyl(FLUE.footY + 0.015, FLUE.footY + 0.1, FLUE.capR),
      lathe(
        [
          [0.0, FLUE.footY + 0.015],
          [FLUE.capR, FLUE.footY + 0.015],
        ],
        28,
      ).translate(x, 0, z),
      stick(
        v3(x - 0.05, FLUE.footY + 0.06, z + FLUE.capR + 0.015),
        v3(x + 0.05, FLUE.footY + 0.06, z + FLUE.capR + 0.015),
        0.006,
        8,
      ),
      stick(
        v3(x - 0.05, FLUE.footY + 0.06, z + FLUE.capR),
        v3(x - 0.05, FLUE.footY + 0.06, z + FLUE.capR + 0.015),
        0.005,
        8,
      ),
      stick(
        v3(x + 0.05, FLUE.footY + 0.06, z + FLUE.capR),
        v3(x + 0.05, FLUE.footY + 0.06, z + FLUE.capR + 0.015),
        0.005,
        8,
      ),
    ]),
    mats.steelDark,
  );
  put('foot-cap', boxAt(x - 0.16, 0, z - 0.16, x + 0.16, FLUE.footY + 0.015, z + 0.16), mats.concrete);

  // ---- the drain: a small pipe from the lowest point of the tee, a valve, a jar on the slab
  const dy = FLUE.drainY;
  const dx0 = x - FLUE.capR;
  const dx1 = x - FLUE.capR - 0.12;
  put(
    'drain',
    joined([
      stick(v3(dx0, dy, z), v3(dx1, dy, z), 0.0075, 10),
      stick(v3(dx1, dy, z), v3(dx1, dy - 0.022, z), 0.0075, 10),
      stick(v3(dx0 - 0.05, dy, z), v3(dx0 - 0.05, dy + 0.028, z), 0.0045, 8),
      stick(v3(dx0 - 0.075, dy + 0.03, z), v3(dx0 - 0.025, dy + 0.03, z), 0.0045, 8),
    ]),
    mats.steel,
  );
  put(
    'drain',
    uvMetric(
      lathe(
        [
          [0, 0.0],
          [0.032, 0],
          [0.034, 0.008],
          [0.034, dy - 0.04],
          [0.024, dy - 0.03],
          [0.024, dy - 0.024],
          [0, dy - 0.024],
        ],
        18,
      ).translate(dx1, 0, z),
    ),
    mats.gasket,
  );

  // ---- the flue, indoors, from the tee to the crossing, then outdoors to the cap; the same outer skin, bands every metre; its inner tube shows in a section
  const h = ROOM.height;
  const indoorTop = h + FLUE.crossingH;
  const bands = (y0: number, y1: number): THREE.BufferGeometry[] => {
    const out: THREE.BufferGeometry[] = [];
    for (let y = Math.ceil(y0); y < y1; y += 1) out.push(collar(y, O));
    return out;
  };
  put('indoor', cyl(teeTop, indoorTop, O), mats.flue);
  put('indoor', cyl(teeTop, indoorTop, FLUE.r, 24), mats.flueInside);
  put(
    'indoor',
    joined([
      lathe(
        [
          [FLUE.r, teeTop],
          [O, teeTop],
        ],
        28,
      ).translate(x, 0, z),
      ...bands(teeTop, indoorTop),
    ]),
    mats.flueBand,
  );
  put('upper', cyl(indoorTop, FLUE.top, O), mats.flue);
  put('upper', cyl(indoorTop, FLUE.top, FLUE.r, 24), mats.flueInside);
  put('upper', joined(bands(indoorTop, FLUE.top)), mats.flueBand);

  // ---- brackets to the gable
  const brackets: THREE.BufferGeometry[] = [];
  for (const y of FLUE.brackets) {
    const ring = new THREE.TorusGeometry(O + 0.008, 0.008, 8, 28);
    ring.rotateX(Math.PI / 2);
    ring.translate(x, y, z);
    brackets.push(
      ring,
      stick(v3(x + O, y, z), v3(ROOM.x1 + 0.01, y, z), 0.012, 8),
      boxAt(ROOM.x1 - 0.004, y - 0.05, z - 0.05, ROOM.x1 + 0.006, y + 0.05, z + 0.05),
    );
  }
  put('upper', joined(brackets), mats.steelDark);

  // ---- the crossing: a boxed trim under the ceiling, a plate, the fire-stop above it. It touches the gable's wall
  const c = FLUE.crossingHalf;
  const y0 = h - 0.02;
  const y1 = indoorTop;
  const xMax = ROOM.x1;
  put(
    'crossing',
    joined([
      // the trim: a ring of steel under the ceiling
      boxAt(x - c, y0, z - c, xMax, y0 + 0.012, z - O),
      boxAt(x - c, y0, z + O, xMax, y0 + 0.012, z + c),
      boxAt(x - c, y0, z - O, x - O, y0 + 0.012, z + O),
      boxAt(x + O, y0, z - O, xMax, y0 + 0.012, z + O),
    ]),
    mats.flueBand,
  );
  // the mineral fill and its box, above the ceiling: a section shows it
  put(
    'crossing',
    joined([
      boxAt(x - c + 0.02, y0 + 0.012, z - c + 0.02, xMax, y1 - 0.02, z - O),
      boxAt(x - c + 0.02, y0 + 0.012, z + O, xMax, y1 - 0.02, z + c - 0.02),
      boxAt(x - c + 0.02, y0 + 0.012, z - O, x - O, y1 - 0.02, z + O),
      boxAt(x + O, y0 + 0.012, z - O, xMax, y1 - 0.02, z + O),
    ]),
    mats.insulation,
  );
  put(
    'crossing',
    joined([
      boxAt(x - c, y1 - 0.02, z - c, xMax, y1 - 0.008, z - O),
      boxAt(x - c, y1 - 0.02, z + O, xMax, y1 - 0.008, z + c),
      boxAt(x - c, y1 - 0.02, z - O, x - O, y1 - 0.008, z + O),
      boxAt(x + O, y1 - 0.02, z - O, xMax, y1 - 0.008, z + O),
    ]),
    mats.steelDark,
  );

  // ---- the cap: a cone on three legs, over a collar: the top of the flue reaches it
  const top = FLUE.top;
  const capY = top + 0.12;
  const capParts: THREE.BufferGeometry[] = [
    lathe(
      [
        [0, capY + FLUE.capH * 0.5],
        [O + FLUE.capOut, capY],
        [O + FLUE.capOut, capY - 0.015],
        [O + FLUE.capOut - 0.008, capY - 0.015],
        [0, capY + FLUE.capH * 0.5 - 0.01],
      ],
      28,
    ).translate(x, 0, z),
    lathe(
      [
        [O + 0.004, top - 0.05],
        [O + 0.008, top - 0.05],
        [O + 0.008, top + 0.006],
        [FLUE.r - 0.002, top + 0.006],
        [FLUE.r - 0.002, top - 0.01],
      ],
      28,
    ).translate(x, 0, z),
  ];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    capParts.push(
      stick(
        v3(x + Math.cos(a) * (O - 0.015), top, z + Math.sin(a) * (O - 0.015)),
        v3(x + Math.cos(a) * (O + 0.03), capY, z + Math.sin(a) * (O + 0.03)),
        0.005,
        6,
      ),
    );
  }
  put('cap', joined(capParts), mats.flue);
  return { roots };
}

/** The dial on the flue: a round steel case, a pale face, ticks; its needle turns with the flue's temperature. The case's back touches the flue's skin. No figure on it. */
export interface Dial {
  group: THREE.Group;
  needle: THREE.Mesh;
  backZ: number;
}

export function buildDial(mats: MachineMaterials, r = 0.042): Dial {
  const group = new THREE.Group();
  group.name = 'dial';
  const body = new THREE.Mesh(
    joined([stick(v3(0, 0, -0.012), v3(0, 0, 0.012), r, 28), stick(v3(0, 0, -0.03), v3(0, 0, -0.012), 0.012, 10)]),
    mats.steelDark,
  );
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xece4d0, roughness: 0.7 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(r - 0.005, 28), faceMat);
  face.position.z = 0.0125;
  const ticks: THREE.BufferGeometry[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = ((-135 + (i / 12) * 270) * Math.PI) / 180;
    const k = i % 3 === 0 ? 0.012 : 0.006;
    const g = new THREE.BoxGeometry(0.0016, k, 0.0006);
    g.translate(0, r - 0.009 - k / 2, 0);
    g.rotateZ(-a);
    g.translate(0, 0, 0.0132);
    ticks.push(g);
  }
  const tickMesh = new THREE.Mesh(joined(ticks), new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 0.7 }));
  const needleGeo = new THREE.BoxGeometry(0.0022, r * 0.8, 0.0008);
  needleGeo.translate(0, r * 0.32, 0);
  const needle = new THREE.Mesh(needleGeo, new THREE.MeshStandardMaterial({ color: 0xa8291c, roughness: 0.5 }));
  needle.position.z = 0.0142;
  needle.userData.dynamic = true;
  group.add(body, face, tickMesh, needle);
  for (const o of [body, face, tickMesh, needle]) {
    o.castShadow = true;
    o.receiveShadow = true;
  }
  return { group, needle, backZ: -0.03 };
}
