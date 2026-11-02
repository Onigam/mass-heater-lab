# Narration scripts (French and English)

`fr.json` and `en.json` follow `lab-kit/docs/narration.md`: **61 segments each** (`intro`, 4 worlds, 56 parts: house 11, room 18, core 14, bench 13), ids `intro`, `scene-<world>`, `part-<id>`, no lesson segments. **No audio exists yet.** This lab uses the local voice (`--engine voicebox`, profiles `Onigam narrateur FR` and `EN`, 0 credit, the Voicebox application open); the session that orchestrates the lab generates it after these checks, and the agent that writes this script never does.

Check the length without generating anything (`HOME=<empty dir>` keeps the tool from even opening a key file):

```
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/fr.json --out public/audio/fr --dry-run --engine voicebox
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/en.json --out public/audio/en --dry-run --engine voicebox
```

## Budget (spoken characters, cues removed)

| Language | Total  | Intro | Worlds                                                 | Parts  | Longest parts                                                                       |
| -------- | ------ | ----- | ------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| French   | 22,708 | 2,380 | 2,648 (house 707, room 669, core 577, bench 695)       | 17,680 | `feed-lid` 493, `co-alarm` 480, `feed-tube` 468, `cob-bench` 451, `steel-drum` 429  |
| English  | 21,352 | 2,211 | 2,573 (house 691, room 646, core 553, bench 683)       | 16,568 | `feed-tube` 473, `co-alarm` 457, `feed-lid` 451, `cob-bench` 427, `steel-drum` 415  |

The ceiling is 30,000 per language; the brief asked for about 20,000 to 22,000 (`src/narration.test.ts` holds 20,000 to 23,000). `generate.mjs` refuses a segment over 2,500 characters. The median part is 293 characters in French, 282 in English; the hero parts of the research (`steel-drum`, `cob-bench`, `feed-tube`, `co-alarm`) get more, and `feed-lid` too because it carries the damper. `cob-casing` (337) gave characters back: the budget would not hold six heroes at 400.

## Register

Pelton Lab's tone (`lab-kit/docs/narration-style.md`). The thread is **one breath of cold air**, « un souffle d’air froid »: it enters at the feed, is pulled sideways into the fire, climbs, falls down the drum, crawls under the bench, and leaves with just enough to make the chimney draw. It is in the intro and in nine parts. It does not leave « almost cool » as the research imagined: the model has it at about 90 °C at full fire, 80 °C as the mean of a fire. Warmth is the feeling: the hand on the bench in January (intro), the blanket and the book (`cob-bench`), the blanket that hides a crack (`bench-cushion`), the wood split before dark (`kindling-block`). The intro closes on « installez-vous : la banquette est encore tiède », not on « à vous de jouer », which sounded wrong just after a warning.

## The truths, each said once (`src/narration.test.ts` counts them)

| Truth                                                                                       | Where                 |
| ------------------------------------------------------------------------------------------- | --------------------- |
| Educational reconstruction, generic machine, it explains and gives no plan                  | `intro`               |
| Figures from the simulation unless a source is quoted: calculations, not measurements       | `intro`               |
| About 78 % delivered; no independent test of such a machine found                           | `intro`               |
| The one warning: fire and carbon monoxide can kill; an alarm, the insurer, the law          | `intro`               |
| No model can say a real installation is safe                                                | `intro`               |
| A fire here is a tended session of two to four hours                                        | `intro`               |
| 80 to 90 % less wood does not balance from the stove alone; insulation does most of it      | `scene-homestead`     |
| Same name, another machine: the rocket cook stove belongs outdoors, a mass heater has a chimney | `scene-homestead` |
| The drum gives about twice the bench's heat, in bursts                                      | `scene-living-room`   |
| The bench gives a little, day and night, and does not carry the house alone                 | `scene-living-room`   |
| The seat peaks one to two hours after the flame (« four to eight hours » is refused everywhere) | `scene-bench-section` |
| False colour                                                                                | `scene-bench-section` |
| No closing damper, and why, with the scenario's 38 minutes                                  | `part-feed-lid`       |
| The least sure figure of the lab, the turn of a cold flue                                   | `part-chimney-tee`    |

**Why the warning is in the intro.** The research (§0.6) proposed `co-alarm`. But a part is played only by someone who clicks it, and the intro is the way in: everyone who hears anything hears this. So `co-alarm` explains the gas and what the alarm cannot do, without the verb « tuer »: a test holds the word to the intro. If the owner prefers it on `co-alarm`, the sentence moves as it is.

