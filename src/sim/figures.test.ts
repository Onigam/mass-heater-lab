import { describe, expect, it } from 'vitest';
import {
  alarmLimit,
  coAt13,
  dewPoint,
  flueGas,
  gasCp,
  heatingValue,
  heatPerAir,
  lambdaFromO2,
  MG_PER_PPM_0C,
  o2FromLambda,
  STOICH_AIR_DRY,
  steadyRoomCo,
  stoichAir,
  WHO_LIMITS,
  MG_PER_PPM_20C,
} from './combustion';
import { MassHeaterSim } from './engine';
import {
  ASH_SHARE,
  BENCH_COLS,
  benchMass,
  COB,
  DUCT_COL,
  DUCT_ROW,
  FIRECLAY,
  MACHINE,
  riserInsulation,
} from './machine';
import { gasK, gasMu, Plant } from './plant';
import { batchCover, presetParams, scenarioSetup } from './presets';
import { claimCheck, etaOldFor, settledDay, skinResponse, withWood, woodForRoom, woodSaved } from './runs';
import {
  airK,
  airMu,
  airRho,
  FILM_FACING_UP,
  FILM_VERTICAL,
  naturalFilm,
  radiationConductance,
  stackDraft,
} from './thermal';
import type { HeaterParams } from './types';

// One test per key figure of docs/research.md, with its K number in the name.
//   exact figures: arithmetic, the model retrieves them.
//   compare figures: the test pins WHAT THE MODEL GIVES, with the reported value in its name. A pin is not a target: nothing in the model is tuned to these. When a pin moves, the tables of
//   docs/physics.md move with it. Nobody has measured the delivered heat of a real cob J-tube: a match here proves little, a miss here is a finding. docs/physics.md §5 says which is which.

const J = presetParams('j-tube');
const day = (patch: Partial<HeaterParams> = {}) => settledDay({ ...J, ...patch });
const base = () => day().summary;
const KWH = 3.6e6;

/** A pin: the model's value sits within this band. */
const within = (v: number, lo: number, hi: number, what = ''): void => {
  expect(v, what).toBeGreaterThanOrEqual(lo);
  expect(v, what).toBeLessThanOrEqual(hi);
};

describe('what the roadmap’s videos say', () => {
  it('K1 the six components have their place in the gas path', () => {
    const sim = new MassHeaterSim();
    expect(sim.state.pathT.length).toBe(12); // feed, tunnel, riser, manifold, mass, vertical exhaust are all stations of it
    expect(sim.benchMass).toBeGreaterThan(2500);
  });
  it('K2 no figure: nine of twelve builds are 8-inch, so the machine is 200 mm', () => {
    expect(MACHINE.bore).toBe(0.2);
  });
  it('K3 wood divided by four from the stove alone needs an old stove at about 20 %: the video credits insulation too', () => {
    const c = claimCheck(J, 0.35);
    expect(etaOldFor(0.75, c.eta)).toBeCloseTo(0.195, 1);
  });
});

