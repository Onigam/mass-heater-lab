// The Sources panel as data: the credits and the links to the sources of docs/research.md §1, the outline of the main video, in the lab's own words, and for each source how it was read. A source read only through a summary or a transcript is
// linked and credited, never quoted: nothing here is a quotation. No image or footage from any source is reused.
// NOT LINKED, on purpose (a test holds the list): the French tin-can tutorial (a different machine, which its author means for his van), the pages that sell plans (the richsoil page, the sales page, the plan annex, a book's sales page) and the unlicensed
// copies of the two books. The gallery video is seen and credited without a link, since its end sells plans: the owner's rule for this lab is to link nothing that does. `src/data/about.ts` builds the panel from this for `about` in src/lab.ts.

export type Access = 'read' | 'summary' | 'search' | 'transcript' | 'seen' | 'none';

export interface SourceEntry {
  /** No link: a book only sold or only found as an unlicensed copy, or a video that sells plans. */
  href?: string;
  label: string;
  fr: string;
  en: string;
  access: Access;
}

/** How a source was read, printed after it: the research's status, in words. */
export const ACCESS: Record<Access, readonly [string, string]> = {
  read: ['texte lu', 'text read'],
  summary: ['lu en résumé, à relire', 'read in summary, to re-read'],
  search: ['vu dans un résumé de recherche seulement', 'seen in a search summary only'],
  transcript: ['transcription locale, repères à vérifier', 'a local transcript, times to check'],
  seen: ['vu, sans lien', 'seen, no link'],
  none: ['non lu', 'not read'],
};

/** The main video: the builders' house in January. Proposed by the research, the owner's answer to its question 7 is pending. */
export const MAIN_VIDEO = {
  id: '4usXIAoy9us',
  href: 'https://www.youtube.com/watch?v=4usXIAoy9us',
  label: 'wood burning stoves - super efficient rocket mass heater',
};

/** The chapters of the main video, in the lab's words, from a local transcript: [timestamp, French, English]. */
export const CHAPTERS: [timestamp: string, fr: string, en: string][] = [
  ['00:00', 'Janvier, et la neige depuis octobre', 'January, with snow since October'],
  ['00:56', 'De quoi est fait le banc', 'What the bench is made of'],
  ['01:14', 'L’après-midi, sans feu aujourd’hui', 'The afternoon, with no fire today'],
  ['02:17', 'Le bois de la veille, à l’image', 'Yesterday’s wood, on camera'],
  ['03:28', 'Un bois médiocre, ce qu’ils en disent', 'Poor wood, and what they say of it'],
  ['04:28', 'Le couvercle du bidon, qui s’enlève', 'The drum’s lid, which comes off'],
  ['05:02', 'Le bidon levé, le foyer à nu', 'The drum lifted, the core bare'],
];

const s = (href: string | undefined, label: string, fr: string, en: string, access: Access): SourceEntry => ({
  ...(href === undefined ? {} : { href }),
  label,
  fr,
  en,
  access,
});

