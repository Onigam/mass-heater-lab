# Independent review of Mass Heater Lab

- **Date:** 2026-11-04. **Commit:** `bc6a93b` on `main`. The bundle online at https://mass-heater-lab.onigam.io/ has the same hash as this commit's build (`index-BowAkRK_.js`).
- **Reviewer:** an agent that built none of this lab. First independent review of it.
- **Walked:** dev server, Chrome for Testing on Metal, 1280, 1024, 768, 600 and 390 px, French and English, dark and light. About 310 screenshots, of which about 180 displayed and read, most through contact sheets. Folder: `~/.cache/lab-review/mass-heater-lab/review-2026-11-04/` (`shots/`, `flicker/`, scratch scripts in `tools/`). All paths below are relative to `shots/`.
- **Measured:** every part at 6 camera directions by rendering the world with and without it (`vis2-all.json`), the label boxes at 5 sizes in both languages (`homes.json`), each tool in each world, the 12 scenarios, the guide's state at every change, the flicker tool.
- **Console:** no error, no failed request, in any run.

## Gates

| Gate                   | Result                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | pass                                                                                                                            |
| `npm run format:check` | pass                                                                                                                            |
| `npm test`             | 551 passed in 19 files                                                                                                          |
| `npm run build`        | pass                                                                                                                            |
| Standard's shortfalls  | none: `standard.test.ts` lists no todo (4 worlds, 56 parts, 20 + 10 steps, 6 lessons, 12 questions, 10 sheets, 122 audio files) |

All of the blockers below pass these gates. `labels.test.ts`, `machine.test.ts` and the rule « no inner size » each test something that does not catch what the visitor gets (D5, D7, D2).

## Reading for safety

Asked of a lab about a fire in a closed room: does anything reassure, or read as a build plan or a procedure?

- **The words hold.** « sûr / safe » appears only to deny it. The intro warns once, `co-alarm` explains what the alarm cannot do, lesson 6 asks the right question (« a domestic alarm has not sounded, what can be deduced? »), the guide steps say « reconstruction, not a procedure », « these are no lighting instructions », and give no mix, no brick plan, no schedule. I read 4 assembly steps in full and parts of 3 more, 6 installation steps, most of the sheets of `co-alarm`, `feed-lid` and `steel-drum`, lesson 6, the Sources' notices, the intro, the 4 worlds' scripts and 6 part scripts.
- **Three things on screen do not hold:** a green « ✓ Tout fonctionne » with « CO, pièce 0 ppm » (D4); the sheet's automatic envelope, which prints the inner sizes of the core the lab says it refuses (D5); no fire or CO line visible unless the visitor goes looking (D6).
- **For the owner's judgement, not defects of fact:** PL-03 under the heading « Plans de conception » (D19), and the intro's last words, « Allez, installez-vous : la banquette est encore tiède ! », which come a few seconds after « aucun modèle ne peut dire qu'une vraie installation est sûre ». `narration/README.md` explains the choice. Only an ear can judge it.

## The rules of `lab-quality.md`

