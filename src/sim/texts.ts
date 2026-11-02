import type { CoRegime } from './combustion';
import type { FirePhase, AlarmKey, PresetId, ScenarioId } from './types';

// The words the simulation owns, French and English written together. Plain data: the panel registers them with the kit.

export type Pair = readonly [string, string];

export const ALARM_TEXTS: Record<AlarmKey, { text: Pair; severe: boolean }> = {
  smokeBack: { text: ['Fumée vers la pièce', 'Smoke towards the room'], severe: true },
  coldChamber: {
    text: ['Chambre trop froide pour brûler la fumée', 'Chamber too cold to burn the smoke'],
    severe: false,
  },
  starved: { text: ['Le feu manque d’air', 'The fire is short of air'], severe: true },
  belowDew: { text: ['Fumées sous leur point de rosée', 'Flue gas below its dew point'], severe: false },
  drumHot: { text: ['Bidon au-delà de sa peinture', 'Drum beyond what its paint takes'], severe: false },
  seatHot: { text: ['Banquette trop chaude pour s’asseoir', 'Bench too hot to sit on'], severe: false },
  roomCoGuideline: {
    text: ['CO de la pièce au-dessus des repères de l’OMS', 'Room CO above the WHO guideline'],
    severe: true,
  },
  roomCoAlarm: { text: ['Un détecteur de CO aurait sonné', 'A CO alarm would have sounded'], severe: true },
  roomCold: { text: ['La maison reste froide', 'The house stays cold'], severe: false },
};

export const PRESET_TEXTS: Record<PresetId, Pair> = {
  'j-tube': ['Tube en J, 200 mm (le lab)', 'J-tube, 200 mm (the lab)'],
  'batch-load': ['Foyer fermé, charge unique', 'Closed box, one load'],
  'pebble-bench': ['Le même, banc de galets', 'The same, a pebble bench'],
  yurt: ['Yourte isolée, banc court', 'Tight yurt, short bench'],
};

