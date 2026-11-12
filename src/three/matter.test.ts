import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createBenchSectionScene } from './benchsection/scene';
import { edgeWear, roomOcclusion } from './detail';
import { CORE, HOME, HOUSE, ROOM } from './dims';
import { createFireCoreScene } from './firecore/scene';
import { createHomesteadScene } from './homestead/scene';
import { MOON_DIRECTION } from './homestead/sky';
import { SNOW_RELIEF, patchSnow } from './homestead/snow';
import { WINDOW_POOLS, buildTerrain } from './homestead/terrain';
import { createLivingRoomScene } from './livingroom/scene';
import { machineMaterials } from './machine/materials';
import { PLASTER_RELIEF, roomMaterials } from './room/shell';
import { ROOM_BOX } from './room/stage';
import { stateWith, view } from './test-utils';
import {
  concreteNormalMap,
  fibreMap,
  galvanisedMap,
  perliteMap,
  plasterMap,
  plasterNormalMap,
  refractoryMap,
  snowMap,
  sootMap,
  steelNormalMap,
  steelRoughMap,
  textureStats,
  tf,
} from './textures';

// The material pass (docs/3d.md, « Material pass »): no wide surface is a flat colour. What a film frame measures as `flat` and `texture` comes from maps drawn at build and from a few lines of shader; these tests hold that the maps
// exist, carry matter and no hole, that the shader edits still find their place in three's standard material, and that the whole stays within a phone's memory.

const luma = (d: Uint8Array, k: number) => 0.2126 * d[k]! + 0.7152 * d[k + 1]! + 0.0722 * d[k + 2]!;

/** Standard deviation of the luma of a colour map, in 8-bit levels, and its darkest texel. */
function matter(t: THREE.DataTexture): { sd: number; min: number; rows: number } {
  const d = t.image.data as Uint8Array;
  const n = d.length / 4;
  let s = 0;
  let s2 = 0;
  let min = 255;
  for (let k = 0; k < d.length; k += 4) {
    const y = luma(d, k);
    s += y;
    s2 += y * y;
    min = Math.min(min, y);
  }
  // a row that is one flat value is a hole in the map (a noise read past its lattice gave one once: a black band across a wall)
  const size = t.image.width;
  let rows = 0;
  for (let j = 0; j < size; j++) {
    let same = true;
    for (let i = 1; i < size && same; i++) if (d[(j * size + i) * 4] !== d[j * size * 4]) same = false;
    if (same) rows++;
  }
  return { sd: Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)), min, rows };
}

