import {
  BENCH_COLS,
  BENCH_ROWS,
  BENCH_SEGMENTS,
  DUCT_COL,
  DUCT_ROW,
  MACHINE as M,
  benchColumns,
  benchRows,
  ductAxis,
} from '../sim/machine';

// The one source of the dimensions of the 3D worlds and the drawings, metres. What the simulation owns is imported from `MACHINE` (src/sim/machine.ts) and never retyped; everything else is here, tagged:
//   reported  a source of docs/research.md, by way of MACHINE;
//   derived   computed from what is reported, or what the geometry forces;
//   estimate  no source gives it: a choice with its reason.
// Overall sizes only, rounded: this lab explains, it gives no plan. No figure here is a design rule, and nothing here is shown as a dimension in the 3D.

export const DEG = Math.PI / 180;

export { BENCH_COLS, BENCH_ROWS, BENCH_SEGMENTS, DUCT_COL, DUCT_ROW, M as MACHINE, benchColumns, benchRows, ductAxis };

// ------------------------------------------------------------------------------------------------ the room frame
// Y up from the slab's top, the room's centre at x = z = 0. The back wall is at z0, the outer gable at x1, the stone wall at x0, the front at z1. The core and the bench are drawn in this frame directly.

export const ROOM = {
  /** reported by way of the model (assumption of the research): 6.0 × 5.0 × 2.5 m. */
  width: M.room.width,
  depth: M.room.depth,
  height: M.room.height,
  x0: -M.room.width / 2,
  x1: M.room.width / 2,
  z0: -M.room.depth / 2,
  z1: M.room.depth / 2,
  /** estimate: a well-insulated outer wall, plaster, straw or wood-fibre, render. */
  outerWall: 0.3,
  /** reported by way of the model: the stone wall. */
  stoneT: M.stoneWall.thickness,
  stoneWidth: M.stoneWall.width,
  /** estimate: boards, joists and insulation under the floor, down to the footing. */
  floorDepth: 0.36,
  /** derived: the floor's boards lie this far under the slab's top, so that a lip shows and no two faces are coplanar. */
  floorDrop: 0.004,
  /** estimate: the ledger along the back wall and the gable, that the joists bear on and the smoke alarm hangs from. */
  beamW: 0.14,
  beamH: 0.18,
  /** estimate: windows. */
  windowSill: 1.02,
  windowHead: 2.12,
} as const;

// ------------------------------------------------------------------------------------------------ the core
// In its own frame the riser's axis is at x = z = 0 and y = 0 is the slab's top: the feed is at −x, the gases leave at +x, the plane z = 0 holds the feed, the tunnel, the riser and the drum's axis.

/** Thickness of the firebrick around the fire, estimate (a brick laid flat). */
const BRICK = 0.06;
/** derived: the riser's axis stands off the back wall by the drum's radius, the shield's gap and a clearance the view can read. Not a clearance to copy. */
const CORE_X = -2.15;
const CORE_Z = -1.85;