| Rule                                                 | Result                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| §1 Moving parts attached to what drives them         | ✓ on what was looked at (flue bands, cap, drain, probe, lid on the rim in the room). Lid: D2                                 |
| §1 Nothing floats, nothing sinks                     | ✓ on the 12 close-ups of `sheet-hero.png` and in `machine.test.ts`. Not every part at ground level                           |
| §1 Right way, right speed                            | ✓ the flame runs feed to riser, the dots go the gas's way (`sheet-flux.png`). Nothing turns                                  |
| §1 A part sits where it acts                         | ✓ the lid's sheet says when it goes on. In its own world it is not drawn: D2                                                 |
| §1 Maker's dimensions first                          | ✓ generic machine, each figure tagged; drum from a sellers' range                                                            |
| §2 Same machine everywhere                           | D2: the lid, the seal and the rim exist in the room and not in the core. Else ✓ on sight and by test                         |
| §2 Every system has a place                          | ✓ four worlds, each with its own subject                                                                                     |
| §2 A tool that teaches nothing is left out           | D10, D20                                                                                                                     |
| §3 Every prop reads as what it is                    | ✓ house, shed, neighbour, spruces, drum, kettle, alarm, drain jar, probe (`sheet-hero.png`). Not all three distances for all |
| §3 Polish pass                                       | ✓ on all four homes                                                                                                          |
| §3 Water (here fire and gas) follows the physics     | ✓ on a sample; `docs/water.md` read, its table not audited line by line                                                      |
| §3 The device can be found in its setting            | ✓ « La maison → » from the first view                                                                                        |
| §3 Warm, stable picture                              | ✓ looks warm. Flicker: D21                                                                                                   |
| §4 Camera turns around what you look at              | ✓ measured in four worlds; the pivot is the point under the pointer. What it turns towards: D1                               |
| §4 Nothing crushed at any width                      | ✓ sheet and tabs at 1280, 768, 600, 390. Labels: D7                                                                          |
| §4 The guide is the way in                           | ✓ invitation on first visit, though it covers the title: D15                                                                 |
| §5 As much detail per device as Pelton               | ✓ exploded, x-ray, section, flows, lessons, 10 sheets                                                                        |
| §5 Title and description say what it is              | ✓ in the lab, both languages. On the showcase card: D11                                                                      |
| §5 README English first, French at the end           | ✓ with stale lines: D22                                                                                                      |
| §6 Simulation never tuned to the source              | not checked: read in the README and `docs/physics.md` only                                                                   |
| §6 Said once, no research references                 | ✓ no « (K22) » reaches the visitor (searched). Model tags repeat: D17                                                        |
| §7 Tone, subtitles, « Voix de synthèse », 3D follows | Tone not judged. Subtitles and label ✓ both languages. 3D follows, with frames that miss: D3, D8                             |
| §7 Sample first, the owner listens                   | not checked: `narration/README.md` says « not yet by a human ear »                                                           |
| §7 Transcribed back, played in both languages        | played ✓; back-transcription not re-run, taken from the README                                                               |

## The owner's past finds

| Find                                   | Here                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| Spring in the void, chain not attached | Nothing of the kind seen. But an outline with nothing in it on the lid and the seal: D2 |
| Wheel turning backwards                | No wheel. The flame and the dots go the right way                                       |
| Specs crushed under a long text        | ✓ tabs, readable at 390 and 768 (`specs-390-fr.png`, `specs-768-en.png`)                |
| Untranslated title                     | ✓                                                                                       |
| Fixed camera pivot                     | ✓ the pivot follows. What the camera finds in front of it does not: D1                  |
| Missing equipment room                 | ✓ every system has a world                                                              |
| Jellyfish tree                         | ✓ spruces and bare trees read                                                           |
| Sunk generator                         | ✓ nothing sunk in what was looked at                                                    |
| A lab called finished with two worlds  | ✓ four worlds, `lab.json` says `building`                                               |

## Defects

Severity as in the reviewer's brief. **Who:** `3D` is `lab-modeler`, `author` is `lab-author`, `voice` is `lab-narrator`, `lead` is the lab's lead, `kit` is lab-kit, `showcase` is onigam-labs.

### Blockers

**D1. Turn the camera, click a part: a wall, a hillside, or an empty outline.** Who: 3D. No part has a `viewDir` (`grep viewDir src/three src/data`: 0 lines), so a click keeps the camera's direction, wherever it stands. Measured with the camera turned to 6 directions, 56 parts, 336 cases: **116 show under 10 % of the part, 100 show nothing at all.** Leaving out 4 parts that fail for other reasons (`top-gap` and `downdraft-annulus` are gas spaces that draw next to nothing; `feed-lid` and `drum-seal` are D2): **92 of 312 under 10 %, 77 at nothing; 38 of the 52 parts fail in at least one direction, 19 in three or more.**

| World           | Cases | Under 10 % |
| --------------- | ----- | ---------- |
| `homestead`     | 66    | 8          |
| `living-room`   | 108   | 21         |
| `fire-core`     | 60    | 26         |
| `bench-section` | 78    | 37         |

What it looks like, all in `sheet-turn.png`:

- `bench-section` at 180°: the whole picture is plaster, with an outline drawn on it (`turn180-bench-chimney-tee.png`, `turn180-bench-duct-hot-run.png`). This wall does not step aside.
- `homestead` at 120°: the camera is behind a slope of snow and a spruce, the house is an outline on them (`turn120-home-house-shell.png`); the woodshed is behind the house's roof (`turn120-home-woodshed.png`); the moisture meter is behind the chopping block (`turn180-home-moisture-meter.png`).
- `living-room` at 180°: the CO alarm and the grille step aside with their wall, leaving an outline in the air (`turn180-room-co-alarm.png`, `turn180-room-ventilation-grille.png`). The CO alarm is the part this lab leans on most, and its segment then plays over nothing. The stone wall goes the same way at 120° (`turn120-room-inner-stone-wall.png`).
- `fire-core` at 180°: the sheet of the shield covers the core, the dots hang in the air (`turn180-core-heat-riser.png`, `turn180-core-burn-tunnel.png`).