describe('the maps of the material pass', () => {
  const colour: [string, () => THREE.DataTexture, number][] = [
    ['plaster', plasterMap, 6],
    ['galvanised', galvanisedMap, 4],
    ['soot', sootMap, 10],
    ['refractory', refractoryMap, 5],
    ['perlite', perliteMap, 10],
    ['fibre', fibreMap, 6],
  ];
  for (const [name, make, least] of colour) {
    it(`${name}: a colour map with matter, no flat row, no black hole`, () => {
      const m = matter(make());
      expect(m.sd, 'luma standard deviation, levels').toBeGreaterThan(least);
      expect(m.rows).toBe(0);
      expect(m.min).toBeGreaterThan(8);
    });
  }

  const normals: [string, () => THREE.DataTexture][] = [
    ['plaster', plasterNormalMap],
    ['steel', steelNormalMap],
    ['concrete', concreteNormalMap],
  ];
  for (const [name, make] of normals) {
    it(`${name}: a normal map that leans and stays a normal`, () => {
      const t = make();
      expect(t.colorSpace).toBe(THREE.NoColorSpace);
      const d = t.image.data as Uint8Array;
      let lean = 0;
      let worst = 0;
      for (let k = 0; k < d.length; k += 4) {
        const x = d[k]! / 127.5 - 1;
        const y = d[k + 1]! / 127.5 - 1;
        const z = d[k + 2]! / 127.5 - 1;
        lean += Math.hypot(x, y);
        worst = Math.max(worst, Math.abs(Math.hypot(x, y, z) - 1));
        expect(z).toBeGreaterThan(0.5);
      }
      lean /= d.length / 4;
      // a relief that reads (over 1 % of slope on average) and never a cliff (a mean under 30 %)
      expect(lean).toBeGreaterThan(0.01);
      expect(lean).toBeLessThan(0.3);
      expect(worst).toBeLessThan(0.03);
    });
  }

  it('steel: its roughness varies and never reaches a mirror', () => {
    const d = steelRoughMap().image.data as Uint8Array;
    let lo = 255;
    let hi = 0;
    for (let k = 1; k < d.length; k += 4) {
      lo = Math.min(lo, d[k]!);
      hi = Math.max(hi, d[k]!);
    }
    expect(lo).toBeGreaterThanOrEqual(Math.round(0.35 * 255));
    expect(hi - lo).toBeGreaterThan(60);
  });

  it('snow: slopes both ways around level, a height, and crystals on a few texels in a hundred', () => {
    const t = snowMap();
    const d = t.image.data as Uint8Array;
    const n = d.length / 4;
    let sx = 0;
    let sz = 0;
    let crystals = 0;
    let lean = 0;
    for (let k = 0; k < d.length; k += 4) {
      sx += d[k]! - 127.5;
      sz += d[k + 1]! - 127.5;
      lean += Math.abs(d[k]! - 127.5) + Math.abs(d[k + 1]! - 127.5);
      if (d[k + 3]! > 0) crystals++;
    }
    // a tile that repeats has as much slope up as down
    expect(Math.abs(sx / n)).toBeLessThan(1.5);
    expect(Math.abs(sz / n)).toBeLessThan(1.5);
    expect(lean / n).toBeGreaterThan(4);
    expect(crystals / n).toBeGreaterThan(0.01);
    expect(crystals / n).toBeLessThan(0.05);
  });

  it('a tileable noise refuses more cells than its lattice holds', () => {
    expect(() => tf(0.95, 0.95, 72, 3)).toThrow();
    expect(Number.isFinite(tf(0.95, 0.95, 64, 3))).toBe(true);
  });
});

// ------------------------------------------------------------------------------------------------ the shader edits find their place

/** A standard material's program as three would hand it to `onBeforeCompile`. */
function compiled(mat: THREE.Material): { vertexShader: string; fragmentShader: string } {
  const shader = {
    uniforms: {} as Record<string, THREE.IUniform>,
    vertexShader: THREE.ShaderLib.standard.vertexShader,
    fragmentShader: THREE.ShaderLib.standard.fragmentShader,
  };
  mat.onBeforeCompile(
    shader as unknown as THREE.WebGLProgramParametersWithUniforms,
    null as unknown as THREE.WebGLRenderer,
  );
  return shader;
}

