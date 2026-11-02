import { Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { MODEL } from '../data/figures';
import { BENCH_INK, box, DRUM, grid, heading, LOST, modelTag } from './draw';
import { cat, fig, lab, PC } from './geom';
import { theDay } from './model';

// PL-09: where a day's wood goes, as a Sankey, and the sums of « 80 to 90 % less wood », plainly. Model output; the wood's energy is derived. No source gives this split.

const NUMBER = 'PL-09';
const K = 1.08; // paper mm per % of the wood

/** A band of a Sankey, from a vertical span on the left to one on the right, in paper space. */
function band(d: Drawing, x0: number, y0: number, x1: number, y1: number, h: number, fill: string): void {
  const p = d.paper();
  const mx = (x0 + x1) / 2;
  p.pathPaper(
    `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1} L ${x1} ${y1 + h} C ${mx} ${y1 + h}, ${mx} ${y0 + h}, ${x0} ${y0 + h} Z`,
    {
      w: W.thin,
      color: fill,
      fill,
      opacity: 0.75,
    },
  );
}

function draw(d: Drawing): void {
  const p = d.paper();
  const s = theDay().summary;
  heading(d, 18, 18, l('LE BOIS D’UN JOUR, TEL QUE LES GAZ LE CÈDENT', 'A DAY’S WOOD, AS THE GASES GIVE IT UP'));
  modelTag(d, 18, 25, 88);
  const x0 = 40;
  const x1 = 164;
  let y = 44;
  const shares: [number, string, L][] = [
    [MODEL.shareDrum, DRUM, l('le bidon', 'the drum')],
    [MODEL.shareBench, BENCH_INK, l('le banc', 'the bench')],
    [MODEL.shareCore, '#b9ab90', l('le foyer et le sol', 'the core and the floor')],
    [MODEL.shareFlueIn, '#d6c8a6', l('le conduit, dans la maison', 'the flue, indoors')],
    [
      MODEL.shareLost,
      LOST,
      l('parti dehors : conduit dehors et chapeau', 'gone outside: the outdoor flue and the cap'),
    ],
    [MODEL.shareUnburned, '#555', l('non brûlé', 'unburned')],
  ];
  const total = shares.reduce((a, b) => a + b[0], 0);
  p.rect([x0 - 8, y], [x0, y + total * K], { w: W.medium, fill: '#c8a877' });
  p.text([x0 - 4, y - 2], fig('woodKwh', 'D', ' kWh'), {
    size: 2.3,
    anchor: 'middle',
    weight: 'bold',
    baseline: 'bottom',
  });
  let yr = y - 4;
  for (const [pct, color, name] of shares) {
    const h = pct * K;
    band(d, x0, y, x1, yr, h, color);
    p.text([x1 + 3, yr + h / 2 - 1.5], lab(pct, 0, 'M', PC), {
      size: 2.6,
      weight: 'bold',
      baseline: 'middle',
      color: '#b3261e',
    });
    p.text([x1 + 18, yr + h / 2 - 1.5], name, { size: 2, baseline: 'middle' });
    y += h;
    yr += h + 5;
  }
  p.text(
    [40, yr + 5],
    l(
      'Arrondis ; leur somme fait 101. Aucune source ne donne ce partage.',
      'Rounded; they add to 101. No source gives this split.',
    ),
    { size: 1.9, italic: true, baseline: 'top' },
  );
  p.text(
    [40, yr + 9.5],
    cat(
      l('Rendu à la maison : ', 'Delivered to the house: '),
      lab(s.delivered * 100, 0, 'M', PC),
      l(', dans une plage plausible de ', ', in a plausible range of '),
      lab(MODEL.etaLow, 0, 'M', PC),
      l(' à ', ' to '),
      lab(MODEL.etaHigh, 0, 'M', PC),
      l(' ; par un calcul de fumées : ', '; by a flue calculation: '),
      lab(s.flueEfficiency * 100, 0, 'M', PC),
    ),
    { size: 2.1, weight: 'bold', baseline: 'top' },
  );

  // ---- what leaves the house
  const cols = [
    { label: l('Ce que perd la maison', 'What the house loses'), w: 66 },
    { label: l('kWh par jour', 'kWh a day'), w: 26, align: 'end' as const, mono: true },
  ];
  const k = (v: number) => lab(v, 1, 'M', '');
  grid(
    d,
    288,
    44,
    cols,
    [
      [l('Par les murs, avec l’air de base', 'Through the walls, with the base air'), k(s.envelopeKWh)],
      [l('Derrière le banc, vers le dehors', 'Behind the bench, to the outside'), k(s.behindKWh)],
      [l('Sous la dalle, vers le sol', 'Under the slab, to the ground'), k(s.groundKWh)],
      [l('Apports : personnes, appareils, soleil', 'Gains: people, appliances, sun'), k(s.gainsKWh)],
    ],
    { size: 1.9, pad: 0.7, lineH: 2.8 },
  );

  // ---- the claim
  heading(d, 18, 197, l('« 80 À 90 % DE BOIS EN MOINS » : LE COMPTE', '“80 TO 90 % LESS WOOD”: THE SUM'));
  const claims = [
    { label: l('Poêle réel de l’ancienne maison', 'The old house’s real stove'), w: 74 },
    { label: l('Bois économisé, poêle seul', 'Wood saved, stove alone'), w: 44, align: 'end' as const, mono: true },
  ];
  grid(
    d,
    18,
    204,
    claims,
    [
      [l('Un vieux poêle à 35 %', 'An old stove at 35 %'), lab(MODEL.saved35, 0, 'M', PC)],
      [l('Un poêle à 50 %', 'A stove at 50 %'), lab(MODEL.saved50, 0, 'M', PC)],
      [l('Un poêle à 72 %', 'A stove at 72 %'), lab(MODEL.saved72, 0, 'M', PC)],
      [
        l('Pour économiser 80 %, il aurait fallu', 'To save 80 %, it would have had to be at'),
        lab(MODEL.oldFor80, 0, 'M', PC),
      ],
      [
        l('Pour économiser 90 %, il aurait fallu', 'To save 90 %, it would have had to be at'),
        lab(MODEL.oldFor90, 0, 'M', PC),
      ],
      [
        l('Le vieux poêle à 35 %, et une maison isolée', 'The old 35 % stove, and an insulated house'),
        lab(MODEL.savedBoth, 0, 'M', PC),
      ],
    ],
    { size: 1.95, pad: 0.65, lineH: 2.9 },
  );
  box(d, 146, 204, 80, l('DIT SANS DÉTOUR', 'SAID PLAINLY'), [
    l(
      'Le chiffre ne boucle pas avec le poêle seul. Il faut un ancien poêle au ralenti, ou isoler. Aucune mesure ne compare ces poêles dans une même maison.',
      'The figure does not balance from the stove alone. It takes an old stove on a slow burn, or insulation. No measurement compares these stoves in one house.',
    ),
  ]);
  box(d, 288, 86, 114, l('DEUX FEUX, QUELLE MAISON ?', 'TWO FIRES, WHICH HOUSE?'), [
    {
      bullet: '·',
      t: cat(
        l('Deux feux rendent ', 'Two fires deliver '),
        lab(MODEL.meanKw, 1, 'M', ' kW'),
        l(
          ' jour et nuit. Une maison qui perd plus en demande davantage.',
          ' day and night. A house that loses more asks for more.',
        ),
      ),
    },
    {
      bullet: '·',
      t: cat(
        l('Pour 20 °C : ', 'For 20 °C: '),
        lab(MODEL.wood20, 1, 'M', ' kg'),
        l(' ici, ', ' here, '),
        lab(MODEL.woodSnap, 1, 'M', ' kg'),
        l(' par grand froid, ', ' in hard frost, '),
        lab(MODEL.woodLeaky, 0, 'M', ' kg'),
        l(' dans une maison qui fuit.', ' in a leaky house.'),
      ),
    },
    {
      bullet: '·',
      t: l('C’est l’isolation qui fait l’essentiel, pas le poêle.', 'Insulation does most of it, not the heater.'),
    },
  ]);
}

export const energyDay: DrawingSheet = {
  id: 'energy-day',
  number: NUMBER,
  group: 'model',
  title: l('Où va le bois d’un jour', 'Where a day’s wood goes'),
  description: l(
    'Les quelque 52 kWh d’une journée, tels que les gaz les cèdent, puis ce que perd la maison, et le compte de « 80 à 90 % de bois en moins ». Aucune source ne donne ce partage : c’est le résultat d’un modèle, et le rendement dépend d’abord d’une ouverture que personne n’a chiffrée.',
    'The some 52 kWh of a day, as the gases give them up, then what the house loses, and the sum of “80 to 90 % less wood”. No source gives this split: it is a model’s result, and the efficiency rests first on an opening nobody has measured.',
  ),
  scene: 'homestead',
  parts: ['house-shell', 'cordwood-stack', 'coppice-lot'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Où va le bois d’un jour', 'Where a day’s wood goes'),
      subtitle: l('Résultats du modèle', 'Model results'),
      number: NUMBER,
      scale: '—',
    });
    draw(d);
    return d;
  },
};
