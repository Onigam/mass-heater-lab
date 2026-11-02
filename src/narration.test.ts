import { readManifest, validateManifest } from '@onigam/lab-kit/narration';
import { describe, expect, it } from 'vitest';
import { ASSUMED, DERIVED, MODEL } from './data/figures';
import { PART_CATEGORIES, WORLDS, partIds as partIdsOf, type WorldId } from './data/ids';
import { PANEL_STRINGS } from './panels/strings';
import { DEFAULT_TIME_SCALE } from './sim/presets';
import { SCENARIO_TEXTS } from './sim/texts';
import { WORLD } from './three';

// The spoken guide: the scripts (narration/<lang>.json) and the manifests generated from them (public/audio/<lang>) must agree with the lab's worlds, parts and modes, say
// each of the lab's truths once, and say today's figures. The audio files are only listed, never loaded.

const sceneIds: string[] = [...WORLDS];
const partIds: string[] = WORLDS.flatMap((w) => partIdsOf(w));
const worldOf = (partId: string): WorldId | undefined => WORLDS.find((w) => partId in PART_CATEGORIES[w]);

const CUE = /\[\[([a-z]+)(?::([^\]]*))?\]\]/g;
const BOOLEAN_CUES = ['xray', 'cutaway', 'flows', 'isolate'];
const MODES = ['explore', 'assembly', 'install', 'sim', 'plans', 'lessons'];
const CAMERA_CUES = ['home', 'scene', 'frame', 'select'];
/** Ceiling set by the owner for the spoken characters of one language. */
const BUDGET = 30_000;
/** What this lab's guide aims for: the brief says about 20,000 to 22,000. */
const AIM = [20_000, 22_500] as const;
/** generate.mjs refuses a longer segment. */
const SEGMENT_CAP = 2_500;
/** This lab's guide is in the local voice (generate.mjs --engine voicebox): a change of voice must be a decision, not an accident. */
const LOCAL_VOICE = 'qwen3-tts-1.7B';

interface Segment {
  id: string;
  scope: string;
  title: string;
  scene: string;
  text: string;
}
interface Script {
  lang: string;
  segments: Segment[];
}