Fix: a `viewDir` per part in `registry.add`, as the siblings had to. Every part of the machine in `fire-core` and `bench-section` needs one.

**D2. The feed's lid and the drum's seal are not drawn in their own world.** Who: 3D. `feed-lid` and `drum-seal` give **0 pixels in all 6 directions** in `fire-core`. The visitor clicks « Le couvercle » and gets an orange rectangle with the fire showing through it (`sel-core-feed-lid.png`, `core-feed-above.png`), while `part-feed-lid` tells why the lid and the absent damper matter. The same lid is there in the room (`hero-feed-room.png`).

Cause, read in the page and the source: `clips.run.clip(...)` in `src/three/machine/assembly.ts:144-145` writes its planes on materials the core shares (`mats.steelDark`, `mats.gasket`, `mats.insulation`, used again in `machine/flue.ts`). `clipMaterial` in `section.ts` overwrites whatever was there, and its own comment says « a material used by two sets must be cloned first ». So in `fire-core` these meshes carry the run's planes (z −2.25, x 2.75, intersection) and not the core's (z −1.85):

- gone entirely: `feed-lid`, `drum-seal`'s gasket, and the `feed-rim` of `feed-tube`;
- `riser-insulation`'s volume goes too, and only its flat cap stands for it.

The same planes apply in `living-room` when Section is on: expected there too, not shot. `machine.test.ts` tests that the lid sits on its rim by geometry, so it passes. A test that each piece of the core carries `clips.core`'s planes would have caught it.

**D3. From the first view, with no turn: click and the part is not seen.** Who: 3D, then voice. Same missing `viewDir` and `frame`, on the most natural path:

| Part            | Seen of the part | Of the picture | What the visitor gets                                                                              | Shot                                                                 |
| --------------- | ---------------- | -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `duct-bend`     | 0 %              | 0 %            | The camera lands behind the chimney: a grey pipe fills the view, an outline on it                  | `sel-bench-duct-bend.png`                                            |
| `chimney-tee`   | 21 %             | 0.5 %          | The pebble bench's planks in front. **The voice frames it too**, « plus loin, le té »              | `sel-bench-chimney-tee.png`, `nar-fr-scene_bench-section-04-t11.png` |
| `manifold`      | 12 %             | 0.6 %          | The drum, with an outline on it. `docs/3d.md` calls this a weak point; selecting does not solve it | `sel-room-manifold.png`                                              |
| `smoke-alarm`   | 32 %             | 0.8 %          | The beam and the ceiling, the alarm behind the beam                                                | `sel-room-smoke-alarm.png`                                           |
| `duct-joint`    | 10 %             | 0.02 %         | The whole world from afar: its 5 joints set the box                                                | `sel-bench-duct-joint.png`                                           |
| `floor-barrier` | 8 %              | 0.09 %         | The whole world from afar                                                                          | `sel-bench-floor-barrier.png`                                        |
| `riser-sleeve`  | 2 %              | 0.08 %         | An outline inside the drum: the sleeve is a thin line in the section                               | `sel-core-riser-sleeve.png`                                          |
| `core-casing`   | 16 %             | 0.37 %         | Far away, its label covered (D13)                                                                  | `sel-core-core-casing.png`                                           |

24 click pairs (A then B) changed nothing: the direction stays, so the same parts fail the same way, and nothing stays open behind.

### Major

**D4. A green « ✓ Tout fonctionne / All good » and « CO, pièce 0 ppm ».** Who: lead for the pill, author for the tile. The pill sits on every screen of a lab whose first rule is « no model can say an installation is safe », and in the Simulation it stands beside a tile reading `0 ppm †` with no band (`sim-charts-1.png`). The README says CO is « a regime and a band of a factor of three each way ». It does not lie about alarms: the 12 scenarios never show it with room CO above 0.1 ppm, and the red pills come as they should (`sim-damper.png`). But the words reassure.

