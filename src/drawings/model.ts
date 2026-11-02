// What the simulation gives, for the sheets that print MODEL RESULTS (the gas path, the bench's maps, the day, the draught, the balance). Computed on first use from src/sim, never typed: the figures of src/data/figures.ts are held to the same runs by
// data.test.ts, and drawings.test.ts holds these to those. No target anywhere.
import { MassHeaterSim } from '../sim/engine';
import { presetParams } from '../sim/presets';
import { settledDay, type DayResult } from '../sim/runs';

export const J = presetParams('j-tube');

/** The settled day of the default machine. */
export const theDay = (): DayResult => settledDay(J);

export interface PathReading {
  s: number[];
  t: number[];
  p: number[];
  draft: number;
  riser: number;
  fall: number;
  chimney: number;
  lid: number;
}

const read = (sim: MassHeaterSim): PathReading => ({
  s: [...sim.state.pathS],
  t: [...sim.state.pathT],
  p: [...sim.state.pathP],
  draft: sim.state.draft,
  riser: sim.state.draftRiser,
  fall: sim.state.draftDrum,
  chimney: sim.state.draftChimney,
  lid: sim.state.lidPressure,
});

let full: PathReading | null = null;
let cold: PathReading | null = null;

/** The path at full burn, the morning fire at 09:00. */
export function fullBurn(): PathReading {
  if (full) return full;
  const sim = new MassHeaterSim();
  sim.set({ hour: 9 });
  full = read(sim);
  return full;
}

/** The path of the cold start, before the first gesture: a flue full of outside air. */
export function coldFlue(): PathReading {
  if (cold) return cold;
  const sim = new MassHeaterSim();
  sim.applyScenario('cold-start');
  cold = read(sim);
  return cold;
}

export interface BenchSlice {
  hour: number;
  segment: number;
  cols: number[];
  rows: number[];
  /** °C, `T[col + cols·row]`, row 0 on the floor, col 0 at the back wall. */
  T: number[];
  ductCol: number;
  ductRow: number;
}

/** One slice of bench at one hour of the settled day. */
export function benchSlice(hour: number, segment: number): BenchSlice {
  const sim = new MassHeaterSim();
  sim.set({ hour });
  const s = sim.state;
  const n = s.benchCols * s.benchRows;
  const T: number[] = [];
  for (let i = 0; i < n; i++) T.push(s.benchT[i + n * segment]!);
  return {
    hour,
    segment,
    cols: [...s.benchColEdges],
    rows: [...s.benchRowEdges[segment]!],
    T,
    ductCol: s.ductCol,
    ductRow: s.ductRow,
  };
}
