import * as THREE from 'three';
import { smoothstep } from '../common';
import { HOME, HOUSE } from '../dims';
import { fbm, grassMap } from '../textures';
import { SNOW } from './snow';

// The land of the homestead, generic: a gentle shelf at the wood's edge where the house stands, the foothill rising behind it to dark forest and far snowy ridges, a road below it. One mesh on a graded grid, fine near the plot and coarse to the horizon. Each
// building stands on a pad of the land, flat to the millimetre. The surfaces are computed per pixel: snow on grass, a ploughed road, trodden paths from the door to the shed and the bucket, rock where the ridge is steep.

export interface Pad {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y: number;
  margin: number;
}

const S = HOME.woodshed;
const N = HOME.neighbour;
const groundY = HOME.ground;

export const PADS: Pad[] = [
  // the house
  { x0: HOUSE.x0 - 2, x1: HOUSE.x1 + 2.5, z0: HOUSE.z0 - 2, z1: HOUSE.z1 + 3, y: groundY, margin: 9 },
  // the shed, its yard, the block, the bucket
  {
    x0: S.x - S.length / 2 - 6,
    x1: S.x + S.length / 2 + 2,
    z0: S.z - S.depth / 2 - 8,
    z1: S.z + S.depth / 2 + 4,
    y: groundY,
    margin: 8,
  },
  // the coppice lies on the slope, the neighbour on a shelf of its own
  {
    x0: N.x - N.length / 2 - 3,
    x1: N.x + N.length / 2 + 3,
    z0: N.z - N.width / 2 - 3,
    z1: N.z + N.width / 2 + 3,
    y: 0.6,
    margin: 8,
  },
];

const rectDist = (x: number, z: number, x0: number, x1: number, z0: number, z1: number): number =>
  Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));

export const padDistance = (x: number, z: number): number => {
  let d = Infinity;
  for (const p of PADS) d = Math.min(d, rectDist(x, z, p.x0, p.x1, p.z0, p.z1));
  return d;
};

function rawLand(x: number, z: number): number {
  const d = Math.hypot(x, z + 2);
  const flat = 1 - smoothstep(70, 340, d);
  const roll = (fbm(x * 0.0026 + 4, z * 0.0026 - 7, 4) - 0.5) * 60 + (fbm(x * 0.011 + 5, z * 0.011, 3) - 0.5) * 7;
  // the shelf slopes gently down to the road, and the hill behind it climbs
  const slope = smoothstep(-20, -240, z) * 40;
  // the foothill to the north, then the far ridges
  const hill = smoothstep(-200, -900, z) * 240 * (0.85 + 0.4 * fbm(x * 0.0016, 3.3, 3));
  const ridge = smoothstep(-900, -2400, z) * 760 * (0.65 + 0.8 * fbm(x * 0.0011 + 7, 1.2, 4));
  const south = smoothstep(180, 900, z) * -14;
  const near = (fbm(x * 0.022, z * 0.022, 2) - 0.5) * 1.3;
  return (1 - flat) * (roll + hill + ridge + south) + flat * near + slope;
}

/** The centre line of the road. */
export const roadZ = (x: number): number => HOME.road.z + 3 * Math.sin(x * 0.012 + 0.4);

/** The height of the land, m: the raw land, flat under the pads, on its own level along the road. */
export function terrainHeight(x: number, z: number): number {
  let h = rawLand(x, z);
  const rz = roadZ(x);
  const dr = Math.abs(z - rz);
  const roadW = 1 - smoothstep(HOME.road.width / 2 + 0.6, HOME.road.width / 2 + 12, dr);
  if (roadW > 0) {
    const level = rawLand(x, rz) * smoothstep(60, 300, Math.abs(x)) - 0.25;
    h += (level - h) * roadW;
  }
  for (const p of PADS) {
    if (x < p.x0 - p.margin || x > p.x1 + p.margin || z < p.z0 - p.margin || z > p.z1 + p.margin) continue;
    const d = rectDist(x, z, p.x0, p.x1, p.z0, p.z1);
    if (d < p.margin) {
      const w = 1 - smoothstep(0, p.margin, d);
      h += (p.y - h) * w;
    }
  }
  return h;
}

const GRID_N = 180;
const R = 4200;
const A = 0.018;
export const gridCoord = (u: number): number => R * (A * u + (1 - A) * Math.sign(u) * Math.abs(u) ** 5);

export interface Terrain {
  mesh: THREE.Mesh;
  vertices: number;
}

