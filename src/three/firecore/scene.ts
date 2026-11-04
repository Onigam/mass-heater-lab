import * as THREE from 'three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HeaterState } from '../../sim/types';
import { CORE } from '../dims';
import { Followers } from '../followers';
import { fireFlicker, type Flame } from '../fire/flame';
import type { GasFlow } from '../fire/gas';
import type { MachineAssembly } from '../machine/assembly';
import { buildKettle, buildShield } from '../room/items';
import { DEFAULT_PARAMS, createHeaterStage, type HeaterOptions } from '../room/stage';
import { SheetRegistry, anchor, box, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';

// The `fire-core` world: where it burns and which way it goes. The same room and the same machine as `living-room`, the lights low, always cut along the gases' path. The flame lies down in the tunnel at the length the model gives, comes back up the feed when the flow reverses;
// the riser's liner glows when the model says it is hot enough; the dots run from the feed to the manifold at the speed of the mass flow, and « Flux » adds the beads of pressure. No section tool: it is always on. No thermal view: on a ramp of 15 to 65 °C all of this is one colour, and it would teach nothing.

export const FIRE_PARTS = [
  'feed-tube',
  'feed-lid',
  'fuel-sticks',
  'burn-tunnel',
  'ash-bed',
  'heat-riser',
  'riser-insulation',
  'riser-sleeve',
  'firebrick-base',
  'core-casing',
  'top-gap',
  'downdraft-annulus',
  'drum-seal',
  'drum-plinth',
] as const;
export type FirePart = (typeof FIRE_PARTS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'feed-tube', fr: 'Le tube d’alimentation', en: 'The feed tube' },
  { id: 'burn-tunnel', fr: 'Le tunnel de feu', en: 'The burn tunnel' },
  { id: 'heat-riser', fr: 'La cheminée interne', en: 'The heat riser' },
  { id: 'top-gap', fr: 'Sous le couvercle', en: 'Under the lid' },
  { id: 'downdraft-annulus', fr: 'La chute', en: 'The fall' },
  { id: 'feed-lid', fr: 'Le couvercle', en: 'The feed lid', minor: true },
  { id: 'fuel-sticks', fr: 'Les bûchettes', en: 'The sticks', minor: true },
  { id: 'ash-bed', fr: 'Le lit de cendres', en: 'The ash bed', minor: true },
  { id: 'riser-insulation', fr: 'L’isolant', en: 'Riser insulation', minor: true },
  { id: 'riser-sleeve', fr: 'La chemise d’acier', en: 'The steel sleeve', minor: true },
  { id: 'firebrick-base', fr: 'Le socle en briques', en: 'The firebrick base', minor: true },
  { id: 'core-casing', fr: 'L’enveloppe de terre', en: 'The earthen casing', minor: true },
  { id: 'drum-seal', fr: 'Le joint du couvercle', en: 'The lid seal', minor: true },
  { id: 'drum-plinth', fr: 'Le pied du bidon', en: 'The drum’s foot', minor: true },
];

/** Explode offsets, m: everything lifts off in the order a mason would take it apart, the drum first, what it hides after. */
export const EXPLODE: Record<FirePart, [number, number, number]> = {
  'drum-seal': [0, 1.08, 0],
  'top-gap': [0, 0.96, 0],
  'downdraft-annulus': [0, 0.84, 0],
  'riser-sleeve': [0.36, 0.5, 0],
  'riser-insulation': [0.18, 0.36, 0],
  'heat-riser': [0, 0.22, 0],
  'feed-lid': [-0.1, 0.6, 0],
  'fuel-sticks': [-0.05, 0.42, 0],
  'feed-tube': [-0.16, 0.2, 0],
  'burn-tunnel': [0, 0.11, 0],
  'ash-bed': [-0.3, 0.05, 0.12],
  'drum-plinth': [0.26, 0.05, 0],
  'firebrick-base': [0, 0, 0],
  'core-casing': [0.2, -0.02, 0.32],
};

