import * as THREE from 'three';
import { BENCH, CORE, DUCT, FLUE, MANIFOLD, ROOM } from '../dims';
import { Caps, ClipSet, capMaterialOf, capRects, type Rect } from '../section';
import type { Field, ThermalView } from '../thermal';
import {
  benchCutRects,
  backrestGeometry,
  benchShellGeometry,
  cleanoutGeometry,
  ductJoints,
  ductPath,
  tubeAlong,
} from './bench';
import { CORE_PIECES, buildCore, type CoreBuild, type CorePiece } from './core';
import { FLUE_PIECES, buildDial, buildFlue, type Dial, type FlueBuild, type FluePiece } from './flue';
import { machineMaterials, type MachineMaterials } from './materials';
import { mergeStatic } from '../merge';

// The machine in the room frame, one function: the core moved to its place, the bench, the duct, the chimney, and the section that opens the whole path of the gases. `living-room` and `fire-core` both call it and register different
// pieces. The section has four plane sets (docs/3d.md):
//   core   z ≤ core's plane          the feed, the tunnel, the riser, the drum;
//   left   x ≤ step and z ≤ core's   the casing on the feed's side of the step;
//   right  x ≥ step and z ≤ duct's   the casing past the step: a second drawing of the same mesh;
//   run    not (x < duct's and z > duct's)   the bench, the duct, the chimney: all on the plane of the duct's axis, in both legs, the corner untouched.

export interface MachineAssembly {
  mats: MachineMaterials;
  core: CoreBuild;
  flue: FlueBuild;
  dial: Dial;
  /** The core's frame in the room. */
  coreFrame: THREE.Group;
  shell: THREE.Mesh;
  backrest: THREE.Mesh;
  duct: THREE.Group;
  cleanoutBranch: THREE.Mesh;
  cleanoutCap: THREE.Mesh;
  /** The casing past the step, shown only while the section is on. */
  casingRight: THREE.Mesh;
  clips: { core: ClipSet; left: ClipSet; right: ClipSet; run: ClipSet; manifold: ClipSet };
  caps: Caps;
  setSection(on: boolean): void;
  /** The cob's cut along the run, for the false colour. */
  benchCaps: THREE.Mesh[];
}

const L = BENCH.ductX - BENCH.startX + (BENCH.endZ - BENCH.ductZ);

