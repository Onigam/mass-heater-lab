import { describe, expect, it } from 'vitest';
import { LIMITS, MassHeaterSim } from './engine';
import {
  BENCH_COLS,
  BENCH_ROWS,
  BENCH_SEGMENTS,
  COB,
  DUCT_COL,
  DUCT_ROW,
  MACHINE,
  MODEL,
  THERMAL_RAMP,
} from './machine';
import { Plant, sessionStarts, woodOfDay } from './plant';
import {
  DEFAULT_TIME_SCALE,
  presetParams,
  PRESET_IDS,
  RANGES,
  SCENARIO_IDS,
  scenarioSetup,
  SPEEDS,
  type RangedKey,
} from './presets';
import { FRAMES_PER_DAY, settledDay } from './runs';
import { ALARM_TEXTS, PHASE_TEXTS, PRESET_TEXTS, REGIME_TEXTS, SCENARIO_TEXTS } from './texts';
import { totalBoundaryEnergy, totalEnthalpy } from './thermal';
import type { AlarmKey, HeaterParams } from './types';

const J = presetParams('j-tube');

function run(sim: MassHeaterSim, seconds: number, dt = 1 / 30): void {
  for (let t = 0; t < seconds; t += dt) sim.step(dt);
}

function finiteState(sim: MassHeaterSim, label: string): void {
  for (const [k, v] of Object.entries(sim.state)) {
    if (typeof v === 'number') expect(Number.isFinite(v), `${label}: ${k}`).toBe(true);
    if (v instanceof Float64Array) for (const x of v) expect(Number.isFinite(x), `${label}: ${k}`).toBe(true);
  }
}

describe('energy', () => {
  it('a day closes to 1e-6 of its wood, in every preset', () => {
    for (const id of PRESET_IDS) {
      const s = settledDay(presetParams(id)).summary;
      expect(Math.abs(s.closure), id).toBeLessThan(1e-6);
    }
  });
  it('a step closes too, from a cold machine, with a fire, a fan and a reversal in it', () => {
    const p: HeaterParams = { ...J, fanPa: 4, firesPerDay: 2, outsideMean: -5 };
    const plant = new Plant(p);
    plant.setField(18, 15, 15, -5, -5);
    plant.m = -0.002;
    const H0 = totalEnthalpy(plant.net);
    const B0 = totalBoundaryEnergy(plant.net);
    for (let i = 0; i < 2000; i++) plant.step(30);
    const c = plant.counters;
    const inflow = c.released + c.gains + c.airBase + c.airDraw - c.exitFire - c.exitIdle;
    const dH = totalEnthalpy(plant.net) - H0;
    const dB = totalBoundaryEnergy(plant.net) - B0;
    expect(Math.abs(inflow - dH - dB) / Math.max(c.wood, 1)).toBeLessThan(1e-6);
    expect(c.wood).toBeGreaterThan(0);
  });
  it('the wood’s energy is all accounted for: released, unburned, or still in the fire', () => {
    const plant = new Plant(J);
    plant.setField(18, 25, 40, 20, 5);
    for (let i = 0; i < 3000; i++) plant.step(30);
    const c = plant.counters;
    const left = plant.eVol + plant.eChar;
    expect(Math.abs(c.wood - c.released - c.unburned - left) / c.wood).toBeLessThan(1e-9);
  });
  it('the shares of a day sum to the wood, surfaces and losses on each side', () => {
    const d = settledDay(J);
    const s = d.summary;
    const parts =
      s.shareDrum +
      s.shareBench +
      s.shareCore +
      s.shareFlueIndoors +
      s.shareFlueOutdoors +
      s.shareExit +
      s.shareExitIdle +
      s.shareUnburned +
      s.shareSpill;
    expect(parts).toBeCloseTo(1, 2);
    const c = d.counters;
    const house = c.drumOut + c.benchOut + c.coreOut + c.flueOut + c.gains;
    expect(house / (c.envelope - c.airBase - c.airDraw)).toBeCloseTo(1, 1);
  });
  it('a settled day ends where it began', () => {
    const s = settledDay(J).summary;
    expect(s.drift).toBeLessThan(0.1);
    const y = settledDay(J).series;
    expect(y.room[0]).toBeCloseTo(y.room[FRAMES_PER_DAY]!, 6);
  });
});

