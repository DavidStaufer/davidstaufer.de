import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Jeder Knoten des Lebensgraphen ist eine Markdown-Datei.
// Der Text unter dem Frontmatter ist „Was ich mitnehme“ bzw. „Darum geht’s“ (bei der Sonne: „Über mich“).
const knoten = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knoten' }),
  schema: z.object({
    key: z.string(),
    parent: z.string().nullable(),
    kind: z.enum(['root', 'area', 'group', 'module', 'job', 'project', 'hobby']),
    name: z.string(),
    short: z.string().optional(),
    sub: z.string().optional(),
    area: z.enum(['studium', 'job', 'projekte', 'hobbys']).optional(),
    order: z.number(),
    status: z.enum(['bestanden', 'läuft', 'geplant', 'v1', 'arbeit', 'lokal', 'aktuell', 'frueher', 'hobby']).optional(),
    ects: z.number().nullable().optional(),
    tags: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
    links: z.array(z.string()).default([]),
    taste: z.array(z.string()).default([]),
    model: z.string().optional(),
    lab: z.boolean().default(false),
    // false = nur in der lokalen Entwicklungsversion sichtbar (noch nicht fertig nach Checkliste)
    online: z.boolean().default(true),
  }),
});

export const collections = { knoten };
