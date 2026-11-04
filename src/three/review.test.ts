import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { setLang, t } from '@onigam/lab-kit/i18n';
import type { SceneModule } from '@onigam/lab-kit/three';
// the sheet itself, as the visitor reads it: the kit does not export it, its path is the test's only tie to the kit's inside
import { renderPartPanel } from '../../node_modules/@onigam/lab-kit/dist/ui/panels/part.js';
import { PARTS } from '../data/parts';
import '../i18n/ui';
import { FakeElement, installFakeDom } from '../panels/test-dom';
import type { HeaterState } from '../sim/types';
import { BENCH_REFUSED, createBenchSectionScene } from './benchsection/scene';
import { FIRE_REFUSED, createFireCoreScene } from './firecore/scene';
import { createHomesteadScene } from './homestead/scene';
import { LIVING_REFUSED, createLivingRoomScene } from './livingroom/scene';
import { WORLD } from './index';
import { stateWith, view } from './test-utils';

// What the first independent review of 4 November found (docs/qa.md). What needs a real picture was measured in the browser, rendering each part with and without itself: this holds what can be held without one.

type Selected = { id: string | null };
const picked: Selected = { id: null };
const selected = (): string | null => picked.id;
const WORLDS: [keyof typeof WORLD, SceneModule<HeaterState>, ReadonlySet<string>][] = [
  ['homestead', createHomesteadScene(), new Set()],
  ['living-room', createLivingRoomScene({ selected }), LIVING_REFUSED],
  ['fire-core', createFireCoreScene({ selected }), FIRE_REFUSED],
  ['bench-section', createBenchSectionScene({ selected }), BENCH_REFUSED],
];
const s = stateWith();
for (const [, mod] of WORLDS) {
  mod.update(s, 1 / 60, view({ time: 1 }));
  mod.scene.updateMatrixWorld(true);
}

describe('a part reads from its own side, whatever the camera was doing (D1, D3, D9)', () => {
  it('every part of every world says where it is looked at from', () => {
    for (const [name, mod] of WORLDS)
      for (const id of mod.registry.ids()) expect(mod.registry.get(id)!.viewDir, `${name} ${id}`).toBeDefined();
  });
  it('a frame stands on its part: it touches the part’s own box', () => {
    for (const [name, mod] of WORLDS)
      for (const id of mod.registry.ids()) {
        const f = mod.registry.get(id)!.frame;
        if (f) expect(f.intersectsBox(mod.registry.bounds(id)), `${name} ${id}`).toBe(true);
      }
  });
  it('no click takes the camera further than the world’s home: the bench at 20 m is gone', () => {
    const FOV = (40 * Math.PI) / 180;
    const REACH: Record<string, number> = { homestead: 62, 'living-room': 11.5, 'fire-core': 4, 'bench-section': 4.6 };
    for (const [name, mod] of WORLDS) {
      const padding = WORLD[name].partPadding;
      for (const id of mod.registry.ids()) {
        const r = mod.registry.frameBounds(id).getBoundingSphere(new THREE.Sphere()).radius;
        expect((r * padding) / Math.sin(FOV / 2), `${name} ${id}`).toBeLessThan(REACH[name]!);
      }
    }
  });
  it('in the core every part is looked at from the side of the cut, so nothing stands behind the shield', () => {
    const core = WORLDS.find(([n]) => n === 'fire-core')![1];
    for (const id of core.registry.ids()) expect(core.registry.get(id)!.viewDir!.z, id).toBeGreaterThan(0.3);
  });
});

/** The sheet of a part, as the kit draws it, on its Specs tab. */
function specsOf(mod: SceneModule<HeaterState>, id: string): string {
  picked.id = id;
  const root = new FakeElement('div');
  const info = PARTS.find((p) => p.id === id)!;
  const ctx = {
    ui: { selected: id, scene: mod.id, isolate: false },
    partInfo: () => info,
    stage: { active: { registry: mod.registry } },
    def: { envelopeMark: '*', plans: { sheets: [] }, partLinks: {}, partActions: () => [] },
    narration: null,
    videoUrl: () => '',
  };
  renderPartPanel(ctx as never, root as never);
  const tabs = root.find('button').filter((b) => b.textContent === t('specs'));
  tabs[0]!.click();
  const text = root.textContent;
  picked.id = null;
  return text;
}

describe('the sheet prints no inner size of the core (D5)', () => {
  beforeAll(() => {
    installFakeDom();
    setLang('en');
  });
  it('the refused parts have no « Encombrement » row, the others keep theirs', () => {
    for (const [name, mod, refused] of WORLDS)
      for (const id of mod.registry.ids()) {
        const text = specsOf(mod, id);
        if (refused.has(id)) expect(text, `${name} ${id}`).not.toContain(t('dimensions'));
        else expect(text, `${name} ${id}`).toContain(t('dimensions'));
      }
  });
  it('none of the sizes the review read on the sheets is printed any more', () => {
    for (const [name, mod] of WORLDS)
      for (const id of mod.registry.ids()) {
        const text = specsOf(mod, id);
        expect(text, `${name} ${id}`).not.toMatch(/230 × 690|820 × 240|334 × 686|340 × 690|× 43 ×|330 × 202|622 × 160/);
        expect(text, `${name} ${id}`).not.toMatch(/2\.92 × 0\.27/);
      }
  });
  it('keeps the camera on the real box while the sheet is refused it', () => {
    const [, core] = WORLDS.find(([n]) => n === 'fire-core')!;
    picked.id = 'heat-riser';
    expect(core.registry.bounds('heat-riser').isEmpty()).toBe(true);
    expect(core.registry.frameBounds('heat-riser').isEmpty()).toBe(false);
    picked.id = null;
    expect(core.registry.bounds('heat-riser').isEmpty()).toBe(false);
  });
});

describe('the tools of the first screen (D10, D20) and the labels when all are on (D12)', () => {
  it('the house has no explode, and « Flux » draws dots a visitor can see, through the house and up the chimney', () => {
    expect(WORLD.homestead.explode).toBe(false);
    const home = createHomesteadScene() as unknown as {
      gas?: { points: THREE.Points };
      update: SceneModule<HeaterState>['update'];
    };
    home.update(s, 1 / 60, view({ schematic: true }));
    const points: THREE.Points[] = [];
    (home as unknown as { scene: THREE.Scene }).scene.traverse((o) => {
      if ((o as THREE.Points).isPoints && o.parent?.name === 'gas-flow') points.push(o as THREE.Points);
    });
    expect(points).toHaveLength(1);
    expect((points[0]!.material as THREE.PointsMaterial).size).toBeGreaterThanOrEqual(8);
    expect(points[0]!.geometry.drawRange.count).toBeGreaterThanOrEqual(100);
  });
  it('every world folds a name with no room when all the labels are on', () => {
    for (const [name, mod] of WORLDS) expect(mod.declutter, name).toBe(true);
  });
});
