import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GHOST } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import { PART_CATEGORIES, type WorldId } from '../data/ids';
import { PARTS } from '../data/parts';
import { THERMAL_RAMP } from '../sim/machine';
import { SCENARIO_IDS } from '../sim/presets';
import { MassHeaterSim } from '../sim/engine';
import type { HeaterState } from '../sim/types';
import { createBenchSectionScene } from './benchsection/scene';
import { createFireCoreScene } from './firecore/scene';
import { createHomesteadScene } from './homestead/scene';
import { createLivingRoomScene } from './livingroom/scene';
import { drawStats, finiteTree, floating, isolateOne, meshBox, sceneBoxes, stateWith, view } from './test-utils';

// What every world owes the kit and the visitor: its frozen ids, a label for each part that lives in the scene, nothing floating, the explode, isolate and X-ray of every part, an animation with no NaN through all the scenarios, its budget, no text anywhere.

const BUDGET: Record<WorldId, { calls: number; triangles: number }> = {
  homestead: { calls: 85, triangles: 320_000 },
  'living-room': { calls: 175, triangles: 180_000 },
  'fire-core': { calls: 160, triangles: 170_000 },
  'bench-section': { calls: 110, triangles: 60_000 },
};

/** The first build of each world, in Node on this machine (the maps are shared: the first world pays for most of them). */
const timed = <T>(id: string, make: () => T): T => {
  const t0 = performance.now();
  const out = make();
  // eslint-disable-next-line no-console
  console.info(`[build] ${id}: ${Math.round(performance.now() - t0)} ms`);
  return out;
};

const worlds: [WorldId, SceneModule<HeaterState>][] = [
  ['homestead', timed('homestead', () => createHomesteadScene())],
  ['living-room', timed('living-room', () => createLivingRoomScene())],
  ['fire-core', timed('fire-core', () => createFireCoreScene())],
  ['bench-section', timed('bench-section', () => createBenchSectionScene())],
];

