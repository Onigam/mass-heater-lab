import { Drawing, INK_2, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { partIds } from '../data/ids';
import { PARTS } from '../data/parts';
import { BENCH, CORE, DUCT, FLUE, HOUSE, ITEMS as THINGS, MACHINE as M, MANIFOLD, ROOM, SHIELD } from '../three/dims';
import { balloon, caption, dimH, dimV, FILL, grid, marksLegend, PAPER } from './draw';
import { lab, perMetre, scaleText } from './geom';

// PL-01: the room in plan and in elevation, the 18 items of the world and overall sizes only: the room, the bench, the drum, the chimney. Everything from dims.ts.

const NUMBER = 'PL-01';
export const ITEMS = partIds('living-room');
const n = (id: string): number => ITEMS.indexOf(id) + 1;
const SCALE_PLAN = 35;
const SCALE_ELEV = 50;

function draw(d: Drawing): void {
  // ---- plan: x to the right, the back wall at the top
  const v = d.view(124, 100, perMetre(SCALE_PLAN));
  const P = (x: number, z: number): Pt => [x, -z];
  v.rect(P(ROOM.x0, ROOM.z1), P(ROOM.x1, ROOM.z0), { w: W.thin, fill: FILL.room });
  // the walls
  v.rect(P(ROOM.x0, ROOM.z0 - ROOM.outerWall), P(ROOM.x1 + ROOM.outerWall, ROOM.z0), {
    w: W.medium,
    fill: FILL.gravel,
  });
  v.rect(P(ROOM.x1, ROOM.z0), P(ROOM.x1 + ROOM.outerWall, ROOM.z1), { w: W.medium, fill: FILL.gravel });
  v.rect(P(ROOM.x0 - ROOM.stoneT, ROOM.z0), P(ROOM.x0, ROOM.z0 + ROOM.stoneWidth), { w: W.medium, fill: FILL.stone });
  // the bench: along the back wall, along the gable
  v.rect(P(BENCH.casingStartX, ROOM.z0 + BENCH.depth), P(ROOM.x1, ROOM.z0), { w: W.medium, fill: FILL.cob });
  v.rect(P(ROOM.x1 - BENCH.depth, ROOM.z0), P(ROOM.x1, BENCH.casingEndZ), { w: W.medium, fill: FILL.cob });
  // the backrest, against the back wall
  v.rect(P(BENCH.backrestX0, ROOM.z0 + BENCH.backrestDepth), P(ROOM.x1, ROOM.z0), {
    w: W.thin,
    color: INK_2,
    dash: 'hidden',
  });
  // the duct under the bench
  v.polyline([P(BENCH.startX, BENCH.ductZ), P(BENCH.ductX, BENCH.ductZ), P(BENCH.ductX, BENCH.endZ)], {
    w: W.thin,
    color: '#7a5a2a',
    dash: 'hidden',
  });
  // the core's casing, the drum, the feed, the shield
  const cx = CORE.x;
  const cz = CORE.z;
  v.rect(P(cx + CORE.casingX0, cz + CORE.casingZ1), P(cx + CORE.casingX1, ROOM.z0), { w: W.medium, fill: FILL.cob });
  v.rect(P(cx + MANIFOLD.x0, cz + MANIFOLD.z1), P(cx + MANIFOLD.x1, cz + MANIFOLD.z0), {
    w: W.thin,
    color: INK_2,
    dash: 'hidden',
  });
  v.circle(P(cx, cz), CORE.drumR, { w: W.thick, fill: '#c9c4b8' });
  v.circle(P(cx, cz), CORE.sleeveR, { w: W.thin, dash: 'hidden', color: INK_2 });
  v.rect(P(cx + CORE.feedFar, cz + CORE.feedSide / 2), P(cx + CORE.feedNear, cz - CORE.feedSide / 2), {
    w: W.medium,
    fill: '#b9b1a1',
  });
  v.line(P(SHIELD.x0, ROOM.z0 + SHIELD.gap), P(SHIELD.x1, ROOM.z0 + SHIELD.gap), { w: W.thick, color: '#555' });
  // the flue
  v.circle(P(FLUE.x, FLUE.z), FLUE.outerR, { w: W.thick, fill: PAPER });
  v.circle(P(FLUE.x, FLUE.z), FLUE.r, { w: W.thin });
  // the bench's cleanout
  v.circle(P(BENCH.cleanoutX, ROOM.z0 + BENCH.depth), BENCH.cleanoutR / 2, { w: W.medium, fill: PAPER });

  // the things in the room, where dims.ts sets them
  v.circle(P(THINGS.basket.x, THINGS.basket.z), THINGS.basket.r, { w: W.thin, fill: '#c8a877' });
  v.circle(P(THINGS.kettle.x, THINGS.kettle.z), THINGS.kettle.r, { w: W.thin, fill: '#6b7f88' });
  for (const [x, z] of THINGS.cushions) v.circle(P(x, z), 0.13, { w: W.thin, fill: '#c9b48a' });

  // balloons: every item of the world
  const top = 15;
  const mark = (id: string, at: Pt, bx: number, by: number) => balloon(v, at, bx + 6, by, n(id));
  mark('heat-shield', P((SHIELD.x0 + SHIELD.x1) / 2, ROOM.z0 + SHIELD.gap), 40, top);
  mark('manifold', P(cx + (MANIFOLD.x0 + MANIFOLD.x1) / 2, cz + MANIFOLD.z0), 58, top);
  mark('manifold-cleanout', P(cx + MANIFOLD.hatchX, cz + (MANIFOLD.z0 + MANIFOLD.z1) / 2), 74, top);
  mark('smoke-alarm', P(THINGS.smokeAlarm.x, THINGS.smokeAlarm.z), 96, top);
  mark('co-alarm', P(THINGS.coAlarm.x, ROOM.z0), 84, top);
  mark('ventilation-grille', P(THINGS.grille.x, ROOM.z0), 144, top);
  mark('cob-bench', P(0.45, ROOM.z0 + BENCH.depth - 0.1), 120, top);
  mark('bench-cushion', P(THINGS.cushions[0][0], THINGS.cushions[0][1]), 158, top);
  mark('bench-backrest', P(1.9, ROOM.z0 + BENCH.backrestDepth / 2), 180, top);
  mark('steel-drum', P(cx, cz), 62, 86);
  mark('kettle', P(THINGS.kettle.x, THINGS.kettle.z), 76, 86);
  mark('wood-basket', P(THINGS.basket.x, THINGS.basket.z), 50, 104);
  mark('inner-stone-wall', P(ROOM.x0 - ROOM.stoneT / 2, 0), 42, 130);
  mark('hearth-slab', P(0.2, 1.1), 118, 130);
  mark('chimney-flue', P(FLUE.x, FLUE.z), 176, 130);
  mark('chimney-cleanout', P(FLUE.x - FLUE.outerR, FLUE.z), 164, 152);
  mark('flue-thermometer', P(FLUE.x, FLUE.z - FLUE.outerR), 164, 138);
  mark('ceiling-crossing', P(FLUE.x + FLUE.outerR * 0.5, FLUE.z + FLUE.outerR * 0.5), 178, 166);

  // the overall sizes
  dimH(v, P(ROOM.x0, ROOM.z1), P(ROOM.x1, ROOM.z1), -ROOM.z1 - 0.4, lab(ROOM.width, 1, 'E'));
  dimV(v, P(ROOM.x0, ROOM.z0), P(ROOM.x0, ROOM.z1), ROOM.x0 - ROOM.stoneT - 0.35, lab(ROOM.depth, 1, 'E'));
  dimV(
    v,
    P(ROOM.x1, ROOM.z0),
    P(ROOM.x1, ROOM.z0 + BENCH.depth),
    ROOM.x1 + ROOM.outerWall + 0.35,
    lab(BENCH.depth, 2, 'E'),
  );
  caption(d, 124, 192, l('LA PIÈCE EN PLAN', 'THE ROOM IN PLAN'), scaleText(SCALE_PLAN));

  // ---- elevation, looking at the back wall: heights only
  const h = d.view(304, 136, perMetre(SCALE_ELEV));
  const side = ROOM.width / 2;
  h.rect([-side, -M.slab], [side, 0], { w: W.medium, fill: FILL.concrete });
  h.rect([-side, 0], [side, ROOM.height], { w: W.thin, fill: FILL.room });
  // the eaves and the ridge, as seen from inside: two levels
  h.line([-side - 0.3, HOUSE.eave], [side + 0.3, HOUSE.eave], { w: W.medium });
  h.line([-side - 0.3, HOUSE.ridge], [side + 0.3, HOUSE.ridge], { w: W.thick });
  h.text([-side, HOUSE.eave + 0.08], l('égout du toit', 'eaves'), { size: 1.8, baseline: 'bottom', color: INK_2 });
  h.text([-side, HOUSE.ridge + 0.08], l('faîtage', 'ridge'), { size: 1.8, baseline: 'bottom', color: INK_2 });
  // the bench, the core, the drum, the flue
  h.rect([BENCH.casingStartX, 0], [side, BENCH.height], { w: W.medium, fill: FILL.cob });
  h.rect([CORE.x + CORE.casingX0, 0], [CORE.x + CORE.casingX1, CORE.casingTop], { w: W.medium, fill: FILL.cob });
  h.rect([CORE.x - CORE.drumR, CORE.drumFoot], [CORE.x + CORE.drumR, CORE.drumTop], { w: W.thick, fill: '#c9c4b8' });
  const fx = FLUE.x;
  h.rect([fx - FLUE.outerR, DUCT.axisCold], [fx + FLUE.outerR, FLUE.top], { w: W.medium, fill: PAPER });
  h.center([fx, 0], [fx, FLUE.top], 0.1);
  // heights
  dimV(h, [side, 0], [side, ROOM.height], side + 0.42, lab(ROOM.height, 1, 'E'));
  dimV(h, [fx, 0], [fx, FLUE.top], side + 0.95, lab(FLUE.top, 1, 'E'));
  dimV(h, [-side, 0], [-side, BENCH.height], -side - 0.4, lab(BENCH.height, 2, 'E'));
  dimV(h, [-side, 0], [-side, HOUSE.ridge], -side - 0.95, lab(HOUSE.ridge, 2, 'E'));
  dimH(
    h,
    [CORE.x - CORE.drumR, CORE.drumTop],
    [CORE.x + CORE.drumR, CORE.drumTop],
    CORE.drumTop + 0.42,
    lab(M.drumDiameter * 1000, 0, 'R', ' mm'),
  );
  dimV(
    h,
    [CORE.x + CORE.drumR, CORE.drumFoot],
    [CORE.x + CORE.drumR, CORE.drumTop],
    CORE.x + CORE.drumR + 0.42,
    lab(M.drumHeight * 1000, 0, 'R', ' mm'),
    2,
  );
  caption(
    d,
    304,
    150,
    l('LES HAUTEURS, VERS LE MUR DU FOND', 'THE HEIGHTS, TOWARDS THE BACK WALL'),
    scaleText(SCALE_ELEV),
  );

  // ---- the items
  const rows = ITEMS.map((id) => {
    const p = PARTS.find((x) => x.id === id)!;
    return [String(n(id)), p.name];
  });
  const half = Math.ceil(rows.length / 2);
  grid(
    d,
    18,
    205,
    [
      { label: l('N°', 'No.'), w: 7, align: 'middle' },
      { label: l('Dans la pièce', 'In the room'), w: 44 },
    ],
    rows.slice(0, half),
    { size: 1.65, pad: 0.35, lineH: 2.3 },
  );
  grid(
    d,
    72,
    205,
    [
      { label: l('N°', 'No.'), w: 7, align: 'middle' },
      { label: l('Dans la pièce', 'In the room'), w: 44 },
    ],
    rows.slice(half),
    { size: 1.65, pad: 0.35, lineH: 2.3 },
  );
  marksLegend(d, 130, 205, 72, [], {
    reported: l('donnée par une source (fabricants)', 'given by a source (sellers)'),
  });
}

export const generalArrangement: DrawingSheet = {
  id: 'general-arrangement',
  number: NUMBER,
  group: 'living-room',
  title: l('La pièce, en plan et en hauteur', 'The room, in plan and in height'),
  description: l(
    'La pièce vue du dessus, la banquette le long de deux murs, le bidon et son foyer dans l’angle, le conduit vertical au bout du banc, puis les hauteurs. Cotes d’ensemble seulement : de quoi se représenter la machine dans une pièce, pas de quoi la bâtir.',
    'The room from above, the bench along two walls, the drum and its core in the corner, the chimney at the end of the bench, then the heights. Overall sizes only: enough to picture the machine in a room, not to build it.',
  ),
  scene: 'living-room',
  parts: ITEMS,
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La pièce, en plan et en hauteur', 'The room, in plan and in height'),
      subtitle: l('Cotes d’ensemble seulement', 'Overall sizes only'),
      number: NUMBER,
      scale: scaleText(SCALE_PLAN),
    });
    draw(d);
    return d;
  },
};
