// The figures that the texts of src/data write by {placeholder}, so that the French and the English spellings of a number (7,5 / 7.5) can never drift apart, and so that one test (data.test.ts) can check every model
// result against the simulation.
//
// A figure a SOURCE reports (2.0 kg/h, 4.16 kWh/kg, 0.6 W/m·K…) is written in the text itself and checked against the allow-list of data.test.ts, with its source. A figure that is DERIVED, a MODEL RESULT, an
// ASSUMPTION or an ESTIMATE lives here, and a text that uses one says so in the same text (`lf` in part-helpers.ts refuses it otherwise).
//
//   MODEL     an output of src/sim for the default machine, rounded as the texts print it; data.test.ts recomputes it from the simulation or holds it to docs/physics.md. Never tuned to a reported figure.
//   DERIVED   computed from reported figures, with the computation next to it.
//   ASSUMED   a choice the lab makes where the sources are silent and the model needs a value.
//   ESTIMATE  a size or an order of magnitude no source gives. Lengths are read from src/three/dims.ts: never retyped.
import { COB, MODEL as CONSTANTS, PEBBLE, STONE } from '../sim/machine';
import { presetParams } from '../sim/presets';
import { MACHINE } from '../three/dims';

const J = presetParams('j-tube');
const SEASON_DAYS = 150; // days of a heating season (docs/research.md §3, the woodshed)
const STERE_KG = 450; // kg per stère, usual (docs/research.md §3)

