import { heatingValue } from './combustion';
import { BENCH_COLS, BENCH_ROWS, BENCH_SEGMENTS, DUCT_COL } from './machine';
import { newCounters, Plant, sessionStarts, woodOfDay, type Counters } from './plant';
import { setNodeTemperature, totalBoundaryEnergy, totalEnthalpy } from './thermal';
import type { HeaterParams } from './types';

// Runs that take more than a frame: a day settled into its rhythm, with the frames the 24 h slider reads; the wood a house needs; the sums of the claims. Deterministic, no timer.

export const FRAMES_PER_DAY = 96;
export const FRAME_SECONDS = 900;
const KWH = 3.6e6;

/** What is drawn against the hour: one value per frame, plus the closing one. */
export const SERIES_KEYS = [
  'fire',
  'lid',
  'drum',
  'room',
  'surface',
  'stone',
  'outside',
  'exhaust',
  'chamber',
  'draft',
  'chimney',
  'flow',
  'lambda',
  'flueCo',
  'roomCo',
  'benchMean',
  'drumOut',
  'benchOut',
  'coreOut',
  'flueLoss',
  'seat0',
  'seat1',
  'seat2',
  'seat3',
  'seat4',
  'seat5',
  'front0',
  'front5',
  'wood',
] as const;
export type SeriesKey = (typeof SERIES_KEYS)[number];

export interface DaySummary {
  /** Wood of the day, kg, and its energy, kWh. */
  woodKg: number;
  woodKWh: number;
  /** Shares of the wood's energy, 0 to 1, summing to 1 with the stock's change. */
  shareDrum: number;
  shareBench: number;
  shareCore: number;
  shareFlueIndoors: number;
  shareFlueOutdoors: number;
  shareExit: number;
  shareExitIdle: number;
  shareUnburned: number;
  shareSpill: number;
  /** What the house really keeps of the wood: all but the cap, the flue outdoors, the unburned, the wall behind the bench and the ground. */
  delivered: number;
  /** The same, less the extra cold air the chimney's draw brings in. */
  deliveredNet: number;
  /** What a flue calculation says over the burn: 1 − (the heat at the cap above the room + unburned) / wood. */
  flueEfficiency: number;
  /** Mean power, W: what reaches the house, averaged over the 24 h. */
  meanPower: number;
  /** While the fire is at full rate. */
  meanLambda: number;
  meanChamber: number;
  meanExhaust: number;
  meanDraft: number;
  meanFlow: number;
  peakExhaust: number;
  peakDrum: number;
  peakChamber: number;
  peakDraft: number;
  peakRoomCo: number;
  roomMean: number;
  roomMin: number;
  roomMax: number;
  outsideMean: number;
  /** The hour of the seat's peak at the hot end and at the cold end, after the last fire, and hours since that fire began. */
  peakHourHot: number;
  peakHourCold: number;
  lagHot: number;
  lagCold: number;
  seatHotPeak: number;
  seatColdPeak: number;
  /** The closing error of the energy of the day, over the wood's energy (with gains if no wood). */
  closure: number;
  /** Condensed water, kg, and hours with the exhaust under its dew point. */
  condensate: number;
  belowDewHours: number;
  /** Drift of the coldest-moving mass over the last day, K. */
  drift: number;
  daysRun: number;
  /** Heat through the wall behind the bench and into the ground, kWh. */
  behindKWh: number;
  groundKWh: number;
  envelopeKWh: number;
  airBaseKWh: number;
  airDrawKWh: number;
  gainsKWh: number;
  reversedHours: number;
}

export interface DayResult {
  key: string;
  frames: Float64Array;
  frameSize: number;
  hours: Float64Array;
  series: Record<SeriesKey, Float64Array>;
  counters: Counters;
  summary: DaySummary;
}

/** A guess of the room near its balance: the settling then has little to do. */
function firstGuess(plant: Plant, p: HeaterParams): void {
  const wood = woodOfDay(p);
  const q = (wood * heatingValue(p.moisture) * 0.75) / 86400 + p.gains;
  const room = Math.max(2, Math.min(32, p.outsideMean + q / p.houseH));
  plant.setField(room, room + 9, room + 60, room + 3, p.outsideMean + 3);
  plant.time = 0;
  plant.m = 0.002;
}