describe('a real J-tube, from its builders', () => {
  it('K5 a session of 2 to 4 h at 1 to 2 loads an hour: the default is two of 2.5 h, an input', () => {
    expect(J.sessionHours).toBe(2.5);
    expect(J.firesPerDay).toBe(2);
  });
  it('K6 burn rate 2.0 to 3.6 kg/h is 8.5 to 15 kW of fire at 4.16 kWh/kg, derived', () => {
    expect((2.0 * 4.16 * 3.6e6) / 3600 / 1000).toBeCloseTo(8.32, 1);
    expect((3.6 * 4.16 * 3.6e6) / 3600 / 1000).toBeCloseTo(14.98, 1);
    // the model at the default feed: the fire reached
    const f = day().series.fire;
    within(Math.max(...f), 9500, 11000, 'peak of fire, W');
  });
  it('K7 a 4 h burn of 9 to 11 kg heats their home for 24 h, house unknown: in our house the same wood holds a room about 3 K under the two-fire day', () => {
    const one = day({ firesPerDay: 1, sessionHours: 4 }).summary;
    within(one.woodKg, 9.8, 10.2, 'wood');
    within(one.roomMean, 16, 19, 'room');
  });
  it('K8 20 to 40 lb a day (9 to 18 kg) for 74 m²: the model holds a mean of 20 °C on 12.2 kg at 2.1 °C outside, H 106 W/K', () => {
    const w = woodForRoom(J, 20);
    within(w.kg, 11.7, 12.7, 'kg');
    expect(w.reached).toBe(true);
  });
  it('K9 clean burn 540 to 815 °C in the chamber: the model’s fully mixed chamber gives 470 °C at 2.5 kg/h, 565 °C at 3.4 kg/h: under it when relaxed, inside it when rocketing', () => {
    within(base().meanChamber, 440, 500);
    within(day({ feedKgH: 3.4, sessionHours: 1.84 }).summary.meanChamber, 540, 590);
    within(day({ feedKgH: 5, sessionHours: 1.25 }).summary.meanChamber, 670, 740);
  });
  it('K10 exhaust 32 to 232 °C by who measures what: the model spans it with the duct and the feed alone', () => {
    within(base().meanExhaust, 70, 90); // « about 66 °C read off a graph », « 93 to 121 °C on shorter ones »
    within(day({ ductLength: 18 }).summary.meanExhaust, 25, 45); // « 32 to 40 °C on original long systems »
    within(day({ ductLength: 4.5 }).summary.meanExhaust, 105, 135); // « 93 to 121 °C on shorter ones »
    within(day({ ductLength: 3, feedKgH: 5, sessionHours: 1.25 }).summary.peakExhaust, 180, 280); // « over 232 °C on an undersized mass »
  });
  it('K11 about 0.3 m/s at 40 °C in a 6-inch system at 2 kg/h is about 6 g/s: the model gives 6.8 g/s at 40 °C, with λ 2.9 where the report implies 1.7', () => {
    const s = day({ bore: 0.15, feedKgH: 2, sessionHours: 3 }).summary;
    within(s.meanFlow * 1000, 6.2, 7.5, 'g/s');
    within(s.meanExhaust, 36, 45, 'exhaust');
    within(s.meanLambda, 2.6, 3.2, 'lambda');
  });
  it('K12 57 lb of wood gave 7 oz of ash, 0.77 %', () => {
    expect(ASH_SHARE).toBeCloseTo(0.0077, 4);
    const sim = new MassHeaterSim();
    sim.set({ timeScale: 3600 });
    for (let i = 0; i < 24 * 30; i++) sim.step(1 / 30);
    expect(sim.state.ash / sim.state.woodTotal).toBeCloseTo(ASH_SHARE, 6);
  });
  it('K13 a draft’s proportions hold in the machine: riser over twice the tunnel and three times the feed, duct within 60 ft, no damper', () => {
    expect(MACHINE.riserHeight).toBeGreaterThanOrEqual(2 * MACHINE.tunnelLength);
    expect(MACHINE.riserHeight + 1e-9).toBeGreaterThanOrEqual(3 * MACHINE.feedHeight);
    expect(MACHINE.ductLength).toBeLessThanOrEqual(18);
    expect(MACHINE.coverHot).toBeCloseTo(0.15, 3);
    expect(MACHINE.slab).toBeCloseTo(0.1, 3);
    expect(J.damperClosed).toBe(false);
  });
  it('K14 one bench read: 54 to 60 °C at the start of the mass, about 38 °C far away at full burn; 32 to 38 and 24 to 27 °C 12 h later, instrument and place unstated. The model’s seat is cooler when burning; the earth next to its duct reads like the report’s start of mass; 12 h later the far end is about right', () => {
    const d = day();
    const at = (h: number) => Math.round(h * 4);
    within(d.series.seat0[at(20.5)]!, 28, 33, 'hot end at the end of the burn');
    within(d.series.seat5[at(20.5)]!, 25, 30, 'far end at the end of the burn');
    within(d.series.seat0[at(7)]!, 23, 27, 'hot end, the next morning before the fire');
    within(d.series.seat5[at(7)]!, 20.5, 24, 'far end, the next morning before the fire');
    const sim = new MassHeaterSim();
    sim.set({ hour: 20.5 });
    const above = DUCT_COL + BENCH_COLS * (DUCT_ROW + 1);
    within(sim.state.benchT[above]!, 50, 75, 'the cell above the duct, at the hot end');
  });
  it('K15 a gap of about 2 in with its area above the bore: the wall area of the gap is more than the bore’s section', () => {
    const gapArea = Math.PI * MACHINE.sleeveDiameter * MACHINE.topGap;
    expect(gapArea).toBeGreaterThan((Math.PI * MACHINE.bore ** 2) / 4);
    expect(MACHINE.riserHeight).toBeCloseTo(0.84, 2);
  });
  it('K16 one reader of a graph: the first 8 to 10 ft took over 90 % of the load, on a short test mass. The model: the first 3 m of a 9 m duct take about 42 %: same direction, a far gentler slope', () => {
    const c = day().counters;
    const total = c.toSegments.reduce((a, b) => a + b, 0);
    within((c.toSegments[0]! + c.toSegments[1]!) / total, 0.38, 0.52, 'first 3 m of 9 m');
  });
  it('K17 a yurt with 3 m of bench, 17 to 21 °C on about 1 stère a season: on our estimate of its H the model holds it near 15 °C', () => {
    const s = settledDay(presetParams('yurt')).summary;
    within(s.woodKg, 2.4, 2.6);
    within(s.roomMean, 13, 16);
  });
  it('K18 the claims: a tenth, 1/8, ÷ 4, 93 %, none measured: each needs the old stove below', () => {
    const eta = claimCheck(J, 0.35).eta;
    within(eta, 0.74, 0.82);
    expect(etaOldFor(0.9, eta)).toBeLessThan(0.09);
    expect(etaOldFor(0.875, eta)).toBeLessThan(0.1);
    expect(etaOldFor(0.75, eta)).toBeLessThan(0.2);
  });
  it('K65 less than half a cord a year for a sold plan in Portland: 32 kWh/m²·year, plausible for a small tight house, not a test of this machine', () => {
    expect(((5860 * 0.5 * 0.8) / 74).toFixed(0)).toBe('32');
  });
  it('K66 19 h after the last fire, « a little below 21 °C » by feel: one fire at 19:00, in our house at 2.1 °C, the room is at about 12 °C by 14:00', () => {
    const d = day({ firesPerDay: 1, eveningHour: 19 });
    const atTwo = d.series.room[Math.round(14 * 4)]!;
    within(atTwo, 11, 15);
    // and it takes the mild day to hold it: the two statements of wood on film do not agree with each other either
    expect((128 / 2).toFixed(0)).toBe('64');
  });
  it('K63 and K64 no figure for the model: a lid’s ash seal and a builder’s retrospective. The pressure under the lid says when a seal matters', () => {
    expect(new MassHeaterSim().state.lidPressure).toBeTypeOf('number');
  });
});

