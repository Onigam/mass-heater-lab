import * as THREE from 'three';
import { softDotTexture } from '../common';
import { STATIONS, type HeaterState } from '../../sim/types';

// The gases as the model moves them. Dots along the real path, each with its own distance: speed = mass flow over the density at the local temperature and the local section, so they rush in the riser, slow down in the fall
// down the drum and crawl along the duct, then speed up in the chimney; `flowDirection` turns them round, and at rest they stop. Their colour is the model's temperature along the path (`pathT`), their spread the width of the channel.
// Beads at each station of the path show the pressure (`pathP`): blue under suction, red when the inside pushes out, sized by how much. Every motion takes `view.slowMo`.

export interface GasNode {
  p: THREE.Vector3;
  /** A place in `STATIONS`, fractional. */
  st: number;
  /** The section there, m². */
  A: number;
  /** The half-width of the channel there, m: how far a dot may stray. */
  h: number;
}

interface Run {
  nodes: GasNode[];
  cum: number[];
  length: number;
  dots: { d: number; i: number; a: number; b: number }[];
}

const MIN_FLOW = 2e-5;
/** No dot goes faster on screen than this (m/s at ×1), so the eye reads them: in the riser at full burn this is reached. */
export const GAS_VISUAL_CAP = 2.2;

/** The colour of a gas at a temperature: incandescent in the fire, dull in the drum, pale and cool at the chimney. */
export function gasColor(T: number, out: THREE.Color): THREE.Color {
  const stops: [number, number, number, number][] = [
    [25, 0.3, 0.46, 0.8],
    [70, 0.62, 0.42, 0.42],
    [150, 0.9, 0.42, 0.16],
    [350, 1.0, 0.3, 0.05],
    [750, 1.0, 0.58, 0.12],
    [1100, 1.0, 0.86, 0.45],
  ];
  if (T <= stops[0]![0]) return out.setRGB(stops[0]![1], stops[0]![2], stops[0]![3]);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (T <= b[0]) {
      const t = (T - a[0]) / (b[0] - a[0]);
      return out.setRGB(a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t);
    }
  }
  const e = stops[stops.length - 1]!;
  return out.setRGB(e[1], e[2], e[3]);
}

/** The density of the gases, kg/m³, at a temperature: an ideal gas at the pressure of the room. */
export const gasDensity = (T: number): number => 353 / (T + 273.15);

export class GasFlow {
  readonly group = new THREE.Group();
  readonly points: THREE.Points;
  readonly beads: THREE.InstancedMesh;
  private readonly runs: Run[] = [];
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private total = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly c = new THREE.Color();
  private readonly beadAt: THREE.Vector3[] = [];
  private readonly m4 = new THREE.Matrix4();
  private readonly geo: THREE.BufferGeometry;
  /** What was last drawn (tests). */
  speeds = { riser: 0, duct: 0 };

