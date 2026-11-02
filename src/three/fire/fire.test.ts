import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CORE } from '../dims';
import { createFireCoreScene } from '../firecore/scene';
import { stateWith, view } from '../test-utils';
import { fireFlicker, Flame, glowOf } from './flame';
import { GAS_VISUAL_CAP, GasFlow, gasColor, gasDensity } from './gas';
import { Puffs } from './puffs';
import { riseRun, flameBack, flameForward } from '../machine/paths';

// The fire and the gases follow the model: length, side and strength of the flame, the speed and the direction of the gases, the steam and the smoke; with dt = 0 nothing moves, under the slow motion everything slows, and the flame's clock runs on with the slow clock stopped.

describe('the flame', () => {
  const flame = new Flame({ forward: flameForward(), back: flameBack(), half: CORE.feedSide / 2 });
  const pos = () => flame.mesh.geometry.attributes.position as THREE.BufferAttribute;
  it('lies along the tunnel when the model gives it a length, its tip on the path', () => {
    flame.update(0.6, 0.9, 3);
    expect(flame.mesh.visible).toBe(true);
    // the first ribbon, tip of the body: it has left the feed and gone towards the riser
    const N = 22;
    const tipX = pos().getX(N * 2);
    expect(tipX).toBeGreaterThan(CORE.x + CORE.feedAxis + 0.3);
  });
  it('comes back up the feed when the length is negative, out of its mouth', () => {
    flame.update(-0.5, 0.4, 3);
    const N = 22;
    expect(pos().getY(N * 2)).toBeGreaterThan(CORE.feedTop);
    expect(Math.abs(pos().getX(N * 2) - (CORE.x + CORE.feedAxis))).toBeLessThan(CORE.feedSide);
  });
  it('is out when the model has none', () => {
    flame.update(0, 0, 3);
    expect(flame.mesh.visible).toBe(false);
    flame.update(0.5, 0, 3);
    expect(flame.mesh.visible).toBe(false);
  });
  it('is the same picture on the same clock: no random number', () => {
    flame.update(0.6, 0.8, 5);
    const a = Array.from(pos().array);
    flame.update(0.6, 0.8, 5);
    expect(Array.from(pos().array)).toEqual(a);
    flame.update(0.6, 0.8, 5.5);
    expect(Array.from(pos().array)).not.toEqual(a);
  });
  it('flickers gently: no strobe', () => {
    for (let t = 0; t < 20; t += 0.13) {
      const f = fireFlicker(t);
      expect(f).toBeGreaterThan(0.9);
      expect(f).toBeLessThan(1.1);
    }
  });
  it('lets steel and brick glow only when they are hot enough', () => {
    const c = new THREE.Color();
    expect(glowOf(400, c)).toBe(0);
    expect(glowOf(600, c)).toBeGreaterThan(0);
    expect(glowOf(1000, c)).toBeGreaterThan(glowOf(700, c));
  });
});

