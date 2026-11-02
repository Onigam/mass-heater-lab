// Parts of the `fire-core` world (ids frozen in src/data/ids.ts): where it burns and which way it goes. No brick layout, no mix, no lighting procedure, and no inner dimension: the bore, the riser's height and the drum are the
// only sizes printed; a draft text's ratios appear as its words, attributed. The feed's opening has no source and decides most of the efficiency: `feed-tube` says so. The damper's absence is told on `feed-lid`.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const FIRE_CORE_PARTS: PartInfo[] = [
  {
    id: 'feed-tube',
    scene: 'fire-core',
    category: 'structure',
    name: l('Le tube d’alimentation', 'The feed tube'),
    short: l(
      'Le bois se tient debout, seul son pied brûle, et l’air du feu descend avec lui : ce passage décide de presque tout.',
      'The wood stands upright, only its foot burns, and the fire’s air goes down with it: this opening decides almost everything.',
    ),
    description: lf(
      'Voici la curiosité de cette machine : un tube vertical ouvert, à l’air libre, qui ne fume pas tant que le tirage tient. Le bois s’y tient debout, seul son pied brûle, et il descend à mesure : on n’a pas de porte, on a un rythme. Tout l’air du feu passe par là, avec une section à peu près celle du conduit de 200 mm. **Le passage laissé à cet air décide de l’essentiel du rendement, et aucune source ne le chiffre.** Le modèle le cache à {feedCover} % (estimation, d’après des images de vraies machines) : le rendement y est de {eta} %, avec {lambda} fois l’air nécessaire (résultat du modèle). Grand ouvert, le modèle tombe à {etaOpen} %, une chambre à peine chaude ; caché entre {coverLow} et {coverHigh} %, il donne de {etaLow} à {etaHigh} %. Près de {feedPaShare} % du tirage se perdent ici. Quand le tirage manque, ce tube renvoie de la fumée, et parfois des flammes, vers la personne qui le nourrit : ce geste-là ne se fait jamais sans surveillance.',
      'Here is the oddity of this machine: an open vertical tube, in the open air, that does not smoke as long as the draught holds. The wood stands up in it, only its foot burns, and it slides down as it goes: no door, just a rhythm. All the fire’s air passes here, through a section about that of the 200 mm duct. **The way left to this air decides most of the efficiency, and no source gives a figure for it.** The model hides it at {feedCover}% (estimate, from pictures of real machines): the efficiency there is {eta}%, with {lambda} times the air needed (model result). Wide open, the model falls to {etaOpen}%, a chamber barely hot; hidden at {coverLow} to {coverHigh}%, it gives {etaLow} to {etaHigh}%. Nearly {feedPaShare}% of the draught is lost here. When the draught fails, this tube sends smoke, and at times flames, back at the person feeding it: that gesture is never made unattended.',
    ),
    material: l('Brique réfractaire dense, dans la terre', 'Dense firebrick, set in earth'),
    specs: [
      sp(
        'Section',
        'Section',
        tf('derived', 'environ {section} m², celle du conduit', 'about {section} m², that of the duct'),
      ),
      sp('Part cachée', 'Share hidden', tf('estimate', '{feedCover} %, aucune source', '{feedCover}%, no source')),
      sp('Rendement, cette part', 'Efficiency, at this share', tf('model', '{eta} %', '{eta}%')),
      sp('Rendement, grand ouvert', 'Efficiency, wide open', tf('model', '{etaOpen} %', '{etaOpen}%')),
      sp(
        'Excès d’air',
        'Excess air',
        tf('model', '{lambda} fois, sans lecture réelle', '{lambda} times, with no real reading'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un retour de fumée à l’allumage, connu de tous les constructeurs qui en parlent, et que les critiques de ces machines placent au premier rang. Un bois qui se coince, puis s’éteint en laissant la chambre tiède, et un col de brique qui s’écaille à force de bûches.',
        check:
          'La flamme : elle doit se coucher vers le tunnel. Si la fumée remonte, c’est que le courant s’est retourné, et cela se lit aussi sur le thermomètre de fumée. L’œil ne juge jamais le monoxyde.',
        care: 'Reprendre le col quand il s’abîme. C’est une machine qu’on surveille pendant un feu : voilà son vrai entretien.',
      },
      {
        failure:
          'Smoke-back on lighting, known to every builder who writes about it, and put first by these machines’ critics. Wood that jams then goes out, leaving the chamber lukewarm, and a brick collar that chips under the logs.',
        check:
          'The flame: it has to lie towards the tunnel. If smoke climbs, the flow has turned round, and the flue thermometer shows it too. The eye never judges carbon monoxide.',
        care: 'Repair the collar when it wears. This is a machine you watch during a fire: that is its true care.',
      },
    ),
    tip: l(
      'Dans la Simulation, faites glisser « Part cachée du haut du tube » : aucun autre curseur ne change autant le rendement. Ce n’est pas un réglage à reproduire.',
      'In the Simulation, drag “Share of the feed’s top covered”: no other slider moves the efficiency as much. It is not a setting to copy.',
    ),
    design: lf(
      'Un seul chiffre de plus changerait ce labo : une lecture d’oxygène sur un tube en J stable. Sans elle, {lambda} fois l’air (résultat du modèle) reste une supposition, là où un foyer fermé bien mené se lit à 2 ou 3 fois. Un projet de texte pour une ville américaine demande que la cheminée interne fasse trois fois la hauteur de ce tube : ce sont ses mots, et pas une cote de construction.',
      'One more figure would change this lab: an oxygen reading on a steady J-tube. Without it, {lambda} times the air (model result) stays a supposition, where a closed box well run reads at 2 to 3 times. A draft text for one American city asks for the riser to be three times this tube’s height: its words, not a building dimension.',
    ),
  },
  {
    id: 'feed-lid',
    scene: 'fire-core',
    category: 'mechanical',
    name: l('Le couvercle', 'The feed lid'),
    short: l(
      'Pas une porte : un couvercle posé, qui limite l’air une fois le feu éteint. Il n’y a aucun clapet fermant sur cette machine, et voici pourquoi.',
      'Not a door: a lid laid on, that limits the air once the fire is out. There is no closing damper on this machine, and here is why.',
    ),
    description: lf(
      'Entre deux feux, un couvercle posé sur le tube empêche la maison de se refroidir par le conduit : le modèle sans lui passe de {eta} à {noLidEta} % (résultat du modèle). Il laisse encore passer un peu d’air, {lidLeak} % de la section (estimation). Ce n’est pas un clapet dans le conduit, et il n’y en a aucun ici : un projet de texte refuse tout ce qui obstrue le passage, un concepteur écrit qu’un clapet fermé sur des braises peut être très dangereux, et un manuel français parle du même risque de gaz toxique dans la maison. Le scénario le montre en chiffres. Fermé dix minutes après l’arrêt du bois : la valeur d’une heure de l’OMS est passée à {damperWhoMin} minutes, le détecteur sonne à {damperAlarmMin} minutes au plus tard, et le pic atteint {damperPeak} ppm à {damperPeakMin} minutes, en moyenne pour toute la maison (résultat du modèle). Fermé quarante minutes après : {damperLatePeak} ppm au plus haut, et aucune alarme obligée (résultat du modèle). Ce couvercle sur le tube n’est pas un clapet dans le conduit, mais la règle reste la même : pas sur des braises.',
      'Between two fires a lid on the tube keeps the house from cooling through the flue: without it the model goes from {eta} to {noLidEta}% (model result). It still lets a little air by, {lidLeak}% of the section (estimate). It is not a damper in the flue, and there is none here: a draft text rejects anything that obstructs the way, one designer writes that a damper shut on embers can be very dangerous, and a French manual speaks of the same risk of toxic gas in the house. The scenario shows it in numbers. Shut ten minutes after the wood stops: WHO’s one-hour value is passed at {damperWhoMin} minutes, the alarm sounds at {damperAlarmMin} minutes at the latest, and the peak reaches {damperPeak} ppm at {damperPeakMin} minutes, as a mean for the whole house (model result). Shut forty minutes after: {damperLatePeak} ppm at the highest, and no alarm required (model result). This lid on the feed is no damper in the flue, but the rule stays the same: not on embers.',
    ),
    material: l('Plaque d’acier ou de fonte, posée', 'A steel or cast-iron plate, laid on'),
    specs: [
      sp(
        'Ce qu’il laisse passer',
        'What it lets by',
        tf('estimate', '{lidLeak} % de la section', '{lidLeak}% of the section'),
      ),
      sp(
        'Sans lui après le feu',
        'Without it after the fire',
        tf('model', '{noLidEta} % de rendement', '{noLidEta}% efficiency'),
      ),
      sp('Clapet dans le conduit', 'Damper in the flue', l('aucun, sur cette machine', 'none, on this machine')),
      sp(
        'Clapet sur les braises, pic',
        'Damper on embers, peak',
        tf('model', '{damperPeak} ppm, en moyenne de maison', '{damperPeak} ppm, a whole-house mean'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le geste trop tôt. Un couvercle joue son rôle quand les braises sont mortes ; posé avant, il limite l’air d’une combustion en cours, et une braise mal alimentée fait davantage de monoxyde (résultat du modèle, sous forme d’indication).',
        check:
          'Regarder le lit de braises, jamais l’horloge : aucune durée sûre n’existe, et le modèle ne peut en donner aucune. Le détecteur reste en marche quoi qu’on en pense.',
        care: 'Le ranger près du tube, sur un support qui ne brûle pas. Il chauffe, et il n’est pas fait pour être manipulé à main nue.',
      },
      {
        failure:
          'The gesture made too soon. A lid does its job when the embers are dead; laid before that, it limits the air of a burn still going, and a starved ember makes more carbon monoxide (model result, as an indication).',
        check:
          'Look at the bed of embers, never the clock: no safe time exists, and the model can give none. The alarm stays on whatever you think.',
        care: 'Keep it by the feed, on a stand that does not burn. It gets hot, and it is not made to be handled bare-handed.',
      },
    ),
    tip: l(
      'Lancez « Un clapet fermé sur les braises » et lisez les chiffres, sans histoire ni image : ils suffisent.',
      'Run “A damper shut on embers” and read the numbers, with no story and no picture: they are enough.',
    ),
    design: l(
      'Un modèle revu par des pairs trouve qu’un clapet partiel peut améliorer le rendement, et notre modèle aussi : le gain vient de moins d’air. Mais un clapet n’a aucune raison de rester à la bonne position, et un mauvais soir se paie autrement que par un point de rendement. Un manuel français ferme plutôt l’arrivée d’air de son poêle à porte : une autre machine, et une autre réponse.',
      'A peer-reviewed model finds that a partial damper can improve efficiency, and so does ours: the gain comes from less air. But a damper has no reason to stay at the right position, and a bad evening is paid for otherwise than by one point of efficiency. A French manual closes the air inlet of its stove with a door instead: another machine, and another answer.',
    ),
  },
  {
    id: 'fuel-sticks',
    scene: 'fire-core',
    category: 'site',
    name: l('Les bûchettes', 'The sticks'),
    short: l(
      'Moins de 8 cm de côté, sèches : du bois naturel, rien d’autre. Elles glissent toutes seules à mesure que leur pied brûle.',
      'Under 8 cm across, dry: natural wood, nothing else. They slide down by themselves as their foot burns.',
    ),
    description: lf(
      'Un manuel français parle de moins de 8 cm de côté, et la norme européenne des poêles de masse, pour une autre classe de foyers, de 5 à 10 cm de côté et 25 à 50 cm de long. Une constructrice compte de 2,0 à 3,6 kg/h selon qu’on mène le feu tranquillement ou fort, soit de {burnKwLow} à {burnKwHigh} kW de feu (dérivé) ; le modèle prend {feedRate} kg/h (hypothèse), soit {fireKw} kW (résultat du modèle). Une charge pèse de {loadLow} à {loadHigh} kg (estimation). Les bûches debout laissent passer l’air, ce qui décide du tirage, et le modèle compte la moitié de la section libre, une estimation. Seul le bois naturel brûle ici : un bois peint ou traité, ou le carton qu’on voit parfois dans des films sur ces machines, change ce qui sort, et les règles suisses, par exemple, n’admettent que le bois naturel.',
      'A French manual speaks of under 8 cm across, and the European standard for masonry stoves, for another class of firebox, of 5 to 10 cm across and 25 to 50 cm long. One builder counts 2.0 to 3.6 kg/h depending on whether the fire runs quietly or hard, {burnKwLow} to {burnKwHigh} kW of fire (derived); the model takes {feedRate} kg/h (assumption), or {fireKw} kW (model result). A load weighs {loadLow} to {loadHigh} kg (estimate). Upright logs let the air through, which decides the draught, and the model counts half of the section as free, an estimate. Only natural wood burns here: painted or treated wood, or the cardboard sometimes seen in films of these machines, changes what comes out, and the Swiss rules, for one, allow natural wood alone.',
    ),
    material: l('Bois fendu, feuillus ou résineux, sec', 'Split wood, hardwood or softwood, dry'),
    specs: [
      sp('Section, un manuel français', 'Size, a French manual', l('moins de 8 cm de côté', 'under 8 cm across')),
      sp(
        'Rythme, une constructrice',
        'Pace, one builder',
        tf(
          'derived',
          '2,0 à 3,6 kg/h, {burnKwLow} à {burnKwHigh} kW',
          '2.0 to 3.6 kg/h, {burnKwLow} to {burnKwHigh} kW',
        ),
      ),
      sp('Rythme du modèle', 'The model’s pace', tf('assumed', '{feedRate} kg/h')),
      sp('Feu du modèle', 'The model’s fire', tf('model', '{fireKw} kW')),
      sp('Une charge', 'A load', tf('estimate', '{loadLow} à {loadHigh} kg', '{loadLow} to {loadHigh} kg')),
    ],
    maintenance: maint(
      {
        failure:
          'Des bûches qui se coincent en travers, un bois trop long qui dépasse du tube et brûle vers le haut, et un bois trop humide qui ne s’enflamme qu’à regret : la chambre reste tiède et la fumée finit moins bien de brûler.',
        check:
          'Le bois au passage dans le tube, et la flamme couchée. Une constructrice mesure aussi que le monoxyde remonte après les deux tiers d’une charge : le dernier tiers n’est pas égal au premier.',
        care: 'Du bois sec, fendu à la bonne taille à l’avance. Rien d’autre ne se rajoute dans ce tube : le mode d’emploi reste celui de son constructeur.',
      },
      {
        failure:
          'Logs jamming crossways, wood too long that sticks out of the tube and burns upwards, and wood too damp that catches only grudgingly: the chamber stays lukewarm and the smoke burns less completely.',
        check:
          'The wood as it passes down the tube, and the flame lying over. One builder also measures carbon monoxide climbing after two-thirds of a load: the last third is not like the first.',
        care: 'Dry wood, split to size in advance. Nothing else goes in this tube: the operating instructions remain its builder’s.',
      },
    ),
    tip: l(
      'Dans le foyer, faites jouer l’éclaté : le faisceau de bûchettes monte, et le chemin de l’air apparaît.',
      'In the core, use the exploded view: the sheaf of sticks lifts, and the path of the air appears.',
    ),
    design: lf(
      'Faire brûler le pied et pas le reste : c’est tout le principe. Du coup, le bois en attente reste froid, à côté d’une chambre à {chamber} °C (résultat du modèle). La séance est continue ; le modèle la traite comme un débit lissé, et une vraie séance respire à chaque charge.',
      'Burning the foot and not the rest is the whole principle. So the wood waiting stays cold, beside a chamber at {chamber} °C (model result). The session is continuous; the model treats it as a steady rate, and a real session breathes at each load.',
    ),
  },
  {
    id: 'burn-tunnel',
    scene: 'fire-core',
    category: 'structure',
    name: l('Le tunnel de feu', 'The burn tunnel'),
    short: lf(
      'La flamme se couche et file à l’horizontale : un feu pressé, à {chamber} °C en sortie de tunnel (résultat du modèle).',
      'The flame lies down and runs sideways: a fire in a hurry, at {chamber} °C at the end of the tunnel (model result).',
    ),
    description: lf(
      'C’est l’image qui rend cette machine célèbre, et une vraie image : le tirage couche la flamme et l’aspire à l’horizontale, sur environ {flameLen} m dans le modèle (résultat du modèle). Le tunnel est bas, en brique dense, et il a à peu près la section du tube. La chaleur doit y rester : une constructrice annonce une combustion propre de 540 à 815 °C dans la chambre. Le modèle lit une moyenne de gaz bien mélangé au pied de la cheminée interne : **{chamber} °C à {feedRate} kg/h (hypothèse), sous cette plage**, {chamberRocket} °C à 3,4 kg/h, {chamberFast} °C à 5 kg/h (résultat du modèle). Un thermocouple dans une flamme lirait plus. Le même calcul à la main donne environ {flameTwoAir} °C de flamme à deux fois l’air (résultat du modèle). Un projet de texte pour une ville américaine veut un tunnel d’au plus la moitié de la cheminée interne : ce sont ses mots. Sa longueur ne vous est pas donnée ici.',
      'This is the picture that made the machine famous, and a true one: the draught lays the flame down and sucks it sideways, over about {flameLen} m in the model (model result). The tunnel is low, in dense brick, with about the feed’s section. The heat has to stay inside: one builder reports a clean burn of 540 to 815 °C in the chamber. The model reads a mean of well-mixed gas at the riser’s foot: **{chamber} °C at {feedRate} kg/h (assumption), below that range**, {chamberRocket} °C at 3.4 kg/h, {chamberFast} °C at 5 kg/h (model result). A thermocouple in a flame would read higher. The same sum by hand gives about {flameTwoAir} °C of flame at twice the air (model result). A draft text for one American city wants a tunnel at most half the riser: its words. Its length is not given to you here.',
    ),
    material: l('Brique réfractaire dense, argile cuite', 'Dense firebrick, fired clay'),
    specs: [
      sp('Section', 'Section', tf('derived', 'environ {section} m²', 'about {section} m²')),
      sp('Propre, une constructrice', 'Clean, one builder', l('540 à 815 °C', '540 to 815 °C')),
      sp('Chambre, à 2,5 kg/h', 'Chamber, at 2.5 kg/h', tf('model', '{chamber} °C')),
      sp('Chambre, à 5 kg/h', 'Chamber, at 5 kg/h', tf('model', '{chamberFast} °C')),
      sp('Feu à plein régime', 'Fire at full rate', tf('model', '{fireKw} kW')),
    ],
    maintenance: maint(
      {
        failure:
          'Des briques qui s’écaillent et se fissurent sous le choc thermique, et un plancher qui se relève, surtout dans la zone où la flamme frappe : le passage rétrécit, et un morceau tombé gêne l’air. Une fissure vers la terre est une fuite.',
        check:
          'Une lampe dans le tube, à froid, au début de chaque saison, et le feu qui tire moins bien qu’avant à bois égal.',
        care: 'Refaire ce qui s’est écaillé. Un maçon de poêles sait reprendre un foyer : celui-ci a été conçu pour qu’on puisse le rouvrir.',
      },
      {
        failure:
          'Bricks spalling and cracking under thermal shock, and a floor lifting, above all where the flame strikes: the way narrows, and a fallen piece gets in the air’s way. A crack through to the earth is a leak.',
        check:
          'A torch in the tube, cold, at the start of each season, and a fire that draws worse than before on the same wood.',
        care: 'Redo what has spalled. A stove mason knows how to take a firebox in hand: this one was meant to be reopened.',
      },
    ),
    tip: l(
      'Mettez le **ralenti** et la **Coupe** : la flamme va de droite à gauche, et la fumée finit de brûler plus loin, dans la cheminée interne.',
      'Use **Slow-mo** and **Section**: the flame runs across, and the smoke finishes burning further on, in the riser.',
    ),
    design: lf(
      'Un feu qui file à l’horizontale n’est pas ce qu’on attend d’un poêle, et cela tient à une seule chose : la cheminée tire {chimneyPa} Pa (résultat du modèle) à l’autre bout d’un long chemin. Le tunnel n’a rien d’une tuyère : c’est un simple passage chaud, où l’air et le gaz se mélangent.',
      'A fire running sideways is not what you expect of a stove, and it comes down to one thing: the chimney pulling {chimneyPa} Pa (model result) at the far end of a long path. The tunnel is no nozzle: it is a plain hot passage, where air and gas mix.',
    ),
  },
  {
    id: 'ash-bed',
    scene: 'fire-core',
    category: 'site',
    name: l('Le lit de cendres', 'The ash bed'),
    short: lf(
      'Si peu de cendre, environ {ashDayG} g par jour (dérivé). Mais sous elle, des braises qui font encore du monoxyde après la flamme.',
      'So little ash, about {ashDayG} g a day (derived). But under it, embers still making carbon monoxide after the flame.',
    ),
    description: lf(
      'Trois lectures s’accordent sur l’ordre de grandeur des cendres, environ 0,7 à 1 % du bois. Sur notre journée, cela fait environ {ashDayG} g (dérivé) : une couche qui prend des semaines à gêner. Un excès rétrécit le passage de l’air à l’entrée du tunnel, avec un feu qui tire moins bien, et se balaye à froid. Le plus important est ce qui y reste après la flamme : le modèle compte {charShare} % de l’énergie du bois sous forme de charbon, qui brûle en une quarantaine de minutes ({charMin} min, estimation). **Ce moment sans flamme est le pire pour le monoxyde** : la bande du modèle y atteint {coEnd} ppm dans les fumées, contre {coLean} ppm à plein feu (résultat du modèle, une indication, et non une mesure). Tant que le conduit reste chaud et ouvert, ce gaz s’en va par la cheminée.',
      'Three readings agree on the order of magnitude of ash, some 0.7 to 1 % of the wood. Over our day that is about {ashDayG} g (derived): a layer that takes weeks to get in the way. Too much narrows the way of the air at the tunnel’s entry, with a fire that draws worse, and it is swept out cold. What matters most is what stays after the flame: the model counts {charShare}% of the wood’s energy as char, burning in about forty minutes ({charMin} min, estimate). **This flameless moment is the worst for carbon monoxide**: the model’s band reaches {coEnd} ppm in the gas there, against {coLean} ppm at full fire (model result, an indication and not a measurement). As long as the flue stays warm and open, that gas leaves by the chimney.',
    ),
    material: l('Cendres de bois, charbon de bois', 'Wood ash, charcoal'),
    specs: [
      sp('Cendres du bois', 'Ash of the wood', l('0,7 à 1 %, trois lectures', '0.7 to 1 %, three readings')),
      sp('Un jour', 'A day', tf('derived', 'environ {ashDayG} g', 'about {ashDayG} g')),
      sp(
        'Part qui brûle en braise',
        'Share burning as embers',
        tf('estimate', '{charShare} %, en {charMin} min', '{charShare}%, in {charMin} min'),
      ),
      sp(
        'CO, fin de feu',
        'CO, end of the fire',
        tf('model', 'vers {coEnd} ppm dans les fumées', 'about {coEnd} ppm in the gas'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le lit qui s’épaissit jusqu’à gêner l’air, ou l’habitude de vider une cendre encore vive. Un seau de plastique ou un sac, et la soirée change.',
        check:
          'Le niveau, à la lampe, à froid. Il n’y a pas de fréquence chiffrée : une habitude, et un coup d’œil à chaque feu.',
        care: 'Retirer à froid, dans le seau de métal, et le sortir aussitôt.',
      },
      {
        failure:
          'A bed that thickens until it hinders the air, or the habit of emptying ash still live. A plastic bucket or a bag, and the evening changes.',
        check: 'The level, by torch, when cold. There is no figure for how often: a habit, and a look at each fire.',
        care: 'Take it out cold, into the metal bucket, and take that outside at once.',
      },
    ),
    tip: l(
      'La section « Le monoxyde » de la Simulation montre le régime : faites glisser l’heure jusqu’après un feu, et regardez-le changer.',
      'The “Carbon monoxide” section of the Simulation shows the regime: drag the hour to just after a fire and watch it change.',
    ),
    design: lf(
      'Les chiffres de ce monoxyde viennent d’une carte encadrée par quelques lectures, avec une bande de un à neuf : {coLeanLow} à {coLeanHigh} ppm autour de {coLean} ppm à plein feu (résultat du modèle). C’est l’ordre des régimes qu’il faut retenir, pas la valeur : rien ici ne prédit les ppm d’un vrai foyer.',
      'These carbon monoxide figures come from a map bracketed by a few readings, with a band of one to nine: {coLeanLow} to {coLeanHigh} ppm around {coLean} ppm at full fire (model result). What counts is the order of the regimes, not the value: nothing here predicts the ppm of a real firebox.',
    ),
  },
  {
    id: 'heat-riser',
    scene: 'fire-core',
    category: 'structure',
    name: l('La cheminée interne', 'The heat riser'),
    short: l(
      'L’endroit le plus chaud de la maison, où la fumée finit de brûler. C’est son isolant qui fait ce feu propre, bien plus que son tirage.',
      'The hottest place in the house, where the smoke finishes burning. Its insulation is what makes this fire clean, far more than its draught.',
    ),
    description: lf(
      'Au bout du tunnel, les gaz montent dans un tube isolé jusque sous le couvercle du bidon. Un livre de référence, lu seulement dans un résumé, donne 0,84 m d’exemple dans une plage de 0,64 à 1,27 m, soit 33 pouces pour l’exemple. C’est ici que la fumée finit de brûler, à condition d’être chaude, d’avoir de l’air et du temps : c’est ce qui fait de cette machine autre chose qu’un poêle au ralenti. Un concepteur a mesuré jusqu’à 1 200 °C dans une cheminée de ce genre, sur son foyer fermé. Le modèle lit {riserTop} °C en haut à {feedRate} kg/h (hypothèse pour le débit, résultat du modèle). **Elle ne fait pas tirer la machine** : {riserPa} Pa à plein feu, que la chute dans le bidon reprend presque en entier, soit {netPa} Pa net (résultat du modèle). Un manuel français réconcilie les deux récits : elle compte surtout quand le poêle est froid.',
      'At the end of the tunnel the gases climb an insulated tube up to just under the drum’s lid. A reference book, read only in a digest, gives an example of 0.84 m within a range of 0.64 to 1.27 m, or 33 inches for the example. Here the smoke finishes burning, provided it is hot, with air and time: that is what makes this machine something other than a slow stove. One designer has measured up to 1,200 °C in a riser of this kind, on his closed box. The model reads {riserTop} °C at the top at {feedRate} kg/h (an assumption for the rate, model result). **It does not make the machine draw**: {riserPa} Pa at full fire, which the fall in the drum takes nearly all back, for {netPa} Pa net (model result). A French manual reconciles the two accounts: it matters mostly when the heater is cold.',
    ),
    material: l(
      'Tube intérieur isolé, Ø 200 mm, sans acier au contact des flammes',
      'Insulated inner tube, Ø 200 mm, no steel touching the flames',
    ),
    specs: [
      sp(
        'Hauteur, l’exemple d’un livre',
        'Height, a book’s example',
        l('0,84 m, lu dans un résumé', '0.84 m, read in a digest'),
      ),
      sp('Plage du même livre', 'The same book’s range', l('0,64 à 1,27 m', '0.64 to 1.27 m')),
      sp('Diamètre', 'Bore', l('200 mm', '200 mm')),
      sp('Son tirage, à plein feu', 'Its draught, at full fire', tf('model', '{riserPa} Pa', '{riserPa} Pa')),
      sp('Haut, à plein feu', 'Top, at full fire', tf('model', '{riserTop} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Un intérieur qui s’effrite ou se fissure, et l’isolant qui se tasse à l’usage. La machine perd alors ce qui la rendait propre, sans que rien se voie depuis la pièce. Un concepteur note que l’acier se corrode vite au-delà de 760 °C : ni tube ni tôle ne doivent la voir.',
        check:
          'Un soulèvement du bidon, rarement : une machine l’a montré à la caméra après trois hivers de cendres. Une chambre qui reste plus froide qu’avant à bois égal en dit autant.',
        care: 'Une fois ouverte, regarder tout ; refaire ce qui s’effrite. Ce n’est pas une pièce d’usure programmée : aucune source ne donne de durée de vie.',
      },
      {
        failure:
          'An inside that crumbles or cracks, and insulation slumping with use. The machine then loses what made it clean, with nothing to see from the room. One designer notes steel corrodes fast above 760 °C: neither tube nor sheet should meet that.',
        check:
          'A lift of the drum, rarely: one machine showed it to the camera after three winters of ash. A chamber colder than before on the same wood says as much.',
        care: 'Once open, look at everything; redo what crumbles. This is no part with a scheduled life: no source gives a service life.',
      },
    ),
    tip: l(
      'Le curseur « Hauteur de la cheminée interne » de la Simulation montre où va la chaleur : plus de bidon, moins de banc.',
      'The “Height of the riser” slider in the Simulation shows where the heat goes: more drum, less bench.',
    ),
    design: lf(
      'Une cheminée plus haute (1,27 m) donne {riserLongEta} % et plus basse (0,64 m) {riserShortEta} % (résultat du modèle) : elle déplace la chaleur vers le bidon davantage qu’elle n’en crée. Un constructeur de 15 ans en est venu au même avis : ce n’est pas le bidon qui pousse, mais la combustion et la vraie cheminée.',
      'A taller riser (1.27 m) gives {riserLongEta}% and a lower one (0.64 m) {riserShortEta}% (model result): it moves heat towards the drum more than it creates any. A builder of 15 years came to the same view: the drum is no push; the burn and the true chimney are.',
    ),
  },
  {
    id: 'riser-insulation',
    scene: 'fire-core',
    category: 'structure',
    name: l('L’isolant de la cheminée', 'Riser insulation'),
    short: l(
      'Il garde la cheminée interne brûlante, et c’est ce qui rend le feu propre. Trois matières possibles, dont les fiches des fabricants donnent les chiffres.',
      'It keeps the riser scorching, which is what makes the fire clean. Three possible materials, with figures from the makers’ sheets.',
    ),
    description: lf(
      'Trois matières pour un même travail. La brique réfractaire isolante d’un fabricant : 480 kg/m³, jusqu’à 1 260 °C, 0,14, 0,16 et 0,17 W/m·K à 400, 600 et 800 °C. Sa couverture de fibre à faible biopersistance : 128 kg/m³, jusqu’à 1 200 °C, 0,08, 0,12 et 0,18 W/m·K. La perlite : environ 0,078 W/m·K à 200 °C et 0,092 à 300 °C, une courbe calculée, sans valeur connue à 600 °C. Le modèle les essaie toutes les trois : **à un point de rendement l’une de l’autre** (résultat du modèle). Sa chemise à environ {sleevePeak} °C au plus chaud (résultat du modèle) montre l’essentiel : le bon choix se fait sur la tenue, le poids, la santé à la pose, plus que sur la conductivité. L’épaisseur n’est pas donnée ici, et pour cause : c’est une part du dimensionnement d’un foyer.',
      'Three materials for one job. One maker’s insulating firebrick: 480 kg/m³, up to 1,260 °C, 0.14, 0.16 and 0.17 W/m·K at 400, 600 and 800 °C. Its low-biopersistence fibre blanket: 128 kg/m³, up to 1,200 °C, 0.08, 0.12 and 0.18 W/m·K. Perlite: about 0.078 W/m·K at 200 °C and 0.092 at 300 °C, a calculated curve, with no known value at 600 °C. The model tries all three: **within a point of efficiency of each other** (model result). Its sleeve at about {sleevePeak} °C at the hottest (model result) shows what counts: the right choice rests on how it holds, its weight and health at fitting, more than on conductivity. Thickness is not given here, for good reason: it belongs to the sizing of a firebox.',
    ),
    material: l('Brique isolante, couverture de fibre ou perlite', 'Insulating firebrick, fibre blanket or perlite'),
    specs: [
      sp('Brique isolante', 'Insulating firebrick', l('480 kg/m³, 1 260 °C au plus', '480 kg/m³, 1,260 °C at most')),
      sp('Brique, à 600 °C', 'Firebrick, at 600 °C', l('0,16 W/m·K', '0.16 W/m·K')),
      sp('Fibre', 'Fibre', l('128 kg/m³, 1 200 °C au plus', '128 kg/m³, 1,200 °C at most')),
      sp('Fibre, à 600 °C', 'Fibre, at 600 °C', l('0,12 W/m·K', '0.12 W/m·K')),
      sp('Perlite, à 600 °C', 'Perlite, at 600 °C', l('aucune valeur trouvée', 'no value found')),
      sp('Choix, sur le rendement', 'Choice, on efficiency', tf('model', 'à un point près', 'within a point')),
    ],
    maintenance: maint(
      {
        failure:
          'Le tassement : une couverture ou un vrac qui descend laisse le haut de la cheminée sans isolant, et cette partie se refroidit. L’humidité d’une saison à l’arrêt lui fait perdre sa résistance.',
        check: 'À l’ouverture du bidon : l’œil sur la chemise, et le dessus de l’isolant. Rien à faire en service.',
        care: 'Le refaire, s’il a bougé. Une fibre se manipule avec les précautions de sa fiche : il en est question dans le guide de montage.',
      },
      {
        failure:
          'Slumping: a blanket or loose fill that drops leaves the riser’s top bare, and that part cools. The damp of a season idle weakens it.',
        check:
          'When the drum is opened: an eye on the sleeve, and the top of the insulation. Nothing to do in service.',
        care: 'Redo it if it has moved. Fibre is handled with the precautions of its data sheet: the assembly guide comes to that.',
      },
    ),
    tip: l(
      'Changez « Isolant de la cheminée interne » dans la Simulation : presque rien ne bouge. C’est une leçon : tous les chiffres ne se valent pas.',
      'Change “Insulation of the riser” in the Simulation: almost nothing moves. That is a lesson: not all figures are worth the same.',
    ),
    design: l(
      'Une fiche de fabricant vaut mieux qu’un souvenir de forum : c’est pour cela que ces chiffres sont là, et que celui de la perlite est marqué comme faible. La valeur à 600 °C, celle dont on a besoin, n’existe pas dans ce que nous avons trouvé.',
      'A maker’s data sheet is worth more than a memory from a forum: hence these figures, and the weak mark on perlite. The value at 600 °C, the one needed, does not exist in what we found.',
    ),
  },
  {
    id: 'riser-sleeve',
    scene: 'fire-core',
    category: 'mechanical',
    name: l('La chemise d’acier', 'The steel sleeve'),
    short: lf(
      'Elle tient l’isolant, à l’extérieur. L’acier se corrode vite au-delà de 760 °C : il reste donc du côté froid, vers {sleevePeak} °C (résultat du modèle).',
      'It holds the insulation, on the outside. Steel corrodes fast above 760 °C: so it stays on the cold side, around {sleevePeak} °C (model result).',
    ),
    description: lf(
      'L’isolant a besoin d’un contenant, et c’est une simple tôle : environ {sleeveWallMm} mm dans notre reconstitution (estimation). Un concepteur note que l’acier se corrode vite au-delà de 760 °C ; ici, l’isolant le garde bien en dessous, autour de {sleevePeak} °C au plus chaud, pendant que la couche intérieure de l’isolant monte à {linerPeak} °C (résultat du modèle, une moyenne de couche). Elle est aussi la paroi de chauffe intérieure de l’espace annulaire : les gaz qui descendent la lèchent d’un côté, et le bidon de l’autre. Si elle rouille, tout l’isolant part dans ce passage. Ses mesures ne sont pas publiées ici : elles dépendent de l’épaisseur d’isolant, et cette combinaison relève du calcul, pas de cette fiche.',
      'The insulation needs a container, and it is a mere sheet: about {sleeveWallMm} mm in our reconstruction (estimate). One designer notes that steel corrodes fast above 760 °C; here the insulation keeps it well below that, around {sleevePeak} °C at the hottest, while the inner layer of the insulation climbs to {linerPeak} °C (model result, a layer’s mean). It is also the inner heating wall of the annulus: the falling gases lick it on one side, and the drum on the other. If it rusts through, all the insulation falls into that way. Its dimensions are not printed here: they depend on the thickness of insulation, and that combination belongs to a calculation, not to this sheet.',
    ),
    material: l('Tôle d’acier doux roulée', 'Rolled mild steel sheet'),
    specs: [
      sp('Limite d’un concepteur', 'One designer’s limit', l('760 °C, corrosion rapide', '760 °C, fast corrosion')),
      sp('Au plus chaud', 'At its hottest', tf('model', '{sleevePeak} °C')),
      sp('Paroi dessinée', 'Drawn wall', tf('estimate', 'environ {sleeveWallMm} mm', 'about {sleeveWallMm} mm')),
    ],
    maintenance: maint(
      {
        failure:
          'La rouille du pied, qui reste dans la cendre, et une soudure ou une agrafe qui lâche. Une chemise percée fait tomber l’isolant et réduit le passage des gaz, et rien ne le signale depuis la pièce sinon un feu qui change.',
        check: 'À la levée du bidon, à la lampe, en cherchant la rouille et les bosses, surtout au pied.',
        care: 'La remplacer si elle est atteinte. Garder le pied au sec lors des arrêts longs.',
      },
      {
        failure:
          'Rust at the foot, which sits in the ash, and a weld or clip that gives way. A holed sleeve drops the insulation and narrows the gases’ way, with no sign from the room except a fire that changes.',
        check: 'When the drum is lifted, by torch, looking for rust and bulges, above all at the foot.',
        care: 'Replace it if it is affected. Keep the foot dry during long stops.',
      },
    ),
    tip: l(
      'Isolez la chemise en mode **Coupe** : on voit bien qu’elle ne voit pas la flamme.',
      'Isolate the sleeve in **Section** mode: you can see it never meets the flame.',
    ),
    design: l(
      'Un bon principe de foyer tient en peu de mots : ce qui voit la flamme ne rouille pas, et ce qui rouille ne voit pas la flamme. Une pièce mince, facile à remplacer, a sa place du bon côté de cette règle.',
      'A good principle of firebox design fits in few words: what sees the flame does not rust, and what rusts does not see the flame. A thin, easily replaced part belongs on the right side of that rule.',
    ),
  },
  {
    id: 'firebrick-base',
    scene: 'fire-core',
    category: 'structure',
    name: l('Le socle en briques', 'The firebrick base'),
    short: lf(
      'L’argile réfractaire là où se tient le feu : environ {brickKg} kg (estimation), dont la moyenne monte à {brickPeak} °C (résultat du modèle).',
      'Fireclay where the fire stands: about {brickKg} kg (estimate), whose mean climbs to {brickPeak} °C (model result).',
    ),
    description: lf(
      'Tout le foyer est posé sur cette base de brique dense, autour de laquelle viendra la terre. La norme européenne des poêles de masse donne pour l’argile réfractaire de 1 750 à 2 300 kg/m³ et de 0,90 à 1,35 W/m·K entre 20 et 400 °C ; le modèle prend {brickKg} kg et {casingKg} kg de terre autour, une estimation. Avec {brickPeak} °C de moyenne au plus chaud (résultat du modèle), ce n’est pas elle qui chauffe directement la maison : elle rend {coreKwLow} à {coreKwHigh} kW jour et nuit, avec la terre et le sol, et c’est elle qui garde la flamme chaude. Un texte américain sur les poêles de maçonnerie demande de la brique réfractaire et des joints pleins : ce texte ne décrit pas cette machine, mais le souci est commun. Ce labo ne donne aucun plan de pose : il ne s’agit pas de montrer où va chaque brique.',
      'The whole core sits on this base of dense brick, with the earth to come around it. The European standard for masonry stoves gives fireclay 1,750 to 2,300 kg/m³ and 0.90 to 1.35 W/m·K between 20 and 400 °C; the model takes {brickKg} kg, with {casingKg} kg of earth around it, an estimate. At {brickPeak} °C of mean at the hottest (model result), it is not what heats the house directly: it gives {coreKwLow} to {coreKwHigh} kW day and night, with the earth and the floor, and it is what keeps the flame hot. An American text on masonry heaters asks for firebrick and full joints: it does not describe this machine, but the concern is shared. This lab gives no laying plan: the point is not to show where each brick goes.',
    ),
    material: l('Argile réfractaire dense, posée sur la dalle', 'Dense fireclay, set on the slab'),
    specs: [
      sp('Masse volumique', 'Density', l('1 750 à 2 300 kg/m³', '1,750 to 2,300 kg/m³')),
      sp('Conductivité', 'Conductivity', l('0,90 à 1,35 W/m·K', '0.90 to 1.35 W/m·K')),
      sp('Masse', 'Mass', tf('estimate', 'environ {brickKg} kg', 'about {brickKg} kg')),
      sp('Moyenne au plus chaud', 'Mean at its hottest', tf('model', '{brickPeak} °C')),
      sp('Plan de pose', 'Laying plan', l('aucun, volontairement', 'none, on purpose')),
    ],
    maintenance: maint(
      {
        failure:
          'Le joint qui s’ouvre, et un fond de tunnel qui se soulève : le poids de la machine et le choc thermique travaillent ensemble. Sous une dalle qui tasse, la fissure traverse tout.',
        check:
          'À la lampe depuis le tube, à froid, au moins chaque saison. Une odeur de fumée dans la pièce quand rien d’autre n’a changé.',
        care: 'Reprendre les joints par un maçon de poêles. Un foyer fissuré ne se rebouche pas au mastic de magasin : il se reprend.',
      },
      {
        failure:
          'A joint that opens, and a tunnel floor that lifts: the weight of the machine and thermal shock work together. Under a settling slab the crack goes through everything.',
        check:
          'By torch from the feed, cold, at least each season. A smell of smoke in the room when nothing else has changed.',
        care: 'Have the joints taken up by a stove mason. A cracked firebox is not filled with shop sealant: it is rebuilt.',
      },
    ),
    tip: l(
      'Passez en éclaté : on voit qu’aucun des morceaux ne porte de cote de brique, et c’est voulu.',
      'Go to the exploded view: none of the pieces carries a brick dimension, on purpose.',
    ),
    design: l(
      'L’argile réfractaire a l’avantage d’être très connue : elle est dans les normes, chez les maçons de poêles. C’est la partie la moins exotique de la machine, et celle dont on peut demander l’avis à un professionnel sans qu’il soit surpris.',
      'Fireclay has the merit of being very well known: it is in the standards and with stove masons. It is the least exotic part of the machine, and one on which a professional’s opinion can be sought without surprising anyone.',
    ),
  },
  {
    id: 'core-casing',
    scene: 'fire-core',
    category: 'structure',
    name: l('L’enveloppe de terre', 'The earthen casing'),
    short: l(
      'La terre tient le foyer et le rend étanche : une fissure ici est une fuite, et le gaz est de l’autre côté.',
      'Earth holds the core and seals it: a crack here is a leak, and the gas is on the other side.',
    ),
    description: lf(
      'Le foyer est encoffré dans de la terre, environ {casingKg} kg dans notre estimation, avec la brique. Elle ne sert pas d’abord à stocker : elle maintient la brique et ferme le chemin des gaz. Le modèle l’amène à {casingPeak} °C au plus chaud (résultat du modèle) : elle ne rencontre donc pas ici la chaleur du foyer. La terre sèche et se rétracte, et le foyer se dilate à chaque feu : une fissure est le résultat normal d’un chantier normal, et l’on s’y attend, plutôt que de s’en étonner. Dans un chantier sérieux, on l’essaie à découvert avant de refermer quoi que ce soit, pour voir où la fumée passe. **Le modèle n’a ni fissure ni séchage** : la fuite d’une enveloppe de terre, personne n’en a publié la mesure.',
      'The core is boxed in earth, about {casingKg} kg by our estimate, with the brick. Its first job is not storing: it holds the brick and closes the gases’ path. The model brings it to {casingPeak} °C at the hottest (model result): so it does not meet the heat of the core here. Earth dries and shrinks, and the core expands at each fire: a crack is the normal outcome of a normal build, and it is expected, not a surprise. On a serious build it is tried uncovered before anything closes it, to see where smoke gets by. **The model has neither crack nor drying**: nobody has published a measurement of the leak of an earthen casing.',
    ),
    material: l('Terre argileuse, sans mélange indiqué ici', 'Clay earth, with no mix given here'),
    specs: [
      sp('Masse', 'Mass', tf('estimate', 'environ {casingKg} kg', 'about {casingKg} kg')),
      sp('Au plus chaud', 'At its hottest', tf('model', '{casingPeak} °C')),
      sp('Mélange', 'Mix', l('aucun donné, volontairement', 'none given, on purpose')),
    ],
    maintenance: maint(
      {
        failure:
          'La fissure : au séchage d’abord, puis à la chaleur, enfin parce que le sol tasse. Sous une pression négative elle ne se voit pas ; sur un retour de fumée, elle laisse passer du gaz.',
        check:
          'Sous une pression négative, ni la main ni l’œil ne voient une fuite. Un professionnel avec un analyseur, si l’on peut en obtenir un, et le suivi des fissures d’un mois à l’autre.',
        care: 'Reprendre l’enduit et la terre à froid, puis suivre la fissure au crayon. Une fissure qui revient au même endroit dit qu’il faut regarder en dessous.',
      },
      {
        failure:
          'The crack: in drying first, then under heat, and at last because the floor settles. Under suction it does not show; in a smoke-back it lets gas through.',
        check:
          'Under suction, neither hand nor eye sees a leak. A professional with an analyser, if one can be had, and the cracks followed from month to month.',
        care: 'Repair plaster and earth when cold, then follow the crack in pencil. A crack returning to the same place says to look beneath.',
      },
    ),
    tip: l(
      'Dans la 3D, passez la **Coupe** puis l’**éclaté** : la terre est le seul élément qui touche à la fois le foyer et l’air de la pièce.',
      'In the 3D, use **Section**, then **Explode**: the earth is the one element touching both the core and the room’s air.',
    ),
    design: l(
      'Voilà le point délicat de la terre : elle est bon marché et belle, et son étanchéité n’a pas de certificat. La question à poser à un professionnel commence ici, et une brique ou un conduit certifié n’en sont pas exempts.',
      'Here is earth’s delicate point: cheap and beautiful, its seal has no certificate. The question for a professional starts here, and certified brick or flue is not exempt from it.',
    ),
  },
  {
    id: 'top-gap',
    scene: 'fire-core',
    category: 'mechanical',
    name: l('L’espace sous le couvercle', 'The gap under the lid'),
    short: l(
      'Là où les gaz font demi-tour, entre le haut de la cheminée interne et le couvercle du bidon. Trop étroit, c’est toute la machine qui s’étrangle, selon un modèle publié.',
      'Where the gases turn around, between the riser’s top and the drum’s lid. Too narrow and the whole machine chokes, according to a published model.',
    ),
    description: lf(
      'Un livre de référence, lu dans un résumé, parle d’environ 2 pouces (environ 50 mm), une surface de paroi supérieure à la section du conduit : {gapArea} m² contre {section} m² (dérivé). Le seul article revu par des pairs, dont nous n’avons pu lire que le résumé, considère qu’un jeu trop faible menace le fonctionnement. **Notre modèle ne le retrouve pas** : à 1,5 cm, il reste à un point du cas de base (résultat du modèle), car la pression de vitesse est faible à ces débits. Soit notre modèle ne sait pas ce qu’un passage étroit fait à une flamme, soit le cas de l’article brûle bien plus fort : nous ne pouvons pas trancher sans lui. Ce résultat n’autorise personne à réduire quoi que ce soit, d’autant que ce jeu se remplit aussi de cendre.',
      'A reference book, read in a digest, speaks of about 2 inches (about 50 mm), a wall area greater than the duct’s section: {gapArea} m² against {section} m² (derived). The one peer-reviewed paper, of which we could read only the summary, finds that too small a clearance threatens the working. **Our model does not find this**: at 1.5 cm it stays within a point of the base case (model result), since the velocity head is small at these flows. Either our model does not know what a narrow gap does to a flame, or the paper’s case burns far harder: we cannot settle it without the paper. This result licenses nobody to reduce anything, all the more since this gap also fills with ash.',
    ),
    material: l('Rien : un volume libre, sous le couvercle du bidon', 'Nothing: free space, under the drum’s lid'),
    specs: [
      sp('Un livre, dans un résumé', 'A book, in a digest', l('environ 2 pouces', 'about 2 inches')),
      sp('Surface du passage', 'Area of the gap', tf('derived', '{gapArea} m²')),
      sp('Section du conduit', 'Section of the duct', tf('derived', '{section} m²')),
      sp('À 1,5 cm, modèle', 'At 1.5 cm, model', tf('model', 'à un point près', 'within a point')),
    ],
    maintenance: maint(
      {
        failure:
          'La cendre qui s’y dépose et réduit le passage, et un couvercle de bidon qui s’est affaissé. C’est le genre de panne qui ne se voit qu’en soulevant le bidon, et qu’annonce un feu qui change.',
        check:
          'À la levée du bidon : le niveau sur la chemise et sur le couvercle, et un dégagement régulier sur le pourtour.',
        care: 'Retirer la cendre quand on l’ouvre. Pas de raison de l’ouvrir chaque année sans autre signe : c’est un chantier à part entière.',
      },
      {
        failure:
          'Ash settling and narrowing the way, and a drum’s lid that has sagged. The kind of failure seen only by lifting the drum, announced by a fire that changes.',
        check: 'When the drum is lifted: the level on the sleeve and on the lid, and an even clearance all round.',
        care: 'Remove the ash when it is open. No reason to open it every year without another sign: it is a job in itself.',
      },
    ),
    tip: l(
      'Lancez « Un passage trop étroit », puis lisez ce qu’il change : presque rien dans ce modèle. Un constat sur le modèle, pas une permission.',
      'Run “Too narrow a gap”, then read what it changes: almost nothing in this model. A finding about the model, not a permission.',
    ),
    design: l(
      'Le désaccord est gardé dans ce catalogue exprès : un modèle qui ne retrouve pas une source n’est pas forcément juste. Le jour où l’article sera lu, cette fiche changera, et le modèle peut-être aussi.',
      'This disagreement is kept in the catalogue on purpose: a model that does not retrieve a source is not necessarily right. The day the paper is read, this sheet will change, and perhaps the model too.',
    ),
  },
  {
    id: 'downdraft-annulus',
    scene: 'fire-core',
    category: 'mechanical',
    name: l('La chute dans le bidon', 'The fall inside the drum'),
    short: lf(
      'Les gaz descendent en refroidissant, de {riserTop} à {afterDrum} °C à plein feu (résultat du modèle), et cèdent leur chaleur à l’acier.',
      'The gases fall as they cool, from {riserTop} to {afterDrum} °C at full fire (model result), giving their heat to the steel.',
    ),
    description: lf(
      'Autour de la chemise, entre elle et le bidon, l’anneau est le premier échangeur. Les gaz arrivent chauds en haut, autour de {riserTop} °C, et sortent en bas vers {afterDrum} °C à plein feu (résultat du modèle) : ils ont laissé là le gros de ce qu’ils portaient. Le modèle y met une convection forcée et naturelle ensemble, et le rayonnement de la chemise vers le bidon. Ce mouvement vers le bas coûte un peu de tirage, −{fallPa} Pa (résultat du modèle), que le calcul à la main donnait à −5,9 Pa (dérivé). On lit souvent qu’un bidon qui refroidit « aspire » le feu : le bilan montre que cet effet et celui de la cheminée interne s’annulent presque. La suction dans la machine vient surtout de la cheminée.',
      'Around the sleeve, between it and the drum, the annulus is the first exchanger. The gases come in hot at the top, around {riserTop} °C, and leave at the bottom near {afterDrum} °C at full fire (model result): they have left most of what they carried there. The model puts forced and natural convection together, plus radiation from the sleeve to the drum. This downward motion costs a little draught, −{fallPa} Pa (model result), which the hand sum gave as −5.9 Pa (derived). You often read that a cooling drum “sucks” the fire: the balance shows this effect and the riser’s nearly cancel out. The suction in the machine comes mostly from the chimney.',
    ),
    material: l('Rien : le volume entre la chemise et le bidon', 'Nothing: the space between sleeve and drum'),
    specs: [
      sp('Haut, à plein feu', 'Top, at full fire', tf('model', '{riserTop} °C')),
      sp('Bas, à plein feu', 'Bottom, at full fire', tf('model', '{afterDrum} °C')),
      sp('Effet sur le tirage', 'Effect on the draught', tf('model', '−{fallPa} Pa', '−{fallPa} Pa')),
      sp('Part du bois laissée ici', 'Share of the wood left here', tf('model', '{shareDrum} %', '{shareDrum}%')),
    ],
    maintenance: maint(
      {
        failure:
          'La cendre qui tombe au fond de l’anneau et réduit le passage du bas, là où il faut encore que les gaz trouvent le collecteur. Une machine a montré trois hivers de cendre, sans qu’elle bloque, et son bidon a été soulevé pour la retirer.',
        check:
          'Soulever le bidon de temps en temps, ou passer par le collecteur. Une sortie plus chaude qu’avant dit que l’échange se passe moins bien.',
        care: 'Retirer ce qui a volé. Rien d’autre : c’est un volume vide.',
      },
      {
        failure:
          'Ash dropping to the bottom of the annulus and narrowing the way, just where the gases still have to find the manifold. One machine showed three winters of ash, unblocked, and its drum was lifted to take it out.',
        check:
          'Lift the drum now and then, or go through the manifold. A hotter exit than before says the exchange is going worse.',
        care: 'Take out what has flown in. Nothing else: this is an empty volume.',
      },
    ),
    tip: l(
      'En **Coupe** et avec **Flux**, suivez un gaz du haut au bas de l’anneau : c’est la chute la plus lente de la machine.',
      'With **Section** and **Flows**, follow a gas from top to bottom of the annulus: the slowest fall in the machine.',
    ),
    design: lf(
      'Plus on laisse de chaleur ici, moins le banc en reçoit, et le partage dépend de l’air qui entre : la part du bidon va de {drumRangeLow} à {drumRangeHigh} % selon les réglages (résultat du modèle). Le bidon n’est donc pas un bonus : sa part se prend sur tout le reste.',
      'The more heat stays here the less the bench gets, and the split depends on the air coming in: the drum’s share runs from {drumRangeLow} to {drumRangeHigh}% with the settings (model result). So the drum is no bonus: its share comes out of all the rest.',
    ),
  },
  {
    id: 'drum-seal',
    scene: 'fire-core',
    category: 'mechanical',
    name: l('Le joint du couvercle', 'The lid seal'),
    short: lf(
      'Un joint de porte de poêle, ou la cendre elle-même sur une autre vraie machine. Sous lui, −{lidPa} Pa à plein feu (résultat du modèle) : assez, mais pas toujours.',
      'A stove-door gasket, or ash itself on another real machine. Under it, −{lidPa} Pa at full fire (model result): enough, but not always.',
    ),
    description: lf(
      'Le couvercle d’un bidon s’enlève. C’est ce qui le rend entretenable, et ce qui crée un joint à la hauteur de la tête. Une machine filmée à son treizième hiver s’en remet à la cendre : elle fume un peu après remontage, jusqu’à ce que la cendre tombe sur la bride et colmate la fuite ; d’autres constructeurs posent un joint de porte en fibre de verre. Le modèle lit −{lidPa} Pa à plein feu sous ce couvercle, et −{lidPaLow} Pa seulement sur une cheminée de {chimneyLow} m (résultat du modèle) : voilà pourquoi une cheminée basse menace. Le modèle compte {leakCm2} cm² de défaut à ce joint (estimation). Le calcul donne l’échelle, avec une pièce de 200 m³ à 0,5 volume par heure, tout étant supposé : 1 % du flux à 3 000 ppm fait {leak1} ppm, 5 % {leak5} ppm, 10 % {leak10} ppm (dérivé).',
      'A drum’s lid comes off. That makes it serviceable, and it creates a joint at head height. A machine filmed in its thirteenth winter trusts to ash: it smokes a little after refitting, until ash falls on the flange and plugs the leak; other builders fit a fibreglass door gasket. The model reads −{lidPa} Pa under this lid at full fire, and just −{lidPaLow} Pa on a {chimneyLow} m chimney (model result): that is why a low chimney is a threat. The model counts a {leakCm2} cm² flaw at this seal (estimate). The sum gives the scale, with a room of 200 m³ at 0.5 volume an hour, all of it assumed: 1 % of the flow at 3,000 ppm makes {leak1} ppm, 5 % {leak5} ppm, 10 % {leak10} ppm (derived).',
    ),
    material: l('Tresse de fibre de verre, joint de porte de poêle', 'Fibreglass braid, a stove-door gasket'),
    specs: [
      sp('Pression, à plein feu', 'Pressure, at full fire', tf('model', '−{lidPa} Pa', '−{lidPa} Pa')),
      sp('Sur une cheminée basse', 'On a low chimney', tf('model', '−{lidPaLow} Pa', '−{lidPaLow} Pa')),
      sp('Défaut supposé', 'Flaw assumed', tf('estimate', '{leakCm2} cm²')),
      sp(
        'Une fuite de 5 %',
        'A leak of 5 %',
        tf('derived', 'environ {leak5} ppm, échelle', 'about {leak5} ppm, a scale'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un joint cuit, durci, qui ne porte plus sur toute la bride : une fuite qui ne se sent qu’au moment où le tirage retombe ou se retourne, à l’heure où l’on est moins attentif. Après remontage, une odeur de fumée tient parfois à la seule mise en place.',
        check:
          'Le joint à l’œil, à chaque levée du bidon. Et un professionnel avec un analyseur, si l’on peut en obtenir un, car la main ne sent pas le monoxyde.',
        care: 'Le remplacer à chaque ouverture si besoin. Un bidon remonté se remet en route avec le détecteur en marche, et non pendant la nuit.',
      },
      {
        failure:
          'A baked, hardened gasket no longer bearing all round the flange: a leak that shows only when the draught falls or turns, at the hour you are least watchful. After refitting, a smell of smoke sometimes comes from the fitting alone.',
        check:
          'The gasket by eye, at each lift of the drum. And a professional with an analyser, if one can be had, since the hand cannot feel carbon monoxide.',
        care: 'Replace it at each opening if need be. A refitted drum goes back into service with the alarm on, and not overnight.',
      },
    ),
    tip: l(
      'Dans la Simulation, lisez la « Pression sous le couvercle du bidon » en passant de plein feu à fin de feu. Un chiffre positif voudrait dire qu’une fuite laisse sortir des fumées.',
      'In the Simulation, read “Pressure under the drum’s lid” as you go from full fire to the end of a fire. A positive figure would mean a leak lets gas out.',
    ),
    design: l(
      'Un joint ne tient pas un grand effort, et ce n’est pas son rôle : ce qui le protège, c’est la pression négative que tire la cheminée. La vraie sûreté n’est pas dans la tresse mais dans le fait que le chemin reste ouvert et tire.',
      'A seal cannot hold a great force, and that is not its job: what protects it is the suction the chimney draws. True safety is not in the braid but in the path staying open and pulling.',
    ),
    video: ['04:44'],
  },
  {
    id: 'drum-plinth',
    scene: 'fire-core',
    category: 'structure',
    name: l('Le pied du bidon', 'The drum’s foot'),
    short: l(
      'Là où l’acier rencontre la terre : un joint qui ne doit pas fuir, entre deux matières qui ne se dilatent pas de la même façon.',
      'Where steel meets earth: a joint that must not leak, between two materials that do not expand in the same way.',
    ),
    description: lf(
      'Notre bidon se pose sur un anneau noyé dans la terre, qui le porte et ferme le bas de la chute : c’est notre reconstitution d’après des images, car aucune source ne le dessine. Une paroi d’acier mince qui atteint environ {sidePeak} °C (résultat du modèle) rencontre ici ce qui bouge peu : elle se dilate, elle se rétracte, et le joint travaille à chaque feu. Une fuite à cet endroit se trouve juste à la hauteur du banc ; à plein feu, elle aspire de l’air ; lors d’un retour de fumée, elle laisse sortir du gaz. Le pied est aussi ce qu’on casse quand on soulève le bidon, et qu’on refait à la terre fraîche : c’est donc une pièce qui revient, et qui recommence à sécher à chaque fois.',
      'Our drum rests on a ring buried in the earth, which carries it and closes the bottom of the fall: our reconstruction from pictures, since no source draws it. A thin steel wall reaching about {sidePeak} °C (model result) meets here what hardly moves: it expands and shrinks, and the joint works at every fire. A leak at this point sits right at bench height; at full fire it sucks air in; in a smoke-back it lets gas out. The foot is also what gets broken when the drum is lifted and remade in fresh earth: so it is a part that comes back, drying all over again each time.',
    ),
    material: l(
      'Anneau maçonné dans la terre (notre reconstitution)',
      'A masonry ring in the earth (our reconstruction)',
    ),
    specs: [
      sp(
        'Paroi du bidon, au plus chaud',
        'Drum wall, at its hottest',
        tf('model', 'environ {sidePeak} °C', 'about {sidePeak} °C'),
      ),
      sp('Source', 'Source', l('notre reconstitution, d’après des images', 'our reconstruction, from pictures')),
      sp('Ce qu’il porte', 'What it carries', l('le bidon, environ 20 kg', 'the drum, about 20 kg')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fissure tout autour du bidon, une terre qui s’affaisse sous un côté, et la rouille du bas du bidon enfoui, que l’humidité de la terre fraîche accélère.',
        check:
          'Le bas du bidon, à la main et à l’œil, chaque saison, et après toute levée, avec un détecteur en marche pour les premiers feux qui suivent.',
        care: 'Refaire la terre à neuf quand elle part. Laisser sécher avant d’en demander beaucoup : la machine n’en est pas à une journée près.',
      },
      {
        failure:
          'A crack all round the drum, earth slumping under one side, and rust at the bottom of the buried drum, sped up by the damp of fresh earth.',
        check:
          'The foot of the drum, by hand and eye, each season, and after any lift, with an alarm on for the first fires that follow.',
        care: 'Redo the earth afresh when it goes. Let it dry before asking much of it: the machine can spare a day.',
      },
    ),
    tip: l(
      'Sur l’éclaté, ce pied reste en bas avec le socle : le bidon s’en va seul.',
      'In the exploded view this foot stays below with the base: the drum leaves on its own.',
    ),
    design: l(
      'Un joint d’acier et de terre n’a pas de solution parfaite. Il a une solution d’entretien : y revenir. C’est pour cela qu’aucune machine sérieuse ne le noie sans qu’on puisse le refaire.',
      'A joint of steel and earth has no perfect solution. It has a maintenance one: coming back to it. That is why no serious machine buries it beyond remaking.',
    ),
  },
];
