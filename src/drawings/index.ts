import { configureDrawings, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { generalArrangement } from './pl01-general';
import { longSection } from './pl02-long-section';
import { coreSection } from './pl03-core-section';
import { ductPlan } from './pl04-duct-plan';
import { benchCrossSections } from './pl05-bench';
import { materialsExplained } from './pl06-materials';
import { firingDay } from './pl07-firing-day';
import { draftBudget } from './pl08-draft';
import { energyDay } from './pl09-energy';
import { safetyChain } from './pl10-safety';

// The title block's texts of every sheet: « not for construction » is said here, once per sheet as any title block does, and nowhere else on the sheets. src/lab.ts must not set the project's name on top of this without keeping the disclaimer.
configureDrawings({
  project: { fr: 'LABO DU POÊLE DE MASSE', en: 'MASS HEATER LAB' },
  disclaimer: {
    fr: 'Schéma explicatif, PAS POUR LA CONSTRUCTION. Reconstitution pédagogique indépendante',
    en: 'Explanatory diagram, NOT FOR CONSTRUCTION. Independent educational reconstruction',
  },
  date: '2026-11-02',
});

/** Every drawing of the "Plans" mode, in reading order (the numbers of the title blocks). */
export const SHEETS: DrawingSheet[] = [
  generalArrangement,
  longSection,
  coreSection,
  ductPlan,
  benchCrossSections,
  materialsExplained,
  firingDay,
  draftBudget,
  energyDay,
  safetyChain,
];

/** The groups of the "Plans" mode, for `plans.groups` in src/lab.ts. */
export const PLAN_GROUPS: { id: string; label: L }[] = [
  { id: 'living-room', label: l('La pièce', 'The room') },
  { id: 'fire-core', label: l('Le foyer', 'The core') },
  { id: 'bench-section', label: l('Le banc', 'The bench') },
  { id: 'model', label: l('Ce que trouve le modèle', 'What the model finds') },
];