function record(plant: Plant, series: DayResult['series'], f: number): void {
  const net = plant.net;
  const T = net.T;
  const s = series;
  s.fire[f] = plant.powerFire;
  s.lid[f] = T[plant.lid]!;
  s.drum[f] = (T[plant.lid]! + T[plant.upper]! + T[plant.lower]!) / 3;
  s.room[f] = T[plant.air]!;
  s.surface[f] = T[plant.surf]!;
  s.stone[f] = T[plant.stone[0]!]!;
  s.outside[f] = T[plant.outside]!;
  s.exhaust[f] = plant.exhaustT;
  s.chamber[f] = plant.chamberT;
  s.draft[f] = plant.draft;
  s.chimney[f] = plant.draftChimney;
  s.flow[f] = plant.m;
  s.lambda[f] = plant.lambda;
  s.flueCo[f] = plant.flueCo;
  s.roomCo[f] = plant.roomCo;
  s.benchMean[f] = plant.benchMeanT();
  s.drumOut[f] = plant.drumOutNow;
  s.benchOut[f] = plant.benchOutNow;
  s.coreOut[f] = plant.coreOutNow;
  s.flueLoss[f] = plant.flueLossNow;
  s.seat0[f] = plant.surfaceT(0, false);
  s.seat1[f] = plant.surfaceT(1, false);
  s.seat2[f] = plant.surfaceT(2, false);
  s.seat3[f] = plant.surfaceT(3, false);
  s.seat4[f] = plant.surfaceT(4, false);
  s.seat5[f] = plant.surfaceT(5, false);
  s.front0[f] = plant.surfaceT(0, true);
  s.front5[f] = plant.surfaceT(5, true);
  s.wood[f] = plant.feedRate * 3600;
}

/** Bring the time to a boundary of `seconds`. */
function advance(plant: Plant, seconds: number, fine: 'live' | 'day' | 'settling'): void {
  let left = seconds;
  while (left > 1e-9) {
    const dt = Math.min(plant.stepLimit(fine), left);
    plant.step(dt);
    left -= dt;
  }
}

/**
 * Days run until a day ends where it began. A day that ends with more heat than it began means a house still warming towards its balance: the whole house is lifted by the
 * stock it gained over what its H would lose in a day, a Newton step on the one slow mode, and the next day checks it. Only the last day counts: its energy closes on its own.
 */
function settle(plant: Plant, p: HeaterParams): { days: number; drift: number } {
  const net = plant.net;
  const n = net.n;
  const start = new Float64Array(n);
  let days = 0;
  let drift = Infinity;
  while (days < 8) {
    start.set(net.T);
    const H0 = totalEnthalpy(net);
    advance(plant, 86400, days < 2 ? 'settling' : 'day');
    days++;
    drift = 0;
    // what matters is the room, its walls and the bench: the slabs drift slowly on their own, by little, and the core follows the fire
    drift = Math.abs(net.T[plant.air]! - start[plant.air]!);
    drift = Math.max(drift, Math.abs(net.T[plant.stone[0]!]! - start[plant.stone[0]!]!));
    // the top of the bench, the heat in reach of the seat: the cells near the slab drift a little longer, by little
    for (let s = 0; s < BENCH_SEGMENTS; s++) {
      const i = plant.cells[DUCT_COL + BENCH_COLS * (BENCH_ROWS - 1) + BENCH_COLS * BENCH_ROWS * s]!;
      drift = Math.max(drift, Math.abs(net.T[i]! - start[i]!));
    }
    if (drift < 0.05) break;
    const lift = (totalEnthalpy(net) - H0) / (86400 * p.houseH);
    for (let i = 0; i < n; i++) if (!net.fixed[i]) setNodeTemperature(net, i, net.T[i]! + lift);
  }
  return { days, drift };
}

function peakAfter(hours: Float64Array, y: Float64Array, from: number): { hour: number; value: number } {
  let best = -Infinity;
  let at = from;
  const n = hours.length - 1;
  for (let k = 0; k < n; k++) {
    const f = (Math.round((from / 24) * n) + k) % n;
    if (y[f]! > best) {
      best = y[f]!;
      at = hours[f]!;
    }
  }
  return { hour: at, value: best };
}

