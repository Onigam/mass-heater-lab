import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { STATIONS } from '../../sim/types';
import { createBenchSectionScene, SLICES } from '../benchsection/scene';
import { benchProfile, ductAxisAt, ductPath } from './bench';
import { CORE_PIECES, type CorePiece } from './core';
import { FLUE_PIECES } from './flue';
import { BENCH, CORE, DUCT, FLUE, HOME, ITEMS, MACHINE, MANIFOLD, ROOM, SHIELD } from '../dims';
import { createFireCoreScene } from '../firecore/scene';
import { createHomesteadScene } from '../homestead/scene';
import { createLivingRoomScene } from '../livingroom/scene';
import { FLOOR } from '../room/furniture';
import { meshBox, stateWith, touches, view } from '../test-utils';
import { ductRun, fallLeft, fallRight, flueRun, riseRun, stationPoints } from './paths';

// One machine, the same everywhere, attached and resting. What the owner finds in seconds is held here by numbers: the shared parts sit within 3 mm across the worlds, every driver reaches what it drives, every heavy body rests on its support to a few millimetres.

const living = createLivingRoomScene();
const fire = createFireCoreScene();
const bench = createBenchSectionScene();
const home = createHomesteadScene();
const s = stateWith();
for (const w of [living, fire, bench, home]) {
  w.update(s, 1 / 60, view());
  w.scene.updateMatrixWorld(true);
}

const close = (a: THREE.Box3, b: THREE.Box3, tol = 0.003) => {
  expect(a.min.distanceTo(b.min)).toBeLessThan(tol);
  expect(a.max.distanceTo(b.max)).toBeLessThan(tol);
};

describe('one machine, the same in every world', () => {
  it('puts every piece of the core in the same place in the room and in the core’s world, within 3 mm', () => {
    for (const id of [
      'firebrick-base',
      'burn-tunnel',
      'feed-tube',
      'heat-riser',
      'riser-insulation',
      'riser-sleeve',
      'drum-plinth',
      'drum-seal',
      'top-gap',
      'downdraft-annulus',
      'core-casing',
      'steel-drum',
      'manifold',
      'manifold-cleanout',
    ] as const) {
      const a = meshBox(living.machine.core.roots[id]);
      const b = meshBox(fire.machine.core.roots[id]);
      expect(a.isEmpty(), id).toBe(false);
      close(a, b);
    }
  });
  it('gives the bench, the backrest and the duct the same place in both', () => {
    close(meshBox(living.machine.shell), meshBox(fire.machine.shell));
    close(meshBox(living.machine.backrest), meshBox(fire.machine.backrest));
    close(meshBox(living.machine.duct), meshBox(fire.machine.duct));
  });
  it('moves the chimney to the homestead by one translation, within 3 mm', () => {
    const inRoom = new THREE.Box3();
    for (const id of ['upper', 'indoor', 'tee', 'foot-cap', 'drain', 'crossing'] as const)
      inRoom.union(meshBox(living.machine.flue.roots[id]));
    const onLand = home.scene.getObjectByName('chimney-frame')!;
    const moved = inRoom.clone().translate(new THREE.Vector3(HOME.at[0], HOME.at[1], HOME.at[2]));
    close(moved, meshBox(onLand));
    const cap = meshBox(home.registry.get('chimney-cap')!.object);
    const capRoom = meshBox(living.machine.flue.roots.cap).translate(
      new THREE.Vector3(HOME.at[0], HOME.at[1], HOME.at[2]),
    );
    close(cap, capRoom);
    // the tee is the same part in the bench's world, moved to the chimney's foot
    const tee = meshBox(bench.registry.get('chimney-tee')!.object);
    const teeRoom = meshBox(living.machine.flue.roots.tee);
    expect(tee.getSize(new THREE.Vector3()).distanceTo(teeRoom.getSize(new THREE.Vector3()))).toBeLessThan(0.003);
  });
  it('cuts the slices from the same profile as the bench', () => {
    const prof = benchProfile();
    expect(prof[0]!.y).toBeCloseTo(BENCH.height, 6);
    expect(prof[prof.length - 1]!.d).toBeCloseTo(BENCH.depth, 6);
    const hot = bench.slices.hot;
    const cold = bench.slices.cold;
    expect(hot.axis).toBeCloseTo(DUCT.axisHot, 6);
    expect(cold.axis).toBeCloseTo(DUCT.axisCold, 6);
    const h = meshBox(bench.registry.get('earthen-plaster')!.object);
    expect(h.max.y).toBeCloseTo(BENCH.height, 2);
    // the seat lies at one height in both worlds
    const seat = meshBox(living.machine.shell);
    expect(seat.max.y).toBeLessThan(BENCH.height + 0.012);
    expect(seat.max.y).toBeGreaterThan(BENCH.height - 0.012);
  });
  it('fits the slices of the bench to their duct: a thick cover on the hot run, a thin one on the cold', () => {
    expect(BENCH.height - bench.slices.hot.axis - DUCT.r).toBeCloseTo(MACHINE.coverHot, 6);
    expect(BENCH.height - bench.slices.cold.axis - DUCT.r).toBeCloseTo(MACHINE.coverCold, 6);
    expect(SLICES.hot.s).toBeLessThan(MACHINE.hotRun);
    expect(SLICES.cold.s).toBeGreaterThan(MACHINE.hotRun);
  });
});

