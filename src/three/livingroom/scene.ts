import * as THREE from 'three';
import { PartRegistry, damp } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HeaterState } from '../../sim/types';
import { BENCH, CORE, FLUE, ITEMS, ROOM } from '../dims';
import { Followers } from '../followers';
import type { Flame } from '../fire/flame';
import type { GasFlow } from '../fire/gas';
import type { Puffs } from '../fire/puffs';
import type { MachineAssembly } from '../machine/assembly';
import { FLOOR, type FurnitureBuild } from '../room/furniture';
import {
  buildBasket,
  buildCoAlarm,
  buildCushions,
  buildGrille,
  buildKettle,
  buildShield,
  buildSmokeAlarm,
} from '../room/items';
import { DEFAULT_PARAMS, createHeaterStage, type HeaterOptions } from '../room/stage';
import { type RoomShell } from '../room/shell';
import { Field, type ThermalView, rampBar, rampY } from '../thermal';
import { anchor, hotspots, type HotspotDef } from '../world';

// The `living-room` world, the machine at home: a room seen as a stage, the walls between the eye and the room stepping aside by themselves. Warm, full and lived in. The drum on its base of earth, the bench along two walls, the chimney up through
// the ceiling, a real fire in the feed that follows the model. The section opens the whole path of the gases at once, X-ray shows the same path through the shells, and the thermal view (`params.thermalView`) is the lab's « aha »: the room dark, the drum and the bench
// in the colours of the model, charging and giving back with the 24 h slider. Every piece of the machine comes from `machine/*`, the very pieces `fire-core` and `bench-section` show closer.

export const LIVING_PARTS = [
  'steel-drum',
  'cob-bench',
  'bench-backrest',
  'manifold',
  'manifold-cleanout',
  'chimney-flue',
  'chimney-cleanout',
  'ceiling-crossing',
  'hearth-slab',
  'heat-shield',
  'co-alarm',
  'smoke-alarm',
  'ventilation-grille',
  'wood-basket',
  'kettle',
  'flue-thermometer',
  'bench-cushion',
  'inner-stone-wall',
] as const;
export type LivingPart = (typeof LIVING_PARTS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'steel-drum', fr: 'Le bidon', en: 'The drum', goto: 'fire-core' },
  { id: 'cob-bench', fr: 'La banquette', en: 'The bench', goto: 'bench-section' },
  { id: 'chimney-flue', fr: 'Conduit', en: 'Chimney' },
  { id: 'co-alarm', fr: 'Détecteur de CO', en: 'CO alarm' },
  { id: 'cob-bench#t20', fr: '20 °C', en: '20 °C' },
  { id: 'cob-bench#t60', fr: '60 °C', en: '60 °C' },
  { id: 'bench-backrest', fr: 'Le dossier', en: 'The backrest', minor: true },
  { id: 'manifold', fr: 'Le collecteur', en: 'The manifold', minor: true },
  { id: 'manifold-cleanout', fr: 'Trappe du collecteur', en: 'Manifold cleanout', minor: true },
  { id: 'chimney-cleanout', fr: 'Trappe de pied', en: 'Chimney-foot cleanout', minor: true },
  { id: 'ceiling-crossing', fr: 'Traversée de plafond', en: 'Ceiling crossing', minor: true },
  { id: 'hearth-slab', fr: 'La dalle', en: 'The slab', minor: true },
  { id: 'heat-shield', fr: 'Écran thermique', en: 'Heat shield', minor: true },
  { id: 'smoke-alarm', fr: 'Détecteur de fumée', en: 'Smoke alarm', minor: true },
  { id: 'ventilation-grille', fr: 'Grille d’aération', en: 'Ventilation grille', minor: true },
  { id: 'wood-basket', fr: 'Le panier du jour', en: 'The day’s basket', minor: true },
  { id: 'kettle', fr: 'La bouilloire', en: 'The kettle', minor: true },
  { id: 'flue-thermometer', fr: 'Thermomètre de fumée', en: 'Flue thermometer', minor: true },
  { id: 'bench-cushion', fr: 'Coussins', en: 'Cushions', minor: true },
  { id: 'inner-stone-wall', fr: 'Le mur de refend', en: 'The stone wall', minor: true },
];

/** Explode offsets, m, each along a line a mason could lift it by. */
export const EXPLODE: Record<LivingPart, [number, number, number]> = {
  'steel-drum': [0, 1.3, 0],
  kettle: [0, 1.85, 0],
  'cob-bench': [0, 0.9, 0],
  'bench-backrest': [0, 1.35, 0],
  'bench-cushion': [0, 1.8, 0.1],
  manifold: [0, 0.75, 0.05],
  'manifold-cleanout': [0, 1.05, 0.05],
  'chimney-flue': [0, 0.8, 0],
  'chimney-cleanout': [0, 0, 0.4],
  'ceiling-crossing': [0, 1.2, 0],
  'hearth-slab': [0, -0.32, 0],
  'heat-shield': [0, 0.3, 0.32],
  'co-alarm': [0, 0, 0.34],
  'smoke-alarm': [0, -0.36, 0],
  'ventilation-grille': [0, 0, 0.3],
  'wood-basket': [0.25, 0.25, 0.3],
  'flue-thermometer': [0, 0, 0.32],
  'inner-stone-wall': [-0.55, 0, 0],
};