describe('tests and emissions', () => {
  it('K19 mean 312 ppm, under 500 in the main run on a batch box: the regime map gives about 300 ppm in the flue of the lean default, under 400 at the batch preset’s peak of fire: same order, indicative, and built to sit there', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 9.25 });
    within(sim.state.flueCo, 120, 600, 'J-tube');
    expect(sim.state.regime).toBe('lean');
    const b = settledDay(presetParams('batch-load'));
    const at = Math.round(18.5 * 4);
    within(b.series.flueCo[at]!, 50, 500, 'batch');
  });
  it('K20 CO of 20 to 100 ppm in a hot, well-fed J-tube, climbing as the load burns out, worse on damp wood: by regime, ordering only', () => {
    const co = (patch: Partial<HeaterParams>, hour: number) => {
      const sim = new MassHeaterSim();
      sim.set(patch);
      sim.flush();
      const d = sim.getDay();
      return d.series.flueCo[Math.round(hour * 4)]!;
    };
    const hot = co({ feedKgH: 5, sessionHours: 2 }, 8.5);
    const lean = co({}, 8.5);
    const wet = co({ moisture: 32 }, 8.5);
    const down = co({}, 10);
    expect(hot).toBeLessThan(lean);
    expect(lean).toBeLessThan(wet);
    expect(lean).toBeLessThan(down);
  });
  it('K21 no model figure: an old competitor’s comparison, context', () => {
    expect(2100).toBeGreaterThan(1000);
  });
  it('K22 a 10-fold gap between a slow and a nominal fire of the same stove: the map’s embers and cold chamber sit about 10 times over the hot flame', () => {
    const hot = flameAt(700, 3);
    const cold = flameAt(150, 3);
    expect(cold / hot).toBeGreaterThan(8);
  });
  it('K23 the one third-party lab test, on pellets, 68.5 to 79.7 %: not this machine; the model’s delivered efficiency lands inside it', () => {
    within(base().delivered, 0.72, 0.8);
  });
  it('K24 a measured masonry heater held at 12 ± 2 Pa, 240 mg/MJ whole-burn: the model’s draft is 15 Pa at full burn, same order. Its CO per MJ over a day sits in the band of the table’s modern stoves, 765 to 1,530, not at 240', () => {
    within(base().meanDraft, 12, 17);
    const co = dayCoPerMJ({});
    within(co, 150, 1500);
  });
  it('K25 smouldering makes 3.5 times the CO of a normal burn: the map at a cold chamber and wet wood is at least that', () => {
    expect(flameAt(280, 3, 30) / flameAt(600, 3, 17)).toBeGreaterThan(3.5);
  });
  it('K26 a 1992 lab report: 61.8 % net delivered: the lower end of the model’s range, with the feed uncovered', () => {
    within(day({ feedCover: 0.75 }).summary.delivered, 0.6, 0.72);
  });
  it('K27 flue conversions: 1,500 mg/m³ is 1,200 ppm, 2,500 is 2,000 ppm, at 13 % O₂, C·8/(21 − O₂)', () => {
    expect(1500 / MG_PER_PPM_0C).toBeCloseTo(1200, 6);
    expect(2500 / MG_PER_PPM_0C).toBeCloseTo(2000, 6);
    expect(coAt13(100, 13)).toBeCloseTo(100, 8);
    expect(coAt13(40, 17)).toBeCloseTo(80, 8);
  });
});

