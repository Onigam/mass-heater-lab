import * as THREE from 'three';

// Near detail that keeps a view from feeling empty, without adding shimmer (the picture rule of the lab kit, docs/lab-quality.md
// §3): wear on the parts and contact shadows on the paper floors.
// Procedural only (no texture file, no asset). Every pattern drawn in a shader fades out before a cell of it gets under a few pixels
// (its frequency is compared with the screen derivative of its coordinate): it adds detail close up and nothing that could crawl from
// afar. The same code as the Pelton and ram pump labs'
// `detail.ts`, without their grass and stones.

/** GLSL: value noise, a 3D blend of it, and the fade of a pattern by its size on screen. */
export const NOISE_GLSL = /* glsl */ `
  #ifndef DT_NOISE
  #define DT_NOISE
  float dtHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
  float dtNoise( vec2 p ) {
    vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f );
    float a = dtHash( i ), b = dtHash( i + vec2( 1.0, 0.0 ) ), c = dtHash( i + vec2( 0.0, 1.0 ) ), d = dtHash( i + vec2( 1.0, 1.0 ) );
    return mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y ) * 2.0 - 1.0;
  }
  float dtNoise3( vec3 p ) { return 0.35 * ( dtNoise( p.xy ) + dtNoise( p.yz + 17.3 ) ) + 0.3 * dtNoise( p.zx - 9.1 ); }
  // 1 while a cell of the pattern spans more than ~6 pixels, 0 once it is under ~2.5 (a pattern of two-pixel cells crawls as the camera moves)
  float dtKeep( float cellsPerPixel ) { return 1.0 - smoothstep( 0.17, 0.4, cellsPerPixel ); }
  #endif
`;

/** Chain a shader edit after a material's own `onBeforeCompile`, and give the program its own cache key. */
export function patch(
  mat: THREE.Material,
  key: string,
  edit: (shader: THREE.WebGLProgramParametersWithUniforms) => void,
): void {
  const before = mat.onBeforeCompile;
  const keyBefore = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    before.call(mat, shader, renderer);
    edit(shader);
  };
  mat.customProgramCacheKey = () => `${keyBefore()}|${key}`;
  mat.needsUpdate = true;
}

// ------------------------------------------------------------------------------------------------ wear

/**
 * Wear on the solid parts under `root`: a slow variation of colour and roughness, as no made part is one flat colour. In each
 * mesh's own coordinates, so it moves with the part (explode, the rotor's turn). `freq`: cells per metre of the variation (a
 * hillside 3, a bench 60). Transparent materials and the ones `skip` names are left alone. A material may ask for its own wear
 * in `userData.wear`: `tint` (the colour of its stains) and `amount` (1 by default).
 */
