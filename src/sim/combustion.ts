import { airCp } from './thermal';

// Wood, air and what the burning gives: pure functions, plain numbers. Temperatures in °C, moisture in % of the wet mass (as a moisture meter's wet basis reads it).

/** ESTIMATE of the usual: dry wood by mass. */
export const WOOD = { C: 0.5, H: 0.06, O: 0.43 } as const;
/** REPORTED: the Finnish sheet's dry heating value, MJ/kg. */
export const Q_DRY = 18.5;

/** kg of air per kg of dry wood: 11.5·C + 34.5·(H − O/8). */
export const STOICH_AIR_DRY = 11.5 * WOOD.C + 34.5 * (WOOD.H - WOOD.O / 8);

/** kg of air per kg of wood at this moisture. */
export const stoichAir = (moisture: number): number => STOICH_AIR_DRY * (1 - moisture / 100);

/** The heating value as received, J/kg: q = q_dry·(100 − M)/100 − 0.02443·M, MJ/kg. It already pays for the water's latent heat. */
export const heatingValue = (moisture: number): number =>
  ((Q_DRY * (100 - moisture)) / 100) * 1e6 - 0.02443 * moisture * 1e6;

/** Heat per kg of air at the exact air need, J/kg. Close to 3 MJ/kg for any wood: what limits a fire short of air. */
export const heatPerAir = (moisture: number): number => heatingValue(moisture) / stoichAir(moisture);

/** The excess air measured by an analyser: λ = 21 / (21 − O₂). */
export const lambdaFromO2 = (o2: number): number => 21 / (21 - o2);
export const o2FromLambda = (lambda: number): number => 21 * (1 - 1 / lambda);

/** A reading at the flue's O₂ corrected to 13 % O₂: C·8/(21 − O₂). */
export const coAt13 = (ppm: number, o2: number): number => (ppm * 8) / (21 - o2);

/** mg/m³ of CO per ppm: at 0 °C, as the limits are written, and at 20 °C, as a room is. */
export const MG_PER_PPM_0C = 1.25;
export const MG_PER_PPM_20C = 1.165;

export interface FlueGas {
  /** Mole fraction of the water vapour. */
  xWater: number;
  /** Mass fractions of the water and the CO₂. */
  wWater: number;
  wCO2: number;
  /** Molar mass, kg/kmol. */
  M: number;
}

/** What a kg of dry wood gives at this excess air and moisture. */
export function flueGas(lambda: number, moisture: number, out?: FlueGas): FlueGas {
  const f = out ?? { xWater: 0, wWater: 0, wCO2: 0, M: 0 };
  const water = WOOD.H * 9 + moisture / (100 - moisture);
  const air = STOICH_AIR_DRY * lambda;
  const nAir = air / 28.97;
  const nO2Used = (0.21 * STOICH_AIR_DRY) / 28.97;
  const nCO2 = WOOD.C / 12;
  const nWater = water / 18;
  const n = nAir - nO2Used + nCO2 + nWater;
  const mass = air + 1 + moisture / (100 - moisture);
  f.xWater = nWater / n;
  f.wWater = water / mass;
  f.wCO2 = (nCO2 * 44) / mass;
  f.M = mass / n;
  return f;
}

/** Saturation pressure of water, Pa, and its inverse: Magnus's formula, usual. */
export const saturationPressure = (T: number): number => 611.2 * Math.exp((17.62 * T) / (243.12 + T));
export function dewPointOf(p: number): number {
  const a = Math.log(p / 611.2);
  return (243.12 * a) / (17.62 - a);
}

/** The dew point of the flue gas, °C, at atmospheric pressure. */
export const dewPoint = (lambda: number, moisture: number): number =>
  dewPointOf(flueGas(lambda, moisture).xWater * 101325);

