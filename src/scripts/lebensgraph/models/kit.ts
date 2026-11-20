// Baukasten für die kleinen 3D-Modelle, in die sich Monde aus der Nähe verwandeln.
import * as THREE from 'three';

export interface Model { group: THREE.Group; tick(dt: number, t: number): void }
export type ModelBuilder = (c: THREE.Color) => Model;

/** Reproduzierbarer Zufall, damit Modelle bei jedem Laden gleich aussehen. */
export const rng = (seed: number) => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

export const NODE = new THREE.SphereGeometry(1, 14, 10);
export const stdMat = (c: THREE.Color, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: .45, metalness: .05, ...extra });
export const segments = (points: THREE.Vector3[], mat: THREE.LineBasicMaterial) =>
  new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), mat);

export const WHITE = new THREE.Color('#f5f5f7'), GRAY = new THREE.Color('#8e8e93'), DARK = new THREE.Color('#1c1c1e'),
  GREEN = new THREE.Color('#30d158'), RED = new THREE.Color('#ff453a'), ORANGE = new THREE.Color('#ff9f0a'),
  PURPLE = new THREE.Color('#bf5af2'), YELLOW = new THREE.Color('#ffd60a'), TEAL = new THREE.Color('#64d2ff'),
  BLUE = new THREE.Color('#0a84ff');

type P = THREE.Object3D;
export const K = {
  V: (x: number, y: number, z: number) => new THREE.Vector3(x, y, z),
  glow: (col: THREE.Color): THREE.MeshStandardMaterialParameters => ({ emissive: col, emissiveIntensity: .6 }),
  base(g: P, c: THREE.Color) { g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .05, 48), stdMat(c.clone().multiplyScalar(.28), { roughness: .9 }))); },
  box(g: P, w: number, h: number, d: number, col: THREE.Color, x = 0, y = 0, z = 0, extra?: THREE.MeshStandardMaterialParameters) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stdMat(col, extra)); m.position.set(x, y, z); g.add(m); return m;
  },
  ball(g: P, r: number, col: THREE.Color, x = 0, y = 0, z = 0, extra?: THREE.MeshStandardMaterialParameters) {
    const m = new THREE.Mesh(NODE, stdMat(col, extra)); m.scale.setScalar(r); m.position.set(x, y, z); g.add(m); return m;
  },
  line(g: P, pts: THREE.Vector3[], col: THREE.Color, op?: number) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: op != null, opacity: op ?? 1 })); g.add(l); return l;
  },
  segs(g: P, pts: THREE.Vector3[], col: THREE.Color, op?: number) {
    const l = segments(pts, new THREE.LineBasicMaterial({ color: col, transparent: op != null, opacity: op ?? 1 })); g.add(l); return l;
  },
  arrow(g: P, from: THREE.Vector3, to: THREE.Vector3, col: THREE.Color) {
    const d = to.clone().sub(from), len = d.length();
    const a = new THREE.ArrowHelper(d.normalize(), from, len, col, Math.min(.22, len * .3), .1); g.add(a); return a;
  },
};

/** Status auch am Modell: geplant = Glas, läuft = Ring um den Sockel. */
export function statusLook(m: Model, vis: 'done' | 'now' | 'plan', c: THREE.Color) {
  if (vis === 'plan') {
    const mats = new Map<THREE.Material, boolean>();
    m.group.traverse(o => {
      const mat = (o as THREE.Mesh).material;
      if (mat) ([] as THREE.Material[]).concat(mat).forEach(mt => mats.set(mt, (o as THREE.Line).isLine === true));
    });
    mats.forEach((isLine, mt) => { mt.transparent = true; mt.opacity = mt.opacity * (isLine ? .6 : .38); if (!isLine) mt.depthWrite = false; });
  }
  if (vis === 'now') {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.95, .035, 8, 96), new THREE.MeshBasicMaterial({ color: c }));
    r.rotation.x = Math.PI / 2; r.position.y = .03; m.group.add(r);
  }
}
