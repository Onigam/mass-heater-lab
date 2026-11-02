import { MACHINE, MODEL, COB, PEBBLE } from './machine';
import type { HeaterParams, PresetId, ScenarioId } from './types';

// The starting points and the small scripted situations. Presets live in the simulation only: the 3D draws one machine.

export const PRESET_IDS: PresetId[] = ['j-tube', 'batch-load', 'pebble-bench', 'yurt'];

export const SCENARIO_IDS: ScenarioId[] = [
  'winter-two-fires',
  'cold-start',
  'one-fire-mild',
  'cold-snap',
  'wet-wood',
  'short-bench',
  'long-bench',
  'low-chimney',
  'small-gap',
  'leaky-house',
  'extract-fan',
  'damper-on-embers',
];

/** The clock opens at one hour per second: a day takes 24 seconds. */
export const DEFAULT_TIME_SCALE = 3600;
/** The speeds of the strip: real time for the flame, then a minute, ten minutes, an hour, six hours per second. */
export const SPEEDS = [1, 60, 600, 3600, 21600];

/** The ranges of the sliders. REPORTED where the research gives them (burn rate, moisture, riser, duct, house); the rest are wide on purpose. */
export const RANGES = {
  firesPerDay: { min: 0, max: 3, step: 1 },
  morningHour: { min: 4, max: 11, step: 0.25 },
  eveningHour: { min: 14, max: 22, step: 0.25 },
  sessionHours: { min: 0.5, max: 6, step: 0.25 },
  feedKgH: { min: 1, max: 8, step: 0.1 },
  loadKg: { min: 2, max: 20, step: 0.5 },
  burnMinutes: { min: 45, max: 120, step: 5 },
  moisture: { min: 8, max: 40, step: 1 },
  packing: { min: 0.2, max: 1, step: 0.05 },
  feedCover: { min: 0, max: 1, step: 0.01 },
  riserHeight: { min: 0.64, max: 1.27, step: 0.01 },
  topGap: { min: 0.01, max: 0.1, step: 0.005 },
  ductLength: { min: 3, max: 18, step: 0.5 },
  chimneyTop: { min: 2.7, max: 8, step: 0.1 },
  ductFilm: { min: 0.5, max: 2, step: 0.05 },
  benchK: { min: 0.3, max: 1.5, step: 0.05 },
  houseH: { min: 40, max: 400, step: 2 },
  gains: { min: 0, max: 600, step: 10 },
  outsideMean: { min: -15, max: 12, step: 0.5 },
  outsideSwing: { min: 0, max: 8, step: 0.5 },
  neutralZ: { min: 0, max: 2.5, step: 0.05 },
  fanPa: { min: 0, max: 20, step: 0.5 },
  leakCm2: { min: 0, max: 20, step: 0.5 },
  damperK: { min: 0, max: 400, step: 5 },
  oldStoveEta: { min: 0.05, max: 0.8, step: 0.01 },
} as const;

export type RangedKey = keyof typeof RANGES;

/**
 * A batch box's air port. ESTIMATE, derived from what EN 15544 writes of its tested chambers (K32 of the research): an inflow of 2 to 4 m/s, an air-fuel ratio of 1.95 to 3.95. Middle of
 * both, at a load's peak of burning: the opening is the air over its speed. A closed door, not a loaded feed.
 */
export function batchCover(p: { loadKg: number; burnMinutes: number; bore: number; moisture: number }): number {
  const peak = ((Math.PI / 2) * p.loadKg) / (p.burnMinutes * 60);
  const air = peak * 5.97 * (1 - p.moisture / 100) * 2.95;
  const area = air / 1.2 / 3;
  const side = (MACHINE.feedSide * p.bore) / MACHINE.bore;
  return Math.max(0, Math.min(1, 1 - area / (side * side)));
}

