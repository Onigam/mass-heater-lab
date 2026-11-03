# Mass Heater Lab

An interactive 3D lab of a **J-tube rocket mass heater**: a fire lying down in a tunnel, a steel drum that heats at once, about 9 m of duct buried in about 3 t of earth, the bench, and a chimney, in the living room of a small insulated house. It asks the question its videos raise, how can two fires a day heat a house, and it answers: mostly by the house. **It explains; it gives no plan to build from.**

**▶ https://mass-heater-lab.vercel.app** · French and English · desktop, tablet and phone

It belongs to a series that started with [Pelton Lab](https://github.com/Onigam/pelton-lab), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit). The lab is being built: `public/lab.json` says `building` until the bar of the series is met and the owner has said yes.

## What is in it

- **Four 3D worlds**: the **house and its wood** (the insulated house at a forest's edge, the chimney above the ridge, a season's stack beside a day's basket, a neighbour's chimney that smokes), the **room** in section (the drum, the bench along two walls, the slab, the shield, the alarms, the stone wall, in thermal colours under a 24 h slider), the **core**, always cut (the feed, the burn tunnel, the riser, the fall inside the drum, with flame and gas following the model), and a **slice of bench** (the duct, the earth, the stones, the plaster, the tee, a pebble bench as the other school).
- **A catalogue of 56 parts**, each with a sheet: what it does, how it is made and sized overall, how it fails and is looked after, why it is designed that way. **Two guides**, tagged step by step as reported, usual practice or our reconstruction: how a mason raises it (20 steps) and what must be true before the first fire (10 steps), with no brick plan, no mix, no firing schedule.
- **Six lessons with twelve questions**, going through the simulation's twelve scenarios: the fire that goes sideways, smoke is fuel, where the heat goes, charge and give back, two fires for which house, carbon monoxide and the insurer.
- **A simulation** (a pure, unit-tested thermal model): the fire, the draught along the path in both directions, the bench's cross-section, the room and its house, four starting points and twelve scenarios.
- **Ten A3 explanatory sheets** generated from the same dimensions as the 3D model and from the model's results, with overall sizes only, each marked as not for construction.
- **A spoken guide** in both languages: the scripts in `narration/`, the audio in `public/audio/`, in a local voice.

## What is real and what is not

- **Efficiency: 78 % delivered to the house in the model, 82 % by a flue calculation, plausible range 65 to 88 %.** We found no independent laboratory test of a cob J-tube: the published figures above 80 % are flue calculations. **The feed's opening decides most of it, and no source gives it**: the model's value is an estimate.
- **« 80 to 90 % less wood » does not balance from the stove alone.** At 78 %, replacing a stove really running at 35 % saves 55 %; a 50 % stove, 36 %; a 72 % stove, 7 %. Reaching 85 % takes insulation.
- **The bench does not carry the house in this model.** The drum gives twice its heat, in bursts of nearly 4 kW; the bench gives 0.3 to 0.5 kW day and night. The seat moves from 24.9 to 32.0 °C and peaks one to two hours after the flame. The room moves from 17.3 to 24 °C, more than the one real account reports.
- **A « fire » on this machine is a tended session** of 2 to 4 hours, not a load and away. Literal two-load fires belong to closed boxes: a starting point of the simulation.
- **Carbon monoxide is a regime and a band of a factor of three each way**, an indicative map bracketed by a few readings, never a measurement of a real room. The scenarios show direction and order. **No model can say that an installation is safe.** There is no closing damper on this machine, and one scenario shows why, in numbers only.
- **An independent educational reconstruction of a class of machine**, nobody's product, with a generic house. Every figure is tagged reported, derived, model result, assumption or estimate. No footage, photo or drawing of any source is reused. The law and insurance are in the app's Sources panel, each line saying how it was reached, none checked by a lawyer: ask your insurer in writing, and a flue professional, before any project.

## Run it

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs; every push to `main` deploys to Vercel. `npm run kit:bump` moves to a newer lab-kit.

## Project layout

- `src/three/` the four worlds and `dims.ts`, the single source of dimensions; `src/sim/` the pure physics, with its thermal core; `src/data/` the parts, guides, lessons, sources and figures; `src/drawings/` the A3 sheets; `src/panels/` the simulation panel; `src/lab.ts` describes the lab to the kit.
- `docs/` research notes and sources, physics notes (what the model finds, figure by figure), data, drawings and lessons notes, requests to the kit; `BRIEF.md` is the brief the agent team works from.

Built with Three.js, TypeScript and Vite (MIT). Credits and links to the sources are in the app, in _Sources_.

---

## Français

Un labo 3D interactif d’un **poêle de masse à tube en J** (on dit aussi « rocket mass heater ») : un feu couché dans un tunnel, un bidon d’acier qui chauffe tout de suite, environ 9 m de conduit noyés dans environ 3 t de terre, la banquette, et une cheminée, dans la pièce à vivre d’une petite maison isolée. Il pose la question de ses vidéos, comment deux feux par jour peuvent-ils chauffer une maison, et il répond : surtout par la maison. **Il explique, il ne donne aucun plan pour construire.**

**▶ https://mass-heater-lab.vercel.app** · français et anglais · ordinateur, tablette et téléphone

Il fait partie d’une série commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), sur le même socle, [lab-kit](https://github.com/Onigam/lab-kit). Le labo est en construction : `public/lab.json` reste à `building` tant que le niveau de la série n’est pas atteint et que le propriétaire n’a pas dit oui.

**Ce qu’il contient.** Quatre mondes 3D (la maison et son bois, la pièce en coupe aux couleurs thermiques sous un curseur de 24 h, le foyer toujours coupé, une tranche de banquette) ; un catalogue de 56 pièces avec leur fiche ; deux guides, chaque étape marquée « rapporté », « pratique courante » ou « notre reconstitution » : comment un maçon l’élève (20 étapes) et ce qui doit être vrai avant le premier feu (10 étapes), sans plan de briques, sans mélange, sans programme de feu ; six leçons et douze questions, qui parcourent les douze scénarios de la simulation ; une simulation pure et testée ; dix planches A3 explicatives générées à partir des dimensions du modèle et de ses résultats, avec des cotes d’ensemble seulement, chacune marquée comme n’étant pas un plan de construction. Le guide parlé vient en dernier, une fois le labo vu par le propriétaire.

**Ce qui est réel et ce qui ne l’est pas.** Le rendement : 78 % rendus à la maison dans le modèle, 82 % par un calcul de fumées, plage plausible de 65 à 88 %. Nous n’avons trouvé aucun essai indépendant en laboratoire d’un tube en J en terre : les chiffres publiés au-dessus de 80 % sont des calculs de fumées, et **l’ouverture du tube, qui décide de l’essentiel, n’a aucune source**. **« 80 à 90 % de bois en moins » ne boucle pas avec le poêle seul** : à 78 %, remplacer un poêle qui tourne vraiment à 35 % économise 55 %, un poêle à 50 %, 36 %, un poêle à 72 %, 7 % ; atteindre 85 % demande d’isoler. **La banquette ne porte pas la maison dans ce modèle** : le bidon donne deux fois sa chaleur, par grands coups de près de 4 kW, elle 0,3 à 0,5 kW jour et nuit ; l’assise va de 24,9 à 32,0 °C et culmine une à deux heures après la flamme ; la pièce va de 17,3 à 24 °C. **Un « feu » est ici une séance menée de 2 à 4 heures**, pas une charge et un départ. **Le monoxyde est un régime et une bande d’un facteur trois dans chaque sens**, une carte indicative encadrée par quelques lectures, jamais la mesure d’une vraie pièce, et **aucun modèle ne peut dire qu’une installation est sûre**. Il n’y a aucun clapet fermant sur cette machine, et un scénario montre pourquoi, en chiffres seulement.

**Reconstitution pédagogique indépendante d’une classe de machines**, le produit de personne, dans une maison générique, sans aucune image reprise d’une source. Le droit et l’assurance sont dans le panneau Sources de l’application, chaque ligne disant comment nous l’avons atteinte, aucune vérifiée par un juriste : avant tout projet, votre assureur par écrit et un professionnel du conduit.

`npm install` puis `npm run dev` pour lancer en local ; chaque push sur `main` déploie sur Vercel. Les crédits et les liens vers les sources sont dans l’application, dans _Sources_.