describe('the gases', () => {
  const s = stateWith({}, {}, 9);
  const make = () => {
    const g = new GasFlow(40);
    g.addRun(riseRun(), 30);
    return g;
  };
  const read = (g: GasFlow) => Array.from((g.points.geometry.attributes.position as THREE.BufferAttribute).array);
  it('stand still with dt = 0', () => {
    const g = make();
    g.update(s, 1 / 30, 1, true);
    const a = read(g);
    g.update(s, 0, 1, true);
    expect(read(g)).toEqual(a);
  });
  it('slow with the slow motion', () => {
    const g1 = make();
    const g2 = make();
    g1.update(s, 0.1, 1, true);
    g2.update(s, 0.1, 0.1, true);
    const base = make();
    base.update(s, 0, 1, true);
    const moved = (g: GasFlow) => read(g).reduce((sum, v, i) => sum + Math.abs(v - read(base)[i]!), 0);
    expect(moved(g2)).toBeLessThan(moved(g1) * 0.4);
  });
  it('go the other way on a reversed flow, and stop at rest', () => {
    const start = make();
    start.update(s, 0, 1, true);
    const base = read(start);
    const upward = (g: GasFlow) => {
      const a = read(g);
      let up = 0;
      let down = 0;
      // the dots in the riser, on the axis: above the tunnel's roof
      for (let i = 1; i < a.length; i += 3) {
        if (base[i]! < CORE.lidTop || base[i]! > CORE.riserTop - 0.05 || Math.abs(base[i - 1]! - CORE.x) > CORE.boreR)
          continue;
        if (a[i]! > base[i]!) up++;
        else if (a[i]! < base[i]!) down++;
      }
      return { up, down };
    };
    const fwd = make();
    const back = make();
    const rest = make();
    fwd.update(s, 0.004, 1, true);
    back.update({ ...s, gasFlow: -s.gasFlow }, 0.004, 1, true);
    rest.update({ ...s, gasFlow: 0 }, 0.004, 1, true);
    expect(upward(fwd).up).toBeGreaterThan(0);
    expect(upward(fwd).down).toBe(0);
    expect(upward(back).down).toBeGreaterThan(0);
    expect(upward(back).up).toBe(0);
    expect(read(rest)).toEqual(base);
  });
  it('read the model’s density and keep a visual cap', () => {
    expect(gasDensity(0)).toBeCloseTo(1.29, 1);
    expect(gasDensity(800)).toBeLessThan(gasDensity(100));
    expect(GAS_VISUAL_CAP).toBeLessThan(3);
    const b = make();
    const fast = { ...s, gasFlow: 0.5 };
    b.update(fast, 0, 1, true);
    const g = make();
    g.update(fast, 0.01, 1, true);
    const a0 = read(b);
    const a1 = read(g);
    for (let i = 1; i < a0.length; i += 3) {
      if (a0[i]! < CORE.lidTop || a0[i]! > CORE.riserTop - 0.1 || Math.abs(a0[i - 1]! - CORE.x) > CORE.boreR) continue;
      expect(Math.abs(a1[i]! - a0[i]!)).toBeLessThanOrEqual(GAS_VISUAL_CAP * 0.01 + 1e-5);
    }
  });
  it('colour by temperature: hot is bright orange, a cool flue is blue', () => {
    const c = new THREE.Color();
    gasColor(800, c);
    expect(c.r).toBeGreaterThan(0.9);
    gasColor(25, c);
    expect(c.b).toBeGreaterThan(c.r);
  });
});

describe('smoke and steam', () => {
  it('follow the amount the model gives, none at zero', () => {
    const p = new Puffs({
      count: 8,
      color: 0x888888,
      from: new THREE.Vector3(),
      life: 5,
      rise: 4,
      drift: [1, 0],
      r0: 0.1,
      r1: 1,
      spread: 1,
    });
    p.update(0, 1 / 30, 1);
    expect(p.mesh.visible).toBe(false);
    p.update(0.5, 1 / 30, 1);
    expect(p.mesh.visible).toBe(true);
    expect(p.amount).toBe(0.5);
  });
  it('stand still with dt = 0', () => {
    const p = new Puffs({
      count: 8,
      color: 0x888888,
      from: new THREE.Vector3(),
      life: 5,
      rise: 4,
      drift: [1, 0],
      r0: 0.1,
      r1: 1,
      spread: 1,
    });
    p.update(1, 0.2, 1);
    const off = () => Array.from((p.mesh.geometry.attributes.aOffset as THREE.BufferAttribute).array);
    const a = off();
    p.update(1, 0, 1);
    expect(off()).toEqual(a);
    p.update(1, 0.2, 0);
    expect(off()).toEqual(a);
  });
});

describe('the fire’s world', () => {
  const w = createFireCoreScene();
  it('draws the flame the model gives, the embers and the riser’s glow', () => {
    const s = stateWith({}, {}, 9);
    w.update(s, 1 / 60, view());
    expect(w.flame.mesh.visible).toBe(s.flameStrength > 0.005 && Math.abs(s.flameLength) > 0.01);
    expect(w.flame.drawn.length).toBe(s.flameLength);
    w.update({ ...s, flameLength: -0.4, flameStrength: 0.6 }, 1 / 60, view());
    expect(w.flame.drawn.length).toBe(-0.4);
  });
  it('lights the slot of the feed while the fire burns, and only then', () => {
    const glow = w.scene.getObjectByName('mouth-glow') as THREE.Mesh;
    const mat = glow.material as THREE.MeshBasicMaterial;
    const s = stateWith({}, {}, 9);
    w.update({ ...s, flameStrength: 0.6, emberGlow: 0.5 }, 1 / 60, view());
    expect(glow.visible).toBe(true);
    expect(mat.opacity).toBeGreaterThan(0.3);
    w.update({ ...s, flameStrength: 0, emberGlow: 0 }, 1 / 60, view());
    expect(glow.visible).toBe(false);
  });
  it('runs the flame on its clock with the slow clock stopped', () => {
    const s = stateWith({}, {}, 9);
    const u = w.flame.uniforms.uClock;
    w.update({ ...s, flameClock: 10 }, 1 / 60, view());
    const a = u.value;
    w.update({ ...s, flameClock: 10.5 }, 1 / 60, view());
    expect(u.value).toBeGreaterThan(a);
  });
});