describe('convergence and cost', () => {
  it('a finer step moves a day’s figures by little', () => {
    const a = settledDay(J, 'day').summary;
    const b = settledDay(J, 'live').summary;
    expect(Math.abs(a.delivered - b.delivered)).toBeLessThan(0.01);
    expect(Math.abs(a.roomMean - b.roomMean)).toBeLessThan(0.3);
    expect(Math.abs(a.meanExhaust - b.meanExhaust)).toBeLessThan(3);
    expect(Math.abs(a.seatHotPeak - b.seatHotPeak)).toBeLessThan(0.5);
  });
  it('conduction along the bench is negligible beside what crosses it, as modelled', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 20.5 });
    const s = sim.state;
    const area = MACHINE.benchDepth * MACHINE.benchHeight - (Math.PI * MACHINE.bore ** 2) / 4;
    let worst = 0;
    for (let i = 0; i < BENCH_SEGMENTS - 1; i++) worst = Math.max(worst, Math.abs(s.seatT[i]! - s.seatT[i + 1]!));
    const along = (COB.k * area * worst) / s.segmentLength;
    expect(along).toBeLessThan(0.02 * s.benchOut);
  });
  it('a step stays cheap on a phone', () => {
    const plant = new Plant(J);
    plant.setField(18, 25, 60, 20, 5);
    for (let i = 0; i < 400; i++) plant.step(60);
    // the fastest of a few batches: this Mac is shared, and a film may be rendering beside it
    let best = Infinity;
    for (let batch = 0; batch < 8; batch++) {
      const t0 = performance.now();
      for (let i = 0; i < 300; i++) plant.step(30);
      best = Math.min(best, ((performance.now() - t0) / 300) * 1000);
    }
    // about 25 µs here; a phone is a few times slower, and a frame at a day in four seconds takes 18 steps
    expect(best).toBeLessThan(200);
  });
  it('a settled day takes about a tenth of a second, and is kept', () => {
    const p = { ...J, houseH: 111 };
    const t0 = performance.now();
    settledDay(p);
    const first = performance.now() - t0;
    expect(first).toBeLessThan(5000);
    const t1 = performance.now();
    settledDay(p);
    expect(performance.now() - t1).toBeLessThan(first / 5);
  });
});

