// Parts of the `living-room` world (ids frozen in src/data/ids.ts): the machine in its room. The drum first, the bench later, the chimney that pulls. What the model found is used in place of the research's text: the
// drum gives twice the bench's heat, the seat peaks one to two hours after the flame, the room moves by nearly 7 K. The CO warning is said here, once, on `co-alarm`; the burn on `steel-drum`.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const LIVING_ROOM_PARTS: PartInfo[] = [
  {
    id: 'steel-drum',
    scene: 'living-room',
    category: 'mechanical',
    name: l('Le bidon de 200 litres', 'The 200-litre drum'),
    short: lf(
      'La chaleur tout de suite : un bidon d’acier qui rayonne, près de {drumBurst} kW par grands coups (résultat du modèle). Trop chaud pour la main.',
      'Heat at once: a steel drum that radiates, nearly {drumBurst} kW in great bursts (model result). Too hot for the hand.',
    ),
    description: lf(
      'Un bidon du commerce renversé sur la cheminée interne : voilà ce qui donne son allure à cette machine. Les gaz montent au centre, se heurtent à son couvercle et redescendent le long de sa paroi, à laquelle ils cèdent leur chaleur ; mince et sombre, elle la rayonne aussitôt dans la pièce. Sur une journée, les gaz lui laissent {shareDrum} % du bois, et il rend environ {kwhDrum} kWh à la pièce, **deux fois ce que rend le banc** (résultat du modèle). Aucune source ne donne ce partage. Son couvercle monte à {lidPeak} °C à {feedRate} kg/h (hypothèse pour le débit), puis retombe près de la température de la pièce entre les feux (résultat du modèle). Le bidon n’est pas ce qui fait tirer la machine : avec la cheminée interne, il ne pèse qu’environ {netPa} Pa sur {draft} Pa (résultat du modèle). Touché à ces températures, il brûle : un poêle de cette forme ne s’installe pas sans y penser, avec des enfants ou des bêtes.',
      'A stock drum upended over the riser: that is what gives this machine its look. The gases climb the centre, strike its lid and come down along its wall, giving up their heat; thin and dark, the wall radiates it straight into the room. Over a day the gases leave it {shareDrum}% of the wood, and it gives about {kwhDrum} kWh to the room, **twice what the bench gives** (model result). No source gives this split. Its lid reaches {lidPeak} °C at {feedRate} kg/h (an assumption for the rate), then falls back near room temperature between fires (model result). The drum is not what makes the machine draw: with the riser it weighs only about {netPa} Pa in {draft} Pa (model result). Touched at these temperatures it burns: a heater of this shape is not fitted without thought for children or animals.',
    ),
    material: l(
      'Acier mince, peint, sans marque ; un bidon récupéré est un danger à part (voir le guide)',
      'Thin painted steel, no brand; a recovered drum is a hazard of its own (see the guide)',
    ),
    specs: [
      sp(
        'Diamètre × hauteur',
        'Diameter × height',
        l('585 × 880 mm, gamme de vendeurs', '585 × 880 mm, sellers’ range'),
      ),
      sp('Paroi', 'Wall', l('environ 1,2 mm', 'about 1.2 mm')),
      sp(
        'Volume',
        'Volume',
        tf('derived', '{drumLitres} L, vendu pour 200 à 216 L', '{drumLitres} L, sold as 200 to 216 L'),
      ),
      sp('Surface', 'Surface', tf('derived', '{drumArea} m²')),
      sp(
        'Rendu à la pièce, par jour',
        'Given to the room, per day',
        tf('model', 'environ {kwhDrum} kWh', 'about {kwhDrum} kWh'),
      ),
      sp('Couvercle, au plus chaud', 'Lid at its hottest', tf('model', '{lidPeak} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'La rouille au pied, où l’humidité et la cendre restent, et la peinture qui brûle au premier feu, avec son odeur et sa fumée. La cendre qui s’accumule contre la paroi, enfin, peut réduire le passage.',
        check:
          'Le pied du bidon à l’œil, chaque saison. Un constructeur a soulevé le sien après environ trois hivers de cendre, et sa machine en était à son treizième hiver : une seule machine, et son propriétaire n’a publié aucune mesure d’usure.',
        care: 'On ne repeint qu’avec une peinture pour poêle. Pour le reste, la vie de ce bidon n’a pas de chiffre : aucune source ne suit une série de machines.',
      },
      {
        failure:
          'Rust at the foot, where damp and ash stay, and paint that burns off at the first fire, with its smell and smoke. And ash gathering against the wall can narrow the way.',
        check:
          'The foot of the drum by eye, each season. One builder lifted his after about three winters of ash, with his machine in its thirteenth winter: a single machine, and no measurement of wear published.',
        care: 'Repaint only with stove paint. For the rest, this drum’s life has no figure: no source follows a series of machines.',
      },
    ),
    tip: l(
      'Dans la Simulation, faites glisser l’heure à travers un feu en regardant « Ce que chacun rend à la maison » : un pic de bidon, une ligne de banc.',
      'In the Simulation, drag the hour through a fire and watch “What each gives to the house”: a spike from the drum, a line from the bench.',
    ),
    design: lf(
      'Une paroi d’acier mince ne garde presque rien : ce qu’elle reçoit, elle le rend. C’est un échangeur sans inertie, et c’est pour cela qu’il réchauffe une pièce froide à l’instant. Avec une cheminée interne de 1,27 m, sa part monte à {riserLongDrum} %, avec 0,64 m elle descend à {riserShortDrum} % (résultat du modèle) : la part de chaleur du banc dépend de lui.',
      'A thin steel wall keeps next to nothing: what it receives, it gives. A heat exchanger with no inertia, which is why it warms a cold room at once. With a 1.27 m riser its share rises to {riserLongDrum}%, with 0.64 m it falls to {riserShortDrum}% (model result): the bench’s share of the heat depends on it.',
    ),
    video: ['04:28', '05:02'],
  },
  {
    id: 'cob-bench',
    scene: 'living-room',
    category: 'structure',
    name: l('La banquette', 'The cob bench'),
    short: lf(
      'Environ {benchTonnes} t de terre autour d’un conduit (dérivé). L’assise culmine une à deux heures après la flamme, à {seatHigh} °C (résultat du modèle).',
      'About {benchTonnes} t of earth round a duct (derived). The seat peaks one to two hours after the flame, at {seatHigh} °C (model result).',
    ),
    description: lf(
      'Voici le stock : {benchKg} kg de terre et de pierres sur 9 m (dérivé), soit {benchKwhK} kWh par degré. La chaleur des gaz traverse cette masse lentement, si bien que **l’assise culmine une à deux heures après la flamme** : {lagStop} h après l’arrêt du bois au bout chaud, {lagStopCold} h au bout fin, à {seatHigh} et {seatColdHigh} °C (résultat du modèle). Elle varie de {seatLow} à {seatHigh} °C au bout chaud. Au-dessus du conduit, la terre monte à {earthDuct} °C pendant que l’assise bouge à peine (résultat du modèle). Sept heures après le feu du soir, l’assise est encore à {seatAfter7} °C, et la pièce à {roomAfter7} °C. **Dans ce modèle, ce n’est pourtant pas elle qui porte la maison** : elle rend {benchKwLow} à {benchKwHigh} kW jour et nuit, soit environ {kwhBench} kWh par jour, deux fois moins que le bidon. Son vrai travail est de lisser. Un constructeur a relevé 54 à 60 °C au début de sa masse à plein feu, et encore 32 à 38 °C douze heures plus tard : dans une serre, à un emplacement non précisé.',
      'Here is the store: {benchKg} kg of earth and stones over 9 m (derived), or {benchKwhK} kWh per degree. The gases’ heat crosses this mass slowly, so that **the seat peaks one to two hours after the flame**: {lagStop} h after the wood stops at the hot end, {lagStopCold} h at the thin end, at {seatHigh} and {seatColdHigh} °C (model result). It moves from {seatLow} to {seatHigh} °C at the hot end. Above the duct the earth climbs to {earthDuct} °C while the seat hardly stirs (model result). Seven hours after the evening fire the seat is still at {seatAfter7} °C and the room at {roomAfter7} °C. **Yet in this model the bench does not carry the house**: it gives {benchKwLow} to {benchKwHigh} kW day and night, about {kwhBench} kWh a day, half of what the drum gives. Its real job is to smooth. One builder read 54 to 60 °C at the start of his mass at full burn, and still 32 to 38 °C twelve hours later: in a greenhouse, in a place not stated.',
    ),
    material: l('Terre et pierres, sans fibre, enduit de terre', 'Earth and stones, no fibre, an earthen plaster'),
    specs: [
      sp(
        'Longueur du conduit',
        'Length of the duct',
        l('9 m, dans une plage de 9 à 15 m d’un projet de texte', '9 m, within the 9 to 15 m of a draft text'),
      ),
      sp('Section', 'Section', tf('estimate', '{benchDepth} × {benchHeight} m')),
      sp('Masse', 'Mass', tf('derived', '{benchKg} kg, moins le conduit', '{benchKg} kg, less the duct')),
      sp(
        'Ce qu’elle stocke',
        'What it stores',
        tf('derived', '{benchKwhK} kWh par degré', '{benchKwhK} kWh per degree'),
      ),
      sp('Assise, bout chaud', 'Seat, hot end', tf('model', '{seatLow} à {seatHigh} °C', '{seatLow} to {seatHigh} °C')),
      sp(
        'Pic après l’arrêt du bois',
        'Peak after the wood stops',
        tf('model', '{lagStop} h, {lagBegin} h après l’allumage', '{lagStop} h, {lagBegin} h after lighting'),
      ),
      sp('Elle rend', 'It gives', tf('model', '{benchKwLow} à {benchKwHigh} kW', '{benchKwLow} to {benchKwHigh} kW')),
    ],
    maintenance: maint(
      {
        failure:
          'Une assise trop chaude pour s’y asseoir dit un conduit trop court ; une fissure qui s’ouvre dit un sol qui bouge. Sur une masse trop petite, un constructeur a mesuré des fumées au-delà de 232 °C et un banc inconfortable. Le modèle ne connaît ni séchage ni fissure.',
        check:
          'La main à plat, à la même heure, jour après jour : un banc qui n’a plus la même forme de journée a changé quelque chose. La fissure qu’on suit au crayon vaut mieux que celle qu’on rebouche.',
        care: 'Reprendre l’enduit, et rien de lourd qui ne soit prévu dessus. Une fissure qui revient se regarde sous l’enduit, avec le détecteur en marche.',
      },
      {
        failure:
          'A seat too hot to sit on tells of a duct too short; a crack that opens tells of a floor that moves. On too small a mass, one builder measured gas over 232 °C and an uncomfortable bench. The model knows neither drying nor cracks.',
        check:
          'A flat hand, at the same hour, day after day: a bench whose day has changed shape has changed something. A crack followed in pencil is worth more than one filled over.',
        care: 'Touch up the plaster, and put nothing heavy on it that was not planned. A crack that returns is looked at under the plaster, with the alarm on.',
      },
    ),
    tip: l(
      'Allumez la vue thermique, faites glisser l’heure sur 24 h : la couleur part du conduit et monte vers l’assise, après l’arrêt du feu.',
      'Switch on the thermal view and drag the hour over 24 h: the colour leaves the duct and climbs to the seat, after the fire stops.',
    ),
    design: lf(
      'Pourquoi une à deux heures et pas plus ? Parce que les gaz continuent de refroidir le côté du conduit après le feu, et qu’un feu de {sessionHours} h (hypothèse) n’est pas une impulsion. La terre rend donc aussi une partie de sa chaleur vers le conduit (résultat du modèle). Une terre plus conductrice, à 1,06 W/m·K, donne une assise à {kHighSeat} °C ; à 0,3 W/m·K, à {kLowSeat} °C.',
      'Why one to two hours and no more? Because the gases go on cooling the duct’s side after the fire, and a fire of {sessionHours} h (assumption) is no pulse. So the earth also gives part of its heat back to the duct (model result). A more conductive earth, at 1.06 W/m·K, gives a seat at {kHighSeat} °C; at 0.3 W/m·K, at {kLowSeat} °C.',
    ),
    video: ['01:14'],
  },
  {
    id: 'bench-backrest',
    scene: 'living-room',
    category: 'structure',
    name: l('Le dossier', 'The backrest'),
    short: lf(
      'Un dos chaud, et un peu plus de surface pour rendre la chaleur. Pas dans le stock du modèle ({backDepth} × {backHeight} m, estimation).',
      'A warm back, and a little more surface to give heat. Not in the model’s store ({backDepth} × {backHeight} m, estimate).',
    ),
    description: lf(
      'Le dossier se monte en terre sur l’arrière du banc, contre le mur. Il ne contient pas de conduit dans notre reconstitution, et le modèle ne le compte pas dans sa masse. Il se chauffe par ce qu’il touche, et c’est surtout une question de confort : on s’appuie sur quelque chose de tiède. Ce projet de texte pour une ville américaine limite la hauteur du banc à 36 pouces et celle du dossier à 48, soit environ {benchLimitM} et {backLimitM} m (dérivé) : c’est le seul repère écrit de ce genre que nous ayons trouvé. Le mur derrière reste le point faible : le banc y perd environ {behindKwh} kWh par jour (résultat du modèle), qu’un mur bien isolé limite et qu’un mur extérieur mal isolé multiplierait.',
      'The backrest is built up in earth on the back of the bench, against the wall. It holds no duct in our reconstruction, and the model does not count it in its mass. It warms from what it touches, and it is mostly a matter of comfort: you lean on something warm. The draft text for one American city limits the bench’s height to 36 inches and the back’s to 48, about {benchLimitM} and {backLimitM} m (derived): the only written mark of the kind we found. The wall behind stays the weak point: the bench loses about {behindKwh} kWh a day through it (model result), which a well insulated wall limits and a poor outside wall would multiply.',
    ),
    material: l('Terre, comme le banc, enduite', 'Earth, like the bench, plastered'),
    specs: [
      sp('Section dessinée', 'Drawn section', tf('estimate', '{backDepth} × {backHeight} m')),
      sp(
        'Limite d’un projet de texte',
        'A draft text’s limit',
        tf('derived', 'environ {backLimitM} m de haut', 'about {backLimitM} m high'),
      ),
      sp(
        'Pertes à travers le mur',
        'Lost through the wall',
        tf('model', '{behindKwh} kWh par jour', '{behindKwh} kWh a day'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le joint avec le mur qui s’ouvre au séchage, et l’humidité qu’on y enferme si le mur ne respire pas. Les tissus qu’on y laisse finissent par cacher ces signes.',
        check: 'La jonction mur-dossier, à l’œil, au premier hiver, puis à chaque reprise d’enduit.',
        care: 'Reprendre le joint en terre. Laisser le dossier sans meuble collé : il travaille aussi par sa surface.',
      },
      {
        failure:
          'The joint with the wall opening as it dries, and damp trapped there if the wall cannot breathe. The fabrics left on it end up hiding these signs.',
        check: 'The junction of wall and backrest, by eye, in the first winter, then whenever the plaster is repaired.',
        care: 'Refill the joint with earth. Leave the backrest free of furniture: it also works by its surface.',
      },
    ),
    tip: l(
      'Isolez le dossier puis la banquette : on voit qu’il repose dessus, et qu’il ne touche pas le conduit.',
      'Isolate the backrest, then the bench: you can see it rests on top, and does not touch the duct.',
    ),
    design: l(
      'Rien ne serait gagné à y faire passer le conduit : celui-ci va chercher les parties que le corps touche. Le dossier est de la surface et du confort, ce qui n’est pas rien pour une machine dont on vit à côté.',
      'Nothing would be gained by running the duct through it: the duct seeks the parts the body touches. The backrest is surface and comfort, which is no small thing on a machine you live beside.',
    ),
  },
  {
    id: 'manifold',
    scene: 'living-room',
    category: 'mechanical',
    name: l('Le collecteur', 'The manifold'),
    short: lf(
      'Là où les gaz, en bas du bidon, tournent pour entrer dans le conduit, autour de {afterDrum} °C à plein feu (résultat du modèle).',
      'Where the gases, at the foot of the drum, turn to enter the duct, around {afterDrum} °C at full fire (model result).',
    ),
    description: lf(
      'Le collecteur fait partie des six organes qu’une vidéo de constructeurs énumère pour cette machine : l’entrée du bois, le tunnel, la cheminée interne, le collecteur, la masse et la sortie verticale. C’est, dans notre reconstitution, une boîte d’acier derrière le bidon, reliée à la chambre sous la chute ; d’autres machines la maçonnent. Les gaz qui sortent de la paroi du bidon y arrivent autour de {afterDrum} °C (résultat du modèle), en tournent d’un quart de tour et trouvent l’entrée du conduit. Le changement de direction ralentit le flux : c’est donc là que la cendre volante se dépose, et c’est aussi là qu’une pression négative d’une quinzaine de pascals se fait sentir à plein feu, ce qu’une trappe mal jointée sentirait aussi. Le modèle lui donne une perte de charge tirée d’une table usuelle (une estimation), sans aucune mesure pour la vérifier.',
      'The manifold is one of the six organs a builders’ video lists for this machine: the wood feed, the tunnel, the riser, the manifold, the mass and the vertical exit. In our reconstruction it is a steel box behind the drum, joined to the chamber under the fall; other machines build it in masonry. The gases coming off the drum’s wall arrive around {afterDrum} °C (model result), turn a quarter and find the entry of the duct. The change of direction slows the flow: so this is where fly ash settles, and also where a suction of some fifteen pascals is felt at full fire, as a poorly sealed door would feel it too. The model gives it a pressure loss from a usual table (an estimate), with no measurement to check it.',
    ),
    material: l(
      'Boîte d’acier noyée dans la terre (notre reconstitution)',
      'A steel box buried in the earth (our reconstruction)',
    ),
    specs: [
      sp(
        'Température à plein feu',
        'Temperature at full fire',
        tf('model', 'environ {afterDrum} °C', 'about {afterDrum} °C'),
      ),
      sp('Entrée', 'Inlet', l('la section du conduit, 200 mm', 'the duct’s section, 200 mm')),
      sp('Accès', 'Access', l('sa trappe, une porte fermée et étanche', 'its cleanout, a closed tight door')),
    ],
    maintenance: maint(
      {
        failure:
          'De la cendre qui s’accumule jusqu’à gêner l’entrée du conduit : le poêle tire de moins en moins bien, sans qu’on voie pourquoi. Une fissure dans la terre qui l’entoure est aussi une fuite.',
        check:
          'Une température de sortie qui change et un feu paresseux à bois égal. Puis l’œil, par la trappe, à froid.',
        care: 'L’aspirer à froid à chaque ramonage. La cendre n’y fait pas de mal tant qu’elle ne bouche rien : ne pas chercher à la chasser en plein feu.',
      },
      {
        failure:
          'Ash building up until it obstructs the entry of the duct: the heater draws worse and worse, with no visible reason. A crack in the earth around it is a leak too.',
        check:
          'An exhaust temperature that changes and a lazy fire on the same wood. Then the eye, through the door, when cold.',
        care: 'Vacuum it cold at each sweep. Ash does no harm there until it blocks something: do not try to chase it out at full fire.',
      },
    ),
    tip: l(
      'Activez **Flux** puis **Coupe** : les gaz descendent le bidon et tournent ici, puis filent sous la banquette.',
      'Switch on **Flows** then **Section**: the gases come down the drum and turn here, then run away under the bench.',
    ),
    design: l(
      'Le plus simple serait un coude : mais un coude se bouche, et se nettoie mal. Un petit volume à trappe est plus indulgent. Le coût est un peu de tirage, qu’on peut se permettre sur une machine dont la cheminée en donne beaucoup.',
      'The simplest would be a bend: but a bend blocks up and cannot be cleaned. A small volume with a door is more forgiving. The cost is a little draught, affordable on a machine whose chimney gives plenty.',
    ),
  },
  {
    id: 'manifold-cleanout',
    scene: 'living-room',
    category: 'mechanical',
    name: l('Trappe du collecteur', 'Manifold cleanout'),
    short: l(
      'Une porte fermée et étanche, pour retirer la cendre volante. Elle ne s’ouvre qu’à froid.',
      'A closed, tight hatch for taking out the fly ash. It only opens cold.',
    ),
    description: lf(
      'La cendre volante se dépose où le flux ralentit, et un manuel français prévoit une trappe de nettoyage à ces endroits. Pendant un feu, la pression y est négative : à plein régime, une fuite laisse entrer de l’air froid qui vole du tirage et refroidit le chemin. C’est moins grave que l’inverse, mais la pression change de signe lors d’un retour de fumée : la même fuite laisserait alors sortir des gaz dans la pièce. Le modèle ne compte qu’une fuite, celle du joint du couvercle du bidon, d’{leakCm2} cm² (estimation) : il ne sait rien de cette trappe en particulier. Sur {woodDay} kg par jour (hypothèse) et 0,77 % de cendres, la quantité n’est pas grande, et l’intervalle se décide à l’œil.',
      'Fly ash settles where the flow slows, and a French manual provides a cleaning door at such places. During a fire the pressure there is negative: at full burn a leak lets in cold air that steals draught and cools the path. That is less serious than the reverse, but the pressure changes sign in a smoke-back: the same leak would then let gas out into the room. The model counts one leak only, the seal of the drum’s lid, of {leakCm2} cm² (estimate): it knows nothing of this door in particular. At {woodDay} kg a day (assumption) and 0.77 % ash, the amount is small, and the interval is settled by eye.',
    ),
    material: l(
      'Trappe ronde d’acier, sur le dessus, joint de porte de poêle',
      'A round steel hatch, on top, a stove-door gasket',
    ),
    specs: [
      sp(
        'Pression à plein feu',
        'Pressure at full fire',
        tf('model', 'négative, vers {lidPa} Pa sous le couvercle', 'negative, about {lidPa} Pa under the lid'),
      ),
      sp('Ouverture', 'Opening', l('à froid, feu éteint et braises mortes', 'cold, fire out and embers dead')),
      sp('Joint', 'Seal', l('joint de porte de poêle', 'stove-door gasket')),
    ],
    maintenance: maint(
      {
        failure:
          'Un joint cuit ou écrasé, une porte mal refermée après le nettoyage : c’est l’oubli qui compte le plus, puisqu’elle ne se voit pas forcément du canapé. Le tirage baisse, et le feu devient paresseux.',
        check:
          'Le joint à la main à chaque ouverture, le verrou, et une porte qu’on ne peut pas oublier ouverte, parce qu’elle a sa place en vue.',
        care: 'Changer le joint quand il est dur. Rien à faire entre deux nettoyages.',
      },
      {
        failure:
          'A baked or crushed seal, a door badly closed after cleaning: forgetting counts for most, since it may not be in sight from the sofa. The draught falls and the fire turns lazy.',
        check:
          'The seal by hand at each opening, the latch, and a door that cannot be forgotten open, because it sits in view.',
        care: 'Change the seal when it hardens. Nothing to do between two cleanings.',
      },
    ),
    tip: l(
      'Dans la 3D, regardez où tombe cette porte par rapport au bidon : elle doit rester accessible une fois le banc fini.',
      'In the 3D, see where this door falls against the drum: it has to stay within reach once the bench is finished.',
    ),
    design: l(
      'Une machine de maçon dure si on peut y entrer : les trappes sont le prix de sa longévité, et chaque porte reste une petite fuite possible. Le choix n’est pas gratuit.',
      'A mason’s machine lasts if you can get into it: the doors are the price of its long life, and each door stays a possible small leak. The choice is not free.',
    ),
  },
  {
    id: 'chimney-flue',
    scene: 'living-room',
    category: 'mechanical',
    name: l('Le conduit vertical', 'The chimney'),
    short: lf(
      'Le vrai moteur de la machine, quand il est chaud : {chimneyPa} Pa à lui seul, sur les {draft} Pa disponibles (résultat du modèle).',
      'The machine’s real engine, when warm: {chimneyPa} Pa of its own, in the {draft} Pa on hand (model result).',
    ),
    description: lf(
      'On crédite volontiers la cheminée interne du tirage : il n’en est rien. À plein feu, elle monte de {riserPa} Pa, la chute dans le bidon en reprend {fallPa}, soit {netPa} Pa à eux deux, et **le conduit vertical donne {chimneyPa} Pa** (résultat du modèle). Un concepteur le dit nettement, et le calcul à la main le retrouve. Il doit donc rester chaud : isolé, sur toute sa longueur, jusqu’à {chimneyTop} m environ (hauteur estimée). Un conduit froid, c’est l’inverse : à −5 °C dehors, il ne pèse plus que −{coldFluePa} Pa dans le modèle, car au-dessus du toit l’air est aussi froid que lui ; la somme à la main, qui suppose de l’air de pièce tout du long, donnait −5,5 Pa (dérivé). Trop de hauteur coûte aussi : à {chimneyHigh} m, {chimney8Eta} % de rendement (résultat du modèle), car elle tire de l’air qui ne sert à rien. Un constructeur de 15 ans a fini par préférer une vraie cheminée à une sortie horizontale qui ne marchait que dans de bonnes conditions.',
      'The riser tends to get the credit for the draught: it has none of it. At full fire it rises by {riserPa} Pa, the fall in the drum takes back {fallPa}, {netPa} Pa between them, and **the chimney gives {chimneyPa} Pa** (model result). One designer says so plainly, and the hand sum finds it. So it has to stay warm: insulated, all the way, up to about {chimneyTop} m (height estimated). A cold flue is the reverse: at −5 °C outside it weighs only −{coldFluePa} Pa in the model, since above the roof the air is as cold as the flue; the hand sum, assuming room air all the way, gave −5.5 Pa (derived). Too much height costs too: at {chimneyHigh} m, {chimney8Eta}% efficiency (model result), because it draws air that does nothing. A builder of 15 years ended up preferring a true chimney to a horizontal exit that worked only when conditions were right.',
    ),
    material: l('Conduit à double paroi isolée, Ø 200 mm', 'Insulated twin-wall flue, Ø 200 mm'),
    specs: [
      sp('Diamètre', 'Diameter', l('200 mm', '200 mm')),
      sp('Sommet', 'Top', tf('estimate', '{chimneyTop} m du plancher', '{chimneyTop} m above the floor')),
      sp('Son tirage, à plein feu', 'Its draught, at full fire', tf('model', '{chimneyPa} Pa')),
      sp(
        'Conduit froid, −5 °C dehors',
        'Cold flue, −5 °C outside',
        tf('model', '−{coldFluePa} Pa', '−{coldFluePa} Pa'),
      ),
      sp(
        'Le tirage total',
        'The total draught',
        tf('model', '{draft} Pa, 85 % perdus à l’entrée', '{draft} Pa, 85% lost at the entry'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le bouchon ou le feu de conduit : suie sur une paroi froide, cendre volante, condensats. Sans son isolant, le conduit refroidit : le modèle perd alors la pièce, à {uninsulatedRoom} °C (résultat du modèle), sur les mêmes réglages.',
        check:
          'Le ramoneur, qui passe aussi la brosse par le bas, et le thermomètre de fumée. Une sortie plus froide qu’à l’ordinaire à feu égal ne s’explique pas toute seule.',
        care: 'Le ramonage, selon les règles du pays. Pas de raccord bricolé, et rien d’inflammable contre sa gaine à la traversée.',
      },
      {
        failure:
          'A blockage or a flue fire: soot on a cold wall, fly ash, condensate. Without its insulation the flue cools: the model then loses the room, at {uninsulatedRoom} °C (model result), on the same settings.',
        check:
          'The sweep, who also brushes from below, and the flue thermometer. An exhaust colder than usual on the same fire does not explain itself.',
        care: 'Sweeping, under the rules of the country. No home-made joint, and nothing that burns against its jacket at the crossing.',
      },
    ),
    tip: l(
      'Le graphique « La pression le long du chemin » de la Simulation montre ce tirage : la cheminée tire, et presque tout se perd à l’entrée du tube.',
      'The “pressure along the path” chart in the Simulation shows this draught: the chimney pulls, and nearly all of it is lost at the entry of the feed.',
    ),
    design: lf(
      'Le scénario de la cheminée basse dit l’inverse de ce qu’on attendrait : à {chimneyLow} m (estimation), le rendement monte à {lowEta} % (résultat du modèle), car moins d’air inutile traverse la machine. Le prix est la marge : la pression sous le couvercle passe de −{lidPa} à −{lidPaLow} Pa. Une bonne efficacité peut donc cacher un poêle plus fragile.',
      'The low-chimney scenario says the reverse of what you would expect: at {chimneyLow} m (estimate) the efficiency rises to {lowEta}% (model result), as less useless air crosses the machine. The price is the margin: the pressure under the lid goes from −{lidPa} to −{lidPaLow} Pa. Good efficiency can thus hide a more fragile heater.',
    ),
  },
  {
    id: 'chimney-cleanout',
    scene: 'living-room',
    category: 'mechanical',
    name: l('Trappe de pied', 'Chimney-foot cleanout'),
    short: l(
      'Au pied du conduit : un accès que le texte américain sur les poêles de maçonnerie réclame, et par où passe le ramoneur.',
      'At the flue’s foot: an access the American text on masonry heaters asks for, and the sweep’s way in.',
    ),
    description: l(
      'Le texte américain de référence sur les poêles de maçonnerie demande un accès de nettoyage au pied du conduit, selon un maçon qui siège à son comité. Ce texte ne décrit pas cette machine, avec son tube ouvert et sa terre, mais la raison reste valable : ce qui tombe d’un conduit vertical s’arrête ici, suie, cendre, et condensats sur les systèmes longs. Tout reste derrière un petit capuchon fermé, sous le té, que l’on ouvre à froid. Ouverte en plein feu, elle offrirait un raccourci à l’air de la pièce, et le tirage s’effondrerait à l’endroit même où il faut que le foyer soit tiré. C’est le premier endroit qu’on regarde quand un feu refuse de prendre sans raison apparente.',
      'The American reference text on masonry heaters asks for a cleaning access at the foot of the flue, according to a mason who sits on its committee. That text does not describe this machine, with its open feed and its earth, but the reason holds: what falls down a vertical flue stops here, soot, ash, and on long systems condensate. It all stays behind a small closed cap, under the tee, opened cold. Left open at full fire it would offer the room’s air a short cut, and the draught would collapse just where the core needs it. It is the first place to look when a fire refuses to catch for no clear reason.',
    ),
    material: l('Capuchon d’acier, joint de porte de poêle', 'A steel cap, a stove-door gasket'),
    specs: [
      sp('Place', 'Position', l('au pied du conduit, sous le té', 'at the flue’s foot, under the tee')),
      sp(
        'Exigence',
        'Requirement',
        l('texte américain, lu par un tiers', 'an American text, read through a third party'),
      ),
      sp('Ouverture', 'Opening', l('à froid', 'cold')),
    ],
    maintenance: maint(
      {
        failure:
          'Un capuchon resté ouvert ou mal serré : le feu ne tire plus, et personne ne pense à regarder là. Un pied rouillé par les condensats, sur un système long.',
        check:
          'La fermeture à chaque ramonage. Du dépôt collant et noir, plutôt que de la cendre sèche, dit un conduit qui fonctionne trop froid.',
        care: 'Vider, remettre le joint en place, et noter ce qu’on a retiré d’un hiver à l’autre.',
      },
      {
        failure:
          'A cap left open or loose: the fire no longer draws, and nobody thinks of looking there. A foot rusted by condensate, on a long system.',
        check:
          'The closure at each sweep. Sticky black deposit, in place of dry ash, tells of a flue running too cold.',
        care: 'Empty it, reseat the seal, and note what came out from one winter to the next.',
      },
    ),
    tip: l(
      'Passez à la coupe du banc pour voir le té sous lequel elle s’ouvre, et la purge à côté.',
      'Go to the bench’s section to see the tee it opens under, and the drain beside it.',
    ),
    design: l(
      'Ce capuchon n’a rien à voir avec un clapet : il reste fermé en service, et n’a pas de rôle dans le feu. Aucun clapet fermant n’existe sur cette machine.',
      'This cap has nothing to do with a damper: it stays closed in service and plays no part in the fire. There is no closing damper on this machine.',
    ),
  },
  {
    id: 'ceiling-crossing',
    scene: 'living-room',
    category: 'structure',
    name: l('Traversée de plafond', 'Ceiling crossing'),
    short: l(
      'L’endroit où une maison prend feu : le conduit traverse du bois et de l’isolant, à la distance fixée par le fabricant du conduit.',
      'The place a house catches fire: the flue crosses wood and insulation, at the distance set by the flue’s maker.',
    ),
    description: lf(
      'Les fumées qui passent ici sont tièdes en temps normal : {exhaust} °C dans le modèle à plein feu (résultat du modèle). Le risque n’est pas ce régime-là, mais le feu de conduit, ou une machine menée trop fort, et un charpentier a rarement prévu cela. Les règles françaises des conduits de fumée, résumées par un fabricant, imposent une distance de sécurité et des pièces de traversée propres à chaque conduit. Ce labo ne donne aucune distance : elle se lit sur l’étiquette du conduit et dans sa notice, et elle n’est pas à réduire. On ne voit plus cette pièce une fois le plafond fermé ; c’est pour cela qu’une trappe de visite vaut la peine, avec un coup d’œil après la première saison et chaque fois qu’un feu de conduit est suspecté.',
      'The gases passing here are lukewarm in normal running: {exhaust} °C in the model at full fire (model result). The risk is not that regime but a flue fire, or a machine driven too hard, and a carpenter has rarely allowed for that. The French rules for flues, summarised by a maker, ask for a safety distance and crossing pieces specific to each flue. This lab gives no distance: it is read on the flue’s label and in its notice, and it is not for reducing. This part cannot be seen once the ceiling is closed; hence the worth of an inspection hatch, with a look after the first season and each time a flue fire is suspected.',
    ),
    material: l(
      'Pièce de traversée du fabricant, plaque, isolant incombustible',
      'The maker’s crossing piece, a plate, non-combustible insulation',
    ),
    specs: [
      sp('Distance de sécurité', 'Safety distance', l('celle du fabricant du conduit', 'that of the flue’s maker')),
      sp(
        'Fumées à cet endroit',
        'Gas at this point',
        tf('model', 'environ {exhaust} °C à plein feu', 'about {exhaust} °C at full fire'),
      ),
      sp('Vérification', 'Inspection', l('une trappe, puis chaque saison', 'a hatch, then each season')),
    ],
    maintenance: maint(
      {
        failure:
          'L’isolant qui glisse au contact de la gaine, des poussières, un nid, une poutre qui a bougé. Rien ne se voit depuis la pièce, et le bois noircit lentement avant de prendre.',
        check:
          'À la trappe, à la lampe : la distance et la couleur du bois. Après tout feu de conduit, un professionnel, avant le feu suivant.',
        care: 'Rien de stocké dans les combles autour du conduit. La traversée se refait comme à neuf si l’on change de conduit.',
      },
      {
        failure:
          'Insulation slipping against the jacket, dust, a nest, a beam that has moved. None of it shows from the room, and wood blackens slowly before it catches.',
        check:
          'At the hatch, by torch: the distance and the colour of the wood. After any flue fire, a professional, before the next fire.',
        care: 'Nothing stored in the loft around the flue. The crossing is redone as new if the flue is changed.',
      },
    ),
    tip: l(
      'Isolez la traversée : dans cette reconstitution elle n’a ni cote ni détail de pose, et c’est volontaire.',
      'Isolate the crossing: in this reconstruction it has no dimension and no fitting detail, on purpose.',
    ),
    design: l(
      'C’est la seule pièce de ce catalogue que l’on doit acheter et poser selon la notice d’un autre. Ici, faire soi-même n’a aucun sens : un conduit certifié est une part du dossier que l’assureur lira.',
      'It is the one part of this catalogue to buy and fit to someone else’s notice. Making your own has no meaning here: a certified flue is part of the file the insurer will read.',
    ),
  },
  {
    id: 'hearth-slab',
    scene: 'living-room',
    category: 'structure',
    name: l('La dalle', 'The slab'),
    short: lf(
      'Environ {machineTonnes} t à porter (estimation), {floorKn} kN/m² sous le banc (dérivé) : une dalle n’est pas une option.',
      'About {machineTonnes} t to carry (estimate), {floorKn} kN/m² under the bench (derived): a slab is no option.',
    ),
    description: lf(
      'Les {benchTonnes} t du banc (dérivé), plus environ {coreTonnes} t de foyer (estimation), reposent sur le sol de la maison. Sur le plancher, cela fait environ {floorKn} kN/m² sous le banc (dérivé), loin au-dessus d’un plancher bois léger : les valeurs de calcul usuelles en sont le tiers. Ce projet de texte pour une ville américaine demande 4 pouces de béton, ou l’équivalent ; c’est {slabMm} mm dans notre dessin, repris de ce texte, et comme il n’a jamais été arrêté, ce chiffre n’engage personne. Un sol qui tasse fait fissurer l’enveloppe de terre, et une fissure dans l’enveloppe est une fuite. Un manuel français, sur son propre poêle d’environ 2 t, conseille de renforcer une dalle à hourdis : même question, autre machine.',
      'The {benchTonnes} t of bench (derived), plus about {coreTonnes} t of core (estimate), rest on the house’s floor. On the floor that is about {floorKn} kN/m² under the bench (derived), far above a light timber floor: usual design values are a third of it. The draft text for one American city asks for 4 inches of concrete or the equivalent; that is {slabMm} mm in our drawing, taken from that text, and as it was never made final the figure commits nobody. A floor that settles cracks the earthen casing, and a crack in the casing is a leak. A French manual, on its own stove of about 2 t, advises reinforcing a hollow-block slab: same question, another machine.',
    ),
    material: l('Béton, sur un sol isolé', 'Concrete, on an insulated floor'),
    specs: [
      sp('Épaisseur dessinée', 'Drawn thickness', l('100 mm, un projet de texte', '100 mm, a draft text')),
      sp('Masse portée', 'Mass carried', tf('estimate', 'environ {machineTonnes} t', 'about {machineTonnes} t')),
      sp(
        'Charge sous le banc',
        'Load under the bench',
        tf('derived', 'environ {floorKn} kN/m²', 'about {floorKn} kN/m²'),
      ),
      sp(
        'Chaleur perdue au sol',
        'Heat lost to the ground',
        tf('model', '{groundKwh} kWh par jour', '{groundKwh} kWh a day'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un tassement, lent, qui ne se remarque que par la fissure qu’il ouvre au-dessus. Sur un plancher à solives, c’est une flèche qui s’installe : un structuraliste aurait dit non avant le premier sac de terre.',
        check:
          'L’avis d’un ingénieur de structure avant tout projet, et des repères en plusieurs points pour la première année.',
        care: 'Rien à faire sur une dalle saine. Une fissure de dalle se regarde avec celle de l’enveloppe, pas séparément.',
      },
      {
        failure:
          'Slow settling, noticed only by the crack it opens above. On a joisted floor, a sag that sets in: a structural engineer would have said no before the first bag of earth.',
        check: 'A structural engineer’s word before any project, and marks at several points for the first year.',
        care: 'Nothing to do on a sound slab. A slab crack is looked at together with one in the casing, not separately.',
      },
    ),
    tip: l(
      'Explosez la vue : tout ce qui se soulève repose sur cette seule pièce.',
      'Explode the view: everything that lifts rests on this one part.',
    ),
    design: l(
      'On se représente un poêle comme un objet posé. Celui-ci est une maçonnerie : la question n’est plus « où le mettre ? » mais « qu’est-ce qui le porte ? », et elle se pose avant tout le reste.',
      'A stove is pictured as an object set down. This one is masonry: the question is no longer “where shall it go?” but “what carries it?”, and it comes before all the rest.',
    ),
  },
  {
    id: 'heat-shield',
    scene: 'living-room',
    category: 'structure',
    name: l('Écran thermique', 'Heat shield'),
    short: l(
      'Une tôle et une lame d’air : la tôle arrête le rayonnement, l’air emporte ce qu’elle reçoit. Ce n’est pas son épaisseur qui protège.',
      'A sheet and a gap of air: the sheet stops the radiation, the air carries off what it receives. It is not thickness that protects.',
    ),
    description: lf(
      'Le bidon voit le mur d’à côté, et il le chauffe par rayonnement, sans se soucier de l’air qui est entre eux. Une tôle posée entre les deux reçoit ce rayonnement, et, si de l’air circule derrière, ne le transmet presque pas. Ce même projet de texte pour une ville américaine parle de 36 pouces entre le bidon et un mur combustible (environ {clearanceDrumCm} cm, dérivé), et de 18 pouces (environ {clearanceShieldCm} cm, dérivé) avec un écran et 1 pouce d’air (environ {shieldGapMm} mm, dérivé). **Ce sont les mots d’un brouillon d’un autre pays, et ni une règle ni une valeur sûre** : ils montrent seulement un ordre de grandeur, et aucune recette pour rapprocher un mur. Sa règle à lui viendra du pays, de l’assureur et d’un professionnel.',
      'The drum sees the wall beside it and heats it by radiation, regardless of the air between them. A sheet set between the two receives that radiation and, with air moving behind it, passes on very little. The same draft text for one American city speaks of 36 inches between the drum and a combustible wall (about {clearanceDrumCm} cm, derived), and of 18 inches (about {clearanceShieldCm} cm, derived) with a shield and 1 inch of air (about {shieldGapMm} mm, derived). **Those are the words of an unfinished text from another country, neither a rule nor a safe value**: they only show an order of magnitude, and no recipe for bringing a wall closer. Its true rule will come from the country, the insurer and a professional.',
    ),
    material: l('Tôle d’acier, sur entretoises incombustibles', 'Steel sheet, on non-combustible spacers'),
    specs: [
      sp(
        'Lame d’air, projet de texte',
        'Air gap, a draft text',
        tf('derived', 'environ {shieldGapMm} mm', 'about {shieldGapMm} mm'),
      ),
      sp('Principe', 'Principle', l('rayonnement arrêté, air qui passe', 'radiation stopped, air passing')),
      sp('Valeur sûre', 'Safe value', l('aucune donnée ici', 'none given here')),
    ],
    maintenance: maint(
      {
        failure:
          'Une lame d’air bouchée par un meuble, des rideaux, une accumulation de poussière : l’écran chauffe alors le mur par contact. La tôle qu’on trouve belle et qu’on fixe directement au mur ne protège presque plus.',
        check:
          'Un thermomètre de contact sur le mur derrière l’écran, à plein feu, relevé d’un jour à l’autre. C’est une vérification, pas une garantie.',
        care: 'Dépoussiérer la lame d’air, ne rien y glisser, et garder les entretoises. Le jour où le mur change de revêtement, on revoit tout.',
      },
      {
        failure:
          'An air gap blocked by furniture, curtains, gathering dust: the shield then heats the wall by contact. The sheet that looks nice and is fixed straight onto the wall protects hardly at all.',
        check:
          'A contact thermometer on the wall behind the shield, at full fire, read from one day to the next. A way of checking, not a guarantee.',
        care: 'Dust the gap, slide nothing into it, keep the spacers. The day the wall gets a new surface, all this is looked at again.',
      },
    ),
    tip: l(
      'Passez la vue thermique et regardez le mur derrière l’écran quand le bidon est au plus chaud.',
      'Use the thermal view and look at the wall behind the shield when the drum is at its hottest.',
    ),
    design: l(
      'Rayonnement et conduction sont deux problèmes. Une épaisse plaque de brique collée à un mur finit chaude, et le transmet ; une tôle mince avec de l’air derrière, non. C’est contre-intuitif, et ça ne se bricole pas.',
      'Radiation and conduction are two problems. A thick slab of brick stuck to a wall ends up hot and passes it on; a thin sheet with air behind it does not. It runs against intuition, and it is not for improvising.',
    ),
  },
  {
    id: 'co-alarm',
    scene: 'living-room',
    category: 'electrical',
    name: l('Détecteur de monoxyde', 'CO alarm'),
    short: l(
      'Le monoxyde de carbone ne se voit ni ne se sent, et il tue dans le sommeil. Ce détecteur est indispensable, et il ne suffit pas.',
      'Carbon monoxide can be neither seen nor smelt, and it kills in sleep. This alarm is indispensable, and it is not enough.',
    ),
    description: lf(
      '**Un poêle de masse brûle du bois dans une maison où l’on dort : le monoxyde peut y tuer.** Il naît d’un feu qui manque d’air ou de chaleur, et surtout des braises, après la flamme ; un conduit froid, une fissure dans la terre, un joint de conduit ou le couvercle du bidon le laissent entrer. Pour la concentration, l’OMS donne 100 mg/m³ sur 15 minutes, 35 sur une heure, 10 sur 8 heures, 7 sur 24 heures, soit environ {whoPpm15}, {whoPpm1h}, {whoPpm8h} et {whoPpm24h} ppm à 20 °C (dérivé). Un détecteur domestique, selon les manuels de fabricants qui citent la norme, sonne à 50 ppm en 60 à 90 minutes, à 100 ppm en 10 à 40 minutes, à 300 ppm en moins de 3 minutes, et peut rester muet à 30 ppm pendant 120 minutes : **il peut donc se taire à un niveau que l’OMS refuse**. Il sert à signaler une panne, pas à garantir l’air. En France, environ 3 000 personnes sont intoxiquées chaque année, et une centaine en meurent, tous appareils confondus. Nos scénarios donnent un ordre et un sens, jamais la mesure d’une vraie pièce.',
      '**A mass heater burns wood in a house where people sleep: carbon monoxide can kill there.** It comes from a fire short of air or heat, and above all from embers after the flame; a cold flue, a crack in the earth, a duct joint or the drum’s lid let it in. For the concentration, WHO gives 100 mg/m³ over 15 minutes, 35 over an hour, 10 over 8 hours, 7 over 24 hours, about {whoPpm15}, {whoPpm1h}, {whoPpm8h} and {whoPpm24h} ppm at 20 °C (derived). A domestic alarm, according to makers’ manuals citing the standard, sounds at 50 ppm within 60 to 90 minutes, at 100 ppm within 10 to 40 minutes, at 300 ppm in under 3 minutes, and may stay silent at 30 ppm for 120 minutes: **so it can keep quiet at a level WHO does not accept**. It is there to signal a fault, not to vouch for the air. In France about 3,000 people are poisoned each year and about a hundred die, across all appliances. Our scenarios give a direction and an order, never the measurement of a real room.',
    ),
    material: l(
      'Boîtier à pile et capteur électrochimique, conforme à la norme de son pays',
      'A battery unit with an electrochemical sensor, to the standard of its country',
    ),
    specs: [
      sp(
        'OMS, 1 heure',
        'WHO, 1 hour',
        tf('derived', '35 mg/m³, environ {whoPpm1h} ppm', '35 mg/m³, about {whoPpm1h} ppm'),
      ),
      sp(
        'OMS, 8 heures',
        'WHO, 8 hours',
        tf('derived', '10 mg/m³, environ {whoPpm8h} ppm', '10 mg/m³, about {whoPpm8h} ppm'),
      ),
      sp(
        'Détecteur, à 50 ppm',
        'Alarm, at 50 ppm',
        l('60 à 90 minutes, selon des manuels', '60 to 90 minutes, from manuals'),
      ),
      sp(
        'Détecteur, à 300 ppm',
        'Alarm, at 300 ppm',
        l('moins de 3 minutes, selon des manuels', 'under 3 minutes, from manuals'),
      ),
      sp('Silence possible', 'Silence allowed', l('30 ppm pendant 120 minutes', '30 ppm for 120 minutes')),
    ],
    maintenance: maint(
      {
        failure:
          'Une pile morte, un capteur en fin de vie, un appareil placé derrière un meuble ou un seul pour toute la maison. Et l’autre panne : le croire suffisant. Une alarme n’annule ni le ramonage ni un conduit qui fuit.',
        check:
          'Le bouton de test, selon sa notice, et la date de fin de vie imprimée sur le boîtier. La chambre compte autant que la pièce du poêle : dans le modèle, tout est une seule zone, et une vraie chambre peut être très loin de cette moyenne.',
        care: 'Le remplacer à la date écrite, et prendre au sérieux tout signal : on sort, on aère, et on appelle les secours. Un détecteur qui sonne ne se fait pas taire pour finir la soirée.',
      },
      {
        failure:
          'A dead battery, a sensor past its life, a unit behind furniture or just one for the whole house. And the other failure: believing it is enough. An alarm cancels neither the sweep nor a leaking flue.',
        check:
          'The test button, as its notice says, and the end-of-life date printed on the case. The bedroom counts as much as the stove’s room: in the model everything is one zone, and a real bedroom can be far from that mean.',
        care: 'Replace it on the written date, and take any signal seriously: get out, air the house, and call the emergency services. An alarm that sounds is not silenced so as to finish the evening.',
      },
    ),
    tip: l(
      'Lancez « Un clapet fermé sur les braises », puis « La hotte de cuisine », et comparez : les seuils de l’OMS tombent avant le détecteur, parfois sans lui.',
      'Run “A damper shut on embers”, then “The kitchen fan”, and compare: WHO’s values go before the alarm does, sometimes without it.',
    ),
    design: lf(
      'Le modèle le dit en chiffres, et il ne dit que cela. Fermé dix minutes après l’arrêt du bois, un clapet fait passer la valeur d’une heure de l’OMS en {damperWhoMin} minutes, et le détecteur de la norme sonne {damperAlarmMin} minutes au plus tard (résultat du modèle). Une hotte peut le laisser muet : {fanCoPeak} ppm au plus haut, et pas d’alarme. Ces chiffres sont une moyenne de toute la maison, dans une bande de un à neuf à la source : aucun modèle ne peut dire qu’une installation est sûre.',
      'The model says it in numbers, and it says only that. Shut ten minutes after the wood stops, a damper takes WHO’s one-hour value past in {damperWhoMin} minutes, and the standard’s alarm sounds {damperAlarmMin} minutes later at the latest (model result). A fan can leave it silent: {fanCoPeak} ppm at the highest, and no alarm. These figures are a whole-house mean, from a source in a band of one to nine: no model can say an installation is safe.',
    ),
  },
  {
    id: 'smoke-alarm',
    scene: 'living-room',
    category: 'electrical',
    name: l('Détecteur de fumée', 'Smoke alarm'),
    short: l(
      'Un autre gaz, un autre travail : il réagit aux particules de la fumée, et ne dit rien du monoxyde. On a besoin des deux.',
      'Another gas, another job: it answers to smoke particles and says nothing of carbon monoxide. Both are needed.',
    ),
    description: l(
      'Le détecteur de fumée est celui qu’on connaît : en France, il est obligatoire dans les logements depuis le 8 mars 2015, d’après ce que nous avons lu en résumé. Il repère les particules d’un début d’incendie. Le monoxyde de carbone est un gaz sans fumée : un conduit percé ou une braise peuvent en émettre dans une pièce parfaitement claire. Sa présence ici n’a rien d’administratif : un tube ouvert, une trappe qui suinte, un tissu trop près du bidon. Il ne faut pas s’étonner s’il se déclenche au premier allumage de la saison, quand la suie et la peinture du bidon brûlent : c’est une raison de garder la pièce aérée pendant cette phase, pas de le retirer du plafond.',
      'The smoke alarm is the familiar one: in France it has been compulsory in homes since 8 March 2015, from what we read in summary. It picks up the particles of a starting fire. Carbon monoxide is a smokeless gas: a holed flue or an ember can give it off in a perfectly clear room. Its presence here is no formality: an open feed, a door that seeps, a fabric too near the drum. It should come as no surprise if it goes off at the season’s first lighting, when soot and the drum’s paint burn off: a reason to keep the room aired during that phase, not to take it off the ceiling.',
    ),
    material: l('Boîtier à pile, au plafond', 'A battery unit, on the ceiling'),
    specs: [
      sp('Il voit', 'It sees', l('des particules de fumée', 'smoke particles')),
      sp('Il ne voit pas', 'It does not see', l('le monoxyde de carbone', 'carbon monoxide')),
      sp(
        'En France',
        'In France',
        l('obligatoire depuis 2015, lu en résumé', 'compulsory since 2015, read in summary'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La pile enlevée après une fausse alarme, et jamais remise : la panne la plus banale, et celle qui coûte. La poussière de cendre qui finit par encrasser le capteur.',
        check: 'Le bouton de test, selon sa notice, et sa date de fin de vie.',
        care: 'Le dépoussiérer à l’aspirateur, le déplacer plutôt que le désactiver s’il sonne trop souvent, et le remplacer à la date écrite.',
      },
      {
        failure:
          'The battery taken out after a false alarm and never put back: the most ordinary failure, and the one that costs. Ash dust that ends up fouling the sensor.',
        check: 'The test button, as its notice says, and its end-of-life date.',
        care: 'Vacuum the dust off, move it rather than disable it if it sounds too often, and replace it on the written date.',
      },
    ),
    tip: l(
      'Dans la 3D, les deux appareils sont l’un près de l’autre : de loin, ils se ressemblent, et ce n’est pas le même instrument.',
      'In the 3D the two units sit near each other: from afar they look alike, and they are not the same instrument.',
    ),
    design: l(
      'Le monoxyde se mélange à l’air, alors que la fumée d’un début de feu monte : c’est pourquoi leurs manuels indiquent des emplacements distincts. Lisez chaque notice : ce labo ne se substitue à aucune.',
      'Carbon monoxide mixes with the air, while the smoke of a young fire rises: hence the distinct places their manuals give. Read each notice: this lab stands in for none of them.',
    ),
  },
  {
    id: 'ventilation-grille',
    scene: 'living-room',
    category: 'mechanical',
    name: l('Grille d’aération', 'Ventilation grille'),
    short: lf(
      'À ne jamais boucher : une hotte de cuisine qui met la maison à {fanPa} Pa de dépression (hypothèse) peut retourner le conduit.',
      'Never to be blocked: a kitchen fan that puts the house {fanPa} Pa under (assumption) can turn the flue round.',
    ),
    description: lf(
      'Après le feu, le tirage retombe, alors que les braises continuent. Si une hotte ou une ventilation simple flux met la maison en dépression, l’air cherche un chemin, et le conduit en est un : un manuel français décrit cet enchaînement. Dans le scénario, {fanPa} Pa (hypothèse) retournent le courant en quelques minutes. Le CO de la pièce monte alors à {fanCoPeak} ppm en {fanPeakMin} minutes, la valeur d’une heure de l’OMS est passée à {fanWhoMin} minutes, et le détecteur n’est pas obligé de sonner (résultat du modèle ; moyenne de toute la maison). Une grille libre permet à l’air de venir d’ailleurs. Sa section n’est pas donnée ici : elle dépend du pays, de la ventilation et de l’avis du professionnel qui voit la maison.',
      'After the fire the draught falls away, while the embers go on. If a fan or a single-flow ventilation system depressurises the house, air looks for a way in, and the flue is one: a French manual describes this chain of events. In the scenario, {fanPa} Pa (assumption) turn the flow round within minutes. The room’s CO then reaches {fanCoPeak} ppm in {fanPeakMin} minutes, WHO’s one-hour value is passed at {fanWhoMin} minutes, and the alarm has no duty to sound (model result; a whole-house mean). A free grille lets the air come from elsewhere. Its section is not given here: it depends on the country, the ventilation and the word of the professional who sees the house.',
    ),
    material: l('Grille fixe dans le mur (dessin générique)', 'A fixed grille in the wall (a generic drawing)'),
    specs: [
      sp('Dépression du scénario', 'The scenario’s depression', tf('assumed', '{fanPa} Pa')),
      sp(
        'CO de la pièce, au plus haut',
        'Room CO, at its peak',
        tf('model', '{fanCoPeak} ppm en {fanPeakMin} minutes', '{fanCoPeak} ppm in {fanPeakMin} minutes'),
      ),
      sp(
        'Valeur d’une heure de l’OMS',
        'WHO’s one-hour value',
        tf('model', 'passée à {fanWhoMin} minutes', 'passed at {fanWhoMin} minutes'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une grille colmatée ou bouchée parce qu’elle laisse passer le froid. Un nouveau gros extracteur de cuisine, installé des années après le poêle, sans que personne repense à lui.',
        check:
          'Le jour d’un nouvel appareil d’extraction, ou d’une nouvelle isolation : c’est au professionnel que l’on demande alors, pas à la grille.',
        care: 'La dépoussiérer. Ne la fermer jamais, et ne pas mettre d’appareil qui aspire dans la même maison sans y réfléchir.',
      },
      {
        failure:
          'A grille clogged or blocked because it lets the cold through. A new powerful kitchen extractor, fitted years after the heater, with nobody thinking of it.',
        check:
          'The day of a new extractor or new insulation: the question goes to the professional then, not to the grille.',
        care: 'Dust it. Never close it, and do not bring an appliance that sucks into the same house without thinking about it.',
      },
    ),
    tip: l(
      'Dans la Simulation, « Dépression d’une hotte ou d’une VMC » fait la démonstration. Essayez-la à plusieurs moments de la journée : le plein feu tient, la fin de feu non.',
      'In the Simulation, “Depression from a fan” shows it. Try it at several times of day: full burn holds, the end of a fire does not.',
    ),
    design: l(
      'Une maison étanche est le prérequis d’un poêle de masse et le terrain de ses retours de fumée : les deux viennent ensemble. Un poêle qui respire dans une maison qui ne respire plus est un sujet à traiter ensemble.',
      'A tight house is both the prerequisite of a mass heater and the ground of its smoke-backs: the two come together. A heater that breathes in a house that no longer does is one subject, to be treated as one.',
    ),
  },
  {
    id: 'wood-basket',
    scene: 'living-room',
    category: 'site',
    name: l('Le panier du jour', 'The day’s basket'),
    short: lf(
      'Environ {woodDay} kg de bois fendu (hypothèse) : deux feux, {woodKwh} kWh (dérivé), et un jour d’hiver entier pour cette maison.',
      'About {woodDay} kg of split wood (assumption): two fires, {woodKwh} kWh (derived), and a whole winter’s day for this house.',
    ),
    description: lf(
      'Un **feu**, sur cette machine, n’est pas une brassée et un départ : c’est une séance menée de 2 à 4 heures, à une ou deux charges par heure, dit une constructrice. Notre journée fait deux séances de {sessionHours} h à {feedRate} kg/h, le matin et le soir, soit {woodDay} kg (hypothèses) et {woodKwh} kWh à 4,16 kWh/kg (dérivé). Cette même constructrice brûle 9 à 11 kg en 4 h pour tenir 24 h, dans une maison dont elle ne donne pas la taille ; un livre, lu seulement dans un résumé, parle de 9 à 18 kg par jour pour 74 m². Le panier de la 3D est à l’échelle. Le film des constructeurs le montre aussi : c’est peu, et cela vaut pour cette maison-là, avec cet air-là dehors.',
      'A **fire**, on this machine, is not an armful and away: it is a tended session of 2 to 4 hours, at one or two loads an hour, one builder says. Our day has two sessions of {sessionHours} h at {feedRate} kg/h, morning and evening, or {woodDay} kg (assumptions) and {woodKwh} kWh at 4.16 kWh/kg (derived). The same builder burns 9 to 11 kg in 4 h to hold 24 h, in a house whose size she does not give; a book, read only in a digest, speaks of 9 to 18 kg a day for 74 m². The basket in the 3D is to scale. The builders’ film shows it too: it is little, and it holds for that house, with that weather outside.',
    ),
    material: l('Osier, bois fendu', 'Wicker, split wood'),
    specs: [
      sp('Bois du jour', 'Wood of the day', tf('assumed', '{woodDay} kg')),
      sp('Son énergie', 'Its energy', tf('derived', '{woodKwh} kWh')),
      sp(
        'Un feu',
        'A fire',
        tf('assumed', '{sessionHours} h à {feedRate} kg/h', '{sessionHours} h at {feedRate} kg/h'),
      ),
      sp('Moyenne rendue', 'Mean delivered', tf('model', '{meanKw} kW, jour et nuit', '{meanKw} kW, day and night')),
    ],
    maintenance: maint(
      {
        failure:
          'Un panier posé près du bidon par commodité : du bois sec à côté d’une paroi à {lidPeak} °C (résultat du modèle) n’a pas sa place. Des insectes qui viennent avec lui.',
        check:
          'Sa place par rapport au tube et au bidon, et l’humidité de ce qu’il contient, au début de chaque rangée de la pile.',
        care: 'Remplir à la mesure de la journée, pas plus. Un bois stocké en pièce chaude finit de sécher, mais il n’y a aucune raison d’y faire un stock.',
      },
      {
        failure:
          'A basket set by the drum for convenience: dry wood has no place beside a wall at {lidPeak} °C (model result). Insects that come in with it.',
        check:
          'Where it stands against the feed and the drum, and the moisture of what it holds, at the start of each row of the pile.',
        care: 'Fill it for the day, no more. Wood kept in a warm room finishes drying, but that is no reason to stock it there.',
      },
    ),
    tip: l(
      'Comparez ce panier à la pile de la saison, autour de la maison : c’est toute la question du labo à l’échelle.',
      'Compare this basket with the season’s stack around the house: the whole question of the lab, to scale.',
    ),
    design: lf(
      'Cette journée est un choix d’entrée, pas une découverte : elle se place au milieu des récits. Ce que le modèle ajoute, c’est le reste : {wood20} kg tiennent 20 °C dans cette maison, {woodSnap} kg par −10 °C, et {woodLeaky} kg dans une maison qui fuit (résultat du modèle).',
      'This day is a chosen input, not a discovery: it sits in the middle of the accounts. What the model adds is the rest: {wood20} kg hold 20 °C in this house, {woodSnap} kg at −10 °C, and {woodLeaky} kg in a leaky house (model result).',
    ),
    video: ['02:17'],
  },
  {
    id: 'kettle',
    scene: 'living-room',
    category: 'site',
    name: l('La bouilloire', 'The kettle'),
    short: lf(
      'Le dessus du bidon, jusqu’à {lidPeak} °C (résultat du modèle), sert aussi de plaque : une habitude chaleureuse, et une surface brûlante.',
      'The drum’s top, up to {lidPeak} °C (model result), also serves as a hotplate: a warm habit, and a burning surface.',
    ),
    description: lf(
      'Le couvercle du bidon est la surface la plus chaude qu’on puisse atteindre dans cette pièce, et les récits de ces machines parlent d’y cuisiner. Dans le modèle, à {feedRate} kg/h (hypothèse), il atteint {lidPeak} °C (résultat du modèle) : assez pour faire bouillir de l’eau, mais seulement pendant les feux, et pas au réveil. La bouilloire a surtout une valeur pédagogique : elle donne à la main une raison d’aller à cet endroit, et donc à l’œil une raison de savoir qu’il est dangereux. Son eau ne compte pas dans le modèle, et n’importe quel récipient renversé sur cette plaque fait de la vapeur et de la rouille, sans gain notable pour la pièce.',
      'The drum’s lid is the hottest surface within reach in this room, and accounts of these machines speak of cooking on it. In the model, at {feedRate} kg/h (assumption), it reaches {lidPeak} °C (model result): enough to boil water, but only during the fires, not on waking. The kettle mostly has a teaching value: it gives the hand a reason to go to that spot, and so the eye a reason to know it is dangerous. Its water is not counted in the model, and any vessel spilt on this plate makes steam and rust with no notable gain for the room.',
    ),
    material: l('Bouilloire d’acier émaillé', 'An enamelled steel kettle'),
    specs: [
      sp('Sa surface', 'Its surface', l('le couvercle du bidon', 'the drum’s lid')),
      sp('Au plus chaud', 'At its hottest', tf('model', '{lidPeak} °C')),
      sp('Entre les feux', 'Between fires', l('presque la température de la pièce', 'near room temperature')),
    ],
    maintenance: maint(
      {
        failure:
          'De l’eau qui déborde sur le couvercle chaud, puis la rouille qui s’installe sur le joint du bidon. Une anse trop chaude, et une brûlure de manipulation.',
        check:
          'La plaque après chaque usage, et le joint du couvercle, qu’une habitude de cuisine peut user en silence.',
        care: 'Une manique sur un crochet, de l’eau qu’on essuie, et rien d’inflammable sur le dessus du bidon.',
      },
      {
        failure:
          'Water boiling over onto the hot lid, then rust setting in on the drum’s seal. A handle too hot, and a burn from handling.',
        check: 'The plate after each use, and the lid’s seal, which a cooking habit can quietly wear.',
        care: 'An oven glove on a hook, wipe up water, and nothing that burns on top of the drum.',
      },
    ),
    tip: l(
      'Faites glisser l’heure et lisez le couvercle : à quelle heure l’eau pourrait-elle bouillir, et à quelle heure non ?',
      'Drag the hour and read the lid: when could the water boil, and when not?',
    ),
    design: l(
      'Une machine dont on se sert à autre chose s’entretient mieux, et sa présence s’accepte mieux. Rien ici n’est calculé : la bouilloire est là pour l’habitude.',
      'A machine put to some other use is better looked after, and more easily accepted. Nothing here is calculated: the kettle is there for the habit.',
    ),
  },
  {
    id: 'flue-thermometer',
    scene: 'living-room',
    category: 'mechanical',
    name: l('Thermomètre de fumée', 'Flue thermometer'),
    short: lf(
      'Le seul instrument de la maison : trop chaud, le bois chauffe le ciel ; trop froid, le tirage faiblit. {exhaust} °C dans le modèle.',
      'The house’s only instrument: too hot, the wood heats the sky; too cold, the draught fades. {exhaust} °C in the model.',
    ),
    description: lf(
      'Un simple cadran sur le conduit dit ce qui part. Le modèle lit {exhaust} °C à plein feu, {shortExhaust} °C sur un banc de 4,5 m, {longExhaust} °C sur 18 m (résultat du modèle) ; les constructeurs rapportent de 32 à plus de 232 °C. Un concepteur vise 80 à 100 °C en sortie pour que ça tire : un repère, pas une loi. **C’est aussi de ces chiffres qu’on tire les rendements qui courent.** Un analyseur de fumées ne voit que la sortie : **{etaFlue} % par un calcul de fumées**, sur la même journée où la maison garde **{eta} %** (résultat du modèle, plage plausible de {etaLow} à {etaHigh} %). Nous n’avons trouvé aucun essai indépendant d’un tube en J en terre : les chiffres publiés au-dessus de 80 % sont tous des calculs de fumées. L’ouverture du tube, cachée à {feedCover} % (estimation), décide de l’essentiel, et aucune source ne la donne.',
      'A plain dial on the flue says what is leaving. The model reads {exhaust} °C at full fire, {shortExhaust} °C on a 4.5 m bench, {longExhaust} °C on 18 m (model result); builders report 32 to over 232 °C. One designer aims for 80 to 100 °C at the exit for a good draw: a mark, not a law. **The efficiencies going round also come from these figures.** A flue-gas analyser sees only the exit: **{etaFlue}% by a flue calculation**, on the same day the house keeps **{eta}%** (model result, plausible range {etaLow} to {etaHigh}%). We found no independent test of a cob J-tube: the published figures above 80 % are all flue calculations. The feed’s opening, hidden at {feedCover}% (estimate), decides most of it, and no source gives it.',
    ),
    material: l('Cadran à bilame, sur le conduit dans la pièce', 'A bimetal dial, on the flue in the room'),
    specs: [
      sp('Sortie à plein feu', 'Exhaust at full fire', tf('model', '{exhaust} °C')),
      sp(
        'Rendu à la maison',
        'Delivered to the house',
        tf('model', '{eta} %, de {etaLow} à {etaHigh} %', '{eta}%, {etaLow} to {etaHigh}%'),
      ),
      sp('Calcul de fumées', 'Flue calculation', tf('model', '{etaFlue} %', '{etaFlue}%')),
      sp(
        'Une constructrice, à la main',
        'One builder, by hand',
        l('75 %, plus ou moins 85 %, selon elle', '75 %, +/- 85 %, in her words'),
      ),
      sp('Un essai tiers, sur granulés', 'A third-party test, on pellets', l('68,5 à 79,7 %', '68.5 to 79.7 %')),
      sp('Un poêle de masse de 1992', 'A masonry heater of 1992', l('61,8 %', '61.8 %')),
    ],
    maintenance: maint(
      {
        failure:
          'Un cadran qui se décale après quelques saisons, ou un thermomètre posé loin de son point habituel : il donne un autre chiffre sans que rien ait changé. Une lecture isolée ne vaut pas la forme de la journée.',
        check:
          'Le même moment du feu, jour après jour, et un carnet : une dérive se voit, un chiffre seul presque jamais. Un analyseur de gaz, si l’on peut en obtenir un, dit bien davantage.',
        care: 'L’essuyer, ne pas le déplacer et le remplacer sans regret.',
      },
      {
        failure:
          'A dial that drifts after a few seasons, or a thermometer set away from its usual place: it gives another figure with nothing changed. A single reading is worth less than the shape of the day.',
        check:
          'The same moment in the fire, day after day, and a notebook: drift shows, a lone figure almost never. A gas analyser, if one can be had, says a great deal more.',
        care: 'Wipe it, leave it where it is, replace it without regret.',
      },
    ),
    tip: l(
      'Dans la Simulation, comparez « Ce que la maison garde du bois » et « Ce qu’un calcul de fumées dirait » : deux chiffres, la même journée.',
      'In the Simulation, compare “What the house keeps of the wood” and “What a flue calculation would say”: two figures, the same day.',
    ),
    design: lf(
      'L’écart de {eta} à {etaFlue} % (résultat du modèle) est ce qu’un calcul de fumées ne voit pas : le conduit dehors, le mur derrière le banc, le sol. Une lecture d’oxygène sur un tube en J stable réduirait cette incertitude plus que tout le reste : elle n’existe pas, à notre connaissance.',
      'The gap from {eta} to {etaFlue}% (model result) is what a flue calculation cannot see: the flue outdoors, the wall behind the bench, the ground. An oxygen reading on a steady J-tube would narrow this uncertainty more than anything else: none exists, as far as we know.',
    ),
  },
  {
    id: 'bench-cushion',
    scene: 'living-room',
    category: 'site',
    name: l('Coussin', 'Cushion'),
    short: l(
      'Un tissu qui supporte la chaleur, dit le projet de texte. Il rappelle qu’on vit sur cette machine, et qu’un coussin garde aussi la chaleur pour lui.',
      'A fabric that stands heat, says the draft text. It is a reminder that people live on this machine, and that a cushion keeps some heat for itself.',
    ),
    description: lf(
      'Ce projet de texte pour une ville américaine parle de tissu qui tolère la chaleur, sans chiffre. À {seatHigh} °C au plus chaud au bout chaud dans le modèle (résultat du modèle), un coussin n’a rien à craindre. Ce serait autre chose sur le banc trop court d’un constructeur, trop chaud pour s’y asseoir. Un coussin épais retient aussi ce que l’assise rendrait à la pièce : une surface d’argile nue échange environ {filmTotal} W/m²·K (résultat du modèle ; un manuel français annonce 13), et une surface couverte beaucoup moins. Ce n’est un problème que si tout le banc est couvert ; un coussin reste une question de vie plus qu’une affaire de bilan. Près du bidon, en revanche, un tissu n’a pas sa place.',
      'The draft text for one American city speaks of fabric that tolerates heat, without a figure. At {seatHigh} °C at the hottest at the hot end in the model (model result), a cushion has nothing to fear. It would be another matter on one builder’s too-short bench, too hot to sit on. A thick cushion also holds back what the seat would give the room: a bare earth surface exchanges about {filmTotal} W/m²·K (model result; a French manual announces 13), and a covered one far less. That is only a problem if the whole bench is covered; a cushion is a matter of living more than of the balance. Near the drum, however, a fabric has no place.',
    ),
    material: l(
      'Laine ou lin, jamais de mousse plastique près du bidon',
      'Wool or linen, never plastic foam near the drum',
    ),
    specs: [
      sp('Assise au plus chaud', 'Seat at its hottest', tf('model', '{seatHigh} °C')),
      sp('Échange de l’assise nue', 'Bare seat’s exchange', tf('model', '{filmTotal} W/m²·K')),
      sp('Selon un manuel français', 'According to a French manual', l('13 W/m²·K', '13 W/m²·K')),
    ],
    maintenance: maint(
      {
        failure:
          'Un coussin qui glisse près du bidon, un tissu synthétique qui fond, une couverture restée sur le banc tout l’hiver qui cache une fissure.',
        check: 'Son emplacement au moment de lancer le feu : c’est le geste d’une seconde.',
        care: 'Le retirer de temps en temps : l’enduit a besoin d’être vu et de sécher, et le banc n’en est que meilleur pour la pièce.',
      },
      {
        failure:
          'A cushion that slides near the drum, a synthetic fabric that melts, a blanket left on the bench all winter hiding a crack.',
        check: 'Where it lies when the fire is started: the gesture of one second.',
        care: 'Lift it off now and then: the plaster needs to be seen and to dry, and the bench is all the better for the room.',
      },
    ),
    tip: l(
      'Regardez le coussin en vue thermique : la couleur s’arrête au tissu et reprend autour.',
      'Look at the cushion in the thermal view: the colour stops at the fabric and picks up around it.',
    ),
    design: l(
      'On tient à montrer une pièce habitée parce que c’est la vraie condition de cette machine : les gens dorment à côté d’elle. C’est de là que vient chaque règle de ce labo.',
      'The room is shown as lived in because that is this machine’s true condition: people sleep beside it. Every rule of this lab comes from that.',
    ),
  },
  {
    id: 'inner-stone-wall',
    scene: 'living-room',
    category: 'structure',
    name: l('Le mur de refend', 'The stone wall'),
    short: lf(
      'Le stock de la maison elle-même : {stoneWallTonnes} t de pierre (dérivé), qui ne bougent que de {stoneLow} à {stoneHigh} °C sur un jour (résultat du modèle).',
      'The house’s own store: {stoneWallTonnes} t of stone (derived), moving only from {stoneLow} to {stoneHigh} °C in a day (model result).',
    ),
    description: lf(
      'Tout ne se joue pas dans le banc : les murs eux-mêmes prennent la chaleur et la rendent, et un manuel français insiste sur ce rôle. Notre mur fait {stoneWallT} × {stoneWallW} × {stoneWallH} m (hypothèse), soit {stoneWallTonnes} t à 2 300 kg/m³ (dérivé, densité usuelle), plus que le banc. Dans le modèle, il passe de {stoneLow} à {stoneHigh} °C au fil de la journée (résultat du modèle) : il bouge peu parce qu’il est lourd et que ses échanges avec l’air sont faibles. La pièce, elle, varie de {roomLow} à {roomHigh} °C. Pour le dire autrement, c’est une masse que personne n’a payée pour ce poêle, et une maison plus lourde bougerait moins. Une maison légère, sans ce mur, connaîtrait un écart plus grand à bois égal.',
      'It is not all down to the bench: the walls themselves take heat and give it back, and a French manual insists on that role. Our wall is {stoneWallT} × {stoneWallW} × {stoneWallH} m (assumption), or {stoneWallTonnes} t at 2,300 kg/m³ (derived, a usual density), more than the bench. In the model it goes from {stoneLow} to {stoneHigh} °C over the day (model result): it hardly moves, being heavy and exchanging little with the air. The room, meanwhile, goes from {roomLow} to {roomHigh} °C. Put another way, it is a mass nobody paid for on this heater’s account, and a heavier house would move less. A light house without this wall would see a wider swing on the same wood.',
    ),
    material: l('Pierre maçonnée, enduite', 'Mortared stone, plastered'),
    specs: [
      sp('Dimensions', 'Dimensions', tf('assumed', '{stoneWallT} × {stoneWallW} × {stoneWallH} m')),
      sp('Masse', 'Mass', tf('derived', '{stoneWallTonnes} t')),
      sp('Sur une journée', 'Over a day', tf('model', '{stoneLow} à {stoneHigh} °C', '{stoneLow} to {stoneHigh} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Rien de propre à ce poêle. Un mur enduit de plastique ou coupé de la pièce par une plaque isolante ne joue plus ce rôle ; c’est la panne la plus discrète d’une rénovation.',
        check:
          'La main sur le mur en fin d’après-midi : est-il plus tiède ou plus frais que l’air ? La vue thermique raconte la même chose.',
        care: 'Laisser au mur son enduit qui respire, et ne pas y coller un doublage sans en mesurer le prix.',
      },
      {
        failure:
          'Nothing specific to this heater. A wall coated in plastic or cut off from the room by an insulating board no longer plays this role; the quietest failure of a renovation.',
        check:
          'A hand on the wall late in the afternoon: is it warmer or cooler than the air? The thermal view tells the same story.',
        care: 'Leave the wall its breathing plaster, and do not fix a lining onto it without weighing the price.',
      },
    ),
    tip: l(
      'En vue thermique, comparez sa couleur à 7 h et à 21 h : elle change à peine, alors que l’air de la pièce change de plusieurs degrés.',
      'In the thermal view, compare its colour at 7 h and at 21 h: it barely changes, while the room’s air changes by several degrees.',
    ),
    design: l(
      'Nous l’avons mis parce qu’une maison isolée n’a pas d’autre manière de durer entre deux feux. Sa position est une hypothèse, comme le reste de la maison : un autre plan changerait un peu la pièce, pas le bois.',
      'We put it in because an insulated house has no other way of lasting between two fires. Its position is an assumption, like the rest of the house: another plan would change the room a little, not the wood.',
    ),
  },
];
