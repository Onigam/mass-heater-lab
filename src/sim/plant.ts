import {
  charCoFactor,
  CLEAN_T,
  COLD_T,
  dewPoint,
  flameCoFactor,
  flueGas,
  gasCp,
  heatingValue,
  heatPerAir,
  MG_PER_PPM_20C,
  alarmLimit,
  saturationPressure,
  stoichAir,
  unburnedShare,
  WHO_LIMITS,
  type CoRegime,
  type FlueGas,
} from './combustion';
import {
  benchColumns,
  benchMaterial,
  BENCH_COLS,
  BENCH_ROWS,
  BENCH_SEGMENTS,
  benchRows,
  casingEarth,
  concrete,
  CONCRETE,
  ductAxis,
  DUCT_COL,
  DUCT_ROW,
  ductSquare,
  fireclay,
  FIRECLAY,
  houseVolume,
  MACHINE,
  MODEL,
  riserInsulation,
  stone,
  STONE,
  STEEL,
} from './machine';
import {
  buildGrid,
  createNetwork,
  FILM_FACING_UP,
  FILM_VERTICAL,
  GRAVITY,
  naturalFilm,
  radiationConductance,
  setLinkConductance,
  setNodeTemperature,
  SIGMA,
  solveLoopFlow,
  stepNetwork,
  tubeFriction,
  tubeNusselt,
  updateConductances,
  type LinkSpec,
  type Material,
  type NodeSpec,
  type RCNetwork,
} from './thermal';
import { STATIONS, type FirePhase, type HeaterParams } from './types';

// The whole machine at one instant and over one step: the fire, the gas path with its draft, the solids, the house. Everything that holds heat is a node of one RC network;
// the gases hold next to none, so at each step the flow and their temperatures are found on the present temperatures of the solids, and what they give up is applied to the
// solids as a heat. Allocates nothing in a step: the 3D reads the state every frame on a phone.

/** Most the path can carry, kg/s. */
const FLOW_MAX = 0.15;
const R_UNIVERSAL = 8314.46;
const P_ATM = 101325;
const M_AIR = 28.97;

/** What decides a new network: the rest changes live. */
export const geometryKey = (p: HeaterParams): string =>
  [p.bore, p.riserHeight, p.riserInsulation, p.ductLength, p.chimneyTop, p.benchFill, p.benchK].join('|');

export const dailyOutside = (p: HeaterParams, hour: number): number =>
  p.outsideMean + p.outsideSwing * Math.cos((2 * Math.PI * (hour - MODEL.warmestHour)) / 24);

/** Energy of the day, J. All the heat the gas gives up, and where the house's heat goes. */
export interface Counters {
  /** Chemical energy of the wood burned. */
  wood: number;
  released: number;
  unburned: number;
  /** Given by the gas, or the fire, to each part. */
  toCore: number;
  toDrum: number;
  toBench: number;
  /** The same, slice by slice of the duct, hot end first. */
  toSegments: number[];
  toFlueIndoors: number;
  toFlueOutdoors: number;
  /** Left at the cap above the room's temperature, while a fire burns and when none does. */
  exitFire: number;
  exitIdle: number;
  /** Into the room straight from the feed. */
  spill: number;
  /** Cold air: the house's own air change, what the chimney's draw adds to it. */
  airBase: number;
  airDraw: number;
  gains: number;
  /** Out of the surfaces into the room. */
  drumOut: number;
  benchOut: number;
  coreOut: number;
  flueOut: number;
  /** Through the walls and the floor. */
  envelope: number;
  behindBench: number;
  ground: number;
  /** Water condensed, kg; seconds the exhaust spent under the dew point. */
  condensate: number;
  belowDewSeconds: number;
  /** Seconds and sums while a tended fire was at full rate. */
  fullSeconds: number;
  sumLambda: number;
  sumChamber: number;
  sumExhaust: number;
  sumDraft: number;
  sumFlow: number;
  peakExhaust: number;
  peakDrum: number;
  peakChamber: number;
  peakDraft: number;
  peakRoomCo: number;
  /** Seconds with the gas coming back. */
  reversedSeconds: number;
}

export const newCounters = (): Counters => ({
  wood: 0,
  released: 0,
  unburned: 0,
  toCore: 0,
  toDrum: 0,
  toBench: 0,
  toSegments: new Array<number>(BENCH_SEGMENTS).fill(0),
  toFlueIndoors: 0,
  toFlueOutdoors: 0,
  exitFire: 0,
  exitIdle: 0,
  spill: 0,
  airBase: 0,
  airDraw: 0,
  gains: 0,
  drumOut: 0,
  benchOut: 0,
  coreOut: 0,
  flueOut: 0,
  envelope: 0,
  behindBench: 0,
  ground: 0,
  condensate: 0,
  belowDewSeconds: 0,
  fullSeconds: 0,
  sumLambda: 0,
  sumChamber: 0,
  sumExhaust: 0,
  sumDraft: 0,
  sumFlow: 0,
  peakExhaust: -Infinity,
  peakDrum: -Infinity,
  peakChamber: -Infinity,
  peakDraft: -Infinity,
  peakRoomCo: 0,
  reversedSeconds: 0,
});

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Viscosity and conductivity of the gas, the core's air curves written without a power: called many times a step. Within 1 % of `airMu`, `airK` from 0 to 1,000 °C (tested). */
export function gasMu(T: number): number {
  const K = T + 273.15;
  return (1.458e-6 * K * Math.sqrt(K)) / (K + 110.4);
}
export const gasK = (T: number): number => 0.0241 + T * (7.0e-5 - 1.0e-8 * T);

/** Which fire is on at this hour, if any: the start of the session, or −1. */
export function sessionStarts(p: HeaterParams): number[] {
  const n = Math.round(p.firesPerDay);
  if (n <= 0) return [];
  if (n === 1) return [p.eveningHour];
  if (n === 2) return [p.morningHour, p.eveningHour];
  return [p.morningHour, (p.morningHour + p.eveningHour) / 2, p.eveningHour];
}

/** How long the wood of one fire goes in, h. */
/** The feed comes up over the ignition, so a session runs that much longer: the wood of the day is what the settings say. */
export const fireLength = (p: HeaterParams): number =>
  p.style === 'batch' ? p.burnMinutes / 60 : p.sessionHours + MODEL.ignitionTime / 2 / 3600;

/** Wood of a day by the settings, kg. */
export const woodOfDay = (p: HeaterParams): number =>
  Math.round(p.firesPerDay) * (p.style === 'batch' ? p.loadKg : p.feedKgH * p.sessionHours);

export class Plant {
  readonly net: RCNetwork;
  readonly key: string;
  private p: HeaterParams;

  // ---- nodes
  readonly outside: number;
  readonly ground: number;
  readonly air: number;
  readonly surf: number;
  readonly stone: number[];
  readonly brick: number;
  readonly casing: number;
  readonly slabCore: number;
  readonly linerIn: number;
  readonly linerOut: number;
  readonly sleeve: number;
  readonly lid: number;
  readonly upper: number;
  readonly lower: number;
  readonly flueIn: number;
  readonly flueOut: number;
  /** Nodes of the bench, slice by slice, `col + cols·row`, −1 at the duct. */
  readonly cells: Int32Array;
  readonly slabs: Int32Array;

  // ---- links that change
  private lnkEnvelope: number;
  private lnkLidConv: number;
  private lnkLidRad: number;
  private lnkUpperConv: number;
  private lnkUpperRad: number;
  private lnkLowerConv: number;
  private lnkLowerRad: number;
  private lnkSleeveUpper: number;
  private lnkSleeveLower: number;
  private lnkFlueIn: number;
  private lnkFlueOut: number;
  /** One surface element of the bench per pair of links: its cell, area, half-cell conductance, film coefficient, link to the air, link to the room's surfaces. */
  private surfCount = 0;
  private surfCell: Int32Array;
  private surfArea: Float64Array;
  private surfCond: Float64Array;
  private surfUp: Uint8Array;
  private surfConv: Int32Array;
  private surfRad: Int32Array;
  private backLinks: Int32Array;
  private slabGroundLinks: Int32Array;
  private lnkSlabCoreGround: number;
  private lnkCasingAir: number;
  private lnkCasingSurf: number;
  private filmsAge = 1e9;

  // ---- the duct: each slice gives to four cells
  private ductCell: Int32Array;
  private ductArea: Float64Array;
  private ductCond: Float64Array;
  private segCondSum: Float64Array;
  private segWall: Float64Array;
  private segLen: number;
  private hotSegments: number;
  private cols: number[];
  private segRows: number[][];
  private kLiner = 0.15;
  private insulation: Material;

  // ---- geometry of the path
  private A: number;
  private D: number;
  private Afeed: number;
  private Aann: number;
  private Dann: number;
  private Agap: number;
  private feedH: number;
  private riserL: number;
  private AriserWall: number;
  private AlidIn: number;
  private AwallHalf: number;
  private AsleeveHalf: number;
  private AflueIn: number;
  private AflueOut: number;
  private LflueIn: number;
  private LflueOut: number;
  private shapeLiner: number;
  private AlidOut: number;
  /** Rise of the sections on the path (feed, riser, upper, lower, duct, flue in, flue out). */
  private dz = new Float64Array(7);
  /** ∫ρ_ref dz of each section, kg/m². */
  private ref = new Float64Array(7);
  private z = new Float64Array(8);

  // ---- the fire
  eVol = 0;
  eChar = 0;
  ignition = 0;
  private lastSession = -1;
  private manualLeft = 0;
  private batchClock = 0;
  extraLoad = 0;
  flueWarmLeft = 0;
  fireCount = 0;
  phase: FirePhase = 'cold';
  feedRate = 0;

  // ---- the step's working values
  time = 0;
  m = 0.002;
  private mFuel = 0;
  private Qav = 0;
  private Qavail0 = 0;
  private qVol = 0;
  private qChar = 0;
  private u = 0;
  private qpa = 3e6;
  private Tair = 20;
  private Tout = 0;
  private cp = 1100;
  private rhoGasK = 353;
  private rhoAirK = 353;
  private Ac = 0.01;
  private As = 1;
  private exAir = 0;
  private kDamper = 0;
  private fanPa = 0;
  private head = 0;
  private hasFire = false;
  private rhoNeck = 1.2;
  private gas: FlueGas = { xWater: 0, wWater: 0, wCO2: 0, M: 28.97 };