export type { HeaterOptions };

export interface LivingRoomScene extends SceneModule<HeaterState> {
  machine: MachineAssembly;
  shell: RoomShell;
  furniture: FurnitureBuild;
  thermal: ThermalView;
  flame: Flame;
  gas: GasFlow;
  smoke: Puffs;
  followers: Followers;
  scale: THREE.Group;
  sectionOn(): boolean;
  scenery(): THREE.Object3D[];
  long: Field;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function createLivingRoomScene(opts: HeaterOptions = {}): LivingRoomScene {
  const params = opts.params ?? DEFAULT_PARAMS;
  const st = createHeaterStage('living-room', new Set<string>(LIVING_PARTS), { lights: 1, fireLight: 1, dotSize: 4 });
  const { scene, machine: m, room, furniture, thermal, flame, gas, smoke, long } = st;
  const registry = new PartRegistry();

  const roots = {} as Record<LivingPart, THREE.Group>;
  const part = (id: LivingPart): THREE.Group => {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
    scene.add(g);
    return g;
  };
  // the machine's own pieces that are parts here
  roots['steel-drum'] = m.core.roots['steel-drum'];
  roots['manifold'] = m.core.roots['manifold'];
  roots['manifold-cleanout'] = m.core.roots['manifold-cleanout'];
  part('cob-bench').add(m.shell);
  part('bench-backrest').add(m.backrest);
  roots['chimney-flue'] = m.flue.roots['indoor'];
  roots['chimney-cleanout'] = m.flue.roots['foot-cap'];
  roots['ceiling-crossing'] = m.flue.roots['crossing'];
  roots['hearth-slab'] = room.slab;
  roots['inner-stone-wall'] = room.stone;
  part('heat-shield').add(buildShield(m.mats));
  part('kettle').add(buildKettle());
  part('wood-basket').add(buildBasket(m.mats));
  const co = buildCoAlarm();
  part('co-alarm').add(co.group);
  part('smoke-alarm').add(buildSmokeAlarm());
  part('ventilation-grille').add(buildGrille(m.mats));
  part('bench-cushion').add(buildCushions());
  part('flue-thermometer').add(m.dial.group);

  st.merge('living-room', [
    roots['heat-shield'],
    roots['kettle'],
    roots['wood-basket'],
    roots['bench-cushion'],
    roots['co-alarm'],
    roots['smoke-alarm'],
    roots['ventilation-grille'],
  ]);
  st.sides([roots['heat-shield'], roots['co-alarm'], roots['ventilation-grille']]);
  thermal.patchAll(roots['heat-shield'], thermal.shield);
  for (const id of ['co-alarm', 'smoke-alarm', 'ventilation-grille', 'wood-basket'] as const)
    thermal.patchAll(roots[id], thermal.surface);
  thermal.patchAll(roots['kettle'], thermal.drumLid);
  thermal.patchAll(roots['bench-cushion'], thermal.seat);

  // ---- the scale of the false colour, on a small stand, with the kit's labels: it shows only with the thermal view
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f1b18, roughness: 0.7 });
  const BAR_H = 0.9;
  const BAR_Y0 = 0.36;
  const scale = rampBar(BAR_H, 0.09, BAR_Y0, frameMat);
  scale.position.set(1.0, FLOOR, 1.86);
  scale.rotation.y = -0.1;
  scale.visible = false;
  scene.add(scale);

  // ---- anchors of the labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: LivingPart, x: number, y: number, z: number) => {
    anchors[id] = anchor(roots[id], x, y, z, `${id}-label`);
  };
  const cz = CORE.z;
  // the core's pieces have their origin on the riser's axis, the others on the room's
  at('steel-drum', -0.1, CORE.drumTop - 0.3, CORE.drumR + 0.01);
  at('cob-bench', 0.95, BENCH.height * 0.62, ROOM.z0 + BENCH.depth);
  at('bench-backrest', 1.3, BENCH.height + BENCH.backrestHeight, ROOM.z0 + BENCH.backrestDepth);
  at('manifold', 0.3, 0.3, -0.3);
  at('manifold-cleanout', 0.27, CORE.casingTop + 0.05, -0.43);
  at('chimney-flue', FLUE.x - FLUE.outerR, 0.62, FLUE.z);
  at('chimney-cleanout', FLUE.x, FLUE.footY + 0.06, FLUE.z + FLUE.capR + 0.02);
  at('ceiling-crossing', FLUE.x - FLUE.crossingHalf, ROOM.height + 0.1, FLUE.z);
  at('hearth-slab', CORE.x + 0.75, 0.003, cz + 0.9);
  at('heat-shield', -1.72, 1.45, ROOM.z0 + 0.03);
  at('co-alarm', ITEMS.coAlarm.x, ITEMS.coAlarm.y + 0.07, ROOM.z0 + 0.03);
  at('smoke-alarm', ITEMS.smokeAlarm.x, ROOM.height - ROOM.beamH - 0.05, ITEMS.smokeAlarm.z);
  at('ventilation-grille', ITEMS.grille.x, ITEMS.grille.y + 0.1, ROOM.z0 + 0.02);
  at('wood-basket', ITEMS.basket.x, 0.42, ITEMS.basket.z);
  at('kettle', ITEMS.kettle.x, CORE.drumTop + 0.26, ITEMS.kettle.z);
  at('flue-thermometer', FLUE.x - 0.05, FLUE.thermometerY, FLUE.z + FLUE.outerR + 0.05);
  at('bench-cushion', 1.05, BENCH.height + 0.36, ROOM.z0 + 0.34);
  at('inner-stone-wall', ROOM.x0, 1.38, 0);
  anchors['cob-bench#t20'] = anchor(scale, 0.07, rampY(20, BAR_H, BAR_Y0), 0.02, 't20');
  anchors['cob-bench#t60'] = anchor(scale, 0.07, rampY(60, BAR_H, BAR_Y0), 0.02, 't60');

  // ---- register, after the merges
  for (const id of LIVING_PARTS) registry.add(id, roots[id], V(...EXPLODE[id]));

  // ---- what moves or hides with a part without being one
  const followers = new Followers();
  // a shell that X-ray opens, and what stays solid when it does
  followers.add('steel-drum', m.core.roots['core-casing'], { shell: true });
  for (const id of [
    'firebrick-base',
    'burn-tunnel',
    'feed-tube',
    'feed-lid',
    'fuel-sticks',
    'ash-bed',
    'heat-riser',
    'riser-insulation',
    'riser-sleeve',
    'top-gap',
    'downdraft-annulus',
    'drum-plinth',
  ] as const) {
    followers.add('steel-drum', m.core.roots[id]);
  }
  followers.add('steel-drum', m.core.roots['drum-seal'], { explode: 1 });
  followers.add('cob-bench', m.duct);
  followers.add('cob-bench', m.cleanoutCap, { explode: 1 });
  followers.add('chimney-flue', m.flue.roots['upper'], { explode: 1, shell: true });
  followers.add('chimney-flue', m.flue.roots['tee']);
  followers.add('chimney-flue', m.flue.roots['drain']);

  let sectionOn = false;
  let dialAngle = -2.35;

  const mod: LivingRoomScene = {
    id: 'living-room',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    machine: m,
    shell: room,
    furniture,
    thermal,
    flame,
    gas,
    smoke,
    followers,
    scale,
    long,
    sectionOn: () => sectionOn,
    scenery: () => [room.floor, room.back, room.gable, room.doorWall, room.beam, m.coreFrame],
    // the stage: from the missing front wall and a little above it
    home: { position: V(1.25, 3.75, 8.4), target: V(0.05, 0.75, -0.55) },
    minDistance: 0.55,
    maxDistance: 22,
    homePadding: 0.77,
    update(s, dt, view) {
      const p = params();
      const cover = s.phase === 'cold' && p.lidAfterFire ? 1 : p.feedCover;
      st.drive(s, dt, view.slowMo, p.thermalView, cover);
      scale.visible = thermal.on.value > 0.02;

      // ---- the alarm's lamp: a slow green at rest, a red pulse from the moment the model's CO would have set it off
      const alarmOn = s.coAlarm > 0;
      co.led.emissive.set(alarmOn ? 0xe02818 : 0x38c060);
      co.led.emissiveIntensity = alarmOn ? 0.8 + 2 * Math.max(0, Math.sin(s.flameClock * 4)) : 0.8;

      // ---- the flue's dial: the needle turns with the flue's temperature, 0 to 300 °C over its 270°, at the eye's pace
      const wantDial = -2.356 + 4.712 * Math.min(1, Math.max(0, s.flueInT / 300));
      dialAngle = damp(dialAngle, wantDial, 4, dt);
      m.dial.needle.rotation.z = -dialAngle;

      // ---- the section and the shells
      sectionOn = view.cutaway;
      m.setSection(sectionOn);
      // the manifold lies in the earth: selected, the casing opens around it
      followers.force(m.core.roots['core-casing'], opts.selected?.() === 'manifold');
      followers.update(registry);
      m.casingRight.visible = sectionOn && m.core.roots['core-casing'].visible;
      m.caps.update(sectionOn, registry);

      let hidden = false;
      let ghosted = false;
      for (const id of LIVING_PARTS) {
        const dsp = registry.get(id)?.display;
        if (dsp === 'hidden') hidden = true;
        if (dsp === 'ghost') ghosted = true;
      }
      // isolate and X-ray keep to the machine and the room's walls: the furniture steps out
      furniture.group.visible = !hidden && !ghosted;

      const showFlow = view.schematic || sectionOn || ghosted;
      gas.update(s, dt, view.slowMo, showFlow && !hidden);
      gas.beads.visible = view.schematic;
    },
  };
  return mod;
}