describe('two fires a day', () => {
  it('K28 the table: a load of 6 kg·(D/150)³ and a mean power of load × 2 × 3.7 kWh / 24 h, as stated; at EN’s heating value 11 % less', () => {
    const table: [number, number, number][] = [
      [125, 3.5, 1.1],
      [140, 4.9, 1.5],
      [150, 6.0, 1.9],
      [175, 9.5, 2.9],
      [200, 14.2, 4.4],
      [230, 21.6, 6.7],
      [250, 27.8, 8.6],
    ];
    for (const [d, load, kW] of table) {
      expect(6 * (d / 150) ** 3, `${d} mm load`).toBeCloseTo(load, 0);
      expect((load * 2 * 3.7) / 24, `${d} mm power`).toBeCloseTo(kW, 0);
    }
    expect((6 * 2 * 4.16 * 0.8) / 24).toBeCloseTo(1.66, 2);
    expect((14.2 * 2 * 4.16 * 0.8) / 24).toBeCloseTo(3.94, 2);
    const b = settledDay(presetParams('batch-load')).summary;
    within(b.meanPower, 1250, 1750); // the model on its own efficiency, against 1.9 kW as stated, 1.66 kW at EN’s value and 80 %
  });
  it('K29 6 kg in 55 to 90 min, a drum top about 200 °C on a three-barrel build: one drum in the model reaches 350 °C on the same load, its chimney 145 °C at the peak', () => {
    const b = settledDay(presetParams('batch-load')).summary;
    within(b.peakDrum, 300, 400);
    within(b.peakExhaust, 120, 170); // « chimney peak about 80 °C from cold, 120 °C after days of firing » on a longer run
  });
  it('K30 an 11 cm brick skin peaks 4 h after lighting, half at 12 h, a quarter at 24 h: one skin alone in the model peaks at 2.6 h, 37 % at 12 h: the report’s stove has a store behind its skin', () => {
    const r = skinResponse(0.11, 2000, 1000, 1.1);
    within(r.peakHour, 2.3, 3);
    within(r.half, 0.3, 0.45);
    within(r.quarter, 0.05, 0.15);
  });
  it('K31 13 W/m²·K of surface, 60 % radiation: the model at 15 K over the room gives about 9 W/m²·K, 60 % radiation', () => {
    const hc = naturalFilm(15, FILM_FACING_UP);
    const hr = radiationConductance(0.9, 1, 35, 20);
    within(hc + hr, 8.5, 10);
    within(hr / (hc + hr), 0.55, 0.65);
  });
  it('K32 EN 15544’s numbers as inputs: fireclay within 0.90 to 1.35 W/m·K, a batch port from its inflow and air-fuel ratio', () => {
    within(FIRECLAY.k, 0.9, 1.35);
    within(FIRECLAY.rho, 1750, 2300);
    within(batchCover(presetParams('batch-load')), 0.45, 0.6);
  });
  it('K33 ASTM’s 800 kg and one 180° turn: the bench clears the mass, a J-tube’s open feed is not what its text describes; the drum stays under 110 °C only between the fires', () => {
    expect(benchMass(MACHINE.bore, MACHINE.ductLength, COB.rho)).toBeGreaterThan(800);
    expect(base().peakDrum).toBeGreaterThan(110);
  });
  it('K34 an 8-inch J-tube of about the capacity of a 6-inch batch box, forum: the two presets burn about the same wood a day for the same room', () => {
    const b = settledDay(presetParams('batch-load')).summary;
    within(b.woodKg / base().woodKg, 0.9, 1.05);
    within(b.roomMean - base().roomMean, -3, 1);
  });
});

