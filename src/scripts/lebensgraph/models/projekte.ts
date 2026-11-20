// Projekt-Modelle: jedes Projekt zeigt aus der Nähe, was es tut.
import * as THREE from 'three';
import { type ModelBuilder, rng, stdMat, segments, NODE } from './kit';

export const PROJEKT_MODELLE: Record<string, ModelBuilder> = {
  // Bundesliga Predictor: ein Wald aus Entscheidungsbäumen, ein Pfad leuchtet als Prognose
  'p-bundesliga'(c) {
    const g = new THREE.Group(), rand = rng(5), sp = [0, .44, .22, .11];
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .05, 56), stdMat(c.clone().multiplyScalar(.28), { roughness: .9 })));
    const dim = stdMat(new THREE.Color('#8e8e93')), hot = stdMat(c, { emissive: c, emissiveIntensity: .9 });
    const outcome = [stdMat(c), stdMat(new THREE.Color('#8e8e93')), stdMat(new THREE.Color('#0a84ff'))];
    const lDim = new THREE.LineBasicMaterial({ color: 0x8e8e93, transparent: true, opacity: .55 }), lHot = new THREE.LineBasicMaterial({ color: c });
    for (let t = 0; t < 5; t++) {
      const ang = t / 5 * Math.PI * 2, tree = new THREE.Group();
      tree.position.set(Math.cos(ang) * 1.08, .03, Math.sin(ang) * 1.08); tree.rotation.y = -ang + Math.PI / 2; g.add(tree);
      const hotIdx = [0]; for (let L = 0; L < 3; L++) hotIdx.push(hotIdx[L] * 2 + (rand() < .5 ? 0 : 1));
      const P = (L: number, i: number) => new THREE.Vector3((i - (Math.pow(2, L) - 1) / 2) * sp[L], 1.35 - L * .38, 0);
      const dimPts: THREE.Vector3[] = [], hotPts: THREE.Vector3[] = [];
      for (let L = 0; L < 4; L++) for (let i = 0; i < Math.pow(2, L); i++) {
        const isHot = hotIdx[L] === i, m = new THREE.Mesh(NODE, L === 3 ? (isHot ? hot : outcome[i % 3]) : (isHot ? hot : dim));
        m.scale.setScalar(L === 3 ? .075 : .062); m.position.copy(P(L, i)); tree.add(m);
        if (L < 3) [0, 1].forEach(k => { const j = i * 2 + k; (isHot && hotIdx[L + 1] === j ? hotPts : dimPts).push(P(L, i), P(L + 1, j)); });
      }
      tree.add(segments(dimPts, lDim)); tree.add(segments(hotPts, lHot));
    }
    return { group: g, tick(dt) { g.rotation.y += dt * .22; } };
  },
  // Eigenes DL-Framework: ein kleines Netz, Signale wandern durch die Schichten
  'p-dllab'(c) {
    const g = new THREE.Group(), rand = rng(9), layers = [4, 6, 6, 3], pos: THREE.Vector3[][] = [];
    const mIn = stdMat(new THREE.Color('#8e8e93')), mHid = stdMat(c, { emissive: c, emissiveIntensity: .35 }), mOut = stdMat(new THREE.Color('#ffffff'), { emissive: new THREE.Color('#ffffff'), emissiveIntensity: .3 });
    layers.forEach((k, li) => {
      pos.push([]);
      for (let i = 0; i < k; i++) {
        const p = new THREE.Vector3(-1.2 + li * .8, .95 + (i - (k - 1) / 2) * .32, (rand() - .5) * .25); pos[li].push(p);
        const m = new THREE.Mesh(NODE, li === 0 ? mIn : li === layers.length - 1 ? mOut : mHid); m.scale.setScalar(.085); m.position.copy(p); g.add(m);
      }
    });
    const vp: number[] = [], vc: number[] = [], blue = new THREE.Color('#0a84ff'), orange = new THREE.Color('#ff9f0a');
    for (let li = 0; li < layers.length - 1; li++) pos[li].forEach(a => pos[li + 1].forEach(b => { vp.push(a.x, a.y, a.z, b.x, b.y, b.z); const cc = rand() < .5 ? blue : orange; vc.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b); }));
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); eg.setAttribute('color', new THREE.Float32BufferAttribute(vc, 3));
    g.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .32 })));
    const pm = new THREE.MeshBasicMaterial({ color: 0xffffff });
    type Pulse = { li: number; a: THREE.Vector3; b: THREE.Vector3; t: number; m: THREE.Mesh };
    const pick = (li: number, from?: THREE.Vector3) => ({ li, a: from ?? pos[li][Math.floor(rand() * pos[li].length)], b: pos[li + 1][Math.floor(rand() * pos[li + 1].length)], t: 0 });
    const pulses: Pulse[] = [];
    for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(NODE, pm); m.scale.setScalar(.035); g.add(m); pulses.push({ ...pick(0), t: rand(), m }); }
    let time = 0;
    return { group: g, tick(dt) {
      time += dt; g.rotation.y = Math.sin(time * .45) * .5;
      pulses.forEach(p => {
        p.t += dt * 1.1;
        if (p.t >= 1) Object.assign(p, p.li + 1 < layers.length - 1 ? pick(p.li + 1, p.b) : pick(0));
        p.m.position.lerpVectors(p.a, p.b, p.t);
      });
    } };
  },
  // Kompass: ein iPhone mit App-Bildschirm
  'p-kompass'() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.2, .11), stdMat(new THREE.Color('#2c2c2e'), { metalness: .6, roughness: .28 })); body.position.y = 1.2; g.add(body);
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 620; const x = cv.getContext('2d')!;
    const font = (w: number, s: number) => `${w} ${s}px -apple-system, Helvetica, Arial`;
    x.fillStyle = '#000'; x.fillRect(0, 0, 300, 620);
    x.fillStyle = '#fff'; x.font = font(600, 15); x.fillText('9:41', 26, 34);
    x.font = font(700, 30); x.fillText('Heute', 22, 92);
    x.fillStyle = '#8e8e93'; x.font = font(500, 14); x.fillText('Freitag, 20. November', 22, 116);
    x.lineWidth = 10; x.strokeStyle = '#2c2c2e'; x.beginPath(); x.arc(246, 86, 26, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#30d158'; x.lineCap = 'round'; x.beginPath(); x.arc(246, 86, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .62); x.stroke();
    ([['Mathe 3', 'Übungsblatt · 45 min', '#0a84ff'], ['Deep Learning', 'Vorlesung L5 · 90 min', '#bf5af2'], ['tech11', 'Werkstudent · 8 h', '#ff9f0a'], ['Laufen', '30 min', '#30d158']] as const).forEach(([t, s, cc], i) => {
      const y = 150 + i * 92; x.fillStyle = '#1c1c1e'; x.beginPath(); x.roundRect(18, y, 264, 78, 16); x.fill();
      x.fillStyle = cc; x.fillRect(30, y + 16, 5, 46);
      x.fillStyle = '#fff'; x.font = font(600, 17); x.fillText(t, 48, y + 34);
      x.fillStyle = '#8e8e93'; x.font = font(400, 14); x.fillText(s, 48, y + 58);
    });
    x.fillStyle = '#8e8e93'; x.font = font(600, 12); ['Heute', 'Lernen', 'Kalender', 'Zeit'].forEach((t, i) => x.fillText(t, 26 + i * 70, 596));
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(.98, 2.03), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 1.2, .056); g.add(scr);
    let time = 0;
    return { group: g, tick(dt) { time += dt; g.rotation.y = Math.sin(time * .6) * .55; } };
  },
  // Party Game: Server im Docker-Container, Handys der Mitspieler, Nachrichten über WebSockets
  'p-party'(c) {
    const g = new THREE.Group(), players = ['#ff375f', '#ffd60a', '#0a84ff', '#bf5af2', '#30d158'].map(h => new THREE.Color(h));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .05, 56), stdMat(c.clone().multiplyScalar(.28), { roughness: .9 })));
    const server = new THREE.Mesh(new THREE.BoxGeometry(.62, .86, .62), stdMat(new THREE.Color('#2c2c2e'), { metalness: .5, roughness: .3 })); server.position.y = .5; g.add(server);
    for (let i = 0; i < 3; i++) { const led = new THREE.Mesh(new THREE.BoxGeometry(.48, .035, .02), new THREE.MeshBasicMaterial({ color: c })); led.position.set(0, .3 + i * .2, .32); g.add(led); }
    const dockGeo = new THREE.BoxGeometry(1.1, 1.25, 1.1);
    const dock = new THREE.Mesh(dockGeo, new THREE.MeshBasicMaterial({ color: 0x0db7ed, transparent: true, opacity: .07, depthWrite: false })); dock.position.y = .65; g.add(dock);
    const dockEdges = new THREE.LineSegments(new THREE.EdgesGeometry(dockGeo), new THREE.LineBasicMaterial({ color: 0x0db7ed })); dockEdges.position.y = .65; g.add(dockEdges);
    const games = [new THREE.OctahedronGeometry(.13), new THREE.TorusGeometry(.1, .04, 10, 24), new THREE.BoxGeometry(.18, .18, .18)]
      .map((geo, i) => { const m = new THREE.Mesh(geo, stdMat(players[i], { emissive: players[i], emissiveIntensity: .3 })); g.add(m); return m; });
    const placeGames = (time: number) => games.forEach((m, i) => { const a = time * .9 + i * 2.1; m.position.set(Math.cos(a) * .42, 1.55 + Math.sin(time * 2 + i) * .06, Math.sin(a) * .42); });
    const top = new THREE.Vector3(0, .9, 0), conn: THREE.Vector3[] = [], pg = new THREE.SphereGeometry(.045, 10, 8);
    const pulses: { m: THREE.Mesh; a: THREE.Vector3; b: THREE.Vector3; t: number }[] = [];
    players.forEach((pc, i) => {
      const a = i / players.length * Math.PI * 2, p = new THREE.Group();
      p.position.set(Math.cos(a) * 1.45, .42, Math.sin(a) * 1.45);
      p.add(new THREE.Mesh(new THREE.BoxGeometry(.3, .56, .035), stdMat(new THREE.Color('#1c1c1e'), { metalness: .4, roughness: .3 })));
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(.26, .5), new THREE.MeshBasicMaterial({ color: pc })); scr.position.z = .019; p.add(scr);
      p.lookAt(0, .42, 0); p.rotateY(Math.PI); g.add(p);
      const from = p.position.clone().add(new THREE.Vector3(0, .3, 0)); conn.push(from, top);
      for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: pc })); g.add(m); pulses.push({ m, a: k ? top : from, b: k ? from : top, t: (i * .21 + k * .5) % 1 }); }
    });
    g.add(segments(conn, new THREE.LineBasicMaterial({ color: 0x8e8e93, transparent: true, opacity: .45 })));
    pulses.forEach(p => p.m.position.lerpVectors(p.a, p.b, p.t)); placeGames(0);
    let time = 0;
    return { group: g, tick(dt) {
      time += dt; g.rotation.y = Math.sin(time * .35) * .5; placeGames(time);
      games.forEach(m => { m.rotation.x += dt; m.rotation.y += dt * 1.3; });
      pulses.forEach(p => { p.t = (p.t + dt * .7) % 1; p.m.position.lerpVectors(p.a, p.b, p.t); });
    } };
  },
};
