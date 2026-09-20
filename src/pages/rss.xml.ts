import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedWriting } from '../data/writing';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = await getPublishedWriting();
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(`${post.data.pubDate}T00:00:00Z`),
      link: `/writing/${post.id}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
