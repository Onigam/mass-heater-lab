import { describe, expect, it } from 'vitest';
import type { GuideStep, PartInfo } from '@onigam/lab-kit/content';
import type { L } from '@onigam/lab-kit/i18n';
import { setLang } from '@onigam/lab-kit/i18n';
import { LAB_STRINGS } from '../i18n/ui';
import { PANEL_STRINGS } from '../panels/strings';
import { installFakeDom } from '../panels/test-dom';
import { MassHeaterSim } from '../sim/engine';
import { benchMass, COB, MACHINE as SIM_MACHINE } from '../sim/machine';
import { presetParams, scenarioSetup } from '../sim/presets';
import { claimCheck, settledDay, woodForRoom } from '../sim/runs';
import { WORLD } from '../three';
import { MACHINE } from '../three/dims';
import { aboutPanel } from './about';
import { ASSEMBLY } from './assembly';
import { ASSUMED, DERIVED, ESTIMATE, FIG, MODEL } from './figures';
import { partIds, PART_CATEGORIES, WORLDS, type WorldId } from './ids';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';
import { DIM_SPECS } from './parts/dim-specs';
import { ACCESS, CHAPTERS, LAW, MAIN_VIDEO, NOT_LINKED, SOURCES } from './sources';

// The content checks of the data role: the catalogue and the two guides against the frozen ids of docs/research.md §4, FR/EN parity, the rules of the visitor texts (no research code, no name, British English, typographic apostrophes, every number tagged
// or sourced), every model result quoted in a text against the simulation (a change of src/sim cannot go unnoticed), what is said once, and what a lab about fire must not say.

const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && 'fr' in v && 'en' in v;
const words = (t: string): number => t.trim().split(/\s+/).length;
const sentences = (t: string): number => t.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9«“"(*−])/).length;

/** The bilingual texts of a part, without the rows generated from dims.ts. */
function partTexts(p: PartInfo): [string, L][] {
  const out: [string, L][] = [
    ['name', p.name],
    ['short', p.short],
    ['description', p.description],
    ['material', p.material],
  ];
  if (p.maintenance) out.push(['maintenance', p.maintenance]);
  if (p.tip) out.push(['tip', p.tip]);
  if (p.design) out.push(['design', p.design]);
  const generated = new Set((DIM_SPECS[p.id] ?? []).map((s) => s.label.en));
  p.specs.forEach((s, i) => {
    if (generated.has(s.label.en)) return;
    out.push([`specs[${i}].label`, s.label]);
    out.push([`specs[${i}].value`, isL(s.value) ? s.value : { fr: s.value, en: s.value }]);
  });
  return out;
}

function stepTexts(s: GuideStep): [string, L][] {
  const out: [string, L][] = [
    ['title', s.title],
    ['text', s.text],
  ];
  if (s.tip) out.push(['tip', s.tip]);
  if (s.warning) out.push(['warning', s.warning]);
  s.tools?.forEach((t, i) => out.push([`tools[${i}]`, t]));
  return out;
}

/** What a visitor reads outside the Sources panel, labelled. */
function visitorTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) for (const [k, v] of partTexts(p)) out.push([`part ${p.id}.${k}`, v]);
  for (const [guide, steps] of [
    ['assembly', ASSEMBLY],
    ['install', INSTALL],
  ] as const)
    for (const s of steps) for (const [k, v] of stepTexts(s)) out.push([`${guide} ${s.id}.${k}`, v]);
  for (const [world, o] of Object.entries(OVERVIEWS)) {
    out.push([`overview ${world}.title`, o.title]);
    out.push([`overview ${world}.text`, o.text]);
  }
  for (const lesson of LESSONS) {
    out.push([`lesson ${lesson.id}.title`, lesson.title], [`lesson ${lesson.id}.summary`, lesson.summary]);
    lesson.body.forEach((b, i) => out.push([`lesson ${lesson.id}.body[${i}]`, b]));
    lesson.figures?.forEach((f, i) => {
      out.push([`lesson ${lesson.id}.figures[${i}].label`, f.label]);
      out.push([`lesson ${lesson.id}.figures[${i}].value`, isL(f.value) ? f.value : { fr: f.value, en: f.value }]);
    });
    lesson.quiz?.forEach((q, i) => {
      out.push([`lesson ${lesson.id}.quiz[${i}].q`, q.q], [`lesson ${lesson.id}.quiz[${i}].explain`, q.explain]);
      q.choices.forEach((c, j) => out.push([`lesson ${lesson.id}.quiz[${i}].choices[${j}]`, c]));
    });
  }
  return out;
}

