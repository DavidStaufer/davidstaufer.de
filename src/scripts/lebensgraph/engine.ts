// 3D-Motor: Renderer, Kamera, Kamerafahrten, Beschriftungen und Antippen.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const narrow = () => window.innerWidth < 720;

export interface Pickable<N> { obj: THREE.Object3D; node: N; small: boolean }
export interface FlyOptions { follow?: boolean; minY?: number; dur?: number }

export interface EngineHooks<N> {
  onPick(node: N | null): void;
  onHover(node: N | null): void;
  update(dt: number, t: number): void;
  /** Wie weit das Bild verschoben werden soll (Detailblatt, Kopfzeile). */
  viewShift(w: number, h: number): { x: number; y: number };
}

export function createEngine<N>(stage: HTMLElement, hooks: EngineHooks<N>) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = 'gl';
  stage.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'labels3';
  stage.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 5000);
  const controls = new OrbitControls(camera, labels.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.rotateSpeed = .6; controls.zoomSpeed = .9; controls.panSpeed = .8;

  let W = 1, H = 1;
  const shift = { x: 0, y: 0 };
  let shiftT = { x: 0, y: 0 };
  const applyShift = () => {
    if (Math.abs(shift.x) < .5 && Math.abs(shift.y) < .5) camera.clearViewOffset();
    else camera.setViewOffset(W, H, shift.x, shift.y, W, H);
  };
  const updateShift = () => { shiftT = hooks.viewShift(W, H); };
  const size = () => {
    W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    renderer.setSize(W, H); labels.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    updateShift(); shift.x = shiftT.x; shift.y = shiftT.y; applyShift();
  };
  size();
  new ResizeObserver(size).observe(stage);

  /** Abstand, aus dem eine Kugel mit Radius `ext` vollständig ins Bild passt. */
  const fit = (ext: number) => {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2, h = Math.atan(Math.tan(v) * camera.aspect);
    return ext / Math.sin(Math.min(v, h)) + .5;
  };

  const labelNode = new WeakMap<Element, N>();
  const label = (parent: THREE.Object3D, text: string, cls: string, pos?: THREE.Vector3, node?: N) => {
    const el = document.createElement('div'); el.className = cls;
    if (node) { labelNode.set(el, node); el.classList.add('hit'); }
    const sp = document.createElement('span'); sp.textContent = text; el.appendChild(sp);
    const ob = new CSS2DObject(el); if (pos) ob.position.copy(pos); parent.add(ob);
    return el;
  };

  const pickables: Pickable<N>[] = [];
  const pickable = (obj: THREE.Object3D, node: N, small = false) => { const p = { obj, node, small }; obj.userData.pick = p; pickables.push(p); };

  // Kamerafahrt: startet an der aktuellen Position und lässt sich jederzeit unterbrechen
  type Fly = { t0: number; dur: number; fromT: THREE.Vector3; fromOff: THREE.Vector3; get: () => THREE.Vector3; toOff: THREE.Vector3 };
  let fly: Fly | null = null, follow: (() => THREE.Vector3) | null = null;
  const lastF = new THREE.Vector3();
  const flyTo = (tgt: THREE.Vector3 | (() => THREE.Vector3), dist: number, opt: FlyOptions = {}) => {
    const get = typeof tgt === 'function' ? tgt : () => tgt;
    const fromT = controls.target.clone(), fromOff = camera.position.clone().sub(controls.target);
    const dir = fromOff.clone(); if (dir.lengthSq() < 1e-6) dir.set(0, .5, 1); dir.normalize();
    if (opt.minY != null && dir.y < opt.minY) {
      const hl = Math.hypot(dir.x, dir.z);
      if (hl < 1e-4) dir.set(0, opt.minY, Math.sqrt(1 - opt.minY * opt.minY));
      else { const s = Math.sqrt(1 - opt.minY * opt.minY) / hl; dir.set(dir.x * s, opt.minY, dir.z * s); }
    }
    fly = { t0: performance.now(), dur: reduceMotion ? 0 : (opt.dur ?? 1150), fromT, fromOff, get, toOff: dir.multiplyScalar(dist) };
    follow = opt.follow ? get : null;
  };
  const setFollow = (get: () => THREE.Vector3) => { follow = get; lastF.copy(get()); };
  controls.addEventListener('start', () => { if (fly && follow) lastF.copy(follow()); fly = null; });

  // Antippen: zuerst Beschriftung, dann Strahl, zuletzt der nächste kleine Himmelskörper in Fingernähe
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmp = new THREE.Vector3();
  const pickAt = (cx: number, cy: number): Pickable<N> | null => {
    const r = renderer.domElement.getBoundingClientRect(), mx = cx - r.left, my = cy - r.top;
    ndc.set(mx / r.width * 2 - 1, -(my / r.height) * 2 + 1);
    camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables.filter(p => p.obj.visible !== false).map(p => p.obj), true);
    for (const h of hits) { let ob: THREE.Object3D | null = h.object; while (ob && !ob.userData.pick) ob = ob.parent; if (ob) return ob.userData.pick; }
    let best: Pickable<N> | null = null, bd = 26;
    for (const p of pickables) {
      if (!p.small) continue;
      p.obj.getWorldPosition(tmp); tmp.project(camera); if (tmp.z > 1 || tmp.z < -1) continue;
      const d = Math.hypot((tmp.x + 1) / 2 * r.width - mx, (1 - tmp.y) / 2 * r.height - my);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
  {
    const el = labels.domElement;
    let down: { x: number; y: number; node: N | null } | null = null, hoverRaf = 0;
    const labelAt = (t: EventTarget | null) => { const l = (t as Element | null)?.closest?.('.l3.hit'); return l ? labelNode.get(l) ?? null : null; };
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, node: labelAt(e.target) }; });
    el.addEventListener('pointerup', e => {
      if (!down) return; const d = down; down = null;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 7) return;
      if (d.node) { hooks.onPick(d.node); return; }
      const p = pickAt(e.clientX, e.clientY); hooks.onPick(p ? p.node : null);
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || e.buttons || hoverRaf) return;
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = 0;
        const n = labelAt(e.target) ?? pickAt(e.clientX, e.clientY)?.node ?? null;
        el.style.cursor = n ? 'pointer' : ''; hooks.onHover(n);
      });
    });
    el.addEventListener('pointerleave', () => hooks.onHover(null));
  }

  const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let last = performance.now();
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    hooks.update(dt, now / 1000);
    if (fly) {
      const k = fly.dur ? Math.min(1, (now - fly.t0) / fly.dur) : 1, e = ease(k), T = fly.get();
      controls.target.lerpVectors(fly.fromT, T, e);
      camera.position.copy(controls.target).add(fly.fromOff.clone().lerp(fly.toOff, e));
      if (k >= 1) { fly = null; lastF.copy(T); }
    } else if (follow) {
      const T = follow(), d = T.clone().sub(lastF);
      camera.position.add(d); controls.target.add(d); lastF.copy(T);
    }
    const sx = shiftT.x - shift.x, sy = shiftT.y - shift.y;
    if (Math.abs(sx) > .3 || Math.abs(sy) > .3) { shift.x += sx * .16; shift.y += sy * .16; applyShift(); }
    controls.update();
    renderer.render(scene, camera); labels.render(scene, camera);
  };
  const start = () => requestAnimationFrame(frame);

  return { THREE, renderer, scene, camera, controls, fit, label, pickable, flyTo, setFollow, updateShift, start };
}
export type Engine<N> = ReturnType<typeof createEngine<N>>;
