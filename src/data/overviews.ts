// The text of the side panel while nothing is selected in a world: `{ title, text }` per world, for the lead to wire in src/lab.ts (`scenes[i].overview = { ...OVERVIEWS.homestead, actions: [...] }`; the actions use the `go…` strings of
// src/i18n/ui.ts). Bold on part names, what to look at, how to start; a blank line is a paragraph break. The first overview defines the words: a rocket cook stove belongs outdoors, a mass heater has a chimney, once. « Explains, not a plan » is said
// once here and at length in the Sources panel.
import { type L } from '@onigam/lab-kit/i18n';
import type { WorldId } from './ids';
import { lf } from './part-helpers';

/**
 * One plain line in every overview, on what this machine can do, in the words the CO alarm's sheet and the notice of the Sources already use: the first screen must not stay silent on it (review D6, the owner's decision). The rule of
 * « each truth said once » binds the voice, not this line.
 */
export const FIRE_LINE = {
  fr: 'Un poêle de masse brûle du bois dans une maison où l’on dort : le monoxyde de carbone et le feu peuvent y tuer.',
  en: 'A mass heater burns wood in a house where people sleep: carbon monoxide and fire can kill.',
} as const;
const lined = (fr: string, en: string): L => {
  const at = (text: string, line: string) => {
    const end = text.indexOf('\n\n');
    return `${text.slice(0, end)}\n\n${line}${text.slice(end)}`;
  };
  return lf(at(fr, FIRE_LINE.fr), at(en, FIRE_LINE.en));
};

