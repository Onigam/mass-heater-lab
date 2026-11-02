import * as THREE from 'three';
import { damp } from '@onigam/lab-kit/three';
import { MODEL } from '../../sim/machine';
import type { HeaterState } from '../../sim/types';
import { smoothstep, softDotTexture } from '../common';
import { applyWear, contactShadow } from '../detail';
import { BENCH, CORE, ITEMS, ROOM } from '../dims';
import { Flame, fireFlicker } from '../fire/flame';
import { GasFlow } from '../fire/gas';
import { Puffs } from '../fire/puffs';
import { buildMachine, mergeMachinePieces, thermalMachine, type MachineAssembly } from '../machine/assembly';
import {
  ductRun,
  fallLeft,
  fallRight,
  flameBack,
  flameForward,
  flueRun,
  riseRun,
  stationPoints,
} from '../machine/paths';
import { mergeStatic } from '../merge';
import { Field, ThermalView, writeLong } from '../thermal';
import { buildExterior, type Exterior } from './exterior';
import { FLOOR, buildFurniture, type FurnitureBuild } from './furniture';
import { WALL_PLANES, buildRoomShell, roomMaterials, roomSide, roomSideRaycast, type RoomShell } from './shell';

// What `living-room` and `fire-core` share: the same room, the same machine, the same fire and the same light. The two worlds differ by which pieces they register as parts, by their camera, and by the section (a tool here, always on there). So the machine of one is
// the machine of the other, by construction, and `machine.test.ts` still measures it.

export interface HeaterOptions {
  /** What the state does not carry, read from the simulation's parameters. */
  params?: () => { thermalView: boolean; feedCover: number; lidAfterFire: boolean };
  /** The part selected in the interface. A part buried in the earth opens the earth when it is selected, or the eye would find only its outline. */
  selected?: () => string | null;
}
export const DEFAULT_PARAMS = () => ({ thermalView: false, feedCover: MODEL.feedCover, lidAfterFire: true });

export interface StageLook {
  /** Share of the room's lights in this world: the core's world keeps them low, so that the fire reads. */
  lights: number;
  /** Share of the fire's own light on the room. */
  fireLight: number;
  dotSize: number;
}

export interface HeaterStage {
  scene: THREE.Scene;
  thermal: ThermalView;
  machine: MachineAssembly;
  room: RoomShell;
  furniture: FurnitureBuild;
  exterior: Exterior;
  flame: Flame;
  gas: GasFlow;
  smoke: Puffs;
  steam: Puffs;
  long: Field;
  hemi: THREE.HemisphereLight;
  key: THREE.DirectionalLight;
  fireLight: THREE.PointLight;
  drawn: { dayness: number };
  /** Everything that moves with the model, but for the section and the flows. */
  drive(s: HeaterState, dt: number, slowMo: number, thermal: boolean, cover: number): void;
  /** Merge what stays together, once the world has taken its parts. */
  merge(scope: string, extra?: THREE.Object3D[]): void;
  /** The walls show from the room's side only. */
  sides(extra?: THREE.Object3D[]): void;
}