  // ---- what the last evaluation found
  qRel = 0;
  spill = 0;
  lambda = 0;
  chamberT = 20;
  riserTopT = 20;
  afterDrumT = 20;
  exhaustT = 20;
  draft = 0;
  draftRiser = 0;
  draftDrum = 0;
  draftChimney = 0;
  draftFeed = 0;
  residualLeft = 0;
  lidPressure = 0;
  leakShare = 0;
  dewT = 40;
  condensing = false;
  condensate = 0;
  regime: CoRegime = 'none';
  /** CO made now, mg/s; its share into the room. */
  coSource = 0;
  coFlueMgS = 0;
  coIntoRoom = 0;
  flueCo = 0;
  roomCo = 0;
  coDose = 0;
  coAlarm = 0;
  /** Running means of the room's CO over the guideline's four times, mg/m³. */
  whoMeans = new Float64Array(WHO_LIMITS.length);
  whoExceeded = false;
  ventilation = 0;
  powerFire = 0;
  drumOutNow = 0;
  benchOutNow = 0;
  coreOutNow = 0;
  flueLossNow = 0;
  envelopeNow = 0;

  readonly pathT = new Float64Array(STATIONS.length);
  readonly pathP = new Float64Array(STATIONS.length);
  readonly pathS = new Float64Array(STATIONS.length);
  readonly ductGasT = new Float64Array(BENCH_SEGMENTS);

  counters: Counters = newCounters();

  /** The evaluation handed to the solver: one closure, made once. */
  private readonly residual = (m: number): number => this.evaluate(m, false);
  private readonly hLocal = { conv: 0, f: 0.05 };

  constructor(p: HeaterParams) {
    this.p = p;
    this.key = geometryKey(p);
    const nodes: NodeSpec[] = [];
    const links: LinkSpec[] = [];
    const add = (s: NodeSpec): number => nodes.push(s) - 1;
    const link = (l: LinkSpec): number => links.push(l) - 1;

    const D = p.bore;
    this.D = D;
    this.A = (Math.PI * D * D) / 4;
    const scale = D / MACHINE.bore;
    const feedSide = MACHINE.feedSide * scale;
    this.Afeed = feedSide * feedSide;
    this.feedH = MACHINE.feedHeight * scale;
    const tunnelAxis = MACHINE.tunnelAxis;
    this.riserL = p.riserHeight;
    const r1 = D / 2;
    const r2 = r1 + MACHINE.riserInsulation;
    const Ds = 2 * r2;
    const Dd = MACHINE.drumDiameter;
    this.Aann = (Math.PI / 4) * (Dd * Dd - Ds * Ds);
    this.Dann = Dd - Ds;
    this.AriserWall = Math.PI * D * this.riserL;
    this.AlidIn = (Math.PI / 4) * Dd * Dd;
    this.AlidOut = this.AlidIn;
    const riserTop = tunnelAxis + this.riserL;
    const drumTop = riserTop + MACHINE.topGap;
    // the drum reaches from the gap above the riser down to its plinth; a taller riser takes a taller stack of drum, as builders do
    const drumH = Math.max(drumTop - MACHINE.plinthHeight, 0.3);
    const wallArea = Math.PI * Dd * drumH;
    this.AwallHalf = wallArea / 2;
    this.AsleeveHalf = (Math.PI * Ds * this.riserL) / 2;
    this.Agap = Math.PI * Ds * p.topGap;
    const ductZ0 = ductAxis(D, true);
    const ductZ1 = ductAxis(D, false);
    const chimneyTop = p.chimneyTop;
    const ceiling = Math.min(MACHINE.roofLine, chimneyTop);
    this.LflueIn = ceiling - ductZ1;
    this.LflueOut = Math.max(chimneyTop - ceiling, 0.01);
    this.AflueIn = Math.PI * D * this.LflueIn;
    this.AflueOut = Math.PI * D * this.LflueOut;
    this.segLen = p.ductLength / BENCH_SEGMENTS;

    const z = this.z;
    z[0] = tunnelAxis + this.feedH;
    z[1] = tunnelAxis;
    z[2] = riserTop;
    z[3] = (riserTop + ductZ0) / 2;
    z[4] = ductZ0;
    z[5] = ductZ1;
    z[6] = ceiling;
    z[7] = chimneyTop;
    // sections: feed (down), riser (up), upper and lower half of the fall, duct (up a little), flue indoors, flue outdoors
    this.dz[0] = z[1]! - z[0]!;
    this.dz[1] = z[2]! - z[1]!;
    this.dz[2] = z[3]! - z[2]!;
    this.dz[3] = z[4]! - z[3]!;
    this.dz[4] = z[5]! - z[4]!;
    this.dz[5] = z[6]! - z[5]!;
    this.dz[6] = z[7]! - z[6]!;

    const s = this.pathS;
    s[0] = 0;
    s[1] = this.feedH;
    s[2] = s[1]! + MACHINE.tunnelLength * scale;
    s[3] = s[2]! + this.riserL;
    s[4] = s[3]! + MACHINE.topGap;
    s[5] = s[4]! + Math.abs(this.dz[2]!);
    s[6] = s[5]! + Math.abs(this.dz[3]!);
    s[7] = s[6]! + 0.3;
    s[8] = s[7]! + p.ductLength;
    s[9] = s[8]! + 0.3;
    s[10] = s[9]! + this.LflueIn;
    s[11] = s[10]! + this.LflueOut;

    // ---- nodes of the house
    const T0 = 18;
    this.outside = add({ T: 2, fixed: true });
    this.ground = add({ T: MODEL.groundT, fixed: true });
    const airC = houseVolume() * 1.2 * 1005;
    this.air = add({ T: T0, capacity: airC });
    this.surf = add({ T: T0, capacity: MACHINE.houseArea * MODEL.surfaceCapacity });
    const w = MACHINE.stoneWall;
    const faces = 2 * w.width * w.height; // both faces of the wall
    const layer = w.thickness / 2 / 3;
    const stoneMat = stone();
    this.stone = [0, 1, 2].map(() => add({ T: T0, mass: faces * layer * STONE.rho, material: stoneMat }));

    // ---- the core
    const clay = fireclay();
    const earth = casingEarth();
    const concreteMat = concrete();
    const coreScale = scale * scale;
    this.brick = add({ T: T0, mass: MODEL.brickMass * coreScale, material: clay });
    this.casing = add({ T: T0, mass: MODEL.casingMass * coreScale, material: earth });
    this.slabCore = add({
      T: T0,
      mass: (1.0 * MACHINE.slab + 0.2 * MACHINE.slab) * CONCRETE.rho,
      material: concreteMat,
    });
    const ins = riserInsulation(p.riserInsulation);
    this.insulation = ins;
    const rm = Math.sqrt((r1 * r1 + r2 * r2) / 2);
    const riserVol = (a: number, b: number) => Math.PI * (b * b - a * a) * this.riserL;
    this.linerIn = add({ T: T0, mass: riserVol(r1, rm) * ins.rho, material: ins });
    this.linerOut = add({ T: T0, mass: riserVol(rm, r2) * ins.rho, material: ins });
    const steelC = (area: number, t: number) => area * t * STEEL.rho * STEEL.c;
    this.sleeve = add({ T: T0, capacity: steelC(2 * this.AsleeveHalf, MACHINE.sleeveWall) });
    this.lid = add({ T: T0, capacity: steelC(this.AlidIn, MACHINE.drumWall) });
    this.upper = add({ T: T0, capacity: steelC(this.AwallHalf, MACHINE.drumWall) });
    this.lower = add({ T: T0, capacity: steelC(this.AwallHalf, MACHINE.drumWall) });
    const flueC = (L: number) => L * 2400 * scale;
    this.flueIn = add({ T: T0, capacity: flueC(this.LflueIn) });
    this.flueOut = add({ T: T0, capacity: flueC(this.LflueOut) });

    // ---- links of the house
    const m = MODEL;
    this.lnkEnvelope = link({ a: this.surf, b: this.outside, G: 100 });
    link({ a: this.air, b: this.surf, G: m.surfaceConvection * m.surfaceArea });
    const filmStone = (h: number) => 1 / (1 / (h * faces) + layer / 2 / (STONE.k * faces));
    link({ a: this.air, b: this.stone[0]!, G: filmStone(m.surfaceConvection) });
    link({ a: this.surf, b: this.stone[0]!, G: filmStone(m.surfaceRadiation) });
    link({ a: this.stone[0]!, b: this.stone[1]!, shapeA: faces / (layer / 2), shapeB: faces / (layer / 2) });
    link({ a: this.stone[1]!, b: this.stone[2]!, shapeA: faces / (layer / 2), shapeB: faces / (layer / 2) });

    // ---- links of the core
    link({ a: this.brick, b: this.casing, shapeA: m.tunnelArea / m.brickHalf, shapeB: m.casingArea / m.casingHalf });
    this.lnkCasingAir = link({ a: this.casing, b: this.air, G: 3 });
    this.lnkCasingSurf = link({ a: this.casing, b: this.surf, G: 5 });
    link({ a: this.casing, b: this.slabCore, shapeA: 1.0 / m.casingHalf, shapeB: 1.0 / (MACHINE.slab / 2) });
    this.lnkSlabCoreGround = link({ a: this.slabCore, b: this.ground, G: m.floorU * 1.2 });
    const shapeRing = (L: number, a: number, b: number) => (2 * Math.PI * L) / Math.log(b / a);
    const rIn = Math.sqrt((r1 * r1 + rm * rm) / 2);
    const rOut = Math.sqrt((rm * rm + r2 * r2) / 2);
    this.shapeLiner = shapeRing(this.riserL, r1, rIn);
    link({
      a: this.linerIn,
      b: this.linerOut,
      shapeA: shapeRing(this.riserL, rIn, rm),
      shapeB: shapeRing(this.riserL, rm, rOut),
    });
    link({ a: this.linerOut, b: this.sleeve, shapeA: shapeRing(this.riserL, rOut, r2) });
    this.lnkSleeveUpper = link({ a: this.sleeve, b: this.upper, G: 1 });
    this.lnkSleeveLower = link({ a: this.sleeve, b: this.lower, G: 1 });
    // thin steel carries little along itself, and the foot of the drum stands in earth
    link({ a: this.lid, b: this.upper, G: 0.4 });
    link({ a: this.upper, b: this.lower, G: 0.5 });
    link({ a: this.lower, b: this.casing, G: 1.0 });
    this.lnkLidConv = link({ a: this.lid, b: this.air, G: 1 });
    this.lnkLidRad = link({ a: this.lid, b: this.surf, G: 1 });
    this.lnkUpperConv = link({ a: this.upper, b: this.air, G: 1 });
    this.lnkUpperRad = link({ a: this.upper, b: this.surf, G: 1 });
    this.lnkLowerConv = link({ a: this.lower, b: this.air, G: 1 });
    this.lnkLowerRad = link({ a: this.lower, b: this.surf, G: 1 });
    this.lnkFlueIn = link({ a: this.flueIn, b: this.air, G: 1 });
    this.lnkFlueOut = link({ a: this.flueOut, b: this.outside, G: 1 });

    // ---- the bench, slice by slice
    const material = benchMaterial(p.benchFill, p.benchK);
    const cols = benchColumns(D);
    const hotSegments = Math.max(1, Math.min(BENCH_SEGMENTS - 1, Math.round(MACHINE.hotRun / this.segLen)));
    this.hotSegments = hotSegments;
    this.cols = cols;
    this.segRows = Array.from({ length: BENCH_SEGMENTS }, (_, seg) => benchRows(D, seg < hotSegments));
    const nCells = BENCH_COLS * BENCH_ROWS;
    this.cells = new Int32Array(nCells * BENCH_SEGMENTS).fill(-1);
    this.slabs = new Int32Array(BENCH_SEGMENTS);
    this.ductCell = new Int32Array(4 * BENCH_SEGMENTS);
    this.ductArea = new Float64Array(4 * BENCH_SEGMENTS);
    this.ductCond = new Float64Array(4 * BENCH_SEGMENTS);
    this.segCondSum = new Float64Array(BENCH_SEGMENTS);
    this.segWall = new Float64Array(BENCH_SEGMENTS);
    const surfMax = (BENCH_COLS + BENCH_ROWS) * BENCH_SEGMENTS;
    this.surfCell = new Int32Array(surfMax);
    this.surfArea = new Float64Array(surfMax);
    this.surfCond = new Float64Array(surfMax);
    this.surfUp = new Uint8Array(surfMax);
    this.surfConv = new Int32Array(surfMax);
    this.surfRad = new Int32Array(surfMax);
    this.backLinks = new Int32Array(BENCH_ROWS * BENCH_SEGMENTS);
    this.slabGroundLinks = new Int32Array(BENCH_SEGMENTS);
    const hole = DUCT_COL + BENCH_COLS * DUCT_ROW;
    const sq = ductSquare(D);
    let backN = 0;
    for (let seg = 0; seg < BENCH_SEGMENTS; seg++) {
      const rows = this.segRows[seg]!;
      const grid = buildGrid({
        geometry: 'xy',
        xEdges: cols,
        yEdges: rows,
        depth: this.segLen,
        material,
        T: T0 + 8,
      });
      // the grid's nodes in the network, the duct's cell left out: the duct's own steel holds next to nothing
      const map = new Int32Array(nCells).fill(-1);
      for (let c = 0; c < nCells; c++) {
        if (c === hole) continue;
        map[c] = add(grid.nodes[c]!);
        this.cells[c + nCells * seg] = map[c]!;
      }
      for (const l of grid.links) {
        if (l.a === hole || l.b === hole) continue;
        link({ ...l, a: map[l.a]!, b: map[l.b]! });
      }
      // the four cells around the duct, with their half-cell behind the wall: the round duct's own area is shared between them
      const wallArea = Math.PI * D * this.segLen;
      const around: [number, number][] = [
        [
          DUCT_COL + BENCH_COLS * (DUCT_ROW + 1),
          (sq * this.segLen) / ((rows[DUCT_ROW + 2]! - rows[DUCT_ROW + 1]!) / 2),
        ],
        [DUCT_COL + BENCH_COLS * (DUCT_ROW - 1), (sq * this.segLen) / ((rows[DUCT_ROW]! - rows[DUCT_ROW - 1]!) / 2)],
        [DUCT_COL - 1 + BENCH_COLS * DUCT_ROW, (sq * this.segLen) / ((cols[DUCT_COL]! - cols[DUCT_COL - 1]!) / 2)],
        [DUCT_COL + 1 + BENCH_COLS * DUCT_ROW, (sq * this.segLen) / ((cols[DUCT_COL + 2]! - cols[DUCT_COL + 1]!) / 2)],
      ];
      around.forEach(([c, shape], k) => {
        const i = 4 * seg + k;
        this.ductCell[i] = map[c]!;
        this.ductArea[i] = wallArea / 4;
        this.ductCond[i] = material.k(30) * shape;
        this.segCondSum[seg] += this.ductCond[i]!;
      });
      // the seat and the front to the room, the back to the wall, the bottom to the slab
      const slab = add({
        T: T0,
        mass: MACHINE.benchDepth * this.segLen * MACHINE.slab * CONCRETE.rho,
        material: concreteMat,
      });
      this.slabs[seg] = slab;
      this.slabGroundLinks[seg] = link({ a: slab, b: this.ground, G: m.floorU * MACHINE.benchDepth * this.segLen });
      const addSurface = (cell: number, area: number, shape: number, up: boolean) => {
        const i = this.surfCount++;
        this.surfCell[i] = cell;
        this.surfArea[i] = area;
        this.surfCond[i] = material.k(30) * shape;
        this.surfUp[i] = up ? 1 : 0;
        this.surfConv[i] = link({ a: cell, b: this.air, G: 1 });
        this.surfRad[i] = link({ a: cell, b: this.surf, G: 1 });
      };
      for (const f of grid.faces('yMax')) addSurface(map[f.node]!, f.area, f.shape, true);
      for (const f of grid.faces('xMax')) {
        if (f.node === hole) continue;
        addSurface(map[f.node]!, f.area, f.shape, false);
      }
      for (const f of grid.faces('xMin')) {
        const G = 1 / (1 / (material.k(30) * f.shape) + 1 / (m.wallU * f.area));
        this.backLinks[backN++] = link({ a: map[f.node]!, b: this.outside, G });
      }
      for (const f of grid.faces('yMin')) {
        link({ a: map[f.node]!, b: slab, shapeA: f.shape, G: 1 / (MACHINE.slab / 2 / (CONCRETE.k * f.area)) });
      }
    }
    this.net = createNetwork(nodes, links);
    this.apply(p);
  }