describe('the fire', () => {
  it('two sessions a day, the day’s wood what the settings say', () => {
    expect(sessionStarts(J)).toEqual([7, 18]);
    expect(sessionStarts({ ...J, firesPerDay: 1 })).toEqual([18]);
    expect(sessionStarts({ ...J, firesPerDay: 3 })).toEqual([7, 12.5, 18]);
    expect(sessionStarts({ ...J, firesPerDay: 0 })).toEqual([]);
    expect(woodOfDay(J)).toBe(12.5);
    expect(settledDay(J).summary.woodKg).toBeCloseTo(12.5, 0);
  });
  it('goes through its phases: out, catching, burning, burning down, embers, out', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 6.75, timeScale: 600 });
    const seen = new Set<string>();
    for (let i = 0; i < 30 * 40; i++) {
      sim.step(1 / 30);
      seen.add(sim.state.phase);
    }
    expect(seen.has('lighting')).toBe(true);
    expect(seen.has('roaring')).toBe(true);
    expect(seen.has('burningDown')).toBe(true);
    expect(seen.has('embers')).toBe(true);
    expect(sim.state.fireCount).toBe(1);
  });
  it('wet wood gives less heat and more CO', () => {
    const dry = settledDay(J).summary;
    const wet = settledDay({ ...J, moisture: 30 }).summary;
    expect(wet.woodKWh).toBeLessThan(dry.woodKWh * 0.85);
    expect(wet.meanChamber).toBeLessThan(dry.meanChamber);
    expect(wet.roomMean).toBeLessThan(dry.roomMean);
    expect(wet.shareUnburned).toBeGreaterThan(dry.shareUnburned);
  });
  it('less air: a hotter chamber, a cooler exhaust, a better day. No air: starved', () => {
    const open = settledDay({ ...J, feedCover: 0.5 }).summary;
    const base = settledDay(J).summary;
    const tight = settledDay({ ...J, feedCover: 0.92 }).summary;
    expect(open.meanChamber).toBeLessThan(base.meanChamber);
    expect(base.meanChamber).toBeLessThan(tight.meanChamber);
    expect(open.delivered).toBeLessThan(base.delivered);
    expect(base.delivered).toBeLessThan(tight.delivered);
    const shut = new MassHeaterSim();
    shut.set({ hour: 8.5, feedCover: 1 });
    run(shut, 10, 1 / 30);
    expect(shut.state.lambda).toBeLessThan(1.4);
    expect(shut.state.alarms).toContain('starved');
  });
  it('a closed batch load burns on its own curve, at a higher power than the tended session', () => {
    const b = settledDay(presetParams('batch-load'));
    const j = settledDay(J);
    expect(Math.max(...b.series.fire)).toBeGreaterThan(1.3 * Math.max(...j.series.fire));
    expect(b.summary.woodKg).toBeCloseTo(12, 0);
  });
  it('gestures: light a fire, add a load, close the lid', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 3, timeScale: 300, firesPerDay: 0 });
    expect(sim.state.phase).toBe('cold');
    const n = sim.state.fireCount;
    sim.lightFire();
    expect(sim.state.fireCount).toBe(n + 1);
    run(sim, 6);
    expect(sim.state.burning).toBe(1);
    expect(sim.state.firePower).toBeGreaterThan(1000);
    const before = sim.state.woodTotal;
    sim.addLoad();
    run(sim, 2);
    expect(sim.state.woodTotal).toBeGreaterThan(before);
    sim.closeLid();
    expect(sim.params.feedCover).toBe(1);
    sim.openLid();
    expect(sim.params.feedCover).toBe(MODEL.feedCover);
  });
});

describe('the gas path', () => {
  it('runs forward in a burn, hottest near the fire, coolest at the cap', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    const s = sim.state;
    expect(s.flowDirection).toBe(1);
    expect(s.pathT[1]!).toBeGreaterThan(s.pathT[3]!);
    expect(s.pathT[3]!).toBeGreaterThan(s.pathT[6]!);
    expect(s.pathT[6]!).toBeGreaterThan(s.pathT[8]!);
    expect(s.pathT[8]!).toBeGreaterThan(s.pathT[11]!);
    for (let i = 0; i < BENCH_SEGMENTS - 1; i++) expect(s.ductGasT[i]!).toBeGreaterThan(s.ductGasT[i + 1]!);
  });
  it('the pressure along the path closes at the cap: inlet zero, and back to about zero', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    expect(Math.abs(sim.state.pathP[0]!)).toBeLessThan(1e-9);
    expect(Math.abs(sim.state.pathP[11]!)).toBeLessThan(2); // the cap's own velocity head remains
    expect(sim.state.pathP[1]!).toBeLessThan(-3);
  });
  it('the chimney draws far more than the riser and the drum together: the surprise of the machine', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 20.25 });
    const s = sim.state;
    expect(s.draftChimney).toBeGreaterThan(3 * (s.draftRiser + s.draftDrum));
    expect(s.draftRiser).toBeGreaterThan(2);
    expect(s.draftDrum).toBeLessThan(0);
  });
  it('a warm bench keeps a small draft all night, even with the lid on', () => {
    const y = settledDay(J).series;
    const night = y.flow[Math.round(3 * 4)]!;
    expect(night).toBeGreaterThan(0.001);
    expect(night).toBeLessThan(0.006);
  });
  it('leaving the feed open all night costs a little more', () => {
    const a = settledDay(J).summary;
    const b = settledDay({ ...J, lidAfterFire: false }).summary;
    expect(b.delivered).toBeLessThan(a.delivered);
    expect(b.roomMean).toBeLessThan(a.roomMean);
  });
  it('flows the other way when the flue is cold, and comes back when it warms', () => {
    const sim = new MassHeaterSim();
    sim.applyScenario('cold-start');
    expect(sim.state.flowDirection).toBe(-1);
    run(sim, 20);
    expect(sim.state.flowDirection).toBe(-1);
    expect(sim.state.phase).not.toBe('cold');
    expect(sim.state.alarms).toContain('smokeBack');
    expect(sim.state.roomCo).toBeGreaterThan(5);
    run(sim, 12);
    expect(sim.state.flowDirection).toBe(1);
    expect(sim.state.exhaustT).toBeGreaterThan(sim.state.outsideT + 10);
  });
  it('a long bench: a cold flue, a weak draft, water condensing', () => {
    const s = settledDay({ ...J, ductLength: 18 }).summary;
    expect(s.meanDraft).toBeLessThan(10);
    expect(s.condensate).toBeGreaterThan(0.3);
    expect(s.belowDewHours).toBeGreaterThan(2);
    expect(settledDay(J).summary.condensate).toBe(0);
  });
  it('a short bench: a hot chimney', () => {
    const s = settledDay({ ...J, ductLength: 4.5 }).summary;
    expect(s.meanExhaust).toBeGreaterThan(100);
    expect(s.delivered).toBeLessThan(0.72);
  });
});