- The pill is the kit's `allGood` when `stripAlarms` is empty (`dist/ui/app.js:537`). `registerStrings` writes in the same table, so the lab can probably say « Aucune alerte du modèle / No alert in the model » from `src/i18n/ui.ts`. Not tried.
- The tile (`liveRoomCo`, `src/panels/strings.ts:106`) could show the regime, or « not modelled without a leak », in place of a 0.

**D5. The sheet's automatic « Encombrement » prints the inner sizes of the core.** Who: kit (a part must be able to refuse it), lead. `src/data/parts/dim-specs.ts` says « no inner dimension of the core (feed, tunnel, gap, insulation, sleeve) is printed », `docs/drawings.md` the same of the sheets, and the README says « overall sizes only ». The kit adds a row to the Specs tab of every part from its box (`dist/ui/panels/part.js:18`), so a visitor reads (`envelopes.txt`, `specs-768-en.png`):

| Part               | Printed             |
| ------------------ | ------------------- |
| `feed-tube`        | 330 × 202 × 330 mm* |
| `burn-tunnel`      | 820 × 240 × 400 mm* |
| `heat-riser`       | 230 × 690 × 230 mm* |
| `riser-insulation` | 334 × 686 × 334 mm* |
| `riser-sleeve`     | 340 × 690 × 340 mm* |
| `top-gap`          | 577 × 43 × 575 mm*  |
| `drum-plinth`      | 622 × 160 × 653 mm* |

The `*` says « our generic drawing », in the Sources panel. Side by side, tab by tab, this is the core's sizing, and no test sees it because it is not in the lab's data. Some rows are also meaningless to the eye: `duct-joint` says 2,92 × 0,27 × 2,43 m, because the box holds all five joints.

**D6. No fire or carbon monoxide line unless the visitor looks for it.** Who: owner's decision, then lead or kit. None of the 4 overviews carries one: the first screen says « Ce labo explique, il ne donne aucun plan » and nothing about danger. The warning lives in the voice's intro (opt-in), the `co-alarm` sheet (a click), lesson 6, PL-10, some guide steps, and Sources (the eighth mode). BRIEF §8 says « show the warnings prominently » on a risky topic, §6 of the quality rules says « once, where they matter ». `docs/kit-requests.md` 3 already asks for a banner. One sentence in the `homestead` overview would do until then.

**D7. Default labels cut by the panel or the screen's edge at every size under 1280.** Who: 3D (anchors), or kit (a label that flips at the edge). Main labels only, all 4 worlds, labels cut:

| Size     | French | English |
| -------- | ------ | ------- |
| 1280×800 | 0      | 0       |
| 1024×768 | 4      | 3       |
| 768×1024 | 7      | 5       |
| 600×800  | 2      | 2       |
| 390×844  | 5      | 4       |

Worst is `fire-core`, where « L'ESPACE SOUS » and « LA CHUTE » run under the panel at 768 (`home-fire-core-768-fr.png`), and off the phone (`home-fire-core-390-en.png`). Also `sheet-labels-1024.png`, `sheet-labels-600.png`; every case in `homes.json`. No overlap among main labels at any size. `labels.test.ts` does not see it: it checks a label's whole width only in a view over 700 px, and 768×1024 leaves a view of 380 px with the panel open. 1024×768 (636 px) and 600×800 are not among its sizes. Its comment accepts a long label off a phone's edge « as every lab's does »: the owner may accept that too. Under the panel at 768 and 1024 is another matter.

**D8. Frames of the voice that miss what is named.** Who: 3D (`frame`, `viewDir`), voice if a cue moves. On top of the tee (D3):

- `scene-living-room`, « Le mur de pierre, lui, garde sa part »: the wall is edge-on, the room pushed to the right (`nar-fr-scene_living-room-05-t16.png`).
- `scene-living-room`, « voici les deux détecteurs »: both are framed small, and the smoke alarm is cut in half by the beam (`nar-fr-scene_living-room-04-t12.png`).
- `intro`, « il rampe maintenant sous la banquette »: a small room in the middle of the picture (`nar-fr-intro-06-t36.png`).
- `scene-bench-section`, « Le début du conduit et sa fin, côte à côte » and « la terre et ses pierres »: **the camera moves back from the home view** at the moment it is told to look (`nar-fr-scene_bench-section-01-t4.png`, `-02-t7.png`).
- `intro` and `scene-fire-core`, the fall along the drum: the drum small, at mid-distance (`nar-fr-intro-05-t29.png`, `nar-fr-scene_fire-core-05-t15.png`).