/** What the model finds, with the table of docs/physics.md it comes from. data.test.ts holds each one to src/sim. */
export const MODEL = {
  // §1, §5.1: the efficiency of a settled day
  eta: 78, // % delivered to the house
  etaNet: 76, // % if the extra cold air the chimney's draw brings in is charged to it
  etaFlue: 82, // % by a flue calculation, the same day
  etaLow: 65, // %, the feed hidden at 75 %
  etaHigh: 88, // %, the feed hidden at 90 %
  etaOpen: 52, // %, the feed wide open
  etaTop: 93, // %, the feed hidden at 95 %
  // the split of a day's wood, as the gas gives it up
  shareDrum: 38,
  shareBench: 24,
  shareCore: 18,
  shareFlueIn: 3,
  shareLost: 17,
  shareUnburned: 1,
  drumRangeLow: 21,
  drumRangeHigh: 45,
  benchRangeLow: 10,
  benchRangeHigh: 27,
  lostRangeLow: 1,
  lostRangeHigh: 42,
  // what reaches the room over a day, kWh, and when
  kwhDrum: 22,
  kwhBench: 10,
  kwhCore: 7,
  meanKw: 1.7, // kW, mean over the 24 h
  drumBurst: 4, // kW, « nearly »: 3.8 at its peak
  benchKwLow: 0.3,
  benchKwHigh: 0.5,
  coreKwLow: 0.2,
  coreKwHigh: 0.3,
  // the seat and the room
  seatLow: 24.9, // °C, hot end
  seatHigh: 32.0,
  seatColdLow: 22.1,
  seatColdHigh: 29.1,
  lagStop: 1.7, // h after the feed stops, hot end
  lagStopCold: 1.2, // h, thin end
  lagBegin: 4.3, // h after the fire began
  earthDuct: 64, // °C, the earth above the duct at the hot end, at its hottest (20:45)
  earthBeside: 74, // °C, the cell on the wall's side of the duct, the hottest of the earth, at the same moment
  seatAfter7: 27.8, // °C, 7 h after the evening fire
  seatColdAfter7: 24.5,
  roomAfter7: 18.6,
  roomLow: 17.3,
  roomHigh: 24.0,
  roomMean: 20.2,
  roomSwing: 6.7, // K
  noGainsRoom: 18, // °C, the same wood without the gains
  stoneLow: 19.1, // °C, the stone wall
  stoneHigh: 20.4,
  benchSwingKwh: 5, // kWh a burn
  behindKwh: 0.9, // kWh a day through the wall behind the bench
  groundKwh: 1.6, // kWh a day into the ground
  // the fire and the path at full burn
  fireKw: 10.3, // kW at 2.5 kg/h
  chamber: 467, // °C, a mixed mean at the riser's foot
  chamberRocket: 564, // °C at 3.4 kg/h
  chamberFast: 704, // °C at 5 kg/h
  lambda: 5.0,
  flowGs: 15, // g/s of air and gas
  airM3h: 46, // m³/h, the same at 1.2 kg/m³
  exhaust: 80, // °C
  riserTop: 459, // °C, at 09:00
  afterDrum: 249, // °C, at 09:00
  lidPeak: 180, // °C
  sidePeak: 153, // °C
  sleevePeak: 203, // °C
  linerPeak: 296, // °C
  brickPeak: 209, // °C
  casingPeak: 84, // °C
  flameLen: 0.6, // m
  flameTwoAir: 1180, // °C, the adiabatic sum at λ 2 on the model's gas
  ductPa: 14, // Pa under the room's air, along the duct at full fire, printed with its minus sign
  dewDefault: 29, // °C
  // the draught
  draft: 15, // Pa
  riserPa: 6.0, // at 09:00, as the three after it
  fallPa: 4.7, // printed with its minus sign
  netPa: 1.3,
  chimneyPa: 14.9,
  coldFluePa: 1.1, // printed with its minus sign
  feedPaShare: 85, // % of the draught spent across the feed
  lidPa: 8.9, // printed with its minus sign, at full burn
  lidPaLow: 0.7, // the same on a chimney of 2.7 m
  // the sensitivity table, §6
  coverLowLambda: 7.6,
  coverHighLambda: 3.1,
  chimney8Eta: 70,
  uninsulatedRoom: 15.1,
  riserShortEta: 75,
  riserShortDrum: 33,
  riserLongEta: 82,
  riserLongDrum: 45,
  noLidEta: 75,
  filmLowEta: 69, // duct film × 0.5
  filmHighEta: 85, // duct film × 2
  filmLowExhaust: 111,
  filmHighExhaust: 51,
  kLowSeat: 27.4,
  kLowEta: 72,
  kHighSeat: 35.6,
  kHighEta: 81,
  pebbleSeat: 36.2,
  pebbleEta: 82,
  hotRunShare: 42, // % of what the duct gives up, in its first 3 m of 9 m
  filmTotal: 9.3, // W/m²·K at 15 K over the room
  // wood
  wood20: 12.3, // kg for a mean of 20 °C
  woodSnap: 23.7, // kg at −10 °C
  woodLeaky: 36, // kg at H 300
  woodLeakySnap: 63, // kg at H 300 and −10 °C
  saved35: 55, // %
  saved50: 36,
  saved72: 7,
  oldFor80: 16, // %
  oldFor90: 8,
  savedBoth: 85, // %, the old stove at 35 % in a house that loses three times as much
  woodOld35: 28, // kg a day, the same heat from the old stove at 35 %
  woodOldLeaky: 86, // kg a day, the same stove in the leaky house
  // CO, a map: the regimes and a band of a factor of three each way
  coLean: 230, // ppm, at 09:00
  coLeanLow: 80,
  coLeanHigh: 700,
  coHot: 170,
  coWet: 850,
  coEnd: 2000,
  coPerMj: 1470, // mg/MJ over a day
  coPerKg: 22, // g/kg
  // the scenarios, §4
  coldFlow: 1.6, // g/s of cold air pouring in
  turnMin: 3, // minutes
  coldRoomCo: 37, // ppm
  mildRoomLow: 17,
  mildRoomHigh: 23,
  mildWood: 6.3,
  snapRoomLow: 4.8,
  snapRoomHigh: 11.3,
  snapEta: 75,
  wetChamber: 393,
  wetRoom: 16.9,
  wetEta: 75,
  shortExhaust: 122,
  shortEta: 66,
  longExhaust: 34,
  longDraft: 7.9,
  longEta: 89,
  longWater: 0.4, // kg a day
  longHours: 3, // h a day under the dew point
  lowDraft: 7.3,
  lowLambda: 3.5,
  lowEta: 87,
  leakyRoomLow: 6.1,
  leakyRoomHigh: 13.8,
  fanCoPeak: 63, // ppm
  fanPeakMin: 38,
  fanWhoMin: 53,
  damperWhoMin: 38,
  damperAlarmMin: 52,
  damperPeak: 123, // ppm
  damperPeakMin: 65,
  damperLatePeak: 43,
} as const;

