import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { parse } from 'parse5';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const origin = 'https://rushabh268.github.io';
const articlePath = '/writing/agent-harnesses-context-in-evidence-out/';
const routes = [
  '/', '/writing/', articlePath, '/series/',
  '/series/inside-an-agent-harness/', '/series/claude-for-cloud-security/',
  '/projects/', '/about/', '/404.html',
];
const mediumPosts = [
  'https://medium.com/@rushabh268/claude-md-the-file-that-changes-everything-f58cef2cf0c8',
  'https://medium.com/@rushabh268/claude-skills-encode-once-invoke-forever-46314a9008fb',
  'https://medium.com/@rushabh268/claude-prompts-declare-outcomes-not-steps-fd7bdafb5d09',
  'https://medium.com/@rushabh268/claude-pipelines-plan-once-start-shipping-b7fe3c71fc02',
];

function fileForRoute(route) {
  return path.join(dist, route.endsWith('/') ? `${route}index.html` : route);
}

async function page(route) {
  const html = await readFile(fileForRoute(route), 'utf8');
  return { html, document: parse(html) };
}

function nodes(node, predicate) {
  const matches = predicate(node) ? [node] : [];
  for (const child of node.childNodes ?? []) matches.push(...nodes(child, predicate));
  return matches;
}

function tag(document, name) {
  return nodes(document, (node) => node.tagName === name);
}

function attr(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function text(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(text).join('');
}

function normalizedText(node) {
  return text(node).replace(/\s+/g, ' ').trim();
}

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(name));
    else result.push(name);
  }
  return result;
}

test('the production build contains every public page and no invented article routes', async () => {
  const actual = (await filesBelow(dist))
    .filter((file) => file.endsWith('.html'))
    .map((file) => path.relative(dist, file)).sort();
  const expected = routes.map((route) => path.relative(dist, fileForRoute(route))).sort();
  assert.deepEqual(actual, expected);
});

test('every page supplies canonical, description, social metadata, and RSS discovery', async () => {
  for (const route of routes) {
    const { document } = await page(route);
    assert.ok(normalizedText(tag(document, 'title')[0]).includes('Rushabh Sanghvi'), route);
    const canonical = tag(document, 'link').find((node) => attr(node, 'rel') === 'canonical');
    assert.equal(attr(canonical, 'href'), `${origin}${route}`, route);
    const meta = tag(document, 'meta');
    assert.ok(meta.find((node) => attr(node, 'name') === 'description' && attr(node, 'content')?.length > 30), route);
    assert.ok(meta.find((node) => attr(node, 'property') === 'og:url' && attr(node, 'content') === `${origin}${route}`), route);
    const image = meta.find((node) => attr(node, 'property') === 'og:image');
    const imageURL = new URL(attr(image, 'content'));
    assert.equal(imageURL.origin, origin);
    assert.ok((await stat(path.join(dist, imageURL.pathname))).isFile(), route);
    assert.ok(tag(document, 'link').some((node) => attr(node, 'type') === 'application/rss+xml' && attr(node, 'href') === '/rss.xml'), route);
  }
  const { document } = await page('/404.html');
  assert.ok(tag(document, 'meta').some((node) => attr(node, 'name') === 'robots' && attr(node, 'content').includes('noindex')));
});

test('the migrated Markdown preserves the pinned article body exactly', async () => {
  const markdown = await readFile(path.join(root, 'src/content/writing/agent-harnesses-context-in-evidence-out.md'), 'utf8');
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/\[(!\[[^\]]*\]\([^)]*\))\]\([^)]*\)/g, '$1')
    .replaceAll('/images/agent-harnesses/part-1/', 'assets/')
    .trimEnd() + '\n';
  assert.equal(createHash('sha256').update(body).digest('hex'), 'e70298a7c81a260b86b9b708e5df326f078af608c4051a8aedb2876b5483a684');
});

