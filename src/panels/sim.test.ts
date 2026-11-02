import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { MassHeaterSim } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { settledDay } from '../sim/runs';
import { presetParams } from '../sim/presets';
import {
  budgetSegments,
  claimReadouts,
  dayChartData,
  dayReadouts,
  hotChartData,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  pathChartData,
  powerChartData,
  sectionChartData,
  statusOf,
} from './model';
import { SimPanel } from './sim';
import { st, sx } from './strings';
import { stripAlarms, stripClock, stripValues, STRIP_SPEEDS } from './strip';
import { FakeElement, installFakeDom } from './test-dom';

// The panel rendered on a stand-in for the DOM: that it builds, what it offers, that it follows the simulation, that a click does what it says, in both languages.

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

interface Fixture {
  sim: MassHeaterSim;
  panel: SimPanel;
  root: FakeElement;
}

function open(lang: 'fr' | 'en' = 'fr', sim = new MassHeaterSim()): Fixture {
  setLang(lang);
  const ctx = { sim, ui: { scene: 'device' }, gotoScene: () => undefined } as unknown as AppContext<MassHeaterSim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement };
}

const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
const run = (panel: SimPanel, sim: MassHeaterSim, seconds: number): void => {
  for (let i = 0; i < seconds * 30; i++) {
    sim.step(1 / 30);
    panel.tick(1 / 30);
  }
};

describe('what the panel offers', () => {
  it('opens on the machine with its presets, a custom entry and a chip per scenario', () => {
    const { root, sim } = open();
    const options = root.find('option');
    expect(options.slice(0, PRESET_IDS.length).map((o) => o.textContent)).toEqual(
      PRESET_IDS.map((id) => sx('preset', id)),
    );
    expect(options.some((o) => o.textContent === st('custom'))).toBe(true);
    for (const id of SCENARIO_IDS) expect(button(root, sx('scenario', id))).toBeDefined();
    expect(sim.params.preset).toBe('j-tube');
  });

  it('shows the live figures in boxes, each with its tag in the data', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    expect(root.find('.readout')).toHaveLength(mainReadouts(sim.state).length + 1);
    for (const r of mainReadouts(sim.state)) expect(['†', '*', '']).toContain(r.tag);
    expect(root.textContent).toContain('†');
    expect(root.textContent).toContain('°C');
  });

  it('runs the long jobs one by one and fills the day, the claims, the wood needed', () => {
    const { root, sim, panel } = open('en');
    run(panel, sim, 1);
    const text = root.textContent;
    expect(text).toContain(st('budgetDrum'));
    expect(text).toContain(st('effDelivered'));
    expect(text).toContain(st('claimStove'));
    expect(text).toContain(st('effNeeded'));
  });

  it('says it is a model, and that a model cannot say a heater is safe', () => {
    const { root } = open('en');
    expect(root.textContent).toContain(st('safetyNote'));
    expect(root.textContent).toContain('We found no laboratory measurement');
  });

  it('holds the CO as a regime first, with a band, never one figure as if measured', () => {
    const { root, sim, panel } = open('en');
    sim.set({ hour: 8.5 });
    run(panel, sim, 0.3);
    expect(root.textContent).toContain(st('coRegime'));
    expect(root.textContent).toContain(sx('regime', sim.state.regime));
    expect(root.textContent).toMatch(/\d+ – \d/);
  });

  it('has the same structure in both languages', () => {
    const fr = open('fr');
    const en = open('en');
    expect(fr.root.find('button').length).toBe(en.root.find('button').length);
    expect(fr.root.find('input').length).toBe(en.root.find('input').length);
    expect(fr.root.find('select').length).toBe(en.root.find('select').length);
    expect(fr.root.textContent).not.toBe(en.root.textContent);
  });

  it('offers no size to build: no slider’s words say so, one hint says the opposite', () => {
    const { root } = open('en');
    expect(root.textContent).toContain('None is a size to build');
  });
});

