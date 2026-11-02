import { Drawing, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { partIds } from '../data/ids';
import { PARTS } from '../data/parts';
import { CORE, MACHINE as M } from '../three/dims';
import { arrow, balloon, box, caption, dimH, dimV, FILL, grid, HOT, marksLegend, PAPER, COOL } from './draw';
import { lab } from './geom';

// PL-03: the core in section. Drawn from dims.ts, with NO SCALE on purpose and only the overall sizes printed: the drum, the riser's example, the bore. A draft text's ratios appear as its words, attributed, in a box. No brick, no thickness, no gap as a size.

const NUMBER = 'PL-03';
export const ITEMS = partIds('fire-core');
const n = (id: string): number => ITEMS.indexOf(id) + 1;
/** Paper mm per metre. The sheet prints no scale: nothing is to be measured on it. */
const K = 118;

function draw(d: Drawing): void {
  const v = d.view(116, 214, K);
  const c = CORE;
  // the slab
  v.rect([c.casingX0 - 0.15, -M.slab], [c.casingX1 + 0.35, 0], { w: W.medium, fill: FILL.concrete, hatch: 'steel' });
  // the earth around it all
  v.roundRect([c.casingX0, 0], [c.casingX1, c.casingTop], 0.05, { w: W.medium, fill: FILL.cob, hatch: 'earth' });
  // the chamber under the fall, the ring, then the drum on it
  v.rect([-c.drumR, c.chamberFloor], [c.drumR, c.drumFoot], { w: W.thin, fill: FILL.room });
  for (const sx of [-1, 1])
    v.rect([sx * c.plinthIn, c.chamberFloor], [sx * c.plinthOut, c.drumFoot], { w: W.thin, fill: FILL.brick });
  v.rect([-c.drumR, c.drumFoot], [c.drumR, c.drumTop], { w: W.thick, fill: FILL.room });
  v.line([-c.drumR, c.drumTop], [c.drumR, c.drumTop], { w: W.thick * 1.6 });
  // the brick around the fire, the tunnel and the feed left open, the throat up into the riser
  v.rect([c.feedFar - c.brick, 0], [c.boreR + c.brick, c.lidTop], { w: W.thin, fill: FILL.brick });
  v.rect([c.feedFar - c.brick, c.lidTop], [c.feedNear + c.brick, c.feedTop], { w: W.thin, fill: FILL.brick });
  v.rect([c.feedFar, c.tunnelFloor], [c.boreR, c.tunnelRoof], { w: W.thin, fill: PAPER });
  v.rect([c.feedFar, c.tunnelRoof - 0.002], [c.feedNear, c.feedTop], { w: W.thin, fill: PAPER });
  v.rect([-c.boreR, c.tunnelRoof - 0.002], [c.boreR, c.riserFoot + 0.002], { w: W.thin, fill: PAPER });
  // the riser in its insulation and sleeve
  const riserFoot = c.riserFoot;
  for (const sx of [-1, 1]) {
    v.rect([sx * c.boreR, riserFoot], [sx * c.sleeveR, c.riserTop], { w: W.thin, fill: FILL.insulation });
    v.line([sx * c.sleeveR, riserFoot], [sx * c.sleeveR, c.riserTop], { w: W.medium, color: '#555' });
  }
  v.rect([-c.boreR, riserFoot], [c.boreR, c.riserTop], { w: W.thin, fill: PAPER });
  // the sticks, the ash bed
  v.rect([c.feedFar, c.tunnelFloor], [c.boreR, c.tunnelFloor + c.ashH], { w: 0, color: '#a39d90', fill: '#a39d90' });
  for (const dx of [-0.05, 0, 0.05])
    v.rect([c.feedAxis + dx - c.stickR, c.tunnelFloor + 0.03], [c.feedAxis + dx + c.stickR, c.feedTop + 0.14], {
      w: W.thin,
      fill: '#c8a877',
    });
  // the lid laid on the feed, aside
  v.rect([c.feedFar - 0.04 - c.lidW, c.casingTop], [c.feedFar - 0.04, c.casingTop + c.lidT * 2], {
    w: W.medium,
    fill: '#555',
  });
  // the gases
  arrow(v, [c.feedAxis, c.feedTop + 0.28], [c.feedAxis, c.feedTop + 0.17], COOL, W.thick);
  arrow(v, [c.feedNear + 0.02, c.tunnelAxis], [-c.boreR - 0.04, c.tunnelAxis], HOT, W.thick);
  arrow(v, [0, c.riserFoot + 0.1], [0, c.riserTop - 0.08], HOT, W.thick);
  arrow(v, [-c.boreR, c.riserTop + c.topGap / 2], [-c.sleeveR - 0.06, c.riserTop + c.topGap / 2], HOT, W.medium);
  const fallX = (c.sleeveR + c.drumR) / 2;
  arrow(v, [fallX, c.riserTop - 0.05], [fallX, c.drumFoot + 0.06], HOT, W.thick);
  arrow(v, [-fallX, c.riserTop - 0.05], [-fallX, c.drumFoot + 0.06], HOT, W.thick);

  // the balloons
  const mark = (id: string, at: Pt, bx: number, by: number) => balloon(v, at, bx, by, n(id));
  mark('feed-tube', [c.feedFar - c.brick / 2, c.feedTop - 0.05], 20, 118);
  mark('feed-lid', [c.feedFar - 0.04 - c.lidW / 2, c.casingTop + 0.01], 20, 136);
  mark('fuel-sticks', [c.feedAxis, c.feedTop + 0.1], 62, 84);
  mark('burn-tunnel', [c.feedNear + 0.1, c.tunnelAxis], 44, 236);
  mark('ash-bed', [c.feedNear - 0.05, c.tunnelFloor + 0.01], 68, 236);
  mark('heat-riser', [0, (riserFoot + c.riserTop) / 2], 88, 58);
  mark('riser-insulation', [-c.boreR - 0.03, c.riserTop - 0.2], 104, 58);
  mark('riser-sleeve', [-c.sleeveR, c.riserTop - 0.1], 120, 58);
  mark('firebrick-base', [c.boreR, 0.03], 96, 236);
  mark('core-casing', [c.casingX1 - 0.03, 0.2], 200, 226);
  mark('top-gap', [c.sleeveR - 0.02, c.riserTop + c.topGap / 2], 200, 58);
  mark('downdraft-annulus', [fallX, 0.9], 200, 118);
  mark('drum-seal', [c.drumR, c.drumTop], 200, 84);
  mark('drum-plinth', [c.plinthOut - 0.03, 0.1], 200, 212);

  // the overall sizes, and only those
  dimH(v, [-c.drumR, c.drumTop], [c.drumR, c.drumTop], c.drumTop + 0.1, lab(M.drumDiameter * 1000, 0, 'R', ' mm'));
  dimV(v, [c.drumR, c.drumFoot], [c.drumR, c.drumTop], c.drumR + 0.15, lab(M.drumHeight * 1000, 0, 'R', ' mm'));
  dimV(v, [c.sleeveR, c.tunnelAxis], [c.sleeveR, c.riserTop], c.drumR + 0.32, lab(M.riserHeight, 2, 'R'));
  dimH(
    v,
    [-c.boreR, riserFoot + 0.2],
    [c.boreR, riserFoot + 0.2],
    riserFoot + 0.1,
    lab(M.bore * 1000, 0, 'R', ' mm'),
    2,
  );
  caption(d, 112, 250, l('LE FOYER EN COUPE', 'THE CORE IN SECTION'));
  d.paper().text(
    [112, 254],
    l('sans échelle : ne pas mesurer sur ce schéma', 'not to scale: do not measure on this diagram'),
    { size: 2.1, anchor: 'middle', mono: true, color: '#5b6878' },
  );

  // ---- the items
  const rows = ITEMS.map((id) => {
    const p = PARTS.find((x) => x.id === id)!;
    return [String(n(id)), p.name];
  });
  grid(
    d,
    232,
    18,
    [
      { label: l('N°', 'No.'), w: 8, align: 'middle' },
      { label: l('Dans le foyer', 'In the core'), w: 62 },
    ],
    rows,
    { size: 1.8, pad: 0.4, lineH: 2.5 },
  );
  let y = 18;
  y = marksLegend(d, 312, y, 90, [
    {
      sym: (p, x, yy) => {
        arrow(p, [x, yy], [x + 9, yy], HOT, W.thick);
      },
      text: l('gaz chauds', 'hot gases'),
    },
    {
      sym: (p, x, yy) => {
        arrow(p, [x, yy], [x + 9, yy], COOL, W.thick);
      },
      text: l('air du feu', 'the fire’s air'),
    },
  ]);
  y += 3;
  y = box(
    d,
    312,
    y,
    90,
    l('LES PROPORTIONS : MOTS D’UNE SOURCE, PAS UNE RÈGLE', 'THE PROPORTIONS: A SOURCE’S WORDS, NOT A RULE'),
    [
      {
        bullet: '·',
        t: l(
          'Un projet de texte pour une ville américaine, d’intérêt historique selon lui-même, veut une cheminée interne d’au moins deux fois le tunnel et trois fois le tube, et aucun clapet.',
          'A draft text for one American city, of historic interest by its own account, wants a riser at least twice the tunnel and three times the feed, and no damper.',
        ),
      },
      {
        bullet: '·',
        t: l(
          'Un livre lu dans un résumé donne 0,84 m d’exemple pour 8 pouces, dans une plage de 0,64 à 1,27 m, et environ 2 pouces sous le couvercle.',
          'A book read in a digest gives an example of 0.84 m for 8 inches, within 0.64 to 1.27 m, and about 2 inches under the lid.',
        ),
      },
      {
        bullet: '·',
        t: l(
          'Rien ici ne donne l’épaisseur de brique ou d’isolant, le passage du tube, ni un mélange.',
          'Nothing here gives a brick or insulation thickness, the feed’s opening, or a mix.',
        ),
      },
    ],
  );
  y += 3;
  box(
    d,
    232,
    Math.max(y, 112),
    170,
    l('CE QUE LE MODÈLE NE SAIT PAS DE CE FOYER', 'WHAT THE MODEL DOES NOT KNOW OF THIS CORE'),
    [
      {
        bullet: '·',
        t: l(
          'L’ouverture du tube décide de l’essentiel du rendement, et aucune source ne la chiffre.',
          'The feed’s opening decides most of the efficiency, and no source gives a figure.',
        ),
      },
      {
        bullet: '·',
        t: l(
          'Aucune fissure, aucun séchage, aucune fuite de terre : une seule fuite, celle du couvercle du bidon.',
          'No crack, no drying, no leak through earth: just one leak, that of the drum’s lid.',
        ),
      },
      {
        bullet: '·',
        t: l(
          'Aucune mesure de flamme : une moyenne de gaz bien mélangé.',
          'No measurement of a flame: a mean of well-mixed gas.',
        ),
      },
    ],
  );
}

export const coreSection: DrawingSheet = {
  id: 'core-section',
  number: NUMBER,
  group: 'fire-core',
  title: l('Le foyer en coupe', 'The core in section'),
  description: l(
    'Le tube, le tunnel, la cheminée interne et la chute dans le bidon, coupés, avec le sens des gaz. Le schéma n’a pas d’échelle, volontairement, et seules les cotes d’ensemble y figurent. Les proportions sont les mots d’une source, avec son statut, et rien de plus.',
    'The feed, the tunnel, the riser and the fall inside the drum, cut, with the way the gases go. The diagram has no scale, on purpose, and only overall sizes appear. Proportions are a source’s words, with its status, and nothing more.',
  ),
  scene: 'fire-core',
  parts: ITEMS,
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le foyer en coupe', 'The core in section'),
      subtitle: l('Schéma sans échelle : ne pas mesurer', 'A diagram with no scale: do not measure'),
      number: NUMBER,
      scale: '—',
    });
    draw(d);
    return d;
  },
};
