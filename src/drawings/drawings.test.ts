import { beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { DERIVED, FIG, MODEL } from '../data/figures';
import { partIds, PART_CATEGORIES, type WorldId } from '../data/ids';
import { PARTS } from '../data/parts';
import { STATIONS } from '../sim/types';
import { MACHINE } from '../three/dims';
import { PRINTED } from './geom';
import { PLAN_GROUPS, SHEETS } from './index';
import { benchSlice, coldFlue, fullBurn, theDay } from './model';
import { STATION_NAMES } from './pl02-long-section';
import { MOMENTS, rampColor } from './pl05-bench';
import { FakeElement, installFakeDom, textBoxes, type TextBox } from './test-dom';

// The ten A3 sheets by script: the contract (ids, numbers, groups, worlds, parts), a render in French and in English with no NaN, every number printed from dims.ts, src/sim or src/data/figures.ts or an allowed constant with its source, the marks, the
// cartouche « not for construction », no inner size of the core, and the model results on the sheets against the figures of the texts.

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;
const key = (id: string, lang: Lang) => `${id}/${lang}`;

beforeAll(() => {
  installFakeDom();
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
  }
  setLang('fr');
});

const boxes = (id: string, lang: Lang): TextBox[] => textBoxes(rendered.get(key(id, lang)) as FakeElement);
const flat = (id: string, lang: Lang): string =>
  boxes(id, lang)
    .map((t) => t.content)
    .join(' ')
    .replace(/\s+/g, ' ');

describe('the contract', () => {
  it('has at least the eight sheets of the bar: ten, in reading order, with their numbers and groups', () => {
    expect(SHEETS.length).toBe(10);
    expect(SHEETS.map((s) => s.number)).toEqual(
      Array.from({ length: 10 }, (_, i) => `PL-${String(i + 1).padStart(2, '0')}`),
    );
    expect(SHEETS.map((s) => s.id)).toEqual([
      'general-arrangement',
      'long-section',
      'core-section',
      'duct-plan',
      'bench-cross-sections',
      'materials-explained',
      'firing-day',
      'draft-budget',
      'energy-day',
      'safety-chain',
    ]);
    const groups = new Set(PLAN_GROUPS.map((g) => g.id));
    for (const s of SHEETS) expect(groups.has(s.group), s.id).toBe(true);
    for (const g of PLAN_GROUPS)
      expect(
        SHEETS.some((s) => s.group === g.id),
        g.id,
      ).toBe(true);
  });

  it('shows only frozen part ids of the world it opens, each once', () => {
    for (const s of SHEETS) {
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      expect(new Set(s.parts).size, s.id).toBe(s.parts!.length);
      for (const id of s.parts!) {
        expect(partIds(s.scene as WorldId), `${s.id}: ${id}`).toContain(id);
        expect(PARTS.find((p) => p.id === id)?.scene, `${s.id}: ${id}`).toBe(s.scene);
        expect(PART_CATEGORIES[s.scene as WorldId][id], id).toBeDefined();
      }
    }
    expect(SHEETS[0]!.parts).toEqual(partIds('living-room'));
    expect(SHEETS[2]!.parts).toEqual(partIds('fire-core'));
  });

  it('gives each sheet a title and a description in both languages, different, of a similar length', () => {
    for (const s of SHEETS) {
      for (const t of [s.title, s.description]) {
        expect(t.fr.length, s.id).toBeGreaterThan(5);
        expect(t.en.length, s.id).toBeGreaterThan(5);
        expect(t.fr, s.id).not.toBe(t.en);
      }
      expect(s.description.fr.length / s.description.en.length, s.id).toBeGreaterThan(0.6);
      expect(s.description.fr.length / s.description.en.length, s.id).toBeLessThan(1.7);
    }
  });
});

