// Parts of the `bench-section` world (ids frozen in src/data/ids.ts): where the heat goes. A slice of bench magnified: the duct, the earth, the stones, the plaster, the tee and the drain, and a pebble bench as the other school.
// The seat peaks one to two hours after the flame, in the model: a thick cover beats a thin one by half an hour, not by hours. Plain steel is drawn on purpose, and galvanised steel is warned of once, in the guide.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const BENCH_SECTION_PARTS: PartInfo[] = [
  {
    id: 'duct-hot-run',
    scene: 'bench-section',
    category: 'mechanical',
    name: l('Le début du conduit', 'The hot run'),
    short: lf(
      'Les premiers mètres : ils prennent {hotRunShare} % de ce que cède le conduit (résultat du modèle), sous une terre plus épaisse.',
      'The first metres: they take {hotRunShare}% of what the duct gives up (model result), under a thicker cover of earth.',
    ),
    description: lf(
      'Le conduit d’acier de 200 mm arrive du collecteur encore chaud, autour de {afterDrum} °C à plein feu, et ses {hotRunM} premiers mètres en prennent {hotRunShare} % sur les 9 m (résultat du modèle). Un lecteur des courbes d’une autre machine y voyait bien plus, plus de 90 % sur les 8 à 10 premiers pieds : c’était une masse d’essai courte et une seule lecture, et cela va dans le même sens avec une pente bien plus forte. C’est pourquoi ce projet de texte pour une ville américaine donne ici plus de terre, environ {coverHotCm} cm sur les {hotRunM} premiers mètres (dérivé). La terre juste au-dessus du conduit monte à {earthDuct} °C au plus chaud : ce n’est pas ce qu’on sent en s’asseyant. Le modèle fait de ce film d’échange l’un de ses chiffres les moins sûrs : le gaz coule entre deux régimes, et un seul coefficient décide de la sortie.',
      'The 200 mm steel duct comes from the manifold still hot, around {afterDrum} °C at full fire, and its first {hotRunM} metres take {hotRunShare}% over the 9 m (model result). One reader of another machine’s curves saw far more there, over 90 % on the first 8 to 10 feet: that was a short test mass and a single reading, in the same direction with a much steeper slope. That is why the draft text for one American city gives more earth here, about {coverHotCm} cm over the first {hotRunM} metres (derived). The earth right above the duct climbs to {earthDuct} °C at the hottest: not what you feel on sitting down. The model counts this exchange film among its least sure figures: the gas flows between two regimes, and one coefficient decides the exit.',
    ),
    material: l(
      'Conduit d’acier spiralé, Ø 200 mm, acier nu sur le dessin',
      'Spiral steel duct, Ø 200 mm, plain steel in the drawing',
    ),
    specs: [
      sp('Diamètre', 'Bore', l('200 mm', '200 mm')),
      sp('Longueur', 'Length', tf('derived', 'les {hotRunM} premiers mètres', 'the first {hotRunM} metres')),
      sp('Entrée, à plein feu', 'Inlet, at full fire', tf('model', 'environ {afterDrum} °C', 'about {afterDrum} °C')),
      sp(
        'Part de ce que cède le conduit',
        'Share of what the duct gives',
        tf('model', '{hotRunShare} %', '{hotRunShare}%'),
      ),
      sp(
        'Terre autour, un projet de texte',
        'Earth around, a draft text',
        tf('derived', 'environ {coverHotCm} cm', 'about {coverHotCm} cm'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une corrosion lente sous la terre et un joint qui lâche sans se voir. La cendre volante s’y dépose moins qu’aux coudes, mais elle isole le peu qu’elle couvre.',
        check:
          'Passe-partout et caméra par les trappes : personne ne creuse pour regarder, et personne ne devrait avoir à le faire.',
        care: 'Le ramoneur, par la trappe. Une machine qui fume à l’arrêt ne se recouvre pas à neuf sans qu’on ait vu pourquoi.',
      },
      {
        failure:
          'Slow corrosion under the earth, and a joint giving way out of sight. Fly ash settles less here than at the bends, but it insulates the little it covers.',
        check: 'Rods and a camera through the doors: nobody digs in order to look, and nobody should have to.',
        care: 'The sweep, through the door. A machine that smokes at rest is not recovered as new without seeing why.',
      },
    ),
    tip: l(
      'Faites glisser l’heure avec la **Coupe** : la chaleur part du conduit vers l’assise, sur la même échelle de couleurs que dans la pièce.',
      'Drag the hour with the **Section** on: heat leaves the duct for the seat, on the same scale of colours as in the room.',
    ),
    design: lf(
      'Multiplier ou diviser par deux ce seul échange fait passer le rendement du modèle de {filmLowEta} à {filmHighEta} %, et la sortie de {filmLowExhaust} à {filmHighExhaust} °C (résultat du modèle). Voilà un chiffre que personne n’a mesuré : c’est le deuxième que nous demanderions à une vraie machine, après l’oxygène à l’entrée.',
      'Halving or doubling this one exchange takes the model’s efficiency from {filmLowEta} to {filmHighEta}%, and the exit from {filmLowExhaust} to {filmHighExhaust} °C (model result). Here is a figure nobody has measured: the second we would ask of a real machine, after the oxygen at the entry.',
    ),
  },
  {
    id: 'duct-cold-run',
    scene: 'bench-section',
    category: 'mechanical',
    name: l('La fin du conduit', 'The cold run'),
    short: lf(
      'Là où les gaz approchent de leur point de rosée : pas ici à {exhaust} °C, mais sur un conduit de 18 m, à {longExhaust} °C (résultat du modèle).',
      'Where the gases near their dew point: not here at {exhaust} °C, but on an 18 m duct, at {longExhaust} °C (model result).',
    ),
    description: lf(
      'Les six derniers mètres du conduit, sous environ {coverColdCm} cm de terre (un projet de texte, dérivé) : les gaz y arrivent assez froids pour en donner moins. À la fin du banc, à plein feu, ils en sortent vers {ductOutT} °C, et {exhaustAt9} °C au chapeau ; sur tout un feu, la sortie fait {exhaust} °C en moyenne (résultat du modèle). Le point de rosée dépend de l’excès d’air : environ 44 °C à deux fois l’air, 37 °C à trois fois, à 15 % d’humidité (dérivé) ; à notre {lambda} fois l’air, environ {dewDefault} °C (résultat du modèle). La condensation n’a donc pas lieu ici. Sur 18 m, c’est autre chose : moins d’air, un point de rosée vers {longDew} °C, et la sortie tombe à {longExhaust} °C, sous ce point pendant environ {longHours} h par jour, avec à peu près {longWater} kg d’eau ; le tirage tombe à {longDraft} Pa, et le rendement monte à {longEta} % (résultat du modèle). Une sortie « près de la température ambiante » se paie donc de cette eau-là. Un manuel français met d’ailleurs en garde contre ce risque dans un conduit de plus de 6 m sur son poêle.',
      'The last six metres of the duct, under about {coverColdCm} cm of earth (a draft text, derived): the gases arrive cool enough to give less. At the end of the bench, at full fire, they leave at about {ductOutT} °C, and {exhaustAt9} °C at the cap; over a whole fire the exit averages {exhaust} °C (model result). The dew point depends on the excess air: about 44 °C at twice the air, 37 °C at three times, at 15 % moisture (derived); at our {lambda} times the air, about {dewDefault} °C (model result). So condensation does not happen here. On 18 m it is another story: less air, a dew point near {longDew} °C, and the exit falls to {longExhaust} °C, below that point for about {longHours} h a day, with some {longWater} kg of water; the draught falls to {longDraft} Pa, and the efficiency rises to {longEta}% (model result). A “near room temperature” exhaust is paid for in that water. A French manual indeed warns of this risk in a duct over 6 m on its own stove.',
    ),
    material: l('Conduit d’acier spiralé, Ø 200 mm', 'Spiral steel duct, Ø 200 mm'),
    specs: [
      sp('Sortie, moyenne d’un feu', 'Exit, mean of a fire', tf('model', '{exhaust} °C')),
      sp('Point de rosée, ici', 'Dew point, here', tf('model', 'environ {dewDefault} °C', 'about {dewDefault} °C')),
      sp(
        'Terre autour, un projet de texte',
        'Earth around, a draft text',
        tf('derived', 'environ {coverColdCm} cm', 'about {coverColdCm} cm'),
      ),
      sp(
        'Sur 18 m',
        'On 18 m',
        tf('model', '{longExhaust} °C, {longDraft} Pa, {longEta} %', '{longExhaust} °C, {longDraft} Pa, {longEta}%'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'De l’eau acide qui attaque l’acier par l’intérieur, sur les conduits longs, à bas régime. Cette fin de conduit est ce qui rouille en premier, si quelque chose doit rouiller.',
        check:
          'La purge et le pied de cheminée, et des traces brunes ou une odeur âcre. Une sortie qui passe sous le point de rosée se lit au thermomètre.',
        care: 'Rien dessus. L’entretien est de ne pas chercher à gagner les derniers degrés en allongeant la machine.',
      },
      {
        failure:
          'Acid water attacking the steel from inside, on long ducts at low fire. The end of the duct is what rusts first, if anything is to rust.',
        check:
          'The drain and the chimney’s foot, and brown traces or a sharp smell. An exit under the dew point can be read on the thermometer.',
        care: 'Nothing on it. The care is in not trying to win the last degrees by lengthening the machine.',
      },
    ),
    tip: l(
      'Lancez « Un banc trop long » : presque toute la chaleur reste dans la maison, et la cheminée le fait payer.',
      'Run “A bench too long”: nearly all the heat stays in the house, and the chimney makes you pay for it.',
    ),
    design: lf(
      'Toute la question du banc est ici : assez de conduit pour récupérer la chaleur, pas assez pour tuer le tirage. Un projet de texte parle de 9 à 15 m de conduit, jusqu’à 18 m au plus (dérivé des pieds). Le modèle donne {shortEta} % à 4,5 m, {eta} % à 9 m, {longEta} % à 18 m : ce n’est pas une règle à suivre, juste la direction.',
      'The whole question of the bench is here: enough duct to recover the heat, not so much as to kill the draught. A draft text speaks of 9 to 15 m of duct, up to 18 m at most (derived from feet). The model gives {shortEta}% at 4.5 m, {eta}% at 9 m, {longEta}% at 18 m: not a rule to follow, just the direction.',
    ),
  },
  {
    id: 'duct-bend',
    scene: 'bench-section',
    category: 'mechanical',
    name: l('Le coude', 'The bend'),
    short: lf(
      'Chacun coûte du tirage et retient de la cendre : {ductBends} coudes dans notre dessin (hypothèse), et une trappe pour y revenir.',
      'Each costs draught and catches ash: {ductBends} bends in our drawing (assumption), and a door to get back to them.',
    ),
    description: lf(
      'Le conduit doit suivre les murs, et il a donc des coudes : {ductBends} ici, dans notre dessin (hypothèse). Chacun coûte environ {kBend} hauteur de vitesse, un chiffre de table usuelle (estimation). Ce n’est pas beaucoup à cette vitesse : à plein feu, le gaz va lentement, et près de {feedPaShare} % du tirage se perd à l’entrée du tube (résultat du modèle). Le coude compte surtout pour autre chose : à l’extérieur du virage, le flux ralentit, et la cendre volante se pose ; c’est là qu’une brosse se bloque, et qu’un joint travaille. Les règles françaises limitent le raccordement d’un poêle ordinaire à deux coudes à 90° : ce qu’est un banc de 9 m aux yeux de ces règles reste une question à poser.',
      'The duct has to follow the walls, so it has bends: {ductBends} here, in our drawing (assumption). Each costs about {kBend} velocity head, a usual table’s figure (estimate). That is not much at this speed: at full fire the gas moves slowly, and nearly {feedPaShare}% of the draught is lost at the feed’s entry (model result). The bend mostly counts for something else: outside the curve the flow slows and fly ash settles; there a brush jams and a joint works. The French rules limit an ordinary stove’s connection to two 90° bends: what a 9 m bench is in the eyes of those rules remains a question to put.',
    ),
    material: l('Coude d’acier en sections, Ø 200 mm', 'A sectioned steel bend, Ø 200 mm'),
    specs: [
      sp('Nombre, dans notre dessin', 'Number, in our drawing', tf('assumed', '{ductBends}')),
      sp(
        'Perte, table usuelle',
        'Loss, a usual table',
        tf('estimate', '{kBend} hauteur de vitesse', '{kBend} velocity head'),
      ),
      sp('Règle française, poêle ordinaire', 'French rule, ordinary stove', l('2 coudes à 90°', '2 bends at 90°')),
    ],
    maintenance: maint(
      {
        failure:
          'Un bouchon de cendre à l’extérieur du virage, puis un feu qui tire moins bien. Le coude est aussi l’endroit où un joint s’ouvre quand le conduit se dilate.',
        check:
          'Le thermomètre de fumée et le passage du ramoneur, avec la longueur de brosse notée d’une année à l’autre.',
        care: 'Une trappe près de l’angle dans notre reconstitution, et rien d’autre à faire qu’y passer la brosse.',
      },
      {
        failure:
          'A plug of ash outside the curve, then a fire that draws worse. The bend is also where a joint opens as the duct expands.',
        check: 'The flue thermometer and the sweep’s pass, with the brush’s reach noted from year to year.',
        care: 'A door near the corner in our reconstruction, and nothing else to do but run the brush.',
      },
    ),
    tip: l(
      'Regardez l’angle ouvert, derrière les deux tranches : la trappe du banc y tombe juste avant ce coude.',
      'Look at the open corner, behind the two slices: the bench’s door falls just before this bend.',
    ),
    design: l(
      'Dessiner le banc en ligne droite serait plus simple pour les gaz, mais une pièce a des murs. Comme souvent ici, la forme vient de la maison, et pas de la thermique.',
      'Drawing the bench in a straight line would be simpler for the gases, but a room has walls. As often here, the shape comes from the house and not from the thermal sums.',
    ),
  },
  {
    id: 'duct-joint',
    scene: 'bench-section',
    category: 'mechanical',
    name: l('Le raccord', 'The duct joint'),
    short: l(
      'Étanche, parce que c’est par ici que le monoxyde sortirait. Il faut s’en assurer avant de le recouvrir, car ensuite on ne le verra plus.',
      'Tight, because this is where carbon monoxide would leave. That has to be made sure before covering it, since it will never be seen again.',
    ),
    description: lf(
      'Dans notre dessin, un raccord tous les un à deux mètres sur un conduit de 9 m, sous la terre. À plein feu, la pression y est négative, autour de −{ductPa} Pa (résultat du modèle) : une fuite aspire de l’air, qui vole du tirage, sans rien laisser sortir tant que le courant tient. Tout change quand le courant s’inverse, ou que le conduit est fermé : la même fuite laisse alors entrer des gaz dans la terre, et de là dans la pièce par une fissure. Le modèle n’a pas cette fuite : il en compte une seule, au joint du couvercle du bidon, et personne n’a publié de mesure de monoxyde dans une pièce à partir d’une fuite réelle. Notre reconstitution montre un conduit d’acier nu, emboîté et serré, et les matériaux d’étanchéité sont l’affaire d’un maçon de poêles et de leurs fiches.',
      'In our drawing, a joint every one or two metres along a 9 m duct, under the earth. At full fire the pressure there is negative, around −{ductPa} Pa (model result): a leak draws air in, stealing draught, and lets nothing out as long as the flow holds. All changes when the flow reverses or the flue is shut: the same leak then lets gas into the earth, and from there into the room through a crack. The model does not have this leak: it counts just one, at the seal of the drum’s lid, and nobody has published a measurement of carbon monoxide in a room from a real leak. Our reconstruction shows a plain steel duct, fitted together and tightened, and the sealing materials are the business of a stove mason and their data sheets.',
    ),
    material: l('Emboîtement d’acier, joint selon le fabricant', 'Steel fitted joint, a seal to the maker’s data'),
    specs: [
      sp('Pression à plein feu', 'Pressure at full fire', tf('model', 'environ −{ductPa} Pa', 'about −{ductPa} Pa')),
      sp('Dans le modèle', 'In the model', l('pas de fuite à cet endroit', 'no leak at this point')),
      sp('Essai', 'Test', l('à découvert, avant de recouvrir', 'uncovered, before it is covered')),
    ],
    maintenance: maint(
      {
        failure:
          'Un joint qui s’ouvre sous une terre qui tasse, sans aucun signe. Le premier indice est une odeur de fumée à l’arrêt, ou le détecteur, et aucun des deux ne se déclenche forcément.',
        check:
          'Avant de recouvrir : le faire voir, le faire tester, photographier. Ensuite, un analyseur de monoxyde dans la pièce, à la demande, par un professionnel.',
        care: 'Aucun une fois noyé. Tout l’entretien de ce raccord a lieu le jour où on peut encore le voir.',
      },
      {
        failure:
          'A joint opening under settling earth, with no sign at all. The first clue is a smell of smoke at rest, or the alarm, and neither is sure to go off.',
        check:
          'Before covering: have it seen, have it tested, photograph it. After that, a carbon monoxide analyser in the room, on request, by a professional.',
        care: 'None once buried. All the care of this joint happens on the day it can still be seen.',
      },
    ),
    tip: l(
      'Isolez un raccord : c’est ainsi qu’on le voit le jour du chantier. Une fois la terre refermée, plus personne ne le verra.',
      'Isolate a joint: that is how it looks on the day of the build. Once the earth closes over it, nobody will see it again.',
    ),
    design: l(
      'Un conduit noyé n’est pas un conduit de poêle ordinaire, qu’on regarde et qu’on change. Le prix de cette belle banquette se paie ici, et ce n’est pas un petit prix : c’est pourquoi une assurance et un professionnel ont leur mot à dire.',
      'A buried duct is not an ordinary stove pipe that can be looked at and changed. The price of that fine bench is paid here, and it is not a small one: that is why an insurer and a professional have their say.',
    ),
  },
  {
    id: 'cob-casing',
    scene: 'bench-section',
    category: 'structure',
    name: l('La terre qui garde', 'The cob casing'),
    short: lf(
      '0,6 W/m·K : lente exprès, épaisse au début du banc, plus mince ensuite. L’assise culmine {lagStopCold} à {lagStop} h après l’arrêt du bois (résultat du modèle).',
      '0.6 W/m·K: slow on purpose, thick at the start of the bench, thinner after. The seat peaks {lagStopCold} to {lagStop} h after the wood stops (model result).',
    ),
    description: lf(
      'La terre mesurée à l’état normalement humide a une conductivité d’environ 0,6 W/m·K et une capacité de 891 J/kg·K (à 3 % d’humidité) ; les études vont de 0,12 à 1,06 W/m·K, et leur revue parle d’absence de consensus. La masse volumique de notre banc, avec environ {stoneShare} % de pierres, est de {cobRho} kg/m³ (estimation, plage {cobRhoLow} à {cobRhoHigh}). Un projet de texte met environ {coverHotCm} cm de terre autour du début du conduit, et {coverColdCm} cm ensuite (dérivé). Cette lenteur est toute l’affaire : l’assise culmine **une à deux heures après la flamme**, {lagStop} h au bout épais, à {seatHigh} °C, {lagStopCold} h au bout mince, à {seatColdHigh} °C (résultat du modèle). Ce n’est pas un temps de traversée : ces heures comptent depuis la fin d’un feu de {sessionHours} h (hypothèse), et la chaleur traverse déjà la terre pendant ce feu, soit {lagBegin} h depuis l’allumage au bout épais. Le modèle compare les deux épaisseurs de ce texte, et il ne dit rien d’une bonne épaisseur. Et elle ne tient pas la maison à elle seule. Et au-dessus du conduit, la terre monte à {earthDuct} °C sans qu’on le sente.',
      'Cob measured in its normally damp state has a conductivity of about 0.6 W/m·K and a heat capacity of 891 J/kg·K (at 3 % moisture); studies run from 0.12 to 1.06 W/m·K, and their review speaks of no consensus. Our bench’s density, with about {stoneShare}% stones, is {cobRho} kg/m³ (estimate, range {cobRhoLow} to {cobRhoHigh}). A draft text puts about {coverHotCm} cm of earth round the start of the duct and {coverColdCm} cm afterwards (derived). This slowness is the whole point: the seat peaks **one to two hours after the flame**, {lagStop} h at the thick end, at {seatHigh} °C, {lagStopCold} h at the thin end, at {seatColdHigh} °C (model result). That is no crossing time: those hours run from the end of a fire of {sessionHours} h (assumption), and the heat is already crossing the earth during that fire, {lagBegin} h from lighting at the thick end. The model compares that text’s two thicknesses, and says nothing of a right one. And the earth does not hold the house alone. And above the duct the earth climbs to {earthDuct} °C unfelt.',
    ),
    material: l(
      'Terre argileuse et pierres, sans fibre ; aucun mélange donné',
      'Clay earth and stones, no fibre; no mix given',
    ),
    specs: [
      sp(
        'Conductivité, mesurée',
        'Conductivity, measured',
        l('environ 0,6 W/m·K, à l’état humide', 'about 0.6 W/m·K, in its damp state'),
      ),
      sp(
        'Capacité, mesurée',
        'Heat capacity, measured',
        l('891 J/kg·K, à 3 % d’humidité', '891 J/kg·K, at 3 % moisture'),
      ),
      sp('Masse volumique', 'Density', tf('estimate', '{cobRho} kg/m³')),
      sp(
        'Pic de l’assise après l’arrêt du bois',
        'Seat’s peak after the wood stops',
        tf('model', '{lagStopCold} à {lagStop} h', '{lagStopCold} to {lagStop} h'),
      ),
      sp(
        'Terre au-dessus du conduit',
        'Earth above the duct',
        tf('model', 'jusqu’à {earthDuct} °C', 'up to {earthDuct} °C'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La fissure, qu’elle vienne du séchage, de la chaleur ou du sol. Une terre qui ne sèche pas reste aussi une éponge pour l’humidité de la pièce, et elle retient mal sa forme.',
        check:
          'À la main et à l’œil, sur l’enduit. Le premier hiver dit plus que tout : une fissure qui se stabilise est normale, et une fissure qui revient ne l’est pas.',
        care: 'Reprendre à la terre, à froid. Le modèle n’a ni séchage ni première semaine : la vraie terre a besoin de plusieurs semaines et personne ne publie leur nombre.',
      },
      {
        failure:
          'The crack, whether from drying, heat or the floor. Earth that does not dry also stays a sponge for the room’s damp, and holds its shape poorly.',
        check:
          'By hand and eye, on the plaster. The first winter says more than anything: a crack that settles is normal, a crack that returns is not.',
        care: 'Repair with earth, when cold. The model has neither drying nor first week: real earth needs weeks, and nobody publishes how many.',
      },
    ),
    tip: l(
      'Coupe, vue thermique, curseur d’heure : regardez une bande de chaleur quitter le conduit, monter, et arriver à l’assise alors que le feu est mort.',
      'Section, thermal view, hour slider: watch a band of heat leave the duct, climb, and reach the seat when the fire is dead.',
    ),
    design: lf(
      'À 0,3 W/m·K, l’assise ne monte qu’à {kLowSeat} °C et le rendement tombe à {kLowEta} % ; à 1,06 W/m·K, {kHighSeat} °C et {kHighEta} % (résultat du modèle). Sur l’efficacité du poêle, la terre compte donc autant que bien d’autres choix. Le calcul simple, celui d’une impulsion de chaleur, annonçait un pic bien plus tardif : il supposait un feu très court et des gaz qui ne refroidissent pas le côté du conduit.',
      'At 0.3 W/m·K the seat climbs only to {kLowSeat} °C and the efficiency falls to {kLowEta}%; at 1.06 W/m·K, {kHighSeat} °C and {kHighEta}% (model result). So on the heater’s efficiency the earth counts as much as many another choice. The simple sum, that of a pulse of heat, announced a far later peak: it assumed a very short fire and gases that do not cool the duct’s side.',
    ),
  },
  {
    id: 'stone-filler',
    scene: 'bench-section',
    category: 'structure',
    name: l('Les pierres', 'The stones'),
    short: l(
      'Bien plus de pierre que de terre, et une terre sans fibre pour lier, d’après ce que disent des constructeurs de leur propre poêle.',
      'Far more stone than earth, and earth with no fibre to bind it, as builders say of their own heater.',
    ),
    description: lf(
      'Dans un film, des constructeurs disent que leur banc contient bien plus de pierre que de terre, et que leur terre n’a pas de fibre. La fibre allège et isole : elle n’a rien à faire dans un stock de chaleur. Une vidéo française montre aussi de la terre et de la pierre. La pierre coûte moins de séchage, a une densité d’environ {stoneRho} kg/m³ (valeur usuelle, estimation), et conduit mieux, environ {stoneK} W/m·K (valeur usuelle, estimation). Le modèle ne les voit pas une à une : il prend une terre moyenne, avec environ {stoneShare} % de pierres pour sa densité (estimation). Vous ne trouverez pas ici combien de pierres, de quelle taille, ni de distance au conduit : c’est là qu’un calcul simple cesse de suffire et que le savoir-faire commence.',
      'In a film, builders say their bench holds far more stone than earth, and that their earth has no fibre. Fibre lightens and insulates: it has no business in a heat store. A French video also shows earth and stone. Stone costs less drying, has a density of about {stoneRho} kg/m³ (a usual value, estimate), and conducts better, about {stoneK} W/m·K (a usual value, estimate). The model does not see them one by one: it takes an average earth, with about {stoneShare}% stones for its density (estimate). You will not find here how many stones, of what size, or at what distance from the duct: that is where a simple sum stops being enough and know-how begins.',
    ),
    material: l('Pierre locale, non gélive, propre', 'Local stone, frost-sound, clean'),
    specs: [
      sp(
        'Part des pierres, dans le modèle',
        'Share of stones, in the model',
        tf('estimate', 'environ {stoneShare} %', 'about {stoneShare}%'),
      ),
      sp('Densité, usuelle', 'Density, usual', tf('estimate', 'environ {stoneRho} kg/m³', 'about {stoneRho} kg/m³')),
      sp(
        'Conductivité, usuelle',
        'Conductivity, usual',
        tf('estimate', 'environ {stoneK} W/m·K', 'about {stoneK} W/m·K'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une pierre qui touche le conduit fait un pont thermique et un point dur ; une pierre gorgée d’eau, placée près du foyer, peut éclater en chauffant. Le modèle n’a rien de tout cela.',
        check: 'Le choix de la pierre avant de la poser, sèche et saine. Une fois noyée, elle n’a plus d’entretien.',
        care: 'Aucun. Son entretien est son choix.',
      },
      {
        failure:
          'A stone touching the duct makes a thermal bridge and a hard point; a water-laden stone set near the core can burst when heated. The model has none of this.',
        check: 'Choosing the stone before it is laid, dry and sound. Once buried, it needs no care.',
        care: 'None. Its care lies in its choice.',
      },
    ),
    tip: l(
      'Sur les faces coupées, regardez comment les pierres dessinées laissent de la place à la terre autour du conduit.',
      'On the cut faces, see how the stones drawn leave room for the earth around the duct.',
    ),
    design: l(
      'Il y a là une vraie question ouverte : une pierre rapproche la chaleur de l’assise, et le pic arriverait plus tôt avec plus de pierres. Nous n’avons trouvé aucune mesure de cela sur un banc, et le modèle ne peut que déplacer la conductivité moyenne.',
      'There is a true open question here: a stone brings the heat nearer the seat, and the peak would come sooner with more stones. We found no measurement of it on a bench, and the model can only shift the mean conductivity.',
    ),
    video: ['00:56'],
  },
  {
    id: 'earthen-plaster',
    scene: 'bench-section',
    category: 'structure',
    name: l('L’enduit de terre', 'The earthen plaster'),
    short: lf(
      'La peau de l’assise : une fissure ici en dit une autre en dessous. Elle échange environ {filmTotal} W/m²·K avec la pièce (résultat du modèle).',
      'The seat’s skin: a crack here tells of one below. It exchanges about {filmTotal} W/m²·K with the room (model result).',
    ),
    description: lf(
      'L’enduit fait de la masse une surface qu’on peut toucher, nettoyer et surveiller. Il est très mince par rapport au reste, et le modèle le fond dans sa dernière cellule. Un manuel français annonce 13 W/m²·K de surface au-dessus de la pièce, 60 % par rayonnement et 40 % par convection. Avec ses films usuels et une émissivité de 0,9, le modèle trouve environ {filmTotal} W/m²·K à 15 K d’écart, avec les mêmes 60 % de rayonnement (résultat du modèle) : la répartition est retrouvée, le total non. Cet écart a un effet : à 13 W/m²·K, une assise à 35 °C porterait toute la maison (dérivé), alors que le modèle lui fait rendre environ le quart de ce qu’il faudrait. La chaleur d’une assise ne se sent pas d’abord à l’air de la pièce : le corps et les murs en reçoivent plus de la moitié directement.',
      'The plaster makes of the mass a surface to touch, clean and watch. It is very thin against the rest, and the model melts it into its last cell. A French manual announces 13 W/m²·K of surface above the room, 60 % by radiation and 40 % by convection. With its usual films and an emissivity of 0.9, the model finds about {filmTotal} W/m²·K at a 15 K gap, with the same 60 % of radiation (model result): the split is retrieved, the total not. That gap has an effect: at 13 W/m²·K a seat at 35 °C would carry the whole house (derived), whereas the model has it give about a quarter of what is needed. A seat’s heat is not felt first in the room’s air: body and walls get over half of it directly.',
    ),
    material: l('Terre fine, sable, sans recette donnée', 'Fine earth, sand, with no recipe given'),
    specs: [
      sp(
        'Échange de surface',
        'Surface exchange',
        tf('model', '{filmTotal} W/m²·K, 60 % par rayonnement', '{filmTotal} W/m²·K, 60% by radiation'),
      ),
      sp('Un manuel français', 'A French manual', l('13 W/m²·K, 60 % par rayonnement', '13 W/m²·K, 60 % by radiation')),
      sp('Assise, au plus chaud', 'Seat, at its hottest', tf('model', '{seatHigh} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Des fissures de séchage, normales au début, et des chocs sur une arête. La vraie panne, c’est celle qu’on répare sans la lire : refermer une fissure qui disait quelque chose du dessous.',
        check:
          'Un trait de crayon à chaque bout d’une fissure, et une date. Ni la main ni l’œil ne remplacent un analyseur.',
        care: 'Une reprise à la terre fine, à froid. Une cire ou un savon, si l’on veut : rien qui ferme les pores au point de l’empêcher de respirer.',
      },
      {
        failure:
          'Drying cracks, normal at first, and knocks on an edge. The true failure is the one repaired unread: closing a crack that was saying something about what lies beneath.',
        check:
          'A pencil mark at each end of a crack, and a date. Neither hand nor eye is a substitute for an analyser.',
        care: 'Touch up with fine earth, when cold. A wax or a soap if you wish: nothing that closes the pores so far as to stop it breathing.',
      },
    ),
    tip: l(
      'Le graphique « La banquette se charge, puis rend » suit justement cette surface, au début et à la fin du banc.',
      'The “bench charges, then gives back” chart follows just this surface, at the start and at the end of the bench.',
    ),
    design: l(
      'L’enduit est aussi un capteur à bas prix : sur un matériau qui fissure, ce qui change se voit. Sur une chape de ciment dure, il n’y aurait rien à lire avant qu’un morceau parte.',
      'Plaster is also a cheap sensor: on a material that cracks, change shows. On a hard cement screed there would be nothing to read until a piece came away.',
    ),
  },
  {
    id: 'floor-barrier',
    scene: 'bench-section',
    category: 'structure',
    name: l('La couche sur la dalle', 'The floor layer'),
    short: l(
      'De la mousse sous un poêle fond ou couve, prévient un manuel français. Ce qui est dessous doit tenir à la chaleur, ou ne pas y être.',
      'Foam under a heater melts or smoulders, a French manual warns. What lies beneath has to stand the heat, or not be there.',
    ),
    description: lf(
      'Sous le banc, les couches comptent. Le modèle envoie environ {groundKwh} kWh par jour vers le sol (résultat du modèle), à travers une isolation de plancher de {floorU} W/m²·K et un sol tenu à {groundT} °C (estimation). Ce n’est pas ce qui menace la maison : le risque, c’est le matériau. Un manuel français prévient qu’une mousse sous un poêle peut fondre ou couver : la même remarque vaut pour un plancher de bois sous le foyer, car une dalle n’est pas seulement un support, mais un écran. Notre dessin montre une couche sur la dalle, sans recette : la composition dépend de la maison, de ce qu’il y a dessous, et de ce que le professionnel y verra.',
      'Under the bench the layers count. The model sends about {groundKwh} kWh a day towards the ground (model result), through floor insulation of {floorU} W/m²·K and ground held at {groundT} °C (estimate). That is not what threatens the house: the risk is the material. A French manual warns that foam under a heater can melt or smoulder: the same remark goes for a timber floor under the core, since a slab is not only a support but a screen. Our drawing shows a layer on the slab, with no recipe: its make-up depends on the house, on what lies beneath, and on what the professional will see there.',
    ),
    material: l('Couche minérale, sans recette donnée', 'A mineral layer, with no recipe given'),
    specs: [
      sp('Perte vers le sol', 'Loss to the ground', tf('model', '{groundKwh} kWh par jour', '{groundKwh} kWh a day')),
      sp('Isolation du plancher', 'Floor insulation', tf('estimate', '{floorU} W/m²·K')),
      sp('Sol sous la maison', 'Ground under the house', tf('estimate', '{groundT} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Rien qui ne se voie : un matériau sensible à la chaleur qui se dégrade lentement sous la masse, ou une humidité qui remonte. On ne le découvre souvent qu’en démolissant.',
        check:
          'Ce qui se trouve vraiment sous la dalle, avant de commencer : plans, sondages, et l’avis de quelqu’un qui a déjà ouvert de tels planchers.',
        care: 'Aucun, une fois recouverte. Comme le raccord, c’est un entretien du jour de la pose.',
      },
      {
        failure:
          'Nothing that shows: a heat-sensitive material slowly breaking down under the mass, or damp rising. It is often found out only on demolition.',
        check:
          'What truly lies under the slab, before starting: drawings, probes, and the word of someone who has opened such floors.',
        care: 'None once covered. Like the joint, its care happens on the day it is laid.',
      },
    ),
    tip: l(
      'Faites un éclaté du banc, et comptez les couches sous l’assise. Le poids des 3 t passe à travers toutes.',
      'Explode the bench and count the layers under the seat. The weight of 3 t goes through them all.',
    ),
    design: l(
      'On oublie facilement qu’un poêle de masse est aussi un problème de ce qu’on trouve en dessous. La couche est mince sur le dessin, mais c’est une question qui vaut un sondage.',
      'It is easy to forget that a mass heater is also a problem of what lies below. The layer is thin in the drawing, but the question is worth a test hole.',
    ),
  },
  {
    id: 'bench-cleanout',
    scene: 'bench-section',
    category: 'mechanical',
    name: l('Trappe du banc', 'The bench cleanout'),
    short: l(
      'Le chemin du ramoneur dans le conduit : une porte ronde au bord du banc, fermée et étanche, et que tout le monde doit pouvoir trouver.',
      'The sweep’s way into the duct: a round door at the bench’s edge, closed and tight, that everyone has to be able to find.',
    ),
    description: lf(
      'Un manuel français prévoit des trappes de nettoyage à l’endroit où les cendres s’accumulent : nous en dessinons une, ronde, sur le devant du banc, un peu avant l’angle. Pendant un feu, la pression y est négative, autour de −{ductPa} Pa à plein feu (résultat du modèle), et l’air y entre si le couvercle est mal fermé : cela fait perdre du tirage et un peu de chaleur, tant que le courant ne se retourne pas. Fermée, elle ne compte que pour une petite pièce d’acier dans une grande masse, que la chaleur fait travailler. Son emplacement décide : à côté d’elle, on doit pouvoir passer une brosse le long de tout un tronçon, et une brosse ne prend pas un virage serré. C’est là que le ramoneur juge si la machine lui a été montrée avant d’être construite.',
      'A French manual provides cleaning doors where ash gathers: we draw one, round, on the front of the bench, a little before the corner. During a fire the pressure there is negative, around −{ductPa} Pa at full fire (model result), and air comes in if the cover is poorly closed: it costs draught and a little heat, as long as the flow does not turn round. Closed, it counts only as a small piece of steel in a large mass, worked by the heat. Its position decides: beside it, a brush must pass along a whole stretch, and a brush does not take a tight turn. That is where the sweep can tell if the machine was shown to him before it was built.',
    ),
    material: l('Porte ronde d’acier, joint de porte de poêle', 'A round steel door, a stove-door gasket'),
    specs: [
      sp('Pression à plein feu', 'Pressure at full fire', tf('model', 'environ −{ductPa} Pa', 'about −{ductPa} Pa')),
      sp(
        'Où, dans notre dessin',
        'Where, in our drawing',
        l('devant du banc, avant l’angle', 'bench front, before the corner'),
      ),
      sp('Ouverture', 'Opening', l('à froid', 'cold')),
    ],
    maintenance: maint(
      {
        failure:
          'Une trappe enduite puis oubliée, un joint durci, ou un capuchon mal remis après le passage du ramoneur : le feu devient paresseux sans explication.',
        check:
          'À chaque ramonage : la fermeture et le joint, et le niveau de cendre qui en sort noté d’une année à l’autre.',
        care: 'La laisser visible et dégagée. Une trappe qu’il faut chercher est une trappe qu’on n’ouvre pas.',
      },
      {
        failure:
          'A door plastered over and forgotten, a hardened seal, or a cap badly put back after the sweep: the fire turns lazy for no apparent reason.',
        check: 'At each sweep: the closure and the seal, and the depth of ash coming out, noted from year to year.',
        care: 'Leave it visible and clear. A door you have to search for is a door you do not open.',
      },
    ),
    tip: l(
      'Sur l’éclaté, la trappe s’écarte du banc avec sa branche : on voit ce qui la relie au conduit.',
      'In the exploded view the door moves off the bench with its branch: you see what joins it to the duct.',
    ),
    design: l(
      'Une petite porte coûte moins cher qu’une banquette à refaire. Combien en mettre est un compromis entre les fuites possibles et les accès possibles, et notre dessin en montre une.',
      'A small door costs less than a bench to rebuild. How many to fit is a trade between possible leaks and possible access, and our drawing shows one.',
    ),
  },
  {
    id: 'chimney-tee',
    scene: 'bench-section',
    category: 'mechanical',
    name: l('Le té de pied', 'The chimney tee'),
    short: l(
      'Là où le conduit horizontal rencontre la cheminée. Réchauffer ce pied d’abord, c’est ainsi que les constructeurs viennent à bout d’un conduit froid.',
      'Where the horizontal duct meets the chimney. Warming this foot first is how builders get the better of a cold flue.',
    ),
    description: lf(
      'Ici, le chemin tourne vers le haut, et la cheminée commence à tirer. Un manuel français décrit ce qui suit, quand tout est froid : un conduit plein d’air du dehors pèse vers le bas. Dans le scénario, à −5 °C et après des jours sans feu, l’air froid tombe dans la pièce à {coldFlow} g/s et le courant reste inversé, même avec un feu allumé : **le modèle ne le voit pas se retourner seul** (résultat du modèle). Un peu de chaleur au pied du conduit, {warmKw} kW pendant {warmMin} minutes (estimation), comme les constructeurs le décrivent, et il bascule en environ {turnMin} minutes, avec {coldRoomCo} ppm de CO au plus haut dans la pièce (résultat du modèle). **Ce moment est le chiffre le moins sûr du modèle.** Ce guide décrit ce qui se passe : ce n’est pas une méthode d’allumage.',
      'Here the path turns upwards, and the chimney starts to pull. A French manual describes what follows when all is cold: a flue full of outside air weighs downwards. In the scenario, at −5 °C and after days without fire, the cold air falls into the room at {coldFlow} g/s and the flow stays reversed, even with a fire lit: **the model does not see it turn by itself** (model result). A little heat at the flue’s foot, {warmKw} kW for {warmMin} minutes (estimate), as builders describe, and it swings over in about {turnMin} minutes, with {coldRoomCo} ppm of CO at the highest in the room (model result). **That moment is the model’s least sure figure.** This guide describes what happens: it is no lighting method.',
    ),
    material: l('Té d’acier, raccord au conduit isolé', 'A steel tee, joined to the insulated flue'),
    specs: [
      sp(
        'Perte, table usuelle',
        'Loss, a usual table',
        tf('estimate', '{kTee} hauteur de vitesse', '{kTee} velocity head'),
      ),
      sp(
        'Air froid qui tombe',
        'Cold air falling',
        tf('model', '{coldFlow} g/s, −5 °C dehors', '{coldFlow} g/s, −5 °C outside'),
      ),
      sp(
        'Temps pour basculer',
        'Time to swing over',
        tf('model', 'environ {turnMin} minutes, le moins sûr', 'about {turnMin} minutes, the least sure'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un té qui garde de l’eau, qui rouille par le bas, et une trappe de pied mal fermée qui lui vole son tirage. C’est le point bas du chemin, et il reçoit ce qui tombe.',
        check:
          'La purge et la trappe, à chaque ramonage. Un retour de fumée à froid n’a rien de rare, plusieurs constructeurs le rapportent, et rien d’anodin : cette fumée et son monoxyde entrent dans la pièce.',
        care: 'Le nettoyer avec le conduit. Après une longue absence en plein hiver, la machine repart autrement, et le détecteur reste en marche.',
      },
      {
        failure:
          'A tee that holds water, rusting from the bottom, and a foot door badly closed that steals its draught. This is the low point of the path, and it gets what falls.',
        check:
          'The drain and the door, at each sweep. A cold smoke-back is nothing rare, several builders report it, and nothing to shrug at: that smoke and its carbon monoxide enter the room.',
        care: 'Clean it with the flue. After a long absence in deep winter, the machine starts differently, and the alarm stays on.',
      },
    ),
    tip: l(
      'Lancez « Le feu refuse » : un chiffre de débit négatif, un feu allumé qui ne change rien, puis le basculement.',
      'Run “The fire refuses”: a negative flow, a lit fire that changes nothing, then the swing.',
    ),
    design: lf(
      'Le calcul à la main donnait −5,5 Pa pour un conduit froid (dérivé) : il comptait de l’air de pièce tout le long. Le modèle trouve −{coldFluePa} Pa, car au-dessus du toit le dehors est aussi froid que le conduit (résultat du modèle). Selon où s’équilibrent les fuites de la maison, ce chiffre peut descendre à −2,4 Pa : aucun n’a été mesuré.',
      'The hand sum gave −5.5 Pa for a cold flue (derived): it counted room air all the way. The model finds −{coldFluePa} Pa, since above the roof the outside is as cold as the flue (model result). Depending on where the house’s leaks balance, this figure can fall to −2.4 Pa: neither has been measured.',
    ),
  },
  {
    id: 'condensate-drain',
    scene: 'bench-section',
    category: 'mechanical',
    name: l('La purge', 'The drain'),
    short: lf(
      'Au point bas, quand le conduit est long : {longWater} kg d’eau par jour sur 18 m (résultat du modèle), rien sur nos 9 m, et une petite question acide.',
      'At the low point, when the duct is long: {longWater} kg of water a day on 18 m (model result), none on our 9 m, and a small acid question.',
    ),
    description: lf(
      'Un manuel français met en garde contre la condensation dans un conduit de plus de 6 m sur son poêle, et il y prévoit une évacuation. Sur notre machine de 9 m, à {lambda} fois l’air, le point de rosée est bas, environ {dewDefault} °C, et les fumées ne l’atteignent pas : **rien ne condense dans le modèle** (résultat du modèle). Sur 18 m, avec moins d’air, ce point remonte vers {longDew} °C et la sortie tombe à {longExhaust} °C : {longHours} heures par jour en dessous, et environ {longWater} kg d’eau. La vraie machine a aussi ses moments plus froids, comme un feu qui démarre ou une fin de feu, que le modèle ne compte qu’en partie. L’eau d’un conduit est acide et sale : elle a besoin d’aller quelque part, et elle ne doit pas s’accumuler au pied. Notre purge est dessinée au té, là où elle tomberait.',
      'A French manual warns of condensation in a duct over 6 m on its own stove, and provides a drain there. On our 9 m machine, at {lambda} times the air, the dew point is low, about {dewDefault} °C, and the gas does not reach it: **nothing condenses in the model** (model result). On 18 m, with less air, that point climbs to near {longDew} °C and the exit falls to {longExhaust} °C: {longHours} hours a day under it, and about {longWater} kg of water. The real machine also has colder moments, such as a fire starting or ending, which the model counts only in part. Water from a flue is acid and dirty: it has to go somewhere, and it must not gather at the foot. Our drain is drawn at the tee, where it would fall.',
    ),
    material: l('Petit tube et bac, résistant aux condensats', 'A small pipe and tray, resistant to condensate'),
    specs: [
      sp('Sur notre machine', 'On our machine', tf('model', 'rien ne condense', 'nothing condenses')),
      sp(
        'Sur 18 m',
        'On 18 m',
        tf('model', 'environ {longWater} kg d’eau par jour', 'about {longWater} kg of water a day'),
      ),
      sp('Un manuel français', 'A French manual', l('prudence au-delà de 6 m', 'care beyond 6 m')),
    ],
    maintenance: maint(
      {
        failure:
          'Une purge bouchée, sèche ou gelée, qui laisse l’eau remonter dans le té ; ou qui, sans siphon, devient une petite fuite d’air vers le conduit.',
        check:
          'Un regard au début de l’hiver, puis chaque fois qu’une trace brune apparaît au pied de la cheminée. Une purge qui coule tout l’hiver dit que la machine fonctionne plus froid qu’on ne le croit.',
        care: 'La rincer, vider le bac, et noter ce qu’il contient.',
      },
      {
        failure:
          'A drain blocked, dry or frozen, letting water back into the tee; or, without a trap, turning into a small air leak into the flue.',
        check:
          'A look at the start of winter, then each time a brown trace appears at the chimney’s foot. A drain that runs all winter says the machine works colder than believed.',
        care: 'Rinse it, empty the tray, and note what it holds.',
      },
    ),
    tip: l(
      'Le scénario « Un banc trop long » affiche l’eau condensée : c’est ce qu’il faudrait évacuer, ou plutôt ne pas produire.',
      'The “A bench too long” scenario shows the water condensed: what would have to be drained, or better, not made.',
    ),
    design: l(
      'Une purge qui reste sèche dit seulement que ce conduit condense peu : elle ne dit rien d’autre de la machine. Sa présence dans la 3D rappelle que l’objectif n’est pas de sortir le plus froid possible.',
      'A drain that stays dry says only that this duct condenses little: it says nothing else of the machine. Its presence in the 3D is a reminder that the aim is not to leave as cold as possible.',
    ),
  },
  {
    id: 'temperature-lance',
    scene: 'bench-section',
    category: 'electrical',
    name: l('La sonde', 'The probe'),
    short: l(
      'Ce que fait un constructeur qui relève son banc, et ce qui manque le plus à ce sujet : des chiffres. Dans notre coupe, c’est aussi notre œil.',
      'What a builder logging his bench does, and what this subject lacks most: figures. In our section it is also our eye.',
    ),
    description: lf(
      'Sur un banc de béton d’une dizaine de mètres, à conduit de 8 pouces, un constructeur a placé 15 capteurs, avant d’avoir fini la masse, et sans jamais publier d’hiver complet. Aucune source ne donne une journée complète relevée dans une maison habitée : c’est un des manques de ce sujet. Notre sonde dessinée montre où une telle lecture se ferait, et son aiguille, sans chiffre sur le cadran, suit la terre du modèle : au-dessus du conduit, {earthDuct} °C au plus chaud, et l’assise à {seatHigh} °C (résultat du modèle). Pour en faire une vraie mesure, il faudrait aussi noter l’emplacement exact, le capteur et le bois de la journée : le seul relevé de banc que nous ayons trouvé ne dit ni où ni avec quoi. Un seul conseil : mesurez, écrivez, publiez.',
      'On a concrete bench of about ten metres with an 8-inch duct, one builder placed 15 sensors, before finishing the mass, and never published a whole winter. No source gives a full day logged in a lived-in house: one of the gaps in this subject. Our drawn probe shows where such a reading would be made, and its needle, with no figure on the dial, follows the model’s earth: above the duct, {earthDuct} °C at its hottest, and the seat at {seatHigh} °C (model result). To make it a real measurement one would also have to note the exact place, the sensor and the day’s wood: the only bench reading we found says neither where nor with what. One piece of advice: measure, write down, publish.',
    ),
    material: l(
      'Thermocouples ou sondes en gaine (dessin générique)',
      'Sheathed thermocouples or probes (a generic drawing)',
    ),
    specs: [
      sp('Un banc logué', 'A logged bench', l('15 capteurs', '15 sensors')),
      sp(
        'Terre au-dessus du conduit',
        'Earth above the duct',
        tf('model', 'jusqu’à {earthDuct} °C', 'up to {earthDuct} °C'),
      ),
      sp('Journée relevée, maison habitée', 'A logged day, lived-in house', l('aucune trouvée', 'none found')),
    ],
    maintenance: maint(
      {
        failure:
          'Une sonde qui lâche une fois noyée dans la terre, un câble qui passe par un endroit trop chaud, et un carnet qui s’arrête en mars.',
        check: 'La comparer aux autres de temps en temps, au repos, quand tout devrait se ressembler.',
        care: 'Prévoir un capteur de plus qu’il n’en faut, et noter où chacun se trouve, car personne ne s’en souviendra dans dix ans.',
      },
      {
        failure:
          'A probe failing once buried in the earth, a cable routed through too hot a place, and a notebook that stops in March.',
        check: 'Compare it with the others now and then, at rest, when all should read alike.',
        care: 'Allow one more sensor than needed, and note where each one is, since nobody will remember in ten years.',
      },
    ),
    tip: l(
      'Le graphique « Du conduit à l’assise » de la Simulation fait ce que ferait une série de sondes dans cette coupe.',
      'The “From the duct to the seat” chart in the Simulation does what a row of probes would do in this section.',
    ),
    design: l(
      'Si le constructeur d’un tel banc notait une seule année, avec ses kilos de bois, ce labo aurait quelque chose à quoi se comparer. Rien n’empêche de le faire : c’est le seul appel de ce catalogue à faire quelque chose.',
      'If the builder of such a bench noted one single year, with its kilos of wood, this lab would have something to compare itself against. Nothing stops anyone doing so: the one call to action in this catalogue.',
    ),
  },
  {
    id: 'pebble-section',
    scene: 'bench-section',
    category: 'structure',
    name: l('Le banc de galets', 'The pebble bench'),
    short: l(
      'La moitié des douze réalisations du film sont en galets. Nous n’en avons trouvé aucun chiffre publié : ici, c’est un point de départ, sans prétention.',
      'Half of the film’s twelve builds are pebble. We found no published figure on them: here it is a starting point, with no claim.',
    ),
    description: lf(
      'Sur douze réalisations dans la vidéo qui les passe en revue, toutes sont des tubes en J, six en terre et six en galets ; on voit aussi, ailleurs, un banc de gravier sous trois bidons. C’est donc une école à part entière. Mais **aucune source n’en chiffre rien**. Le préréglage de la simulation prend une conductivité de {pebbleK} W/m·K, {pebbleRho} kg/m³ et {pebbleC} J/kg·K (estimation) : il donne une assise à {pebbleSeat} °C et {pebbleEta} % (résultat du modèle). Ne lisez pas là que les galets valent mieux : c’est le chiffre de notre conductivité, pas une observation. Un banc de galets se monte sans mélanger ni attendre le séchage de la terre (notre lecture) ; et il pose autrement la question de l’étanchéité du conduit, puisque rien n’étanche autour de lui.',
      'Of twelve builds in the video that reviews them, all are J-tubes, six cob and six pebble; elsewhere there is also a gravel bench under three drums. So it is a school in its own right. But **no source puts a figure on any of it**. The simulation’s starting point takes a conductivity of {pebbleK} W/m·K, {pebbleRho} kg/m³ and {pebbleC} J/kg·K (estimate): it gives a seat at {pebbleSeat} °C and {pebbleEta}% (model result). Do not read here that pebbles are better: it is the figure of our conductivity, not an observation. A pebble bench goes up with no mixing and no waiting for earth to dry (our reading); and it puts the question of the duct’s seal differently, since nothing seals around it.',
    ),
    material: l(
      'Galets, souvent dans un coffrage de bois ou de pierre',
      'Pebbles, often within a wooden or stone form',
    ),
    specs: [
      sp('Sur les douze réalisations', 'Of the twelve builds', l('6 en galets, 6 en terre', '6 pebble, 6 cob')),
      sp('Mesures publiées trouvées', 'Published measurements found', l('aucune', 'none')),
      sp('Conductivité, préréglage', 'Conductivity, the starting point', tf('estimate', '{pebbleK} W/m·K')),
      sp('Assise, préréglage', 'Seat, the starting point', tf('model', '{pebbleSeat} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite de conduit qui ne rencontre plus aucune terre pour la freiner. Des galets mal triés peuvent garder de l’humidité, et un coffrage de bois au contact doit être regardé de près.',
        check:
          'Comme pour un conduit nu : avant de remplir, à découvert. Et pouvoir vider une partie du banc pour le revoir.',
        care: 'C’est son avantage : on peut le rouvrir, le vider et revoir le conduit, sans casser de terre.',
      },
      {
        failure:
          'A duct leak with no earth left to hold it back. Poorly sorted pebbles can keep damp, and a wooden form in contact has to be looked at closely.',
        check:
          'As for a bare duct: before filling, uncovered. And being able to empty part of the bench to look at it again.',
        care: 'That is its merit: it can be reopened, emptied and the duct looked at, with no earth to break.',
      },
    ),
    tip: l(
      'Essayez le préréglage « Le même, banc de galets », puis regardez ce qu’il change. Rappelez-vous que ce sont nos estimations.',
      'Try the starting point “The same, a pebble bench”, then see what it changes. Remember that these are our estimates.',
    ),
    design: l(
      'Nous la montrons pour ne pas laisser croire que la terre est la seule voie. Il aurait été facile d’inventer des chiffres, et nous préférons laisser cette case vide.',
      'We show it so as not to suggest that earth is the only way. It would have been easy to invent figures, and we prefer to leave this box empty.',
    ),
  },
];
