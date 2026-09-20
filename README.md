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

## Prepare an article

Write unpublished prose and create its illustrations outside this public
repository. A Markdown file marked `draft: true` is excluded from pages and RSS,
but its text is still visible in public Git history. Files in `public/` are
always copied into the deployed site, including illustrations for drafts.

Only copy an article and its public illustrations into this repository when
publication is intended. Its Markdown filename under `src/content/writing`
becomes the article slug. The schema is in `src/content.config.ts`; use the
[article template and publication checklist](docs/publishing.md).

The current series is **Inside Compass**. Its identifier remains
`inside-an-agent-harness` to preserve the existing series URL. The original
Part 1 article URL also remains unchanged. New artwork uses
`/images/compass/part-1/`; the original image URLs remain compatible copies.

Series details and the external Medium archive are maintained under
`src/data`. Planned parts have no article page or RSS entry. Published articles
automatically replace their matching planned part in the series; do not delete
an outline just to publish its article.

`pubDate` is the displayed publication date, not a schedule or a date gate.
Setting `draft: false` publishes the article on the next deployment even when
its date is in the future. Parts 2 and 3 remain planned until the author
explicitly publishes them. There is no automatic publication next week.

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
