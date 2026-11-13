import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createBenchSectionScene } from './benchsection/scene';
import { cylinder, disc, lathe, revolve, rod, stick, torus, uvMetric, v3 } from './common';
import { tubeAlong } from './machine/bench';
import { createFireCoreScene } from './firecore/scene';
import { createHomesteadScene } from './homestead/scene';
import { createLivingRoomScene } from './livingroom/scene';
import { stateWith, uvReport, uvStretch, view } from './test-utils';

// The material pass drew its maps for UVs in metres (`tiled(map, 1 / tile)`): a map is `tile` metres across whatever it is put on. A lathe, a cylinder or a cap whose UVs run 0..1 stretches the map by the ratio of its size to a
// metre: the riser's liner did, 4 times on average and 17 at its worst, and its pores read as bark; the drum's lid ran the map out from its centre in rays. These tests read the Jacobian of (u, v) against the surface in
// metres, mesh by mesh (`uvStretch` in test-utils): a mesh is true when both singular values are about one, and the stretch of a triangle is the larger of the largest and the inverse of the smallest.

/**
 * Maps that were never drawn for metres: the furniture's linen, wool and wood, and a bough's bark are laid on their own object from 0 to 1 (a cushion, a curtain's fold, a log), and a stretch there is a choice of the first
 * pass, not of this one. Listed so that a new map is held to metres by default; not seen as a defect by the independent review.
 */
const OWN_UV = new Set(['cloth', 'knit', 'wood', 'bark']);

const worlds = [
  ['homestead', createHomesteadScene],
  ['living-room', createLivingRoomScene],
  ['fire-core', createFireCoreScene],
  ['bench-section', createBenchSectionScene],
] as const;

describe('every map made for metres is laid in metres', () => {
  for (const [id, make] of worlds) {
    it(`${id}: the mean stretch of each mesh is under 1.5 and its worst 1 % of surface under 2`, () => {
      const mod = make();
      mod.update(stateWith(), 1 / 60, view({ time: 1 }));
      const checked = uvReport(mod).filter((r) => !OWN_UV.has(r.map));
      expect(checked.length).toBeGreaterThan(10);
      const bad = checked.filter((r) => !(r.mean < 1.5 && r.p99 < 2));
      expect(
        bad.map(
          (r) => `${r.key} area ${r.area.toFixed(3)} m2, mean ${r.mean.toFixed(2)}, worst 1 % ${r.p99.toFixed(1)}`,
        ),
      ).toEqual([]);
    });
  }

  it('the liner of the riser, a ring of 0.1 m radius and 0.7 m, is the size of its map and not of a metre', () => {
    const profile: [number, number][] = [
      [0.1, 0],
      [0.1, 0.7],
      [0.06, 0.7],
      [0.06, 0],
      [0.1, 0],
    ];
    const mesh = (g: THREE.BufferGeometry) => new THREE.Mesh(g, new THREE.MeshBasicMaterial());
    // the lathe's own UVs, 0..1: the stretch that was seen
    const before = uvStretch(mesh(lathe(profile, 48)));
    expect(before.mean).toBeGreaterThan(2.5);
    const after = uvStretch(mesh(revolve(profile, 48)));
    expect(after.mean).toBeLessThan(1.1);
    expect(after.p99).toBeLessThan(1.3);
  });

  it('a revolved body keeps the positions, the normals and the triangles of the lathe it replaces', () => {
    const profile: [number, number][] = [
      [0, 0.5],
      [0.28, 0.5],
      [0.3, 0.51],
      [0.3, 0.2],
      [0.28, 0.1],
    ];
    const a = lathe(profile, 36, 0.4, 3.1);
    const b = revolve(profile, 36, 0.4, 3.1);
    expect(b.index!.count).toBe(a.index!.count);
    // the same set of corners, each with the same normal: sorted by position, the two lists agree
    const corners = (g: THREE.BufferGeometry) => {
      const p = g.attributes.position as THREE.BufferAttribute;
      const n = g.attributes.normal as THREE.BufferAttribute;
      const out: string[] = [];
      for (let t = 0; t < g.index!.count; t++) {
        const i = g.index!.getX(t);
        out.push(
          [p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)].map((v) => Math.round(v * 1e4)).join(','),
        );
      }
      return out.sort();
    };
    const sa = corners(a);
    const sb = corners(b);
    // a triangle's corner is the same corner on both: the triangles of a degenerate span (a repeated point) may differ in order, not in position
    expect(sb.filter((c, i) => c !== sa[i]).length).toBeLessThan(sa.length * 0.02);
  });

  it('a flat top is mapped from above: no ray runs out from the centre of a lid', () => {
    const lid = revolve(
      [
        [0, 0.9],
        [0.27, 0.9],
        [0.29, 0.905],
      ],
      72,
      Math.PI,
    );
    const uv = lid.attributes.uv as THREE.BufferAttribute;
    const p = lid.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      // the first span is flat: (u, v) = (x, z)
      if (Math.abs(p.getY(i) - 0.9) < 1e-6 && Math.hypot(p.getX(i), p.getZ(i)) < 0.271) {
        expect(uv.getX(i)).toBeCloseTo(p.getX(i), 5);
        expect(uv.getY(i)).toBeCloseTo(p.getZ(i), 5);
      }
    }
  });

  it('a corner that two faces map from different sides is two vertices, with the same position and normal', () => {
    // a ring with a smooth normal on its edge, as a hand-shaped casing has
    const g = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 24, 4);
    g.deleteAttribute('uv');
    const before = g.attributes.position.count;
    uvMetric(g);
    expect(g.attributes.position.count).toBeGreaterThanOrEqual(before);
    const m = uvStretch(new THREE.Mesh(g, new THREE.MeshBasicMaterial()));
    expect(m.mean).toBeLessThan(1.35);
    expect(m.p99).toBeLessThan(1.8);
  });

  it('a rod, a cylinder, a disc and a ring carry their UVs in metres', () => {
    const mat = new THREE.MeshBasicMaterial();
    const parts: [string, THREE.BufferGeometry][] = [
      ['rod', rod(v3(0, 0, 0), v3(0.3, 0.2, 0.1), 0.012, 12)],
      ['cylinder', cylinder(0.04, 0.05, 0.3, 20)],
      ['disc', disc(0.1, 24)],
      ['torus', torus(0.15, 0.008, 8, 28)],
    ];
    for (const [name, g] of parts) {
      const s = uvStretch(new THREE.Mesh(g, mat));
      expect(s.mean, name).toBeLessThan(1.3);
      expect(s.p99, name).toBeLessThan(1.8);
    }
  });
});

