import * as THREE from 'three';
import {
  earthMap,
  ashMap,
  barkMap,
  brickMap,
  cobMap,
  concreteMap,
  drumPaintMap,
  endGrainMap,
  plasterMap,
  spiralMap,
  renderMap,
  tiled,
} from '../textures';

// The materials of the machine. Each world makes its own set: a world's section sets its planes on them. The maps are shared, generated once. UVs are in metres, so a `repeat` of 1 / tile keeps every material at its true scale.

export interface MachineMaterials {
  /** The plastered earth of the bench and the casing. */
  earthSkin: THREE.MeshStandardMaterial;
  /** The earth as a section shows it, its plaster, its layer on the slab. */
  cobCut: THREE.MeshStandardMaterial;
  plasterCut: THREE.MeshStandardMaterial;
  barrierCut: THREE.MeshStandardMaterial;
  brick: THREE.MeshStandardMaterial;
  brickCut: THREE.MeshStandardMaterial;
  /** The refractory liner of the riser: its glow follows the model. */
  liner: THREE.MeshStandardMaterial;
  linerCut: THREE.MeshStandardMaterial;
  insulation: THREE.MeshStandardMaterial;
  drum: THREE.MeshStandardMaterial;
  drumInside: THREE.MeshStandardMaterial;
  sleeve: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  steelDark: THREE.MeshStandardMaterial;
  duct: THREE.MeshStandardMaterial;
  ductInside: THREE.MeshStandardMaterial;
  flue: THREE.MeshStandardMaterial;
  flueBand: THREE.MeshStandardMaterial;
  gasket: THREE.MeshStandardMaterial;
  ash: THREE.MeshStandardMaterial;
  ember: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  endGrain: THREE.MeshStandardMaterial;
  /** The gases in a volume: their colour and thickness follow the model. */
  gasGap: THREE.MeshStandardMaterial;
  gasFall: THREE.MeshStandardMaterial;
  gasGapCut: THREE.MeshStandardMaterial;
  gasFallCut: THREE.MeshStandardMaterial;
  flueInside: THREE.MeshStandardMaterial;
  gasRiserCut: THREE.MeshStandardMaterial;
  gasTunnelCut: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
}

const std = (o: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => {
  const m = new THREE.MeshStandardMaterial(o);
  return m;
};

const noShare = <T extends THREE.Material>(m: T): T => {
  m.userData.noShare = true;
  return m;
};

/** A gas has no surface for the room's light to fall on: all of its colour is its own, set by the model. */
const gasMat = (emissive: number): THREE.MeshStandardMaterial =>
  noShare(
    std({
      color: 0x000000,
      emissive,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
    }),
  );

export function machineMaterials(): MachineMaterials {
  const cob = cobMap();
  const plaster = plasterMap();
  const earth = earthMap();
  const brick = brickMap();
  const steelMap = renderMap();
  const skin = noShare(
    std({
      color: 0xe6d6c2,
      map: tiled(earth, 1 / 1.1),
      bumpMap: tiled(earth, 1 / 1.1),
      bumpScale: 0.5,
      roughness: 0.94,
    }),
  );
  return {
    earthSkin: skin,
    cobCut: noShare(std({ color: 0xffffff, map: tiled(cob, 1 / 0.6), roughness: 0.96 })),
    plasterCut: noShare(std({ color: 0xcfa87f, map: tiled(plaster, 1 / 0.5), roughness: 0.9 })),
    barrierCut: noShare(std({ color: 0x8f8778, map: tiled(concreteMap(), 1 / 0.4), roughness: 0.97 })),
    brick: noShare(
      std({
        color: 0xffffff,
        map: tiled(brick, 1 / 0.44, 1 / 0.24),
        bumpMap: tiled(brick, 1 / 0.44, 1 / 0.24),
        bumpScale: 0.5,
        roughness: 0.93,
      }),
    ),
    brickCut: noShare(std({ color: 0xffffff, map: tiled(brick, 1 / 0.44, 1 / 0.24), roughness: 0.95 })),
    liner: noShare(
      std({
        color: 0x7a6856,
        map: tiled(steelMap, 1 / 0.3),
        roughness: 0.95,
        emissive: 0xff5a10,
        emissiveIntensity: 0,
      }),
    ),
    linerCut: noShare(std({ color: 0xa08a6e, roughness: 0.95, emissive: 0xff5a10, emissiveIntensity: 0 })),
    insulation: noShare(std({ color: 0xe6d8b8, map: tiled(steelMap, 1 / 0.2), roughness: 1 })),
    drum: noShare(std({ color: 0xffffff, map: tiled(drumPaintMap(), 1 / 1.2), roughness: 0.62, metalness: 0.38 })),
    drumInside: noShare(std({ color: 0x2e2a26, roughness: 0.9, metalness: 0.2 })),
    sleeve: noShare(std({ color: 0x77706a, map: tiled(steelMap, 1 / 0.5), roughness: 0.55, metalness: 0.65 })),
    steel: std({ color: 0x8d8f90, roughness: 0.45, metalness: 0.72 }),
    steelDark: std({ color: 0x2c2c2d, roughness: 0.58, metalness: 0.5 }),
    duct: noShare(
      std({ color: 0xffffff, map: tiled(spiralMap(), 1 / (Math.PI * 0.2), 1 / 0.3), roughness: 0.46, metalness: 0.72 }),
    ),
    ductInside: noShare(std({ color: 0x3a312a, roughness: 0.95, metalness: 0.1 })),
    flue: noShare(std({ color: 0xb8babb, roughness: 0.34, metalness: 0.86 })),
    flueBand: std({ color: 0x8c8e8f, roughness: 0.4, metalness: 0.8 }),
    gasket: noShare(std({ color: 0xd9d4c6, roughness: 1 })),
    ash: noShare(std({ color: 0xffffff, map: tiled(ashMap(), 1 / 0.25), roughness: 1 })),
    ember: noShare(std({ color: 0x1b1412, roughness: 0.95, emissive: 0xff3a08, emissiveIntensity: 0 })),
    bark: noShare(std({ color: 0xa8957c, map: barkMap(), roughness: 0.96 })),
    endGrain: noShare(std({ color: 0xffffff, map: endGrainMap(), roughness: 0.9 })),
    gasGap: gasMat(0xff7a2a),
    gasFall: gasMat(0xff6a20),
    gasGapCut: gasMat(0xff7a2a),
    gasFallCut: gasMat(0xff6a20),
    gasRiserCut: gasMat(0xff7a22),
    gasTunnelCut: gasMat(0xff6a18),
    flueInside: noShare(std({ color: 0x4a4038, roughness: 0.92, metalness: 0.2 })),
    concrete: noShare(std({ color: 0xc9c4b8, map: tiled(concreteMap(), 1 / 1.2), roughness: 0.94 })),
  };
}
