# Add `maxWidth` truncation + tooltip to StructuredListCell

## Context

This is `carbon-components-svelte`, a Svelte port of IBM's Carbon Design
System. Read `CONTRIBUTING.md` at the repo root before starting — it defines
the code style, JSDoc/typing, docs, custom-SCSS, and commit conventions this
task must follow. This repo uses Bun (`bun <script>`, `bunx <bin>`), not
npm/pnpm.

Commit `e3d55fba5` (`feat(tag): add maxWidth truncation with tooltip`) gave
`Tag` a `maxWidth` prop: CSS-truncates a long label with an ellipsis and
shows the full text in a tooltip, but only when the text is actually
overflowing (measured, not assumed). Read `src/Tag/Tag.svelte` in full before
starting — the pattern is:

- `export let maxWidth = undefined;` (number = px, string = any CSS length)
- A `labelRef` bound to the text element, plus `isTruncated` /
  `truncationLabel` state.
- `measureTruncation()`: an `async` function that awaits `tick()`, then
  compares `labelRef.scrollWidth > labelRef.clientWidth` to decide
  `isTruncated`, and captures `labelRef.textContent?.trim()` as the tooltip
  text. Guards a stale-measurement race with a `measureToken` counter (a
  newer call invalidates an older in-flight one).
- A reactive block re-runs `measureTruncation()` whenever `maxWidth` or the
  values affecting rendered text/layout change (`void maxWidth; void filter; ...`
  pattern to declare reactive dependencies explicitly, then call the function).
- Markup: `style:max-width={maxWidth}` plus `class:bx--tag--truncate={maxWidth != null}`
  on the truncatable element, and conditionally wraps the label in
  `TooltipDefinition` (`portalTooltip`) when `isTruncated` — except for the
  interactive-button variant, which uses the native `title` attribute instead
  to avoid nesting a button inside a button.
- SCSS: `css/_tag.scss` has a `tag-truncate` mixin (`.#{$prefix}--tag--truncate
  { min-width: 0; }` plus overflow/ellipsis rules on the tooltip trigger),
  registered via `@include exports("tag-truncate")`.

`src/StructuredList/StructuredListCell.svelte` has an analogous but much
weaker mechanism today — the entire file is short, read it before starting:

```svelte
<script>
  export let head = false;
  export let noWrap = false;
  import { getContext } from "svelte";
  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? false;
</script>

<div
  role={selection ? undefined : head ? "columnheader" : "cell"}
  class:bx--structured-list-th={head}
  class:bx--structured-list-td={!head}
  class:bx--structured-list-content--nowrap={noWrap}
  {...$$restProps}
  on:click on:mouseover on:mouseenter on:mouseleave
>
  <slot />
</div>
```

`noWrap` only sets `white-space: nowrap` — no `overflow`, no `text-overflow`,
and no tooltip escape hatch. Long cell content can currently bleed outside
the cell with no way for a consumer to cap it and still let a user read the
full value.

## What to implement

Add a `maxWidth` prop to `StructuredListCell`, following the Tag pattern:

- `export let maxWidth = undefined;` (`@type {number | string}`, same
  convention: number = px, string = any CSS length). JSDoc it the same way
  Tag does: "Cap the cell width. When the content overflows, a tooltip shows
  the full text." (adjust wording — Tag's is a label, this is generic cell
  content behind a `<slot />`, so the tooltip text should be measured off the
  cell's own rendered text, not a dedicated label prop).