const langOf = (path: string, folder: RegExp): string => folder.exec(path)![1]!;
const scripts = Object.fromEntries(
  Object.entries(
    import.meta.glob('../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
  ).map(([path, script]) => [langOf(path, /\/(\w+)\.json$/), script]),
);
const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [langOf(path, /\/audio\/(\w+)\//), raw],
  ),
);
const audioFiles = Object.keys(import.meta.glob('../public/audio/*/*.mp3'));

const spokenOf = (s: Pick<Segment, 'text'>): string => s.text.replace(CUE, '').replace(/\s+/g, ' ').trim();

/**
 * Each truth of the lab, said in one segment and no other (the owner, of the disclaimers: « à chaque fois c'est un peu chiant »).
 * Regular expressions per language; the segment is the only one allowed.
 */
const ONCE: Record<string, Record<string, [RegExp, string]>> = {
  fr: {
    reconstruction: [/reconstitution pédagogique/i, 'intro'],
    generic: [/générique/i, 'intro'],
    noPlan: [/aucun plan\b/i, 'intro'],
    figures: [/les chiffres viennent/i, 'intro'],
    calculations: [/des calculs, pas des mesures/i, 'intro'],
    delivered: [/soixante-dix-huit/i, 'intro'],
    noTest: [/essai indépendant/i, 'intro'],
    warning: [/(?<!\p{L})tu(?:er|e|ent)(?!\p{L})/iu, 'intro'],
    insurer: [/assureur/i, 'intro'],
    law: [/(?<!\p{L})la loi(?!\p{L})/iu, 'intro'],
    noModelSays: [/aucun modèle/i, 'intro'],
    safe: [/(?<!\p{L})sûres?(?!\p{L})/iu, 'intro'],
    session: [/deux à quatre heures/i, 'intro'],
    claim: [/quatre-vingts à quatre-vingt-dix/i, 'scene-homestead'],
    insulation: [/l’isolation fait l’essentiel/i, 'scene-homestead'],
    rocket: [/rocket/i, 'scene-homestead'],
    twice: [/deux fois plus de chaleur/i, 'scene-living-room'],
    aLittle: [/jour et nuit/i, 'scene-living-room'],
    notAlone: [/ne porte pas la maison/i, 'scene-living-room'],
    peak: [/une à deux heures après la flamme/i, 'scene-bench-section'],
    falseColour: [/fausse couleur/i, 'scene-bench-section'],
    noDamper: [/clapet/i, 'part-feed-lid'],
    whyNoDamper: [/fermé sur des braises/i, 'part-feed-lid'],
    leastSure: [/le chiffre le moins sûr/i, 'part-chimney-tee'],
    blanket: [/couverture sur le banc/i, 'part-cob-bench'],
  },
  en: {
    reconstruction: [/educational reconstruction/i, 'intro'],
    generic: [/\bgeneric\b/i, 'intro'],
    noPlan: [/\bno plan\b/i, 'intro'],
    figures: [/the figures come from/i, 'intro'],
    calculations: [/calculations, not measurements/i, 'intro'],
    delivered: [/seventy-eight/i, 'intro'],
    noTest: [/independent test/i, 'intro'],
    warning: [/\bkill/i, 'intro'],
    insurer: [/insurer/i, 'intro'],
    law: [/\bthe law\b/i, 'intro'],
    noModelSays: [/no model/i, 'intro'],
    safe: [/\bsafe\b/i, 'intro'],
    session: [/two to four hours/i, 'intro'],
    claim: [/eighty to ninety/i, 'scene-homestead'],
    insulation: [/insulation does most of it/i, 'scene-homestead'],
    rocket: [/rocket/i, 'scene-homestead'],
    twice: [/twice the bench’s heat/i, 'scene-living-room'],
    aLittle: [/day and night/i, 'scene-living-room'],
    notAlone: [/does not carry the house/i, 'scene-living-room'],
    peak: [/one to two hours after the flame/i, 'scene-bench-section'],
    falseColour: [/false colour/i, 'scene-bench-section'],
    noDamper: [/\bdampers?\b/i, 'part-feed-lid'],
    whyNoDamper: [/shut over embers/i, 'part-feed-lid'],
    leastSure: [/the least sure figure/i, 'part-chimney-tee'],
    blanket: [/blanket on the bench/i, 'part-cob-bench'],
  },
};

/** Never said, anywhere: the old reading of the peak (docs/physics.md, K56), a fire called clean, or a promise. */
const REFUSED: Record<string, RegExp> = {
  fr: /quatre à huit heures|feu propre|brûle proprement|sans danger|sans risque|en toute sécurité|non dangereu/i,
  en: /four to eight hours|clean fire|burns clean|without danger|without risk|no risk|\bsafely\b|harmless/i,
};

/** A figure of the simulation, as the voice rounds it, and where the voice says it: if the physics moves (as on 2/11/2026), this says which segments to rewrite. */
const FIGURES: [value: number, said: number, fr: RegExp, en: RegExp, id: string][] = [
  [MODEL.eta, 78, /soixante-dix-huit pour cent/, /seventy-eight per cent/, 'intro'],
  [ASSUMED.woodDay, 12.5, /douze kilos et demi/, /twelve and a half kilos/, 'scene-homestead'],
  [MODEL.woodLeaky, 36, /trente-six/, /thirty-six/, 'scene-homestead'],
  [MODEL.benchKwLow * 1000, 300, /trois à cinq cents watts/, /three to five hundred watts/, 'scene-living-room'],
  [MODEL.benchKwHigh * 1000, 500, /trois à cinq cents watts/, /three to five hundred watts/, 'scene-living-room'],
  [MODEL.roomLow, 17, /de dix-sept à/, /from seventeen to/, 'scene-living-room'],
  [MODEL.roomHigh, 24, /à vingt-quatre degrés/, /to twenty-four degrees/, 'scene-living-room'],
  [MODEL.netPa, 1, /un peu plus d’un pascal/, /just over one pascal/, 'scene-fire-core'],
  [MODEL.chimneyPa, 15, /près de quinze/, /nearly fifteen/, 'scene-fire-core'],
  [MODEL.earthDuct, 64, /soixante-quatre degrés/, /sixty-four degrees/, 'scene-bench-section'],
  [MODEL.seatHigh, 32, /trente-deux degrés/, /thirty-two degrees/, 'scene-bench-section'],
  [ASSUMED.houseH, 106, /cent six watts/, /a hundred and six watts/, 'part-house-shell'],
  [ASSUMED.leakyH, 300, /trois cents watts/, /three hundred watts/, 'part-house-shell'],
  [MODEL.leakyRoomLow, 6, /entre six et/, /between six and/, 'part-house-shell'],
  [MODEL.leakyRoomHigh, 14, /et quatorze degrés/, /and fourteen degrees/, 'part-house-shell'],
  [MODEL.exhaust, 80, /quatre-vingts degrés/, /eighty degrees/, 'part-chimney-cap'],
  [MODEL.airM3h, 46, /quarante-six mètres cubes/, /forty-six cubic metres/, 'part-outside-air-inlet'],
  [DERIVED.seasonTonnes, 2, /près de deux tonnes/, /nearly two tonnes/, 'part-cordwood-stack'],
  [MODEL.saved35, 55, /cinquante-cinq pour cent/, /fifty-five per cent/, 'part-coppice-lot'],
  [MODEL.saved72, 7, /sept seulement/, /only seven/, 'part-coppice-lot'],
  [MODEL.savedBoth, 85, /quatre-vingt-cinq/, /eighty-five/, 'part-coppice-lot'],
  [MODEL.kwhDrum, 22, /vingt-deux kilowattheures/, /twenty-two kilowatt-hours/, 'part-steel-drum'],
  [MODEL.lidPeak, 180, /cent quatre-vingts degrés/, /a hundred and eighty degrees/, 'part-steel-drum'],
  [MODEL.seatLow, 25, /de vingt-cinq à/, /from twenty-five to/, 'part-cob-bench'],
  [MODEL.seatAfter7, 28, /près de vingt-huit/, /nearly twenty-eight/, 'part-cob-bench'],
  [MODEL.roomAfter7, 18.5, /dix-huit et demi/, /eighteen and a half/, 'part-cob-bench'],
  [MODEL.afterDrum, 250, /deux cent cinquante degrés/, /two hundred and fifty degrees/, 'part-manifold'],
  [MODEL.chimney8Eta, 70, /soixante-dix pour cent/, /seventy per cent/, 'part-chimney-flue'],
  [MODEL.lowEta, 87, /quatre-vingt-sept/, /eighty-seven/, 'part-chimney-flue'],
  [MODEL.fanCoPeak, 63, /soixante-trois parties/, /sixty-three parts/, 'part-ventilation-grille'],
  [DERIVED.woodKwh, 52, /cinquante-deux kilowattheures/, /fifty-two kilowatt-hours/, 'part-wood-basket'],
  [MODEL.woodSnap, 24, /près de vingt-quatre kilos/, /nearly twenty-four kilos/, 'part-wood-basket'],
  [MODEL.etaFlue, 82, /quatre-vingt-deux pour cent/, /eighty-two per cent/, 'part-flue-thermometer'],
  [MODEL.etaFlue - MODEL.eta, 4, /quatre points/, /four points/, 'part-flue-thermometer'],
  [
    MODEL.stoneHigh - MODEL.stoneLow,
    1,
    /à peine plus d’un degré/,
    /barely more than a degree/,
    'part-inner-stone-wall',
  ],
  [MODEL.roomSwing, 7, /près de sept\./, /nearly seven\./, 'part-inner-stone-wall'],
  [MODEL.etaOpen, 52, /cinquante-deux pour cent/, /fifty-two per cent/, 'part-feed-tube'],
  [MODEL.etaHigh, 88, /quatre-vingt-huit/, /eighty-eight/, 'part-feed-tube'],
  [MODEL.damperWhoMin, 38, /trente-huit minutes/, /thirty-eight minutes/, 'part-feed-lid'],
  [MODEL.chamber, 467, /quatre cent soixante-sept/, /four hundred and sixty-seven/, 'part-burn-tunnel'],
  [MODEL.coEnd / MODEL.coLean, 9, /neuf fois/, /nine times/, 'part-ash-bed'],
  [MODEL.riserTop, 460, /quatre cent soixante degrés/, /four hundred and sixty degrees/, 'part-downdraft-annulus'],
  [MODEL.shareDrum, 38, /trente-huit pour cent/, /thirty-eight per cent/, 'part-downdraft-annulus'],
  [MODEL.lidPa, 9, /près de neuf pascals/, /nearly nine pascals/, 'part-drum-seal'],
  [MODEL.hotRunShare, 42, /quarante-deux pour cent/, /forty-two per cent/, 'part-duct-hot-run'],
  [MODEL.filmLowEta, 69, /soixante-neuf/, /sixty-nine/, 'part-duct-hot-run'],
  [MODEL.filmHighEta, 85, /quatre-vingt-cinq pour cent/, /eighty-five per cent/, 'part-duct-hot-run'],
  [MODEL.longExhaust, 34, /trente-quatre degrés/, /thirty-four degrees/, 'part-duct-cold-run'],
  [MODEL.longWater * 1000, 400, /quatre cents grammes/, /four hundred grams/, 'part-condensate-drain'],
  [MODEL.turnMin, 3, /trois minutes/, /three minutes/, 'part-chimney-tee'],
  [MODEL.pebbleSeat, 36, /trente-six degrés/, /thirty-six degrees/, 'part-pebble-section'],
];

describe('narration wiring', () => {
  // the lab asks for the manifests only once the audio is generated
  it.skipIf(Object.keys(manifests).length === 0)('asks for the manifest of the interface language', async () => {
    const { lab } = await import('./lab');
    expect(lab.narration?.manifest).toBe('audio/{lang}/manifest.json');
  });
});

describe('the contract', () => {
  it('has 4 worlds and 56 parts, so 61 segments per language, in French and in English', () => {
    expect(sceneIds).toHaveLength(4);
    expect(partIds).toHaveLength(56);
    expect(Object.keys(scripts).sort()).toEqual(['en', 'fr']);
    for (const lang of Object.keys(scripts)) expect(scripts[lang]!.segments, lang).toHaveLength(1 + 4 + 56);
  });
});

describe.each(Object.keys(scripts))('narration script %s', (lang) => {
  const script = scripts[lang]!;
  const seg = (id: string): Segment => script.segments.find((s) => s.id === id)!;
  const where = (re: RegExp): string[] => script.segments.filter((s) => re.test(spokenOf(s))).map((s) => s.id);

  it('has the lab language and a segment for the intro, every world and every part, once each', () => {
    expect(script.lang).toBe(lang);
    const scopes = script.segments.map((s) => s.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(new Set(script.segments.map((s) => s.id)).size).toBe(script.segments.length);
    expect(scopes).toEqual(['intro', ...sceneIds.map((id) => `scene:${id}`), ...partIds.map((id) => `part:${id}`)]);
  });

  it('names its segments intro, scene-<world> and part-<id>, with a title and the voice label', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      expect(s.id, s.scope).toBe(kind === 'intro' ? 'intro' : `${kind === 'part' ? 'part' : 'scene'}-${id}`);
      expect(s.title.trim().length, s.id).toBeGreaterThan(2);
      expect(s.title, s.id).not.toMatch(/\d/);
      expect(spokenOf(s).length, s.id).toBeGreaterThan(200);
    }
    expect(script).toHaveProperty('voiceLabel.fr', 'Voix de synthèse');
    expect(script).toHaveProperty('voiceLabel.en', 'Synthetic voice');
  });

  it('starts every segment in the right world', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      const expected = kind === 'part' ? worldOf(id) : kind === 'scene' ? id : 'homestead';
      expect(s.scene, s.id).toBe(expected);
    }
  });

  it('writes only cues the app knows, on worlds, parts and modes of the lab', () => {
    for (const s of script.segments) {
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        const at = `${s.id}: [[${name}${arg ? ':' + arg : ''}]]`;
        if (name === 'home') expect(arg, at).toBe('');
        else if (name === 'scene') expect(sceneIds, at).toContain(arg);
        else if (name === 'frame') for (const id of arg.split(',')) expect(partIds, at).toContain(id);
        else if (name === 'select') expect([...partIds, 'none'], at).toContain(arg);
        else if (name === 'explode') {
          expect(Number(arg), at).toBeGreaterThanOrEqual(0);
          expect(Number(arg), at).toBeLessThanOrEqual(1);
        } else if (BOOLEAN_CUES.includes(name)) expect(['on', 'off'], at).toContain(arg);
        else if (name === 'mode') expect(MODES, at).toContain(arg);
        // no `lab:` cue: src/lab.ts defines no narration.onCue, so the voice cannot switch the thermal view (README)
        else expect.fail(`${at}: unknown cue`);
      }
    }
  });

  it('frames only parts of the current world and switches off what it switches on', () => {
    for (const s of script.segments) {
      let world = s.scene;
      const on = new Set<string>();
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg;
        if (name === 'frame') for (const id of arg.split(',')) expect(worldOf(id), `${s.id}: frame ${id}`).toBe(world);
        if (name === 'select' && arg !== 'none') expect(worldOf(arg), `${s.id}: select ${arg}`).toBe(world);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
      }
      expect([...on], `${s.id} leaves cues on`).toEqual([]);
    }
  });

  it('uses only the tools of the world it is in (src/three/index.ts): the section, the X-ray, nothing in the landscape', () => {
    for (const s of script.segments) {
      let world = s.scene as WorldId;
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg as WorldId;
        if (name === 'cutaway' && arg === 'on') expect(WORLD[world].cutaway, `${s.id}: section in ${world}`).toBe(true);
        if (name === 'xray' && arg === 'on')
          expect('xrayShell' in WORLD[world], `${s.id}: X-ray in ${world}`).toBe(true);
        if (name === 'explode' && Number(arg) > 0)
          expect(world, `${s.id}: explode in the landscape`).not.toBe('homestead');
        if (name === 'isolate' && arg === 'on') expect(s.scope, `${s.id}: isolate needs a selection`).toMatch(/^part:/);
      }
    }
  });

  it('keeps a part segment framed by itself: no camera cue, no change of world or mode', () => {
    for (const s of script.segments.filter((x) => x.scope.startsWith('part:'))) {
      const camera = [...s.text.matchAll(CUE)].filter((m) => CAMERA_CUES.includes(m[1] ?? '') || m[1] === 'mode');
      expect(
        camera.map((m) => m[0]),
        s.id,
      ).toEqual([]);
    }
  });

  it('moves the camera at most once every 35 spoken characters', () => {
    for (const s of script.segments) {
      let last: { at: number; cue: string } | undefined;
      for (const m of s.text.matchAll(CUE)) {
        if (!CAMERA_CUES.includes(m[1] ?? '')) continue;
        const at = spokenOf({ text: s.text.slice(0, m.index) }).length;
        if (last) expect(at - last.at, `${s.id}: ${last.cue} then ${m[0]}`).toBeGreaterThanOrEqual(35);
        last = { at, cue: m[0] };
      }
    }
  });

  it('hops through the worlds and the modes in the introduction, and ends on the house, nothing selected', () => {
    const cues = [...seg('intro').text.matchAll(CUE)].map((m) => m[0]);
    for (const w of sceneIds) if (w !== 'homestead') expect(cues, w).toContain(`[[scene:${w}]]`);
    const modes = cues.filter((c) => c.startsWith('[[mode:'));
    expect(modes).toEqual(['assembly', 'install', 'sim', 'lessons', 'plans', 'explore'].map((m) => `[[mode:${m}]]`));
    expect(cues.slice(-2)).toEqual(['[[scene:homestead]]', '[[select:none]]']);
  });

  it('gives each world a home view first and walks through its parts', () => {
    for (const w of sceneIds) {
      const text = seg(`scene-${w}`).text;
      expect(text.startsWith('[[home]]'), w).toBe(true);
      const framed = new Set([...text.matchAll(/\[\[frame:([^\]]*)\]\]/g)].flatMap((m) => m[1]!.split(',')));
      expect(framed.size, `${w} frames at least 5 parts`).toBeGreaterThanOrEqual(5);
    }
  });

  it('carries each truth of the lab once, in its place, and never again', () => {
    for (const [truth, [re, id]] of Object.entries(ONCE[lang]!)) expect(where(re), truth).toEqual([id]);
  });

  it('never says the old reading of the peak, a fire called clean, or a promise', () => {
    expect(where(REFUSED[lang]!)).toEqual([]);
  });

  it('says only today’s figures of the simulation', () => {
    expect(DEFAULT_TIME_SCALE, 'the voice says « an hour passes here every second »').toBe(3600);
    const i = lang === 'fr' ? 2 : 3;
    for (const row of FIGURES) {
      const [value, said] = row;
      const re = row[i] as RegExp;
      expect(Math.abs(value - said), `${re} against ${value}`).toBeLessThanOrEqual(Math.max(0.5, said * 0.01));
      expect(where(re), String(re)).toContain(row[4]);
    }
  });

  it('never says a measurement it does not have: the word only denies one, or asks for one', () => {
    const measured = { fr: /(?<!à )mesur/i, en: /measur/i }[lang as 'fr' | 'en'];
    expect(where(measured)).toEqual(['intro', 'part-duct-hot-run', 'part-stone-filler', 'part-temperature-lance']);
  });

  it('does not hang a hedge on every figure', () => {
    const inTheModel = { fr: /dans le modèle/i, en: /in the model/i }[lang as 'fr' | 'en'];
    expect(where(inTheModel)).toEqual([]);
    const ours = {
      fr: /notre (modèle|calcul|simulation|scénario|estimation)|le modèle/i,
      en: /our (model|calculation|simulation|scenario|estimate)|the model/i,
    }[lang as 'fr' | 'en'];
    expect(where(ours).length).toBeLessThanOrEqual(14);
  });

  it('points to the controls the lab really has: the thermal view, the scenario of the cold flue', () => {
    const i = lang === 'fr' ? 0 : 1;
    const thermal = PANEL_STRINGS.thermalLabel![i];
    expect(where(new RegExp(thermal))).toEqual(['intro', 'scene-living-room', 'part-cob-bench']);
    expect(where(new RegExp(SCENARIO_TEXTS['cold-start'].name[i]))).toEqual(['scene-fire-core']);
  });

  it('follows one breath of cold air through the machine, from the intro to the chimney', () => {
    const breath = { fr: /souffle/i, en: /breath of/i }[lang as 'fr' | 'en'];
    const heard = where(breath);
    for (const id of ['intro', 'part-feed-tube', 'part-heat-riser', 'part-downdraft-annulus', 'part-duct-cold-run'])
      expect(heard, id).toContain(id);
    expect(heard).toContain('part-chimney-cap');
  });

  it('is anonymous: no person, channel, company, brand, institution or series, in a text or a title', () => {
    const names =
      /wheaton|\berica\b|\bernie\b|wisner|van den berg|schumack|\bevans\b|\bjackson\b|oxalis|perkins|rubino|tidwell|chernov|moshier|solid rock|\bmorgan\b|superwool|liberator|poujoulat|cr[ée]dit agricole|portland|oregon|montana|okanagan|youtube|broaudio|permaculture|permies|\btesto\b|batchrocket|kulmala|tissari|goodhew|haddad|aprovecho|wikipedia|\bofev\b|\baeai\b|\bademe\b|\bastm\b|\bengie\b|[ée]cohabitation|akinjiola|joueur irl|conseils thermiques|masonry heater association|\boms\b|organisation mondiale|world health|gen[èe]v|pelton|il était une fois|once upon a time|maestro/i;
    for (const s of script.segments) {
      expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(names);
      expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(/\bWHO\b/);
    }
  });

  it('is spoken text: no digit, symbol, abbreviation or straight quote, one space, no markdown', () => {
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      expect(spoken, s.id).not.toMatch(/[*≈×Ø″%°²³_#<>/\\|†«»]|\d/);
      expect(spoken, s.id).not.toMatch(/\b(kWh|Wh|kW|kN|Pa|ppm|CO|CO2|mm|cm|km|kg|etc)\b/);
      expect(spoken, s.id).not.toMatch(/['"]/);
      // a cue stands between two spaces (or at an edge), so that taking it out never glues two words together
      expect(s.text, s.id).not.toMatch(/ {2}|\n|^\s|\s$|\S\[\[|\]\]\S/);
      expect(spoken, s.id).not.toMatch(/\.\.(?!\.)|\.{3}/);
    }
  });

  it('keeps the sentences short enough for the subtitles', () => {
    let over120 = 0;
    for (const s of script.segments) {
      for (const sentence of spokenOf(s).split(/(?<=[.!?…])\s+/)) {
        expect(sentence.length, `${s.id}: ${sentence.slice(0, 60)}`).toBeLessThanOrEqual(135);
        if (sentence.length > 120) over120++;
      }
    }
    expect(over120).toBeLessThanOrEqual(2);
  });

  it('marvels without gushing, and asks questions: exclamations and questions as in the style page', () => {
    const all = script.segments.map(spokenOf).join(' ');
    const per1000 = (re: RegExp): number => ((all.match(re) ?? []).length / all.length) * 1000;
    expect(per1000(/!/g)).toBeGreaterThanOrEqual(0.5);
    expect(per1000(/!/g)).toBeLessThanOrEqual(1);
    expect(per1000(/\?/g)).toBeGreaterThanOrEqual(0.25);
    expect(per1000(/\?/g)).toBeLessThanOrEqual(0.6);
    // the same joke is not served twice
    const once = { fr: /héros de cette histoire|pas de thé/gi, en: /hero of this story|no tea/gi }[lang as 'fr' | 'en'];
    expect((all.match(once) ?? []).length).toBe(2);
  });

  it('speaks to the listener the way the series does: "vous", "on", never "tu"', () => {
    if (lang !== 'fr') return;
    const tu = /(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(tu);
  });

  it('writes British English', () => {
    if (lang !== 'en') return;
    for (const s of script.segments)
      expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(
        /\b(color\w*|center\w*|liter\w*|fiber\w*|neighbor\w*|gray|meters|kilometers|centimeters|millimeters|draft\w*|smolder\w*|depressurizes?|labor)\b/i,
      );
  });

  it('stays within the budget, the aim and what the generator accepts', () => {
    const lengths = script.segments.map((s) => spokenOf(s).length);
    const total = lengths.reduce((n, l) => n + l, 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
    expect(total).toBeGreaterThanOrEqual(AIM[0]);
    expect(total).toBeLessThanOrEqual(AIM[1]);
    expect(Math.max(...lengths)).toBeLessThanOrEqual(SEGMENT_CAP);
  });
});

describe.each(Object.keys(manifests))('narration audio %s', (lang) => {
  const { manifest, problems } = readManifest(manifests[lang]);

  it('is a usable manifest that agrees with the lab, in the local voice', () => {
    expect(problems).toEqual([]);
    expect(manifest).not.toBeNull();
    expect(validateManifest(manifest!, { scenes: sceneIds, parts: partIds })).toEqual([]);
    expect((manifests[lang] as { model?: string }).model).toBe(LOCAL_VOICE);
  });

  it('has an audio file for every segment and none without a segment', () => {
    const files = audioFiles.filter((f) => f.includes(`/audio/${lang}/`)).map((f) => f.split('/').pop());
    expect(files.sort()).toEqual(manifest!.segments.map((s) => s.file).sort());
  });

  it('is the audio of the script of the same language', () => {
    const script = scripts[lang];
    if (!script) return;
    expect(manifest!.segments.map((s) => s.id).sort()).toEqual(script.segments.map((s) => s.id).sort());
  });
});

describe('the private transcripts', () => {
  // Transcripts of third-party videos stay private, in ~/.cache/lab-review/research/mass-heater-lab/. When they are present, no run of seven words of a script may be copied from
  // them (they only serve to check facts). Absent in CI: skipped. They are in English and in French, so both scripts are held to them.
  const words = (t: string): string[] =>
    t
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-zàâäçéèêëîïôöùûüÿœ0-9' ]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const grams = (w: string[], n: number): string[] =>
    Array.from({ length: Math.max(0, w.length - n + 1) }, (_, i) => w.slice(i, i + n).join(' '));
  /** Only what was said: no WebVTT or SubRip header, no timing line, no inline tag, and rolling captions counted once. */
  const captions = (raw: string): string =>
    raw
      .split('\n')
      .filter((line) => !/^WEBVTT|^Kind:|^Language:|-->|^\d+$/.test(line.trim()))
      .map((line) => line.replace(/<[^>]*>/g, '').trim())
      .filter((line, i, all) => line && line !== all[i - 1])
      .join(' ');
  /** The cache is outside the repository, so it is read at run time; this repo has no Node types, hence the narrow one here. */
  interface Files {
    existsSync(path: string): boolean;
    readdirSync(path: string): string[];
    readFileSync(path: string, encoding: 'utf8'): string;
  }
  const inCache = async (): Promise<string[]> => {
    const home = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env.HOME;
    if (!home) return [];
    const fs = (await import(/* @vite-ignore */ `node:${'fs'}`)) as Files;
    const dir = `${home}/.cache/lab-review/research/mass-heater-lab`;
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(srt|vtt|txt|description)$/.test(f))
      .map((f) => fs.readFileSync(`${dir}/${f}`, 'utf8'));
  };

  it('copies no seven-word run of the captions', async (ctx) => {
    const transcripts = await inCache();
    if (transcripts.length === 0) ctx.skip();
    const source = new Set(transcripts.flatMap((t) => grams(words(captions(t)), 7)));
    const copied = Object.entries(scripts).flatMap(([lang, script]) =>
      script.segments.flatMap((s) =>
        grams(words(spokenOf(s)), 7)
          .filter((g) => source.has(g))
          .map((g) => `${lang}/${s.id}: "${g}"`),
      ),
    );
    expect(copied).toEqual([]);
  });
});

describe('narration scripts agree between languages', () => {
  const cues = (text: string) => [...text.matchAll(CUE)].map((m) => m[0]);

  it('have the same segments and the same cues in the same order', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    expect(en.segments.map((s) => [s.id, s.scope, s.scene])).toEqual(fr.segments.map((s) => [s.id, s.scope, s.scene]));
    for (const s of fr.segments) expect(cues(en.segments.find((x) => x.id === s.id)!.text), s.id).toEqual(cues(s.text));
  });

  it('put the cues at the same place in the sentence (within a tenth of the segment)', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    const share = (s: Segment): number[] => {
      const total = spokenOf(s).length || 1;
      return [...s.text.matchAll(CUE)].map((m) => spokenOf({ text: s.text.slice(0, m.index) }).length / total);
    };
    for (const s of fr.segments) {
      const [a, b] = [share(s), share(en.segments.find((x) => x.id === s.id)!)];
      a.forEach((x, i) => expect(Math.abs(x - b[i]!), `${s.id}: cue ${i}`).toBeLessThanOrEqual(0.1));
    }
  });
});
