import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { ROOM } from '../dims';
import { spruceGeometry, spruceTrunk } from '../homestead/vegetation';
import { patchSnow } from '../homestead/snow';
import { spruceBarkMap } from '../textures';

// What the windows look at, and what lies around the stage: snow on the ground, dark spruces that fade into the evening. The same trees as `homestead`, a few of them. No part here.

export interface Exterior {
  group: THREE.Group;
  ground: THREE.Mesh;
  /** The spruces: the thermal view takes them away, as they are under its ramp and the stage's top is open. */
  trees: THREE.Object3D[];
}

export function buildExterior(): Exterior {
  const group = new THREE.Group();
  group.name = 'exterior';
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 1 });
  groundMat.userData.noShare = true;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(48, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -ROOM.floorDepth;
  ground.receiveShadow = true;
  ground.raycast = () => {};
  ground.name = 'snow';
  group.add(ground);
  const r = rng(53);
  const spots: [number, number, number, number][] = [];
  let tries = 0;
  while (spots.length < 30 && tries++ < 800) {
    const x = (r() - 0.5) * 66;
    const z = -18 - r() * 24;
    spots.push([x, z, 5 + 5 * r(), r() * 6.28]);
  }
  const boughs = new THREE.InstancedMesh(
    spruceGeometry(12, 7, 9, true),
    patchSnow(
      new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
      { lo: 0.25, hi: 0.72, gain: 0.72, far: [130, 320], mean: [0.05, 0.085, 0.055] },
    ),
    spots.length,
  );
  const trunks = new THREE.InstancedMesh(
    spruceTrunk(),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: spruceBarkMap(), vertexColors: true, roughness: 1 }),
    spots.length,
  );
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const c = new THREE.Color();
  spots.forEach(([x, z, h, rot], i) => {
    q.setFromAxisAngle(up, rot);
    pos.set(x, -ROOM.floorDepth - 0.05, z);
    scl.set(h, h, h);
    m4.compose(pos, q, scl);
    boughs.setMatrixAt(i, m4);
    trunks.setMatrixAt(i, m4);
    boughs.setColorAt(i, c.setHSL(0.32, 0.25, 0.78 + 0.2 * r()));
    trunks.setColorAt(i, c.set(0xffffff));
  });
  boughs.frustumCulled = false;
  trunks.frustumCulled = false;
  group.add(boughs, trunks);
  return { group, ground, trees: [boughs, trunks] };
}
