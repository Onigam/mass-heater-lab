# The setting of the worlds

Generic, at true scale, never a real plot: a small insulated house at a wood's edge in the foothills, in January. No texture file: every map is procedural (`src/three/textures.ts`), no text anywhere, because films are captured with no interface. Sizes that matter are in `src/three/dims.ts` (`ROOM`, `HOUSE`, `HOME`, `ITEMS`), tagged.

## `homestead`, the house and its wood

The story reads from left to right: the neighbour's chimney smoking across the track; the house, its chimney clear of the ridge; the path trodden to the block and the bucket; the shed with a whole season's wood beside one day's basket; the coppice at the wood's edge. The ridge of the foothill rises behind it, dark forest, then far ridges.

| Thing                           | What it reads                                               | Kind                                                                                                           |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Snow on the land, roofs, boughs | `params.outsideMean`: all of it at 4 °C of mean, none at 9  | decoration of a size set by the model: the amount, never a depth                                               |
| Snow left on the house's roof   | as everywhere: nothing melts on it                          | follows the research: the house is well insulated                                                              |
| The sun and the moon            | `state.hour`, day 15 of the year, 46° north                 | geometry. At a clock over ×3000 it holds at 14:12, or a day would strobe past. Night is real here: stars, moon |
| The windows                     | how far down the sun is                                     | decoration: they glow when the light goes                                                                      |
| Smoke and steam at the cap      | `smokeAtCap`, `steamAtCap`                                  | the amount follows the model, the plume is ours (`docs/water.md`)                                              |
| The neighbour's plume           | nothing                                                     | decoration: the same wood on a slow fire, a contrast                                                           |
| The stack                       | `woodTotal`: the top rows go first, 1.9 t is a whole season | follows the model: a day's burning takes less than 1 % of it                                                   |
| The shed's size, the stack's    | research §3: 1.9 t at about 450 kg a stère                  | derived, then rounded                                                                                          |
| « Flux »                        | `gasFlow`, `pathT`                                          | air into the inlet, gases up the flue and off, at the model's speeds and in its direction                      |

**The land.** One mesh on a graded grid, 180 × 180 cells, about 1.5 m on the plot and about 170 m at the horizon. A pad under the house, the shed and the neighbour, flat to the millimetre (tested), blended into the land by a margin. Snow, packed road, trodden paths and bare rock are computed per pixel.

**The trees (instanced, all from unit geometries).**

| Species      | Count  | Triangles each | Note                                                                                                                                                                 |
| ------------ | ------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spruce       | ~420   | 504 / 108      | trunk, whorls of drooping boughs with a dark keel; full within 95 m of the house, fewer boughs beyond; past 60 to 170 m they blend to one colour and one lit surface |
| Young spruce | ~110   | 84             | the forest comes down in steps                                                                                                                                       |
| Birch, ash   | ~48    | ~1,000 / ~300  | bare in January: trunk, rising branches, twigs within 42 m only; the birches white with lenticels, the ashes grey-brown                                              |
| Far forest   | ~3,000 | 12             | two stacked cones                                                                                                                                                    |
| Coppice      | 28     | ~320           | a low stump, seventeen straight rods, in the rows of a lot with its posts and a stack of poles                                                                       |

Every tree stands on `terrainHeight`, off the house and the road (tested).

**The buildings.** A low wide house, lime render on a stone plinth, larch boards in the gables, shutters, wide eaves on rafter ends that hold a roof of shingle, a stone step, two posts under the eave at the door. Its windows are where the room's windows are, its chimney where the room's chimney goes. The neighbour and a hamlet down the road are simpler, the same language.

## `living-room` and `fire-core`, the room

The same room in both (`room/stage.ts`), lived in, warm. The walls between the eye and the room step aside by themselves: a wall shows only from the room's side, and a click passes through a wall that does not show.

| Thing                                                                                                    | Kind                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Oak floor, limewash, earth plaster, a rubble wall of the model's 4 m and 0.30 m, a wooden gable above it | procedural maps, UVs in metres, so each keeps its true scale whatever the shape                                      |
| A rug, an armchair, a low table with two mugs, two books and a lamp, a bookcase, a floor lamp, a plant   | scenery; each foot on the boards or the slab, tested                                                                 |
| Curtains on their rods, a pot of herbs and a candle on the sills, two pictures with no words             | scenery; the rods end on brackets in the wall                                                                        |
| A wall clock with no figures                                                                             | its hands follow `state.hour`                                                                                        |
| The stand of the fire's tools, a stool, slippers, a folded blanket and a pair of wool socks on the bench | scenery                                                                                                              |
| Snow and spruces outside, seen through the panes and over the walls                                      | the same trees as `homestead`, they fade into the evening                                                            |
| The light                                                                                                | `state.hour`: daylight from 9:00 to 16:30, the lamps lit from dusk; at a clock over ×3000 it holds at a warm evening |

`fire-core` takes out what would stand between the eye and the section (the chair, the table, the lamps, the bookcase) and keeps the lights low, so that the fire reads.

**The cat.** The research's idea for the Short was a sleeping cat « if the modeller can do one honestly ». I built one from a curled body, a head, ears and a tail: it read as a dumpling on a blanket, and it was taken out. The blanket and the socks are still on the warm end.

## `bench-section`

A plain room's back wall with a window and a shelf, an oak floor, a slab. Three slices stand on it, the cut towards the viewer, each with a stub of its wall in section; behind them the corner of the bench is laid open at the height of its duct, with the chimney's foot, its flue cut at the eye's height. It is a set for looking at sections, and looks it.