test('the rendered article contains its quotes, capability limits, sources, and complete artwork', async () => {
  const { document } = await page(articlePath);
  const content = nodes(document, (node) => attr(node, 'class')?.split(' ').includes('article-prose'))[0];
  assert.ok(content, 'Rendered article content is present');
  const prose = normalizedText(content);
  for (const expected of [
    'The profession is being dramatically refactored as the bits contributed by the programmer are increasingly sparse and between.',
    'give Claude a way to verify its work.',
    'The shared grounding path now serves all three adapters.',
    'Context preparation and audit collection are separate flows: the brief goes to the coding tool, while the ledger receives only selected metadata.',
  ]) assert.ok(prose.includes(expected), expected);
  assert.ok(!prose.includes('OpenCode-only'));
  assert.ok(!prose.includes('live Codex model session'));
  assert.ok(prose.includes('not what the model understood.'));
  assert.ok(!prose.includes('OpenCode-only'));
  assert.ok(!prose.includes('live Codex model session'));
  assert.ok(prose.includes('not what the model understood.'));
  assert.ok(prose.includes('selects files changed in the latest commit, then reads selected comments from their current working-tree contents.'));
  assert.ok(prose.includes('its credential scanner records observations; it does not block agent actions.'));
  assert.ok(prose.includes('not an immutable record protected from every process running as the same user.'));
  assert.equal(tag(content, 'h2').length, 7);
  assert.equal(tag(document, 'img').length, 5, 'The cover appears once, alongside four figures');
  for (const number of [1, 2, 3, 4]) assert.ok(prose.includes(`Figure ${number}.`));
  for (const url of [
    'https://x.com/karpathy/status/2004607146781278521',
    'https://x.com/bcherny/status/2007179861115511237',
    'https://learn.chatgpt.com/docs/hooks',
  ]) assert.ok(tag(content, 'a').some((node) => attr(node, 'href') === url));
  for (const image of tag(document, 'img')) {
    assert.equal(image.parentNode.tagName, 'a', 'Each diagram links to its full-size version');
    assert.match(attr(image.parentNode, 'href'), /\/images\/agent-harnesses\/part-1\/.+\.svg$/);
  }
  const dates = tag(document, 'time').filter((node) => attr(node, 'datetime') === '2026-09-19');
  assert.ok(dates.some((node) => normalizedText(node) === 'September 19, 2026'));
});

test('all internal links, images, stylesheets, and fragment targets resolve in the build', async () => {
  for (const route of routes) {
    const { document } = await page(route);
    const references = nodes(document, (node) => Boolean(attr(node, 'href') ?? attr(node, 'src')));
    for (const node of references) {
      const value = attr(node, 'href') ?? attr(node, 'src');
      if (/^(mailto:|tel:|data:)/.test(value)) continue;
      const target = new URL(value, `${origin}${route}`);
      if (target.origin !== origin) continue;
      const targetFile = fileForRoute(decodeURIComponent(target.pathname));
      assert.ok((await stat(targetFile)).isFile(), `${route} -> ${value}`);
      if (target.hash && targetFile.endsWith('.html')) {
        const targetPage = target.pathname === route ? document : (await page(target.pathname)).document;
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(nodes(targetPage, (item) => attr(item, 'id') === id).length, `${route} -> missing fragment ${value}`);
      }
    }
  }
});

test('RSS publishes the native article once and excludes planned and external posts', async () => {
  const xml = await readFile(path.join(dist, 'rss.xml'), 'utf8');
  assert.equal((xml.match(/<item>/g) ?? []).length, 1);
  assert.ok(xml.includes(`${origin}${articlePath}`));
  assert.ok(xml.includes('19 Sep 2026'));
  assert.ok(xml.includes('Agent Harnesses'));
  assert.ok(!xml.includes('<link>https://medium.com/'));
  assert.ok(!xml.includes('The gaps between sessions'));
  assert.ok(!xml.includes('From hooks to a shared ledger'));
});

test('the series shows two planned parts without publishing fake destinations', async () => {
  const { document } = await page('/series/inside-an-agent-harness/');
  const pageText = normalizedText(document);
  assert.ok(pageText.includes('The gaps between sessions'));
  assert.ok(pageText.includes('From hooks to a shared ledger'));
  assert.equal((pageText.match(/Planned/g) ?? []).length, 2);
  const links = tag(document, 'a').map((node) => attr(node, 'href'));
  assert.ok(links.includes(articlePath));
  assert.ok(!links.some((link) => link.includes('gaps-between-sessions') || link.includes('from-hooks-to-a-shared-ledger')));
  const seriesIndex = (await page('/series/')).document;
  const progress = nodes(seriesIndex, (node) => attr(node, 'class') === 'series-progress').map(normalizedText);
  assert.deepEqual(progress, ['1 published · 2 planned', '4 published']);
});