describe('the render', () => {
  it('has no NaN, no undefined and no placeholder, in both languages', () => {
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const t = flat(s.id, lang);
        expect(t.length, `${s.id} ${lang}`).toBeGreaterThan(100);
        expect(t, `${s.id} ${lang}`).not.toMatch(/NaN|undefined|\[object|\{\w+\}/);
      }
  });

  it('has no French left in the English sheets, the title block included', () => {
    for (const s of SHEETS) expect(flat(s.id, 'en'), s.id).not.toMatch(/[éèêàùûôîç]/);
  });

  it('marks every sheet « not for construction » in its title block, once', () => {
    for (const s of SHEETS) {
      expect(flat(s.id, 'en').match(/NOT FOR CONSTRUCTION/g)?.length, s.id).toBe(1);
      expect(flat(s.id, 'fr').match(/PAS POUR LA CONSTRUCTION/g)?.length, s.id).toBe(1);
      expect(flat(s.id, 'en').match(/educational reconstruction/gi)?.length, s.id).toBe(1);
      expect(flat(s.id, 'fr').match(/Reconstitution pédagogique/gi)?.length, s.id).toBe(1);
    }
  });

  it('stays on the sheet, away from the title block', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of boxes(s.id, lang)) {
          expect(t.x, `${s.id}: ${t.content}`).toBeGreaterThan(5);
          expect(t.x, `${s.id}: ${t.content}`).toBeLessThan(415);
          expect(t.y, `${s.id}: ${t.content}`).toBeGreaterThan(5);
          expect(t.y, `${s.id}: ${t.content}`).toBeLessThan(292);
        }
  });

  it('marks the estimates and the derived figures, and tags what the model gives', () => {
    for (const id of ['general-arrangement', 'core-section', 'duct-plan', 'bench-cross-sections']) {
      expect(flat(id, 'en'), id).toMatch(/given by a source/);
      expect(flat(id, 'en'), id).toMatch(/derived from/);
      expect(flat(id, 'en'), id).toMatch(/estimate: the sources are silent/);
    }
    for (const id of [
      'long-section',
      'bench-cross-sections',
      'firing-day',
      'draft-budget',
      'energy-day',
      'safety-chain',
    ])
      expect(flat(id, 'en'), id).toMatch(/MODEL RESULT · not a measurement/);
    expect(flat('general-arrangement', 'en')).toMatch(/0\.45 m\*/);
    expect(flat('general-arrangement', 'en')).toMatch(/5\.0 m\*/);
    expect(flat('general-arrangement', 'fr')).toMatch(/0,45 m\*/);
    expect(flat('general-arrangement', 'en')).toContain('585 mm');
    expect(flat('general-arrangement', 'en')).not.toContain('585 mm*');
    expect(flat('bench-cross-sections', 'en')).toMatch(/15 cm‡/);
    expect(flat('bench-cross-sections', 'en')).toMatch(/10 cm‡/);
  });

  it('prints only numbers that come from dims.ts, the simulation, the figures, or a short list of reported ones', () => {
    // plain, with their source: the scales and the chart's grid; 200, 585, 880 mm, 0.84, 0.64, 1.27 m, 2 and 8 inches (reported); 18, 36, 6, 1 inches (a draft text, attributed); 540, 815, 32, 232 °C, 2.5 kg/h, 09:00, 18:00, 20:30, 1, 2 °C (the research and the
    // model's settings, said in words); the tables of PL-06, as in src/data/data.test.ts; WHO's and the alarm's table; the lower-level sums 7.2, 5.9, 1.3, 14.4, 5.5 Pa through `lab`; 12.5 kg; 3 t; 3.4 t; 35, 50, 72, 80, 90 %; 85 %; the sheets' numbers; 101, the rounded shares of PL-09, said to add to it.
    const plain = new Set<number>([
      0, 1, 2, 3, 3.4, 4, 5, 6, 7, 8, 10, 12, 15, 18, 20, 24, 25, 30, 32, 35, 36, 40, 45, 50, 55, 60, 65, 72, 80, 85,
      90, 100, 101, 120, 128, 200, 232, 300, 400, 480, 500, 540, 585, 600, 700, 760, 800, 815, 880, 891, 1200, 1260,
      1750, 2300, 0.08, 0.12, 0.14, 0.16, 0.17, 0.18, 0.6, 0.64, 0.84, 0.9, 1.06, 1.2, 1.27, 1.35, 0.078, 0.092, 2.5, 9,
      11, 22, 16, 13, 14, 17, 19,
    ]);
    const known = new Set<number>(plain);
    for (const v of PRINTED) known.add(Math.abs(Number(v)));
    for (const [v, d] of Object.values(FIG)) known.add(Number(v.toFixed(d)));
    const stray: string[] = [];
    for (const s of SHEETS)
      for (const t of boxes(s.id, 'en')) {
        const text = t.content
          .replace(/PL-\d+|1:\d+|A3|3D|CO₂|O₂|\b\d{4}-\d{2}-\d{2}\b|\b\d{2}:\d{2}\b/g, '')
          .replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
        for (const m of text.match(/\d+(?:\.\d+)?/g) ?? [])
          if (!known.has(Number(m))) stray.push(`${s.id}: ${m} in « ${t.content} »`);
      }
    expect(stray.join('\n')).toBe('');
  });

  it('prints no inner size of the core and no recipe: overall sizes only', () => {
    const inner = [
      [MACHINE.feedHeight, 'feed height'],
      [MACHINE.tunnelLength, 'tunnel'],
      [MACHINE.feedSide, 'feed side'],
      [MACHINE.riserInsulation, 'insulation'],
      [MACHINE.sleeveDiameter, 'sleeve'],
    ] as const;
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const t = flat(s.id, lang).replace(',', '.');
        for (const [m, what] of inner) {
          const mm = Math.round(m * 1000);
          expect(t, `${s.id} ${what}`).not.toMatch(new RegExp(`\\b${mm} mm|\\b${m} m\\b`));
        }
      }
    // the core's sheet has no scale, and says so
    expect(flat('core-section', 'en')).toMatch(/do not measure/);
    expect(flat('core-section', 'fr')).toMatch(/ne pas mesurer/);
    expect(flat('core-section', 'en')).toMatch(/Nothing here gives a brick or insulation thickness/);
    expect(flat('materials-explained', 'en')).toMatch(/No shopping list/);
    expect(flat('materials-explained', 'en')).not.toMatch(/\bparts? of (clay|sand)\b/i);
  });

  it('the draft text’s figures are its words, and no sheet says that anything is safe', () => {
    expect(flat('safety-chain', 'en')).toMatch(/NOT A SAFE VALUE/);
    expect(flat('safety-chain', 'en')).toMatch(/nothing here allows bringing a wall closer/);
    for (const s of SHEETS) {
      expect(flat(s.id, 'en'), s.id).not.toMatch(/\bis safe\b(?! value)|\bsafe to\b|\bcompliant\b|\brecommended\b/i);
      expect(flat(s.id, 'en'), s.id).not.toMatch(/\b4 to 8 h/);
      expect(flat(s.id, 'en'), s.id).not.toMatch(/\bK\d{1,2}\b|\bS\d{1,2}\b/);
    }
    expect(flat('core-section', 'en')).toMatch(/THE PROPORTIONS: A SOURCE’S WORDS, NOT A RULE/);
  });
});