describe('combustion and draft', () => {
  it('K35 5.97 kg of air per kg of dry wood, 5.07 at 15 % moisture', () => {
    expect(STOICH_AIR_DRY).toBeCloseTo(5.97, 2);
    expect(stoichAir(15)).toBeCloseTo(5.07, 2);
  });
  it('K36 O₂ of 10.8 to 13.5 % in logged batch boxes is λ 2.06 to 2.8: the model’s batch preset runs at λ about 3.3, the open J-tube at about 5: no J-tube reading exists', () => {
    expect(lambdaFromO2(10.8)).toBeCloseTo(2.06, 2);
    expect(lambdaFromO2(13.5)).toBeCloseTo(2.8, 1);
    expect(o2FromLambda(1.4)).toBeCloseTo(6, 1);
    within(settledDay(presetParams('batch-load')).summary.meanLambda, 2.8, 3.8, 'batch');
    within(base().meanLambda, 4.4, 5.6, 'J-tube');
  });
  it('K37 heating value: 4.27, 3.98, 3.39 kWh/kg at 15, 20, 30 %; EN’s 4.16 at about 17 %; K28’s 4.6 at about 10 %', () => {
    expect(heatingValue(15) / KWH).toBeCloseTo(4.27, 2);
    expect(heatingValue(20) / KWH).toBeCloseTo(3.98, 2);
    expect(heatingValue(30) / KWH).toBeCloseTo(3.39, 2);
    expect(heatingValue(17) / KWH).toBeCloseTo(4.15, 2);
    expect(heatingValue(10) / KWH).toBeCloseTo(4.56, 1);
    within(heatPerAir(17), 2.95e6, 3.1e6);
  });
  it('K38 adiabatic flame about 950 °C at λ 2, 650 °C at λ 3, by hand: the same sum on the model’s gas gives about 1,180 and 870 °C, no loss to the brick. Drum: 6.5 kW at 200 °C, 13.4 kW at 300 °C by hand', () => {
    const flame = (lambda: number) => {
      let T = 800;
      for (let i = 0; i < 20; i++) {
        const air = stoichAir(17) * lambda;
        const cp = gasCp((T + 20) / 2, flueGas(lambda, 17));
        T = 20 + heatingValue(17) / ((air + 1) * cp);
      }
      return T;
    };
    within(flame(2), 1100, 1230);
    within(flame(3), 780, 890);
    const area = 1.89;
    const drum = (T: number) =>
      (radiationConductance(0.85, area, T, 20) + naturalFilm(T - 20, FILM_VERTICAL) * area) * (T - 20);
    within(drum(200), 6000, 7000);
    within(drum(300), 12500, 14500);
  });
  it('K39 by hand: riser 7.2 Pa, fall −5.9 Pa, chimney 14.4, 8.1 and 29 Pa, cold flue −5.5 Pa: all retrieved as sums. The model at full burn: riser and drum net about 2 Pa, the chimney 14 Pa, a cold flue only −1.1 Pa', () => {
    expect(stackDraft(0.84, 800, 20)).toBeCloseTo(7.2, 1);
    expect(stackDraft(-0.84, 450, 20)).toBeCloseTo(-5.9, 1);
    expect(stackDraft(5, 80, 0)).toBeCloseTo(14.4, 1);
    expect(stackDraft(5, 40, 0)).toBeCloseTo(8.1, 1);
    expect(stackDraft(5, 230, 0)).toBeCloseTo(29, 0);
    expect(stackDraft(5, -5, 20)).toBeCloseTo(-5.5, 1);
    const sim = new MassHeaterSim();
    sim.set({ hour: 20.25 });
    const s = sim.state;
    within(s.draftRiser + s.draftDrum, 0.5, 3, 'riser and drum net');
    within(s.draftChimney, 11, 17, 'chimney');
    const cold = new MassHeaterSim();
    cold.applyScenario('cold-start');
    within(cold.state.draft, -1.8, -0.8, 'a cold flue, leaks balancing at mid-height');
  });
  it('K40 12 ± 2 Pa in a laboratory; a J-tube’s own need unknown: the model’s default needs what it has, 15 Pa, most of it across the feed', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    const across = -sim.state.pathP[1]!;
    within(across / sim.state.draft, 0.6, 0.95);
    within(sim.state.draft, 12, 17);
  });
  it('K41 dew point: 44, 40, 37 °C at λ 2, 2.5, 3 and 15 %; 49 °C at λ 2 and 30 %', () => {
    expect(dewPoint(2, 15)).toBeCloseTo(44, 0);
    expect(dewPoint(2.5, 15)).toBeCloseTo(40, 0);
    expect(dewPoint(3, 15)).toBeCloseTo(37, 0);
    expect(dewPoint(2, 30)).toBeCloseTo(49, 0);
    // and a lean flue condenses less: at the default λ of 5, about 27 °C
    within(dewPoint(5, 17), 25, 31);
  });
  it('K42 Schumack’s directions: a damper and a longer duct raise the efficiency: found. A low chimney and a small gap threaten: on the chimney the model finds the lid’s pressure rising, not the efficiency falling; on the gap it finds little', () => {
    const b = base();
    expect(day({ damperK: 100 }).summary.delivered).toBeGreaterThan(b.delivered);
    expect(day({ ductLength: 12 }).summary.delivered).toBeGreaterThan(b.delivered);
    // against the paper: less draft raises the efficiency here, by the same mechanism as the damper
    expect(day({ chimneyTop: 2.7 }).summary.delivered).toBeGreaterThan(b.delivered);
    const lid = (patch: Partial<HeaterParams>) => {
      const sim = new MassHeaterSim();
      sim.set(patch);
      sim.flush();
      sim.set({ hour: 20.25 });
      return sim.state.lidPressure;
    };
    expect(lid({ chimneyTop: 2.7 })).toBeGreaterThan(lid({}));
    expect(Math.abs(day({ topGap: 0.015 }).summary.delivered - b.delivered)).toBeLessThan(0.02);
  });
});

