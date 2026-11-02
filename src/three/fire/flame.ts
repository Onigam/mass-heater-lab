import * as THREE from 'three';

// The fire, made in the 3D and driven by the model: `flameLength` (m along the path, negative back up the feed), `flameStrength`, and `flameClock`, which runs on with the slow clock stopped. Ribbons that always face the
// camera (axial billboards) follow the path of the gases from the feet of the sticks; a turbulent pattern scrolls along them in the direction of the flow, so a flame reversed by a cold flue licks back up the feed. No
// texture, no random number, nothing moves if the clock does not. The look of each ribbon (the tongues, the licks) is decoration, listed in docs/water.md; its length, side and strength are the model's.

const VERT = /* glsl */ `
  attribute vec3 aTan;
  attribute vec2 aUV;
  attribute float aW;
  attribute float aSeed;
  varying vec2 vUV;
  varying float vSeed;
  varying float vWeight;
  void main() {
    vUV = aUV;
    vSeed = aSeed;
    vWeight = aSeed < 0.001 ? 0.55 : 1.0;
    vec4 world = modelMatrix * vec4( position, 1.0 );
    vec3 view = normalize( cameraPosition - world.xyz );
    vec3 t = normalize( ( modelMatrix * vec4( aTan, 0.0 ) ).xyz );
    vec3 side = normalize( cross( t, view ) + vec3( 1e-4, 0.0, 0.0 ) );
    world.xyz += side * aW * aUV.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAG = /* glsl */ `
  uniform float uClock;
  uniform float uStrength;
  uniform float uGain;
  varying vec2 vUV;
  varying float vSeed;
  varying float vWeight;
  float fH( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
  float fN( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( fH( i ), fH( i + vec2( 1.0, 0.0 ) ), u.x ), mix( fH( i + vec2( 0.0, 1.0 ) ), fH( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
  float fF( vec2 p ) { return 0.55 * fN( p ) + 0.3 * fN( p * 2.1 + 3.7 ) + 0.15 * fN( p * 4.3 + 7.9 ); }
  void main() {
    float u = vUV.x;
    float v = vUV.y;
    // the pattern runs towards the tip, whichever way the flame goes
    vec2 q = vec2( v * 1.5 + vSeed * 6.1, u * 3.4 - uClock * 2.6 );
    float n = fF( q );
    float n2 = fF( q * 2.2 + n * 1.3 + 3.1 );
    // a body that narrows towards the tip, its edges torn by the turbulence, more so further on
    float w = 1.0 - 0.72 * smoothstep( 0.1, 1.0, u );
    float d = abs( v ) + ( n2 - 0.5 ) * ( 0.5 + 0.9 * u );
    float body = 1.0 - smoothstep( w * 0.45, w * 0.98, d );
    float core = 1.0 - smoothstep( 0.0, w * 0.5, d );
    float tip = 1.0 - smoothstep( 0.62, 1.0, u + ( n - 0.5 ) * 0.5 );
    float foot = smoothstep( 0.0, 0.05, u );
    float a = body * tip * foot;
    if ( a < 0.004 ) discard;
    // soot glowing: deep orange at the edge, yellow in the body, near white at the hot core near the fuel; a touch of blue at the very foot, where the air meets the wood
    vec3 c = mix( vec3( 1.0, 0.1, 0.012 ), vec3( 1.0, 0.3, 0.035 ), core );
    c = mix( c, vec3( 1.0, 0.56, 0.14 ), core * core * ( 1.0 - 0.6 * u ) );
    c = mix( vec3( 0.16, 0.2, 0.7 ) * 0.45, c, smoothstep( 0.0, 0.06, u ) );
    float s = uGain * ( 0.5 + 0.5 * uStrength ) * vWeight;
    gl_FragColor = vec4( c * a * s, a * 0.34 * vWeight );
  }
`;

/** A polyline with its length. */
class Line {
  readonly cum: number[] = [0];
  constructor(readonly pts: THREE.Vector3[]) {
    for (let i = 1; i < pts.length; i++) this.cum.push(this.cum[i - 1]! + pts[i]!.distanceTo(pts[i - 1]!));
  }
  get length(): number {
    return this.cum[this.cum.length - 1]!;
  }
  at(d: number, pos: THREE.Vector3, tan: THREE.Vector3): void {
    const L = this.length;
    const x = Math.min(L, Math.max(0, d));
    let i = 0;
    while (i < this.pts.length - 2 && this.cum[i + 1]! < x) i++;
    const a = this.pts[i]!;
    const b = this.pts[i + 1]!;
    const seg = this.cum[i + 1]! - this.cum[i]!;
    pos.lerpVectors(a, b, seg > 0 ? (x - this.cum[i]!) / seg : 0);
    tan.subVectors(b, a).normalize();
  }
}

const smoothNoise = (x: number): number => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const h = (n: number) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  return h(i) * (1 - u) + h(i + 1) * u;
};

export interface FlameOptions {
  /** From the feet of the sticks, along the tunnel and up the riser, in the frame of the group. */
  forward: THREE.Vector3[];
  /** From the feet of the sticks, up the feed and out of it. */
  back: THREE.Vector3[];
  /** How far a ribbon may stray from the axis, m: the half-width of the channel. */
  half: number;
  ribbons?: number;
  segments?: number;
}

export class Flame {
  readonly mesh: THREE.Mesh;
  readonly uniforms = { uClock: { value: 0 }, uStrength: { value: 0 }, uGain: { value: 1.2 } };
  private readonly forward: Line;
  private readonly back: Line;
  private readonly R: number;
  private readonly N: number;
  private readonly half: number;
  private readonly pos: Float32Array;
  private readonly tan: Float32Array;
  private readonly wid: Float32Array;
  private readonly p = new THREE.Vector3();
  private readonly t = new THREE.Vector3();
  private readonly n = new THREE.Vector3();
  private readonly Z = new THREE.Vector3(0, 0, 1);
  /** What was drawn (tests): the signed length and the strength. */
  drawn = { length: 0, strength: 0 };

  constructor(o: FlameOptions) {
    this.forward = new Line(o.forward);
    this.back = new Line(o.back);
    this.half = o.half;
    const R = (this.R = o.ribbons ?? 7);
    const N = (this.N = o.segments ?? 22);
    const verts = R * (N + 1) * 2;
    this.pos = new Float32Array(verts * 3);
    this.tan = new Float32Array(verts * 3);
    this.wid = new Float32Array(verts);
    const uv = new Float32Array(verts * 2);
    const seed = new Float32Array(verts);
    const idx: number[] = [];
    for (let k = 0; k < R; k++)
      for (let i = 0; i <= N; i++) {
        const base = (k * (N + 1) + i) * 2;
        uv[base * 2] = i / N;
        uv[base * 2 + 1] = -1;
        uv[base * 2 + 2] = i / N;
        uv[base * 2 + 3] = 1;
        seed[base] = seed[base + 1] = (k * 0.618) % 1;
        if (i < N) idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aTan', new THREE.BufferAttribute(this.tan, 3));
    g.setAttribute('aW', new THREE.BufferAttribute(this.wid, 1));
    g.setAttribute('aUV', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      fog: false,
    });
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.name = 'flame';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    this.mesh.visible = false;
    this.mesh.castShadow = false;
    this.mesh.userData.noShadow = true;
    this.mesh.userData.notClipped = true;
    this.mesh.raycast = () => {};
  }

  update(length: number, strength: number, clock: number): void {
    this.drawn.length = length;
    this.drawn.strength = strength;
    const on = strength > 0.005 && Math.abs(length) > 0.01;
    this.mesh.visible = on;
    if (!on) return;
    this.uniforms.uClock.value = clock;
    this.uniforms.uStrength.value = strength;
    const line = length >= 0 ? this.forward : this.back;
    const L = Math.min(Math.abs(length), line.length);
    const { R, N, pos, tan, wid, p, t, n, Z, half } = this;
    for (let k = 0; k < R; k++) {
      // the first ribbon is the flame's body, the others are its tongues, each with its own reach
      const hk = (k * 0.618) % 1;
      const reach = L * (k === 0 ? 1 : 0.62 + 0.38 * hk) * (0.9 + 0.1 * smoothNoise(clock * 1.3 + k * 5.7));
      const width = (k === 0 ? 0.086 : 0.05 + 0.034 * hk) * (0.62 + 0.38 * Math.sqrt(strength));
      const oz = ((k % 3) - 1) * half * 0.42;
      const oy = (hk - 0.42) * half * 0.9;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        line.at(u * reach, p, t);
        n.crossVectors(t, Z);
        // a slow wander across the channel, more at the tip; the base stays on the fuel
        const w1 = (smoothNoise(u * 3.1 - clock * 1.7 + k * 3.3) - 0.5) * half * 0.8 * u;
        const w2 = (smoothNoise(u * 2.3 - clock * 1.3 + k * 9.1) - 0.5) * half * 0.8 * u;
        const cy = (oy * (0.4 + 0.6 * u) + w1) * (k === 0 ? 0.4 : 1);
        const cz = (oz * (0.4 + 0.6 * u) + w2) * (k === 0 ? 0.4 : 1);
        const a = (k * (N + 1) + i) * 2;
        for (const vi of [a, a + 1]) {
          pos[vi * 3] = p.x + n.x * cy;
          pos[vi * 3 + 1] = p.y + n.y * cy;
          pos[vi * 3 + 2] = p.z + cz;
          tan[vi * 3] = t.x;
          tan[vi * 3 + 1] = t.y;
          tan[vi * 3 + 2] = t.z;
          wid[vi] = width;
        }
      }
    }
    const g = this.mesh.geometry;
    (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.aTan as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.aW as THREE.BufferAttribute).needsUpdate = true;
  }
}

/** A slow, gentle variation of a fire's light, deterministic on the flame's clock: within ±`depth`, no strobe. */
export const fireFlicker = (clock: number, depth = 0.07): number =>
  1 + depth * (2 * smoothNoise(clock * 2.1) - 1) * 0.6 + depth * (2 * smoothNoise(clock * 5.3 + 11) - 1) * 0.4;

/** What steel and brick show when they are hot enough to glow, as an emissive colour and strength: nothing under about 480 °C. */
export function glowOf(T: number, color: THREE.Color): number {
  const x = Math.min(1, Math.max(0, (T - 480) / 620));
  if (x <= 0) {
    color.setRGB(0, 0, 0);
    return 0;
  }
  const r = 1;
  const g = 0.08 + 0.42 * x;
  const b = 0.005 + 0.09 * x * x;
  color.setRGB(r, g, b);
  return 0.25 * x + 2.6 * x * x;
}
