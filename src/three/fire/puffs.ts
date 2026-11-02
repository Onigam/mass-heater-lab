import * as THREE from 'three';

// Smoke and steam: soft billboards that rise and drift, one draw call a plume. The amount comes from the model (`smokeAtCap`, `steamAtCap`, `smokeInRoom`); the wind and the shape of each puff are ours, listed in docs/water.md.
// Every puff's place is a pure function of its own clock, itself the sum of dt × slowMo: with dt = 0 nothing moves.

const VERT = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec2 aSize;
  attribute float aSeed;
  varying vec2 vP;
  varying float vA;
  varying float vSeed;
  void main() {
    vP = position.xy;
    vA = aSize.y;
    vSeed = aSeed;
    vec4 mv = viewMatrix * modelMatrix * vec4( aOffset, 1.0 );
    float c = cos( aSeed * 6.283 ), s = sin( aSeed * 6.283 );
    vec2 q = vec2( c * position.x - s * position.y, s * position.x + c * position.y );
    mv.xy += q * aSize.x;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vP;
  varying float vA;
  varying float vSeed;
  float pH( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
  float pN( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( pH( i ), pH( i + vec2( 1.0, 0.0 ) ), u.x ), mix( pH( i + vec2( 0.0, 1.0 ) ), pH( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
  void main() {
    float d = length( vP );
    float n = 0.6 * pN( vP * 2.3 + vSeed * 31.0 ) + 0.4 * pN( vP * 5.1 + vSeed * 17.0 );
    float a = smoothstep( 1.0, 0.25, d + ( n - 0.5 ) * 0.7 ) * vA * uOpacity;
    if ( a < 0.003 ) discard;
    gl_FragColor = vec4( uColor * ( 0.82 + 0.3 * n ), a );
  }
`;

export interface PuffsOptions {
  count: number;
  color: THREE.ColorRepresentation;
  /** Where the plume starts. */
  from: THREE.Vector3;
  /** How long a puff lives, s; how high it rises and how far the wind takes it in that time, m. */
  life: number;
  rise: number;
  drift: [number, number];
  /** Size of a puff at its birth and at its end, m. */
  r0: number;
  r1: number;
  /** Spread across the plume at the end, m. */
  spread: number;
  opacity?: number;
  /** Stays in the frame of the world: not clipped, no shadow. */
  renderOrder?: number;
}

export class Puffs {
  readonly mesh: THREE.Mesh;
  private readonly offset: Float32Array;
  private readonly size: Float32Array;
  private readonly seeds: Float32Array;
  private clock = 0;
  /** The amount drawn, 0 to 1 (tests). */
  amount = 0;
  private readonly mat: THREE.ShaderMaterial;

  constructor(private readonly o: PuffsOptions) {
    const n = o.count;
    const quad = new THREE.PlaneGeometry(2, 2);
    const g = new THREE.InstancedBufferGeometry();
    g.index = quad.index;
    g.setAttribute('position', quad.attributes.position!);
    this.offset = new Float32Array(n * 3);
    this.size = new Float32Array(n * 2);
    this.seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const h = Math.sin(i * 12.9898) * 43758.5453;
      this.seeds[i] = h - Math.floor(h);
    }
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(this.offset, 3));
    g.setAttribute('aSize', new THREE.InstancedBufferAttribute(this.size, 2));
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(this.seeds, 1));
    g.instanceCount = n;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uColor: { value: new THREE.Color(o.color) }, uOpacity: { value: o.opacity ?? 0.5 } },
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = o.renderOrder ?? 8;
    this.mesh.castShadow = false;
    this.mesh.userData.noShadow = true;
    this.mesh.userData.notClipped = true;
    this.mesh.raycast = () => {};
    this.mesh.visible = false;
    this.place(0);
  }

  /** `amount` 0 to 1 from the model. */
  update(amount: number, dt: number, slowMo: number): void {
    this.clock += dt * slowMo;
    this.amount = amount;
    this.mesh.visible = amount > 0.005;
    if (!this.mesh.visible) return;
    this.place(amount);
  }

  setColor(c: THREE.ColorRepresentation): void {
    (this.mat.uniforms.uColor!.value as THREE.Color).set(c);
  }

  private place(amount: number): void {
    const { o } = this;
    const n = o.count;
    for (let i = 0; i < n; i++) {
      const s = this.seeds[i]!;
      const a = (i / n + this.clock / o.life) % 1;
      const rise = a ** 0.85 * o.rise * (0.85 + 0.3 * s);
      const sway = Math.sin(a * 5 + s * 40) * o.spread * 0.35 * a;
      const k = i * 3;
      this.offset[k] = o.from.x + a * o.drift[0] + sway + (s - 0.5) * o.spread * a;
      this.offset[k + 1] = o.from.y + rise;
      this.offset[k + 2] = o.from.z + a * o.drift[1] + Math.cos(a * 4 + s * 30) * o.spread * 0.35 * a;
      this.size[i * 2] = o.r0 + (o.r1 - o.r0) * a ** 0.8;
      // it fades in fast and thins out: less of it, thinner, as the model's amount falls
      this.size[i * 2 + 1] = Math.min(1, a * 8) * (1 - a) ** 1.3 * amount;
    }
    const g = this.mesh.geometry;
    (g.attributes.aOffset as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
  }
}