describe('the sheets against the sources of their numbers', () => {
  it('the stations of the path are the simulation’s, each named', () => {
    expect(STATION_NAMES.length).toBe(STATIONS.length);
    expect(fullBurn().s.length).toBe(STATIONS.length);
    expect(coldFlue().s.length).toBe(STATIONS.length);
  });

  it('the gas path prints the state at 09:00, and the mean the texts print, each said for what it is', () => {
    const t = flat('long-section', 'en');
    const foot = Math.round(fullBurn().t[2]!);
    expect(foot).toBeCloseTo(theDay().series.chamber[36]!, -1);
    expect(t).toContain(`${foot} °C`);
    expect(t).toContain(`${MODEL.chamber} °C`);
    expect(t).toMatch(/the mean of a fire at full rate/);
    // the chart's top, 700 °C, holds the whole curve
    expect(Math.max(...fullBurn().t)).toBeLessThan(700);
  });

  it('the path and the draught budget print the figures of the texts', () => {
    const r = fullBurn();
    expect(r.riser).toBeCloseTo(MODEL.riserPa, 0);
    expect(-r.fall).toBeCloseTo(MODEL.fallPa, 0);
    expect(r.riser + r.fall).toBeCloseTo(MODEL.netPa, 0);
    expect(-r.lid).toBeCloseTo(MODEL.lidPa, 0);
    expect(coldFlue().draft).toBeCloseTo(-MODEL.coldFluePa, 0);
    const t = flat('draft-budget', 'en');
    for (const s of [
      '6.0 Pa',
      '−4.7 Pa',
      '1.3 Pa',
      '−8.9 Pa',
      '−1.1 Pa',
      '7.2 Pa‡',
      '−5.9 Pa‡',
      '14.4 Pa‡',
      '−5.5 Pa‡',
    ])
      expect(t, s).toContain(s);
  });

  it('the day prints the figures of the texts, and the seat peaks after the flame', () => {
    const s = theDay().summary;
    expect(s.seatHotPeak).toBeCloseTo(MODEL.seatHigh, 0);
    expect(s.peakHourHot).toBeGreaterThan(20.5 + 1);
    expect(s.peakHourHot).toBeLessThan(20.5 + 2);
    const t = flat('firing-day', 'en');
    for (const f of ['24.9 °C', '32.0 °C', '17.3 °C', '24.0 °C', '1.7 h', '22 kWh', '10 kWh', '12.5 kg'])
      expect(t, f).toContain(f);
    expect(t).toMatch(/one to two hours after the flame/);
    expect(t).toMatch(/does not carry the house/);
  });

  it('the balance prints the figures of the texts', () => {
    const t = flat('energy-day', 'en');
    for (const f of [
      '38%',
      '24%',
      '18%',
      '3%',
      '17%',
      '1%',
      '78%',
      '82%',
      '65%',
      '88%',
      '55%',
      '36%',
      '7%',
      '16%',
      '8%',
      '85%',
      '52 kWh‡',
    ])
      expect(t, f).toContain(f);
    expect(t).toMatch(/they add to 101/);
    expect(t).toMatch(/does not balance from the stove alone/);
    expect(flat('energy-day', 'fr')).toMatch(/ne boucle pas avec le poêle seul/);
  });

  it('the damper and the fan: numbers only, as the texts print them', () => {
    const t = flat('safety-chain', 'en');
    for (const f of ['123 ppm', '38 min', '52 min', '43 ppm', '63 ppm', '53 min']) expect(t, f).toContain(f);
    expect(t).toMatch(/There is no closing damper on this machine/);
    expect(t).toMatch(/whole-house mean/);
    expect(t).not.toMatch(/victim|tragic|family/i);
    expect(DERIVED.whoPpm1h).toBe(30);
  });

  it('the bench’s maps are the model’s grid, in the colours of the thermal view', () => {
    expect(rampColor(15)).toBe('rgb(39,49,111)');
    expect(rampColor(65)).toBe('rgb(166,26,60)');
    expect(MOMENTS.map(([after]) => after)).toEqual([0, 4, 8, 12]);
    const s = benchSlice(22, 0);
    expect(s.cols.length - 1).toBe(5);
    expect(s.rows.length - 1).toBe(4);
    const c = s.cols.length - 1;
    const above = s.T[s.ductCol + c * (s.ductRow + 1)]!;
    const seat = s.T[s.ductCol + c * (s.rows.length - 2)]!;
    expect(above).toBeGreaterThan(seat);
  });
});