const CACHE = new Map<string, DayResult>();
const CACHE_LIMIT = 24;

/** The settings a day depends on, nothing of the clock or the view. */
export function physicsKey(p: HeaterParams): string {
  const { slowMo: _a, timeScale: _b, running: _c, preset: _d, hour: _e, thermalView: _f, oldStoveEta: _g, ...rest } = p;
  return JSON.stringify(rest);
}

/** The day of a machine and a house once settled into its rhythm: frames from midnight to midnight. Cached: it depends on the settings only. */
export function settledDay(p: HeaterParams, grain: 'live' | 'day' = 'day'): DayResult {
  const key = `${physicsKey(p)}|${grain}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const plant = new Plant(p);
  firstGuess(plant, p);
  const { days, drift } = settle(plant, p);
  plant.time = Math.round(plant.time / 86400) * 86400;
  plant.counters = newCounters();
  const net = plant.net;
  const H0 = totalEnthalpy(net);
  const E0 = totalBoundaryEnergy(net);
  const pools0 = plant.eVol + plant.eChar;

  const size = plant.snapshotSize();
  const frames = new Float64Array(size * (FRAMES_PER_DAY + 1));
  const hours = new Float64Array(FRAMES_PER_DAY + 1);
  const series = {} as DayResult['series'];
  for (const k of SERIES_KEYS) series[k] = new Float64Array(FRAMES_PER_DAY + 1);
  for (let f = 0; f <= FRAMES_PER_DAY; f++) {
    hours[f] = (f * FRAME_SECONDS) / 3600;
    plant.snapshot(frames, f * size);
    record(plant, series, f);
    if (f < FRAMES_PER_DAY) advance(plant, FRAME_SECONDS, grain);
  }
  // the first frame sits on the end of the settling: read it again from the closing one
  for (const k of SERIES_KEYS) series[k][0] = series[k][FRAMES_PER_DAY]!;

  const c = plant.counters;
  const dH = totalEnthalpy(net) - H0;
  const dB = totalBoundaryEnergy(net) - E0;
  const dPools = plant.eVol + plant.eChar - pools0;
  const inflow = c.released + c.gains + c.airBase + c.airDraw - c.exitFire - c.exitIdle;
  const closure = (inflow - dH - dB) / Math.max(c.wood + c.gains, 1);
  const wood = Math.max(c.wood, 1);
  const benchLosses = c.behindBench + c.ground;
  const delivered = (c.wood - dPools - c.exitFire - c.exitIdle - c.toFlueOutdoors - c.unburned - benchLosses) / wood;
  const starts = sessionStarts(p);
  const lastFire = starts.length ? starts[starts.length - 1]! : 0;
  const hot = peakAfter(hours, series.seat0, lastFire);
  const cold = peakAfter(hours, series.seat5, lastFire);
  const lag = (h: number) => (h - lastFire + 24) % 24;
  let roomMin = Infinity;
  let roomMax = -Infinity;
  let roomSum = 0;
  let outSum = 0;
  for (let f = 0; f < FRAMES_PER_DAY; f++) {
    const r = series.room[f]!;
    if (r < roomMin) roomMin = r;
    if (r > roomMax) roomMax = r;
    roomSum += r;
    outSum += series.outside[f]!;
  }
  const full = Math.max(c.fullSeconds, 1);
  const summary: DaySummary = {
    woodKg: c.wood / heatingValue(p.moisture),
    woodKWh: c.wood / KWH,
    shareDrum: c.toDrum / wood,
    shareBench: c.toBench / wood,
    shareCore: c.toCore / wood,
    shareFlueIndoors: c.toFlueIndoors / wood,
    shareFlueOutdoors: c.toFlueOutdoors / wood,
    shareExit: c.exitFire / wood,
    shareExitIdle: c.exitIdle / wood,
    shareUnburned: c.unburned / wood,
    shareSpill: c.spill / wood,
    delivered,
    deliveredNet: delivered + c.airDraw / wood,
    flueEfficiency: 1 - (c.exitFire + c.toFlueOutdoors + c.unburned) / wood,
    meanPower: (delivered * wood) / 86400,
    meanLambda: c.sumLambda / full,
    meanChamber: c.sumChamber / full,
    meanExhaust: c.sumExhaust / full,
    meanDraft: c.sumDraft / full,
    meanFlow: c.sumFlow / full,
    peakExhaust: c.peakExhaust,
    peakDrum: c.peakDrum,
    peakChamber: c.peakChamber,
    peakDraft: c.peakDraft,
    peakRoomCo: c.peakRoomCo,
    roomMean: roomSum / FRAMES_PER_DAY,
    roomMin,
    roomMax,
    outsideMean: outSum / FRAMES_PER_DAY,
    peakHourHot: hot.hour,
    peakHourCold: cold.hour,
    lagHot: lag(hot.hour),
    lagCold: lag(cold.hour),
    seatHotPeak: hot.value,
    seatColdPeak: cold.value,
    closure,
    condensate: c.condensate,
    belowDewHours: c.belowDewSeconds / 3600,
    drift,
    daysRun: days,
    behindKWh: c.behindBench / KWH,
    groundKWh: c.ground / KWH,
    envelopeKWh: c.envelope / KWH,
    airBaseKWh: c.airBase / KWH,
    airDrawKWh: c.airDraw / KWH,
    gainsKWh: c.gains / KWH,
    reversedHours: c.reversedSeconds / 3600,
  };
  const result: DayResult = { key, frames, frameSize: size, hours, series, counters: c, summary };
  if (CACHE.size >= CACHE_LIMIT) CACHE.delete(CACHE.keys().next().value as string);
  CACHE.set(key, result);
  return result;
}

/** The settings with a day of this much wood, kg: longer sessions at the same feed, up to 6 h, then a faster feed. */
export function withWood(p: HeaterParams, kg: number): HeaterParams {
  const fires = Math.max(1, Math.round(p.firesPerDay) || 2);
  const perFire = kg / fires;
  if (p.style === 'batch') return { ...p, firesPerDay: fires, loadKg: perFire };
  const hours = perFire / p.feedKgH;
  if (hours <= 6) return { ...p, firesPerDay: fires, sessionHours: hours };
  return { ...p, firesPerDay: fires, sessionHours: 6, feedKgH: perFire / 6 };
}

export interface WoodAnswer {
  kg: number;
  delivered: number;
  reached: boolean;
}

/**
 * The wood a day takes to hold the room at a mean of `target`, kg, by the full model: a secant on the settled day, one settled day at each step, so that a panel can spread them over
 * frames. Gives up at `max` kg: that is an answer too.
 */
export function* woodSearch(p: HeaterParams, target = 20, max = 90): Generator<null, WoodAnswer, void> {
  let a = Math.max(2, woodOfDay(p));
  let dayA = settledDay(withWood(p, a));
  yield null;
  // a first guess from the house's own H: each kg a day is worth about 150 W at this efficiency
  const first = a + ((target - dayA.summary.roomMean) * p.houseH) / 150;
  let b = Math.max(1, Math.min(max, first));
  if (Math.abs(b - a) < 0.2) b = a + 1;
  let dayB = settledDay(withWood(p, b));
  yield null;
  for (let i = 0; i < 5; i++) {
    const ra = dayA.summary.roomMean;
    const rb = dayB.summary.roomMean;
    if (Math.abs(rb - target) < 0.1 || Math.abs(rb - ra) < 1e-6) break;
    const next = Math.max(1, Math.min(max, b + ((target - rb) * (b - a)) / (rb - ra)));
    a = b;
    dayA = dayB;
    b = next;
    dayB = settledDay(withWood(p, b));
    yield null;
  }
  return { kg: b, delivered: dayB.summary.delivered, reached: Math.abs(dayB.summary.roomMean - target) < 0.6 };
}

/** The same, at once. */
export function woodForRoom(p: HeaterParams, target = 20, max = 90): WoodAnswer {
  const g = woodSearch(p, target, max);
  let r = g.next();
  while (!r.done) r = g.next();
  return r.value;
}

/** K55: what changing the stove alone saves, a share: 1 − η_old / η_new. */
export const woodSaved = (etaOld: number, etaNew: number): number => 1 - etaOld / etaNew;

/** The efficiency an old stove must have really had for a saving to come from the stove alone. */
export const etaOldFor = (saving: number, etaNew: number): number => (1 - saving) * etaNew;

export interface ClaimCheck {
  /** Delivered efficiency of this machine, this house. */
  eta: number;
  woodNew: number;
  woodOld: number;
  /** Saving from the stove alone, in this house. */
  savedByStove: number;
  /** What an old stove needs to have run at for 80 % and 90 %. */
  etaFor80: number;
  etaFor90: number;
  /** The same wood heat in a leaky house, by the same old stove: the saving of insulating and changing the stove together. */
  woodOldLeaky: number;
  savedWithInsulation: number;
  leakyH: number;
}

/**
 * The claim put to the model. A day of this machine holds the room; the same heat from an old stove of efficiency `etaOld` takes more wood, and from the same stove in a leakier
 * house, more again. No lab measured any of this: the comparison is the model's own delivered efficiency against a stated old stove.
 */
export function claimCheck(p: HeaterParams, etaOld: number, leakyH = 300): ClaimCheck {
  const day = settledDay(p);
  const eta = day.summary.delivered;
  const woodNew = day.summary.woodKg;
  const woodOld = (woodNew * eta) / etaOld;
  const dT = Math.max(day.summary.roomMean - day.summary.outsideMean, 1);
  const heat = (woodNew * heatingValue(p.moisture) * eta) / 86400;
  const leakyHeat = heat + (leakyH - p.houseH) * dT;
  const woodOldLeaky = (leakyHeat * 86400) / (heatingValue(p.moisture) * etaOld);
  return {
    eta,
    woodNew,
    woodOld,
    savedByStove: woodSaved(etaOld, eta),
    etaFor80: etaOldFor(0.8, eta),
    etaFor90: etaOldFor(0.9, eta),
    woodOldLeaky,
    savedWithInsulation: 1 - woodNew / woodOldLeaky,
    leakyH,
  };
}

/** A body's skin after a pulse: the power at the surface against time, from a one-dimensional slab heated on its inner face for `hours`. For K30 and K56. */
export function skinResponse(
  thickness: number,
  rho: number,
  c: number,
  k: number,
  heatHours = 1,
  h = 9,
  cells = 12,
): { peakHour: number; half: number; quarter: number; t: number[]; q: number[] } {
  const dx = thickness / cells;
  const alpha = k / (rho * c);
  const dt = Math.min(0.4 * ((dx * dx) / alpha), 60);
  const T = new Float64Array(cells);
  const steps = Math.ceil((48 * 3600) / dt);
  const G = k / dx;
  const Cc = rho * c * dx;
  const Gs = 1 / (1 / h + dx / 2 / k);
  // the heat of a fire of one hour, in W/m²
  const flux = 1000;
  const t: number[] = [];
  const q: number[] = [];
  let peak = 0;
  let peakAt = 0;
  for (let n = 0; n < steps; n++) {
    const now = n * dt;
    const next = T.slice();
    for (let i = 0; i < cells; i++) {
      let d = 0;
      if (i > 0) d += G * (T[i - 1]! - T[i]!);
      if (i < cells - 1) d += G * (T[i + 1]! - T[i]!);
      if (i === 0 && now < heatHours * 3600) d += flux;
      if (i === cells - 1) d -= Gs * T[i]!;
      next[i] = T[i]! + (dt * d) / Cc;
    }
    T.set(next);
    const out = Gs * T[cells - 1]!;
    if (out > peak) {
      peak = out;
      peakAt = now;
    }
    if (n % Math.ceil(600 / dt) === 0) {
      t.push(now / 3600);
      q.push(out);
    }
  }
  const at = (hour: number): number => {
    const i = Math.min(t.length - 1, Math.round((hour / t[t.length - 1]!) * (t.length - 1)));
    return q[i]! / peak;
  };
  return { peakHour: peakAt / 3600, half: at(12), quarter: at(24), t, q };
}
