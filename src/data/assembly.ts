// Assembly guide: HOW A MASON RAISES IT, 20 steps (docs/research.md §0.5, §4.5). The visitor is not meant to build this machine, so the frame's « Assembly » mode tells the order of the work and says, for each step, what it is FOR, what is
// checked and what goes wrong if it is skipped. The honesty of the guide:
//   - said once, in the first step: this is our reconstruction, not a plan to follow;
//   - every step ends with its origin, « Origine : rapporté / pratique courante / notre reconstitution » (`step` in part-helpers.ts; data.test.ts checks it);
//   - no recipe: no brick layout, no mix, no mortar, no curing or first-fire schedule, no thickness, no clearance, no lighting method. `torque` and `duration` stay empty. `tools` lists trades and instruments.
//   - every id of `living-room`, `fire-core` and `bench-section` is installed in exactly one step, in its own world, so nothing floats (Mill's test).
// One departure from docs/research.md §4.5, forced by the kit (a step plays in one world): step 15 there mixes `temperature-lance` (bench) and `flue-thermometer` (room), step 20 mixes the core and the room. The thermometer goes with the
// chimney (14), the probe with the earth (15), and the first fires (19) are told apart from a winter in the room (20). Still twenty. docs/data.md says so.
// Warnings are said once, where the gesture is risky: dust (3), fibre (7), a fire in an open core (8), a recovered drum (10), galvanised steel (11), height (14), the fires that follow (19).
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { step } from './part-helpers';