**D9. Large parts frame so far that nothing can be read.** Who: 3D (`frame`). `cob-bench`, a hero part, gives 0.6 % of the picture with the camera about 20 m away; `hearth-slab` 0.4 %, `inner-stone-wall` 0.6 %, `stone-filler` 0.12 %, `bench-cushion` 0.23 %. In `sel-room-hearth-slab.png` the room is a third of the picture and the slab a thin line under it. In `sel-bench-stone-filler.png` the stones cannot be seen. `homestead` too: `smoky-neighbour` at 76 m.

**D10. « Flux » does nothing on the first screen.** Who: 3D or kit. In `homestead` the picture with Flux on differs from Flux off no more than the noise of the clock (1.49 % against 1.36 % for a tool that is not there; `sheet-flux.png`, left column). The dots are too small at that distance. It works in the other three. Either the tool leaves that world (no flag exists in the kit: kit request) or it shows something at the house's scale.

**D11. The showcase card says what the lab refutes, and is not ready to open.** Who: showcase, lead. `~/Dev/onigam-labs/src/data/labs/mass-heater-lab.json`:

- Tagline « Brûler peu, chauffer longtemps : la chaleur gardée dans la masse / Burn little, heat for hours: warmth kept in the mass ». The lab finds the bench does not carry the house, the drum gives twice its heat, « 80 to 90 % less wood » does not balance, and a fire is a tended session of 2 to 4 hours. `public/lab.json` has the honest line: « Deux feux par jour, oui, mais pour quelle maison ? ».
- Title « Poêle de masse / Rocket mass heater » against « Labo du poêle de masse / Mass Heater Lab »; the ram pump's card uses its lab's title.
- Missing for a live card, against `ram-pump-lab.json`: `liveUrl`, `thumbnail`, `capture`. `spokenGuide` is `[]` while both languages exist, and `sources` is `[]`.
- `order` 2 also belongs to the ram pump. Other labs share orders too, so check how the list sorts.

### Minor

