import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Helpers of the four worlds: revolved geometry, tubes between points, boxes with their UVs in metres, a path with its length. Geometry and materials only (no canvas, no GL context), so
// everything here also runs in Node under vitest. From the sand lab (docs/kit-requests.md asks for them in the kit).

export const TAU = Math.PI * 2;

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const v3 = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** A closed ring around Y between two radii and two heights: four faces, so the edges read crisp. `r1` differs from `r0` on a cone. */
export function ringY(rIn: number, rOut: number, y0: number, y1: number, segments = 64): THREE.BufferGeometry {
  const part = (pts: [number, number][]) =>
    new THREE.LatheGeometry(
      pts.map(([r, y]) => new THREE.Vector2(r, y)),
      segments,
    );
  // a lathe faces outward when its points rise: outer wall up, then the top inward, the bore down, the bottom outward
  const parts = [
    part([
      [rOut, y0],
      [rOut, y1],
    ]),
    part([
      [rOut, y1],
      [rIn, y1],
    ]),
    part([
      [rIn, y1],
      [rIn, y0],
    ]),
    part([
      [rIn, y0],
      [rOut, y0],
    ]),
  ];
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A solid disc around Y (a cylinder with caps), its foot at y0. */
export function discY(r: number, y0: number, y1: number, segments = 64): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, segments, 1);
  g.translate(0, (y0 + y1) / 2, 0);
  return g;
}

const UP = new THREE.Vector3(0, 1, 0);

/** A cylinder from a to b, radius r (a stick, a leg, a straight pipe). */
export function stick(a: THREE.Vector3, b: THREE.Vector3, r: number, segments = 10, caps = true): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), segments, 1, !caps);
  const m = new THREE.Matrix4().compose(
    a.clone().add(b).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()),
    new THREE.Vector3(1, 1, 1),
  );
  g.applyMatrix4(m);
  return g;
}

/** A box given by its centre and its size. */
export function box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(cx, cy, cz);
  return g;
}

/** Merge geometries into one (they must share their attributes: `plain` drops what differs). */
export function joined(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const clean = parts.map((p) => {
    const g = p.index ? p.toNonIndexed() : p;
    for (const name of Object.keys(g.attributes))
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    return g;
  });
  const out = mergeGeometries(clean, false);
  parts.forEach((p) => p.dispose());
  return out;
}

/** Flag a whole subtree as never casting shadows (dots, overlays): the registry respects `userData.noShadow`. */
export function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false;
    c.userData.noShadow = true;
  });
  return o;
}

/** A tube through points (Catmull-Rom through them), for cables and wires. */
export function tubeGeometry(
  points: THREE.Vector3[],
  radius: number,
  segments = 24,
  radial = 6,
  closed = false,
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.TubeGeometry(curve, segments, radius, radial, closed);
}

// ------------------------------------------------------------------------------------------------ flow dots

