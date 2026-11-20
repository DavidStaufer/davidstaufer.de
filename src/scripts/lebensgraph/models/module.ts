// Modul-Modelle: jedes Modul bekommt ein kleines, thematisch passendes Motiv.
// Sie werden mit Faktor 0,3 skaliert, passend zu den kleinen Modul-Monden.
import * as THREE from 'three';
import { type ModelBuilder, K, rng, stdMat, NODE, WHITE, GRAY, DARK, GREEN, RED, ORANGE, PURPLE, YELLOW, TEAL } from './kit';

export const MODUL_MODELLE: Record<string, ModelBuilder> = {
  // GADS: Balken, die sich per Bubble Sort ordnen
  'm-gads'(c) {
    const g = new THREE.Group(); K.base(g, c); const rand = rng(31), bars = [];
    for (let v = 1; v <= 8; v++) { const h = .2 + v * .17, m = K.box(g, .24, h, .24, c.clone().lerp(WHITE, v / 10), 0, h / 2, 0); m.userData.v = v; bars.push(m); }
    let arr = [], i = 0, swapped = false, acc = 0, pause = 0;
    const shuffle = () => { arr = bars.slice(); for (let k = arr.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [arr[k], arr[j]] = [arr[j], arr[k]]; } i = 0; swapped = false; };
    shuffle(); arr.forEach((b, k) => { b.position.x = -1.05 + k * .3; });
    return {group:g, tick(dt){
      acc += dt;
      if (pause > 0) { pause -= dt; if (pause <= 0) shuffle(); }
      else if (acc > .35) { acc = 0; if (arr[i].userData.v > arr[i + 1].userData.v) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; swapped = true; } i++; if (i >= arr.length - 1) { if (!swapped) pause = 1.6; i = 0; swapped = false; } }
      arr.forEach((b, k) => { b.position.x += (-1.05 + k * .3 - b.position.x) * Math.min(1, dt * 8); b.material.emissive.setRGB(0, 0, 0); });
      if (pause <= 0) { arr[i].material.emissive.copy(ORANGE).multiplyScalar(.5); arr[i + 1].material.emissive.copy(ORANGE).multiplyScalar(.5); }
    }};
  },
  // Softwaretechnik (WI): Klassendiagramm mit Vererbung
  'm-swtwi'(c) {
    const g = new THREE.Group(); K.base(g, c);
    const cls = (x, y) => { K.box(g, .9, .62, .06, WHITE.clone().lerp(c, .12), x, y, 0); K.box(g, .9, .16, .07, c, x, y + .23, 0); K.box(g, .6, .04, .07, GRAY, x - .08, y + .02, .001); K.box(g, .5, .04, .07, GRAY, x - .13, y - .12, .001); };
    cls(0, 1.55); cls(-.62, .55); cls(.62, .55);
    K.segs(g, [K.V(-.62, .86, 0), K.V(-.62, 1.05, 0), K.V(.62, .86, 0), K.V(.62, 1.05, 0), K.V(-.62, 1.05, 0), K.V(.62, 1.05, 0), K.V(0, 1.05, 0), K.V(0, 1.14, 0)], WHITE);
    const tri = new THREE.Mesh(new THREE.ConeGeometry(.08, .12, 3), new THREE.MeshBasicMaterial({color:WHITE})); tri.position.set(0, 1.19, 0); g.add(tri);
    return {group:g, tick(dt){ g.rotation.y += dt * .3; }};
  },
  // Differentialrechnung: Kurve mit wandernder Tangente
  'm-diff'(c) {
    const g = new THREE.Group(); K.base(g, c); const f = x => .3 + .55 * x * x, df = x => 1.1 * x, pts = [];
    for (let i = 0; i <= 60; i++) { const x = -1.45 + i / 60 * 2.9; pts.push(K.V(x, f(x), 0)); }
    K.line(g, pts, c); K.segs(g, [K.V(-1.6, .08, 0), K.V(1.6, .08, 0), K.V(0, .08, 0), K.V(0, 1.8, 0)], GRAY, .6);
    const tan = K.line(g, [K.V(0, 0, 0), K.V(0, 0, 0)], ORANGE), dot = K.ball(g, .07, ORANGE, 0, 0, 0, K.glow(ORANGE)); let time = 0;
    const place = () => { const x0 = 1.15 * Math.sin(time * .6), y0 = f(x0), s = df(x0), dx = .7 / Math.sqrt(1 + s * s), a = tan.geometry.attributes.position; a.setXYZ(0, x0 - dx, y0 - s * dx, 0); a.setXYZ(1, x0 + dx, y0 + s * dx, 0); a.needsUpdate = true; dot.position.set(x0, y0, 0); };
    place(); return {group:g, tick(dt){ time += dt; place(); }};
  },
  // Lineare Algebra: Würfel unter einer linearen Abbildung mit Basisvektoren
  'm-lawi'(c) {
    const g = new THREE.Group(); K.base(g, c);
    const ref = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({color:GRAY, transparent:true, opacity:.35})); ref.position.y = .9; g.add(ref);
    const T = new THREE.Group(); T.matrixAutoUpdate = false; g.add(T);
    T.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({color:c})));
    T.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:c, transparent:true, opacity:.18, depthWrite:false})));
    [[1, 0, 0, RED], [0, 1, 0, GREEN], [0, 0, 1, TEAL]].forEach(([x, y, z, col]) => K.arrow(T, K.V(-.5, -.5, -.5), K.V(-.5 + x * 1.15, -.5 + y * 1.15, -.5 + z * 1.15), col));
    let time = 0;
    const set = () => { const s = .55 * Math.sin(time * .8), k = 1 + .2 * Math.sin(time * .5); T.matrix.set(k, s, 0, 0, 0, 1, 0, .9, 0, 0, 1 / k, 0, 0, 0, 0, 1); T.matrixWorldNeedsUpdate = true; };
    set(); return {group:g, tick(dt){ time += dt; set(); }};
  },
  // Statistik: Histogramm unter der Glockenkurve
  'm-statwi'(c) {
    const g = new THREE.Group(); K.base(g, c); const pts = [], bell = x => Math.exp(-x * x / (2 * .42 * .42));
    for (let i = 0; i < 11; i++) { const x = -1.25 + i * .25, h = .08 + 1.35 * bell(x); K.box(g, .2, h, .2, c.clone().lerp(WHITE, .15 + .45 * h / 1.45), x, h / 2 + .03, 0); }
    for (let i = 0; i <= 60; i++) { const x = -1.45 + i / 60 * 2.9; pts.push(K.V(x, .14 + 1.38 * bell(x), 0)); }
    K.line(g, pts, WHITE); return {group:g, tick(dt){ g.rotation.y += dt * .3; }};
  },
  // E-Business: Einkaufstüte und Münzstapel
  'm-ebiz'(c) {
    const g = new THREE.Group(); K.base(g, c); K.box(g, .9, .95, .5, c, -.35, .5, 0);
    const h = new THREE.Mesh(new THREE.TorusGeometry(.24, .035, 10, 32, Math.PI), stdMat(WHITE)); h.position.set(-.35, .97, 0); g.add(h);
    const coinGeo = new THREE.CylinderGeometry(.22, .22, .06, 28), gold = stdMat(YELLOW, {metalness:.6, roughness:.3});
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(coinGeo, gold); m.position.set(.7, .06 + i * .065, .1); g.add(m); }
    const coin = new THREE.Mesh(coinGeo, stdMat(YELLOW, {metalness:.6, roughness:.3, emissive:YELLOW, emissiveIntensity:.25})); coin.rotation.x = Math.PI / 2; coin.position.set(.7, .8, .1); g.add(coin);
    let time = 0; return {group:g, tick(dt){ time += dt; coin.position.y = .75 + Math.abs(Math.sin(time * 2)) * .4; coin.rotation.z += dt * 4; }};
  },
  // Grundlagen der Programmierung: Code-Editor mit blinkendem Cursor
  'm-gdp'(c) {
    const g = new THREE.Group(); K.base(g, c);
    K.box(g, 1.9, 1.25, .06, DARK, 0, .85, 0); K.box(g, 1.9, .14, .07, new THREE.Color('#3a3a3c'), 0, 1.41, 0);
    [RED, YELLOW, GREEN].forEach((col, i) => K.ball(g, .03, col, -.85 + i * .09, 1.41, .04));
    [[0, .9, c], [.15, .6, PURPLE], [.15, .75, WHITE], [.3, .5, GREEN], [.15, .4, ORANGE], [0, .2, c]].forEach(([ind, w, col], i) => K.box(g, w, .055, .07, col, -.78 + ind + w / 2, 1.2 - i * .15, .005));
    const cur = K.box(g, .05, .09, .07, WHITE, -.52, .45, .006); let time = 0;
    return {group:g, tick(dt){ time += dt; cur.visible = Math.sin(time * 6) > 0; g.rotation.y = Math.sin(time * .5) * .4; }};
  },
  // AKIDS 1: Breitensuche breitet sich durch einen Graphen aus
  'm-akids1'(c) {
    const g = new THREE.Group(); K.base(g, c); const rand = rng(41), P = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + rand() * .4, r = .35 + rand() * 1.1; P.push(K.V(Math.cos(a) * r, .35 + rand() * 1.1, Math.sin(a) * r)); }
    const adj = P.map(() => new Set());
    P.forEach((p, i) => P.map((q, j) => [j, p.distanceTo(q)]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2).forEach(([j]) => { adj[i].add(j); adj[j].add(i); }));
    const ep = []; adj.forEach((s, i) => s.forEach(j => { if (i < j) ep.push(P[i], P[j]); })); K.segs(g, ep, GRAY, .6);
    const lvl = P.map(() => Infinity); lvl[0] = 0; const q = [0];
    while (q.length) { const i = q.shift(); adj[i].forEach(j => { if (lvl[j] === Infinity) { lvl[j] = lvl[i] + 1; q.push(j); } }); }
    const maxL = Math.max(...lvl.filter(isFinite)), nodes = P.map(p => K.ball(g, .1, GRAY, p.x, p.y, p.z)); let time = 0;
    const paint = () => { const ph = (time % 4) / 3.2 * (maxL + 1); nodes.forEach((m, i) => { const on = lvl[i] <= ph; m.material.color.copy(on ? c : GRAY); m.material.emissive.copy(c).multiplyScalar(on ? .5 : 0); }); };
    paint(); return {group:g, tick(dt){ time += dt; paint(); }};
  },
  // Mathe 1: Koordinatenachsen und eine Spirale
  'm-mk1'(c) {
    const g = new THREE.Group(); K.base(g, c); const o = K.V(-.9, .1, -.4);
    K.arrow(g, o, K.V(1.1, .1, -.4), RED); K.arrow(g, o, K.V(-.9, 1.9, -.4), GREEN); K.arrow(g, o, K.V(-.9, .1, 1.3), TEAL);
    const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120 * Math.PI * 6; pts.push(K.V(Math.cos(t) * .6, .25 + i / 120 * 1.4, Math.sin(t) * .6)); }
    K.line(g, pts, c); const dot = K.ball(g, .07, WHITE, 0, 0, 0, K.glow(WHITE)); let time = 0;
    const place = () => { const u = (time * .15) % 1, t = u * Math.PI * 6; dot.position.set(Math.cos(t) * .6, .25 + u * 1.4, Math.sin(t) * .6); };
    place(); return {group:g, tick(dt){ time += dt; place(); }};
  },
  // Programmierpraktikum: Git-Verlauf mit Branches und Merges
  'm-pp'(c) {
    const g = new THREE.Group(); K.base(g, c); const main = [];
    for (let i = 0; i < 8; i++) main.push(K.V(-1.4 + i * .4, .5, 0));
    K.line(g, main, c); main.forEach(p => K.ball(g, .08, c, p.x, p.y, p.z));
    const b1 = [K.V(-.6, .5, 0), K.V(-.4, .95, .25), K.V(0, .95, .3), K.V(.4, .95, .25), K.V(.6, .5, 0)];
    K.line(g, new THREE.CatmullRomCurve3(b1).getPoints(40), ORANGE); [b1[1], b1[2], b1[3]].forEach(p => K.ball(g, .08, ORANGE, p.x, p.y, p.z));
    const b2 = [K.V(.2, .5, 0), K.V(.5, 1.35, -.2), K.V(1.0, 1.35, -.25), K.V(1.4, .5, 0)];
    K.line(g, new THREE.CatmullRomCurve3(b2).getPoints(40), PURPLE); [b2[1], b2[2]].forEach(p => K.ball(g, .08, PURPLE, p.x, p.y, p.z));
    return {group:g, tick(dt){ g.rotation.y += dt * .3; }};
  },
  // AKIDS 2: Tabelle der dynamischen Programmierung füllt sich diagonal
  'm-akids2'(c) {
    const g = new THREE.Group(); K.base(g, c); const cells = [], n = 6;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = Math.min(i, j) + 1 + ((i * j) % 3) * .3, h = .1 + v * .17, m = K.box(g, .3, h, .3, c.clone().lerp(WHITE, v / 9), -.9 + j * .36, h / 2, -.9 + i * .36); m.userData.k = i + j; m.userData.h = h; cells.push(m); }
    let time = 4;
    const paint = () => { const ph = (time % 5) / 4 * (2 * n - 1); cells.forEach(m => { const s = Math.max(.01, Math.min(1, ph - m.userData.k)); m.scale.y = s; m.position.y = m.userData.h * s / 2; }); };
    paint(); return {group:g, tick(dt){ time += dt; paint(); }};
  },
  // Mathe 2: Fläche einer Funktion zweier Variablen
  'm-mk2'(c) {
    const g = new THREE.Group(); K.base(g, c);
    const geo = new THREE.PlaneGeometry(2.6, 2.6, 26, 26); geo.rotateX(-Math.PI / 2);
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:c, wireframe:true})));
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:c, transparent:true, opacity:.18, side:THREE.DoubleSide, depthWrite:false})));
    const pos = geo.attributes.position; let time = 0;
    const wave = () => { for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, .85 + .38 * Math.sin(x * 2.2 + time) * Math.cos(z * 2.2 - time * .7)); } pos.needsUpdate = true; };
    wave(); return {group:g, tick(dt){ time += dt; wave(); }};
  },
  // DSML: zwei Klassen und eine trennende Ebene
  'm-dsml'(c) {
    const g = new THREE.Group(); K.base(g, c); const rand = rng(51), gs = () => (rand() + rand() + rand() - 1.5) * .5;
    for (let i = 0; i < 16; i++) { K.ball(g, .07, c, -.6 + gs(), .95 + gs(), -.2 + gs()); K.ball(g, .07, ORANGE, .6 + gs(), .85 + gs(), .3 + gs()); }
    const pg = new THREE.PlaneGeometry(2.2, 1.8), pl = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({color:WHITE, transparent:true, opacity:.14, side:THREE.DoubleSide, depthWrite:false}));
    pl.position.set(0, .9, .05); pl.rotation.y = Math.PI / 2 - .5; g.add(pl);
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(pg), new THREE.LineBasicMaterial({color:WHITE, transparent:true, opacity:.5})); ed.position.copy(pl.position); ed.rotation.copy(pl.rotation); g.add(ed);
    return {group:g, tick(dt){ g.rotation.y += dt * .3; }};
  },
  // Softwaretechnik (KIDS): eine Testsuite wird grün
  'm-swt'(c) {
    const g = new THREE.Group(); K.base(g, c); K.box(g, 1.7, 1.25, .05, DARK, 0, .85, -.05);
    const tests = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) tests.push(K.box(g, .3, .26, .08, GRAY, -.6 + k * .4, 1.2 - r * .35, 0));
    let time = 0;
    const paint = () => { const ph = (time % 6) / 4.5 * tests.length; tests.forEach((m, i) => { const col = i >= ph ? GRAY : (i === 6 && ph < 9 ? RED : GREEN); m.material.color.copy(col); m.material.emissive.copy(col).multiplyScalar(col === GRAY ? 0 : .35); }); };
    paint(); return {group:g, tick(dt){ time += dt; paint(); }};
  },
  // Deep Learning: ein Faltungsfilter wandert übers Bild
  'm-dl'(c) {
    const g = new THREE.Group(); K.base(g, c); const s = .3, rand = rng(61);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) K.box(g, .26, .05, .26, c.clone().lerp(WHITE, rand() * .6), -.75 + j * s, .1, -.75 + i * s);
    const out = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) out.push(K.box(g, .22, .05, .22, GRAY, -.39 + j * .26, 1.45, -.39 + i * .26));
    const kern = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.9, .14, .9)), new THREE.LineBasicMaterial({color:ORANGE})); g.add(kern);
    const ray = K.line(g, [K.V(0, 0, 0), K.V(0, 0, 0)], ORANGE, .8); let time = 0;
    const place = () => {
      const step = Math.floor(time / .35) % 16, i = Math.floor(step / 4), j = step % 4;
      kern.position.set(-.75 + (j + 1) * s, .12, -.75 + (i + 1) * s);
      out.forEach((m, k) => { m.material.color.copy(k <= step ? c : GRAY); m.material.emissive.copy(c).multiplyScalar(k === step ? .7 : 0); });
      const a = ray.geometry.attributes.position, o = out[step].position; a.setXYZ(0, kern.position.x, .18, kern.position.z); a.setXYZ(1, o.x, o.y, o.z); a.needsUpdate = true;
    };
    place(); return {group:g, tick(dt){ time += dt; place(); }};
  },
  // Theory of ML: Trainings- und Testfehler über die Modellkomplexität
  'm-toml'(c) {
    const g = new THREE.Group(); K.base(g, c);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshBasicMaterial({color:WHITE, transparent:true, opacity:.06, side:THREE.DoubleSide, depthWrite:false})); pane.position.y = .95; g.add(pane);
    K.segs(g, [K.V(-1.25, .2, 0), K.V(1.25, .2, 0), K.V(-1.25, .2, 0), K.V(-1.25, 1.75, 0)], GRAY, .7);
    const tr = x => .3 + 1.25 * Math.exp(-(x + 1.25) * 1.5), te = x => .45 + .35 * Math.pow(x - .05, 2) + .6 * Math.exp(-(x + 1.25) * 1.8), A = [], B = [];
    for (let i = 0; i <= 60; i++) { const x = -1.2 + i / 60 * 2.4; A.push(K.V(x, tr(x), .01)); B.push(K.V(x, te(x), .01)); }
    K.line(g, A, c); K.line(g, B, ORANGE);
    const d1 = K.ball(g, .06, c, 0, 0, .02, K.glow(c)), d2 = K.ball(g, .06, ORANGE, 0, 0, .02, K.glow(ORANGE)); let time = 0;
    const place = () => { const x = 1.1 * Math.sin(time * .5); d1.position.set(x, tr(x), .02); d2.position.set(x, te(x), .02); };
    place(); return {group:g, tick(dt){ time += dt; place(); g.rotation.y = Math.sin(time * .4) * .4; }};
  },
  // Mathe 3: Regressionsebene mit Residuen
  'm-m3'(c) {
    const g = new THREE.Group(); K.base(g, c); const rand = rng(71), f = (x, z) => .9 + .25 * x + .18 * z;
    const pg = new THREE.PlaneGeometry(2.4, 2.4, 4, 4); pg.rotateX(-Math.PI / 2); const pa = pg.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setY(i, f(pa.getX(i), pa.getZ(i)));
    g.add(new THREE.Mesh(pg, new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:.22, side:THREE.DoubleSide, depthWrite:false})));
    g.add(new THREE.LineSegments(new THREE.WireframeGeometry(pg), new THREE.LineBasicMaterial({color:c, transparent:true, opacity:.45})));
    const res = []; for (let i = 0; i < 22; i++) { const x = (rand() - .5) * 2.2, z = (rand() - .5) * 2.2, y = f(x, z) + (rand() - .5) * .7; K.ball(g, .06, WHITE, x, y, z); res.push(K.V(x, y, z), K.V(x, f(x, z), z)); }
    K.segs(g, res, ORANGE, .8); return {group:g, tick(dt){ g.rotation.y += dt * .3; }};
  },
  // Rechnernetze: Router und Pakete
  'm-rui'(c) {
    const g = new THREE.Group(); K.base(g, c); const rand = rng(81);
    const P = [K.V(-1.2, .5, -.3), K.V(-.5, 1.2, .5), K.V(0, .6, -.8), K.V(.6, 1.3, -.1), K.V(1.2, .6, .5), K.V(.2, 1.7, .4), K.V(-.3, .3, .9)];
    const E = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [3, 5], [1, 5], [4, 6], [0, 6], [2, 4]];
    P.forEach(p => K.box(g, .2, .2, .2, c, p.x, p.y, p.z, {emissive:c, emissiveIntensity:.25}));
    K.segs(g, E.flatMap(([a, b]) => [P[a], P[b]]), GRAY, .6);
    const packets = []; for (let i = 0; i < 6; i++) packets.push({m: K.ball(g, .05, i % 2 ? ORANGE : WHITE, 0, 0, 0, K.glow(i % 2 ? ORANGE : WHITE)), e: E[Math.floor(rand() * E.length)], t: rand(), dir: rand() < .5});
    const step = dt => packets.forEach(p => { p.t += dt * .8; if (p.t >= 1) { p.t = 0; p.e = E[Math.floor(rand() * E.length)]; p.dir = rand() < .5; } const a = P[p.e[p.dir ? 0 : 1]], b = P[p.e[p.dir ? 1 : 0]]; p.m.position.lerpVectors(a, b, p.t); });
    step(0); return {group:g, tick(dt){ step(dt); g.rotation.y += dt * .2; }};
  },
  // Datenbanken: Datenbank-Zylinder und Tabelle
  'm-db'(c) {
    const g = new THREE.Group(); K.base(g, c);
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .32, 40), stdMat(c, {roughness:.35})); m.position.set(-.55, .22 + i * .38, 0); g.add(m); const rim = new THREE.Mesh(new THREE.TorusGeometry(.5, .02, 8, 48), new THREE.MeshBasicMaterial({color:WHITE})); rim.rotation.x = Math.PI / 2; rim.position.set(-.55, .38 + i * .38, 0); g.add(rim); }
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) K.box(g, .3, .16, .04, r === 0 ? c : WHITE.clone().lerp(GRAY, .5), .45 + k * .33, 1.25 - r * .2, 0);
    return {group:g, tick(dt){ g.rotation.y += dt * .3; }};
  },
  // Lab 1: Erlenmeyerkolben mit aufsteigenden Blasen
  'm-lab1'(c) {
    const g = new THREE.Group(); K.base(g, c); const glass = {transparent:true, opacity:.28, roughness:.1, depthWrite:false, side:THREE.DoubleSide}, rand = rng(91);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.17, .75, 1.0, 40, 1, true), stdMat(WHITE, glass)); body.position.y = .55; g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .55, 24, 1, true), stdMat(WHITE, glass)); neck.position.y = 1.32; g.add(neck);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(.45, .72, .5, 40), stdMat(c, {emissive:c, emissiveIntensity:.3, transparent:true, opacity:.85})); liq.position.y = .3; g.add(liq);
    const bub = []; for (let i = 0; i < 7; i++) bub.push({m: K.ball(g, .04 + rand() * .03, WHITE, 0, 0, 0, K.glow(WHITE)), t: rand(), x: rand() - .5, z: rand() - .5});
    const step = dt => bub.forEach(b => { b.t = (b.t + dt * .35) % 1; const y = .15 + b.t * 1.45, r = y < 1.05 ? .75 - .58 * ((y - .05) / 1.0) : .17; b.m.position.set(b.x * r * 1.2, y, b.z * r * 1.2); });
    step(0); return {group:g, tick(dt){ step(dt); }};
  },
  // Theoretische Informatik: endlicher Automat, ein Zustand wandert
  'm-thi'(c) {
    const g = new THREE.Group(); K.base(g, c); const n = 4, P = [], rm = new THREE.MeshBasicMaterial({color:WHITE});
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; P.push(K.V(Math.cos(a) * .95, .9, Math.sin(a) * .95)); }
    P.forEach((p, i) => { K.ball(g, .17, c, p.x, p.y, p.z, {transparent:true, opacity:.6}); const r = new THREE.Mesh(new THREE.TorusGeometry(.2, .025, 8, 40), rm); r.position.copy(p); g.add(r); if (i === n - 1) { const r2 = r.clone(); r2.scale.setScalar(1.3); g.add(r2); } });
    P.forEach((p, i) => { const q = P[(i + 1) % n], d = q.clone().sub(p).normalize(); K.arrow(g, p.clone().add(d.clone().multiplyScalar(.27)), q.clone().sub(d.clone().multiplyScalar(.27)), GRAY); });
    const tok = K.ball(g, .07, ORANGE, 0, 0, 0, K.glow(ORANGE)); let time = 0;
    const place = () => { const u = time * .7, i = Math.floor(u) % n, f = u % 1; tok.position.lerpVectors(P[i], P[(i + 1) % n], f); tok.position.y += Math.sin(f * Math.PI) * .25; };
    place(); return {group:g, tick(dt){ time += dt; place(); }};
  },
  // Rechenanlagen: Prozessor mit Leiterbahnen
  'm-ra'(c) {
    const g = new THREE.Group(); K.base(g, c);
    K.box(g, 1.5, .12, 1.5, DARK, 0, .16, 0, {metalness:.4});
    K.box(g, .62, .08, .62, c, 0, .26, 0, {metalness:.6, roughness:.25, emissive:c, emissiveIntensity:.2});
    const pinG = new THREE.BoxGeometry(.06, .03, .22), pinM = stdMat(new THREE.Color('#c7c7cc'), {metalness:.8, roughness:.3});
    for (let s = 0; s < 4; s++) for (let i = 0; i < 7; i++) { const t = -.6 + i * .2, m = new THREE.Mesh(pinG, pinM); if (s < 2) m.position.set(t, .1, s ? .85 : -.85); else { m.rotation.y = Math.PI / 2; m.position.set(s === 2 ? .85 : -.85, .1, t); } g.add(m); }
    const tr = []; for (let i = 0; i < 7; i++) { const t = -.6 + i * .2; tr.push(K.V(t, .23, .31), K.V(t, .23, .74), K.V(t, .23, -.31), K.V(t, .23, -.74)); }
    K.segs(g, tr, YELLOW, .7); const pulse = K.ball(g, .035, YELLOW, 0, .24, 0, K.glow(YELLOW)); let time = 0;
    const place = () => { const u = (time * .8) % 1, i = Math.floor(time * .8) % 7; pulse.position.set(-.6 + i * .2, .24, .31 + u * .43); };
    place(); return {group:g, tick(dt){ time += dt; place(); g.rotation.y += dt * .25; }};
  },
  // Betriebssysteme: Speicherseiten und ein Scheduler
  'm-bs'(c) {
    const g = new THREE.Group(); K.base(g, c); const procs = [c, ORANGE, PURPLE], pages = [], rand = rng(17);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) pages.push(K.box(g, .3, .3, .3, GRAY, -.85 + k * .34, .2, -.2 + r * .4));
    const ring = new THREE.Group(); ring.position.y = 1.3; ring.rotation.x = Math.PI / 2; g.add(ring);
    ring.add(new THREE.Mesh(new THREE.TorusGeometry(.55, .02, 8, 48), new THREE.MeshBasicMaterial({color:WHITE, transparent:true, opacity:.6})));
    procs.forEach((pc, i) => K.ball(ring, .09, pc, Math.cos(i * 2.09) * .55, Math.sin(i * 2.09) * .55, 0, K.glow(pc)));
    const alloc = pages.map(() => Math.floor(rand() * 4)), paint = () => pages.forEach((m, i) => m.material.color.copy(alloc[i] === 3 ? GRAY : procs[alloc[i]]));
    paint(); let time = 0;
    return {group:g, tick(dt){ const before = Math.floor(time / .6); time += dt; ring.rotation.z += dt * .8; if (Math.floor(time / .6) !== before) { alloc[Math.floor(rand() * alloc.length)] = Math.floor(rand() * 4); paint(); } }};
  },
  // Lab 2: ein kleiner Roboter
  'm-lab2'(c) {
    const g = new THREE.Group(); K.base(g, c); K.box(g, .8, .7, .6, c.clone().lerp(WHITE, .2), 0, .4, 0, {roughness:.35});
    const head = new THREE.Group(); head.position.y = 1.15; g.add(head); K.box(head, .75, .55, .55, c, 0, 0, 0, {roughness:.3});
    const eyeM = new THREE.MeshBasicMaterial({color:TEAL}), eyes = [-.17, .17].map(x => { const e = new THREE.Mesh(NODE, eyeM); e.scale.setScalar(.07); e.position.set(x, .05, .28); head.add(e); return e; });
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .3, 8), stdMat(GRAY)); ant.position.y = .42; head.add(ant); K.ball(head, .06, RED, 0, .6, 0, K.glow(RED));
    let time = 0; return {group:g, tick(dt){ time += dt; head.rotation.y = Math.sin(time * .9) * .6; const bl = (time % 3) < .12; eyes.forEach(e => e.scale.set(.07, bl ? .01 : .07, .07)); }};
  },
  // Numerik: Interpolation durch Messpunkte
  'm-num'(c) {
    const g = new THREE.Group(); K.base(g, c); const xs = [-1.3, -.8, -.3, .2, .7, 1.2], ys = [.5, 1.2, .8, 1.5, .7, 1.1], P = xs.map((x, i) => K.V(x, ys[i], 0));
    P.forEach(p => K.ball(g, .07, WHITE, p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(P); K.line(g, curve.getPoints(80), c);
    const truth = []; for (let i = 0; i <= 60; i++) { const x = -1.3 + i / 60 * 2.5; truth.push(K.V(x, .95 + .4 * Math.sin(x * 2.6 + .4), -.05)); } K.line(g, truth, GRAY, .5);
    const dot = K.ball(g, .06, ORANGE, 0, 0, 0, K.glow(ORANGE)); let time = 0;
    const place = () => dot.position.copy(curve.getPoint((Math.sin(time * .5) + 1) / 2));
    place(); return {group:g, tick(dt){ time += dt; place(); g.rotation.y = Math.sin(time * .35) * .5; }};
  },
  // Funktionale Programmierung: ein Lambda in Klammern
  'm-fp'(c) {
    const g = new THREE.Group(); K.base(g, c); const L = new THREE.Group(); L.position.y = .95; g.add(L);
    const m = stdMat(c, {emissive:c, emissiveIntensity:.25, roughness:.3});
    const long = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.5, .16), m); long.rotation.z = .42; L.add(long);
    const short = new THREE.Mesh(new THREE.BoxGeometry(.16, .8, .16), m); short.rotation.z = -.55; short.position.set(-.22, -.38, 0); L.add(short);
    [Math.PI * .7, -Math.PI * .3].forEach(rz => { const p = new THREE.Mesh(new THREE.TorusGeometry(.95, .045, 8, 40, Math.PI * .6), stdMat(WHITE)); p.rotation.z = rz; L.add(p); });
    return {group:g, tick(dt){ L.rotation.y += dt * .6; }};
  },
  // Lab 3: eine Rakete
  'm-lab3'(c) {
    const g = new THREE.Group(); K.base(g, c); const R = new THREE.Group(); g.add(R);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 1.0, 28), stdMat(WHITE, {roughness:.35})); b.position.y = .9; R.add(b);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.22, .42, 28), stdMat(c)); nose.position.y = 1.61; R.add(nose);
    K.ball(R, .08, TEAL, 0, 1.1, .2, K.glow(TEAL));
    for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.25, .3, .04), stdMat(c)); const a = i / 3 * Math.PI * 2; f.position.set(Math.cos(a) * .3, .5, Math.sin(a) * .3); f.rotation.y = -a; R.add(f); }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.15, .4, 16), new THREE.MeshBasicMaterial({color:ORANGE, transparent:true, opacity:.9})); flame.rotation.x = Math.PI; flame.position.y = .2; R.add(flame);
    let time = 0; return {group:g, tick(dt){ time += dt; R.position.y = .1 + Math.sin(time * 1.4) * .08; flame.scale.set(1, .8 + Math.random() * .5, 1); R.rotation.y += dt * .4; }};
  },
  // MCI: ein Finger tippt auf ein Tablet
  'm-mci'(c) {
    const g = new THREE.Group(); K.base(g, c); const T = new THREE.Group(); T.position.set(0, .75, 0); T.rotation.x = -.55; g.add(T);
    K.box(T, 1.5, 1.05, .05, DARK, 0, 0, 0, {metalness:.4});
    [[c, -.35, .25, .6, .3], [ORANGE, .35, .25, .5, .3], [GREEN, 0, -.2, 1.2, .25]].forEach(([col, x, y, w, h]) => K.box(T, w, h, .02, col, x, y, .035, {emissive:col, emissiveIntensity:.25}));
    const finger = new THREE.Mesh(THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(.08, .35, 6, 12) : new THREE.CylinderGeometry(.08, .08, .5, 12), stdMat(new THREE.Color('#f2c6a0'))); finger.rotation.x = -.3; g.add(finger);
    const ripple = new THREE.Mesh(new THREE.RingGeometry(.08, .11, 32), new THREE.MeshBasicMaterial({color:WHITE, transparent:true, opacity:.8, side:THREE.DoubleSide})); ripple.position.set(-.35, .25, .05); T.add(ripple);
    let time = 0;
    const place = () => { const u = (time % 1.6) / 1.6, down = Math.max(0, Math.sin(u * Math.PI * 2)); finger.position.set(-.35, 1.29 + (1 - down) * .25, -.04); ripple.scale.setScalar(u < .5 ? 1 + u * 4 : 3); ripple.material.opacity = u < .5 ? .8 * (1 - u * 2) : 0; };
    place(); return {group:g, tick(dt){ time += dt; place(); }};
  },
  // Bachelorarbeit: Abschlussarbeit mit Absolventenhut
  'm-ba'(c) {
    const g = new THREE.Group(); K.base(g, c);
    K.box(g, 1.2, .22, 1.5, c, 0, .14, 0, {roughness:.5}); K.box(g, 1.12, .18, 1.42, WHITE, .03, .15, 0);
    const cap = new THREE.Group(); cap.position.y = .62; g.add(cap);
    const cc = new THREE.Mesh(new THREE.CylinderGeometry(.33, .36, .28, 28), stdMat(DARK)); cc.position.y = .1; cap.add(cc);
    K.box(cap, .95, .04, .95, DARK, 0, .26, 0).rotation.y = Math.PI / 4; K.ball(cap, .04, YELLOW, 0, .29, 0);
    const tassel = new THREE.Group(); tassel.position.set(0, .29, 0); cap.add(tassel);
    K.line(tassel, [K.V(0, 0, 0), K.V(.55, -.02, 0), K.V(.6, -.35, 0)], YELLOW); K.ball(tassel, .05, YELLOW, .6, -.38, 0);
    let time = 0; return {group:g, tick(dt){ time += dt; cap.rotation.y += dt * .5; tassel.rotation.z = Math.sin(time * 2) * .12; }};
  }
};