export function applyWear(root: THREE.Object3D, freq: number, skip: (m: THREE.Mesh) => boolean = () => false): void {
  const seen = new Set<THREE.Material>();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || skip(m)) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std.isMeshStandardMaterial || std.transparent || seen.has(std) || std.userData.worn) continue;
      seen.add(std);
      std.userData.worn = true;
      const metal = std.metalness > 0.5;
      const wear = (std.userData.wear ?? {}) as { tint?: [number, number, number]; amount?: number };
      const tint = wear.tint ?? [1.03, 0.99, 0.92];
      const amount = wear.amount ?? 1;
      const tintGlsl = `vec3( ${tint.map((v) => v.toFixed(3)).join(', ')} )`;
      patch(std, `wear-${freq}-${metal ? 'metal' : 'matte'}-${tint.join('-')}-${amount}`, (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vDtObj;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDtObj = position;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>\nvarying vec3 vDtObj;\n${NOISE_GLSL}`)
          .replace(
            '#include <color_fragment>',
            /* glsl */ `#include <color_fragment>
            vec3 dtP = vDtObj * ${freq.toFixed(3)};
            float dtCpp = length( fwidth( dtP ) );
            float dtN = ${amount.toFixed(3)} * ( dtNoise3( dtP ) * dtKeep( dtCpp ) + 0.5 * dtNoise3( dtP * 3.1 + 5.0 ) * dtKeep( dtCpp * 3.1 ) );
            diffuseColor.rgb *= 1.0 + ${metal ? '0.05' : '0.08'} * dtN;
            diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * ${tintGlsl}, ${metal ? '0.10' : '0.18'} * smoothstep( 0.2, 0.8, dtN ) );`,
          )
          .replace(
            '#include <roughnessmap_fragment>',
            /* glsl */ `#include <roughnessmap_fragment>
            roughnessFactor = clamp( roughnessFactor * ( 1.0 + ${metal ? '0.1' : '0.12'} * dtN ), 0.04, 1.0 );`,
          );
      });
    }
  });
}

// ------------------------------------------------------------------------------------------------ contact shadows

/** The same for a round foot: a dark ring around a disc of radius `r`, fading over `falloff`, on a paper floor. */
export function contactRing(r: number, falloff: number, strength = 0.45): THREE.Mesh {
  const N = 256;
  const R = r + falloff;
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(((i + 0.5) / N - 0.5) * 2 * R, ((j + 0.5) / N - 0.5) * 2 * R);
      const t = (d - r) / falloff;
      const rise = Math.min(1, Math.max(0, t / 0.25));
      const a = t > 0 ? rise * rise * (3 - 2 * rise) * Math.max(0, 1 - t) ** 1.5 : 0;
      const v = strength * a;
      const k = (j * N + i) * 4;
      data[k] = Math.round(255 * (1 - v));
      data[k + 1] = Math.round(255 * (1 - v * 0.96));
      data[k + 2] = Math.round(255 * (1 - v * 0.9));
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    blending: THREE.MultiplyBlending,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R), mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -1;
  m.name = 'contact-shadow';
  m.userData.noShadow = true;
  m.raycast = () => {};
  return m;
}

/**
 * The darker border on a floor around what stands on it (the ambient light the floor does not get next to a body): a footprint
 * of `w` by `d` metres, centred, fading over `falloff`. Multiplied over the floor. Lay it between the floor and the body's
 * underside: in front of the floor by depth alone, behind the body's foot, so the body always covers it. Inside the footprint
 * it darkens nothing, so a pixel of the body's foot that it might reach is never darkened. Not a part: no shadow, no picking.
 */
export function contactShadow(w: number, d: number, falloff: number, strength = 0.45): THREE.Mesh {
  const N = 128;
  const W = w + 2 * falloff;
  const D = d + 2 * falloff;
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const dx = Math.max(0, Math.abs(((i + 0.5) / N - 0.5) * W) - w / 2);
      const dz = Math.max(0, Math.abs(((j + 0.5) / N - 0.5) * D) - d / 2);
      // 0 inside the footprint, rising over the first two fifths of the falloff, then fading: no hard dark line at the body's foot,
      // which would draw a strong edge that crawls as the camera moves
      const t = dx > 0 || dz > 0 ? Math.hypot(dx, dz) / falloff : 0;
      const rise = Math.min(1, t / 0.4);
      const a = t > 0 ? rise * rise * (3 - 2 * rise) * Math.max(0, 1 - t) : 0;
      const v = strength * a;
      const k = (j * N + i) * 4;
      // a warm darkening, as the ink of the shadows (not a grey)
      data[k] = Math.round(255 * (1 - v));
      data[k + 1] = Math.round(255 * (1 - v * 0.96));
      data[k + 2] = Math.round(255 * (1 - v * 0.9));
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    blending: THREE.MultiplyBlending,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
    // not fogged: a fogged plane is no longer white, and multiplied over the floor it draws a hard-edged patch from afar
    fog: false,
    // a plane a few millimetres over a floor seen from metres away loses the depth test in bands (the 24-bit buffer): in front by an
    // offset of the depth too
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -1;
  m.name = 'contact-shadow';
  m.userData.noShadow = true;
  m.raycast = () => {};
  return m;
}

// ------------------------------------------------------------------------------------------------ the light a corner does not get

export interface RoomOcclusion {
  /** The room's box, in the world. */
  min: [number, number, number];
  max: [number, number, number];
  /** How far from a wall, a floor or a ceiling the darkening reaches, m. */
  radius?: number;
  /** How much of the ambient light a corner loses. */
  strength?: number;
}

/**
 * Contact darkening by rule, for a room that is a box: a point near a wall, the floor or the ceiling receives less of the sky's and the room's light, and the nearer the less. Every plane of the box counts but
 * the one a face lies in, so a wall darkens towards its corners, its foot and the ceiling, the floor towards the walls, a bench towards the floor and the wall behind it. No pass, no texture, no sample: six
 * exponentials a pixel. It dims the ambient light and half of the direct, as a soft shadow would, and leaves the emissive alone (a temperature on the thermal view stays what it is).
 */
export function roomOcclusion<T extends THREE.Material>(mat: T, o: RoomOcclusion): T {
  if (mat.userData.roomOcclusion || !(mat as unknown as THREE.MeshStandardMaterial).isMeshStandardMaterial) return mat;
  mat.userData.roomOcclusion = true;
  const r = o.radius ?? 0.42;
  const k = o.strength ?? 0.34;
  const f = (v: number[]) => `vec3( ${v.map((x) => x.toFixed(4)).join(', ')} )`;
  patch(mat, `room-occlusion-${o.min.join(',')}-${o.max.join(',')}-${r}-${k}`, (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRoP;\nvarying vec3 vRoN;')
      .replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nvRoN = mat3( modelMatrix ) * objectNormal;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvRoP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRoP;\nvarying vec3 vRoN;')
      .replace(
        '#include <aomap_fragment>',
        /* glsl */ `#include <aomap_fragment>
        {
          vec3 roN = abs( normalize( vRoN ) );
          vec3 roLo = max( vRoP - ${f(o.min)}, 0.0 ) * ${(1 / r).toFixed(4)};
          vec3 roHi = max( ${f(o.max)} - vRoP, 0.0 ) * ${(1 / r).toFixed(4)};
          vec3 roE = exp( -roLo ) + exp( -roHi );
          float roO = dot( 1.0 - roN, roE );
          float roAo = 1.0 - ${k.toFixed(3)} * min( roO, 1.35 );
          reflectedLight.indirectDiffuse *= roAo;
          reflectedLight.indirectSpecular *= roAo;
          reflectedLight.directDiffuse *= mix( 1.0, roAo, 0.5 );
        }`,
      );
  });
  return mat;
}

/** The same for every solid material under `root`. */
export function roomOcclusionAll(root: THREE.Object3D, o: RoomOcclusion): void {
  root.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      const s = mat as THREE.MeshStandardMaterial;
      if (s.isMeshStandardMaterial && !s.transparent) roomOcclusion(s, o);
    }
  });
}

// ------------------------------------------------------------------------------------------------ paint worn at the edges

/**
 * Paint worn through to the steel where a drum is rolled and handled: bands round its axis (Y, through the origin of its own frame) at the heights `ys`, `half` metres to each side, broken by a streaky noise so that no
 * band is a ruled line. There the colour goes to bare steel, the roughness down, the metalness up: a rim catches the light. The pattern fades before its streaks get under a few pixels.
 */
export function edgeWear(mat: THREE.MeshStandardMaterial, ys: readonly number[], half: number, radius: number): void {
  if (mat.userData.edgeWear) return;
  mat.userData.edgeWear = true;
  patch(mat, `edge-wear-${ys.join(',')}-${half}-${radius}`, (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEwP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEwP = position;');
    const bands = ys
      .map(
        (y) =>
          `ew = max( ew, 1.0 - smoothstep( ${(half * 0.25).toFixed(4)}, ${half.toFixed(4)}, abs( vEwP.y - ${y.toFixed(4)} ) ) );`,
      )
      .join('\n          ');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vEwP;\nfloat gEw;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          float ew = 0.0;
          ${bands}
          // long streaks round the drum, as a hoop wears where it rolled: two scales of them, so that no two stretches are alike
          vec2 ewQ = vec2( atan( vEwP.z, vEwP.x ) * ${(radius * 11).toFixed(3)}, vEwP.y * 9.0 );
          float ewKeep = dtKeep( length( fwidth( ewQ * 3.7 ) ) );
          float ewN = 0.5 + 0.3 * dtNoise( ewQ ) + 0.2 * dtNoise( ewQ * 3.7 + 11.0 ) * ewKeep;
          gEw = ew * ( 0.3 + 0.7 * smoothstep( 0.3, 0.75, ewN ) );
          diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.25, 0.24, 0.23 ), 0.6 * gEw );
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, 0.4, gEw );',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = mix( metalnessFactor, 0.85, gEw );',
      );
  });
}
