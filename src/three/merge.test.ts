import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { HeaterState } from '../sim/types';
import { createBenchSectionScene } from './benchsection/scene';
import { createFireCoreScene } from './firecore/scene';
import { createHomesteadScene } from './homestead/scene';
import { createLivingRoomScene } from './livingroom/scene';
import { MERGE, resetScope } from './merge';
import { drawStats, stateWith, view } from './test-utils';

// Merging the static meshes of a part into one per material must change the draw calls, not the picture: each world is built twice (merged and not), driven through the same state, and compared part by part: the same bounds and the same number of triangles. From Mill Lab.

function triangles(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.cap) return;
    const g = m.geometry;
    const c =
      g.drawRange.count === Infinity ? (g.index ? g.index.count : g.attributes.position.count) : g.drawRange.count;
    n += ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1) * (c / 3);
  });
  return n;
}

function compare(name: string, make: () => SceneModule<HeaterState>) {
  describe(`merge of ${name}`, () => {
    MERGE.enabled = false;
    const plain = make();
    MERGE.enabled = true;
    resetScope(name);
    const merged = make();
    const s = stateWith();
    for (const m of [plain, merged]) {
      m.update(s, 1 / 60, view({ time: 1 }));
      m.scene.updateMatrixWorld(true);
    }
    it('keeps every part where it was and every triangle', () => {
      for (const id of merged.registry.ids()) {
        const a = plain.registry.bounds(id);
        const b = merged.registry.bounds(id);
        expect(a.min.distanceTo(b.min), `${id} min`).toBeLessThan(1e-3);
        expect(a.max.distanceTo(b.max), `${id} max`).toBeLessThan(1e-3);
        expect(triangles(merged.registry.get(id)!.object), id).toBe(triangles(plain.registry.get(id)!.object));
      }
    });
    it('costs fewer draw calls', () => {
      expect(drawStats(merged.scene).calls).toBeLessThan(drawStats(plain.scene).calls);
    });
  });
}

compare('living-room', createLivingRoomScene);
compare('fire-core', createFireCoreScene);
compare('bench-section', createBenchSectionScene);
compare('homestead', createHomesteadScene);