/** Groups of links, in reading order. */
export const SOURCES: { fr: string; en: string; items: SourceEntry[] }[] = [
  {
    fr: 'Les vidéos',
    en: 'The videos',
    items: [
      s(
        undefined,
        '12 rocket mass heater builds in 8 minutes (Paul Wheaton, 2026)',
        'une galerie de douze réalisations, sans parole : le compte des douze et l’allure des vrais bancs en viennent ; pas de lien, car sa fin vend des plans',
        'a gallery of twelve builds, with no speech: the count of the twelve and the look of real benches come from it; no link, since its end sells plans',
        'seen',
      ),
      s(
        'https://www.youtube.com/watch?v=cikCD1BT2og',
        'La minute permaculture #18 (Permaculture Design, 2019)',
        'l’introduction française, dans une maison très bien isolée',
        'the French introduction, in a very well insulated house',
        'transcript',
      ),
      s(
        'https://www.youtube.com/watch?v=kKErlLfXfl4',
        'What I Got Wrong About Rocket Mass Heaters (broaudio, 2026)',
        'le bilan d’un constructeur de 15 ans, sans chiffre',
        'a 15-year builder’s retrospective, without a figure',
        'transcript',
      ),
      s(
        'https://www.youtube.com/watch?v=A-xK7vZd7nk',
        'how is a rocket mass heater so efficient? (Paul Wheaton, 2022)',
        'les promesses et leurs chiffres, sans source donnée',
        'the claims and their figures, with no source given',
        'transcript',
      ),
      s(
        'https://www.youtube.com/watch?v=fwCz8Ris79g',
        'What is a rocket mass heater? (Paul Wheaton, 2017)',
        'le récit populaire, contredit en partie par des mesures',
        'the popular account, partly contradicted by measurements',
        'transcript',
      ),
      s(
        'https://www.youtube.com/watch?v=ebqWcTELHjA',
        'open and inspect a well used rocket mass heater (Paul Wheaton, 2025)',
        'un bidon levé après trois hivers de cendres',
        'a drum lifted after three winters of ash',
        'transcript',
      ),
      s(
        'https://www.youtube.com/watch?v=VL7O8qLXz24',
        'Batch Box Rocket Mass Heater with Peter van den Berg (2017)',
        'le foyer fermé de 8 pouces, sur un banc de gravier',
        'the 8-inch closed box, on a gravel bench',
        'transcript',
      ),
    ],
  },
  {
    fr: 'La machine, ses constructeurs et leurs livres',
    en: 'The machine, its builders and their books',
    items: [
      s(
        undefined,
        'Ianto Evans, Leslie Jackson, Rocket Mass Heaters, 3e éd., 2014',
        'le livre de référence ; lien omis, seule une copie non autorisée s’est présentée',
        'the reference book; no link, since only unlicensed copies came up',
        'search',
      ),
      s(
        undefined,
        'Erica et Ernie Wisner, The Rocket Mass Heater Builder’s Guide, New Society, 2016, ISBN 978-0865718234',
        'le guide de construction ; même raison, pas de lien',
        'the building guide; same reason, no link',
        'search',
      ),
      s(
        'https://conseils-thermiques.org/contenu/poele-rocket.php',
        'Poêle rocket : une arme de combustion massive ! (Conseils Thermiques)',
        'une vraie saison dans une yourte, racontée par ses habitants',
        'a real season in a yurt, told by those who live in it',
        'summary',
      ),
      s(
        'https://permies.com/t/3249/Rocket-stove-efficiency-certification',
        'Rocket stove efficiency/certification (Erica et Ernie Wisner, vers 2010)',
        'les chiffres des constructeurs eux-mêmes : séance, débit, températures, cendres',
        'the builders’ own numbers: session, burn rate, temperatures, ash',
        'summary',
      ),
      s(
        'https://www.permies.com/t/98054/RMH-Portland-Building-Code',
        'RMH Portland Building Code (permies.com, vers 2019)',
        'un projet de texte pour le comité consultatif d’une ville américaine, d’intérêt historique selon lui-même',
        'a draft text for one American city’s advisory committee, of historic interest by its own account',
        'summary',
      ),
      s(
        'https://permies.com/mobile/t/174789/Testo-results-ceramic-fiber-board',
        'Testo results from an 8" ceramic fiber board J tube (Luke Perkins, vers 2022)',
        'la seule analyse de gaz d’un tube en J avec des chiffres écrits que nous ayons trouvée, dans une vraie maison',
        'the only J-tube gas analysis with written figures we found, in a real house',
        'summary',
      ),
      s(
        'https://permies.com/t/36517/bench-temps',
        'bench temps (Thomas Rubino)',
        'un banc relevé pendant un feu et douze heures après, dans une serre',
        'a bench read during a burn and twelve hours after, in a greenhouse',
        'summary',
      ),
      s(
        'https://permies.com/t/24602/rocket-stoves/Concrete-Rocket-Mass-Heater',
        'Concrete Rocket Mass Heater (Baxter Tidwell, 2013)',
        'un banc de 35 pieds et 15 capteurs, mesuré avant d’être fini',
        'a 35-foot bench and 15 sensors, measured before it was finished',
        'summary',
      ),
      s(
        'https://permies.com/wiki/204531/annual-operation-fuel-cost-types',
        'annual operation/fuel cost of all types of heaters (permies.com)',
        'les cordes par an qui circulent ; le fil lui-même parle d’estimations',
        'the cords a year going round; the thread itself calls them estimates',
        'summary',
      ),
      s(
        'https://permies.com/wiki/103229/pep-rocket/Start-Operate-Tube-Rocket-Mass',
        'Start and Operate a J-Tube Rocket Mass Heater (permies.com)',
        'de vraies séances et leurs retours de fumée ; aucune procédure n’en est reprise',
        'real sessions and their smoke-backs; no procedure is taken from it',
        'summary',
      ),
      s(
        'https://permies.com/t/208769/Liberator-test-data-air-quality',
        'Liberator test data (permies.com, citant le manuel du fabricant)',
        'le seul essai tiers trouvé d’un appareil vendu sous ce nom, à granulés ; le rapport complet n’a pas été atteint',
        'the one third-party test we found of something sold under this name, on pellets; the full report was not reached',
        'summary',
      ),
    ],
  },
  {
    fr: 'Concepteurs, manuels et critiques',
    en: 'Designers, manuals and critics',
    items: [
      s(
        'https://batchrocket.eu/en/workings',
        'Batchrocket.eu, Workings (Peter van den Berg, CC BY-SA 4.0)',
        'le meilleur site technique : les faits en sont repris et crédités, et aucun de ses dessins n’est redessiné',
        'the best technical site: its facts are taken and credited, and none of its drawings is redrawn',
        'summary',
      ),
      s(
        'https://batchrocket.eu/en/building',
        'Batchrocket.eu, Building',
        'la table des deux feux par jour, pour un foyer fermé',
        'the two-fires-a-day table, for a closed box',
        'summary',
      ),
      s(
        'https://batchrocket.eu/en/applications',
        'Batchrocket.eu, Applications',
        'une vraie charge sur des machines réelles',
        'a real load on real machines',
        'summary',
      ),
      s('https://batchrocket.eu/en/designs', 'Batchrocket.eu, Designs', 'les variantes', 'the variants', 'summary'),
      s(
        'https://permies.com/t/40007/Results-batch-box-thingy-Innovators',
        'Results of the 8" batch box (Peter van den Berg, 2014)',
        'un essai mesuré : 312 ppm en moyenne, un rendement calculé',
        'a measured run: a mean of 312 ppm, a calculated efficiency',
        'summary',
      ),
      s(
        'https://www.oxalis-asso.org/wp-content/uploads/SUPPORT-DE-FORMATION-Mars-2016.pdf',
        'Poêle de masse accessible à tous (Oxalis, 2016)',
        'la source française sérieuse, libre de diffusion : un autre poêle, et le même sujet',
        'the serious French source, free to share: another stove, and the same subject',
        'read',
      ),
      s(
        'https://www.handprintpress.com/tech/improving-woodstove-efficiency-rocket-stoves-masonry-heaters/',
        'Improving woodstove efficiency (Alex Chernov, 2014)',
        'la critique d’un maçon, qui vend une autre conception',
        'a mason’s criticism, who sells another design',
        'summary',
      ),
      s(
        'https://www.handprintpress.com/home-heat/riding-a-russian-rocket/',
        'Riding a Russian rocket (Alex Chernov)',
        'le démarrage et les retours de fumée',
        'start-up and smoke-backs',
        'summary',
      ),
      s(
        'https://solidrockmasonry.com/rocket-mass-heaters/',
        'Rocket mass heaters (Eric Moshier, Solid Rock Masonry)',
        'pas d’essai normalisé pour cette machine, selon un maçon membre du comité de la norme, qui vend une autre conception',
        'no test standard exists for this machine, according to a mason on the standard’s committee, who sells another design',
        'summary',
      ),
      s(
        'https://solidrockmasonry.com/masonry-heater-building-codes/',
        'Masonry heater building codes (Solid Rock Masonry)',
        'les règles américaines, vues par lui',
        'the American rules, as he reads them',
        'summary',
      ),
      s(
        'https://solidrockmasonry.com/particulate-emissions-testing/',
        'Particulate emissions testing (Solid Rock Masonry)',
        'les essais et leurs limites',
        'tests and their limits',
        'summary',
      ),
      s(
        'https://aprovecho.org/publications/',
        'Designing Improved Wood Burning Heating Stoves (Aprovecho, 2005)',
        'des principes, et une contradiction sur le clapet dans le même rapport',
        'principles, and a contradiction on the damper in the same report',
        'read',
      ),
      s(
        'https://concord.org/blog/using-energy2d-to-simulate-rocket-mass-heaters',
        'Energy2D simulations (C. Xie)',
        'des simulations sans chimie, sans chiffre',
        'simulations with no chemistry and no figures',
        'summary',
      ),
      s(
        'https://en.wikipedia.org/wiki/Rocket_mass_heater',
        'Wikipedia, Rocket mass heater',
        'utilisé pour ses références ; l’article dit lui-même que la plupart des chiffres sont anecdotiques',
        'used for its references; the article itself says most figures are anecdotes',
        'summary',
      ),
    ],
  },
  {
    fr: 'Recherche et mesures',
    en: 'Research and measurements',
    items: [
      s(
        'https://doi.org/10.1016/j.applthermaleng.2015.10.035',
        'Schumack, A computational model for a rocket mass heater, Applied Thermal Engineering, 2016',
        'le seul article revu par des pairs : un modèle, derrière un péage ; nous n’avons lu que ses métadonnées',
        'the one peer-reviewed paper: a model, behind a paywall; we read only its metadata',
        'search',
      ),
      s(
        'https://erepo.uef.fi/bitstreams/9012c90d-6060-4bf1-98c6-79188966e555/download',
        'Kulmala, Particle and gaseous emissions from modern masonry heater (University of Eastern Finland, 2014)',
        'une mesure indépendante, sur un poêle de masse de 1 280 kg',
        'an independent measurement, on a masonry heater of 1,280 kg',
        'read',
      ),
      s(
        'https://cris.vtt.fi/en/publications/fine-particle-and-gaseous-emissions-from-normal-and-smouldering-w/',
        'Tissari et al., Atmospheric Environment, 2008',
        'le feu qui couve, mesuré contre le feu normal',
        'the smouldering fire, measured against a normal burn',
        'summary',
      ),
      s(
        'https://www.witpress.com/Secure/elibrary/papers/STR95/STR95023FU.pdf',
        'Goodhew, Grindley, Probert, cob earth-walling, 1995',
        'la terre mesurée : conductivité et capacité',
        'measured cob: conductivity and heat capacity',
        'read',
      ),
      s(
        'https://orca.cardiff.ac.uk/166658',
        'Haddad et al., review, 2024',
        'de 0,12 à 1,06 W/m·K, sans consensus',
        '0.12 to 1.06 W/m·K, with no consensus',
        'search',
      ),
      s(
        'https://researchportal.plymouth.ac.uk/en/publications/construction-field-monitoring-of-a-cob-prototype-building/',
        'A cob prototype, field monitoring',
        'la terre sur le terrain',
        'cob in the field',
        'search',
      ),
      s(
        'https://www.murugappamorgan.com/media/9428/jm-ifb-series_eng.pdf',
        'Morgan, JM insulating firebrick',
        'la fiche du fabricant',
        'the maker’s data sheet',
        'read',
      ),
      s(
        'https://morganthermalceramics.com/media/5855/3-superwool-plus-blanket.pdf',
        'Morgan, Superwool Plus blanket',
        'la fiche du fabricant',
        'the maker’s data sheet',
        'read',
      ),
      s(
        'https://inzonex.co.uk/insulation/materials/expanded-perlite/',
        'Expanded perlite (a commercial calculator)',
        'une courbe calculée, faible',
        'a calculated curve, weak',
        'search',
      ),
      s(
        'https://www.perlite.org/wp-content/uploads/2018/03/evacuated-perlite.pdf',
        'Perlite Institute',
        'les usages de la perlite',
        'perlite’s uses',
        'search',
      ),
      s(
        'https://blogs2.abo.fi/wp-content/uploads/sites/264/2025/04/Infosheet3_part1_Secure-Bio-Supply-eng.pdf',
        'Secure Bio Supply, infosheet 3 (Åbo Akademi, 2025)',
        'la formule de l’humidité du bois',
        'the formula for wood’s moisture',
        'search',
      ),
      s(
        'https://standards.iteh.ai/catalog/standards/cen/ea807886-810f-4965-8332-e7678eb05678/en-15544-2023',
        'EN 15544:2023 (catalogue page)',
        'le champ et les chiffres d’une norme payante, lus au catalogue ; un tube en J est hors de ce calcul, à notre lecture',
        'the scope and figures of a paid standard, read in its catalogue; a J-tube is outside this calculation, on our reading',
        'summary',
      ),
      s(
        'https://iris.who.int/handle/10665/260127',
        'WHO guidelines for indoor air quality: selected pollutants, 2010',
        'les valeurs guides du monoxyde de carbone',
        'the guideline values for carbon monoxide',
        'read',
      ),
      s(
        'https://www.mha-net.org/?p=2143',
        'Masonry Heater Association, a test log',
        'une page disparue, vue seulement dans un résumé',
        'a page now gone, seen in a summary only',
        'search',
      ),
      s(
        'https://denios.co.uk/products/174026',
        'A 200 L drum, a seller’s sheet',
        'les dimensions du bidon',
        'the drum’s dimensions',
        'search',
      ),
      s(
        'https://www.tankundlager.com/en/Galvanized-Metal-Drum-with-Bung-200L-595x595x820mm/B0458',
        'A 200 L drum, another seller',
        'la gamme de dimensions',
        'the range of dimensions',
        'search',
      ),
      s(
        'https://statistique.ge.ch/tel/publications/2024/donnees_generales/bulletin_stat/dg-bs-10-2024.pdf',
        'Geneva’s statistics office, 2024',
        'le mois de janvier du modèle, à vérifier',
        'the model’s January, to check',
        'search',
      ),
      s(
        'https://doi.org/10.5539/jsd.v5n10p40',
        'Akinjiola, Balachandran, 2012',
        'lu puis écarté : son pouvoir calorifique du bois est environ douze fois trop bas, et aucun chiffre n’en est repris',
        'read and set aside: its heating value for wood is about twelve times too low, and no figure is taken from it',
        'read',
      ),
    ],
  },
  {
    fr: 'Règles, assurance, monoxyde',
    en: 'Rules, insurance, carbon monoxide',
    items: [
      s(
        'https://www.bafu.admin.ch/dam/fr/sd-web/Ctcv70aNw6FD/Information_Inverkehrbringen_Feuerungen.pdf',
        'OFEV, installations de combustion, 2022, mis à jour en 2025',
        'la note fédérale suisse',
        'the Swiss federal note',
        'read',
      ),
      s(
        'https://www.legislation.gov.uk/eur/2015/1185/article/1',
        'Regulation (EU) 2015/1185, article 1 (UK copy)',
        'le champ de l’écoconception, lu dans la copie britannique',
        'the scope of ecodesign, read in the UK copy',
        'summary',
      ),
      s(
        'https://eur-lex.europa.eu/eli/reg/2015/1185',
        'Regulation (EU) 2015/1185, EUR-Lex',
        'le texte officiel, non ouvert',
        'the official text, not opened',
        'none',
      ),
      s(
        'https://www.poujoulat.fr/fr/energie-positive/reglementation/norme-nf-dtu-24-1-reglementation-des-conduits-de-fumee',
        'NF DTU 24.1 expliqué (Poujoulat, 2024)',
        'une règle française payante, résumée par un fabricant de conduits',
        'a paid French rule, summarised by a flue maker',
        'summary',
      ),
      s(
        'https://www.credit-agricole.fr/particulier/conseils/magazine/tout-un-mag/comment-assurer-une-cheminee-ou-un-poele-a-bois.html',
        'Comment assurer une cheminée ou un poêle à bois (Crédit Agricole, 2025)',
        'le guide d’une banque, pas d’un assureur de ce cas',
        'a bank’s guide, not an insurer on this case',
        'summary',
      ),
      s(
        'https://questions.assemblee-nationale.fr/dyn/14/questions/QANR5L14QE698.pdf',
        'Réponse ministérielle sur le ramonage',
        'l’article du règlement sanitaire',
        'the article of the health regulations',
        'search',
      ),
      s(
        'https://www.ecohabitation.com/guides/2704/chauffage-au-bois-les-rocket-stoves-des-foyers-de-masse-artisanaux/',
        'Écohabitation, 2012 (Québec)',
        'un guide qui renvoie à l’assureur',
        'a guide that points to the insurer',
        'summary',
      ),
      s(
        'https://ecologie-pratique.org/forum/viewtopic.php?showtopic=4174',
        'Un forum français',
        'un avis contraire, sans valeur d’assureur',
        'a contrary view, with no insurer’s weight',
        'search',
      ),
      s(
        'https://www.ge.ch/document/conditions-procedure-simplifiee-installation-bois-energie',
        'OCEN, canton de Genève, 2024',
        'les références de Genève, écrites pour des chaudières',
        'Geneva’s references, written for boilers',
        'summary',
      ),
      s(
        'https://selectra.info/energie/actualites/marche/cheminee-poele-bois-interdit-hiver-2026-communes',
        'Vallée de l’Arve, foyers ouverts',
        'l’interdiction locale',
        'the local ban',
        'search',
      ),
      s(
        'https://knowledge.bsigroup.com/products/gas-detectors-electrical-apparatus-for-the-detection-of-carbon-monoxide-in-domestic-premises-test-methods-and-performance-requirements/standard',
        'EN 50291-1, BSI',
        'le champ de la norme des détecteurs, payante',
        'the scope of the alarms’ standard, a paid one',
        'search',
      ),
      s('https://genorma.com/en/standards/pren-50291-1', 'prEN 50291-1', 'sa révision', 'its revision', 'search'),
      s(
        'https://www.smsp.fr/p/alarme-monoxyde-de-carbone/fiche-technique',
        'Un manuel de détecteur',
        'les délais de la norme, tels que les fabricants les citent',
        'the standard’s times, as makers quote them',
        'search',
      ),
      s(
        'https://www.bretagne.ars.sante.fr/media/145665/download',
        'ARS Bretagne, 2025',
        'les chiffres français du monoxyde, tous appareils',
        'the French figures for carbon monoxide, all appliances',
        'read',
      ),
      s(
        'https://particuliers.engie.fr/economies-energie/conseils-equipements-chauffage/conseils-equipements/detecteur-monoxyde-carbone',
        'Engie, 2026',
        'le détecteur, pas obligatoire en France à cette date',
        'the alarm, not compulsory in France at that date',
        'search',
      ),
      s(
        'https://questions.assemblee-nationale.fr/dyn/17/textes/l17b0606_proposition-loi.pdf',
        'Proposition de loi n° 606, 2024',
        'un projet qui le rendrait obligatoire',
        'a bill that would make it compulsory',
        'search',
      ),
    ],
  },
];

