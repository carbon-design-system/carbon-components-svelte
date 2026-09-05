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
- `scss/components/ui-shell/_product-switcher.scss` and
  `_navigation-menu.scss` — unrendered (`bx--switcher*` is what Switcher uses)
- `scss/components/data-table/_data-table-inline-edit.scss` — unrendered
- legacy `bx--tabs-trigger` mobile-dropdown rules — Tabs uses scrollable
  overflow, not the old trigger
- flatpickr `hasWeeks` / `hasTime` / `noCalendar` branches — DatePicker does
  not enable week numbers or time
- every file the six theme compiles never load (measured with sass-embedded's
  `loadedUrls`), mostly `vendor/@carbon/*` packages recursively re-vendoring
  each other
- the standalone `vendor/@carbon/themes` package — byte-identical to the copy
  inside `vendor/@carbon/elements/scss/themes`, which the theme entry files
  now import instead
- legacy `-ms-high-contrast` media queries (IE / old Edge); modern
  `prefers-contrast` / `forced-colors` kept
- dead CSS emission pruned from vendored component SCSS (this library never
  renders the matching markup): legacy tooltip definition/icon mixins; unused
  `tabs--scrollable__nav-link` / `--selected` / `--disabled` / `--light`
  rules; native `dropdown-list` / `dropdown-item` / `dropdown-link` menu
  styles; `side-nav--fixed`, switcher/select/title, collapse/expand icon, and
  positive `side-nav__item--active` rules; code-snippet overflow indicators,
  `snippet-button`, and `btn--copy__feedback`; progress-indicator overflow
  tooltip chrome; DataTable `--xs`/`--sm`/`--xl` size aliases (compact/short/
  tall kept); `overflow-menu--lg`; `skeleton-icon`;
  `structured-list-row--selected`; `pagination-nav__page--direction`;
  `data-table--visible-overflow-menu`; `multi-select--invalid--focused`;
  exclusive `search-button` rules

To use an upstream file that is not vendored, restore it from
`carbon-components@10.58.15` on npm.

This library also edits the vendored SCSS directly. Two forms:

- **In-place edits** to upstream rules, each marked with a trailing
  `// ccs: <reason>` comment on the changed declaration or selector. Prefer
  this over shadowing: change the value, or add the modifier branch right
  after the rule it refines with the same selector shape plus the one class
  that carries meaning. Never out-weigh an upstream rule with doubled
  classes, element qualifiers, or order-only `:not()` guards — the rule is
  editable.
- **Appended patches** under a `// carbon-components-svelte patch (...)`
  banner at the end of a component file, for additive blocks (new variants)
  that do not fight any upstream rule.

A rule that must beat a *later* component's equal-specificity rule (e.g. a
readonly field inside a modal) belongs in that later component's file, next
to the rule it beats, not padded here.

Guards: `bun run check:css --base <ref>` (compiled-rule cascade diff),
`bun run lint:css` (specificity-padding ratchet), and
`bun e2e/cascade-snapshot.ts` (computed-style snapshot of the e2e fixtures);
see each script's header.

`css/_*.scss` still holds v11 backports with no v10 base (fluid-*, popover,
stack, ...) and utilities, registered in `css/_carbon-styles.scss`, the
single style manifest every theme entry file imports.

`scripts/build-css.ts` resolves `@import "carbon-components/..."` here via its
sass `loadPaths`, so theme entry files and `css/_*.scss` partials did not
change specifiers when the dependency was inlined.
