import { registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels, guides) live in the kit; the simulation panel's words live in src/panels/strings.ts, written by the physics role. This file holds the frame's
// words for this lab: titles, worlds, and the Sources panel's notices. The safety notice, « educational reconstruction » and the law are said here, once.

export const LAB_STRINGS = {
  labTitle: ['LABO DU POÊLE DE MASSE', 'MASS HEATER LAB'],
  // the top bar shows about 60 capitals at 1280 px, and cuts the rest; the longer line is for the showcase, in public/lab.json
  tagline: [
    'Feu couché, banquette de terre : deux feux, quelle maison ?',
    'A sideways fire, an earthen bench: two fires, which house?',
  ],

  // ---- the worlds and the shortcuts between them
  sceneHomestead: ['La maison', 'The house'],
  sceneLivingRoom: ['La pièce', 'The room'],
  sceneFireCore: ['Le foyer', 'The core'],
  sceneBenchSection: ['Le banc', 'The bench'],
  goHomestead: ['Voir la maison et son bois', 'See the house and its wood'],
  goLivingRoom: ['Entrer dans la pièce', 'Step into the room'],
  goFireCore: ['Ouvrir le foyer', 'Open the core'],
  goBenchSection: ['Voir le banc en coupe', 'See the bench in section'],

  // ---- the kit's pill when no alarm is on says « Tout fonctionne » / « All good »: a model that raises no alert has not said the air is good. `registerStrings` overwrites a common key. At 1024 px the strip has room for about 14 characters: « Aucune alerte du modèle » ran off the window
  allGood: ['Aucune alerte', 'No alert'],

  // ---- the intros
  plansIntro: [
    'Dix planches A3 générées à partir des dimensions du modèle 3D et des résultats de la simulation : la pièce, le chemin des gaz déroulé, le foyer en coupe, le tracé du conduit, le banc en coupe, les matériaux, la journée, le tirage, le bilan et la chaîne de sécurité. Ce sont des schémas explicatifs, avec des cotes d’ensemble seulement : aucun n’est un plan de construction.',
    'Ten A3 sheets generated from the dimensions of the 3D model and the results of the simulation: the room, the gases’ path unrolled, the core in section, the duct’s route, the bench in section, the materials, the day, the draught, the balance and the safety chain. They are explanatory diagrams, with overall sizes only: none is a construction drawing.',
  ],
  lessonsIntro: [
    'Six leçons, chacune ouverte sur un scénario de la simulation, qui en parcourent les douze : le feu qui va de côté, la fumée qui est du combustible, où va la chaleur, ce que charge et rend une banquette, la maison qui fait l’essentiel, et le monoxyde. Le cœur est dans la quatrième et la cinquième.',
    'Six lessons, each opening on a scenario of the simulation, going through all twelve: the fire that goes sideways, smoke that is fuel, where the heat goes, what a bench charges and gives back, the house that does most of it, and carbon monoxide. The heart is in the fourth and the fifth.',
  ],

  // ---- the notices of the Sources panel, each said once
  safety: [
    'Reconstitution pédagogique, pas un plan. Un poêle de masse brûle du bois dans une maison où l’on dort : il peut tuer par le monoxyde de carbone et par le feu. On n’en construit pas d’après ce site. Avant tout projet : votre assureur par écrit, un professionnel du conduit, un détecteur de monoxyde.',
    'An educational reconstruction, not a plan. A mass heater burns wood in a house where people sleep: carbon monoxide and fire can kill. Do not build one from this site. Before any project: your insurer in writing, a flue professional, a CO alarm.',
  ],
  hazards: [
    'Les dangers d’une vraie machine, réunis une fois : le monoxyde, qu’on ne voit ni ne sent, d’un feu mal mené, de braises, d’un conduit froid ou d’une fissure ; le feu de conduit et le rayonnement d’un bidon sur un mur ; le retour de fumée par un tube ouvert ; les brûlures ; environ 3,4 t sur un sol ; un bidon récupéré, ses restes et sa peinture ; la poussière de fibre et de silice au montage.',
    'The hazards of a real machine, gathered once: carbon monoxide, neither seen nor smelt, from a badly run fire, embers, a cold flue or a crack; a flue fire and a drum’s radiation on a wall; smoke-back through an open feed; burns; about 3.4 t on a floor; a recovered drum, its residues and paint; fibre and silica dust at the build.',
  ],
  disclaimer: [
    'Reconstitution indépendante d’une classe de machines : ce n’est le produit de personne, ni un plan, ni une affiliation à qui que ce soit. La maison est générique. Aucune image, aucun extrait et aucun dessin d’une source n’est repris, et les conceptions citées restent celles de leurs auteurs.',
    'An independent reconstruction of a class of machine: it is nobody’s product, nor a plan, nor affiliated with anyone. The house is generic. No image, clip or drawing from any source is reused, and the designs cited remain their authors’.',
  ],
  noticeReading: [
    'Comment lire les chiffres. Sans mention, un chiffre est rapporté par une source, nommée en toutes lettres. « Dérivé » : calculé à partir de chiffres rapportés. « Résultat du modèle » : sorti de la simulation, jamais réglé pour retrouver une source. « Hypothèse » et « estimation » : les sources se taisent, et le choix est le nôtre. « À plein feu » : le modèle à 9 h, pendant le feu du matin ; « en moyenne d’un feu » couvre toute la séance. Un astérisque après un encombrement : la taille de notre dessin générique, pas une cote. Le monoxyde est une carte encadrée par quelques lectures, avec un régime et une bande de un à neuf : elle donne un sens et un ordre, jamais la mesure d’une vraie pièce.',
    'How to read the figures. With no mention, a figure is reported by a source, named in words. “Derived”: computed from reported figures. “Model result”: out of the simulation, never set to match a source. “Assumption” and “estimate”: the sources are silent, and the choice is ours. “At full fire”: the model at 9 h, during the morning fire; “the mean of a fire” covers the whole session. An asterisk after an envelope: the size of our generic drawing, not a dimension. Carbon monoxide is a map bracketed by a few readings, with a regime and a band of one to nine: it gives a direction and an order, never the measurement of a real room.',
  ],
  lawTitle: ['Le droit, l’assurance : ce que nous en avons lu', 'The law, insurance: what we read of them'],
  legal: [
    'Rien de ce qui suit n’a été vérifié par un juriste, et ce n’est pas un avis juridique : chaque ligne dit comment nous l’avons atteinte. Nous n’avons trouvé aucune norme qui dise qu’un tube en J en terre est sûr, et certaines disent qu’il n’est pas reconnu. L’assureur est le vrai passage : demandez-lui, avant, et par écrit. Aucune source lue n’émane d’un assureur.',
    'None of what follows has been checked by a lawyer, and this is not legal advice: each line says how we reached it. We found no standard saying a cob J-tube is safe, and some say it is not recognised. The insurer is the real gate: ask it, before, and in writing. No source we read comes from an insurer.',
  ],
  mainSource: ['Source principale :', 'Main source:'],
  mainSourceNote: [
    '— le film de 2012 chez ses constructeurs, en plein mois de janvier. Il ne mesure rien. Les chiffres du labo viennent de constructeurs, de fiches de fabricants, de quelques laboratoires et de notre modèle : nous n’avons trouvé aucun essai indépendant du rendement d’un tube en J en terre.',
    '— the 2012 film in its builders’ house, in the middle of January. It measures nothing. The lab’s figures come from builders, makers’ data sheets, a few laboratories and our model: we found no independent test of the efficiency of a cob J-tube.',
  ],
  chapters: ['Le film, chapitre par chapitre', 'The film, chapter by chapter'],
  sourcesNotLinked: [
    'Ne sont pas liés ici, volontairement : les pages qui vendent des plans, et la galerie vidéo dont la fin y renvoie ; les copies non autorisées des deux livres ; et un tutoriel de réchaud en boîtes de conserve, une autre machine, que son auteur destine à son fourgon.',
    'Left unlinked on purpose: the pages that sell plans, and the video gallery whose end points to them; unlicensed copies of the two books; and a tutorial for a tin-can cook stove, another machine, which its author means for his van.',
  ],
  sourcesNoCopy: [
    'Merci à Paul Wheaton, Erica et Ernie Wisner, Permaculture Design, broaudio, Ianto Evans, Leslie Jackson, Peter van den Berg, Oxalis, Mark Schumack, à l’université de Finlande orientale et à l’OFEV. Le foyer fermé de Peter van den Berg est sous licence CC BY-SA 4.0 : ce labo en reprend des faits et le crédite, sans redessiner aucun de ses plans. Les sources lues en résumé sont créditées ici sans être citées.',
    'Thanks to Paul Wheaton, Erica and Ernie Wisner, Permaculture Design, broaudio, Ianto Evans, Leslie Jackson, Peter van den Berg, Oxalis, Mark Schumack, the University of Eastern Finland and the Swiss FOEN. Peter van den Berg’s closed box is under a CC BY-SA 4.0 licence: this lab takes facts from it and credits him, redrawing none of his plans. Sources read in summary are credited here, not quoted.',
  ],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB_STRINGS);

export type UiKey = keyof typeof LAB_STRINGS | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}