/** Simulated seconds per real second above which the room's light stops following the clock. */
const CLOCK_FAST = 3000;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function createHeaterStage(name: string, registered: ReadonlySet<string>, look: StageLook): HeaterStage {
  const scene = new THREE.Scene();
  scene.name = name;
  scene.background = new THREE.Color(0x141a24);
  scene.fog = new THREE.Fog(0x141a24, 20, 44);
  scene.userData.wantsEnv = true;
  scene.userData.look = { toneMapping: 'aces', exposure: 1.08, environment: 'paper', ao: true, aoRadius: 0.32 };
  const thermal = new ThermalView();

  // ---- the light: a broad warm key from above the missing ceiling, a warm bounce, lamps and the fire
  const hemi = new THREE.HemisphereLight(0xfff0dc, 0x6e5a48, 0.8);
  const key = new THREE.DirectionalLight(0xfff0dc, 1.7);
  key.position.set(-1.8, 8.5, 6.4);
  key.target.position.set(0.1, 0.4, -0.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -5.4;
  sc.right = 5.4;
  sc.top = 5.4;
  sc.bottom = -5.4;
  sc.near = 0.5;
  sc.far = 20;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.022;
  key.shadow.radius = 3;
  scene.add(hemi, key, key.target);

  const rm = roomMaterials();
  const room = buildRoomShell(rm);
  scene.add(room.group);

  // ---- the machine
  const m = buildMachine(registered);
  scene.add(m.coreFrame);
  for (const id of ['indoor', 'foot-cap', 'crossing', 'upper', 'tee', 'drain'] as const) scene.add(m.flue.roots[id]);
  scene.add(m.duct, m.cleanoutCap, m.shell, m.backrest);
  scene.add(room.slab, room.stone);

  // ---- furniture, what makes it a room, and the snow outside
  const furniture = buildFurniture();
  scene.add(furniture.group);
  const exterior = buildExterior();
  scene.add(exterior.group);

  // ---- soft contact where bodies meet the floor
  const contact = (w: number, d: number, x: number, z: number, y: number, s = 0.3, f = 0.3) => {
    const c = contactShadow(w, d, f, s);
    c.position.set(x, y, z);
    scene.add(c);
  };
  contact(
    BENCH.ductX + BENCH.depth / 2 - BENCH.casingStartX,
    BENCH.depth,
    (BENCH.ductX + BENCH.depth / 2 + BENCH.casingStartX) / 2,
    ROOM.z0 + BENCH.depth / 2,
    0.0015,
  );
  contact(
    BENCH.depth,
    BENCH.casingEndZ - ROOM.z0 - BENCH.depth,
    BENCH.ductX,
    (BENCH.casingEndZ + ROOM.z0 + BENCH.depth) / 2,
    0.0015,
  );
  contact(
    CORE.casingX1 - CORE.casingX0,
    CORE.casingZ1 - CORE.casingZ0,
    CORE.x + (CORE.casingX0 + CORE.casingX1) / 2,
    CORE.z + (CORE.casingZ0 + CORE.casingZ1) / 2,
    0.0015,
  );
  contact(0.72, 0.72, -0.45, 1.12, FLOOR + 0.0095, 0.3, 0.2);

  // ---- the fire and the lights it gives
  const flame = new Flame({ forward: flameForward(), back: flameBack(), half: CORE.feedSide / 2 });
  scene.add(flame.mesh);
  // from the room you see the fire only as a glow in the slot the lid leaves: the flame is drawn down into the tunnel
  const slotW = CORE.feedSide * (1 - CORE.slotCover);
  const mouthMat = new THREE.MeshBasicMaterial({
    map: softDotTexture(),
    color: 0xff8a3a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(slotW + 0.14, CORE.feedSide + 0.1), mouthMat);
  mouth.name = 'mouth-glow';
  mouth.rotation.x = -Math.PI / 2;
  mouth.position.set(CORE.x + CORE.feedFar + slotW / 2, CORE.feedTop + CORE.rimH + CORE.lidT + 0.002, CORE.z);
  mouth.castShadow = false;
  mouth.userData.noShadow = true;
  mouth.userData.notClipped = true;
  mouth.raycast = () => {};
  mouth.renderOrder = 5;
  scene.add(mouth);
  const fireLight = new THREE.PointLight(0xff8a3a, 0, 4.2, 1.8);
  fireLight.position.set(CORE.x + CORE.feedAxis + 0.1, CORE.feedTop + 0.42, CORE.z + 0.34);
  scene.add(fireLight);
  const lampLight = new THREE.PointLight(0xffc27a, 0, 9, 1.7);
  lampLight.position.copy(furniture.pendant);
  scene.add(lampLight);
  const floorLight = new THREE.PointLight(0xffb36b, 0, 5.5, 1.8);
  floorLight.position.copy(furniture.floorLamp);
  scene.add(floorLight);

  // ---- smoke in the room, when the model says so: from the feed's mouth, up
  const smoke = new Puffs({
    count: 40,
    color: 0x6e6a66,
    from: V(CORE.x + CORE.feedAxis, CORE.feedTop + 0.02, CORE.z),
    life: 7,
    rise: 1.9,
    drift: [0.55, 0.3],
    r0: 0.06,
    r1: 0.55,
    spread: 0.5,
    opacity: 0.55,
  });
  scene.add(smoke.mesh);
  // a thread of steam from the kettle's spout: decoration, when the lid is hot enough to boil it
  const steam = new Puffs({
    count: 14,
    color: 0xe8e4dc,
    from: V(
      ITEMS.kettle.x + ITEMS.kettle.r * 1.36 * Math.cos(0.6),
      CORE.drumTop + ITEMS.kettle.h * 0.85,
      ITEMS.kettle.z + ITEMS.kettle.r * 1.36 * Math.sin(0.6),
    ),
    life: 3.2,
    rise: 0.42,
    drift: [0.06, 0.03],
    r0: 0.008,
    r1: 0.07,
    spread: 0.05,
    opacity: 0.2,
  });
  scene.add(steam.mesh);
  // a thread from the drum's lid when the model has a leak there: the same smoke, from another place
  const leak = new Puffs({
    count: 22,
    color: 0x8a8682,
    from: V(CORE.x + CORE.drumR * 0.72, CORE.drumTop + 0.01, CORE.z + CORE.drumR * 0.72),
    life: 6,
    rise: 1.3,
    drift: [0.3, 0.2],
    r0: 0.03,
    r1: 0.34,
    spread: 0.3,
    opacity: 0.4,
  });
  scene.add(leak.mesh);

  // ---- the gases, through the walls
  const gas = new GasFlow(420, look.dotSize, stationPoints());
  gas.addRun(riseRun(), 60);
  gas.addRun(fallRight(), 48);
  gas.addRun(fallLeft(), 30);
  gas.addRun(ductRun(), 180);
  gas.addRun(flueRun(), 50);
  scene.add(gas.group);

  const long = new Field(64, 22, 25);
  thermal.onWrite.push((s) => writeLong(long, s, BENCH.depth, BENCH.height));

  const drawn = { dayness: 1 };
  let fast = false;
  let clockReal = 0;
  let clockSim = 0;
  const skyDay = new THREE.Color(0xb9c9d8);
  const skyNight = new THREE.Color(0x121824);
  const skyThermal = new THREE.Color(0x07090d);
  const tmp = new THREE.Color();
  const lamps = furniture.shades;
  const groundMat = exterior.ground.material as THREE.MeshStandardMaterial;

  return {
    scene,
    thermal,
    machine: m,
    room,
    furniture,
    exterior,
    flame,
    gas,
    smoke,
    steam,
    long,
    hemi,
    key,
    fireLight,
    drawn,
    merge(scope, extra = []) {
      mergeMachinePieces(m, scope);
      for (const g of [room.back, room.gable, room.front, room.ceiling, room.doorWall, room.floor, room.beam])
        mergeStatic(g, { name: g.name, scope, colours: false });
      mergeStatic(furniture.group, { name: 'furniture', scope });
      mergeStatic(exterior.group, { name: 'exterior', scope, colours: false });
      for (const g of extra) mergeStatic(g, { name: g.name, scope, colours: false });
      applyWear(furniture.group, 24, (x) => !!(x.material as THREE.Material).userData.worn);
      thermalMachine(thermal, m, long);
      thermal.patchAll(room.stone, thermal.stone);
      thermal.patchAll(room.slab, thermal.slab);
      for (const g of [room.floor, room.back, room.gable, room.front, room.ceiling, room.doorWall, room.beam])
        thermal.patchAll(g, thermal.surface);
      for (const pane of room.panes) {
        thermal.patch(pane.material as THREE.Material, thermal.outside);
      }
      thermal.patchAll(furniture.group, thermal.surface);
      thermal.patchAll(exterior.group, thermal.outside);
    },
    sides(extra = []) {
      const list: [THREE.Object3D, { at: [number, number, number]; in: [number, number, number] }][] = [
        [room.back, WALL_PLANES.back],
        [room.gable, WALL_PLANES.gable],
        [room.front, WALL_PLANES.front],
        [room.doorWall, WALL_PLANES.left],
        [room.ceiling, WALL_PLANES.ceiling],
        [room.stone, WALL_PLANES.left],
        ...extra.map((g): [THREE.Object3D, { at: [number, number, number]; in: [number, number, number] }] => [
          g,
          WALL_PLANES.back,
        ]),
      ];
      for (const [g, pl] of list) {
        g.traverse((o) => {
          const x = o as THREE.Mesh;
          if (x.isMesh) roomSide(x.material as THREE.Material, pl.at, pl.in);
        });
        roomSideRaycast(g, pl.at, pl.in);
      }
    },
    drive(s, dt, slowMo, wantThermal, cover) {
      // ---- how fast the clock runs, judged over a second: above that the light of the room holds at a warm evening
      clockReal += dt;
      if (clockReal >= 1) {
        const rate = (s.simTime - clockSim) / clockReal;
        if (rate >= 0) fast = rate > CLOCK_FAST;
        clockReal = 0;
        clockSim = s.simTime;
      }
      const dayTarget = fast ? 0.32 : smoothstep(7.2, 9.2, s.hour) * (1 - smoothstep(16.6, 18.4, s.hour));
      drawn.dayness = damp(drawn.dayness, dayTarget, 3, Math.min(dt, 0.1));
      const d = drawn.dayness;

      // ---- the thermal view
      thermal.update(s, wantThermal, dt);
      const th = thermal.on.value;
      // the stage's top is open and the spruces stand under the ramp: only the night shows through the room in this view
      for (const tree of exterior.trees) tree.visible = th < 0.5;
      const lit = (1 - 0.72 * th) * look.lights;
      hemi.intensity = (0.62 + 0.42 * d) * lit;
      key.intensity = (0.95 + 0.85 * d) * lit;
      key.color.setHSL(0.09, 0.36 + 0.22 * (1 - d), 0.86);
      lampLight.intensity = (1 - 0.92 * d) * 6.5 * (1 - th) * look.lights;
      floorLight.intensity = (1 - 0.92 * d) * 5.2 * (1 - th) * look.lights;
      lamps.emissiveIntensity = (0.22 + 1.35 * (1 - d)) * (1 - th);
      tmp
        .copy(skyNight)
        .lerp(skyDay, d * look.lights)
        .lerp(skyThermal, th);
      (scene.background as THREE.Color).copy(tmp);
      (scene.fog as THREE.Fog).color.copy(tmp);
      groundMat.color.setScalar(0.1 + 0.78 * d);
      scene.environmentIntensity = (0.34 + 0.34 * d) * lit;

      // ---- the clock on the wall: it follows the model's hour
      const hourAngle = (s.hour / 12) * Math.PI * 2;
      furniture.hourHand.rotation.x = -hourAngle;
      furniture.minuteHand.rotation.x = -hourAngle * 12;

      // ---- the fire
      flame.update(s.flameLength, s.flameStrength, s.flameClock);
      m.core.drive({
        feedLevel: s.feedLevel,
        emberGlow: s.emberGlow,
        ash: s.ash,
        cover,
        linerT: s.linerT,
        gapT: s.pathT[4] ?? 20,
        fallT: s.pathT[5] ?? 20,
        riserT: s.riserTopT,
        chamberT: s.chamberT,
        burning: s.burning > 0,
      });
      const flick = fireFlicker(s.flameClock);
      fireLight.intensity = (s.flameStrength * 2.6 + s.emberGlow * 0.5) * flick * (1 - th) * look.fireLight;
      mouthMat.opacity = Math.min(1, s.flameStrength * 1.1 + s.emberGlow * 0.25) * flick * (1 - th);
      mouth.visible = mouthMat.opacity > 0.01;

      // ---- smoke when the model spills it; steam from the kettle when the lid is over boiling
      const atLid = Math.min(1, s.leakShare * 10);
      smoke.update(s.smokeInRoom * (1 - atLid), dt, slowMo);
      leak.update(s.smokeInRoom * atLid, dt, slowMo);
      steam.update(smoothstep(105, 140, s.drumLidT) * (1 - th), dt, slowMo);
    },
  };
}
