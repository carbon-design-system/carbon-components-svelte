# Add shift+click range selection to MultiSelect

## Context

This is `carbon-components-svelte`, a Svelte port of IBM's Carbon Design
System. Read `CONTRIBUTING.md` at the repo root before starting — it defines
the code style, JSDoc/typing, docs, and commit conventions this task must
follow. This repo uses Bun (`bun <script>`, `bunx <bin>`), not npm/pnpm.

Commit `54aaa7d6d` (`feat(data-table): support shift+click selection`) added
range multi-selection to `DataTable`: holding <kbd>Shift</kbd> while clicking
a row checkbox selects (or deselects) every row between it and the last
row clicked. `TreeView` already has an equivalent shift/ctrl-click range
implementation in its checkbox selection mode. `MultiSelect` — the
component most similar to DataTable's checkbox-list selection — has no
`shiftKey` handling anywhere in `src/MultiSelect/MultiSelect.svelte`; its
`selectItem` function only ever toggles one item at a time.

### The DataTable pattern to mirror

Read `src/DataTable/DataTable.svelte` around these three spots before
starting:

```js
// state: the id of the last row explicitly clicked, used as the range anchor
let lastSelectedRowId = null;

// reset alongside the rest of selection state
function resetSelectedRowIds() {
  selectAll = false;
  selectedRowIds = [];
  lastSelectedRowId = null;
}

/**
 * Apply `checked` to every selectable row between the anchor row and `targetIndex`
 * (inclusive). Returns `false` if the anchor row is no longer present (for example,
 * filtered out), so the caller can fall back to a single toggle.
 */
function selectRowRange(targetIndex, checked) {
  const anchorIndex = rowsToVirtualize.findIndex((row) => row.id === lastSelectedRowId);
  if (anchorIndex === -1) return false;

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  const next = new Set(selectedRowIds);
  for (const row of rowsToVirtualize.slice(start, end + 1)) {
    if (nonSelectableRowIdsSet.has(row.id)) continue;
    if (checked) next.add(row.id); else next.delete(row.id);
  }
  selectedRowIds = [...next];
  return true;
}
```

And the click handler that uses it (`InlineCheckbox`'s `on:click`, in the
selectable-column `<td>`):

```js
on:click={(event) => {
  const checked = event.target.checked;
  const usedRange = event.shiftKey && lastSelectedRowId !== null && selectRowRange(actualIndex, checked);
  if (!usedRange) {
    const next = new Set(selectedRowIds);
    if (checked) next.add(row.id); else next.delete(row.id);
    selectedRowIds = [...next];
  }
  lastSelectedRowId = row.id;
  dispatch("click:row--select", { row, selected: checked });
}}
```

The key ideas: track an anchor id (not index — indices shift as data
reorders/filters), find the anchor's *current* position in whatever list is
currently rendered, range-select between that position and the clicked
item's position, skip non-selectable items in the range, and always update
the anchor to the just-clicked item regardless of whether a range was applied.

### Where this plugs into MultiSelect

`src/MultiSelect/MultiSelect.svelte`:

- `selectItem(item)` (~line 367) is the single-item toggle logic today. It
  mutates `sortedItems` in place (`sortedItems[itemIndex] = { ...item, checked:
  !item.checked }; sortedItems = [...sortedItems];`), handles the `isSelectAll`
  pseudo-item specially, and recomputes `selectedIds` either immediately (when
  `selectionFeedback === "top"`) or via a length-diff check in `afterUpdate`
  further down. Read the whole function and the `afterUpdate` block below it
  before changing anything — the `selectedIds`/`checked`-length-diff
  bookkeeping is order-sensitive and easy to break.
- The primary mouse click path is the `on:click` handler on `<ListBoxMenuItem>`
  around line 1087:

  ```js
  on:click={(event) => {
    if (itemDisabled) { event.stopPropagation(); return; }
    event.preventDefault();
    selectItem(item);
    if (filterable) inputRef?.focus(); else fieldRef?.focus();
  }}
  ```

  `event` (with `.shiftKey`) is available here. The item's position in the
  currently-rendered list is `actualIndex` (`{@const actualIndex = virtualData.startIndex + index}`
  a few lines above, inside the `{#each itemsToRender as item, index (item.id)}` block) —
  this is the non-virtualized-list equivalent of DataTable's `actualIndex`/`rowsToVirtualize`.
  Confirm whether `itemsToRender` or `sortedItems` is the correct list to
  index range boundaries against (they may differ when filtering is active)
  — use whichever one `actualIndex` is actually indexing into, the same way
  DataTable ranges over `rowsToVirtualize` because that's what `actualIndex`
  indexes into there.