export function presetParams(id: PresetId): HeaterParams {
  const base: HeaterParams = {
    slowMo: 1,
    timeScale: DEFAULT_TIME_SCALE,
    running: true,
    preset: id,
    hour: 6,
    thermalView: false,
    style: 'session',
    firesPerDay: 2,
    morningHour: 7,
    eveningHour: 18,
    sessionHours: 2.5,
    feedKgH: 2.5,
    loadKg: 6,
    burnMinutes: 75,
    moisture: 17,
    packing: MODEL.packing,
    feedCover: MODEL.feedCover,
    lidAfterFire: true,
    bore: MACHINE.bore,
    riserHeight: MACHINE.riserHeight,
    topGap: MACHINE.topGap,
    riserInsulation: 'firebrick',
    ductLength: MACHINE.ductLength,
    chimneyTop: MACHINE.chimneyTop,
    flueInsulated: true,
    ductFilm: 1,
    benchFill: 'cob',
    benchK: COB.k,
    houseH: 106,
    gains: MODEL.gains,
    outsideMean: 2.1,
    outsideSwing: MODEL.swing,
    neutralZ: MODEL.neutralZ,
    fanPa: 0,
    damperClosed: false,
    damperK: 0,
    leakCm2: 1,
    oldStoveEta: 0.35,
  };
  switch (id) {
    case 'j-tube':
      return base;
    case 'batch-load': {
      const batch = { ...base, style: 'batch' as const, bore: 0.15 };
      return { ...batch, feedCover: batchCover(batch), packing: 1 };
    }
    case 'pebble-bench':
      return { ...base, benchFill: 'pebble', benchK: PEBBLE.k };
    case 'yurt':
      // ESTIMATE: a small, very tight round house. K17 of the research: about 3 m of bench, 3 to 4 fires a week of about an hour, about one stère in a season: a day's worth burned in one sitting
      return { ...base, ductLength: 3, firesPerDay: 1, sessionHours: 1, houseH: 40 };
  }
}

/** A gesture a scenario can make at a moment. */
export type Gesture = 'lightFire' | 'addLoad' | 'closeLid' | 'warmFlue';

/** A change scheduled in a scenario, at a time in real seconds. */
export interface ScheduledEvent {
  at: number;
  patch?: Partial<HeaterParams>;
  gesture?: Gesture;
}

/** 'settled': the machine in its daily rhythm under these settings. 'cold-soak': days without fire, a warm room heated some other way, a flue full of outside air pouring in. */
export type StartState = 'settled' | 'cold-soak';

export interface ScenarioSetup {
  params: HeaterParams;
  start: StartState;
  hour: number;
  events: ScheduledEvent[];
}

export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const s = scenarioBase(id);
  return { ...s, params: { ...s.params, preset: 'custom', hour: s.hour } };
}

function scenarioBase(id: ScenarioId): ScenarioSetup {
  const base = presetParams('j-tube');
  const quiet = { start: 'settled' as const, events: [] as ScheduledEvent[] };
  switch (id) {
    case 'winter-two-fires':
      return { ...quiet, params: base, hour: 5 };
    case 'cold-start':
      // no fire for days, the outside at −5 °C: a cold flue beside a warm room. A minute a second: one fire lit, then, later, a little heat at the foot of the flue
      return {
        params: { ...base, firesPerDay: 0, outsideMean: -5, outsideSwing: 0, timeScale: 60 },
        start: 'cold-soak',
        hour: 7,
        events: [
          { at: 3, gesture: 'lightFire' },
          { at: 25, gesture: 'warmFlue' },
        ],
      };
    case 'one-fire-mild':
      return { ...quiet, params: { ...base, firesPerDay: 1, outsideMean: 8 }, hour: 12 };
    case 'cold-snap':
      return { ...quiet, params: { ...base, outsideMean: -10 }, hour: 5 };
    case 'wet-wood':
      return { ...quiet, params: { ...base, moisture: 30 }, hour: 5 };
    case 'short-bench':
      return { ...quiet, params: { ...base, ductLength: 4.5 }, hour: 5 };
    case 'long-bench':
      return { ...quiet, params: { ...base, ductLength: 18 }, hour: 5 };
    case 'low-chimney':
      return { ...quiet, params: { ...base, chimneyTop: 2.7 }, hour: 5 };
    case 'small-gap':
      return { ...quiet, params: { ...base, topGap: 0.015 }, hour: 5 };
    case 'leaky-house':
      return { ...quiet, params: { ...base, houseH: 300 }, hour: 5 };
    case 'extract-fan':
      // the morning's fire is ending, a kitchen fan comes on: a minute a second
      return {
        params: { ...base, timeScale: 60 },
        start: 'settled',
        hour: 10.25,
        events: [{ at: 3, patch: { fanPa: 10 } }],
      };
    case 'damper-on-embers':
      // the feed has stopped, the flame is falling, embers are left, and a damper is shut in the flue to keep the heat. A minute a second: numbers only
      return {
        params: { ...base, timeScale: 60 },
        start: 'settled',
        hour: 9.75,
        events: [{ at: 3, patch: { damperClosed: true } }],
      };
  }
}