  /** Read the settings that do not need a new network. */
  apply(p: HeaterParams): void {
    this.p = p;
    const net = this.net;
    // the house's H: its air change at the base rate is one part, and the shell is the rest, from the room's surfaces to the outside (an inner film of about 1,900 W/K in all takes little off a shell this tight)
    setLinkConductance(net, this.lnkEnvelope, Math.max(p.houseH - this.baseAirFlow() * 1005, 5));
    // a chimney with its insulation, or a bare pipe
    const r1 = p.bore / 2;
    const r2 = r1 + MACHINE.chimneyInsulation;
    const Uins = (2 * Math.PI * 0.06) / Math.log(r2 / r1); // W/m·K, usual rock wool at about 100 °C
    const Ubare = 8 * Math.PI * p.bore;
    const perMetre = p.flueInsulated ? Uins : Ubare;
    setLinkConductance(net, this.lnkFlueIn, perMetre * this.LflueIn);
    setLinkConductance(net, this.lnkFlueOut, (p.flueInsulated ? Uins : Ubare * 2) * this.LflueOut);
    // the house that leaks more behind its bench too
    const wallScale = p.houseH / 106;
    let i = 0;
    for (let seg = 0; seg < BENCH_SEGMENTS; seg++) {
      const rows = this.segRows[seg]!;
      for (let r = 0; r < BENCH_ROWS; r++) {
        const area = (rows[r + 1]! - rows[r]!) * this.segLen;
        const shape = area / (this.cols[1]! / 2);
        const G = 1 / (1 / (p.benchK * shape) + 1 / (MODEL.wallU * wallScale * area));
        setLinkConductance(net, this.backLinks[i++]!, G);
      }
    }
    this.fanPa = p.fanPa;
    const open = MODEL.damperLeak;
    this.kDamper = p.damperClosed ? 1 / (open * open) : p.damperK;
    this.filmsAge = 1e9;
  }

  private baseAirFlow(): number {
    return (houseVolume() * MODEL.baseAch * 1.2) / 3600;
  }

  // ------------------------------------------------------------------ starting temperatures

  /** Every solid at a plausible temperature for this house: the settling run corrects the rest. */
  setField(room: number, bench: number, core: number, flueIn: number, flueOut: number): void {
    const net = this.net;
    for (const i of [this.air, this.surf, ...this.stone]) setNodeTemperature(net, i, room);
    for (const i of [this.lid, this.upper, this.lower, this.sleeve]) setNodeTemperature(net, i, (core + room) / 2);
    for (const i of [this.brick, this.linerIn, this.linerOut]) setNodeTemperature(net, i, core);
    const casing = (core + room) / 2;
    setNodeTemperature(net, this.casing, casing);
    // a slab on an insulated floor sits near what stands on it: its link down is about a twentieth of its link up
    setNodeTemperature(net, this.slabCore, casing - 0.06 * (casing - MODEL.groundT));
    for (let c = 0; c < this.cells.length; c++) if (this.cells[c]! >= 0) setNodeTemperature(net, this.cells[c]!, bench);
    for (let s = 0; s < BENCH_SEGMENTS; s++)
      setNodeTemperature(net, this.slabs[s]!, bench - 0.04 * (bench - MODEL.groundT));
    setNodeTemperature(net, this.flueIn, flueIn);
    setNodeTemperature(net, this.flueOut, flueOut);
  }

  // ------------------------------------------------------------------ the fire

  lightNow(): void {
    this.manualLeft = fireLength(this.p) * 3600;
    this.batchClock = 0;
    this.ignition = 0;
    this.fireCount++;
    this.lastSession = -2;
  }

  /** A small fire at the foot of the flue, for a few minutes. */
  warmFlue(): void {
    this.flueWarmLeft = MODEL.flueWarmSeconds;
  }

  /** Wood put in by hand, kg: a load takes a few minutes to catch. */
  addWood(kg: number): void {
    this.extraLoad += kg;
  }

  private sessionNow(hour: number): number {
    const len = fireLength(this.p);
    const starts = sessionStarts(this.p);
    for (let i = 0; i < starts.length; i++) {
      const dt = (hour - starts[i]! + 24) % 24;
      if (dt < len) return i + (Math.floor(this.time / 86400) + (hour < starts[i]! ? -1 : 0)) * 8;
    }
    return -1;
  }