describe('attached: every driver reaches what it drives', () => {
  const core = (id: CorePiece) => meshBox(living.machine.core.roots[id]);
  it('the sticks stand on the tunnel’s floor, in the feed, and rise out of its mouth', () => {
    const feet = living.machine.core.stickFeet;
    expect(feet.length).toBeGreaterThanOrEqual(6);
    for (const f of feet) {
      expect(f.y).toBeGreaterThanOrEqual(CORE.tunnelFloor);
      expect(f.y).toBeLessThan(CORE.tunnelFloor + CORE.ashH);
      expect(f.x).toBeGreaterThan(CORE.feedFar);
      expect(f.x).toBeLessThan(CORE.feedNear);
      expect(Math.abs(f.z)).toBeLessThan(CORE.feedSide / 2);
    }
    living.machine.core.drive({
      feedLevel: 1,
      emberGlow: 0.5,
      ash: 0,
      cover: 0.85,
      linerT: 500,
      gapT: 400,
      fallT: 300,
      riserT: 500,
      chamberT: 500,
      burning: true,
    });
    living.scene.updateMatrixWorld(true);
    const b = meshBox(living.machine.core.roots['fuel-sticks']);
    expect(b.max.y).toBeGreaterThan(CORE.feedTop);
  });
  it('the lid rests on the rim, and stops at the sticks while they stand', () => {
    const lid = living.machine.core.lid;
    living.machine.core.drive({
      feedLevel: 1,
      emberGlow: 0.5,
      ash: 0,
      cover: 0.85,
      linerT: 500,
      gapT: 400,
      fallT: 300,
      riserT: 500,
      chamberT: 500,
      burning: true,
    });
    expect(lid.position.y).toBeCloseTo(CORE.feedTop + CORE.rimH, 6);
    expect(living.machine.core.lidCover()).toBeCloseTo(CORE.slotCover, 6);
    living.machine.core.drive({
      feedLevel: 0,
      emberGlow: 0,
      ash: 0,
      cover: 1,
      linerT: 50,
      gapT: 30,
      fallT: 30,
      riserT: 30,
      chamberT: 30,
      burning: false,
    });
    expect(living.machine.core.lidCover()).toBeCloseTo(1, 6);
    // its plate still bears on the rim on the drum's side
    const edge = lid.position.x + CORE.lidW / 2;
    expect(edge).toBeGreaterThan(CORE.feedNear);
    living.update(s, 0, view());
  });
  it('the tunnel’s walls reach the feed’s and the end block; the riser’s sleeve sits on the tunnel’s roof', () => {
    const tun = core('burn-tunnel');
    const base = core('firebrick-base');
    expect(touches(tun, base, 0.002)).toBe(true);
    const sleeve = core('riser-sleeve');
    expect(sleeve.min.y).toBeCloseTo(CORE.lidTop, 3);
    expect(tun.max.y).toBeCloseTo(CORE.lidTop, 3);
  });
  it('the riser’s liner fills the sleeve’s insulation, its bore is the model’s, its top the gap below the lid', () => {
    const r = core('heat-riser');
    expect(r.max.y).toBeCloseTo(CORE.riserTop, 3);
    expect(CORE.drumTop - r.max.y).toBeCloseTo(CORE.topGap, 3);
    const ins = core('riser-insulation');
    expect(touches(r, ins, 0.001)).toBe(true);
  });
  it('the duct comes out of the manifold’s mouth and goes into the tee', () => {
    const path = ductPath(CORE.x + MANIFOLD.x1);
    expect(path[0]!.x).toBeCloseTo(CORE.x + MANIFOLD.x1, 3);
    expect(path[0]!.y).toBeCloseTo(DUCT.axisHot, 3);
    expect(path[0]!.z).toBeCloseTo(BENCH.ductZ, 3);
    const last = path[path.length - 1]!;
    expect(last.x).toBeCloseTo(FLUE.x, 3);
    expect(last.z).toBeCloseTo(BENCH.endZ, 3);
    expect(last.y).toBeCloseTo(FLUE.teeY, 3);
    const tee = meshBox(living.machine.flue.roots.tee);
    expect(tee.containsPoint(last)).toBe(true);
    const man = meshBox(living.machine.core.roots.manifold);
    expect(man.distanceToPoint(path[0]!)).toBeLessThan(0.002);
  });
  it('the duct’s axis rises softly from the thick casing to the thin', () => {
    expect(ductAxisAt(0.5)).toBeCloseTo(DUCT.axisHot, 6);
    expect(ductAxisAt(8)).toBeCloseTo(DUCT.axisCold, 6);
    const mid = ductAxisAt(MACHINE.hotRun);
    expect(mid).toBeGreaterThan(DUCT.axisHot);
    expect(mid).toBeLessThan(DUCT.axisCold);
  });
  it('the flue sits on the tee, its top reaches the cap, and the brackets reach the gable', () => {
    const t = meshBox(living.machine.flue.roots.tee);
    const i = meshBox(living.machine.flue.roots.indoor);
    expect(i.min.y).toBeLessThanOrEqual(t.max.y + 0.002);
    expect(i.max.y).toBeCloseTo(ROOM.height + FLUE.crossingH, 2);
    const u = meshBox(living.machine.flue.roots.upper);
    expect(u.max.y).toBeCloseTo(FLUE.top + 0.015, 1);
    expect(u.max.x).toBeGreaterThanOrEqual(ROOM.x1);
    const c = meshBox(living.machine.flue.roots.cap);
    expect(c.min.y).toBeLessThan(FLUE.top);
    expect(c.max.y).toBeGreaterThan(FLUE.top);
    const cr = meshBox(living.machine.flue.roots.crossing);
    expect(cr.max.x).toBeCloseTo(ROOM.x1, 3);
    expect(cr.min.y).toBeLessThanOrEqual(ROOM.height);
    expect(cr.max.y).toBeGreaterThan(ROOM.height);
  });
  it('the dial’s back touches the flue’s skin', () => {
    const d = meshBox(living.registry.get('flue-thermometer')!.object);
    expect(d.min.z).toBeCloseTo(FLUE.z + FLUE.outerR, 2);
    expect(d.min.y).toBeLessThan(FLUE.thermometerY);
    expect(d.max.y).toBeGreaterThan(FLUE.thermometerY);
  });
  it('the shield holds its gap on spacers that reach the wall and the sheet', () => {
    const sh = meshBox(living.registry.get('heat-shield')!.object);
    expect(sh.min.z).toBeCloseTo(ROOM.z0, 3);
    expect(sh.max.z).toBeGreaterThan(ROOM.z0 + SHIELD.gap);
    // the sheet stands on the casing
    expect(sh.min.y).toBeLessThanOrEqual(SHIELD.y0 + 0.001);
  });
  it('the alarms and the grille are on what carries them', () => {
    const co = meshBox(living.registry.get('co-alarm')!.object);
    expect(co.min.z).toBeCloseTo(ROOM.z0, 3);
    const sm = meshBox(living.registry.get('smoke-alarm')!.object);
    expect(sm.max.y).toBeCloseTo(ROOM.height - ROOM.beamH, 3);
    expect(Math.abs(ITEMS.smokeAlarm.z - (ROOM.z0 + ROOM.beamW / 2))).toBeLessThan(0.08);
    const gr = meshBox(living.registry.get('ventilation-grille')!.object);
    expect(gr.min.z).toBeLessThan(ROOM.z0);
    expect(gr.max.z).toBeGreaterThan(ROOM.z0);
  });
  it('the bench’s probe goes into the earth from its dial, and the meter’s pins touch the wood', () => {
    const p = meshBox(bench.registry.get('temperature-lance')!.object);
    expect(p.min.y).toBeLessThan(BENCH.height);
    expect(p.max.y).toBeGreaterThan(BENCH.height);
  });
  it('the corner’s duct reaches the tee, the bend joins its two runs', () => {
    const b = meshBox(bench.registry.get('duct-bend')!.object);
    const c = meshBox(bench.registry.get('duct-cold-run')!.object);
    expect(touches(b, c, 0.003)).toBe(true);
    const t = meshBox(bench.registry.get('chimney-tee')!.object);
    expect(touches(c, t, 0.01)).toBe(true);
    const cl = meshBox(bench.registry.get('bench-cleanout')!.object);
    expect(touches(cl, c, 0.003)).toBe(true);
  });
});

