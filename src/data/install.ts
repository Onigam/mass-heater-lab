// Installation guide: WHAT MUST BE TRUE BEFORE THE FIRST FIRE, 10 steps (docs/research.md §0.5, §4.5). From « does this house qualify » through the insurer in writing, the floor, the flue, the air and a professional's review, to the routine of a
// winter. Same honesty as the assembly guide: said once in the first step, every step ending with its origin, no recipe figure, no duration. Every id of `homestead` is installed in exactly one step; steps 2, 3, 7 and 8 install nothing.
// The law's detail is in the Sources panel, with how each line was reached (src/data/sources.ts). Step 2 says who to ask, nothing a lawyer has not read.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { step } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'qualify',
    scene: 'homestead',
    title: l('Cette maison convient-elle ?', 'Does this house qualify?'),
    text: step(
      'reported',
      'Ce guide dit ce qui devrait être vrai avant le premier feu : **c’est notre reconstitution, pas une procédure**. Tout commence par la **maison isolée**. Deux feux rendent environ {meanKw} kW jour et nuit (résultat du modèle) : si la maison perd plus que cela, il en faudra davantage, et aucune machine n’y changera rien. On contrôle : ce qu’elle perd, de préférence d’après ce qu’elle brûle déjà.',
      'This guide says what should be true before the first fire: **it is our reconstruction, not a procedure**. It all starts with the **insulated house**. Two fires deliver about {meanKw} kW day and night (model result): if the house loses more than that it will take more of them, and no machine will change that. To check: what it loses, preferably from what it already burns.',
      ['pour le principe ; les chiffres sont ceux du modèle', 'for the principle; the figures are the model’s'],
    ),
    parts: ['house-shell'],
    tools: [l('Le bois de l’hiver dernier, pesé', 'Last winter’s wood, weighed'), l('Thermicien', 'Heating engineer')],
  },
  {
    id: 'insurer',
    scene: 'homestead',
    title: l('L’assureur, par écrit, et les règles du pays', 'The insurer, in writing, and the rules of the country'),
    text: step(
      'reported',
      'La porte qui compte est là : **avant tout chantier, demander à votre assureur, par écrit**, s’il couvre cette machine en auto-construction, et à quelles conditions. Nous n’avons trouvé aucun texte d’assureur, et les sources sont en désaccord, certaines parlant de refus, d’autres de couverture complète. Les règles du pays viennent ensuite : les lignes du panneau Sources disent ce que nous en avons lu, et comment. Aucune n’a été vérifiée par un juriste.',
      'The gate that matters is here: **before any work, ask your insurer, in writing**, whether it covers this machine when self-built, and on what conditions. We found no insurer’s text, and the sources disagree, some speaking of refusal, others of full cover. The rules of the country come next: the lines of the Sources panel say what we read of them, and how. None has been checked by a lawyer.',
      ['et contradictoire', 'and contradictory'],
    ),
    parts: [],
    tools: [l('Votre assureur', 'Your insurer'), l('Votre mairie ou préfecture', 'Your town hall or prefecture')],
    warning: l(
      'Aucune norme que nous ayons lue ne dit qu’un tube en J en terre est sûr, et certaines disent qu’il n’est pas reconnu : on se renseigne avant, jamais après un sinistre.',
      'No standard we read says a cob J-tube is safe, and some say it is not recognised: find out before, never after a claim.',
    ),
  },
  {
    id: 'floor',
    scene: 'homestead',
    title: l('Ce que le sol peut porter', 'What the floor can carry'),
    text: step(
      'reported',
      'Environ {machineTonnes} t (estimation) sur le sol de la maison, soit environ {floorKn} kN/m² sous le banc (dérivé) : c’est trois fois les valeurs usuelles d’un plancher léger. Sur un plancher de bois, cette machine n’a rien à faire sans reprise de structure. On contrôle : un plan, ou un sondage, et l’avis écrit d’un ingénieur de structure. Si le sol tasse, la terre se fissure, et c’est le chemin des gaz qui s’ouvre.',
      'About {machineTonnes} t (estimate) on the house’s floor, about {floorKn} kN/m² under the bench (derived): three times the usual values of a light floor. This machine has no place on a timber floor without structural work. To check: a drawing or a test hole, and a structural engineer’s written word. If the floor settles the earth cracks, and the gases’ path opens.',
      ['pour la dalle, par un projet de texte', 'for the slab, by a draft text'],
    ),
    parts: [],
    tools: [l('Ingénieur de structure', 'Structural engineer')],
  },
  {
    id: 'flue-route',
    scene: 'homestead',
    title: l('Le chemin du conduit, et qui le ramonera', 'The flue’s route, and who will sweep it'),
    text: step(
      'reported',
      'Le **chapeau** doit sortir au-dessus du faîtage, et l’**accès du ramoneur** se pense maintenant. La hauteur compte : trop basse, il reste peu de marge sous le couvercle du bidon ; trop haute, trop d’air inutile (résultat du modèle). On contrôle : un ramoneur qui accepte de s’en charger, et qui l’écrit, avant de commencer.',
      'The **cap** has to rise above the ridge, and the **sweep’s access** is thought through now. Height counts: too low leaves little margin under the drum’s lid; too high draws too much useless air (model result). To check: a sweep who agrees to take it on, and says so in writing, before anything starts.',
      ['pour le faîtage, par une vidéo française', 'for the ridge, by a French video'],
    ),
    parts: ['chimney-cap', 'sweep-access'],
    tools: [l('Ramoneur', 'Sweep'), l('Fumiste', 'Flue installer')],
  },
  {
    id: 'air',
    scene: 'homestead',
    title: l('L’air du feu, et ce qui lui fait concurrence', 'The fire’s air, and what competes with it'),
    text: step(
      'reported',
      'La **prise d’air extérieure** répond à une question : d’où vient l’air de ce feu, dans une maison étanche ? Puis l’autre : qu’est-ce qui aspire dans cette maison ? Une hotte ou une ventilation simple flux peuvent retourner le conduit après le feu. On contrôle : la liste de tout ce qui extrait, et comment la maison se comporte quand tout marche à la fois, avec l’avis du professionnel du conduit.',
      'The **outside air inlet** answers one question: where does this fire’s air come from, in a tight house? Then the other: what sucks in this house? A kitchen fan or a single-flow ventilation system can turn the flue round after the fire. To check: a list of all that extracts, and how the house behaves when all of it runs at once, with the flue professional’s word.',
      ['par un manuel français', 'by a French manual'],
    ),
    parts: ['outside-air-inlet'],
    tools: [l('Professionnel du conduit', 'Flue professional'), l('Manomètre', 'Pressure gauge')],
  },
  {
    id: 'fuel',
    scene: 'homestead',
    title: l('Le bois, un an à l’avance', 'The wood, a year ahead'),
    text: step(
      'practice',
      'Le **bûcher** est prêt avant la machine, car le bois a besoin d’un an ou plus. La **pile**, l’**humidimètre**, le **billot** et le **taillis** posent une seule question : le bois de cet hiver est-il déjà sec ? À {seasonTonnes} t pour la saison (dérivé), cette maison reste modeste. On contrôle : sous 20 % sur une face fendue, et un temps de travail que vous acceptez vraiment.',
      'The **woodshed** is ready before the machine, since wood needs a year or more. The **stack**, the **moisture meter**, the **block** and the **coppice** ask one thing: is this winter’s wood already dry? At {seasonTonnes} t for the season (derived), this house stays modest. To check: under 20 % on a split face, and a working time you truly accept.',
      ['le seuil est celui d’un manuel français', 'the limit is a French manual’s'],
    ),
    parts: ['woodshed', 'cordwood-stack', 'moisture-meter', 'kindling-block', 'coppice-lot'],
    tools: [l('Humidimètre', 'Moisture meter'), l('Hachette', 'Hatchet')],
  },
  {
    id: 'professional',
    scene: 'homestead',
    title: l('L’œil d’un professionnel', 'A professional’s eye'),
    text: step(
      'reported',
      'Avant le premier vrai feu, quelqu’un qui connaît les conduits regarde tout : un ramoneur, un inspecteur, un maçon de poêles ; un analyseur de gaz si l’on peut en obtenir un. Ce labo ne remplace personne. En Suisse, une mesure de réception peut s’appliquer. On contrôle : ce qui a été vu, signé, et ce qui ne l’a pas été.',
      'Before the first true fire, someone who knows flues looks at it all: a sweep, an inspector, a stove mason; a gas analyser if one can be had. This lab replaces nobody. In Switzerland an acceptance measurement may apply. To check: what has been seen, signed, and what has not.',
      ['pour la mesure suisse, lue dans une note fédérale', 'for the Swiss measurement, read in a federal note'],
    ),
    parts: [],
    tools: [l('Ramoneur ou inspecteur', 'Sweep or inspector'), l('Analyseur de gaz', 'Gas analyser')],
  },
  {
    id: 'small-fires',
    scene: 'homestead',
    title: l('De petits feux, regardés', 'Small fires, watched'),
    text: step(
      'reported',
      'Les premiers feux sont petits, et quelqu’un les regarde. Plusieurs récits rapportent de la fumée à l’allumage et un premier feu de saison plus difficile. Rien ici n’est un mode d’emploi : cette étape dit seulement ce qui doit être vrai pendant que cela arrive. On contrôle : un détecteur de CO qui marche, personne d’endormi, et une sortie à portée de main.',
      'The first fires are small, and someone watches them. Several accounts report smoke on lighting and a harder first fire of a season. Nothing here is a set of instructions: this step only says what has to be true while this goes on. To check: a working CO alarm, nobody asleep, and a way out within reach.',
      ['par des récits de constructeurs', 'by builders’ accounts'],
    ),
    parts: [],
    tools: [l('Détecteur de CO', 'CO alarm'), l('Thermomètre de fumée', 'Flue thermometer')],
    warning: l(
      'L’œil ne juge pas le monoxyde, et une machine qui fume une fois n’en a pas fini : à la moindre alarme on sort, on aère, et on appelle les secours.',
      'The eye cannot judge carbon monoxide, and a machine that smokes once is not done with it: at any alarm, get out, air the house, and call the emergency services.',
    ),
  },
  {
    id: 'winter',
    scene: 'homestead',
    title: l('La routine d’un hiver', 'A winter’s routine'),
    text: step(
      'reported',
      'Le **seau à cendres** sert de symbole à tout ce qui suit : vider à froid, sortir, ouvrir les trappes à froid, et faire venir le ramoneur selon les règles du pays. Tenir un carnet : bois, sortie, cendres, fissures. On contrôle : une séance demande de 2 à 4 h, selon une constructrice : ce rythme s’accepte, ou la machine n’est pas la bonne. Une vie qui n’a pas ce temps-là a d’autres solutions.',
      'The **ash bucket** stands for all that follows: empty cold, take it out, open the doors cold, and have the sweep come under the rules of the country. Keep a notebook: wood, exhaust, ash, cracks. To check: a session takes 2 to 4 h, according to one builder: that rhythm is accepted, or this is not the right machine. A life without that time has other solutions.',
      ['par une constructrice et un guide d’assurance', 'by one builder and an insurance guide'],
    ),
    parts: ['ash-bucket'],
    tools: [l('Ramoneur', 'Sweep'), l('Un carnet', 'A notebook')],
  },
  {
    id: 'signs',
    scene: 'homestead',
    title: l('Lire les signes', 'Reading the signs'),
    text: step(
      'practice',
      'La **cheminée du voisin** sert de repère à ce qu’on ne veut pas voir chez soi : une colonne grise qui s’attarde. Le thermomètre de fumée, la forme de la journée et le tas de bois en janvier disent le reste, et ce que le corps sent ne dit rien du monoxyde. On contrôle : ce qui change d’un jour à l’autre à bois égal, car une machine change rarement sans raison.',
      'The **neighbour’s chimney** is a mark for what you do not want to see at home: a grey column that lingers. The flue thermometer, the shape of the day and the wood pile in January tell the rest, and what the body feels says nothing of carbon monoxide. To check: what changes from one day to the next on the same wood, since a machine rarely changes without a reason.',
    ),
    parts: ['smoky-neighbour'],
    tools: [l('Thermomètre de fumée', 'Flue thermometer'), l('Un carnet', 'A notebook')],
  },
];