describe('the shader edits of the material pass', () => {
  it('the room’s contact darkening dims the ambient light and leaves the emissive alone', () => {
    const m = roomOcclusion(new THREE.MeshStandardMaterial(), ROOM_BOX);
    const { vertexShader, fragmentShader } = compiled(m);
    expect(vertexShader).toContain('vRoP = ( modelMatrix');
    expect(fragmentShader).toContain('reflectedLight.indirectDiffuse *= roAo');
    expect(fragmentShader).not.toMatch(/totalEmissiveRadiance\s*\*=\s*roAo/);
    // applied once, however often it is asked
    const key = m.customProgramCacheKey();
    roomOcclusion(m, ROOM_BOX);
    expect(m.customProgramCacheKey()).toBe(key);
  });

  it('the drum’s worn paint is at its hoops and rims, and nowhere else', () => {
    const m = new THREE.MeshStandardMaterial();
    const ys = [0.4, 0.7];
    edgeWear(m, ys, 0.016, CORE.drumR);
    const { fragmentShader } = compiled(m);
    for (const y of ys) expect(fragmentShader).toContain(`abs( vEwP.y - ${y.toFixed(4)} )`);
    expect(fragmentShader).toContain('metalnessFactor = mix( metalnessFactor');
    expect(fragmentShader.match(/float dtKeep/g)?.length).toBe(1);
  });

  it('the snow of a roof takes its relief, its tint and its glints; a bough takes the tint only', () => {
    const roof = compiled(patchSnow(new THREE.MeshStandardMaterial(), { relief: true })).fragmentShader;
    expect(roof).toContain('uniform sampler2D uSnowTex');
    expect(roof).toContain('normal = normalize( normal + ( viewMatrix * vec4( gSnowSlope.x');
    expect(roof).toContain('snSpark');
    const bough = compiled(patchSnow(new THREE.MeshStandardMaterial())).fragmentShader;
    expect(bough).not.toContain('uSnowTex');
    expect(bough).toContain('snTint');
  });

  it('the land reads the snow tile at two scales, prints its paths and takes the windows’ pools', () => {
    const land = buildTerrain().mesh.material as THREE.MeshStandardMaterial;
    const { fragmentShader } = compiled(land);
    expect(fragmentShader).toContain(`p * ${(1 / SNOW_RELIEF.driftTile).toFixed(5)}`);
    expect(fragmentShader).toContain(`* ${(1 / SNOW_RELIEF.rippleTile).toFixed(5)}`);
    expect(fragmentShader).toContain('footSlope');
    expect(fragmentShader).toContain(`uniform vec3 uPools[${WINDOW_POOLS.at.length}]`);
    expect(fragmentShader).toContain('snSpark');
    // every edit found its hook: none of three's includes that the edits replace is left twice or missing
    expect(fragmentShader.match(/#include <opaque_fragment>/g)?.length).toBe(1);
    expect(fragmentShader.match(/#include <normal_fragment_begin>/g)?.length).toBe(1);
  });
});

// ------------------------------------------------------------------------------------------------ the materials of the worlds

describe('no wide surface is a flat colour', () => {
  it('plaster: a colour map and a relief, in the same metres', () => {
    const rm = roomMaterials();
    for (const m of [rm.plaster, rm.plasterFront, rm.plasterGable]) {
      expect(m.map?.name).toBe('plaster');
      expect(m.normalMap?.name).toBe('plaster-normal');
      expect(m.normalMap!.repeat.x).toBeCloseTo(m.map!.repeat.x, 6);
      expect(m.normalScale.x).toBe(PLASTER_RELIEF);
    }
    expect(rm.slab.normalMap?.name).toBe('concrete-normal');
    expect(rm.insul.map?.name).toBe('fibre');
  });

  it('steel: every steel of the machine has a roughness that varies; the drum has a relief and its paint', () => {
    const mm = machineMaterials();
    for (const m of [mm.drum, mm.steel, mm.steelDark, mm.sleeve, mm.duct, mm.flue, mm.flueBand])
      expect(m.roughnessMap?.name, m.name).toBe('steel-rough');
    expect(mm.drum.normalMap?.name).toBe('steel-normal');
    expect(mm.drum.map?.name).toBe('drum-paint');
    expect(mm.drum.userData.edgeWear).toBe(true);
    // what a section shows is not a flat colour either
    expect(mm.liner.map?.name).toBe('refractory');
    expect(mm.insulation.map?.name).toBe('perlite');
    expect(mm.drumInside.map?.name).toBe('soot');
  });

  const worlds = [
    ['living-room', createLivingRoomScene()],
    ['fire-core', createFireCoreScene()],
    ['bench-section', createBenchSectionScene()],
  ] as const;
  for (const [id, mod] of worlds) {
    it(`${id}: the walls, the floor and the slab lose light towards their corners`, () => {
      let plaster = 0;
      let dimmed = 0;
      mod.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!(o as THREE.Mesh).isMesh || !m?.map) return;
        if (m.map.name === 'plaster' && m.normalMap) {
          plaster++;
          if (m.userData.roomOcclusion) dimmed++;
        }
      });
      expect(plaster).toBeGreaterThan(0);
      expect(dimmed).toBe(plaster);
    });
  }

  it('living-room: the shield is a galvanised sheet with a relief', () => {
    const shield = worlds[0][1].scene.getObjectByName('heat-shield');
    let found = false;
    shield?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m?.map?.name === 'galvanised' && m.normalMap) found = true;
    });
    // the shield may be merged with its world's dressing: then its material is found in the scene
    if (!found)
      worlds[0][1].scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (m?.map?.name === 'galvanised' && m.normalMap) found = true;
      });
    expect(found).toBe(true);
  });
});

