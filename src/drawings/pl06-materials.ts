import { Drawing, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { box, grid, heading, marksLegend } from './draw';
import { cat, fig } from './geom';

// PL-06: the materials and why, with the makers' data. A nomenclature, not a shopping list: no quantity to order, no mix, no mortar. Every figure is reported (the makers, a measured cob, a standard read in its catalogue) or from src/data/figures.ts with its mark.

const NUMBER = 'PL-06';

function draw(d: Drawing): void {
  heading(d, 18, 18, l('CHAQUE MATIÈRE, ET POURQUOI', 'EACH MATERIAL, AND WHY'));
  const cols = [
    { label: l('Matière', 'Material'), w: 52 },
    { label: l('Où', 'Where'), w: 54 },
    { label: l('Chiffres', 'Figures'), w: 122 },
    { label: l('Pourquoi', 'Why'), w: 88 },
    { label: l('D’où vient le chiffre', 'Where the figure comes from'), w: 72 },
  ];
  const rows = [
    [
      l('Brique réfractaire dense', 'Dense firebrick'),
      l('Le socle, le tunnel, le tube', 'The base, the tunnel, the feed'),
      l(
        '1 750 à 2 300 kg/m³ ; 0,90 à 1,35 W/m·K entre 20 et 400 °C',
        '1,750 to 2,300 kg/m³; 0.90 to 1.35 W/m·K between 20 and 400 °C',
      ),
      l('Elle tient au feu, et elle le garde chaud', 'It stands the fire, and keeps it hot'),
      l('une norme européenne, lue au catalogue', 'a European standard, read in its catalogue'),
    ],
    [
      l('Brique isolante', 'Insulating firebrick'),
      l('Autour de la cheminée interne', 'Round the riser'),
      l(
        '480 kg/m³ ; 1 260 °C au plus ; 0,14, 0,16 et 0,17 W/m·K à 400, 600 et 800 °C',
        '480 kg/m³; 1,260 °C at most; 0.14, 0.16 and 0.17 W/m·K at 400, 600 and 800 °C',
      ),
      l('Elle garde brûlant le haut de la cheminée interne', 'It keeps the riser’s top scorching'),
      l('la fiche d’un fabricant', 'a maker’s data sheet'),
    ],
    [
      l('Couverture de fibre à faible biopersistance', 'Low-biopersistence fibre blanket'),
      l('Une autre école pour la même place', 'Another school for the same place'),
      l(
        '128 kg/m³ ; 1 200 °C au plus ; 0,08, 0,12 et 0,18 W/m·K à 400, 600 et 800 °C',
        '128 kg/m³; 1,200 °C at most; 0.08, 0.12 and 0.18 W/m·K at 400, 600 and 800 °C',
      ),
      l(
        'Plus légère ; sa poussière demande des précautions de fiche',
        'Lighter; its dust calls for the sheet’s precautions',
      ),
      l('la fiche d’un fabricant', 'a maker’s data sheet'),
    ],
    [
      l('Perlite', 'Perlite'),
      l('Une troisième école', 'A third school'),
      l(
        'Environ 0,078 W/m·K à 200 °C, 0,092 à 300 °C ; aucune valeur trouvée à 600 °C',
        'About 0.078 W/m·K at 200 °C, 0.092 at 300 °C; no value found at 600 °C',
      ),
      l('Dans le modèle, à un point des deux autres', 'In the model, within a point of the other two'),
      l('une courbe calculée, source faible', 'a calculated curve, a weak source'),
    ],
    [
      l('Acier mince', 'Thin steel'),
      l('Le bidon, la chemise, le conduit', 'The drum, the sleeve, the duct'),
      l(
        'Paroi du bidon 1,2 mm environ ; 585 × 880 mm ; corrosion rapide au-delà de 760 °C, selon un concepteur',
        'Drum wall about 1.2 mm; 585 × 880 mm; fast corrosion above 760 °C, according to one designer',
      ),
      l('Une paroi sans inertie : la chaleur tout de suite', 'A wall with no inertia: heat at once'),
      l('des fiches de vendeurs ; un concepteur', 'sellers’ sheets; one designer'),
    ],
    [
      l('Terre, dite « cob » en anglais', 'Earth, or cob'),
      l('L’enveloppe du foyer, la banquette', 'The core’s casing, the bench'),
      cat(
        l(
          'Environ 0,6 W/m·K à l’état humide ; 891 J/kg·K à 3 % d’humidité ; les études vont de 0,12 à 1,06 W/m·K ; ',
          'About 0.6 W/m·K in its damp state; 891 J/kg·K at 3 % moisture; studies run from 0.12 to 1.06 W/m·K; ',
        ),
        fig('cobRho', 'E', ' kg/m³'),
      ),
      l('Lente exprès : elle retarde et elle lisse', 'Slow on purpose: it delays and smooths'),
      l(
        'une mesure publiée, une revue d’études ; densité estimée',
        'a published measurement, a review of studies; density estimated',
      ),
    ],
    [
      l('Pierre', 'Stone'),
      l('Dans la masse du banc', 'In the bench’s mass'),
      cat(
        l('Densité ', 'Density '),
        fig('stoneRho', 'E', ' kg/m³'),
        l(' ; part dans le modèle ', '; share in the model '),
        fig('stoneShare', 'E', l(' %', '%')),
      ),
      l('Moins de séchage, plus de densité', 'Less drying, more density'),
      l('des constructeurs, sans chiffre ; valeur usuelle', 'builders, without a figure; a usual value'),
    ],
    [
      l('Béton', 'Concrete'),
      l('La dalle', 'The slab'),
      cat(
        l(
          '100 mm dans notre dessin, repris d’un projet de texte ; charge sous le banc ',
          '100 mm in our drawing, from a draft text; load under the bench ',
        ),
        fig('floorKn', 'D', ' kN/m²'),
      ),
      l(
        'Porter environ 3 t sans bouger : un sol qui tasse fissure la terre',
        'Carrying about 3 t without moving: a settling floor cracks the earth',
      ),
      l('un projet de texte ; le calcul', 'a draft text; the sum'),
    ],
    [
      l('Enduit de terre', 'Earthen plaster'),
      l('La peau du banc', 'The bench’s skin'),
      l('Aucun chiffre : ni mélange, ni épaisseur', 'No figure: neither mix nor thickness'),
      l('Une fissure s’y lit', 'A crack can be read in it'),
      l('pratique courante', 'usual practice'),
    ],
    [
      l('Joint de porte de poêle', 'Stove-door gasket'),
      l('Le couvercle du bidon, les trappes', 'The drum’s lid, the doors'),
      l('Aucun chiffre', 'No figure'),
      l('Un couvercle qu’on peut ouvrir, puis refermer', 'A lid that can be opened, then closed again'),
      l('des constructeurs', 'builders'),
    ],
  ];
  const h = grid(d, 18, 26, cols, rows, { size: 2.2, pad: 1.3, lineH: 3.4 });
  const y = 26 + h + 4;
  box(d, 18, y, 200, l('CE QUE CETTE PLANCHE N’EST PAS', 'WHAT THIS SHEET IS NOT'), [
    {
      bullet: '·',
      t: l(
        'Pas une liste de courses : aucune quantité à commander, aucun nombre de briques, aucun mélange de terre ou de mortier.',
        'No shopping list: no quantity to order, no brick count, no mix of earth or mortar.',
      ),
    },
    {
      bullet: '·',
      t: l(
        'Un bidon récupéré, une fibre ordinaire, de l’acier galvanisé : chacun son danger, dit une fois dans le guide de montage.',
        'A recovered drum, ordinary fibre, galvanised steel: each its hazard, said once in the assembly guide.',
      ),
    },
  ]);
  marksLegend(d, 18 + 204, y, 88);
}

export const materialsExplained: DrawingSheet = {
  id: 'materials-explained',
  number: NUMBER,
  group: 'fire-core',
  title: l('Les matières, et pourquoi', 'The materials, and why'),
  description: l(
    'Une nomenclature de ce dont la machine est faite, avec les données des fabricants, la raison de chaque choix et d’où vient chaque chiffre. Ce n’est pas une liste de courses : ni quantité, ni mélange, ni mortier.',
    'A nomenclature of what the machine is made of, with the makers’ data, the reason for each choice and where each figure comes from. It is no shopping list: no quantity, no mix, no mortar.',
  ),
  scene: 'fire-core',
  parts: ['firebrick-base', 'riser-insulation', 'riser-sleeve', 'core-casing', 'drum-seal'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Les matières, et pourquoi', 'The materials, and why'),
      subtitle: l('Une nomenclature, pas une liste de courses', 'A nomenclature, not a shopping list'),
      number: NUMBER,
      scale: '—',
    });
    draw(d);
    return d;
  },
};
