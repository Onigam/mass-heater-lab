import * as THREE from 'three';
import { PartRegistry, clamp, damp, rng } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HeaterState } from '../../sim/types';
import { boxAt, joined } from '../common';
import { CORE, FLUE, HOME, HOUSE } from '../dims';
import { GasFlow, type GasNode } from '../fire/gas';
import { Puffs } from '../fire/puffs';
import { FLUE_PIECES, buildFlue } from '../machine/flue';
import { machineMaterials } from '../machine/materials';
import { ductRun, flueRun } from '../machine/paths';
import { mergeStatic } from '../merge';
import { anchor, box, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { buildHouse, houseMaterials, roofY, simpleHouse, type HouseBuild } from './house';
import {
  buildBlock,
  buildBucket,
  buildCoppiceDressing,
  buildInlet,
  buildMeter,
  buildShed,
  buildSweepAccess,
  chimneyMouth,
  type ShedBuild,
} from './props';
import { HELD_HOUR, createSky } from './sky';
import { SNOW, patchSnow } from './snow';
import { buildTerrain, roadZ, terrainHeight } from './terrain';
import { buildVegetation, forestMask, planVegetation, type Vegetation } from './vegetation';

// The `homestead` world: the setting, and the true saving. A small insulated house at a wood's edge in the foothills, January, snow; the chimney above the ridge, which smokes only as the model says (`smokeAtCap`) or steams (`steamAtCap`); the shed with a whole season's wood to scale, beside one day's basket;
// the block, the meter in a log, the ash bucket, a coppice; and across the track a neighbour on a slow fire, whose chimney smokes. The chimney is the very function of `living-room`, moved by one translation. No section, no thermal view: seen from outside, a well-insulated wall on a ramp of 15 to 65 °C is one colour.

export const HOME_PARTS = [
  'house-shell',
  'chimney-cap',
  'sweep-access',
  'outside-air-inlet',
  'woodshed',
  'cordwood-stack',
  'moisture-meter',
  'kindling-block',
  'ash-bucket',
  'coppice-lot',
  'smoky-neighbour',
] as const;
export type HomePart = (typeof HOME_PARTS)[number];

/**
 * How each part is framed: from the open side of the site, whatever the camera was doing before; and on what, where the whole box keeps the camera 70 m away. The chimney's cap is framed with the ridge it stands above. Directions found by
 * rendering each part with and without itself from a grid of directions (`docs/3d.md`).
 */
export const FRAMING: Record<HomePart, PartFraming> = {
  'house-shell': { viewDir: viewFrom(14, 30), frame: box(-7, 0.5, -2.5, 1, 4.5, 3.5) },
  'chimney-cap': { viewDir: viewFrom(30, 30), frame: box(1.5, 4.2, 1.2, 3.4, 5.7, 2.6) },
  'sweep-access': { viewDir: viewFrom(22, 30) },
  'outside-air-inlet': { viewDir: viewFrom(14, 90) },
  woodshed: { viewDir: viewFrom(22, 30) },
  'cordwood-stack': { viewDir: viewFrom(8, 0) },
  'moisture-meter': { viewDir: viewFrom(35, 30) },
  'kindling-block': { viewDir: viewFrom(22, 30) },
  'ash-bucket': { viewDir: viewFrom(22, 30) },
  'coppice-lot': { viewDir: viewFrom(14, 30), frame: box(15, 0, -21, 25, 5, -15) },
  'smoky-neighbour': { viewDir: viewFrom(14, 30), frame: box(-35, 0.6, -14, -29, 8, -8) },
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'house-shell', fr: 'La maison', en: 'The house', goto: 'living-room' },
  { id: 'woodshed', fr: 'Bûcher', en: 'Woodshed' },
  { id: 'smoky-neighbour', fr: 'Le voisin', en: 'Neighbour' },
  { id: 'coppice-lot', fr: 'Taillis', en: 'Coppice', minor: true },
  { id: 'chimney-cap', fr: 'Chapeau de cheminée', en: 'Chimney cap', minor: true },
  { id: 'cordwood-stack', fr: 'Pile de bois fendu', en: 'Split-wood stack', minor: true },
  { id: 'sweep-access', fr: 'Accès du ramoneur', en: 'Sweep’s access', minor: true },
  { id: 'outside-air-inlet', fr: 'Prise d’air extérieure', en: 'Outside air inlet', minor: true },
  { id: 'moisture-meter', fr: 'Humidimètre', en: 'Moisture meter', minor: true },
  { id: 'kindling-block', fr: 'Billot à petit bois', en: 'Kindling block', minor: true },
  { id: 'ash-bucket', fr: 'Seau à cendres', en: 'Ash bucket', minor: true },
];