/** Soft round sprite (white, alpha falling to the edge) for dots; a DataTexture, so no canvas is needed. */
export function softDotTexture(size = 32): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot((i + 0.5) / size - 0.5, (j + 0.5) / size - 0.5) * 2;
      const a = Math.max(0, 1 - d);
      const k = (j * size + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * Math.min(1, a * 1.8) * (a > 0 ? 1 : 0));
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** A polyline with its cumulative length, to place a dot at a distance along it. */
export class DotPath {
  readonly cum: number[] = [0];
  constructor(readonly points: THREE.Vector3[]) {
    for (let i = 1; i < points.length; i++) this.cum.push(this.cum[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  get length(): number {
    return this.cum[this.cum.length - 1];
  }
  at(u: number, out: THREE.Vector3): THREE.Vector3 {
    const L = this.length;
    if (L <= 0) return out.copy(this.points[0]);
    let d = u % L;
    if (d < 0) d += L;
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid;
    }
    const segLen = this.cum[hi] - this.cum[lo];
    const t = segLen > 0 ? (d - this.cum[lo]) / segLen : 0;
    return out.lerpVectors(this.points[lo], this.points[hi], t);
  }
}

// ------------------------------------------------------------------------------------------------ UVs in metres, shapes

/**
 * UVs in metres on any geometry, the way a box is mapped: each triangle takes the two coordinates across its own face's main axis. So a material with `repeat` of 1 / tile keeps its size whatever the shape, and a wall,
 * a bench and a brick read at their true scale. A triangle is never mapped from three different sides (a smooth normal on a rounded edge did it, and the map ran to a hundred times its size across that triangle): a
 * vertex that two faces map from different sides is copied, with its position and its normal, so the shading stays what it was. A face tilted off its axis stretches the map by 1.73 at the most.
 */
export function uvMetric(g: THREE.BufferGeometry, offset = 0): THREE.BufferGeometry {
  if (!g.attributes.normal) g.computeVertexNormals();
  const p = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  const idx = g.index;
  const corners = idx ? idx.count : p.count;
  const tris = corners / 3;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  /** The side each triangle is mapped from: 0 across x (a wall that faces x), 1 across y (a floor), 2 across z. */
  const sideOf = new Uint8Array(tris);
  for (let t = 0; t < tris; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3;
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(p, i0);
    b.fromBufferAttribute(p, i1).sub(a);
    c.fromBufferAttribute(p, i2).sub(a);
    n.crossVectors(b, c);
    // a sliver has no face of its own: it takes its vertices' normals
    if (n.lengthSq() < 1e-18) {
      n.set(0, 0, 0);
      for (const i of [i0, i1, i2]) n.add(c.fromBufferAttribute(nrm, i));
    }
    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);
    sideOf[t] = ax >= ay && ax >= az ? 0 : az >= ay && az >= ax ? 2 : 1;
  }
  const base = p.count;
  const side: number[] = new Array(base).fill(-1);
  if (idx) {
    // a vertex mapped from one side keeps its place, one mapped from two or three is copied for each
    const copies: number[] = [];
    const slot = new Map<number, number>();
    const next: number[] = new Array(corners);
    for (let k = 0; k < corners; k++) {
      const v = idx.getX(k);
      const s = sideOf[(k / 3) | 0]!;
      const key = v * 3 + s;
      let at = slot.get(key);
      if (at === undefined) {
        if (side[v] === -1) {
          at = v;
          side[v] = s;
        } else {
          at = base + copies.length;
          copies.push(v);
          side.push(s);
        }
        slot.set(key, at);
      }
      next[k] = at;
    }
    if (copies.length) {
      for (const name of Object.keys(g.attributes)) {
        const old = g.attributes[name] as THREE.BufferAttribute;
        const size = old.itemSize;
        const grown = new (old.array.constructor as new (n: number) => THREE.TypedArray)((base + copies.length) * size);
        grown.set(old.array);
        copies.forEach((v, k) => {
          for (let i = 0; i < size; i++) grown[(base + k) * size + i] = old.array[v * size + i]!;
        });
        g.setAttribute(name, new THREE.BufferAttribute(grown, size, old.normalized));
      }
    }
    g.setIndex(next);
  } else {
    for (let k = 0; k < corners; k++) side[k] = sideOf[(k / 3) | 0]!;
  }
  const q = g.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(q.count * 2);
  for (let i = 0; i < q.count; i++) {
    const s = side[i]!;
    uv[i * 2] = (s === 0 ? q.getZ(i) : q.getX(i)) + offset;
    uv[i * 2 + 1] = (s === 1 ? q.getZ(i) : q.getY(i)) + offset;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** A box given by its two corners, UVs in metres. */
export function boxAt(
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  offset = 0,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return uvMetric(g, offset);
}

/** A box with rounded edges, given by its centre and size. */
export function softBox(
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  r = 0.01,
  segments = 2,
): THREE.BufferGeometry {
  const g = new RoundedBoxGeometry(sx, sy, sz, segments, Math.min(r, Math.min(sx, sy, sz) / 2 - 1e-4));
  g.translate(cx, cy, cz);
  return uvMetric(g);
}

/** A ring or a tube around Y from a profile of [r, y] pairs: `phi` is the part of the turn it covers, around Y from +Z towards +X. */
export function lathe(
  profile: readonly (readonly [number, number])[],
  segments = 48,
  phiStart = 0,
  phiLength = TAU,
): THREE.BufferGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
    phiStart,
    phiLength,
  );
}

/**
 * Where a whole turn of `n` segments starts so that its seam lies behind (−z), the side nobody looks from: half a turn, rounded to a whole segment so that the ring has the very positions it had (a three cylinder and a
 * lathe start on +z, facing the visitor, and the map made for metres steps by the circumference's fraction of a tile there: half a tile on the flue's foot, in the lines of its spiral).
 */
export const seamBehind = (n: number): number => (Math.round(n / 2) * TAU) / n;

/**
 * A body of revolution like `lathe`, with the same positions, the same normals and the same triangles, and its UVs in metres: a wall is mapped round and along its profile (u = the turn times its radius, v = the length along
 * the profile), a ring or a disc that lies flat from above (x, z). A map drawn for metres then keeps its size on a riser, a drum or a duct, and a lid has no centre its grain runs to (the lathe's own 0..1 UVs stretched a
 * map 4 times on a liner and 12 times at its worst). A corner where a wall meets a ring is two vertices here, one for each, so the map is not dragged round the edge. The seam of a whole turn is behind (`seamBehind`), unless `phiStart` says otherwise.
 */
export function revolve(
  profile: readonly (readonly [number, number])[],
  segments = 48,
  phiStart?: number,
  phiLength = TAU,
): THREE.BufferGeometry {
  // a whole turn has its seam behind; an arc starts where it is asked to
  phiStart ??= phiLength >= TAU - 1e-9 ? seamBehind(Math.floor(segments)) : 0;
  const src = lathe(profile, segments, phiStart, phiLength);
  const sp = src.attributes.position as THREE.BufferAttribute;
  const sn = src.attributes.normal as THREE.BufferAttribute;
  const segs = Math.floor(segments);
  const turn = Math.min(TAU, Math.max(0, phiLength));
  const rings = segs + 1;
  const n = profile.length;
  const spans = n - 1;
  const pos = new Float32Array(spans * rings * 2 * 3);
  const nor = new Float32Array(spans * rings * 2 * 3);
  const uv = new Float32Array(spans * rings * 2 * 2);
  const index: number[] = [];
  let along = 0;
  for (let j = 0; j < spans; j++) {
    const [r0, y0] = profile[j]!;
    const [r1, y1] = profile[j + 1]!;
    const dr = r1 - r0;
    const length = Math.hypot(dr, y1 - y0);
    // a span that lies more flat than upright is a ring or a disc: mapped from above
    const flat = Math.abs(dr) > Math.abs(y1 - y0);
    const rMid = (r0 + r1) / 2;
    const first = j * rings * 2;
    for (let i = 0; i < rings; i++) {
      const phi = phiStart + (i / segs) * turn;
      for (let k = 0; k < 2; k++) {
        const v = first + i * 2 + k;
        const from = j + k + i * n;
        pos[v * 3] = sp.getX(from);
        pos[v * 3 + 1] = sp.getY(from);
        pos[v * 3 + 2] = sp.getZ(from);
        nor[v * 3] = sn.getX(from);
        nor[v * 3 + 1] = sn.getY(from);
        nor[v * 3 + 2] = sn.getZ(from);
        uv[v * 2] = flat ? sp.getX(from) : phi * rMid;
        uv[v * 2 + 1] = flat ? sp.getZ(from) : along + k * length;
      }
    }
    for (let i = 0; i < segs; i++) {
      const a = first + i * 2;
      index.push(a, a + 2, a + 1, a + 3, a + 1, a + 2);
    }
    along += length;
  }
  src.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

/**
 * The UVs of a three cylinder in metres, in its own frame (call it before any move): the side round and along (u = the turn times the mean radius, v = the length along the axis), a cap flat from its axis (x, z). A cylinder
 * from three has 0..1 on its side, so a map made for metres is stretched by the ratio of its size to a metre.
 */
export function cylinderMetric(g: THREE.CylinderGeometry): THREE.CylinderGeometry {
  const { radiusTop, radiusBottom, height } = g.parameters;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const round = TAU * ((radiusTop + radiusBottom) / 2);
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(nrm.getY(i)) > 0.99) uv.setXY(i, pos.getX(i), pos.getZ(i));
    else uv.setXY(i, uv.getX(i) * round, pos.getY(i) + height / 2);
  }
  uv.needsUpdate = true;
  return g;
}