  /** The feed of this instant, kg/s, and the session's bookkeeping. */
  private updateFeed(dt: number): void {
    const p = this.p;
    const hour = (this.time / 3600) % 24;
    const scheduled = this.sessionNow(hour);
    const manual = this.manualLeft > 0;
    const on = scheduled >= 0 || manual;
    if (scheduled >= 0 && !manual && scheduled !== this.lastSession) {
      this.lastSession = scheduled;
      this.ignition = 0;
      this.batchClock = 0;
      this.fireCount++;
    }
    if (scheduled < 0 && !manual) this.lastSession = -1;
    if (manual) this.manualLeft = Math.max(0, this.manualLeft - dt);
    let rate = 0;
    if (on) {
      this.ignition = Math.min(1, this.ignition + dt / MODEL.ignitionTime);
      if (p.style === 'batch') {
        const T = p.burnMinutes * 60;
        this.batchClock += dt;
        rate = this.batchClock < T ? (Math.PI / 2) * (p.loadKg / T) * Math.sin((Math.PI * this.batchClock) / T) : 0;
      } else {
        rate = (p.feedKgH / 3600) * this.ignition;
        if (this.m < 0) rate *= MODEL.reversedFeed;
      }
    }
    if (this.extraLoad > 0) {
      const add = Math.min(this.extraLoad, (dt * p.feedKgH) / 900);
      this.extraLoad -= add;
      rate += add / Math.max(dt, 1e-6);
    }
    this.feedRate = rate;
    const Hu = heatingValue(p.moisture);
    this.eVol += rate * Hu * (1 - MODEL.charShare) * dt;
    this.eChar += rate * Hu * MODEL.charShare * dt;
    this.counters.wood += rate * Hu * dt;
    const volOn = this.eVol > MODEL.poolOut;
    const charOn = this.eChar > MODEL.poolOut;
    this.phase = on ? (this.ignition < 1 ? 'lighting' : 'roaring') : volOn ? 'burningDown' : charOn ? 'embers' : 'cold';
    this.hasFire = this.phase !== 'cold';
    const woodIn = on || volOn;
    const cover = this.phase === 'cold' && p.lidAfterFire ? 1 : p.feedCover;
    this.Ac = this.Afeed * Math.max(MODEL.lidLeak, 1 - cover);
    this.As = this.Afeed * (woodIn ? p.packing : 1);
    this.exAir = this.hasFire ? MODEL.feedExchange * (1 - cover) : 0;
  }

  /** What can burn now, W, and the regime it burns in. */
  private updateRates(dt: number): void {
    const p = this.p;
    const Hu = heatingValue(p.moisture);
    const qVol = this.eVol / Math.max(MODEL.volatileTau, dt);
    const qChar = this.eChar / Math.max(MODEL.charTau, dt);
    this.qVol = qVol;
    this.qChar = qChar;
    this.mFuel = (qVol + qChar) / Hu;
    this.qpa = heatPerAir(p.moisture);
    const m = Math.abs(this.m);
    const need = this.mFuel * stoichAir(p.moisture);
    const lam = need > 1e-7 ? (m + this.exAir) / need : 0;
    this.lambda = lam;
    // the unburned share, on the last step's chamber: a slow quantity
    const ef = this.mFuel > 1e-7 ? flameCoFactor(this.chamberT, Math.max(lam, 0.2), p.moisture) : 0;
    this.u = unburnedShare(ef, Hu);
    this.Qavail0 = qVol + qChar;
    this.Qav = (qVol + qChar) * (1 - this.u);
    this.powerFire = this.Qavail0;
    flueGas(Math.max(lam, 1), p.moisture, this.gas);
    this.rhoGasK = (P_ATM * this.gas.M) / R_UNIVERSAL;
    this.rhoAirK = (P_ATM * M_AIR) / R_UNIVERSAL;
    this.cp = gasCp((this.chamberT + this.exhaustT) / 2, this.gas);
    this.head =
      this.Qavail0 > 0
        ? GRAVITY *
          this.feedH *
          (this.rhoAirK / (this.Tair + 273.15) - this.rhoAirK / 1073.15) *
          Math.min(1, this.Qavail0 / 3000)
        : 0;
  }

  // ------------------------------------------------------------------ films

  /** Film of a gas on a wall in a tube, W/m²·K: forced and natural convection together, plus the gas's own radiation. */
  private film(mg: number, Dh: number, A: number, T: number, Tw: number, naturalC: number): number {
    const mu = gasMu(T);
    const k = gasK(T);
    const Pr = 0.71;
    const Re = Math.max((mg * Dh) / (A * mu), 1);
    const f = tubeFriction(Re);
    this.hLocal.f = f;
    const hf = (tubeNusselt(Re, f, Pr) * k) / Dh;
    const Tf = (T + Tw) / 2 + 273.15;
    const rho = this.rhoAirK / (T + 273.15);
    const nu = mu / rho;
    const ra = (GRAVITY * Math.abs(T - Tw) * Pr) / (Tf * nu * nu);
    const hn = naturalC * k * Math.cbrt(ra);
    const hc = Math.cbrt(hf * hf * hf + hn * hn * hn);
    const a = T + 273.15;
    const b = Tw + 273.15;
    const hr = MODEL.gasEmissivity * SIGMA * (a * a + b * b) * (a + b);
    return hc + hr;
  }

  // ------------------------------------------------------------------ the path at a flow

  /**
   * The net pressure at a flow `m`, Pa (drive minus losses, with its sign). `record` writes the stations. Temperatures march from the inlet of the flow's direction, the
   * solids held. Forward: room air, the fire, tunnel, riser, gap, fall, duct, flue. Back: outside air down the flue and along the same path to the fire, and out by the feed.
   */
  private evaluate(m: number, record: boolean): number {
    return m >= 0 ? this.forward(m, record) : this.backward(-m, record);
  }

  /** The loss through the cover, in cold air, and through the sticks, in the gas of the neck, Pa. */
  private feedLoss(m: number, rhoNeck: number): number {
    const m2 = m * m;
    return (
      (MODEL.kCover * m2) / ((2 * this.rhoAirK * this.Ac * this.Ac) / (this.Tair + 273.15)) +
      (MODEL.kSticks * m2) / (2 * rhoNeck * this.As * this.As)
    );
  }