- Because content comes through a generic `<slot />` (not a fixed text prop
  like Tag's `title`), measure the *outer element itself*
  (`scrollWidth > clientWidth`) rather than a separate inner label element —
  bind `ref` to the `<div>` and read `ref.textContent?.trim()` for the
  tooltip text, same idea as Tag's `labelRef.textContent`.
- Reuse Tag's `measureTruncation`-with-`tick()`-and-a-token-guard structure;
  don't invent a different async pattern. Re-run the measurement reactively
  when `maxWidth` changes (and, since slot content can change independently
  of any prop on this component, also consider whether a `MutationObserver`
  or a simpler re-measure-on-relevant-prop-change is sufficient — start with
  the simpler `$:`-on-`maxWidth` approach Tag uses, and only reach for a
  `MutationObserver` if slot content changing without any prop change turns
  out to be a real gap worth covering; don't over-build this).
- Setting `maxWidth` should imply `nowrap`-style layout (truncation requires
  `white-space: nowrap` — reuse the existing `noWrap` prop's class internally
  when `maxWidth` is set, or make `class:bx--structured-list-content--nowrap`
  fire on `noWrap || maxWidth != null` — pick whichever reads more clearly in
  context, but don't require callers to redundantly pass both `noWrap` and
  `maxWidth`).
- Add a new SCSS partial `css/_structured-list.scss` (this component doesn't
  have one yet — check `ls css/` to confirm) modeled exactly on
  `css/_tag.scss`'s `tag-truncate` mixin: token-only, `$prefix`-scoped,
  wrapped in `@include exports("structured-list-truncate")`, with SassDoc
  comments (`/// @access private`, `/// @group components`). It needs
  `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` on the
  truncated cell, plus whatever tooltip-trigger overflow rules are needed if
  you reuse `TooltipDefinition` (see Tag's `.#{$prefix}--tag__label-tooltip`
  rules for the trigger-sizing problem you'll likely hit — a tooltip trigger
  wrapping arbitrary slot content needs `display: block; min-width: 0;
  max-width: 100%;` the same way Tag's does). Do not use `:has()` (exceeds the
  project's browser baseline). Register the new partial's `@import` in all
  six theme entry files (`css/all.scss`, `white.scss`, `g10.scss`, `g80.scss`,
  `g90.scss`, `g100.scss`), same import order in each, per CONTRIBUTING's
  "Registering a partial" section.
- Follow CONTRIBUTING's prop-ordering rule (JSDoc block, then all `export
  let` props with JSDoc, then imports, then logic).

## Docs

`docs/src/pages/components/StructuredList.svx` currently has `## Basic`,
`## Layout` (`### Condensed`, `### Flush`), `## Selection` (`### Single`,
`### Custom selection icon`, `### Multiple`), `## Skeleton`. Add a new
section for this feature — place it as its own `## Truncation` section (or as
a `###` child under `## Layout` if you judge the content-overflow behavior
fits better there as a layout concern; check CONTRIBUTING's "typical section
order" — core variants/layout come before feature sections). Model the prose
and example tightly on `Tag.svx`'s existing `### Max width` section:

> Set `maxWidth` to a CSS length to ellipsis long content. A tooltip with the
> full text appears only when the content is truncated. Accepts any valid CSS
> length, including `rem`, `px`, `ch`, and `%`.

Follow `docs/COMPONENT_DOCS_STYLE.md` and CONTRIBUTING's SVX gotchas (wrap
object literals in backticks, no admonitions, `<DocKbd>` for keys if any come
up — unlikely here).

## Commits

1. `feat(structured-list-cell): add maxWidth truncation with tooltip` — the
   component change and the new `css/_structured-list.scss` partial +
   6-file registration together (the SCSS is inseparable from the feature).
2. `docs(structured-list-cell): document maxWidth`

## Validation (keep it minimal and scoped — do not run the full suite)

```sh
bunx biome check --write src/StructuredList css/_structured-list.scss css/all.scss css/white.scss css/g10.scss css/g80.scss css/g90.scss css/g100.scss docs/src/pages/components/StructuredList.svx
bun build:docs   # required after adding an exported prop; output is gitignored, don't commit it
bun build:css    # required after editing any .scss under css/ — compiled CSS is gitignored but required at runtime
bun run test StructuredList
```

Add a focused unit test asserting: no truncation markup/tooltip when
`maxWidth` is unset (default behavior unchanged), and that setting a very
small `maxWidth` against long text triggers the truncated state (you may need
to mock or stub `scrollWidth`/`clientWidth` in jsdom, since jsdom doesn't lay
out text — check how `Tag.test.ts` handles this exact measurement and mirror
its approach rather than inventing a new one).

Do not run `bun run lint`, `bun run test` (full suite), `bun test:e2e`, or the
Svelte 3/4 compatibility workspaces. Do not hand-edit
`src/**/*.svelte.d.ts` or `docs/src/COMPONENT_API.json` (generated, gitignored).
Do not commit generated `css/*.css` (gitignored) — only the `.scss` source.
