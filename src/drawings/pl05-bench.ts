import { Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { partIds } from '../data/ids';
import { THERMAL_RAMP } from '../sim/machine';
import { heatRgb } from '../sim/thermal';
import { BENCH, DUCT, MACHINE as M } from '../three/dims';
import { box, dimH, dimV, heading, marksLegend, modelTag, note, PAPER } from './draw';
import { cat, fig, lab, perMetre } from './geom';
import { benchSlice, type BenchSlice } from './model';

// PL-05: the bench's two casings, thick and thin, in section, and the model's own grid at 0, 4, 8 and 12 h after the evening fire was lit, in the same colours as the 3D. Where the heat is, when: it leaves the duct and reaches the seat.

const NUMBER = 'PL-05';
const SCALE = 6;
/** Hours after the evening fire is lit, and the clock they fall on. */
export const MOMENTS: readonly [after: number, hour: number][] = [
  [0, 18],
  [4, 22],
  [8, 2],
  [12, 6],
];
const out: [number, number, number] = [0, 0, 0];

/** The colour of a temperature, from the same ramp as the 3D's thermal view. */
export function rampColor(T: number): string {
  heatRgb(THERMAL_RAMP, T, out);
  const c = (v: number): number => {
    const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, s)) * 255);
  };
  return `rgb(${c(out[0])},${c(out[1])},${c(out[2])})`;
}

function map(d: Drawing, s: BenchSlice, x: number, y: number, k: number): void {
  const p = d.paper();
  const w = s.cols.length - 1;
  const h = s.rows.length - 1;
  const X = (m: number): number => x + m * k;
  const Y = (m: number): number => y + (M.benchHeight - m) * k;
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      const T = s.T[c + w * r]!;
      const duct = c === s.ductCol && r === s.ductRow;
      p.rect([X(s.cols[c]!), Y(s.rows[r + 1]!)], [X(s.cols[c + 1]!), Y(s.rows[r]!)], {
        w: W.thin,
        color: '#9a9488',
        fill: duct ? PAPER : rampColor(T),
      });
      if (!duct)
        p.text([X((s.cols[c]! + s.cols[c + 1]!) / 2), Y((s.rows[r]! + s.rows[r + 1]!) / 2)], lab(T, 0, 'M', ''), {
          size: 1.7,
          anchor: 'middle',
          baseline: 'middle',
          mono: true,
        });
    }
  p.rect([X(0), Y(M.benchHeight)], [X(M.benchDepth), Y(0)], { w: W.medium });
}

