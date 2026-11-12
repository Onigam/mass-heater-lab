import * as THREE from 'three';
import { snowMap } from '../textures';

// The snow, one small patch on plain MeshStandardMaterials: faces that look up go white. `SNOW.value` comes from the model's mean outside air (in `update`), so a mild preset takes it all off at once. Decoration of a size set by the
// simulation, listed in docs/scenery.md. From the sand lab.

export const SNOW = { value: 1 };

/**
 * The snow's relief, estimates all (what a wind leaves on a field): one tile of `snowMap` read at two scales. `driftTile` and `rippleTile`: metres a tile; `drift` and `ripple`: how steep the slopes read; `stride`: metres
 * between two prints of the same foot on a path.
 */
export const SNOW_RELIEF = { driftTile: 13, rippleTile: 2.6, drift: 0.55, ripple: 0.24, stride: 1.36 } as const;

/**
 * What the light does in snow, after the lights are summed (it reads `gSnowAmt` and `gSnowGlint`, and the first directional light, the sun or the moon): the side turned from the light goes to the blue the light keeps
 * after a few centimetres of ice, the side turned to it stays warm white; and a crystal lying right throws the light back, a glint that comes and goes with the eye. No pass, no texture of its own.
 */
/**
 * What the snow takes away of a strong sun (estimates): a third of the light it would give back, in proportion as the first directional light's luminance (colour times intensity, linear) goes from `from` to `to`. The sun
 * of the homestead is 3.9 at its height, the moon about 0.8 and the key of a room about 1.5: only the sun is in the range.
 */
export const SNOW_SUN = { dim: 0.34, from: 2.0, to: 3.8 } as const;

export const SNOW_LIGHT_GLSL = /* glsl */ `
  #if NUM_DIR_LIGHTS > 0
  {
    vec3 snL = directionalLights[ 0 ].direction;
    vec3 snC = directionalLights[ 0 ].color;
    float snNl = dot( normal, snL );
    vec3 snTint = mix( vec3( 0.74, 0.85, 1.07 ), vec3( 1.03, 1.0, 0.96 ), smoothstep( -0.15, 0.5, snNl ) );
    outgoingLight = mix( outgoingLight, outgoingLight * snTint, gSnowAmt );
    // snow in full sun is thrown far past what a picture keeps, and the tone curve flattens it: a roof that faces the sun lit its relief by an angle near one, whose cosine hardly moves, and its grain by a value past the curve's
    // knee. A part of the light is taken away in proportion to the sun's strength, as an eye's exposure would: the moon (about a third of the sun) and a dim winter light are left alone
    float snSun = smoothstep( ${SNOW_SUN.from.toFixed(2)}, ${SNOW_SUN.to.toFixed(2)}, dot( snC, vec3( 0.2126, 0.7152, 0.0722 ) ) );
    outgoingLight *= 1.0 - ${SNOW_SUN.dim.toFixed(3)} * snSun * gSnowAmt;
    // snow in full sun is the brightest thing of a landscape and would burn out, its relief with it: a soft shoulder, for the snow only (dim snow keeps its value)
    outgoingLight = mix( outgoingLight, outgoingLight / ( 1.0 + 0.45 * max( dot( outgoingLight, vec3( 0.2126, 0.7152, 0.0722 ) ) - 0.5, 0.0 ) ), gSnowAmt );
    vec3 snV = normalize( vViewPosition );
    vec3 snH = normalize( snL + snV );
    // lit, or in a cast shadow: what the direct light left on this pixel says it
    float snLit = clamp( dot( reflectedLight.directDiffuse, vec3( 0.6 ) ) / max( dot( snC, vec3( 0.2 ) ), 1e-3 ), 0.0, 1.0 );
    float snPhase = 0.5 + 0.5 * sin( gSnowGlint * 37.0 + dot( snV, vec3( 23.0, 17.0, 29.0 ) ) );
    // the crystals lie every way: the nearer the surface is to throwing the light at the eye the more of them do, but some always do
    float snSpark = gSnowGlint * smoothstep( 0.55, 0.95, snPhase ) * ( 0.25 + 0.75 * pow( max( dot( normal, snH ), 0.0 ), 2.0 ) );
    outgoingLight += snC * snSpark * snLit * 0.42;
  }
  #endif
`;
const NOISE = /* glsl */ `
  float snHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
  float snNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( snHash( i ), snHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( snHash( i + vec2( 0.0, 1.0 ) ), snHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
`;

export interface SnowOptions {
  /** Below this normal.y no snow, above `hi` all of it. */
  lo?: number;
  hi?: number;
  /** How much of the amount this surface takes. */
  gain?: number;
  /**
   * A tree seen from afar: past `far[0]` m its many small faces blend into one mean colour, lit as one surface, by `far[1]` m. It is the same tree, and it stops crawling: a dark bough and a
   * white one a pixel apart are what shimmers on a forest. `mean` is the colour of the tree without snow, linear.
   */
  far?: [number, number];
  mean?: [number, number, number];
  /** A broad surface seen close (a roof, the ground under a window): the snow takes its drifts, its ripples and its glints, in metres of the world. Not for a tree's thousand boughs. */
  relief?: boolean;
  /** The material's own colour is the snow's light (a ground that dims with the evening): the snow multiplies it instead of replacing it. */
  over?: boolean;
}

