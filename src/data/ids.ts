// The frozen part ids of every world, with their category: docs/research.md §4, word for word. The contract between the catalogue, the guides, the lessons, the drawings and the 3D registries.
// The kit knows five categories only (hydraulic, mechanical, electrical, structure, site), so the research's finer ones map onto them: the path of the gases and its doors are `mechanical`, what burns, stores
// and carries is `structure`, what runs on a battery is `electrical`, the wood, the house and what lives in the room are `site`. There is no water in this lab: nothing is `hydraulic`.
// (docs/kit-requests.md, request 8, asks for categories a lab can name: a flue is not « mechanical » in any useful sense.)
import type { PartCategory } from '@onigam/lab-kit/content';

export type WorldId = 'homestead' | 'living-room' | 'fire-core' | 'bench-section';

export const WORLDS: readonly WorldId[] = ['homestead', 'living-room', 'fire-core', 'bench-section'];

export const PART_CATEGORIES: Record<WorldId, Record<string, PartCategory>> = {
  homestead: {
    'house-shell': 'site',
    'chimney-cap': 'mechanical',
    'sweep-access': 'mechanical',
    'outside-air-inlet': 'mechanical',
    woodshed: 'site',
    'cordwood-stack': 'site',
    'moisture-meter': 'electrical',
    'kindling-block': 'site',
    'ash-bucket': 'site',
    'coppice-lot': 'site',
    'smoky-neighbour': 'site',
  },
  'living-room': {
    'steel-drum': 'mechanical',
    'cob-bench': 'structure',
    'bench-backrest': 'structure',
    manifold: 'mechanical',
    'manifold-cleanout': 'mechanical',
    'chimney-flue': 'mechanical',
    'chimney-cleanout': 'mechanical',
    'ceiling-crossing': 'structure',
    'hearth-slab': 'structure',
    'heat-shield': 'structure',
    'co-alarm': 'electrical',
    'smoke-alarm': 'electrical',
    'ventilation-grille': 'mechanical',
    'wood-basket': 'site',
    kettle: 'site',
    'flue-thermometer': 'mechanical',
    'bench-cushion': 'site',
    'inner-stone-wall': 'structure',
  },
  'fire-core': {
    'feed-tube': 'structure',
    'feed-lid': 'mechanical',
    'fuel-sticks': 'site',
    'burn-tunnel': 'structure',
    'ash-bed': 'site',
    'heat-riser': 'structure',
    'riser-insulation': 'structure',
    'riser-sleeve': 'mechanical',
    'firebrick-base': 'structure',
    'core-casing': 'structure',
    'top-gap': 'mechanical',
    'downdraft-annulus': 'mechanical',
    'drum-seal': 'mechanical',
    'drum-plinth': 'structure',
  },
  'bench-section': {
    'duct-hot-run': 'mechanical',
    'duct-cold-run': 'mechanical',
    'duct-bend': 'mechanical',
    'duct-joint': 'mechanical',
    'cob-casing': 'structure',
    'stone-filler': 'structure',
    'earthen-plaster': 'structure',
    'floor-barrier': 'structure',
    'bench-cleanout': 'mechanical',
    'chimney-tee': 'mechanical',
    'condensate-drain': 'mechanical',
    'temperature-lance': 'electrical',
    'pebble-section': 'structure',
  },
};

/** The ids of a world, in catalogue order. */
export const partIds = (world: WorldId): string[] => Object.keys(PART_CATEGORIES[world]);