function draw(d: Drawing): void {
  const p = d.paper();
  // ---- the two casings, drawn from dims.ts
  heading(d, 18, 18, l('DEUX ÉPAISSEURS DE TERRE', 'TWO THICKNESSES OF EARTH'));
  const k = perMetre(SCALE);
  const section = (ox: number, axis: number, cover: number, title: ReturnType<typeof l>): void => {
    const v = d.view(ox, 124, k);
    v.rect([0, 0], [BENCH.depth, BENCH.height], { w: W.medium, fill: '#e8d9bd', hatch: 'earth' });
    v.rect([0, 0], [BENCH.depth, BENCH.barrier], { w: W.thin, fill: '#d6d0c2' });
    v.rect([0, BENCH.height - BENCH.plaster], [BENCH.depth, BENCH.height], { w: W.thin, fill: '#f0e6d2' });
    v.circle([BENCH.depth / 2, axis], DUCT.r, { w: W.thick, fill: PAPER });
    v.rect([-0.06, 0], [0, BENCH.height + 0.06], { w: W.medium, fill: '#d9d2c4' });
    v.text([BENCH.depth / 2, BENCH.height + 0.09], title, {
      size: 2.2,
      anchor: 'middle',
      weight: 'bold',
      baseline: 'bottom',
    });
    dimH(v, [0, 0], [BENCH.depth, 0], -0.07, lab(BENCH.depth, 2, 'E'), 2);
    dimV(v, [BENCH.depth, 0], [BENCH.depth, BENCH.height], BENCH.depth + 0.07, lab(BENCH.height, 2, 'E'), 2);
    dimV(
      v,
      [BENCH.depth / 2 + DUCT.r, axis + DUCT.r],
      [BENCH.depth / 2 + DUCT.r, BENCH.height],
      BENCH.depth / 2 + DUCT.r + 0.04,
      lab(cover * 100, 0, 'D', ' cm'),
      2,
    );
    dimH(
      v,
      [BENCH.depth / 2 - DUCT.r, axis],
      [BENCH.depth / 2 + DUCT.r, axis],
      axis - DUCT.r - 0.03,
      lab(M.bore * 1000, 0, 'R', ' mm'),
      1.8,
    );
  };
  section(30, DUCT.axisHot, BENCH.coverHot, l('Début du banc', 'Start of the bench'));
  section(138, DUCT.axisCold, BENCH.coverCold, l('Fin du banc', 'End of the bench'));
  marksLegend(d, 22, 142, 104, [], {
    derived: l(
      'dérivée d’un projet de texte (pouces) : ses mots, pas une règle',
      'derived from a draft text (inches): its words, not a rule',
    ),
  });
  box(d, 132, 142, 94, l('À LIRE', 'TO READ'), [
    {
      bullet: '·',
      t: l(
        'Dos au mur, à gauche. Dessus, l’enduit ; dessous, la couche sur la dalle.',
        'Back to the wall, on the left. Above, the plaster; below, the floor layer.',
      ),
    },
    {
      bullet: '·',
      t: l(
        'Aucun mélange, aucune pierre placée : ce n’est pas un plan de pose.',
        'No mix, no stone placed: this is no laying plan.',
      ),
    },
  ]);

  // ---- the maps
  heading(d, 240, 18, l('LA CHALEUR QUI TRAVERSE, SOIRÉE ET NUIT', 'HEAT CROSSING, EVENING AND NIGHT'));
  modelTag(d, 240, 25, 88);
  const kMap = 95;
  const W_ = M.benchDepth * kMap;
  const H_ = M.benchHeight * kMap;
  const x0 = 254;
  const y0 = 38;
  MOMENTS.forEach(([after, hour], i) => {
    const y = y0 + i * (H_ + 6);
    p.text([x0 - 2, y + H_ / 2], lab(after, 0, 'M', ' h'), {
      size: 2.4,
      anchor: 'end',
      weight: 'bold',
      baseline: 'middle',
    });
    map(d, benchSlice(hour, 0), x0, y, kMap);
    map(d, benchSlice(hour, 5), x0 + W_ + 12, y, kMap);
  });
  p.text([x0 + W_ / 2, y0 - 1.6], l('début du banc', 'start of the bench'), {
    size: 1.9,
    anchor: 'middle',
    baseline: 'bottom',
    weight: 'bold',
  });
  p.text([x0 + W_ + 12 + W_ / 2, y0 - 1.6], l('fin du banc', 'end of the bench'), {
    size: 1.9,
    anchor: 'middle',
    baseline: 'bottom',
    weight: 'bold',
  });
  note(
    d,
    240,
    y0 + 4 * (H_ + 6) - 1,
    170,
    cat(
      l(
        'Heures après l’allumage du soir, à 18:00 ; le feu s’arrête à 20:30. Dans chaque case, sa température en °C, moyenne de maille ; la case vide est le conduit. Le plus chaud tombe entre deux cartes, à 20:45, au début du banc : ',
        'Hours after the evening’s lighting, at 18:00; the fire stops at 20:30. In each box, its temperature in °C, a cell’s mean; the empty box is the duct. The hottest falls between two maps, at 20:45, at the start of the bench: ',
      ),
      fig('earthDuct', 'M', ' °C'),
      l(' au-dessus du conduit, ', ' above the duct, '),
      fig('earthBeside', 'M', ' °C'),
      l(' dans la case côté mur.', ' in the box on the wall’s side.'),
    ),
    { size: 1.7 },
  );
  // the scale of colours
  const yK = 200;
  for (let T = 15; T < 65; T += 1)
    p.rect([240 - 212 + (T - 15) * 2, yK], [240 - 212 + (T - 14) * 2, yK + 4], {
      w: 0,
      color: rampColor(T + 0.5),
      fill: rampColor(T + 0.5),
    });
  p.rect([28, yK], [128, yK + 4], { w: W.thin });
  for (const T of [15, 25, 35, 45, 55, 65])
    p.text([28 + (T - 15) * 2, yK + 5.2], `${T}`, { size: 1.8, anchor: 'middle', baseline: 'top', mono: true });
  p.text([28, yK - 1.4], l('Échelle de couleurs de la vue thermique (°C)', 'Colour scale of the thermal view (°C)'), {
    size: 1.9,
    baseline: 'bottom',
    weight: 'bold',
  });
}

export const benchCrossSections: DrawingSheet = {
  id: 'bench-cross-sections',
  number: NUMBER,
  group: 'bench-section',
  title: l('Le banc en coupe', 'The bench in section'),
  description: l(
    'Les deux épaisseurs de terre, puis la grille même du modèle à 0, 4, 8 et 12 heures après l’allumage du soir, aux deux bouts du banc. On y voit la chaleur quitter le conduit et monter vers l’assise. Ce sont des résultats du modèle, aux couleurs de la vue thermique.',
    'The two thicknesses of earth, then the model’s own grid at 0, 4, 8 and 12 hours after the evening’s lighting, at both ends of the bench. Heat can be seen leaving the duct and climbing to the seat. These are model results, in the thermal view’s colours.',
  ),
  scene: 'bench-section',
  parts: partIds('bench-section'),
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le banc en coupe', 'The bench in section'),
      subtitle: l('Coupes et cartes de température du modèle', 'Sections and the model’s temperature maps'),
      number: NUMBER,
      scale: `1:${SCALE}`,
    });
    draw(d);
    return d;
  },
};
