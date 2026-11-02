import { Drawing, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { BENCH, CORE, DUCT, FLUE, MACHINE as M, ROOM } from '../three/dims';
import { arrow, balloon, box, caption, dimH, dimV, FILL, HOT, marksLegend, PAPER, COOL } from './draw';
import { lab, perMetre, scaleText } from './geom';
import { theDay } from './model';

// PL-04: the run of the duct in plan: its two legs, bends, the cleanout, the tee and its drain, where the cover is thick and where it is thin, and how much each slice takes in the model. Lengths are the overall ones of dims.ts.

const NUMBER = 'PL-04';
const SCALE = 25;

function draw(d: Drawing): void {
  const v = d.view(148, 128, perMetre(SCALE));
  const P = (x: number, z: number): Pt => [x, -z];
  const X0 = BENCH.startX;
  const XE = BENCH.ductX;
  const Z0 = BENCH.ductZ;
  const ZE = BENCH.endZ;
  // the bench's outline
  v.rect(P(BENCH.casingStartX, ROOM.z0 + BENCH.depth), P(ROOM.x1, ROOM.z0), { w: W.thin, fill: FILL.cob });
  v.rect(P(ROOM.x1 - BENCH.depth, ROOM.z0), P(ROOM.x1, BENCH.casingEndZ), { w: W.thin, fill: FILL.cob });
  // the walls
  v.line(P(BENCH.casingStartX - 0.5, ROOM.z0), P(ROOM.x1, ROOM.z0), { w: W.thick });
  v.line(P(ROOM.x1, ROOM.z0), P(ROOM.x1, BENCH.casingEndZ + 0.5), { w: W.thick });
  // the thick cover over the first metres
  v.rect(P(X0, Z0 + DUCT.r + 0.03), P(BENCH.hotEndX, Z0 - DUCT.r - 0.03), {
    w: 0,
    color: '#f0c8a0',
    fill: '#f0c8a0',
    opacity: 0.8,
  });
  // the duct
  const R = DUCT.r;
  v.rect(P(X0, Z0 + R), P(XE - R, Z0 - R), { w: W.medium, fill: PAPER });
  v.rect(P(XE - R, Z0 - R), P(XE + R, ZE), { w: W.medium, fill: PAPER });
  v.line(P(X0, Z0), P(XE, Z0), { w: W.thin, dash: 'center' });
  v.line(P(XE, Z0), P(XE, ZE), { w: W.thin, dash: 'center' });
  // joints
  for (let x = X0 + DUCT.jointEvery; x < XE - 0.2; x += DUCT.jointEvery)
    v.line(P(x, Z0 - R), P(x, Z0 + R), { w: W.thin });
  for (let z = Z0 + DUCT.jointEvery; z < ZE - 0.1; z += DUCT.jointEvery)
    v.line(P(XE - R, z), P(XE + R, z), { w: W.thin });
  // arrows of the flow
  for (const x of [X0 + 0.8, X0 + 2.2, X0 + 3.7]) arrow(v, P(x, Z0), P(x + 0.5, Z0), HOT, W.thick);
  for (const z of [Z0 + 1.0, Z0 + 2.6]) arrow(v, P(XE, z), P(XE, z + 0.5), COOL, W.thick);
  // the drum's end and the tee
  v.circle(P(CORE.x, CORE.z), CORE.drumR, { w: W.thick, fill: '#c9c4b8' });
  v.circle(P(FLUE.x, FLUE.z), FLUE.outerR, { w: W.thick, fill: PAPER });
  v.circle(P(BENCH.cleanoutX, Z0 + R + 0.05), BENCH.cleanoutR, { w: W.medium, fill: PAPER });

  // labels
  balloon(v, P(X0 + 1.5, Z0), 110, 74, 'A');
  balloon(v, P(X0 + 3.8, Z0), 190, 74, 'B');
  balloon(v, P(XE, Z0), 240, 74, 'C');
  balloon(v, P(BENCH.cleanoutX, Z0 + R + 0.05), 216, 74, 'D');
  balloon(v, P(XE - R, Z0 + 2.2), 226, 130, 'E');
  balloon(v, P(FLUE.x, FLUE.z), 226, 205, 'F');
  balloon(v, P(CORE.x, CORE.z), 30, 74, 'G');

  // the overall lengths
  dimH(v, P(X0, Z0), P(XE, Z0), -Z0 + 0.55, lab(M.ductLegs[0], 1, 'E'));
  dimV(v, P(XE, Z0), P(XE, ZE), XE + 0.55, lab(M.ductLegs[1], 1, 'E'));
  dimH(v, P(X0, Z0 - 0.2), P(BENCH.hotEndX, Z0 - 0.2), -Z0 - 0.5, lab(M.hotRun, 0, 'R'), 2);
  caption(d, 90, 240, l('LE CONDUIT, VU DU DESSUS', 'THE DUCT, FROM ABOVE'), scaleText(SCALE));

  // the reading
  let y = 84;
  y = box(d, 18, y, 180, l('A À G', 'A TO G'), [
    {
      bullet: 'A',
      t: l(
        'Le début du conduit, sous environ 15 cm de terre (un projet de texte, dérivé).',
        'The hot run, under about 15 cm of earth (a draft text, derived).',
      ),
    },
    {
      bullet: 'B',
      t: l(
        'Le passage à une terre plus mince : environ 10 cm, selon le même texte.',
        'The change to thinner earth: about 10 cm, by the same text.',
      ),
    },
    {
      bullet: 'C',
      t: l('L’angle : un coude, de la cendre, un joint qui travaille.', 'The corner: a bend, ash, a joint at work.'),
    },
    {
      bullet: 'D',
      t: l(
        'La trappe du banc, avant l’angle, à portée du ramoneur.',
        'The bench’s cleanout, before the corner, within the sweep’s reach.',
      ),
    },
    { bullet: 'E', t: l('La fin du conduit, où les gaz cèdent moins.', 'The cold run, where the gases give less.') },
    {
      bullet: 'F',
      t: l('Le té de pied et sa purge, le pied de la cheminée.', 'The chimney tee and its drain, the flue’s foot.'),
    },
    {
      bullet: 'G',
      t: l('Le bidon, d’où vient le gaz, et le collecteur.', 'The drum, where the gas comes from, and the manifold.'),
    },
  ]);
  y += 3;
  // what the slices take, from the model
  const c = theDay().counters;
  const total = c.toSegments.reduce((a, b) => a + b, 0);
  const shares = c.toSegments.map((s) => (s / total) * 100);
  const p = d.paper();
  p.text([18, y + 2], l('CE QUE CÈDE CHAQUE TRANCHE, RÉSULTAT DU MODÈLE', 'WHAT EACH SLICE GIVES UP, MODEL RESULT'), {
    size: 1.9,
    weight: 'bold',
    baseline: 'top',
    color: '#b3261e',
  });
  y += 7;
  shares.forEach((s, i) => {
    const bw = s * 3;
    p.rect([34, y], [34 + bw, y + 3.4], { w: W.thin, fill: i < 2 ? '#e7a36a' : '#e3cda2' });
    p.text([18, y + 1.7], lab(((i + 0.5) * M.ductLength) / shares.length, 1, 'M', ' m'), {
      size: 1.7,
      baseline: 'middle',
      mono: true,
    });
    p.text([36 + bw, y + 1.7], lab(s, 0, 'M', l(' %', '%')), {
      size: 1.8,
      baseline: 'middle',
      mono: true,
      weight: 'bold',
    });
    y += 4.4;
  });
  marksLegend(d, 296, 40, 106, [], {
    derived: l('dérivée de chiffres rapportés (pieds, pouces)', 'derived from reported figures (feet, inches)'),
  });
}

export const ductPlan: DrawingSheet = {
  id: 'duct-plan',
  number: NUMBER,
  group: 'bench-section',
  title: l('Le tracé du conduit', 'The route of the duct'),
  description: l(
    'Les deux tronçons du conduit le long des murs, ses coudes, la trappe, le té et sa purge, et ce que cède chaque tranche dans le modèle. Les premiers mètres prennent la plus grande part, sans rien de la pente que suggère une seule lecture sur une autre machine.',
    'The duct’s two legs along the walls, its bends, the cleanout, the tee and its drain, and what each slice gives up in the model. The first metres take the largest share, with none of the steep slope a single reading on another machine suggests.',
  ),
  scene: 'bench-section',
  parts: [
    'duct-hot-run',
    'duct-cold-run',
    'duct-bend',
    'duct-joint',
    'bench-cleanout',
    'chimney-tee',
    'condensate-drain',
  ],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le tracé du conduit', 'The route of the duct'),
      subtitle: l('Longueurs d’ensemble', 'Overall lengths'),
      number: NUMBER,
      scale: scaleText(SCALE),
    });
    draw(d);
    return d;
  },
};