/** A cylinder with its UVs in metres (`cylinderMetric`). */
export function cylinder(
  rTop: number,
  rBottom: number,
  height: number,
  radial = 16,
  rows = 1,
  open = false,
): THREE.CylinderGeometry {
  // the seam behind, as `seamBehind` says
  return cylinderMetric(new THREE.CylinderGeometry(rTop, rBottom, height, radial, rows, open, seamBehind(radial)));
}

/** A torus with its UVs in metres: u along the ring's own length, v round its tube (a bracket's ring, a hoop that wears a steel map). */
export function torus(R: number, r: number, radial = 8, tubular = 24, arc = TAU): THREE.TorusGeometry {
  const g = new THREE.TorusGeometry(R, r, radial, tubular, arc);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * arc * R, uv.getY(i) * TAU * r);
  uv.needsUpdate = true;
  return g;
}

/** A flat disc facing +z, its UVs in metres (x, y), for a stopper or a face that wears a map made for metres. */
export function disc(r: number, segments = 24): THREE.CircleGeometry {
  const g = new THREE.CircleGeometry(r, segments);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i));
  uv.needsUpdate = true;
  return g;
}

/**
 * `stick` with its UVs in metres, for a rod a matter map is put on (steel, a flue's cap, a dial's case): the same cylinder, its seam turned (by whole segments, so its vertices stand where they stood) to the side
 * away from the visitor, −z, or below a rod that runs along z.
 */