/** Options: `registered` says which pieces are parts in the calling world, so that their caps go with them. */
export function buildMachine(registered: ReadonlySet<string> = new Set()): MachineAssembly {
  const mats = machineMaterials();
  const core = buildCore(mats);
  const coreFrame = new THREE.Group();
  coreFrame.name = 'core-frame';
  coreFrame.position.set(CORE.x, 0, CORE.z);
  for (const id of CORE_PIECES) coreFrame.add(core.roots[id]);

  const xd = CORE.x + CORE.stepX;
  const zd = CORE.z;
  const zb = BENCH.ductZ;
  const xb = BENCH.ductX;
  const clips = {
    core: new ClipSet([{ normal: [0, 0, -1], at: [0, 0, zd] }]),
    left: new ClipSet([
      { normal: [-1, 0, 0], at: [xd, 0, 0] },
      { normal: [0, 0, -1], at: [0, 0, zd] },
    ]),
    right: new ClipSet([
      { normal: [1, 0, 0], at: [xd, 0, 0] },
      { normal: [0, 0, -1], at: [0, 0, zb] },
    ]),
    run: new ClipSet(
      [
        { normal: [0, 0, -1], at: [0, 0, zb] },
        { normal: [1, 0, 0], at: [xb, 0, 0] },
      ],
      true,
    ),
    manifold: new ClipSet(
      [
        { normal: [-1, 0, 0], at: [xd, 0, 0] },
        { normal: [0, 0, -1], at: [0, 0, zb] },
      ],
      true,
    ),
  };

  // ---- the bench
  const shell = new THREE.Mesh(benchShellGeometry(), mats.earthSkin.clone());
  shell.name = 'cob-bench-shell';
  shell.castShadow = true;
  shell.receiveShadow = true;
  (shell.material as THREE.MeshStandardMaterial).userData.noShare = true;
  const backrest = new THREE.Mesh(backrestGeometry(), mats.earthSkin.clone());
  backrest.name = 'bench-backrest-shell';
  backrest.castShadow = true;
  backrest.receiveShadow = true;

  // ---- the duct, from the mouth of the manifold to the tee, its joints, the branch of the cleanout
  const duct = new THREE.Group();
  duct.name = 'duct-run';
  const path = ductPath(CORE.x + MANIFOLD.x1);
  const tube = new THREE.Mesh(tubeAlong(path, DUCT.r, 28), mats.duct);
  tube.name = 'duct';
  tube.castShadow = true;
  tube.receiveShadow = true;
  const joints = new THREE.Mesh(ductJoints(ductPath(BENCH.startX)), mats.flueBand);
  joints.castShadow = true;
  duct.add(tube, joints);
  const cl = cleanoutGeometry();
  const cleanoutBranch = new THREE.Mesh(cl.branch, mats.duct);
  cleanoutBranch.castShadow = true;
  duct.add(cleanoutBranch);
  const cleanoutCap = new THREE.Mesh(cl.cap, mats.steel.clone());
  cleanoutCap.name = 'cleanout-cap';
  cleanoutCap.castShadow = true;
  cleanoutCap.receiveShadow = true;

  // ---- the chimney. A material holds one set of planes, and the chimney's are the run's: what it would share with the core gets its own copy, or the run's planes take the lid, the seal, the feed's rim and the insulation away with them
  const own = (m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial => {
    const c = m.clone();
    c.userData.noShare = true;
    return c;
  };
  const flueMats: MachineMaterials = {
    ...mats,
    steel: own(mats.steel),
    steelDark: own(mats.steelDark),
    gasket: own(mats.gasket),
    insulation: own(mats.insulation),
  };
  const flue = buildFlue(flueMats);
  const dial = buildDial(flueMats);
  dial.group.position.set(FLUE.x, FLUE.thermometerY, FLUE.z + FLUE.outerR - dial.backZ);

  // ---- the casing past the step: the same geometry, drawn again with the other planes
  const casing = core.roots['core-casing'].children[0] as THREE.Mesh;
  casing.material = mats.earthSkin.clone();
  const casingRight = new THREE.Mesh(casing.geometry, mats.earthSkin.clone());
  casingRight.name = 'casing-past-the-step';
  casingRight.castShadow = false;
  casingRight.receiveShadow = true;
  casingRight.visible = false;
  casingRight.userData.dynamic = true;
  casing.userData.dynamic = true;
  core.roots['core-casing'].add(casingRight);

  // ---- the materials the planes belong to
  clips.left.clipMaterial(casing.material as THREE.Material);
  clips.right.clipMaterial(casingRight.material as THREE.Material);
  for (const id of CORE_PIECES) {
    if (id === 'core-casing' || id === 'manifold' || id === 'manifold-cleanout') continue;
    clips.core.clip(core.roots[id]);
  }
  clips.manifold.clip(core.roots['manifold']);
  for (const o of [shell, backrest, duct, cleanoutCap]) clips.run.clip(o);
  for (const id of FLUE_PIECES) clips.run.clip(flue.roots[id]);

  // ---- caps
  const caps = new Caps();
  const capMats = new Map<string, THREE.Material>();
  const capMat = (k: keyof MachineMaterials): THREE.Material => {
    let m = capMats.get(k);
    if (!m) {
      m = capMaterialOf(mats[k]);
      capMats.set(k, m);
    }
    return m;
  };
  for (const c of core.caps) {
    const place =
      c.plane === 'core'
        ? (a: number, b: number): [number, number, number] => [a, b, 0]
        : c.plane === 'step'
          ? (a: number, b: number): [number, number, number] => [CORE.stepX, b, a]
          : (a: number, b: number): [number, number, number] => [a, b, zb - CORE.z];
    const g = capRects(c.rects, place);
    const direct = c.material === 'linerCut' || c.material === 'gasGapCut' || c.material === 'gasFallCut';
    const mat = direct ? mats[c.material] : capMat(c.material);
    if (direct) mats[c.material].side = THREE.DoubleSide;
    if (registered.has(c.id)) caps.add(c.id, core.roots[c.id as CorePiece], g, mat);
    else caps.addScenery(core.roots[c.id as CorePiece], g, mat, core.roots[c.id as CorePiece]);
  }

  const benchCaps: THREE.Mesh[] = [];
  const hA = (a: number, b: number): [number, number] => [(a - BENCH.startX) / L, b / BENCH.height];
  const hB = (a: number, b: number): [number, number] => [
    (BENCH.ductX - BENCH.startX + (a - BENCH.ductZ)) / L,
    b / BENCH.height,
  ];
  const placeA = (a: number, b: number): [number, number, number] => [a, b, zb];
  const placeB = (a: number, b: number): [number, number, number] => [xb, b, a];
  const legA = benchCutRects('a');
  const legB = benchCutRects('b');
  const benchCap = (g: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh => {
    const cm = registered.has('cob-bench') ? caps.add('cob-bench', shell, g, m) : caps.addScenery(shell, g, m, shell);
    benchCaps.push(cm);
    return cm;
  };
  benchCap(capRects(legA.cob, placeA, hA), capMat('cobCut'));
  benchCap(capRects(legA.plaster, placeA, hA), capMat('plasterCut'));
  benchCap(capRects(legA.barrier, placeA, hA), capMat('barrierCut'));
  benchCap(capRects(legB.cob, placeB, hB), capMat('cobCut'));
  benchCap(capRects(legB.plaster, placeB, hB), capMat('plasterCut'));
  benchCap(capRects(legB.barrier, placeB, hB), capMat('barrierCut'));

  // the hot gases in the riser and in the tunnel, as a section shows them: their colour is the model's
  const place0 = (a: number, b: number): [number, number, number] => [a, b, 0];
  const riserGas = capRects([[-CORE.boreR, CORE.lidTop, CORE.boreR, CORE.riserTop]], place0);
  const tunnelGas = capRects(
    [
      [CORE.feedFar, CORE.tunnelFloor, CORE.boreR, CORE.tunnelRoof],
      [-CORE.boreR, CORE.tunnelRoof, CORE.boreR, CORE.lidTop],
    ],
    place0,
  );
  mats.gasRiserCut.side = THREE.DoubleSide;
  mats.gasTunnelCut.side = THREE.DoubleSide;
  caps.addScenery(core.roots['heat-riser'], riserGas, mats.gasRiserCut, core.roots['heat-riser']);
  caps.addScenery(core.roots['burn-tunnel'], tunnelGas, mats.gasTunnelCut, core.roots['burn-tunnel']);

  // the chimney's wall in the section: insulation between its two skins, on the plane x = xb
  const fz = FLUE.z;
  const teeTop = FLUE.teeY + 0.17;
  const indoorTop = ROOM.height + FLUE.crossingH;
  const walls = (y0: number, y1: number): Rect[] => [
    [fz - FLUE.outerR, y0, fz - FLUE.r, y1],
    [fz + FLUE.r, y0, fz + FLUE.outerR, y1],
  ];
  const placeF = (a: number, b: number): [number, number, number] => [xb, b, a];
  const flueCaps = (id: FluePiece, g: THREE.BufferGeometry) => {
    caps.addScenery(flue.roots[id], g, capMat('insulation'), flue.roots[id]);
  };
  flueCaps('indoor', capRects(walls(teeTop, indoorTop), placeF));
  flueCaps('upper', capRects(walls(indoorTop, FLUE.top), placeF));

  const setSection = (on: boolean) => {
    for (const c of Object.values(clips)) c.set(on);
    casingRight.visible = on;
    core.sticksFront.visible = !on;
  };
  setSection(false);

  return {
    mats,
    core,
    flue,
    dial,
    coreFrame,
    shell,
    backrest,
    duct,
    cleanoutBranch,
    cleanoutCap,
    casingRight,
    clips,
    caps,
    setSection,
    benchCaps,
  };
}

/** The false colour of the machine: each surface reads the number or the field it is made of. Call it after the merges. */
export function thermalMachine(t: ThermalView, m: MachineAssembly, long: Field): void {
  t.patch(m.shell.material as THREE.Material, t.bench);
  t.patch(m.backrest.material as THREE.Material, t.bench);
  for (const c of m.benchCaps) t.patch(c.material as THREE.Material, long);
  const drum = m.core.roots['steel-drum'];
  drum.traverse((o) => {
    const mm = o as THREE.Mesh;
    if (!mm.isMesh) return;
    if (mm.name === 'drum') t.patch(mm.material as THREE.Material, t.drum);
    else t.patch(mm.material as THREE.Material, t.drumLid);
  });
  t.patchAll(m.core.roots['core-casing'], t.casing);
  t.patchAll(m.core.roots['drum-plinth'], t.casing);
  t.patchAll(m.core.roots['manifold'], t.casing);
  t.patchAll(m.core.roots['manifold-cleanout'], t.casing);
  for (const id of FLUE_PIECES) t.patchAll(m.flue.roots[id], t.flue);
  t.patchAll(m.dial.group, t.flue);
  t.patchAll(m.duct, t.duct);
  t.patch(m.cleanoutCap.material as THREE.Material, t.seat);
}

/** Merge the static pieces of the machine, by piece. */
export function mergeMachinePieces(m: MachineAssembly, scope: string): void {
  for (const id of CORE_PIECES) {
    if (id === 'steel-drum' || id === 'core-casing') continue;
    mergeStatic(m.core.roots[id], { name: id, scope, colours: false });
  }
  for (const id of FLUE_PIECES) mergeStatic(m.flue.roots[id], { name: `flue-${id}`, scope, colours: false });
}

export type { FlueBuild, CoreBuild, CorePiece };