// The seam of a round thing: where its map wraps from one end of the circumference to the other. A three cylinder and a lathe start on +z, facing the visitor, and a map made for metres steps there by the circumference's
// fraction of a tile (half a tile on the flue's foot, in the lines of its spiral: the review's MR3). Every metric cylinder, lathe and tube starts behind it (−z, or below a rod that points at the visitor), turned by whole
// segments, so that its vertices stand where they stood.

/** The mean direction, across the axis, of the vertices of the seam (the first column of u) of an open round body: `across` takes a point to its offset from the axis. */
function seamDirection(g: THREE.BufferGeometry, across: (p: THREE.Vector3, u: number) => THREE.Vector3): THREE.Vector3 {
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  let lo = Infinity;
  for (let i = 0; i < p.count; i++) lo = Math.min(lo, uv.getX(i));
  const sum = new THREE.Vector3();
  const v = new THREE.Vector3();
  let count = 0;
  for (let i = 0; i < p.count; i++)
    if (Math.abs(uv.getX(i) - lo) < 1e-6) {
      sum.add(across(v.fromBufferAttribute(p, i), uv.getX(i)));
      count++;
    }
  expect(count).toBeGreaterThan(1);
  return sum.normalize();
}

const corners = (g: THREE.BufferGeometry): string[] => {
  const p = g.attributes.position as THREE.BufferAttribute;
  const n = g.attributes.normal as THREE.BufferAttribute;
  const idx = g.index;
  const out: string[] = [];
  const count = idx ? idx.count : p.count;
  for (let t = 0; t < count; t++) {
    const i = idx ? idx.getX(t) : t;
    out.push(
      [p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)].map((v) => Math.round(v * 1e4)).join(','),
    );
  }
  return out.sort();
};

