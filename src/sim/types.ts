import type { CoRegime } from './combustion';
import type { BenchFill, RiserInsulationId } from './machine';

// The shared types of the simulation. The engine writes `HeaterState` every frame; the 3D worlds, the strip and the panel only read it.
// SI everywhere (m, W, J, kg/s, Pa), temperatures in °C.

export type PresetId = 'j-tube' | 'batch-load' | 'pebble-bench' | 'yurt';

export type ScenarioId =
  | 'winter-two-fires'
  | 'cold-start'
  | 'one-fire-mild'
  | 'cold-snap'
  | 'wet-wood'
  | 'short-bench'
  | 'long-bench'
  | 'low-chimney'
  | 'small-gap'
  | 'leaky-house'
  | 'extract-fan'
  | 'damper-on-embers';

export type AlarmKey =
  | 'smokeBack'
  | 'coldChamber'
  | 'starved'
  | 'belowDew'
  | 'drumHot'
  | 'seatHot'
  | 'roomCoGuideline'
  | 'roomCoAlarm'
  | 'roomCold';

export type FirePhase = 'cold' | 'lighting' | 'roaring' | 'burningDown' | 'embers';
export type FireStyle = 'session' | 'batch';

/** Everything the visitor or a film can set (all through `MassHeaterSim.set`). Ranges are in presets.ts. */
export interface HeaterParams {
  // ---- the kit's time controls
  slowMo: number;
  /** Simulated seconds per real second. */
  timeScale: number;
  running: boolean;
  /** Where the values come from; 'custom' as soon as something physical is edited. */
  preset: PresetId | 'custom';

  // ---- what the 3D and a film read or set
  /** The hour of the clock, 0 to 24: the engine keeps it current; setting it moves the machine to that hour of its settled day. */
  hour: number;
  /** The thermal view of the 3D worlds. Read only by the 3D. */
  thermalView: boolean;

  // ---- the fire
  /** How the wood goes in: a tended session of hours, or one closed load. */
  style: FireStyle;
  firesPerDay: number;
  morningHour: number;
  eveningHour: number;
  /** Length of a tended session, h. */
  sessionHours: number;
  /** Wood fed during a session, kg/h. */
  feedKgH: number;
  /** A closed load, kg, and how long it burns, min. */
  loadKg: number;
  burnMinutes: number;
  /** Moisture of the wood, % of its wet mass. */
  moisture: number;
  /** Share of the feed's section left free by the sticks. */
  packing: number;
  /** How much of the feed's top is covered, 0 to 1. */
  feedCover: number;
  /** A lid goes on the feed once the embers are out. */
  lidAfterFire: boolean;

  // ---- the machine
  bore: number;
  riserHeight: number;
  topGap: number;
  riserInsulation: RiserInsulationId;
  ductLength: number;
  chimneyTop: number;
  flueInsulated: boolean;
  /** Multiplies the film of the gas in the duct: the number no source gives. */
  ductFilm: number;
  benchFill: BenchFill;
  /** Conductivity of the bench, W/m·K. */
  benchK: number;

  // ---- the house and the weather
  /** Heat lost per degree, W/K, air change included. */
  houseH: number;
  /** People, appliances, low sun, W. */
  gains: number;
  /** Mean of the outside air, °C, and its daily swing, K. */
  outsideMean: number;
  outsideSwing: number;
  /** Height where the house's leaks balance, m. */
  neutralZ: number;

  // ---- what can go wrong
  /** Depression of the house from an extract fan, Pa. */
  fanPa: number;
  /** A damper closed in the flue. Not part of this machine: a scenario shows why. */
  damperClosed: boolean;
  /** A partial restriction in the flue, in velocity heads: for the comparison with the one journal paper, not for the visitor. */
  damperK: number;
  /** A leak at the drum's lid, cm². */
  leakCm2: number;

  // ---- the comparison of the wood claims
  /** The real efficiency of an old stove, share. Used by the comparison only. */
  oldStoveEta: number;
}

/** The stations of the gas path, feed to cap, in order. */
export const STATIONS = [
  'inlet',
  'fire',
  'riserFoot',
  'riserTop',
  'lid',
  'drumMid',
  'drumFoot',
  'ductIn',
  'ductOut',
  'tee',
  'ceiling',
  'cap',
] as const;
export type StationId = (typeof STATIONS)[number];

/** The state handed to the 3D scene, the strip and the panel every frame (read only). */
export interface HeaterState {
  // ---- clock
  simTime: number;
  day: number;
  hour: number;
  outsideT: number;