for (const [id, mod] of worlds) {
  describe(`world ${id}`, () => {
    const reg = mod.registry;
    const go = (over: Partial<HeaterState> = {}, v = {}, frames = 2) => {
      const s = stateWith(over);
      for (let i = 0; i < frames; i++) mod.update(s, 1 / 60, view({ time: 1 + i, ...v }));
      mod.scene.updateMatrixWorld(true);
      return s;
    };

    it('registers exactly the frozen ids (research §4), each with meshes of its own', () => {
      go();
      const expected = Object.keys(PART_CATEGORIES[id]);
      expect([...reg.ids()].sort()).toEqual([...expected].sort());
      for (const pid of expected) expect(reg.get(pid)!.meshes.length, pid).toBeGreaterThan(0);
    });

    it('has a sheet in the catalogue for each part, in this world', () => {
      for (const pid of reg.ids()) {
        const p = PARTS.find((x) => x.id === pid);
        expect(p, pid).toBeDefined();
        expect(p!.scene, pid).toBe(id);
      }
    });

    it('has a label per part, anchors in the scene, at most six main labels', () => {
      for (const pid of reg.ids())
        expect(
          mod.hotspots.some((h) => h.partId === pid),
          `label of ${pid}`,
        ).toBe(true);
      for (const h of mod.hotspots) {
        let o: THREE.Object3D | null = h.anchor;
        while (o && o !== mod.scene) o = o.parent;
        expect(o, h.partId).toBe(mod.scene);
        expect(h.label.fr.length).toBeGreaterThan(1);
        expect(h.label.en.length).toBeGreaterThan(1);
        expect(reg.get(h.partId), h.partId).toBeDefined();
      }
      expect(mod.hotspots.filter((h) => !h.minor).length).toBeLessThanOrEqual(6);
    });

    it('has a home camera outside the machine, within its limits', () => {
      const d = mod.home.position.distanceTo(mod.home.target);
      expect(d).toBeGreaterThan(mod.minDistance);
      expect(d).toBeLessThan(mod.maxDistance);
    });

    it('has no floating part: every part touches another or what carries it', () => {
      go();
      reg.setAllFactors(0);
      const supports: THREE.Box3[] = [];
      const carrier = (mod as unknown as { scenery?: () => THREE.Object3D[] }).scenery;
      if (carrier) for (const o of carrier()) supports.push(meshBox(o));
      supports.push(new THREE.Box3(new THREE.Vector3(-4000, -0.006, -4000), new THREE.Vector3(4000, 0.002, 4000)));
      expect(floating(sceneBoxes(mod), 0.02, supports)).toEqual([]);
    });

    it('explodes along sensible lines: every part moves by its own offset and comes back', () => {
      go();
      const before = new Map(reg.ids().map((pid) => [pid, reg.get(pid)!.object.position.clone()]));
      reg.setAllFactors(1);
      for (const pid of reg.ids()) {
        const e = reg.get(pid)!;
        expect(e.object.position.distanceTo(before.get(pid)!.clone().add(e.explode)), pid).toBeLessThan(1e-9);
      }
      go();
      expect(finiteTree(mod.scene)).toBe(true);
      reg.setAllFactors(0);
      go();
      for (const pid of reg.ids())
        expect(reg.get(pid)!.object.position.distanceTo(before.get(pid)!), pid).toBeLessThan(1e-9);
    });

    it('isolates and ghosts every part', () => {
      go();
      for (const pid of reg.ids()) {
        isolateOne(reg, pid, 'hidden');
        go();
        expect(
          reg
            .get(pid)!
            .meshes.every(
              (m) =>
                m.visible ||
                m.userData.cap ||
                m.name === 'casing-past-the-step' ||
                m.name === 'sticks-front' ||
                m.name === 'embers' ||
                m.userData.dynamic,
            ),
          `${pid} solid`,
        ).toBe(true);
        const others = reg.ids().filter((o) => o !== pid);
        for (const o of others) expect(reg.get(o)!.display).toBe('hidden');
        isolateOne(reg, pid, 'ghost');
        go();
        for (const o of others) {
          for (const m of reg.get(o)!.meshes) expect(m.material).toBe(GHOST);
        }
      }
      reg.setAllDisplay('solid');
      go();
      for (const pid of reg.ids())
        for (const m of reg.get(pid)!.meshes) expect(m.material).toBe(m.userData.solidMaterial);
    });

    it('animates with no NaN through every scenario of the simulation', () => {
      const sim = new MassHeaterSim();
      for (const name of SCENARIO_IDS) {
        sim.applyScenario(name);
        sim.set({ timeScale: 600 });
        for (let i = 0; i < 6; i++) {
          sim.step(1 / 10);
          mod.update(sim.state, 1 / 30, view({ time: i, schematic: i % 2 === 0, cutaway: i % 3 === 0 }));
        }
      }
      expect(finiteTree(mod.scene)).toBe(true);
    });

    it('accepts dt = 0 without moving anything', () => {
      const s = stateWith();
      mod.update(s, 1 / 60, view({ schematic: true }));
      mod.scene.updateMatrixWorld(true);
      const snap = () => {
        const out: number[] = [];
        mod.scene.traverse((o) => {
          out.push(o.matrixWorld.elements[12]!, o.matrixWorld.elements[13]!, o.matrixWorld.elements[14]!);
        });
        return out;
      };
      const a = snap();
      mod.update(s, 0, view({ schematic: true }));
      mod.scene.updateMatrixWorld(true);
      expect(snap()).toEqual(a);
    });

    it('keeps to its budget', () => {
      go();
      reg.setAllDisplay('solid');
      go();
      const st = drawStats(mod.scene);
      // eslint-disable-next-line no-console
      console.info(`[budget] ${id}: ${st.calls} calls, ${Math.round(st.triangles)} triangles`);
      expect(st.calls).toBeLessThan(BUDGET[id].calls);
      expect(st.triangles).toBeLessThan(BUDGET[id].triangles);
    });
  });
}

describe('the landscape', () => {
  it('asks for its far plane when it is drawn', () => {
    const mod = worlds[0]![1];
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 60);
    (mod.scene.onBeforeRender as unknown as (r: unknown, s: THREE.Scene, c: THREE.Camera) => void)(
      null,
      mod.scene,
      camera,
    );
    expect(camera.far).toBeGreaterThan(4000);
    expect(camera.near).toBe(0.1);
  });
});

describe('the rules of the source', () => {
  const src = Object.entries(
    import.meta.glob(['./**/*.ts', '!./**/*.test.ts', '!./test-utils.ts'], {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  );
  const code = (t: string) => t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  it('reads the whole of its source', () => {
    expect(src.length).toBeGreaterThan(20);
  });
  it('has no text in any texture and no canvas: a film is captured with no interface', () => {
    for (const [p, c] of src) {
      expect(c.includes('canvasTexture'), p).toBe(false);
      expect(c.includes('fillText'), p).toBe(false);
      expect(c.includes('createElement'), p).toBe(false);
    }
  });
  it('has no timer and no wall clock: the same inputs give the same picture', () => {
    for (const [p, c] of src) {
      const k = code(c);
      expect(/\bDate\.now\b|performance\.now|setTimeout|setInterval|Math\.random/.test(k), p).toBe(false);
    }
  });
  it('shows no closing damper: this machine has none', () => {
    for (const [p, c] of src) expect(/damper/i.test(code(c)), p).toBe(false);
  });
  it('takes the thermal ramp from the model', () => {
    expect(THERMAL_RAMP.length).toBeGreaterThan(3);
    const thermal = src.find(([p]) => p.endsWith('thermal.ts'))![1];
    expect(thermal.includes('THERMAL_RAMP')).toBe(true);
  });
});
