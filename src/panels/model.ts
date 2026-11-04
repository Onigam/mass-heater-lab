import type { ClaimCheck, DayResult } from '../sim/runs';
import type { HeaterParams, HeaterState } from '../sim/types';
import type { PanelKey } from './strings';

// What the panel plots and says, as plain functions of the simulation: a test checks the numbers and the status line without a browser.

/** A figure of the panel, with its tag: `†` a result of the model, `*` an estimate, nothing when it is a setting or a reported value. */
export interface Readout {
  key: PanelKey;
  value: number;
  digits: number;
  unit: string;
  tag: '' | '†' | '*';
}

const r = (key: PanelKey, value: number, digits: number, unit: string, tag: Readout['tag'] = '†'): Readout => ({
  key,
  value,
  digits,
  unit,
  tag,
});

/**
 * The carbon monoxide in the room, as words or as a band, never a bare figure. With no leak and no reversal the model has nothing to put in the room: it has not measured a clean air, and a « 0 ppm » would read as one. With a leak it is
 * the middle of the same band of one to nine as the flue's, so it is written as that band.
 */
export function roomCoText(s: HeaterState): { noLeak: boolean; low: number; high: number } {
  const noLeak = s.coIntoRoom <= 0 && s.roomCo < 0.05;
  return { noLeak, low: s.roomCo / 3, high: s.roomCo * 3 };
}

/** The figures that stay in sight. */
export function mainReadouts(s: HeaterState): Readout[] {
  return [
    r('liveFire', s.firePower / 1000, 1, 'kW'),
    r('liveChamber', s.chamberT, 0, '°C'),
    r('liveExhaust', s.exhaustT, 0, '°C'),
    r('liveDraft', s.draft, 1, 'Pa'),
    r('liveDrum', s.drumLidT, 0, '°C'),
    r('liveSeatHot', s.seatHotT, 1, '°C'),
    r('liveSeatCold', s.seatColdT, 1, '°C'),
    r('liveRoom', s.roomT, 1, '°C'),
    r('liveDrumOut', s.drumOut / 1000, 1, 'kW'),
    r('liveBenchOut', s.benchOut / 1000, 2, 'kW'),
    r('liveWood', s.woodToday, 1, 'kg'),
  ];
}

/** The rest, folded. */
export function moreReadouts(s: HeaterState, benchMass: number): Readout[] {
  return [
    r('moreLambda', s.lambda > 50 ? 0 : s.lambda, 1, ''),
    r('moreO2', s.o2, 1, '%'),
    r('moreFlow', s.airFlow * 1000, 1, 'g/s'),
    r('moreRiser', s.riserTopT, 0, '°C'),
    r('moreAfter', s.afterDrumT, 0, '°C'),
    r('moreDew', s.dewPointT, 0, '°C'),
    r('moreBrick', s.brickT, 0, '°C'),
    r('moreCasing', s.casingT, 0, '°C'),
    r('moreSleeve', s.sleeveT, 0, '°C'),
    r('moreFlueIn', s.flueInT, 0, '°C'),
    r('moreFlueOut', s.flueOutT, 0, '°C'),
    r('moreStone', s.stoneT, 1, '°C'),
    r('moreOutside', s.outsideT, 1, '°C', '*'),
    r('moreCoreOut', s.coreOut / 1000, 2, 'kW'),
    r('moreEnvelope', s.envelopeLoss / 1000, 2, 'kW'),
    r('moreFlue', s.flueLoss / 1000, 2, 'kW'),
    r('moreAsh', s.ash * 1000, 0, 'g'),
    r('moreWoodTotal', s.woodTotal, 1, 'kg'),
    r('moreMass', benchMass / 1000, 2, 't', ''),
  ];
}

export type Tone = 'note' | 'warn';

/** What the status line says: one message, the most important first. */
export function statusOf(s: HeaterState, p: HeaterParams): { key: PanelKey; tone: Tone } {
  if (p.damperClosed) return { key: 'statusDamper', tone: 'warn' };
  if (s.flowDirection < 0)
    return s.burning ? { key: 'statusSmoke', tone: 'warn' } : { key: 'statusColdFlue', tone: 'warn' };
  switch (s.phase) {
    case 'cold':
      return { key: 'statusOut', tone: 'note' };
    case 'lighting':
      return { key: 'statusCatching', tone: 'note' };
    case 'burningDown':
      return { key: 'statusDown', tone: 'note' };
    case 'embers':
      return { key: 'statusEmbers', tone: 'note' };
    case 'roaring':
      break;
  }
  if (s.regime === 'smokeBack') return { key: 'statusSmoke', tone: 'warn' };
  if (s.regime === 'starved') return { key: 'statusStarved', tone: 'warn' };
  if (s.regime === 'coldChamber') return { key: 'statusCold', tone: 'warn' };
  if (s.regime === 'wet') return { key: 'statusWet', tone: 'note' };
  if (s.regime === 'lean') return { key: 'statusBurningLean', tone: 'note' };
  return { key: 'statusBurningHot', tone: 'note' };
}

