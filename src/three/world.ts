import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import type { Hotspot } from '@onigam/lab-kit/three';

// What the worlds share: the hotspot declarations.

export interface HotspotDef {
  /** The part; a suffix `#name` lets a part have several labels. */
  id: string;
  fr: string;
  en: string;
  minor?: boolean;
  /** World to open when the label is clicked. */
  goto?: string;
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

export function hotspots(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): Hotspot[] {
  return defs.map((d) => ({
    partId: d.id.replace(/#.*$/, ''),
    anchor: anchors[d.id],
    label: l(d.fr, d.en),
    minor: d.minor,
    goto: d.goto,
  }));
}

/** The moving things are attached to this: the real bounding box of the meshes under an object. */
export const worldBox = (o: THREE.Object3D): THREE.Box3 => new THREE.Box3().setFromObject(o, true);