describe('what the 3D reads', () => {
  it('the bench’s field is complete, the duct’s cell holds the gas', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 20 });
    const s = sim.state;
    expect(s.benchT.length).toBe(BENCH_COLS * BENCH_ROWS * BENCH_SEGMENTS);
    expect(s.benchCols).toBe(BENCH_COLS);
    for (let seg = 0; seg < BENCH_SEGMENTS; seg++) {
      const gas = s.benchT[DUCT_COL + BENCH_COLS * DUCT_ROW + BENCH_COLS * BENCH_ROWS * seg]!;
      expect(gas).toBeCloseTo(s.ductGasT[seg]!, 6);
      expect(gas).toBeGreaterThan(s.seatT[seg]!);
      expect(s.benchRowEdges[seg]![BENCH_ROWS]).toBeCloseTo(MACHINE.benchHeight, 6);
    }
    expect(s.benchColEdges[BENCH_COLS]).toBeCloseTo(MACHINE.benchDepth, 6);
    finiteState(sim, 'burning');
  });
  it('the casing is thick on the hot run and thin on the cold', () => {
    const sim = new MassHeaterSim();
    const s = sim.state;
    const cover = (seg: number) => MACHINE.benchHeight - s.benchRowEdges[seg]![DUCT_ROW + 1]!;
    expect(cover(0)).toBeGreaterThan(cover(BENCH_SEGMENTS - 1) + 0.04);
    expect(s.segmentLength).toBeCloseTo(MACHINE.ductLength / BENCH_SEGMENTS, 6);
  });
  it('heat crosses the bench inwards then outwards: the core leads and the seat follows', () => {
    const y = settledDay(J);
    const seat = y.series.seat0;
    const fire = y.series.fire;
    const firePeak = fire.indexOf(Math.max(...fire.subarray(60, 96)), 60);
    const seatPeak = seat.indexOf(Math.max(...seat.subarray(60, 96)), 60);
    expect(seatPeak).toBeGreaterThan(firePeak);
  });
  it('the flame goes sideways, its length following the fire, and comes back with the flow', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 3 });
    expect(sim.state.flameLength).toBe(0);
    sim.set({ hour: 8.5 });
    expect(sim.state.flameLength).toBeGreaterThan(0.3);
    expect(sim.state.flameStrength).toBeGreaterThan(0.4);
    const cold = new MassHeaterSim();
    cold.applyScenario('cold-start');
    run(cold, 15);
    expect(cold.state.flameLength).toBeLessThan(0);
  });
  it('smoke at the cap follows the burn; steam is only water and only in the cold', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    const clean = sim.state.smokeAtCap;
    expect(sim.state.steamAtCap).toBeGreaterThan(0);
    sim.set({ hour: 3 });
    expect(sim.state.smokeAtCap).toBe(0);
    const wet = new MassHeaterSim();
    wet.set({ moisture: 38 });
    wet.set({ hour: 8.5 });
    run(wet, 1);
    expect(wet.state.flueCo).toBeGreaterThan(sim.state.flueCo);
    expect(clean).toBeLessThan(0.6);
  });
  it('the thermal view’s ramp spans what a bench does, fixed', () => {
    expect(THERMAL_RAMP[0]![0]).toBe(15);
    expect(THERMAL_RAMP[THERMAL_RAMP.length - 1]![0]).toBe(65);
  });
  it('the template’s scene still turns while it stands in', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    const a = sim.state.angle;
    run(sim, 0.5);
    expect(sim.state.angle).not.toBe(a);
  });
});

