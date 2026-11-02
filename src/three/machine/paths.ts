import * as THREE from 'three';
import { v3 } from '../common';
import { BENCH, CORE, DUCT, FLUE, MANIFOLD, ROOM } from '../dims';
import type { GasNode } from '../fire/gas';
import { ductPath } from './bench';

// The way the gases go, in the room frame, station by station of the model (`STATIONS`, src/sim/types.ts): the mouth of the feed, the fire, the riser's foot and top, under the lid, down the fall on both sides, into the manifold, along
// the duct, the tee, the ceiling, the cap. Each stretch carries its section, so the dots' speed is the mass flow over the density and the section there.

const cx = CORE.x;
const cz = CORE.z;
const at = (x: number, y: number, z = 0): THREE.Vector3 => v3(cx + x, y, cz + z);
const A_FEED = CORE.feedSide * CORE.feedSide;
const A_BORE = Math.PI * CORE.boreR * CORE.boreR;
const A_FALL = Math.PI * (CORE.drumR * CORE.drumR - CORE.sleeveR * CORE.sleeveR);
const FALL_X = (CORE.sleeveR + CORE.drumR) / 2;
const FALL_H = (CORE.drumR - CORE.sleeveR) / 2;

const node = (p: THREE.Vector3, st: number, A: number, h: number): GasNode => ({ p, st, A, h });

/** Feed, tunnel, riser. */
export const riseRun = (): GasNode[] => [
  node(at(CORE.feedAxis, CORE.feedTop + 0.04), 0, A_FEED, CORE.feedSide / 2),
  node(at(CORE.feedAxis, CORE.tunnelRoof), 0.8, A_FEED, CORE.feedSide / 2),
  node(at(CORE.feedAxis, CORE.tunnelAxis), 1, A_FEED, CORE.feedSide / 2),
  node(at(-CORE.boreR, CORE.tunnelAxis), 1.8, A_FEED, CORE.feedSide / 2),
  node(at(0, CORE.tunnelAxis + 0.05), 2, A_BORE, CORE.boreR),
  node(at(0, CORE.riserTop), 3, A_BORE, CORE.boreR),
  node(at(0, CORE.riserTop + CORE.topGap / 2), 3.6, A_BORE, CORE.boreR),
];

/** Under the lid and down the fall, on the drum's side away from the feed. */
export const fallRight = (): GasNode[] => {
  const y = CORE.riserTop + CORE.topGap / 2;
  return [
    node(at(0, y), 3.6, A_BORE, CORE.topGap / 3),
    node(at(FALL_X, y), 4, A_FALL, CORE.topGap / 3),
    node(at(FALL_X, (CORE.lidTop + CORE.riserTop) / 2), 5, A_FALL, FALL_H),
    node(at(FALL_X, CORE.drumFoot), 6, A_FALL, FALL_H),
    node(at(FALL_X, CORE.chamberFloor + 0.05), 6.3, A_FALL * 0.5, 0.03),
    node(at(FALL_X * 0.72, 0.09, -FALL_X * 0.72), 6.5, A_FALL * 0.5, 0.03),
    node(at(0.02, 0.12, MANIFOLD.lipZ), 6.7, A_FALL * 0.5, 0.03),
    node(at(0.03, 0.18, (MANIFOLD.z0 + MANIFOLD.z1) / 2), 6.8, 0.1, 0.08),
    node(at(MANIFOLD.x1, DUCT.axisHot, BENCH.ductZ - cz), 7, A_BORE, CORE.boreR),
  ];
};

/** Under the lid and down the fall on the feed's side: it stops on the tunnel's roof and goes round behind the riser. */
export const fallLeft = (): GasNode[] => {
  const y = CORE.riserTop + CORE.topGap / 2;
  return [
    node(at(0, y), 3.6, A_BORE, CORE.topGap / 3),
    node(at(-FALL_X, y), 4, A_FALL, CORE.topGap / 3),
    node(at(-FALL_X, (CORE.lidTop + CORE.riserTop) / 2), 5, A_FALL, FALL_H),
    node(at(-FALL_X, CORE.lidTop + 0.03), 6, A_FALL, FALL_H),
    node(at(-FALL_X * 0.72, 0.28, -FALL_X * 0.72), 6.2, A_FALL * 0.5, 0.03),
    node(at(-0.02, 0.14, MANIFOLD.lipZ), 6.6, A_FALL * 0.5, 0.03),
    node(at(0.0, 0.18, (MANIFOLD.z0 + MANIFOLD.z1) / 2), 6.8, 0.1, 0.08),
    node(at(MANIFOLD.x1, DUCT.axisHot, BENCH.ductZ - cz), 7, A_BORE, CORE.boreR),
  ];
};

/** Along the duct to the tee. */
export const ductRun = (from = CORE.x + MANIFOLD.x1): GasNode[] => {
  const path = ductPath(from);
  const total = path.slice(1).reduce((s, p, i) => s + p.distanceTo(path[i]!), 0);
  let d = 0;
  return path.map((p, i) => {
    if (i > 0) d += p.distanceTo(path[i - 1]!);
    return node(p, 7 + 1.8 * (d / total), A_BORE, DUCT.r);
  });
};

/** From the tee up the chimney. */
export const flueRun = (): GasNode[] => [
  node(v3(FLUE.x, FLUE.teeY, FLUE.z - DUCT.r), 8.8, A_BORE, DUCT.r),
  node(v3(FLUE.x, FLUE.teeY + 0.05, FLUE.z), 9, A_BORE, DUCT.r),
  node(v3(FLUE.x, ROOM.height, FLUE.z), 10, A_BORE, DUCT.r),
  node(v3(FLUE.x, FLUE.top, FLUE.z), 11, A_BORE, DUCT.r),
];

/** Where each station of the model lies, for the beads of pressure: the order of `STATIONS`. */
export const stationPoints = (): THREE.Vector3[] => [
  at(CORE.feedAxis, CORE.feedTop),
  at(CORE.feedAxis, CORE.tunnelAxis),
  at(0, CORE.tunnelAxis + 0.05),
  at(0, CORE.riserTop),
  at(FALL_X, CORE.riserTop + CORE.topGap / 2),
  at(FALL_X, (CORE.lidTop + CORE.riserTop) / 2),
  at(FALL_X, CORE.drumFoot),
  v3(CORE.x + MANIFOLD.x1, DUCT.axisHot, BENCH.ductZ),
  v3(BENCH.ductX, DUCT.axisCold, BENCH.casingEndZ),
  v3(FLUE.x, FLUE.teeY, FLUE.z),
  v3(FLUE.x, ROOM.height, FLUE.z),
  v3(FLUE.x, FLUE.top, FLUE.z),
];

/** The flame's way, in the room frame: from the feet of the sticks along the tunnel and up the riser. */
export const flameForward = (): THREE.Vector3[] => [
  at(CORE.feedAxis, CORE.tunnelFloor + 0.035),
  at(CORE.feedNear + 0.02, CORE.tunnelAxis - 0.005),
  at(-CORE.boreR - 0.015, CORE.tunnelAxis + 0.01),
  at(-0.03, CORE.tunnelRoof + 0.015),
  at(0, CORE.lidTop + 0.04),
  at(0, CORE.riserTop),
];

/** And when it comes back: up the feed and out of its mouth. */
export const flameBack = (): THREE.Vector3[] => [
  at(CORE.feedAxis, CORE.tunnelFloor + 0.035),
  at(CORE.feedAxis, CORE.tunnelRoof),
  at(CORE.feedAxis, CORE.feedTop),
  at(CORE.feedAxis, CORE.feedTop + 0.5),
];
