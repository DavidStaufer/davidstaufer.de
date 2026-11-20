// Einstieg: Daten aus der Seite lesen und das Sonnensystem starten.
import type { RawNode, Skill } from '../../lib/graph';
import { buildGraph } from './data';
import { startSolarSystem } from './system';

const stage = document.querySelector('#stage') as HTMLElement;
const dataEl = document.querySelector('#lebensgraph-daten');
try {
  const { nodes, skills } = JSON.parse(dataEl?.textContent ?? '{}') as { nodes: RawNode[]; skills: Skill[] };
  startSolarSystem(stage, buildGraph(nodes, skills));
} catch (err) {
  console.error(err);
  document.querySelector('#intro')?.remove();
  document.body.classList.remove('intro');
  stage.innerHTML = '<p class="nogl">Die 3D-Ansicht lässt sich hier nicht darstellen. <a href="/klassisch/">Zur klassischen Ansicht</a></p>';
}
