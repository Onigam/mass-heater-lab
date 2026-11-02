import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { THERMAL_RAMP, benchColumns, benchRows, MACHINE } from '../sim/machine';
import { heatRgb } from '../sim/thermal/ramp';
import { createBenchSectionScene } from './benchsection/scene';
import { createLivingRoomScene } from './livingroom/scene';
import { Field, ThermalView, cellT, rampColor, sliceT } from './thermal';
import { stateWith, view } from './test-utils';

// The false colour, without a browser: the ramp is the model's, a colour means the same everywhere and stays apart through the kit's tone curves; the fields hold the model's numbers.

/** The tone curves of the kit, on a linear colour, as in the sand lab's test. */
const aces = (c: number, exposure: number): number => {
  const x = c * exposure * 0.6;
  return Math.min(1, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
};

describe('the ramp', () => {
  it('is the model’s, 15 to 65 °C', () => {
    expect(THERMAL_RAMP[0]![0]).toBe(15);
    expect(THERMAL_RAMP[THERMAL_RAMP.length - 1]![0]).toBe(65);
    const c = rampColor(40);
    const r = heatRgb(THERMAL_RAMP, 40);
    expect(c.r).toBeCloseTo(r[0], 5);
    expect(c.g).toBeCloseTo(r[1], 5);
    expect(c.b).toBeCloseTo(r[2], 5);
  });
  it('keeps the bench’s temperatures apart through the tone curve', () => {
    for (let T = 20; T <= 60; T += 5) {
      const a = rampColor(T);
      const b = rampColor(T + 5);
      const d = Math.hypot(
        aces(a.r, 1.08) - aces(b.r, 1.08),
        aces(a.g, 1.08) - aces(b.g, 1.08),
        aces(a.b, 1.08) - aces(b.b, 1.08),
      );
      expect(d, `${T} °C and ${T + 5} °C`).toBeGreaterThan(0.03);
    }
  });
});

describe('the fields', () => {
  it('reads a field as the linear filter does', () => {
    const f = new Field(2, 2, 10);
    f.set(1, 0, 30);
    f.set(1, 1, 30);
    expect(f.at(0.25, 0.5)).toBeCloseTo(10, 1);
    expect(f.at(0.75, 0.5)).toBeCloseTo(30, 1);
    expect(f.at(0.5, 0.5)).toBeCloseTo(20, 1);
  });
  it('reads the model’s cells at their centres, and its surfaces at the seat and the front', () => {
    const s = stateWith();
    const cols = benchColumns(MACHINE.bore);
    const rows = benchRows(MACHINE.bore, true);
    const x0 = (cols[0]! + cols[1]!) / 2;
    const y0 = (rows[0]! + rows[1]!) / 2;
    expect(sliceT(s, 0, x0, y0)).toBeCloseTo(s.benchT[0]!, 3);
    expect(sliceT(s, 0, MACHINE.benchDepth / 2, MACHINE.benchHeight)).toBeCloseTo(s.seatT[0]!, 3);
    expect(sliceT(s, 0, MACHINE.benchDepth, (rows[0]! + rows[1]!) / 2)).toBeCloseTo(s.frontT[0]!, 3);
  });
  it('keeps the gas out of the earth: the duct’s cell stands for its neighbours', () => {
    const s = stateWith();
    const g = s.benchT[s.ductCol + s.benchCols * s.ductRow]!;
    const here = cellT(s, s.ductCol, s.ductRow, 0);
    expect(here).not.toBeCloseTo(g, 1);
    expect(here).toBeLessThan(g);
  });
  it('holds the hot end hotter than the cold end during a fire, at the same place in the earth', () => {
    const s = stateWith({}, {}, 9);
    const near = (seg: number) => sliceT(s, seg, MACHINE.benchDepth / 2, 0.36);
    expect(near(0)).toBeGreaterThan(near(s.benchSegments - 1));
  });
});

describe('the switch', () => {
  it('fades over half a second, and with dt = 0 nothing moves', () => {
    const t = new ThermalView();
    const s = stateWith();
    t.update(s, true, 0);
    expect(t.on.value).toBe(0);
    t.update(s, true, 0.25);
    expect(t.on.value).toBeCloseTo(0.5, 5);
    t.update(s, true, 1);
    expect(t.on.value).toBe(1);
    t.update(s, false, 1);
    expect(t.on.value).toBe(0);
  });
  it('drives a world from `params.thermalView`, and shows the scale only with it', () => {
    let on = false;
    const w = createLivingRoomScene({ params: () => ({ thermalView: on, feedCover: 0.85, lidAfterFire: true }) });
    const s = stateWith();
    w.update(s, 1 / 60, view());
    expect(w.scale.visible).toBe(false);
    on = true;
    for (let i = 0; i < 40; i++) w.update(s, 1 / 30, view());
    expect(w.thermal.on.value).toBe(1);
    expect(w.scale.visible).toBe(true);
    // the stage's top is open: no lit spruce through the room in this view
    const instanced: THREE.Object3D[] = [];
    w.scene.getObjectByName('exterior')!.traverse((o) => {
      if ((o as THREE.InstancedMesh).isInstancedMesh) instanced.push(o);
    });
    expect(instanced.length).toBe(2);
    expect(instanced.every((o) => !o.visible)).toBe(true);
    // the bench reads the model, cell by cell
    expect(w.thermal.bench.read(0, 0)).toBeCloseTo(s.seatT[0]!, 0);
    expect(w.thermal.bench.read(5, 1)).toBeCloseTo(s.frontT[5]!, 0);
    expect(w.thermal.drum.read(0, w.thermal.drum.h - 1)).toBeCloseTo(s.drumLidT, 0);
    expect(w.thermal.stone.value).toBeCloseTo(s.stoneT, 5);
    on = false;
    for (let i = 0; i < 40; i++) w.update(s, 1 / 30, view());
    expect(instanced.every((o) => o.visible)).toBe(true);
    expect(w.thermal.on.value).toBe(0);
  });
  it('makes the bench’s faces follow the slider: its colours differ by the hour', () => {
    const w = createBenchSectionScene();
    const atHour = (h: number) => {
      const s = stateWith({}, {}, h);
      w.update(s, 1, view());
      return { hot: w.fields.hot.at(0.5, 0.86), cold: w.fields.cold.at(0.5, 0.86), s };
    };
    const morning = atHour(5);
    const burn = atHour(9.4);
    expect(burn.hot).toBeGreaterThan(morning.hot);
    expect(burn.hot).toBeGreaterThan(burn.cold);
  });
  it('writes half-float fields, read through a linear filter', () => {
    const w = createBenchSectionScene();
    expect(w.fields.hot.texture.type).toBe(THREE.HalfFloatType);
    expect(w.fields.hot.texture.magFilter).toBe(THREE.LinearFilter);
  });
});
