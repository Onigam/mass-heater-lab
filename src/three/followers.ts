import * as THREE from 'three';
import { GHOST, type PartRegistry } from '@onigam/lab-kit/three';

// What is drawn with a part without being one. A world may show a piece of the machine as scenery (the riser inside the drum in `living-room`, the drum over the riser in `fire-core`), because each id lives in one world. Such a
// piece follows a part: it moves with its explode if it says so, it hides when the part is hidden, and a piece that is a shell goes to the ghost when the part does, so that X-ray and isolate see through it.

export interface Follower {
  part: string;
  root: THREE.Object3D;
  /** Goes to the ghost with its part (a shell). Otherwise it stays solid in X-ray: what the shell shows. */
  shell: boolean;
  /** Share of the part's explode it moves with. */
  explode: number;
  base: THREE.Vector3;
  meshes: { mesh: THREE.Mesh; solid: THREE.Material | THREE.Material[]; cast: boolean }[];
  state: string;
  /** Goes to the ghost whatever its part says. */
  forced: boolean;
}

export class Followers {
  readonly list: Follower[] = [];

  add(part: string, root: THREE.Object3D, o: { shell?: boolean; explode?: number } = {}): void {
    const meshes: Follower['meshes'] = [];
    root.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh && !m.userData.cap) meshes.push({ mesh: m, solid: m.material, cast: m.castShadow });
    });
    this.list.push({
      part,
      root,
      shell: o.shell ?? false,
      explode: o.explode ?? 0,
      base: root.position.clone(),
      meshes,
      state: 'solid',
      forced: false,
    });
  }

  /** Open or close a shell whatever its part says. */
  force(root: THREE.Object3D, on: boolean): void {
    for (const f of this.list) if (f.root === root) f.forced = on;
  }

  update(reg: PartRegistry): void {
    for (const f of this.list) {
      const e = reg.get(f.part);
      if (!e) continue;
      f.root.visible = e.display !== 'hidden';
      if (f.explode) f.root.position.copy(f.base).addScaledVector(e.explode, e.factor * f.explode);
      const want = f.forced || (f.shell && e.display !== 'solid') ? 'ghost' : 'solid';
      if (want === f.state) continue;
      f.state = want;
      for (const { mesh, solid, cast } of f.meshes) {
        mesh.material = want === 'ghost' ? GHOST : solid;
        mesh.castShadow = want === 'ghost' ? false : cast;
      }
    }
  }
}
