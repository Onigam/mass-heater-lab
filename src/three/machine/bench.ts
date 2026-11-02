import * as THREE from 'three';
import { TAU, joined, lathe, stick, uvMetric, v3 } from '../common';
import { BENCH, DUCT, ROOM, ductS, drawnDuctLength } from '../dims';
import type { Rect } from '../section';
import { fbm } from '../textures';

// The bench and its duct, in the room frame, one function: the plastered shell along the back wall and the gable, the backrest on it, the spiral duct inside with its soft jog from the thick to the thin casing, its corner and its
// joints, the cleanout on the front. `living-room` shows all of it; `bench-section` shows slices of the same profile and the same duct's parts (`benchProfile`, `ductAxisAt`).

const H = BENCH.height;
const D = BENCH.depth;
const L = drawnDuctLength();

/** The bench's cross-section, from the wall (d = 0) to the front (d = depth), floor to seat: the top lies flat, the front edge is round, and each point says whether it belongs to the seat (0) or the front (1). */
export function benchProfile(): { d: number; y: number; f: number }[] {
  const r = BENCH.edgeR;
  const pts: { d: number; y: number; f: number }[] = [{ d: 0.0, y: H, f: 0 }];
  const n = 7;
  for (let i = 1; i <= n; i++) pts.push({ d: ((D - r) * i) / n, y: H, f: 0 });
  for (let i = 1; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    pts.push({ d: D - r + r * Math.sin(a), y: H - r + r * Math.cos(a), f: i / 5 });
  }
  for (let i = 1; i <= 4; i++) pts.push({ d: D, y: H - r - ((H - r) * i) / 4, f: 1 });
  return pts;
}

/** The plan of a ring of the sweep: a point at `d` from the wall, on the first leg, around the inner corner, on the second leg. */
function ringPlan(t: number, d: number): { x: number; z: number; s: number } {
  // t in metres along the front's line, from the bench's start: first leg, the corner, second leg
  const wx = ROOM.x1;
  const wz = ROOM.z0;
  const r = BENCH.cornerR;
  const x0 = BENCH.casingStartX;
  const legA = wx - D - r - x0;
  const arc = (r * Math.PI) / 2;
  if (t <= legA) {
    const x = x0 + t;
    return { x, z: wz + d, s: ductS(x, BENCH.ductZ) };
  }
  if (t <= legA + arc) {
    const phi = (t - legA) / r;
    const ax = wx - D - r;
    const az = wz + D + r;
    const fx = ax + r * Math.sin(phi);
    const fz = az - r * Math.cos(phi);
    // the wall's side: towards the corner of the walls, then away along the other wall
    const u = phi / (Math.PI / 2);
    const bx = u < 0.5 ? ax + (wx - ax) * (u / 0.5) : wx;
    const bz = u < 0.5 ? wz : wz + (az - wz) * ((u - 0.5) / 0.5);
    const k = d / D;
    const sA = ductS(BENCH.ductX, BENCH.ductZ);
    return { x: bx + (fx - bx) * k, z: bz + (fz - bz) * k, s: sA + (u - 0.5) * 0.5 };
  }
  const z = wz + D + r + (t - legA - arc);
  return { x: wx - d, z, s: ductS(BENCH.ductX, z) };
}

/** Rings along the bench: t values, closer around the corner. */
function ringList(): number[] {
  const wx = ROOM.x1;
  const r = BENCH.cornerR;
  const legA = wx - D - r - BENCH.casingStartX;
  const arc = (r * Math.PI) / 2;
  const legB = BENCH.casingEndZ - (ROOM.z0 + D + r);
  const out: number[] = [];
  const a = Math.ceil(legA / 0.18);
  for (let i = 0; i < a; i++) out.push((legA * i) / a);
  for (let i = 0; i < 12; i++) out.push(legA + (arc * i) / 12);
  const b = Math.ceil(legB / 0.18);
  for (let i = 0; i <= b; i++) out.push(legA + arc + (legB * i) / b);
  return out;
}

/**
 * A sweep of a profile along the two legs. `aHeatUv` holds (distance along the run / run's length, seat or front): the field of the model is read there. A little unevenness of a hand-laid surface, a few millimetres, stays
 * below what the caps would show.
 */