describe('materials and parts', () => {
  it('K43 cob: 0.6 W/m·K, 891 J/kg·K, 1,700 kg/m³ estimated', () => {
    expect(COB.k).toBe(0.6);
    expect(COB.c).toBe(891);
    expect(COB.rho).toBe(1700);
  });
  it('K44 fireclay: c estimated at 1,000 J/kg·K, within the standard’s density', () => {
    expect(FIRECLAY.c).toBe(1000);
  });
  it('K45 insulating firebrick JM 23: 0.14, 0.16, 0.17 W/m·K at 400, 600, 800 °C', () => {
    const m = riserInsulation('firebrick');
    expect(m.rho).toBe(480);
    expect(m.k(400)).toBeCloseTo(0.14, 6);
    expect(m.k(600)).toBeCloseTo(0.16, 6);
    expect(m.k(800)).toBeCloseTo(0.17, 6);
  });
  it('K46 fibre blanket: 0.08, 0.12, 0.18 W/m·K at 400, 600, 800 °C', () => {
    const m = riserInsulation('fibre');
    expect(m.k(400)).toBeCloseTo(0.08, 6);
    expect(m.k(800)).toBeCloseTo(0.18, 6);
  });
  it('K47 perlite: 0.078, 0.092 W/m·K at 200, 300 °C; beyond that a straight line, a guess. Choosing among the three moves the efficiency by under a point', () => {
    const m = riserInsulation('perlite');
    expect(m.k(200)).toBeCloseTo(0.078, 6);
    expect(m.k(300)).toBeCloseTo(0.092, 6);
    const spread = (['firebrick', 'fibre', 'perlite'] as const).map(
      (id) => day({ riserInsulation: id }).summary.delivered,
    );
    expect(Math.max(...spread) - Math.min(...spread)).toBeLessThan(0.01);
  });
  it('K48 a 200 L drum: Ø 584 to 595 mm, about 880 mm, 1.0 to 1.2 mm', () => {
    within(MACHINE.drumDiameter, 0.584, 0.595);
    expect(MACHINE.drumHeight).toBeCloseTo(0.88, 3);
    within(MACHINE.drumWall, 0.001, 0.0012);
  });
});

