import * as THREE from 'three';
import { emissive, rng } from '@onigam/lab-kit/three';
import { boxAt, joined, lathe, softBox, stick, v3 } from '../common';
import { BENCH, CORE, ITEMS, ROOM, SHIELD } from '../dims';
import type { MachineMaterials } from '../machine/materials';
import { clothMap, knitMap, tiled } from '../textures';

// The parts of `living-room` that are not the machine's: the shield on its spacers, the kettle on the drum's lid, the day's basket on the slab, the two alarms, the grille, the cushions. All from `ITEMS` and `SHIELD`, in the room frame.

export function buildShield(mats: MachineMaterials): THREE.Group {
  const g = new THREE.Group();
  g.name = 'heat-shield';
  const z = ROOM.z0 + SHIELD.gap;
  const sheet = new THREE.Mesh(boxAt(SHIELD.x0, SHIELD.y0, z, SHIELD.x1, SHIELD.y1, z + SHIELD.t), mats.steel.clone());
  sheet.castShadow = true;
  sheet.receiveShadow = true;
  g.add(sheet);
  // the spacers that hold the gap: each one from the wall to the sheet
  const sp: THREE.BufferGeometry[] = [];
  for (const x of [SHIELD.x0 + 0.08, (SHIELD.x0 + SHIELD.x1) / 2, SHIELD.x1 - 0.08])
    for (const y of [SHIELD.y0 + 0.1, (SHIELD.y0 + SHIELD.y1) / 2, SHIELD.y1 - 0.08]) {
      sp.push(stick(v3(x, y, ROOM.z0), v3(x, y, z + SHIELD.t + 0.003), 0.008, 8));
      sp.push(stick(v3(x, y, z + SHIELD.t), v3(x, y, z + SHIELD.t + 0.006), 0.013, 8));
    }
  const m = new THREE.Mesh(joined(sp), mats.steelDark.clone());
  m.castShadow = true;
  g.add(m);
  return g;
}

/** The kettle: its foot on the drum's lid, a spout, a bail handle, a knob. */
export function buildKettle(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'kettle';
  const k = ITEMS.kettle;
  const y = CORE.drumTop + 0.002;
  const enamel = new THREE.MeshStandardMaterial({ color: 0x3c5560, roughness: 0.34, metalness: 0.12 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.55, metalness: 0.55 });
  const body = lathe(
    [
      [0, 0],
      [k.r * 0.72, 0],
      [k.r * 0.94, 0.012],
      [k.r, k.h * 0.34],
      [k.r * 0.9, k.h * 0.74],
      [k.r * 0.6, k.h * 0.94],
      [k.r * 0.58, k.h],
      [0, k.h],
    ],
    32,
  );
  const lid = lathe(
    [
      [k.r * 0.56, k.h],
      [k.r * 0.5, k.h + 0.012],
      [0.012, k.h + 0.016],
      [0.012, k.h + 0.028],
      [0.018, k.h + 0.034],
      [0, k.h + 0.038],
    ],
    20,
  );
  const spout = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      v3(k.r * 0.86, k.h * 0.3, 0),
      v3(k.r * 1.2, k.h * 0.52, 0),
      v3(k.r * 1.36, k.h * 0.82, 0),
    ]),
    10,
    0.012,
    10,
    false,
  );
  const handle = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      v3(-k.r * 0.6, k.h * 0.94, 0),
      v3(-k.r * 0.54, k.h * 1.44, 0),
      v3(0, k.h * 1.68, 0),
      v3(k.r * 0.54, k.h * 1.44, 0),
      v3(k.r * 0.6, k.h * 0.94, 0),
    ]),
    22,
    0.005,
    8,
    false,
  );
  const e = new THREE.Mesh(joined([body, lid, spout]), enamel);
  const h = new THREE.Mesh(handle, iron);
  e.castShadow = h.castShadow = true;
  e.receiveShadow = h.receiveShadow = true;
  g.add(e, h);
  g.position.set(k.x, y, k.z);
  g.rotation.y = -0.6;
  return g;
}

