# Publishing an article

Keep drafts, research, and unpublished illustrations outside this public
repository until the author chooses to publish. A private working directory
can hold the complete article and review evidence; `draft: true` only controls
site rendering and does not make committed text confidential.

## Metadata template

Copy this template into the private draft first. Replace the title, description,
publication date, part number, topic, and artwork paths when preparing a release.
The article filename controls its permanent URL.

```yaml
---
title: "Compass — Article title"
description: "A concise description of the article for readers and search results."
pubDate: "2026-09-19"
heroImage: "/images/compass/part-2/cover.png"
heroAlt: "Describe the cover diagram and the relationship it illustrates."
series: "inside-an-agent-harness"
part: 2
topic: "Why I built it"
draft: true
---
```

The layout supplies the H1, byline, cover, and series navigation. Write the body
without repeating those elements. Provide a matching `.svg` for the PNG cover
and link each inline diagram to its full-size SVG. Use descriptive alt text.

## Manual release checklist

- Confirm the prose, citations, capability limits, and illustrations are ready
  for public Git history. Exclude author notes, private research, validation
  reports, local filesystem paths, and original private source material.
- Copy only the final Markdown and public SVG/PNG files into the site. Use
  site-relative image paths. Keep previously published article and series URLs.
- Set the intended displayed `pubDate` and `draft: false` when publishing.
  Future dates do not delay a release; there is no scheduled deployment.
- Run `npm run check`, `npm run build`, and `npm test` in that order using the
  Node version in `.node-version`. Review the article, homepage, series, next
  links, feed, and artwork in the production build.
- Review the complete Git diff before committing. Public planned outlines are
  replaced automatically by published parts with the same series and number.
- Publish through the normal reviewed merge to `main`. The Pages workflow
  deploys the verified build. Check the public article and feed afterwards.

Parts 2 and 3 can be prepared privately for next week without copying them into
this repository or scheduling any publication. Each release remains an
explicit author action.