// ------------------------------------------------------------------------------------------------ the light

describe('the light of the homestead at night', () => {
  it('the moon stands low enough to rake the snow, high enough to light it', () => {
    const alt = (Math.asin(MOON_DIRECTION[1] / Math.hypot(...MOON_DIRECTION)) * 180) / Math.PI;
    expect(alt).toBeGreaterThan(20);
    expect(alt).toBeLessThan(40);
  });

  it('each pool of light lies at a window: on a wall’s outer face, at a window’s height', () => {
    const y0 = HOME.at[1] + ROOM.windowSill;
    const y1 = HOME.at[1] + ROOM.windowHead;
    const N = HOME.neighbour;
    for (const p of WINDOW_POOLS.at) {
      const onFront = Math.abs(p.z - (HOUSE.z1 + HOME.at[2])) < 0.01 && p.x > HOUSE.x0 && p.x < HOUSE.x1;
      const onGable = Math.abs(p.x - (HOUSE.x1 + HOME.at[0])) < 0.01 && p.z > HOUSE.z0 && p.z < HOUSE.z1;
      // the neighbour's front, in its own frame
      const dx = p.x - N.x;
      const dz = p.z - N.z;
      const lz = dx * Math.sin(N.yaw) + dz * Math.cos(N.yaw);
      const lx = dx * Math.cos(N.yaw) - dz * Math.sin(N.yaw);
      const onNeighbour = Math.abs(lz - N.width / 2) < 0.01 && Math.abs(lx) < N.length / 2;
      expect(onFront || onGable || onNeighbour, `${p.x.toFixed(2)}, ${p.z.toFixed(2)}`).toBe(true);
      if (!onNeighbour) {
        expect(p.y).toBeGreaterThan(y0);
        expect(p.y).toBeLessThan(y1);
      }
    }
  });

  it('the pools follow the windows: none by day, lit at night', () => {
    const w = createHomesteadScene();
    w.update(stateWith({ hour: 12 }), 1, view());
    for (let i = 0; i < 30; i++) w.update(stateWith({ hour: 12 }), 0.1, view());
    expect(WINDOW_POOLS.glow.value).toBe(0);
    for (let i = 0; i < 30; i++) w.update(stateWith({ hour: 23 }), 0.1, view());
    expect(WINDOW_POOLS.glow.value).toBeGreaterThan(0.5);
    expect(w.house.glass.emissiveIntensity).toBeGreaterThan(0.5);
  });
});

// ------------------------------------------------------------------------------------------------ the budget of the maps

describe('the budget of the maps', () => {
  it('all the maps of the lab, with their mipmaps, fit a phone: under 24 MB, none over 512 px', () => {
    // every world built above, so every map is made
    const stats = textureStats();
    const bytes = stats.reduce((a, s) => a + s.bytes, 0);
    // eslint-disable-next-line no-console
    console.info(`[maps] ${stats.length} maps, ${(bytes / 1048576).toFixed(1)} MB with mipmaps`);
    expect(Math.max(...stats.map((s) => s.size))).toBeLessThanOrEqual(512);
    expect(bytes).toBeLessThan(24 * 1048576);
    expect(stats.length).toBeLessThan(40);
  });
});
