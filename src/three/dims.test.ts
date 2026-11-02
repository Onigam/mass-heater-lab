import { describe, expect, it } from 'vitest';
import { MACHINE, benchColumns, benchRows, ductAxis } from '../sim/machine';
import {
  BENCH,
  CORE,
  DUCT,
  FLUE,
  HOME,
  HOUSE,
  ITEMS,
  MANIFOLD,
  ROOM,
  SHIELD,
  drawnDuctLength,
  ductS,
  homeFromRoom,
} from './dims';

// The one source of the dimensions: everything the simulation owns is read from `MACHINE`; the rest closes on it.

describe('the dimensions', () => {
  it('reads the machine from the simulation', () => {
    expect(CORE.drumR * 2).toBe(MACHINE.drumDiameter);
    expect(CORE.drumHeight).toBe(MACHINE.drumHeight);
    expect(CORE.sleeveR * 2).toBe(MACHINE.sleeveDiameter);
    expect(CORE.feedSide).toBe(MACHINE.feedSide);
    expect(BENCH.depth).toBe(MACHINE.benchDepth);
    expect(BENCH.height).toBe(MACHINE.benchHeight);
    expect(FLUE.top).toBe(MACHINE.chimneyTop);
    expect(ROOM.width).toBe(MACHINE.room.width);
    expect(ROOM.height).toBe(MACHINE.room.height);
    expect(ROOM.stoneWidth).toBe(MACHINE.stoneWall.width);
  });
  it('closes the core on the model: riser top, gap, lid', () => {
    expect(CORE.drumTop - CORE.riserTop).toBeCloseTo(MACHINE.topGap, 6);
    expect(CORE.riserTop).toBeCloseTo(MACHINE.tunnelAxis + MACHINE.riserHeight, 6);
    expect(CORE.drumFoot).toBe(MACHINE.plinthHeight);
    expect(CORE.feedTop).toBeCloseTo(MACHINE.tunnelAxis + MACHINE.feedHeight, 6);
    // the tunnel's length, from the feed's near face to the riser's axis
    expect(-CORE.feedNear).toBeCloseTo(MACHINE.tunnelLength, 6);
    // the bore, the liner, the insulation and the sleeve add up
    expect(CORE.boreR + CORE.insulation).toBeCloseTo(CORE.sleeveR, 6);
  });
  it('fits the core around the feed: the feed clears the drum, the casing clears the stone wall', () => {
    const feedOuter = CORE.feedNear + CORE.brick;
    expect(feedOuter).toBeLessThan(-CORE.drumR);
    expect(CORE.x + CORE.casingX0).toBeGreaterThan(ROOM.x0);
    // the casing reaches the back wall, the drum stands off it
    expect(CORE.z + CORE.casingZ0).toBeCloseTo(ROOM.z0, 6);
    expect(CORE.z - CORE.drumR).toBeGreaterThan(ROOM.z0 + 0.25);
  });
  it('holds the duct to its length, in its two legs', () => {
    expect(drawnDuctLength()).toBeCloseTo(MACHINE.ductLength, 6);
    expect(BENCH.ductX - BENCH.startX).toBeCloseTo(MACHINE.ductLegs[0], 6);
    expect(BENCH.endZ - BENCH.ductZ).toBeCloseTo(MACHINE.ductLegs[1], 6);
    expect(ductS(BENCH.startX, BENCH.ductZ)).toBeCloseTo(0, 6);
    expect(ductS(BENCH.hotEndX, BENCH.ductZ)).toBeCloseTo(MACHINE.hotRun, 6);
    expect(ductS(BENCH.ductX, BENCH.endZ)).toBeCloseTo(MACHINE.ductLength, 6);
  });
  it('lays the duct in the two casings of the model', () => {
    expect(DUCT.axisHot).toBeCloseTo(ductAxis(MACHINE.bore, true), 6);
    expect(DUCT.axisCold).toBeCloseTo(ductAxis(MACHINE.bore, false), 6);
    expect(BENCH.height - DUCT.axisHot - DUCT.r).toBeCloseTo(MACHINE.coverHot, 6);
    expect(BENCH.height - DUCT.axisCold - DUCT.r).toBeCloseTo(MACHINE.coverCold, 6);
    const cols = benchColumns(MACHINE.bore);
    expect(cols[cols.length - 1]).toBeCloseTo(BENCH.depth, 6);
    expect(benchRows(MACHINE.bore, true).at(-1)).toBeCloseTo(BENCH.height, 6);
  });
  it('runs the manifold to the duct’s mouth', () => {
    expect(CORE.z + (MANIFOLD.z0 + MANIFOLD.z1) / 2).toBeCloseTo(BENCH.ductZ, 1);
    expect(MANIFOLD.y0 + 0.08).toBeLessThan(DUCT.axisHot - DUCT.r);
    expect(MANIFOLD.y1).toBeGreaterThan(DUCT.axisHot + DUCT.r);
    expect(CORE.x + MANIFOLD.x1).toBeLessThan(BENCH.casingStartX);
  });
  it('gives the chimney the height it must have over the ridge', () => {
    expect(FLUE.top).toBeGreaterThan(HOUSE.ridge + 0.4);
    expect(HOUSE.innerLength * HOUSE.innerDepth).toBeCloseTo(MACHINE.houseArea, 6);
    const [x, y, z] = homeFromRoom(FLUE.x, FLUE.top, FLUE.z);
    expect(x).toBeCloseTo(FLUE.x + HOME.at[0], 6);
    expect(y).toBeCloseTo(FLUE.top + HOUSE.plinth, 6);
    expect(z).toBeCloseTo(FLUE.z, 6);
  });
  it('keeps the shield’s reported gap, and what is on the bench on it', () => {
    expect(SHIELD.gap).toBeCloseTo(0.025, 6);
    expect(SHIELD.y0).toBe(CORE.casingTop);
    expect(ITEMS.basket.r).toBeGreaterThan(0.1);
  });
});