/** Specific heat of the flue gas, J/kg·K: air, CO₂ and steam by mass. The two straight lines are fits of the usual tables. */
export const gasCp = (T: number, f: FlueGas): number =>
  (1 - f.wWater - f.wCO2) * airCp(T) + f.wCO2 * (850 + 0.5 * T) + f.wWater * (1830 + 0.62 * T);

/**
 * The CO regime: **indicative**, a map bracketed by a few real readings, not a prediction. No validated model gives ppm for this machine. A real flame depends on
 * the mixing, the stick, the moment, and the eye cannot judge it. Tests hold the ordering of the regimes, never their values.
 */
export type CoRegime = 'none' | 'clean' | 'lean' | 'coldChamber' | 'starved' | 'wet' | 'embers' | 'smokeBack';

/** REPORTED: builders read a clean burn from 540 °C in the chamber. ESTIMATE: well under it the smoke no longer finishes burning at all. */
export const CLEAN_T = 540;
export const COLD_T = 350;

/** g of CO per kg of wood burning in flame. ESTIMATE: about 2 in a clean flame, bracketed by the few ppm of the logged burns; it climbs fast out of its conditions. */
export function flameCoFactor(chamberT: number, lambda: number, moisture: number): number {
  let ef = 2;
  if (chamberT < CLEAN_T) ef *= Math.pow(1 + (CLEAN_T - chamberT) / 60, 1.5);
  if (lambda < 1.4) ef *= Math.exp((1.4 - lambda) * 6);
  if (moisture > 20) ef *= 1 + (moisture - 20) / 10;
  return Math.min(ef, 150);
}

/**
 * g of CO per kg of char: 2,100·r, r the share of its carbon that leaves as CO after the chamber has done what it can: a quarter over a cooling bed, nearly nothing above a hot one, where
 * the CO finishes burning. ESTIMATE, the shape chosen to sit between the few logged burns: low in a hot run, climbing as the load burns out.
 */
export function charCoFactor(chamberT: number): number {
  const r = chamberT <= 150 ? 0.25 : Math.max(0.003, 0.25 * Math.exp(-(chamberT - 150) / 90));
  return 2100 * r;
}

/** Share of the fuel's energy that leaves unburned, from its CO, with half as much again for what comes with it. ESTIMATE. */
export const unburnedShare = (coFactor: number, heating: number): number =>
  Math.min(0.5, (coFactor * 10.1e3 * 1.5) / heating);

/** Steady concentration in a ventilated room, ppm: q·C/V̇, with q and V̇ in the same unit. */
export const steadyRoomCo = (leak: number, ppm: number, ventilation: number): number => (leak * ppm) / ventilation;

/**
 * How long a domestic alarm may wait at this level by the standard's table, at its latest, s; Infinity under its lowest level. REPORTED: 50 ppm 60 to 90 min, 100 ppm
 * 10 to 40 min, 300 ppm under 3 min, nothing at 30 ppm over 120 min. Between the levels, a straight line in logarithms.
 */
export function alarmLimit(ppm: number): number {
  if (ppm < 30) return Infinity;
  if (ppm < 50) return 90 * 60 * Math.pow(50 / ppm, 2);
  if (ppm >= 300) return 180;
  const pts: readonly (readonly [number, number])[] = [
    [50, 90 * 60],
    [100, 40 * 60],
    [300, 180],
  ];
  const i = ppm < 100 ? 0 : 1;
  const [a, ta] = pts[i]!;
  const [b, tb] = pts[i + 1]!;
  const u = Math.log(ppm / a) / Math.log(b / a);
  return Math.exp(Math.log(ta) + u * (Math.log(tb) - Math.log(ta)));
}

/** REPORTED, WHO indoor guideline: mg/m³ and the time it applies to, s. */
export const WHO_LIMITS: readonly { mg: number; seconds: number }[] = [
  { mg: 100, seconds: 900 },
  { mg: 35, seconds: 3600 },
  { mg: 10, seconds: 8 * 3600 },
  { mg: 7, seconds: 24 * 3600 },
];
