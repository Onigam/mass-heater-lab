import * as THREE from 'three';
import type { PartRegistry } from '@onigam/lab-kit/three';

// The section of the gas path. A plane that follows the gases: the core is cut through the feed, the tunnel, the riser and the drum's axis; it steps back to the duct's axis just past the drum's ring, and runs along the
// bench and up the chimney, so the whole way the gases go lies open on one surface. Each clipped thing belongs to a `ClipSet` (its own planes, its own material): two planes that clip when either says so (`union`), or
// only when both do (`intersection`). The planes never change their number and the shaders never recompile: « off » moves them far away, so pressing the tool compiles nothing. Caps are flat polygons in unclipped materials.

const FAR = 1e4;

/**
 * The kit's picking skips a hit if ANY clipping plane of the material says the point is on its negative side, as with a union of planes. For an intersection that would refuse most of the machine: this plane answers for the
 * two together (kit request, as in the sand lab).
 */
class GuardedPlane extends THREE.Plane {
  constructor(private readonly removed: (p: THREE.Vector3) => boolean) {
    super();
  }
  override distanceToPoint(point: THREE.Vector3): number {
    return this.removed(point) ? -1 : 1;
  }
}

export interface PlaneSpec {
  /** Kept side's normal: what is on the negative side is clipped. */
  normal: [number, number, number];
  /** A point of the plane. */
  at: [number, number, number];
}

export class ClipSet {
  readonly planes: THREE.Plane[];
  private readonly constants: number[];
  private on = false;
  private readonly tmp = new THREE.Plane();

  constructor(
    private readonly specs: PlaneSpec[],
    readonly intersection = false,
  ) {
    this.constants = specs.map((s) => -new THREE.Vector3(...s.normal).dot(new THREE.Vector3(...s.at)));
    this.planes = specs.map((s, i) => {
      const p = intersection ? new GuardedPlane((q) => this.removed(q)) : new THREE.Plane();
      p.normal.set(...s.normal);
      p.constant = this.constants[i]!;
      return p;
    });
    this.set(false);
  }

  /** Whether a point is taken away while the section is on (tests and picking). */
  removed(q: THREE.Vector3): boolean {
    if (!this.on) return false;
    const neg = this.specs.map((s, i) => {
      this.tmp.normal.set(...s.normal);
      this.tmp.constant = this.constants[i]!;
      return this.tmp.distanceToPoint(q) < 0;
    });
    return this.intersection ? neg.every(Boolean) : neg.some(Boolean);
  }

  set(on: boolean): void {
    this.on = on;
    this.planes.forEach((p, i) => {
      p.constant = on ? this.constants[i]! : FAR;
    });
  }

  get isOn(): boolean {
    return this.on;
  }

  /** Materials under `root` (each one only) take these planes; a material used by two sets must be cloned first. */
  clip(root: THREE.Object3D): void {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!(m.isMesh || (o as THREE.Points).isPoints) || m.userData.cap || m.userData.notClipped) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) this.clipMaterial(mat);
    });
  }

  clipMaterial(mat: THREE.Material): void {
    mat.clippingPlanes = this.planes;
    mat.clipIntersection = this.intersection;
    mat.clipShadows = true;
    mat.side = THREE.DoubleSide;
    mat.needsUpdate = true;
  }
}

/** The material of a cap standing for `mat`, same look, not clipped, seen from both sides. */
export function capMaterialOf(mat: THREE.Material): THREE.Material {
  const c = mat.clone();
  c.clippingPlanes = null;
  c.clipIntersection = false;
  c.clipShadows = false;
  c.side = THREE.DoubleSide;
  c.userData = { noShare: true };
  return c;
}

/** A rectangle of a section. */
export type Rect = [number, number, number, number];

/** Flat rectangles in a plane: the first coordinate along `u`, the second is Y. Each carries `aHeatUv` when `heat` says how. */
export function capRects(
  rects: readonly Rect[],
  place: (a: number, b: number) => [number, number, number],
  heat?: (a: number, b: number) => [number, number],
): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const nor: number[] = [];
  const hu: number[] = [];
  const idx: number[] = [];
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const [a0, b0, a1, b1] of rects) {
    const p0 = place(a0, b0);
    const p1 = place(a1, b0);
    const p2 = place(a1, b1);
    const p3 = place(a0, b1);
    e1.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    e2.set(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]);
    n.crossVectors(e1, e2).normalize();
    const base = pos.length / 3;
    for (const [q, a, b] of [
      [p0, a0, b0],
      [p1, a1, b0],
      [p2, a1, b1],
      [p3, a0, b1],
    ] as const) {
      pos.push(q[0], q[1], q[2]);
      nor.push(n.x, n.y, n.z);
      uv.push(a, b);
      if (heat) {
        const h = heat(a, b);
        hu.push(h[0], h[1]);
      }
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (heat) g.setAttribute('aHeatUv', new THREE.Float32BufferAttribute(hu, 2));
  g.setIndex(idx);
  return g;
}

interface Cap {
  mesh: THREE.Mesh;
  /** The part whose display it follows, or an object whose visibility it follows. */
  part?: string;
  follows?: THREE.Object3D;
}

/** The caps of a world: visible while the section is on and what they stand for is shown solid. */
export class Caps {
  readonly list: Cap[] = [];

  /** A cap of a registered part: a click selects it. Add it before the part is registered. */
  add(part: string, parent: THREE.Object3D, g: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
    const mesh = this.make(parent, g, mat, `${part}-cap`);
    // a cap that is clicked selects its part, but only while it shows (the kit casts against every mesh of a part, visible or not)
    mesh.raycast = function raycast(rc, hits) {
      if (mesh.visible) THREE.Mesh.prototype.raycast.call(mesh, rc, hits);
    };
    this.list.push({ mesh, part });
    return mesh;
  }

  /** A cap of the scenery: it follows the visibility of `follows`, and a click passes through. */
  addScenery(
    parent: THREE.Object3D,
    g: THREE.BufferGeometry,
    mat: THREE.Material,
    follows?: THREE.Object3D,
  ): THREE.Mesh {
    const mesh = this.make(parent, g, mat, `${parent.name}-cap`);
    mesh.raycast = () => {};
    this.list.push({ mesh, follows });
    return mesh;
  }

  private make(parent: THREE.Object3D, g: THREE.BufferGeometry, mat: THREE.Material, name: string): THREE.Mesh {
    const mesh = new THREE.Mesh(g, mat);
    mesh.userData.cap = true;
    mesh.userData.noShadow = true;
    mesh.userData.notClipped = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.visible = false;
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  }

  update(on: boolean, registry: PartRegistry | null): void {
    for (const c of this.list) {
      const entry = c.part ? registry?.get(c.part) : undefined;
      const solid = !entry || entry.display === 'solid';
      const seen = !c.follows || c.follows.visible;
      c.mesh.visible = on && solid && seen;
    }
  }

  of(part: string): THREE.Mesh[] {
    return this.list.filter((c) => c.part === part).map((c) => c.mesh);
  }
}
