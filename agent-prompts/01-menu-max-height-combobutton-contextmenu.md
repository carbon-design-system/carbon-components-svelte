# Add `maxHeight` to ComboButton and ContextMenu

## Context

This is `carbon-components-svelte`, a Svelte port of IBM's Carbon Design
System. Read `CONTRIBUTING.md` at the repo root before starting — it defines
the code style, JSDoc/typing, docs, and commit conventions this task must
follow. This repo uses Bun (`bun <script>`, `bunx <bin>`), not npm/pnpm.

Commit `046450f08` (`feat(menu): add maxHeight for scrollable menus`) added a
`maxHeight` prop to `src/Menu/Menu.svelte`: a number is treated as pixels, a
string as any CSS length; the menu caps its height and scrolls once items
exceed it. `src/MenuButton/MenuButton.svelte` already forwards this prop to
its internal `<Menu>` (see `export let maxHeight` around line 81 and `{maxHeight}`
passed into `<Menu ...>` around line 216).

Two sibling menu-trigger components do not yet offer this:

- **`src/ComboButton/ComboButton.svelte`** wraps `<Menu>` directly (see the
  `<Menu anchor={triggerRef} bind:open {direction} {intrinsicAlign}
  intrinsicWidth={true} {size} {labelText} on:close><slot /></Menu>` block near
  the end of the file). It has no `maxHeight` prop to forward.
- **`src/ContextMenu/ContextMenu.svelte`** does **not** wrap `<Menu>` — it
  implements its own independent `<ul role="menu">` with its own
  `use:rovingFocus`, `use:dismiss`, and `class:bx--menu*` classes (see the
  markup at the bottom of the file). It has no scroll-capping behavior at all.

## What to implement

### 1. ComboButton — forward `maxHeight` (mirror MenuButton exactly)

- Add `export let maxHeight = undefined;` with the same JSDoc as
  `MenuButton.svelte`'s `maxHeight` prop (copy the wording: "Specify the
  maximum height of the menu. A number is treated as pixels; a string is used
  as a CSS length. The menu scrolls once its items exceed the height." with
  `@type {number | string}`). Place it in prop declaration order next to the
  other menu-layout props (near `intrinsicAlign`/`size`), following the
  existing prop order in the file.
- Pass `{maxHeight}` into the `<Menu ...>` element, the same way MenuButton
  does.

### 2. ContextMenu — implement max-height + scroll directly

ContextMenu doesn't compose `<Menu>`, so this isn't a one-line forward. Look
at how `Menu.svelte` itself implements the behavior (search for `maxHeight` in
`src/Menu/Menu.svelte`):

- `$: maxHeightStyle = typeof maxHeight === "number" ? \`${maxHeight}px\` : maxHeight;`
- `style:max-height={maxHeightStyle}` on the `<ul role="menu">`
- `class:bx--menu--scrollable={!!maxHeight}` alongside the other `class:bx--menu*`
  directives

Add the same `maxHeight` prop (same JSDoc) and replicate this reactive
statement plus the `style:max-height` / `class:bx--menu--scrollable` additions
on ContextMenu's own `<ul>`. Use the `style:` directive per CONTRIBUTING's
"Set dynamic styles with the `style:` directive, not inline `style` strings"
rule — do not merge it into a template-literal `style` string. The
`bx--menu--scrollable` class and its scroll CSS already exist in Carbon's v10
styles (Menu.svelte relies on the same class with no extra SCSS partial), so
no new `css/` partial should be needed — verify this by checking whether
`bx--menu--scrollable` resolves visually once wired up (see Testing below).

Follow CONTRIBUTING's prop-declaration ordering: component JSDoc first, then
**all** `export let` props (each with its own JSDoc), then imports, then
logic.

## Docs

Both `ComboButton.svx` and `ContextMenu.svx` live in
`docs/src/pages/components/`. Model the new section on `Menu.svx`'s existing
"Scrollable" section (`## Scrollable`, right after `## Menu items`):

> Set `maxHeight` to cap the menu height and scroll the remaining items. A
> number is treated as pixels; a string is used as any CSS length, such as
> `"20rem"`. Keyboard navigation scrolls the focused item into view.

- **ComboButton.svx**: add a `## Scrollable` section after `## Menu items`
  (see the existing heading list in the file), with a short inline example
  using several `MenuItem`s and `maxHeight="10rem"` (or similar). Follow
  `docs/COMPONENT_DOCS_STYLE.md` prose rules (imperative, backticks only for
  the prop/value being configured, no admonitions).
- **ContextMenu.svx**: add a `## Scrollable` section after `## Context menu
  options`. Use a framed example only if the demo needs script logic (it
  likely doesn't for a static maxHeight demo — an inline example matching
  Menu.svx's is enough).
- Match the page's existing heading style: `## Basic` is never renamed, new
  headings drop the redundant component-noun prefix, no `> [!NOTE]` blocks.

## Commits

Split into exactly two commits, per CONTRIBUTING's Conventional Commits rules
(scope = lowercase-with-dashes component name):

1. `feat(combo-button): forward maxHeight to menu` — code changes to
   `ComboButton.svelte` and `ContextMenu.svelte` only (use two commits, one
   per component, if that reads more cleanly — either is fine as long as docs
   are separate).
2. `docs(combo-button): document maxHeight` / `docs(context-menu): document
   maxHeight` — the two `.svx` changes.

## Validation (keep it minimal and scoped — do not run the full suite)

```sh
bunx biome check --write src/ComboButton src/ContextMenu docs/src/pages/components/ComboButton.svx docs/src/pages/components/ContextMenu.svx
bun build:docs   # required after adding an exported prop (regenerates sveld types; the output is gitignored, don't commit it)
bun run test ComboButton
bun run test ContextMenu
```

Do not run `bun run lint`, `bun run test` (full suite), `bun test:e2e`, or the
Svelte 3/4 compatibility workspaces — none of that is needed for this change.
Do not hand-edit `src/**/*.svelte.d.ts` or `docs/src/COMPONENT_API.json`
(generated, gitignored).
