# DavidStaufer.de

Persönliche Website von David: sein Leben als begehbares 3D-Sonnensystem. Alle Entscheidungen stehen in der Vault-Notiz `~/Documents/Claude-Vault/20 Projekte/DavidStaufer.de.md`. Vor größeren Änderungen dort nachlesen.

## Aufbau

- **Astro** (statisch) + **TypeScript** + **three.js**. Kein Framework für die UI, nur DOM.
- `src/content/knoten/`: **eine Markdown-Datei pro Knoten** (Sonne, Bereiche, Semester, Module, Projekte, Jobs, Hobbys). Das Frontmatter folgt dem Schema in `src/content.config.ts`, der Text darunter ist „Was ich mitnehme“ bzw. „Darum geht’s“. Die Datei der Sonne ist `david.md` (Über mich).
- `src/data/skills.json`: Skill-Liste. Belege entstehen automatisch aus den `skills` der Blätter.
- `src/scripts/lebensgraph/`: die 3D-Seite.
  - `engine.ts`: Renderer, Kamerafahrten, Antippen
  - `system.ts`: Sonnensystem und Bedienlogik
  - `ui.ts`: Detailblatt, Pfad, Skill-Leiste
  - `models/`: 3D-Modelle, in die sich Monde aus der Nähe verwandeln (Projekte, Hobbys, Module)
- `src/pages/index.astro` ist das Sonnensystem, `src/pages/klassisch.astro` die klassische Lebenslauf-Ansicht ohne 3D.
- `prototype/`: die Design-Prototypen vom 20.11.2026. Wegwerf-Code, nur zur Referenz.

## Regeln

- **Online geht nur, was fertig ist.** `online: false` im Frontmatter blendet einen Knoten im Produktions-Build aus; lokal (`npm run dev`) bleibt er sichtbar.
- **Uni-Labs: kein Lösungscode öffentlich**, auch keine Ausschnitte (Lizenz des Pacman-Labs, wiederverwendetes DL-Material).
- Texte sind Entwürfe von Claude. David gibt frei, bevor etwas online geht.
- Aktualisiert wird nur, wenn David es sagt, typischerweise nach jeder Prüfungsphase: Status der Module umstellen und die Texte „Was ich mitnehme“ vorschreiben.
- Status-Sprache überall gleich: massiv = bestanden/online, Ring = läuft, Glas = geplant.
- Immer dunkel. Keine externen Fonts, kein Tracking.
- Planetengröße = Umfang, Abstand = Nähe zum Kern (Studium innen, dann Projekte, Arbeit, Hobbys).

## Befehle

```bash
npm run dev      # lokale Vorschau auf http://localhost:4321
npm run build    # statische Seite nach dist/
```