export function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, segments = 10, caps = true): THREE.BufferGeometry {
  const dir = b.clone().sub(a).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
  // the direction the seam should face, across the axis: back, or down for a rod that points at the visitor
  const across = (v: THREE.Vector3) => v.clone().sub(dir.clone().multiplyScalar(v.dot(dir)));
  let want = across(new THREE.Vector3(0, 0, -1));
  if (want.length() < 0.5) want = across(new THREE.Vector3(0, -1, 0));
  const local = want.normalize().applyQuaternion(q.clone().invert());
  const step = TAU / segments;
  const start = Math.round(Math.atan2(local.x, local.z) / step) * step;
  const g = cylinderMetric(new THREE.CylinderGeometry(r, r, a.distanceTo(b), segments, 1, !caps, start));
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
  return g;
}

/** A plate cut from a shape in plan: `shape` holds (x, z) as its (x, y), the plate spans y0 to y1. UVs in metres. */
export function plate(shape: THREE.Shape, y0: number, y1: number, curveSegments = 24): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments });
  // shape (x, y) to the plan (x, z): y becomes z, the extrusion goes up
  g.rotateX(Math.PI / 2);
  g.translate(0, y1, 0);
  return uvMetric(g);
}

/** A rectangle with rounded corners as a Shape. */
export function roundedRect(x0: number, y0: number, x1: number, y1: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** A closed polygon of [x, y] pairs as a Shape, with optional holes (polygons too). */
export function polyShape(
  points: readonly (readonly [number, number])[],
  holes: (readonly (readonly [number, number])[])[] = [],
): THREE.Shape {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  return s;
}