describe('time', () => {
  it('pauses, and goes at the speed it is given', () => {
    const sim = new MassHeaterSim();
    const t0 = sim.state.simTime;
    sim.set({ running: false });
    run(sim, 1);
    expect(sim.state.simTime).toBe(t0);
    sim.set({ running: true, timeScale: 600 });
    run(sim, 2);
    expect(sim.state.simTime - t0).toBeGreaterThan(1100);
    expect(sim.state.simTime - t0).toBeLessThan(1300);
  });
  it('with the slow clock stopped the bench holds and the flame runs on: how a film holds a burning stove', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    sim.set({ timeScale: 0 });
    const seat = sim.state.seatHotT;
    const hour = sim.state.hour;
    const clock = sim.state.flameClock;
    const fire = sim.state.firePower;
    run(sim, 3);
    expect(sim.state.seatHotT).toBe(seat);
    expect(sim.state.hour).toBe(hour);
    expect(sim.state.flameClock).toBeGreaterThan(clock + 2.9);
    expect(sim.state.firePower).toBe(fire);
    expect(sim.state.airFlow).toBeGreaterThan(0);
  });
  it('the slow motion slows what is drawn, not the physics', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5, slowMo: 0.02 });
    const clock = sim.state.flameClock;
    const t0 = sim.state.simTime;
    run(sim, 1);
    expect(sim.state.flameClock - clock).toBeCloseTo(0.02, 2);
    expect(sim.state.simTime).toBeGreaterThan(t0);
  });
  it('same inputs, same state', () => {
    const a = new MassHeaterSim();
    const b = new MassHeaterSim();
    a.applyScenario('cold-start');
    b.applyScenario('cold-start');
    run(a, 30);
    run(b, 30);
    expect(a.state.hour).toBe(b.state.hour);
    expect(a.state.chamberT).toBe(b.state.chamberT);
    expect(a.state.roomCo).toBe(b.state.roomCo);
    expect([...a.state.benchT]).toEqual([...b.state.benchT]);
  });
  it('a long frame does not make a giant step', () => {
    const sim = new MassHeaterSim();
    const t0 = sim.state.simTime;
    sim.set({ timeScale: 21600 });
    sim.step(10);
    expect(sim.state.simTime - t0).toBeLessThan(0.3 * 21600);
  });
  it('the strip’s speeds include real time for the flame', () => {
    expect(SPEEDS[0]).toBe(1);
    expect(SPEEDS).toContain(DEFAULT_TIME_SCALE);
  });
  it('keeps the visitor’s slow motion and thermal view across a preset', () => {
    const sim = new MassHeaterSim();
    sim.set({ slowMo: 0.25, thermalView: true });
    sim.applyPreset('pebble-bench');
    expect(sim.params.slowMo).toBe(0.25);
    expect(sim.params.thermalView).toBe(true);
  });
});