**Why the false colour is in the bench's world.** The overview says it in the room, but there the voice cannot switch the thermal view on (below). In `bench-section` the cut faces carry the map at all times, so the sentence is said when the colours are on the screen.

**Why 78 % and the claim are not on their sheets' parts.** `flue-thermometer` says 82 % and « four points more than the house keeps »; `coppice-lot` gives the sums (55, 7, 85) without restating the claim; `smoky-neighbour` says « to cut your wood by ten », which is the sheet's 8 % stove in other words, the closest thing to a second mention.

**Hedges.** « dans le modèle » is never said. « notre modèle », « notre calcul », « notre scénario », « notre estimation » appear only where a figure stands against a source or where the model is itself the subject (14 segments, a test caps them at 14). The word « mesure » only denies a measurement or asks for one (`intro`, `duct-hot-run`, `stone-filler`, `temperature-lance`): a test holds the list.

**Anonymous.** « une constructrice », « un concepteur », « un manuel français », « un projet de texte », « une vidéo », « le seul article revu par des pairs ». The international health body the sheets name is « les repères sanitaires », « the health guidelines ». A test refuses every name of the Sources, and the intro says once that the Sources panel says who said what.

**Other safety lines, once each, short:** the burn and the recovered drum (`steel-drum`), what to do when the alarm sounds (`co-alarm`), smoke and flame back at the feed (`feed-tube`), the lid never over embers (`feed-lid`), the distance at the ceiling (`ceiling-crossing`), natural wood only (`fuel-sticks`), a refitted drum never restarted at night (`drum-seal`), hot ash (`ash-bucket`), a grille never blocked (`ventilation-grille`).

## What the sheets say and the voice does not

The corrections of 2/11/2026 brought the sheets into line with what this section used to list as their faults: a fire called clean, words that promise, a clear cap read as a good fire, a pressure with no sign, a peak read as a crossing time, tips naming a tool their world does not have. `src/data/data.test.ts` now holds them, so the list below is only what differs by choice.

- **« Combustion propre »** is a builder's word for a range, on the sheets and in the voice (`burn-tunnel`). `docs/physics.md` §1.4 gives 1,470 mg/MJ over a day, six times the only measured masonry heater, and its chamber at 467 °C is under the 540 to 815 °C that builder calls clean. The voice says the smoke finishes burning here « on three conditions » (`heat-riser`).
- **« L’OMS »** (`co-alarm`, `feed-lid`, `ventilation-grille`): an institution. Said « les repères sanitaires ».
- **`cob-casing`**: the sheet gives the seat's peak, 1.2 to 1.7 h after the wood stops and 4.3 h after the fire began, and says it is no crossing time. The voice says only that the simple sum announced a much later peak, and why.
- **`manifold`, `manifold-cleanout`**: the sheets print −13.5 and −13.9 Pa at 09:00, with their sign, and `drum-seal` −8.9 Pa under the lid. No figure of pressure is spoken on the first two.
- **`burn-tunnel`**: the tip says the flame runs from left to right, as the 3D draws it. The voice says « à l’horizontale », which holds from any side.
- Read only in summary, said anyway, as the sheets do, and the lead may want them re-read: the two sweeps a year (`sweep-access`), the smoke alarm's obligation (`smoke-alarm`).
- Formulas, W/m²·K, kN/m², ppm by value on `drum-seal`, the clearances in inches: they stay on the sheets. The clearances were never to be spoken (research §7.4).

Figures spoken that no sheet prints as such: « environ six cent cinquante kilos par mètre carré » (`hearth-slab`, from 2,962 kg over 0.5 × 9 m, in place of 6.5 kN/m²), « un cinquième de moins » (`woodshed`, 3.39 against 4.27 kWh/kg), « neuf fois » (`ash-bed`, 2,000 against 230 ppm, with « en ordre de grandeur »), « plus que tripler » (`moisture-meter`, 850 against 230 ppm), « du simple à presque neuf fois plus » (`cob-casing`, 0.12 to 1.06 W/m·K), « trois degrés » (`moisture-meter`, 20.2 against 16.9 °C).

## Cues (95 in each language, the same in both)