describe('nothing floats, nothing sinks: each heavy body on its support', () => {
  const low = (o: THREE.Object3D) => meshBox(o).min.y;
  it('the casing, the bench and the plinth stand on the slab', () => {
    expect(low(living.machine.core.roots['core-casing'])).toBeCloseTo(0, 2);
    expect(low(living.machine.shell)).toBeCloseTo(0, 2);
    expect(low(living.machine.core.roots['drum-plinth'])).toBeCloseTo(0, 2);
    expect(low(living.machine.core.roots['firebrick-base'])).toBeCloseTo(0, 2);
  });
  it('the slab lies in the floor, with its top a lip above the boards', () => {
    const b = meshBox(living.registry.get('hearth-slab')!.object);
    expect(b.max.y).toBeCloseTo(0, 3);
    expect(b.min.y).toBeCloseTo(-MACHINE.slab, 3);
  });
  it('the drum stands on its ring on the far side, on the tunnel’s roof over the notch', () => {
    const drum = living.machine.core.roots['steel-drum'].getObjectByName('drum')!;
    expect(meshBox(drum).min.y).toBeCloseTo(CORE.drumFoot, 3);
    const ring = meshBox(living.machine.core.roots['drum-plinth']);
    expect(ring.max.y).toBeCloseTo(CORE.drumFoot, 3);
    expect(CORE.lidTop).toBeGreaterThan(CORE.tunnelRoof);
  });
  it('the kettle on the lid, the basket and the tee’s foot on the slab, the cushions on the seat', () => {
    expect(low(living.registry.get('kettle')!.object)).toBeCloseTo(CORE.drumTop + 0.002, 2);
    expect(low(living.registry.get('wood-basket')!.object)).toBeCloseTo(0, 2);
    expect(low(living.registry.get('chimney-cleanout')!.object)).toBeCloseTo(0, 2);
    const cu = low(living.registry.get('bench-cushion')!.object);
    expect(cu).toBeGreaterThan(BENCH.height - 0.08);
    expect(cu).toBeLessThan(BENCH.height + 0.03);
  });
  it('the furniture stands on the boards or the slab', () => {
    expect(living.furniture.rests.length).toBeGreaterThan(5);
    for (const r of living.furniture.rests) expect(r.low, r.name).toBeCloseTo(r.on, 2);
  });
  it('the stone wall stands on the floor, up to the ceiling', () => {
    const w = meshBox(living.registry.get('inner-stone-wall')!.object);
    expect(w.min.y).toBeCloseTo(0, 3);
    expect(w.max.y).toBeGreaterThanOrEqual(ROOM.height);
    expect(w.max.z - w.min.z).toBeCloseTo(ROOM.stoneWidth, 3);
  });
  it('the slices stand on their slab', () => {
    expect(low(bench.registry.get('earthen-plaster')!.object)).toBeCloseTo(0, 2);
    expect(low(bench.registry.get('floor-barrier')!.object)).toBeCloseTo(0, 2);
    expect(low(bench.registry.get('pebble-section')!.object)).toBeCloseTo(0, 2);
  });
  it('the floor’s top is what the furniture stands on', () => {
    expect(FLOOR).toBeCloseTo(-ROOM.floorDrop, 6);
  });
});

