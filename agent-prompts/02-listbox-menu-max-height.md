# Add a consumer-facing `maxHeight` override to Dropdown, ComboBox, and MultiSelect

## Context

This is `carbon-components-svelte`, a Svelte port of IBM's Carbon Design
System. Read `CONTRIBUTING.md` at the repo root before starting — it defines
the code style, JSDoc/typing, docs, and commit conventions this task must
follow. This repo uses Bun (`bun <script>`, `bunx <bin>`), not npm/pnpm.

CONTRIBUTING.md notes: "ComboBox, Dropdown, and MultiSelect share listbox
behavior (virtualization, keyboard navigation, outside-click) through
`src/utils/`. When you change shared menu behavior, apply and test the change
in all three. The per-component wiring is parallel but not abstracted." This
task changes shared menu-height behavior, so **all three components need the
same change**, verified independently.

Commit `046450f08` (`feat(menu): add maxHeight for scrollable menus`) gave
`Menu` and `MenuButton` a `maxHeight` prop (number = px, string = any CSS
length) that a consumer can set directly. `OverflowMenu` already had the same
kind of prop (`src/OverflowMenu/OverflowMenu.svelte`, `export let maxHeight`
around line 47, applied via `maxHeightStyle` and `class:bx--overflow-menu-options--scrollable={!!maxHeight}`).

`src/ListBox/ListBoxMenu.svelte` (used internally by Dropdown, ComboBox, and
MultiSelect) has **no `maxHeight` prop at all**. Today, Dropdown/ComboBox/MultiSelect
each compute a *fixed, non-overridable* height cap from a shared util:

```js
// src/ListBox/list-box-utils.js
export const MENU_MAX_HEIGHT = Object.freeze({ xs: "8.25rem", sm: "11rem", md: "13.75rem", lg: "16.5rem", xl: "16.5rem" });
export function getMenuMaxHeight(size = "md") { return MENU_MAX_HEIGHT[size]; }
```

Each of the three components does:

```js
$: menuMaxHeight = getMenuMaxHeight(size);
```

and applies it only in specific cases — look at the identical block in all
three (`src/Dropdown/Dropdown.svelte` ~line 711, `src/ComboBox/ComboBox.svelte`
~line 881, `src/MultiSelect/MultiSelect.svelte` ~line 1057):

```js
style={effectivePortalMenu
  ? `max-height: ${virtualConfig ? `${virtualConfig.containerHeight}px; overflow-y: auto` : menuMaxHeight};`
  : virtualConfig
    ? `max-height: ${virtualConfig.containerHeight}px; overflow-y: auto;`
    : undefined}
```

Read this carefully before changing it: the size-based `menuMaxHeight` is
**only** applied when the menu is portaled (`effectivePortalMenu`); a
non-portaled, non-virtualized menu currently gets no `style` at all (`undefined`).
When `virtualConfig` is set (virtualization active), the height comes from
`virtualConfig.containerHeight` instead, regardless of portal state — virtualized
lists compute their own scroll container height for row math and **must keep
doing so**; do not let a consumer `maxHeight` override break virtualization's
height/row-count calculations.

## What to implement

Goal: let a consumer pass an explicit `maxHeight` (number = px, string = any
CSS length, same convention as `Menu`/`OverflowMenu`) to override the
size-based default, without breaking virtualization or the existing
portal/non-portal behavior.

1. **`src/ListBox/ListBoxMenu.svelte`**: add a `maxHeight` prop
   (`export let maxHeight = undefined;`) with the same JSDoc wording used in
   `Menu.svelte`. Normalize it the same way Menu does
   (`typeof maxHeight === "number" ? \`${maxHeight}px\` : maxHeight`) and apply
   it via a `style:max-height` directive, merged sensibly with the existing
   inline `style` used in the portal branch (`style="position: static; ..."`).
   Decide whether ListBoxMenu should own the normalization or just accept an
   already-normalized CSS-length string from its caller — either is
   reasonable, but be consistent with how the three parent components already
   compute `menuMaxHeight`.