describe('what a click does', () => {
  it('a scenario applies, tells its one thing, and the status follows', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'cold-start')).click();
    expect(root.textContent).toContain(sx('lesson', 'cold-start'));
    expect(sim.state.flowDirection).toBe(-1);
    run(panel, sim, 5);
    expect(root.textContent).toContain(st('statusSmoke'));
  });
  it('a change of a setting ends the scenario’s lesson', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'wet-wood')).click();
    expect(root.textContent).toContain(sx('lesson', 'wet-wood'));
    const sliders = root.find('input');
    sliders[1]!.value = '3';
    sliders[1]!.dispatch('input');
    run(panel, sim, 0.2);
    expect(root.textContent).not.toContain(sx('lesson', 'wet-wood'));
  });
  it('the thermal view is a view: its button flips the switch and leaves the scenario’s lesson', () => {
    const { root, sim } = open('en');
    button(root, sx('scenario', 'wet-wood')).click();
    const preset = sim.params.preset;
    expect(sim.params.thermalView).toBe(false);
    button(root, st('thermalLabel')).click();
    expect(sim.params.thermalView).toBe(true);
    expect(sim.params.preset).toBe(preset);
    expect(root.textContent).toContain(sx('lesson', 'wet-wood'));
    button(root, st('thermalLabel')).click();
    expect(sim.params.thermalView).toBe(false);
  });
  it('reset comes back to the start', () => {
    const { root, sim, panel } = open('en');
    run(panel, sim, 1);
    const hour = sim.state.hour;
    root
      .find('button')
      .find((b) => b.getAttribute('aria-label') === st('resetSim'))!
      .click();
    expect(sim.state.hour).toBeLessThan(hour);
    expect(sim.state.hour).toBeCloseTo(6, 1);
  });
  it('light a fire, close the lid, the controls follow', () => {
    const { root, sim, panel } = open('en');
    sim.set({ timeScale: 60 });
    button(root, st('lightFire')).click();
    run(panel, sim, 5);
    expect(sim.state.burning).toBe(1);
    button(root, st('closeLid')).click();
    expect(sim.params.feedCover).toBe(1);
    button(root, st('openLid')).click();
    expect(sim.params.feedCover).toBeLessThan(1);
  });
  it('the hour slider moves the machine and the status', () => {
    const { root, sim, panel } = open('en');
    const hour = root.find('input')[0]!;
    hour.value = '8.5';
    hour.dispatch('input');
    expect(sim.state.hour).toBeCloseTo(8.5, 2);
    run(panel, sim, 0.3);
    expect(sim.state.burning).toBe(1);
    expect(root.textContent).not.toContain(st('statusOut'));
  });
  it('a scripted change moves the controls by itself', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'extract-fan')).click();
    run(panel, sim, 5);
    expect(sim.params.fanPa).toBe(10);
    const fan = root.find('input').find((i) => i.value === '10');
    expect(fan).toBeDefined();
  });
  it('every preset and scenario renders, in both languages, with no broken number', () => {
    for (const lang of ['fr', 'en'] as const) {
      const { root, sim, panel } = open(lang);
      for (const id of SCENARIO_IDS) {
        button(root, sx('scenario', id)).click();
        run(panel, sim, 0.4);
        expect(root.textContent, id).not.toMatch(/NaN|undefined|Infinity/);
      }
      for (const id of PRESET_IDS) {
        sim.applyPreset(id);
        panel.render();
        run(panel, sim, 0.4);
        expect(root.textContent, id).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });
});

describe('what the panel’s model says', () => {
  const d = settledDay(presetParams('j-tube'));
  it('the budget sums to the wood, each with its colour', () => {
    const rows = budgetSegments(d);
    expect(rows.reduce((a, r) => a + r.share, 0)).toBeCloseTo(1, 2);
    for (const r of rows) expect(r.colour).toMatch(/^#/);
  });
  it('the charts have as many points as hours', () => {
    const a = dayChartData(d);
    expect(a.xs.length).toBe(97);
    expect(a.seatHot.length).toBe(97);
    expect(a.xs[96]).toBe(24);
    const w = powerChartData(d);
    expect(Math.max(...w.fire)).toBeGreaterThan(9);
    expect(hotChartData(d).chamber.length).toBe(97);
  });
  it('the path and the section read the state', () => {
    const sim = new MassHeaterSim();
    sim.set({ hour: 20 });
    const p = pathChartData(sim.state);
    expect(p.xs.length).toBe(p.pressure.length);
    for (let i = 1; i < p.xs.length; i++) expect(p.xs[i]!).toBeGreaterThanOrEqual(p.xs[i - 1]!);
    const s = sectionChartData(sim.state);
    expect(s.hot.xs[0]).toBe(0);
    expect(s.hot.ys[0]!).toBeGreaterThan(s.hot.ys[s.hot.ys.length - 1]!);
    expect(s.hot.xs[s.hot.xs.length - 1]!).toBeGreaterThan(s.cold.xs[s.cold.xs.length - 1]!);
  });
  it('every figure has a tag in the data', () => {
    const sim = new MassHeaterSim();
    for (const r of [
      ...mainReadouts(sim.state),
      ...moreReadouts(sim.state, 3000),
      ...dayReadouts(d),
      ...claimReadouts(sim.getClaim()),
    ]) {
      expect(['†', '*', ''], r.key).toContain(r.tag);
      expect(Number.isFinite(r.value), r.key).toBe(true);
    }
  });
  it('the status: out, burning, smoke, the damper first', () => {
    const sim = new MassHeaterSim();
    expect(statusOf(sim.state, sim.params)).toEqual({ key: 'statusOut', tone: 'note' });
    sim.set({ hour: 8.5 });
    expect(statusOf(sim.state, sim.params).key).toBe('statusBurningLean');
    sim.set({ feedKgH: 5, sessionHours: 2 });
    sim.set({ hour: 9 });
    expect(statusOf(sim.state, sim.params).key).toBe('statusBurningHot');
    sim.applyScenario('cold-start');
    expect(statusOf(sim.state, sim.params)).toEqual({ key: 'statusColdFlue', tone: 'warn' });
    sim.set({ damperClosed: true });
    expect(statusOf(sim.state, sim.params)).toEqual({ key: 'statusDamper', tone: 'warn' });
  });
  it('the round top of a chart', () => {
    expect(niceCeil3(100)).toBe(150);
    expect(niceCeil3(25)).toBe(30);
    expect(niceCeil3(-1)).toBe(3);
  });
});

describe('the strip', () => {
  it('six values, the hour and the phase, the alarms in words', () => {
    const sim = new MassHeaterSim();
    setLang('en');
    expect(stripValues(sim)).toHaveLength(6);
    const clock = stripClock(sim);
    expect(clock.time).toMatch(/^\d\d:\d\d$/);
    expect(clock.sub).toBe(sx('phase', sim.state.phase));
    sim.applyScenario('cold-start');
    for (let i = 0; i < 30 * 8; i++) sim.step(1 / 30);
    const alarms = stripAlarms(sim);
    expect(alarms.map((a) => a.key)).toContain('smokeBack');
    expect(alarms[0]!.label).toBe(sx('alarm', alarms[0]!.key));
    expect(STRIP_SPEEDS.length).toBeGreaterThan(2);
  });
});
