// Bedienoberfläche über der Szene: Pfad, Detailblatt, Skill-Leiste, Bewegungsknopf.
import { type Graph, type Node, type SkillNode, STATUS, AREA_LABEL, color, visOf } from './data';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const joinDe = (a: string[]) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1];
export const headerBottom = () => $('header.top').getBoundingClientRect().bottom;

const ICON_X = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8"/></svg>';
const ICON_PERSON = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="17" r="9"/><path d="M7 44c1.5-9.5 8.5-15 17-15s15.5 5.5 17 15z"/></svg>';

type Sheetable = Node | SkillNode;
export interface UiHandlers { skill(id: string, fromBar: boolean): void; reveal(id: string): void; sheetChanged(): void }

export function createUi(graph: Graph, on: UiHandlers) {
  const sheet = $('#sheet'), skillbar = $('#skillbar');
  let sheetNode: Sheetable | null = null;

  const textLabel = (n: Node) => {
    if (n.kind === 'module') return ({ 'bestanden': 'Was ich mitnehme', 'läuft': 'Was ich gerade lerne', 'geplant': 'Darum geht’s' } as Record<string, string>)[n.status ?? ''];
    if (n.kind === 'project') return 'Worum es geht';
    if (n.kind === 'job') return n.status === 'aktuell' ? 'Was ich mache' : 'Was ich mitnehme';
    if (n.kind === 'hobby') return 'Warum ich das mache';
    return null;
  };
  const eyebrowOf = (n: Sheetable) => ({ module: 'Studium · Modul', project: 'Projekt', job: 'Arbeit', hobby: 'Hobby', skill: 'Skill' } as Record<string, string>)[n.kind] || AREA_LABEL[n.area ?? ''] || '';
  const metaOf = (n: Node) => n.kind === 'module' && n.parent ? [n.parent.name, n.parent.sub, n.ects ? n.ects + ' ECTS' : null].filter(Boolean).join(' · ') : (n.sub || '');
  const relSub = (r: Node) => r.kind === 'module' && r.parent ? (r.parent.short || r.parent.name) : (AREA_LABEL[r.area ?? ''] || '');
  const relBtn = (r: Node) => `<button class="rel" data-reveal="${esc(r.id)}" style="--c:${color(r)}"><i class="v ${visOf(r)}"></i><span>${esc(r.name)}</span><small>${esc(relSub(r))}</small></button>`;
  const relationsOf = (n: Node) => {
    const out = new Map<string, Node>();
    n.links.forEach(id => { const r = graph.byId.get(id); if (r) out.set(id, r); });
    graph.byId.forEach(o => { if (o.links.includes(n.id)) out.set(o.id, o); });
    return [...out.values()];
  };
  const skillEvidenceHTML = (s: SkillNode) => {
    const by: Record<string, Node[]> = {}; s.evidence.forEach(e => (by[e.area!] ??= []).push(e));
    const nm: Record<string, [string, string]> = { studium: ['Modul', 'Modulen'], job: ['Job', 'Jobs'], projekte: ['Projekt', 'Projekten'], hobbys: ['Hobby', 'Hobbys'] };
    const parts = Object.keys(nm).filter(a => by[a]).map(a => by[a].length + ' ' + nm[a][by[a].length === 1 ? 0 : 1]);
    let h = `<p class="lead">Belegt in ${joinDe(parts)}.</p>`;
    Object.keys(nm).forEach(a => { if (by[a]) h += `<section><h3>${AREA_LABEL[a]}</h3>${by[a].map(relBtn).join('')}</section>`; });
    return h;
  };
  const aboutHTML = (n: Node) => {
    const c = 'var(--sun)';
    return `<div class="eyebrow" style="--c:${c}"><i></i>Über mich</div><h2>${esc(n.name)}</h2><p class="meta">${esc(n.sub)}</p>`
      + `<div class="photo" style="--c:${c}">${ICON_PERSON}<span>Foto folgt</span></div>`
      + `<section><h3>Kurz über mich <em>Entwurf</em></h3><p>${esc(n.text)}</p></section>`
      + `<section><h3>Kontakt</h3>`
      + `<a class="rel" href="https://github.com/DavidStaufer" target="_blank" rel="noopener" style="--c:var(--fg)"><i class="v"></i><span>GitHub</span><small>DavidStaufer ↗</small></a>`
      + `<div class="rel off" style="--c:#0a66c2"><i class="v"></i><span>LinkedIn</span><small>Link folgt</small></div>`
      + `<div class="rel off" style="--c:var(--fg-2)"><i class="v plan"></i><span>E-Mail</span><small>folgt</small></div></section>`
      + `<div class="actions"><button disabled>Lebenslauf (PDF)</button><a class="btn" href="/klassisch/">Klassische Ansicht</a></div>`
      + `<p class="note">Gebaut mit Claude Code.</p>`;
  };

  function openSheet(n: Sheetable, modelOpen = false) {
    sheetNode = n;
    const c = color(n);
    let h = `<button class="x" data-act="close" aria-label="Detail schließen">${ICON_X}</button>`;
    if (n.kind === 'root') h += aboutHTML(n as Node);
    else {
      h += `<div class="eyebrow" style="--c:${c}"><i></i>${esc(eyebrowOf(n))}</div><h2>${esc(n.name)}</h2>`;
      if (n.kind === 'skill') h += skillEvidenceHTML(n as SkillNode);
      else {
        const node = n as Node, meta = metaOf(node);
        if (meta) h += `<p class="meta">${esc(meta)}</p>`;
        const st = STATUS[node.status ?? '']; if (st?.label) h += `<span class="status ${st.vis}" style="--c:${c}">${esc(st.label)}</span>`;
        if (!node.online) h += ` <span class="status plan" style="--c:var(--fg-2)">Nur in der lokalen Vorschau</span>`;
        if (node.tags.length) h += `<div class="tags">${node.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
        if (node.kind === 'hobby') h += `<div class="photo" style="--c:${c}">${ICON_PERSON}<span>Foto folgt</span></div>`;
        const tl = textLabel(node); if (tl && node.text) h += `<section><h3>${esc(tl)} <em>Entwurf</em></h3><p>${esc(node.text)}</p></section>`;
        if (node.model) h += `<div class="model" style="--c:${c}"><div class="cube" aria-hidden="true"></div><div><b>3D-Modell</b><span>${esc(node.model)}</span><small>${modelOpen ? 'Siehst du gerade im Raum, ziehen zum Drehen' : 'Modell folgt'}</small></div></div>`;
        if (node.kind === 'project') {
          h += `<div class="actions"><button disabled>Code</button><button disabled>Git-Verlauf</button><button disabled>GitHub ↗</button></div>`;
          if (node.lab) h += `<p class="note">Uni-Lab: Lösungscode bleibt privat, Code auf Anfrage.</p>`;
        }
        if (node.taste.length) h += `<section><h3>Kostprobe</h3><ul class="taste">${node.taste.map(t => `<li>Lernseite „${esc(t)}“</li>`).join('')}</ul></section>`;
        if (node.skills.length) h += `<section><h3>Skills</h3><div class="chips">${node.skills.map(s => `<button class="chip" data-skill="${esc(s)}">${esc(graph.skillMap.get(s)?.name ?? s)}</button>`).join('')}</div></section>`;
        const rels = relationsOf(node);
        if (rels.length) h += `<section><h3>Verbunden mit</h3>${rels.map(relBtn).join('')}</section>`;
      }
    }
    sheet.innerHTML = h; sheet.scrollTop = 0; sheet.classList.add('open');
    on.sheetChanged();
  }
  function closeSheet() { if (!sheetNode) return; sheetNode = null; sheet.classList.remove('open'); on.sheetChanged(); }
  sheet.addEventListener('click', e => {
    const b = (e.target as Element).closest('button') as HTMLButtonElement | null; if (!b) return;
    if (b.dataset.act === 'close') closeSheet();
    else if (b.dataset.skill) on.skill(b.dataset.skill, false);
    else if (b.dataset.reveal) on.reveal(b.dataset.reveal);
  });

  const list = [...graph.skillMap.values()].filter(s => s.evidence.length).sort((a, b) => b.evidence.length - a.evidence.length);
  skillbar.innerHTML = list.map(s => `<button class="sk" data-skill="${esc(s.id)}">${esc(s.name)}<span class="n">${s.evidence.length}</span></button>`).join('');
  skillbar.addEventListener('click', e => { const b = (e.target as Element).closest('[data-skill]') as HTMLElement | null; if (b) on.skill(b.dataset.skill!, true); });
  const markSkill = (id: string | null) => skillbar.querySelectorAll<HTMLElement>('.sk').forEach(b => b.classList.toggle('on', b.dataset.skill === id));

  function setCrumbs(items: { label: string; fn?: () => void }[]) {
    const el = $('#crumbs'); el.innerHTML = '';
    items.forEach((it, i) => {
      if (i) el.insertAdjacentHTML('beforeend', '<span class="sep" aria-hidden="true">›</span>');
      const last = i === items.length - 1, b = document.createElement(last ? 'span' : 'button');
      b.className = 'crumb' + (last ? ' cur' : ''); b.textContent = it.label;
      if (!last && it.fn) b.addEventListener('click', it.fn);
      el.appendChild(b);
    });
  }
  const syncFade = () => document.documentElement.style.setProperty('--fade-h', Math.round(headerBottom() + 28) + 'px');
  window.addEventListener('resize', syncFade); syncFade();

  return { openSheet, closeSheet, markSkill, setCrumbs, syncFade, get sheetNode() { return sheetNode; } };
}
export type Ui = ReturnType<typeof createUi>;