export const ASSEMBLY: GuideStep[] = [
  {
    id: 'slab',
    scene: 'living-room',
    title: l('Ce qui porte tout', 'What carries it all'),
    text: step(
      'reported',
      'Ce guide raconte comment un maçon de poêles élève une telle machine : **c’est notre reconstitution, pas un plan à suivre**, et ce n’est pas d’après ce site qu’on en construit une. Tout commence par la **dalle**, qui reçoit environ {machineTonnes} t (estimation). On contrôle : ce que le sol peut porter, avec un ingénieur de structure. Si l’on saute cette étape, le sol tasse, la terre fissure, et une fissure est une fuite.',
      'This guide tells how a stove mason raises such a machine: **it is our reconstruction, not a plan to follow**, and nobody builds one from this site. It all starts with the **slab**, which takes about {machineTonnes} t (estimate). To check: what the ground can carry, with a structural engineer. Skip this and the floor settles, the earth cracks, and a crack is a leak.',
      ['pour le béton, d’après un projet de texte', 'for the concrete, from a draft text'],
    ),
    parts: ['hearth-slab'],
    tools: [l('Ingénieur de structure', 'Structural engineer'), l('Maçon', 'Mason')],
  },
  {
    id: 'floor-layer',
    scene: 'bench-section',
    title: l('Regarder ce qu’il y a dessous', 'Look at what lies beneath'),
    text: step(
      'reported',
      'La **couche sur la dalle** sépare la masse de ce qu’elle ne doit pas chauffer. Elle sert à une chose : qu’aucune mousse ni aucun plancher ne se retrouve sous la chaleur. On contrôle : ce qui se trouve réellement sous la dalle, plans et sondages à l’appui. Sinon, un isolant fond ou couve sous {benchTonnes} t de terre (dérivé), là où personne n’ira voir avant longtemps.',
      'The **floor layer** separates the mass from what it must not heat. It is there for one thing: that no foam and no timber floor ends up under the heat. To check: what truly lies under the slab, with drawings and test holes. Otherwise an insulation melts or smoulders under {benchTonnes} t of earth (derived), where nobody will look for a long time.',
      ['par un manuel français', 'by a French manual'],
    ),
    parts: ['floor-barrier'],
    tools: [l('Maçon', 'Mason'), l('Sondage du plancher', 'Floor test hole')],
  },
  {
    id: 'base',
    scene: 'fire-core',
    title: l('Le socle du feu', 'The fire’s base'),
    text: step(
      'practice',
      'Le **socle en briques** porte tout le foyer et doit rester d’aplomb, puisque la flamme y passe et que chaque pièce se pose dessus. C’est de l’argile réfractaire dense, un matériau que connaissent les maçons de poêles. Ce labo ne donne aucun plan de pose : pas de nombre de briques, pas de recette de joint. On contrôle : le niveau et l’assise.',
      'The **firebrick base** carries the whole core and must stay true, since the flame passes there and each piece rests on it. It is dense fireclay, a material stove masons know. This lab gives no laying plan: no brick count, no recipe for a joint. To check: level and bearing.',
    ),
    parts: ['firebrick-base'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Niveau', 'Spirit level')],
    warning: l(
      'Couper de la brique à sec dégage une poussière de silice qui s’inhale : aspiration, masque adapté, et pas dans la pièce où l’on vit.',
      'Cutting brick dry gives off silica dust that can be breathed in: extraction, a suitable mask, and not in the room you live in.',
    ),
  },
  {
    id: 'tunnel',
    scene: 'fire-core',
    title: l('Le tunnel où la flamme se couche', 'The tunnel where the flame lies down'),
    text: step(
      'practice',
      'Le **tunnel de feu** tient la flamme à l’horizontale, entre deux parois chaudes, et mélange l’air au gaz. Sa section suit celle de tout le chemin, et ses proportions restent ici les mots d’un projet de texte : aucune longueur n’est donnée. On contrôle : un passage régulier, sans dent ni rétrécissement, et des joints qui ne laissent pas voir le jour. Sinon, c’est la flamme qui trouve ces défauts avant vous.',
      'The **burn tunnel** holds the flame flat between two hot walls, and mixes the air with the gas. Its section follows that of the whole path, and its proportions stay here as a draft text’s words: no length is given. To check: an even way with no step or narrowing, and joints that let no daylight through. Otherwise the flame finds these flaws before you do.',
    ),
    parts: ['burn-tunnel'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Lampe', 'Torch')],
  },
  {
    id: 'feed',
    scene: 'fire-core',
    title: l('Le tube d’alimentation', 'The feed tube'),
    text: step(
      'reconstruction',
      'Le **tube d’alimentation** est maçonné au-dessus de l’entrée du tunnel : à cet endroit-là se décide presque tout l’air du feu. Sur cette machine, il n’y a pas de porte. Le passage laissé à l’air n’a pas de source chiffrée, ni ici ni ailleurs dans ce que nous avons lu. On contrôle : un col propre et solide, car c’est lui que le bois heurte tous les jours, et l’aplomb, pour que le bois glisse.',
      'The **feed tube** is built up over the entry of the tunnel: that is where nearly all the fire’s air is decided. On this machine there is no door. The way left to the air has no sourced figure, here or anywhere in what we read. To check: a clean, sound collar, since the wood knocks it every day, and plumb, so the wood slides.',
    ),
    parts: ['feed-tube'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Fil à plomb', 'Plumb line')],
  },
  {
    id: 'riser',
    scene: 'fire-core',
    title: l('La cheminée interne', 'The heat riser'),
    text: step(
      'reported',
      'La **cheminée interne** monte d’aplomb au-dessus du tunnel. Elle sert à une chose : garder la fumée assez chaude et assez longtemps pour qu’elle finisse de brûler. L’exemple d’un livre lu en résumé parle de 0,84 m, et sa plage va de 0,64 à 1,27 m. On contrôle : l’aplomb et le raccord avec le tunnel. Si elle fuit à sa base, le feu n’y passe plus entier, et personne ne le verra de l’extérieur.',
      'The **heat riser** climbs plumb over the tunnel. It is there for one thing: keeping the smoke hot enough for long enough to finish burning. A book’s example, read in a digest, speaks of 0.84 m, and its range runs from 0.64 to 1.27 m. To check: plumb, and the joint with the tunnel. If it leaks at the foot, the fire no longer passes whole, and nobody will see it from outside.',
      ['pour la hauteur, lue en résumé', 'for the height, read in a digest'],
    ),
    parts: ['heat-riser'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Fil à plomb', 'Plumb line')],
  },
  {
    id: 'insulation',
    scene: 'fire-core',
    title: l('L’isolant et sa chemise', 'The insulation and its sleeve'),
    text: step(
      'practice',
      'L’**isolant** garde le feu chaud, et la **chemise d’acier** le tient, du côté froid, loin de la flamme. C’est le choix qui rend ce feu propre, et le modèle le trouve peu sensible à la matière : à un point près. On contrôle : un isolant bien tassé, qui ne descendra pas à l’usage, et une chemise d’aplomb, centrée pour laisser le même passage tout autour.',
      'The **insulation** keeps the fire hot, and the **steel sleeve** holds it, on the cold side, away from the flame. This choice makes the fire clean, and the model finds it hardly sensitive to the material: within a point. To check: insulation well packed, that will not drop with use, and a plumb sleeve, centred to leave the same way all round.',
      ['pour les matières, d’après les fiches des fabricants', 'for the materials, from makers’ data sheets'],
    ),
    parts: ['riser-insulation', 'riser-sleeve'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Fiches des fabricants', 'Makers’ data sheets')],
    warning: l(
      'La fibre céramique ordinaire a une classification sanitaire que nous n’avons pas vérifiée, et le fabricant d’une fibre à faible biopersistance dit la sienne exonérée : lisez la fiche, et traitez cette poussière comme un risque.',
      'Ordinary ceramic fibre has a health classification we did not check, and the maker of a low-biopersistence fibre says its own is exempt: read the data sheet, and treat this dust as a risk.',
    ),
  },
  {
    id: 'casing',
    scene: 'fire-core',
    title: l('L’enveloppe, et un feu d’essai à découvert', 'The casing, and a trial fire uncovered'),
    text: step(
      'practice',
      'L’**enveloppe de terre** tient le foyer et ferme le chemin des gaz. Avant de refermer quoi que ce soit, un maçon essaie généralement ce foyer à découvert, avec un petit feu, pour voir s’il tire et où la fumée passe. On contrôle : le sens du courant, et ce qui fuit tant qu’on peut encore le voir. Ce labo ne donne ni mélange ni temps de séchage.',
      'The **earthen casing** holds the core and closes the gases’ path. Before anything is closed in, a mason generally tries this core uncovered, with a small fire, to see if it draws and where smoke gets by. To check: the direction of the flow, and what leaks while it can still be seen. This lab gives neither mix nor drying time.',
    ),
    parts: ['core-casing'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Détecteur de CO', 'CO alarm')],
    warning: l(
      'Un feu dans un foyer sans sa cheminée complète peut enfumer la pièce et produire du monoxyde : c’est une affaire de professionnel, avec la sortie des gaz assurée et un détecteur en marche.',
      'A fire in a core without its full chimney can fill the room with smoke and make carbon monoxide: that is a professional’s business, with the gases’ way out assured and an alarm on.',
    ),
  },
  {
    id: 'before-drum',
    scene: 'fire-core',
    title: l('Ce qui doit être juste avant le bidon', 'What must be right before the drum'),
    text: step(
      'reported',
      'Une fois le bidon en place, on ne voit plus rien. Avant, donc : l’**espace sous le couvercle**, réglé par la hauteur de la cheminée interne ; la **chute**, le passage tout autour ; le **pied**, qui fermera le bas ; et le **joint du couvercle**. On contrôle : un passage régulier, un pied qui porte partout, un joint qui appuie sur toute sa bride. Sinon, c’est là qu’une fuite sera la plus proche de vous.',
      'Once the drum is in place, nothing more can be seen. So, before: the **gap under the lid**, set by the riser’s height; the **fall**, the way all round; the **foot**, which will close the bottom; and the **lid seal**. To check: an even way, a foot that bears all round, a seal that presses all along its flange. Otherwise this is where a leak will be nearest to you.',
      [
        'pour le joint, par des constructeurs ; le pied est notre reconstitution',
        'for the seal, by builders; the foot is our reconstruction',
      ],
    ),
    parts: ['drum-plinth', 'drum-seal', 'top-gap', 'downdraft-annulus'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Joint de porte de poêle', 'Stove-door gasket')],
  },
  {
    id: 'drum',
    scene: 'living-room',
    title: l('Le bidon descend', 'The drum comes down'),
    text: step(
      'reported',
      'Le **bidon** descend sur son pied, et le **collecteur** et sa **trappe** relient sa base au futur conduit. Le bidon sert à rendre la chaleur à l’instant. Un bidon propre, sans marque, est ce que nous dessinons, nettoyé de ce qu’il contenait. On contrôle : que rien ne frotte, que la trappe s’ouvre encore une fois tout en place, et que le joint porte.',
      'The **drum** comes down on its foot, and the **manifold** and its **cleanout** join its base to the duct to come. The drum is there to give the heat at once. A clean drum with no brand is what we draw, cleaned of what it held. To check: that nothing rubs, that the door still opens once everything is in place, and that the seal bears.',
    ),
    parts: ['manifold', 'manifold-cleanout', 'steel-drum'],
    tools: [l('Deux personnes', 'Two people'), l('Maçon de poêles', 'Stove mason')],
    warning: l(
      'Un bidon récupéré est un danger en soi : les restes de solvant ou d’huile sont dangereux à ouvrir à chaud, sa peinture et son contenu brûlent au premier feu. Personne ne l’ouvre au chalumeau.',
      'A recovered drum is a hazard in itself: traces of solvent or oil are dangerous to open with heat, and its paint and contents burn at the first fire. Nobody opens one with a torch.',
    ),
  },
  {
    id: 'hot-run',
    scene: 'bench-section',
    title: l('Le début du conduit, ses coudes, ses raccords', 'The hot run, its bends, its joints'),
    text: step(
      'practice',
      'Le **début du conduit** part du collecteur avec ses **coudes** et ses **raccords**. C’est là que le plus de chaleur sort, donc ce qui est le plus sollicité. On contrôle : chaque raccord, un à un, tant qu’il se voit, puis en le testant à la fumée : une photo de chaque, et une liste. Sous la terre, cette chance n’existe plus.',
      'The **hot run** leaves the manifold with its **bends** and **joints**. Here most of the heat comes off, so here is what works hardest. To check: every joint, one by one, while it can be seen, then by testing with smoke: a photograph of each, and a list. Under the earth, this chance is gone.',
    ),
    parts: ['duct-hot-run', 'duct-bend', 'duct-joint'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Fumigène de contrôle', 'Test smoke')],
    warning: l(
      'Dans le feu, l’acier galvanisé dégage des fumées de zinc (connaissance usuelle, que nous n’avons pas vérifiée). Des images de vrais chantiers montrent un conduit qui lui ressemble : notre dessin est en acier nu, et pour cette raison.',
      'In fire, galvanised steel gives off zinc fumes (usual knowledge, which we did not check). Pictures of real builds show duct that looks like it: our drawing is in plain steel, for that reason.',
    ),
  },
  {
    id: 'cold-run',
    scene: 'bench-section',
    title: l('La fin du conduit, sa trappe', 'The cold run, its door'),
    text: step(
      'practice',
      'La **fin du conduit** poursuit le chemin, et la **trappe du banc** garde le passage du ramoneur. Ce tronçon sert à reprendre les derniers degrés, sans tuer le tirage. On contrôle : une légère pente qui évite un point bas où l’eau resterait, et une trappe qu’une brosse peut vraiment emprunter sur toute la longueur.',
      'The **cold run** carries the path on, and the **bench cleanout** keeps the sweep’s way open. This stretch takes up the last degrees without killing the draught. To check: a slight slope that avoids a low spot where water would stay, and a door a brush can truly use along the whole length.',
    ),
    parts: ['duct-cold-run', 'bench-cleanout'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Ramoneur', 'Sweep')],
  },
  {
    id: 'tee',
    scene: 'bench-section',
    title: l('Le té, la purge', 'The tee, the drain'),
    text: step(
      'reported',
      'Le **té de pied** joint le conduit à la cheminée, et la **purge** évacue l’eau si elle apparaît. Sur nos 9 m rien ne condense dans le modèle ; sur un long conduit, oui. On contrôle : un joint étanche, une purge qui mène quelque part. Un manuel français y signale aussi le geste des constructeurs face à un conduit froid : ce guide le raconte, sans en faire une méthode.',
      'The **chimney tee** joins the duct to the chimney, and the **drain** takes water away if any appears. On our 9 m nothing condenses in the model; on a long duct, it does. To check: a tight joint, a drain that leads somewhere. A French manual also points to builders’ way with a cold flue here: this guide tells of it without making it a method.',
      ['par un manuel français', 'by a French manual'],
    ),
    parts: ['chimney-tee', 'condensate-drain'],
    tools: [l('Maçon de poêles', 'Stove mason'), l('Ramoneur', 'Sweep')],
  },
  {
    id: 'chimney',
    scene: 'living-room',
    title: l('Le conduit traverse le plafond', 'The flue goes through the ceiling'),
    text: step(
      'reported',
      'Le **conduit vertical**, isolé, monte à travers la **traversée de plafond**, avec sa **trappe de pied** et son **thermomètre**. C’est lui le moteur de toute la machine, quand il est chaud. Ces pièces-là s’achètent, certifiées, et se posent selon leur notice ; un professionnel les connaît. On contrôle : la distance de sécurité du fabricant, et ce qui est stocké dans les combles.',
      'The insulated **chimney** climbs through the **ceiling crossing**, with its **foot cleanout** and its **thermometer**. It is the engine of the whole machine when warm. These parts are bought, certified, and fitted to their notice; a professional knows them. To check: the maker’s safety distance, and what is stored in the loft.',
      ['par un fabricant de conduits', 'by a flue maker'],
    ),
    parts: ['chimney-flue', 'ceiling-crossing', 'chimney-cleanout', 'flue-thermometer'],
    tools: [l('Fumiste', 'Flue installer'), l('Charpentier', 'Carpenter')],
    warning: l(
      'Travail en hauteur et percement d’une toiture : affaire de professionnel, échafaudage et harnais. Sous le toit, il arrive de trouver autre chose que ce que disait le plan.',
      'Work at height and a hole through a roof: a professional’s business, with scaffold and harness. Under a roof you may find other than what the drawing said.',
    ),
  },
  {
    id: 'earth',
    scene: 'bench-section',
    title: l('La sonde, puis la terre et les pierres', 'The probe, then the earth and stones'),
    text: step(
      'reported',
      'Si l’on veut un jour savoir ce qui se passe, la **sonde** se pose maintenant. Puis la **terre qui garde** et les **pierres** recouvrent tout. Elles servent à une chose : stocker et ralentir. Plus de terre au début, moins ensuite, comme le demande un projet de texte. On contrôle : qu’aucune pierre ne touche le conduit, et que le chemin reste accessible par ses trappes. Aucun mélange ici : c’est le savoir de maçon, et d’un essai qu’on observe.',
      'If you ever want to know what goes on, the **probe** goes in now. Then the **cob casing** and the **stones** cover everything. They are there for one thing: to store and to slow. More earth at the start, less after, as a draft text asks. To check: that no stone touches the duct, and that the path stays reachable by its doors. No mix here: that is a mason’s knowledge, and a trial to observe.',
      ['pour les épaisseurs, par un projet de texte', 'for the thicknesses, by a draft text'],
    ),
    parts: ['temperature-lance', 'cob-casing', 'stone-filler'],
    tools: [l('Maçon de terre', 'Earth builder'), l('Sondes', 'Probes')],
  },
  {
    id: 'bench',
    scene: 'living-room',
    title: l('La banquette prend forme', 'The bench takes shape'),
    text: step(
      'reconstruction',
      'La **banquette** prend sa forme dans la pièce, et le **dossier** vient s’y appuyer contre le mur. C’est la face que verront les habitants. On contrôle : une assise à une hauteur d’assise, des arêtes arrondies, un mur derrière qui ne souffre pas. Le séchage prend le temps qu’il prend, et ce labo ne le chiffre pas : personne ne nous en a donné de chiffre sûr.',
      'The **bench** takes its shape in the room, and the **backrest** comes to lean on it against the wall. This is the face the household will see. To check: a seat at a sitting height, rounded edges, a wall behind that does not suffer. Drying takes the time it takes, and this lab puts no figure on it: nobody gave us a sure one.',
    ),
    parts: ['cob-bench', 'bench-backrest'],
    tools: [l('Maçon de terre', 'Earth builder')],
  },
  {
    id: 'plaster',
    scene: 'bench-section',
    title: l('L’enduit, et l’autre école', 'The plaster, and the other school'),
    text: step(
      'practice',
      'L’**enduit de terre** ferme le banc, et il servira de capteur : une fissure s’y lit. Le **banc de galets** est l’autre école : six des douze réalisations d’un film, sans aucun chiffre publié. On contrôle : que les trappes restent visibles et non enduites. Il est tentant de les cacher, et c’est toujours une erreur.',
      'The **earthen plaster** closes the bench, and it will serve as a sensor: a crack can be read in it. The **pebble bench** is the other school: six of a film’s twelve builds, with no published figure. To check: that the doors stay visible and unplastered. It is tempting to hide them, and it is always a mistake.',
    ),
    parts: ['earthen-plaster', 'pebble-section'],
    tools: [l('Enduiseur', 'Plasterer')],
  },
  {
    id: 'safety',
    scene: 'living-room',
    title: l('Avant tout feu : écran, détecteurs, air', 'Before any fire: shield, alarms, air'),
    text: step(
      'reported',
      'L’**écran thermique**, le **détecteur de monoxyde**, le **détecteur de fumée** et la **grille d’aération** sont en place avant le premier vrai feu, et aucun n’attend la fin du chantier. On contrôle : que les deux détecteurs sonnent au test, qu’un détecteur de CO soit aussi près des chambres, que l’écran ait son air derrière, et que la grille ne soit pas bouchée.',
      'The **heat shield**, the **CO alarm**, the **smoke alarm** and the **ventilation grille** are in place before the first true fire, and none waits for the end of the build. To check: that both alarms sound on test, that a CO alarm is also near the bedrooms, that the shield has its air behind it, and that the grille is not blocked.',
      [
        'pour les détecteurs, par des concepteurs ; l’écran par un projet de texte',
        'for the alarms, by designers; the shield by a draft text',
      ],
    ),
    parts: ['heat-shield', 'co-alarm', 'smoke-alarm', 'ventilation-grille'],
    tools: [l('Détecteurs à la norme de leur pays', 'Alarms to their country’s standard')],
  },
  {
    id: 'first-fires',
    scene: 'fire-core',
    title: l('Les premiers feux, lents', 'The first fires, slow'),
    text: step(
      'practice',
      'Les **bûchettes** entrent, le **couvercle** attend, et le **lit de cendres** commence à peine. La terre finit de sécher, et chaque joint découvre sa première vraie chaleur : l’usage est de commencer doucement, et nous ne donnons aucun programme. On contrôle : le sens de la flamme, l’odeur, le joint, le thermomètre. Ce ne sont pas des instructions d’allumage.',
      'The **sticks** go in, the **lid** waits, and the **ash bed** has barely begun. The earth finishes drying, and each joint meets its first real heat: the usual way is to start gently, and we give no schedule. To check: the flame’s direction, the smell, the seal, the thermometer. These are no lighting instructions.',
      ['sans programme donné', 'with no schedule given'],
    ),
    parts: ['feed-lid', 'fuel-sticks', 'ash-bed'],
    tools: [l('Un professionnel présent', 'A professional present'), l('Détecteur de CO', 'CO alarm')],
    warning: l(
      'Un retour de fumée au premier allumage est fréquent, d’après les récits : on reste éveillé, la pièce aérée, le détecteur en marche, et personne ne ferme quoi que ce soit sur des braises.',
      'A smoke-back at first lighting is common, by the accounts: stay awake, keep the room aired and the alarm on, and let nobody shut anything on embers.',
    ),
  },
  {
    id: 'living',
    scene: 'living-room',
    title: l('Y vivre', 'Living with it'),
    text: step(
      'reconstruction',
      'Le **panier du jour**, la **bouilloire**, le **coussin** et le **mur de refend** n’ont rien à voir avec le montage : c’est tout le reste. Une machine pareille tient à ceux qui s’en occupent, au rythme de deux feux. On contrôle : la saison suivante, chaque fissure, chaque joint et le tas de bois, car c’est là que se lit vraiment ce qu’on a construit.',
      'The **day’s basket**, the **kettle**, the **cushion** and the **stone wall** have nothing to do with assembly: they are all the rest. A machine like this rests on those who tend it, to the rhythm of two fires. To check: the following season, each crack, each seal and the wood pile, for that is where what was built can truly be read.',
    ),
    parts: ['wood-basket', 'kettle', 'bench-cushion', 'inner-stone-wall'],
    tools: [l('Un carnet', 'A notebook')],
  },
];