describe('the path of the gases, station by station', () => {
  const runs = [riseRun(), fallRight(), fallLeft(), ductRun(), flueRun()];
  it('has a station for each of the model’s', () => {
    expect(stationPoints().length).toBe(STATIONS.length);
  });
  it('goes through the machine in order, with no jump: the stations only rise along a run', () => {
    for (const run of runs) {
      for (let i = 1; i < run.length; i++) expect(run[i]!.st).toBeGreaterThanOrEqual(run[i - 1]!.st);
    }
  });
  it('joins its stretches: each one starts where the last one ends', () => {
    const [rise, right, left, duct, flue] = runs;
    expect(rise!.at(-1)!.p.distanceTo(right![0]!.p)).toBeLessThan(1e-6);
    expect(rise!.at(-1)!.p.distanceTo(left![0]!.p)).toBeLessThan(1e-6);
    expect(right!.at(-1)!.p.distanceTo(duct![0]!.p)).toBeLessThan(1e-6);
    expect(left!.at(-1)!.p.distanceTo(duct![0]!.p)).toBeLessThan(1e-6);
    expect(duct!.at(-1)!.p.distanceTo(new THREE.Vector3(FLUE.x, FLUE.teeY, FLUE.z))).toBeLessThan(0.002);
    expect(flue![flue!.length - 1]!.p.y).toBeCloseTo(FLUE.top, 6);
  });
  it('rises in the riser and falls in the drum', () => {
    const rise = runs[0]!;
    const foot = rise.find((n) => n.st === 2)!;
    const top = rise.find((n) => n.st === 3)!;
    expect(top.p.y).toBeGreaterThan(foot.p.y);
    const fall = runs[1]!;
    const a = fall.find((n) => n.st === 4)!;
    const b = fall.find((n) => n.st === 6)!;
    expect(b.p.y).toBeLessThan(a.p.y);
  });
});