  // ---- moments a film logs: numbers that rise or cross
  fireCount: number;
  /** 1 while something burns, flame or embers. */
  burning: number;
  /** +1 the gas goes the right way, −1 it comes back into the room, 0 at rest. */
  flowDirection: number;
  /** 1 once the room's CO would have set off a domestic alarm of the standard, at its latest. */
  coAlarm: number;
  /** Hour of the day at which the seat peaks after the evening's fire, from the settled day. */
  benchPeakHour: number;

  // ---- the fire
  phase: FirePhase;
  /** Chemical heat of what is burning, W. */
  firePower: number;
  /** Wood fed so far today and since the start, kg; ash left, kg. */
  woodToday: number;
  woodTotal: number;
  ash: number;
  /** 0 to 1: how full the feed looks, how bright the embers are. */
  feedLevel: number;
  emberGlow: number;
  /** What the 3D draws: length of the flame in the tunnel, m (negative when it comes back up the feed), its strength 0 to 1. */
  flameLength: number;
  flameStrength: number;
  /** Smoke and steam at the cap, 0 to 1: smoke is unburned fuel, steam is only water. */
  smokeAtCap: number;
  steamAtCap: number;
  /** Smoke out of the feed or a leak into the room, 0 to 1. */
  smokeInRoom: number;
  /** Visual clocks, scaled by the slow motion, running even when the slow clock stops. */
  flameClock: number;
  /** What the template's placeholder scene turns, until the 3D role replaces it. */
  angle: number;

  // ---- the gases
  /** Air flow, kg/s, signed; speed in the riser and in the duct, m/s. */
  airFlow: number;
  gasFlow: number;
  riserSpeed: number;
  ductSpeed: number;
  chimneySpeed: number;
  /** Excess air, and the O₂ an analyser would read, %. */
  lambda: number;
  o2: number;
  /** Temperatures along the path, °C, and the pressure inside against the air beside it, Pa, station by station of `STATIONS`. */
  pathT: Float64Array;
  pathP: Float64Array;
  /** Distance along the path of each station, m. */
  pathS: Float64Array;
  chamberT: number;
  riserTopT: number;
  afterDrumT: number;
  exhaustT: number;
  dewPointT: number;
  /** Water condensing in the flue now, kg/h, and the wall under the dew point. */
  condensate: number;
  condensing: boolean;

  // ---- the draft, Pa
  draft: number;
  draftRiser: number;
  draftDrum: number;
  draftChimney: number;
  /** The pressure under the drum's lid against the room: above zero, a leak there lets gas out. */
  lidPressure: number;

  // ---- the solids, °C
  brickT: number;
  casingT: number;
  linerT: number;
  sleeveT: number;
  drumLidT: number;
  drumUpperT: number;
  drumLowerT: number;
  flueInT: number;
  flueOutT: number;
  /**
   * The bench's cross-sections: `benchT[col + cols·row + cols·rows·segment]`, °C, updated in place. The duct's cell (`ductCol`, `ductRow`) holds the gas.
   * Segment 0 is the hot end. Cell edges in `benchColEdges`, `benchRowEdges[segment]`, m.
   */
  benchT: Float64Array;
  benchCols: number;
  benchRows: number;
  benchSegments: number;
  ductCol: number;
  ductRow: number;
  benchColEdges: Float64Array;
  benchRowEdges: Float64Array[];
  /** Length of a slice, m. */
  segmentLength: number;
  /** Surface of the seat and of the front, at the middle of each segment, °C. */
  seatT: Float64Array;
  frontT: Float64Array;
  /** Gas in the duct at the middle of each segment, °C. */
  ductGasT: Float64Array;
  seatHotT: number;
  seatColdT: number;

  // ---- the room
  roomT: number;
  surfaceT: number;
  stoneT: number;

  // ---- where the heat is going now, W
  drumOut: number;
  benchOut: number;
  coreOut: number;
  flueLoss: number;
  envelopeLoss: number;
  ventilation: number;

  // ---- carbon monoxide: an indication, never a measure
  regime: CoRegime;
  /** In the flue, ppm: middle of a band a factor of three each way. */
  flueCo: number;
  flueCoLow: number;
  flueCoHigh: number;
  /** In the room, ppm, and share of the fire's CO that reaches it. */
  roomCo: number;
  coIntoRoom: number;
  /** Share of the flue gas leaving by the leak at the lid. */
  leakShare: number;

  alarms: AlarmKey[];
}

/** The last days of the live quantities, one sample each few simulated minutes (for the time charts). */
export interface Scope {
  t: number[];
  fire: number[];
  drum: number[];
  seatHot: number[];
  seatCold: number[];
  room: number[];
  exhaust: number[];
  draft: number[];
  co: number[];
}
