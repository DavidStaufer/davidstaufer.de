// Das Sonnensystem: David ist die Sonne, Bereiche kreisen als Planeten, Semester und Module als Monde.
import * as THREE from 'three';
import { type Graph, type Node, PLANET_ORDER, isLeaf, isDesc, leavesOf, visOf, pathTo } from './data';
import { createEngine, reduceMotion, narrow } from './engine';
import { createUi, headerBottom } from './ui';
import { MODELS, statusLook, rng, type Model } from './models';

const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const col = (n: string) => new THREE.Color(css(n) || '#888888');
const backOut = (x: number) => { const k = 1.70158; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
const SPHERE = new THREE.SphereGeometry(1, 40, 28), SPHERE_LO = new THREE.SphereGeometry(1, 14, 10);
const TORUS = new THREE.TorusGeometry(1.6, .07, 8, 72), RING = new THREE.TorusGeometry(1, .05, 8, 72);

interface Orbit { line: THREE.Line; mat: THREE.LineBasicMaterial; base: number; target: number }
interface Rec {
  n: Node; mesh: THREE.Mesh; body: THREE.Object3D; pivot?: THREE.Object3D; speed?: number;
  mats: THREE.Material[]; base: number[]; alpha: number; label: HTMLElement;
  orbit?: Orbit; model?: Model; modelScale: number; morph: number; morphT: number;
}

export function startSolarSystem(stage: HTMLElement, graph: Graph) {
  const { root: TREE, byId, skillMap } = graph;
  const hasModel = (n: Node) => !!MODELS[n.id];
  const modelScaleOf = (n: Node) => n.kind === 'module' ? .3 : 1;
  const planets = PLANET_ORDER.map(a => TREE.children.find(c => c.area === a)).filter((p): p is Node => !!p);

  let focus: Node = TREE, selected: Node | null = null, skillSel: string | null = null, hover: Node | null = null;
  let ts = reduceMotion ? 0 : 1, userPaused = reduceMotion, introOn = true;
  const recs = new Map<string, Rec>();

  const ui = createUi(graph, {
    skill: (id, fromBar) => onSkill(id, fromBar),
    reveal: id => onReveal(id),
    sheetChanged: () => { engine.updateShift(); if (!ui.sheetNode && selected) { selected = null; apply(); } },
  });
  const engine = createEngine<Node>(stage, {
    onPick: n => onPick(n), onHover: n => { if (n !== hover) { hover = n; apply(); } }, update: (dt, t) => update(dt, t),
    viewShift: (_w, h) => ({ x: (!narrow() && ui.sheetNode) ? 190 : 0, y: -(headerBottom() - 70) / 2 + ((narrow() && ui.sheetNode) ? h * .22 : 0) }),
  });
  const { scene, camera, fit, label, pickable, flyTo } = engine;
  scene.background = col('--bg');

  // ---------- Größen und Bahnen ----------
  // Planetengröße = wie viel drinsteckt; Abstand = Nähe zum Kern
  const RAD = (n: Node) => n.kind === 'root' ? 4.5 : n.depth === 1 ? 1 + Math.sqrt(leavesOf(n).length) * .45
    : !isLeaf(n) ? (n.depth === 2 ? .75 : .36) : (n.depth === 2 ? .55 : n.depth === 3 ? .24 : .17);
  const GAP = (d: number) => [4, 1.3, .55, .3][d] ?? .25;
  const extC = new Map<string, number>();
  let rootR: { radii: number[]; last: number } | null = null;
  const orbitOf = (n: Node) => { const ce = Math.max(...n.children.map(extent)), k = n.children.length; return { r: Math.max(RAD(n) + GAP(n.depth) + ce, k * 2 * ce * 1.3 / (Math.PI * 2)), ce }; };
  function rootOrbits() {
    if (rootR) return rootR;
    let start = RAD(TREE) + GAP(0);
    const radii = planets.map(p => { const e = extent(p), r = start + e; start = r + e + GAP(0); return r; });
    return (rootR = { radii, last: start });
  }
  function extent(n: Node): number {
    if (extC.has(n.id)) return extC.get(n.id)!;
    let e = RAD(n);
    if (hasModel(n)) e = 2.1 * modelScaleOf(n);
    else if (!isLeaf(n)) { if (n.kind === 'root') e = rootOrbits().last; else { const o = orbitOf(n); e = o.r + o.ce; } }
    extC.set(n.id, e); return e;
  }
  function ring(r: number, c: THREE.Color, parent: THREE.Object3D, op: number): Orbit {
    const pts: THREE.Vector3[] = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    const mat = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op }), line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    parent.add(line); return { line, mat, base: op, target: 1 };
  }
  // Kugel mit Status: fertig = massiv, läuft = Ring, geplant = Glas mit Drahtgitter
  function makeOrb(n: Node, c: THREE.Color, rad: number) {
    const v = (n.kind === 'root' || !isLeaf(n)) ? 'done' : visOf(n);
    const mat = new THREE.MeshStandardMaterial({ color: c, roughness: .32, metalness: .06, emissive: c, emissiveIntensity: .16, transparent: true, opacity: v === 'plan' ? .22 : 1 });
    const mesh = new THREE.Mesh(SPHERE, mat); mesh.scale.setScalar(rad);
    const mats: THREE.Material[] = [mat], base = [mat.opacity];
    if (v === 'now') { const m2 = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .95 }); const r = new THREE.Mesh(TORUS, m2); r.rotation.x = Math.PI / 2.3; mesh.add(r); mats.push(m2); base.push(.95); }
    if (v === 'plan') { const m3 = new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: .55 }); const w = new THREE.Mesh(SPHERE_LO, m3); w.scale.setScalar(1.03); mesh.add(w); mats.push(m3); base.push(.55); }
    return { mesh, mats, base };
  }
  function build(n: Node, tiltG: THREE.Object3D, orbitR: number, phase: number, speed: number, rand: () => number) {
    const pivot = new THREE.Group(); pivot.rotation.y = phase; tiltG.add(pivot);
    const body = new THREE.Group(); body.position.set(orbitR, 0, 0); pivot.add(body);
    const c = col('--c-' + n.area), o = makeOrb(n, c, RAD(n)); body.add(o.mesh);
    const rec: Rec = { n, ...o, body, pivot, speed, alpha: 1, modelScale: modelScaleOf(n), morph: 0, morphT: 0,
      label: label(o.mesh, n.short || n.name, 'l3' + (n.depth === 1 ? ' big' : ''), new THREE.Vector3(0, -1.3, 0), n) };
    pickable(o.mesh, n, isLeaf(n) || n.depth >= 2);
    if (hasModel(n)) {
      const m = MODELS[n.id](c); statusLook(m, visOf(n), c);
      m.group.visible = false; m.group.scale.setScalar(.0001); body.add(m.group); pickable(m.group, n, false); rec.model = m;
    }
    recs.set(n.id, rec);
    if (!isLeaf(n)) {
      const { r } = orbitOf(n), tg = new THREE.Group(); tg.rotation.set((rand() - .5) * .6, 0, (rand() - .5) * .6); body.add(tg);
      rec.orbit = ring(r, c, tg, .4); rec.orbit.target = 0;
      const k = n.children.length, sp = n.depth === 1 ? .22 : .32, ph = rand() * Math.PI * 2;
      n.children.forEach((ch, i) => build(ch, tg, r, ph + i / k * Math.PI * 2, sp, rand));
    }
  }

  // ---------- Szene ----------
  const rand = rng(11);
  scene.add(new THREE.HemisphereLight(0xffffff, col('--bg'), .5 * Math.PI));
  scene.add(new THREE.PointLight(0xfff2d6, 1.45 * Math.PI, 0, 0));
  const sunMat = new THREE.MeshBasicMaterial({ color: col('--sun'), transparent: true });
  const sun = new THREE.Mesh(SPHERE, sunMat); sun.scale.setScalar(RAD(TREE)); scene.add(sun);
  {
    const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d')!, gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,214,120,0.85)'); gr.addColorStop(.3, 'rgba(255,190,90,0.3)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(gc); tex.colorSpace = THREE.SRGBColorSpace;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(32); scene.add(glow);
  }
  recs.set(TREE.id, { n: TREE, mesh: sun, body: sun, mats: [sunMat], base: [1], alpha: 1, modelScale: 1, morph: 0, morphT: 0,
    label: label(sun, TREE.name, 'l3 root', new THREE.Vector3(0, -1.3, 0), TREE) });
  pickable(sun, TREE, false);
  rootOrbits().radii.forEach((R, i) => {
    const tg = new THREE.Group(); tg.rotation.set((rand() - .5) * .16, 0, (rand() - .5) * .16); scene.add(tg);
    ring(R, col('--fg-3'), tg, .45);
    build(planets[i], tg, R, rand() * Math.PI * 2, 1.4 / Math.pow(R, 1.15), rand);
  });
  {
    const sp = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) { const v = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize().multiplyScalar(800 + rand() * 900); sp.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x9a9cab, size: 1.6, sizeAttenuation: false, transparent: true, opacity: .85 })));
  }
  const selRing = new THREE.Mesh(RING, new THREE.MeshBasicMaterial({ color: col('--fg'), transparent: true, opacity: .9 })); selRing.visible = false; scene.add(selRing);

  // ---------- Zustand ----------
  const wp = (n: Node) => n === TREE ? new THREE.Vector3() : recs.get(n.id)!.body.getWorldPosition(new THREE.Vector3());
  const wpModel = (n: Node) => wp(n).add(new THREE.Vector3(0, .75 * modelScaleOf(n), 0));
  function apply() {
    const ev = skillSel ? new Set(skillMap.get(skillSel)!.evidence.map(x => x.id)) : null;
    recs.forEach((o, id) => {
      const n = o.n;
      if (ev) o.alpha = (ev.has(id) || n === TREE) ? 1 : .12;
      else if (n === focus || isDesc(n, focus) || n === TREE) o.alpha = 1;
      else if (isDesc(focus, n)) o.alpha = .6;
      else o.alpha = .16;
      let show = (n === TREE && !hasModel(focus)) || (ev ? ev.has(id) : (n === focus || n.parent === focus || (focus === TREE && n.depth === 1) || n === selected || n === hover));
      if (n === focus && o.model) show = false;
      o.label.classList.toggle('hide', !show);
      o.label.classList.toggle('f', !ev && n === focus && n !== TREE);
      if (o.orbit) o.orbit.target = ev ? .15 : n === focus ? 1 : isDesc(focus, n) ? .6 : (focus === TREE && n.depth === 1) ? .35 : 0;
    });
  }
  let constel: THREE.Line | null = null, constelRecs: Rec[] = [];
  function drawConst(id: string | null) {
    if (constel) { scene.remove(constel); constel.geometry.dispose(); (constel.material as THREE.Material).dispose(); constel = null; }
    if (!id) return;
    constelRecs = skillMap.get(id)!.evidence.map(e => recs.get(e.id)).filter((r): r is Rec => !!r);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(constelRecs.length * 3), 3));
    constel = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col('--c-skill'), transparent: true, opacity: .95 }));
    constel.frustumCulled = false; scene.add(constel);
  }
  const clearSkill = () => { skillSel = null; ui.markSkill(null); drawConst(null); };
  const crumbs = () => ui.setCrumbs(pathTo(focus).map((x, i) => ({ label: i === 0 ? 'Start' : (x.short || x.name), fn: () => { ui.closeSheet(); go(x); } })));
  const timeFor = (n: Node) => n.depth === 0 ? 1 : n.depth === 1 ? .45 : .15;
  const origin = () => new THREE.Vector3();

  function go(n: Node, dur?: number) {
    if (skillSel) clearSkill();
    focus = n; selected = null;
    recs.forEach(o => { if (o.model) o.morphT = o.n === n ? 1 : 0; });
    apply(); crumbs();
    const d = hasModel(n) ? fit(3.1 * modelScaleOf(n)) : fit(extent(n)) * (n === TREE ? .8 : 1);
    flyTo(hasModel(n) ? () => wpModel(n) : () => wp(n), d, { follow: true, minY: n === TREE ? .45 : hasModel(n) ? .36 : .2, dur });
  }
  const select = (n: Node | null) => { selected = n; apply(); };
  function onPick(n: Node | null) {
    if (introOn) return;
    if (!n) { if (ui.sheetNode) ui.closeSheet(); else if (skillSel) onSkill(skillSel, true); else if (focus.parent) go(focus.parent); return; }
    if (n === TREE) { if (focus !== TREE) go(TREE); ui.openSheet(TREE); return; }
    if (n === focus) { if (hasModel(n)) { ui.openSheet(n, true); return; } if (n.parent) { ui.closeSheet(); go(n.parent); } return; }
    if (hasModel(n)) { go(n); ui.openSheet(n, true); return; }
    if (!isLeaf(n)) { ui.closeSheet(); go(n); return; }
    if (!isDesc(n, focus) || skillSel) go(n.parent!);
    select(n); ui.openSheet(n);
  }
  function onSkill(id: string, fromBar: boolean) {
    if (fromBar && skillSel === id) { clearSkill(); apply(); ui.closeSheet(); return; }
    if (focus !== TREE) { focus = TREE; recs.forEach(o => { if (o.model) o.morphT = 0; }); crumbs(); flyTo(origin, fit(extent(TREE)) * .8, { follow: true, minY: .45 }); }
    skillSel = id; ui.markSkill(id); drawConst(id); selected = null; apply(); ui.openSheet(skillMap.get(id)!);
  }
  function onReveal(id: string) {
    const n = byId.get(id); if (!n) { onSkill(id, false); return; }
    if (hasModel(n)) { go(n); ui.openSheet(n, true); return; }
    if (!isLeaf(n)) { ui.closeSheet(); go(n); return; }
    if (!isDesc(n, focus) || skillSel) go(n.parent!);
    select(n); ui.openSheet(n);
  }

  // ---------- Bewegung ----------
  const motionBtn = document.querySelector('#motion') as HTMLButtonElement;
  const paintMotion = () => {
    motionBtn.setAttribute('aria-pressed', String(userPaused));
    motionBtn.querySelector('span')!.textContent = userPaused ? 'Bewegung fortsetzen' : 'Bewegung anhalten';
    motionBtn.querySelector('svg')!.innerHTML = userPaused
      ? '<path d="M3.5 2.2v9.6a.8.8 0 0 0 1.2.7l7.8-4.8a.8.8 0 0 0 0-1.4L4.7 1.5a.8.8 0 0 0-1.2.7z"/>'
      : '<rect x="2.5" y="2" width="3" height="10" rx="1"/><rect x="8.5" y="2" width="3" height="10" rx="1"/>';
  };
  motionBtn.addEventListener('click', () => { userPaused = !userPaused; paintMotion(); });
  paintMotion();

  const tmp = new THREE.Vector3();
  function update(dt: number, t: number) {
    const want = (userPaused || ui.sheetNode || hover) ? 0 : skillSel ? .3 : timeFor(focus);
    ts += (want - ts) * Math.min(1, dt * 3);
    recs.forEach(o => {
      if (o.speed && o.pivot) { o.pivot.rotation.y += o.speed * dt * ts; o.body.rotation.y = -o.pivot.rotation.y; }
      o.mats.forEach((m, i) => { const tg = o.base[i] * o.alpha; if (Math.abs(m.opacity - tg) > .002) m.opacity += (tg - m.opacity) * .14; });
      if (o.orbit) { const tg = o.orbit.base * o.orbit.target; o.orbit.mat.opacity += (tg - o.orbit.mat.opacity) * .12; o.orbit.line.visible = o.orbit.mat.opacity > .01; }
      if (o.model) {
        o.morph = reduceMotion ? o.morphT : o.morph + (o.morphT - o.morph) * Math.min(1, dt * 4.5);
        const m = o.morph;
        o.mesh.scale.setScalar(RAD(o.n) * Math.max(.001, 1 - Math.min(1, m * 1.6)));
        o.model.group.visible = m > .01;
        o.model.group.scale.setScalar(o.modelScale * Math.max(.0001, m >= .999 ? 1 : backOut(m)));
        if (m > .01 && !reduceMotion) o.model.tick(dt, t);
      }
    });
    if (constel) { const a = constel.geometry.attributes.position as THREE.BufferAttribute; constelRecs.forEach((o, i) => { o.body.getWorldPosition(tmp); a.setXYZ(i, tmp.x, tmp.y, tmp.z); }); a.needsUpdate = true; }
    if (selected) { selRing.visible = true; selRing.position.copy(wp(selected)); selRing.scale.setScalar(RAD(selected) * 1.9); selRing.quaternion.copy(camera.quaternion); }
    else selRing.visible = false;
  }

  // ---------- Einflug: aus den Sternen ins System, Tippen überspringt ----------
  {
    const ov = document.querySelector('#intro') as HTMLElement, rootD = fit(extent(TREE)) * .8;
    document.body.classList.add('intro');
    focus = TREE; apply(); crumbs();
    const finish = (skip: boolean) => {
      if (!introOn) return; introOn = false;
      if (skip) flyTo(origin, rootD, { follow: true, minY: .45, dur: 450 });
      ov.classList.add('out'); document.body.classList.remove('intro'); ui.syncFade();
      setTimeout(() => ov.remove(), 800);
    };
    if (reduceMotion) {
      camera.position.set(0, rootD * .45, rootD * .89); engine.controls.target.set(0, 0, 0); engine.setFollow(origin);
      finish(false);
    } else {
      camera.position.set(0, 140, 1300); engine.controls.target.set(0, 0, 0);
      flyTo(origin, rootD, { follow: true, minY: .45, dur: 3400 });
      ov.addEventListener('pointerdown', () => finish(true));
      window.addEventListener('keydown', () => finish(true), { once: true });
      setTimeout(() => finish(false), 2900);
    }
  }
  window.addEventListener('keydown', e => {
    if (introOn || (e.target as Element | null)?.closest?.('input,textarea,[contenteditable]')) return;
    if (e.key === 'Escape') { if (ui.sheetNode) ui.closeSheet(); else if (skillSel) onSkill(skillSel, true); else if (focus.parent) go(focus.parent); }
    if (e.key === ' ' && e.target === document.body) { e.preventDefault(); userPaused = !userPaused; paintMotion(); }
  });
  engine.start();
}