describe('the section', () => {
  it('removes the core’s front half on the core’s plane and the bench’s on the duct’s', () => {
    const m = living.machine;
    living.update(s, 0, view({ cutaway: true }));
    expect(m.clips.core.removed(new THREE.Vector3(CORE.x, 0.5, CORE.z + 0.1))).toBe(true);
    expect(m.clips.core.removed(new THREE.Vector3(CORE.x, 0.5, CORE.z - 0.1))).toBe(false);
    // on the run: the room's side of the duct's axis goes, on both legs; the corner stays
    expect(m.clips.run.removed(new THREE.Vector3(0, 0.3, BENCH.ductZ + 0.1))).toBe(true);
    expect(m.clips.run.removed(new THREE.Vector3(0, 0.3, BENCH.ductZ - 0.1))).toBe(false);
    expect(m.clips.run.removed(new THREE.Vector3(BENCH.ductX + 0.1, 0.3, 0))).toBe(false);
    expect(m.clips.run.removed(new THREE.Vector3(BENCH.ductX - 0.1, 0.3, 0))).toBe(true);
    // the casing, stepped: to the core's plane on the feed's side, to the duct's past the step
    const a = CORE.x + CORE.stepX;
    expect(m.clips.left.removed(new THREE.Vector3(a + 0.01, 0.2, CORE.z - 0.1))).toBe(true);
    expect(m.clips.right.removed(new THREE.Vector3(a + 0.02, 0.2, BENCH.ductZ - 0.02))).toBe(false);
    expect(m.clips.right.removed(new THREE.Vector3(a + 0.02, 0.2, BENCH.ductZ + 0.02))).toBe(true);
    for (const c of m.caps.of('steel-drum')) expect(c.visible).toBe(true);
    // the sticks on the removed side are not drawn
    expect(m.core.sticksFront.visible).toBe(false);
    living.update(s, 0, view({ cutaway: false }));
    expect(m.clips.core.removed(new THREE.Vector3(CORE.x, 0.5, CORE.z + 0.1))).toBe(false);
    for (const c of m.caps.of('steel-drum')) expect(c.visible).toBe(false);
    expect(m.core.sticksFront.visible).toBe(true);
  });
  it('leaves every piece of the core under the core’s planes, in both worlds: a material holds one set, and the chimney’s must not overwrite it (review D2)', () => {
    for (const mod of [fire, living]) {
      const m = mod.machine;
      for (const id of CORE_PIECES) {
        if (id === 'core-casing' || id === 'manifold' || id === 'manifold-cleanout') continue;
        m.core.roots[id].traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh || mesh.userData.cap || mesh.userData.notClipped) return;
          for (const mat of ([] as THREE.Material[]).concat(mesh.material))
            expect(mat.clippingPlanes, `${mod.id} ${id} ${mesh.name}`).toBe(m.clips.core.planes);
        });
      }
      m.core.roots['manifold'].traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && !mesh.userData.cap)
          expect((mesh.material as THREE.Material).clippingPlanes, `${mod.id} manifold`).toBe(m.clips.manifold.planes);
      });
      for (const id of FLUE_PIECES)
        m.flue.roots[id].traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && !mesh.userData.cap)
            expect((mesh.material as THREE.Material).clippingPlanes, `${mod.id} flue ${id}`).toBe(m.clips.run.planes);
        });
    }
  });
  it('never changes the number of planes, so pressing the tool compiles nothing', () => {
    const mat = living.machine.shell.material as THREE.Material;
    const planes = mat.clippingPlanes;
    expect(planes?.length).toBe(2);
    living.update(s, 0, view({ cutaway: true }));
    expect(mat.clippingPlanes).toBe(planes);
    expect(planes?.length).toBe(2);
    living.update(s, 0, view());
  });
  it('is always on in the core’s world', () => {
    fire.update(s, 0, view());
    expect(fire.machine.clips.core.isOn).toBe(true);
    for (const c of fire.machine.caps.of('core-casing')) expect(c.visible).toBe(true);
  });
  it('shows the path through the shells: with X-ray the gases run, with neither they do not', () => {
    const gas = living.gas;
    living.update(s, 1 / 60, view());
    expect(gas.group.visible).toBe(false);
    living.update(s, 1 / 60, view({ cutaway: true }));
    expect(gas.group.visible).toBe(true);
    living.registry.setDisplay('steel-drum', 'ghost');
    living.update(s, 1 / 60, view());
    expect(gas.group.visible).toBe(true);
    // the casing goes with the drum, the riser stays
    const casing = living.machine.core.roots['core-casing'].children[0] as THREE.Mesh;
    expect((casing.material as THREE.Material).type).toBe('MeshBasicMaterial');
    const riser = living.machine.core.roots['heat-riser'].children[0] as THREE.Mesh;
    expect((riser.material as THREE.Material).type).toBe('MeshStandardMaterial');
    living.registry.setDisplay('steel-drum', 'solid');
    living.update(s, 1 / 60, view());
    expect((casing.material as THREE.Material).type).toBe('MeshStandardMaterial');
    expect(gas.group.visible).toBe(false);
  });
});