/** The sheets of this world print no box but the casing's: the box of anything else in here is the inside of the core, which the lab refuses to size (`src/data/parts/dim-specs.ts`). */
export const FIRE_REFUSED: ReadonlySet<string> = new Set<FirePart>(FIRE_PARTS.filter((id) => id !== 'core-casing'));

/**
 * How each part is framed. The core only exists on the cut, which faces +z: everything is seen from that side, whatever the camera was doing before. What is thin or what lies along the cut is framed where it shows, not on its whole box.
 * Directions found by rendering each part with and without itself from a grid of directions (`docs/3d.md`).
 */
export const FRAMING: Record<FirePart, PartFraming> = {
  'feed-tube': { viewDir: viewFrom(8, 0) },
  'feed-lid': { viewDir: viewFrom(10, -15) },
  'fuel-sticks': { viewDir: viewFrom(30, 0), frame: box(-2.77, 0.1, -1.93, -2.62, 0.7, -1.77) },
  'burn-tunnel': { viewDir: viewFrom(8, 0) },
  'ash-bed': { viewDir: viewFrom(25, 0) },
  'heat-riser': { viewDir: viewFrom(8, 0) },
  'riser-insulation': { viewDir: viewFrom(8, 0) },
  'riser-sleeve': { viewDir: viewFrom(12, -55), frame: box(-2.1, 0.45, -2.0, -1.95, 0.85, -1.85) },
  'firebrick-base': { viewDir: viewFrom(4, 15) },
  'core-casing': { viewDir: viewFrom(12, -50), frame: box(-2.89, 0, -1.95, -2.4, 0.38, -1.85) },
  'top-gap': { viewDir: viewFrom(8, 0), frame: box(-2.45, 0.88, -1.95, -1.85, 1.12, -1.85) },
  'downdraft-annulus': { viewDir: viewFrom(8, 0), frame: box(-2.42, 0.4, -1.92, -2.3, 0.85, -1.85) },
  'drum-seal': { viewDir: viewFrom(0, -30), frame: box(-1.95, 0.96, -1.95, -1.83, 1.08, -1.85) },
  'drum-plinth': { viewDir: viewFrom(8, 10), frame: box(-2.42, 0, -2.0, -1.8, 0.2, -1.85) },
};

export interface FireCoreScene extends SceneModule<HeaterState> {
  machine: MachineAssembly;
  flame: Flame;
  gas: GasFlow;
  followers: Followers;
  scenery(): THREE.Object3D[];
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function createFireCoreScene(opts: HeaterOptions = {}): FireCoreScene {
  const params = opts.params ?? DEFAULT_PARAMS;
  const st = createHeaterStage('fire-core', new Set<string>(FIRE_PARTS), {
    lights: 0.34,
    fireLight: 0.35,
    dotSize: 4.5,
  });
  const { scene, machine: m, room, flame, gas } = st;
  const registry = new SheetRegistry(FIRE_REFUSED, opts.selected);

  // ---- the kettle, the shield and the basket are the room's, not parts here
  const kettle = buildKettle();
  const dressing = new THREE.Group();
  dressing.name = 'dressing';
  dressing.add(buildShield(m.mats));
  scene.add(dressing, kettle);
  // what would stand between the eye and the section steps out of this world
  for (const name of [
    'fire-tools',
    'stool',
    'floor-lamp',
    'armchair',
    'table',
    'table-lamp',
    'plant',
    'bookcase',
    'slippers',
  ]) {
    const it = st.furniture.group.getObjectByName(name);
    if (it) it.parent?.remove(it);
  }

  st.merge('fire-core', [dressing]);
  st.sides([]);

  // ---- two more lights, right at the fire: what the flame throws on the brick, what the riser's foot throws up; no shadow, a short reach
  const tunnelLight = new THREE.PointLight(0xff8a3a, 0, 1.1, 1.8);
  tunnelLight.position.set(CORE.x + CORE.feedNear + 0.1, CORE.tunnelAxis + 0.02, CORE.z + 0.04);
  const riserLight = new THREE.PointLight(0xffa050, 0, 1.2, 1.7);
  riserLight.position.set(CORE.x, CORE.lidTop + 0.18, CORE.z + 0.02);
  scene.add(tunnelLight, riserLight);

  // ---- anchors of the labels, in the core's frame: they point into the section. A label runs to the right of its point and the kit cannot turn it, so those of the drum stand on its left: at 768 px the view is 380 px wide and the drum in its right half (docs/kit-requests.md, 22)
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: FirePart, x: number, y: number, z: number) => {
    anchors[id] = anchor(m.core.roots[id], x, y, z, `${id}-label`);
  };
  const c = CORE;
  at('feed-tube', c.feedFar - c.brick / 2, c.feedTop + 0.02, 0);
  at('feed-lid', c.feedNear + 0.02, c.feedTop + 0.05, 0);
  at('fuel-sticks', c.feedAxis - 0.02, c.feedTop + 0.24, 0);
  at('burn-tunnel', -0.22, c.lidTop - 0.01, 0.02);
  at('ash-bed', c.feedNear, c.tunnelFloor + 0.015, 0);
  at('heat-riser', -0.1, (c.riserFoot + c.riserTop) / 2 + 0.12, 0);
  at('riser-insulation', -(c.boreR + c.linerT + 0.03), c.riserTop - 0.2, 0);
  at('riser-sleeve', c.sleeveR, c.riserTop - 0.36, 0);
  at('firebrick-base', -0.15, c.tunnelFloor * 0.5, 0.02);
  at('core-casing', c.casingX0 + 0.05, c.casingTop - 0.06, 0);
  at('top-gap', -0.26, c.riserTop + c.topGap / 2, 0);
  at('downdraft-annulus', -(c.sleeveR + c.drumR) / 2, (c.lidTop + c.riserTop) / 2 - 0.05, 0);
  at('drum-seal', c.drumR, c.drumTop - 0.012, 0);
  at('drum-plinth', c.plinthOut - 0.03, c.drumFoot - 0.03, 0);

