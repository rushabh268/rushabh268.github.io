# Rushabh Sanghvi — Engineering Notes

A personal website about backend systems, cloud infrastructure, and working
with AI coding tools. Published at <https://rushabh268.github.io>.

The site uses Astro to generate static HTML. Articles are Markdown, original
diagrams are local assets, and the earlier writing archive links to Medium.

## Develop locally

Use Node.js 24.19.0, as recorded in `.node-version`.

```sh
npm ci
npm run dev
```

To check the production build:

```sh
npm run check
npm run build
npm test
npm run preview
```

The tests inspect the built pages in `dist`, including internal links, image
references, metadata, feeds, and the preserved article text.

## Add an article

Create a Markdown file under `src/content/writing`. Its filename becomes the
article slug. The current content schema is in `src/content.config.ts`.

```yaml
---
title: "Article title"
description: "A short description for readers and search results."
pubDate: "2026-09-19"
heroImage: "/images/example/cover.png"
heroAlt: "A useful description of the illustration."
series: "inside-an-agent-harness"
part: 2
draft: true
---
```

Keep the article title in its metadata; the page layout supplies the H1,
byline, and cover. Put illustrations in `public/images` and use site-relative
paths. Keep citations and descriptive alt text with the article.

Series details and the external Medium archive are maintained under
`src/data`. Planned parts have no article page or RSS entry. Set `draft` to
`false` when the article is ready, and update its series entry.

## Publish

In the repository's Pages settings, use **GitHub Actions** as the publishing
source. The initial publishing handoff configures this setting.

The workflow in `.github/workflows/pages.yml` checks types, builds the site,
and runs the artifact tests. Pull requests run these checks. A successful
push to `main` publishes only `dist` to GitHub Pages. The workflow can also be
started manually from the Actions tab.

The canonical site address is configured in `astro.config.mjs`. If adding a
custom domain, update that address and the GitHub Pages domain settings
together, then rebuild so canonical links, RSS, and the sitemap agree.

## License

Website code and templates use the MIT license. Articles and original
illustrations remain copyright Rushabh Sanghvi; see [LICENSE](LICENSE).