describe('the 24 h slider', () => {
  it('setting the hour moves the machine to that hour of its settled day, and the colours follow', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    expect(sim.state.hour).toBeCloseTo(8.5, 2);
    expect(sim.params.hour).toBeCloseTo(8.5, 2);
    const burning = { fire: sim.state.firePower, lid: sim.state.drumLidT, seat: sim.state.seatHotT };
    sim.set({ hour: 3 });
    expect(sim.state.hour).toBeCloseTo(3, 2);
    expect(sim.state.firePower).toBeLessThan(burning.fire);
    expect(sim.state.drumLidT).toBeLessThan(burning.lid);
    sim.set({ hour: 22 });
    expect(sim.state.seatHotT).toBeGreaterThan(burning.seat);
  });
  it('live play carries on from there', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5, timeScale: 600 });
    const lid = sim.state.drumLidT;
    run(sim, 3);
    expect(sim.state.hour).toBeGreaterThan(8.8);
    expect(sim.state.hour).toBeLessThan(9.2);
    expect(Math.abs(sim.state.drumLidT - lid)).toBeLessThan(25);
    expect(sim.state.flowDirection).toBe(1);
  });
  it('scrubbing is cheap: a frame of the day is read, not computed', () => {
    const sim = new MassHeaterSim();
    const t0 = performance.now();
    for (let h = 0; h < 24; h += 0.25) sim.set({ hour: h });
    expect((performance.now() - t0) / 96).toBeLessThan(10);
  });
  it('the live day agrees with its table: a day played through ends near where the table says', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 6, timeScale: 21600 });
    const table = settledDay(sim.params);
    run(sim, (24 * 3600) / 21600);
    expect(Math.abs(sim.state.roomT - table.series.room[Math.round(sim.state.hour * 4)]!)).toBeLessThan(0.6);
    expect(Math.abs(sim.state.seatHotT - table.series.seat0[Math.round(sim.state.hour * 4)]!)).toBeLessThan(0.6);
  });
  it('tells a film the seat’s peak hour, and it follows the evening’s fire', () => {
    const sim = new MassHeaterSim();
    const h = sim.state.benchPeakHour;
    expect(h).toBeGreaterThan(MACHINE.ductLength ? 18 : 0);
    expect(h).toBeLessThan(24);
  });
});

describe('presets and sliders', () => {
  it('every preset starts in a sound state', () => {
    for (const id of PRESET_IDS) {
      const sim = new MassHeaterSim();
      sim.applyPreset(id);
      finiteState(sim, id);
      expect(sim.params.preset).toBe(id);
      expect(PRESET_TEXTS[id][0].length).toBeGreaterThan(4);
    }
  });
  it('values stay within their ranges, and every default sits inside', () => {
    const sim = new MassHeaterSim();
    sim.set({ feedKgH: 100, moisture: -5 });
    expect(sim.params.feedKgH).toBe(RANGES.feedKgH.max);
    expect(sim.params.moisture).toBe(RANGES.moisture.min);
    for (const id of PRESET_IDS) {
      const p = presetParams(id);
      for (const k of Object.keys(RANGES) as RangedKey[]) {
        const v = p[k] as number;
        expect(v, `${id} ${k}`).toBeGreaterThanOrEqual(RANGES[k].min);
        expect(v, `${id} ${k}`).toBeLessThanOrEqual(RANGES[k].max);
      }
    }
  });
  it('anything physical turns the preset into custom; a time control does not', () => {
    const sim = new MassHeaterSim();
    sim.set({ timeScale: 60, slowMo: 0.5, thermalView: true });
    expect(sim.params.preset).toBe('j-tube');
    sim.set({ feedKgH: 3 });
    expect(sim.params.preset).toBe('custom');
  });
  it('a change of geometry waits for a quiet moment, then settles a new machine', () => {
    const sim = new MassHeaterSim();
    const before = sim.benchMass;
    sim.set({ ductLength: 12 });
    expect(sim.benchMass).toBe(before);
    run(sim, 0.5);
    expect(sim.benchMass).toBeCloseTo((before * 12) / 9, 3);
    const t = new MassHeaterSim();
    t.set({ chimneyTop: 3 });
    t.flush();
    expect(t.state.draftChimney).toBeLessThan(sim.state.draftChimney + 5);
  });
  it('a live change answers at once in the path', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5, timeScale: 60 });
    const before = sim.state.airFlow;
    sim.set({ feedCover: 0.5 });
    run(sim, 2);
    expect(sim.state.airFlow).toBeGreaterThan(before * 1.3);
  });
  it('the day a panel asks for follows the settings', () => {
    const sim = new MassHeaterSim();
    const a = sim.getDay();
    expect(sim.getDay()).toBe(a);
    sim.set({ houseH: 150 });
    expect(sim.getDay()).not.toBe(a);
    expect(sim.getDay().summary.roomMean).toBeLessThan(a.summary.roomMean);
  });
  it('the claim follows the old stove’s slider', () => {
    const sim = new MassHeaterSim();
    const a = sim.getClaim().savedByStove;
    sim.set({ oldStoveEta: 0.1 });
    expect(sim.getClaim().savedByStove).toBeGreaterThan(a + 0.2);
  });
});