- **D12. Every label on (« Étiquettes : toutes »): overlaps at all sizes.** 24 overlaps and 3 cut at 1280, in each language; 70 or more at 390 (`homes.json`, `labels-all-bench-section-600-fr.png`). Who: kit's declutter, 3D.
- **D13. The selected label hidden under another.** `drum-seal` under « L'espace sous le couvercle » (`sel-core-drum-seal.png`), `core-casing` under « Le tunnel de feu » (`sel-core-core-casing.png`). Who: kit.
- **D14. The intro does not end at home.** It ends where the Installation hop left the camera: target (−3.27, 2.46, 0.55) against the home's (−3.46, 3.93, −10.9), both languages (`nar-fr-intro-end.png` against `nar-fr-intro-00-t1.png`). The view stays decent. No `[[home]]` follows `[[mode:explore]]`. Who: voice. Nothing else stays on: x-ray, section, flows, explode, isolate and mode were all back in the 14 segments played.
- **D15. The first visit's invitation covers the panel's title** (`00-first-visit-1280-fr.png`). Who: kit.
- **D16. « Hydraulique » in the catalogue's filter empties the list, with no word** (`catalogue-hydraulic.png`), and the drum's badge says « Mécanique ». Known: `docs/kit-requests.md` 8. Who: kit.
- **D17. « (résultat du modèle) » five times on one sheet** (`steel-drum`, `chimney-flue`, `burn-tunnel`; 1.8 per sheet on average, plus 1.1 other tags; `turn-living-room-260-steel-drum.png`). Rule §6 says once, the BRIEF says tag estimates, and the owner's complaint was about the voice. For the owner to judge. Who: author.
- **D18. Thermal view: over 65 °C everything is one red.** The drum at 102 °C is the same red as anything over 65, and nothing I saw on screen says the ramp stops there. `heat-shield` is painted from a formula (`src/three/thermal.ts:173`, « the model has no node for it ») with no note, and reads as a result (`therm-room-h20_75.png` in `sheet-thermal.png`). Otherwise the map **agrees with the figures**: at 20:45 the cell above the duct holds 63.9 °C where the text says 64, the seat 31.0 on its way to 32.0, and the colours read on the bar. Who: 3D, author.
- **D19. PL-03 under « Plans de conception ».** A section with the bore, the riser and the drum in figures, a note of proportions from sources (« 0,84 m d'exemple », « environ 2 pouces sous le couvercle »), a download and a print button (`mode-1280-fr-plan-core-section.png`). Each is marked, « sans échelle, ne pas mesurer », PAS POUR LA CONSTRUCTION in red. The heading is the kit's. For the owner to judge, with D5. Who: owner, kit.
- **D20. Explode on the first screen moves little:** the stack comes out of the shed, a few small things move, and the house stays (`tool-homestead-explode.png` in `sheet-tools-explode.png`). It works well in the other three worlds. Who: 3D.
- **D21. Flicker tool:** no pop in `homestead`, `living-room` or `bench-section`, shimmer below `docs/3d.md`'s figures. `fire-core` shows a spike of 6.28 at orbit frame 8 and 2.54 at dolly frame 108 (`flicker/flicker.md`), where `docs/3d.md` says « no pop » at a shorter run. It did not come back in my own 40-frame orbit with the clock stopped (1.18), so it is more likely the simulation (a light, the fire) than the geometry. Located no further. Who: 3D.
- **D22. READMEs.** The French part still says « Le guide parlé vient en dernier, une fois le labo vu par le propriétaire », and the audio exists. Both languages link `mass-heater-lab.vercel.app`, not `mass-heater-lab.onigam.io` (both answer 200). All 5 links tested answer. `src/lab.ts:114` says « until the audio exists ». Who: lead.
- **D23. `chimney-cap`, « tout en haut, au-dessus du faîtage »: the ridge is not in the frame** (`nar-fr-scene_homestead-02-t15.png`). Who: voice, 3D.
- **D24. X-ray in `fire-core` takes the brick away entirely**, with no ghost of it: a black drum, a blue void, dots in the air (`tool-fire-core-xray.png` in `sheet-xray.png`). The room and the bench read well. Who: 3D.

## What held

- **Figures, voice against screen:** drum 22 kWh and 180 °C; alarm silent 2 h at 30 ppm; damper 38 min; fan 63 ppm; 1.3 against 14.9 Pa; 12.5 and 36 kg at 106 and 300 W/K; 0.3 to 0.5 kW; 17.3 to 24 °C; 64 and 32 °C. All agree.
- **Spoken guide:** 14 segments played, French at ×1.5 (intro, 4 worlds, 5 parts), English at ×1.5 (intro, `fire-core`, 2 parts). All end cleanly, no failed request, no gap of over 1.5 s in the subtitles in either language, longest line 107 characters, « Voix de synthèse » and « Synthetic voice » shown, the camera and the world follow each cue. **I cannot hear: nothing here says how it sounds.** Durations: 21.9 min French, 20.8 English.
- **Identity:** dark and light both match https://labs.onigam.io (`sheet-theme.png`, `sheet-light.png`), panel, toolbar and sheets readable in both.
- **Sheets, guides, lessons, quiz, simulation:** readable on a sample (`sheet-modes-1280.png`, `sheet-modes-390.png`, `sheet-sim.png`). The quiz answers and explains; lesson 6 lands on a clear close-up of the alarm.
- **Worlds:** all four are recognisable from home at first sight, with fire, smoke, and a section that reads.
- **Thermal:** reads at once, in the room and on the bench (`sheet-thermal.png`).

## Not checked

- Real phones and tablets, touch gestures, Safari, Firefox, frame rate on a phone.
- **The voice itself**, and the back-transcription (taken from `narration/README.md`).
- The other audio segments: 51 of 61 in French, 57 of 61 in English.
- Light theme below 1280, and English in light.
- Each part at three distances: all measured, about 35 looked at. Isolate looked at only through the voice's `duct-joint`, not on screen.
- Guides: 3 of 20 and 2 of 10 steps on screen, more in the text. Plans: 3 of 10. Lessons: 1 of 6. Quiz: 1 of 12 answered. Scenarios: 12 in numbers, 1 on screen.
- Whether the model is honest: `docs/physics.md` not audited, and no figure traced to its source. The law lines in Sources were not read against anything.
- Links inside the Sources panel. The lab's main video, which `src/lab.ts:44` still calls the research's proposal with « the owner's answer pending »: to confirm with the owner.
- Section in `living-room` close to the lid (D2).
