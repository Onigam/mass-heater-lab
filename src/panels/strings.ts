import { getLang, registerStrings, tx } from '@onigam/lab-kit/i18n';
import { ALARM_TEXTS, PHASE_TEXTS, PRESET_TEXTS, REGIME_TEXTS, SCENARIO_TEXTS, type Pair } from '../sim/texts';

// The words of the simulation panel, French and English written together: `key: [fr, en]`. They are kept apart from src/i18n/ui.ts, which belongs to the data role, so that the two can be
// written at the same time. The texts of the alarms and the scenarios come from src/sim/texts.ts.

const PANEL = {
  simTitle2: ['Simulation', 'Simulation'],
  simIntro: [
    'Un modèle d’un poêle générique dans une maison générique. Nous n’avons trouvé aucune mesure en laboratoire de la chaleur que rend un vrai poêle de ce type : les chiffres viennent de ce calcul, avec des estimations là où les sources se taisent.',
    'A model of a generic heater in a generic house. We found no laboratory measurement of the heat a real heater of this kind delivers: the figures come from this calculation, with estimates where the sources are silent.',
  ],
  safetyNote: [
    'Une absence d’alarme ici ne dit rien d’une vraie installation : un modèle ne peut pas dire qu’un poêle est sûr. Une vraie maison demande un détecteur de monoxyde dans la pièce, un professionnel du conduit et l’avis de votre assureur : l’un signale une panne, l’autre juge le conduit, le dernier dit ce qu’il couvre. Aucun ne garantit l’air de la pièce.',
    'The absence of an alarm here says nothing about a real installation: a model cannot say that a heater is safe. A real house calls for a CO alarm in the room, a flue professional and your insurer’s word: one signals a fault, one judges the flue, the last says what it covers. None of them vouches for the air in the room.',
  ],
  tagLegend: [
    '† résultat du modèle · * estimation : les sources se taisent.',
    '† result of the model · * estimate: the sources are silent.',
  ],
  preset: ['Point de départ', 'Starting point'],
  custom: ['Réglages personnels', 'Custom settings'],
  resetSim: ['Recommencer', 'Start again'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioHint: [
    'Chacun raconte une chose. Ils règlent eux-mêmes la vitesse du temps.',
    'Each tells one thing. They set the speed of time themselves.',
  ],

  // ---- the status line
  statusOut: [
    'Le feu est éteint. La banquette continue de rendre ce qu’elle a pris.',
    'The fire is out. The bench goes on giving back what it took.',
  ],
  statusCatching: [
    'Le feu prend, le foyer est encore froid : la fumée n’a pas encore la chaleur qu’il lui faut pour finir de brûler.',
    'The fire is catching, the core is still cold: the smoke does not yet have the heat it needs to finish burning.',
  ],
  statusBurningHot: [
    'La flamme est couchée, la chambre est chaude : la fumée finit de brûler dans la cheminée interne.',
    'The flame lies down, the chamber is hot: the smoke finishes burning in the riser.',
  ],
  statusBurningLean: [
    'Le feu brûle, avec beaucoup d’air : la chambre reste plus tiède que ce que lisent les constructeurs sur un feu propre.',
    'The fire burns, with much air: the chamber stays cooler than what builders read on a clean burn.',
  ],
  statusCold: [
    'Trop d’air pour ce feu : la chambre est trop froide, la fumée ne finit pas de brûler.',
    'Too much air for this fire: the chamber is too cold, the smoke does not finish burning.',
  ],
  statusStarved: [
    'Le feu manque d’air : ce qui ne brûle pas part en monoxyde et en fumée.',
    'The fire is short of air: what does not burn leaves as carbon monoxide and smoke.',
  ],
  statusWet: [
    'Du bois humide : une part de la chaleur sert à faire de la vapeur.',
    'Wet wood: part of the heat goes to making steam.',
  ],
  statusDown: ['On ne charge plus : le feu retombe.', 'No more wood: the fire falls.'],
  statusEmbers: [
    'Plus de flamme, des braises : elles font encore du monoxyde, et il a besoin du conduit pour partir.',
    'No flame, embers: they still make carbon monoxide, and it needs the flue to leave.',
  ],
  statusSmoke: [
    'Le courant va dans le mauvais sens : la fumée part vers la pièce.',
    'The flow goes the wrong way: the smoke goes into the room.',
  ],
  statusColdFlue: [
    'Pas de feu, et le conduit froid pèse vers le bas : l’air du dehors tombe jusque dans la pièce.',
    'No fire, and the cold flue weighs downwards: outside air falls into the room.',
  ],
  statusDamper: [
    'Ce clapet n’existe pas sur cette machine : il est là pour montrer ce qu’il ferait.',
    'This damper does not exist on this machine: it is here to show what it would do.',
  ],

  // ---- the hour
  thermalLabel: ['Vue thermique', 'Thermal view'],
  thermalHint: [
    'En °C, la même échelle partout : déplacez l’heure et regardez la banquette se charger puis rendre sa chaleur.',
    'In °C, the same scale everywhere: move the hour and watch the bench charge, then give its heat back.',
  ],
  hourLabel: ['L’heure de la journée', 'The hour of the day'],
  hourHint: [
    'Faites glisser : la machine se place à cette heure de sa journée établie, et le temps repart de là.',
    'Drag: the machine moves to that hour of its settled day, and time goes on from there.',
  ],
  lightFire: ['Allumer un feu', 'Light a fire'],
  addLoad: ['Ajouter une charge', 'Add a load'],
  closeLid: ['Fermer le couvercle', 'Close the lid'],
  openLid: ['Rouvrir', 'Open again'],

  // ---- the live figures
  livePhase: ['Le feu', 'The fire'],
  liveFire: ['Feu', 'Fire'],
  liveChamber: ['Chambre', 'Chamber'],
  liveExhaust: ['Sortie', 'Exhaust'],
  liveDraft: ['Tirage', 'Draught'],
  liveDrum: ['Bidon', 'Drum'],
  liveSeatHot: ['Banc, chaud', 'Bench, hot'],
  liveSeatCold: ['Banc, froid', 'Bench, cold'],
  liveRoom: ['Pièce', 'Room'],
  liveDrumOut: ['Bidon rend', 'Drum gives'],
  liveBenchOut: ['Banc rend', 'Bench gives'],
  liveWood: ['Bois du jour', 'Wood today'],
  liveRoomCo: ['CO, pièce', 'CO, room'],

  coTitle: ['Le monoxyde : une indication, jamais une mesure', 'Carbon monoxide: an indication, never a measurement'],
  coRegime: ['Régime', 'Regime'],
  coFlue: ['Dans les fumées', 'In the flue'],
  coRoom: ['Dans la pièce', 'In the room'],
  coNoLeak: ['aucune fuite simulée', 'no leak simulated'],
  coIntoRoom: ['Part qui entre dans la pièce', 'Share entering the room'],
  coLid: ['Pression sous le couvercle du bidon', 'Pressure under the drum’s lid'],
  coHint: [
    'Aucun modèle validé ne donne le monoxyde de cette machine, et l’œil ne le juge pas. Le régime compte d’abord ; le chiffre est le milieu d’une bande de un à neuf. Sous le couvercle, une pression positive veut dire qu’une fuite laisse sortir des fumées.',
    'No validated model gives the carbon monoxide of this machine, and the eye cannot judge it. The regime comes first; the figure is the middle of a band from one to nine. Under the lid, a positive pressure means a leak lets gas out.',
  ],

  // ---- the day
  dayTitle: ['Une journée, une fois le rythme pris', 'A day, once the rhythm has settled'],
  chartBench: ['La banquette se charge, puis rend (°C)', 'The bench charges, then gives back (°C)'],
  chartBenchHint: [
    'Le feu s’arrête, et le banc continue de monter : la chaleur traverse la terre. C’est ce qu’on sent en s’asseyant, une à deux heures après la flamme.',
    'The fire stops, and the bench goes on rising: the heat is crossing the earth. That is what you feel when you sit down, one to two hours after the flame.',
  ],
  chartPower: ['Ce que chacun rend à la maison (kW)', 'What each gives to the house (kW)'],
  chartPowerHint: [
    'Le bidon rend sa chaleur tout de suite et par grands coups, le banc lentement et sans s’arrêter.',
    'The drum gives its heat at once and in great bursts, the bench slowly and without stopping.',
  ],
  chartHot: ['Les parties chaudes (°C)', 'The hot parts (°C)'],
  seriesSeatHot: ['Banc, côté chaud', 'Bench, hot end'],
  seriesSeatCold: ['Banc, côté froid', 'Bench, cold end'],
  seriesRoom: ['Pièce', 'Room'],
  seriesOutside: ['Dehors', 'Outside'],
  seriesFire: ['Feu', 'Fire'],
  seriesDrum: ['Bidon', 'Drum'],
  seriesBench: ['Banc', 'Bench'],
  seriesChamber: ['Chambre', 'Chamber'],
  seriesExhaust: ['Sortie', 'Exhaust'],
  markNow: ['maintenant', 'now'],
  computing: ['Calcul en cours…', 'Working it out…'],

  budgetTitle: ['Où va le bois d’un jour', 'Where a day’s wood goes'],
  budgetDrum: ['Bidon', 'Drum'],
  budgetBench: ['Banc', 'Bench'],
  budgetCore: ['Foyer et sol', 'Core and floor'],
  budgetFlueIn: ['Conduit, dans la maison', 'Flue, indoors'],
  budgetLost: ['Parti dehors', 'Gone outside'],
  budgetUnburned: ['Non brûlé', 'Unburned'],
  budgetHint: [
    'Aucune source ne donne ce partage : il sort du modèle, et il dépend d’abord de l’air qui entre, le chiffre qu’aucune source ne donne. Le rendement ci-dessous bouge de plus de dix points avec lui.',
    'No source gives this split: it comes out of the model, and it depends first on the air coming in, the figure no source gives. The efficiency below moves by over ten points with it.',
  ],
  effDelivered: ['Ce que la maison garde du bois', 'What the house keeps of the wood'],
  effFlue: ['Ce qu’un calcul de fumées dirait', 'What a flue calculation would say'],
  effWood: ['Bois du jour', 'Wood of the day'],
  effRoom: ['Pièce, moyenne', 'Room, mean'],
  effSwing: ['Pièce, du plus bas au plus haut', 'Room, lowest to highest'],
  effPeak: ['Le banc culmine', 'The bench peaks'],
  effPeakUnit: ['h après le début du dernier feu', 'h after the last fire began'],
  effNeeded: ['Bois pour tenir la pièce à sa consigne', 'Wood to hold the room at its target'],
  effExhaust: ['Sortie, en moyenne d’un feu', 'Exhaust, mean of a fire'],
  effLambda: ['Excès d’air, en moyenne d’un feu', 'Excess air, mean of a fire'],
  effCondensate: ['Eau condensée', 'Water condensed'],

  // ---- the pressure along the path
  chartPath: ['La pression le long du chemin (Pa)', 'The pressure along the path (Pa)'],
  chartPathHint: [
    'Contre l’air d’à côté, de l’entrée du tube au chapeau. C’est la cheminée qui tire : la cheminée interne et le bidon, ensemble, pèsent bien moins. Ici on perd surtout à l’entrée, dans le passage laissé au feu.',
    'Against the air beside it, from the feed to the cap. The chimney is what pulls: the riser and the drum together weigh far less. Most is lost here at the entry, in the way left to the fire.',
  ],
  chartGas: ['Le gaz le long du chemin (°C)', 'The gas along the path (°C)'],
  seriesPressure: ['Pression', 'Pressure'],
  seriesGas: ['Gaz', 'Gas'],
  draftRiser: ['Cheminée interne et bidon', 'Riser and drum'],
  draftChimney: ['Cheminée', 'Chimney'],

  chartSection: ['Du conduit à l’assise (°C)', 'From the duct to the seat (°C)'],
  chartSectionHint: [
    'La température à travers la terre, à cet instant, au début et à la fin du banc. Pendant le feu, la terre près du conduit monte vite et l’assise bien moins ; une à deux heures après la flamme, cette chaleur monte encore vers l’assise.',
    'The temperature through the earth, at this moment, at the start and the end of the bench. During the fire the earth by the duct climbs fast and the seat far less; one to two hours after the flame, that heat is still rising to the seat.',
  ],
  seriesHotEnd: ['Début du banc', 'Start of the bench'],
  seriesColdEnd: ['Fin du banc', 'End of the bench'],

  // ---- the claims
  claimTitle: ['« 80 à 90 % de bois en moins » ?', '“80 to 90 % less wood”?'],
  claimIntro: [
    'Ces chiffres ne bouclent pas avec le poêle seul. Le bois économisé dépend surtout de l’ancien poêle et de la maison. Réglez le rendement réel de l’ancien poêle.',
    'These figures do not balance from the stove alone. The wood saved depends mostly on the old stove and the house. Set the real efficiency of the old stove.',
  ],
  oldStove: ['Rendement réel de l’ancien poêle', 'Real efficiency of the old stove'],
  claimStove: ['Gagné en changeant de poêle seulement', 'Saved by changing the stove alone'],
  claimBoth: ['Gagné en isolant la maison aussi', 'Saved by insulating the house too'],
  claimFor80: ['Pour 80 %, l’ancien poêle devait tourner à', 'For 80 %, the old stove had to run at'],
  claimFor90: ['Pour 90 %, à', 'For 90 %, at'],
  claimHint: [
    'Un poêle ancien mené au ralenti peut réellement tourner aussi bas. Mais c’est l’isolation et la conduite du feu qui font alors l’essentiel. Le comparatif prend une maison qui perd trois fois plus.',
    'An old stove run at a slow burn can really run that low. But then insulation and the way of firing do most of the work. The comparison takes a house that loses three times as much.',
  ],

  // ---- the settings
  secFire: ['Le feu', 'The fire'],
  firesPerDay: ['Feux par jour', 'Fires a day'],
  morningHour: ['Feu du matin', 'Morning fire'],
  eveningHour: ['Feu du soir', 'Evening fire'],
  sessionHours: ['Durée d’un feu', 'Length of a fire'],
  feedKgH: ['Bois à l’heure', 'Wood per hour'],
  loadKg: ['Charge', 'Load'],
  burnMinutes: ['Durée de la charge', 'Length of the load'],
  moisture: ['Humidité du bois', 'Moisture of the wood'],
  feedCover: ['Part cachée du haut du tube', 'Share of the feed’s top covered'],
  packing: ['Place libre entre les bûchettes', 'Room left between the sticks'],
  lidAfterFire: ['Un couvercle une fois les braises éteintes', 'A lid once the embers are out'],
  fireHint: [
    'Le passage de l’air est le réglage dont tout dépend, et aucune source ne le chiffre. Sa valeur ici est une estimation : une brique posée à plat sur le tube.',
    'The way left to the air is the setting everything depends on, and no source gives a figure. Its value here is an estimate: one brick laid flat on the feed.',
  ],
  secMachine: ['La machine', 'The machine'],
  machineHint: [
    'Ces curseurs servent à comprendre un modèle. Aucun n’est une cote à construire.',
    'These sliders are for understanding a model. None is a size to build.',
  ],
  riserHeight: ['Hauteur de la cheminée interne', 'Height of the riser'],
  topGap: ['Passage sous le couvercle', 'Gap under the lid'],
  riserInsulation: ['Isolant de la cheminée interne', 'Insulation of the riser'],
  insFirebrick: ['Brique isolante', 'Insulating firebrick'],
  insFibre: ['Couverture de fibre', 'Fibre blanket'],
  insPerlite: ['Perlite', 'Perlite'],
  ductLength: ['Longueur du conduit', 'Length of the duct'],
  chimneyTop: ['Haut de la cheminée', 'Top of the chimney'],
  flueInsulated: ['Conduit isolé', 'Insulated flue'],
  ductFilm: ['Échange gaz-conduit, multiplié par', 'Gas-to-duct exchange, multiplied by'],
  ductFilmHint: [
    'Le gaz dans le conduit coule entre deux régimes, et aucune source ne chiffre l’échange. Ce seul nombre décide de la température de sortie.',
    'The gas in the duct runs between two regimes, and no source gives the exchange. This one number decides the exhaust temperature.',
  ],
  benchFill: ['Le banc', 'The bench'],
  fillCob: ['Terre et pierres', 'Earth and stones'],
  fillPebble: ['Galets (aucun chiffre publié)', 'Pebbles (no published figure)'],
  benchK: ['Conductivité du banc', 'Conductivity of the bench'],
  secHouse: ['La maison et le temps', 'The house and the weather'],
  houseH: ['Ce que perd la maison par degré', 'What the house loses per degree'],
  gains: ['Personnes, appareils, soleil', 'People, appliances, sun'],
  outsideMean: ['Dehors, en moyenne', 'Outside, on average'],
  outsideSwing: ['Écart du jour à la nuit', 'Swing between day and night'],
  houseHint: [
    'Une maison générique en une seule zone, au climat d’un janvier du bassin genevois. Une chambre fermée serait plus froide. Les chiffres de la maison sont des hypothèses.',
    'A generic house as one zone, in a January of the Geneva basin. A closed bedroom would be colder. The figures of the house are assumptions.',
  ],
  secFaults: ['Ce qui peut mal tourner', 'What can go wrong'],
  fanPa: ['Dépression d’une hotte ou d’une VMC', 'Depression from a fan'],
  damperClosed: ['Un clapet fermé dans le conduit', 'A damper shut in the flue'],
  leakCm2: ['Défaut au joint du couvercle', 'A flaw in the lid’s seal'],
  faultHint: [
    'Il n’y a aucun clapet sur cette machine. Fermer le conduit sur des braises, c’est envoyer leur monoxyde dans la pièce.',
    'There is no damper on this machine. To shut the flue on embers is to send their carbon monoxide into the room.',
  ],

  secFigures: ['Tous les chiffres', 'All the figures'],
  moreLambda: ['Excès d’air', 'Excess air'],
  moreO2: ['O₂ lu par un analyseur', 'O₂ an analyser would read'],
  moreFlow: ['Débit d’air', 'Air flow'],
  moreRiser: ['Haut de la cheminée interne', 'Top of the riser'],
  moreAfter: ['Après le bidon', 'After the drum'],
  moreDew: ['Point de rosée', 'Dew point'],
  moreBrick: ['Briques du foyer', 'Firebrick'],
  moreCasing: ['Enveloppe de terre', 'Earthen casing'],
  moreSleeve: ['Chemise d’acier', 'Steel sleeve'],
  moreFlueIn: ['Conduit, dans la maison', 'Flue, indoors'],
  moreFlueOut: ['Conduit, dehors', 'Flue, outdoors'],
  moreStone: ['Mur de refend', 'Stone wall'],
  moreOutside: ['Dehors', 'Outside'],
  moreCoreOut: ['Rendu par le foyer', 'From the core'],
  moreEnvelope: ['Perdu par les murs', 'Lost through the walls'],
  moreFlue: ['Parti par la cheminée', 'Up the chimney'],
  moreAsh: ['Cendres depuis le début', 'Ash since the start'],
  moreWoodTotal: ['Bois depuis le début', 'Wood since the start'],
  moreMass: ['Masse du banc', 'Mass of the bench'],

  // ---- the strip
  stripFire: ['Feu', 'Fire'],
  stripDraft: ['Tirage', 'Draught'],
  stripExhaust: ['Sortie', 'Exhaust'],
  stripDrum: ['Bidon', 'Drum'],
  stripSeat: ['Banc', 'Bench'],
  stripRoom: ['Pièce', 'Room'],
} as const satisfies Record<string, Pair>;

const fromSim = (prefix: string, table: Record<string, Pair>): Record<string, Pair> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [`${prefix}:${k}`, v]));

const SIM_TEXTS: Record<string, Pair> = {
  ...fromSim('alarm', Object.fromEntries(Object.entries(ALARM_TEXTS).map(([k, v]) => [k, v.text]))),
  ...fromSim('preset', PRESET_TEXTS),
  ...fromSim('scenario', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.name]))),
  ...fromSim('lesson', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.lesson]))),
  ...fromSim('regime', REGIME_TEXTS),
  ...fromSim('phase', PHASE_TEXTS),
};

/** Every word of the panel, for the parity test. */
export const PANEL_STRINGS: Record<string, Pair> = { ...PANEL, ...SIM_TEXTS };

registerStrings(PANEL_STRINGS);

export type PanelKey = keyof typeof PANEL;

/** A word of the panel in the language of the moment. */
export const st = (key: PanelKey): string => tx(key);

/** A word that comes from the simulation: `sx('alarm', 'smokeBack')`. */
export const sx = (table: 'alarm' | 'preset' | 'scenario' | 'lesson' | 'regime' | 'phase', id: string): string =>
  tx(`${table}:${id}`);

/** A number with the decimal mark of the language; no "-0". */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  const v = Math.round(Math.abs(value) * 10 ** digits) === 0 ? 0 : value;
  return v.toLocaleString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