function sweep(
  profile: { d: number; y: number; f: number }[],
  rings: number[],
  amount: number,
  closeEnd: boolean,
): THREE.BufferGeometry {
  const np = profile.length;
  const pos: number[] = [];
  const hu: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  rings.forEach((t) => {
    let arcLen = 0;
    profile.forEach((p, j) => {
      const plan = ringPlan(t, p.d);
      const n = fbm(t * 1.6 + 7, j * 0.22 + p.y * 2, 3) - 0.5;
      const top = p.f < 0.99;
      if (j > 0) arcLen += Math.hypot(p.d - profile[j - 1]!.d, p.y - profile[j - 1]!.y);
      pos.push(plan.x, p.y + (top ? n * amount : 0), plan.z);
      hu.push(Math.min(1, Math.max(0, plan.s / L)), 0.25 + 0.5 * p.f);
      uv.push(t, arcLen);
    });
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < np - 1; j++) {
      const a = i * np + j;
      const b = a + np;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  if (closeEnd) {
    // the bench's end: a dome that closes on the floor, its round brow carrying on from the seat and the front, its foot on the slab
    const last = rings[rings.length - 1]!;
    const first = (rings.length - 1) * np;
    const plan0 = ringPlan(last, 0);
    const baseIdx = pos.length / 3;
    const steps = 7;
    const bulge = 0.2;
    profile.forEach((p, j) => {
      for (let k = 1; k <= steps; k++) {
        const u = k / steps;
        const a = u * (Math.PI / 2);
        const d = p.d + (D / 2 - p.d) * u * u;
        const plan = ringPlan(last, d);
        pos.push(plan.x, p.y * Math.cos(a), plan0.z + bulge * Math.sin(a));
        hu.push(Math.min(1, plan.s / L), 0.25 + 0.5 * p.f);
        uv.push(last + u * bulge, j * 0.05);
      }
    });
    for (let j = 0; j < np - 1; j++)
      for (let k = 0; k < steps; k++) {
        const a = k === 0 ? first + j : baseIdx + j * steps + k - 1;
        const a1 = k === 0 ? first + j + 1 : baseIdx + (j + 1) * steps + k - 1;
        const b = baseIdx + j * steps + k;
        const b1 = baseIdx + (j + 1) * steps + k;
        idx.push(a, a1, b, a1, b1, b);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aHeatUv', new THREE.Float32BufferAttribute(hu, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function benchShellGeometry(): THREE.BufferGeometry {
  return sweep(benchProfile(), ringList(), 0.004, true);
}

export function backrestGeometry(): THREE.BufferGeometry {
  const w = BENCH.backrestDepth;
  const h = BENCH.backrestHeight;
  const base = H;
  const r = 0.05;
  const prof: { d: number; y: number; f: number }[] = [{ d: 0, y: base + h - 0.01, f: 0 }];
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    prof.push({ d: w - r + r * Math.sin(a), y: base + h - r + r * Math.cos(a), f: 0 });
  }
  prof.push({ d: w + 0.012, y: base + h * 0.45, f: 0 }, { d: w + 0.018, y: base + 0.002, f: 0 });
  const rings = ringList().filter((t) => {
    const x = ringPlan(t, 0.1);
    return x.x >= BENCH.backrestX0 && x.z <= BENCH.backrestZ1;
  });
  return sweep(prof, rings, 0.004, false);
}

// ------------------------------------------------------------------------------------------------ the duct

/** The height of the duct's axis at a distance along the run: thick casing on the hot run, a soft rise, thin casing beyond. */
export function ductAxisAt(s: number): number {
  const a = (s - (BENCH.hotEndX - BENCH.startX - DUCT.jog / 2)) / DUCT.jog;
  const t = Math.min(1, Math.max(0, a));
  const k = t * t * (3 - 2 * t);
  return DUCT.axisHot + (DUCT.axisCold - DUCT.axisHot) * k;
}

/** The duct's centre line in the room frame, with its rounded corner: from its mouth in the manifold to the tee. */
export function ductPath(from = BENCH.startX): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const r = DUCT.bendR;
  const xc = BENCH.ductX - r;
  const zc = BENCH.ductZ + r;
  const leg1 = 36;
  for (let i = 0; i <= leg1; i++) {
    const x = from + ((xc - from) * i) / leg1;
    pts.push(v3(x, ductAxisAt(ductS(x, BENCH.ductZ)), BENCH.ductZ));
  }
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(v3(xc + r * Math.sin(a), DUCT.axisCold, zc - r * Math.cos(a)));
  }
  const leg2 = 16;
  for (let i = 1; i <= leg2; i++) pts.push(v3(BENCH.ductX, DUCT.axisCold, zc + ((BENCH.endZ - zc) * i) / leg2));
  return pts;
}

/** A round tube along a path, UVs in metres along it, seen from both sides (a section looks into it). */
export function tubeAlong(path: THREE.Vector3[], radius: number, radial = 24): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let len = 0;
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)]!;
    const c = path[Math.min(path.length - 1, i + 1)]!;
    t.subVectors(c, a).normalize();
    n.crossVectors(t, up).normalize();
    b.crossVectors(n, t).normalize();
    if (i > 0) len += path[i]!.distanceTo(path[i - 1]!);
    for (let j = 0; j <= radial; j++) {
      const ang = (j / radial) * TAU;
      const nx = n.x * Math.cos(ang) + b.x * Math.sin(ang);
      const ny = n.y * Math.cos(ang) + b.y * Math.sin(ang);
      const nz = n.z * Math.cos(ang) + b.z * Math.sin(ang);
      pos.push(path[i]!.x + nx * radius, path[i]!.y + ny * radius, path[i]!.z + nz * radius);
      nor.push(nx, ny, nz);
      uv.push((j / radial) * TAU * radius, len);
    }
  }
  for (let i = 0; i < path.length - 1; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const c = a + radial + 1;
      idx.push(a, c, a + 1, a + 1, c, c + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Collars where the lengths of duct meet, on the path, every `DUCT.jointEvery` m. */
export function ductJoints(path: THREE.Vector3[]): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  let next = DUCT.jointEvery;
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const seg = path[i]!.distanceTo(path[i - 1]!);
    while (len + seg >= next) {
      const u = (next - len) / seg;
      const c = path[i - 1]!.clone().lerp(path[i]!, u);
      const dir = path[i]!.clone()
        .sub(path[i - 1]!)
        .normalize()
        .multiplyScalar(DUCT.collarL / 2);
      parts.push(stick(c.clone().sub(dir), c.clone().add(dir), DUCT.collarR, 24));
      next += DUCT.jointEvery;
    }
    len += seg;
  }
  return joined(parts);
}

