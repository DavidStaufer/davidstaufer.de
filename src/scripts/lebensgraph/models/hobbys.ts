// Hobby-Modelle: zeigen, warum mir das Spaß macht. Die Texte dazu schreibt David.
import * as THREE from 'three';
import { type ModelBuilder, rng, stdMat, segments } from './kit';

export const HOBBY_MODELLE: Record<string, ModelBuilder> = {
  // Fußball: Ball, Tor und Rasen
  'h-fussball'() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .05, 56), stdMat(new THREE.Color('#2f7d3a'), { roughness: .95 })));
    const lm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(new THREE.RingGeometry(.48, .52, 48), lm); circle.rotation.x = -Math.PI / 2; circle.position.y = .03; g.add(circle);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3.3, .04), lm); line.rotation.x = -Math.PI / 2; line.position.y = .03; g.add(line);
    const post = new THREE.CylinderGeometry(.03, .03, .7, 10), pm = stdMat(new THREE.Color('#ffffff'));
    [-.7, .7].forEach(px => { const p = new THREE.Mesh(post, pm); p.position.set(px, .35, -1.15); g.add(p); });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.43, 10), pm); bar.rotation.z = Math.PI / 2; bar.position.set(0, .7, -1.15); g.add(bar);
    const bg = new THREE.IcosahedronGeometry(.36, 1), ball = new THREE.Mesh(bg, stdMat(new THREE.Color('#f4f4f6'), { flatShading: true, roughness: .35 }));
    ball.add(new THREE.LineSegments(new THREE.EdgesGeometry(bg), new THREE.LineBasicMaterial({ color: 0x1c1c1e }))); g.add(ball);
    ball.position.set(0, .4, .3);
    let time = 0;
    return { group: g, tick(dt) { time += dt; ball.position.set(Math.sin(time * .7) * .5, .4 + Math.abs(Math.sin(time * 2.4)) * .55, Math.cos(time * .7) * .3); ball.rotation.x += dt * 2.2; } };
  },
  // Märkte & Daten: Kerzen einer Börsenkurve
  'h-maerkte'(c) {
    const g = new THREE.Group(), rand = rng(3), up = stdMat(new THREE.Color('#30d158')), dn = stdMat(new THREE.Color('#ff453a'));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .05, 56), stdMat(c.clone().multiplyScalar(.25), { roughness: .9 })));
    let v = .6; const wp: THREE.Vector3[] = [];
    for (let i = 0; i < 9; i++) {
      const o = v; v = Math.max(.25, v + (rand() - .38) * .35); const h = Math.max(.05, Math.abs(v - o)), xx = -1.2 + i * .3;
      const m = new THREE.Mesh(new THREE.BoxGeometry(.16, h, .16), v >= o ? up : dn); m.position.set(xx, Math.min(o, v) + h / 2, 0); g.add(m);
      wp.push(new THREE.Vector3(xx, Math.min(o, v) - .08, 0), new THREE.Vector3(xx, Math.max(o, v) + .1, 0));
    }
    g.add(segments(wp, new THREE.LineBasicMaterial({ color: 0x8e8e93 })));
    let time = 0;
    return { group: g, tick(dt) { time += dt; g.rotation.y = Math.sin(time * .5) * .6; } };
  },
  // Paddle Tennis: Schläger und Ball
  'h-paddle'(c) {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .08, 40), stdMat(c, { roughness: .35 })); head.rotation.x = Math.PI / 2; head.position.y = 1.35; g.add(head);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .8, 14), stdMat(new THREE.Color('#2c2c2e'))); grip.position.y = .45; g.add(grip);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), stdMat(new THREE.Color('#d8ef5a'))); ball.position.set(.9, 1.1, .3); g.add(ball);
    let time = 0;
    return { group: g, tick(dt) { time += dt; g.rotation.y = Math.sin(time * .8) * .7; ball.position.set(.9, 1.1 + Math.sin(time * 3) * .45, .3); } };
  },
  // Skifahren: Berg mit Schneekappe und Piste
  'h-ski'(c) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 7), stdMat(new THREE.Color('#7f8aa3'), { flatShading: true })); m.position.y = 1.1; g.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.58, .9, 7), stdMat(new THREE.Color('#ffffff'), { flatShading: true })); cap.position.y = 1.75; g.add(cap);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30, r = .62 + t * .9, a = t * Math.PI * 3; pts.push(new THREE.Vector3(Math.cos(a) * r, 1.95 - t * 1.85, Math.sin(a) * r)); }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: c })));
    return { group: g, tick(dt) { g.rotation.y += dt * .25; } };
  },
};