const UI: [string, L][] = Object.entries(LAB_STRINGS).map(([k, [fr, en]]) => [`ui ${k}`, { fr, en }]);
const SOURCE_TEXTS: [string, L][] = [
  ...CHAPTERS.map(([ts, fr, en]): [string, L] => [`chapter ${ts}`, { fr, en }]),
  ...SOURCES.flatMap((g): [string, L][] => [
    [`source group ${g.en}`, { fr: g.fr, en: g.en }],
    ...g.items.map((s): [string, L] => [`source ${s.label}`, { fr: s.fr, en: s.en }]),
  ]),
  ...LAW.map(([place, fr, en]): [string, L] => [`law ${place[1]}`, { fr, en }]),
];
const ALL_TEXTS: [string, L][] = [...visitorTexts(), ...UI, ...SOURCE_TEXTS];

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
function numbersOf(text: string, lang: 'fr' | 'en'): string[] {
  let t = text
    .replace(/[−–]/g, '-')
    .replace(/CO₂e?|O₂|\bprEN \d+-\d|EN \d+(-\d)*(:\d+)?|PM\d/g, 'X')
    .replace(/1er\b/g, '1');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

const part = (id: string) => PARTS.find((p) => p.id === id)!;
const en = (id: string) =>
  partTexts(part(id))
    .map(([, v]) => v.en)
    .join(' ');
const fr = (id: string) =>
  partTexts(part(id))
    .map(([, v]) => v.fr)
    .join(' ');

// ------------------------------------------------------------------------------------------------ the catalogue

describe('parts catalogue', () => {
  it('has exactly the ids of docs/research.md §4, each once, in catalogue order, well over the 36 of the bar', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(WORLDS.flatMap((w) => partIds(w)));
    expect(ids.length).toBe(56);
    expect(ids.length).toBeGreaterThanOrEqual(36);
    expect(partIds('homestead').length).toBe(11);
    expect(partIds('living-room').length).toBe(18);
    expect(partIds('fire-core').length).toBe(14);
    expect(partIds('bench-section').length).toBe(13);
  });

  it('agrees with the research file, id by id', () => {
    const docs = import.meta.glob('../../docs/research.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    const research = docs['../../docs/research.md']!;
    const section = research.slice(research.indexOf('## 4. The part ids'), research.indexOf('### 4.5'));
    const fromResearch = [...section.matchAll(/^\| `([a-z-]+)` +\|/gm)].map((m) => m[1]!);
    expect(fromResearch.length).toBe(56);
    expect(new Set(PARTS.map((p) => p.id))).toEqual(new Set(fromResearch));
  });

  it('gives every part its world and its category', () => {
    for (const world of WORLDS)
      for (const id of partIds(world)) {
        const p = part(id);
        expect(p.scene, id).toBe(world);
        expect(p.category, id).toBe(PART_CATEGORIES[world][id]);
      }
  });

  it('has at least three specs per part, a one-line short, a description of a few sentences', () => {
    for (const p of PARTS) {
      expect(p.specs.length, p.id).toBeGreaterThanOrEqual(3);
      for (const lang of ['fr', 'en'] as const) {
        expect(p.short[lang].length, `${p.id} short ${lang}`).toBeLessThanOrEqual(170);
        expect(p.short[lang], `${p.id} short`).not.toMatch(/\n/);
        const n = sentences(p.description[lang]);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeGreaterThanOrEqual(2);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeLessThanOrEqual(10);
      }
    }
  });

  it('writes the maintenance in three labelled paragraphs, and gives every part a tip and a design note', () => {
    for (const p of PARTS) {
      expect(p.tip, `${p.id} tip`).toBeDefined();
      expect(p.design, `${p.id} design`).toBeDefined();
      expect(p.maintenance, p.id).toBeDefined();
      for (const [lang, labels] of [
        ['fr', ['**Panne à prévoir.**', '**À vérifier.**', '**Entretien.**']],
        ['en', ['**Typical failure.**', '**How to check.**', '**Maintenance.**']],
      ] as const) {
        const paragraphs = p.maintenance![lang].split('\n\n');
        expect(paragraphs.length, `${p.id} ${lang}`).toBe(3);
        labels.forEach((label, i) => expect(paragraphs[i]!.startsWith(label), `${p.id} ${lang}`).toBe(true));
      }
    }
  });

  it('keeps the timestamps inside the main video (6:16)', () => {
    for (const p of PARTS)
      for (const ts of p.video ?? []) {
        const [m, s] = ts.split(':').map(Number);
        expect((m ?? 0) * 60 + (s ?? 0), `${p.id} ${ts}`).toBeLessThanOrEqual(376);
      }
  });

  it('adds a dimension row only for an id of the catalogue, all read from dims.ts and tagged; no inner size of the core', () => {
    for (const [id, rows] of Object.entries(DIM_SPECS)) {
      expect(
        PARTS.some((p) => p.id === id),
        id,
      ).toBe(true);
      expect(partIds('fire-core')).not.toContain(id);
      for (const r of rows) {
        expect(isL(r.value) && r.value.en.endsWith('(estimate)'), `${id}: ${r.label.en}`).toBe(true);
        expect(isL(r.value) && r.value.fr.endsWith('(estimation)'), `${id}: ${r.label.fr}`).toBe(true);
      }
    }
  });
});

describe('what the sheets must say', () => {
  it('the drum gives twice the bench’s heat, and the bench does not carry the house', () => {
    expect(en('steel-drum')).toMatch(/twice what the bench gives/);
    expect(fr('steel-drum')).toMatch(/deux fois ce que rend le banc/);
    expect(en('cob-bench')).toMatch(/in this model the bench does not carry the house/);
    expect(fr('cob-bench')).toMatch(/ce n’est pourtant pas elle qui porte la maison/);
  });

  it('the seat peaks one to two hours after the flame', () => {
    expect(en('cob-bench')).toMatch(/one to two hours after the flame/);
    expect(fr('cob-bench')).toMatch(/une à deux heures après la flamme/);
    expect(en('cob-casing')).toMatch(/one to two hours after the flame/);
  });

  it('never « 4 to 8 h », the research’s figure the model did not find', () => {
    for (const [label, v] of ALL_TEXTS) {
      expect(v.en, label).not.toMatch(/\b4 to 8 h|\b4-8 h|four to eight hours/i);
      expect(v.fr, label).not.toMatch(/\b4 à 8 h|quatre à huit heures/i);
    }
  });

  it('a fire is said to be a tended session', () => {
    expect(en('wood-basket')).toMatch(
      /A \*\*fire\*\*, on this machine, is not an armful and away: it is a tended session/,
    );
    expect(fr('wood-basket')).toMatch(
      /Un \*\*feu\*\*, sur cette machine, n’est pas une brassée et un départ : c’est une séance menée/,
    );
  });

  it('the efficiency: 78 and 82, a range, no test found, the feed’s opening with no source', () => {
    const t = en('flue-thermometer');
    expect(t).toMatch(/82% by a flue calculation/);
    expect(t).toMatch(/keeps \*\*78%\*\*/);
    expect(t).toMatch(/plausible range 65 to 88%/);
    expect(t).toMatch(/We found no independent test of a cob J-tube/);
    expect(t).toMatch(/published figures above 80 % are all flue calculations/);
    expect(t).toMatch(/no source gives it/);
    expect(en('feed-tube')).toMatch(/no source gives a figure for it/);
    expect(fr('feed-tube')).toMatch(/aucune source ne le chiffre/);
  });

  it('« 80 to 90 % less wood » does not balance from the stove, and reaching it takes insulation', () => {
    const t = en('coppice-lot');
    expect(t).toMatch(/That figure does not balance from the stove alone/);
    expect(t).toMatch(/at 35 % saves 55%/);
    expect(t).toMatch(/a 50 % stove, 36%/);
    expect(t).toMatch(/a good 72 % stove, 7%/);
    expect(t).toMatch(/running at 16%/);
    expect(t).toMatch(/at 90 % at 8%|for 90 % at 8%/);
    expect(t).toMatch(/together save 85%/);
    expect(fr('coppice-lot')).toMatch(/Ce chiffre ne boucle pas avec le poêle seul/);
  });

  it('the damper: none on the machine, and its numbers', () => {
    const t = en('feed-lid');
    expect(t).toMatch(/There is no closing damper on this machine/);
    expect(t).toMatch(/passed at 38 minutes/);
    expect(t).toMatch(/52 minutes at the latest/);
    expect(t).toMatch(/123 ppm at 65 minutes/);
    expect(t).toMatch(/43 ppm at the highest/);
    expect(part('chimney-cleanout').design!.en).toMatch(/no closing damper on this machine/);
  });

  it('CO is a band and a whole-house mean, an alarm can stay silent, no model says safe', () => {
    const t = en('co-alarm');
    expect(t).toMatch(/keep quiet at a level WHO does not accept/);
    expect(t).toMatch(/never the measurement of a real room/);
    expect(t).toMatch(/no model can say an installation is safe/);
    expect(part('co-alarm').short.en).toMatch(/indispensable, and it is not enough/);
    expect(part('co-alarm').short.fr).toMatch(/indispensable, et il ne suffit pas/);
  });

  it('where the model disagrees with a source, the sheet says so', () => {
    expect(en('top-gap')).toMatch(/Our model does not find this/);
    expect(en('earthen-plaster')).toMatch(/the split is retrieved, the total not/);
    expect(en('burn-tunnel')).toMatch(/below that range/);
    expect(en('chimney-tee')).toMatch(/the model does not see it turn by itself/);
    expect(en('chimney-tee')).toMatch(/least sure figure/);
    expect(en('pebble-section')).toMatch(/no source puts a figure on any of it/);
  });

  it('gives no recipe: no mix, no brick layout, no lighting method, no clearance as a rule, no inner size of the core', () => {
    const recipe =
      /\b(\d+\s?parts? (of )?(clay|sand)|ratio of clay|cm of (sand|clay|straw)|courses? of brick|bricks? (long|wide)|apply a|cure for \d|\d+ (days?|hours?) to dry)\b/i;
    for (const [label, v] of [...visitorTexts()]) expect(v.en, label).not.toMatch(recipe);
    // the feed, the tunnel, the gap as a build size, the insulation's and the sleeve's dimensions never reach the sheets by their dims.ts values
    const inner = [
      MACHINE.feedHeight,
      MACHINE.tunnelLength,
      MACHINE.feedSide,
      MACHINE.riserInsulation,
      MACHINE.sleeveDiameter,
    ];
    for (const [label, v] of visitorTexts())
      for (const m of inner) {
        const mm = Math.round(m * 1000);
        const cm = Math.round(m * 100);
        expect(v.en, `${label}: ${m}`).not.toMatch(new RegExp(`\\b${mm} mm|\\b${cm} cm|\\b${m} m\\b`));
      }
    expect(en('heat-shield')).toMatch(/neither a rule nor a safe value/);
    expect(fr('heat-shield')).toMatch(/ni une règle ni une valeur sûre/);
    expect(en('ceiling-crossing')).toMatch(/This lab gives no distance/);
  });

  it('a draft text is called what it is, and no clearance appears outside the shield’s sheet', () => {
    const inches = /\b36 inches between|\b18 inches \(/;
    const where = visitorTexts()
      .filter(([, v]) => inches.test(v.en))
      .map(([label]) => label);
    expect(where).toEqual(['part heat-shield.description']);
  });
});

// ------------------------------------------------------------------------------------------------ the visitor texts

describe('the visitor texts', () => {
  it('have a non-empty French and English text everywhere, no placeholder, no straight apostrophe, balanced bold', () => {
    const bad = /todo|tbd|lorem|xxx|placeholder|\{\w+\}|undefined|NaN|\[object|\$\{/;
    for (const [label, v] of ALL_TEXTS) {
      expect(v.fr.trim().length, `${label} fr`).toBeGreaterThan(0);
      expect(v.en.trim().length, `${label} en`).toBeGreaterThan(0);
      expect(v.fr + v.en, label).not.toMatch(bad);
      expect(v.fr + v.en, label).not.toMatch(/\p{L}'\p{L}/u);
      expect(v.fr.split('**').length % 2, `${label}: unbalanced ** in fr`).toBe(1);
      expect(v.en.split('**').length % 2, `${label}: unbalanced ** in en`).toBe(1);
    }
  });

  it('have no doubled, leading or trailing space, and no space before a comma or a full stop', () => {
    for (const [label, v] of ALL_TEXTS)
      for (const t of [v.fr, v.en]) {
        expect(t, label).not.toMatch(/ {2,}/);
        expect(t, label).toBe(t.trim());
        expect(t, label).not.toMatch(/\s[,.]($|\s)/);
      }
  });

  it('are written differently in the two languages, at the same level of detail', () => {
    for (const [label, v] of ALL_TEXTS) {
      if (v.fr.length < 40 && v.en.length < 40) continue;
      if (label.startsWith('source ')) continue; // a source's own title is the same in both
      expect(v.fr, label).not.toBe(v.en);
      expect(v.fr.length / v.en.length, label).toBeGreaterThan(0.6);
      expect(v.fr.length / v.en.length, label).toBeLessThan(1.7);
    }
  });

  it('keep the same figures in French and English', () => {
    for (const [label, v] of ALL_TEXTS) expect(numbersOf(v.fr, 'fr'), label).toEqual(numbersOf(v.en, 'en'));
  });

  it('tag a non-reported figure the same way in both languages', () => {
    const pairs: [string, string][] = [
      ['(estimation)', '(estimate)'],
      ['(dérivé)', '(derived)'],
      ['(hypothèse)', '(assumption)'],
      ['(résultat du modèle)', '(model result)'],
    ];
    for (const [label, v] of ALL_TEXTS)
      for (const [f, e] of pairs) expect(v.fr.includes(f), `${label}: ${f}: ${v.fr}`).toBe(v.en.includes(e));
  });

  it('leave no French in the English texts', () => {
    const allowed =
      /Åbo|Écohabitation|Vallée|Comment assurer|chemin[ée]e|Poêle de masse accessible à tous|minute permaculture|Réponse ministérielle|Proposition de loi|Un forum français|Un manuel de détecteur|Crédit Agricole|stères?|stère/gi;
    for (const [label, v] of ALL_TEXTS) expect(v.en.replace(allowed, ''), label).not.toMatch(/[éèêëàâùûôîïç]/i);
  });

  it('are in British English', () => {
    // « a draft text » is a document; the pull of a chimney is a draught
    const american =
      /\b(colors?|centers?|(?<=\d[  ]?)meters?|liters?|grays?|analyz\w*|behaviors?|fibers?|aluminum|favors?|honors?|labor|neighbors?|catalogs?|defense|license|plow|sulfur|gasoline|molds?|smolder\w*|tons|realiz\w*|organiz\w*|recogniz\w*|minimiz\w*|maximiz\w*|optimiz\w*|utiliz\w*|standardiz\w*|flashlight|attic)\b/i;
    for (const [label, v] of ALL_TEXTS) {
      expect(v.en, label).not.toMatch(american);
      expect(v.en, label).not.toMatch(/\bdraft(?! text)/i);
    }
  });

  it('never cite the research notes by code, and leak no internal word', () => {
    for (const [label, v] of ALL_TEXTS) {
      expect(v.fr + ' ' + v.en, label).not.toMatch(/\b(K\d{1,2}|S\d{1,2})\b/);
      expect(v.fr + ' ' + v.en, label).not.toMatch(
        /(?<!\p{L})(world|preset|undefined|dims\.ts|feedCover)(?!\p{L})|\bsrc\//iu,
      );
    }
  });

  it('name no person, company or brand outside the Sources panel', () => {
    const names =
      /Wheaton|Wisner|van den Berg|Schumack|Evans|Jackson|Oxalis|Perkins|Rubino|Tidwell|Chernov|Moshier|Morgan|Superwool|Liberator|Poujoulat|Crédit Agricole|Portland|Montana|Okanagan|YouTube|broaudio|Permaculture Design|Testo\b|Geneva basin(?!)/;
    for (const [label, v] of visitorTexts()) expect(v.fr + ' ' + v.en, label).not.toMatch(names);
  });

  it('quote nothing from a source read in summary or from a private transcript: no quotation of the suites a reader might recognise', () => {
    const quotes =
      /mostly stone|thermal cob without|no danger of a creosote|typically just steam|it will kill people|can be very dangerous when|hard data is almost|not a recognized appliance|heat-tolerant fabric|tiny little bit of smoke|needs you back there|one way of getting heat out|near room temperature, |two cubic feet a day when|proper chimney|in the same type|dans le même type d’habitation|la même chaleur que le soleil|n’importe quelle pièce/i;
    for (const [label, v] of ALL_TEXTS) expect(v.fr + ' ' + v.en, label).not.toMatch(quotes);
  });

  it('never repeat the wrong video’s trouble: no flueless stove is said to heat a room', () => {
    for (const [label, v] of visitorTexts()) {
      expect(v.en, label).not.toMatch(/heat any room|you can build it for \$|\$20/i);
      expect(v.en, label).not.toMatch(/cardboard and/i);
    }
    // the line between a rocket cook stove and a mass heater is drawn once, where the word is defined, and again in the lesson that says when this machine is wrong
    expect(OVERVIEWS.homestead.text.en).toMatch(/a mass heater has a chimney/);
    expect(OVERVIEWS.homestead.text.fr).toMatch(/un poêle de masse a une cheminée/);
  });

  it('say once what is to be said once', () => {
    const count = (re: RegExp, texts: [string, L][] = ALL_TEXTS) => texts.filter(([, v]) => re.test(v.en)).length;
    expect(count(/educational reconstruction/i)).toBe(1); // the safety notice
    expect(count(/not affiliated|nor affiliated/i)).toBe(1);
    expect(count(/not legal advice/)).toBe(1);
    expect(count(/Do not build one from this site/)).toBe(1);
    expect(count(/no model can say/i)).toBe(1); // the CO alarm's sheet; the panel says it once of its own
    expect(count(/not a plan to follow|not a procedure/)).toBe(2); // the first step of each guide
    expect(count(/this lab explains, it gives no plan/i)).toBe(1); // the first overview
    expect(count(/false colour/i)).toBe(1); // the room's overview, where the thermal view is first met
    expect(count(/against the air beside it/)).toBe(1); // the sign of a pressure: the manifold's sheet; the panel says it beside its own figure
    expect(count(/“At full fire”: the model at 9 h/)).toBe(1); // what « à plein feu » means: the notice on reading the figures
    // a warning is said once, where the gesture is risky
    expect(count(/silica dust that can be breathed/)).toBe(1);
    expect(count(/health classification/)).toBe(1);
    expect(count(/zinc fumes/)).toBe(1);
    expect(count(/Nobody opens one with a torch/)).toBe(1);
    expect(count(/Work at height/)).toBe(1);
  });

  it('hold no number but those of the research and of the model: every other number has to be added here, with its source', () => {
    // REPORTED, by source:
    //   the machine: 200 mm, 8 inches, 200 L, 216 L, 585 × 880 mm, 1.2 mm, 20 kg (sellers); 0.84, 0.64, 1.27 m, 33 inches, 2 inches, 50 mm (a book, in a digest); 9, 15, 18 m and 6, 10, 36, 48, 60, 4 and 1 inches (a draft text); 3 m (the draft's 10 ft).
    //   a session: 2, 4 h, 1, 2 loads an hour, 2.0, 3.6 kg/h, 9, 11, 18 kg, 74 m², 4.16 kWh/kg, 3, 57, 7 (the builders); 0.77, 0.7 %; 8 cm, 5, 10, 25, 50 cm, 12, 20 % (a manual, the standard); 15, 20, 30 %, 4.27, 3.98, 3.39 kWh/kg (a formula).
    //   temperatures: 540, 815, 32, 232 °C, 1,200 °C, 760 °C, 80, 100 °C; 54, 60, 38, 32 °C; a dew point at 44, 37 °C.
    //   materials: 0.6, 891, 3, 0.12, 1.06, 0.3 (cob); 0.90, 1.35, 1,750, 2,300, 400 (fireclay); 480, 1,260, 0.14, 0.16, 0.17, 600, 800 (brick); 128, 1,200, 0.08, 0.12, 0.18 (fibre); 0.078, 0.092, 200, 300 (perlite).
    //   tests: 68.5, 79.7, 61.8, 1992, 312, 240, 1,280, 75, 85, 93 (the builder's « 75 %, +/- 85 % », an analyser's figure), 13, 60, 40 %; × 3.5, 14, 6, 10; 1.4 (a threshold of air).
    //   CO: 100, 35, 10, 7 mg/m³, 15, 8, 24 h; 50, 60, 90, 100, 10, 40, 300, 3, 30, 120 (the alarm); 3,000, 8 March 2015, about a hundred.
    //   the claims: 35, 50, 72 % old stoves, 80, 90 %, 0.6 cord, 3.9, 8 (the sums); 128 ft³, four months, 1 stère; 12 builds, 6 and 6; 150 mm, 6 kg, 55, 90 min; 2, 13th winter.
    //   the model's settings and scenarios: 30 %, −5 °C, 4.5, 18 m, 1.5 cm, 3.4, 5 kg/h; a room of 200 m³ at 0.5, 1, 5, 10 % at 3,000 ppm (a stated illustration), 2.4 Pa, 7.2, 5.9, 14.4, 5.5 Pa (the hand sums); 2,300 (usual); 0.9 (usual emissivity).
    const reported = [
      0, 0.08, 0.12, 0.14, 5.97, 2012, 0.16, 0.17, 0.18, 0.3, 0.078, 0.092, 0.5, 0.6, 0.64, 0.7, 0.77, 0.84, 0.9, 1,
      1.06, 1.2, 1.27, 1.35, 1.4, 1.5, 2, 2.0, 2.4, 3, 3.39, 3.4, 3.5, 3.6, 3.9, 3.98, 4, 4.16, 4.27, 4.5, 5, 5.5, 5.9,
      6, 7, 7.2, 8, 9, 10, 11, 12, 13, 14, 14.4, 15, 18, 20, 24, 25, 30, 32, 33, 35, 36, 37, 38, 40, 44, 48, 50, 54, 55,
      57, 60, 61.8, 68.5, 72, 74, 75, 79.7, 80, 85, 90, 93, 100, 101, 120, 128, 150, 200, 216, 232, 240, 300, 312, 400,
      480, 540, 585, 600, 760, 800, 815, 880, 891, 1200, 1260, 1280, 1750, 1992, 2015, 2300, 3000,
    ];
    const known = new Set<number>(reported);
    for (const [v, d] of Object.values(FIG)) known.add(Number(v.toFixed(d)));
    const stray: string[] = [];
    for (const [label, v] of [...visitorTexts(), ...UI.filter(([k]) => !k.startsWith('ui sourcesNoCopy'))])
      for (const n of numbersOf(v.en.replace(/\bA3\b|\b3D\b|\bJ-tube\b/g, ''), 'en').map(Number))
        if (!known.has(Math.abs(n))) stray.push(`${label}: ${n}`);
    expect(stray.join('\n')).toBe('');
  });
});

describe('what a text claims', () => {
  it('promises nothing: no word that says a gesture or a part is safe', () => {
    for (const [label, v] of ALL_TEXTS) {
      expect(v.fr, label).not.toMatch(
        /sans risque|sans danger|sûreté|nuit à personne|en toute sécurité|geste de sécurité|et rien de plus/i,
      );
      expect(v.en, label).not.toMatch(
        /without risk|without danger|true safety|hurting nobody|safety gesture|, nothing more\./i,
      );
    }
  });

  it('never calls this fire clean: the model gives 1,470 mg/MJ, and a chamber under the range a builder calls clean', () => {
    for (const [label, v] of ALL_TEXTS) {
      expect(v.fr, label).not.toMatch(/(rend|fait|rendait) (le |ce )?feu propre|le feu propre|la rendait propre/i);
      expect(v.en, label).not.toMatch(/makes? (the |this )?fire clean|what made it clean|clean fire/i);
    }
    expect(en('heat-riser')).toMatch(/1,470 mg\/MJ, six times the 240 mg\/MJ/);
    expect(fr('heat-riser')).toMatch(/1 470 mg\/MJ, six fois les 240 mg\/MJ/);
  });

  it('a clear cap says nothing of carbon monoxide: the cap’s sheet agrees with the feed’s', () => {
    expect(part('chimney-cap').short.fr).toMatch(/un chapeau clair ne dit rien du monoxyde/);
    expect(part('chimney-cap').short.en).toMatch(/a clear cap says nothing of carbon monoxide/);
    expect(fr('feed-tube')).toMatch(/L’œil ne juge jamais le monoxyde/);
    for (const id of ['chimney-cap', 'moisture-meter'])
      expect(en(id), id).not.toMatch(/next to nothing when all is well/);
  });

  it('a pressure has one sign: the minus sign is printed, the manifold’s and the duct’s are not the draught’s', () => {
    expect(en('manifold')).toMatch(/from −13\.5 to −13\.9 Pa/);
    expect(fr('manifold')).toMatch(/de −13,5 à −13,9 Pa/);
    expect(fr('manifold')).not.toMatch(/quinzaine de pascals/);
    expect(en('manifold-cleanout')).toMatch(/about −13\.5 Pa/);
  });

  it('the peak is not a crossing time', () => {
    expect(part('cob-casing').short.en).not.toMatch(/brings the heat through/);
    expect(part('cob-casing').short.en).toMatch(/1\.2 to 1\.7 h after the wood stops/);
    expect(en('cob-casing')).toMatch(/That is no crossing time/);
    expect(fr('cob-casing')).toMatch(/Ce n’est pas un temps de traversée/);
  });

  it('a tip names no tool its world does not have', () => {
    for (const p of PARTS) {
      const world = WORLD[p.scene as WorldId];
      const tip = p.tip!;
      if (world.cutaway === false) {
        expect(tip.fr, p.id).not.toMatch(/\bCoupe\b/);
        expect(tip.en, p.id).not.toMatch(/\bSection\b/);
      }
      if ('slowMo' in world && world.slowMo === false) {
        expect(tip.fr, p.id).not.toMatch(/ralenti\*\*/i);
        expect(tip.en, p.id).not.toMatch(/Slow-mo/);
      }
      // the thermal view lives in the room and the bench (docs/3d.md)
      if (p.scene === 'homestead' || p.scene === 'fire-core') {
        expect(tip.fr, p.id).not.toMatch(/vue thermique/i);
        expect(tip.en, p.id).not.toMatch(/thermal view/i);
      }
    }
  });

  it('a tip does not ask for what the tool takes away: an isolated part stands alone', () => {
    for (const p of PARTS) {
      expect(p.tip!.en, p.id).not.toMatch(/Isolate[^.:]*(, then|and look at the earth|what it opens into)/);
      expect(p.tip!.fr, p.id).not.toMatch(/Isolez[^.:]*( puis | et regardez la terre)/);
    }
  });

  it('the flame runs as the 3D draws it: from the feed, at −x, towards the riser, at x = 0', () => {
    expect(MACHINE.tunnelLength).toBeGreaterThan(0);
    expect(part('burn-tunnel').tip!.fr).toMatch(/de gauche à droite, du tube vers la cheminée interne/);
    expect(part('burn-tunnel').tip!.en).toMatch(/from left to right, from the feed towards the riser/);
  });
});

describe('the tips and the lessons call the panel by its words', () => {
  it('every control or chart a text names, in quotation marks, is one of the panel’s, in both languages', () => {
    const panel = Object.values(PANEL_STRINGS);
    const named: [string, string][] = [
      ['Ce que perd la maison par degré', 'What the house loses per degree'],
      ['Humidité du bois', 'Moisture of the wood'],
      ['Part cachée du haut du tube', 'Share of the feed’s top covered'],
      ['Hauteur de la cheminée interne', 'Height of the riser'],
      ['Isolant de la cheminée interne', 'Insulation of the riser'],
      ['Dépression d’une hotte ou d’une VMC', 'Depression from a fan'],
      ['Ce que la maison garde du bois', 'What the house keeps of the wood'],
      ['Ce qu’un calcul de fumées dirait', 'What a flue calculation would say'],
      ['Pression sous le couvercle du bidon', 'Pressure under the drum’s lid'],
      ['Le même, banc de galets', 'The same, a pebble bench'],
    ];
    const texts = visitorTexts();
    for (const [f, e] of named) {
      expect(
        panel.some(([a, b]) => a === f && b === e),
        f,
      ).toBe(true);
      expect(
        texts.some(([, v]) => v.fr.includes(`« ${f} »`) && v.en.includes(`“${e}”`)),
        f,
      ).toBe(true);
    }
  });
});

// ------------------------------------------------------------------------------------------------ the figures against the simulation

describe('the figures of the texts, against the simulation', () => {
  const J = presetParams('j-tube');
  const base = settledDay(J);
  const s = base.summary;
  const near = (value: number, target: number, tol: number, what: string) =>
    expect(Math.abs(value - target), `${what}: ${value} against ${target}`).toBeLessThanOrEqual(tol);
  const pct = (x: number) => x * 100;
  const minOf = (a: Float64Array) => Math.min(...a);
  const maxOf = (a: Float64Array) => Math.max(...a);
  const kwh = (a: Float64Array) => {
    let sum = 0;
    for (let i = 0; i < 96; i++) sum += a[i]!;
    return (sum * 0.25) / 1000;
  };
  const day = (patch: Parameters<typeof settledDay>[0] extends infer P ? Partial<P> : never) =>
    settledDay({ ...J, ...patch }).summary;

  it('the efficiency, its range, the split of a day', () => {
    near(pct(s.delivered), MODEL.eta, 0.5, 'delivered');
    near(pct(s.deliveredNet), MODEL.etaNet, 0.5, 'net');
    near(pct(s.flueEfficiency), MODEL.etaFlue, 0.5, 'flue');
    near(pct(day({ feedCover: 0.75 }).delivered), MODEL.etaLow, 0.5, 'cover 75');
    near(pct(day({ feedCover: 0.9 }).delivered), MODEL.etaHigh, 0.5, 'cover 90');
    near(pct(day({ feedCover: 0 }).delivered), MODEL.etaOpen, 0.5, 'open');
    near(pct(day({ feedCover: 0.95 }).delivered), MODEL.etaTop, 0.5, 'cover 95');
    near(pct(s.shareDrum), MODEL.shareDrum, 0.5, 'drum');
    near(pct(s.shareBench), MODEL.shareBench, 0.5, 'bench');
    near(pct(s.shareCore), MODEL.shareCore, 0.5, 'core');
    near(pct(s.shareFlueIndoors), MODEL.shareFlueIn, 0.5, 'flue indoors');
    near(pct(s.shareFlueOutdoors + s.shareExit + s.shareExitIdle), MODEL.shareLost, 0.5, 'lost');
    near(pct(s.shareUnburned), MODEL.shareUnburned, 0.5, 'unburned');
    expect(ESTIMATE.feedCover).toBeCloseTo(J.feedCover * 100, 6);
  });

  it('what reaches the room, and when', () => {
    near(kwh(base.series.drumOut), MODEL.kwhDrum, 0.5, 'drum kWh');
    near(kwh(base.series.benchOut), MODEL.kwhBench, 0.5, 'bench kWh');
    near(kwh(base.series.coreOut), MODEL.kwhCore, 0.5, 'core kWh');
    near(kwh(base.series.drumOut) / kwh(base.series.benchOut), 2, 0.2, 'drum over bench');
    near(s.meanPower / 1000, MODEL.meanKw, 0.05, 'mean power');
    near(maxOf(base.series.drumOut) / 1000, 3.8, 0.1, 'the burst');
    near(minOf(base.series.benchOut) / 1000, MODEL.benchKwLow, 0.05, 'bench low');
    near(maxOf(base.series.benchOut) / 1000, MODEL.benchKwHigh, 0.05, 'bench high');
    near(minOf(base.series.coreOut) / 1000, MODEL.coreKwLow, 0.05, 'core low');
    near(maxOf(base.series.coreOut) / 1000, MODEL.coreKwHigh, 0.05, 'core high');
  });

  it('the seat and the room', () => {
    near(minOf(base.series.seat0), MODEL.seatLow, 0.05, 'seat low');
    near(maxOf(base.series.seat0), MODEL.seatHigh, 0.06, 'seat high');
    near(minOf(base.series.seat5), MODEL.seatColdLow, 0.05, 'cold seat low');
    near(maxOf(base.series.seat5), MODEL.seatColdHigh, 0.05, 'cold seat high');
    // the feed stops at 20:30 in the evening; the table holds frames of 15 minutes
    const stop = J.eveningHour + J.sessionHours;
    near(s.peakHourHot - stop, MODEL.lagStop, 0.3, 'lag after the feed stops');
    near(s.peakHourCold - stop, MODEL.lagStopCold, 0.3, 'lag, thin end');
    near(s.lagHot, MODEL.lagBegin, 0.3, 'lag after it began');
    near(minOf(base.series.room), MODEL.roomLow, 0.05, 'room low');
    near(maxOf(base.series.room), MODEL.roomHigh, 0.05, 'room high');
    near(s.roomMean, MODEL.roomMean, 0.05, 'room mean');
    near(maxOf(base.series.room) - minOf(base.series.room), MODEL.roomSwing, 0.1, 'room swing');
    const sevenAfter = Math.round((stop + 7 - 24) * 4);
    near(base.series.seat0[sevenAfter]!, MODEL.seatAfter7, 0.1, 'seat 7 h after');
    near(base.series.seat5[sevenAfter]!, MODEL.seatColdAfter7, 0.1, 'cold seat 7 h after');
    near(base.series.room[sevenAfter]!, MODEL.roomAfter7, 0.1, 'room 7 h after');
    near(day({ gains: 0 }).roomMean, MODEL.noGainsRoom, 0.1, 'no gains');
    near(minOf(base.series.stone), MODEL.stoneLow, 0.1, 'stone low');
    near(maxOf(base.series.stone), MODEL.stoneHigh, 0.1, 'stone high');
    near(s.behindKWh, MODEL.behindKwh, 0.05, 'behind');
    near(s.groundKWh, MODEL.groundKwh, 0.05, 'ground');
  });

  it('the fire and the path at full burn', () => {
    near(s.meanChamber, MODEL.chamber, 1, 'chamber');
    near(s.meanLambda, MODEL.lambda, 0.05, 'lambda');
    near(s.meanExhaust, MODEL.exhaust, 1, 'exhaust');
    near(s.meanDraft, MODEL.draft, 0.5, 'draught');
    near(s.meanFlow * 1000, MODEL.flowGs, 0.5, 'flow');
    near((s.meanFlow * 3600) / 1.2, MODEL.airM3h, 1, 'flow m³/h');
    near(maxOf(base.series.fire) / 1000, MODEL.fireKw, 0.2, 'fire');
    near(maxOf(base.series.lid), MODEL.lidPeak, 1, 'lid');
    near(day({ feedKgH: 3.4, sessionHours: 1.84 }).meanChamber, MODEL.chamberRocket, 4, 'chamber at 3.4');
    near(day({ feedKgH: 5, sessionHours: 1.25 }).meanChamber, MODEL.chamberFast, 4, 'chamber at 5');
    const sim = new MassHeaterSim();
    sim.set({ hour: 9 });
    const st = sim.state;
    near(st.draftRiser, MODEL.riserPa, 0.15, 'riser');
    near(-st.draftDrum, MODEL.fallPa, 0.15, 'fall');
    near(st.draftRiser + st.draftDrum, MODEL.netPa, 0.15, 'net');
    near(st.draftChimney, MODEL.chimneyPa, 0.4, 'chimney');
    near(-st.lidPressure, MODEL.lidPa, 0.2, 'lid pressure');
    near(st.flameLength, MODEL.flameLen, 0.05, 'flame');
    near(st.riserTopT, MODEL.riserTop, 2, 'riser top');
    near(st.afterDrumT, MODEL.afterDrum, 2, 'after the drum');
    near(st.dewPointT, MODEL.dewDefault, 2, 'dew point');
    near(st.regime === 'lean' ? st.flueCo : 0, MODEL.coLean, 40, 'CO');
    near(st.flueCoLow, MODEL.coLeanLow, 15, 'CO low');
    near(st.flueCoHigh, MODEL.coLeanHigh, 110, 'CO high');
    const wetSim = new MassHeaterSim();
    wetSim.applyScenario('wet-wood');
    wetSim.set({ hour: 9 });
    near(wetSim.state.flueCo, MODEL.coWet, 40, 'CO on wet wood');
    near(-st.pathP[8]!, MODEL.ductPa, 1, 'duct pressure');
    // the state at 09:00, where the texts say « à plein feu », and the mean of a fire, where they say « en moyenne d’un feu »: two figures, each said as what it is
    near(st.chamberT, MODEL.chamberAt9, 2, 'chamber at 09:00');
    near(st.exhaustT, MODEL.exhaustAt9, 1, 'exit at 09:00');
    near(st.draft, MODEL.draftAt9, 0.1, 'whole draught at 09:00');
    near(-st.pathP[6]!, MODEL.manifoldPa, 0.1, 'the drum’s foot, where the gases enter the manifold');
    near(-st.pathP[7]!, MODEL.manifoldOutPa, 0.1, 'the duct’s mouth, where they leave it');
    near(st.pathT[8]!, MODEL.ductOutT, 1, 'gas at the end of the bench');
    near(st.pathT[10]!, MODEL.ceilingT, 1, 'gas at the ceiling');
    const hot = new MassHeaterSim();
    let liner = 0;
    let sleeve = 0;
    let brick = 0;
    let casing = 0;
    let side = 0;
    for (let h = 0; h < 24; h += 0.25) {
      hot.set({ hour: h });
      liner = Math.max(liner, hot.state.linerT);
      sleeve = Math.max(sleeve, hot.state.sleeveT);
      brick = Math.max(brick, hot.state.brickT);
      casing = Math.max(casing, hot.state.casingT);
      side = Math.max(side, hot.state.drumUpperT);
    }
    near(liner, MODEL.linerPeak, 2, 'liner');
    near(sleeve, MODEL.sleevePeak, 2, 'sleeve');
    near(brick, MODEL.brickPeak, 2, 'brick');
    near(casing, MODEL.casingPeak, 2, 'casing');
    near(side, MODEL.sidePeak, 2, 'side');
    const above = new MassHeaterSim();
    above.set({ hour: 20.75 });
    near(above.state.benchT[2 + 5 * 2]!, MODEL.earthDuct, 0.5, 'earth above the duct');
    near(above.state.benchT[1 + 5 * 1]!, MODEL.earthBeside, 0.5, 'earth on the wall’s side of the duct');
    const c = base.counters;
    const total = c.toSegments.reduce((a, b) => a + b, 0);
    near(((c.toSegments[0]! + c.toSegments[1]!) / total) * 100, MODEL.hotRunShare, 1, 'the hot run');
  });

  it('wood, and the claims', () => {
    near(woodForRoom(J, 20).kg, MODEL.wood20, 0.1, 'for 20 °C');
    near(woodForRoom({ ...J, outsideMean: -10 }, 20).kg, MODEL.woodSnap, 0.3, 'at −10 °C');
    near(woodForRoom({ ...J, houseH: 300 }, 20).kg, MODEL.woodLeaky, 0.5, 'at H 300');
    near(woodForRoom({ ...J, houseH: 300, outsideMean: -10 }, 20, 120).kg, MODEL.woodLeakySnap, 0.5, 'both');
    const c35 = claimCheck(J, 0.35);
    near(pct(c35.savedByStove), MODEL.saved35, 0.5, '35');
    near(pct(claimCheck(J, 0.5).savedByStove), MODEL.saved50, 0.5, '50');
    near(pct(claimCheck(J, 0.72).savedByStove), MODEL.saved72, 0.6, '72');
    near(pct(c35.etaFor80), MODEL.oldFor80, 0.5, 'for 80');
    near(pct(c35.etaFor90), MODEL.oldFor90, 0.5, 'for 90');
    near(pct(c35.savedWithInsulation), MODEL.savedBoth, 0.5, 'both');
    near(c35.woodOld, MODEL.woodOld35, 0.5, 'old stove');
    near(c35.woodOldLeaky, MODEL.woodOldLeaky, 0.5, 'old stove, leaky house');
  });

  it('the sensitivity table', () => {
    near(pct(day({ chimneyTop: 8 }).delivered), MODEL.chimney8Eta, 0.5, 'chimney 8 m');
    near(day({ flueInsulated: false }).roomMean, MODEL.uninsulatedRoom, 0.1, 'uninsulated');
    const short = day({ riserHeight: 0.64 });
    near(pct(short.delivered), MODEL.riserShortEta, 0.5, 'riser 0.64');
    near(pct(short.shareDrum), MODEL.riserShortDrum, 0.5, 'riser 0.64, drum');
    const tall = day({ riserHeight: 1.27 });
    near(pct(tall.delivered), MODEL.riserLongEta, 0.5, 'riser 1.27');
    near(pct(tall.shareDrum), MODEL.riserLongDrum, 0.5, 'riser 1.27, drum');
    near(pct(day({ lidAfterFire: false }).delivered), MODEL.noLidEta, 0.5, 'no lid');
    near(pct(day({ ductFilm: 0.5 }).delivered), MODEL.filmLowEta, 0.5, 'film × 0.5');
    near(pct(day({ ductFilm: 2 }).delivered), MODEL.filmHighEta, 0.5, 'film × 2');
    near(day({ ductFilm: 0.5 }).meanExhaust, MODEL.filmLowExhaust, 1, 'film × 0.5, exit');
    near(day({ ductFilm: 2 }).meanExhaust, MODEL.filmHighExhaust, 1, 'film × 2, exit');
    const kLow = day({ benchK: 0.3 });
    near(kLow.seatHotPeak, MODEL.kLowSeat, 0.1, 'k 0.3, seat');
    near(pct(kLow.delivered), MODEL.kLowEta, 0.5, 'k 0.3');
    const kHigh = day({ benchK: 1.06 });
    near(kHigh.seatHotPeak, MODEL.kHighSeat, 0.1, 'k 1.06, seat');
    near(pct(kHigh.delivered), MODEL.kHighEta, 0.5, 'k 1.06');
    const peb = settledDay(presetParams('pebble-bench')).summary;
    near(peb.seatHotPeak, MODEL.pebbleSeat, 0.1, 'pebble seat');
    near(pct(peb.delivered), MODEL.pebbleEta, 0.5, 'pebble');
  });

  it('the scenarios of the texts', () => {
    const sc = (id: Parameters<typeof scenarioSetup>[0]) => settledDay(scenarioSetup(id).params).summary;
    const mild = sc('one-fire-mild');
    near(mild.roomMin, MODEL.mildRoomLow, 0.5, 'mild low');
    near(mild.roomMax, MODEL.mildRoomHigh, 0.5, 'mild high');
    near(mild.woodKg, MODEL.mildWood, 0.1, 'mild wood');
    const snap = sc('cold-snap');
    near(snap.roomMin, MODEL.snapRoomLow, 0.05, 'snap low');
    near(snap.roomMax, MODEL.snapRoomHigh, 0.05, 'snap high');
    near(pct(snap.delivered), MODEL.snapEta, 0.5, 'snap');
    const wet = sc('wet-wood');
    near(wet.meanChamber, MODEL.wetChamber, 1, 'wet chamber');
    near(wet.roomMean, MODEL.wetRoom, 0.05, 'wet room');
    near(pct(wet.delivered), MODEL.wetEta, 0.5, 'wet');
    const short = sc('short-bench');
    near(short.meanExhaust, MODEL.shortExhaust, 1, 'short exit');
    near(pct(short.delivered), MODEL.shortEta, 0.5, 'short');
    const long = sc('long-bench');
    near(long.meanExhaust, MODEL.longExhaust, 1, 'long exit');
    near(long.meanDraft, MODEL.longDraft, 0.1, 'long draught');
    near(pct(long.delivered), MODEL.longEta, 0.5, 'long');
    near(long.condensate, MODEL.longWater, 0.05, 'long water');
    near(long.belowDewHours, MODEL.longHours, 0.3, 'long hours');
    const low = sc('low-chimney');
    near(low.meanDraft, MODEL.lowDraft, 0.1, 'low draught');
    near(low.meanLambda, MODEL.lowLambda, 0.1, 'low lambda');
    near(pct(low.delivered), MODEL.lowEta, 0.5, 'low');
    near(pct(sc('small-gap').delivered), MODEL.eta, 1, 'a narrow gap is within a point');
    const leaky = sc('leaky-house');
    near(leaky.roomMin, MODEL.leakyRoomLow, 0.05, 'leaky low');
    near(leaky.roomMax, MODEL.leakyRoomHigh, 0.05, 'leaky high');
    near(pct(leaky.delivered), MODEL.eta, 0.5, 'leaky');
    const lowSim = new MassHeaterSim();
    lowSim.set({ chimneyTop: 2.7 });
    lowSim.flush();
    lowSim.set({ hour: 9 });
    near(-lowSim.state.lidPressure, MODEL.lidPaLow, 0.2, 'lid, low chimney');
    const cold = new MassHeaterSim();
    cold.applyScenario('cold-start');
    near(-cold.state.gasFlow * 1000, MODEL.coldFlow, 0.1, 'cold air falling');
    near(cold.state.draft, -MODEL.coldFluePa, 0.1, 'cold flue');
    expect(cold.state.lidPressure, 'a cold flue: a positive pressure under the lid').toBeGreaterThan(0);
    const longSim = new MassHeaterSim();
    longSim.applyScenario('long-bench');
    longSim.set({ hour: 9 });
    near(longSim.state.dewPointT, MODEL.longDew, 0.5, 'dew point on 18 m');
    expect(MODEL.longDew).toBeGreaterThan(MODEL.longExhaust);
    expect(MODEL.coWet / MODEL.coLean, 'wet wood: over three times the CO').toBeGreaterThan(3);
    expect(base.summary.condensate, 'nothing condenses on 9 m').toBe(0);
  });

  it('the fan and the damper: numbers only, a whole-house mean', () => {
    const run = (id: 'damper-on-embers' | 'extract-fan' | 'cold-start', seconds: number) => {
      const sim = new MassHeaterSim();
      sim.applyScenario(id);
      const start = sim.state.simTime;
      let peak = 0;
      let peakAt = 0;
      let who = -1;
      let alarm = -1;
      let turned = -1;
      let reversed = false;
      for (let i = 0; i < seconds * 15; i++) {
        sim.step(1 / 15);
        const t = (sim.state.simTime - start) / 60;
        if (sim.state.roomCo > peak) {
          peak = sim.state.roomCo;
          peakAt = t;
        }
        if (who < 0 && sim.state.alarms.includes('roomCoGuideline')) who = t;
        if (alarm < 0 && sim.state.coAlarm) alarm = t;
        if (sim.state.flowDirection < 0) reversed = true;
        if (reversed && turned < 0 && sim.state.flowDirection > 0) turned = t;
      }
      return { peak, peakAt, who, alarm, turned };
    };
    const d = run('damper-on-embers', 180);
    near(d.who, MODEL.damperWhoMin, 1, 'damper, WHO');
    near(d.alarm, MODEL.damperAlarmMin, 1, 'damper, alarm');
    near(d.peak, MODEL.damperPeak, 2, 'damper, peak');
    near(d.peakAt, MODEL.damperPeakMin, 2, 'damper, peak at');
    const f = run('extract-fan', 180);
    near(f.peak, MODEL.fanCoPeak, 2, 'fan, peak');
    near(f.peakAt, MODEL.fanPeakMin, 2, 'fan, peak at');
    near(f.who, MODEL.fanWhoMin, 1, 'fan, WHO');
    expect(f.alarm).toBe(-1);
    const c = run('cold-start', 120);
    near(c.peak, MODEL.coldRoomCo, 2, 'cold start, room CO');
    // the warmer starts at 25 s of a minute a second; it turns about 3 minutes later
    near(c.turned - 25, MODEL.turnMin, 1, 'cold start, the turn');
    const late = new MassHeaterSim();
    late.set({ hour: 9.5 + 40 / 60, timeScale: 60 });
    late.set({ damperClosed: true });
    let peak = 0;
    for (let i = 0; i < 180 * 15; i++) {
      late.step(1 / 15);
      peak = Math.max(peak, late.state.roomCo);
    }
    near(peak, MODEL.damperLatePeak, 2, 'late damper');
    expect(late.state.coAlarm).toBe(0);
  });

  it('the plume at the cap: steam during the fire, smoke once the wood stops, and more smoke on wet wood', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 9 });
    expect(sim.state.smokeAtCap).toBe(0);
    expect(sim.state.steamAtCap).toBeGreaterThan(0.5);
    sim.set({ hour: 10 });
    expect(sim.state.smokeAtCap).toBeGreaterThan(0.3);
    const wet = new MassHeaterSim();
    wet.applyScenario('wet-wood');
    wet.set({ hour: 9 });
    expect(wet.state.smokeAtCap).toBeGreaterThan(0.1);
  });

  it('a fan keeps the flow on its branch: raised slowly it holds at full fire to 10 Pa, and turns the flow near 6 Pa after the fire; set at once, 10 Pa turn it even at full fire', () => {
    const raised = (hour: number, fanPa: number) => {
      const sim = new MassHeaterSim();
      sim.set({ hour, timeScale: 1 });
      for (let p = 0; p <= fanPa; p += 0.5) {
        sim.set({ fanPa: p });
        for (let i = 0; i < 15; i++) sim.step(1 / 15);
      }
      return sim.state.gasFlow;
    };
    expect(raised(9, ASSUMED.fanPa)).toBeGreaterThan(0);
    expect(raised(12, 5)).toBeGreaterThan(0);
    expect(raised(12, 6)).toBeLessThan(0);
    const atOnce = new MassHeaterSim();
    atOnce.set({ hour: 9, timeScale: 1 });
    atOnce.set({ fanPa: ASSUMED.fanPa });
    for (let i = 0; i < 300; i++) atOnce.step(1 / 15);
    expect(atOnce.state.gasFlow).toBeLessThan(0);
  });

  it('the figures with no run of their own are in the tables of docs/physics.md', () => {
    const docs = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
      string,
      string
    >;
    const physics = docs['../../docs/physics.md']!;
    expect(physics).toMatch(
      /about 230 ppm at the lean default \(band 80 to 700\), 170 ppm at 5 kg\/h and a hot chamber, 850 ppm on wet wood, 2,000 ppm as the load burns out/,
    ); // coLean, coHot, coWet, coEnd
    expect(physics).toMatch(/\*\*1,470 mg\/MJ over a day\*\* \(22 g\/kg\)/); // coPerMj, coPerKg
    expect(physics).toMatch(/Across the inputs: drum 21 to 45 %, bench 10 to 27 %, lost 1 to 42 %/); // the ranges
    expect(physics).toMatch(/the bench swings about 5 kWh per burn/); // benchSwingKwh
    expect(physics).toMatch(/Flame \*\*1,180 °C\*\* at λ 2/); // flameTwoAir
    expect(physics).toMatch(/\*\*9\.3 W\/m²·K, 60 % radiation\*\*/); // filmTotal
    expect(physics).toMatch(/About 85 % of the whole is spent across the feed/); // feedPaShare
    expect(physics).toMatch(/1\.5 kW for 5 min/); // warmKw, warmMin
    expect(physics).toMatch(/−2\.4 Pa if the house’s leaks|the model gives −2\.4 Pa/); // the leaks at the ceiling
  });

  it('the derived figures are the arithmetic the research gives', () => {
    near(benchMass(SIM_MACHINE.bore, SIM_MACHINE.ductLength, COB.rho), DERIVED.benchKg, 1, 'mass');
    near((DERIVED.benchKg * COB.c) / 3.6e6, DERIVED.benchKwhK, 0.005, 'kWh per K');
    near(12.5 * 4.16, DERIVED.woodKwh, 0.5, 'wood');
    near(Math.PI * (MACHINE.drumDiameter / 2) ** 2 * MACHINE.drumHeight * 1000, DERIVED.drumLitres, 1, 'drum litres');
    near(106 / 74, DERIVED.hPerFloor, 0.05, 'H per floor');
    near(74 * 2.5, DERIVED.houseVolume, 0.5, 'volume');
    near(150 * 12.5, DERIVED.seasonTonnes * 1000, 50, 'season');
    near(150 * 36, DERIVED.seasonLeakyTonnes * 1000, 50, 'season, leaky');
    near(150 * MODEL.woodOld35, DERIVED.seasonOldTonnes * 1000, 50, 'season, old stove');
    near(150 * MODEL.woodOldLeaky, DERIVED.seasonOldLeakyTonnes * 1000, 50, 'season, old stove, leaky');
    near(57 * 0.4536, DERIVED.ashKg, 0.5, 'ash kg');
    near(7 * 28.35, DERIVED.ashG, 3, 'ash g');
    near(12.5 * 7.7, DERIVED.ashDayG, 0.5, 'ash a day');
    near((150 * 96) / 1000, DERIVED.ashSeasonKg, 0.5, 'ash a season');
    near(100 / 1.165, DERIVED.whoPpm15, 0.5, 'WHO 15 min');
    near(35 / 1.165, DERIVED.whoPpm1h, 0.5, 'WHO 1 h');
    near(10 / 1.165, DERIVED.whoPpm8h, 0.05, 'WHO 8 h');
    near(7 / 1.165, DERIVED.whoPpm24h, 0.5, 'WHO 24 h');
    near(0.3 * 4 * 2.5 * 2300, DERIVED.stoneWallTonnes * 1000, 50, 'stone wall');
    near(128 / 2, DERIVED.cordDays, 0, 'cord');
    near(36 * 2.54, DERIVED.clearanceDrumCm, 2, '36 in');
    near(18 * 2.54, DERIVED.clearanceShieldCm, 1, '18 in');
    near(25.4, DERIVED.shieldGapMm, 0.5, '1 in');
    near(36 * 0.0254, DERIVED.benchLimitM, 0.05, 'bench');
    near(48 * 0.0254, DERIVED.backLimitM, 0.05, 'back');
    near(10 * 0.3048, DERIVED.hotRunM, 0.1, 'hot run');
    near(6 * 2.54, DERIVED.coverHotCm, 0.3, 'hot cover');
    near(4 * 2.54, DERIVED.coverColdCm, 0.2, 'cold cover');
    near((Math.PI * MACHINE.bore ** 2) / 4, DERIVED.section, 0.001, 'section');
    near(Math.PI * 0.3 * 0.05, DERIVED.gapArea, 0.001, 'gap');
    near(ESTIMATE.machineTonnes, DERIVED.benchTonnes + ESTIMATE.coreTonnes, 0.01, 'mass of the machine');
  });

  it('every figure is printable', () => {
    for (const [k, [v, d]] of Object.entries(FIG)) {
      expect(Number.isFinite(v), k).toBe(true);
      expect(d, k).toBeGreaterThanOrEqual(0);
    }
  });
});

// ------------------------------------------------------------------------------------------------ the guides

const ORIGIN_FR = /Origine : (rapporté|pratique courante|notre reconstitution)[^.]*\.$/;
const ORIGIN_EN = /Origin: (reported|usual practice|our reconstruction)[^.]*\.$/;

describe('the two guides', () => {
  it('have the steps of the bar, each with a unique id', () => {
    expect(ASSEMBLY.length).toBe(20);
    expect(INSTALL.length).toBe(10);
    expect(new Set(ASSEMBLY.map((s) => s.id)).size).toBe(20);
    expect(new Set(INSTALL.map((s) => s.id)).size).toBe(10);
  });

  it('every step ends with its origin, in both languages, the same one', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.text.fr, s.id).toMatch(ORIGIN_FR);
      expect(s.text.en, s.id).toMatch(ORIGIN_EN);
      const f = ORIGIN_FR.exec(s.text.fr)![1]!;
      const e = ORIGIN_EN.exec(s.text.en)![1]!;
      expect(
        { rapporté: 'reported', 'pratique courante': 'usual practice', 'notre reconstitution': 'our reconstruction' }[
          f
        ],
        s.id,
      ).toBe(e);
    }
  });

  it('say once, at the top of each, that this is a reconstruction and not a plan', () => {
    expect(ASSEMBLY[0]!.text.en).toMatch(/it is our reconstruction, not a plan to follow/);
    expect(ASSEMBLY[0]!.text.fr).toMatch(/c’est notre reconstitution, pas un plan à suivre/);
    expect(INSTALL[0]!.text.en).toMatch(/it is our reconstruction, not a procedure/);
    expect(INSTALL[0]!.text.fr).toMatch(/c’est notre reconstitution, pas une procédure/);
    const say = /not a plan to follow|not a procedure/;
    expect([...ASSEMBLY, ...INSTALL].filter((s) => say.test(s.text.en)).length).toBe(2);
  });

  it('install every id of living-room, fire-core and bench-section once in the assembly, every id of homestead once in the installation, each in its own world', () => {
    const asm = ASSEMBLY.flatMap((s) => s.parts);
    expect([...asm].sort()).toEqual(
      [...partIds('living-room'), ...partIds('fire-core'), ...partIds('bench-section')].sort(),
    );
    expect(INSTALL.flatMap((s) => s.parts).sort()).toEqual([...partIds('homestead')].sort());
    for (const s of [...ASSEMBLY, ...INSTALL])
      for (const id of s.parts)
        expect(Object.keys(PART_CATEGORIES[s.scene as WorldId]), `${s.id}: ${id}`).toContain(id);
  });

  it('follow a sensible order, and nothing floats', () => {
    const at = (id: string) => ASSEMBLY.findIndex((s) => s.parts.includes(id));
    for (const [a, b] of [
      ['hearth-slab', 'floor-barrier'],
      ['floor-barrier', 'firebrick-base'],
      ['firebrick-base', 'burn-tunnel'],
      ['burn-tunnel', 'feed-tube'],
      ['burn-tunnel', 'heat-riser'],
      ['heat-riser', 'riser-insulation'],
      ['riser-sleeve', 'core-casing'],
      ['core-casing', 'drum-plinth'],
      ['drum-plinth', 'steel-drum'],
      ['manifold', 'duct-hot-run'],
      ['duct-hot-run', 'duct-cold-run'],
      ['duct-cold-run', 'chimney-tee'],
      ['chimney-tee', 'chimney-flue'],
      ['duct-joint', 'cob-casing'],
      ['temperature-lance', 'earthen-plaster'],
      ['cob-casing', 'cob-bench'],
      ['cob-bench', 'earthen-plaster'],
      ['co-alarm', 'fuel-sticks'],
      ['ventilation-grille', 'feed-lid'],
    ] as const)
      expect(at(a), `${a} before ${b}`).toBeLessThan(at(b));
    expect(INSTALL.filter((s) => s.parts.length === 0).map((s) => s.id)).toEqual([
      'insurer',
      'floor',
      'professional',
      'small-fires',
    ]);
  });

  it('give no recipe figure: no torque, no duration, no thickness, no cure time', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.torque, s.id).toBeUndefined();
      expect(s.duration, s.id).toBeUndefined();
      expect(s.tools?.length ?? 0, s.id).toBeGreaterThan(0);
      expect(s.text.en, s.id).not.toMatch(/N·m|\bMPa\b|\bcm\b|\bmm\b|days? of (cure|drying)|\bweeks?\b/);
    }
    for (const s of ASSEMBLY) expect(s.text.en, s.id).not.toMatch(/ratio|mortar mix/i);
  });

  it('keep each step readable, and say what is checked', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.text.en.length, s.id).toBeGreaterThan(200);
      for (const lang of ['fr', 'en'] as const) {
        expect(words(s.text[lang]), `${s.id} text ${lang}: ${words(s.text[lang])}`).toBeLessThanOrEqual(100);
        if (s.warning) expect(words(s.warning[lang]), `${s.id} warning ${lang}`).toBeLessThanOrEqual(45);
      }
    }
    for (const s of [...ASSEMBLY, ...INSTALL.filter((x) => x.id !== 'insurer')]) {
      expect(s.text.en, s.id).toMatch(/To check/);
      expect(s.text.fr, s.id).toMatch(/On contrôle/);
    }
  });

  it('warn where the gesture is risky, once each', () => {
    const asm = (id: string) => ASSEMBLY.find((s) => s.id === id)!;
    const ins = (id: string) => INSTALL.find((s) => s.id === id)!;
    expect(asm('base').warning?.en).toMatch(/silica/);
    expect(asm('insulation').warning?.en).toMatch(/did not check/);
    expect(asm('casing').warning?.en).toMatch(/carbon monoxide/);
    expect(asm('drum').warning?.en).toMatch(/recovered drum/);
    expect(asm('hot-run').warning?.en).toMatch(/zinc fumes/);
    expect(asm('chimney').warning?.en).toMatch(/Work at height/);
    expect(asm('first-fires').warning?.en).toMatch(/smoke-back/);
    expect(ins('insurer').warning?.en).toMatch(/not recognised/);
    expect(ins('small-fires').warning?.en).toMatch(/call the emergency services/);
    expect(ASSEMBLY.filter((s) => s.warning).length + INSTALL.filter((s) => s.warning).length).toBe(9);
  });

  it('name the insurer, in writing, before any work, where it matters', () => {
    const s = INSTALL.find((x) => x.id === 'insurer')!;
    expect(s.text.en).toMatch(/before any work, ask your insurer, in writing/);
    expect(s.text.fr).toMatch(/avant tout chantier, demander à votre assureur, par écrit/);
    expect(s.text.en).toMatch(/None has been checked by a lawyer/);
  });
});