/** The day's wood: a wicker basket on the slab, full of split sticks whose ends show their rings. */
export function buildBasket(mats: MachineMaterials): THREE.Group {
  const g = new THREE.Group();
  g.name = 'wood-basket';
  const b = ITEMS.basket;
  const wicker = new THREE.MeshStandardMaterial({ color: 0x9c7443, map: tiled(knitMap(), 3, 4), roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x6d4d2c, roughness: 0.9 });
  const body = lathe(
    [
      [0, 0],
      [b.r * 0.82, 0],
      [b.r * 0.9, 0.01],
      [b.r, b.h],
      [b.r - 0.012, b.h],
      [b.r * 0.86, 0.022],
      [0, 0.022],
    ],
    36,
  );
  const rim = new THREE.TorusGeometry(b.r, 0.012, 10, 44);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, b.h, 0);
  const handles: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    const h = new THREE.TorusGeometry(0.05, 0.007, 8, 18, Math.PI);
    h.translate(s * (b.r + 0.002), b.h, 0);
    h.rotateY(0);
    handles.push(h);
  }
  const wall = new THREE.Mesh(body, wicker);
  const trim = new THREE.Mesh(joined([rim, ...handles]), dark);
  wall.castShadow = trim.castShadow = true;
  wall.receiveShadow = true;
  g.add(wall, trim);
  // split sticks: lying in the basket, the higher ones shorter, each a cut log of five sides
  const r = rng(77);
  const bark: THREE.BufferGeometry[] = [];
  const ends: THREE.BufferGeometry[] = [];
  const n = 15;
  for (let i = 0; i < n; i++) {
    const layer = Math.floor(i / 5);
    const angle = 0.1 + r() * 0.2 + (layer % 2) * 0.05;
    const rr = 0.026 + r() * 0.016;
    const L = 0.3 + 0.1 * r();
    const y = 0.05 + layer * 0.052 + rr;
    const off = ((i % 5) - 2) * 0.073 + (r() - 0.5) * 0.008;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, Math.PI / 2 + (r() - 0.5) * 0.1));
    const c = v3(0, y, off).applyEuler(new THREE.Euler(0, angle * 0.3, 0));
    const m = new THREE.Matrix4().compose(c, q, v3(rr, L, rr * (0.8 + 0.3 * r())));
    const log = new THREE.CylinderGeometry(1, 1, 1, 7, 1, true);
    log.applyMatrix4(m);
    bark.push(log);
    for (const s of [-0.5, 0.5]) {
      const end = new THREE.CircleGeometry(1, 7);
      end.rotateX(s > 0 ? -Math.PI / 2 : Math.PI / 2);
      end.translate(0, s, 0);
      end.applyMatrix4(m);
      ends.push(end);
    }
  }
  const logs = new THREE.Mesh(
    joined(bark),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: mats.bark.map, roughness: 0.96 }),
  );
  const faces = new THREE.Mesh(joined(ends), mats.endGrain.clone());
  logs.castShadow = faces.castShadow = true;
  logs.receiveShadow = faces.receiveShadow = true;
  g.add(logs, faces);
  g.position.set(b.x, 0, b.z);
  return g;
}

/** A round white alarm on the wall, its back on the plaster; `led` shows green at rest, red when the model's CO would set it off. */
export function buildCoAlarm(): { group: THREE.Group; led: THREE.MeshStandardMaterial } {
  const g = new THREE.Group();
  g.name = 'co-alarm';
  const a = ITEMS.coAlarm;
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.58 });
  const body = lathe(
    [
      [0, 0],
      [a.r, 0],
      [a.r, 0.012],
      [a.r * 0.94, 0.024],
      [a.r * 0.8, 0.028],
      [0, 0.028],
    ],
    32,
  );
  body.rotateX(Math.PI / 2);
  // the slots the air comes in by, in a disc on its face, a test button under them
  const slots: THREE.BufferGeometry[] = [];
  for (let i = -3; i <= 3; i++) {
    const half = Math.sqrt(Math.max(0, 0.034 * 0.034 - (i * 0.0095) ** 2));
    slots.push(boxAt(i * 0.0095 - 0.0028, -half + 0.008, 0.0278, i * 0.0095 + 0.0028, half + 0.008, 0.0292));
  }
  const m = new THREE.Mesh(body, white);
  m.castShadow = true;
  const grid = new THREE.Mesh(joined(slots), new THREE.MeshStandardMaterial({ color: 0x6f6d66, roughness: 0.7 }));
  const button = new THREE.Mesh(
    stick(v3(0, -0.04, 0.026), v3(0, -0.04, 0.0305), 0.0085, 14),
    new THREE.MeshStandardMaterial({ color: 0xc8c4b8, roughness: 0.5 }),
  );
  g.add(button);
  const led = emissive(0x38c060, 1.2);
  led.userData.noShare = true;
  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 10, 8), led);
  ledMesh.position.set(0.024, -0.04, 0.026);
  ledMesh.userData.dynamic = true;
  g.add(m, grid, ledMesh);
  g.position.set(a.x, a.y, ROOM.z0);
  return { group: g, led };
}