2. **Dropdown, ComboBox, MultiSelect**: add an `export let maxHeight = undefined;`
   prop (same JSDoc as `Menu`'s), and use it to override `menuMaxHeight` when
   set, e.g. `$: resolvedMenuMaxHeight = maxHeight ?? getMenuMaxHeight(size);`
   — then use `resolvedMenuMaxHeight` everywhere `menuMaxHeight` was used.
   Preserve the exact existing precedence: `virtualConfig`'s computed
   `containerHeight` still wins over any height source when virtualization is
   active (virtualization needs an accurate container height for its row math
   — do not let a raw consumer `maxHeight` silently break that). If you think
   a consumer-supplied `maxHeight` should apply *even under virtualization*,
   that's a bigger design decision (feeding it into the virtualizer's height
   calc) — do not attempt that; keep virtualization's own height authoritative
   and treat `maxHeight` as only affecting the non-virtualized cap. Apply the
   same change in **all three** components; do not let their implementations
   drift from each other.
3. Follow CONTRIBUTING's ordering rule: JSDoc tags first, then all
   `export let` props (each with JSDoc), then imports, then logic. Use `$:`
   reactive statements, not inline computation in markup.

## Docs

`Dropdown.svx`, `ComboBox.svx`, and `MultiSelect.svx` are in
`docs/src/pages/components/`. Each already has a `## Virtualization` section
with `### Custom threshold` / `### Custom overscan` subsections — that's the
right neighborhood for a new `### Custom max height` (or similar) subsection,
since it's the same "override the computed default" pattern. Alternatively, if
`maxHeight` is meant to apply regardless of virtualization, place it as its
own `## Max height` section modeled on `Menu.svx`'s `## Scrollable` section:

> Set `maxHeight` to cap the menu height and scroll the remaining items. A
> number is treated as pixels; a string is used as any CSS length, such as
> `"20rem"`.

Pick the placement that matches what you actually implemented. Update all
three `.svx` files consistently — same heading, same wording, adapted sample
data per page (each page already has its own item list in nearby examples;
reuse those shapes per CONTRIBUTING's "Reuse the same sample data shapes as
neighboring examples on that page").

## Commits

Split feature and docs, per CONTRIBUTING's Conventional Commits rules:

1. `feat(list-box): add maxHeight override for dropdown, combo-box, and multi-select`
   — the `ListBoxMenu.svelte` + Dropdown/ComboBox/MultiSelect code changes
   together (they're one coherent shared-behavior change; CONTRIBUTING treats
   the three as one unit for shared listbox behavior). If you'd rather split
   per component for reviewability, use `feat(dropdown):`, `feat(combo-box):`,
   `feat(multi-select):` as three commits — either is fine, just keep docs
   separate.
2. `docs(dropdown): document maxHeight override`, `docs(combo-box): document
   maxHeight override`, `docs(multi-select): document maxHeight override` (or
   one combined `docs: document listbox maxHeight override` if you documented
   all three in one commit — CONTRIBUTING allows omitting scope "when the
   change spans many areas").

## Validation (keep it minimal and scoped — do not run the full suite)

```sh
bunx biome check --write src/ListBox src/Dropdown src/ComboBox src/MultiSelect docs/src/pages/components/Dropdown.svx docs/src/pages/components/ComboBox.svx docs/src/pages/components/MultiSelect.svx
bun build:docs   # required after adding an exported prop; output is gitignored, don't commit it
bun run test Dropdown
bun run test ComboBox
bun run test MultiSelect
bun run test ListBox
```

Pay particular attention to any existing virtualization tests for these three
components (search each `tests/<Component>/` folder for "virtual") — confirm
they still pass unchanged, since that's the behavior most at risk here.

Do not run `bun run lint`, `bun run test` (full suite), `bun test:e2e`, or the
Svelte 3/4 compatibility workspaces. Do not hand-edit
`src/**/*.svelte.d.ts` or `docs/src/COMPONENT_API.json` (generated, gitignored).
