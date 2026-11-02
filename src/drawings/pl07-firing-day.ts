import { Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { MODEL } from '../data/figures';
import { BENCH_INK, box, chart, COOL, DRUM, heading, HOT, modelTag, ROOM_INK } from './draw';
import { fig, lab } from './geom';
import { J, theDay } from './model';

// PL-07: the day: when the fires burn, the seat, the room and what each part gives, in hours. Model output. The seat's peak is read from the same series as the panel: one to two hours after the flame.

const NUMBER = 'PL-07';

function draw(d: Drawing): void {
  const day = theDay();
  const h = day.hours;
  const s = day.series;
  const spans: [number, number][] = [
    [J.morningHour, J.morningHour + J.sessionHours],
    [J.eveningHour, J.eveningHour + J.sessionHours],
  ];
  const kw = (a: Float64Array): Float64Array => a.map((v) => v / 1000);
  const hhmm = (v: number): string => `${String(v).padStart(2, '0')}:00`;
  const xAxis = {
    xMin: 0,
    xMax: 24,
    xTicks: [0, 6, 12, 18, 24],
    xLabel: l('Heure de la journée', 'Hour of the day'),
    spans,
    xFormat: hhmm,
  };

  heading(d, 18, 18, l('UNE JOURNÉE, UNE FOIS LE RYTHME PRIS', 'A DAY, ONCE THE RHYTHM HAS SETTLED'));
  modelTag(d, 18, 25, 88);
  d.paper().text(
    [110, 27.6],
    l('Les bandes orangées : les deux séances de feu', 'Orange bands: the two sessions of fire'),
    { size: 1.9, baseline: 'middle' },
  );

  // the seat and the room
  const toPaper = chart(
    d,
    34,
    40,
    240,
    86,
    [
      { x: h, y: s.seat0, color: BENCH_INK, label: l('Assise, bout chaud', 'Seat, hot end'), w: W.thick },
      { x: h, y: s.seat5, color: '#d9b76f', label: l('Assise, bout froid', 'Seat, cold end') },
      { x: h, y: s.room, color: ROOM_INK, label: l('Pièce', 'Room'), w: W.thick },
      { x: h, y: s.outside, color: COOL, label: l('Dehors', 'Outside'), dash: 'hidden' },
    ],
    {
      ...xAxis,
      yMin: -5,
      yMax: 35,
      yTicks: [-5, 0, 5, 10, 15, 20, 25, 30, 35],
      yLabel: l('Température (°C)', 'Temperature (°C)'),
      legendAt: 2,
    },
  );
  // the peak
  const peak = day.summary.peakHourHot;
  const [px, py] = toPaper(peak, day.summary.seatHotPeak);
  const p = d.paper();
  p.circle([px, py], 1.2, { w: W.medium, color: BENCH_INK, fill: '#fff' });
  p.text(
    [px - 2, py - 3],
    l('la flamme est morte depuis près de deux heures', 'the flame has been dead for nearly two hours'),
    { size: 1.9, weight: 'bold', anchor: 'end', baseline: 'bottom', halo: true },
  );

  // the powers
  chart(
    d,
    34,
    148,
    240,
    86,
    [
      { x: h, y: kw(s.drumOut), color: DRUM, label: l('Le bidon rend', 'The drum gives'), w: W.thick },
      { x: h, y: kw(s.benchOut), color: BENCH_INK, label: l('Le banc rend', 'The bench gives'), w: W.thick },
      { x: h, y: kw(s.coreOut), color: '#9b8f7a', label: l('Le foyer et le sol', 'The core and the floor') },
      {
        x: h,
        y: kw(s.fire).map((v) => v / 3),
        color: HOT,
        label: l('Le feu, divisé par 3', 'The fire, divided by 3'),
        dash: 'hidden',
      },
    ],
    { ...xAxis, yMin: 0, yMax: 4, yTicks: [0, 1, 2, 3, 4], yLabel: l('Puissance (kW)', 'Power (kW)'), legendAt: 2 },
  );

  // the reading
  let y = 40;
  y = box(d, 288, y, 114, l('CE QUE DIT LE MODÈLE', 'WHAT THE MODEL SAYS'), [
    {
      bullet: '·',
      t: l(
        'Un feu est une séance menée, pas une brassée et un départ.',
        'A fire is a tended session, not an armful and away.',
      ),
    },
    {
      bullet: '·',
      t: l('L’assise culmine une à deux heures après la flamme.', 'The seat peaks one to two hours after the flame.'),
    },
    {
      bullet: '·',
      t: l(
        'Le bidon donne deux fois la chaleur du banc, et par grands coups.',
        'The drum gives twice the bench’s heat, in great bursts.',
      ),
    },
    {
      bullet: '·',
      t: l('La banquette lisse. Elle ne porte pas la maison.', 'The bench smooths. It does not carry the house.'),
    },
  ]);
  y += 3;
  const rows: [ReturnType<typeof l>, ReturnType<typeof fig>][] = [
    [l('Bois du jour', 'Wood of the day'), fig('woodDay', 'R', ' kg')],
    [l('Assise, bout chaud', 'Seat, hot end'), lab(MODEL.seatLow, 1, 'M', ' °C')],
    [l('à son plus haut', 'at its highest'), lab(MODEL.seatHigh, 1, 'M', ' °C')],
    [l('Pièce, au plus bas', 'Room, at its lowest'), lab(MODEL.roomLow, 1, 'M', ' °C')],
    [l('Pièce, au plus haut', 'Room, at its highest'), lab(MODEL.roomHigh, 1, 'M', ' °C')],
    [l('Après l’arrêt du bois, le pic', 'After the wood stops, the peak'), lab(MODEL.lagStop, 1, 'M', ' h')],
    [l('Le bidon, sur un jour', 'The drum, over a day'), lab(MODEL.kwhDrum, 0, 'M', ' kWh')],
    [l('Le banc, sur un jour', 'The bench, over a day'), lab(MODEL.kwhBench, 0, 'M', ' kWh')],
  ];
  rows.forEach(([label, value], i) => {
    p.text([290, y + 2 + i * 4.4], label, { size: 2, baseline: 'middle' });
    p.text([400, y + 2 + i * 4.4], value, { size: 2.1, anchor: 'end', baseline: 'middle', mono: true, weight: 'bold' });
  });
  y += rows.length * 4.4 + 4;
  box(d, 288, y, 114, l('LA RÉSERVE', 'THE CAVEAT'), [
    l(
      'Un seul récit réel parle de 1 à 2 °C perdus la nuit, dans une yourte ; notre pièce bouge davantage. Une maison plus lourde bougerait moins, sans brûler moins de bois. Et personne n’a publié une journée relevée dans une maison habitée.',
      'The one real account speaks of 1 to 2 °C lost overnight, in a yurt; our room moves more. A heavier house would move less, without burning less wood. And nobody has published a logged day in a lived-in house.',
    ),
  ]);
}

export const firingDay: DrawingSheet = {
  id: 'firing-day',
  number: NUMBER,
  group: 'model',
  title: l('Une journée de deux feux', 'A day of two fires'),
  description: l(
    'Vingt-quatre heures de la machine, une fois le rythme pris : les deux séances de feu, l’assise aux deux bouts du banc, la pièce, le dehors, puis ce que rend chacun. Le bidon par grands coups, le banc lentement. Ce sont des résultats du modèle.',
    'Twenty-four hours of the machine, once the rhythm has settled: the two sessions of fire, the seat at both ends of the bench, the room, the outside, then what each gives. The drum in great bursts, the bench slowly. These are model results.',
  ),
  scene: 'living-room',
  parts: ['steel-drum', 'cob-bench', 'wood-basket', 'inner-stone-wall'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Une journée de deux feux', 'A day of two fires'),
      subtitle: l('Résultats du modèle', 'Model results'),
      number: NUMBER,
      scale: '—',
    });
    draw(d);
    return d;
  },
};
