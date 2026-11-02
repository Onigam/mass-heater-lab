import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { num, PANEL_STRINGS, st, sx, type PanelKey } from './strings';
import { installFakeDom } from './test-dom';

// The panel's words: French and English written together, same detail, no placeholder, no research code, no internal word, and no number in a text that does not come from docs/research.md or
// docs/physics.md. And what a lab about fire must not say.

beforeAll(() => installFakeDom()); // setLang writes the language on the document element
afterEach(() => setLang('fr'));

const entries = Object.entries(PANEL_STRINGS);
/** The numbers of a text, decimal commas read as points: "0,8" and "0.8" give the same list. */
const numbers = (s: string): string[] => (s.replace(/(\d),(\d)/g, '$1.$2').match(/\d+(\.\d+)?/g) ?? []).sort();

/**
 * Every number a text may contain, with its source.
 * 80, 90: the claim of wood saved, quoted to test it. 200, 150: the bore of the machine and of the batch preset (the research). 2: « O₂ » has none, but CO₂ might be written; kept out.
 */
const ALLOWED = new Set(['80', '90', '200', '150', '2']);

describe('the panel’s words', () => {
  it('there are words to check', () => {
    expect(entries.length).toBeGreaterThan(150);
  });
  it('never show a research code (K12, S3…) or an internal word', () => {
    for (const [key, [fr, en]] of entries) {
      for (const text of [fr, en]) {
        expect(text, key).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, key).not.toMatch(/\bid\b|\bworld\b|\bpreset id\b|\bundefined\b/i);
      }
    }
  });
  it('exist in both languages, non-empty, with no placeholder', () => {
    for (const [key, [fr, en]] of entries) {
      expect(fr.trim().length, `${key} fr`).toBeGreaterThan(0);
      expect(en.trim().length, `${key} en`).toBeGreaterThan(0);
      for (const text of [fr, en]) expect(text, key).not.toMatch(/TODO|FIXME|lorem|xxx|\[\[|\{\{/i);
    }
  });
  it('carry the same numbers in French and in English', () => {
    for (const [key, [fr, en]] of entries) expect(numbers(fr), key).toEqual(numbers(en));
  });
  it('have the same level of detail', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr.length < 40 && en.length < 40) continue;
      expect(fr.length / en.length, key).toBeGreaterThan(0.6);
      expect(fr.length / en.length, key).toBeLessThan(1.7);
    }
  });
  it('are only the same in both languages for a unit, a name or a single word', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr === en) expect(fr.split(/\s+/).length, `${key}: ${fr}`).toBeLessThanOrEqual(2);
    }
  });
  it('hold no number but those of the research', () => {
    for (const [key, [, en]] of entries) {
      const text = en.replace(/\bA3\b|\b3D\b|O₂|\b24 h\b/g, '');
      for (const n of numbers(text)) expect(ALLOWED.has(n), `${key}: ${n} in « ${en} »`).toBe(true);
    }
  });
  it('say the model is a model once, and that a model cannot say a heater is safe once', () => {
    const count = (re: RegExp) => entries.filter(([, [, en]]) => re.test(en)).length;
    expect(count(/We found no laboratory measurement/)).toBe(1);
    expect(count(/cannot say that a heater is safe/)).toBe(1);
  });
  it('never promise: no word reads as a guarantee, a design value or an instruction to build', () => {
    for (const [key, [fr, en]] of entries) {
      if (key === 'safetyNote') continue;
      expect(en, key).not.toMatch(
        /\b(safe to|is safe|are safe|guarantee|certified|compliant|recommended size|you should build|how to build)\b/i,
      );
      expect(fr, key).not.toMatch(/\b(sans danger|garanti|certifié|conforme|à construire ainsi)\b/i);
    }
    // the one sentence that uses the word says the opposite
    expect(PANEL_STRINGS.safetyNote![1]).toContain('cannot say');
    // nor do the alarm, the professional and the insurer: the CO alarm's sheet says it signals a fault and does not vouch for the air
    expect(PANEL_STRINGS.safetyNote![0]).toContain('Aucun ne garantit l’air de la pièce');
    expect(PANEL_STRINGS.safetyNote![1]).toContain('None of them vouches for the air in the room');
    expect(PANEL_STRINGS.safetyNote![0]).not.toMatch(/qui le peuvent/);
    expect(PANEL_STRINGS.safetyNote![1]).not.toMatch(/insurer can\./);
    expect(PANEL_STRINGS.machineHint![1]).toContain('None is a size to build');
  });
  it('the panel’s lookups work in both languages', () => {
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      expect(st('simIntro' as PanelKey).length).toBeGreaterThan(40);
      expect(sx('alarm', 'smokeBack').length).toBeGreaterThan(5);
      expect(sx('regime', 'embers').length).toBeGreaterThan(3);
      expect(sx('phase', 'roaring').length).toBeGreaterThan(3);
    }
  });
});

describe('num', () => {
  it('writes the decimal mark of the language', () => {
    setLang('fr');
    expect(num(7.5, 1)).toBe('7,5');
    setLang('en');
    expect(num(7.5, 1)).toBe('7.5');
    expect(num(Number.NaN)).toBe('—');
    expect(num(-0.001, 1)).toBe('0.0');
  });
});