describe('the seam of a round thing faces away from the visitor', () => {
  it('a vertical rod, a cylinder and a whole turn of a lathe start behind (−z)', () => {
    const vertical = rod(v3(0, 0, 0), v3(0, 1, 0), 0.05, 24, false);
    expect(seamDirection(vertical, (p) => new THREE.Vector3(p.x, 0, p.z)).z).toBeLessThan(-0.99);
    const cyl = cylinder(0.05, 0.05, 1, 24, 1, true);
    expect(seamDirection(cyl, (p) => new THREE.Vector3(p.x, 0, p.z)).z).toBeLessThan(-0.99);
    const turned = revolve(
      [
        [0.1, 0],
        [0.1, 0.5],
      ],
      28,
    );
    expect(seamDirection(turned, (p) => new THREE.Vector3(p.x, 0, p.z)).z).toBeLessThan(-0.99);
    // an arc starts where it is asked to
    const arc = revolve(
      [
        [0.1, 0],
        [0.1, 0.5],
      ],
      28,
      0.4,
      2,
    );
    const d = seamDirection(arc, (p) => new THREE.Vector3(p.x, 0, p.z));
    expect(d.x).toBeCloseTo(Math.sin(0.4), 1);
  });

  it('a rod that lies along x, along z or aslant has its seam behind it, below it, behind it', () => {
    const across = (a: THREE.Vector3, b: THREE.Vector3) => (p: THREE.Vector3) => {
      const dir = b.clone().sub(a).normalize();
      return p
        .clone()
        .sub(a)
        .sub(dir.clone().multiplyScalar(p.clone().sub(a).dot(dir)));
    };
    const along = (a: THREE.Vector3, b: THREE.Vector3) => seamDirection(rod(a, b, 0.02, 24, false), across(a, b));
    expect(along(v3(0, 1, 0), v3(2, 1, 0)).z).toBeLessThan(-0.99);
    expect(along(v3(0, 1, 2), v3(0, 1, 0)).y).toBeLessThan(-0.99);
    const a = v3(0, 0, 0);
    const b = v3(0.6, 0.5, -0.3);
    const s = along(a, b);
    const dir = b.clone().sub(a).normalize();
    const want = new THREE.Vector3(0, 0, -1).sub(dir.clone().multiplyScalar(-dir.z)).normalize();
    expect(s.dot(want)).toBeGreaterThan(Math.cos(Math.PI / 24) - 0.01);
  });

  it('a tube along a path has its seam on the side its frame does not point to, never on the visitor’s', () => {
    // a duct along x has +z on its left: the visitor's side
    const run = tubeAlong([v3(0, 1, 0), v3(1, 1, 0), v3(2, 1, 0)], 0.1, 24);
    const d = seamDirection(run, (p) => new THREE.Vector3(0, p.y - 1, p.z));
    expect(d.z).toBeLessThan(-0.99);
    // along z it is on the side of x: the gable's
    const leg = tubeAlong([v3(0, 1, 0), v3(0, 1, 1), v3(0, 1, 2)], 0.1, 24);
    const e = seamDirection(leg, (p) => new THREE.Vector3(p.x, p.y - 1, 0));
    expect(Math.abs(e.z)).toBeLessThan(0.05);
  });

  it('turned by whole segments: the same corners, with the same normals, as the cylinder and the lathe they replace', () => {
    const a = v3(0.2, 0.1, -0.3);
    const b = v3(0.5, 0.9, 0.4);
    expect(corners(rod(a, b, 0.02, 12))).toEqual(corners(stick(a, b, 0.02, 12)));
    const profile: [number, number][] = [
      [0.1, 0],
      [0.1, 0.5],
      [0.06, 0.5],
    ];
    expect(corners(cylinder(0.05, 0.07, 0.4, 16, 1, false))).toEqual(
      corners(new THREE.CylinderGeometry(0.05, 0.07, 0.4, 16, 1, false)),
    );
    // a lathe of 36 segments: the same set of positions and normals, but for the corners a wall and a ring no longer share
    const whole = revolve(profile, 36);
    const plain = lathe(profile, 36);
    const position = (g: THREE.BufferGeometry) => new Set(corners(g).map((c) => c.split(',').slice(0, 3).join(',')));
    expect([...position(whole)].sort()).toEqual([...position(plain)].sort());
    // a rod with an odd number of segments is turned to the nearest whole segment, and still has its seam on the far side
    const odd = rod(v3(0, 0, 0), v3(0, 1, 0), 0.05, 9, false);
    expect(seamDirection(odd, (p) => new THREE.Vector3(p.x, 0, p.z)).z).toBeLessThan(-0.9);
  });
});