export const EXPLODE: Record<HomePart, [number, number, number]> = {
  'house-shell': [0, 0, 0],
  'chimney-cap': [0, 1.1, 0],
  'sweep-access': [0, 0.9, 1.1],
  'outside-air-inlet': [0.8, 0, 0],
  woodshed: [0, 2.3, 0],
  'cordwood-stack': [0, 0, 1.3],
  'moisture-meter': [0, 0.45, 0.25],
  'kindling-block': [0.2, 0.3, 0.5],
  'ash-bucket': [0, 0.5, 0],
  'coppice-lot': [0, 0, 0],
  'smoky-neighbour': [0, 0, 0],
};

export interface HomesteadScene extends SceneModule<HeaterState> {
  house: HouseBuild;
  shed: ShedBuild;
  vegetation: Vegetation;
  capSmoke: Puffs;
  capSteam: Puffs;
  neighbourSmoke: Puffs;
  sun: THREE.DirectionalLight;
  /** The chimney as drawn here: its axis on the land, the cap's height. */
  chimney: { x: number; z: number; top: number };
  scenery(): THREE.Object3D[];
  drawn: { snow: number; night: number; sunHour: number; held: boolean };
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Simulated seconds per real second above which the sun holds its hour. */
const CLOCK_FAST = 3000;

export interface HomesteadOptions {
  /** The mean of the outside air, °C: the snow lies below about 4 °C. */
  params?: () => { outsideMean?: number };
}

export function createHomesteadScene(opts: HomesteadOptions = {}): HomesteadScene {
  const scene = new THREE.Scene();
  scene.name = 'homestead';
  scene.userData.look = { exposure: 1.1, ao: true, aoRadius: 0.9 };
  // the kit keeps a landscape's far plane for a world called `site` (docs/kit-requests.md): this one asks for it when it is drawn
  scene.onBeforeRender = (_renderer, _scene, camera) => {
    const c = camera as THREE.PerspectiveCamera;
    if (c.far !== 4500 || c.near !== 0.1) {
      c.near = 0.1;
      c.far = 4500;
      c.updateProjectionMatrix();
    }
  };
  const registry = new PartRegistry();
  const sky = createSky(scene);
  sky.focusShadow(V(2, 0, -2), 40);

  const roots = {} as Record<HomePart, THREE.Group>;
  for (const id of HOME_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
    scene.add(g);
  }

  // ---- the land and the trees
  const terrain = buildTerrain(forestMask);
  scene.add(terrain.mesh);
  const plan = planVegetation();
  const vegetation = buildVegetation(plan);
  scene.add(vegetation.group);

  // ---- the house, in the room's own frame, moved by one translation
  const hm = houseMaterials();
  const house = buildHouse(hm);
  const frame = new THREE.Group();
  frame.name = 'room-frame';
  frame.position.set(HOME.at[0], HOME.at[1], HOME.at[2]);
  frame.add(house.group);
  roots['house-shell'].add(frame);
  mergeStatic(house.group, { name: 'house', scope: 'homestead', colours: false });

  // ---- the chimney, the very function of the other worlds: the cap is a part, the rest goes up through the roof from inside
  const mm = machineMaterials();
  patchSnow(mm.flue, { lo: 0.8, hi: 0.95, gain: 0.6 });
  const flue = buildFlue(mm);
  const chimneyFrame = new THREE.Group();
  chimneyFrame.name = 'chimney-frame';
  chimneyFrame.position.copy(frame.position);
  scene.add(chimneyFrame);
  for (const id of FLUE_PIECES) {
    if (id === 'cap') continue;
    chimneyFrame.add(flue.roots[id]);
  }
  roots['chimney-cap'].position.copy(frame.position);
  roots['chimney-cap'].add(flue.roots.cap);

  // ---- what is on the house
  roots['sweep-access'].position.copy(frame.position);
  roots['sweep-access'].add(buildSweepAccess());
  const inlet = buildInlet(hm);
  inlet.position.set(HOUSE.x1, HOME.at[1] + HOME.inlet.y, CORE.z + 0.5);
  roots['outside-air-inlet'].add(inlet);

  // ---- the wood
  const shed = buildShed(hm, mm);
  roots['woodshed'].add(shed.shed);
  roots['cordwood-stack'].add(shed.stack);
  const block = buildBlock(hm);
  roots['kindling-block'].add(block);
  const meter = buildMeter();
  roots['moisture-meter'].add(meter.group);
  roots['ash-bucket'].add(buildBucket(hm));

  // ---- the coppice
  const dressing = buildCoppiceDressing(hm, terrainHeight);
  roots['coppice-lot'].add(dressing, vegetation.stools.parent!);

  // ---- the neighbour: the same materials, smaller, a big chimney
  const N = HOME.neighbour;
  const nh = new THREE.Group();
  nh.name = 'neighbour-house';
  const body = simpleHouse(houseMaterials(), N.length, N.width, N.wallH, N.roofH, 3, false);
  nh.add(body);
  nh.position.set(N.x, 0.6, N.z);
  nh.rotation.y = N.yaw;
  const stonework = patchSnow(new THREE.MeshStandardMaterial({ color: 0x77706a, roughness: 0.95 }), {
    lo: 0.7,
    hi: 0.95,
  });
  const nc = new THREE.Mesh(
    joined([
      boxAt(N.length * 0.2 - 0.32, N.wallH, -0.32, N.length * 0.2 + 0.32, N.chimneyH, 0.32),
      boxAt(N.length * 0.2 - 0.37, N.chimneyH - 0.12, -0.37, N.length * 0.2 + 0.37, N.chimneyH, 0.37),
    ]),
    stonework,
  );
  nc.castShadow = true;
  nh.add(nc);
  roots['smoky-neighbour'].add(nh);
  mergeStatic(nh, { name: 'neighbour', scope: 'homestead', colours: false });

  // ---- a hamlet further down the road, and a line of posts along it: scenery
  const hamlet = new THREE.Group();
  hamlet.name = 'hamlet';
  const hr = rng(8);
  const hm2 = houseMaterials();
  for (const [x, z, yaw, L, Wd] of [
    [-58, 44, 0.1, 11, 7.5],
    [-82, 38, -0.2, 9.5, 7],
    [88, 41, 0.15, 12, 8],
    [104, 52, -0.05, 9, 7],
    [-120, 56, 0.2, 10, 7.5],
  ] as const) {
    const h = simpleHouse(hm2, L, Wd, 3.0 + hr(), 2.0 + hr() * 0.4, Math.floor(hr() * 8));
    h.position.set(x, terrainHeight(x, z), z);
    h.rotation.y = yaw;
    hamlet.add(h);
  }
  const posts: THREE.BufferGeometry[] = [];
  for (let x = -36; x <= 38; x += 3.2) {
    if (Math.abs(x - 0.6) < 2.2) continue;
    const z = roadZ(x) - 3.4;
    const y = terrainHeight(x, z);
    posts.push(boxAt(x - 0.05, y - 0.1, z - 0.05, x + 0.05, y + 1.05, z + 0.05));
  }
  const postM = new THREE.Mesh(joined(posts), hm.timber);
  postM.castShadow = true;
  hamlet.add(postM);
  scene.add(hamlet);
  mergeStatic(hamlet, { name: 'hamlet', scope: 'homestead', colours: false });

  for (const id of [
    'chimney-cap',
    'woodshed',
    'kindling-block',
    'ash-bucket',
    'outside-air-inlet',
    'sweep-access',
  ] as const)
    mergeStatic(roots[id], { name: id, scope: 'homestead', colours: false });
  mergeStatic(chimneyFrame, { name: 'chimney', scope: 'homestead', colours: false });

  // ---- what leaves the chimneys
  const capAt = V(FLUE.x + HOME.at[0], FLUE.top + HOME.at[1] + FLUE.capH * 0.5, FLUE.z + HOME.at[2]);
  const capSmoke = new Puffs({
    count: 42,
    color: 0x8d8b88,
    from: capAt,
    life: 9,
    rise: 9,
    drift: [7, -2.2],
    r0: 0.18,
    r1: 2.1,
    spread: 2.6,
    opacity: 0.5,
    renderOrder: 10,
  });
  const capSteam = new Puffs({
    count: 34,
    color: 0xf0efea,
    from: capAt,
    life: 5,
    rise: 4.4,
    drift: [3, -1],
    r0: 0.12,
    r1: 1.0,
    spread: 1.0,
    opacity: 0.36,
    renderOrder: 10,
  });
  const nFrom = chimneyMouth();
  const neighbourSmoke = new Puffs({
    count: 52,
    color: 0x77746f,
    from: nFrom,
    life: 14,
    rise: 15,
    drift: [14, -4],
    r0: 0.34,
    r1: 3.8,
    spread: 4.5,
    opacity: 0.62,
    renderOrder: 10,
  });
  scene.add(capSmoke.mesh, capSteam.mesh, neighbourSmoke.mesh);

  // ---- « Flux »: the air the fire draws comes in by the inlet, the gases go up the chimney and away: at the model's speeds and in the model's direction
  const inletY = HOME.at[1] + HOME.inlet.y;
  const inletZ = CORE.z + 0.5;
  const A = Math.PI * FLUE.r * FLUE.r;
  // at this distance the dots must be seen: larger, and also on the way through the house, the duct under the bench and up the chimney, as the machine lies inside (they draw over the walls)
  const gas = new GasFlow(150, 8);
  const inHouse = (nodes: GasNode[]): GasNode[] => nodes.map((n) => ({ ...n, p: n.p.clone().add(V(...HOME.at)) }));
  gas.addRun(inHouse(ductRun()), 46);
  gas.addRun(inHouse(flueRun()), 24);
  gas.addRun(
    [
      { p: V(HOUSE.x1 + 3.2, inletY - 0.2, inletZ + 0.8), st: 0, A: A * 1.6, h: 0.2 },
      { p: V(HOUSE.x1 + 0.1, inletY, inletZ), st: 0, A: A * 1.6, h: 0.05 },
    ],
    22,
  );
  gas.addRun(
    [
      { p: V(capAt.x, HOUSE.ridge + HOME.at[1] - 0.8, capAt.z), st: 10.2, A, h: FLUE.r },
      { p: V(capAt.x, FLUE.top + HOME.at[1], capAt.z), st: 11, A, h: FLUE.r },
      { p: V(capAt.x + 1.6, FLUE.top + HOME.at[1] + 2.4, capAt.z - 0.5), st: 11, A: A * 3, h: 0.3 },
    ],
    30,
  );
  scene.add(gas.group);

  // ---- labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: HomePart, x: number, y: number, z: number) => {
    anchors[id] = anchor(roots[id], x, y, z, `${id}-label`);
  };
  const S = HOME.woodshed;
  at('house-shell', -1.2, HOUSE.ridge + HOME.at[1] - 0.1, (HOUSE.z0 + HOUSE.z1) / 2);
  at('chimney-cap', FLUE.x, FLUE.top + FLUE.capH, FLUE.z);
  const yRoof = roofY(FLUE.z + 0.9);
  at('sweep-access', FLUE.x - 0.5, yRoof + 0.2, FLUE.z + 0.9);
  at('outside-air-inlet', HOUSE.x1 + 0.1, HOME.at[1] + HOME.inlet.y + 0.12, CORE.z + 0.5);
  at('woodshed', S.x + 0.8, S.wallH * 0.5, S.z + S.depth / 2 + 0.4);
  at('cordwood-stack', S.x - 1.2, 1.1, S.z + 0.3);
  at('moisture-meter', HOME.block.x + 0.4, 0.2, HOME.block.z + 0.46);
  at('kindling-block', HOME.block.x, HOME.block.h + 0.2, HOME.block.z);
  at('ash-bucket', HOME.bucket.x, 0.5, HOME.bucket.z);
  at(
    'coppice-lot',
    HOME.coppice.x - HOME.coppice.width / 2 + 1.5,
    terrainHeight(HOME.coppice.x, HOME.coppice.z) + 4.2,
    HOME.coppice.z,
  );
  at('smoky-neighbour', N.x, 0.6 + N.wallH + N.roofH + 0.4, N.z);

