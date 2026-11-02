import { Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { box, chart, COOL, grid, heading, HOT, modelTag } from './draw';
import { cat, fig, lab } from './geom';
import { coldFlue, fullBurn } from './model';

// PL-08: the draught budget: the pressure along the path at full burn and with a cold flue, and who pays and who gives. Model output, beside the hand sums of the research, told apart.

const NUMBER = 'PL-08';

function draw(d: Drawing): void {
  const hot = fullBurn();
  const cold = coldFlue();
  heading(d, 18, 18, l('LE BUDGET DU TIRAGE', 'THE DRAUGHT BUDGET'));
  modelTag(d, 18, 25, 88);
  const end = Math.ceil(hot.s[hot.s.length - 1]!);
  chart(
    d,
    34,
    42,
    240,
    100,
    [{ x: hot.s, y: hot.p, color: HOT, label: l('À plein feu', 'At full fire'), w: W.thick }],
    {
      xMin: 0,
      xMax: end,
      yMin: -20,
      yMax: 5,
      xTicks: [0, 5, 10, 15, 20],
      yTicks: [-20, -15, -10, -5, 0, 5],
      xLabel: l(
        'Distance le long du chemin (m), de l’entrée du tube au chapeau',
        'Distance along the path (m), from the feed’s entry to the cap',
      ),
      yLabel: l('Pression contre l’air d’à côté (Pa)', 'Pressure against the air beside it (Pa)'),
    },
  );
  chart(
    d,
    34,
    164,
    240,
    70,
    [
      {
        x: cold.s,
        y: cold.p,
        color: COOL,
        label: l('Conduit froid, −5 °C dehors', 'Cold flue, −5 °C outside'),
        w: W.thick,
      },
    ],
    {
      xMin: 0,
      xMax: end,
      yMin: -2,
      yMax: 2,
      xTicks: [0, 5, 10, 15, 20],
      yTicks: [-2, -1, 0, 1, 2],
      xLabel: l('Distance le long du chemin (m)', 'Distance along the path (m)'),
      yLabel: l('Pression contre l’air d’à côté (Pa)', 'Pressure against the air beside it (Pa)'),
    },
  );

  const cols = [
    { label: l('Terme', 'Term'), w: 54 },
    { label: l('À la main', 'By hand'), w: 24, align: 'end' as const, mono: true },
    { label: l('Modèle', 'Model'), w: 26, align: 'end' as const, mono: true },
  ];
  const pa = (v: number) => lab(v, 1, 'M', ' Pa');
  const h = grid(
    d,
    288,
    42,
    cols,
    [
      [l('Cheminée interne', 'Riser'), lab(7.2, 1, 'D', ' Pa'), pa(hot.riser)],
      [l('Chute dans le bidon', 'Fall in the drum'), lab(-5.9, 1, 'D', ' Pa'), pa(hot.fall)],
      [l('Les deux', 'The two'), lab(1.3, 1, 'D', ' Pa'), pa(hot.riser + hot.fall)],
      [l('Conduit vertical, chaud', 'Chimney, warm'), lab(14.4, 1, 'D', ' Pa'), pa(hot.chimney)],
      [l('Tirage disponible', 'Draught on hand'), '—', pa(hot.draft)],
      [l('Sous le couvercle du bidon', 'Under the drum’s lid'), '—', pa(hot.lid)],
      [l('Conduit froid', 'Cold flue'), lab(-5.5, 1, 'D', ' Pa'), pa(cold.draft)],
    ],
    { size: 1.95, pad: 0.7, lineH: 2.9 },
  );
  box(d, 288, 42 + h + 4, 114, l('CE QU’IL FAUT EN RETENIR', 'WHAT TO KEEP'), [
    {
      bullet: '·',
      t: cat(
        l(
          'La colonne du modèle se lit à 09:00, le conduit froid à part. Sur tout un feu à plein régime, le tirage moyen est de ',
          'The model’s column is read at 09:00, the cold flue apart. Over a whole fire at full rate, the mean draught is ',
        ),
        fig('draft', 'M', ' Pa'),
        l(' : le chiffre « en moyenne d’un feu » des textes du labo.', ': the “mean of a fire” of the lab’s texts.'),
      ),
    },
    {
      bullet: '·',
      t: l(
        'C’est le conduit vertical qui tire. La cheminée interne et le bidon s’annulent presque.',
        'The chimney is what pulls. The riser and the drum nearly cancel out.',
      ),
    },
    {
      bullet: '·',
      t: l(
        'Près de 85 % du tirage se perdent à l’entrée, dans le passage laissé au feu.',
        'Nearly 85 % of the draught is lost at the entry, in the way left to the fire.',
      ),
    },
    {
      bullet: '·',
      t: l(
        'La main, avec de l’air de pièce tout du long, donnait bien plus pour un conduit froid : au-dessus du toit, le dehors est aussi froid que lui.',
        'By hand, with room air all the way, a cold flue gave far more: above the roof the outside is as cold as the flue.',
      ),
    },
    {
      bullet: '·',
      t: l(
        'Le moment où un feu retourne le courant est le chiffre le moins sûr ici.',
        'The moment a fire turns the flow round is the least sure figure here.',
      ),
    },
    {
      bullet: '·',
      t: l(
        'Un conduit plus bas donne un meilleur rendement et moins de marge sous le couvercle : ce n’est pas un conseil.',
        'A lower chimney gives better efficiency and less margin under the lid: this is no advice.',
      ),
    },
  ]);
}

export const draftBudget: DrawingSheet = {
  id: 'draft-budget',
  number: NUMBER,
  group: 'model',
  title: l('Le budget du tirage', 'The draught budget'),
  description: l(
    'La pression le long du chemin, à plein feu puis avec un conduit froid, et le compte de ce que donne chacun : les sommes à la main d’un côté, le modèle de l’autre. C’est le conduit vertical qui tire, et l’entrée du tube qui dépense le plus.',
    'The pressure along the path, at full fire then with a cold flue, and the count of what each gives: the hand sums on one side, the model on the other. The chimney is what pulls, and the feed’s entry spends the most.',
  ),
  scene: 'fire-core',
  parts: ['feed-tube', 'heat-riser', 'downdraft-annulus', 'top-gap'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le budget du tirage', 'The draught budget'),
      subtitle: l('Résultats du modèle, sommes à la main', 'Model results, hand sums'),
      number: NUMBER,
      scale: '—',
    });
    draw(d);
    return d;
  },
};