  private forward(m: number, record: boolean): number {
    const T = this.net.T;
    const g = GRAVITY;
    const D = this.D;
    const A = this.A;
    const densGas = this.rhoGasK;
    const airKc = this.rhoAirK;
    const Tair = this.Tair;
    const mg = Math.max(m + this.mFuel, 1e-6);
    const C = mg * this.cp;
    const rhoOf = (t: number) => densGas / (t + 273.15);

    // the fire, and what the feed lets out
    const airCap = (m + this.exAir) * this.qpa;
    const Qr = Math.min(this.Qav, airCap);
    const dpFeed = this.feedLoss(m, this.rhoNeck);
    const spill = this.head > 0 ? clamp01(1 - dpFeed / (MODEL.feedFill * this.head)) : 0;
    const Qpath = Qr * (1 - spill);
    const T0 = Tair + Qpath / C;

    // the tunnel: the flame on the brick
    const Tb = T[this.brick]!;
    const Tflame = Math.min(T0, 1800);
    const hFlame = this.hasFire
      ? MODEL.flameEmissivity * SIGMA * ((Tflame + 273.15) ** 2 + (Tb + 273.15) ** 2) * (Tflame + Tb + 546.3) + 8
      : 3;
    const Atun = MODEL.tunnelArea;
    const Gt = 1 / (1 / (hFlame * Atun) + MODEL.brickHalf / (FIRECLAY.k * Atun));
    const Tt = Tb + (T0 - Tb) * Math.exp(-Gt / C);

    // the riser
    const Tl = T[this.linerIn]!;
    const hr = this.film(mg, D, A, Tt, Tl, 0.1);
    const fRiser = this.hLocal.f;
    const Gr = 1 / (1 / (hr * this.AriserWall) + 1 / (this.kLiner * this.shapeLiner));
    const Trt = Tl + (Tt - Tl) * Math.exp(-Gr / C);

    // under the lid: a jet on a plate, usual order of magnitude
    const Tld = T[this.lid]!;
    const muTop = gasMu(Trt);
    const ReJet = (mg * D) / (A * muTop);
    const a1 = Trt + 273.15;
    const b1 = Tld + 273.15;
    const hLid =
      (0.6 * Math.sqrt(Math.max(ReJet, 1)) * 0.89 * gasK(Trt)) / D +
      MODEL.gasEmissivity * SIGMA * (a1 * a1 + b1 * b1) * (a1 + b1);
    const Gl = hLid * this.AlidIn;
    const Tg0 = Tld + (Trt - Tld) * Math.exp(-Gl / C);

    // the fall: on one side the drum, on the other the sleeve
    const Tu = T[this.upper]!;
    const Tsl = T[this.sleeve]!;
    const hAn = this.film(mg, this.Dann, this.Aann, Tg0, Tu, MODEL.naturalInDrum);
    const eDrum = Math.exp((-hAn * this.AwallHalf) / C);
    const eSleeve = Math.exp((-hAn * this.AsleeveHalf) / C);
    const Tg1a = Tu + (Tg0 - Tu) * eDrum;
    const Tg1 = Tsl + (Tg1a - Tsl) * eSleeve;
    const Tw = T[this.lower]!;
    const Tg2a = Tw + (Tg1 - Tw) * eDrum;
    const Tg2 = Tsl + (Tg2a - Tsl) * eSleeve;

    // the duct, slice by slice, its four cells lumped: the exact march comes at the end of the step
    let Td = Tg2;
    let lossDuct = 0;
    const seg = this.segWall;
    const segA = Math.PI * D * this.segLen;
    for (let s = 0; s < BENCH_SEGMENTS; s++) {
      const Twall = seg[s]!;
      const h = this.film(mg, D, A, Td, Twall, MODEL.naturalInDuct) * this.p.ductFilm;
      const G = 1 / (1 / (h * segA) + 1 / this.segCondSum[s]!);
      const next = Twall + (Td - Twall) * Math.exp(-G / C);
      lossDuct += (this.hLocal.f * this.segLen) / D / rhoOf((Td + next) / 2);
      if (record) this.ductGasT[s] = (Td + next) / 2;
      Td = next;
    }

    // the flue
    const Tfi = T[this.flueIn]!;
    const hF1 = this.film(mg, D, A, Td, Tfi, 0.1);
    const fF1 = this.hLocal.f;
    const Tc1 = Tfi + (Td - Tfi) * Math.exp((-hF1 * this.AflueIn) / C);
    const Tfo = T[this.flueOut]!;
    const hF2 = this.film(mg, D, A, Tc1, Tfo, 0.1);
    const Tc2 = Tfo + (Tc1 - Tfo) * Math.exp((-hF2 * this.AflueOut) / C);

    // the drive
    const rhoFeed = airKc / (Tair + 273.15);
    const rhoR = rhoOf((Tt + Trt) / 2);
    const rhoU = rhoOf((Tg0 + Tg1) / 2);
    const rhoL = rhoOf((Tg1 + Tg2) / 2);
    const rhoD = rhoOf((Tg2 + Td) / 2);
    const rhoF1 = rhoOf((Td + Tc1) / 2);
    const rhoF2 = rhoOf((Tc1 + Tc2) / 2);
    const dz = this.dz;
    const ref = this.ref;
    const dFeed = g * (ref[0]! - rhoFeed * dz[0]!);
    const dRiser = g * (ref[1]! - rhoR * dz[1]!);
    const dUpper = g * (ref[2]! - rhoU * dz[2]!);
    const dLower = g * (ref[3]! - rhoL * dz[3]!);
    const dDuct = g * (ref[4]! - rhoD * dz[4]!);
    const dF1 = g * (ref[5]! - rhoF1 * dz[5]!);
    const dF2 = g * (ref[6]! - rhoF2 * dz[6]!);
    const drive = dFeed + dRiser + dUpper + dLower + dDuct + dF1 + dF2 - this.fanPa;

    // the losses, each in the velocity head of its own section and density
    const G2 = (mg * mg) / 2;
    const At2 = this.Afeed * this.Afeed;
    const rhoT = rhoOf(Tt);
    const A2 = A * A;
    const lFeed = dpFeed;
    const lTunnel = (G2 * MODEL.kTunnel) / (rhoT * At2);
    const lRiser = (G2 * (MODEL.kRiserFoot + (fRiser * this.riserL) / D)) / (rhoR * A2);
    const rGap = A / this.Agap;
    const lGap = (G2 * (MODEL.kGapTurn + rGap * rGap)) / (rhoOf(Trt) * A2);
    const lAnn = (G2 * MODEL.kAnnulus) / (rhoU * this.Aann * this.Aann);
    const lMan = (G2 * MODEL.kManifold) / (rhoL * A2);
    const lDuct = (G2 * lossDuct) / A2 + (G2 * MODEL.kBend * MACHINE.ductBends) / (rhoD * A2);
    const lTee = (G2 * MODEL.kTee) / (rhoF1 * A2);
    const lFlue = (G2 * ((fF1 * (this.LflueIn + this.LflueOut)) / D)) / (rhoF1 * A2);
    const lCap = (G2 * (MODEL.kCap + this.kDamper)) / (rhoF2 * A2);
    const loss = lFeed + lTunnel + lRiser + lGap + lAnn + lMan + lDuct + lTee + lFlue + lCap;

    if (record) {
      this.qRel = Qr;
      this.spill = spill;
      this.chamberT = Tt;
      this.riserTopT = Trt;
      this.afterDrumT = Tg2;
      this.exhaustT = Tc2;
      this.draft = drive;
      this.draftFeed = dFeed;
      this.draftRiser = dRiser;
      this.draftDrum = dUpper + dLower;
      this.draftChimney = dF1 + dF2;
      this.residualLeft = drive - loss;
      this.rhoNeck = airKc / (Math.min(T0, 1200) + 273.15);
      const t = this.pathT;
      t[0] = Tair;
      t[1] = T0;
      t[2] = Tt;
      t[3] = Trt;
      t[4] = Tg0;
      t[5] = Tg1;
      t[6] = Tg2;
      t[7] = Tg2;
      t[8] = Td;
      t[9] = Td;
      t[10] = Tc1;
      t[11] = Tc2;
      const pp = this.pathP;
      pp[0] = 0;
      pp[1] = pp[0]! + dFeed - lFeed;
      pp[2] = pp[1]! - lTunnel;
      pp[3] = pp[2]! + dRiser - lRiser;
      pp[4] = pp[3]! - lGap;
      pp[5] = pp[4]! + dUpper - lAnn / 2;
      pp[6] = pp[5]! + dLower - lAnn / 2;
      pp[7] = pp[6]! - lMan;
      pp[8] = pp[7]! + dDuct - lDuct;
      pp[9] = pp[8]! - lTee;
      pp[10] = pp[9]! + dF1 - lFlue * (this.LflueIn / (this.LflueIn + this.LflueOut));
      pp[11] = pp[10]! + dF2 - lFlue * (this.LflueOut / (this.LflueIn + this.LflueOut));
      this.lidPressure = pp[4]!;
    }
    return drive - loss;
  }

  private backward(a: number, record: boolean): number {
    const T = this.net.T;
    const g = GRAVITY;
    const D = this.D;
    const A = this.A;
    const airKc = this.rhoAirK;
    const mg = Math.max(a, 1e-6);
    const cpAir = 1010;
    const C = mg * cpAir;
    const rhoOf = (t: number) => airKc / (t + 273.15);
    const Tout = this.Tout;

    const Tfo = T[this.flueOut]!;
    const hF2 = this.film(mg, D, A, Tout, Tfo, 0.1);
    const Tc1 = Tfo + (Tout - Tfo) * Math.exp((-hF2 * this.AflueOut) / C);
    const Tfi = T[this.flueIn]!;
    const hF1 = this.film(mg, D, A, Tc1, Tfi, 0.1);
    const fF = this.hLocal.f;
    const Td0 = Tfi + (Tc1 - Tfi) * Math.exp((-hF1 * this.AflueIn) / C);
    let Td = Td0;
    let lossDuct = 0;
    const segA = Math.PI * D * this.segLen;
    for (let s = BENCH_SEGMENTS - 1; s >= 0; s--) {
      const Twall = this.segWall[s]!;
      const h = this.film(mg, D, A, Td, Twall, MODEL.naturalInDuct) * this.p.ductFilm;
      const G = 1 / (1 / (h * segA) + 1 / this.segCondSum[s]!);
      const next = Twall + (Td - Twall) * Math.exp(-G / C);
      lossDuct += (this.hLocal.f * this.segLen) / D / rhoOf((Td + next) / 2);
      if (record) this.ductGasT[s] = (Td + next) / 2;
      Td = next;
    }
    const Tw = T[this.lower]!;
    const Tsl = T[this.sleeve]!;
    const hAn = this.film(mg, this.Dann, this.Aann, Td, Tw, MODEL.naturalInDrum);
    const eDrum = Math.exp((-hAn * this.AwallHalf) / C);
    const eSleeve = Math.exp((-hAn * this.AsleeveHalf) / C);
    const Tg1 = Tsl + (Tw + (Td - Tw) * eDrum - Tsl) * eSleeve;
    const Tu = T[this.upper]!;
    const Tg0 = Tsl + (Tu + (Tg1 - Tu) * eDrum - Tsl) * eSleeve;
    const Tld = T[this.lid]!;
    const Tgl = Tld + (Tg0 - Tld) * Math.exp((-3 * this.AlidIn) / C);
    const Tl = T[this.linerIn]!;
    const hr = this.film(mg, D, A, Tgl, Tl, 0.1);
    const Gr = 1 / (1 / (hr * this.AriserWall) + 1 / (this.kLiner * this.shapeLiner));
    const Trf = Tl + (Tgl - Tl) * Math.exp(-Gr / C);
    const Tb = T[this.brick]!;
    const Atun = MODEL.tunnelArea;
    const Tz = Tb + (Trf - Tb) * Math.exp((-6 * Atun) / C);

    // the fire pushes back up the feed: its column is hot, fed by what comes down the path and what the feed exchanges with the room
    const flow = a + this.exAir;
    const Qr = Math.min(this.Qav, flow * this.qpa);
    const share = 1 - MODEL.reversedToBrick - MODEL.reversedToRiser;
    const Tplume = Math.min(Tz + (share * Qr) / (Math.max(flow, 1e-4) * cpAir), 900);
    const rhoFeed = rhoOf((Tz + Tplume) / 2);
    const rhoR = rhoOf((Tgl + Trf) / 2);
    const rhoU = rhoOf((Tg1 + Tg0) / 2);
    const rhoL = rhoOf((Td + Tg1) / 2);
    const rhoD = rhoOf((Td0 + Td) / 2);
    const rhoF1 = rhoOf((Tc1 + Td0) / 2);
    const rhoF2 = rhoOf((Tout + Tc1) / 2);
    const dz = this.dz;
    const ref = this.ref;
    const dFeed = g * (ref[0]! - rhoFeed * dz[0]!);
    const dRiser = g * (ref[1]! - rhoR * dz[1]!);
    const dUpper = g * (ref[2]! - rhoU * dz[2]!);
    const dLower = g * (ref[3]! - rhoL * dz[3]!);
    const dDuct = g * (ref[4]! - rhoD * dz[4]!);
    const dF1 = g * (ref[5]! - rhoF1 * dz[5]!);
    const dF2 = g * (ref[6]! - rhoF2 * dz[6]!);
    const drive = dFeed + dRiser + dUpper + dLower + dDuct + dF1 + dF2 - this.fanPa;

    const G2 = (mg * mg) / 2;
    const A2 = A * A;
    const lFeed = this.feedLoss(mg, rhoOf(Tplume));
    const lTunnel = (G2 * MODEL.kTunnel) / (rhoOf(Tz) * this.Afeed * this.Afeed);
    const lRiser = (G2 * MODEL.kRiserFoot) / (rhoR * A2);
    const rGap = A / this.Agap;
    const lGap = (G2 * (MODEL.kGapTurn + rGap * rGap)) / (rhoOf(Tgl) * A2);
    const lAnn = (G2 * MODEL.kAnnulus) / (rhoU * this.Aann * this.Aann);
    const lMan = (G2 * MODEL.kManifold) / (rhoL * A2);
    const lDuct = (G2 * lossDuct) / A2 + (G2 * MODEL.kBend * MACHINE.ductBends) / (rhoD * A2);
    const lTee = (G2 * MODEL.kTee) / (rhoF1 * A2);
    const lFlue = (G2 * ((fF * (this.LflueIn + this.LflueOut)) / D)) / (rhoF1 * A2);
    const lCap = (G2 * (MODEL.kCap + this.kDamper)) / (rhoF2 * A2);
    const loss = lFeed + lTunnel + lRiser + lGap + lAnn + lMan + lDuct + lTee + lFlue + lCap;

    if (record) {
      this.qRel = Qr;
      this.spill = 1;
      this.chamberT = Tz;
      this.riserTopT = Tgl;
      this.afterDrumT = Td;
      this.exhaustT = Tout;
      this.draft = drive;
      this.draftFeed = dFeed;
      this.draftRiser = dRiser;
      this.draftDrum = dUpper + dLower;
      this.draftChimney = dF1 + dF2;
      this.residualLeft = drive + loss;
      this.rhoNeck = airKc / (Tplume + 273.15);
      const t = this.pathT;
      t[0] = Tplume;
      t[1] = Tz;
      t[2] = Trf;
      t[3] = Tgl;
      t[4] = Tg0;
      t[5] = Tg1;
      t[6] = Td;
      t[7] = Td;
      t[8] = Td0;
      t[9] = Td0;
      t[10] = Tc1;
      t[11] = Tout;
      const pp = this.pathP;
      pp[0] = 0;
      pp[1] = pp[0]! + dFeed + lFeed;
      pp[2] = pp[1]! + lTunnel;
      pp[3] = pp[2]! + dRiser + lRiser;
      pp[4] = pp[3]! + lGap;
      pp[5] = pp[4]! + dUpper + lAnn / 2;
      pp[6] = pp[5]! + dLower + lAnn / 2;
      pp[7] = pp[6]! + lMan;
      pp[8] = pp[7]! + dDuct + lDuct;
      pp[9] = pp[8]! + lTee;
      pp[10] = pp[9]! + dF1 + lFlue * (this.LflueIn / (this.LflueIn + this.LflueOut));
      pp[11] = pp[10]! + dF2 + lFlue * (this.LflueOut / (this.LflueIn + this.LflueOut));
      this.lidPressure = pp[4]!;
    }
    return drive + loss;
  }

