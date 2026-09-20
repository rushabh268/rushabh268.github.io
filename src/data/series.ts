import type { CollectionEntry } from 'astro:content';
import { externalWriting } from './external-writing';

export interface Series {
  slug: string;
  title: string;
  description: string;
  totalParts: number;
  planned: { part: number; title: string; topic: string; description: string }[];
}

// Published articles supersede their outline entries without requiring a second manual update.
export function getSeriesProgress(item: Series, writing: CollectionEntry<'writing'>[]) {
  const native = writing.filter((post) => post.data.series === item.slug).map((post) => ({
    title: post.data.title, description: post.data.description, part: post.data.part,
    pubDate: post.data.pubDate, href: `/writing/${post.id}/`, external: false,
  }));
  const external = externalWriting.filter((post) => post.series === item.slug).map((post) => ({
    ...post, href: post.url, external: true,
  }));
  const published = [...native, ...external].sort((a, b) => a.part - b.part);
  const publishedParts = new Set(published.map((post) => post.part));
  const planned = item.planned.filter((part) => !publishedParts.has(part.part));
  const complete = publishedParts.size >= item.totalParts && planned.length === 0;
  const status = complete ? (published.every((post) => post.external) ? 'Complete on Medium' : 'Complete') : 'In progress';
  return { published, planned, publishedCount: publishedParts.size, status };
}

export const series: Series[] = [
  {
    // Keep the published series URL stable after the Compass rename.
    slug: 'inside-an-agent-harness',
    title: 'Inside Compass',
    description: 'What a companion harness adds, why I built one, and how it works alongside the coding tools I use.',
    totalParts: 3,
    planned: [
      {
        part: 2,
        title: 'Compass — The gaps between sessions',
        topic: 'Why I built it',
        description: 'The context that was getting rebuilt, the visibility I was missing, and the tradeoffs of collecting useful evidence.',
      },
      {
        part: 3,
        title: 'Compass — From hooks to a shared ledger',
        topic: 'How it works',
        description: 'The implementation, the integration boundaries, and the things that broke along the way.',
      },
    ],
  },
  {
    slug: 'claude-for-cloud-security',
    title: 'Claude for Cloud Security',
    description: 'Four essays on project instructions, skills, prompts, and pipelines. Originally published on Medium.',
    totalParts: 4,
    planned: [],
  },
];