export interface Segment {
  key: PanelKey;
  share: number;
  colour: string;
}

/** Gold, where the kit's `--sun` (and `SERIES_COLORS.pv`, which reads it) gives only 2.5:1 on the light card. A canvas cannot read `var()`: one value that holds in both themes. */
export const GOLD = '#a98000';

/** The bar of a day's wood: the kit's tokens, which follow the theme; gold as above, and an earth no token has. `model.test.ts` holds them at 3:1 on the card, in both themes. */
export const BUDGET_COLOUR = {
  drum: 'var(--copper)',
  bench: GOLD,
  core: '#8a7a5c',
  flueIn: 'var(--leaf)',
  lost: 'var(--water)',
  unburned: 'var(--ink)',
} as const;

/** A day's wood, split as the gas gave it up. They add up to the wood. */
export function budgetSegments(d: DayResult): Segment[] {
  const s = d.summary;
  return [
    { key: 'budgetDrum', share: s.shareDrum, colour: BUDGET_COLOUR.drum },
    { key: 'budgetBench', share: s.shareBench, colour: BUDGET_COLOUR.bench },
    { key: 'budgetCore', share: s.shareCore + s.shareSpill, colour: BUDGET_COLOUR.core },
    { key: 'budgetFlueIn', share: s.shareFlueIndoors, colour: BUDGET_COLOUR.flueIn },
    { key: 'budgetLost', share: s.shareExit + s.shareExitIdle + s.shareFlueOutdoors, colour: BUDGET_COLOUR.lost },
    { key: 'budgetUnburned', share: s.shareUnburned, colour: BUDGET_COLOUR.unburned },
  ];
}

/** The chart's round top: three intervals, each a round number. */
export function niceCeil3(v: number): number {
  if (!(v > 0)) return 3;
  const p = Math.pow(10, Math.floor(Math.log10(v / 3)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= 3 * m * p) return 3 * m * p;
  return 30 * p;
}

const asList = (a: ArrayLike<number>, scale = 1): number[] => Array.from({ length: a.length }, (_, i) => a[i]! * scale);

/** The day, hour by hour: what the bench does. */
export function dayChartData(d: DayResult) {
  const s = d.series;
  return {
    xs: asList(d.hours),
    seatHot: asList(s.seat0),
    seatCold: asList(s.seat5),
    room: asList(s.room),
    outside: asList(s.outside),
  };
}

export function powerChartData(d: DayResult) {
  const s = d.series;
  return {
    xs: asList(d.hours),
    fire: asList(s.fire, 1e-3),
    drum: asList(s.drumOut, 1e-3),
    bench: asList(s.benchOut, 1e-3),
  };
}

export function hotChartData(d: DayResult) {
  const s = d.series;
  return {
    xs: asList(d.hours),
    chamber: asList(s.chamber),
    drum: asList(s.lid),
    exhaust: asList(s.exhaust),
  };
}

export function pathChartData(s: HeaterState) {
  return { xs: Array.from(s.pathS), pressure: Array.from(s.pathP), gas: Array.from(s.pathT) };
}

/** The temperature from the duct to the seat, at the two ends of the bench: height above the top of the duct, m. */
export function sectionChartData(s: HeaterState) {
  const col = s.ductCol;
  const line = (seg: number) => {
    const edges = s.benchRowEdges[seg]!;
    const base = s.benchCols * s.benchRows * seg;
    const xs: number[] = [0];
    const ys: number[] = [s.ductGasT[seg]!];
    const top = edges[s.ductRow + 1]!;
    for (let row = s.ductRow + 1; row < s.benchRows; row++) {
      xs.push((edges[row]! + edges[row + 1]!) / 2 - top);
      ys.push(s.benchT[col + s.benchCols * row + base]!);
    }
    xs.push(edges[s.benchRows]! - top);
    ys.push(s.seatT[seg]!);
    return { xs, ys };
  };
  return { hot: line(0), cold: line(s.benchSegments - 1) };
}

/** The claims as lines of the panel. */
export function claimReadouts(c: ClaimCheck): Readout[] {
  return [
    r('claimStove', 100 * c.savedByStove, 0, '%'),
    r('claimBoth', 100 * c.savedWithInsulation, 0, '%'),
    r('claimFor80', 100 * c.etaFor80, 0, '%'),
    r('claimFor90', 100 * c.etaFor90, 0, '%'),
  ];
}

export function dayReadouts(d: DayResult): Readout[] {
  const s = d.summary;
  return [
    r('effDelivered', 100 * s.delivered, 0, '%'),
    r('effFlue', 100 * s.flueEfficiency, 0, '%'),
    r('effWood', s.woodKg, 1, 'kg'),
    r('effRoom', s.roomMean, 1, '°C'),
    r('effExhaust', s.meanExhaust, 0, '°C'),
    r('effLambda', s.meanLambda, 1, ''),
    r('effCondensate', s.condensate, 1, 'kg'),
  ];
}
