import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { HeaterState } from '../sim/types';
import { createBenchSectionScene as buildBenchSection } from './benchsection/scene';
import { createFireCoreScene as buildFireCore } from './firecore/scene';
import { createHomesteadScene as buildHomestead, type HomesteadOptions } from './homestead/scene';
import { createLivingRoomScene as buildLivingRoom } from './livingroom/scene';
import type { HeaterOptions } from './room/stage';

// The four worlds, all `lazyModule`s: nothing is built until the visitor goes there. Use the result as the `module` of a `SceneDef`. They read the simulation's state in `update`; what the state does not carry (the thermal view, the lid) is passed by the
// application: `createLivingRoomScene({ params: () => sim.params })`.

export const createHomesteadScene = (opts: HomesteadOptions = {}): SceneModule<HeaterState> =>
  lazyModule<HeaterState>('homestead', () => buildHomestead(opts));
export const createLivingRoomScene = (opts: HeaterOptions = {}): SceneModule<HeaterState> =>
  lazyModule<HeaterState>('living-room', () => buildLivingRoom(opts));
export const createFireCoreScene = (opts: HeaterOptions = {}): SceneModule<HeaterState> =>
  lazyModule<HeaterState>('fire-core', () => buildFireCore(opts));
export const createBenchSectionScene = (opts: HeaterOptions = {}): SceneModule<HeaterState> =>
  lazyModule<HeaterState>('bench-section', () => buildBenchSection(opts));

/** What `src/lab.ts` needs to know about each world, as `SceneDef` fields: spread it into the definition. */
export const WORLD = {
  homestead: {
    /** Seen from outside. No section: the house section is the next world. X-ray only makes sense around a selected part in a landscape. */
    cutaway: false,
    xrayNeedsSelection: true,
    slowMo: false,
    /** A few small things would move and the house would stay: the explode teaches nothing at this scale. */
    explode: false,
    partPadding: 2.8,
    stepFrame: { padding: 1.7, minRadius: 1.5 },
  },
  'fire-core': {
    /** Always cut: there is no tool to press. */
    cutaway: false,
    partPadding: 2.3,
    stepFrame: { padding: 1.5, minRadius: 0.25 },
    /** X-ray opens the solids: the flame, the gases and the sticks stay. */
    xrayShell: (id: string): boolean =>
      id === 'core-casing' ||
      id === 'firebrick-base' ||
      id === 'burn-tunnel' ||
      id === 'feed-tube' ||
      id === 'riser-insulation' ||
      id === 'riser-sleeve' ||
      id === 'drum-plinth' ||
      id === 'heat-riser',
  },
  'bench-section': {
    /** The tool opens the slices lengthwise: the gases in the duct. */
    cutaway: true,
    partPadding: 2.3,
    stepFrame: { padding: 1.5, minRadius: 0.3 },
    /** X-ray opens the earth: the ducts, their joints, the bend, the tee stay. */
    xrayShell: (id: string): boolean =>
      id === 'cob-casing' || id === 'earthen-plaster' || id === 'stone-filler' || id === 'floor-barrier',
  },
  'living-room': {
    cutaway: true,
    partPadding: 2.4,
    stepFrame: { padding: 1.5, minRadius: 0.5 },
    /** X-ray opens the shells: the drum, the bench, the backrest, the chimney's skin, the shield. */
    xrayShell: (id: string): boolean =>
      id === 'steel-drum' ||
      id === 'cob-bench' ||
      id === 'bench-backrest' ||
      id === 'chimney-flue' ||
      id === 'heat-shield' ||
      id === 'bench-cushion' ||
      id === 'kettle' ||
      id === 'wood-basket',
  },
} as const;

export type { HeaterOptions, HomesteadOptions };
