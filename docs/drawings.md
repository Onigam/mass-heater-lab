# Drawings of the Mass Heater lab

Ten A3 sheets (`src/drawings/`), every length read from `src/three/dims.ts`, every model result from `src/sim` or `src/data/figures.ts`, through `lab` and `fig` in `geom.ts`, which record what they print so that the test can tell a printed number from a typed one. **They explain: overall sizes only, no brick, no mix, no thickness. The title block of each says « Explanatory diagram, NOT FOR CONSTRUCTION ».**

| Sheet | id                     | World           | What it shows                                                                                                               | Scale                |
| ----- | ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| PL-01 | `general-arrangement`  | `living-room`   | the room in plan, the 18 items where `dims.ts` sets them, the heights; overall sizes only                                   | 1:35                 |
| PL-02 | `long-section`         | `fire-core`     | the whole gas path unrolled, station by station, the gas temperature at 09:00: model output                                 | none                 |
| PL-03 | `core-section`         | `fire-core`     | feed, tunnel, riser, drum, cut, the gases' way; the drum, the riser's example and the bore; proportions as a source's words | **none, on purpose** |
| PL-04 | `duct-plan`            | `bench-section` | the two legs, joints, the corner, the cleanout, the tee, thick and thin cover; what each slice gives up in the model        | 1:25                 |
| PL-05 | `bench-cross-sections` | `bench-section` | the two thicknesses, then the model's own grid at 0, 4, 8, 12 h after the evening's lighting, the 3D's colours              | 1:6                  |
| PL-06 | `materials-explained`  | `fire-core`     | a nomenclature: brick, insulation, steel, earth, stone, concrete, plaster, gasket; data, why, and where each figure is from | none                 |
| PL-07 | `firing-day`           | `living-room`   | 24 h: the sessions, the seat at both ends, the room, the outside, what the drum and the bench give                          | none                 |
| PL-08 | `draft-budget`         | `fire-core`     | the pressure along the path, at full fire and with a cold flue; hand sums and model side by side                            | none                 |
| PL-09 | `energy-day`           | `homestead`     | the day's wood as a Sankey, what the house loses, the sum of « 80 to 90 % less wood »                                       | none                 |
| PL-10 | `safety-chain`         | `living-room`   | who to ask, in order; WHO's and the alarm's thresholds; the damper and the fan in numbers; a draft text's distances         | none                 |

## Marks

No mark: given by a source. `‡`: derived from reported figures. `*`: an estimate. The legend is on the sheets that carry dimensions. **A model result carries no mark on a sheet: it sits under a red box that says MODEL RESULT, not a measurement.** `†` means a model result wherever it appears, which is the simulation panel.

« Not for construction » and « independent educational reconstruction » are said by the title block (`configureDrawings` in `src/drawings/index.ts`) and nowhere else on a sheet. `src/lab.ts` no longer calls it.

## What is left out, on purpose

No inner dimension of the core: feed, tunnel, insulation, sleeve; a test holds their `dims.ts` values off every sheet. PL-03 is drawn from `dims.ts` and prints no scale, with « do not measure ». The clearances are only in PL-10 and on `heat-shield`, as the words of a draft text, « not a safe value ». The law is not on any sheet: PL-10 sends the reader to the Sources panel, where each line says how it was reached.

PL-02 prints `state.pathT`, the state at 09:00 (riser's foot 485 °C), and says beside it that the texts' 467 °C is `summary.meanChamber`, the mean of a fire at full rate. An earlier 434 °C was an error of the frames, corrected in `src/sim/plant.ts` (`docs/physics.md` §1.7).

## Scope

`PLAN_GROUPS` in `src/drawings/index.ts` is what `plans.groups` in `src/lab.ts` needs: `living-room`, `fire-core`, `bench-section`, `model`. `model.ts` runs the simulation on first use and caches it. `test-dom.ts`, `draw.ts` and `geom.ts` come from the sand lab; `draw.ts` adds `chart`.

## Tests

`src/drawings/drawings.test.ts`: the contract, a render in both languages with no NaN and no French left in English, the title block's words, the marks, every printed number from a known source, no inner size of the core, no sheet that says anything is safe, and the sheets' model results against `src/data/figures.ts`.
