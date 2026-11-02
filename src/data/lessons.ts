// The six lessons (docs/research.md §0.6), each opening on a scenario of the simulation and naming a second or third, so that they go through all twelve; two quiz questions each. The heart is lessons 4 and 5: the bench charges and gives back, and it is
// the house that decides. What the model finds is used in place of the research's text (docs/physics.md): the chimney draws, the drum gives twice the bench's heat, the seat peaks one to two hours after the flame, « 80 to 90 % less wood » does not balance
// from the stove alone. Lesson 6 gives the damper's numbers, with no story, and the law is left to the Sources panel.
import type { Lesson } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, sp, tf } from './part-helpers';

export const LESSONS: Lesson[] = [
  {
    id: 'the-fire-goes-sideways',
    title: l('Le feu qui va de côté', 'The fire that goes sideways'),
    summary: l(
      'Qui fait tirer cette machine ? Pas la cheminée interne : le conduit vertical, quand il est chaud. Et un conduit froid peut retourner le feu.',
      'What makes this machine draw? Not the riser: the chimney, when warm. And a cold flue can turn the fire round.',
    ),
    body: [
      lf(
        'Une colonne d’air chaud pèse moins que l’air froid à côté d’elle : c’est tout le moteur. On crédite volontiers la cheminée interne, si impressionnante. Le calcul dit autre chose : à plein feu, elle donne {riserPa} Pa, la chute dans le bidon en reprend {fallPa}, et il reste **{netPa} Pa à eux deux, contre {chimneyPa} Pa pour le conduit vertical** (résultat du modèle). La main trouvait déjà 7,2, −5,9 et 14,4 Pa (dérivé). C’est le conduit qui couche la flamme. Environ {feedPaShare} % de ce tirage se dépensent à l’entrée, dans le passage laissé au feu.',
        'A column of hot air weighs less than the cold air beside it: that is the whole engine. The riser, so impressive, tends to get the credit. The sum says otherwise: at full fire it gives {riserPa} Pa, the fall in the drum takes back {fallPa}, leaving **{netPa} Pa between them, against {chimneyPa} Pa for the chimney** (model result). By hand one already finds 7.2, −5.9 and 14.4 Pa (derived). The chimney is what lays the flame down. About {feedPaShare}% of that draught is spent at the entry, in the way left to the fire.',
      ),
      lf(
        'Le scénario **« Le feu refuse »** montre l’autre face. Des jours sans feu, −5 °C dehors : le conduit est plein d’air froid, il pèse, et cet air tombe dans la pièce, à {coldFlow} g/s. Le modèle lit −{coldFluePa} Pa (résultat du modèle) ; la main donnait −5,5 Pa (dérivé), en supposant de l’air de pièce tout du long, or au-dessus du toit le dehors est aussi froid que le conduit. Un feu allumé ne suffit pas : **le modèle ne le voit pas se retourner seul**. Un peu de chaleur au pied du conduit, et il bascule en environ {turnMin} minutes, ce que décrivent les constructeurs. Ce moment est le chiffre le moins sûr du modèle, et ce récit n’est pas une méthode.',
        'The **“The fire refuses”** scenario shows the other side. Days without fire, −5 °C outside: the flue is full of cold air, it weighs, and that air falls into the room at {coldFlow} g/s. The model reads −{coldFluePa} Pa (model result); by hand it was −5.5 Pa (derived), assuming room air all the way, whereas above the roof the outside is as cold as the flue. A lit fire is not enough: **the model does not see it turn by itself**. A little heat at the flue’s foot, and it swings over in about {turnMin} minutes, as builders describe. That moment is the model’s least sure figure, and this account is no method.',
      ),
      lf(
        '**« Une cheminée trop basse »** surprend : à {chimneyLow} m (estimation), le tirage tombe à {lowDraft} Pa, l’air à {lowLambda} fois le besoin, et le rendement monte à {lowEta} % (résultat du modèle). C’est de la marge qu’on perd : sous le couvercle du bidon, la pression passe de −{lidPa} à −{lidPaLow} Pa. Un joint défaillant n’a plus grand-chose qui le retienne. **« Un passage trop étroit »** déçoit : à 1,5 cm, le modèle bouge à peine d’un point. Le seul article revu par des pairs, lu en résumé, y voit une menace : soit notre modèle ignore ce qu’un passage étroit fait à une flamme, soit ce cas brûle plus fort. Ni l’un ni l’autre n’autorise à réduire quoi que ce soit.',
        '**“A chimney too low”** surprises: at {chimneyLow} m (estimate) the draught falls to {lowDraft} Pa, the air to {lowLambda} times the need, and the efficiency rises to {lowEta}% (model result). What goes is margin: under the drum’s lid the pressure moves from −{lidPa} to −{lidPaLow} Pa. A failing seal has little left to hold it. **“Too narrow a gap”** disappoints: at 1.5 cm the model hardly moves by a point. The one peer-reviewed paper, read in summary, sees a threat there: either our model does not know what a narrow gap does to a flame, or that case burns harder. Neither licenses reducing anything.',
      ),
    ],
    figures: [
      sp('Le conduit vertical', 'The chimney', tf('model', '{chimneyPa} Pa')),
      sp('Cheminée interne et bidon', 'Riser and drum', tf('model', '{netPa} Pa')),
      sp('Conduit froid', 'Cold flue', tf('model', '−{coldFluePa} Pa', '−{coldFluePa} Pa')),
      sp(
        'Sous le couvercle, cheminée basse',
        'Under the lid, low chimney',
        tf('model', '−{lidPaLow} Pa', '−{lidPaLow} Pa'),
      ),
    ],
    formula: 'ΔP = g · H · (ρ_air − ρ_gaz)',
    focus: { scene: 'fire-core', part: 'burn-tunnel', scenario: 'cold-start' },
    quiz: [
      {
        q: l(
          'À plein feu, qu’est-ce qui donne l’essentiel du tirage ?',
          'At full fire, what gives most of the draught?',
        ),
        choices: [
          lf(
            'La cheminée interne et la chute dans le bidon, {netPa} Pa (résultat du modèle)',
            'The riser and the fall in the drum, {netPa} Pa (model result)',
          ),
          lf('Le conduit vertical, {chimneyPa} Pa (résultat du modèle)', 'The chimney, {chimneyPa} Pa (model result)'),
          l('Le feu lui-même, qui pousse les gaz', 'The fire itself, pushing the gases'),
        ],
        answer: 1,
        explain: lf(
          'La cheminée interne monte de {riserPa} Pa et la chute en reprend {fallPa} : il reste {netPa} Pa (résultat du modèle). C’est le conduit vertical, tant qu’il reste chaud, qui tire la machine.',
          'The riser rises by {riserPa} Pa and the fall takes back {fallPa}: {netPa} Pa is left (model result). The chimney, as long as it stays warm, is what pulls the machine.',
        ),
      },
      {
        q: l(
          'Une cheminée basse fait monter le rendement du modèle. Que perd-on ?',
          'A low chimney raises the model’s efficiency. What is lost?',
        ),
        choices: [
          l('Rien : c’est un meilleur réglage', 'Nothing: it is a better setting'),
          l('Beaucoup de bois', 'A lot of wood'),
          lf(
            'De la marge : −{lidPaLow} Pa sous le couvercle du bidon, au lieu de −{lidPa} Pa (résultat du modèle)',
            'Margin: −{lidPaLow} Pa under the drum’s lid, instead of −{lidPa} Pa (model result)',
          ),
        ],
        answer: 2,
        explain: l(
          'Moins de tirage, moins d’air inutile, donc un meilleur chiffre ; mais presque rien ne retient plus une fuite au joint du couvercle. Un bon rendement peut cacher un poêle plus fragile.',
          'Less draught, less useless air, so a better figure; but next to nothing now holds back a leak at the lid’s seal. Good efficiency can hide a more fragile heater.',
        ),
      },
    ],
  },
  {
    id: 'smoke-is-fuel',
    title: l('La fumée est du combustible', 'Smoke is fuel'),
    summary: l(
      'De la chaleur, de l’air, du temps, et du bois sec : pourquoi cette fumée finit de brûler, et ce que veut dire un chiffre de monoxyde.',
      'Heat, air, time and dry wood: why this smoke finishes burning, and what a carbon monoxide figure means.',
    ),
    body: [
      lf(
        'La fumée qui sort d’un poêle au ralenti n’est pas un déchet : c’est du combustible qui n’a pas brûlé. Il lui fallait de la chaleur, de l’air et du temps, et c’est ce que lui donne la cheminée interne isolée. Un manuel français donne un écart de dix fois entre un feu lent et un feu nominal du même poêle, en ordre de grandeur ; une université finlandaise a mesuré un feu qui couve contre un feu normal : monoxyde × 3,5, organiques × 14, particules fines × 6. L’air compte dans les deux sens : grand ouvert, le modèle garde une chambre à peine chaude et {etaOpen} % (résultat du modèle) ; et sous 1,4 fois l’air, le monoxyde grimpe.',
        'The smoke leaving a slow stove is no waste product: it is fuel that has not burnt. It needed heat, air and time, and that is what the insulated riser gives it. A French manual gives a tenfold gap between a slow and a nominal fire of the same stove, as an order of magnitude; a Finnish university measured a smouldering fire against a normal one: carbon monoxide × 3.5, organics × 14, fine particles × 6. Air counts both ways: wide open, the model keeps a barely hot chamber and {etaOpen}% (model result); and below 1.4 times the air, carbon monoxide climbs.',
      ),
      lf(
        'Lancez **« Du bois humide »** : 30 % d’humidité au lieu de {moisture} % (hypothèse). À 30 %, un kilo ne donne que 3,39 kWh au lieu de 4,16. La chambre tombe à {wetChamber} °C au lieu de {chamber} °C, la pièce à {wetRoom} °C, le rendement à {wetEta} %, et le monoxyde est environ trois fois plus haut (résultat du modèle). Rien à l’écran ne fume davantage : un constructeur qui a analysé ses gaz sur un vrai tube en J le dit à sa façon. À l’œil, rien n’indiquait que la combustion devenait moins propre, et ce sont les chiffres qui bougeaient : quelques dizaines de ppm sur du pin fendu, moins de 100 sur un autre bois, et davantage sur du chêne humide.',
        'Run **“Wet wood”**: 30 % moisture in place of {moisture}% (assumption). At 30 %, a kilo gives only 3.39 kWh in place of 4.16. The chamber falls to {wetChamber} °C from {chamber} °C, the room to {wetRoom} °C, the efficiency to {wetEta}%, and carbon monoxide is about three times higher (model result). Nothing on screen smokes any more: a builder who analysed the gas from a real J-tube says as much in his way. To the eye nothing showed the burn was less clean, and it was the figures that moved: some tens of ppm on split pine, under 100 on another wood, and more on damp oak.',
      ),
      lf(
        'Que vaut un chiffre de monoxyde ici ? **Une carte, pas une mesure.** Le modèle donne un régime d’abord, puis une bande de un à neuf : {coHot} ppm à un feu vif, {coLean} ppm à notre feu ({coLeanLow} à {coLeanHigh} ppm), {coWet} ppm sur du bois humide, {coEnd} ppm quand la charge s’achève (résultat du modèle). Il retient donc l’ordre : le feu qui s’éteint est le pire moment. Sur un foyer fermé bien réglé, un concepteur mesure 312 ppm en moyenne ; un poêle de masse au laboratoire, 240 mg/MJ, et notre carte {coPerMj} mg/MJ sur un jour. Six fois plus, sans chercher à flatter : un tube ouvert n’est pas un laboratoire, et ce n’est pas une prédiction.',
        'What is a carbon monoxide figure worth here? **A map, not a measurement.** The model gives a regime first, then a band of one to nine: {coHot} ppm in a lively fire, {coLean} ppm in our fire ({coLeanLow} to {coLeanHigh} ppm), {coWet} ppm on wet wood, {coEnd} ppm as the load ends (model result). So it keeps the order: the fire going out is the worst moment. On a well-set closed box, one designer measures a mean of 312 ppm; a masonry heater in a laboratory, 240 mg/MJ, and our map {coPerMj} mg/MJ over a day. Six times more, with no wish to flatter: an open feed is no laboratory, and this is no prediction.',
      ),
    ],
    figures: [
      sp('Bois à 30 %', 'Wood at 30 %', l('3,39 kWh/kg', '3.39 kWh/kg')),
      sp('Chambre, bois à 30 %', 'Chamber, wood at 30 %', tf('model', '{wetChamber} °C')),
      sp(
        'Notre feu, dans les fumées',
        'Our fire, in the gas',
        tf('model', '{coLeanLow} à {coLeanHigh} ppm', '{coLeanLow} to {coLeanHigh} ppm'),
      ),
      sp('Couvant, mesuré', 'Smouldering, measured', l('CO × 3,5', 'CO × 3.5')),
    ],
    formula: 'λ = 21 / (21 − O₂)',
    focus: { scene: 'fire-core', part: 'heat-riser', scenario: 'wet-wood' },
    quiz: [
      {
        q: l(
          'Selon le modèle, à quel moment le feu fait-il le plus de monoxyde ?',
          'In the model, when does the fire make the most carbon monoxide?',
        ),
        choices: [
          l('À plein feu, quand la flamme est la plus longue', 'At full fire, when the flame is longest'),
          l(
            'Dès le début, et pendant toute la séance, de la même façon',
            'From the start, and evenly throughout the session',
          ),
          lf(
            'Quand la charge s’achève, vers {coEnd} ppm, puis sur les braises (résultat du modèle)',
            'As the load ends, near {coEnd} ppm, then on the embers (model result)',
          ),
        ],
        answer: 2,
        explain: l(
          'Il n’y a plus de flamme, et la chambre refroidit : le charbon laisse partir une plus grande part de son carbone sous forme de monoxyde. Un constructeur mesure aussi une remontée après les deux tiers d’une charge. C’est un ordre, pas une valeur.',
          'There is no flame left, and the chamber cools: char lets a larger share of its carbon go as carbon monoxide. One builder also measures a climb after two-thirds of a load. It is an order, not a value.',
        ),
      },
      {
        q: l(
          'Sur le chêne humide, un feu de tube en J paraissait aussi propre à l’œil. Que faut-il en conclure ?',
          'On damp oak, a J-tube fire looked just as clean to the eye. What should be concluded?',
        ),
        choices: [
          l(
            'L’œil ne juge pas le monoxyde : seul un appareil le lit',
            'The eye cannot judge carbon monoxide: only an instrument reads it',
          ),
          l('Que le bois humide ne change rien', 'That wet wood changes nothing'),
          l('Qu’un détecteur n’est pas nécessaire', 'That an alarm is not needed'),
        ],
        answer: 0,
        explain: l(
          'Le monoxyde n’a ni couleur ni odeur, et une flamme jolie n’en dit rien. C’est ce qu’ont montré ces lectures d’analyseur sur une vraie machine, bien davantage que tout discours.',
          'Carbon monoxide has neither colour nor smell, and a pretty flame says nothing of it. That is what these analyser readings on a real machine showed, more than any talk.',
        ),
      },
    ],
  },
  {
    id: 'where-the-heat-goes',
    title: l('Où va la chaleur', 'Where the heat goes'),
    summary: lf(
      'Le bidon d’abord, le banc ensuite, la cheminée à perte. Un partage qu’aucune source ne donne, et un rendement de {eta} % (résultat du modèle), sans essai indépendant trouvé.',
      'The drum first, the bench next, the chimney at a loss. A split no source gives, and an efficiency of {eta}% (model result), with no independent test found.',
    ),
    body: [
      lf(
        'Le bois d’un jour, tel que les gaz le cèdent : **bidon {shareDrum} %, banc {shareBench} %, foyer et sol {shareCore} %, conduit dans la maison {shareFlueIn} %, parti dehors {shareLost} %, non brûlé {shareUnburned} %** (résultat du modèle, arrondis ; leur somme fait 101). Aucune source ne donne ce partage. Selon les réglages, le bidon va de {drumRangeLow} à {drumRangeHigh} %, le banc de {benchRangeLow} à {benchRangeHigh} %, la perte de {lostRangeLow} à {lostRangeHigh} % : la part du bidon croît quand il y a moins d’air, et celle du banc bouge à peine, jusqu’à ce que le conduit soit court.',
        'A day’s wood, as the gases give it up: **drum {shareDrum}%, bench {shareBench}%, core and floor {shareCore}%, flue indoors {shareFlueIn}%, gone outside {shareLost}%, unburned {shareUnburned}%** (model result, rounded; they add to 101). No source gives this split. With the settings the drum runs from {drumRangeLow} to {drumRangeHigh}%, the bench {benchRangeLow} to {benchRangeHigh}%, the loss {lostRangeLow} to {lostRangeHigh}%: the drum’s share grows with less air, and the bench’s hardly moves, until the duct is short.',
      ),
      lf(
        '**Le rendement atterrit à {eta} % rendus à la maison, et {etaFlue} % par un calcul de fumées**, le même jour (résultat du modèle), dans une plage plausible de {etaLow} à {etaHigh} %. Un calcul de fumées ne voit pas le conduit dehors, le mur derrière le banc ni le sol. Nous n’avons trouvé aucun essai indépendant d’un tube en J en terre : les chiffres publiés au-dessus de 80 % sont tous des calculs de fumées. Un essai tiers sur un appareil à granulés donne 68,5 à 79,7 %, un poêle de masse de 1992, 61,8 %. **L’ouverture du tube décide de l’essentiel, et aucune source ne la donne** : cachée à {feedCover} % (estimation), elle donne {eta} %, grande ouverte {etaOpen} %, cachée à {coverHigh} % {etaHigh} %.',
        '**Efficiency lands at {eta}% delivered to the house, and {etaFlue}% by a flue calculation**, on the same day (model result), in a plausible range of {etaLow} to {etaHigh}%. A flue calculation does not see the flue outdoors, the wall behind the bench or the ground. We found no independent test of a cob J-tube: the published figures above 80 % are all flue calculations. A third-party test of a pellet-fed unit gives 68.5 to 79.7 %, a masonry heater of 1992, 61.8 %. **The feed’s opening decides most of it, and no source gives it**: hidden at {feedCover}% (estimate) it gives {eta}%, wide open {etaOpen}%, hidden at {coverHigh}% {etaHigh}%.',
      ),
      lf(
        'Le conduit règle le reste. **« Un banc trop court »**, 4,5 m : la sortie monte à {shortExhaust} °C, le rendement tombe à {shortEta} % (résultat du modèle), et le bois chauffe le ciel ; un vrai poêle au banc trop petit, relevé par son constructeur, a fait de même. **« Un banc trop long »**, 18 m : {longEta} % et une sortie à {longExhaust} °C, mais le tirage tombe à {longDraft} Pa, et environ {longWater} kg d’eau se condensent dans le conduit, sur environ {longHours} h par jour. Toutes les sorties lues par les constructeurs, de 32 à plus de 232 °C, peuvent donc être vraies : c’est la longueur, la masse et le moment qui décident.',
        'The duct sets the rest. **“A bench too short”**, 4.5 m: the exit climbs to {shortExhaust} °C, the efficiency falls to {shortEta}% (model result), and the wood heats the sky; a real heater with too small a bench, logged by its builder, did the same. **“A bench too long”**, 18 m: {longEta}% and an exit at {longExhaust} °C, but the draught falls to {longDraft} Pa, and some {longWater} kg of water condense in the flue, over about {longHours} h a day. So all the exits builders read, from 32 to over 232 °C, can be true: length, mass and the moment decide.',
      ),
    ],
    figures: [
      sp(
        'Rendu à la maison',
        'Delivered to the house',
        tf('model', '{eta} %, de {etaLow} à {etaHigh} %', '{eta}%, {etaLow} to {etaHigh}%'),
      ),
      sp('Par un calcul de fumées', 'By a flue calculation', tf('model', '{etaFlue} %', '{etaFlue}%')),
      sp('Bidon, banc', 'Drum, bench', tf('model', '{shareDrum} %, {shareBench} %', '{shareDrum}%, {shareBench}%')),
      sp(
        'Part cachée du tube',
        'Feed’s hidden share',
        tf('estimate', '{feedCover} %, sans source', '{feedCover}%, unsourced'),
      ),
    ],
    formula: 'η = 1 − (Q_sortie + Q_non brûlé + Q_pertes) / Q_bois',
    focus: { scene: 'living-room', part: 'steel-drum', scenario: 'short-bench' },
    quiz: [
      {
        q: l(
          'Un analyseur de fumées annonce 93 %. Qu’est-ce que cela veut dire ?',
          'A flue analyser announces 93 %. What does that mean?',
        ),
        choices: [
          l('La maison garde 93 % du bois : c’est mesuré', 'The house keeps 93 % of the wood: it is measured'),
          l(
            'Un calcul depuis la sortie, qui ne voit ni le mur, ni le sol, ni le conduit dehors',
            'A calculation from the exit, which sees neither wall, nor ground, nor the flue outdoors',
          ),
          l('Un rendement que le modèle retrouve à plein régime', 'An efficiency the model retrieves at full rate'),
        ],
        answer: 1,
        explain: lf(
          'Le même jour, le modèle donne {eta} % rendus et {etaFlue} % par un calcul de fumées (résultat du modèle). Les chiffres publiés au-dessus de 80 % que nous avons trouvés sont de ce type-là.',
          'On the same day the model gives {eta}% delivered and {etaFlue}% by a flue calculation (model result). The published figures above 80 % that we found are of that kind.',
        ),
      },
      {
        q: l(
          'Quelle entrée décide le plus du rendement de cette machine, selon le modèle ?',
          'Which input decides this machine’s efficiency the most, according to the model?',
        ),
        choices: [
          l('La hauteur de la cheminée interne', 'The height of the riser'),
          l('L’isolant de la cheminée interne', 'The riser’s insulation'),
          lf(
            'L’ouverture du tube : de {etaOpen} à {etaHigh} % (résultat du modèle), et aucune source ne la chiffre',
            'The opening of the feed: {etaOpen} to {etaHigh}% (model result), with no source giving a figure',
          ),
        ],
        answer: 2,
        explain: l(
          'Ce qui n’est pas brûlé par le feu remonte tiède par la cheminée : l’air en excès emporte la chaleur. Une seule lecture d’oxygène sur un tube en J stable réduirait cette incertitude plus que tout le reste.',
          'What the fire does not use goes up the chimney warm: excess air carries the heat away. A single oxygen reading on a steady J-tube would narrow this uncertainty more than anything else.',
        ),
      },
    ],
  },
  {
    id: 'charge-and-give-back',
    title: l('Charger, puis rendre', 'Charge and give back'),
    summary: l(
      'Ce qu’on sent en s’asseyant une à deux heures après la flamme : la chaleur qui traverse la terre. Et ce que la banquette ne fait pas.',
      'What you feel on sitting down one to two hours after the flame: heat crossing the earth. And what the bench does not do.',
    ),
    body: [
      lf(
        'Lancez **« Deux feux, un jour d’hiver »** et faites glisser l’heure. Un **feu** ici est une séance menée de {sessionHours} h à {feedRate} kg/h, matin et soir (hypothèse), pas une brassée et un départ : une constructrice parle de 2 à 4 h, à une ou deux charges par heure. Le feu s’arrête, la flamme meurt, et **l’assise continue de monter** : elle culmine **une à deux heures après la flamme**, {lagStop} h au bout épais, {lagStopCold} h au bout mince, soit {lagBegin} h après l’allumage (résultat du modèle). C’est la chaleur qui finit de traverser la terre : juste avant, au-dessus du conduit, la terre a atteint {earthDuct} °C.',
        'Run **“Two fires, a winter day”** and drag the hour. A **fire** here is a tended session of {sessionHours} h at {feedRate} kg/h, morning and evening (assumption), not an armful and away: one builder speaks of 2 to 4 h, at one or two loads an hour. The fire stops, the flame dies, and **the seat goes on rising**: it peaks **one to two hours after the flame**, {lagStop} h at the thick end, {lagStopCold} h at the thin end, or {lagBegin} h after lighting (model result). That is heat finishing its crossing of the earth: just before, above the duct, the earth has reached {earthDuct} °C.',
      ),
      lf(
        'L’assise va de {seatLow} à {seatHigh} °C au bout chaud (résultat du modèle). Pourquoi pas plus tard ? Une impulsion courte, à travers cette épaisseur de terre, arriverait bien après. Mais un feu de {sessionHours} h (hypothèse) n’est pas une impulsion, et les gaz refroidissent encore le côté du conduit après le feu. Sept heures après le feu du soir, l’assise est à {seatAfter7} °C au bout chaud, {seatColdAfter7} °C au bout froid, et la pièce à {roomAfter7} °C. Un constructeur a relevé 32 à 38 °C douze heures après, dans une serre, sans dire où ni avec quoi : ces chiffres ne sont pas retrouvés ici, et il faut le savoir.',
        'The seat runs from {seatLow} to {seatHigh} °C at the hot end (model result). Why no later? A short pulse through this thickness of earth would arrive well after. But a fire of {sessionHours} h (assumption) is no pulse, and the gases go on cooling the duct’s side after the fire. Seven hours after the evening fire the seat is at {seatAfter7} °C at the hot end, {seatColdAfter7} °C at the cold, and the room at {roomAfter7} °C. One builder read 32 to 38 °C twelve hours after, in a greenhouse, without saying where or with what: these figures are not retrieved here, and that should be known.',
      ),
      lf(
        '**Dans ce modèle, la banquette ne porte pas la maison.** Le bidon rend environ {kwhDrum} kWh par jour, par grands coups de près de {drumBurst} kW ; le banc environ {kwhBench} kWh, à raison de {benchKwLow} à {benchKwHigh} kW jour et nuit (résultat du modèle). **Le bidon donne deux fois plus de chaleur que le banc.** Le banc lisse, il tient quand le bidon est froid, et il ajoute cette chaleur qu’on touche. La pièce va de {roomLow} à {roomHigh} °C : un seul récit réel parle de 1 à 2 °C perdus la nuit, dans une yourte. Avec **« Un seul feu, un jour doux »**, à {mildDay} °C dehors (hypothèse), {mildWood} kg tiennent la pièce entre {mildRoomLow} et {mildRoomHigh} °C (résultat du modèle) : tout dépend de l’écart avec le dehors.',
        '**In this model the bench does not carry the house.** The drum gives about {kwhDrum} kWh a day, in great bursts of nearly {drumBurst} kW; the bench about {kwhBench} kWh, at {benchKwLow} to {benchKwHigh} kW day and night (model result). **The drum gives twice the bench’s heat.** The bench smooths, it holds while the drum is cold, and it adds the heat you touch. The room runs from {roomLow} to {roomHigh} °C: the one real account speaks of 1 to 2 °C lost overnight, in a yurt. With **“One fire, a mild day”**, at {mildDay} °C outside (assumption), {mildWood} kg hold the room between {mildRoomLow} and {mildRoomHigh} °C (model result): it all rests on the gap with outside.',
      ),
    ],
    figures: [
      sp('Assise, bout chaud', 'Seat, hot end', tf('model', '{seatLow} à {seatHigh} °C', '{seatLow} to {seatHigh} °C')),
      sp(
        'Pic après la flamme',
        'Peak after the flame',
        tf('model', '{lagStopCold} à {lagStop} h', '{lagStopCold} to {lagStop} h'),
      ),
      sp('Le bidon rend', 'The drum gives', tf('model', '{kwhDrum} kWh par jour', '{kwhDrum} kWh a day')),
      sp('Le banc rend', 'The bench gives', tf('model', '{kwhBench} kWh par jour', '{kwhBench} kWh a day')),
      sp('La pièce', 'The room', tf('model', '{roomLow} à {roomHigh} °C', '{roomLow} to {roomHigh} °C')),
    ],
    formula: 'E = m · c · ΔT',
    focus: { scene: 'bench-section', part: 'cob-casing', scenario: 'winter-two-fires' },
    quiz: [
      {
        q: l(
          'Quand l’assise est-elle la plus chaude, dans le modèle ?',
          'When is the seat at its warmest, in the model?',
        ),
        choices: [
          l('Pendant le feu, comme le bidon', 'During the fire, like the drum'),
          l('Une à deux heures après la flamme', 'One to two hours after the flame'),
          l('Au petit matin, juste avant le feu suivant', 'Early in the morning, just before the next fire'),
        ],
        answer: 1,
        explain: lf(
          'Elle culmine {lagStop} h après l’arrêt du bois au bout chaud, {lagBegin} h après l’allumage (résultat du modèle). Le feu de {sessionHours} h (hypothèse) n’est pas une impulsion : la terre rend aussi une part de sa chaleur vers le conduit.',
          'It peaks {lagStop} h after the wood stops at the hot end, {lagBegin} h after lighting (model result). The fire of {sessionHours} h (assumption) is no pulse: the earth also gives part of its heat back to the duct.',
        ),
      },
      {
        q: l(
          'Qui rend le plus de chaleur à la pièce sur un jour, dans le modèle ?',
          'What gives the room the most heat over a day, in the model?',
        ),
        choices: [
          lf(
            'Le banc : {kwhBench} kWh, contre {kwhDrum} kWh pour le bidon (résultat du modèle)',
            'The bench: {kwhBench} kWh, against {kwhDrum} kWh for the drum (model result)',
          ),
          lf(
            'Le bidon : {kwhDrum} kWh, contre {kwhBench} kWh pour le banc (résultat du modèle)',
            'The drum: {kwhDrum} kWh, against {kwhBench} kWh for the bench (model result)',
          ),
          l('Les deux à égalité', 'The two equally'),
        ],
        answer: 1,
        explain: l(
          'Le bidon rend deux fois plus, et par grands coups. Le banc rend moins mais tout le temps, et c’est ce qui fait qu’on peut parler de deux feux. Le récit populaire, qui lui donne le premier rôle, ne se retrouve pas dans ce modèle.',
          'The drum gives twice as much, in great bursts. The bench gives less but all the time, and that is why anyone can speak of two fires. The popular account, which gives it the lead, is not found in this model.',
        ),
      },
    ],
  },
  {
    id: 'two-fires-which-house',
    title: l('Deux feux, pour quelle maison ?', 'Two fires, for which house?'),
    summary: l(
      'La réponse honnête est l’isolation. Et « 80 à 90 % de bois en moins » ne boucle pas avec le poêle seul : les chiffres, sans détour.',
      'The honest answer is insulation. And “80 to 90 % less wood” does not balance from the stove alone: the sums, plainly.',
    ),
    body: [
      lf(
        'Deux feux, c’est {woodDay} kg de bois (hypothèse) et {woodKwh} kWh (dérivé), qui rendent environ {meanKw} kW jour et nuit (résultat du modèle). Une maison qui perd {houseH} W/K (hypothèse) en reste à {roomMean} °C par {outsideMean} °C dehors ; sans ses {gains} W d’apports (estimation), {noGainsRoom} °C. Lancez **« Une maison qui fuit »** : la même machine, {leakyH} W/K, et la pièce tombe entre {leakyRoomLow} et {leakyRoomHigh} °C, à {eta} % (résultat du modèle). Il faudrait {woodLeaky} kg par jour. Le poêle n’y est pour rien. Quand la question est « deux feux suffisent-ils ? », c’est une question sur les murs.',
        'Two fires mean {woodDay} kg of wood (assumption) and {woodKwh} kWh (derived), delivering about {meanKw} kW day and night (model result). A house losing {houseH} W/K (assumption) stays at {roomMean} °C with {outsideMean} °C outside; without its {gains} W of gains (estimate), {noGainsRoom} °C. Run **“A leaky house”**: the same machine, {leakyH} W/K, and the room falls to between {leakyRoomLow} and {leakyRoomHigh} °C, at {eta}% (model result). It would take {woodLeaky} kg a day. The heater has no say in it. When the question is “are two fires enough?”, it is a question about the walls.',
      ),
      lf(
        '**« La vague de froid »** dit la même chose autrement : −{coldSnap} °C dehors (hypothèse), le même bois, et la pièce tombe entre {snapRoomLow} et {snapRoomHigh} °C, avec {snapEta} % de rendement (résultat du modèle) : la machine reste aussi bonne, et la maison perd davantage. Il faudrait {woodSnap} kg dans cette maison, {woodLeakySnap} kg dans celle qui fuit (résultat du modèle). À noter : les deux feux d’un foyer fermé sont littéralement deux charges, comme le dit le tableau de son concepteur pour un foyer de 150 mm : 6 kg en 55 à 90 minutes. Sur ce tube ouvert, ce sont deux séances, et ce n’est pas la même vie.',
        '**“The cold snap”** says the same another way: −{coldSnap} °C outside (assumption), the same wood, and the room falls to between {snapRoomLow} and {snapRoomHigh} °C, with {snapEta}% efficiency (model result): the machine stays as good, and the house loses more. It would take {woodSnap} kg in this house, {woodLeakySnap} kg in the leaky one (model result). Note this: a closed box’s two fires are literally two loads, as its designer’s table says for a 150 mm box: 6 kg in 55 to 90 minutes. On this open feed they are two sessions, and that is not the same life.',
      ),
      lf(
        '**« 80 à 90 % de bois en moins » ne boucle pas avec le poêle seul.** À {eta} % (résultat du modèle), remplacer un vieux poêle à 35 % économise {saved35} % ; un poêle à 50 %, {saved50} % ; un poêle à 72 %, {saved72} %. Pour 80 %, il faut que l’ancien poêle ait tourné à {oldFor80} %, pour 90 % à {oldFor90} % : un feu au ralenti, et il en existe. **Pour atteindre {savedBoth} %, il faut isoler** : le vieux poêle à 35 % dans une maison qui perd trois fois plus, c’est {woodOldLeaky} kg par jour, contre {woodDay} kg ici (hypothèse pour la journée). Le récit le plus cité, 0,6 corde par an dans une grande maison à isolation moyenne, manque de 3,9 à 8 fois la chaleur nécessaire à ses propres chiffres (dérivé), et il se dit lui-même estimé.',
        '**“80 to 90 % less wood” does not balance from the stove alone.** At {eta}% (model result), replacing an old 35 % stove saves {saved35}%; a 50 % stove, {saved50}%; a 72 % stove, {saved72}%. For 80 % the old stove must have run at {oldFor80}%, for 90 % at {oldFor90}%: a slow fire, and these exist. **Reaching {savedBoth}% takes insulation**: the old 35 % stove in a house losing three times as much is {woodOldLeaky} kg a day, against {woodDay} kg here (an assumption for the day). The most quoted account, 0.6 cord a year in a large house of average insulation, falls short by 3.9 to 8 times of the heat needed on its own figures (derived), and calls itself an estimate.',
      ),
    ],
    figures: [
      sp('Deux feux', 'Two fires', tf('model', '{meanKw} kW, jour et nuit', '{meanKw} kW, day and night')),
      sp('Pour 20 °C, cette maison', 'For 20 °C, this house', tf('model', '{wood20} kg par jour', '{wood20} kg a day')),
      sp(
        'Pour 20 °C, à 300 W/K',
        'For 20 °C, at 300 W/K',
        tf('model', '{woodLeaky} kg par jour', '{woodLeaky} kg a day'),
      ),
      sp('Gagné, poêle seul, depuis 35 %', 'Saved, stove alone, from 35 %', tf('model', '{saved35} %', '{saved35}%')),
      sp('Poêle et isolation', 'Stove and insulation', tf('model', '{savedBoth} %', '{savedBoth}%')),
    ],
    formula: 'Q = H · ΔT      m = Q · t / (Hu · η)',
    focus: { scene: 'homestead', part: 'house-shell', scenario: 'leaky-house' },
    quiz: [
      {
        q: lf(
          'À {eta} % (résultat du modèle), combien économise-t-on en remplaçant un vieux poêle qui tourne vraiment à 35 %, à maison égale ?',
          'At {eta}% (model result), how much is saved by replacing an old stove really running at 35 %, in the same house?',
        ),
        choices: [
          l('90 %', '90 %'),
          lf('{saved35} % (résultat du modèle)', '{saved35}% (model result)'),
          lf('{saved72} % (résultat du modèle)', '{saved72}% (model result)'),
        ],
        answer: 1,
        explain: lf(
          'Une simple division : 1 − 35 / {eta}. Il faudrait un ancien poêle à {oldFor90} % pour économiser 90 % (résultat du modèle). Les promesses comparent souvent un feu étouffé à un feu mené, et elles créditent le poêle de ce que fait l’isolation.',
          'A plain division: 1 − 35 / {eta}. An old stove at {oldFor90}% would be needed to save 90 % (model result). The claims often set a stifled fire against a well-run one, and credit the stove with what the insulation does.',
        ),
      },
      {
        q: l(
          'Le même bois, la même machine, une maison trois fois moins isolée. Que change le poêle ?',
          'The same wood, the same machine, a house three times less insulated. What does the heater change?',
        ),
        choices: [
          lf(
            'Rien d’utile : il reste à {eta} %, et la pièce tombe entre {leakyRoomLow} et {leakyRoomHigh} °C (résultat du modèle)',
            'Nothing useful: it stays at {eta}%, and the room falls to between {leakyRoomLow} and {leakyRoomHigh} °C (model result)',
          ),
          l('Il tire plus fort et compense', 'It draws harder and makes up for it'),
          l('Il rend sa chaleur plus tard', 'It gives its heat later'),
        ],
        answer: 0,
        explain: lf(
          'La machine est aussi bonne, et c’est la maison qui ne l’est pas : {woodLeaky} kg par jour seraient nécessaires à la tenir à 20 °C (résultat du modèle). C’est l’isolation, d’abord, qui permet deux feux.',
          'The machine is just as good, and it is the house that is not: {woodLeaky} kg a day would be needed to hold it at 20 °C (model result). Insulation, first, is what allows two fires.',
        ),
      },
    ],
  },
  {
    id: 'fire-co-and-the-law',
    title: l('Le monoxyde, le clapet, l’assurance', 'Carbon monoxide, the damper, the insurer'),
    summary: l(
      'Des braises, un conduit, un gaz sans odeur : les chiffres d’un clapet fermé, ceux d’une hotte, ce qu’un détecteur laisse passer, et quand cette machine n’est pas la bonne.',
      'Embers, a flue, a gas with no smell: the figures of a shut damper and of a kitchen fan, what an alarm lets by, and when this machine is the wrong answer.',
    ),
    body: [
      lf(
        'Le monoxyde de carbone naît d’un feu qui manque d’air ou de chaleur, et surtout des braises. Le conduit l’emporte tant qu’il reste ouvert et qu’il tire : tout le danger tient à ce chemin. Lancez **« Un clapet fermé sur les braises »**, et lisez seulement les chiffres. Fermé dix minutes après l’arrêt du bois : la valeur d’une heure de l’OMS est passée à {damperWhoMin} minutes, le détecteur de la norme sonne à {damperAlarmMin} minutes au plus tard, et la pièce atteint {damperPeak} ppm à {damperPeakMin} minutes. Fermé quarante minutes après : {damperLatePeak} ppm au plus haut, et aucune alarme requise (résultat du modèle). **Aucun clapet fermant n’existe sur cette machine.**',
        'Carbon monoxide comes from a fire short of air or heat, and above all from embers. The flue carries it away so long as it stays open and pulls: all the danger rests on that path. Run **“A damper shut on embers”**, and read only the numbers. Shut ten minutes after the wood stops: WHO’s one-hour value is passed at {damperWhoMin} minutes, the standard’s alarm sounds at {damperAlarmMin} minutes at the latest, and the room reaches {damperPeak} ppm at {damperPeakMin} minutes. Shut forty minutes after: {damperLatePeak} ppm at the highest, and no alarm required (model result). **No closing damper exists on this machine.**',
      ),
      lf(
        '**« La hotte de cuisine »** va dans le même sens : le feu est presque fini, le tirage retombe, et {fanPa} Pa de dépression (hypothèse) retournent le courant en quelques minutes. La pièce monte à {fanCoPeak} ppm en {fanPeakMin} minutes, la valeur d’une heure de l’OMS est passée à {fanWhoMin} minutes, et **le détecteur n’est pas obligé de sonner** (résultat du modèle). Sa norme, d’après des manuels de fabricants, lui laisse 60 à 90 minutes à 50 ppm, et le silence à 30 ppm pendant 120 minutes : il signale une panne, il ne surveille pas votre santé. Tous ces chiffres sont une moyenne de toute la maison : une vraie chambre, ou quelqu’un qui dort près d’une fuite, peut en être très loin.',
        '**“The kitchen fan”** goes the same way: the fire is nearly over, the draught falls, and {fanPa} Pa of depression (assumption) turn the flow round within minutes. The room reaches {fanCoPeak} ppm in {fanPeakMin} minutes, WHO’s one-hour value is passed at {fanWhoMin} minutes, and **the alarm has no duty to sound** (model result). Its standard, according to makers’ manuals, allows it 60 to 90 minutes at 50 ppm, and silence at 30 ppm for 120 minutes: it signals a fault, it does not watch over your health. All these figures are a whole-house mean: a real bedroom, or someone asleep beside a leak, can be far from it.',
      ),
      l(
        '**Quand cette machine n’est-elle pas la bonne ?** Une maison qui perd beaucoup, et que l’on n’a pas isolée d’abord. Un plancher léger. Un assureur qui refuse par écrit, ou une règle locale qui l’interdit : le panneau Sources dit ce que nous en avons lu, et comment. Une vie qui n’a pas deux séances par jour à donner : un constructeur de 15 ans le dit lui-même d’un foyer qui demande qu’on s’en occupe. Un logement sans vraie cheminée : un réchaud « rocket » dans un fourgon ou une pièce est la façon la plus simple de mourir de ce gaz. Ce qui compte vient avant tout chantier : l’assureur, par écrit ; un professionnel du conduit ; un détecteur.',
        '**When is this machine the wrong answer?** A house that loses a lot and has not been insulated first. A light floor. An insurer refusing in writing, or a local rule forbidding it: the Sources panel says what we read of them, and how. A life with no two sessions a day to give: a builder of 15 years says it himself of a firebox that wants tending. A home with no true chimney: a “rocket” cook stove in a van or a room is the plainest way to die of this gas. What counts comes before any work: the insurer, in writing; a flue professional; an alarm.',
      ),
    ],
    figures: [
      sp(
        'OMS, une heure',
        'WHO, one hour',
        tf('derived', '35 mg/m³, environ {whoPpm1h} ppm', '35 mg/m³, about {whoPpm1h} ppm'),
      ),
      sp(
        'Clapet, valeur de l’OMS passée',
        'Damper, WHO’s value passed',
        tf('model', 'à {damperWhoMin} minutes', 'at {damperWhoMin} minutes'),
      ),
      sp('Clapet, pic', 'Damper, peak', tf('model', '{damperPeak} ppm', '{damperPeak} ppm')),
      sp('Hotte, pic', 'Fan, peak', tf('model', '{fanCoPeak} ppm', '{fanCoPeak} ppm')),
      sp(
        'Détecteur, à 30 ppm',
        'Alarm, at 30 ppm',
        l('silence possible 120 minutes', 'silence allowed for 120 minutes'),
      ),
    ],
    formula: 'C = q · C_fumées / V̇',
    focus: { scene: 'living-room', part: 'co-alarm', scenario: 'damper-on-embers' },
    quiz: [
      {
        q: l(
          'Pourquoi cette machine n’a-t-elle pas de clapet fermant ?',
          'Why does this machine have no closing damper?',
        ),
        choices: [
          l('Parce qu’il coûterait cher', 'Because it would cost a lot'),
          l('Parce qu’il ferait perdre du rendement', 'Because it would lose efficiency'),
          l(
            'Parce que les braises continuent de faire du monoxyde, et que ce gaz n’aurait plus d’autre chemin que la pièce',
            'Because embers go on making carbon monoxide, and that gas would have no other way but the room',
          ),
        ],
        answer: 2,
        explain: lf(
          'Un clapet partiel peut même améliorer un rendement. Mais fermé sur des braises, il fait passer la valeur d’une heure de l’OMS en {damperWhoMin} minutes dans le modèle, en moyenne pour toute la maison (résultat du modèle).',
          'A partial damper can even improve efficiency. But shut on embers, it takes WHO’s one-hour value past in {damperWhoMin} minutes in the model, as a whole-house mean (model result).',
        ),
      },
      {
        q: l(
          'Un détecteur domestique, à la norme, n’a pas sonné. Qu’en déduire ?',
          'A domestic alarm, to the standard, has not sounded. What can be deduced?',
        ),
        choices: [
          l('Que l’air de la pièce respecte les valeurs de l’OMS', 'That the room’s air meets WHO’s values'),
          l(
            'Rien de sûr : il peut rester muet à 30 ppm pendant 120 minutes',
            'Nothing sure: it may stay silent at 30 ppm for 120 minutes',
          ),
          l('Que le poêle est sûr', 'That the heater is safe'),
        ],
        answer: 1,
        explain: lf(
          'La valeur d’une heure de l’OMS correspond à environ {whoPpm1h} ppm (dérivé), et le détecteur peut se taire à ce niveau, d’après les manuels qui citent sa norme. Il est indispensable, et il ne suffit pas.',
          'WHO’s one-hour value is about {whoPpm1h} ppm (derived), and the alarm may keep quiet at that level, according to manuals citing its standard. It is indispensable, and it is not enough.',
        ),
      },
    ],
  },
];
