import type { PartInfo } from '@onigam/lab-kit/content';
import { BENCH_SECTION_PARTS } from './parts/bench-section';
import { DIM_SPECS } from './parts/dim-specs';
import { FIRE_CORE_PARTS } from './parts/fire-core';
import { HOMESTEAD_PARTS } from './parts/homestead';
import { LIVING_ROOM_PARTS } from './parts/living-room';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the catalogue order of src/data/ids.ts (frozen from docs/research.md §4; data.test.ts checks that ids, worlds and categories agree with it):
// 11 in `homestead`, 18 in `living-room`, 14 in `fire-core`, 13 in `bench-section`. The overall sizes that are drawn are read from src/three/dims.ts in ./parts/dim-specs.ts and appended here, so that no length is typed twice.
export const PARTS: PartInfo[] = [
  ...HOMESTEAD_PARTS,
  ...LIVING_ROOM_PARTS,
  ...FIRE_CORE_PARTS,
  ...BENCH_SECTION_PARTS,
].map((p) => ({
  ...p,
  specs: [...p.specs, ...(DIM_SPECS[p.id] ?? [])],
}));
