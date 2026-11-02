import type { LabSim } from '@onigam/lab-kit/ui';
import { ASH_SHARE, BENCH_COLS, BENCH_ROWS, BENCH_SEGMENTS, DUCT_COL, DUCT_ROW, MODEL } from './machine';
import { geometryKey, newCounters, Plant, dailyOutside } from './plant';
import {
  presetParams,
  RANGES,
  scenarioSetup,
  type Gesture,
  type RangedKey,
  type ScheduledEvent,
  type StartState,
} from './presets';
import {
  claimCheck,
  FRAME_SECONDS,
  FRAMES_PER_DAY,
  physicsKey,
  settledDay,
  woodForRoom,
  woodSearch,
  type ClaimCheck,
  type DayResult,
  type WoodAnswer,
} from './runs';
import { heatingValue } from './combustion';
import {
  STATIONS,
  type AlarmKey,
  type HeaterParams,
  type HeaterState,
  type PresetId,
  type ScenarioId,
  type Scope,
} from './types';

// MassHeaterSim: the whole machine as the kit's `LabSim`. Two clocks. The flame and the gases move on the real one (`dt`, scaled by the slow motion for what is drawn); the hour, the fire's
// fuel, the bench and the room on the slow one (`dt × timeScale`, read at every step). With `timeScale` at 0 the bench stops and the flame runs on, which is how a film holds a burning
// stove at seven in the morning. Deterministic: nothing is drawn at run time, no timer, no wall clock.

/** Longest real step taken at once, s. */
const DT_MAX = 0.25;
/** The machine is stepped at least this often, in real seconds, so that a slider moved at low speed answers at once. */
const REFRESH = 0.25;
/** Most steps of the machine in one frame. */
const MAX_STEPS = 40;
/** Real seconds the geometry must stay unchanged before a new machine is built and settled. */
const QUIET = 0.35;
/** How fast what is drawn follows the gas, s. */
const FLOW_TAU = 2;
/** One sample every five simulated minutes, three days of them. */
const SCOPE_EVERY = 300;
const SCOPE_LENGTH = 864;

/** ESTIMATE, limits of the alarms: a drum's paint, a comfortable seat, a room. Above the alarm of a chamber, CLEAN_T's report. */
export const LIMITS = { drumPaint: 300, seat: 45, roomCold: 14, chamberCold: 350, lambdaLow: 1.4 } as const;

const TIME_KEYS = new Set<keyof HeaterParams>(['slowMo', 'timeScale', 'running', 'hour', 'thermalView']);

function newState(): HeaterState {
  const cols = BENCH_COLS;
  const rows = BENCH_ROWS;
  const n = STATIONS.length;
  return {
    simTime: 0,
    day: 0,
    hour: 0,
    outsideT: 0,
    fireCount: 0,
    burning: 0,
    flowDirection: 1,
    coAlarm: 0,
    benchPeakHour: 0,
    phase: 'cold',
    firePower: 0,
    woodToday: 0,
    woodTotal: 0,
    ash: 0,
    feedLevel: 0,
    emberGlow: 0,
    flameLength: 0,
    flameStrength: 0,
    smokeAtCap: 0,
    steamAtCap: 0,
    smokeInRoom: 0,
    flameClock: 0,
    airFlow: 0,
    gasFlow: 0,
    riserSpeed: 0,
    ductSpeed: 0,
    chimneySpeed: 0,
    lambda: 0,
    o2: 21,
    pathT: new Float64Array(n),
    pathP: new Float64Array(n),
    pathS: new Float64Array(n),
    chamberT: 0,
    riserTopT: 0,
    afterDrumT: 0,
    exhaustT: 0,
    dewPointT: 0,
    condensate: 0,
    condensing: false,
    draft: 0,
    draftRiser: 0,
    draftDrum: 0,
    draftChimney: 0,
    lidPressure: 0,
    brickT: 0,
    casingT: 0,
    linerT: 0,
    sleeveT: 0,
    drumLidT: 0,
    drumUpperT: 0,
    drumLowerT: 0,
    flueInT: 0,
    flueOutT: 0,
    benchT: new Float64Array(cols * rows * BENCH_SEGMENTS),
    benchCols: cols,
    benchRows: rows,
    benchSegments: BENCH_SEGMENTS,
    ductCol: DUCT_COL,
    ductRow: DUCT_ROW,
    benchColEdges: new Float64Array(cols + 1),
    benchRowEdges: Array.from({ length: BENCH_SEGMENTS }, () => new Float64Array(rows + 1)),
    segmentLength: 0,
    seatT: new Float64Array(BENCH_SEGMENTS),
    frontT: new Float64Array(BENCH_SEGMENTS),
    ductGasT: new Float64Array(BENCH_SEGMENTS),
    seatHotT: 0,
    seatColdT: 0,
    roomT: 0,
    surfaceT: 0,
    stoneT: 0,
    drumOut: 0,
    benchOut: 0,
    coreOut: 0,
    flueLoss: 0,
    envelopeLoss: 0,
    ventilation: 0,
    regime: 'none',
    flueCo: 0,
    flueCoLow: 0,
    flueCoHigh: 0,
    roomCo: 0,
    coIntoRoom: 0,
    leakShare: 0,
    alarms: [],
  };
}

