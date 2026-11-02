// Parts of the `homestead` world (ids frozen in src/data/ids.ts): the house and its wood. Nothing here burns, and most of what decides the lab's question is here: the house's losses, the wood's water, the old stove
// it replaces. The house is generic, its H an assumption, and the sums of « 80 to 90 % less wood » are told on `coppice-lot`.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const HOMESTEAD_PARTS: PartInfo[] = [
  {
    id: 'house-shell',
    scene: 'homestead',
    category: 'site',
    name: l('La maison isolée', 'The insulated house'),
    short: lf(
      'Le vrai économiseur de bois : elle perd {houseH} W par degré (hypothèse). Sans ces murs, deux feux par jour ne suffisent pas.',
      'The real wood-saver: it loses {houseH} W per degree (assumption). Without these walls, two fires a day are not enough.',
    ),
    description: lf(
      'Une maison de plain-pied de {houseArea} m², une seule zone dans le modèle, avec un chiffre qui commande tout : ce qu’elle perd par degré d’écart avec le dehors. Nous prenons {houseH} W/K, soit environ {hPerFloor} W/m²·K de plancher, plus {gains} W de personnes, d’appareils et de soleil bas : ce sont une hypothèse et une estimation (dérivé pour le rapport). Avec cela, les {woodDay} kg de deux feux tiennent une moyenne de {roomMean} °C par un janvier à {outsideMean} °C (résultat du modèle). La même machine, le même bois, dans une maison qui perd {leakyH} W/K : la pièce reste entre {leakyRoomLow} et {leakyRoomHigh} °C, et il faudrait {woodLeaky} kg par jour pour 20 °C (résultat du modèle). Le poêle n’y est pour rien : c’est l’enveloppe qui rend possibles deux feux. La vidéo française qui annonce le bois divisé par quatre le montre d’ailleurs dans une maison très bien isolée, et crédite les deux.',
      'A single-storey house of {houseArea} m², one zone in the model, with one figure that governs everything: what it loses per degree of difference with the outside. We take {houseH} W/K, about {hPerFloor} W/m²·K of floor, plus {gains} W from people, appliances and low sun: an assumption and an estimate (derived for the ratio). With that, the {woodDay} kg of two fires hold a mean of {roomMean} °C in a January at {outsideMean} °C (model result). The same machine, the same wood, in a house losing {leakyH} W/K: the room stays between {leakyRoomLow} and {leakyRoomHigh} °C, and {woodLeaky} kg a day would be needed for 20 °C (model result). The heater has no say in that: it is the envelope that makes two fires possible. The French video announcing wood divided by four does show a very well insulated house, and credits both.',
    ),
    material: l(
      'Générique : ossature et isolant, un mur de refend en pierre, plain-pied',
      'Generic: framed and insulated, an inner stone wall, single storey',
    ),
    specs: [
      sp('Surface', 'Floor area', tf('assumed', '{houseArea} m²')),
      sp('Pertes', 'Losses', tf('assumed', '{houseH} W/K')),
      sp(
        'Apports gratuits',
        'Free gains',
        tf('estimate', '{gains} W de personnes, appareils, soleil', '{gains} W from people, appliances, sun'),
      ),
      sp(
        'Climat',
        'Climate',
        tf(
          'assumed',
          '{outsideMean} °C en moyenne, un janvier du bassin genevois',
          'a mean of {outsideMean} °C, a January in the Geneva basin',
        ),
      ),
      sp('Bois pour tenir 20 °C', 'Wood to hold 20 °C', tf('model', '{wood20} kg par jour', '{wood20} kg a day')),
      sp(
        'Pièce, sur un jour',
        'Room, over a day',
        tf('model', '{roomLow} à {roomHigh} °C', '{roomLow} to {roomHigh} °C'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un isolant tassé ou mouillé, des fuites d’air autour des menuiseries : le poêle n’a rien à se reprocher, mais le tas de bois descend plus vite. Une vaste maison mal isolée n’est tout simplement pas la bonne maison pour cette machine.',
        check:
          'Un test d’étanchéité à l’air par un professionnel, ou le tas de bois lui-même : pesé une fois en fin d’hiver, il donne une assez bonne idée de ce que perd la maison.',
        care: 'Refaire les joints, garder l’isolant au sec. Tout kilowatt gagné ici dure autant que la maison et ne demande pas de bûches.',
      },
      {
        failure:
          'Insulation slumped or wet, air leaks round the windows: the heater is not to blame, but the wood pile goes down faster. A large, poorly insulated house is simply the wrong house for this machine.',
        check:
          'An airtightness test by a professional, or the wood pile itself: weighed once at the end of winter, it says a good deal about what the house loses.',
        care: 'Reseal the joints, keep the insulation dry. Every kilowatt saved here lasts as long as the house and asks for no logs.',
      },
    ),
    tip: l(
      'Dans la Simulation, faites glisser « Ce que perd la maison par degré », et lisez la pièce : c’est le curseur qui bouge le plus de choses.',
      'In the Simulation, drag “What the house loses per degree” and read the room: no other slider moves as much.',
    ),
    design: lf(
      'Le modèle fait bouger sa pièce de {roomSwing} K par jour (résultat du modèle) quand un seul récit réel, dans une yourte, parle de 1 à 2 °C perdus la nuit. Une maison plus lourde bougerait moins : elle ne brûlerait pas moins de bois. Cette réserve vaut pour les chiffres de la pièce, pas pour le sens de la leçon.',
      'The model’s room moves by {roomSwing} K a day (model result), where the one real account, in a yurt, speaks of 1 to 2 °C lost overnight. A heavier house would move less: it would not burn less wood. That caveat applies to the room’s figures, not to the direction of the lesson.',
    ),
  },
  {
    id: 'chimney-cap',
    scene: 'homestead',
    category: 'mechanical',
    name: l('Chapeau de cheminée', 'Chimney cap'),
    short: l(
      'Il protège le conduit de la pluie. Ce qui en sort distingue la vapeur de la fumée, mais un chapeau clair ne dit rien du monoxyde : l’œil ne le juge pas.',
      'It keeps rain out of the flue. What leaves it tells steam from smoke, but a clear cap says nothing of carbon monoxide: the eye cannot judge it.',
    ),
    description: lf(
      'C’est le bout du chemin des gaz, à environ {chimneyTop} m au-dessus du plancher (estimation), au-dessus du faîtage. Les constructeurs annoncent une sortie de 32 °C sur les longs systèmes, plus de 232 °C sur une masse trop petite ; le modèle trouve {exhaust} °C en moyenne d’un feu, {exhaustAt9} °C à 9 h (résultat du modèle), sur son conduit de 9 m. Toutes ces lectures peuvent être vraies : la longueur, la masse et le moment du feu décident. Le chapeau coûte un peu de tirage et empêche l’eau et les oiseaux d’entrer. La fumée visible renseigne : blanche et courte par grand froid, c’est souvent de la vapeur ; grise et qui s’attarde, c’est du combustible qui part. L’inverse ne vaut pas : un constructeur qui analysait ses gaz n’a rien vu à l’œil quand sa combustion se dégradait. Dans la 3D, la vapeur suit le point de rosée du modèle, et la fumée sa carte du monoxyde : une image de cette carte, pas une mesure.',
      'This is the end of the gases’ path, about {chimneyTop} m above the floor (estimate), above the ridge. Builders report an exhaust of 32 °C on long systems and over 232 °C on too small a mass; the model finds {exhaust} °C as the mean of a fire, {exhaustAt9} °C at 9 h (model result), on its 9 m duct. All these readings can be true: length, mass and the moment in the fire decide. The cap costs a little draught and keeps water and birds out. Visible smoke is information: white and short in hard frost, it is often steam; grey and lingering, it is fuel leaving. The reverse does not hold: a builder analysing his gas saw nothing by eye as his burn got worse. In the 3D the steam follows the model’s dew point and the smoke its carbon monoxide map: a picture of that map, not a measurement.',
    ),
    material: l(
      'Inox, sur un conduit à double paroi (dessin générique)',
      'Stainless steel, on a twin-wall flue (a generic drawing)',
    ),
    specs: [
      sp('Sommet', 'Top', tf('estimate', 'environ {chimneyTop} m du plancher', 'about {chimneyTop} m above the floor')),
      sp('Sortie, moyenne d’un feu', 'Exhaust, mean of a fire', tf('model', '{exhaust} °C')),
      sp('Sortie, à 9 h', 'Exhaust, at 9 h', tf('model', '{exhaustAt9} °C')),
      sp('Lectures de constructeurs', 'Builders’ readings', l('de 32 à plus de 232 °C', '32 to over 232 °C')),
      sp(
        'Ce qui sort',
        'What leaves',
        tf('model', '{shareLost} % du bois, avec le conduit dehors', '{shareLost}% of the wood, with the outdoor flue'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un chapeau bouché : suie, givre sur un conduit froid, nid d’oiseau. Un conduit bouché fait d’un poêle une fuite de gaz, et le modèle ne le simule pas : il n’a ni vent, ni suie, ni bouchon.',
        check:
          'À chaque ramonage, et d’en bas à la fumée : un feu qui tire moins bien que la veille à bois égal se signale avant le détecteur, parfois.',
        care: 'Il se nettoie avec le conduit, par le ramoneur. Rien d’autre : c’est une pièce sans mécanisme, et il vaut mieux qu’elle le reste.',
      },
      {
        failure:
          'A blocked cap: soot, frost on a cold flue, a bird’s nest. A blocked flue turns a heater into a gas leak, and the model does not simulate it: it has no wind, no soot and no plug.',
        check:
          'At each sweep, and from below by the smoke: a fire that draws worse than yesterday on the same wood sometimes gives notice before the alarm does.',
        care: 'It is cleaned with the flue, by the sweep. Nothing else: this part has no mechanism, and it is better left that way.',
      },
    ),
    tip: l(
      'Dans la Simulation, faites glisser l’heure à travers un feu et regardez le chapeau : surtout de la vapeur pendant le feu, de la fumée quand le bois s’arrête. **Flux** montre le chemin des gaz, pas ce panache.',
      'In the Simulation, drag the hour through a fire and watch the cap: mostly steam during the fire, smoke once the wood stops. **Flows** shows the gases’ path, not this plume.',
    ),
    design: l(
      'Aucune sortie « presque à température ambiante » ne se paie gratis : plus les fumées sortent froides, moins la cheminée tire et plus l’eau se condense. Une bonne machine laisse juste assez de chaleur au conduit pour tirer.',
      'No “near room temperature” exhaust comes free: the colder the gas leaves, the less the chimney pulls and the more water condenses. A good machine leaves the flue just enough heat to draw.',
    ),
  },
  {
    id: 'sweep-access',
    scene: 'homestead',
    category: 'mechanical',
    name: l('Accès du ramoneur', 'Sweep’s access'),
    short: l(
      'Par où passe le professionnel : le conduit, le banc et leurs trappes doivent rester joignables, et c’est lui que veut voir l’assureur.',
      'The way in for the professional: the flue, the bench and their doors must stay within reach, and the insurer wants to see the certificate.',
    ),
    description: l(
      'Une machine dont le conduit court sous une banquette a besoin d’être pensée pour le ramoneur : un accès en toiture pour le conduit vertical, des trappes dans la pièce pour le reste. Les règles varient selon le pays : la règle française la plus citée demande deux ramonages par an, dont un pendant la période de chauffe, et un guide d’assurance rappelle que le certificat d’un professionnel compte, le ramonage par soi-même n’étant pas reconnu. Les récits populaires disent qu’il n’y aurait aucun risque de feu de suie sur ces machines : nous n’avons trouvé aucune mesure qui le soutienne, et un conduit noirci peut s’enflammer comme un autre. Sur un long conduit horizontal, c’est aussi de la cendre volante qu’on vient retirer, et pas seulement de la suie.',
      'A machine whose duct runs under a bench has to be thought through for the sweep: roof access for the vertical flue, doors in the room for the rest. Rules vary by country: the most quoted French rule asks for two sweeps a year, one during the heating season, and an insurance guide points out that a professional’s certificate counts and that sweeping your own does not. Popular accounts say these machines carry no risk of a soot fire: we found no measurement to support that, and a blackened flue can catch like any other. In a long horizontal duct it is also fly ash that has to come out, not soot alone.',
    ),
    material: l(
      'Échelle de toit, crochets et passage dégagé (dessin générique)',
      'Roof ladder, hooks and a clear path (a generic drawing)',
    ),
    specs: [
      sp('Fréquence en France', 'Frequency in France', l('deux par an, lu en résumé', 'twice a year, read in summary')),
      sp('Qui', 'Who', l('un professionnel, pour le certificat', 'a professional, for the certificate')),
      sp('Où', 'Where', l('toit, pied de cheminée, banc, collecteur', 'roof, chimney foot, bench, manifold')),
    ],
    maintenance: maint(
      {
        failure:
          'Le ramoneur qui ne veut pas intervenir : beaucoup n’ont jamais vu cette machine, et une trappe scellée sous un enduit ne se trouve pas. La panne, ici, est de ne l’avoir jamais montrée à personne.',
        check:
          'Avant de construire : en demander un qui accepte. Ensuite, le certificat de l’année et la quantité de cendre retirée, notée d’un hiver à l’autre.',
        care: 'Garder l’échelle et les crochets en état, le chemin dégagé, et conserver les certificats avec les papiers de la maison.',
      },
      {
        failure:
          'A sweep who will not touch it: many have never seen this machine, and a door sealed under plaster cannot be found. The failure here is never having shown it to anyone.',
        check:
          'Before building: find one who agrees. After that, the year’s certificate and the amount of ash taken out, noted from one winter to the next.',
        care: 'Keep the ladder and hooks sound, the path clear, and the certificates with the house’s papers.',
      },
    ),
    tip: l(
      'Cherchez le ramoneur avant d’imaginer la banquette : l’ordre inverse se paie cher.',
      'Look for the sweep before picturing the bench: the other order is costly.',
    ),
    design: l(
      'Une trappe coûte peu au moment de monter, et un mur à démolir beaucoup au moment de nettoyer. Notre reconstitution garde donc ses trappes en vue.',
      'A door costs little at the time of building, and a wall to knock down a great deal at cleaning time. So our reconstruction keeps its doors in view.',
    ),
  },
  {
    id: 'outside-air-inlet',
    scene: 'homestead',
    category: 'mechanical',
    name: l('Prise d’air extérieure', 'Outside air inlet'),
    short: lf(
      'Pendant un feu, il respire environ {airM3h} m³/h en moyenne (résultat du modèle) : cet air doit bien venir de quelque part.',
      'During a fire it breathes a mean of about {airM3h} m³/h (model result): that air has to come from somewhere.',
    ),
    description: lf(
      'Une maison étanche a un problème que n’avait pas une maison pleine de courants d’air : la machine y consomme presque autant d’air que toute la ventilation de base. En moyenne d’un feu, le modèle fait passer {flowGs} g/s, soit environ {airM3h} m³/h (résultat du modèle), contre environ {baseM3h} m³/h de renouvellement de base à {achBase} volume par heure (estimation). Une prise d’air dans la pièce vise à ce que le feu ne tire pas sur le reste de la maison et ne se batte pas avec une hotte : le modèle n’en a pas, et il ne dit pas ce qu’elle y change. Un manuel français détaille l’enchaînement dans une maison mise en dépression après le feu, et un maçon américain le signale aussi. La prise ne remplace rien d’autre : elle ne dit rien du monoxyde, et elle ne fait pas d’un conduit froid un conduit qui tire.',
      'A tight house has a problem a draughty one never had: the machine takes nearly as much air as all the base ventilation. As the mean of a fire the model moves {flowGs} g/s, about {airM3h} m³/h (model result), against about {baseM3h} m³/h of base renewal at {achBase} volume an hour (estimate). An inlet in the room is meant to keep the fire from pulling on the rest of the house or fighting a kitchen fan: the model has none, and does not say what it changes. A French manual sets out the chain of events in a house depressurised after the fire, and an American mason mentions it too. The inlet replaces nothing else: it says nothing about carbon monoxide, and it does not make a cold flue draw.',
    ),
    material: l(
      'Gaine traversant le mur, grille anti-insectes (dessin générique)',
      'A duct through the wall, an insect mesh (a generic drawing)',
    ),
    specs: [
      sp(
        'Air, moyenne d’un feu',
        'Air, mean of a fire',
        tf('model', '{flowGs} g/s, environ {airM3h} m³/h', '{flowGs} g/s, about {airM3h} m³/h'),
      ),
      sp(
        'Renouvellement de base',
        'Base air change',
        tf('estimate', '{achBase} volume par heure', '{achBase} volume an hour'),
      ),
      sp('Air par kg de bois sec', 'Air per kg of dry wood', tf('derived', '5,97 kg, au minimum', 'at least 5.97 kg')),
      sp(
        'Dépression d’une hotte',
        'Depression from a fan',
        tf('assumed', '{fanPa} Pa, le scénario', '{fanPa} Pa, the scenario'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une grille obstruée par le givre, la poussière ou un meuble, et plus souvent un clapet fermé par quelqu’un qui sentait un courant d’air : c’est alors tout l’air de la combustion qui passe par les fuites de la maison.',
        check:
          'La grille à l’œil chaque mois d’hiver. Puis le scénario de la hotte, une fois : il montre pourquoi on regarde cette grille.',
        care: 'Dépoussiérer, déneiger côté dehors, et ne rien poser devant côté dedans. Rien de plus savant.',
      },
      {
        failure:
          'A grille blocked by frost, dust or a piece of furniture, and more often a flap closed by someone feeling a draught: all the combustion air then comes through the house’s leaks.',
        check:
          'The grille, by eye, each month of winter. Then the fan scenario, once: it shows why anyone looks at that grille.',
        care: 'Dust it, clear snow on the outside, and put nothing in front on the inside. Nothing cleverer than that.',
      },
    ),
    tip: l(
      'Le scénario de la hotte de cuisine montre le chemin que prend l’air quand la maison est en dépression. Il ne montre pas ce qu’une prise d’air éviterait.',
      'The kitchen-fan scenario shows the way air takes when the house is under depression. It does not show what an air inlet would spare.',
    ),
    design: l(
      'Le modèle ajoute au renouvellement d’air ce que tire la cheminée. Cet air froid se paie : charger ce coût à la machine fait baisser le rendement de deux points.',
      'The model adds to the base air change what the chimney draws. That cold air is paid for: charging the cost to the machine lowers the efficiency by two points.',
    ),
  },
  {
    id: 'woodshed',
    scene: 'homestead',
    category: 'site',
    name: l('Bûcher', 'Woodshed'),
    short: l(
      'Un toit, du vent, du temps : le bois sèche à l’abri, un an ou plus, et ce temps-là ne se rattrape pas au moment du feu.',
      'A roof, wind and time: wood dries under cover, a year or more, and that time cannot be made up when the fire is lit.',
    ),
    description: lf(
      'L’eau du bois se paie en chaleur : à 15 % d’humidité, un kilo rend 4,27 kWh, à 20 % 3,98 kWh, à 30 % 3,39 kWh (une formule publiée par une université finlandaise, lue en résumé). La norme européenne des poêles de masse compte 4,16 kWh/kg, soit environ {moisture} % d’humidité : c’est la valeur de notre machine (hypothèse). Tout le reste du bûcher est une affaire de bon sens, celui de la pratique courante : un toit pour la pluie, des côtés ouverts pour le vent, un sol qui ne remonte pas d’eau. Bois fendu, car une bûche ronde ne sèche que par ses bouts. Du bois sec n’est pas seulement plus chaud : il brûle plus proprement, et c’est une des rares choses qu’un habitant décide chaque jour.',
      'Water in the wood is paid for in heat: at 15 % moisture a kilo gives 4.27 kWh, at 20 % 3.98 kWh, at 30 % 3.39 kWh (a formula published by a Finnish university, read in summary). The European standard for masonry stoves counts 4.16 kWh/kg, about {moisture}% moisture: that is the value of our machine (assumption). All the rest of a woodshed is common sense, that of usual practice: a roof for the rain, open sides for the wind, a floor that brings up no damp. Split wood, since a round log only dries from its ends. Dry wood is not only hotter: it burns cleaner, and that is one of the few things a household decides every day.',
    ),
    material: l(
      'Charpente légère, bardage ajouré, sol surélevé (dessin générique)',
      'Light frame, slatted sides, raised floor (a generic drawing)',
    ),
    specs: [
      sp('Séchage', 'Drying', l('un an ou plus, pratique courante', 'a year or more, usual practice')),
      sp('Bois de 15 %', 'Wood at 15 %', l('4,27 kWh/kg', '4.27 kWh/kg')),
      sp('Bois de 20 %', 'Wood at 20 %', l('3,98 kWh/kg', '3.98 kWh/kg')),
      sp('Bois de 30 %', 'Wood at 30 %', l('3,39 kWh/kg', '3.39 kWh/kg')),
      sp('Contenu de la saison', 'The season it holds', tf('derived', '{seasonTonnes} t', '{seasonTonnes} t')),
    ],
    maintenance: maint(
      {
        failure:
          'Le bois qui reprend l’eau : pile adossée à un mur, bâche fermée qui l’étouffe, neige soufflée sur les rangs. Le poids ne ment pas, mais l’œil oui : un bois gris dehors peut être humide dedans.',
        check:
          'L’humidimètre, sur une face fraîchement fendue, avant d’entrer une brassée, et la pile qu’on rentre d’abord est celle qui a le plus attendu.',
        care: 'Laisser le vent passer, relever ce qui s’affaisse, et ranger le bois de l’année à côté et non devant celui de l’an dernier.',
      },
      {
        failure:
          'Wood that takes water back: a pile against a wall, a tarpaulin that stifles it, snow blown over the rows. Weight does not lie but the eye does: wood that looks grey outside can be damp inside.',
        check:
          'The moisture meter, on a freshly split face, before bringing in an armful; and the pile that goes in first is the one that has waited longest.',
        care: 'Let the wind through, straighten what sags, and stack this year’s wood beside last year’s, not in front of it.',
      },
    ),
    tip: l(
      'Le scénario du bois humide met le même poids de bois dans la même machine : lisez ce que perd la pièce.',
      'The wet-wood scenario puts the same weight of wood in the same machine: read what the room loses.',
    ),
    design: lf(
      'À {seasonTonnes} t pour la saison (dérivé), le bûcher est petit pour cette maison : la pile de la maison mal isolée, à {woodLeaky} kg par jour (résultat du modèle), en demanderait {seasonLeakyTonnes} t (dérivé). Comme la banquette, sa taille dépend de l’isolation.',
      'At {seasonTonnes} t for the season (derived), the shed is small for this house: the pile of the leaky house, at {woodLeaky} kg a day (model result), would need {seasonLeakyTonnes} t (derived). Like the bench, its size depends on the insulation.',
    ),
  },
  {
    id: 'cordwood-stack',
    scene: 'homestead',
    category: 'site',
    name: l('Pile de bois fendu', 'Split-wood stack'),
    short: lf(
      'Une saison à l’échelle, {seasonTonnes} t (dérivé), à côté du panier d’un jour : la mesure la plus honnête de cette maison.',
      'A season to scale, {seasonTonnes} t (derived), beside one day’s basket: the most honest measure of this house.',
    ),
    description: lf(
      'Elle est dessinée à l’échelle : {seasonDays} jours à {woodDay} kg (estimation et hypothèse) font {seasonTonnes} t (dérivé), soit {stereLow} à {stereHigh} stères à environ {stereKg} kg le stère (estimation). Les sources disent autre chose, chacune pour sa maison : une yourte très isolée brûle environ 1 stère de chutes par saison ; un plan vendu annonce moins d’une demi-corde par an sous un climat doux (un argument de vente, pas un relevé) ; une maison filmée en plein hiver parle de deux pieds cubes par jour et d’une corde en quatre mois. Ces deux derniers chiffres ne s’accordent pas entre eux : à 128 pieds cubes la corde, deux par jour durent {cordDays} jours (dérivé). Aucun n’est une mesure.',
      'It is drawn to scale: {seasonDays} days at {woodDay} kg (estimate and assumption) make {seasonTonnes} t (derived), or {stereLow} to {stereHigh} stères at about {stereKg} kg to the stère (estimate). The sources say otherwise, each for its own house: a very tight yurt burns about 1 stère of offcuts a season; a plan on sale announces less than half a cord a year in a mild climate (a selling point, not a log); a house filmed in deep winter speaks of two cubic feet a day and of a cord in four months. Those last two do not agree with each other: at 128 cubic feet to the cord, two a day last {cordDays} days (derived). None is a measurement.',
    ),
    material: l('Bois fendu, feuillus et résineux', 'Split wood, hardwood and softwood'),
    specs: [
      sp('Masse', 'Mass', tf('derived', '{seasonTonnes} t, sur une saison', '{seasonTonnes} t, over a season')),
      sp('Volume', 'Volume', tf('estimate', '{stereLow} à {stereHigh} stères', '{stereLow} to {stereHigh} stères')),
      sp('Humidité du modèle', 'Moisture in the model', tf('assumed', '{moisture} %', '{moisture}%')),
      sp(
        'Le même hiver, maison qui fuit',
        'The same winter, leaky house',
        tf('derived', '{seasonLeakyTonnes} t', '{seasonLeakyTonnes} t'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une pile qui s’effondre : sol mou, rangs trop hauts, vieux bois qui pourrit au bas. Ou le stock mal rangé qui force à brûler le plus récent, le plus humide.',
        check:
          'Le niveau de la pile en janvier, comparé à ce qu’annonçait le calcul : un écart dit la vérité sur la maison plus vite qu’aucun thermomètre.',
        care: 'Empiler sur des chevrons, laisser un espace au mur, et noter chaque année ce qui a été brûlé.',
      },
      {
        failure:
          'A pile that falls: soft ground, rows too high, old wood rotting at the bottom. Or poor order that forces the household to burn the newest, wettest wood first.',
        check:
          'The level of the pile in January, against what the sums announced: a gap tells the truth about the house sooner than any thermometer.',
        care: 'Stack on bearers, leave a space at the wall, and note each year what was burnt.',
      },
    ),
    tip: l(
      'Comparez à l’œil la pile et le panier du jour, dans la pièce : c’est la question du labo, sans un seul chiffre.',
      'Compare the stack by eye with the day’s basket, in the room: that is the lab’s question, without a single figure.',
    ),
    design: l(
      'La pile est un argument honnête, car elle ne dépend d’aucun rendement annoncé : ce qu’on a brûlé se pèse. Si un lecteur ne retient qu’une méthode de ce labo, que ce soit celle-ci.',
      'The stack is an honest argument, because it rests on no announced efficiency: what has been burnt can be weighed. If a reader keeps only one method from this lab, let it be this one.',
    ),
  },
  {
    id: 'moisture-meter',
    scene: 'homestead',
    category: 'electrical',
    name: l('Humidimètre', 'Moisture meter'),
    short: l(
      'Deux pointes et un chiffre : sous 20 %, sur une face fendue. Le premier geste de la journée.',
      'Two pins and a figure: under 20 %, on a split face. The first gesture of the day.',
    ),
    description: lf(
      'Un manuel français demande du bois sous 20 %, et la norme européenne des poêles de masse le veut entre 12 et 20 %. La raison se lit dans la machine : à 30 % d’humidité, le même poids de bois laisse la chambre à {wetChamber} °C au lieu de {chamber} °C, la pièce à {wetRoom} °C en moyenne, et le monoxyde plus de trois fois plus haut (résultat du modèle, et pour le monoxyde une indication). Un constructeur qui mesure sur sa propre machine dit la même chose du chêne humide : moins propre, sans que l’œil y voie rien. Cet appareil à quelques euros (estimation, aucune source lue) compte donc plus que son prix, à condition de le planter au bon endroit : le dehors d’une bûche sèche bien avant son cœur.',
      'A French manual asks for wood under 20 %, and the European standard for masonry stoves wants it between 12 and 20 %. The reason can be read in the machine: at 30 % moisture, the same weight of wood leaves the chamber at {wetChamber} °C instead of {chamber} °C, the room at a mean of {wetRoom} °C, and carbon monoxide over three times higher (model result, and for the monoxide an indication). A builder measuring his own machine says the same of damp oak: dirtier, with nothing the eye can see. This device of a few euros (estimate, no source read) therefore counts for more than its price, provided it goes in the right place: the outside of a log dries well before its heart.',
    ),
    material: l('Petit boîtier à piles, deux pointes', 'A small battery unit, two pins'),
    specs: [
      sp('Seuil d’un manuel français', 'A French manual’s limit', l('moins de 20 %', 'under 20 %')),
      sp('Plage de la norme', 'The standard’s range', l('12 à 20 %', '12 to 20 %')),
      sp('Bois à 30 %, chambre', 'Wood at 30 %, chamber', tf('model', '{wetChamber} °C')),
      sp('Bois à 30 %, pièce', 'Wood at 30 %, room', tf('model', '{wetRoom} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Une pile faible qui fait lire trop bas, des pointes usées, et surtout une mesure prise au mauvais endroit : sur l’écorce d’une bûche ronde, l’appareil rassure à tort.',
        check:
          'Sur une face fraîchement fendue, au milieu de la bûche, plusieurs bûches d’une même rangée. Le bois gelé fausse la lecture : on le laisse revenir à la température de la pièce.',
        care: 'Une pile, un capuchon sur les pointes, et le geste chaque fois que la pile de bois change de rangée.',
      },
      {
        failure:
          'A weak battery that reads too low, worn pins, and above all a reading in the wrong place: on the bark of a round log the device reassures wrongly.',
        check:
          'On a freshly split face, mid-log, on several logs of one row. Frozen wood gives a false reading: it is left to come up to room temperature.',
        care: 'A battery, a cap on the pins, and the gesture each time the pile moves to a new row.',
      },
    ),
    tip: l(
      'Faites monter « Humidité du bois » dans la Simulation : la chaleur baisse et le CO monte. Au chapeau, le panache suit cette carte ; sur une vraie machine, l’œil n’en voit pas autant.',
      'Raise “Moisture of the wood” in the Simulation: the heat falls and the CO rises. At the cap the plume follows that map; on a real machine, the eye sees no such thing.',
    ),
    design: l(
      'Ce sont les habitants qui tiennent ce réglage, à chaque brassée : c’est le seul paramètre de combustion dont ils décident complètement. La machine la mieux construite ne rattrape pas du bois vert.',
      'The household holds this setting, armful by armful: it is the one combustion setting entirely theirs to decide. The best-built machine cannot make up for green wood.',
    ),
  },
  {
    id: 'kindling-block',
    scene: 'homestead',
    category: 'site',
    name: l('Billot à petit bois', 'Kindling block'),
    short: l(
      'Un tube en J mange du petit bois : il faut donc beaucoup fendre, et c’est une part du travail qu’on oublie souvent.',
      'A J-tube eats small wood: so there is a great deal of splitting, a share of the work that is often forgotten.',
    ),
    description: lf(
      'Une bûche de poêle ordinaire n’entre pas dans cette machine. Le tube fait l’aire du conduit de 200 mm, environ {section} m² (dérivé), et le bois se tient debout dedans. Un manuel français parle de moins de 8 cm de côté. Il faut donc une hache, un billot à bonne hauteur, et une habitude : un feu de {sessionHours} h à {feedRate} kg/h (hypothèse), à une ou deux charges par heure selon une constructrice, c’est plusieurs brassées de petit bois par jour. Personne ne chiffre ce temps de travail. Un constructeur qui vit avec ces machines depuis 15 ans le met pourtant dans le calcul : un foyer qui réclame qu’on s’en occupe peut ne pas convenir à votre vie.',
      'An ordinary stove log does not fit this machine. The feed has the area of the 200 mm duct, about {section} m² (derived), and the wood stands up in it. A French manual speaks of under 8 cm across. So there has to be an axe, a block at the right height, and a habit: a fire of {sessionHours} h at {feedRate} kg/h (assumption), at one or two loads an hour according to one builder, means several armfuls of small wood a day. Nobody puts a figure on that working time. Yet a builder who has lived with such machines for 15 years counts it in: a firebox that wants tending may not suit your life.',
    ),
    material: l('Un billot de feuillu, une hachette à bois', 'A hardwood block, a splitting hatchet'),
    specs: [
      sp('Section du tube', 'Section of the feed', tf('derived', 'environ {section} m²', 'about {section} m²')),
      sp('Bois, un manuel français', 'Wood, a French manual', l('moins de 8 cm de côté', 'under 8 cm across')),
      sp('Rythme, une constructrice', 'Pace, one builder', l('1 à 2 charges par heure', '1 to 2 loads an hour')),
    ],
    maintenance: maint(
      {
        failure:
          'La blessure, d’abord : un billot trop bas, une hachette mal affûtée, et le geste de fatigue en fin de journée. Puis un petit bois resté dehors, qui n’a pas séché comme la pile.',
        check:
          'Le fil de la hachette et l’assise du billot, avant la saison. Le petit bois passe à l’humidimètre comme le reste.',
        care: 'Une pierre à aiguiser, un abri pour le petit bois, et du bois de la journée fendu avant la nuit plutôt qu’à la lampe.',
      },
      {
        failure:
          'Injury, first: a block too low, a blunt hatchet, the tired stroke at the end of the day. Then kindling left out, which has not dried as the pile has.',
        check:
          'The hatchet’s edge and the seat of the block, before the season. Kindling goes under the moisture meter like the rest.',
        care: 'A sharpening stone, a shelter for the small wood, and the day’s wood split before dark rather than by lamplight.',
      },
    ),
    tip: l(
      'Regardez la section du tube dans le foyer, puis ce billot : la taille du bois est une conséquence, pas un choix.',
      'Look at the section of the feed in the core, then at this block: the size of the wood is a consequence, not a choice.',
    ),
    design: l(
      'Un foyer fermé à une seule charge accepte des bûches plus grosses et plus tranquilles : c’est l’un des préréglages de la simulation, et l’une des raisons pour lesquelles un constructeur de 15 ans a fini par y passer.',
      'A closed box with a single load takes larger logs and less attention: it is one of the simulation’s starting points, and one reason a builder of 15 years ended up moving to it.',
    ),
  },
  {
    id: 'ash-bucket',
    scene: 'homestead',
    category: 'site',
    name: l('Seau à cendres', 'Ash bucket'),
    short: l(
      'Un seau de métal à couvercle, qui attend dehors : 57 livres de bois n’ont donné que 7 onces de cendre, mais elle reste chaude longtemps.',
      'A lidded metal bucket that waits outside: 57 lb of wood gave only 7 oz of ash, but it stays hot for a long time.',
    ),
    description: lf(
      'Une constructrice a pesé : 57 livres de bois (environ {ashKg} kg) pour 7 onces de cendre (environ {ashG} g, dérivé), soit 0,77 %. Un laboratoire finlandais trouve 0,7 % en poids sec, et un autre concepteur dit à peu près un pour cent. Pour notre journée de {woodDay} kg (hypothèse), cela fait environ {ashDayG} g (dérivé), et une quinzaine de kilos pour la saison ({ashSeasonKg} kg, dérivé). C’est peu, mais la cendre est trompeuse : elle isole les braises qu’elle couvre. Une braise continue de produire du monoxyde après la flamme : d’où le métal, le couvercle et le dehors, sur un sol qui ne brûle pas. Le seau ne se met ni dans un garage, ni contre un mur de bois.',
      'One builder weighed it: 57 lb of wood (about {ashKg} kg) for 7 oz of ash (about {ashG} g, derived), or 0.77 %. A Finnish laboratory finds 0.7 % by dry weight, and another designer says about one per cent. For our day of {woodDay} kg (assumption), that is about {ashDayG} g (derived), and some {ashSeasonKg} kg over the season (derived). It is little, but ash is deceptive: it insulates the embers it covers. An ember goes on making carbon monoxide after the flame: hence the metal, the lid and the outdoors, on a floor that does not burn. The bucket does not go in a garage or against a wooden wall.',
    ),
    material: l('Acier galvanisé, couvercle ajusté', 'Galvanised steel, a close lid'),
    specs: [
      sp('Cendre d’un bois pesé', 'Ash from weighed wood', l('0,77 %', '0.77 %')),
      sp('Un jour', 'A day', tf('derived', 'environ {ashDayG} g', 'about {ashDayG} g')),
      sp('Une saison', 'A season', tf('derived', 'environ {ashSeasonKg} kg', 'about {ashSeasonKg} kg')),
      sp('Où', 'Where', l('dehors, sur un sol minéral', 'outside, on a mineral floor')),
    ],
    maintenance: maint(
      {
        failure:
          'De la cendre vidée « froide » qui ne l’était pas : c’est ainsi qu’un seau peut mettre le feu à un garage. Ou un seau de plastique qui fond, et un couvercle perdu.',
        check:
          'Le couvercle, et le fond du seau pour la rouille. Une cendre retirée reste suspecte plusieurs jours : personne ne donne de durée sûre, et nous n’en donnons pas.',
        care: 'Vider dans un endroit minéral ou au compost une fois bien éteinte. Noter le poids : il mesure aussi bien la journée que le tas de bois.',
      },
      {
        failure:
          'Ash emptied “cold” that was not: that is how a bucket can set a garage alight. Or a plastic bucket that melts, and a lost lid.',
        check:
          'The lid, and the bottom of the bucket for rust. Ash taken out stays suspect for days: nobody gives a safe time, and neither do we.',
        care: 'Empty onto mineral ground, or into the compost once truly out. Note the weight: it measures the day as well as the pile does.',
      },
    ),
    tip: l(
      'Allez voir le lit de cendres dans le foyer : ce seau sert à ce que cette couche reste mince.',
      'Go and see the ash bed in the core: this bucket is what keeps that layer thin.',
    ),
    design: lf(
      'Si peu de cendre tient à une chose : le bois brûle presque entièrement, et il n’en reste que les minéraux. Le modèle compte {shareUnburned} % d’imbrûlés sur la journée (résultat du modèle) ; cette petite part-là, c’est surtout du gaz, et il ne se pèse pas.',
      'So little ash comes down to one thing: wood burns almost entirely, leaving its minerals. The model counts {shareUnburned}% unburned over the day (model result); that small share is mostly gas, and it cannot be weighed.',
    ),
  },
  {
    id: 'coppice-lot',
    scene: 'homestead',
    category: 'site',
    name: l('Taillis', 'Coppice'),
    short: lf(
      'Combien de forêt pour une maison ? Le vrai calcul de « 80 à 90 % de bois en moins », qui ne boucle pas avec le poêle seul.',
      'How much forest for a house? The true sums of “80 to 90 % less wood”, which do not balance from the stove alone.',
    ),
    description: lf(
      'On lit partout « 80 à 90 % de bois en moins ». **Ce chiffre ne boucle pas avec le poêle seul.** À {eta} % rendus à la maison (résultat du modèle), remplacer un vieux poêle qui tourne vraiment à 35 % économise {saved35} % ; un poêle à 50 %, {saved50} % ; un bon poêle à 72 %, {saved72} %. Pour 80 % de bois en moins, il faudrait que l’ancien poêle ait tourné à {oldFor80} %, et pour 90 % à {oldFor90} % : un poêle au ralenti, et il en existe. Avec le vieux poêle à 35 % dans une maison qui perd trois fois plus, poêle et isolation ensemble économisent {savedBoth} % (résultat du modèle). La promesse est atteignable, mais surtout pas par le poêle. Nous ne donnons pas d’hectares : aucune source lue ne donne le rendement de ce taillis.',
      'You read “80 to 90 % less wood” everywhere. **That figure does not balance from the stove alone.** At {eta}% delivered to the house (model result), replacing an old stove really running at 35 % saves {saved35}%; a 50 % stove, {saved50}%; a good 72 % stove, {saved72}%. For 80 % less wood, the old stove must have been running at {oldFor80}%, and for 90 % at {oldFor90}%: a slow, smouldering one, and these exist. With the old 35 % stove in a house losing three times as much, stove and insulation together save {savedBoth}% (model result). The promise can be reached, but mostly not by the stove. We print no hectares: no source we read gives this coppice’s yield.',
    ),
    material: l(
      'Feuillus recépés, de plusieurs âges (décor générique)',
      'Cut-back hardwood of several ages (generic scenery)',
    ),
    specs: [
      sp('Une saison, cette maison', 'A season, this house', tf('derived', '{seasonTonnes} t', '{seasonTonnes} t')),
      sp(
        'Même chaleur, poêle à 35 %',
        'Same heat, a 35 % stove',
        tf('derived', '{seasonOldTonnes} t', '{seasonOldTonnes} t'),
      ),
      sp(
        'Ce poêle, maison qui fuit',
        'That stove, leaky house',
        tf('derived', '{seasonOldLeakyTonnes} t', '{seasonOldLeakyTonnes} t'),
      ),
      sp(
        'Économie, poêle seul',
        'Saving, stove alone',
        tf('model', '{saved72}, {saved50} ou {saved35} %', '{saved72}, {saved50} or {saved35}%'),
      ),
      sp('Rendement du taillis', 'Yield of the coppice', l('aucune source lue', 'no source we read')),
    ],
    maintenance: maint(
      {
        failure:
          'Un taillis trop souvent coupé qui s’épuise, ou un plan de coupe calculé sur une promesse plutôt que sur la pile. Le décor n’a pas de prétention forestière : il rappelle que tout ce bois pousse quelque part.',
        check: 'Le bois réellement brûlé, pesé deux hivers de suite, avant toute décision sur ce qu’on coupe.',
        care: 'Une rotation lente, plusieurs âges sur la parcelle. Pour le reste, l’avis d’un forestier local vaut mieux qu’une page de ce labo.',
      },
      {
        failure:
          'A coppice cut too often and wearing out, or a cutting plan worked out on a promise and not on the pile. The scenery makes no forestry claim: it reminds us that all this wood grows somewhere.',
        check: 'The wood truly burnt, weighed over two winters, before any decision on what to cut.',
        care: 'A slow rotation, several ages on the plot. For the rest, a local forester’s word is worth more than a page of this lab.',
      },
    ),
    tip: l(
      'La section « 80 à 90 % de bois en moins ? » de la Simulation permet de changer le rendement réel de l’ancien poêle : le chiffre se fait en direct.',
      'The “80 to 90 % less wood?” section of the Simulation lets you set the old stove’s real efficiency: the figure works out live.',
    ),
    design: lf(
      'Ces sommes ont un défaut de méthode : elles comparent un rendement calculé à un autre chiffre estimé. Nous n’avons trouvé aucune mesure des deux dans la même maison. Elles disent tout de même l’ordre : isoler d’abord, changer de poêle ensuite, sans quoi {woodLeaky} kg par jour (résultat du modèle) ne se réduisent à aucun chiffre rond.',
      'These sums have a flaw of method: they set one calculated efficiency against another estimated figure. We found no measurement of both in the same house. They do tell the order: insulate first, change the stove second, or else {woodLeaky} kg a day (model result) reduce to no round figure.',
    ),
  },
  {
    id: 'smoky-neighbour',
    scene: 'homestead',
    category: 'site',
    name: l('Cheminée du voisin', 'Neighbour’s chimney'),
    short: l(
      'La fumée est du combustible qui n’a pas brûlé : le même bois, un feu au ralenti, et cette colonne grise qui s’attarde.',
      'Smoke is fuel that has not burnt: the same wood, a slow fire, and that grey column that lingers.',
    ),
    description: l(
      'Le voisin n’a pas de mauvais bois : il a un poêle au ralenti, qui garde sa chaleur en coupant l’air. Un manuel français donne un écart de dix fois dans la pollution entre un feu lent et un feu nominal du même poêle, en ordre de grandeur. Une université finlandaise, dans un vrai laboratoire, a fait couver un poêle de masse : trois fois et demie plus de monoxyde, quatorze fois plus de composés organiques, six fois plus de particules fines. C’est aussi le fond honnête de la promesse de la fumée divisée par cent : elle compare une bonne combustion à un feu étouffé, pas deux feux bien menés. Le voisin n’est pas là pour qu’on le juge : bien des poêles anciens sont réglés pour faire ceci, durer toute la nuit.',
      'The neighbour’s wood is no worse: the stove is on a slow burn, keeping its heat by cutting the air. A French manual gives a tenfold gap in pollution between a slow and a nominal fire of the same stove, as an order of magnitude. A Finnish university, in a real laboratory, made a masonry heater smoulder: three and a half times the carbon monoxide, fourteen times the organic compounds, six times the fine particles. That is also the honest core of the promise of a hundredth of the smoke: it sets a good burn against a stifled fire, not two fires well run. The neighbour is not there to be judged: many old stoves are set to do this, to last through the night.',
    ),
    material: l('Un poêle ordinaire au ralenti, dans le décor', 'An ordinary stove on a slow burn, in the scenery'),
    specs: [
      sp(
        'Feu lent, par rapport au nominal',
        'Slow against nominal',
        l('pollution × 10, ordre de grandeur', 'pollution × 10, an order of magnitude'),
      ),
      sp('Couvant, mesuré : CO', 'Smouldering, measured: CO', l('× 3,5', '× 3.5')),
      sp('Couvant, mesuré : organiques', 'Smouldering, measured: organics', l('× 14', '× 14')),
      sp('Couvant, mesuré : particules', 'Smouldering, measured: particles', l('× 6', '× 6')),
    ],
    maintenance: maint(
      {
        failure:
          'Chez le voisin comme ici : un conduit qui s’encrasse vite, parce qu’un feu au ralenti dépose ce qu’un feu vif aurait brûlé. C’est de là que partent les feux de cheminée.',
        check:
          'La couleur de ce qui sort du chapeau, et sa durée : un repère de voisin de bonne foi, qui dit quelque chose de la fumée, et rien du monoxyde.',
        care: 'Du bois sec et un feu mené vif, quel que soit le poêle. Certaines vallées ont interdit les foyers ouverts : les règles locales sont dans le panneau Sources.',
      },
      {
        failure:
          'At the neighbour’s as here: a flue that fouls quickly, because a slow fire lays down what a lively one would have burnt. That is where chimney fires begin.',
        check:
          'The colour of what leaves the cap, and for how long: a good-faith neighbour’s mark, which tells something of the smoke and nothing of carbon monoxide.',
        care: 'Dry wood and a lively fire, whatever the stove. Some valleys have banned open fires: the local rules are in the Sources panel.',
      },
    ),
    tip: l(
      'Comparez ce chapeau au nôtre à plein feu : même bois, autre feu. La fumée du voisin est un décor, pas un calcul. Puis lancez le scénario du bois humide.',
      'Compare this cap with ours at full burn: the same wood, another fire. The neighbour’s smoke is scenery, not a calculation. Then run the wet-wood scenario.',
    ),
    design: lf(
      'Il est là pour la comparaison : pour que {oldFor90} % (résultat du modèle) soit un vrai poêle, pas une abstraction. Si votre ancien poêle ressemblait à celui-ci, vous pouvez réellement gagner gros en changeant la façon de brûler, avec ou sans cette machine.',
      'It stands there for the comparison: so that {oldFor90}% (model result) is a real stove, not an abstraction. If your old stove looks like this one, you really can gain a lot by changing the way of burning, with or without this machine.',
    ),
  },
];