/** Computed from reported figures, the computation beside each. data.test.ts checks the arithmetic. */
export const DERIVED = {
  woodKwh: 52, // 12.5 kg × 4.16 kWh/kg
  benchTonnes: 3.0, // (0.50 × 0.45 − π·0.1²)·9 m·1,700 kg/m³ = 2,962 kg
  benchKg: 2962,
  benchKwhK: 0.73, // m·c = 2,962 × 891 J/K
  floorKn: 6.5, // kN/m² of bench on the floor
  drumLitres: 236, // π·0.2925²·0.88
  drumArea: 1.89, // m² of drum, K38
  section: 0.031, // m², the bore
  gapArea: 0.047, // m², around a sleeve of Ø 0.30 under a gap of 0.05 m: K15's own sum
  hPerFloor: 1.4, // W/m²·K of floor: 106 / 74
  houseVolume: 185, // m³, 74 × 2.5
  seasonTonnes: 1.9, // 150 × 12.5 kg
  seasonLeakyTonnes: 5.4, // 150 × 36 kg
  seasonOldTonnes: 4.2, // 150 × 28 kg
  seasonOldLeakyTonnes: 12.9, // 150 × 86 kg
  ashKg: 26, // 57 lb at 0.4536 kg
  ashG: 200, // 7 oz at 28.35 g, 198 g rounded
  ashDayG: 96, // 12.5 kg × 0.77 %
  ashSeasonKg: 14, // 150 days × 96 g
  burnKwLow: 8.5, // 2.0 kg/h × 4.16 kWh/kg
  burnKwHigh: 15, // 3.6 kg/h × 4.16 kWh/kg
  burnKgLow: 2.0, // 4.5 lb/h
  burnKgHigh: 3.6, // 8 lb/h
  dayKgLow: 9, // 20 lb
  dayKgHigh: 18, // 40 lb
  whoPpm15: 86, // 100 mg/m³ at 1.165 mg/m³ per ppm, 20 °C
  whoPpm1h: 30,
  whoPpm8h: 8.6,
  whoPpm24h: 6,
  co13Europe: 1200, // 1,500 mg/m³ at 1.25 mg/m³ per ppm, 0 °C, at 13 % O₂
  co13Swiss: 2000, // 2,500 mg/m³
  leak1: 17, // ppm, 1 % of 15 L/s at 3,000 ppm in 200 m³ at 0.5 air change
  leak5: 84,
  leak10: 168,
  stoneWallTonnes: 6.9, // 0.30 × 4 × 2.5 m × 2,300 kg/m³
  cordDays: 64, // 128 ft³ at 2 ft³ a day
  slabMm: MACHINE.slab * 1000, // mm, 4 in in a draft text
  clearanceDrumCm: 90, // 36 in
  clearanceShieldCm: 45, // 18 in
  clearanceFeedCm: 45, // 18 in
  clearanceDuctCm: 15, // 6 in
  shieldGapMm: 25, // 1 in
  benchLimitM: 0.9, // 36 in
  backLimitM: 1.2, // 48 in
  ductLimitM: 18, // 60 ft
  ductTypicalLow: 9, // 30 ft
  ductTypicalHigh: 15, // 50 ft
  coverHotCm: 15, // 6 in
  coverColdCm: 10, // 4 in
  hotRunM: 3, // 10 ft
} as const;

/** A choice of the lab, where no source gives a value and the model needs one. */
export const ASSUMED = {
  houseH: J.houseH, // W/K
  leakyH: 300, // W/K
  houseArea: MACHINE.houseArea, // m², a book's area taken for the house
  outsideMean: J.outsideMean, // °C, a January of the Geneva basin
  coldSnap: 10, // °C, printed with its minus sign
  mildDay: 8, // °C
  fanPa: 10, // Pa, a kitchen fan in a tight house
  ductBends: MACHINE.ductBends,
  roomW: MACHINE.room.width,
  roomD: MACHINE.room.depth,
  roomH: MACHINE.room.height,
  stoneWallT: MACHINE.stoneWall.thickness,
  stoneWallW: MACHINE.stoneWall.width,
  stoneWallH: MACHINE.stoneWall.height,
  sessions: J.firesPerDay,
  sessionHours: J.sessionHours,
  feedRate: J.feedKgH,
  moisture: J.moisture,
  woodDay: 12.5,
  morningHour: J.morningHour,
  eveningHour: J.eveningHour,
} as const;

/** A size or an order of magnitude no source gives. */
export const ESTIMATE = {
  feedCover: CONSTANTS.feedCover * 100, // % of the feed's section hidden during a burn
  coverLow: 75,
  coverHigh: 90,
  gains: CONSTANTS.gains, // W
  achBase: CONSTANTS.baseAch, // air changes per hour
  baseM3h: CONSTANTS.baseAch * MACHINE.houseArea * MACHINE.room.height, // m³/h
  chimneyTop: MACHINE.chimneyTop, // m
  chimneyLow: 2.7,
  chimneyHigh: 8,
  benchDepth: MACHINE.benchDepth,
  benchHeight: MACHINE.benchHeight,
  backDepth: 0.15,
  backHeight: 0.4,
  cobRho: COB.rho,
  cobRhoLow: 1500,
  cobRhoHigh: 1800,
  stoneShare: 20, // % of stones in the mass
  stoneRho: 2500, // kg/m³, usual
  stoneK: STONE.k, // W/m·K, usual
  coreTonnes: (CONSTANTS.brickMass + CONSTANTS.casingMass) / 1000,
  machineTonnes: 3.4, // 3.0 t of bench, 0.4 t of core
  brickKg: CONSTANTS.brickMass,
  casingKg: CONSTANTS.casingMass,
  charShare: CONSTANTS.charShare * 100, // %
  charMin: CONSTANTS.charTau / 60, // minutes
  lidLeak: CONSTANTS.lidLeak * 100, // %
  pebbleK: PEBBLE.k,
  pebbleRho: PEBBLE.rho,
  pebbleC: PEBBLE.c,
  kBend: CONSTANTS.kBend,
  kTee: CONSTANTS.kTee,
  floorU: CONSTANTS.floorU, // W/m²·K
  stereKg: STERE_KG,
  stereLow: 4,
  stereHigh: 5,
  seasonDays: SEASON_DAYS,
  warmKw: CONSTANTS.flueWarmer / 1000, // kW
  warmMin: CONSTANTS.flueWarmSeconds / 60, // minutes
  sleeveWallMm: MACHINE.sleeveWall * 1000, // mm
  groundT: CONSTANTS.groundT, // °C
  leakCm2: J.leakCm2, // cm²
  loadLow: 1.25, // kg of sticks in a load
  loadHigh: 2.5,
} as const;

