import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  select as kitSelect,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import type { MassHeaterSim } from '../sim/engine';
import type { BenchFill, RiserInsulationId } from '../sim/machine';
import { PRESET_IDS, RANGES, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import type { DayResult, WoodAnswer } from '../sim/runs';
import type { HeaterParams, HeaterState, PresetId, ScenarioId } from '../sim/types';
import {
  budgetSegments,
  claimReadouts,
  dayChartData,
  dayReadouts,
  GOLD,
  hotChartData,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  pathChartData,
  powerChartData,
  sectionChartData,
  statusOf,
  type Readout,
  roomCoText,
} from './model';
import { num, st, sx, type PanelKey } from './strings';

// Simulation mode: starting points and scenarios, the hour, the live figures, then the day: the bench charging and giving back, where the wood went, the pressure along the path, the claims
// put to the sums. Everything else is folded. Built only from the kit's widgets and charts.

type ChartOpts = ConstructorParameters<typeof LineChart>[0];

/** Real seconds the settings must stay unchanged before the runs behind the charts start again. */
const QUIET = 0.35;

interface Control {
  key: keyof HeaterParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle' | 'select';
  fmt?: (v: number) => string;
}

/** The carbon monoxide in the room: words while there is no leak, then the band, never a bare figure (`roomCoText`). */
const roomCoValue = (s: HeaterState): HTMLElement => {
  const c = roomCoText(s);
  if (c.noLeak) return h('b', {}, h('small', {}, st('coNoLeak')));
  const digits = c.high < 10 ? 1 : 0;
  return h('b', {}, `${num(c.low, digits)} – ${num(c.high, digits)}`, h('small', {}, ' ppm †'));
};

const hourText = (v: number): string => {
  const hh = Math.floor(v) % 24;
  const mm = Math.round((v - Math.floor(v)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private lesson = h('div', {});
  private status = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private coBox = h('div', { class: 'loss-legend' });
  private dayBox = h('div', { class: 'loss-legend' });
  private neededBox = h('div', { class: 'loss-legend' });
  private budget = h('div', { class: 'losses' });
  private claimBox = h('div', { class: 'loss-legend' });
  private more = h('div', { class: 'loss-legend' });
  private draftBox = h('div', { class: 'loss-legend' });
  private computing = h('p', { class: 'hint' });
  private controls: Control[] = [];
  /** The switch of the 3D worlds' thermal view: a view, not a setting, so the scenario's lesson stays. */
  private thermalButton = h('button', {
    class: 'btn',
    onclick: () => {
      this.ctx.sim.set({ thermalView: !this.ctx.sim.params.thermalView });
      this.syncThermal();
    },
  });

  private benchChart: LineChart;
  private powerChart: LineChart;
  private hotChart: LineChart;
  private pathChart: LineChart;
  private gasChart: LineChart;
  private sectionChart: LineChart;
  private benchOpts: ChartOpts;
  private powerOpts: ChartOpts;
  private hotOpts: ChartOpts;
  private pathOpts: ChartOpts;
  private gasOpts: ChartOpts;
  private sectionOpts: ChartOpts;

  private lastReadouts = 0;
  private lastLive = 0;
  private key = '';
  private wait = 0;
  /** The long runs still to do, one a frame, so that none of them holds a frame back for long. */
  private jobs: (() => void)[] = [];
  private dayData: DayResult | null = null;
  private woodData: WoodAnswer | null = null;
  private scenario: ScenarioId | null = null;

  constructor(private ctx: AppContext<MassHeaterSim>) {
    const sim = () => this.ctx.sim;
    const hours = (v: number) => hourText(v);
    const nowMark = (): ReturnType<NonNullable<ChartOpts['markers']>> => [
      { x: sim().state.hour, label: st('markNow') },
    ];
    this.benchOpts = {
      height: 170,
      series: [
        { key: 'seatHot', label: () => st('seriesSeatHot'), color: SERIES_COLORS.dump, bold: true },
        { key: 'seatCold', label: () => st('seriesSeatCold'), color: GOLD },
        { key: 'room', label: () => st('seriesRoom'), color: SERIES_COLORS.load, bold: true },
        { key: 'outside', label: () => st('seriesOutside'), color: SERIES_COLORS.hydro, dash: true },
      ],
      yFmt: (v) => num(v),
      xFmt: hours,
      markers: nowMark,
    };
    this.benchChart = new LineChart(this.benchOpts);
    this.powerOpts = {
      height: 130,
      series: [
        { key: 'fire', label: () => st('seriesFire'), color: SERIES_COLORS.dump, dash: true },
        { key: 'drum', label: () => st('seriesDrum'), color: GOLD, bold: true },
        { key: 'bench', label: () => st('seriesBench'), color: SERIES_COLORS.load, bold: true },
      ],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: hours,
      markers: nowMark,
    };
    this.powerChart = new LineChart(this.powerOpts);
    this.hotOpts = {
      height: 120,
      series: [
        { key: 'chamber', label: () => st('seriesChamber'), color: SERIES_COLORS.dump, bold: true },
        { key: 'drum', label: () => st('seriesDrum'), color: GOLD },
        { key: 'exhaust', label: () => st('seriesExhaust'), color: SERIES_COLORS.hydro },
      ],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: hours,
      markers: nowMark,
    };
    this.hotChart = new LineChart(this.hotOpts);
    this.pathOpts = {
      height: 120,
      series: [{ key: 'pressure', label: () => st('seriesPressure'), color: SERIES_COLORS.dump, bold: true }],
      yFmt: (v) => num(v),
      xFmt: (v) => `${num(v, 1)} m`,
    };
    this.pathChart = new LineChart(this.pathOpts);
    this.gasOpts = {
      height: 110,
      series: [{ key: 'gas', label: () => st('seriesGas'), color: GOLD, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: (v) => `${num(v, 1)} m`,
    };
    this.gasChart = new LineChart(this.gasOpts);
    this.sectionOpts = {
      height: 120,
      series: [
        { key: 'hot', label: () => st('seriesHotEnd'), color: SERIES_COLORS.dump, bold: true },
        { key: 'cold', label: () => st('seriesColdEnd'), color: SERIES_COLORS.hydro },
      ],
      yFmt: (v) => num(v),
      xFmt: (v) => `${num(v * 100)} cm`,
    };
    this.sectionChart = new LineChart(this.sectionOpts);
  }

  private syncThermal(): void {
    const on = this.ctx.sim.params.thermalView;
    this.thermalButton.className = on ? 'btn btn--primary' : 'btn';
    this.thermalButton.textContent = st('thermalLabel');
    this.thermalButton.setAttribute('aria-pressed', String(on));
  }

  /** Apply a change live; the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<HeaterParams>): void {
    this.ctx.sim.set(patch);
    this.scenario = null;
    this.renderLesson();
    this.renderStatus();
    this.renderReadouts();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    this.syncThermal();
    this.controls = [];

    const presetSelect = h(
      'select',
      {
        'aria-label': st('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.scenario = null;
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, sx('preset', id))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, st('custom')),
    );
    this.presetSelect = presetSelect;

    const track = (key: keyof HeaterParams, el: HTMLElement, kind: Control['kind'], fmt?: (v: number) => string) => {
      this.controls.push({ key, el, kind, fmt });
      return el;
    };
    const slider = (key: PanelKey, field: RangedKey, fmt: (v: number) => string) => {
      const r = RANGES[field];
      return track(
        field,
        kitSlider(st(key), p[field] as number, r.min, r.max, r.step, fmt, (v) =>
          this.set({ [field]: v } as Partial<HeaterParams>),
        ),
        'slider',
        fmt,
      );
    };
    const toggle = (key: PanelKey, field: 'lidAfterFire' | 'flueInsulated' | 'damperClosed') =>
      track(
        field,
        kitToggle(st(key), p[field], (v) => this.set({ [field]: v } as Partial<HeaterParams>)),
        'toggle',
      );
    const pick = <T extends string>(key: PanelKey, field: keyof HeaterParams, options: [T, string][]) =>
      track(
        field,
        kitSelect<T>(st(key), p[field] as unknown as T, options, (v) =>
          this.set({ [field]: v } as Partial<HeaterParams>),
        ),
        'select',
      );
    const hint = (key: PanelKey) => h('p', { class: 'hint' }, st(key));
    const folded = (title: string, ...children: (HTMLElement | null)[]) => {
      const d = kitSection(title, ...children) as HTMLDetailsElement;
      d.open = false;
      return d;
    };
    const chip = (key: PanelKey, on: () => void) => h('button', { class: 'part-chip', onclick: on }, st(key));
    const hourSlider = track(
      'hour',
      kitSlider(st('hourLabel'), p.hour, 0, 24, 0.25, hourText, (v) => this.ctx.sim.set({ hour: v })),
      'slider',
      hourText,
    );

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, st('simTitle2')),
      hint('simIntro'),
      hint('tagLegend'),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': st('resetSim'),
            title: st('resetSim'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      h('div', { class: 'eyebrow' }, st('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id) =>
          h(
            'button',
            {
              class: 'part-chip',
              onclick: () => {
                sim.applyScenario(id);
                this.scenario = id;
                this.render();
              },
            },
            sx('scenario', id),
          ),
        ),
      ),
      this.lesson,
      hourSlider,
      hint('hourHint'),
      this.thermalButton,
      hint('thermalHint'),
      h(
        'div',
        { class: 'part-chips' },
        chip('lightFire', () => sim.lightFire()),
        chip('addLoad', () => sim.addLoad()),
        chip('closeLid', () => (sim.closeLid(), this.followScript())),
        chip('openLid', () => (sim.openLid(), this.followScript())),
      ),
      this.status,
      this.readouts,
      h('div', { class: 'eyebrow' }, st('chartBench')),
      this.benchChart.el,
      hint('chartBenchHint'),
      h('div', { class: 'eyebrow' }, st('chartSection')),
      this.sectionChart.el,
      hint('chartSectionHint'),
      h('div', { class: 'eyebrow' }, st('chartPower')),
      this.powerChart.el,
      hint('chartPowerHint'),
      h('div', { class: 'eyebrow' }, st('budgetTitle')),
      this.budget,
      this.dayBox,
      this.neededBox,
      hint('budgetHint'),
      h('div', { class: 'eyebrow' }, st('claimTitle')),
      hint('claimIntro'),
      slider('oldStove', 'oldStoveEta', (v) => `${num(100 * v)} %`),
      this.claimBox,
      hint('claimHint'),
      h('div', { class: 'eyebrow' }, st('coTitle')),
      this.coBox,
      hint('coHint'),
      hint('safetyNote'),
      folded(
        st('secFire'),
        slider('firesPerDay', 'firesPerDay', (v) => num(v)),
        slider('morningHour', 'morningHour', hourText),
        slider('eveningHour', 'eveningHour', hourText),
        slider('sessionHours', 'sessionHours', (v) => `${num(v, 2)} h`),
        slider('feedKgH', 'feedKgH', (v) => `${num(v, 1)} kg/h`),
        slider('loadKg', 'loadKg', (v) => `${num(v, 1)} kg`),
        slider('burnMinutes', 'burnMinutes', (v) => `${num(v)} min`),
        slider('moisture', 'moisture', (v) => `${num(v)} %`),
        slider('feedCover', 'feedCover', (v) => `${num(100 * v)} % *`),
        slider('packing', 'packing', (v) => `${num(100 * v)} % *`),
        toggle('lidAfterFire', 'lidAfterFire'),
        hint('fireHint'),
      ),
      folded(
        st('secMachine'),
        hint('machineHint'),
        slider('riserHeight', 'riserHeight', (v) => `${num(v, 2)} m`),
        slider('topGap', 'topGap', (v) => `${num(100 * v, 1)} cm`),
        pick<RiserInsulationId>('riserInsulation', 'riserInsulation', [
          ['firebrick', st('insFirebrick')],
          ['fibre', st('insFibre')],
          ['perlite', st('insPerlite')],
        ]),
        slider('ductLength', 'ductLength', (v) => `${num(v, 1)} m`),
        slider('chimneyTop', 'chimneyTop', (v) => `${num(v, 1)} m *`),
        toggle('flueInsulated', 'flueInsulated'),
        slider('ductFilm', 'ductFilm', (v) => `× ${num(v, 2)} *`),
        hint('ductFilmHint'),
        pick<BenchFill>('benchFill', 'benchFill', [
          ['cob', st('fillCob')],
          ['pebble', st('fillPebble')],
        ]),
        slider('benchK', 'benchK', (v) => `${num(v, 2)} W/m·K`),
      ),
      folded(
        st('secHouse'),
        slider('houseH', 'houseH', (v) => `${num(v)} W/K *`),
        slider('gains', 'gains', (v) => `${num(v)} W *`),
        slider('outsideMean', 'outsideMean', (v) => `${num(v, 1)} °C`),
        slider('outsideSwing', 'outsideSwing', (v) => `${num(v, 1)} K *`),
        hint('houseHint'),
      ),
      folded(
        st('secFaults'),
        slider('fanPa', 'fanPa', (v) => `${num(v, 1)} Pa`),
        toggle('damperClosed', 'damperClosed'),
        slider('leakCm2', 'leakCm2', (v) => `${num(v, 1)} cm² *`),
        hint('faultHint'),
      ),
      folded(
        st('secFigures'),
        this.more,
        h('div', { class: 'eyebrow' }, st('chartHot')),
        this.hotChart.el,
        h('div', { class: 'eyebrow' }, st('chartPath')),
        this.pathChart.el,
        this.draftBox,
        hint('chartPathHint'),
        h('div', { class: 'eyebrow' }, st('chartGas')),
        this.gasChart.el,
      ),
      this.computing,
    );
    this.key = this.runKey();
    this.wait = 0;
    this.woodData = null;
    this.jobs = this.makeJobs();
    this.renderLesson();
    this.refresh();
  }

  /** Called every frame while the panel is open: figures at 5 Hz, the live charts at 2 Hz, one long run at a time. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastLive += dt;
    this.schedule(dt);
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastLive > 0.5) {
      this.lastLive = 0;
      this.drawLive();
    }
  }

  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.drawLive();
    this.drawDay();
  }

  // ------------------------------------------------------------------ the long runs

  /** Everything the runs depend on. */
  private runKey(): string {
    const {
      slowMo: _a,
      timeScale: _b,
      running: _c,
      preset: _d,
      hour: _e,
      thermalView: _f,
      ...rest
    } = this.ctx.sim.params;
    return JSON.stringify(rest);
  }

  private schedule(dt: number): void {
    const key = this.runKey();
    if (key !== this.key) {
      this.key = key;
      this.wait = QUIET;
      this.jobs = [];
    } else if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) this.jobs = this.makeJobs();
    }
    const job = this.jobs.shift();
    if (!job) {
      this.computing.textContent = this.wait > 0 ? st('computing') : '';
      return;
    }
    this.computing.textContent = st('computing');
    job();
  }

  private makeJobs(): (() => void)[] {
    const sim = this.ctx.sim;
    return [
      () => {
        this.dayData = sim.getDay();
        this.drawDay();
      },
      () => this.renderClaim(),
      () => {
        const step = sim.woodStepper(20);
        const advance = () => {
          const answer = step();
          if (answer) {
            this.woodData = answer;
            this.renderNeeded();
          } else this.jobs.unshift(advance);
        };
        advance();
      },
    ];
  }

  // ------------------------------------------------------------------ figures

  private renderLesson(): void {
    if (this.scenario)
      fill(this.lesson, h('div', { class: 'callout callout--tip' }, h('span', {}, sx('lesson', this.scenario))));
    else fill(this.lesson, h('p', { class: 'hint' }, st('scenarioHint')));
  }

  private renderStatus(): void {
    const sim = this.ctx.sim;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    const { key, tone } = statusOf(sim.state, sim.params);
    fill(
      this.status,
      tone === 'warn'
        ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, st(key)))
        : h('p', { class: 'hint' }, st(key)),
    );
  }

  private line(r: Readout): HTMLElement {
    return h(
      'span',
      {},
      `${st(r.key)} `,
      h('b', {}, num(r.value, r.digits)),
      h('small', {}, ` ${r.unit}${r.tag ? ` ${r.tag}` : ''}`),
    );
  }

  private renderReadouts(): void {
    const sim = this.ctx.sim;
    const s = sim.state;
    fill(
      this.readouts,
      h('div', { class: 'readout' }, h('span', {}, st('livePhase')), h('b', {}, sx('phase', s.phase))),
      ...mainReadouts(s).map((r) =>
        h(
          'div',
          { class: 'readout' },
          h('span', {}, st(r.key)),
          h('b', {}, num(r.value, r.digits), h('small', {}, ` ${r.unit}${r.tag ? ` ${r.tag}` : ''}`)),
        ),
      ),
      h('div', { class: 'readout' }, h('span', {}, st('liveRoomCo')), roomCoValue(s)),
    );
    fill(this.more, ...moreReadouts(s, sim.benchMass).map((r) => this.line(r)));
    fill(
      this.coBox,
      h('span', {}, `${st('coRegime')} `, h('b', {}, sx('regime', s.regime))),
      h(
        'span',
        {},
        `${st('coFlue')} `,
        h('b', {}, `${num(s.flueCoLow)} – ${num(s.flueCoHigh)}`),
        h('small', {}, ' ppm †'),
      ),
      h('span', {}, `${st('coRoom')} `, roomCoValue(s)),
      h('span', {}, `${st('coIntoRoom')} `, h('b', {}, num(100 * s.coIntoRoom)), h('small', {}, ' % †')),
      h('span', {}, `${st('coLid')} `, h('b', {}, num(s.lidPressure, 1)), h('small', {}, ' Pa †')),
    );
    fill(
      this.draftBox,
      h('span', {}, `${st('draftRiser')} `, h('b', {}, num(s.draftRiser + s.draftDrum, 1)), h('small', {}, ' Pa †')),
      h('span', {}, `${st('draftChimney')} `, h('b', {}, num(s.draftChimney, 1)), h('small', {}, ' Pa †')),
    );
  }

  private renderBudget(d: DayResult): void {
    const rows = budgetSegments(d);
    fill(
      this.budget,
      h(
        'div',
        { class: 'loss-bar', role: 'img', 'aria-label': st('budgetTitle') },
        ...rows.map((r) =>
          h('span', { style: `flex:${Math.max(r.share, 0.001)};background:${r.colour}`, title: st(r.key) }),
        ),
      ),
      h(
        'div',
        { class: 'loss-legend' },
        ...rows.map((r) =>
          h(
            'span',
            {},
            h('i', { style: `background:${r.colour}` }),
            `${st(r.key)} `,
            h('b', {}, `${num(100 * r.share)} %`),
            h('small', {}, ' †'),
          ),
        ),
      ),
    );
    const s = d.summary;
    fill(
      this.dayBox,
      ...dayReadouts(d).map((r) => this.line(r)),
      h(
        'span',
        {},
        `${st('effSwing')} `,
        h('b', {}, `${num(s.roomMin, 1)} – ${num(s.roomMax, 1)}`),
        h('small', {}, ' °C †'),
      ),
      h('span', {}, `${st('effPeak')} `, h('b', {}, num(s.lagHot, 1)), h('small', {}, ` ${st('effPeakUnit')} †`)),
    );
  }

  private renderNeeded(): void {
    const w = this.woodData;
    fill(
      this.neededBox,
      w
        ? h(
            'span',
            {},
            `${st('effNeeded')} (20 °C) `,
            h('b', {}, w.reached ? num(w.kg, 1) : `> ${num(w.kg)}`),
            h('small', {}, ' kg †'),
          )
        : null,
    );
  }

  private renderClaim(): void {
    fill(this.claimBox, ...claimReadouts(this.ctx.sim.getClaim()).map((r) => this.line(r)));
  }

  /** A scenario can move a slider or flip a switch by itself: the controls follow. */
  private followScript(): void {
    const p = this.ctx.sim.params;
    for (const c of this.controls) {
      const value = p[c.key];
      if (c.kind === 'select') {
        const sel = c.el.querySelector('select') as HTMLSelectElement | null;
        if (sel && sel.value !== String(value)) sel.value = String(value);
        continue;
      }
      const input = c.el.querySelector('input') as HTMLInputElement | null;
      if (!input) continue;
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number') {
        const step = Number(input.step) || 1e-9;
        const snapped = Math.round(value / step) * step;
        if (Math.abs(Number(input.value) - snapped) > 1e-9) input.value = String(snapped);
        const out = c.el.querySelector('output');
        if (out && c.fmt) out.textContent = c.fmt(snapped);
      }
    }
  }

  // ------------------------------------------------------------------ charts

  private drawLive(): void {
    const sim = this.ctx.sim;
    const s = sim.state;
    const path = pathChartData(s);
    const lo = Math.min(...path.pressure);
    const hi = Math.max(...path.pressure);
    this.pathOpts.yMin = -niceCeil3(Math.max(1, -lo) * 1.05);
    this.pathOpts.yMax = hi > 1 ? niceCeil3(hi * 1.05) : 1;
    this.pathChart.setData(path.xs, { pressure: path.pressure });
    this.pathChart.draw();
    this.gasOpts.yMax = niceCeil3(Math.max(100, ...path.gas) * 1.05);
    this.gasChart.setData(path.xs, { gas: path.gas });
    this.gasChart.draw();
    const sec = sectionChartData(s);
    // the two ends do not share their cells: both on the hot end's points, the cold end read across
    const ys = sec.hot.xs.map((x) => {
      const c = sec.cold;
      let i = 0;
      while (i < c.xs.length - 2 && x > c.xs[i + 1]!) i++;
      const u = Math.max(0, Math.min(1, (x - c.xs[i]!) / (c.xs[i + 1]! - c.xs[i]!)));
      return c.ys[i]! + (c.ys[i + 1]! - c.ys[i]!) * u;
    });
    const all = [...sec.hot.ys.slice(1), ...ys.slice(1)];
    this.sectionOpts.yMin = Math.floor(Math.min(...all) / 5) * 5;
    this.sectionOpts.yMax = Math.ceil(Math.max(...all, this.sectionOpts.yMin + 10) / 5) * 5;
    this.sectionChart.setData(sec.hot.xs.slice(1), { hot: sec.hot.ys.slice(1), cold: ys.slice(1) });
    this.sectionChart.draw();
    this.benchChart.draw();
    this.powerChart.draw();
    this.hotChart.draw();
  }

  private drawDay(): void {
    const d = this.dayData;
    if (!d) return;
    const a = dayChartData(d);
    const lo = Math.min(...a.outside, ...a.room);
    const hi = Math.max(...a.seatHot, ...a.seatCold, ...a.room);
    this.benchOpts.yMin = Math.floor(lo / 5) * 5;
    this.benchOpts.yMax = Math.ceil(hi / 5) * 5;
    this.benchChart.setData(a.xs, { seatHot: a.seatHot, seatCold: a.seatCold, room: a.room, outside: a.outside });
    this.benchChart.draw();
    const w = powerChartData(d);
    this.powerOpts.yMax = niceCeil3(Math.max(1, ...w.fire, ...w.drum, ...w.bench) * 1.05);
    this.powerChart.setData(w.xs, { fire: w.fire, drum: w.drum, bench: w.bench });
    this.powerChart.draw();
    const t = hotChartData(d);
    this.hotOpts.yMax = niceCeil3(Math.max(100, ...t.chamber, ...t.drum) * 1.05);
    this.hotChart.setData(t.xs, { chamber: t.chamber, drum: t.drum, exhaust: t.exhaust });
    this.hotChart.draw();
    this.renderBudget(d);
  }
}