describe('scenarios', () => {
  it('there are 12, each with its words in both languages, and all run without a broken number', () => {
    expect(SCENARIO_IDS.length).toBe(12);
    for (const id of SCENARIO_IDS) {
      const sim = new MassHeaterSim();
      sim.applyScenario(id);
      finiteState(sim, id);
      run(sim, 6, 1 / 15);
      finiteState(sim, `${id} later`);
      const t = SCENARIO_TEXTS[id];
      expect(t.name[0].length).toBeGreaterThan(3);
      expect(t.lesson[1].length).toBeGreaterThan(40);
      expect(scenarioSetup(id).params.preset).toBe('custom');
    }
  });
  it('the default: two fires, a room within a few degrees of 20 °C, on the wood the research plans', () => {
    const s = settledDay(scenarioSetup('winter-two-fires').params).summary;
    expect(s.roomMean).toBeGreaterThan(18);
    expect(s.roomMean).toBeLessThan(22);
    expect(s.woodKg).toBeCloseTo(12.5, 0);
  });
  it('a cold snap: the machine is as good, the house is not', () => {
    const base = settledDay(J).summary;
    const s = settledDay(scenarioSetup('cold-snap').params).summary;
    expect(s.delivered).toBeGreaterThan(base.delivered - 0.05);
    expect(s.roomMean).toBeLessThan(base.roomMean - 8);
  });
  it('one fire on a mild day holds the room', () => {
    const s = settledDay(scenarioSetup('one-fire-mild').params).summary;
    expect(s.roomMean).toBeGreaterThan(16);
    expect(s.woodKg).toBeCloseTo(6.25, 0);
  });
  it('a leaky house: the same wood, far colder, the same machine', () => {
    const base = settledDay(J).summary;
    const s = settledDay(scenarioSetup('leaky-house').params).summary;
    expect(s.delivered).toBeCloseTo(base.delivered, 1);
    expect(s.roomMean).toBeLessThan(11);
    const sim = new MassHeaterSim();
    sim.applyScenario('leaky-house');
    expect(sim.state.alarms).toContain('roomCold');
  });
  it('a low chimney: less draft, the pressure under the lid climbs towards the room’s', () => {
    const lid = (top: number) => {
      const sim = new MassHeaterSim();
      sim.set({ chimneyTop: top });
      sim.flush();
      sim.set({ hour: 8.5 });
      return sim.state.lidPressure;
    };
    expect(lid(2.7)).toBeGreaterThan(lid(5) + 3);
    expect(lid(2.7)).toBeLessThan(1);
  });
  it('the kitchen fan: the flow reverses after the fire, CO comes into the room, an alarm’s clock starts', () => {
    const sim = new MassHeaterSim();
    sim.applyScenario('extract-fan');
    expect(sim.state.flowDirection).toBe(1);
    run(sim, 30);
    expect(sim.state.flowDirection).toBe(-1);
    expect(sim.state.roomCo).toBeGreaterThan(20);
    expect(sim.state.alarms).toContain('smokeBack');
    expect(sim.state.coAlarm).toBe(0); // a level WHO's guideline does not accept can leave the alarm silent: exactly what its own table allows
  });
  it('a damper shut on embers: CO rises in the room, the guideline falls first, the alarm long after: numbers only', () => {
    const sim = new MassHeaterSim();
    sim.applyScenario('damper-on-embers');
    expect(sim.state.roomCo).toBeLessThan(1);
    let whoAt = -1;
    let alarmAt = -1;
    let peak = 0;
    const start = sim.state.simTime;
    for (let i = 0; i < 300 * 30; i++) {
      sim.step(1 / 30);
      if (whoAt < 0 && sim.state.alarms.includes('roomCoGuideline')) whoAt = sim.state.simTime - start;
      if (alarmAt < 0 && sim.state.coAlarm) alarmAt = sim.state.simTime - start;
      peak = Math.max(peak, sim.state.roomCo);
    }
    expect(peak).toBeGreaterThan(35); // ppm in the whole house, at its peak
    expect(whoAt).toBeGreaterThan(0);
    // the guideline is passed, and the alarm of the standard, at its latest, may never sound: exactly what its own table allows
    expect(alarmAt === -1 || alarmAt > whoAt).toBe(true);
  });
  it('without a damper, the same embers leave by the flue', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 10.25, timeScale: 60 });
    run(sim, 120, 1 / 15);
    expect(sim.state.roomCo).toBeLessThan(2);
  });
  it('reset comes back to the start of the scenario', () => {
    const sim = new MassHeaterSim();
    sim.applyScenario('cold-start');
    const h = sim.state.hour;
    run(sim, 10);
    sim.reset();
    expect(sim.state.hour).toBeCloseTo(h, 2);
    expect(sim.state.fireCount).toBe(0);
  });
});

