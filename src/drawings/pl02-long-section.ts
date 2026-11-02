import { Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { partIds } from '../data/ids';
import { chart, grid, heading, HOT, modelTag, note } from './draw';
import { cat, fig, lab } from './geom';
import { fullBurn } from './model';

// PL-02: the whole gas path unrolled, from the feed to the cap, station by station, with the model's temperatures at full burn. The stations are src/sim's; none of this is a measurement.

const NUMBER = 'PL-02';

/** The stations of src/sim/types.ts, in order: their names on the sheet. */
export const STATION_NAMES: L[] = [
  l('Entrée du tube', 'Feed’s entry'),
  l('Tunnel', 'Tunnel'),
  l('Pied de la cheminée interne', 'Riser’s foot'),
  l('Haut de la cheminée interne', 'Riser’s top'),
  l('Sous le couvercle', 'Under the lid'),
  l('Mi-chute dans le bidon', 'Halfway down the drum'),
  l('Bas du bidon', 'Drum’s foot'),
  l('Entrée du conduit', 'Duct’s inlet'),
  l('Sortie du conduit', 'Duct’s outlet'),
  l('Té de pied', 'The tee'),
  l('Plafond', 'Ceiling'),
  l('Chapeau', 'Cap'),
];

function draw(d: Drawing): void {
  const r = fullBurn();
  const p = d.paper();

  // ---- the path as a ribbon
  heading(d, 18, 18, l('LE CHEMIN DES GAZ, DÉROULÉ', 'THE GASES’ PATH, UNROLLED'));
  modelTag(d, 18, 25, 88);
  const n = r.s.length;
  const x0 = 26;
  const w = 376;
  const step = w / (n - 1);
  const y = 44;
  for (let i = 0; i < n - 1; i++) {
    const f = Math.min(1, Math.max(0, r.t[i]! / 550));
    p.rect([x0 + i * step, y], [x0 + (i + 1) * step, y + 8], {
      w: W.thin,
      fill: `rgb(${Math.round(240 - 30 * (1 - f))},${Math.round(226 - 170 * f)},${Math.round(200 - 170 * f)})`,
    });
  }
  for (let i = 0; i < n; i++) {
    const cx = x0 + i * step;
    p.line([cx, y - 2], [cx, y + 10], { w: W.thin, color: INK_2 });
    p.text([cx, y - 3], lab(r.t[i]!, 0, 'M', ' °C'), {
      size: 2,
      anchor: 'middle',
      weight: 'bold',
      baseline: 'bottom',
      mono: true,
    });
    p.text([cx, y + 11.5], STATION_NAMES[i]!, { size: 1.55, anchor: 'middle', baseline: 'top' });
  }
  p.text(
    [x0 + w / 2, y + 22],
    l(
      'Chaque case est un tronçon : les longueurs ne sont pas à l’échelle.',
      'Each box is one stretch: the lengths are not to scale.',
    ),
    {
      size: 1.8,
      anchor: 'middle',
      color: INK_2,
      italic: true,
    },
  );

  // ---- the temperature along the path
  chart(
    d,
    30,
    84,
    230,
    104,
    [{ x: r.s, y: r.t, color: HOT, label: l('Gaz, à plein feu', 'Gas, at full fire'), w: W.thick }],
    {
      xMin: 0,
      xMax: Math.ceil(r.s[n - 1]!),
      yMin: 0,
      yMax: 700,
      xTicks: [0, 5, 10, 15, 20],
      yTicks: [0, 100, 200, 300, 400, 500, 600, 700],
      xLabel: l('Distance le long du chemin (m)', 'Distance along the path (m)'),
      yLabel: l('Température (°C)', 'Temperature (°C)'),
    },
  );

  // ---- where the gas gives up its heat
  let yy = 84;
  yy = note(d, 276, yy, 126, l('Comment lire cette courbe', 'How to read this curve'), { bold: true, size: 2.2 });
  yy = note(
    d,
    276,
    yy,
    126,
    l(
      'Le gaz sort du tunnel et monte, puis il cède le gros de sa chaleur en descendant le long du bidon : voilà le pic de puissance qu’on sent dans la pièce.',
      'The gas leaves the tunnel and climbs, then gives up most of its heat falling along the drum: that is the burst of power felt in the room.',
    ),
  );
  yy = note(
    d,
    276,
    yy,
    126,
    l(
      'La courbe descend ensuite lentement sur 9 m de conduit sous la terre : c’est de là que vient ce que rendra la banquette.',
      'The curve then falls slowly over the 9 m of duct under the earth: that is where what the bench will give comes from.',
    ),
  );
  yy = note(
    d,
    276,
    yy,
    126,
    l(
      'Le modèle prend une moyenne de gaz bien mélangé : un thermocouple dans une flamme lirait plus haut. Une constructrice annonce 540 à 815 °C pour une combustion propre.',
      'The model takes a mean of well-mixed gas: a thermocouple in a flame would read higher. One builder reports 540 to 815 °C for a clean burn.',
    ),
  );
  yy = note(
    d,
    276,
    yy,
    126,
    l(
      'En sortie, tout dépend de la longueur, de la masse et du moment : les constructeurs lisent de 32 à plus de 232 °C.',
      'At the exit, all depends on length, mass and the moment: builders read 32 to over 232 °C.',
    ),
  );

  // ---- the table
  const rows = STATION_NAMES.map((name, i) => [name, lab(r.s[i]!, 1, 'M', ' m'), lab(r.t[i]!, 0, 'M', ' °C')]);
  const half = 6;
  const cols = [
    { label: l('Station', 'Station'), w: 40 },
    { label: l('Distance', 'Distance'), w: 16, align: 'end' as const, mono: true },
    { label: l('Gaz', 'Gas'), w: 16, align: 'end' as const, mono: true },
  ];
  grid(d, 18, 206, cols, rows.slice(0, half), { size: 1.75, pad: 0.5, lineH: 2.6 });
  grid(d, 96, 206, cols, rows.slice(half), { size: 1.75, pad: 0.5, lineH: 2.6 });
  note(
    d,
    174,
    206,
    50,
    cat(
      l(
        'À 09:00, feu du matin, 2,5 kg/h. La couleur du ruban suit la température. Au pied de la cheminée interne : ',
        'At 09:00, the morning fire, 2.5 kg/h. The ribbon’s colour follows the temperature. At the riser’s foot: ',
      ),
      lab(r.t[2]!, 0, 'M', ' °C'),
      l(' à cette heure, ', ' at this hour, '),
      fig('chamber', 'M', ' °C'),
      l(
        ' en moyenne d’un feu à plein régime, car le foyer se réchauffe tout du long.',
        ' as the mean of a fire at full rate, as the core warms all along.',
      ),
    ),
    { size: 1.7, color: INK_2 },
  );
}

export const longSection: DrawingSheet = {
  id: 'long-section',
  number: NUMBER,
  group: 'model',
  title: l('Le chemin des gaz, déroulé', 'The gases’ path, unrolled'),
  description: l(
    'Tout le chemin mis à plat, du tube au chapeau, avec la température du gaz à chaque station à plein feu. Ce sont des résultats du modèle. La chaleur se perd surtout le long du bidon, puis lentement sous le banc.',
    'The whole path laid flat, from the feed to the cap, with the gas temperature at each station at full fire. These are model results. Heat goes mostly along the drum, then slowly under the bench.',
  ),
  scene: 'fire-core',
  parts: partIds('fire-core'),
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le chemin des gaz, déroulé', 'The gases’ path, unrolled'),
      subtitle: l('Résultats du modèle, à plein feu', 'Model results, at full fire'),
      number: NUMBER,
      scale: '—',
    });
    draw(d);
    return d;
  },
};