const fig = (table: Record<string, number>, digits: Record<string, number> = {}): Record<string, [number, number]> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [k, [v, digits[k] ?? 0]]));

/** The decimals a figure is printed with; the default is none. */
const DIGITS: Record<string, number> = {
  slabMm: 0,
  meanKw: 1,
  benchKwLow: 1,
  benchKwHigh: 1,
  coreKwLow: 1,
  coreKwHigh: 1,
  seatLow: 1,
  seatHigh: 1,
  seatColdLow: 1,
  seatColdHigh: 1,
  lagStop: 1,
  lagStopCold: 1,
  lagBegin: 1,
  seatAfter7: 1,
  seatColdAfter7: 1,
  roomAfter7: 1,
  roomLow: 1,
  roomHigh: 1,
  roomMean: 1,
  roomSwing: 1,
  stoneLow: 1,
  stoneHigh: 1,
  behindKwh: 1,
  groundKwh: 1,
  fireKw: 1,
  lambda: 1,
  flameLen: 1,
  riserPa: 1,
  fallPa: 1,
  netPa: 1,
  chimneyPa: 1,
  coldFluePa: 1,
  lidPa: 1,
  lidPaLow: 1,
  coverLowLambda: 1,
  coverHighLambda: 1,
  uninsulatedRoom: 1,
  kLowSeat: 1,
  kHighSeat: 1,
  pebbleSeat: 1,
  filmTotal: 1,
  wood20: 1,
  woodSnap: 1,
  coldFlow: 1,
  mildWood: 1,
  snapRoomLow: 1,
  snapRoomHigh: 1,
  wetRoom: 1,
  longDraft: 1,
  longWater: 1,
  lowDraft: 1,
  lowLambda: 1,
  leakyRoomLow: 1,
  leakyRoomHigh: 1,
  benchTonnes: 1,
  benchKwhK: 2,
  floorKn: 1,
  drumArea: 2,
  section: 3,
  gapArea: 3,
  hPerFloor: 1,
  seasonTonnes: 1,
  seasonLeakyTonnes: 1,
  seasonOldTonnes: 1,
  seasonOldLeakyTonnes: 1,
  burnKwLow: 1,
  burnKgLow: 1,
  burnKgHigh: 1,
  whoPpm8h: 1,
  stoneWallTonnes: 1,
  benchLimitM: 1,
  backLimitM: 1,
  outsideMean: 1,
  woodDay: 1,
  sessionHours: 1,
  feedRate: 1,
  stoneWallT: 1,
  roomH: 1,
  stoneWallH: 1,
  achBase: 1,
  chimneyTop: 1,
  chimneyLow: 1,
  benchDepth: 2,
  benchHeight: 2,
  backDepth: 2,
  backHeight: 2,
  stoneK: 1,
  coreTonnes: 1,
  machineTonnes: 1,
  pebbleK: 1,
  kBend: 1,
  kTee: 1,
  floorU: 1,
  warmKw: 1,
  sleeveWallMm: 1,
  loadLow: 2,
  loadHigh: 1,
};

export const FIG: Record<string, [value: number, digits: number]> = {
  ...fig(MODEL, DIGITS),
  ...fig(DERIVED, DIGITS),
  ...fig(ASSUMED, DIGITS),
  ...fig(ESTIMATE, DIGITS),
};

export type FigName = keyof typeof MODEL | keyof typeof DERIVED | keyof typeof ASSUMED | keyof typeof ESTIMATE;

export const MODEL_KEYS: ReadonlySet<string> = new Set(Object.keys(MODEL));
export const DERIVED_KEYS: ReadonlySet<string> = new Set(Object.keys(DERIVED));
export const ASSUMED_KEYS: ReadonlySet<string> = new Set(Object.keys(ASSUMED));
export const ESTIMATE_KEYS: ReadonlySet<string> = new Set(Object.keys(ESTIMATE));