/**
 * The law, place by place, each line saying how it was reached: the research's §7.3, keeping its strength. Nothing below was checked by a lawyer. Quoted to no one, and not advice: it says where to ask.
 * [place, French, English]
 */
export const LAW: [place: readonly [string, string], fr: string, en: string][] = [
  [
    ['Union européenne', 'European Union'],
    'Le règlement sur l’écoconception 2015/1185 couvre les appareils jusqu’à 50 kW, et exclut ceux qui ne sont ni assemblés en usine ni fournis en éléments par un seul fabricant. Un poêle construit sur place semble donc hors de son champ ; un kit, non. Lu en résumé, dans la copie britannique.',
    'Ecodesign Regulation 2015/1185 covers heaters up to 50 kW, and excludes those neither factory assembled nor supplied as parts by one maker. So a heater built on site seems outside it; a kit does not. Read in summary, in the UK copy.',
  ],
  [
    ['France', 'France'],
    'Un conduit de raccordement n’a pas plus de 2 coudes et ne traverse pas d’autre pièce (NF DTU 24.1, résumé par un fabricant) : ce qu’est un banc de 9 m à ce titre reste la question à poser. Ramonage : deux fois par an, dont une pendant la chauffe, avec des variantes locales (vu dans un résumé de recherche). Assurance : à déclarer, mêmes règles pour qui installe soi-même (le guide d’une banque, lu en résumé). Construction neuve : un poêle sans régulation automatique ne serait pas admis comme chauffage principal (selon un manuel de 2016, lu ; la réglementation actuelle n’a pas été lue).',
    'A connecting pipe has at most 2 bends and crosses no other room (NF DTU 24.1, summarised by a maker): what a 9 m bench is under this remains the question to ask. Sweeping: twice a year, once during use, with local variants (seen in a search summary). Insurance: to be declared, same rules for a self-installer (a bank’s guide, read in summary). New build: a stove with no automatic control would not be accepted as the main heating (according to a 2016 manual, read; the current rule was not read).',
  ],
  [
    ['Vallée de l’Arve', 'Arve valley'],
    'Les foyers ouverts y sont interdits dans 41 communes depuis le 1er janvier 2022. Ce que cela veut dire pour un tube en J n’est écrit nulle part où nous ayons regardé : demander à la préfecture. Vu dans un résumé de recherche.',
    'Open fires are banned there in 41 communes since 1 January 2022. What that means for a J-tube is written nowhere we looked: ask the prefecture. Seen in a search summary.',
  ],
  [
    ['Suisse', 'Switzerland'],
    'Un appareil construit sur place n’est dispensé de preuve et de mesure de réception que dans des cas précis ; sinon, une mesure doit montrer 2 500 mg/m³ de CO et 100 mg/m³ de poussières au plus, à 13 % d’O₂. À notre lecture, un tube en J relève de ce cas. Bois naturel seulement. Note fédérale, texte lu. Les directives incendie sont cantonales (lu en résumé).',
    'A heater built on site is exempt from proof and an acceptance measurement only in specific cases; otherwise a measurement must show at most 2,500 mg/m³ of CO and 100 mg/m³ of dust, at 13 % O₂. On our reading, a J-tube falls there. Natural wood only. A federal note, text read. The fire directives are cantonal (read in summary).',
  ],
  [
    ['États-Unis', 'United States'],
    'Le code résidentiel renvoie à un texte sur les poêles de maçonnerie ou à un appareil homologué ; un poêle de terre à bidon ne serait pas un appareil reconnu, et un permis serait rarement donné. Un seul maçon le dit, et il vend une autre conception. Lu en résumé.',
    'The residential code points to a text on masonry heaters or to a listed unit; a cob and drum heater would not be a recognised appliance, and a permit would rarely be given. One mason says so, and he sells a rival design. Read in summary.',
  ],
  [
    ['Une ville américaine', 'One American city'],
    'Un projet de texte, écrit pour son comité consultatif : le seul document de ce genre que nous ayons trouvé, et nous n’avons pas atteint sa version actuelle. Un maçon dit qu’il conseille, et qu’il ne vaut pas permis. Lu en résumé.',
    'A draft text, written for its advisory committee: the only such document we found, and its current version was not reached. A mason says it advises, and is no permit. Read in summary.',
  ],
  [
    ['Québec, Canada', 'Quebec, Canada'],
    'Une inspection est demandée en bien des endroits, et les avis divergent sur l’assurance : un guide de 2012 parle de poêle de maçonnerie, sa foire aux questions d’un refus de couvrir l’auto-construction. Lu en résumé, sources faibles.',
    'An inspection is asked for in many places, and views differ on insurance: a 2012 guide speaks of a masonry heater, its FAQ of a refusal to cover self-build. Read in summary, weak sources.',
  ],
  [
    ['Royaume-Uni et ailleurs', 'United Kingdom and elsewhere'],
    'Non vérifié. Demandez, dans votre pays.',
    'Not checked. Ask, in your country.',
  ],
];

/** A link any test or reader can hold against: the pages that must not appear anywhere in the lab. */
export const NOT_LINKED = [
  'https://www.youtube.com/watch?v=XfRItGCXcfs', // the gallery of twelve builds: seen and credited, and its end sells plans
  'https://www.youtube.com/watch?v=uFUcffTFs-s', // the tin-can tutorial: a different machine, meant for its author's van
  'https://www.richsoil.com/rocket-stove-mass-heater.jsp', // sells plans
  'https://freeheat.info', // sells plans
  'https://permies.com/wiki/64029f100/Rocket-Mass-Heater-Plans-Annex', // sells plans
  'https://ecologie-pratique.org/staticpages/index.php/rocket-stoves---feux-de-bois-et-poeles-de-masse', // a book's sales page
] as const;
