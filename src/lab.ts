import { getLang, l, strL } from '@onigam/lab-kit/i18n';
import { h, type AppContext, type LabDefinition } from '@onigam/lab-kit/ui';
import { aboutPanel } from './data/about';
import { ASSEMBLY, INSTALL } from './data/guide';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { MAIN_VIDEO } from './data/sources';
import { PLAN_GROUPS, SHEETS } from './drawings';
import './i18n/ui';
import { SimPanel } from './panels/sim';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { MassHeaterSim } from './sim/engine';
import {
  WORLD,
  createBenchSectionScene,
  createFireCoreScene,
  createHomesteadScene,
  createLivingRoomScene,
} from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

const sim = new MassHeaterSim();
let stageOf: AppContext<MassHeaterSim> | null = null;
const THERMAL_PARTS = new Set([
  'cob-bench',
  'steel-drum',
  'bench-backrest',
  'inner-stone-wall',
  'cob-casing',
  'duct-hot-run',
  'duct-cold-run',
]);
const selected = (): string | null => stageOf?.ui.selected ?? null;

export const lab: LabDefinition<MassHeaterSim> = {
  id: 'mass-heater-lab',
  brand: { title: strL('labTitle'), tagline: strL('tagline') },
  // a part's envelope is the size of our generic drawing, not a size from a source: the notice on reading the figures says what the mark means
  envelopeMark: '*',
  sim,
  defaultScene: 'homestead',
  // proposed by the research (docs/research.md §0.2), the owner's answer to its question 7 pending
  video: { id: MAIN_VIDEO.id },
  parts: PARTS,
  scenes: [
    {
      id: 'homestead',
      label: strL('sceneHomestead'),
      module: createHomesteadScene({ params: () => sim.params }),
      ...WORLD.homestead,
      overview: {
        ...OVERVIEWS.homestead,
        actions: [
          { label: strL('goLivingRoom'), scene: 'living-room', primary: true },
          { label: strL('goFireCore'), scene: 'fire-core' },
        ],
      },
    },
    {
      id: 'living-room',
      label: strL('sceneLivingRoom'),
      module: createLivingRoomScene({ params: () => sim.params, selected }),
      ...WORLD['living-room'],
      overview: {
        ...OVERVIEWS['living-room'],
        actions: [
          { label: strL('goFireCore'), scene: 'fire-core', primary: true },
          { label: strL('goBenchSection'), scene: 'bench-section' },
          { label: strL('goHomestead'), scene: 'homestead' },
        ],
      },
    },
    {
      id: 'fire-core',
      label: strL('sceneFireCore'),
      module: createFireCoreScene({ params: () => sim.params, selected }),
      ...WORLD['fire-core'],
      overview: {
        ...OVERVIEWS['fire-core'],
        actions: [
          { label: strL('goBenchSection'), scene: 'bench-section', primary: true },
          { label: strL('goLivingRoom'), scene: 'living-room' },
        ],
      },
    },
    {
      id: 'bench-section',
      label: strL('sceneBenchSection'),
      module: createBenchSectionScene({ params: () => sim.params, selected }),
      ...WORLD['bench-section'],
      overview: {
        ...OVERVIEWS['bench-section'],
        actions: [
          { label: strL('goLivingRoom'), scene: 'living-room', primary: true },
          { label: strL('goFireCore'), scene: 'fire-core' },
        ],
      },
    },
  ],
  partLinks: {
    'house-shell': { scene: 'living-room', label: strL('goLivingRoom') },
    'steel-drum': { scene: 'fire-core', label: strL('goFireCore') },
    'cob-bench': { scene: 'bench-section', label: strL('goBenchSection') },
  },
  guides: {
    // how a mason raises it plays in the room, and each step names its own world; what must be true before the first fire plays around the house
    assembly: { scene: 'living-room', steps: ASSEMBLY },
    install: { scene: 'homestead', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: { sheets: SHEETS, groups: PLAN_GROUPS, intro: strL('plansIntro') },
  // spoken guide: audio and subtitles generated from narration/<lang>.json; until the audio exists the kit shows nothing of it
  narration: { manifest: 'audio/{lang}/manifest.json' },
  simPanel: (ctx: AppContext<MassHeaterSim>) => {
    stageOf = ctx;
    return new SimPanel(ctx);
  },
  // the sheets of what stores heat carry the switch of the thermal view: the second way to it, from Explore
  partActions: (ctx, info) =>
    THERMAL_PARTS.has(info.id)
      ? [
          h(
            'button',
            {
              class: `btn${ctx.sim.params.thermalView ? ' btn--primary' : ''}`,
              onclick: () => ctx.sim.set({ thermalView: !ctx.sim.params.thermalView }),
            },
            l('Vue thermique', 'Thermal view')[getLang()],
          ),
        ]
      : [],
  // a landscape keeps its camera above the land (the kit does it for a world called `site`: docs/kit-requests.md)
  onFrame: ({ activeScene }) => {
    if (activeScene === 'homestead' && stageOf) stageOf.stage.controls.maxPolarAngle = Math.PI * 0.48;
  },
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: aboutPanel,
};