export const CORE = {
  /** Where the riser's axis stands in the room frame. derived: the feed and its casing clear the stone wall, the duct starts behind the drum (see `BENCH.startX`). */
  x: CORE_X,
  z: CORE_Z,
  boreR: M.bore / 2,
  feedSide: M.feedSide,
  brick: BRICK,
  /** derived by the model: the tunnel's axis, its floor and its roof. */
  tunnelAxis: M.tunnelAxis,
  tunnelFloor: M.tunnelAxis - M.feedSide / 2,
  tunnelRoof: M.tunnelAxis + M.feedSide / 2,
  /** derived: a brick over the tunnel's roof. */
  lidTop: M.tunnelAxis + M.feedSide / 2 + BRICK,
  /** derived: the tunnel runs from the feed's near face to the riser's axis, MACHINE.tunnelLength. */
  feedNear: -M.tunnelLength,
  feedFar: -M.tunnelLength - M.feedSide,
  feedAxis: -M.tunnelLength - M.feedSide / 2,
  /** derived by the model: the mouth of the feed, MACHINE.feedHeight above the tunnel's axis. */
  feedTop: M.tunnelAxis + M.feedHeight,
  /** derived: the riser's top: the top of the tunnel's axis plus MACHINE.riserHeight. */
  riserTop: M.tunnelAxis + M.riserHeight,
  /** derived: the riser's brick foot, on the tunnel's roof. */
  riserFoot: M.tunnelAxis + M.feedSide / 2 + BRICK,
  /** estimate within MACHINE.riserInsulation: a thin refractory liner. */
  linerT: 0.015,
  /** reported by way of MACHINE. */
  insulation: M.riserInsulation,
  sleeveR: M.sleeveDiameter / 2,
  /** derived: the 1.5 mm of the model is under a pixel at any distance: it is drawn at this thickness. */
  sleeveWallDrawn: 0.003,
  /** reported, sellers' range. */
  drumR: M.drumDiameter / 2,
  drumHeight: M.drumHeight,
  /** reported 1.2 mm; drawn at this thickness so that the section reads. */
  drumWallDrawn: 0.004,
  /** by way of the model: the foot of the drum and its lid. */
  drumFoot: M.plinthHeight,
  drumTop: M.plinthHeight + M.drumHeight,
  /** reported: gap under the lid. A test holds that drumTop − riserTop is this. */
  topGap: M.topGap,
  /** estimate: half-width of the notch cut in the drum's foot, over the tunnel. */
  notchHalf: 0.22,
  /** estimate: the drum's rolling hoops (a usual 200 L drum has two, in thirds of its height) and their height. */
  hoops: [1 / 3, 2 / 3] as const,
  hoopH: 0.018,
  hoopOut: 0.006,
  /** estimate: the ring under the drum: inner and outer radius. */
  plinthIn: 0.29,
  plinthOut: 0.35,
  /** estimate: the gas chamber under the fall, its floor, its inner radius. */
  chamberFloor: 0.02,
  chamberIn: 0.18,
  /** estimate: the earth around all of it: its top a step above the floor, its plan, its rounded top edge. */
  casingTop: 0.38,
  casingX0: -M.tunnelLength - M.feedSide - BRICK - 0.1,
  casingX1: 0.4,
  /** derived: reaches the back wall. */
  casingZ0: -M.room.depth / 2 - CORE_Z,
  casingZ1: 0.42,
  casingR: 0.16,
  /** Where the stepped section steps back from the core's plane to the bench's: just outside the ring. */
  stepX: 0.355,
  /** estimate: half-width of the firebrick walls, their brick courses. */
  brickZ: M.feedSide / 2 + BRICK,
  lidZ: 0.2,
  /** by way of the model: one brick's width of 11 cm hides this much of the mouth, the sticks stand in the slot left. */
  slotCover: 11 / 18,
  /** estimate: the rim on the feed's mouth, the sliding lid's size. */
  rimOut: 0.015,
  rimH: 0.012,
  lidW: 0.24,
  lidD: 0.3,
  lidT: 0.008,
  /** estimate: a stick of the load: its length and radius. A source says under 8 cm across. */
  stickL: 0.62,
  stickR: 0.021,
  /** estimate: the bed of ash at its deepest. */
  ashH: 0.022,
} as const;

/** The manifold, core frame: a steel box behind the drum, its outlet on the duct's axis. */
export const MANIFOLD = {
  /** derived: on the duct's axis. */
  x0: -0.3,
  x1: 0.38,
  z0: -0.57,
  z1: -0.3,
  /** derived: a lip under the drum, down in the chamber, joins the ring. */
  lipZ: -0.27,
  y0: CORE.chamberFloor,
  y1: 0.34,
  /** estimate: the cleanout on its top, through the casing. */
  hatchX: 0.3,
  hatchR: 0.075,
  wall: 0.003,
} as const;

// ------------------------------------------------------------------------------------------------ the bench and the duct

