// The drawn sizes of the part sheets, ALL read from src/three/dims.ts (the single source of lengths, BRIEF §5): nothing in this file is a number typed here, except the unit conversions. They are appended to the specs of each sheet by
// ../parts.ts. **Overall sizes only**: what a visitor needs to picture a machine in a room, never a size to build to. No inner dimension of the core (feed, tunnel, gap, insulation, sleeve) is printed, on purpose. Reported sizes (the drum, the
// bore, the riser's example) are written in the sheets, with their words; every length here is an ESTIMATE of the 3D model and is tagged « estimation ».
import type { Spec } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { BENCH, FLUE, HOME, HOUSE, ROOM, SHIELD, drawnDuctLength } from '../../three/dims';
import { sp, TAG } from '../part-helpers';
import { nEn, nFr } from '../units';

/** A length in metres, in both languages, tagged an estimate. */
const lenM = (digits: number, ...metres: number[]) => {
  const [tf, te] = TAG.estimate;
  return l(
    `${metres.map((m) => nFr(m, digits)).join(' × ')} m (${tf})`,
    `${metres.map((m) => nEn(m, digits)).join(' × ')} m (${te})`,
  );
};

export const DIM_SPECS: Record<string, Spec[]> = {
  // ---- homestead
  'house-shell': [
    sp('Longueur et profondeur dessinées', 'Drawn length and depth', lenM(1, HOUSE.innerLength, HOUSE.innerDepth)),
    sp('Faîtage dessiné', 'Drawn ridge', lenM(2, HOUSE.ridge)),
  ],
  woodshed: [sp('Dessiné', 'Drawn', lenM(1, HOME.woodshed.length, HOME.woodshed.depth))],
  'cordwood-stack': [
    sp('Pile dessinée', 'Drawn stack', lenM(2, HOME.stack.length, HOME.stack.depth, HOME.stack.height)),
  ],
  // ---- living-room
  'chimney-flue': [sp('Diamètre avec son isolant', 'Diameter with its insulation', lenM(2, FLUE.outerR * 2))],
  'heat-shield': [sp('Tôle dessinée', 'Drawn sheet', lenM(2, SHIELD.x1 - SHIELD.x0, SHIELD.y1 - SHIELD.y0))],
  'inner-stone-wall': [sp('Pièce autour', 'The room around it', lenM(1, ROOM.width, ROOM.depth, ROOM.height))],
  'cob-bench': [sp('Conduit dessiné', 'Drawn duct', lenM(1, drawnDuctLength()))],
  'bench-backrest': [
    sp(
      'Longueur dessinée, le long du mur',
      'Drawn length along the wall',
      lenM(1, BENCH.ductX + BENCH.depth / 2 - BENCH.backrestX0),
    ),
  ],
};
