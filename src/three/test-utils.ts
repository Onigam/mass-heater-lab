import * as THREE from 'three';
import type { PartRegistry, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { MassHeaterSim } from '../sim/engine';
import type { HeaterParams, HeaterState } from '../sim/types';

// Helpers of the 3D tests: view options, simulation states, the real box of a part, draw statistics.

export const view = (patch: Partial<ViewOpts> = {}): ViewOpts => ({
  slowMo: 1,
  cutaway: false,
  schematic: false,
  time: 1,
  ...patch,
});

/** A state of the simulation at an hour of its settled day; `params` edits the simulation first, `over` overrides fields of the state. */
export function stateWith(
  over: Partial<HeaterState> = {},
  params: Partial<HeaterParams> = {},
  hour = 8.5,
): HeaterState {
  const sim = new MassHeaterSim();
  sim.set({ ...params, hour });
  sim.step(1 / 60);
  return { ...sim.state, ...over };
}

/** The box of every visible mesh under `root` flagged in by `keep`. Caps count only if shown. */
export function meshBox(root: THREE.Object3D, skip: (m: THREE.Mesh) => boolean = () => false): THREE.Box3 {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || skip(m) || m.userData.cap) return;
    let visible = true;
    for (let p: THREE.Object3D | null = m; p; p = p.parent) if (!p.visible) visible = false;
    if (!visible) return;
    tmp.setFromObject(m, true);
    box.union(tmp);
  });
  return box;
}

export const sceneBoxes = (mod: SceneModule<HeaterState>): Map<string, THREE.Box3> => {
  mod.scene.updateMatrixWorld(true);
  const out = new Map<string, THREE.Box3>();
  for (const id of mod.registry.ids()) out.set(id, meshBox(mod.registry.get(id)!.object));
  return out;
};

export const touches = (a: THREE.Box3, b: THREE.Box3, tol: number): boolean =>
  a.clone().expandByScalar(tol).intersectsBox(b);

/** Parts whose box touches no other part's box (nor any extra support box) within `tol`. */
export function floating(boxes: Map<string, THREE.Box3>, tol: number, supports: THREE.Box3[] = []): string[] {
  const bad: string[] = [];
  for (const [id, box] of boxes) {
    const other = [...boxes].some(([oid, ob]) => oid !== id && touches(box, ob, tol));
    if (!other && !supports.some((s) => touches(box, s, tol))) bad.push(id);
  }
  return bad;
}

/** True when every object of the tree has finite transforms and finite vertices. */
export function finiteTree(root: THREE.Object3D): boolean {
  let ok = true;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const v = [
      o.position.x,
      o.position.y,
      o.position.z,
      o.rotation.x,
      o.rotation.y,
      o.rotation.z,
      o.scale.x,
      o.scale.y,
      o.scale.z,
    ];
    if (!v.every(Number.isFinite)) ok = false;
    const m = (o as THREE.Mesh).geometry?.attributes?.position;
    if (m) for (let i = 0; i < m.array.length; i++) if (!Number.isFinite(m.array[i])) ok = false;
  });
  return ok;
}

export function isolateOne(reg: PartRegistry, id: string, mode: 'hidden' | 'ghost'): void {
  for (const other of reg.ids()) reg.setDisplay(other, other === id ? 'solid' : mode);
}

/** Draw calls (visible meshes, each instanced mesh once) and triangles (instances counted) of a scene, as the colour pass would issue them. */
export function drawStats(root: THREE.Object3D): { calls: number; triangles: number } {
  let calls = 0;
  let triangles = 0;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh && !(o as THREE.Points).isPoints) return;
    let visible = true;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) visible = false;
    if (!visible) return;
    const g = m.geometry;
    const n =
      (g.drawRange.count === Infinity ? (g.index ? g.index.count : g.attributes.position.count) : g.drawRange.count) /
      3;
    const ig = g as THREE.InstancedBufferGeometry;
    const inst = (m as THREE.InstancedMesh).isInstancedMesh
      ? (m as THREE.InstancedMesh).count
      : ig.isInstancedBufferGeometry
        ? ig.instanceCount
        : 1;
    calls++;
    if (m.isMesh) triangles += n * inst;
  });
  return { calls, triangles };
}

/** Every world built with its default options, once per test file. */
export function worldsOf<T>(make: () => T): () => T {
  let built: T | null = null;
  return () => (built ??= make());
}