/** The smoke alarm: under the beam, its plate against it. */
export function buildSmokeAlarm(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'smoke-alarm';
  const s = ITEMS.smokeAlarm;
  const white = new THREE.MeshStandardMaterial({ color: 0xedeae0, roughness: 0.6 });
  const y = ROOM.height - ROOM.beamH;
  const body = lathe(
    [
      [0, y],
      [s.r, y],
      [s.r, y - 0.012],
      [s.r * 0.86, y - 0.028],
      [s.r * 0.36, y - 0.038],
      [0, y - 0.038],
    ],
    32,
  );
  const m = new THREE.Mesh(body, white);
  m.castShadow = true;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), emissive(0xd64030, 0.8));
  led.position.y = y - 0.036;
  led.position.x = 0.018;
  g.add(m, led);
  g.position.set(s.x, 0, s.z);
  return g;
}

/** The grille: a frame and louvres on the back wall, a short sleeve into it. */
export function buildGrille(mats: MachineMaterials): THREE.Group {
  const g = new THREE.Group();
  g.name = 'ventilation-grille';
  const a = ITEMS.grille;
  const z = ROOM.z0;
  const w = a.w / 2;
  const h = a.h / 2;
  const painted = new THREE.MeshStandardMaterial({ color: 0xd8d3c6, roughness: 0.55, metalness: 0.15 });
  const parts: THREE.BufferGeometry[] = [
    boxAt(-w, -h, z, w, -h + 0.016, z + 0.014),
    boxAt(-w, h - 0.016, z, w, h, z + 0.014),
    boxAt(-w, -h, z, -w + 0.016, h, z + 0.014),
    boxAt(w - 0.016, -h, z, w, h, z + 0.014),
  ];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const y = -h + 0.03 + ((a.h - 0.06) * i) / (n - 1);
    const l = boxAt(-w + 0.016, y - 0.008, z + 0.002, w - 0.016, y + 0.008, z + 0.01);
    parts.push(l);
  }
  const m = new THREE.Mesh(joined(parts), painted);
  m.castShadow = true;
  const dark = new THREE.Mesh(
    boxAt(-w + 0.016, -h + 0.016, z - 0.012, w - 0.016, h - 0.016, z + 0.0005),
    mats.ductInside.clone(),
  );
  g.add(m, dark);
  g.position.set(a.x, a.y, 0);
  return g;
}

/** Three cushions on the warm seat, their cloth « heat-tolerant » as the draft says: plump, standing on the seat and leaning back on the backrest. */
export function buildCushions(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'bench-cushion';
  const cloth = clothMap();
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0xa8552e, map: tiled(cloth, 1 / 0.16), roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xcdb27c, map: tiled(cloth, 1 / 0.16), roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x51685a, map: tiled(cloth, 1 / 0.16), roughness: 1 }),
  ];
  const W = 0.42;
  const Ht = 0.36;
  const T = 0.11;
  ITEMS.cushions.forEach(([x, z, yaw], i) => {
    const c = softBox(0, Ht / 2, 0, W, Ht, T, 0.05, 4);
    const p = c.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const u = p.getX(k) / (W / 2);
      const v = (p.getY(k) - Ht / 2) / (Ht / 2);
      const puff = 1 + 0.9 * (1 - u * u) * (1 - v * v);
      p.setZ(k, p.getZ(k) * puff);
      // the corners draw in, as a sewn cushion's do
      const corner = Math.abs(u) * Math.abs(v);
      p.setX(k, p.getX(k) * (1 - 0.05 * corner));
      p.setY(k, Ht / 2 + (p.getY(k) - Ht / 2) * (1 - 0.05 * corner));
    }
    c.computeVertexNormals();
    const holder = new THREE.Group();
    // its foot on the seat; the `yaw` turns it to face the room along its own leg
    holder.position.set(x, BENCH.height + 0.002, z);
    holder.rotation.y = yaw;
    const m = new THREE.Mesh(c, mats[i]!);
    // leaning back on the backrest
    m.rotation.x = -0.32;
    m.castShadow = true;
    m.receiveShadow = true;
    holder.add(m);
    g.add(holder);
  });
  return g;
}