export const SCENARIO_TEXTS: Record<ScenarioId, { name: Pair; lesson: Pair }> = {
  'winter-two-fires': {
    name: ['Deux feux, un jour d’hiver', 'Two fires, a winter day'],
    lesson: [
      'Le bidon réchauffe tout de suite, la banquette plus tard et plus longtemps. La pièce varie de près de sept degrés dans la journée (résultat du modèle), et le banc ne descend jamais à sa température. Faites glisser l’heure et regardez la chaleur traverser la terre.',
      'The drum warms the room at once, the bench later and for longer. The room moves by nearly seven degrees over the day (model result), and the bench never falls to its temperature. Drag the hour and watch the heat cross the earth.',
    ],
  },
  'cold-start': {
    name: ['Le feu refuse', 'The fire refuses'],
    lesson: [
      'Plusieurs jours sans feu. Le conduit s’est rempli d’air du dehors, plus lourd que celui de la pièce : il pèse vers le bas, et l’air froid tombe jusque dans la pièce. Le premier feu pousse sa fumée vers vous, et le modèle ne le voit pas se retourner seul. Un peu de chaleur au pied du conduit, et le courant bascule : c’est ce que décrivent les constructeurs. Le moment du retournement est le chiffre le moins sûr de ce modèle.',
      'Days without a fire. The flue has filled with outside air, heavier than the room’s: it weighs downwards, and cold air pours into the room. The first fire pushes its smoke towards you, and the model does not see it turn by itself. A little heat at the foot of the flue, and the flow swings over: that is what builders describe. The moment it turns is the least sure figure of this model.',
    ],
  },
  'one-fire-mild': {
    name: ['Un seul feu, un jour doux', 'One fire, a mild day'],
    lesson: [
      'Dehors il fait doux : un seul feu, le soir, et le lendemain après-midi la banquette est encore tiède. Ce qui change tout, c’est l’écart de température avec le dehors.',
      'It is mild outside: one fire in the evening, and the bench is still warm the next afternoon. What changes everything is the gap between inside and out.',
    ],
  },
  'cold-snap': {
    name: ['La vague de froid', 'The cold snap'],
    lesson: [
      'Le même bois par grand froid : la machine est aussi bonne, la maison perd plus. La pièce s’effondre. Le panneau dit combien de kilos il faudrait.',
      'The same wood in a hard frost: the machine is just as good, the house loses more. The room falls. The panel says how many kilos it would take.',
    ],
  },
  'wet-wood': {
    name: ['Du bois humide', 'Wet wood'],
    lesson: [
      'Le même poids de bois, plus d’eau : moins de chaleur par kilo, une chambre plus froide, plus de CO, et de la vapeur qui atteint son point de rosée plus tôt.',
      'The same weight of wood, more water: less heat per kilo, a colder chamber, more CO, and steam that reaches its dew point sooner.',
    ],
  },
  'short-bench': {
    name: ['Un banc trop court', 'A bench too short'],
    lesson: [
      'La moitié du conduit : la banquette n’en est pas plus chaude, elle stocke moins. La cheminée reçoit des fumées chaudes, et le bois chauffe le ciel. Un vrai poêle au banc trop petit a donné cela.',
      'Half the duct: the bench is no warmer for it, it stores less. The chimney gets hot gas, and the wood heats the sky. A real heater with too small a bench did just that.',
    ],
  },
  'long-bench': {
    name: ['Un banc trop long', 'A bench too long'],
    lesson: [
      'Le double du conduit : presque toute la chaleur reste dans la maison, mais les fumées arrivent froides. Le tirage faiblit, et l’eau se condense dans le conduit. Le bon bilan a un prix.',
      'Twice the duct: nearly all the heat stays in the house, but the gas arrives cold. The draught weakens, and water condenses in the flue. The fine balance has a price.',
    ],
  },
  'low-chimney': {
    name: ['Une cheminée trop basse', 'A chimney too low'],
    lesson: [
      'Moins de hauteur, moins de tirage. Le poêle semble gagner en rendement, mais la pression sous le couvercle du bidon remonte presque à celle de la pièce : il reste peu de marge avant qu’un défaut de joint laisse sortir des fumées.',
      'Less height, less draught. The heater seems to gain in efficiency, but the pressure under the drum’s lid climbs almost to the room’s: little margin is left before a flaw in the seal lets gas out.',
    ],
  },
  'small-gap': {
    name: ['Un passage trop étroit', 'Too narrow a gap'],
    lesson: [
      'Le passage entre le haut de la cheminée interne et le couvercle se resserre : tout le débit de la machine doit y passer. Ici le modèle montre peu d’effet tant qu’il reste une marge.',
      'The gap between the top of the riser and the lid narrows: all of the machine’s flow must pass there. The model shows little effect as long as some margin remains.',
    ],
  },
  'leaky-house': {
    name: ['Une maison qui fuit', 'A leaky house'],
    lesson: [
      'La même machine, le même bois, une maison qui perd trois fois plus. Le poêle n’y peut rien. C’est l’isolation qui permet les deux feux par jour.',
      'The same machine, the same wood, a house that loses three times as much. The heater can do nothing about it. It is the insulation that makes two fires a day possible.',
    ],
  },
  'extract-fan': {
    name: ['La hotte de cuisine', 'The kitchen fan'],
    lesson: [
      'Le feu est presque fini, le tirage retombe. Une hotte met la maison en dépression, et le courant s’inverse : l’air vient du conduit, et ce qui reste du feu part vers la pièce. Une prise d’air extérieure vise à l’éviter : ce modèle n’en a pas, et il ne dit pas ce qu’elle y change.',
      'The fire is nearly over, the draught falls. A fan puts the house under depression and the flow reverses: air comes down the flue, and what is left of the fire goes into the room. An outside air inlet is meant to avoid that: this model has none, and does not say what it changes.',
    ],
  },
  'damper-on-embers': {
    name: ['Un clapet fermé sur les braises', 'A damper shut on embers'],
    lesson: [
      'Il n’y a pas de clapet sur cette machine, et voici pourquoi. Plus de flamme, des braises, et le conduit fermé pour garder la chaleur : les braises continuent de faire du CO, et il n’a plus d’autre chemin que la pièce. Lisez le CO, les repères de l’OMS, le temps que met un détecteur.',
      'There is no damper on this machine, and here is why. No flame, embers, and the flue shut to keep the heat in: embers go on making CO, and it has no other way but the room. Read the CO, the WHO guideline, the time an alarm takes.',
    ],
  },
};

export const REGIME_TEXTS: Record<CoRegime, Pair> = {
  none: ['Pas de feu', 'No fire'],
  clean: ['Flamme chaude', 'Hot flame'],
  lean: ['Beaucoup d’air, chambre tiède', 'Much air, a warm chamber'],
  coldChamber: ['Chambre froide', 'Cold chamber'],
  starved: ['Manque d’air', 'Short of air'],
  wet: ['Bois humide', 'Wet wood'],
  embers: ['Braises', 'Embers'],
  smokeBack: ['Retour de fumée', 'Smoke coming back'],
};

export const PHASE_TEXTS: Record<FirePhase, Pair> = {
  cold: ['Éteint', 'Out'],
  lighting: ['Il prend', 'Catching'],
  roaring: ['Il brûle', 'Burning'],
  burningDown: ['Il retombe', 'Burning down'],
  embers: ['Braises', 'Embers'],
};