// UV scale of every mesh that wears a map defined in metres (a `tiled(map, 1 / tile)`): the material pass drew its maps for UVs in metres, so a lathe, a cylinder or a cap whose UVs run 0..1 stretches the map by the ratio
// of its size to a metre (the riser's liner did, 4.2 times on average and 12 over 0.95 m2, and read as bark). This reads the Jacobian of (u, v) against the surface in metres, triangle by triangle, in the mesh's world scale:
// a mesh is true when both singular values are about 1. The stretch of a triangle is the larger of the largest value and the inverse of the smallest.

export interface UvReport {
  key: string;
  mesh: string;
  map: string;
  area: number;
  mean: number;
  max: number;
  p99: number;
  tris: number;
}

const SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'aoMap', 'emissiveMap'] as const;

/** The first texture of a material that is defined in metres (a repeat other than one tile per unit of UV). */
export function metricMap(m: THREE.Material): THREE.Texture | null {
  const r = m as unknown as Record<string, THREE.Texture | null | undefined>;
  for (const slot of SLOTS) {
    const t = r[slot];
    if (t && (t.repeat.x !== 1 || t.repeat.y !== 1)) return t;
  }
  return null;
}

/** Area-weighted mean and worst stretch of a mesh's UVs against its surface in metres, in the mesh's world scale. */
export function uvStretch(mesh: THREE.Mesh): { area: number; mean: number; max: number; p99: number; tris: number } {
  const g = mesh.geometry;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute | undefined;
  if (!uv) return { area: 0, mean: Infinity, max: Infinity, p99: Infinity, tris: 0 };
  const idx = g.index;
  const n = (idx ? idx.count : pos.count) / 3;
  mesh.updateWorldMatrix(true, false);
  const sc = new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  let area = 0;
  let sum = 0;
  let max = 1;
  const seen: [number, number][] = [];
  for (let t = 0; t < n; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3;
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0).multiply(sc);
    b.fromBufferAttribute(pos, i1).multiply(sc);
    c.fromBufferAttribute(pos, i2).multiply(sc);
    e1.subVectors(b, a);
    e2.subVectors(c, a);
    const A = e1.clone().cross(e2).length() / 2;
    if (A < 1e-9) continue;
    // an orthonormal frame in the triangle's plane: x along e1, y across
    const l1 = e1.length();
    const ex = e1.clone().divideScalar(l1);
    const p2x = e2.dot(ex);
    const p2y = Math.sqrt(Math.max(0, e2.lengthSq() - p2x * p2x));
    const du1 = uv.getX(i1) - uv.getX(i0);
    const dv1 = uv.getY(i1) - uv.getY(i0);
    const du2 = uv.getX(i2) - uv.getX(i0);
    const dv2 = uv.getY(i2) - uv.getY(i0);
    // J maps the plane (x, y) to (u, v): J [l1, 0] = (du1, dv1) and J [p2x, p2y] = (du2, dv2)
    const j00 = du1 / l1;
    const j10 = dv1 / l1;
    const j01 = (du2 - j00 * p2x) / p2y;
    const j11 = (dv2 - j10 * p2x) / p2y;
    // singular values of a 2 x 2
    const s = j00 * j00 + j01 * j01 + j10 * j10 + j11 * j11;
    const d = j00 * j11 - j01 * j10;
    const q = Math.sqrt(Math.max(0, s * s - 4 * d * d));
    const s1 = Math.sqrt((s + q) / 2);
    const s2 = Math.sqrt(Math.max(0, (s - q) / 2));
    const st = Math.max(s1, s2 > 1e-9 ? 1 / s2 : Infinity);
    area += A;
    sum += A * Math.min(st, 1e6);
    max = Math.max(max, st);
    seen.push([st, A]);
  }
  // the worst 1 % of the surface: a sliver at a bevel's corner says nothing of what a visitor sees
  seen.sort((x, y) => y[0] - x[0]);
  let acc = 0;
  let p99 = 1;
  for (const [st, A] of seen) {
    acc += A;
    p99 = st;
    if (acc >= 0.01 * area) break;
  }
  return { area, mean: area > 0 ? sum / area : Infinity, max, p99, tris: n };
}

export function uvReport(mod: SceneModule<HeaterState>): UvReport[] {
  mod.scene.updateMatrixWorld(true);
  const out: UvReport[] = [];
  mod.scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const tex = mats.map(metricMap).find(Boolean);
    if (!tex) return;
    const r = uvStretch(m);
    out.push({ key: `${tex.name || '?'}|${m.name || m.parent?.name || ''}`, mesh: m.name, map: tex.name, ...r });
  });
  return out;
}