describe('the day, by hand and by the model', () => {
  it('K49 the bench: about 3.0 t, and the grid holds exactly that mass', () => {
    const m = benchMass(MACHINE.bore, MACHINE.ductLength, COB.rho);
    within(m, 2960, 2970);
    expect(new Plant(J).benchMassNow()).toBeCloseTo(m, 3);
  });
  it('K50 it stores 2.64 MJ/K, 0.73 kWh per kelvin; the model’s bench swings about 5 kWh in a burn', () => {
    const m = benchMass(MACHINE.bore, MACHINE.ductLength, COB.rho);
    expect((m * COB.c) / 1e6).toBeCloseTo(2.64, 2);
    expect((m * COB.c) / KWH).toBeCloseTo(0.73, 2);
    const y = day().series.benchMean;
    const swing = ((Math.max(...y) - Math.min(...y)) * m * COB.c) / KWH;
    within(swing, 4, 10);
  });
  it('K51 12.5 kg is 52 kWh gross, 1.73 kW at 80 %: the model’s day has the wood and finds 78 %, so 1.7 kW', () => {
    expect(12.5 * 4.16).toBeCloseTo(52, 0);
    expect((52 * 0.8) / 24).toBeCloseTo(1.73, 2);
    const s = base();
    within(s.woodKg, 12.4, 12.65);
    within(s.woodKWh, 51, 53);
    within(s.delivered, 0.74, 0.82);
    within(s.meanPower, 1550, 1800);
  });
  it('K52 how much wood at 20 °C: 22 kg at −10 °C, 36 and 61 kg in a leaky house, by hand at 85 %. The model: 23.6, 35.8 and 62.6 kg, its efficiency lower than 85 % and its 220 W of gains making up for it', () => {
    within(woodForRoom({ ...J, outsideMean: -10 }, 20).kg, 22.5, 25);
    within(woodForRoom({ ...J, houseH: 300 }, 20).kg, 34, 38);
    within(woodForRoom({ ...J, houseH: 300, outsideMean: -10 }, 20).kg, 59, 66);
    // and no gains: the default house then needs more; a very tight one, far less
    within(woodForRoom({ ...J, gains: 0 }, 20).kg, 13.2, 15);
    within(woodForRoom({ ...J, houseH: 60 }, 20).kg, 4.5, 7.5);
  });
  it('K53 at 13 W/m²·K a seat at 35 °C carries the house, 1.68 kW from 8.6 m²: the model’s bench gives 0.3 to 0.5 kW day and night, and reaches 32 °C at its peak: the drum carries as much of the house', () => {
    expect(13 * 8.6 * 15).toBeCloseTo(1677, 0);
    const y = day().series.benchOut;
    within(Math.min(...y), 280, 450);
    within(Math.max(...y), 450, 650);
    within(base().seatHotPeak, 30, 34);
    const c = day().counters;
    expect(c.drumOut).toBeGreaterThan(c.benchOut);
  });
  it('K54 0.6 cord cannot do what 6 cords at 72 % do: short by 3.9 to 8 times, at the source’s own figures', () => {
    const cord = 5860;
    expect(6 * cord * 0.72).toBeCloseTo(25315, 0);
    expect(6 * cord * 0.35).toBeCloseTo(12306, 0);
    expect(0.6 * cord * 0.9).toBeCloseTo(3164, 0);
    expect((6 * 0.72) / (0.6 * 0.9)).toBeCloseTo(8, 6);
    expect((6 * 0.35) / (0.6 * 0.9)).toBeCloseTo(3.89, 2);
    expect((0.6 * cord * 0.9) / 186).toBeCloseTo(17, 0);
  });
  it('K55 wood saved by the stove alone: 61, 41, 20, 88, 94 %. On the model’s efficiency, from a 35 % stove, 55 %: « 80 to 90 % » needs an old stove at 8 to 16 %, and it takes the insulation too to get there', () => {
    expect(woodSaved(0.35, 0.9)).toBeCloseTo(0.61, 2);
    expect(woodSaved(0.5, 0.85)).toBeCloseTo(0.41, 2);
    expect(woodSaved(0.72, 0.9)).toBeCloseTo(0.2, 2);
    expect(woodSaved(0.1, 0.85)).toBeCloseTo(0.88, 2);
    expect(woodSaved(0.05, 0.9)).toBeCloseTo(0.94, 2);
    const c = claimCheck(J, 0.35);
    within(c.savedByStove, 0.52, 0.58);
    within(c.etaFor80, 0.14, 0.17);
    within(c.etaFor90, 0.07, 0.085);
    // the same old stove in a leaky house: stove and insulation together reach the claim
    within(c.savedWithInsulation, 0.82, 0.88);
  });
  it('K56 time to cross cob, L²/2α: 3.5, 5.5, 7.9 h for 10, 12.5, 15 cm. A skin with its film gives 2.6, 3.5, 4.7 h. The bench: the seat peaks about 4.3 h after the fire’s start at the thick end, 3.8 h at the thin, under 2 h after the flame is gone', () => {
    const a = COB.k / (COB.rho * COB.c);
    expect(a).toBeCloseTo(3.96e-7, 9);
    expect((0.1 * 0.1) / (2 * a) / 3600).toBeCloseTo(3.5, 1);
    expect((0.125 * 0.125) / (2 * a) / 3600).toBeCloseTo(5.5, 1);
    expect((0.15 * 0.15) / (2 * a) / 3600).toBeCloseTo(7.9, 1);
    within(skinResponse(0.1, COB.rho, COB.c, COB.k).peakHour, 2.3, 2.9);
    within(skinResponse(0.15, COB.rho, COB.c, COB.k).peakHour, 4.3, 5);
    const s = base();
    within(s.lagHot, 3.5, 5);
    within(s.lagCold, 3, 4.5);
    expect(s.lagHot).toBeGreaterThanOrEqual(s.lagCold);
  });
  it('K57 by hand h about 1.8 W/m²·K and 90 °C after 18 m: the model adds a natural film and the gas’s radiation, about twice that, and finds 31 °C after 18 m. This film is the number no source gives', () => {
    within(day({ ductLength: 18 }).summary.meanExhaust, 25, 40);
    within(day({ ductFilm: 0.5 }).summary.meanExhaust, 100, 125);
    within(day({ ductFilm: 2 }).summary.meanExhaust, 40, 60);
    const sim = new MassHeaterSim();
    sim.set({ hour: 8.5 });
    within(sim.state.ductSpeed, 0.4, 0.75, 'gas speed in the duct');
    within(sim.state.riserSpeed, 0.8, 1.6, 'gas speed in the riser');
  });
  it('K58 flue loss 9 % at 100 °C and λ 2.5, 23 % at 230 °C: the model’s cap and outdoor flue take 16 % at the default, 4 % on 18 m of duct, 29 % on 4.5 m', () => {
    const share = (s: { shareExit: number; shareFlueOutdoors: number }) => s.shareExit + s.shareFlueOutdoors;
    within(share(base()), 0.13, 0.19);
    within(share(day({ ductLength: 18 }).summary), 0.02, 0.07);
    within(share(day({ ductLength: 4.5 }).summary), 0.26, 0.33);
  });
  it('K59 a leak: 17, 84, 168, 112 ppm by hand: 16.2, 81, 162, 108 ppm from q·C/V̇ on the same inputs, within 4 %', () => {
    const Vdot = (200 * 0.5) / 3600;
    expect(steadyRoomCo(0.015 * 0.01, 3000, Vdot)).toBeCloseTo(16.2, 1);
    expect(steadyRoomCo(0.015 * 0.05, 3000, Vdot)).toBeCloseTo(81, 0);
    expect(steadyRoomCo(0.015 * 0.1, 3000, Vdot)).toBeCloseTo(162, 0);
    expect(steadyRoomCo(0.015 * 0.02, 10000, Vdot)).toBeCloseTo(108, 0);
  });
  it('K60 WHO’s values: 100, 35, 10, 7 mg/m³ are about 86, 30, 8.6, 6 ppm at 20 °C', () => {
    const ppm = WHO_LIMITS.map((w) => w.mg / MG_PER_PPM_20C);
    expect(ppm[0]).toBeCloseTo(86, 0);
    expect(ppm[1]).toBeCloseTo(30, 0);
    expect(ppm[2]).toBeCloseTo(8.6, 1);
    expect(ppm[3]).toBeCloseTo(6, 0);
    expect(WHO_LIMITS.map((w) => w.seconds / 3600)).toEqual([0.25, 1, 8, 24]);
  });
  it('K61 an alarm’s table, at its latest: 50 ppm 90 min, 100 ppm 40 min, 300 ppm 3 min, silent under 30 ppm: silent at a level WHO calls too high', () => {
    expect(alarmLimit(50) / 60).toBeCloseTo(90, 6);
    expect(alarmLimit(100) / 60).toBeCloseTo(40, 6);
    expect(alarmLimit(300) / 60).toBeCloseTo(3, 6);
    expect(alarmLimit(29)).toBe(Infinity);
    expect(29 * MG_PER_PPM_20C).toBeGreaterThan(10); // over WHO’s 8 h value
  });
  it('K62 no model figure: France’s 100 deaths a year are from all appliances, said in the lessons, not here', () => {
    expect(scenarioSetup('damper-on-embers').params.damperClosed).toBe(false);
  });
});