export const DUCT = {
  /** reported: the bore of the whole gas path. */
  r: M.bore / 2,
  /** estimate: the thickness of the spiral steel, drawn thicker than a real 1 mm. */
  wall: 0.004,
  /** estimate: a seam's collar and the spacing of joints. */
  collarR: M.bore / 2 + 0.008,
  collarL: 0.05,
  jointEvery: 1.2,
  /** derived by the model: the axis in the hot and in the thin casing. */
  axisHot: ductAxis(M.bore, true),
  axisCold: ductAxis(M.bore, false),
  /** estimate: the rise between the two runs, two soft bends. */
  jog: 0.3,
  /** estimate: the radius of the corner. */
  bendR: 0.22,
} as const;

/** derived: the axis of each leg, half a bench from its wall. */
const DUCT_Z = ROOM.z0 + M.benchDepth / 2;
const DUCT_X = ROOM.x1 - M.benchDepth / 2;

export const BENCH = {
  depth: M.benchDepth,
  height: M.benchHeight,
  /** The duct's axis along the back wall and along the gable. */
  ductZ: DUCT_Z,
  ductX: DUCT_X,
  /** derived: the first leg ends at the corner and is MACHINE.ductLegs[0] long, the second MACHINE.ductLegs[1]. */
  startX: DUCT_X - M.ductLegs[0],
  endZ: DUCT_Z + M.ductLegs[1],
  /** derived: the bench starts against the core's casing. */
  casingStartX: CORE_X + CORE.casingX1,
  /** estimate: it stops short of the tee, so that the tee and the foot of the chimney stand in the room; its round end carries on 0.2 m. */
  casingEndZ: 1.5,
  /** reported: thick cover over the first 3 m, thin beyond. */
  hotEndX: DUCT_X - M.ductLegs[0] + M.hotRun,
  coverHot: M.coverHot,
  coverCold: M.coverCold,
  /** estimate: the skin of earth plaster and the layer on the slab, inside the bench's section. */
  plaster: 0.02,
  barrier: 0.03,
  /** estimate: the radius of the front edge, and of the inner corner in plan. */
  edgeR: 0.055,
  cornerR: 0.28,
  /** reported by the research: backrest 0.15 × 0.40 m, not in the mass. */
  backrestDepth: 0.15,
  backrestHeight: 0.4,
  backrestX0: -1.1,
  backrestZ1: 1.35,
  /** estimate: the cleanout on the bench's front, a little before the corner. */
  cleanoutX: 2.05,
  cleanoutR: 0.09,
} as const;

/** Length of the duct as it is drawn, m, with the corner sharp: a test holds it to MACHINE.ductLength. */
export const drawnDuctLength = (): number => BENCH.ductX - BENCH.startX + (BENCH.endZ - BENCH.ductZ);

/** Where a run's position lies along the duct: distance from the manifold, m, for a point on either leg. */
export const ductS = (x: number, z: number): number =>
  z <= BENCH.ductZ + 1e-6 ? x - BENCH.startX : BENCH.ductX - BENCH.startX + (z - BENCH.ductZ);

// ------------------------------------------------------------------------------------------------ the chimney

export const FLUE = {
  /** derived: the tee is at the end of the second leg. */
  x: BENCH.ductX,
  z: BENCH.endZ,
  r: M.bore / 2,
  /** reported by way of the model: insulated, this thick. */
  outerR: M.bore / 2 + M.chimneyInsulation,
  /** reported by way of the model: the top above the floor. */
  top: M.chimneyTop,
  /** derived: the tee's axis. */
  teeY: DUCT.axisCold,
  /** estimate: the removable foot under the tee, its cleanout cap, its drain. */
  footY: 0.04,
  capR: M.bore / 2 + 0.012,
  drainY: 0.075,
  /** estimate: the crossing of the ceiling: its height and half-width. */
  crossingH: 0.32,
  crossingHalf: 0.3,
  /** estimate: where the thermometer sits on the flue. */
  thermometerY: 1.42,
  /** estimate: brackets to the gable. */
  brackets: [2.0, 3.1],
  /** estimate: the cap on the top: a cone on legs. */
  capH: 0.34,
  capOut: 0.1,
} as const;

// ------------------------------------------------------------------------------------------------ the shield and small things in the room