- Totals: frame 25, flows 20, cutaway 12, home 10, explode 10, mode 6, scene 5, xray 4, isolate 2, select 1. Every « on » has its « off » before the end of the segment.
- Intro (22): `home`, `frame` the house; `scene` to the core with three `frame` along the gases; `scene` to the room, `frame` the bench; `scene` to the bench with `cutaway` on and off; `scene` back to the house, `frame` the cap, `home`; then `mode` hops assembly, install, sim, lessons, plans, explore, `scene:homestead`, `select:none`.
- Worlds: `home` first, one `frame` per element named. `cutaway` in the room and the bench, `flows` in the core. None in the house, which has no section and whose X-ray needs a selection.
- Parts: no camera cue. `flows` on `chimney-cap`, `outside-air-inlet`, `manifold`, `feed-tube`, `burn-tunnel`, `top-gap`, `downdraft-annulus`, `duct-bend`, `chimney-tee`; `cutaway` on `cob-bench`, `duct-hot-run`, `cob-casing`; `xray` on `steel-drum`, `heat-riser`; `explode` on `hearth-slab`, `fuel-sticks`, `firebrick-base`, `drum-plinth`, `floor-barrier`; `isolate` on `duct-joint`.
- Spacing: camera cues at least 35 spoken characters apart, counted on the spoken text. The test reads `WORLD` in `src/three/index.ts`, so a section or an X-ray where a world does not allow it fails.
- **The thermal view cannot be cued.** `src/lab.ts` has no `narration.onCue`, and the kit has no cue for it. So the voice says where the button is (`intro`, `scene-living-room`, `part-cob-bench`) and the wonder plays in `scene-bench-section`, whose cut faces carry the map at all times. For the lead: `narration.onCue(ctx, name, arg)` with `ctx.sim.set({ thermalView: arg === 'on' })` would let `scene-living-room` show it; the last sentence of that segment would then become a cue.
- **The clock.** The sim opens at one hour per second, a day in 24 s, and the voice says so once (`scene-bench-section`, held to `DEFAULT_TIME_SCALE` by a test). A visitor who slowed the clock will see less. The flows only move when the fire burns, so no sentence says « regardez » about the dots.

## Checked

`npx vitest run src/narration.test.ts`: the contract, ids, scopes and starting worlds, known cues on real ids, frames in the current world, what is switched on is switched off, tools per world, no camera cue in a part, 35 characters between camera moves, the hops of the intro, each truth once in its place, what is refused everywhere, **53 spoken figures held to today's `src/data/figures.ts`** (so a change of the physics names the segments to rewrite), the word « mesure », the hedges, the controls named by the voice against the panel's own words, the breath of air, no name, spoken text only, sentences at most 135 characters, exclamations and questions, no « tu », British English, the budget, no run of seven words from the private transcripts (`~/.cache/lab-review/research/mass-heater-lab/`, 18 files, both languages), the same cues in the same order within a tenth of the segment between languages, and the manifests once they exist, in the local voice.

`node ~/Dev/lab-kit/tools/narration/tone-stats.mjs narration/fr.json`, against Pelton's script:

| Measure                      | French | Pelton | English | Pelton's English | Why they differ                                                                                                                                                      |
| ---------------------------- | ------ | ------ | ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Average sentence, characters | 68     | 79     | 63      | 69               | Subtitles cut at sentence ends, and the rule since Pelton is short sentences: the same as the sand lab (70, 67), Mill (71), Piggott (67)                              |
| Sentences over 120           | 1      | 35     | 0       | 2                | Pelton's 35 are its one departure from its own rule. The French one is the warning (127), kept as one sentence as the brief asks                                       |
| Exclamations per 1,000       | 0.75   | 0.80   | 0.80    | 0.83             | Held there on purpose                                                                                                                                                 |
| Questions per 1,000          | 0.53   | 0.29   | 0.56    | 0.35             | Above Pelton, like Mill (0.43), the sand lab (0.42) and Piggott (0.48). This lab is an inquiry: for which house, who draws, who is right. Twelve questions in all     |
| « tu », digits or symbols    | 0      | 0      | 0       | 0                |                                                                                                                                                                       |

## To listen for in the sample (not measured, a script cannot tell)

French: rocket, tube en J, faîtage, humidimètre, bûchettes, manique, le té, thermocouple, pascals, kilowattheures, « parties par million », « zéro virgule six watt par mètre et par degré » (`cob-casing`, the hardest passage), « deux mètres soixante-dix ». English: J-tube, coppice, thermocouple, pascals, kilowatt-hours, « zero point six watts per metre per degree », « parts per million ». Nobody has listened to anything yet.

## After generation

`src/lab.ts` already asks for `audio/{lang}/manifest.json` and `scripts/check-narration.mjs` is in the build. Then back-transcription, rate and subtitles, as `lab-narrator` says.