## What to implement

1. Add anchor-tracking state analogous to `lastSelectedRowId`, for example
   `let lastSelectedItemId = null;`, reset it wherever selection is reset
   entirely (the places that already do `selectedIds = [];` — search for
   that string in the file; there are several, including select-all-clear and
   read-only guards).
2. Add a `selectItemRange(targetIndex, checked)`-style helper mirroring
   `selectRowRange`, adapted to MultiSelect's `sortedItems`-with-`.checked`
   data model instead of DataTable's `selectedRowIds` Set. Skip disabled
   items and the `isSelectAll` pseudo-item in the range the same way
   DataTable skips `nonSelectableRowIdsSet` members.
3. Wire `event.shiftKey` into the click handler at ~line 1087: when shift is
   held and an anchor exists, apply the range instead of calling
   `selectItem(item)`'s single-toggle path; otherwise fall back to the
   existing single-toggle behavior. Update the anchor id to `item.id` after
   every click, in or out of a range. Make sure the existing
   `selectedIds`/`selectionFeedback` bookkeeping that currently lives inside
   `selectItem` (and the `afterUpdate` diff below it) still fires correctly
   for a range selection — don't let range-selected items silently fail to
   propagate into `selectedIds` or skip the `on:select` dispatch.
4. Only wire this into the primary mouse-click path (~line 1087). Do not
   extend it to the keyboard-Enter path (~line 1001) or the "select highlighted
   item" path (~line 853) — shift+click is a pointer-specific interaction
   pattern, matching DataTable's scope.
5. Follow CONTRIBUTING's conventions: `Set`/`Map` for membership checks where
   it matters, keep the helper as a plain named `function` (not inline in
   markup), and don't clobber the exported `selectedIds` prop directly from
   inside the range helper if the existing code path routes through
   `sortedItems` first — match whatever ordering the existing `selectItem`
   function already uses so behavior stays consistent between a single click
   and a range click.

## Docs

`docs/src/pages/components/MultiSelect.svx` has a `## Selection` section
(`### Initial selection`, `### Selection feedback`, `### Maximum selection`,
`### Select all`, `### Sorted items`, ...). DataTable documented its
equivalent feature as a single added sentence inside its existing `###
Checkbox` subsection, not a new heading:

> Set `selectable` to `true` for multi-select. Bind selectedRowIds to track
> selections. Use inputName to customize checkbox names. Hold
> <DocKbd label="Shift" /> while clicking a checkbox to select every row
> between it and the last row clicked.

Follow the same approach here: add one sentence to the intro of
MultiSelect.svx's `## Selection` section (or to whichever existing example is
the natural checkbox-selection example) using
`<DocKbd label="Shift" />` (mdsvex auto-imports it — no manual import), for
example: "Hold <DocKbd label="Shift" /> while clicking an item to select
every item between it and the last item clicked." Do not add a new heading
or a new example file for this — it's a modifier on existing selection
behavior, matching how DataTable documented it.

## Commits

1. `feat(multi-select): support shift+click range selection`
2. `docs(multi-select): document shift+click range selection`

## Validation (keep it minimal and scoped — do not run the full suite)

```sh
bunx biome check --write src/MultiSelect docs/src/pages/components/MultiSelect.svx
bun run test MultiSelect
```

No `bun build:docs` needed here unless you also add/change a prop's JSDoc —
this is pure interaction-handling logic with no new public API surface. Add a
focused unit test: click one item, shift+click a later item, assert every
item in between is now checked and reflected in `selectedIds`; and a second
case confirming shift+click with no prior click (no anchor) falls back to a
plain single-item toggle. Look at how DataTable's own shift+click tests are
written (`tests/DataTable/`, search for "shift") and mirror the interaction
style (the shared `user` helper from `tests/utils/user.ts`, `getByRole`
queries) rather than reaching for `data-testid`.

Do not run `bun run lint`, `bun run test` (full suite), `bun test:e2e`, or the
Svelte 3/4 compatibility workspaces. Do not hand-edit
`src/**/*.svelte.d.ts` or `docs/src/COMPONENT_API.json` (generated, gitignored).