test('the four previous posts retain their exact external Medium destinations', async () => {
  for (const route of ['/writing/', '/series/claude-for-cloud-security/']) {
    const { document } = await page(route);
    const links = tag(document, 'a').filter((node) => mediumPosts.includes(attr(node, 'href')));
    assert.deepEqual(links.map((node) => attr(node, 'href')).sort(), [...mediumPosts].sort(), route);
    assert.ok(normalizedText(document).includes('Medium'), route);
  }
  const { document } = await page('/writing/');
  const dates = tag(document, 'time').map((node) => attr(node, 'datetime'));
  for (const date of ['2026-03-15', '2026-03-19', '2026-03-29', '2026-04-06']) assert.ok(dates.includes(date));
});

test('the sitemap and robots file use the selected host and exclude the error page', async () => {
  const index = await readFile(path.join(dist, 'sitemap-index.xml'), 'utf8');
  assert.ok(index.includes(`${origin}/sitemap-0.xml`));
  const sitemap = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls.sort(), routes.filter((route) => route !== '/404.html').map((route) => `${origin}${route}`).sort());
  const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`));
  assert.ok(!robots.includes('Disallow: /'));
});

test('pages retain basic document landmarks, image alternatives, and current navigation', async () => {
  for (const route of routes) {
    const { document } = await page(route);
    assert.equal(attr(tag(document, 'html')[0], 'lang'), 'en', route);
    assert.equal(tag(document, 'main').length, 1, route);
    assert.equal(tag(document, 'h1').length, 1, route);
    assert.ok(tag(document, 'a').some((node) => attr(node, 'href') === '#main-content' && normalizedText(node).includes('Skip')), route);
    for (const image of tag(document, 'img')) assert.ok(attr(image, 'alt')?.trim(), route);
    if (route !== '/404.html') assert.ok(tag(document, 'a').some((node) => attr(node, 'aria-current') === 'page'), route);
    const ids = nodes(document, (node) => Boolean(attr(node, 'id'))).map((node) => attr(node, 'id'));
    assert.equal(new Set(ids).size, ids.length, `${route}: duplicate id`);
  }
});

test('the published site loads no remote scripts, fonts, or tracking resources', async () => {
  for (const route of routes) {
    const { document } = await page(route);
    assert.equal(tag(document, 'script').filter((node) => attr(node, 'src')).length, 0, route);
    const resources = [
      ...tag(document, 'img').map((node) => attr(node, 'src')),
      ...tag(document, 'link').filter((node) => ['stylesheet', 'preconnect', 'dns-prefetch'].includes(attr(node, 'rel'))).map((node) => attr(node, 'href')),
    ];
    for (const resource of resources) assert.equal(new URL(resource, origin).origin, origin, route);
  }
  for (const file of (await filesBelow(dist)).filter((name) => name.endsWith('.css'))) {
    const css = await readFile(file, 'utf8');
    assert.doesNotMatch(css, /@import\s*(?:url\()?\s*['"]?https?:/i);
  }
});

test('the deployment artifact excludes private research, local paths, and release materials', async () => {
  const files = await filesBelow(dist);
  assert.ok(!files.some((file) => /author-notes|sol-validation|release-manifest|\.research|package-lock|site\.test/.test(file)));
  for (const file of files.filter((name) => /\.(html|xml|txt|css|svg)$/.test(name))) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /\/Users\/|\/var\/folders\/|file:\/\/|auth\.key|supervisor\.sock/);
  }
});

test('published parts update homepage and series progress while drafts stay private', { timeout: 60_000 }, async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'engineering-notes-test-'));
  try {
    for (const name of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(path.join(root, name), path.join(fixture, name), { recursive: true });
    }
    await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
    const original = await readFile(path.join(root, 'src/content/writing/agent-harnesses-context-in-evidence-out.md'), 'utf8');
    const frontmatter = original.match(/^---\n[\s\S]*?\n---\n/)[0];
    const nextPart = frontmatter
      .replace(/^title: .+$/m, 'title: "Agent Harnesses — The gaps between sessions"')
      .replace(/^pubDate: .+$/m, 'pubDate: "2026-10-20"')
      .replace(/^part: .+$/m, 'part: 2')
      .replace(/^topic: .+$/m, 'topic: "Why I built it"');
    await writeFile(path.join(fixture, 'src/content/writing/new-part-fixture.md'), `${nextPart}\nTemporary published article for a build regression check.\n`);
    const draft = frontmatter
      .replace(/^title: .+$/m, 'title: "Unpublished draft regression fixture"')
      .replace(/^pubDate: .+$/m, 'pubDate: "2099-10-20"')
      .replace(/^part: .+$/m, 'part: 3')
      .replace(/^draft: .+$/m, 'draft: true');
    await writeFile(path.join(fixture, 'src/content/writing/private-draft-fixture.md'), `${draft}\nThis draft must not be published.\n`);
    const buildFixture = () => promisify(execFile)(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], {
      cwd: fixture,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      timeout: 45_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    await buildFixture();
    const homepage = parse(await readFile(path.join(fixture, 'dist/index.html'), 'utf8'));
    const feature = nodes(homepage, (node) => attr(node, 'class') === 'featured-copy')[0];
    const featureText = normalizedText(feature);
    assert.ok(featureText.includes('Inside an Agent Harness / Part 2'), featureText);
    assert.ok(featureText.includes('October 20, 2026'), featureText);
    assert.ok(!featureText.includes('Part 1') && !featureText.includes('September 2026'), featureText);
    const nextPage = parse(await readFile(path.join(fixture, 'dist/writing/new-part-fixture/index.html'), 'utf8'));
    const byline = nodes(nextPage, (node) => attr(node, 'class') === 'article-byline')[0];
    assert.ok(normalizedText(byline).includes('Why I built it'));
    const nextFooter = nodes(nextPage, (node) => attr(node, 'class') === 'article-end')[0];
    assert.ok(normalizedText(nextFooter).includes('From hooks to a shared ledger'));
    const generated = await filesBelow(path.join(fixture, 'dist'));
    assert.ok(!generated.some((file) => file.includes('private-draft-fixture')));
    for (const name of ['index.html', 'writing/index.html', 'rss.xml', 'sitemap-0.xml']) {
      const content = await readFile(path.join(fixture, 'dist', name), 'utf8');
      assert.ok(!content.includes('Unpublished draft regression fixture'), name);
    }
    const assertSeriesProgress = async (publishedCount, plannedParts, status) => {
      const documents = await Promise.all(['index.html', 'series/index.html', 'series/inside-an-agent-harness/index.html']
        .map(async (name) => parse(await readFile(path.join(fixture, 'dist', name), 'utf8'))));
      const cards = documents.slice(0, 2).map((document) => nodes(document, (node) =>
        attr(node, 'class') === 'series-card' && tag(node, 'a').some((link) => attr(link, 'href') === '/series/inside-an-agent-harness/'))[0]);
      const seriesPage = documents[2];
      const parts = nodes(seriesPage, (node) => attr(node, 'class')?.split(' ').includes('series-part'));
      const planned = parts.filter((node) => attr(node, 'class').includes('series-part-planned'));
      const header = nodes(seriesPage, (node) => attr(node, 'class') === 'page-header')[0];
      const statusText = (node) => normalizedText(nodes(node, (child) => attr(child, 'class') === 'eyebrow')[0]);
      assert.deepEqual({
        partNumbers: parts.map((node) => normalizedText(nodes(node, (child) => attr(child, 'class') === 'part-number')[0])),
        plannedParts: planned.map((node) => normalizedText(nodes(node, (child) => attr(child, 'class') === 'part-number')[0])),
        progress: normalizedText(nodes(cards[1], (node) => attr(node, 'class') === 'series-progress')[0]),
        statuses: [...cards, header].map(statusText),
      }, {
        partNumbers: ['01', '02', '03'],
        plannedParts,
        progress: `${publishedCount} published${plannedParts.length ? ` · ${plannedParts.length} planned` : ''}`,
        statuses: Array(3).fill(`3 parts / ${status}`),
      });
      for (const document of documents.slice(0, 2)) {
        const archive = nodes(document, (node) => attr(node, 'class') === 'series-card' &&
          tag(node, 'a').some((link) => attr(link, 'href') === '/series/claude-for-cloud-security/'))[0];
        assert.equal(statusText(archive), '4 parts / Complete on Medium');
      }
    };
    await t.test('a published second part appears once and leaves only Part 3 planned', async () => {
      await assertSeriesProgress(2, ['03'], 'In progress');
    });
    const finalPart = nextPart
      .replace(/^title: .+$/m, 'title: "Agent Harnesses — From hooks to a shared ledger"')
      .replace(/^part: .+$/m, 'part: 3')
      .replace(/^pubDate: .+$/m, 'pubDate: "2026-11-20"');
    await writeFile(path.join(fixture, 'src/content/writing/final-part-fixture.md'), `${finalPart}\nTemporary final article for a build regression check.\n`);
    await buildFixture();
    await t.test('a completed native series is complete without a Medium label', async () => {
      await assertSeriesProgress(3, [], 'Complete');
    });
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
