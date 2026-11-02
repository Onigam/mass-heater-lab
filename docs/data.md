# Data of the Mass Heater lab (data role)

The texts of the lab: 56 part sheets, two guides, four overviews, six lessons with twelve questions, the Sources panel, the interface strings, written in French and English together. The machine drawn is a **generic reconstruction of a class of machine**, a 200 mm J-tube with a drum and a cob bench. It explains and gives no plan: this is what sets most of the choices below.

## Files

| File                          | What                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/ids.ts`             | the 56 ids of `docs/research.md` §4, by world, with their category. A test holds them to the research file, id by id                                          |
| `src/data/figures.ts`         | every number that is not reported: `MODEL` (held to `src/sim` by the test), `DERIVED`, `ASSUMED`, `ESTIMATE` (read from `src/sim` and `src/three/dims.ts`)    |
| `src/data/part-helpers.ts`    | `lf`, `tf`, `sp`, `maint`, `step`: a text that prints a figure must say its status in the same text, or it throws at import                                   |
| `src/data/parts/*.ts`         | `homestead` (11), `living-room` (18), `fire-core` (14), `bench-section` (13). Overview, Specs, Maintenance (failure, check, care), Design                     |
| `src/data/parts/dim-specs.ts` | the drawn overall sizes of the sheets, all read from `src/three/dims.ts`, all tagged estimate, appended by `src/data/parts.ts`. Nothing of the core's inside  |
| `src/data/assembly.ts`        | « how a mason raises it », 20 steps                                                                                                                           |
| `src/data/install.ts`         | « what must be true before the first fire », 10 steps                                                                                                         |
| `src/data/guide.ts`           | re-exports both, as `src/lab.ts` imports them                                                                                                                 |
| `src/data/overviews.ts`       | the side panel of each world, `{ title, text }`                                                                                                               |
| `src/data/sources.ts`         | the Sources panel as data: links, how each source was read (`ACCESS`), the law place by place with how each line was reached (`LAW`), what must not be linked |
| `src/data/about.ts`           | `aboutPanel(ctx)`: the panel built from it, for `about` in `src/lab.ts`                                                                                       |
| `src/data/lessons.ts`         | the six lessons, `docs/lessons.md`                                                                                                                            |
| `src/i18n/ui.ts`              | the lab's strings: title, worlds, shortcuts, the notices of the Sources panel                                                                                 |
| `src/data/data.test.ts`       | the checks of this file. `src/data/lessons.test.ts`: the lessons'                                                                                             |

## What `src/lab.ts` has to do with it (the lead's file)

Done by the lead: the bilingual title (`strL('labTitle')`), `video: { id: MAIN_VIDEO.id }`, both guides (`assembly: { scene: 'living-room', steps: ASSEMBLY }`, `install: { scene: 'homestead', steps: INSTALL }`), `plans: { sheets: SHEETS, groups: PLAN_GROUPS, intro }`, `about: aboutPanel`, `overview` of each world with its shortcuts (`goHomestead`, `goLivingRoom`, `goFireCore`, `goBenchSection`), `partLinks` for `house-shell`, `steel-drum` and `cob-bench`, world labels `sceneHomestead`, `sceneLivingRoom`, `sceneFireCore`, `sceneBenchSection`. `src/drawings/index.ts` sets the project and `PLAN_GROUPS`.

## Conventions

- **Tags.** No mark: reported by a source, named in words (« un projet de texte », « a builder »). `(dérivé)`, `(résultat du modèle)`, `(hypothèse)`, `(estimation)` otherwise. `lf` refuses a text that uses a non-reported figure without its tag. The panel writes `†` and `*`, with its legend; the drawings `‡` and `*`, with a legend on each sheet and a red box for model results. The part sheets have no legend, so they write the words.
- **Names.** No person, company or brand outside the Sources panel. « Un projet de texte pour une ville américaine » stands for the draft of research §2.7, conflict 9. A builder is « une constructrice » or « un constructeur », a designer « un concepteur ».
- **Words.** The panel's: bidon, cheminée interne, banquette, conduit, tube, couvercle. English follows British spelling: **draught** for a chimney's pull, and **draft** only in « a draft text ». The panel and the scenarios' lessons write it too.
- **Said once.** « Educational reconstruction » and the full warning: the Sources panel. « This lab explains, it gives no plan »: the first overview. « Not a plan to follow » and « not a procedure »: the first step of each guide. « No model can say an installation is safe »: the CO alarm's sheet (the panel says it once of its own). The rocket cook stove against a mass heater: the first overview where the word is defined, and lesson 6 where it says when the machine is wrong. Each hazard: the step of the guide where the gesture is risky, and once together in the Sources panel. Tests count them.
- **Two readings of « à plein feu ».** « À plein feu » is the model at 09:00; « en moyenne d’un feu » is the settled day's mean over a burn, and they differ: chamber 485 and 467 °C, exit at the cap 90 and 80 °C, whole draught 16.4 and 15 Pa. The notice on reading the figures (`noticeReading`, Sources panel) says it once. Along the path at 09:00 the gas is at 114 °C at the end of the bench, 103 °C at the ceiling, 90 °C at the cap: a sheet gives the figure of the place it describes.
- **Pressures.** Against the air beside it, as `state.pathP`: negative, a leak lets air in; positive, it lets gas out. The minus sign is printed. `manifold` says the convention, once, and a test counts it; the panel says it beside its own figure. At 09:00: −8.9 Pa under the lid, −13.5 Pa at the drum's foot, −13.9 Pa at the duct's mouth, about −14 Pa along the duct. The 15 Pa is the whole draught, never the pressure of a place.
- **Words that promise.** No « sans risque », « sûreté », « nuit à personne », « et rien de plus », « geste de sécurité », and this fire is never called clean, in a sheet or on a drawing: « propre » is only a builder's word for a range, attributed (`burn-tunnel`, PL-02), against the model's 467 °C and 1,470 mg/MJ. Tests hold them.
- **What the eye says.** A settled conflict: `feed-tube` and research K20 are right, the eye cannot judge carbon monoxide. `chimney-cap` says white steam from grey smoke, and that a clear cap says nothing of the gas. The plume of the 3D draws the model's map (`smokeAtCap`, `steamAtCap`): steam during a fire, smoke once the wood stops, and more smoke on wet wood; the neighbour's smoke is scenery.
- **Tools.** A tip names only a tool its world has: `WORLD[id].cutaway` false means no « Coupe » in `fire-core` and `homestead`, `slowMo` false no « Ralenti » in `homestead`, no thermal view in either. Isolating hides everything else, so a tip never asks to look at what is around an isolated part. A test holds what it can read in `WORLD`. The word « Flux » shows the gases' path and, in the core, the pressure's beads; it does nothing to the plume at the cap.
- **Origin of a guide step.** The last sentence of its text: `Origine : rapporté`, `pratique courante` or `notre reconstitution`, sometimes with a precision. No torque, no duration, no recipe figure.
- **No recipe.** No brick layout, no mix or mortar, no curing or firing schedule, no inner size of the core (feed, tunnel, gap as a build size, insulation, sleeve): a test checks the `dims.ts` values never reach a sheet. A draft text's ratios and clearances appear only as its words, attributed, and the clearances only on `heat-shield`, called « neither a rule nor a safe value ». Tips point at the simulation and the 3D, never at a gesture on a real fire.
- **Numbers.** Every number of a visitor text is in `FIG` or in the commented list of the test, with its source. Model figures are recomputed by the test.
- **Quotations.** None. A source read in summary or through a transcript is paraphrased; a test holds a list of the suites a reader could recognise.
- **What is not linked.** `NOT_LINKED` in `src/data/sources.ts`: the gallery video, whose end sells plans, seen and credited without a link (the owner's rule for this lab is to link nothing that sells plans); the tin-can tutorial, the three pages that sell plans, a book's sales page. The two books have no link at all.

## What rests on a source read only in summary

Used in the lab's own words, never quoted, listed for the re-reading `docs/research.md` §9 asks for before a visitor sees them. `f` a fetch summary, `s` a search summary, `W` a local transcript, times to check.

| Fact                                                                           | Source          | Where                                                                                 |
| ------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------- |
| session 2 to 4 h, 1 to 2 loads an hour, 2.0 to 3.6 kg/h, 540 to 815 °C, 57 lb  | S11 (f)         | `wood-basket`, `fuel-sticks`, `burn-tunnel`, `ash-bucket`, lesson 4, install `winter` |
| 9 to 18 kg a day for 74 m²; 0.84 m, 0.64 to 1.27 m; 2 inches                   | S13, S14 (s)    | `wood-basket`, `heat-riser`, `top-gap`, assembly `riser`: said to be read in a digest |
| a draft text: 9 to 15 and 18 m, casings, slab, clearances, heights, no damper  | S15 (f)         | `cob-bench`, `duct-*`, `cob-casing`, `hearth-slab`, `heat-shield`, `bench-backrest`   |
| 312 ppm, a calculated efficiency                                               | S17 (f)         | lesson 2                                                                              |
| tens of ppm on pine, under 100, damp oak, climbing after two-thirds            | S18 (f)         | `moisture-meter`, `fuel-sticks`, lesson 2                                             |
| 54 to 60 °C, 32 to 38 °C, a greenhouse                                         | S21 (f)         | `cob-bench`, lesson 4                                                                 |
| 15 sensors, about ten metres, over 90 % on 8 to 10 feet                        | S22 (f)         | `temperature-lance`, `duct-hot-run`                                                   |
| 68.5 to 79.7 %                                                                 | S20 (f)         | `flue-thermometer`, lesson 3                                                          |
| 75 %, +/- 85 %; 61.8 %                                                         | S11, S26 (f)    | `flue-thermometer`, lesson 3                                                          |
| 1,200 °C, 760 °C, 80 to 100 °C, the table of two loads, a designer on a damper | S16 (f)         | `heat-riser`, `riser-sleeve`, `flue-thermometer`, `feed-lid`, lesson 5                |
| EN 15544: 12 to 20 %, 5 to 10 cm, fireclay, 4.16 kWh/kg                        | S29 (f)         | `moisture-meter`, `fuel-sticks`, `firebrick-base`, `woodshed`                         |
| the moisture formula: 4.27, 3.98, 3.39                                         | S48 (s)         | `woodshed`, lesson 2: said to be read in summary                                      |
| the alarm's times, EN 50291-1                                                  | S35 (s)         | `co-alarm`, lesson 6: « according to makers' manuals »; one patent differs            |
| smoke alarm 2015, a French CO alarm not compulsory                             | S36 (s)         | `smoke-alarm`: said to be read in summary. 3,000 and about a hundred are read (t)     |
| the peer-reviewed model's directions                                           | S12 (metadata)  | `top-gap`, `feed-lid`, lesson 1: said to be read in summary                           |
| bench stones, no fibre, the gasket; the upkeep; 15 years of building           | S51, S6, S4 (W) | `stone-filler`, `drum-seal`, `kindling-block`, `chimney-flue`, `heat-riser`           |
| the law, place by place                                                        | §7.3            | `LAW`: each line says how it was reached                                              |

## Departures from the research

- **§4.5, the guides.** A kit step plays in one world, so step 15 (`temperature-lance` in the bench, `flue-thermometer` in the room) and step 20 (the core and the room) cannot stand. The thermometer goes with the chimney (14), the probe with the earth (15), and the first fires (19, `feed-lid`, `fuel-sticks`, `ash-bed`) are told apart from a winter in the room (20, `wood-basket`, `kettle`, `bench-cushion`, `inner-stone-wall`). Still twenty, each id once.
- **§4.4 `pebble-section`,** « lighter, quicker »: the model's estimate has it denser than our cob, so « lighter » is not said. « Quicker » is said as our reading: no mixing and no drying.
- **§4.3 `top-gap`,** « too small and the whole machine chokes »: said of the published model, and said that ours does not find it.
- **§0.1 and the texts of the research on the bench**: what the physics found is used instead (one to two hours after the flame, the drum twice the bench).
- **§4 `manifold`,** a chamber in the research: the 3D draws a steel box behind the drum (`src/three/dims.ts`), so the sheet says so and adds that others build it in masonry. `drum-plinth`, `chimney-cleanout`: a ring and a cap, as `dims.ts` draws them.

## Tests

`npm test`: `src/data/data.test.ts`. The catalogue against the research, the structure of every sheet, what the sheets must say, parity and typography, British English, no research code, no name, no quotation, what is said once, no recipe, every number sourced, every model figure against `src/sim`, every id of the guides once, each step's origin and warnings, every link of the research but those not to be linked, the law's lines, `public/lab.json` and the README. `src/data/lessons.test.ts`: `docs/lessons.md`.