  // ------------------------------------------------------------------ one step

  private updateFilms(dt: number): void {
    const net = this.net;
    const T = net.T;
    const Tair = T[this.air]!;
    const Ts = T[this.surf]!;
    const m = MODEL;
    const set = (conv: number, rad: number, Tnode: number, area: number, C: number, e: number) => {
      setLinkConductance(net, conv, Math.max(naturalFilm(Tnode - Tair, C), 0.5) * area);
      setLinkConductance(net, rad, radiationConductance(e, area, Tnode, Ts));
    };
    set(this.lnkLidConv, this.lnkLidRad, T[this.lid]!, this.AlidOut, FILM_FACING_UP, m.drumEmissivity);
    set(this.lnkUpperConv, this.lnkUpperRad, T[this.upper]!, this.AwallHalf, FILM_VERTICAL, m.drumEmissivity);
    set(this.lnkLowerConv, this.lnkLowerRad, T[this.lower]!, this.AwallHalf, FILM_VERTICAL, m.drumEmissivity);
    const eff = 1 / (1 / m.sleeveEmissivity + (this.AsleeveHalf / this.AwallHalf) * (1 / m.drumEmissivity - 1));
    setLinkConductance(
      net,
      this.lnkSleeveUpper,
      radiationConductance(eff, this.AsleeveHalf, T[this.sleeve]!, T[this.upper]!),
    );
    setLinkConductance(
      net,
      this.lnkSleeveLower,
      radiationConductance(eff, this.AsleeveHalf, T[this.sleeve]!, T[this.lower]!),
    );

    // the wall temperature each slice of the duct sees, weighted by what each cell can take
    for (let s = 0; s < BENCH_SEGMENTS; s++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += this.ductCond[4 * s + k]! * T[this.ductCell[4 * s + k]!]!;
      this.segWall[s] = sum / this.segCondSum[s]!;
    }

    this.filmsAge += dt;
    if (this.filmsAge < 300) return;
    this.filmsAge = 0;
    // the bench's surfaces and the core's: slow, so read every few minutes. One film and its half-cell in series, split between the air and the room's surfaces
    const eps = m.earthEmissivity;
    for (let i = 0; i < this.surfCount; i++) {
      const cell = this.surfCell[i]!;
      const Tc = T[cell]!;
      const area = this.surfArea[i]!;
      const Tsurf = Tc - 0.25 * (Tc - Tair);
      const hc = Math.max(naturalFilm(Tsurf - Tair, this.surfUp[i] ? FILM_FACING_UP : FILM_VERTICAL), 0.5);
      const hr = radiationConductance(eps, 1, Tsurf, Ts);
      const G = 1 / (1 / this.surfCond[i]! + 1 / ((hc + hr) * area));
      setLinkConductance(net, this.surfConv[i]!, (G * hc) / (hc + hr));
      setLinkConductance(net, this.surfRad[i]!, (G * hr) / (hc + hr));
    }
    const Tcasing = T[this.casing]!;
    const hcC = Math.max(naturalFilm(Tcasing - Tair), 0.5);
    const hrC = radiationConductance(eps, 1, Tcasing, Ts);
    const Gc = 1 / (m.casingHalf / (0.6 * m.casingArea) + 1 / ((hcC + hrC) * m.casingArea));
    setLinkConductance(net, this.lnkCasingAir, (Gc * hcC) / (hcC + hrC));
    setLinkConductance(net, this.lnkCasingSurf, (Gc * hrC) / (hcC + hrC));
  }

  private prepareColumns(): void {
    const p = this.p;
    const rhoRoom = this.rhoAirK / (this.Tair + 273.15);
    const rhoOut = this.rhoAirK / (this.Tout + 273.15);
    const zn = p.neutralZ;
    const refOf = (z0: number, z1: number): number => {
      const lo = Math.min(z0, z1);
      const hi = Math.max(z0, z1);
      const below = Math.max(0, Math.min(hi, zn) - lo);
      const above = Math.max(0, hi - Math.max(lo, zn));
      const integral = rhoRoom * below + rhoOut * above;
      return z1 >= z0 ? integral : -integral;
    };
    const z = this.z;
    // the path's sections: feed, riser, upper fall, lower fall, duct, flue in, flue out
    this.ref[0] = refOf(z[0]!, z[1]!);
    this.ref[1] = refOf(z[1]!, z[2]!);
    this.ref[2] = refOf(z[2]!, z[3]!);
    this.ref[3] = refOf(z[3]!, z[4]!);
    this.ref[4] = refOf(z[4]!, z[5]!);
    this.ref[5] = refOf(z[5]!, z[6]!);
    this.ref[6] = refOf(z[6]!, z[7]!);
  }

