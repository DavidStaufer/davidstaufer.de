// Lebensgraph im Browser: Knoten aus dem eingebetteten JSON zu einem Baum verknüpfen.
import type { RawNode, Skill } from '../../lib/graph';

export interface Node extends Omit<RawNode, 'parent'> {
  id: string;
  parent: Node | null;
  children: Node[];
  depth: number;
}
export interface SkillNode { id: string; name: string; kind: 'skill'; area: 'skill'; depth: number; evidence: Node[] }

export const STATUS: Record<string, { vis: Vis; label: string | null }> = {
  'bestanden': { vis: 'done', label: 'Bestanden' },
  'läuft': { vis: 'now', label: 'Läuft gerade' },
  'geplant': { vis: 'plan', label: 'Geplant' },
  'v1': { vis: 'done', label: 'Online ab Version 1' },
  'arbeit': { vis: 'now', label: 'In Arbeit · noch nicht online' },
  'lokal': { vis: 'plan', label: 'Nur lokal · Testprojekt' },
  'aktuell': { vis: 'now', label: 'Aktuell' },
  'frueher': { vis: 'done', label: 'Abgeschlossen' },
  'hobby': { vis: 'done', label: null },
};
export type Vis = 'done' | 'now' | 'plan';
export const AREA_LABEL: Record<string, string> = { studium: 'Studium', job: 'Arbeit', projekte: 'Projekte', hobbys: 'Hobbys', skill: 'Skill' };
/** Reihenfolge der Planeten von innen nach außen = Nähe zum Kern. */
export const PLANET_ORDER = ['studium', 'projekte', 'arbeit', 'hobbys'];

export interface Graph {
  root: Node;
  byId: Map<string, Node>;
  leaves: Node[];
  skillMap: Map<string, SkillNode>;
}

export function buildGraph(raw: RawNode[], skills: Skill[]): Graph {
  const byId = new Map<string, Node>();
  raw.forEach(r => byId.set(r.key, { ...r, id: r.key, parent: null, children: [], depth: 0 }));
  let root: Node | null = null;
  [...raw].sort((a, b) => a.order - b.order).forEach(r => {
    const n = byId.get(r.key)!;
    if (r.parent) { const p = byId.get(r.parent); if (p) { p.children.push(n); n.parent = p; } }
    else root = n;
  });
  if (!root) throw new Error('Lebensgraph ohne Wurzel');
  const leaves: Node[] = [];
  (function walk(n: Node, depth: number) {
    n.depth = depth;
    if (n.parent && !n.area) n.area = n.parent.area;
    if (n.children.length) n.children.forEach(c => walk(c, depth + 1));
    else if (n.kind !== 'root') leaves.push(n);
  })(root, 0);
  const skillMap = new Map<string, SkillNode>(skills.map(s => [s.id, { id: s.id, name: s.name, kind: 'skill', area: 'skill', depth: 9, evidence: [] }]));
  leaves.forEach(l => l.skills.forEach(s => skillMap.get(s)?.evidence.push(l)));
  return { root, byId, leaves, skillMap };
}

export const isLeaf = (n: { children?: Node[] }) => !n.children || !n.children.length;
export const isDesc = (n: Node, a: Node) => { let p = n.parent; while (p) { if (p === a) return true; p = p.parent; } return false; };
export const leavesOf = (n: Node): Node[] => isLeaf(n) ? [n] : n.children.flatMap(leavesOf);
export const visOf = (n: { status?: string }): Vis => (n.status && STATUS[n.status]?.vis) || 'done';
export const pathTo = (n: Node | null) => { const p: Node[] = []; while (n) { p.unshift(n); n = n.parent; } return p; };
export const color = (n: { kind: string; area?: string }) => n.kind === 'root' ? 'var(--sun)' : n.kind === 'skill' ? 'var(--c-skill)' : `var(--c-${n.area})`;
