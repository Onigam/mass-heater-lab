import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import { PartRegistry, type Hotspot } from '@onigam/lab-kit/three';

// What the worlds share: the hotspot declarations.

export interface HotspotDef {
  /** The part; a suffix `#name` lets a part have several labels. */
  id: string;
  fr: string;
  en: string;
  minor?: boolean;
  /** World to open when the label is clicked. */
  goto?: string;
  /** A main label that only has room in a wide view: at the far edge of a narrow one its name would be cut, and the kit cannot turn it round (`docs/kit-requests.md`, 22). Narrower, it counts as minor. */
  wide?: boolean;
}

/** The window under which a `wide` label steps back. The kit reads `minor` each time it refreshes the labels: on a change of world, of selection, of label mode. */
export const WIDE_FROM = 1100;

export interface LabHotspot extends Hotspot {
  wide?: boolean;
}

/** Where a part is looked at from: `elevation` above the ground and a `bearing` from +z towards +x, in degrees. */
export function viewFrom(elevation: number, bearing: number): THREE.Vector3 {
  const e = (elevation * Math.PI) / 180;
  const b = (bearing * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e));
}

/** How a click or the voice frames a part: from which side, and on what, when the part's whole box would keep the camera too far. */
export interface PartFraming {
  viewDir: THREE.Vector3;
  frame?: THREE.Box3;
}

/** A world-space box from its two corners. */
export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): THREE.Box3 =>
  new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));

/**
 * A registry that keeps some boxes off the part's sheet. The kit prints the box of the selected part as « Encombrement », and prints nothing for an empty box. The box of the inside of the core is its sizing, which this lab refuses
 * to give (`src/data/parts/dim-specs.ts`), and the box of what lies in several places measures the layout of a world, not a thing. So a refused part has an empty box while it is the one selected, and only to whoever asks for `bounds`
 * directly: the camera still gets the real one through `frameBounds`, and the overview and the guide read it while nothing is selected. To delete when the kit answers `docs/kit-requests.md`, 21.
 */
export class SheetRegistry extends PartRegistry {
  private framing = 0;

  constructor(
    private readonly refused: ReadonlySet<string>,
    private readonly selected: () => string | null = () => null,
  ) {
    super();
  }

  override bounds(id: string): THREE.Box3 {
    if (!this.framing && this.refused.has(id) && this.selected() === id) return new THREE.Box3();
    return super.bounds(id);
  }

  override frameBounds(id: string): THREE.Box3 {
    this.framing++;
    try {
      return super.frameBounds(id);
    } finally {
      this.framing--;
    }
  }
}

/** An empty marker at a position of `parent`: the label follows it, also during the explode. */
export function anchor(parent: THREE.Object3D, x: number, y: number, z: number, name = 'anchor'): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  o.userData.keep = true;
  parent.add(o);
  return o;
}

export function hotspots(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): LabHotspot[] {
  return defs.map((d) => ({
    partId: d.id.replace(/#.*$/, ''),
    anchor: anchors[d.id],
    label: l(d.fr, d.en),
    get minor() {
      return d.minor || (!!d.wide && typeof window !== 'undefined' && window.innerWidth < WIDE_FROM);
    },
    wide: d.wide,
    goto: d.goto,
  }));
}

/** The moving things are attached to this: the real bounding box of the meshes under an object. */
export const worldBox = (o: THREE.Object3D): THREE.Box3 => new THREE.Box3().setFromObject(o, true);