/** Faces that look up go white with `SNOW`. Chains with whatever patch the material already has. */
export function patchSnow<T extends THREE.Material>(mat: T, o: SnowOptions = {}): T {
  const lo = o.lo ?? 0.35;
  const hi = o.hi ?? 0.8;
  const gain = o.gain ?? 1;
  const far = o.far;
  const relief = !!o.relief;
  const mean = o.mean ?? [0.05, 0.08, 0.055];
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.uniforms.uSnow = SNOW;
    if (relief) shader.uniforms.uSnowTex = { value: snowMap() };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSnowN;\nvarying vec3 vSnowP;')
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `#include <beginnormal_vertex>
        {
          vec3 snN = objectNormal;
          #ifdef USE_INSTANCING
            snN = mat3( instanceMatrix ) * snN;
          #endif
          vSnowN = mat3( modelMatrix ) * snN;
        }`,
      )
      .replace(
        '#include <project_vertex>',
        /* glsl */ `#include <project_vertex>
        {
          vec4 snP = vec4( transformed, 1.0 );
          #ifdef USE_INSTANCING
            snP = instanceMatrix * snP;
          #endif
          vSnowP = ( modelMatrix * snP ).xyz;
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vSnowN;\nvarying vec3 vSnowP;\nuniform float uSnow;\n${relief ? 'uniform sampler2D uSnowTex;' : ''}\nfloat gSnow;\nfloat gSnowFar;\nfloat gSnowAmt;\nfloat gSnowGlint;\nvec2 gSnowSlope;\n${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          float up = smoothstep( ${lo.toFixed(3)}, ${hi.toFixed(3)}, normalize( vSnowN ).y );
          // the patchiness is dropped before its cells get under a few pixels: a pattern of two-pixel cells crawls
          float cells = length( fwidth( vSnowP.xz * 1.7 ) );
          float n = mix( 0.85, 0.7 + 0.3 * snNoise( vSnowP.xz * 1.7 ), 1.0 - smoothstep( 0.12, 0.4, cells ) );
          gSnow = clamp( uSnow * ${gain.toFixed(3)} * up * n * 1.25, 0.0, 1.0 );
          vec3 snowC = vec3( 0.86, 0.885, 0.91 );
          gSnowAmt = gSnow;
          gSnowSlope = vec2( 0.0 );
          gSnowGlint = 0.0;
          ${
            relief
              ? `{
            vec4 snA = texture2D( uSnowTex, vSnowP.xz * ${(1 / 5.2).toFixed(5)} + 0.21 );
            vec4 snB = texture2D( uSnowTex, vec2( vSnowP.z, -vSnowP.x ) * ${(1 / SNOW_RELIEF.rippleTile).toFixed(5)} + 0.37 );
            vec2 slA = ( snA.rg - 0.5 ) * 2.0;
            vec2 slB = ( snB.rg - 0.5 ) * 2.0;
            gSnowSlope = ( 0.8 * slA + ${(SNOW_RELIEF.ripple * 1.5).toFixed(3)} * vec2( -slB.y, slB.x ) ) * gSnow;
            snowC *= mix( vec3( 0.9, 0.935, 0.99 ), vec3( 1.0 ), smoothstep( 0.2, 0.62, 0.7 * snA.b + 0.3 * snB.b ) );
            // a crust is never one tone: patches a hand and a forearm wide, and a finer sand, in metres of the world; each is gone before its cells get under two pixels, as the patchiness above
            float snKeepA = 1.0 - smoothstep( 0.2, 0.55, length( fwidth( vSnowP.xz * 4.3 ) ) );
            float snKeepM = 1.0 - smoothstep( 0.2, 0.55, length( fwidth( vSnowP.xz * 9.7 ) ) );
            float snKeepB = 1.0 - smoothstep( 0.2, 0.55, length( fwidth( vSnowP.xz * 19.0 ) ) );
            snowC *= 1.0 + 0.2 * ( ( snNoise( vSnowP.xz * 4.3 + 7.1 ) - 0.5 ) * snKeepA + ( snNoise( vSnowP.xz * 9.7 + 1.9 ) - 0.5 ) * snKeepM + 0.8 * ( snNoise( vSnowP.xz * 19.0 + 3.3 ) - 0.5 ) * snKeepB );
            gSnowGlint = max( smoothstep( 0.3, 0.6, snB.a ), 0.7 * smoothstep( 0.3, 0.6, snA.a ) ) * gSnow;
          }`
              : ''
          }
          diffuseColor.rgb = mix( diffuseColor.rgb, ${o.over ? 'snowC * diffuseColor.rgb * 1.12' : 'snowC'}, gSnow );
          ${
            far
              ? `gSnowFar = smoothstep( ${far[0].toFixed(1)}, ${far[1].toFixed(1)}, length( cameraPosition - vSnowP ) );
          vec3 snMean = mix( vec3( ${mean.map((v) => v.toFixed(3)).join(', ')} ), snowC, clamp( uSnow * ${gain.toFixed(3)} * 0.28, 0.0, 1.0 ) );
          diffuseColor.rgb = mix( diffuseColor.rgb, snMean, gSnowFar * 0.75 );`
              : 'gSnowFar = 0.0;'
          }
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, 0.9, gSnow );',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = mix( metalnessFactor, 0.0, gSnow );',
      )
      .replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
        ${far ? 'normal = normalize( mix( normal, normalize( ( viewMatrix * vec4( 0.25, 0.9, 0.3, 0.0 ) ).xyz ), gSnowFar * 0.7 ) );' : ''}
        ${relief ? 'normal = normalize( normal + ( viewMatrix * vec4( gSnowSlope.x, 0.0, gSnowSlope.y, 0.0 ) ).xyz );' : ''}`,
      )
      .replace('#include <opaque_fragment>', `${SNOW_LIGHT_GLSL}\n#include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () =>
    `${prevKey()}|snow-${lo}-${hi}-${gain}-${far?.join('-') ?? ''}-${mean.join('-')}-${relief ? 'relief' : 'plain'}-${o.over ? 'over' : ''}-2`;
  mat.needsUpdate = true;
  return mat;
}