  for (const id of FIRE_PARTS) registry.add(id, m.core.roots[id], V(...EXPLODE[id]), undefined, FRAMING[id]);

  // ---- the drum rides with its lid's seal, its kettle with it; the manifold stays in the earth; the room's shells go when the parts do
  const followers = new Followers();
  followers.add('drum-seal', m.core.roots['steel-drum'], { explode: 1, shell: true });
  followers.add('drum-seal', kettle, { explode: 1, shell: true });
  followers.add('core-casing', m.core.roots['manifold'], { shell: true });
  followers.add('core-casing', m.core.roots['manifold-cleanout'], { shell: true });
  followers.add('core-casing', m.shell, { shell: true });
  followers.add('core-casing', m.backrest, { shell: true });
  followers.add('core-casing', dressing);

  const mod: FireCoreScene = {
    id: 'fire-core',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    machine: m,
    flame,
    gas,
    followers,
    scenery: () => [room.floor, room.slab, room.back, room.stone],
    // right in front of the section, the fire at the eye's height
    home: { position: V(c.x + 0.06, 0.72, c.z + 2.45), target: V(c.x - 0.06, 0.5, c.z) },
    minDistance: 0.3,
    maxDistance: 6,
    homePadding: 0.86,
    update(s, dt, view) {
      const p = params();
      const cover = s.phase === 'cold' && p.lidAfterFire ? 1 : p.feedCover;
      st.drive(s, dt, view.slowMo, false, cover);
      // the firelight on the brick, a gentle life on the model's strength: no strobe
      const flick = fireFlicker(s.flameClock);
      tunnelLight.intensity = (s.flameStrength * 0.22 + s.emberGlow * 0.2) * flick;
      riserLight.intensity = s.flameStrength * 0.08 * flick;

      m.setSection(true);
      followers.update(registry);
      const casing = registry.get('core-casing');
      m.casingRight.visible = casing?.display === 'solid';
      m.caps.update(true, registry);

      let hidden = false;
      for (const id of FIRE_PARTS) if (registry.get(id)?.display === 'hidden') hidden = true;
      st.furniture.group.visible = !hidden;
      gas.update(s, dt, view.slowMo, !hidden);
      gas.beads.visible = view.schematic;
    },
  };
  return mod;
}