  for (const id of HOME_PARTS) registry.add(id, roots[id], V(...EXPLODE[id]), undefined, FRAMING[id]);

  const drawn = { snow: 1, night: 0, sunHour: HELD_HOUR, held: false };
  let fast = false;
  let clockReal = 0;
  let clockSim = 0;
  let sunHour = 11;

  const mod: HomesteadScene = {
    id: 'homestead',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    house,
    shed,
    vegetation,
    capSmoke,
    capSteam,
    neighbourSmoke,
    sun: sky.sun,
    chimney: { x: capAt.x, z: capAt.z, top: FLUE.top + HOME.at[1] },
    scenery: () => [terrain.mesh, chimneyFrame],
    drawn,
    home: { position: V(26, 12.5, 40), target: V(-1, 2.6, -3) },
    minDistance: 1.2,
    maxDistance: 190,
    homePadding: 0.56,
    declutter: true,
    update(s, dt, view) {
      // ---- the sun: it holds its hour at a fast clock, follows the slider and the slow clock
      clockReal += dt;
      if (clockReal >= 1) {
        const rate = (s.simTime - clockSim) / clockReal;
        if (rate >= 0) fast = rate > CLOCK_FAST;
        clockReal = 0;
        clockSim = s.simTime;
      }
      const want = fast ? HELD_HOUR : s.hour;
      sunHour = Math.abs(want - sunHour) > 6 ? want : damp(sunHour, want, 2, Math.min(dt, 0.1));
      drawn.held = fast;
      drawn.sunHour = sunHour;
      sky.update(sunHour, view.time, 15, fast);
      drawn.night = sky.night;

      // ---- the windows glow when the light goes
      const nightGlow = clamp(sky.night * 1.4, 0, 1);
      house.glass.emissiveIntensity = nightGlow * 1.5;

      // ---- the snow lies below about 4 °C of mean air
      const mean = opts.params?.().outsideMean ?? 2;
      drawn.snow = clamp((9 - mean) / 5, 0, 1);
      SNOW.value = drawn.snow;

      // ---- what leaves the chimney is the model's: smoke is unburned fuel, steam is only water
      capSmoke.update(s.smokeAtCap, dt, view.slowMo);
      capSteam.update(s.steamAtCap * 0.9, dt, view.slowMo);
      // the neighbour's slow fire smokes all day: a contrast, decoration in its amount
      neighbourSmoke.update(0.9, dt, view.slowMo);

      // ---- the season's wood goes down as the model burns it (the top row first)
      const left = clamp(1 - s.woodTotal / 1900, 0.02, 1);
      const n = Math.floor(shed.capacity * left);
      for (const m of shed.logs) m.count = n;

      gas.update(s, dt, view.slowMo, view.schematic);
      gas.beads.visible = false;

      // ---- the meter's little screen, faint: no word
      meter.screen.emissiveIntensity = 0.25 + 0.15 * (1 - sky.night);
    },
  };
  return mod;
}