// ------------------------------------------------------------------------------------------------ the sources

describe('the Sources panel', () => {
  it('builds, with its notices and a link for every source', () => {
    installFakeDom();
    setLang('en');
    const panel = aboutPanel({ videoUrl: (ts) => `https://example.test/${ts}` });
    expect(panel.length).toBeGreaterThan(10);
    const text = panel.map((e) => e.textContent).join(' ');
    expect(text).toMatch(/educational reconstruction/i);
    expect(text).toMatch(/Do not build one from this site/);
    expect(text).toMatch(/Peter van den Berg/);
    expect(text).toMatch(/not legal advice/);
    expect(text).toMatch(/read in summary/);
    setLang('fr');
  });

  it('links to the sources of the research but those it must not link, as https', () => {
    const docs = import.meta.glob('../../docs/research.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    const research = docs['../../docs/research.md']!;
    const section = research.slice(research.indexOf('## 1. Sources'), research.indexOf('### 1.1'));
    const wanted = [...section.matchAll(/https:\/\/[^\s|]+/g)].map((m) => m[0]);
    expect(wanted.length).toBeGreaterThan(50);
    const have = new Set(SOURCES.flatMap((g) => g.items.map((s) => s.href)).filter((h): h is string => !!h));
    have.add(MAIN_VIDEO.href);
    const missing = wanted.filter((u) => !have.has(u) && !(NOT_LINKED as readonly string[]).includes(u));
    expect(missing.join('\n')).toBe('');
    for (const u of have) expect(u).toMatch(/^https:\/\//);
  });

  it('never links the tin-can tutorial, a page that sells plans, or a pirated book', () => {
    const hrefs = SOURCES.flatMap((g) => g.items.map((s) => s.href ?? ''));
    hrefs.push(MAIN_VIDEO.href);
    for (const bad of NOT_LINKED) expect(hrefs, bad).not.toContain(bad);
    for (const h of hrefs)
      expect(h).not.toMatch(/uFUcffTFs|XfRItGCXcfs|freeheat|richsoil|zenodo|Plans-Annex|staticpages/i);
    const books = SOURCES.flatMap((g) => g.items).filter((s) =>
      /Rocket Mass Heaters, 3e|Builder’s Guide/.test(s.label),
    );
    expect(books.length).toBe(2);
    for (const b of books) expect(b.href).toBeUndefined();
    // no link of any kind in a visitor text
    for (const [label, v] of visitorTexts()) expect(v.en + v.fr, label).not.toMatch(/https?:\/\//);
  });

  it('says how every source was read, in both languages, and the books are not said to be read', () => {
    for (const a of Object.values(ACCESS)) {
      expect(a[0].length).toBeGreaterThan(3);
      expect(a[1].length).toBeGreaterThan(3);
    }
    for (const g of SOURCES) for (const s of g.items) expect(ACCESS[s.access], s.label).toBeDefined();
    const by = (re: RegExp) => SOURCES.flatMap((g) => g.items).find((s) => re.test(s.label))!;
    expect(by(/Rocket Mass Heaters, 3e/).access).toBe('search');
    expect(by(/Schumack/).access).toBe('search');
    expect(by(/Oxalis/).access).toBe('read');
    expect(by(/12 rocket mass heater/).fr).toMatch(/vend des plans/);
    expect(by(/12 rocket mass heater/).en).toMatch(/sells plans/);
    expect(by(/12 rocket mass heater/).href).toBeUndefined();
    expect(by(/12 rocket mass heater/).access).toBe('seen');
  });

  it('gives the law place by place, each line saying how it was reached; a lawyer read none of it', () => {
    expect(LAW.length).toBe(8);
    const how =
      /\b(Read in summary|read in summary|text read|Seen in a search summary|seen in a search summary|Not checked)\b/;
    for (const [place, f, e] of LAW) {
      expect(e, place[1]).toMatch(how);
      expect(f, place[0]).toMatch(/\blu\b|Lu\b|Vu dans|vu dans|Non vérifié|lue/);
    }
    expect(LAB_STRINGS.legal[1]).toMatch(/None of what follows has been checked by a lawyer/);
    expect(LAB_STRINGS.legal[0]).toMatch(/Rien de ce qui suit n’a été vérifié par un juriste/);
    expect(LAB_STRINGS.legal[1]).toMatch(/We found no standard saying a cob J-tube is safe/);
    expect(LAB_STRINGS.legal[1]).toMatch(/The insurer is the real gate/);
    // the law's figures live there, not in a sheet
    for (const [label, v] of visitorTexts()) expect(v.en, label).not.toMatch(/2015\/1185|DTU|mg\/m³ of (CO|dust)/);
  });

  it('keeps the outline of the main video inside its 6:16', () => {
    for (const [ts] of CHAPTERS) {
      const [m, s] = ts.split(':').map(Number);
      expect((m ?? 0) * 60 + (s ?? 0)).toBeLessThanOrEqual(376);
    }
    expect(CHAPTERS.length).toBe(7);
  });

  it('has no leftover of the template in the strings, and a real title in each language', () => {
    expect(LAB_STRINGS.labTitle[0]).toMatch(/POÊLE DE MASSE/);
    expect(LAB_STRINGS.labTitle[1]).toMatch(/MASS HEATER/);
    expect(LAB_STRINGS.tagline[0].length).toBeLessThanOrEqual(60);
    expect(LAB_STRINGS.tagline[1].length).toBeLessThanOrEqual(60);
    for (const [f, e] of Object.values(LAB_STRINGS)) expect(f + e).not.toMatch(/Explorer · Comprendre|flywheel|volant/);
  });
});

describe('public/lab.json and the README', () => {
  const raw = import.meta.glob(['../../public/lab.json', '../../README.md'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  const json = JSON.parse(raw['../../public/lab.json']!) as {
    title: { fr: string; en: string };
    tagline: { fr: string; en: string };
    tags: string[];
    status: string;
  };
  const readme = raw['../../README.md']!;

  it('fills the portfolio’s card, in both languages, and stays in building', () => {
    expect(json.status).toBe('building');
    expect(json.tags.length).toBeGreaterThan(2);
    expect(json.title.fr).toMatch(/poêle de masse/);
    expect(json.title.en).toMatch(/Mass Heater/);
    expect(json.tagline.fr).toMatch(/tube en J/);
    expect(json.tagline.en).toMatch(/J-tube/);
    expect(json.tagline.fr).not.toMatch(/à remplacer/);
  });

  it('the README is in English first, then French, and promises nothing', () => {
    const french = readme.indexOf('## Français');
    expect(french).toBeGreaterThan(500);
    expect(readme.slice(0, french)).toMatch(/does not balance from the stove alone/);
    expect(readme.slice(french)).toMatch(/ne boucle pas avec le poêle seul/);
    expect(readme).not.toMatch(/\b4 to 8 h|\bfinished\b/);
    expect(readme).not.toMatch(/uFUcffTFs|freeheat\.info|richsoil/);
  });
});