export class MassHeaterSim implements LabSim {
  readonly params: HeaterParams;
  readonly state: HeaterState = newState();
  readonly scope: Scope = {
    t: [],
    fire: [],
    drum: [],
    seatHot: [],
    seatCold: [],
    room: [],
    exhaust: [],
    draft: [],
    co: [],
  };
  private plant: Plant;
  private listeners = new Set<() => void>();
  private events: ScheduledEvent[] = [];
  private fired = new Set<number>();
  private scriptTime = 0;
  private lastKind: 'preset' | 'scenario' = 'preset';
  private lastId: PresetId | ScenarioId = 'j-tube';
  private pending = 0;
  private sinceRefresh = 0;
  private sinceScope = 0;
  private quiet = 0;
  private geometryDirty = false;
  private shownFlow = 0;
  private clock0 = 0;
  private woodMark = 0;
  private dayMark = -1;
  private day: DayResult | null = null;
  private cache = new Map<string, unknown>();

  constructor() {
    this.params = presetParams('j-tube');
    this.plant = new Plant(this.params);
    this.placeInDay('settled', this.params.hour);
    this.resetScope();
    this.sample();
    this.refresh();
  }

  // ------------------------------------------------------------------ the LabSim contract

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters, clamped to their ranges. Anything physical turns the preset into 'custom'. Setting `hour` moves the machine to that hour of its settled day. */
  set(patch: Partial<HeaterParams>): void {
    const p = this.params as unknown as Record<string, unknown>;
    let physical = false;
    let seekTo: number | null = null;
    const before = geometryKey(this.params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key === 'hour') {
        seekTo = ((Number(value) % 24) + 24) % 24;
        continue;
      }
      if (key in RANGES) {
        const r = RANGES[key as RangedKey];
        p[key] = Math.min(r.max, Math.max(r.min, Number(value)));
      } else if (key === 'slowMo' || key === 'timeScale') {
        p[key] = Math.max(0, Number(value));
      } else {
        p[key] = value;
      }
      if (!TIME_KEYS.has(key as keyof HeaterParams) && key !== 'preset') physical = true;
    }
    if (physical && patch.preset === undefined) this.params.preset = 'custom';
    if (physical) {
      if (geometryKey(this.params) !== before) {
        this.geometryDirty = true;
        this.quiet = QUIET;
      } else {
        this.plant.apply(this.params);
        this.day = null;
      }
    }
    if (seekTo !== null) this.seekHour(seekTo);
    this.emit();
  }

  applyPreset(id: string): void {
    this.lastKind = 'preset';
    this.lastId = id as PresetId;
    this.load(presetParams(id as PresetId), 'settled', presetParams(id as PresetId).hour, []);
  }

  applyScenario(id: string): void {
    this.lastKind = 'scenario';
    this.lastId = id as ScenarioId;
    const s = scenarioSetup(id as ScenarioId);
    this.load(s.params, s.start, s.hour, s.events);
  }

  /** Start again from the last preset or scenario. */
  reset(): void {
    if (this.lastKind === 'preset') this.applyPreset(this.lastId);
    else this.applyScenario(this.lastId);
  }

  private load(next: HeaterParams, start: StartState, hour: number, events: ScheduledEvent[]): void {
    const keep = { slowMo: this.params.slowMo, running: this.params.running, thermalView: this.params.thermalView };
    Object.assign(this.params, next, keep);
    this.events = events;
    this.fired.clear();
    this.scriptTime = 0;
    this.pending = 0;
    this.sinceRefresh = 0;
    this.sinceScope = 0;
    this.geometryDirty = false;
    if (this.plant.key !== geometryKey(this.params)) this.plant = new Plant(this.params);
    else this.plant.apply(this.params);
    this.placeInDay(start, hour);
    this.resetScope();
    this.sample();
    this.refresh();
    this.emit();
  }

  /** The machine at its starting point: its settled day read at an hour, or a cold soak. */
  private placeInDay(start: StartState, hour: number): void {
    const plant = this.plant;
    const p = this.params;
    if (start === 'cold-soak') {
      const out = p.outsideMean;
      plant.setField(20, 14, 14, out, out);
      plant.time = hour * 3600;
      plant.m = -0.003;
      plant.eVol = 0;
      plant.eChar = 0;
      plant.roomCo = 0;
      plant.coDose = 0;
      plant.coAlarm = 0;
      plant.whoMeans.fill(0);
      plant.apply(p);
      plant.settle();
      this.day = null;
      plant.counters = newCounters();
      plant.step(1);
    } else {
      this.day = settledDay(p);
      this.seekFrame(hour);
      plant.counters = newCounters();
    }
    plant.fireCount = 0;
    this.clock0 = plant.time;
    this.woodMark = 0;
    this.dayMark = Math.floor(plant.time / 86400);
    this.state.benchPeakHour = this.day ? this.day.summary.peakHourHot : 0;
    this.state.simTime = 0;
    this.state.woodToday = 0;
    this.state.woodTotal = 0;
    this.shownFlow = plant.m;
  }

  /** Read the frame nearest an hour of the settled day of the present settings. */
  private seekFrame(hour: number): void {
    const day = this.day ?? settledDay(this.params);
    this.day = day;
    const f = Math.round((hour * 3600) / FRAME_SECONDS) % FRAMES_PER_DAY;
    const count = this.plant.fireCount;
    this.plant.restore(day.frames, f * day.frameSize);
    this.plant.fireCount = count;
    this.plant.apply(this.params);
    this.plant.settle();
    this.plant.stepIn();
  }

  /** The 24 h slider: the machine at that hour of its settled day, its colours and the charts following. Live play carries on from there. */
  private seekHour(hour: number): void {
    if (this.geometryDirty) this.rebuildNow();
    this.seekFrame(hour);
    this.pending = 0;
    this.shownFlow = this.plant.m;
    this.clock0 = this.plant.time;
    this.woodMark = this.state.woodTotal;
    this.dayMark = Math.floor(this.plant.time / 86400);
    this.resetScope();
    this.sample();
    this.refresh();
  }

  private rebuildNow(): void {
    this.geometryDirty = false;
    const hour = (this.plant.time / 3600) % 24;
    this.plant = new Plant(this.params);
    this.day = settledDay(this.params);
    this.seekFrame(hour);
    this.plant.counters = newCounters();
    this.refresh();
  }

  /** Force what a quiet moment would do: a new machine after a change of geometry. */
  flush(): void {
    if (this.geometryDirty) this.rebuildNow();
  }

  // ------------------------------------------------------------------ gestures a film can ask for

  /** Light a fire now, whatever the schedule says. */
  lightFire(): void {
    this.plant.lightNow();
    this.refresh();
    this.emit();
  }

  /** One more load in the feed: half an hour of the feed. */
  addLoad(): void {
    this.plant.addWood(this.params.feedKgH / 2);
    if (this.plant.phase === 'cold') this.plant.lightNow();
    this.refresh();
    this.emit();
  }

  /** The lid on the feed. Not a door: it limits the air, and the flue stays open. */
  closeLid(): void {
    this.set({ feedCover: 1 });
  }

  openLid(): void {
    this.set({ feedCover: MODEL.feedCover });
  }

  /** A little heat at the foot of the flue for a few minutes. */
  warmFlue(): void {
    this.plant.warmFlue();
    this.emit();
  }

  // ------------------------------------------------------------------ time

  step(dtReal: number): void {
    const dt = Math.min(Math.max(dtReal, 0), DT_MAX);
    if (this.geometryDirty) {
      this.quiet -= dt;
      if (this.quiet <= 0) this.rebuildNow();
    }
    if (!this.params.running || dt === 0) return;
    this.advanceScript(dt);
    const p = this.params;
    const clockDt = dt * p.timeScale;
    this.pending += clockDt;
    this.sinceRefresh += dt;
    const plant = this.plant;
    let n = 0;
    while (n < MAX_STEPS) {
      const limit = plant.stepLimit('live');
      if (this.pending < limit) break;
      plant.step(limit);
      this.afterStep(limit);
      this.pending -= limit;
      n++;
    }
    if (n === MAX_STEPS) this.pending = 0;
    if (n === 0 && this.sinceRefresh >= REFRESH && this.pending > 0) {
      const d = this.pending;
      plant.step(d);
      this.afterStep(d);
      this.pending = 0;
      n = 1;
    }
    // what follows the flow on the real clock, whatever the slow one does
    this.shownFlow += (plant.m - this.shownFlow) * (1 - Math.exp(-(dt + clockDt) / FLOW_TAU));
    const s = this.state;
    s.flameClock += dt * p.slowMo;
    if (n > 0) {
      this.sinceRefresh = 0;
      this.refresh();
    } else this.refreshFlow();
  }

  private afterStep(dt: number): void {
    const plant = this.plant;
    const s = this.state;
    s.woodTotal += plant.feedRate * dt;
    const d = Math.floor(plant.time / 86400);
    if (d !== this.dayMark) {
      this.dayMark = d;
      this.woodMark = s.woodTotal;
    }
    this.sinceScope += dt;
    if (this.sinceScope >= SCOPE_EVERY) {
      this.sinceScope = 0;
      this.sample();
    }
  }

  private advanceScript(dt: number): void {
    this.scriptTime += dt;
    this.events.forEach((e, i) => {
      if (this.fired.has(i) || this.scriptTime < e.at) return;
      this.fired.add(i);
      if (e.patch) {
        const preset = this.params.preset;
        this.set(e.patch);
        this.params.preset = preset;
      }
      if (e.gesture) this.gesture(e.gesture);
    });
  }

  private gesture(g: Gesture): void {
    if (g === 'lightFire') this.lightFire();
    else if (g === 'addLoad') this.addLoad();
    else if (g === 'warmFlue') this.warmFlue();
    else this.closeLid();
  }

  // ------------------------------------------------------------------ the state

  private refreshFlow(): void {
    const s = this.state;
    const plant = this.plant;
    const m = this.shownFlow;
    s.airFlow = m;
    s.flowDirection = Math.abs(m) < 2e-5 ? 0 : m > 0 ? 1 : -1;
    const A = (Math.PI * this.params.bore * this.params.bore) / 4;
    const speed = (t: number) => (m * 287 * (t + 273.15)) / (101325 * A);
    s.gasFlow = m + (m > 0 ? plant.powerFire / heatingValue(this.params.moisture) : 0);
    s.riserSpeed = speed(plant.pathT[3]!);
    s.ductSpeed = speed(plant.pathT[8]!);
    s.chimneySpeed = speed(plant.pathT[10]!);
    const q = plant.powerFire;
    s.flameStrength = Math.max(0, Math.min(1, q / 15000));
    const reach = 0.1 + 0.5 * Math.sqrt(q / 10000);
    s.flameLength = plant.phase === 'cold' || plant.phase === 'embers' ? 0 : (m >= 0 ? 1 : -1) * Math.min(reach, 0.9);
  }

  private refresh(): void {
    const s = this.state;
    const p = this.params;
    const plant = this.plant;
    const net = plant.net;
    const T = net.T;
    const hour = (plant.time / 3600) % 24;
    s.simTime = plant.time - this.clock0;
    s.day = Math.floor(plant.time / 86400);
    s.hour = hour;
    p.hour = hour;
    s.outsideT = dailyOutside(p, hour);
    s.fireCount = plant.fireCount;
    s.phase = plant.phase;
    s.burning = plant.phase === 'cold' ? 0 : 1;
    s.coAlarm = plant.coAlarm;
    s.firePower = plant.powerFire;
    s.woodToday = s.woodTotal - this.woodMark;
    s.ash = s.woodTotal * ASH_SHARE;
    const kgHu = heatingValue(p.moisture);
    s.feedLevel = Math.max(0, Math.min(1, plant.eVol / (kgHu * 0.15)));
    s.emberGlow = Math.max(0, Math.min(1, plant.eChar / 7.2e6));
    s.lambda = plant.lambda;
    s.o2 = plant.lambda > 1 ? 21 * (1 - 1 / plant.lambda) : plant.lambda > 0 ? 0 : 21;
    s.pathT.set(plant.pathT);
    s.pathP.set(plant.pathP);
    s.pathS.set(plant.pathS);
    s.chamberT = plant.chamberT;
    s.riserTopT = plant.riserTopT;
    s.afterDrumT = plant.afterDrumT;
    s.exhaustT = plant.exhaustT;
    s.dewPointT = plant.dewT;
    s.condensate = plant.condensate * 3600;
    s.condensing = plant.condensing;
    s.draft = plant.draft;
    s.draftRiser = plant.draftRiser;
    s.draftDrum = plant.draftDrum;
    s.draftChimney = plant.draftChimney;
    s.lidPressure = plant.lidPressure;
    s.brickT = T[plant.brick]!;
    s.casingT = T[plant.casing]!;
    s.linerT = T[plant.linerIn]!;
    s.sleeveT = T[plant.sleeve]!;
    s.drumLidT = T[plant.lid]!;
    s.drumUpperT = T[plant.upper]!;
    s.drumLowerT = T[plant.lower]!;
    s.flueInT = T[plant.flueIn]!;
    s.flueOutT = T[plant.flueOut]!;
    const cells = plant.cells;
    const nCells = BENCH_COLS * BENCH_ROWS;
    for (let seg = 0; seg < BENCH_SEGMENTS; seg++) {
      s.seatT[seg] = plant.surfaceT(seg, false);
      s.frontT[seg] = plant.surfaceT(seg, true);
      s.ductGasT[seg] = plant.ductGasT[seg]!;
      for (let c = 0; c < nCells; c++) {
        const node = cells[c + nCells * seg]!;
        s.benchT[c + nCells * seg] = node >= 0 ? T[node]! : plant.ductGasT[seg]!;
      }
      s.benchRowEdges[seg]!.set(plant.rowEdges(seg));
    }
    s.benchColEdges.set(plant.columnEdges());
    s.segmentLength = plant.segmentLength;
    s.seatHotT = s.seatT[0]!;
    s.seatColdT = s.seatT[BENCH_SEGMENTS - 1]!;
    s.roomT = T[plant.air]!;
    s.surfaceT = T[plant.surf]!;
    s.stoneT = T[plant.stone[0]!]!;
    s.drumOut = plant.drumOutNow;
    s.benchOut = plant.benchOutNow;
    s.coreOut = plant.coreOutNow;
    s.flueLoss = plant.flueLossNow;
    s.envelopeLoss = plant.envelopeNow;
    s.ventilation = plant.ventilation;
    s.regime = plant.regime;
    s.flueCo = plant.flueCo;
    s.flueCoLow = plant.flueCo / 3;
    s.flueCoHigh = plant.flueCo * 3;
    s.roomCo = plant.roomCo;
    s.coIntoRoom = plant.coIntoRoom;
    s.leakShare = plant.leakShare;
    const log = Math.log10(Math.max(plant.flueCo, 1) / 300);
    s.smokeAtCap = plant.m > 0 && s.burning ? Math.max(0, Math.min(1, log / 1.5)) : 0;
    s.steamAtCap = plant.m > 0 && s.burning ? Math.max(0, Math.min(1, (plant.dewT - s.outsideT) / 40)) : 0;
    s.smokeInRoom = s.burning ? Math.max(0, Math.min(1, plant.coIntoRoom * Math.min(1, plant.coSource / 2))) : 0;
    this.refreshFlow();
    s.alarms = this.alarms();
  }

  private alarms(): AlarmKey[] {
    const s = this.state;
    const a: AlarmKey[] = [];
    if (s.burning && (this.plant.m < 0 || s.coIntoRoom > 0.3)) a.push('smokeBack');
    if (s.phase === 'roaring' && s.chamberT < LIMITS.chamberCold) a.push('coldChamber');
    if (s.phase === 'roaring' && this.plant.lambda > 0 && this.plant.lambda < LIMITS.lambdaLow) a.push('starved');
    if (s.condensing) a.push('belowDew');
    if (s.drumLidT > LIMITS.drumPaint) a.push('drumHot');
    if (Math.max(s.seatHotT, s.seatColdT) > LIMITS.seat) a.push('seatHot');
    if (this.plant.whoExceeded) a.push('roomCoGuideline');
    if (s.coAlarm) a.push('roomCoAlarm');
    if (s.roomT < LIMITS.roomCold) a.push('roomCold');
    return a;
  }

  private resetScope(): void {
    for (const k of Object.keys(this.scope) as (keyof Scope)[]) this.scope[k].length = 0;
  }

  private sample(): void {
    const sc = this.scope;
    const plant = this.plant;
    const T = plant.net.T;
    sc.t.push((plant.time - this.clock0) / 3600);
    sc.fire.push(plant.powerFire);
    sc.drum.push(T[plant.lid]!);
    sc.seatHot.push(plant.surfaceT(0, false));
    sc.seatCold.push(plant.surfaceT(BENCH_SEGMENTS - 1, false));
    sc.room.push(T[plant.air]!);
    sc.exhaust.push(plant.exhaustT);
    sc.draft.push(plant.draft);
    sc.co.push(plant.roomCo);
    if (sc.t.length > SCOPE_LENGTH) for (const k of Object.keys(sc) as (keyof Scope)[]) sc[k].shift();
  }

  // ------------------------------------------------------------------ what the panel asks for (cached: a few to a few hundred ms)

  private cached<T>(key: string, make: () => T): T {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    const v = make();
    if (this.cache.size > 60) this.cache.clear();
    this.cache.set(key, v);
    return v;
  }

  /** The settled day of the present settings. */
  getDay(): DayResult {
    if (!this.day || this.day.key.indexOf(physicsKey(this.params)) !== 0) this.day = settledDay(this.params);
    this.state.benchPeakHour = this.day.summary.peakHourHot;
    return this.day;
  }

  /** The wood a day takes to hold the room at a mean of 20 °C, kg. */
  getWoodFor(target = 20): WoodAnswer {
    const key = `wood|${target}|${physicsKey(this.params)}`;
    return this.cached(key, () => woodForRoom(this.params, target));
  }

  /** The same, one settled day at each call: `null` until it has its answer, so that a panel can spread it over frames. */
  woodStepper(target = 20): () => WoodAnswer | null {
    const key = `wood|${target}|${physicsKey(this.params)}`;
    const search = woodSearch({ ...this.params }, target);
    return () => {
      if (this.cache.has(key)) return this.cache.get(key) as WoodAnswer;
      const r = search.next();
      if (!r.done) return null;
      this.cache.set(key, r.value);
      return r.value;
    };
  }

  /** The claim put to the model, with the old stove of the slider. */
  getClaim(): ClaimCheck {
    const key = `claim|${this.params.oldStoveEta}|${physicsKey(this.params)}`;
    return this.cached(key, () => claimCheck(this.params, this.params.oldStoveEta));
  }

  /** Mass of the bench, kg. */
  get benchMass(): number {
    return this.plant.benchMassNow();
  }
}