export const OVERVIEWS: Record<WorldId, { title: L; text: L }> = {
  homestead: {
    title: lf('Deux feux par jour : pour quelle maison ?', 'Two fires a day: for which house?'),
    text: lined(
      'Voici un poêle de masse à tube en J, souvent appelé « rocket mass heater » : un feu couché dans un tunnel, un bidon d’acier qui chauffe tout de suite, puis environ 9 m de conduit noyés dans {benchTonnes} t de terre (dérivé), la banquette, et une cheminée. Même nom, autre machine : un réchaud « rocket » en boîtes de conserve se garde dehors ; **un poêle de masse a une cheminée**. Ce labo explique, il ne donne aucun plan.\n\nLa maison est générique, le **bûcher** et la **pile** sont à l’échelle d’une saison, {seasonTonnes} t (dérivé). **Pour commencer** : cliquez la **maison** pour entrer, lancez la **Simulation**, puis cherchez sa réponse : ce n’est pas le feu qui fait l’essentiel, ce sont les murs. Dans ce modèle, {woodDay} kg de bois (hypothèse) tiennent la pièce à {roomMean} °C dans une maison qui perd {houseH} W/K, et il en faudrait {woodLeaky} kg à {leakyH} W/K (résultat du modèle).',
      'Here is a J-tube mass heater, often called a “rocket mass heater”: a fire lying down in a tunnel, a steel drum that heats at once, then about 9 m of duct buried in {benchTonnes} t of earth (derived), the bench, and a chimney. Same name, another machine: a “rocket” cook stove made of tins belongs outdoors; **a mass heater has a chimney**. This lab explains, it gives no plan.\n\nThe house is generic, the **woodshed** and the **stack** are to the scale of a season, {seasonTonnes} t (derived). **To start**: click the **house** to go in, run the **Simulation**, then look for its answer: the fire does not do most of it, the walls do. In this model {woodDay} kg of wood (assumption) hold the room at {roomMean} °C in a house losing {houseH} W/K, and it would take {woodLeaky} kg at {leakyH} W/K (model result).',
    ),
  },
  'living-room': {
    title: lf('Le bidon tout de suite, la banquette ensuite', 'The drum at once, the bench later'),
    text: lined(
      'La pièce en coupe : le **bidon**, la **banquette** le long de deux murs, le **conduit vertical**, la **dalle**, l’**écran thermique**, les **détecteurs**, le **mur de refend**. La vue thermique les colore en direct : c’est une fausse couleur, en °C, et un jour entier passe sous le curseur.\n\n**À regarder** : le bidon donne près de {drumBurst} kW par grands coups, la banquette {benchKwLow} à {benchKwHigh} kW jour et nuit, et l’assise culmine **une à deux heures après la flamme**, à {seatHigh} °C (résultat du modèle). Ce n’est pas elle qui porte la maison : le bidon lui donne deux fois plus de chaleur, et elle lisse. La pièce va de {roomLow} à {roomHigh} °C. Un **feu** est ici une séance menée de {sessionHours} h (hypothèse), matin et soir, pas une brassée et un départ.\n\nCliquez le **bidon** pour ouvrir le foyer, la **banquette** pour la voir en coupe.',
      'The room in section: the **drum**, the **bench** along two walls, the **chimney**, the **slab**, the **heat shield**, the **alarms**, the **stone wall**. The thermal view colours them live: it is false colour, in °C, and a whole day passes under the slider.\n\n**What to look at**: the drum gives nearly {drumBurst} kW in great bursts, the bench {benchKwLow} to {benchKwHigh} kW day and night, and the seat peaks **one to two hours after the flame**, at {seatHigh} °C (model result). The bench does not carry the house: the drum gives twice its heat, and it smooths. The room runs from {roomLow} to {roomHigh} °C. A **fire** here is a tended session of {sessionHours} h (assumption), morning and evening, not an armful and away.\n\nClick the **drum** to open the core, the **bench** to see it in section.',
    ),
  },
  'fire-core': {
    title: lf('Où ça brûle, et dans quel sens ça va', 'Where it burns, and which way it goes'),
    text: lined(
      'Toujours en coupe. Le **tube d’alimentation** où le bois se tient debout, le **tunnel de feu** où la flamme se couche, la **cheminée interne** où la fumée finit de brûler, et l’**espace sous le couvercle**, où les gaz font demi-tour pour la **chute dans le bidon**.\n\n**À regarder** : activez **Flux** et le **ralenti**. Ce n’est pas la cheminée interne qui tire : avec le bidon, elle ne pèse que {netPa} Pa, et le **conduit vertical** {chimneyPa} Pa (résultat du modèle). Puis lancez « Le feu refuse » : le courant est à l’envers, le feu ne le retourne pas seul. Le rendement, {eta} % rendus à la maison et {etaFlue} % par un calcul de fumées (résultat du modèle), dépend surtout de l’air qui entre au tube, et **aucune source ne chiffre ce passage**.',
      'Always in section. The **feed tube** where the wood stands upright, the **burn tunnel** where the flame lies down, the **heat riser** where the smoke finishes burning, and the **gap under the lid**, where the gases turn back for the **fall inside the drum**.\n\n**What to look at**: switch on **Flows** and **Slow-mo**. The riser is not what draws: with the drum it weighs only {netPa} Pa, against {chimneyPa} Pa for the **chimney** (model result). Then run “The fire refuses”: the flow is backwards, and the fire does not turn it alone. The efficiency, {eta}% delivered to the house and {etaFlue}% by a flue calculation (model result), rests mostly on the air coming in at the feed, and **no source gives a figure for that opening**.',
    ),
  },
  'bench-section': {
    title: lf('Où va la chaleur', 'Where the heat goes'),
    text: lined(
      'Une tranche de banquette, grossie : le **début du conduit** et sa **fin** côte à côte, la **terre qui garde** et ses **pierres**, l’**enduit**, un **coude**, une **trappe**, le **té** et sa **purge**, et à côté un **banc de galets**, l’autre école.\n\n**À regarder** : la **Coupe** et le curseur d’heure. La chaleur va du conduit vers l’assise, et continue quand la flamme est morte : la terre au-dessus du conduit monte à {earthDuct} °C, l’assise à {seatHigh} °C au bout épais et {seatColdHigh} °C au bout mince, {lagStop} h et {lagStopCold} h après l’arrêt du bois (résultat du modèle). Sept heures après le feu du soir, elle est encore à {seatAfter7} °C. Ces couleurs se lisent sur la même échelle que dans la pièce.',
      'A slice of bench, magnified: the **hot run** and the **cold run** side by side, the **cob casing** and its **stones**, the **plaster**, a **bend**, a **cleanout**, the **tee** and its **drain**, and beside them a **pebble bench**, the other school.\n\n**What to look at**: **Section** and the hour slider. Heat goes from the duct to the seat, and carries on once the flame is dead: the earth above the duct climbs to {earthDuct} °C, the seat to {seatHigh} °C at the thick end and {seatColdHigh} °C at the thin end, {lagStop} h and {lagStopCold} h after the wood stops (model result). Seven hours after the evening fire it is still at {seatAfter7} °C. These colours read on the same scale as in the room.',
    ),
  },
};
