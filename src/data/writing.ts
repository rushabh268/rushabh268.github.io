import { getCollection } from 'astro:content';

// Pages and RSS share the publication boundary so a draft cannot leak through a second listing.
export async function getPublishedWriting() {
  return (await getCollection('writing', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.localeCompare(a.data.pubDate));
}
