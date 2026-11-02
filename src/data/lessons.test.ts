import { describe, expect, it } from 'vitest';
import { WORLDS, type WorldId } from './ids';
import { LESSONS } from './lessons';
import { PARTS } from './parts';
import { MassHeaterSim } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { SCENARIO_TEXTS } from '../sim/texts';

// The six lessons: the bar, the quiz, each tied to a scenario that exists and a part that stands in the world it opens, all twelve scenarios gone through, the heart of the fourth and the fifth, what the sixth says.

const body = (id: string, lang: 'fr' | 'en') =>
  LESSONS.find((x) => x.id === id)!
    .body.map((b) => b[lang])
    .join(' ');

describe('the lessons', () => {
  it('meet the bar: six lessons, twelve questions, two each', () => {
    expect(LESSONS.length).toBe(6);
    expect(LESSONS.reduce((n, x) => n + (x.quiz?.length ?? 0), 0)).toBe(12);
    for (const x of LESSONS) expect(x.quiz?.length, x.id).toBe(2);
    expect(LESSONS.map((x) => x.id)).toEqual([
      'the-fire-goes-sideways',
      'smoke-is-fuel',
      'where-the-heat-goes',
      'charge-and-give-back',
      'two-fires-which-house',
      'fire-co-and-the-law',
    ]);
  });

  it('open each on a real scenario, in a real world, on a part that stands there', () => {
    const used = new Set<string>();
    for (const x of LESSONS) {
      expect(WORLDS, x.id).toContain(x.focus.scene as WorldId);
      expect(SCENARIO_IDS as readonly string[], x.id).toContain(x.focus.scenario);
      expect(x.focus.preset === undefined || (PRESET_IDS as readonly string[]).includes(x.focus.preset), x.id).toBe(
        true,
      );
      expect(PARTS.find((p) => p.id === x.focus.part)?.scene, x.id).toBe(x.focus.scene);
      used.add(x.focus.scenario!);
    }
    expect(used.size).toBe(6);
  });

  it('go through the simulation’s twelve scenarios, each called by the name the panel gives it, in both languages', () => {
    const fr = LESSONS.flatMap((x) => x.body.map((b) => b.fr)).join(' ');
    const en = LESSONS.flatMap((x) => x.body.map((b) => b.en)).join(' ');
    expect(SCENARIO_IDS.length).toBe(12);
    for (const id of SCENARIO_IDS) {
      const [nameFr, nameEn] = SCENARIO_TEXTS[id].name;
      expect(fr, id).toContain(`« ${nameFr} »`);
      expect(en, id).toContain(`“${nameEn}”`);
    }
  });

  it('run: each scenario starts in the engine', () => {
    const sim = new MassHeaterSim();
    for (const x of LESSONS) expect(() => sim.applyScenario(x.focus.scenario!), x.id).not.toThrow();
  });

  it('keep each paragraph to a few sentences, a title and a summary that say what the lesson holds', () => {
    for (const x of LESSONS) {
      expect(x.body.length, x.id).toBeGreaterThanOrEqual(3);
      expect(x.figures?.length ?? 0, x.id).toBeGreaterThanOrEqual(3);
      expect(x.formula, x.id).toBeDefined();
      for (const lang of ['fr', 'en'] as const) {
        expect(x.title[lang].length, x.id).toBeGreaterThan(8);
        expect(x.summary[lang].length, x.id).toBeGreaterThan(40);
        for (const b of x.body) expect(b[lang].length, `${x.id}: ${b[lang].slice(0, 40)}`).toBeLessThan(900);
      }
    }
  });

  it('give three choices or more, a good answer in range and not always in the same place, and an explanation', () => {
    const answers: number[] = [];
    for (const x of LESSONS)
      for (const q of x.quiz!) {
        expect(q.choices.length, q.q.en).toBeGreaterThanOrEqual(3);
        expect(q.answer, q.q.en).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.q.en).toBeLessThan(q.choices.length);
        expect(q.explain.en.length, q.q.en).toBeGreaterThan(40);
        expect(q.explain.fr.length, q.q.fr).toBeGreaterThan(40);
        answers.push(q.answer);
      }
    expect(new Set(answers).size).toBe(3);
  });

  it('the first: the chimney draws, a cold flue, the turn is the least sure figure and no method', () => {
    const en = body('the-fire-goes-sideways', 'en');
    expect(en).toMatch(/1\.3 Pa between them, against 14\.9 Pa for the chimney/);
    expect(en).toMatch(/the model does not see it turn by itself/);
    expect(en).toMatch(/least sure figure/);
    expect(en).toMatch(/this account is no method/);
    expect(en).toMatch(/Neither licenses reducing anything/);
    expect(body('the-fire-goes-sideways', 'fr')).toMatch(/1,3 Pa à eux deux, contre 14,9 Pa pour le conduit vertical/);
  });

  it('the second: CO is a map and an order, never a measurement', () => {
    const en = body('smoke-is-fuel', 'en');
    expect(en).toMatch(/A map, not a measurement/);
    expect(en).toMatch(/band of one to nine/);
    expect(en).toMatch(
      /170 ppm in a lively fire, 230 ppm in our fire \(80 to 700 ppm\), 850 ppm on wet wood, 2,000 ppm/,
    );
    expect(en).toMatch(/this is no prediction/);
  });

  it('the third: the split, 78 and 82, no test found, the feed’s opening', () => {
    const en = body('where-the-heat-goes', 'en');
    expect(en).toMatch(/drum 38%, bench 24%, core and floor 18%, flue indoors 3%, gone outside 17%, unburned 1%/);
    expect(en).toMatch(/they add to 101/);
    expect(en).toMatch(/78% delivered to the house, and 82% by a flue calculation/);
    expect(en).toMatch(/plausible range of 65 to 88%/);
    expect(en).toMatch(/We found no independent test of a cob J-tube/);
    expect(en).toMatch(/The feed’s opening decides most of it, and no source gives it/);
  });

  it('the fourth holds the heart: one to two hours after the flame, and the bench does not carry the house', () => {
    const en = body('charge-and-give-back', 'en');
    const fr = body('charge-and-give-back', 'fr');
    expect(en).toMatch(/one to two hours after the flame/);
    expect(fr).toMatch(/une à deux heures après la flamme/);
    expect(en).toMatch(/A \*\*fire\*\* here is a tended session/);
    expect(en).toMatch(/In this model the bench does not carry the house/);
    expect(en).toMatch(/The drum gives twice the bench’s heat/);
    expect(en).toMatch(/nearly 4 kW/);
    expect(en).toMatch(/0\.3 to 0\.5 kW day and night/);
    expect(en).toMatch(/24\.9 to 32\.0 °C/);
    expect(en).toMatch(/17\.3 to 24\.0 °C/);
    expect(en).toMatch(/not retrieved here/);
  });

  it('the fifth says it plainly: the claim does not balance from the stove, reaching 85 % takes insulation', () => {
    const en = body('two-fires-which-house', 'en');
    const fr = body('two-fires-which-house', 'fr');
    expect(en).toMatch(/does not balance from the stove alone/);
    expect(fr).toMatch(/ne boucle pas avec le poêle seul/);
    expect(en).toMatch(/old 35 % stove saves 55%; a 50 % stove, 36%; a 72 % stove, 7%/);
    expect(en).toMatch(/Reaching 85% takes insulation/);
    expect(fr).toMatch(/Pour atteindre 85 %, il faut isoler/);
    expect(en).toMatch(/at 16%, for 90 % at 8%/);
  });

  it('the sixth: numbers only, no closing damper, when this is the wrong answer, the insurer in writing', () => {
    const en = body('fire-co-and-the-law', 'en');
    expect(en).toMatch(/read only the numbers/);
    expect(en).toMatch(/passed at 38 minutes/);
    expect(en).toMatch(/at 52 minutes at the latest/);
    expect(en).toMatch(/123 ppm at 65 minutes/);
    expect(en).toMatch(/No closing damper exists on this machine/);
    expect(en).toMatch(/the alarm has no duty to sound/);
    expect(en).toMatch(/When is this machine the wrong answer/);
    expect(en).toMatch(/the insurer, in writing/);
    expect(en).toMatch(/plainest way to die of this gas/);
    expect(en).not.toMatch(/victim|child|tragic|sleeping family/i);
  });
});