  constructor(
    private readonly max: number,
    size = 6,
    beadsAt: THREE.Vector3[] = [],
  ) {
    this.group.name = 'gas-flow';
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo.setDrawRange(0, 0);
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: false,
      map: softDotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
    this.points.userData.noShadow = true;
    this.points.userData.notClipped = true;
    this.points.raycast = () => {};
    this.group.add(this.points);

    this.beadAt = beadsAt;
    this.beads = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.92, fog: false }),
      Math.max(1, beadsAt.length),
    );
    this.beads.count = beadsAt.length;
    this.beads.frustumCulled = false;
    this.beads.renderOrder = 21;
    this.beads.userData.noShadow = true;
    this.beads.userData.notClipped = true;
    this.beads.castShadow = false;
    this.beads.raycast = () => {};
    this.group.add(this.beads);
    this.group.visible = false;
  }

  /** A stretch of the path with its dots: they keep to it and start again at its beginning. */
  addRun(nodes: GasNode[], count: number): void {
    const cum = [0];
    for (let i = 1; i < nodes.length; i++) cum.push(cum[i - 1]! + nodes[i]!.p.distanceTo(nodes[i - 1]!.p));
    const length = cum[cum.length - 1]!;
    const dots: Run['dots'] = [];
    const n = Math.min(count, this.max - this.total);
    for (let i = 0; i < n; i++) {
      // a fixed scatter for each dot
      const a = Math.sin(i * 12.9898 + this.total * 3.1) * 43758.5453;
      const b = Math.sin(i * 78.233 + this.total * 1.7) * 12543.123;
      dots.push({
        d: (length * i) / n,
        i: this.total + i,
        a: (a - Math.floor(a)) * 2 - 1,
        b: (b - Math.floor(b)) * 2 - 1,
      });
    }
    this.total += n;
    this.geo.setDrawRange(0, this.total);
    this.runs.push({ nodes, cum, length, dots });
  }

  /** dt in real seconds, `slowMo` the view's. With dt = 0 nothing moves; the positions are written from each dot's distance, so a replay is exact. */
  update(s: HeaterState, dt: number, slowMo: number, show: boolean): void {
    this.group.visible = show;
    if (!show) return;
    const flow = s.gasFlow;
    const dir = Math.abs(flow) < MIN_FLOW ? 0 : flow > 0 ? 1 : -1;
    const m = Math.abs(flow);
    for (const run of this.runs) {
      for (const dot of run.dots) {
        const seg = this.segment(run, dot.d);
        const a = run.nodes[seg]!;
        const b = run.nodes[seg + 1]!;
        const t = (dot.d - run.cum[seg]!) / Math.max(1e-6, run.cum[seg + 1]! - run.cum[seg]!);
        const st = a.st + (b.st - a.st) * t;
        const T = this.pathT(s, st);
        const A = a.A + (b.A - a.A) * t;
        const v = Math.min(GAS_VISUAL_CAP, m / (gasDensity(T) * A));
        dot.d += dir * v * dt * slowMo;
        if (dot.d > run.length) dot.d -= run.length;
        if (dot.d < 0) dot.d += run.length;
        const seg2 = this.segment(run, dot.d);
        const a2 = run.nodes[seg2]!;
        const b2 = run.nodes[seg2 + 1]!;
        const t2 = (dot.d - run.cum[seg2]!) / Math.max(1e-6, run.cum[seg2 + 1]! - run.cum[seg2]!);
        this.tmp.lerpVectors(a2.p, b2.p, t2);
        const h = (a2.h + (b2.h - a2.h) * t2) * 0.78;
        // straying across the channel, across its direction
        const tx = b2.p.x - a2.p.x;
        const ty = b2.p.y - a2.p.y;
        const tz = b2.p.z - a2.p.z;
        const horizontal = Math.abs(ty) < Math.abs(tx) + Math.abs(tz);
        const k = dot.i * 3;
        if (horizontal) {
          const along = Math.hypot(tx, tz) || 1;
          this.pos[k] = this.tmp.x + (-tz / along) * dot.a * h;
          this.pos[k + 1] = this.tmp.y + dot.b * h;
          this.pos[k + 2] = this.tmp.z + (tx / along) * dot.a * h;
        } else {
          this.pos[k] = this.tmp.x + dot.a * h;
          this.pos[k + 1] = this.tmp.y;
          this.pos[k + 2] = this.tmp.z + dot.b * h;
        }
        const st2 = a2.st + (b2.st - a2.st) * t2;
        gasColor(this.pathT(s, st2), this.c);
        this.col[k] = this.c.r;
        this.col[k + 1] = this.c.g;
        this.col[k + 2] = this.c.b;
      }
    }
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    const A = Math.PI * 0.01;
    this.speeds.riser = m / (gasDensity(s.riserTopT) * A);
    this.speeds.duct = m / (gasDensity(s.pathT[8] ?? 60) * A);

    // the pressure at each station
    for (let i = 0; i < this.beadAt.length; i++) {
      const p = s.pathP[i] ?? 0;
      const r = 0.009 + 0.0065 * Math.sqrt(Math.abs(p));
      this.m4.makeScale(r, r, r).setPosition(this.beadAt[i]!);
      this.beads.setMatrixAt(i, this.m4);
      const u = Math.min(1, Math.abs(p) / 6);
      if (p < 0) this.c.setRGB(0.92 - 0.75 * u, 0.94 - 0.5 * u, 1);
      else this.c.setRGB(1, 0.92 - 0.72 * u, 0.9 - 0.8 * u);
      this.beads.setColorAt(i, this.c);
    }
    this.beads.instanceMatrix.needsUpdate = true;
    if (this.beads.instanceColor) this.beads.instanceColor.needsUpdate = true;
  }

  private segment(run: Run, d: number): number {
    let lo = 0;
    let hi = run.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (run.cum[mid]! <= d) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  private pathT(s: HeaterState, st: number): number {
    const a = Math.max(0, Math.min(STATIONS.length - 1, Math.floor(st)));
    const b = Math.min(STATIONS.length - 1, a + 1);
    const t = st - a;
    return s.pathT[a]! * (1 - t) + s.pathT[b]! * t;
  }

  get count(): number {
    return this.total;
  }
}
