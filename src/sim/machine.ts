import { constantMaterial, heatStops, makeMaterial, piecewise, type Material } from './thermal';

// The machine of the lab and every constant of the model, one file, each with its tag:
//   REPORTED (a source of docs/research.md), DERIVED (computed from reported figures), ESTIMATE (the sources are silent: a choice, with its reason,
//   listed again in docs/physics.md), USUAL (a textbook value).
// `MACHINE` is the one source of the machine's dimensions: `src/three/dims.ts` imports them from here, as the other labs' dims import from their simulation.
// A generic reconstruction of a class of machine: an explanation, never a plan. Sizes are rounded.

export const MACHINE = {
  /** REPORTED, digest: the bore of the whole gas path, m (« about 50 sq in »). */
  bore: 0.2,
  /** DERIVED: the side of the square feed and tunnel with the bore's area, rounded, m. */
  feedSide: 0.18,
  /** DERIVED: at most the riser over 3 (a draft's ratio), m. */
  feedHeight: 0.28,
  /** DERIVED: at most the riser over 2 (a draft's ratio), drawn a little under, m. */
  tunnelLength: 0.4,
  /** REPORTED, digest: an example from a range of 0.64 to 1.27 m. */
  riserHeight: 0.84,
  /** ESTIMATE: insulation of the riser, m, inside a steel sleeve of this diameter. */
  riserInsulation: 0.07,
  sleeveDiameter: 0.34,
  /** ESTIMATE: wall of the sleeve, m. */
  sleeveWall: 0.0015,
  /** REPORTED, sellers' range: a 200 L drum, m. */
  drumDiameter: 0.585,
  drumHeight: 0.88,
  drumWall: 0.0012,
  /** REPORTED, digest: gap under the drum's lid, m. */
  topGap: 0.05,
  /** ESTIMATE: the drum stands on this much of plinth, the riser's foot at the tunnel's axis, m above the slab. */
  plinthHeight: 0.16,
  tunnelAxis: 0.15,
  /** REPORTED, a draft's range: the duct, m, in two legs, with its bends. */
  ductLength: 9,
  ductLegs: [4.8, 4.2] as const,
  ductBends: 3,
  /** ESTIMATE, within the draft's casing: the bench's section, m. */
  benchDepth: 0.5,
  benchHeight: 0.45,
  /** REPORTED, a draft: the thick casing runs over the first 3 m, then a thinner one; cover over the duct, m. */
  hotRun: 3,
  coverHot: 0.15,
  coverCold: 0.1,
  /** ESTIMATE: top of the chimney above the floor, and the line of the roof, m. REPORTED: it is insulated. */
  chimneyTop: 5,
  roofLine: 2.5,
  /** ESTIMATE: thickness of the chimney's insulation, m. */
  chimneyInsulation: 0.03,
  /** REPORTED, a draft: the slab, m. */
  slab: 0.1,
  /** ASSUMPTION: the room and the house. */
  room: { width: 6, depth: 5, height: 2.5 },
  houseArea: 74,
  /** ASSUMPTION: the inner stone wall, m. */
  stoneWall: { thickness: 0.3, width: 4, height: 2.5 },
} as const;

// ------------------------------------------------------------------------------------------------ materials

/** REPORTED: cob, k about 0.6 W/m·K moist, c 891 J/kg·K at 3 % moisture. ESTIMATE: 1,700 kg/m³ with about 20 % of stones (range 1,500 to 1,800). */
export const COB = { rho: 1700, c: 891, k: 0.6, kMin: 0.12, kMax: 1.06 } as const;
/** ESTIMATE, no figure anywhere: a pebble fill bound with earth. Half of the twelve builds of the gallery are pebble, with no number. */
export const PEBBLE = { rho: 1800, c: 850, k: 1.2 } as const;
/** REPORTED: fireclay, k 0.90 to 1.35 W/m·K, 1,750 to 2,300 kg/m³. ESTIMATE: c. */
export const FIRECLAY = { rho: 2000, c: 1000, k: 1.1 } as const;
/** USUAL: concrete of the slab, stone of the inner wall. */
export const CONCRETE = { rho: 2300, c: 900, k: 1.4 } as const;
export const STONE = { rho: 2300, c: 900, k: 1.7 } as const;
/** USUAL: mild steel, J/kg·K and kg/m³. */
export const STEEL = { rho: 7850, c: 500 } as const;

export type BenchFill = 'cob' | 'pebble';
export type RiserInsulationId = 'firebrick' | 'fibre' | 'perlite';

export function benchMaterial(fill: BenchFill, k: number): Material {
  const m = fill === 'cob' ? COB : PEBBLE;
  return constantMaterial(fill, m.rho, m.c, k);
}