describe('the helpers behind the figures', () => {
  it('the fast curves stay on the core’s air', () => {
    for (const T of [0, 50, 100, 200, 400, 600, 800, 1000]) {
      expect(gasMu(T) / airMu(T)).toBeCloseTo(1, 1);
      expect(Math.abs(gasK(T) / airK(T) - 1)).toBeLessThan(0.03);
    }
    expect(airRho(20)).toBeCloseTo(1.204, 3);
  });
  it('more wood settings give more wood', () => {
    const p = withWood(J, 20);
    expect(p.feedKgH * p.sessionHours * p.firesPerDay).toBeCloseTo(20, 6);
    const big = withWood(J, 60);
    expect(big.sessionHours).toBe(6);
    expect(big.feedKgH * 6 * 2).toBeCloseTo(60, 6);
  });
});

function flameAt(T: number, lambda: number, moisture = 17): number {
  return flameFactor(T, lambda, moisture);
}

import { flameCoFactor as flameFactor } from './combustion';

/** CO of a settled day per MJ of wood, mg/MJ, from the flue series. */
function dayCoPerMJ(patch: Partial<HeaterParams>): number {
  const d = day(patch);
  let mg = 0;
  for (let f = 0; f < 96; f++) {
    const flow = d.series.flow[f]! / 1.165; // m³/s
    mg += d.series.flueCo[f]! * MG_PER_PPM_20C * flow * 900;
  }
  return mg / (d.counters.wood / 1e6);
}
