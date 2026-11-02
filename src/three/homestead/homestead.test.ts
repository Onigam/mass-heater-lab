import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FLUE, HOME, HOUSE } from '../dims';
import { meshBox, stateWith, view } from '../test-utils';
import { roofY } from './house';
import { createHomesteadScene } from './scene';
import { SNOW } from './snow';
import { buildTerrain, terrainHeight } from './terrain';

// The homestead: bodies on the land, the house where the room is, the chimney above the ridge, trees on the ground and off the house, smoke and steam as the model says.

const w = createHomesteadScene();
const s = stateWith();
w.update(s, 1 / 60, view());
w.scene.updateMatrixWorld(true);

describe('the land', () => {
  it('lies flat under the house and the shed', () => {
    for (const [x, z] of [
      [0, 0],
      [HOUSE.x0 + 0.2, HOUSE.z0 + 0.2],
      [HOUSE.x1 - 0.2, HOUSE.z1 - 0.2],
      [HOME.woodshed.x, HOME.woodshed.z],
      [HOME.block.x, HOME.block.z],
      [HOME.bucket.x, HOME.bucket.z],
    ] as const) {
      expect(terrainHeight(x, z), `${x}, ${z}`).toBeCloseTo(HOME.ground, 3);
    }
  });
  it('builds finite', () => {
    const t = buildTerrain();
    expect(t.vertices).toBeGreaterThan(1000);
  });
});

describe('bodies on the land', () => {
  const bottom = (id: string) => meshBox(w.registry.get(id)!.object).min.y;
  it('the house stands on its plinth, the plinth on the land', () => {
    expect(bottom('house-shell')).toBeCloseTo(0, 2);
    const b = meshBox(w.house.group);
    expect(b.min.y).toBeCloseTo(0, 2);
    expect(b.max.y).toBeGreaterThan(HOUSE.ridge);
  });
  it('the shed, the block, the bucket stand on the ground', () => {
    expect(bottom('woodshed')).toBeCloseTo(0, 2);
    expect(bottom('kindling-block')).toBeCloseTo(0, 1);
    expect(bottom('ash-bucket')).toBeCloseTo(0, 2);
    expect(bottom('moisture-meter')).toBeCloseTo(0, 2);
  });
  it('the stack is in the shed, on its floor', () => {
    const shed = meshBox(w.registry.get('woodshed')!.object);
    const stack = meshBox(w.registry.get('cordwood-stack')!.object);
    expect(shed.containsPoint(stack.getCenter(new THREE.Vector3()))).toBe(true);
    expect(stack.max.y).toBeLessThan(HOME.woodshed.wallH);
  });
  it('the inlet is on the gable, the ladder on the roof', () => {
    const i = meshBox(w.registry.get('outside-air-inlet')!.object);
    expect(i.min.x).toBeLessThanOrEqual(HOUSE.x1 + HOME.at[0]);
    expect(i.max.x).toBeGreaterThan(HOUSE.x1 + HOME.at[0]);
    const l = meshBox(w.registry.get('sweep-access')!.object);
    expect(l.min.y).toBeLessThan(roofY(HOUSE.z1) + HOME.at[1] + 0.4);
    expect(l.max.y).toBeGreaterThan(roofY(FLUE.z + 0.35) + HOME.at[1]);
  });
  it('every tree stands on the land, and none in the house', () => {
    const plan = w.vegetation.plan;
    for (const list of [plan.spruces, plan.bare, plan.young, plan.stools]) {
      for (const t of list) {
        expect(Math.abs(t.y - terrainHeight(t.x, t.z))).toBeLessThan(1e-6);
        const inHouse = t.x > HOUSE.x0 - 1 && t.x < HOUSE.x1 + 1 && t.z > HOUSE.z0 - 1 && t.z < HOUSE.z1 + 1;
        expect(inHouse).toBe(false);
      }
    }
  });
});

describe('the chimney', () => {
  it('rises above the ridge, out of the roof where the room’s chimney goes', () => {
    expect(w.chimney.x).toBeCloseTo(FLUE.x + HOME.at[0], 6);
    expect(w.chimney.z).toBeCloseTo(FLUE.z + HOME.at[2], 6);
    expect(w.chimney.top).toBeGreaterThan(HOUSE.ridge + HOME.at[1] + 0.4);
    expect(roofY(FLUE.z)).toBeLessThan(FLUE.top);
  });
  it('smokes and steams only as the model says', () => {
    const t = { ...s };
    w.update({ ...t, smokeAtCap: 0, steamAtCap: 0 }, 1 / 60, view());
    expect(w.capSmoke.mesh.visible).toBe(false);
    expect(w.capSteam.mesh.visible).toBe(false);
    w.update({ ...t, smokeAtCap: 0.5, steamAtCap: 0 }, 1 / 60, view());
    expect(w.capSmoke.mesh.visible).toBe(true);
    w.update({ ...t, smokeAtCap: 0, steamAtCap: 0.6 }, 1 / 60, view());
    expect(w.capSteam.mesh.visible).toBe(true);
    w.update(s, 1 / 60, view());
    // the neighbour's slow fire smokes anyway
    expect(w.neighbourSmoke.mesh.visible).toBe(true);
  });
});

describe('the season', () => {
  it('lays the snow by the mean of the outside air', () => {
    let mean = 2;
    const m = createHomesteadScene({ params: () => ({ outsideMean: mean }) });
    m.update(s, 1 / 60, view());
    expect(SNOW.value).toBe(1);
    mean = 12;
    m.update(s, 1 / 60, view());
    expect(SNOW.value).toBe(0);
    mean = 2;
    m.update(s, 1 / 60, view());
  });
  it('takes the wood off the stack as the model burns it, a season of it', () => {
    const logs = w.shed.logs[0]!;
    w.update({ ...s, woodTotal: 0 }, 1 / 60, view());
    const full = logs.count;
    w.update({ ...s, woodTotal: 950 }, 1 / 60, view());
    expect(logs.count).toBeLessThan(full * 0.55);
    w.update({ ...s, woodTotal: 0 }, 1 / 60, view());
    expect(logs.count).toBe(full);
  });
  it('follows the sun with the hour, day and night', () => {
    w.update(stateWith({ hour: 12 }), 1, view());
    for (let i = 0; i < 30; i++) w.update(stateWith({ hour: 12 }), 0.1, view());
    const day = w.sun.position.y;
    for (let i = 0; i < 30; i++) w.update(stateWith({ hour: 23 }), 0.1, view());
    expect(w.drawn.night).toBeGreaterThan(0.5);
    expect(day).toBeGreaterThan(0);
  });
});
