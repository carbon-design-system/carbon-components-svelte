# Vendored carbon-components SCSS

Inlined from `carbon-components@10.58.15` (Apache-2.0, see [LICENSE](LICENSE)),
which is no longer an npm dependency. Only the `scss/` tree is vendored, with
these prunings relative to upstream:

- `scss/globals/scss/styles.scss` — replaced by the itemized
  [`css/_carbon-styles.scss`](../../_carbon-styles.scss)
- `scss/components/toolbar/` — deprecated v9 `bx--toolbar`, unrendered by this
  library (the DataTable toolbar is styled by
  `data-table/_data-table-action.scss`)
- `scss/components/pagination/_unstable_pagination.scss` — unrendered
- `scss/components/data-table-v2/` — never imported
- every file the six theme compiles never load (measured with sass-embedded's
  `loadedUrls`), mostly `vendor/@carbon/*` packages recursively re-vendoring
  each other
- the standalone `vendor/@carbon/themes` package — byte-identical to the copy
  inside `vendor/@carbon/elements/scss/themes`, which the theme entry files
  now import instead

To use an upstream file that is not vendored, restore it from
`carbon-components@10.58.15` on npm.

`scripts/build-css.ts` resolves `@import "carbon-components/..."` here via its
sass `loadPaths`, so theme entry files and `css/_*.scss` partials did not
change specifiers when the dependency was inlined.
