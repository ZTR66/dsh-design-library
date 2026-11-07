# Changelog

## 0.1.0

First release.

- Panel: browse 290 bundled design documents (256 design systems, 34 skills), searchable, filterable by
  source and kind, with palette / type-scale / spacing / radius views and full document text on demand.
- `design_search`, `design_read`, `design_review` tools.
- Design skills registered into the skill catalogue, curated by default.
- Review computes WCAG contrast for declared `on-*` pairs and uncovered surfaces, off-palette color
  literals with line numbers, unexpected font families, and radii off the declared scale.
- Seed pack built from 16 MIT / Apache-2.0 repositories; three sources with non-redistributable licenses
  are surfaced as external links only.
- `scripts/guard-publish.mjs` blocks packaging if excluded content appears or a bundled file changed.