describe('alarms', () => {
  const keys = Object.keys(ALARM_TEXTS) as AlarmKey[];
  it('each has its words in both languages', () => {
    for (const k of keys) {
      expect(ALARM_TEXTS[k].text[0].length).toBeGreaterThan(5);
      expect(ALARM_TEXTS[k].text[1].length).toBeGreaterThan(5);
    }
  });
  it('none on the quiet morning of the default house', () => {
    const sim = new MassHeaterSim();
    expect(sim.state.alarms).toEqual([]);
  });
  it('a drum over its paint, on a hard fire', () => {
    const sim = new MassHeaterSim();
    sim.set({ feedKgH: 8 });
    sim.set({ hour: 9, timeScale: 60 });
    run(sim, 2);
    expect(sim.state.drumLidT).toBeGreaterThan(LIMITS.drumPaint);
    expect(sim.state.alarms).toContain('drumHot');
  });
  it('a seat too hot in a house that holds its heat too well', () => {
    const sim = new MassHeaterSim();
    sim.set({ houseH: 40, gains: 400 });
    sim.set({ hour: 22 });
    expect(sim.state.alarms).toContain('seatHot');
  });
  it('flue gas under its dew point on the long duct', () => {
    const sim = new MassHeaterSim();
    sim.set({ ductLength: 18 });
    sim.flush();
    sim.set({ hour: 8 });
    run(sim, 1);
    expect(sim.state.condensing).toBe(true);
    expect(sim.state.alarms).toContain('belowDew');
  });
  it('a chamber too cold, wide open', () => {
    const sim = new MassHeaterSim();
    sim.set({ feedCover: 0 });
    sim.set({ hour: 8.5 });
    run(sim, 1);
    expect(sim.state.chamberT).toBeLessThan(LIMITS.chamberCold);
    expect(sim.state.alarms).toContain('coldChamber');
  });
  it('the regimes and phases have their words', () => {
    for (const t of Object.values(REGIME_TEXTS)) expect(t[0].length).toBeGreaterThan(3);
    for (const t of Object.values(PHASE_TEXTS)) expect(t[0].length).toBeGreaterThan(3);
  });
});
