import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    heroImage: z.string(),
    heroAlt: z.string(),
    series: z.string(),
    part: z.number().int().positive(),
    topic: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
