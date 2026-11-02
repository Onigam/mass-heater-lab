# Lessons of the Mass Heater lab

Six lessons, two questions each, every one opening on a scenario of the simulation and naming others, so that together they go through all twelve (`src/data/lessons.ts`). The heart is the fourth and the fifth: the bench charges and gives back, and it is the house that decides.

| #   | id                       | Title                               | Opens on                                 | Also names                 | What it must leave                                                                                                                |
| --- | ------------------------ | ----------------------------------- | ---------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `the-fire-goes-sideways` | Le feu qui va de côté               | `cold-start`, `fire-core`, tunnel        | `low-chimney`, `small-gap` | the chimney draws (14.9 Pa against 1.3), a cold flue and its −1.1 Pa, the turn as the least sure figure, margin before efficiency |
| 2   | `smoke-is-fuel`          | La fumée est du combustible         | `wet-wood`, `fire-core`, riser           |                            | heat, air, time, dry wood; the eye cannot judge CO; CO is a map and an order, 170 < 230 < 850 < 2,000 ppm, never a measure        |
| 3   | `where-the-heat-goes`    | Où va la chaleur                    | `short-bench`, `living-room`, drum       | `long-bench`               | the split no source gives; 78 and 82 %, 65 to 88 %; no independent test found; the feed's opening has no source                   |
| 4   | `charge-and-give-back`   | Charger, puis rendre                | `winter-two-fires`, `bench-section`, cob | `one-fire-mild`            | what a fire is; **one to two hours after the flame**; the drum twice the bench; the bench smooths; the room's swing               |
| 5   | `two-fires-which-house`  | Deux feux, pour quelle maison ?     | `leaky-house`, `homestead`, house        | `cold-snap`                | 1.7 kW against the house's losses; « 80 to 90 % » does not balance from the stove: 55, 36, 7 %; reaching 85 % takes insulation    |
| 6   | `fire-co-and-the-law`    | Le monoxyde, le clapet, l'assurance | `damper-on-embers`, `living-room`, alarm | `extract-fan`              | the numbers, no story; no closing damper; an alarm can stay silent at a level WHO does not accept; when it is the wrong answer    |

## What the lessons say about the model

« Never 4 to 8 h »: the hand sum of the research is not retrieved, and the lessons say one to two hours after the flame, with why. The damper is numbers only: 38 and 52 minutes, 123 ppm at 65 minutes, 43 ppm shut 40 minutes later. A cold flue's −1.1 Pa stands beside the hand sum's −5.5 Pa, and the reason. Where the model does not retrieve a source (the seat against a builder's 32 to 38 °C, the small gap against a published model), the lesson says so. The law is left to the Sources panel; lesson 6 only says who to ask.

## Tests

`src/data/data.test.ts` (the visitor texts' rules hold on the lessons) and `src/data/lessons.test.ts`: six lessons, two questions each, three choices at least, the answer in range and not always the same, every scenario, world and part real, all twelve scenarios named as the panel names them, and what each lesson must say.