export function buildTerrain(canopy: (x: number, z: number) => number = () => 0): Terrain {
  const n = GRID_N;
  const pos = new Float32Array((n + 1) * (n + 1) * 3);
  const forest = new Float32Array((n + 1) * (n + 1));
  const idx: number[] = [];
  for (let j = 0; j <= n; j++) {
    const z = gridCoord((j / n) * 2 - 1) - 2;
    for (let i = 0; i <= n; i++) {
      const x = gridCoord((i / n) * 2 - 1);
      const k = (j * (n + 1) + i) * 3;
      pos[k] = x;
      pos[k + 1] = terrainHeight(x, z);
      pos[k + 2] = z;
      forest[j * (n + 1) + i] = canopy(x, z);
    }
  }
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i;
      const b = a + 1;
      const c = a + n + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aForest', new THREE.BufferAttribute(forest, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const grass = grassMap();
  // the trodden paths: door to shed, shed to bucket, door to the road
  const paths = [
    new THREE.Vector4(1.5, HOUSE.z1 + 0.6, 7.2, 3.0),
    new THREE.Vector4(7.2, 3.0, S.x - S.length / 2 + 0.4, S.z + S.depth / 2 + 0.6),
    new THREE.Vector4(7.2, 3.0, HOME.bucket.x, HOME.bucket.z + 0.4),
    new THREE.Vector4(1.5, HOUSE.z1 + 0.6, 0.6, HOME.road.z - 2),
  ];
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGrass = { value: grass };
    shader.uniforms.uSnow = SNOW;
    shader.uniforms.uPaths = { value: paths };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float aForest;\nvarying vec3 vLandP;\nvarying vec3 vLandN;\nvarying float vLandF;',
      )
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvLandN = objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandP = position;\nvLandF = aForest;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vLandP;
        varying vec3 vLandN;
        varying float vLandF;
        uniform sampler2D uGrass;
        uniform float uSnow;
        uniform vec4 uPaths[${paths.length}];
        float ldHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
        float ldNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( ldHash( i ), ldHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( ldHash( i + vec2( 0.0, 1.0 ) ), ldHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
        float ldFbm( vec2 p ) { return 0.55 * ldNoise( p ) + 0.3 * ldNoise( p * 2.3 + 7.1 ) + 0.15 * ldNoise( p * 5.1 + 2.7 ); }
        float ldSeg( vec2 p, vec4 s ) { vec2 pa = p - s.xy; vec2 ba = s.zw - s.xy; float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 ); return length( pa - ba * h ); }`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vLandP.xz;
          float dist = length( cameraPosition - vLandP );
          float nearFade = 1.0 - smoothstep( 30.0, 110.0, dist );
          float broad = ldFbm( p * 0.016 );
          vec3 meadow = mix( vec3( 0.2, 0.235, 0.105 ), vec3( 0.32, 0.33, 0.14 ), broad );
          meadow *= 0.72 + 0.56 * mix( texture2D( uGrass, p * 0.33 ).r, 0.5, smoothstep( 40.0, 170.0, dist ) );
          meadow = mix( meadow, vec3( 0.055, 0.07, 0.05 ), vLandF * 0.92 );
          vec3 n = normalize( vLandN );
          // bare rock where the ridges are steep
          float steep = 1.0 - smoothstep( 0.62, 0.85, n.y );
          vec3 rock = mix( vec3( 0.22, 0.21, 0.2 ), vec3( 0.36, 0.34, 0.31 ), ldFbm( p * 0.008 ) );
          meadow = mix( meadow, rock, steep );
          // the road and the paths
          float roadC = ${HOME.road.z.toFixed(2)} + 3.0 * sin( p.x * 0.012 + 0.4 );
          float dRoad = abs( p.y - roadC );
          float road = 1.0 - smoothstep( ${(HOME.road.width / 2 - 0.2).toFixed(3)}, ${(HOME.road.width / 2 + 0.2).toFixed(3)}, dRoad + 0.2 * ( ldNoise( p * 0.8 ) - 0.5 ) * nearFade );
          float dPath = 1e9;
          for ( int i = 0; i < ${paths.length}; i++ ) dPath = min( dPath, ldSeg( p, uPaths[ i ] ) );
          float path = 1.0 - smoothstep( 0.24, 0.62, dPath + 0.22 * ( ldNoise( p * 2.1 ) - 0.5 ) * nearFade );
          vec3 c = meadow;
          vec3 packed = vec3( 0.26, 0.25, 0.235 ) * ( 0.9 + 0.2 * ldNoise( p * 1.4 ) * nearFade );
          c = mix( c, packed, road );
          // the snow: lies on everything but rock; thin under the trees; packed, grey and rutted on the road; a trodden line on the paths
          float flat_ = smoothstep( 0.6, 0.9, n.y );
          float cover = uSnow * mix( 0.45, 1.0, flat_ ) * ( 1.0 - mix( 0.45, 0.9, smoothstep( 110.0, 380.0, dist ) ) * vLandF );
          float wheel = smoothstep( 0.6, 0.0, abs( abs( dRoad ) - 1.4 ) );
          float plough = road * ( 0.48 + 0.34 * wheel );
          float gLand = cover * ( 1.0 - plough ) * ( 1.0 - 0.48 * path );
          vec3 snow = mix( vec3( 0.86, 0.875, 0.905 ), vec3( 0.95, 0.955, 0.965 ), ldFbm( p * 0.1 ) );
          snow *= 0.965 + 0.05 * ldNoise( vec2( p.x * 0.9 + 0.5 * p.y, p.y * 3.1 ) ) * nearFade;
          snow = mix( snow, snow * vec3( 0.78, 0.8, 0.85 ), path );
          c = mix( c, snow, gLand );
          diffuseColor.rgb = c;
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'heater-land';
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = 'land';
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;
  return { mesh, vertices: pos.length / 3 };
}