export const SHIELD = {
  /** reported: a steel sheet and an air gap of 25 mm. The width and height are an estimate. */
  gap: 0.025,
  x0: -2.62,
  x1: -1.68,
  y0: CORE.casingTop,
  y1: 1.72,
  t: 0.002,
} as const;

const BENCH_BACK = 0.168;

/** The parts in the room: where they stand, estimates all. */
export const ITEMS = {
  kettle: { x: CORE_X + 0.05, z: CORE_Z + 0.06, r: 0.1, h: 0.13 },
  /** reported: about 12 kg of split wood, a whole day. Its size is an estimate. */
  basket: { x: -2.42, z: -1.08, r: 0.25, h: 0.26 },
  coAlarm: { x: -1.3, y: 1.62, r: 0.062 },
  smokeAlarm: { x: -0.82, z: ROOM.z0 + 0.07, r: 0.06 },
  /** Between the windows, above the picture, clear of the curtains. */
  grille: { x: 0.925, y: 1.86, w: 0.16, h: 0.22 },
  /** Three cushions on the seat: where along the bench. */
  cushions: [
    [0.72, ROOM.z0 + BENCH_BACK + 0.09, 0.14],
    [1.34, ROOM.z0 + BENCH_BACK + 0.09, -0.1],
    [ROOM.x1 - BENCH_BACK - 0.09, 0.04, -Math.PI / 2 + 0.08],
  ] as const,
} as const;

/** The house around the room: the room frame to the world of `homestead`. */
export const HOUSE = {
  /** derived: inside, the model's 74 m² with the room's depth and a passage along the front. */
  innerDepth: 5.9,
  innerLength: M.houseArea / 5.9,
  /** derived: the outer box of the walls in the room frame. */
  x1: ROOM.x1 + ROOM.outerWall,
  x0: ROOM.x1 - M.houseArea / 5.9 - ROOM.outerWall,
  z0: ROOM.z0 - ROOM.outerWall,
  z1: ROOM.z0 + 5.9 + ROOM.outerWall,
  /** estimate: the wall's top and the ridge above the floor; the chimney must clear the ridge (a test). */
  eave: 2.85,
  ridge: 4.55,
  /** estimate: the wide eaves of a foothill house, the stone plinth under the floor. */
  overhang: 0.85,
  plinth: 0.36,
} as const;

// ------------------------------------------------------------------------------------------------ the homestead
// A generic foothill: X east, Z south, the ground level at the house's door y = 0. The house has its own frame: the room frame moved to `HOME.at`.

export const HOME = {
  /** Where the room's centre lies, on the land, the floor at y = HOUSE.plinth. */
  at: [0, HOUSE.plinth, 0] as const,
  ground: 0,
  woodshed: { x: 13.2, z: 1.2, length: 5.4, depth: 2.2, wallH: 2.05, roofH: 0.65, yaw: -0.08 },
  /** derived, the research: a season's 1.9 t at about 450 kg a stère, about 4.2 stères of 33 cm wood: a stack this big. */
  stack: { length: 4.9, depth: 0.66, height: 1.3 },
  block: { x: 9.1, z: 3.1, r: 0.27, h: 0.48 },
  /** estimate: a lidded bucket on a stone, away from any wall. */
  bucket: { x: 8.6, z: -4.3, r: 0.15, h: 0.34 },
  /** estimate: where the fresh air comes in, low on the gable. */
  inlet: { y: 0.8, r: 0.075 },
  /** estimate: the coppice, a small lot at the wood's edge. */
  coppice: { x: 21, z: -20, width: 20, depth: 12 },
  /** estimate: the neighbour's house, a little further on the track. */
  neighbour: { x: -32, z: -11, length: 10, width: 7.5, wallH: 3.1, roofH: 2.1, chimneyH: 7.4, yaw: 0.22 },
  /** estimate: the road along the plot. */
  road: { z: 24, width: 5 },
} as const;

/** The room frame to the homestead's frame. */
export const homeFromRoom = (x: number, y: number, z: number): [number, number, number] => [
  x + HOME.at[0],
  y + HOME.at[1],
  z + HOME.at[2],
];