export const fireclay = (): Material => constantMaterial('fireclay', FIRECLAY.rho, FIRECLAY.c, FIRECLAY.k);
/** The earth around the core: the same cob, without the stones' question. */
export const casingEarth = (): Material => constantMaterial('casing-earth', COB.rho, COB.c, COB.k);
export const concrete = (): Material => constantMaterial('concrete', CONCRETE.rho, CONCRETE.c, CONCRETE.k);
export const stone = (): Material => constantMaterial('stone', STONE.rho, STONE.c, STONE.k);

/**
 * The riser's insulation. REPORTED, maker: insulating firebrick JM 23, 480 kg/m³, 0.14 / 0.16 / 0.17 W/m·K at 400 / 600 / 800 °C; fibre blanket of 128 kg/m³,
 * 0.08 / 0.12 / 0.18. WEAK: perlite, 0.078 at 200 °C and 0.092 at 300 °C from a calculated curve, carried on in a straight line far beyond it, density
 * unstated (ESTIMATE 100 kg/m³). c: ESTIMATE, about 1,000 J/kg·K. The makers' curves stop at 400 °C: below that the first slope carries on, held above still air.
 */
export const RISER_INSULATIONS: Record<RiserInsulationId, { rho: number; k: readonly (readonly [number, number])[] }> =
  {
    firebrick: {
      rho: 480,
      k: [
        [400, 0.14],
        [600, 0.16],
        [800, 0.17],
      ],
    },
    fibre: {
      rho: 128,
      k: [
        [400, 0.08],
        [600, 0.12],
        [800, 0.18],
      ],
    },
    perlite: {
      rho: 100,
      k: [
        [200, 0.078],
        [300, 0.092],
      ],
    },
  };

export function riserInsulation(id: RiserInsulationId): Material {
  const spec = RISER_INSULATIONS[id];
  const k = piecewise(spec.k);
  return makeMaterial({
    name: id,
    rho: spec.rho,
    c: () => 1000,
    k: (T) => Math.max(0.04, k(T)),
    Tmin: -40,
    Tmax: 1600,
    dT: 40,
  });
}

// ------------------------------------------------------------------------------------------------ the bench's grid

/** The grid of a slice of bench: five columns, four rows, the duct in the middle of the second row. */
export const BENCH_COLS = 5;
export const BENCH_ROWS = 4;
export const DUCT_COL = 2;
export const DUCT_ROW = 1;
/** The slices along the duct. */
export const BENCH_SEGMENTS = 6;

/** The side of the square with the area of the duct, m: the cells hold exactly the bench's mass. */
export const ductSquare = (bore: number): number => Math.sqrt(Math.PI / 4) * bore;

/** Columns of a slice, back wall to front face, m. */
export function benchColumns(bore: number): number[] {
  const s = ductSquare(bore);
  const d = MACHINE.benchDepth;
  const side = (d - s) / 2;
  return [0, side / 2, side, side + s, side + s + side / 2, d];
}

/**
 * Rows of a slice, floor to seat, m. The bench's top is flat and the mass of K49 holds: the duct sits lower on the hot run, under the thick cover, and rises on the
 * cold run under the thin one (a choice of the reconstruction, within the draft's casing).
 */
export function benchRows(bore: number, hot: boolean): number[] {
  const s = ductSquare(bore);
  const H = MACHINE.benchHeight;
  const cover = hot ? MACHINE.coverHot : MACHINE.coverCold;
  const axis = H - cover - bore / 2;
  const bottom = axis - s / 2;
  const top = axis + s / 2;
  return [0, bottom, top, (top + H) / 2, H];
}

/** Height of the duct's axis above the slab, in the thick and in the thin casing, m. */
export const ductAxis = (bore: number, hot: boolean): number =>
  MACHINE.benchHeight - (hot ? MACHINE.coverHot : MACHINE.coverCold) - bore / 2;

/** The mass of the bench, kg: (w·h − πr²)·L·ρ. */
export const benchMass = (bore: number, length: number, rho: number): number =>
  (MACHINE.benchDepth * MACHINE.benchHeight - (Math.PI * bore * bore) / 4) * length * rho;

// ------------------------------------------------------------------------------------------------ the constants of the model