/** Where the cleanout leaves the duct: the branch and its cap on the bench's front. */
export function cleanoutGeometry(): {
  branch: THREE.BufferGeometry;
  cap: THREE.BufferGeometry;
  capCentre: THREE.Vector3;
} {
  const x = BENCH.cleanoutX;
  const y = DUCT.axisCold;
  const z0 = BENCH.ductZ;
  const z1 = ROOM.z0 + D;
  const branch = stick(v3(x, y, z0), v3(x, y, z1 + 0.004), BENCH.cleanoutR - 0.012, 22);
  const cap = joined([
    stick(v3(x, y, z1), v3(x, y, z1 + 0.012), BENCH.cleanoutR, 28),
    stick(v3(x, y, z1 + 0.012), v3(x, y, z1 + 0.022), BENCH.cleanoutR - 0.018, 24),
    stick(v3(x - 0.035, y, z1 + 0.026), v3(x + 0.035, y, z1 + 0.026), 0.006, 8),
  ]);
  return { branch, cap, capCentre: v3(x, y, z1 + 0.012) };
}

// ------------------------------------------------------------------------------------------------ the section along the duct

/** The bore's height at x on the first leg. */
const borePlan = (x: number): number => ductAxisAt(ductS(x, BENCH.ductZ));

/**
 * The cob's cut on the plane of the duct's axis. `a` runs along the leg (x on the first, z on the second), `b` is the height: strips above and below the bore, plaster and the layer on the slab apart. Fine enough to follow the jog.
 */
export function benchCutRects(leg: 'a' | 'b'): { cob: Rect[]; plaster: Rect[]; barrier: Rect[] } {
  const P = BENCH.plaster;
  const B = BENCH.barrier;
  const cob: Rect[] = [];
  const plaster: Rect[] = [];
  const barrier: Rect[] = [];
  if (leg === 'a') {
    const x0 = BENCH.casingStartX;
    const x1 = BENCH.ductX;
    plaster.push([x0, H - P, x1, H]);
    barrier.push([x0, 0, x1, B]);
    const n = 96;
    for (let i = 0; i < n; i++) {
      const a = x0 + ((x1 - x0) * i) / n;
      const b = x0 + ((x1 - x0) * (i + 1)) / n;
      const y = borePlan((a + b) / 2);
      cob.push([a, B, b, y - DUCT.r], [a, y + DUCT.r, b, H - P]);
    }
  } else {
    const z0 = BENCH.ductZ;
    const z1 = BENCH.casingEndZ;
    const y = DUCT.axisCold;
    plaster.push([z0, H - P, z1, H]);
    barrier.push([z0, 0, z1, B]);
    cob.push([z0, B, z1, y - DUCT.r], [z0, y + DUCT.r, z1, H - P]);
  }
  return { cob, plaster, barrier };
}

/** A circle as a closed lathe ring around the X axis, for a flat end. */
export function ringInPlane(rIn: number, rOut: number, seg = 32): THREE.BufferGeometry {
  return uvMetric(
    lathe(
      [
        [rIn, 0],
        [rOut, 0],
      ],
      seg,
    ),
  );
}
