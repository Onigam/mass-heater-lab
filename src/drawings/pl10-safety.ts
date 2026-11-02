import { Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { DERIVED, MODEL } from '../data/figures';
import { box, grid, heading, modelTag, RED } from './draw';
import { lab } from './geom';

// PL-10: the chain, in order: who to ask, what the thresholds are, what the two scenarios give in numbers, and the clearances of a draft text as its words. No statement that anything is safe. The law itself is in the Sources panel, said once, each line saying how it was reached.

const NUMBER = 'PL-10';
const MINUTES = 90;

function timeline(d: Drawing, x: number, y: number, w: number, title: L, events: [number, L, string][]): void {
  const p = d.paper();
  p.text([x, y], title, { size: 2.1, weight: 'bold', baseline: 'bottom' });
  const yy = y + 6;
  p.line([x, yy], [x + w, yy], { w: W.medium });
  for (const m of [0, 30, 60, 90]) {
    const tx = x + (m / MINUTES) * w;
    p.line([tx, yy - 1], [tx, yy + 1], { w: W.thin });
    p.text([tx, yy + 1.4], `${m}`, { size: 1.6, anchor: 'middle', baseline: 'top', mono: true });
  }
  events.forEach(([m, label, color], i) => {
    const tx = x + (m / MINUTES) * w;
    p.circle([tx, yy], 1, { w: W.medium, color, fill: color });
    p.line([tx, yy], [tx, yy + 5 + i * 3.4], { w: W.thin, color });
    p.text([tx + 0.8, yy + 5 + i * 3.4], label, { size: 1.8, baseline: 'middle', halo: true, color });
  });
}

function draw(d: Drawing): void {
  heading(d, 18, 18, l('AVANT TOUT PROJET, DANS CET ORDRE', 'BEFORE ANY PROJECT, IN THIS ORDER'));
  const chain: [L, L][] = [
    [
      l('Votre assureur, par écrit', 'Your insurer, in writing'),
      l(
        'couvre-t-il cette machine, auto-construite ? Nous n’avons lu aucun texte d’assureur.',
        'does it cover this machine, self-built? We read no insurer’s text.',
      ),
    ],
    [
      l('Les règles du pays', 'The rules of the country'),
      l(
        'le panneau Sources dit ce que nous en avons lu, et comment ; aucun juriste ne l’a vérifié.',
        'the Sources panel says what we read of them, and how; no lawyer has checked it.',
      ),
    ],
    [
      l('Un ingénieur de structure', 'A structural engineer'),
      l('ce que le sol peut porter, environ 3,4 t.', 'what the floor can carry, about 3.4 t.'),
    ],
    [
      l('Un professionnel du conduit', 'A flue professional'),
      l(
        'le trajet, la traversée, le ramonage, et ce qui aspire dans la maison.',
        'the route, the crossing, the sweeping, and what sucks in the house.',
      ),
    ],
    [
      l('Un détecteur de monoxyde', 'A CO alarm'),
      l(
        'dans la pièce et près des chambres, avant le premier feu. Il ne suffit pas.',
        'in the room and near the bedrooms, before the first fire. It is not enough.',
      ),
    ],
  ];
  const p = d.paper();
  chain.forEach(([who, what], i) => {
    const y = 26 + i * 12;
    p.circle([24, y + 3], 3.4, { w: W.medium, fill: '#fff' });
    p.text([24, y + 3], String(i + 1), { size: 2.6, anchor: 'middle', baseline: 'middle', weight: 'bold' });
    p.text([31, y + 1], who, { size: 2.3, weight: 'bold', baseline: 'middle' });
    p.text([31, y + 5.2], what, { size: 1.9, baseline: 'middle' });
    if (i < chain.length - 1) p.line([24, y + 6.4], [24, y + 11.6], { w: W.thin });
  });

  // ---- the thresholds
  heading(d, 18, 92, l('LES SEUILS, TELS QU’ILS SONT ÉCRITS', 'THE THRESHOLDS, AS WRITTEN'));
  const h1 = grid(
    d,
    18,
    100,
    [
      { label: l('OMS, intérieur', 'WHO, indoors'), w: 34 },
      { label: 'mg/m³', w: 16, align: 'end', mono: true },
      { label: 'ppm‡', w: 16, align: 'end', mono: true },
    ],
    [
      [l('15 minutes', '15 minutes'), '100', lab(DERIVED.whoPpm15, 0, 'D', '')],
      [l('1 heure', '1 hour'), '35', lab(DERIVED.whoPpm1h, 0, 'D', '')],
      [l('8 heures', '8 hours'), '10', lab(DERIVED.whoPpm8h, 1, 'D', '')],
      [l('24 heures', '24 hours'), '7', lab(DERIVED.whoPpm24h, 0, 'D', '')],
    ],
    { size: 1.95, pad: 0.65, lineH: 2.9 },
  );
  const h2 = grid(
    d,
    90,
    100,
    [
      { label: l('Détecteur, selon des manuels', 'Alarm, according to manuals'), w: 44 },
      { label: l('il sonne en', 'it sounds within'), w: 42 },
    ],
    [
      ['30 ppm', l('peut se taire 120 minutes', 'may stay silent for 120 minutes')],
      ['50 ppm', l('60 à 90 minutes', '60 to 90 minutes')],
      ['100 ppm', l('10 à 40 minutes', '10 to 40 minutes')],
      ['300 ppm', l('moins de 3 minutes', 'under 3 minutes')],
    ],
    { size: 1.95, pad: 0.65, lineH: 2.9 },
  );
  box(
    d,
    18,
    100 + Math.max(h1, h2) + 3,
    158,
    l('IL PEUT DONC SE TAIRE À UN NIVEAU QUE L’OMS REFUSE', 'SO IT CAN KEEP QUIET AT A LEVEL WHO DOES NOT ACCEPT'),
    [
      l(
        'Un détecteur signale une panne, il ne surveille pas la santé. Il reste indispensable. Le monoxyde ne se voit ni ne se sent.',
        'An alarm signals a fault; it does not watch over health. It stays indispensable. Carbon monoxide can be neither seen nor smelt.',
      ),
    ],
  );

  // ---- the two scenarios
  heading(d, 192, 18, l('DEUX SCÉNARIOS, EN CHIFFRES, EN MINUTES', 'TWO SCENARIOS, IN NUMBERS, IN MINUTES'));
  modelTag(d, 192, 25, 88);
  const who = l('valeur d’une heure de l’OMS', 'WHO’s one-hour value');
  timeline(
    d,
    196,
    46,
    200,
    l(
      'Un clapet fermé sur les braises, dix minutes après l’arrêt du bois',
      'A damper shut on embers, ten minutes after the wood stops',
    ),
    [
      [MODEL.damperWhoMin, who, RED],
      [MODEL.damperAlarmMin, l('le détecteur, au plus tard', 'the alarm, at the latest'), '#7a3a10'],
      [MODEL.damperPeakMin, l('le pic, en moyenne de maison', 'the peak, as a whole-house mean'), '#333'],
    ],
  );
  timeline(d, 196, 82, 200, l('La hotte de cuisine, à la fin d’un feu', 'The kitchen fan, at the end of a fire'), [
    [MODEL.fanPeakMin, l('le pic, en moyenne de maison', 'the peak, as a whole-house mean'), '#333'],
    [MODEL.fanWhoMin, who, RED],
  ]);
  grid(
    d,
    192,
    112,
    [
      { label: l('Scénario', 'Scenario'), w: 66 },
      { label: l('Pic', 'Peak'), w: 24, align: 'end', mono: true },
      { label: l('OMS, 1 h', 'WHO, 1 h'), w: 28, align: 'end', mono: true },
      { label: l('Détecteur', 'Alarm'), w: 36, align: 'end', mono: true },
    ],
    [
      [
        l('Clapet, 10 minutes après', 'Damper, 10 minutes after'),
        lab(MODEL.damperPeak, 0, 'M', ' ppm'),
        lab(MODEL.damperWhoMin, 0, 'M', ' min'),
        lab(MODEL.damperAlarmMin, 0, 'M', ' min'),
      ],
      [
        l('Clapet, 40 minutes après', 'Damper, 40 minutes after'),
        lab(MODEL.damperLatePeak, 0, 'M', ' ppm'),
        '—',
        l('pas obligé', 'no duty'),
      ],
      [
        l('Hotte de cuisine', 'Kitchen fan'),
        lab(MODEL.fanCoPeak, 0, 'M', ' ppm'),
        lab(MODEL.fanWhoMin, 0, 'M', ' min'),
        l('pas obligé', 'no duty'),
      ],
    ],
    { size: 1.95, pad: 0.65, lineH: 2.9 },
  );
  box(d, 192, 136, 154, l('CE QUE CES CHIFFRES NE SONT PAS', 'WHAT THESE FIGURES ARE NOT'), [
    {
      bullet: '·',
      t: l(
        'Pas la mesure d’une vraie pièce : une carte de monoxyde à un facteur 3 dans chaque sens, et une moyenne de toute la maison. Une chambre, ou quelqu’un qui dort près d’une fuite, peut en être très loin.',
        'Not the measurement of a real room: a carbon monoxide map within a factor of 3 each way, and a whole-house mean. A bedroom, or someone asleep near a leak, can be far from it.',
      ),
    },
    {
      bullet: '·',
      t: l('Il n’y a aucun clapet fermant sur cette machine.', 'There is no closing damper on this machine.'),
    },
  ]);

  // ---- the clearances
  box(
    d,
    18,
    158,
    158,
    l(
      'LES DISTANCES : LES MOTS D’UN PROJET DE TEXTE D’UNE VILLE AMÉRICAINE, PAS UNE VALEUR SÛRE',
      'DISTANCES: THE WORDS OF A DRAFT TEXT OF ONE AMERICAN CITY, NOT A SAFE VALUE',
    ),
    [
      l(
        'Tube : 18 pouces. Bidon : 36 pouces, ou 18 avec un écran et 1 pouce d’air. Conduit : 6 pouces. Ce brouillon se dit lui-même incomplet, et nous n’avons pas atteint sa version actuelle. Ce sont un pays et un assureur qui diront la vôtre, et rien ici ne permet de rapprocher un mur.',
        'Feed: 18 inches. Drum: 36 inches, or 18 with a shield and 1 inch of air. Duct: 6 inches. That text calls itself incomplete, and its current version was not reached. A country and an insurer will say yours, and nothing here allows bringing a wall closer.',
      ),
    ],
  );
}

export const safetyChain: DrawingSheet = {
  id: 'safety-chain',
  number: NUMBER,
  group: 'living-room',
  title: l('La chaîne de sécurité', 'The safety chain'),
  description: l(
    'À qui demander, dans quel ordre, les seuils de l’OMS et d’un détecteur, ce que donnent en chiffres le clapet et la hotte, et les distances d’un projet de texte, données pour ce qu’elles sont. Cette planche ne dit nulle part qu’une installation est sûre.',
    'Who to ask, in what order, WHO’s and an alarm’s thresholds, what the damper and the fan give in numbers, and a draft text’s distances, given for what they are. Nowhere does this sheet say an installation is safe.',
  ),
  scene: 'living-room',
  parts: ['co-alarm', 'smoke-alarm', 'ventilation-grille', 'heat-shield'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La chaîne de sécurité', 'The safety chain'),
      subtitle: l('Des chiffres, sans récit', 'Numbers, with no story'),
      number: NUMBER,
      scale: '—',
    });
    draw(d);
    return d;
  },
};