/** All ESTIMATE unless stated. The ones that move the results are in the table of docs/physics.md §6. */
export const MODEL = {
  /** Masses of the core, kg: fireclay around the fire, earth around that (0.4 t in all, research). */
  brickMass: 150,
  casingMass: 250,
  /** The inner surface the flame sees, the outer surface of the core, m². */
  tunnelArea: 0.35,
  casingArea: 1.2,
  /** Half-thicknesses of the brick and of the earth around it, m. */
  brickHalf: 0.03,
  casingHalf: 0.1,

  /** Emissivities: flame on brick, gas in a tube of this size (Hottel's charts for a lean flue gas, usual), painted drum, sleeve, plastered earth. */
  flameEmissivity: 0.3,
  gasEmissivity: 0.06,
  drumEmissivity: 0.85,
  sleeveEmissivity: 0.7,
  earthEmissivity: 0.9,

  /** Coefficient of a natural film inside hot gas (0.1·Ra^(1/3) on a wall, usual; a cooled horizontal tube stratifies, so less). */
  naturalInDrum: 0.1,
  naturalInDuct: 0.06,

  /** Loss coefficients of the path, in velocity heads of the local section, from usual tables. */
  kSticks: 1.5,
  kTunnel: 1.1,
  kRiserFoot: 1.1,
  kGapTurn: 1.5,
  kAnnulus: 1.0,
  kManifold: 1.5,
  kBend: 0.9,
  kTee: 1.3,
  kCap: 1.0,
  /** A sharp opening in the feed's cover, in its own cold velocity head. */
  kCover: 2.7,
  /** Room left between the sticks at the foot of the feed: a load of 1.25 to 2.5 kg of sticks at about 500 kg/m³ takes 15 to 30 % of the section, the stick feet and the ash more. */
  packing: 0.5,
  /**
   * How much of the feed's top is hidden during a burn. No source gives a figure, and THE air, the chamber and the efficiency hang on it. The frames seen of real builds show bricks on the feed:
   * one brick of 22 × 11 cm laid flat hides 11 of the 18 cm, and the sticks stand in the remaining slot of 7 × 18 cm, about 40 % of it free: 50 cm² of 324.
   */
  feedCover: 0.85,
  /** What a lid set on the feed still leaves open, share of the section. */
  lidLeak: 0.05,
  /** What a damper in the flue still leaves open when it is shut, share of the section (a loose one leaves more; the fire's own texts differ). */
  damperLeak: 0.01,
  /** Share of the feed's column that must fill with hot gas before smoke leaves the top. */
  feedFill: 0.25,
  /** Air that a small fire exchanges through an open feed even with no net flow, kg/s. */
  feedExchange: 0.004,

  /** A fire on a reversed flow: share of its heat that reaches the brick and the riser's foot by radiation and by the plume in the tunnel. The least sure number here. */
  reversedToBrick: 0.15,
  reversedToRiser: 0.15,
  /** While the fire pushes back into the room, nobody feeds it fully: kindling only, share of the feed. */
  reversedFeed: 0.2,

  /** Share of a wood's energy that burns as char, after its volatiles (usual: 15 to 25 % of the dry mass at 30 MJ/kg). */
  charShare: 0.3,
  charEnergy: 30e6,
  /** Time constants of the volatiles and of the char, s. */
  volatileTau: 300,
  charTau: 2400,
  /** A fire takes this long to catch, s. */
  ignitionTime: 600,
  /** Under this a pool shows no flame and needs no open feed, J (0.1 kWh). */
  poolOut: 3.6e5,

  /** U of the wall behind the bench at the default house, and of the insulated floor under the slab, W/m²·K. */
  wallU: 0.25,
  floorU: 0.3,
  /** Ground under the house, °C. */
  groundT: 8,

  /** Base air change of the house, per hour, within its H. */
  baseAch: 0.3,
  /** The room's surfaces: their heat capacity per m² of floor (furniture, plaster), J/K, and the area that exchanges with the air, m². */
  surfaceCapacity: 60e3,
  surfaceArea: 235,
  /** Films of the room's surfaces, W/m²·K: convection and radiation. */
  surfaceConvection: 3,
  surfaceRadiation: 5.3,
  /** Height where the house's own leaks balance, m. Below, the room is under the pressure outside; above, over it. Half the room's height, with evenly spread leaks. */
  neutralZ: 1.25,

  /** An extract fan: the air it moves in a tight house, m³/h per Pa of depression it makes. */
  fanFlowPerPa: 30,
  /** A small fire at the foot of the flue: its heat in the flue's wall, W, and how long it lasts, s. */
  flueWarmer: 1500,
  flueWarmSeconds: 300,

  /** Heat from people, appliances and low winter sun, W: about 3 W per m² of floor. */
  gains: 220,
  /** The daily wave of the outside air, K, and its warmest hour. */
  swing: 3,
  warmestHour: 15,
} as const;

/**
 * The thermal view's ramp, °C and sRGB: fixed, so that a colour means the same at any hour and in every world. A bench lives between 20 and 60 °C; drum and core saturate at its top. `heatRgb` and
 * `heatRampGlsl` of the thermal core read it.
 */
export const THERMAL_RAMP = heatStops(15, 65);

/** The house's air volume, m³: the whole house as one zone. */
export const houseVolume = (): number => MACHINE.houseArea * MACHINE.room.height;

/** REPORTED: a cleaning figure, 57 lb of wood gave 7 oz of ash. */
export const ASH_SHARE = 7 / 16 / 57;