  /** The solved flow, for real: what each solid receives, into `net.Q`. */
  private applyHeat(dt: number): void {
    const net = this.net;
    const Q = net.Q;
    const T = net.T;
    Q.fill(0);
    const m = this.m;
    const c = this.counters;
    this.evaluate(m, true);
    const t = this.pathT;
    const air = this.air;
    const Tair = this.Tair;
    const Tout = this.Tout;
    let exit = 0;
    if (m >= 0) {
      const mg = Math.max(m + this.mFuel, 1e-6);
      const C = mg * this.cp;
      const Qr = this.qRel;
      const spillHeat = Qr * this.spill;
      Q[air]! += spillHeat;
      c.spill += spillHeat * dt;
      const toBrick = C * (t[1]! - t[2]!);
      const toLiner = C * (t[2]! - t[3]!);
      Q[this.brick]! += toBrick;
      Q[this.linerIn]! += toLiner;
      c.toCore += (toBrick + toLiner) * dt;
      const toLid = C * (t[3]! - t[4]!);
      Q[this.lid]! += toLid;
      // the fall, as the evaluation walked it
      const D = this.D;
      const hAn = this.film(mg, this.Dann, this.Aann, t[4]!, T[this.upper]!, MODEL.naturalInDrum);
      const eD = Math.exp((-hAn * this.AwallHalf) / C);
      const eS = Math.exp((-hAn * this.AsleeveHalf) / C);
      const g0 = t[4]!;
      const Tu = T[this.upper]!;
      const Tsl = T[this.sleeve]!;
      const Tw = T[this.lower]!;
      const g1a = Tu + (g0 - Tu) * eD;
      const g1 = Tsl + (g1a - Tsl) * eS;
      const g2a = Tw + (g1 - Tw) * eD;
      const g2 = Tsl + (g2a - Tsl) * eS;
      Q[this.upper]! += C * (g0 - g1a);
      Q[this.sleeve]! += C * (g1a - g1) + C * (g2a - g2);
      Q[this.lower]! += C * (g1 - g2a);
      c.toDrum += (toLid + C * (g0 - g2)) * dt;

      // the duct: the same march, but each cell receives its own
      let Td = g2;
      const A = this.A;
      const segA = Math.PI * D * this.segLen;
      for (let s = 0; s < BENCH_SEGMENTS; s++) {
        const h = this.film(mg, D, A, Td, this.segWall[s]!, MODEL.naturalInDuct) * this.p.ductFilm;
        const inlet = Td;
        for (let k = 0; k < 4; k++) {
          const i = 4 * s + k;
          const cell = this.ductCell[i]!;
          const G = 1 / (1 / ((h * segA) / 4) + 1 / this.ductCond[i]!);
          const next = T[cell]! + (Td - T[cell]!) * Math.exp(-G / C);
          Q[cell]! += C * (Td - next);
          Td = next;
        }
        this.ductGasT[s] = (inlet + Td) / 2;
        c.toSegments[s]! += C * (inlet - Td) * dt;
      }
      c.toBench += C * (g2 - Td) * dt;
      const Tfi = T[this.flueIn]!;
      const hF1 = this.film(mg, D, A, Td, Tfi, 0.1);
      const Tc1 = Tfi + (Td - Tfi) * Math.exp((-hF1 * this.AflueIn) / C);
      Q[this.flueIn]! += C * (Td - Tc1);
      c.toFlueIndoors += C * (Td - Tc1) * dt;
      const Tfo = T[this.flueOut]!;
      const hF2 = this.film(mg, D, A, Tc1, Tfo, 0.1);
      const Tc2 = Tfo + (Tc1 - Tfo) * Math.exp((-hF2 * this.AflueOut) / C);
      Q[this.flueOut]! += C * (Tc1 - Tc2);
      c.toFlueOutdoors += C * (Tc1 - Tc2) * dt;
      this.exhaustT = Tc2;
      t[8] = Td;
      t[9] = Td;
      t[10] = Tc1;
      t[11] = Tc2;
      exit = C * (Tc2 - Tair);
      if (this.hasFire) c.exitFire += exit * dt;
      else c.exitIdle += exit * dt;
    } else {
      const a = -m;
      const C = Math.max(a, 1e-6) * 1010;
      const D = this.D;
      const A = this.A;
      // down the flue
      const Tfo = T[this.flueOut]!;
      const hF2 = this.film(a, D, A, Tout, Tfo, 0.1);
      const Tc1 = Tfo + (Tout - Tfo) * Math.exp((-hF2 * this.AflueOut) / C);
      Q[this.flueOut]! += C * (Tout - Tc1);
      const Tfi = T[this.flueIn]!;
      const hF1 = this.film(a, D, A, Tc1, Tfi, 0.1);
      const Td0 = Tfi + (Tc1 - Tfi) * Math.exp((-hF1 * this.AflueIn) / C);
      Q[this.flueIn]! += C * (Tc1 - Td0);
      let Td = Td0;
      const segA = Math.PI * D * this.segLen;
      for (let s = BENCH_SEGMENTS - 1; s >= 0; s--) {
        const h = this.film(a, D, A, Td, this.segWall[s]!, MODEL.naturalInDuct) * this.p.ductFilm;
        const inlet = Td;
        for (let k = 0; k < 4; k++) {
          const i = 4 * s + k;
          const cell = this.ductCell[i]!;
          const G = 1 / (1 / ((h * segA) / 4) + 1 / this.ductCond[i]!);
          const next = T[cell]! + (Td - T[cell]!) * Math.exp(-G / C);
          Q[cell]! += C * (Td - next);
          Td = next;
        }
        this.ductGasT[s] = (inlet + Td) / 2;
      }
      const Tw = T[this.lower]!;
      const Tsl = T[this.sleeve]!;
      const hAn = this.film(a, this.Dann, this.Aann, Td, Tw, MODEL.naturalInDrum);
      const eD = Math.exp((-hAn * this.AwallHalf) / C);
      const eS = Math.exp((-hAn * this.AsleeveHalf) / C);
      const a1 = Tw + (Td - Tw) * eD;
      Q[this.lower]! += C * (Td - a1);
      const g1 = Tsl + (a1 - Tsl) * eS;
      Q[this.sleeve]! += C * (a1 - g1);
      const Tu = T[this.upper]!;
      const a2 = Tu + (g1 - Tu) * eD;
      Q[this.upper]! += C * (g1 - a2);
      const g0 = Tsl + (a2 - Tsl) * eS;
      Q[this.sleeve]! += C * (a2 - g0);
      const Tld = T[this.lid]!;
      const gl = Tld + (g0 - Tld) * Math.exp((-3 * this.AlidIn) / C);
      Q[this.lid]! += C * (g0 - gl);
      const Tl = T[this.linerIn]!;
      const hr = this.film(a, D, A, gl, Tl, 0.1);
      const Gr = 1 / (1 / (hr * this.AriserWall) + 1 / (this.kLiner * this.shapeLiner));
      const rf = Tl + (gl - Tl) * Math.exp(-Gr / C);
      Q[this.linerIn]! += C * (gl - rf);
      const Tb = T[this.brick]!;
      const Tz = Tb + (rf - Tb) * Math.exp((-6 * MODEL.tunnelArea) / C);
      Q[this.brick]! += C * (rf - Tz);
      // the gas leaves into the room, the fire's heat with it, a share kept by the brick and the riser's foot
      Q[air]! += C * (Tz - Tair);
      const Qr = this.qRel;
      Q[this.brick]! += Qr * MODEL.reversedToBrick;
      Q[this.linerIn]! += Qr * MODEL.reversedToRiser;
      Q[air]! += Qr * (1 - MODEL.reversedToBrick - MODEL.reversedToRiser);
      c.toCore += Qr * (MODEL.reversedToBrick + MODEL.reversedToRiser) * dt;
      c.spill += Qr * (1 - MODEL.reversedToBrick - MODEL.reversedToRiser) * dt;
      // nothing leaves by the cap: cold air comes in by it instead, which costs the house the same as air leaving warm
      exit = C * (Tair - Tout);
      c.exitIdle += exit * dt;
      c.reversedSeconds += dt;
    }

    // the house's air: its own air change, and what the chimney's draw adds to it (leaks in quadrature, the usual rule)
    const base = this.baseAirFlow() + (this.p.fanPa * MODEL.fanFlowPerPa * 1.2) / 3600;
    const flow = m > 0 ? Math.hypot(base, m) : base;
    const cpA = 1005;
    this.ventilation = flow;
    const airHeat = flow * cpA * (Tout - Tair);
    Q[air]! += airHeat;
    c.airBase += base * cpA * (Tout - Tair) * dt;
    c.airDraw += (flow - base) * cpA * (Tout - Tair) * dt;
    Q[air]! += this.p.gains;
    c.gains += this.p.gains * dt;
    if (this.flueWarmLeft > 0) {
      Q[this.flueIn]! += MODEL.flueWarmer;
      c.gains += MODEL.flueWarmer * dt;
      this.flueWarmLeft = Math.max(0, this.flueWarmLeft - dt);
    }
    this.flueLossNow = Math.max(0, exit);
  }

  /** The energy of what crossed the surfaces during the step, read from the links after the step's first substep. */
  private tally(dt: number): void {
    const net = this.net;
    const { linkG, linkA, linkB, T } = net;
    const through = (l: number) => linkG[l]! * (T[linkA[l]!]! - T[linkB[l]!]!);
    const drum =
      through(this.lnkLidConv) +
      through(this.lnkLidRad) +
      through(this.lnkUpperConv) +
      through(this.lnkUpperRad) +
      through(this.lnkLowerConv) +
      through(this.lnkLowerRad);
    let bench = 0;
    for (let i = 0; i < this.surfCount; i++) bench += through(this.surfConv[i]!) + through(this.surfRad[i]!);
    const core = through(this.lnkCasingAir) + through(this.lnkCasingSurf);
    const flue = through(this.lnkFlueIn);
    const envelope = through(this.lnkEnvelope);
    let behind = 0;
    for (let i = 0; i < this.backLinks.length; i++) behind += through(this.backLinks[i]!);
    let ground = through(this.lnkSlabCoreGround);
    for (let s = 0; s < BENCH_SEGMENTS; s++) ground += through(this.slabGroundLinks[s]!);
    const c = this.counters;
    c.drumOut += drum * dt;
    c.benchOut += bench * dt;
    c.coreOut += core * dt;
    c.flueOut += flue * dt;
    c.envelope += envelope * dt;
    c.behindBench += behind * dt;
    c.ground += ground * dt;
    this.drumOutNow = drum;
    this.benchOutNow = bench;
    this.coreOutNow = core;
    this.envelopeNow = envelope;
  }

  private burn(dt: number): void {
    const c = this.counters;
    const qr = this.qRel;
    const vWant = this.qVol * (1 - this.u);
    const vGot = Math.min(qr, vWant);
    const cGot = qr - vGot;
    const drainVol = this.qVol;
    const drainChar = cGot / (1 - this.u);
    this.eVol = Math.max(0, this.eVol - drainVol * dt);
    this.eChar = Math.max(0, this.eChar - drainChar * dt);
    let out = 0;
    if (this.eVol < 1e3) {
      out += this.eVol;
      this.eVol = 0;
    }
    if (this.eChar < 1e3) {
      out += this.eChar;
      this.eChar = 0;
    }
    c.released += qr * dt;
    c.unburned += (drainVol + drainChar - qr) * dt + out;
  }

  private updateCo(dt: number): void {
    const p = this.p;
    const m = this.m;
    const lam = Math.max(this.lambda, 0.2);
    const T = this.chamberT;
    const Hu = heatingValue(p.moisture);
    const flame = this.mFuel > 1e-7 ? (this.qVol / Hu) * flameCoFactor(T, lam, p.moisture) : 0;
    const charKg = this.qChar / MODEL.charEnergy;
    const char = charKg * charCoFactor(T);
    const source = (flame + char) * 1000; // mg/s
    this.coSource = source;

    // the regime first: a word, then a band
    let regime: CoRegime = 'none';
    if (this.hasFire) {
      if (m < 0 || this.spill > 0.5) regime = 'smokeBack';
      else if (this.phase === 'embers') regime = 'embers';
      else if (lam < 1.4) regime = 'starved';
      else if (T < COLD_T) regime = 'coldChamber';
      else if (p.moisture >= 25) regime = 'wet';
      else if (T < CLEAN_T) regime = 'lean';
      else regime = 'clean';
    }
    this.regime = regime;

    // the leak at the lid: a hole with the pressure across it, when the pressure inside is above the room's
    const gaugeLid = this.lidPressure;
    let leak = 0;
    const mg = Math.abs(m) + this.mFuel;
    if (p.leakCm2 > 0 && gaugeLid > 0 && mg > 1e-5) {
      const rho = this.rhoGasK / (this.pathT[4]! + 273.15);
      const q = 0.6 * p.leakCm2 * 1e-4 * Math.sqrt((2 * gaugeLid) / rho);
      leak = Math.min(1, (q * rho) / mg);
    }
    this.leakShare = leak;
    const reversed = m < 0;
    const share = reversed ? 1 : Math.min(1, this.spill + leak);
    this.coIntoRoom = source > 0 ? share : 0;
    const flow = Math.max(mg, 1e-5);
    // what an analyser would read, ppm: mg of CO over m³ of gas at 20 °C
    const vol = flow / 1.165; // m³/s at 20 °C, about the same for any lean flue gas
    this.flueCo = source > 0 ? source / vol / MG_PER_PPM_20C : 0;
    this.coFlueMgS = source * (1 - share);

    // the room: one well-mixed volume with its air change
    const Vdot = this.ventilation / 1.2;
    const V = houseVolume();
    const Sppm = (source * share) / MG_PER_PPM_20C; // ppm·m³/s
    const steady = Sppm / Vdot;
    this.roomCo = steady + (this.roomCo - steady) * Math.exp((-Vdot * dt) / V);
    const mgRoom = this.roomCo * MG_PER_PPM_20C;
    this.whoExceeded = false;
    for (let i = 0; i < WHO_LIMITS.length; i++) {
      const w = WHO_LIMITS[i]!;
      this.whoMeans[i]! += (mgRoom - this.whoMeans[i]!) * (1 - Math.exp(-dt / w.seconds));
      if (this.whoMeans[i]! > w.mg) this.whoExceeded = true;
    }
    if (this.roomCo >= 30) this.coDose += dt / alarmLimit(this.roomCo);
    else this.coDose = Math.max(0, this.coDose - dt / 3600);
    if (this.coDose >= 1) this.coAlarm = 1;
    else if (this.coDose <= 0) this.coAlarm = 0;
    if (this.roomCo > this.counters.peakRoomCo) this.counters.peakRoomCo = this.roomCo;
  }

