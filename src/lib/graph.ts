import { getCollection } from 'astro:content';
import skills from '../data/skills.json';

export type Kind = 'root' | 'area' | 'group' | 'module' | 'job' | 'project' | 'hobby';

/** Ein Knoten so, wie er an den Browser geht (flach, Eltern per Schlüssel). */
export interface RawNode {
  key: string;
  parent: string | null;
  kind: Kind;
  name: string;
  short?: string;
  sub?: string;
  area?: string;
  order: number;
  status?: string;
  ects?: number | null;
  tags: string[];
  skills: string[];
  links: string[];
  taste: string[];
  model?: string;
  lab: boolean;
  online: boolean;
  text: string;
}

export interface Skill { id: string; name: string }

/**
 * Lädt alle Knoten. Im Produktions-Build fallen Knoten mit `online: false` weg
 * (Projekte, die die Fertig-Checkliste noch nicht bestehen), lokal sind sie sichtbar.
 */
export async function loadGraph(): Promise<{ nodes: RawNode[]; skills: Skill[] }> {
  const entries = await getCollection('knoten');
  const visible = entries.filter(e => !import.meta.env.PROD || e.data.online);
  const keys = new Set(visible.map(e => e.data.key));
  const nodes: RawNode[] = visible
    .map(e => ({ ...e.data, text: (e.body ?? '').trim() }) as RawNode)
    .map(n => ({ ...n, links: n.links.filter(k => keys.has(k)) }))
    .sort((a, b) => a.order - b.order);
  return { nodes, skills };
}

/** Baut den Baum für die Server-Seiten (klassische Ansicht). */
export function buildTree(nodes: RawNode[]) {
  type T = RawNode & { children: T[] };
  const byKey = new Map<string, T>(nodes.map(n => [n.key, { ...n, children: [] }]));
  let root: T | undefined;
  for (const n of nodes) {
    const t = byKey.get(n.key)!;
    if (n.parent) byKey.get(n.parent)?.children.push(t);
    else root = t;
  }
  return { root: root!, byKey };
}

/** Sicher in ein <script type="application/json"> einbetten. */
export const toJsonScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