  private updateDew(dt: number): void {
    const p = this.p;
    const c = this.counters;
    const burning = this.m > 0 && this.mFuel > 1e-6 && this.lambda > 0;
    this.dewT = burning ? dewPoint(Math.max(this.lambda, 1), p.moisture) : 0;
    const wall = this.net.T[this.flueOut]!;
    this.condensing = burning && (wall < this.dewT || this.exhaustT < this.dewT);
    this.condensate = 0;
    if (burning && this.exhaustT < this.dewT) {
      const x = this.gas.xWater;
      const xs = saturationPressure(this.exhaustT) / P_ATM;
      const water = this.mFuel * ((MODEL_WATER + p.moisture / (100 - p.moisture)) * (1 - p.moisture / 100));
      this.condensate = water * Math.max(0, 1 - xs / x);
      c.condensate += this.condensate * dt;
      c.belowDewSeconds += dt;
    }
  }

  private updateMeans(dt: number): void {
    const c = this.counters;
    if (this.phase === 'roaring' && this.m > 0) {
      c.fullSeconds += dt;
      c.sumLambda += this.lambda * dt;
      c.sumChamber += this.chamberT * dt;
      c.sumExhaust += this.exhaustT * dt;
      c.sumDraft += this.draft * dt;
      c.sumFlow += this.m * dt;
    }
    c.peakExhaust = Math.max(c.peakExhaust, this.exhaustT);
    c.peakDrum = Math.max(c.peakDrum, this.net.T[this.lid]!);
    c.peakChamber = Math.max(c.peakChamber, this.chamberT);
    c.peakDraft = Math.max(c.peakDraft, this.draft);
  }

  /** One step of the whole machine, s. */
  step(dt: number): void {
    const net = this.net;
    const hour = (this.time / 3600) % 24;
    this.Tair = net.T[this.air]!;
    this.Tout = dailyOutside(this.p, hour);
    net.T[this.outside] = this.Tout;
    this.kLiner = this.insulation.k(net.T[this.linerIn]!);
    this.updateFilms(dt);
    this.updateFeed(dt);
    this.updateRates(dt);
    this.prepareColumns();
    this.m = solveLoopFlow(this.residual, this.m, FLOW_MAX, Math.max(2e-5, 0.004 * Math.abs(this.m)), 0.003);
    this.applyHeat(dt);
    this.burn(dt);
    this.updateCo(dt);
    this.updateDew(dt);
    this.updateMeans(dt);
    stepNetwork(net, dt);
    this.tally(dt);
    this.time += dt;
  }

  /** How long a step of the live clock may be, s: a fire moves fast, a resting house slowly. */
  stepLimit(fine: 'live' | 'day' | 'settling'): number {
    const burning = this.phase !== 'cold' || this.sessionNow((this.time / 3600) % 24) >= 0 || this.manualLeft > 0;
    if (fine === 'live') return burning ? 20 : 90;
    if (fine === 'day') return burning ? 60 : 240;
    return burning ? 120 : 480;
  }

  // ------------------------------------------------------------------ what the state reads

  /** Surface temperature on top of the seat, at the middle of a slice, or on its front. */
  surfaceT(seg: number, front: boolean): number {
    const T = this.net.T;
    const cols = BENCH_COLS;
    const cell =
      this.cells[(front ? cols - 1 + cols * DUCT_ROW : DUCT_COL + cols * (BENCH_ROWS - 1)) + cols * BENCH_ROWS * seg]!;
    const Tc = T[cell]!;
    const Tr = T[this.air]!;
    const Ts = T[this.surf]!;
    const rows = this.segRows[seg]!;
    const half = front
      ? (this.cols[cols]! - this.cols[cols - 1]!) / 2
      : (rows[BENCH_ROWS]! - rows[BENCH_ROWS - 1]!) / 2;
    const hc = Math.max(naturalFilm(Tc - Tr, front ? FILM_VERTICAL : FILM_FACING_UP), 0.5);
    const hr = radiationConductance(MODEL.earthEmissivity, 1, Tc, Ts);
    const Gcond = this.p.benchK / half;
    const To = (hc * Tr + hr * Ts) / (hc + hr);
    return (Gcond * Tc + (hc + hr) * To) / (Gcond + hc + hr);
  }

  /** Edges of the cells of a slice, m: columns back to front, rows floor to seat. */
  columnEdges(): readonly number[] {
    return this.cols;
  }
  rowEdges(seg: number): readonly number[] {
    return this.segRows[seg]!;
  }
  get segmentLength(): number {
    return this.segLen;
  }
  get hotRunSegments(): number {
    return this.hotSegments;
  }

  /** The mass of the bench's cells, kg. */
  benchMassNow(): number {
    let m = 0;
    for (let c = 0; c < this.cells.length; c++) if (this.cells[c]! >= 0) m += this.net.mass[this.cells[c]!]!;
    return m;
  }

  /** The mean of all the cells of the bench, °C. */
  benchMeanT(): number {
    const { T, mass } = this.net;
    let s = 0;
    let m = 0;
    for (let c = 0; c < this.cells.length; c++) {
      const n = this.cells[c]!;
      if (n >= 0) {
        s += T[n]! * mass[n]!;
        m += mass[n]!;
      }
    }
    return s / m;
  }

  // ------------------------------------------------------------------ a moment kept and brought back

  private static readonly EXTRAS = 26;

  snapshotSize(): number {
    return 2 * this.net.n + Plant.EXTRAS + STATIONS.length * 2 + BENCH_SEGMENTS;
  }

  snapshot(out: Float64Array, at = 0): void {
    const { T, H, n } = this.net;
    let i = at;
    for (let k = 0; k < n; k++) out[i++] = T[k]!;
    for (let k = 0; k < n; k++) out[i++] = H[k]!;
    const x = [
      this.time,
      this.m,
      this.eVol,
      this.eChar,
      this.ignition,
      this.lastSession,
      this.batchClock,
      this.fireCount,
      this.roomCo,
      this.coDose,
      this.coAlarm,
      this.whoMeans[0]!,
      this.whoMeans[1]!,
      this.whoMeans[2]!,
      this.whoMeans[3]!,
      this.chamberT,
      this.exhaustT,
      this.riserTopT,
      this.afterDrumT,
      this.rhoNeck,
      this.manualLeft,
      this.extraLoad,
      this.draft,
      this.lambda,
      this.ventilation,
      this.feedRate,
    ];
    for (let k = 0; k < Plant.EXTRAS; k++) out[i++] = x[k]!;
    for (let k = 0; k < STATIONS.length; k++) out[i++] = this.pathT[k]!;
    for (let k = 0; k < STATIONS.length; k++) out[i++] = this.pathP[k]!;
    for (let k = 0; k < BENCH_SEGMENTS; k++) out[i++] = this.ductGasT[k]!;
  }

  restore(src: Float64Array, at = 0): void {
    const net = this.net;
    let i = at;
    for (let k = 0; k < net.n; k++) net.T[k] = src[i++]!;
    for (let k = 0; k < net.n; k++) net.H[k] = src[i++]!;
    this.time = src[i++]!;
    this.m = src[i++]!;
    this.eVol = src[i++]!;
    this.eChar = src[i++]!;
    this.ignition = src[i++]!;
    this.lastSession = src[i++]!;
    this.batchClock = src[i++]!;
    this.fireCount = src[i++]!;
    this.roomCo = src[i++]!;
    this.coDose = src[i++]!;
    this.coAlarm = src[i++]!;
    for (let k = 0; k < 4; k++) this.whoMeans[k] = src[i++]!;
    this.chamberT = src[i++]!;
    this.exhaustT = src[i++]!;
    this.riserTopT = src[i++]!;
    this.afterDrumT = src[i++]!;
    this.rhoNeck = src[i++]!;
    this.manualLeft = src[i++]!;
    this.extraLoad = src[i++]!;
    this.draft = src[i++]!;
    this.lambda = src[i++]!;
    this.ventilation = src[i++]!;
    this.feedRate = src[i++]!;
    for (let k = 0; k < STATIONS.length; k++) this.pathT[k] = src[i++]!;
    for (let k = 0; k < STATIONS.length; k++) this.pathP[k] = src[i++]!;
    for (let k = 0; k < BENCH_SEGMENTS; k++) this.ductGasT[k] = src[i++]!;
    this.filmsAge = 1e9;
    this.lidPressure = this.pathP[4]!;
    this.settle();
  }

  /** Solve the flow at this instant and fill what is read from it, without moving time or spending anything. */
  stepIn(): void {
    const c = this.counters;
    this.counters = newCounters();
    const net = this.net;
    this.Tair = net.T[this.air]!;
    this.updateFilms(0);
    const keepTime = this.time;
    const keep = [
      this.eVol,
      this.eChar,
      this.ignition,
      this.batchClock,
      this.lastSession,
      this.manualLeft,
      this.extraLoad,
      this.fireCount,
    ];
    this.updateFeed(0);
    this.updateRates(1);
    this.prepareColumns();
    this.m = solveLoopFlow(this.residual, this.m, FLOW_MAX, Math.max(2e-5, 0.004 * Math.abs(this.m)), 0.003);
    this.applyHeat(0);
    this.updateCo(0);
    this.updateDew(0);
    updateConductances(net);
    this.tally(0);
    [
      this.eVol,
      this.eChar,
      this.ignition,
      this.batchClock,
      this.lastSession,
      this.manualLeft,
      this.extraLoad,
      this.fireCount,
    ] = keep as [number, number, number, number, number, number, number, number];
    this.time = keepTime;
    this.counters = c;
    net.Q.fill(0);
  }

  /** Bring the derived values to the present, without moving time: what a frame of the day needs to read. */
  settle(): void {
    const net = this.net;
    this.Tair = net.T[this.air]!;
    this.Tout = dailyOutside(this.p, (this.time / 3600) % 24);
    net.T[this.outside] = this.Tout;
    const woodIn = this.eVol > MODEL.poolOut;
    const charOn = this.eChar > MODEL.poolOut;
    const hour = (this.time / 3600) % 24;
    const on = this.sessionNow(hour) >= 0 || this.manualLeft > 0;
    this.phase = on
      ? this.ignition < 1
        ? 'lighting'
        : 'roaring'
      : woodIn
        ? 'burningDown'
        : charOn
          ? 'embers'
          : 'cold';
    this.hasFire = this.phase !== 'cold';
  }
}

/** Water formed by burning a kg of dry wood, kg. */
const MODEL_WATER = 0.54;
