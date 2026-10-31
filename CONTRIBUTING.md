# Contributing

If you're not sure what to build or how to approach a change, [file an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues) before opening a PR.

## Prerequisites

Codebase:

- [Bun](https://bun.com/docs/installation)

Use Bun as the package manager and task runner. Run package scripts with `bun <script>` and one-off binaries with `bunx <bin>`.

## Project set-up

Fork the repo and clone your fork:

```sh
git clone <YOUR_FORK>
cd carbon-components-svelte
```

Set the original repository as the upstream:

```sh
git remote add upstream git@github.com:carbon-design-system/carbon-components-svelte.git
# verify that the upstream is added
git remote -v
```

### Set up

```sh
bun setup
```

This installs root and docs dependencies, generates TypeScript definitions and `docs/src/COMPONENT_API.json`, and builds the theme StyleSheets in `css/`.

Component documentation lives in `docs/`. The site uses [Vite](https://vite.dev/), [Routify 3](https://routify.dev/docs), Svelte 5, and MDsveX. The Vite config resolves `carbon-components-svelte` to the repository root, so edits under `src/` show up in the docs without a separate package link.

To preview the docs site locally:

```sh
cd docs
bun dev
```

The site serves at http://localhost:5173/ (or the next available port).

## Best practices

Conventions used across `src/`. Follow them in new and changed code.

Parity with Carbon v11 is the floor. Where this library can do better than Carbon React, in DX, implementation or performance, do it. Never accept a weaker design to get past a repo rule, a test or a budget. Change the rule explicitly instead, and say why. CssGrid reads v11's `--cds-grid-*` properties so a value on any ancestor wins, and the custom-property rule changed to allow v11's defaults as fallbacks ([#4083](https://github.com/carbon-design-system/carbon-components-svelte/pull/4083)). The grid then outgrew the fixed CSS size ceilings, so [#5000](https://github.com/carbon-design-system/carbon-components-svelte/pull/5000) replaced them with a per-PR growth limit rather than move the grid out of `all.css`.

### Code style

Comments:

- Do not add trivial comments. If a comment restates what the code already says, delete it or improve the code instead.
- Reserve comments for non-obvious behavior: Svelte reactivity edge cases, ARIA placement, workarounds for Carbon v10 gaps. See loop guards in [`ContentSwitcher.svelte`](src/ContentSwitcher/ContentSwitcher.svelte) and the duplicate-dispatch guard in [`Checkbox.svelte`](src/Checkbox/Checkbox.svelte).

Patterns:

- Use `function` declarations in `<script>`. Declare handlers, defaults, and logic as functions rather than inline in markup. Named functions give stable references for default prop values (see `defaultShouldFilter` in [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte)).
- Avoid `afterUpdate`. It runs after every DOM update and is easy to loop in Svelte 5. Prefer `$:` reactive statements with guards, event handlers, `onMount`, or `tick()` for DOM reads. Legacy code may still use `afterUpdate` for scroll-sync or measurement; do not add new uses without a strong reason.
- When moving a `dispatch(...)` from `afterUpdate` to `$:`, timing changes. `afterUpdate` ran after the DOM commit; `$:` runs during the flush. A throwing handler can abort the rest of that flush. Update internal `prev` state first, then `tick().then(() => dispatch(...))`, and snapshot values for the callback (`const next = value`). See [`FileUploader.svelte`](src/FileUploader/FileUploader.svelte), the storage components, and [`Theme.svelte`](src/Theme/Theme.svelte). Keep cancelable, user-driven dispatches synchronous.
- Under Svelte 5, legacy `afterUpdate` can run before a keyed `{#each}` in the same component patches its rows. A DOM read there sees the previous window. Wait for `tick()` before reading. See `stampSpacedRows` in [`VirtualList.svelte`](src/VirtualList/VirtualList.svelte).
- Reset cached positional state (scroll offset, highlighted index, measured sizes) reactively when its source collection changes, not just on open/close. A value cached against the old list, such as a scroll position into pre-filter results, silently points past the end of the new one. Use a `$:` guard comparing against the previous length or identity.
- Do not assign to a variable that a `$:` statement derives. The next flush recomputes it from its inputs, so the manual write is dead at best and misleading at worst. Change the inputs instead. `DataTable`'s `selectAll` is derived from `selectedRowIds`; clearing the selection is enough.
- Put component-level JSDoc first (`@restProps`, `@slot`, `@template`), then **all `export let` props** (each with its own JSDoc), then **imports**, then local logic. See [`Button.svelte`](src/Button/Button.svelte) and [`Box.svelte`](src/Box/Box.svelte).
- Keep small, component-specific helpers inline in the `<script>` block. Extract to `src/utils/` only when the logic is shared across components or complex enough to unit-test in isolation. See [`debounce.js`](src/utils/debounce.js) and [`is-outside-click.js`](src/utils/is-outside-click.js). Token primitives such as [`Text.svelte`](src/Text/Text.svelte) and [`Box.svelte`](src/Box/Box.svelte) map props to utility classes and inline styles directly; their themeable rules live in `css/_type.scss`, `css/_box.scss`, and related partials.
- Check `src/utils/` before hand-rolling a helper. Hover-intent timers ([`createDelayedSetter`](src/utils/delayed-setter.js)), index wrapping and clamping ([`moveIndex`](src/utils/move-index.js), [`clampIndex`](src/utils/clamp-index.js), `clamp` in [`numeric-format.js`](src/utils/numeric-format.js)), shared `window` listeners ([`addPooledListener`](src/utils/window-listener-pool.js)), portal tooltip gaps ([`iconTooltipPortalGaps`](src/Portal/icon-tooltip-portal-gaps.js)), value comparison ([`deepEqual`](src/utils/deep-equal.js): `Date` by time, arrays and plain objects walked, functions and non-plain objects such as `Map`, `Set`, DOM nodes, and class instances by identity), and [`noop`](src/utils/noop.js) all exist and are already used by sibling components. Confirm the edge cases match before swapping: `createDelayedSetter` runs a non-positive delay synchronously, not as `setTimeout(fn, 0)`, `clamp` checks `max` before `min`, which differs from two sequential `if`s when the bounds cross, and `deepEqual` deliberately returns `false` for two different `Map`s or DOM elements even when they look alike, since neither exposes its state as own enumerable keys.
- Create `Intl` objects lazily and reuse them. Construction is the expensive part: the first `Intl.Segmenter` on a page costs about 12 ms in Chromium, and `localeCompare` with an options argument builds a new collator on every call. Cache formatters with [`intl-formatter-cache.js`](src/utils/intl-formatter-cache.js), hoist a collator out of the sort comparator, and skip the segmenter when a cheap check settles the answer (see `firstGrapheme` in [`initials.js`](src/utils/initials.js)).
- Prefer `||` over `??` for a fallback whose input is a possibly-empty string. `??` only substitutes on `null`/`undefined`, so a prop that defaults to `""` (`minLabel`, `maxLabel`, and similar text props) still passes the empty string through unchanged instead of falling back. `Slider`'s `formatRangeLabel` had exactly this bug (`label ?? numericValue`, shipped in a release) while the near-identical `RangeSlider` copy used `label || numericValue` and rendered correctly.
- Before extracting a helper duplicated across sibling components to `src/utils/`, diff every copy line by line. Matching names and parameter shapes do not guarantee matching behavior: copies drift as one component picks up a fix or feature the other doesn't. `Tabs`'s scroll-overflow check carries a Firefox sub-pixel epsilon that `TabsVertical`'s otherwise-identical copy never got. Extract once every copy is confirmed identical; where they've drifted, fix the bug in its own commit first, then extract. Some superficially similar helpers are not safe to merge at all: the tooltip claim/release logic in `Button`, `CopyButton`, `TooltipIcon`, and `TooltipDefinition` shares a name and purpose but differs in delay semantics per component, so leave those separate rather than forcing one abstraction. A tooltip that only labels its anchor on hover and focus (icon-only `Switch`, `Tab`, and `ToggleButton`, `PasswordInput`'s toggle, `HeaderAction`, `FileUploaderButton`, `Tag`, `Truncate`) uses [`createAnchoredTooltip`](src/utils/anchored-tooltip.js) or the `AnchoredTooltip` component, which bring the tooltip group handoff and Escape (WCAG 1.4.13). Use them for a new one. Every icon tooltip is hoverable: it waits a short leave delay, a portalled one stays open while the pointer is on it, and an inline one ignores clicks ([`ignoreTooltipClicks`](src/utils/tooltip-clicks.js)) so it never presses the trigger under it. Where a tooltip covers another control, the pointer on that part closes it at once ([`closeOverControls`](src/utils/tooltip-cover.js), and `PortalTooltip`'s `cover` event), so the click reaches the control. Move focus with [`focusQuietly`](src/utils/focus.js) when a component moves it on its own, such as a dialog's first focus or focus returned to a trigger. A tooltip claims focus through `claimFocus` from [`createTooltipHandoff`](src/utils/tooltip-handoff.js), which stays closed for that focus.
- Forward DOM events with bare `on:click` / `on:focus` (no handler) on the underlying element ([`Button.svelte`](src/Button/Button.svelte)).
- Interpolate attribute values with Svelte's attribute syntax, not template literals: `id="{treeId}-{id}-subtree"`, not ``id={`${treeId}-${id}-subtree`}``. Keep template literals only when a value needs nested quotes or logic the shorthand can't express (see `aria-label` in [`PinCodeInput.svelte`](src/PinCodeInput/PinCodeInput.svelte)).
- Compound components use `setContext` / `getContext` with `carbon:` keys ([`CheckboxGroup.svelte`](src/Checkbox/CheckboxGroup.svelte)). Put a key that another family reads in [`context-keys.js`](src/constants/context-keys.js), and keep family-local keys inline. For a group whose children register themselves, expose `{ items, register(item), unregister(id), update(id, patch) }` on the context, where `items` is a `writable` store of registered entries. Order entries by DOM position at registration time, not mount order, since children can mount out of DOM order when conditionally rendered. Use [`insertByDomOrder`](src/utils/sort-by-dom-order.js), which appends after one `compareDocumentPosition` check and only re-sorts when a child arrives out of order; re-sorting the whole list on every registration is quadratic (1,770 comparisons for 60 tags). See `UserAvatarGroup` / `UserAvatar` and `TagSet` / `Tag`. When a child needs to trigger a group-level action, such as a close button the group must react to, add a `notify*` method to the context and call it in addition to the child's own local dispatch, so the component still works standalone outside the group. Route every mutator (`register`, `unregister`, `update`) through [`batchStoreUpdates`](src/utils/batch-store-updates.js). Mixing a direct `items.update(...)` with a batched call can read a stale array. See [Batching child registration](#batching-child-registration).
- Take first-paint state from props, `$$slots`, or the markup of the element that needs it, not from children that register. The server writes a parent's markup before its children render and never runs their registration, so registration only corrects the page after hydration, and the layout jumps. A [hydration test](#hydration-tests) shows the jump in `settledDiff`. Each `Tab` marks itself `bx--tabs__nav-link--single-line` ([`Tab.svelte`](src/Tabs/Tab.svelte)). ContentSwitcher reads its `iconOnly` prop until its switches register ([`ContentSwitcher.svelte`](src/ContentSwitcher/ContentSwitcher.svelte)). The fluid DatePicker cell marks itself `--fluid--neutral` ([`DatePickerInput.svelte`](src/DatePicker/DatePickerInput.svelte)). A host with a filled `decorator` slot starts with its AI surface class ([`Card.svelte`](src/Card/Card.svelte)). For the one case markup can't carry, see the gated `:has()` exception in [Conventions](#conventions).
- Prefer a data-array prop (`items`, `tags`) plus a per-item slot when the collection needs bulk operations that only make sense on structured data: search, filtering, virtualization, reordering (`ComboBox`, `MultiSelect`, `TreeView`). Prefer child composition, real component instances as `<slot />` children, when items are simple, independently-styled elements a consumer would reach for standalone (`Tag`, `UserAvatar`); `UserAvatarGroup` / `TagSet` register those children via context instead of taking a data array.
- Take an `id` prop and derive every inner id from it (`{id}-title`). Fall back to `uniqueId()` from [`unique-id.js`](src/utils/unique-id.js) only when `id` is unset, so prerendered HTML stays the same and hydration keeps the ids. See `fallbackId` in [`InlineNotification.svelte`](src/Notification/InlineNotification.svelte).
- Key `{#each}` blocks, for example `(item.id ?? index)` (see [`RecursiveList.svelte`](src/RecursiveList/RecursiveList.svelte)).
- For large lists, iterate ids, not objects. In Svelte 5's legacy mode, an `{#each}` over objects treats every item as changed whenever the array is reassigned, so a sort or filter re-runs every row's markup even when no row changed. Iterating a primitive id array and looking the row up by id lets a reorder only move rows. See `rowIdsToRender` in [`DataTable.svelte`](src/DataTable/DataTable.svelte), which cut a 1,000-row sort from about 61 ms to 45 ms. Svelte 3 and 4 compare keyed items by reference and don't have this cost.
- In `src/utils/`, prefer pure, DOM-free functions for layout, geometry, and state-decision math (see [`virtualize.js`](src/utils/virtualize.js)). They are unit-testable in isolation, so edge cases get covered once in a util test instead of through expensive component renders.
- ComboBox, Dropdown, and MultiSelect share listbox behavior (virtualization, keyboard navigation, outside-click) through `src/utils/`. When you change shared menu behavior, apply and test the change in all three. The per-component wiring is parallel but not abstracted.
- Use Carbon v10 markup: `bx--` BEM classes in templates; SCSS patches use `$prefix` and tokens. See [Custom styles](#custom-styles-patching-carbon-v10).
- Do not add themeable styles in per-component `<style>` blocks (see [Custom styles](#custom-styles-patching-carbon-v10)).
- Use the legacy Svelte 5 API. Components use `export let`, `$:`, and `createEventDispatcher`. Do not introduce runes (`$state`, `$derived`, `$effect`) unless the project explicitly migrates.
- Bind per-iteration values once with `{@const}` inside `{#each}` blocks, then reuse them across the markup instead of recomputing inline. See `isSelected` / `isExpanded` / `rowClassValue` in [`DataTable.svelte`](src/DataTable/DataTable.svelte) and `actualIndex` in [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte).
- Keep reactive inputs visible in `$:` and `{@const}` expressions. Svelte 3/4 track dependencies by the identifiers in the statement, so `$: x = compute()` or `{@const x = compute(item)}` where `compute` closes over other component state never re-runs when that state changes (Svelte 5's signals hide the bug locally, but the compatibility suites will not). Pass the state as arguments (`compute(item, isAtSelectionCap)`) or keep the expression inline.
- Use `Set` / `Map` for membership and id lookups instead of `.includes()` / `.find()`. The O(1) lookup matters in components that can hold large datasets. See the `selectedRowIdsSet` / `nonSelectableRowIdsSet` sets in [`DataTable.svelte`](src/DataTable/DataTable.svelte) and the `itemsById` map in [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte).
- Row virtualize and pagination bound the DOM, not derived per-row records. Walk the painted window (`rowsToRender`) when building cell maps and similar objects, not the source `rows`. Hide-mode still paints every mounted row. A four-column mount fixture will not catch rows×columns allocation. See `buildCellsForPaintedRows` in [`DataTable.svelte`](src/DataTable/DataTable.svelte).
- A window held open by spacer elements, as in TreeView and VirtualList's `spacerTag`, stays in normal flow. Three things follow:
  - The browser's scroll anchoring reacts when row heights disagree with the offsets, so scrolling stalls or jumps back. Rows that can wrap need measured heights. A window moved by `transform` does not hit this.
  - A border box leaves out margins. A row advances by its height plus its margins: ContainedList items are 48px tall but advance 47px.
  - Spacers count for `:first-of-type` and `:last-of-type`. Render the end spacer only while rows follow the window, so the true last row keeps its styles.
- Keep a virtualized window ahead of the browser. The browser scrolls on the compositor and paints the new position before the `scroll` event reaches the component, which happens once per frame. A window that covers only the current viewport flashes blank space whenever one frame moves farther than `overscan`. Render ahead in the direction of travel (`scrollDelta` in [`virtualize.js`](src/utils/virtualize.js)). For jumps no lead can cover, such as a scrollbar drag, pin the window with [`virtual-window.js`](src/utils/virtual-window.js) (`optimizeFastScroll`).
- Overscan rows are rendered, not visible. Decide whether a row is in view from the viewport, never from the rendered range. Counting overscan as visible left the keyboard highlight below the menu's edge when keys arrived faster than frames. See `scrollHighlightedIntoView` in [`virtualize.js`](src/utils/virtualize.js). Bring a clipped option fully into view only for the keyboard. The pointer can only reach an option it can see, so scrolling for a hover moves the list out from under it. See `scheduleHighlightScroll` in [`menu-window.js`](src/ListBox/menu-window.js).
- A pinned window moves only when the component renders. Code that writes `scrollTop` and then reads row positions must call `syncPinnedWindow` in between, as `scrollTo` in [`menu-window.js`](src/ListBox/menu-window.js) and [`scrollIntoViewWithin`](src/utils/scroll-into-view-within.js) do.
- Do not clip a sticky layer with `overflow: hidden`. That makes the layer a scroll container, so `scrollIntoView`, focus, and find-in-page scroll the layer instead of the list. Let the scroll container clip. In Chromium, content that overflows a sticky element does not extend the scroll range either, so [`VirtualWindow.svelte`](src/VirtualList/VirtualWindow.svelte) stretches the spacer to rendered measured rows. It skips rows of known height, since reading their geometry forces a layout on every scroll.
- Gate expensive lookups by state. When an O(n) array computation is only needed in a certain state (on open, on hover), compute it imperatively in that state rather than in an always-on reactive statement or derivation. ComboBox still empties `filteredItems` while closed. While open, `filterMode` chooses hide (keep option nodes, `hidden` the misses) vs remove. Same tradeoff as DataTable. Do not invent a third filter model.
- Guard imperative work by value, not identity. Svelte treats objects, arrays, `Date`s, and functions as always changed, so a `$:` that reacts to an object prop re-runs whenever the consumer hands over a new but equal value. Declarative markup absorbs that for free, since Svelte only writes an attribute whose value differs. A side effect does not: calling into a third-party instance, recreating an observer, re-sorting a list, or rebuilding an index pays the full cost every time. Compare against a `prev<Name>` with [`deepEqual`](src/utils/deep-equal.js) before doing the work. For large collections use a cheaper purpose-built check instead (`rowsEqual` in [`data-table-utils.js`](src/DataTable/data-table-utils.js), `isSameCollection` in [`menu-window.js`](src/ListBox/menu-window.js)), since a deep walk of 10,000 rows can cost more than it saves. See `optionChanged` in [`DatePicker.svelte`](src/DatePicker/DatePicker.svelte): flatpickr's `set()` rebuilds the whole day grid, and 200 equal `minDate` updates went from 400 `set` calls to 0.
  - A new-but-equal value does not come from every parent render. Svelte re-evaluates a markup expression only when one of its dependencies is invalidated, and skips equal primitives. Measured over 50 parent updates:

    | Consumer code | Child re-runs |
    | --- | --- |
    | `prop={new Date(2024, 0, 1)}`, a constant | never |
    | `prop={new Date(year, 0, 1)}`, `year` set to the same number | never |
    | `prop={build(config)}`, `config` reassigned to an equal object | every time |
    | `$: derived = ...` re-running for another reason, `prop={derived}` | every time |

    The real triggers are values rebuilt in `$:`, forwarded through a wrapper or `{...spread}`, or read from an object that gets reassigned. Reproduce a finding through one of those before calling it a problem, and do not write "on every render" in a commit or doc unless the constant case re-ran too.
- Observe size and visibility through [`shared-observer.js`](src/utils/shared-observer.js), not a `new ResizeObserver` per instance. `observeResize(element, callback)` and `observeIntersection(element, callback, options)` return an unsubscribe function, and every instance on the page shares one observer, so all callbacks run in one batch. With an observer per instance, each callback flushes Svelte on its own and forces a layout: 50 `CodeSnippet`s took 51 layouts to mount, and 2 on the shared observer. To queue a fresh measurement later, unsubscribe and observe again, since observing delivers an initial callback (see `observeOverflow` in [`Tabs.svelte`](src/Tabs/Tabs.svelte)). Keep a dedicated observer only when the shared one can't express it, such as an `IntersectionObserver` whose `root` is the component's own scroll element ([`ScrollGradient.svelte`](src/ScrollGradient/ScrollGradient.svelte), one observer for its four sentinels). Within a component, still use one observer of a type for related targets: Svelte does not order independent `$:` statements, so one block's `.disconnect()` can race another's `.observe()`.
- Batch layout reads and writes across instances. A per-instance `requestAnimationFrame` that writes a style, then reads `scrollHeight`, forces one layout per instance. [`createFrameJob`](src/utils/frame-batch.js) runs every scheduled job's stages together: all reads, then all writes, then all reads, so the page pays one layout between stages. Growing `TextArea`s went from 205 layouts to 9 for 50 fields.
- Moving `bx--visually-hidden` from a container onto one of its children is a layout change. The container's margins, padding, gap, and min-width stay behind. Moving it from ProgressBar's label row onto the label text so value text could stay visible left an empty row and an inline indent ([#4315](https://github.com/carbon-design-system/carbon-components-svelte/issues/4315)). Hide the container too when nothing visible remains in it, as Carbon React does for the whole label row. Unit tests only see the class, so add a case to [`e2e/hidden-label.test.ts`](e2e/hidden-label.test.ts) for any component with `hideLabel`.
- Build closed and collapsed content on first use, then keep it. Hidden content still costs: `display: none` skips layout and paint but not creation, memory, `querySelectorAll` walks, or teardown, and `visibility: hidden` (Carbon's closed modals) is laid out as well. Gate it with a keep-alive flag that flips on the first open and never back, not `{#if open}`, which rebuilds on every open and drops form values and scroll position. See `openedOnce` in [`AccordionItem.svelte`](src/Accordion/AccordionItem.svelte) and `subtreeRendered` in [`TreeViewNodeList.svelte`](src/TreeView/TreeViewNodeList.svelte). Keep in the DOM what something else depends on while closed: `aria-controls` / `aria-labelledby` targets (defer their contents, not the element), form participants (see the next item), shells that animate open or closed, and children that report state to a parent as they mount (`selected` options in a `ContextMenu` group, the current page in `SideNavMenu`).
- Build lazily only behind the component's own open action. Don't trim what tests, scripts, and assistive tech can reach without opening it, such as a native `<select>`'s options. A Pagination page select that held two options until hover made `user.selectOptions(select, "5")` throw, and set the page to 0 under `fireEvent.change` ([#4657](https://github.com/carbon-design-system/carbon-components-svelte/pull/4657), closed).
- Register page-level listeners once per component tree, not once per nested instance. A `<svelte:window on:…>` in a component that nests itself runs at every level: each `ContextMenu` submenu added its own window `contextmenu` listener that returned straight away, so every right-click ran one handler per submenu ([#4673](https://github.com/carbon-design-system/carbon-components-svelte/pull/4673)). Register it from the root (in `onMount`, removed on destroy) or through [`addPooledListener`](src/utils/window-listener-pool.js).
- `{#if open}` vs `display: none` is a form-participation contract, not only a layout choice. Unmounted controls drop out of `FormData`; CSS-hidden ones do not. MultiSelect used CSS hide so option checkboxes survived native POST ([#1742](https://github.com/carbon-design-system/carbon-components-svelte/issues/1742)); the closed menu now unmounts like ComboBox. If you unmount a closed overlay that used to serialize, put always-mounted fields on the selection, not on the option list. Do not restore CSS hide to get form POST back.
- Do not clobber external props. Never write internal or measured values back into an exported prop. A consumer may `bind:` to a prop to control behavior, and overwriting it silently breaks that control. Measure into an internal fallback and fall back to it only when the public prop is unset. See `measuredMaxHeight` / `measuredPadding` in [`ExpandableTile.svelte`](src/Tile/ExpandableTile.svelte) and the `showMoreLess` handling in [`CodeSnippet.svelte`](src/CodeSnippet/CodeSnippet.svelte). This is the prop-facing counterpart to the `afterUpdate` guidance above.
- Wrapping an imperative library (see [`create-calendar.js`](src/DatePicker/create-calendar.js)):
  - Merge consumer callbacks with the component's own, never spread them over. `...options` after `onOpen: carbonHandler` silently deletes the component's handler, and with it whatever state it maintained. Merge at creation AND on every later update, since the library's setter replaces the whole list.
  - Check what the library returns on failure. flatpickr catches its own init errors and returns `[]`, which is truthy. Normalize a failed init to `null` at the boundary.
  - Latch async creation. If creating the instance awaits anything, a second reactive run can build another instance on the same element before the first resolves. Guard with a `creating` flag, and use an epoch counter to discard an instance that finished after a rebuild was requested.
  - Options the library reads only at creation need a rebuild path, not a setter call. Keep one `recreate*()` helper that destroys, resets the `prev*` trackers, and lets the reactive block create again.
  - Undo your own DOM moves before the library's `destroy()`. If the component relocated a library-owned node, put it back in an `onDestroy` hook first. flatpickr's teardown unwraps `calendarContainer.parentNode`, and after a relocation that was Carbon's own container.
  - Do not assume a setter is cheap or idempotent. Read it. flatpickr's `set()` always redraws, and `minDate` / `maxDate` redraw twice.
  - Pass each instance its own copy of any array or object option the library or a plugin mutates. flatpickr copies its defaults shallowly, so every instance shared one `ignoredFocusElements` array, and the range plugin pushed its second input into it. Every range picker ever mounted stayed in memory with its detached page tree.
- Name internal boolean state as a bare adjective or participle (`open`, `focused`, `truncated`, `initialRender`), not with an `is`/`has` prefix. Reserve `is`/`has` for predicate functions, such as the [`isOutsideClick`](src/utils/is-outside-click.js) util, and for exported props that already use them (public API, unchanged), such as `isSelected` / `isExpanded` in [`DataTable.svelte`](src/DataTable/DataTable.svelte) and `isFluid` in [`TextInput.svelte`](src/TextInput/TextInput.svelte).
- Prefer enums over booleans for props. When a prop selects among mutually exclusive variants, or the set of variants may grow, use a string-union prop instead of several boolean flags. It keeps states exclusive and extensible. See `kind` and `size` in [`Button.svelte`](src/Button/Button.svelte). Keep booleans for genuinely binary, independent toggles such as `disabled` and `open`.
- Apply classes with the `class:` directive, not string concatenation or template literals. Use `class:bx--name={true}` for classes that are always present and `class:bx--name--modifier={condition}` for conditional ones. This keeps each class on its own line and the toggling logic readable. See [`TextInput.svelte`](src/TextInput/TextInput.svelte): `class:bx--form-item={true}` (always) alongside `class:bx--text-input-wrapper--inline={inline}` (conditional).
- Forward `$$restProps` to the most important element. When a component has a clear primary element with the most customizable props, such as the `<input>` or `<button>`, spread `{...$$restProps}` onto it so consumers can set attributes like `name`, `placeholder`, or `data-*` on the element they care about. See the `<input>` in [`TextInput.svelte`](src/TextInput/TextInput.svelte). Only when there is no such element does it go to the wrapper (top-level element), as in [`Tile.svelte`](src/Tile/Tile.svelte).
- Name slots in camelCase. No dashes: a hyphenated slot name will not map to a Svelte 5 Snippet. Use `labelChildren`, not `label-children`.
- Mirror the shadowed prop in the slot name. When a slot overrides the content a prop renders, name it after that prop. Svelte forbids a slot from matching an exported prop name exactly, so suffix it with `Children`: the `labelChildren` slot shadows the `labelText` prop. See `<slot name="labelChildren">` in [`TextInput.svelte`](src/TextInput/TextInput.svelte).
- Make every string a user sees or hears replaceable through a prop. Give a function prop a named `function` default, and reuse the name and signature a sibling already has: PaginationNav takes the same `pageText` and `pageRangeText` as [`Pagination.svelte`](src/Pagination/Pagination.svelte). Give a string a default only when it is right in every use, such as "Close". Leave a name that depends on the content unset, so axe reports it, rather than guess one such as "Actions".
- Set dynamic styles with the `style:` directive, not inline `style` strings or template literals: `style:left="{x}px"`. See [`ContextMenu.svelte`](src/ContextMenu/ContextMenu.svelte) and the thumb position in [`Slider.svelte`](src/Slider/Slider.svelte).
- Swap arrow keys that act along the inline axis under `dir="rtl"`. Left raises a `Slider` and expands a `TreeView` row, as in React Aria. Resolve the direction with `resolveLayoutDirection` from [`layout-direction.js`](src/utils/layout-direction.js) when the key arrives: the element's nearest `dir` attribute first, as in the CSS, so a plain `dir` inside a `LayoutDirection` wins, then the `LayoutDirection`, then the computed direction. Nothing reports a `dir` change on an ancestor, so a value read at mount goes stale. `inlineKey` returns the key as an LTR page reads it, and `rovingFocus` and `createMenubar` take an `rtl()` callback. See `treeKey` in [`TreeView.svelte`](src/TreeView/TreeView.svelte).
- Keep numbers and counts in their own order. Without that, an RTL page moves the sign of "+12%" to the far side ("12%+"). Wrap a formatted number in `<bdi>` with the direction of the locale that formatted it, as BigNumber does with `localeDirection` from [`locale-direction.js`](src/utils/locale-direction.js). Take the direction from the locale, not the text: `Intl` output can start with a left-to-right mark, and Arabic digits have no strong direction. Give a pure count such as "+7" or "99+" `dir="ltr"`, as [`TagSetOverflow.svelte`](src/TagSet/TagSetOverflow.svelte) and [`UserAvatarGroupOverflow.svelte`](src/UserAvatarGroup/UserAvatarGroupOverflow.svelte) do. Do not use a bare `<bdi>` for text with no strong characters. Browser engines resolve its direction differently.
- Place floating content by inline side, read when it opens or the drag starts. A submenu opens toward the inline end, `start` and `end` alignment props name the trigger's inline sides, and a resize drag flips its sign. Map them to physical sides before they reach a `left` or a physical class. Reuse the placement helpers instead of new math, so every overlay fits by the same rules. They already handle a box with no layout and an anchor scrolled out of the window:
  - [`menu-placement.js`](src/utils/menu-placement.js): `fitMenuAxis` places a menu along one axis, `menuSide` picks an in-place menu's block side by the rule a portalled menu follows, and `fitIntrinsicAlign` picks a menu's start, end or center alignment.
  - [`fit-align.js`](src/utils/fit-align.js): `horizontalBounds`, `shouldFlipAlign` and `fitPopoverAlign` fit a popover to the box around it, `sidePlacement` names the placement a portal put it in, `windowShift` slides it back into the window (`slideIntoWindow` keeps doing so for a portalled tooltip's body), and `clippedBy` finds the box that cuts it off.
  - [`inline-align.js`](src/utils/inline-align.js): `physicalAlign` and `popoverPlacement` turn `start` and `end` into physical sides.
- Move an overlay that a box would cut off to a portal by default. Leave `portalMenu` or `portalTooltip` unset for that; `false` keeps the overlay in place, and `true` always portals it. Dropdown, OverflowMenu, TooltipIcon and Toggletip work this way. Two things follow:
  - Consumer CSS that reaches the overlay through a descendant selector stops matching in the portal. `.sidebar .bx--list-box__menu` no longer finds a menu that moved out of `.sidebar`.
  - Key handlers on the component's root no longer see key presses from inside the portal. When focusable content moves into a portal, add a keyboard e2e: focus stays on the active item, and Escape returns focus to the trigger. See [`portal-when-clipped.test.ts`](e2e/portal-when-clipped.test.ts).
- Keep state per instance. Do not write module-level stores or variables while a component renders: on a server, one request's values leak into the next, and two instances on one page share them. Put per-instance state in context (`setContext` in the owner). SideNav's rail state leaked across requests this way ([#4981](https://github.com/carbon-design-system/carbon-components-svelte/pull/4981)).
- Check whether a difference from Carbon React is deliberate before you change it to match. Read the `// ccs:` comments, `git log -S`, the tests that pin the behavior, `e2e/forced-colors.test.ts`, and this file. If it is deliberate, keep it. Carbon React has bugs of its own, and this library is ahead in places: forced colors, the Toggletip caret, RTL keys in TreeView. Never regress a forced-colors row or an accessibility test for parity.

The `{#if skeleton}` early-return pattern is being phased out. Follow it only when maintaining existing skeleton code.

#### Naming conventions

1. Helper files are `kebab-case.js` with a mirrored `kebab-case.d.ts`; components stay
   `PascalCase.svelte`.
2. Named exports only; no `export default` in helpers.
3. Relative imports carry their extension.
4. Functions are declared with `function`; arrows only inline as arguments/property values.
5. Handlers are `handle<Event>` with DOM casing.
6. Component-level DOM refs end in `Ref`; no `El`/`Element` suffix; never `*Ref` for non-DOM values.
7. Previous-value trackers are `prev<Name>`.
8. Internal booleans are bare adjectives.
9. Stores are bare-named; `shared<Prop>` on collision, exposed under the bare context key.
10. Params: `node`, `options`, `callback`, `event`, `index`.
11. Active-item state: `highlighted*` (focus stays on the trigger), `focused*` (item receives DOM
    focus), `selected*` (committed).
12. User-facing text props are `<name>Text`: a string, or `<name>Text(args)` for text built from
    values.
13. Per-item class callbacks are `<part>Class(item)` (`rowClass`, `cellClass`, `dayClass`).
14. Registration claims are `claim<Item>` (`claimTab`, `claimAvatar`).

#### Carbon v11 size aliases

Many `size` props use Carbon v10 names. They also accept Carbon v11's names, so code ported from Carbon React gets the right height. A v11 name is an alias only where the component doesn't already use it. A name that collides keeps this library's meaning.

Resolve an alias with `normalizeSize` and the maps in [`size-aliases.js`](src/utils/size-aliases.js). Resolve it before the value reaches a class, a child or a context, so children only see this library's names. List the aliases in the prop's `@type` union.

| Component | Our names | v11 aliases | Kept on collision |
| :--- | :--- | :--- | :--- |
| Button, ButtonSkeleton, FileUploader, FileUploaderButton, FileUploaderSkeleton | `xs` 24, `small` 32, `field` 40, `default` 48, `lg` 64, `xl` 80 | `sm` → `small`, `md` → `field`, `2xl` → `xl` | `lg` (v11 48), `xl` (v11 64) |
| TextInput, PasswordInput, Select, NumberInput, DatePickerInput, TimePicker, CopyInput, TagInput, their skeletons, Form, InputGroup | `xs` 24, `sm` 32, unset 40, `xl` 48 | `md` → unset, `lg` → `xl` | none |
| PinCodeInput, PinCodeInputSkeleton | `xs`, `sm`, `default` 40, `xl` 48 | `md` → `default`, `lg` → `xl` | none |
| ComboBox, Dropdown, MultiSelect, ListBox, their skeletons | `xs` 24, `sm` 32, unset 40, `lg` 48, `xl` 48 | `md` → unset | none |
| Search, SearchSkeleton, SearchMenu, SearchMenuSkeleton | `xs` 24, `sm` 32, `lg` 40, `xl` 48 | `md` → `lg` | `lg` (v11 48) |
| Accordion, ContentSwitcher, their skeletons, OverflowMenu | `xs` 24 (OverflowMenu only), `sm` 32, unset 40, `xl` 48 | `md` → unset, `lg` → `xl` | none |
| Tag, SelectableTag, OperationalTag, TagSkeleton, TagSet | `xs`, `sm`, `default`, `lg` | `md` → `default` | none |
| Toggle, ToggleSkeleton | `sm`, `default` | `md` → `default` | none |
| Modal, ComposedModal, ConfirmModal | `xs`, `sm`, unset, `lg` | `md` → unset | none |
| TreeView, TreeViewSkeleton | `compact` 24, `default` 32 | `xs` → `compact`, `sm` → `default` | none |
| DataTable, Table, DataTableSkeleton, ToolbarDensity | `compact` 24, `short` 32, `medium` 40, unset 48, `tall` 64 | `xs`, `sm`, `md`, `lg` → unset, `xl` | none |
| Toolbar | `xs` 24, `sm` 32, `default` 48 | `lg` → `default` | none |
| FileUploaderItem, FileDownloadItem | `xs`, `small` 32, `field` 40, `default` 48 | `sm` → `small`, `md` → `field`, `lg` → `default` | none |
| ProgressBar | `sm`, `md` | `small` → `sm`, `big` → `md` | none |

An explicit `md` on a field wins over a parent `Form` size, as any field size does. Components such as ActionSet, Tabs, ContainedList, Pagination and Menu already use v11 names.

API, docs, and workflow:

- Never hand-edit generated files. `src/**/*.svelte.d.ts`, `src/index.d.ts`, and `docs/src/COMPONENT_API.json` are produced by sveld and are gitignored.
- Document the public API in JSDoc. Cover every exported prop, event, slot, and rest-props target. See [Typing with JSDoc](#typing-with-jsdoc).
- Update component docs when appropriate. New props, features, and behavior changes need matching `.svx` updates. See [Component documentation](#component-documentation).
- Use `$$restProps` + `@restProps` for passthrough attributes (see [`Search.svelte`](src/Search/Search.svelte)).
- Scope lint and tests to what you changed. See [Checks](#checks) and [Unit tests](#unit-tests).

## Development workflow

Create a topic branch from `master`. Keep your PR focused and your branch current with upstream `master`.

```sh
git checkout -b new-feature
```

### Component format

Put each component in this layout:

```js
src/Component
│
└───Component.svelte // main component
└───ComponentSkeleton.svelte // Skeleton component (if applicable)
└───index.js // export components
```

Type definitions are generated by sveld. See [Typing with JSDoc](#typing-with-jsdoc).

### Typing with JSDoc

Types live in JSDoc comments, not TypeScript inside `.svelte` files. [sveld](https://github.com/carbon-design-system/sveld) (via `bun build:docs`) reads those comments and writes:

- `src/**/*.svelte.d.ts` and `src/index.d.ts` (consumer types)
- `docs/src/COMPONENT_API.json` (docs site API tables)

The auto-generated Props / Typedefs / Slots / Events tables at the bottom of each docs page come from `COMPONENT_API.json`. JSDoc is the source of truth for API tables; the `.svx` file covers usage examples and prose.

#### JSDoc tags

| Tag | Purpose |
| --- | --- |
| `@type` | Prop type |
| `@template` | Generic type params (supports defaults: `@template {ComboBoxItem<any>} [Item=ComboBoxItem<any>]`) |
| `@typedef` / `@property` | Item/shape types, event payloads |
| `@bindable writable` / `@bindable readonly` | Two-way and element refs |
| `@event` | Dispatched custom events (with payload type) |
| `@slot` | Named/default slot props |
| `@restProps` | Where `$$restProps` land |
| `@extendProps` | Inherit props from another component (skeleton wrappers) |
| `@default`, `@example` | Docs metadata |

Reference [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte) for `@template`, `@typedef`, `@event`, `@slot`, and typed props. For generics in plain JS, see [`src/utils/debounce.js`](src/utils/debounce.js).

#### Example

```js
/**
 * Specify the size of the component
 * @type {"sm" | "md" | "lg"}
 */
export let size = "md";
```

#### After changing a component's API

Whenever you add, remove, or retype an exported prop, slot, or event (including its JSDoc `@type`), regenerate and verify:

```sh
bun build:docs   # sveld: types + COMPONENT_API.json
bun test:types   # svelte-check on tests/
```

`bun setup` already runs `build:docs` once. Repeat `build:docs` only when the component API changes.

When you remove or rename a prop, search `e2e/fixtures/` and `docs/src/pages/framed/` for the old name. Nothing type-checks the e2e fixtures, and the docs examples are type-checked only on PRs that change `docs/`. Svelte ignores an unknown prop, so a stale one passes until an E2E assertion fails or the next docs PR does.

#### Component script types

`bun test:src-svelte-types` type-checks the component scripts themselves (`checkJs` under `strict`, through [`tsconfig.svelte-types.json`](tsconfig.svelte-types.json)). Most components still have errors, so it holds each one to its count in [`scripts/svelte-types-baseline.json`](scripts/svelte-types-baseline.json): a component that gains an error fails, and so does a new component with any. When you fix errors, run `bun test:src-svelte-types --update` to lower the baseline; the check fails until you do. Run `bun build:docs` first.

sveld also reads some JSDoc that TypeScript rejects, and `strict` rejects some that sveld reads. Write the form both accept:

| Write | Not |
| --- | --- |
| `@type {X \| undefined}` on a prop that defaults to `undefined` | `@type {X}` |
| `@param` tags on every helper and handler | Untyped parameters |
| An `@type` on `let x = null` or `writable(null)` | No type: the inferred `null` rejects later writes |
| `@template [Id=any]` above `@typedef {object} Item` | `@typedef {object} Item<Id=any>` |
| `@template` for component generics, in a block without a `@typedef` (TypeScript gives a `@template` to the `@typedef` beside it) | `@generics {T extends Item = Item} T` |
| The script's `generics` attribute when a `@template` can't express the generic, as in [`RecursiveList.svelte`](src/RecursiveList/RecursiveList.svelte): `<script generics="Node extends RecursiveListNode = RecursiveListNode">`. svelte-check and editors read it in plain JS too | The same generic in both the attribute and a `@template` (sveld reports it; the attribute wins) |
| `@extendProps {"./Button.svelte"} ButtonProps` | `@extends {"./Button.svelte"} ButtonProps` |
| One `@event` with its `@type`/`@property` tags per block, or `@event {{ trigger: string }} close` | Several `@event` + `@type {object}` groups in one block |
| A typedef the module script uses, declared in the module script | Declared in the instance script |
| `@template {import("../utils/icon-component.js").IconComponent} [Icon=any]` for a component prop such as `icon` | An unconstrained `@template [Icon=any]` |
| A `@slot` prop type that covers every value the slot gets on every path. A slot rendered per visible header also gets empty headers | A type for the common path only |

sveld writes a `CarbonXContext` type for each `setContext` value. Where it can only infer `any`, or a type with `any` inside it, `bun build:docs` fails with `sveld/context-any-type`:

| Context value | Annotate with |
| --- | --- |
| A store from `writable(undefined)`, `writable(null)` or `derived(...)` | `/** @type {import("svelte/store").Writable<string \| undefined>} */` on the declaration |
| A function, declared outside the object or as a method in it | `@param` tags. Without `@returns`, the return type is read off the body |

`bun test:src-svelte-types` ignores a JSDoc cast in a `$:` statement or a template expression, so the cast doesn't fix an error there. Put a `/** @type {T} */` line above the `$:` declaration, or move the expression into a script variable.

### Creating a component

[File an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues) first.

For a complex component (a grid, a tree, an editor, a board, a picker), read [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) too. It covers API design, design and performance checks, and pull requests.

If you add a new component, export it from `src/index.js`:

```diff
export { CopyButton } from "./CopyButton";
export { ComboBox } from "./ComboBox";
+ export { FixedComboBox } from "./FixedComboBox";
export {
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "./ComposedModal";
```

See [Component documentation](#component-documentation) for the docs checklist.

### Component documentation

Update documentation when the change is user-facing:

- New component: add a new page
- New prop, event, or slot: document usage (JSDoc covers the API table; add an example if non-obvious)
- New feature or variant: add or extend an example section
- Notable behavioral change: update existing prose/examples so they stay accurate

Skip doc updates for internal refactors with no API or behavior change.

Ship docs as their own commit (see [What each commit holds](#what-each-commit-holds)).
Title a new-example commit after the example's exact heading:
`docs(slider): add "Select on focus" example`.

#### Where docs live

| Path | Purpose |
| --- | --- |
| `docs/src/pages/components/{Component}.svx` | Main component page (for example `Button.svx`): prose + examples |
| `docs/src/pages/framed/{Component}/{Example}.svelte` | Interactive demos referenced by `<FileSource>` |

Routify picks up new `.svx` files automatically. The docs config and scripts read the extension from `PAGE_EXTENSION` in [`docs/scripts/constants.ts`](docs/scripts/constants.ts), so change it there. [`docs/scripts/index-docs.ts`](docs/scripts/index-docs.ts) indexes each page and its `##` headings for search. The sidebar is built from [`docs/src/component-categories.ts`](docs/src/component-categories.ts): add new pages to a category there, or they land under "Other". Record the first release in [`docs/src/component-since-versions.ts`](docs/src/component-since-versions.ts) for the "new" badge and the component index.

Prose conventions: see [Prose and inline code](#prose-and-inline-code) and [SVX gotchas](#svx-gotchas).

Preview locally with `cd docs && bun dev`.

If every page shows a 404 after you add or remove files, Routify rebuilt an empty route map. Add and remove any page under `docs/src/pages`, or restart the server.

#### Example conventions

Before adding an example, read the component's `.svx` and follow its order, grouping, and voice. Reference pages: [`Button.svx`](docs/src/pages/components/Button.svx), [`ComboBox.svx`](docs/src/pages/components/ComboBox.svx).

Page structure:

1. Frontmatter block at the very top: a `description:` field, plus `components:` when the page renders an API table or imports components in a `<script>`.
2. Optional `<script>` imports (components + icons used inline).
3. `## Basic` first, then one `## Section title` per variant/feature, each with a short description then the demo.

Frontmatter description:

The lead sentence lives in the frontmatter `description:` field, not in body prose. It renders in the page hero.

- 1–2 plain sentences, ~180 characters max.
- Describe what the component is _for_, not _how it works_. No implementation details ("resize observer", "forwards mouse events", "keyed for performance").
- Renders as plain text: no inline `code` or `[links]`.
- The body must start with a `##` heading. The docs build fails on a leading body paragraph ([`require-leading-heading.ts`](docs/scripts/require-leading-heading.ts)). When lifting an old intro, fold any trailing sentences or links into the `## Basic` prose.

```svelte
---
components: ["Dropdown", "DropdownSkeleton", "FluidDropdownSkeleton"]
description: Dropdowns provide a select input with a dropdown menu, with multiple states, sizes, and customization options.
---
```

Headings and grouping:

- The first, plainest example is `## Basic` — never `## Default`.
- Keep headings concise. The page title already names the component, so drop the repeated component-noun prefix (`Header with app switcher` → `App switcher`) and trailing `state` / `variant` / `size` (`Invalid state` → `Invalid`, `Light variant` → `Light`, `Small size` → `Small`).
- Group related examples under a `## Group` heading with `###` children when several share an axis: `Sizes`, `States` (invalid / warning / disabled / read-only), `Fluid`, `Variants`, `Skeleton`, `Selectable`, `Filterable`, `Low contrast`, and the like. Prefer this over a long flat list of `##` headings. Lead each group with its simplest member using a descriptive label (never `Default`); the group's base example can sit directly under the `## Group` heading. See [`TextInput.svx`](docs/src/pages/components/TextInput.svx) (Sizes / States / Fluid), [`Tag.svx`](docs/src/pages/components/Tag.svx) (Filterable / Selectable), and [`TreeView.svx`](docs/src/pages/components/TreeView.svx).
- Name variant families with a `Base (qualifier)` form: `Fluid (invalid)`, `Icon-only (large)`.

Renaming headings (anchors):

Heading slugs are GitHub-style ([rehype-slug](https://github.com/rehypejs/rehype-slug)): lowercase, spaces to `-`, parentheses and punctuation stripped (`Fluid variant (invalid)` → `fluid-invalid`). When you rename a heading that is a link target:

- Fix in-page links: `grep -nE '\(#' <file>.svx`
- Fix cross-page links: `grep -rn '<Component>#<old-anchor>' docs/src/pages`
- To keep an anchor while grouping, demote the heading to `###` with its text unchanged — the slug is preserved. See `#selectable` / `#radio-group` in [`ContextMenu.svx`](docs/src/pages/components/ContextMenu.svx) and `Portal#custom-target`.

Description language: lead with an imperative instruction when the section introduces a prop to set. Switch to a declarative sentence only to state resulting behavior, not a new action. See [Writing style](#writing-style) for Carbon content rules.

- "Set `kind="secondary"` for secondary actions."
- "Hide the label visually by setting `hideLabel` to `true`. The label remains available to screen readers."
- "Sortable columns support three directions: none, ascending, and descending." (declarative: describes behavior, not an action to take)

Recurring section types should reuse the same template across every component page instead of drifting into per-page variants:

- Sizes: "Set `size` to control {noun} height. The default is `{value}`."
- States: "Reflect validation and interaction states."
- Disabled: "Set `disabled` to `true` to prevent {user }interaction."
- Skeleton: "Show a loading state with `{Component}Skeleton`." (or "Set `skeleton` to show a loading state." when there's no separate skeleton component)

Typical section order (follow sibling sections on that page):

1. `## Basic`
2. Core variants grouped (kinds, sizes)
3. Feature sections (slots, filtering, typeahead, portal, etc.)
4. Layout options (direction, layering with `Layer`)
5. Validation states (`invalid`, `warn`)
6. Interaction states (`disabled`, `readonly`)
7. Skeleton (if applicable)
8. Advanced / performance (virtualization, async)
9. Programmatic or reactive behavior last

Insert new sections in the logical group, and nest the variants above under `## Group` + `###` children (see Headings and grouping). Do not append every example to the end if it belongs with related variants. Reactive / `bind:`-driven examples belong high up near the basics; loading / skeleton examples go last.

Inline vs framed:

- Inline: simple, static demos directly in the `.svx` file
- `<FileSource src="/framed/Component/Example" />`: reactive state, `bind:this`, events, async behavior, or demos too large for inline. Add the Svelte file under `docs/src/pages/framed/{Component}/` (PascalCase name, for example `ReactiveComboBox.svelte`)

Use a framed example whenever the demo contains script logic (state, handlers, async work). The full source shows in the docs, so keep it readable:

- Do not add JSDoc to framed examples. They are usage demos, not the public API. Save typed JSDoc for the components under `src/`.
- Add short, concise, high-value code comments only where they earn their place, such as flagging that demo code is not production guidance: `// For demo purposes only: NEVER hardcode secrets in production.` Skip comments that restate the code.
- Simulate API or async behavior with `await new Promise((resolve) => setTimeout(resolve, 300))` rather than wiring up a real network call. See [`CopyInputAsync.svelte`](docs/src/pages/framed/CopyInput/CopyInputAsync.svelte).
- Wrap code that only works around the docs site itself (such as its router intercepting `history`) in `// docs-only:start` and `// docs-only:end` (or `<!-- docs-only:start -->` / `<!-- docs-only:end -->` in markup). The code still runs in the frame but is stripped from the displayed source and the generated Markdown docs. See [`TabsQueryString.svelte`](docs/src/pages/framed/Tabs/TabsQueryString.svelte).

Other patterns:

- No admonitions. Fold accessibility notes and non-obvious caveats into the relevant example's prose. Do not use `> [!NOTE]` / `> [!WARNING]` / `> [!TIP]` / `> [!CAUTION]` blocks.
- Keyboard keys in prose: use `<DocKbd label="Enter" />` for named keys (`Enter`, `Escape`, `Shift`, `Ctrl`, `Space`, etc.). mdsvex auto-imports `DocKbd`; do not add a manual import. Do not use backticks (`Escape`), raw `<kbd>`, or bold (`**Enter**`). For combinations, use one component per key: `<DocKbd label="⌘" />+<DocKbd label="C" />`. Keep collective phrases as plain text ("arrow keys", "modifier keys", "keyboard navigation"). Prop values and UI copy inside component examples are out of scope (e.g. `placeholder="Enter user name..."`, `shortcutText="⌘C"`).
- Cross-links to related components: `[Modal](/components/Modal#modal-with-dropdowns)`
- Use realistic, enterprise-flavored mock data instead of generic placeholders. Avoid `Tab label 1` / `Option 2` / `Item 3`, fruit or frontend-framework lists (Apple/Banana/Cherry, Angular/React/Vue), `foo`/`bar`, and lorem ipsum. Use something concrete instead, like a deployment region, an account plan tier, a service name, an incident summary, or a workspace setting. Reuse the same sample data shapes as neighboring examples on that page, and check whether an existing theme from a sibling section already fits before inventing a new one.
  - Exception: pure layout/mechanics demos (`Stack`, `Grid`, `Box`, `AspectRatio`, breakpoint/gap/offset demos) where the label is the thing being demonstrated, such as a prop value, a breakpoint name, or an ordinal position. Abstract content (`Item 1`, `16:9`, `Offset 3`) is correct there. Forcing a business narrative onto it only obscures the mechanic. Don't rename a label that documents its own prop value (`direction="top" tooltipText="Top"`).
  - When a long string is needed to demonstrate overflow or truncation, make the content itself realistic (a file path, a log line, an error message) instead of padding a short phrase with filler.
- Don't hardcode layout styles in examples: no `style="margin-…"`, `max-width` wrappers, or `display: flex` / `grid` divs with a `gap`, and no `style` on a component to space it. Compose with library components instead, so the example shows how to build the layout with the library:
  - [`Stack`](docs/src/pages/framed/Dropdown/MultipleDropdown.svelte) for stacking and gaps (`gap`, `orientation="horizontal"`).
  - [`Box`](docs/src/pages/components/Box.svx) for widths, margins, padding and borders (`maxWidth`, `marginTop`, `padding`).
  - The component's own props when it has them, such as `noMargin` or `fullWidth`.

  Reserve inline styles for what these can't express, such as setting a CSS custom property the example is about. Before committing, run `grep -n 'style=' <file>.svx` on the lines you added.
- Add `data-outline` to an element when an outline makes the demo clearer, for example marking a right-click target in a context menu. The framed module provides the global style; see `<p data-outline …>` in [`ContextMenuTarget.svelte`](docs/src/pages/framed/ContextMenu/ContextMenuTarget.svelte).

#### Writing style

Follow [Carbon's writing style](https://carbondesignsystem.com/guidelines/content/writing-style/): direct, concise, present tense. Section descriptions explain what a prop does and when to use it, not what the component "allows."

#### Prose and inline code

Inline code in `.svx` prose is styled as Carbon code tokens. Keep backticks sparse so section intros stay readable.

**Split of responsibilities:**

- JSDoc + auto-generated API tables = exhaustive identifier reference
- `.svx` prose = readable explanation; examples = copy-paste usage

**Backtick when essential** (one primary target per paragraph):

- The prop/API being configured in that section
- Literal values the reader copies (`true`, `"compact"`)
- Methods/utilities (`TreeView.expandAll()`)
- Svelte/HTML tokens (`let:node`, `bind:checked`, `role="treeitem"`)

**Use plain language instead:**

- Data shape in words ("unique id and display text") rather than listing `id`, `text`, `disabled` in one sentence
- Drop filler: "the prop", "the method" (prefer "Set `activeId`" not "Set the `activeId` prop")
- Cross-link sibling sections by name instead of inline prop lists

**Do not edit in prose-only passes:**

- Live Svelte examples, `<FileSource />`, fenced code blocks, reference tables (events/gestures/slot vars)

#### SVX gotchas

In `.svx` files, markdown prose is compiled as Svelte. **Bare `{ ... }` in prose is parsed as JavaScript**, not displayed text.

| Bad (runtime error) | Good |
| --- | --- |
| `` `event.detail` as { key, direction } `` | `` `event.detail` shaped like `{ key, direction }` `` |
| `receives (a, b, { key, ascending })` | `` receives `(a, b, { key, ascending })` `` |

Always wrap object literals and expressions in backticks, or rephrase without braces. See [`DataTable.svx`](docs/src/pages/components/DataTable.svx) sort section for a real incident.

**Don't start a wrapped prose line with a component tag.** mdsvex ends the paragraph at a line that opens with a tag such as `<DocKbd>`, and the rest loses Markdown parsing, so its backticks render literally. Keep the preceding word on the tag's line:

```md
<!-- Bad -->
Tab to the chevron, then press
<DocKbd label="Enter" /> to toggle `expanded`.

<!-- Good -->
Tab to the chevron, then
press <DocKbd label="Enter" /> to toggle `expanded`.
```

| Avoid | Prefer |
| --- | --- |
| Trivializers: "easy", "easily", "makes it easier to", "for performance reasons" | State the behavior directly |
| Latin abbreviations: `e.g.`, `i.e.` | "for example", "that is" (or rephrase without) |
| Indirect phrasing: "allows you to", "allowing you to", "allows for" | Direct imperative: "Set `…` to …", "Use `…` to …" |
| Filler tails that restate the obvious: "This provides more visual emphasis.", "This prevents user interaction." | Cut unless it adds when-to-use guidance |
| Passive or future tense in intros | Present tense, active voice |
| Varied `hideLabel` / `hideLegend` wording | Standard boilerplate (below) |
| Listing every prop in backticks in one intro sentence | Plain-language data shape; one configuring prop backtick per paragraph |
| `` `selectedIds` tracks a single id` `` (implementation narration) | "Only one node is selected at a time" |
| Prop laundry lists in intros | Links to sibling sections ([TreeView Basic](docs/src/pages/components/TreeView.svx) pattern) |

Standard boilerplate for hidden labels (copy verbatim):

> Hide the label visually by setting `hideLabel` to `true`. The label remains available to screen readers.

Use `hideLegend` analogously for legend-hiding props.

Before / after examples:

```
# Before
Create a basic tree view using the `nodes` prop. Each node requires a unique `id` and `text`, with optional properties for `disabled`, `icon`, and child `nodes`.

# After
Create a basic tree view using the `nodes` prop. Each node needs a unique id and display text; icons, disabled state, and nested children are optional.
```

```
# Before
Set the initial active node using the `activeId` prop.

# After
Set the initial active node using `activeId`.
```

```
# Before
Set openOnClear to true to allow users to immediately see all available items.

# After
Set `openOnClear` to `true` to reopen the dropdown menu after clearing the selection.
This lets users immediately browse all available items without clicking the input again.
```

```
# Before
For async (e.g., server-side) filtering, bind to value…

# After
For async (for example, server-side) filtering, bind to `value`…
```

```
# Before
Virtualization allows you to render large lists efficiently for performance reasons.

# After
Virtualization renders only the items currently visible in the viewport, improving performance for large lists.
```

```
# Before
The menu closes from the trigger, the `Escape` key, or an outside click.

# After
The menu closes from the trigger, <DocKbd label="Escape" />, or an outside click.
```

#### New component checklist

1. Export from `src/index.js`
2. JSDoc all public API → `bun build:docs`
3. Create `docs/src/pages/components/{Component}.svx` modeled on a similar existing component: a frontmatter `description:`, then `## Basic` first (see [Example conventions](#example-conventions) for structure and grouping). Follow the prose conventions in [Prose and inline code](#prose-and-inline-code).
4. Add framed examples only where interactivity requires them
5. Add the page to a category in `docs/src/component-categories.ts` and its first version to `docs/src/component-since-versions.ts`
6. Preview with `cd docs && bun dev`
7. Add a catalog thumbnail at `thumbnails/{component-name}.svg` and its `carbon.yml` entry. CI runs `bun run thumbnails catalog`, which fails when either is missing. See [`thumbnails/README.md`](thumbnails/README.md) for the design principles and recipe
8. Add an aria-forwarding case in `tests/aria-forwarding/cases/`, or an exemption with the reason. `tests/aria-forwarding/coverage.test.ts` fails for an interactive component that has neither

### Custom styles (patching Carbon v10)

The library vendors the Carbon v10 SCSS (inlined from `carbon-components@10.58.15` under [`css/vendor/carbon-components/`](css/vendor/carbon-components/README.md); it is no longer an npm dependency, and `@import "carbon-components/..."` resolves there via the build's sass load path). When a style fix or feature from newer Carbon is missing from the v10 SCSS, or when the Svelte components need a tweak Carbon does not provide, put the patch in a hand-authored SCSS partial under `css/`. These compile into the shipped theme stylesheets. Use them instead of per-component `<style>` blocks for anything that should be themeable.

#### Anatomy of a partial

Each patch is a leading-underscore partial (for example [`css/_dropdown.scss`](css/_dropdown.scss), [`css/_meter.scss`](css/_meter.scss)) that imports the Carbon variables and mixins it uses, defines a single named mixin, and emits it through Carbon's `exports()` import-once guard:

```scss
@import "carbon-components/scss/globals/scss/vars";
@import "carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/import-once/import-once";

/// Reserve room for `Dropdown`'s clear button next to the chevron.
/// @access private
/// @group components
@mixin dropdown-clearable {
  .#{$prefix}--list-box__field--clearable {
    padding-right: to-rem(72px);
  }
}

@include exports("dropdown-clearable") {
  @include dropdown-clearable;
}
```

The `exports()` key must be unique across the whole build, **including the vendored Carbon keys**. Carbon already claims `exports("dropdown")`, `exports("tooltip")`, `exports("code-snippet")`, and so on; a partial that reuses one of those keys compiles cleanly and emits nothing. That is why `css/_dropdown.scss` exports `dropdown-clearable` and `css/_tooltip.scss` exports `tooltip-portal`. Name the mixin after the key.

Non-emitting helpers (Sass maps or mixins other partials include, such as [`css/_spacing-scale.scss`](css/_spacing-scale.scss) and the fluid form declarations in [`css/_fluid-shared.scss`](css/_fluid-shared.scss), which every new fluid variant should reuse) skip the mixin and `exports()` wrapper. `css/_ui-shell-classic.scss` is the one emitting exception: it is gated on `$ccs-theme-switching` instead.

#### Conventions

These apply to every hand-authored rule: the `css/_*.scss` partials and the blocks below a `// carbon-components-svelte patch` banner in the vendored tree. `tests/css/conventions.test.ts` scans both. Patch blocks are checked against `KNOWN_PATCH_VIOLATIONS`, an exact per-file count of what predates the check: lower a count when you fix one, never raise it. In-place `// ccs:` edits to upstream rules match the value style of the lines around them, and are checked for literal `.bx--`, hex, `:has()`, and repeated classes. Untouched upstream code keeps upstream's style.

Values:

- Sizes: `to-rem(Npx)` or a spacing token. Not Carbon's bare `rem()`, not a raw rem literal. Hairlines (`1px`/`2px` borders, outlines, and offsets) stay in `px`.
- Spacing tokens: `$carbon--spacing-01` … `-13`. Not the `$spacing-0N` aliases.
- Color: Carbon v11 theme tokens (`$layer`, `$field`, `$support-error`, …). Prefer the contextual tokens (`$layer`, `$field`, `$border-subtle`), so a surface follows the `Layer` it sits in. Read a numbered one (`$layer-01`) only where v11 pins the level, and list it in `PINNED` in `tests/css/layer.test.ts`. No hex, and no v10 names (`$ui-01`, `$text-01`): `all.css` no longer declares them, and `tests/css/v11-tokens.test.ts` fails on any that reach the CSS. In `all.css` tokens compile to `var(--cds-*)` strings, so Sass color functions (`mix()`, `lightness()`, `rgba($token, …)`) and unary minus (`-$token`) silently drop the rule or no-op.
- Give a `<button>` a `color` when no Carbon rule sets one. The browser's default is pure black or white, picked by the page's color scheme, not a theme token. It is a near miss in most themes (`#000` for `#161616`), so review misses it, and on a dark surface in a light page it fails contrast. HeaderSwitcher's trigger sat outside the rule that colors header actions and rendered black on the classic header at 1.3:1 ([#5120](https://github.com/carbon-design-system/carbon-components-svelte/pull/5120)).
- Type: `type-style("…")`.
- Motion: `$duration--*` with `motion(standard, productive)` and friends, never a literal `ms` or `cubic-bezier()`. Never `transition: all`: list the properties, and leave out `border-color`/`box-shadow`/`outline` when they double as the focus ring so the ring snaps instead of fading.
- `will-change`: only `transform` or `opacity`, the two properties the hint can promote to a compositor layer. Not on an element that is idle most of the time, and not on one whose running animation already promotes it (skeletons).
- No `!important`; `conventions.test.ts` rejects it outright. A consumer can only override one with another `!important`. See [Winning the cascade](#winning-the-cascade).
- Focus rings: `@include focus-outline("outline")` / `("invalid")`, not a hand-written `outline`.
- Set one spelling of a box property per rule. `width` and `inline-size` (likewise `top`/`inset-block-start`, `height`/`block-size`) share a cascade slot, so the earlier one is dead; `check:css:overrides` reports it.
- `z-index`: `z("floating")`, `z("dropdown")`, … for anything that floats over the page. A literal `1`/`-1` is fine for stacking inside the component's own box.
- Breakpoints: `@include carbon--breakpoint(md)`, not a literal `min-width`.
- Custom properties: `--cds-*` is reserved for Carbon theme tokens. Properties this library invents are `--ccs-*` (and Sass globals `$ccs-*`). A few older public hooks predate this rule (`--cds-scroll-gradient-color`, `--cds-popover-offset`, `--user-avatar-group-overlap`); do not add more. Before you invent a `--ccs-*` variable for a color, check whether v11 has a token for it (`--cds-status-red`, `--cds-content-switcher-background`); use the token if it does. A hook Carbon v11 itself defines keeps its v11 name (`--cds-link-text-color`, `--cds-grid-gutter`): read it with the theme token or v11's default as the fallback, and list it in `V11_HOOKS` in `tests/css/v11-tokens.test.ts`. Declare it only where v11 re-points it for a scope, such as the inverse link colors on `.bx--toggletip-content`, and list that scope in `HOOK_SCOPES` (and the hook in `REPOINTED_V11_HOOKS` in `tests/css/conventions.test.ts`). Anywhere else, a declaration shadows the value a consumer sets on an ancestor. Mode values derived from it are `--ccs-*`.

Selectors:

- Reference classes through `$prefix` (`.#{$prefix}--breadcrumb`), never a literal `.bx--…`.
- Scope every rule in a variant partial under that variant's wrapper (`.#{$prefix}--time-picker--fluid …`), including "hide by default" rules.
- State: follow the v10 base where one exists (`[data-invalid]`, `--warn` vs `--warning` differ per component upstream). For new components use modifier classes on the wrapper: `--invalid`, `--warning`, `--disabled`, `--readonly`, `--open`.
- When a rule applies only if _none_ of several states hold, have the component emit one marker class (`--neutral`) instead of chaining `:not()`.
- Do not pad specificity (repeated classes, `tag.class`, order-only `:not()`). If the rule you need to beat is in the vendored tree, edit it there. Repetition is tolerated only to preserve an existing cascade during a refactor, with a comment saying what it matches.
- Hover rules go in **one** `@media (any-hover: hover)` block per partial, at the end of the mixin. Lightning CSS only merges adjacent blocks, and `tests/css/media-query-grouping.test.ts` budgets the total. Keep any equal-specificity `:focus` rule after the block, or a hover `outline: none` will erase the ring. Two shapes stay outside the block: a suppressor that lists `X:hover` beside its own `X` to restate the resting style, and any hover rule that competes with a base hover rule the vendored tree leaves unguarded (most of them). Guarding only your half lets the base hover through on touch; guard both or neither.
- Use logical inline properties (`padding-inline-end`, `margin-inline-start`, `border-inline-start`) in new code. Override a side with the spelling the base rule uses: `margin-left: 0` does not undo `margin-inline-start` in RTL. Some older rules are still physical and do not flip yet: the notification color bar, Accordion titles, DataTable cell alignment, sortable header padding and expanded rows, StructuredList header cells, list markers, the ProgressBar fill, flexbox Grid offsets and Bleed.
- Put `left`/`right` through `@include ccs-inset-inline($start, $end)`, which adds a `[dir="rtl"]` twin. A twin matches any RTL ancestor, so it also matches inside a `dir="ltr"` region of an RTL page, where logical properties have turned back. Write each value in a twin as `ccs-dir($ltr, $rtl)`, which reads the nearest `dir` (`ccs-inset-inline` does this), or the region keeps its icons on the RTL side over LTR padding. Use `ccs-dir()` only in a twin. In a base rule on a page with no `dir`, both of its fallbacks apply at once, so two transforms cancel. Most pages set no `dir`, and a base `ccs-dir()` would have held every checked Toggle handle at the start ([#5190](https://github.com/carbon-design-system/carbon-components-svelte/pull/5190)). `tests/css/rtl-twins.test.ts` checks every twin, and that `ccs-dir()` appears only inside one. A box shadow's x offset and a `translateX` offset have no logical form: multiply them by `var(--ccs-inline-sign, 1)`, which is `-1` under `dir="rtl"`, as the ButtonSet dividers do. A twin there would outweigh every rule it ties. Flip every rule that sets the same side of an element, in every partial: a physical rule left behind lands on the wrong side in RTL. Check with `e2e/rtl.test.ts`, on a page with no `dir` as well as under `ltr` and `rtl`.
- `start` and `end` alignments of tooltips, Toggletip, OperationalTag, and Popover name inline sides, as in floating-ui, so they swap in RTL. `left`, `right`, and Popover's older names (`top-left`) stay physical. Where JavaScript places the content or picks its placement class, resolve the physical side when it opens with `physicalAlign` or `popoverPlacement` from [`inline-align.js`](src/utils/inline-align.js), and keep the CSS physical. Where only CSS places it, as for the icon tooltips, add a `[dir="rtl"]` twin. Check with the tooltip rows in `e2e/rtl.test.ts`.
- Code reads left to right in any language. CodeSnippet's code area (`bx--snippet-container`, inline `code`) sets `direction: ltr`, and only the buttons around it flip. Logical properties inside that area resolve against LTR, so a side that follows a button there is physical, with a `[dir="rtl"]` twin (see the multi-line `pre` padding in the code snippet styles).
- Mirror an icon in RTL when it points forward or back by meaning: previous and next, back, undo, a submenu caret, a link arrow. Add `@include ccs-mirror-rtl` to its rule, and pass the rule's own transform (`ccs-mirror-rtl(rotate(90deg))`) so the two compose. The mixin reads `--ccs-mirror-rtl`, which inherits from the nearest `dir`, so a `dir="ltr"` region turns it off. Leave alone icons with no direction or a fixed one: check marks, media controls, clocks, search, `Launch`, and chevrons that point up or down. Apps mirror their own icons with the `bx--icon--mirror-rtl` class.
- Avoid syntax Lightning CSS downlevels by duplicating the rule: `inset-inline-start`/`-end`, `border-start-start-radius` and its siblings (each expands to `:lang()` RTL twins, about 900 bytes per declaration), a selector list inside `:not()` (write `:not(.a):not(.b)`, or better a marker class), and `:is()`/`:where()`. `tests/css/downlevel.test.ts` scans the vendored tree too.
- Do not use `:has()`. It exceeds the Svelte 5 browserslist baseline (Firefox 83/Safari 14) the CSS targets, and Lightning CSS cannot prefix or polyfill it. Mark parents explicitly instead (for example a `hasLeftIcon` prop emitting a marker class). Same rule for any selector newer than that baseline, since one unknown selector invalidates the whole rule. Newer _properties_ that degrade gracefully (`text-wrap: pretty`) are fine.
  - One exception: an enhancement no markup can carry may use `:has()` inside `@supports selector(:has(*))`, if the layout without it still works. The server writes a parent's classes before its children render, so a parent can't mark what a child holds until the browser runs. Sized container tabs use this to be tall from the first paint when a later tab has a secondary label. Mark everything else explicitly, even inside the block. `conventions.test.ts` allows `:has()` only there.

Naming:

- Component variants are BEM modifiers (`bx--meter--sm`). Sizes use `--xs`/`--sm`/`--md`/`--lg`/`--xl`; a bare number (`--20`) only when the prop itself is a pixel size.
- Token utilities are `bx--{block}-{property}-{step}` (`bx--box-p-5`, `bx--type-mono`). Docs, props and SCSS all use the same Carbon v11 token names (`layer-01` is `$layer-01`). Share spacing scale values through [`css/_spacing-scale.scss`](css/_spacing-scale.scss).

Document the mixin with SassDoc (`/// @access private`, `/// @group components`) and use `//` for everything else. Use double quotes. When a partial overrides a single vendored component, say in its header why it could not live in the vendored file.

#### Winning the cascade

When your rule loses, try these in order:

1. **Stop the competing rule from matching.** If a hover or state rule overrides the state you are styling, exclude that state there (`.#{$prefix}--select:not(.#{$prefix}--select--readonly)`) instead of out-weighing it. The fluid TimePicker's readonly divider works this way.
2. **Tie, then win on order.** Adding the variant wrapper you already scope under (`.#{$prefix}--time-picker--fluid`) often matches the rule you need to beat. Place yours after it in the same partial.
3. **Edit the vendored rule** when that is where the competitor lives.

Count specificity before choosing: `:not(x)`, `:nth-child()`, and `:hover` each count as a class. A positional selector like `> *:nth-child(2):not(:last-child) .x::before` weighs `0,4,1`, though it reads as one class.

A `forced-colors: active` rule competes with every component rule that sets the same property. Before you add one, count the specificity of the state rules it must beat (selected, disabled, hover), then tie and win on order. When you change a state, add its row to `e2e/forced-colors.test.ts`. A forced rule that loses fails with no error.

Not acceptable fixes:

| Don't | Why |
| --- | --- |
| `!important` | Consumers cannot override it. |
| Repeated classes or `tag.class` | Padding; see above. |
| `:where()` to lower the competitor | Lightning CSS duplicates the rule (`downlevel.test.ts`). |
| `var(--ccs-x, #{$token})` to route around the cascade | The precompiled theme sheets compile `$token` to a hex, so this ships a `var()` with a literal fallback, plus a private hook nobody documented. |

The `not-chains` budget targets state chains that a marker class could replace. A structural `:not(:last-child)` can be written `:nth-last-child(n + 2)`: same match, same weight. Do not drop a `:not()` because a combinator already implies it. Removing it lowers that selector's weight against its siblings in the list, and `check:css` reports the resulting cascade flips.

#### Where a patch lives

Component-scoped patches sit at the end of the vendored component file itself (for example `css/vendor/carbon-components/scss/components/accordion/_accordion.scss`), below a `// carbon-components-svelte patch` banner. See the [vendored tree's README](css/vendor/carbon-components/README.md). Above the first banner, `conventions.test.ts` reads only the `// ccs:` lines, so a new rule or mixin placed higher escapes most checks. `// ccs:` marks an in-place edit to an upstream rule, not a new rule. The end of the file is only safe when the patch does not depend on emitting after a _later_ component's equal-specificity rules; patches that must win such source-order ties (and any partial with no single component home) stay as `css/_*.scss` partials instead.

#### Registering a partial

A `css/_*.scss` partial ships only once [`css/_carbon-styles.scss`](css/_carbon-styles.scss) imports it. That manifest is shared by all six theme entry files (`all`, `white`, `g10`, `g80`, `g90`, `g100`), so there is nothing to add to the entries themselves.

Emission order is load-bearing: equal-specificity ties resolve by source order. Slot a partial that extends one Carbon component right after that component's import; everything else is appended to the post-base block. Do not reorder that block: its order is historical but load-bearing, and the known dependencies are listed in its header. If your rule has to come after a specific neighbour to win, add it to that list.

#### Guards

| Command | Use |
| --- | --- |
| `bun run check:css --base <ref>` | Compiled-rule cascade diff against a ref (`crassus diff`). Run for any refactor that should not change output. The base is built in a temporary worktree and cached by commit; `--no-cache` rebuilds it. Add `--confirm` to render each flagged flip in Chrome and drop the ones no fixture renders. |
| `bun run check:css:size [--base <ref>]` | How much the branch grows `all.css` and `white.css` (minified and gzipped) against its merge base with the ref (default `origin/master`). Fails over the per-PR limit; see [Size growth](#size-growth). |
| `bun run check:css:compare [--base <ref>]` | Ground truth for a CSS change (`crassus compare`): today's fixtures with the stylesheet at the ref and now, read only where a changed rule can reach. Fails on visible changes and on properties that stop following a `--cds-*` token. `--report <dir>` writes change cards (crops, the winning rule at its `.scss` line, a suggested fix) as `index.html`, `report.md` and `report.json`. Use it to verify a CSS-only change instead of writing a test. |
| `bun run check:css:bisect <from>..<to>` | The commits in a range that changed what the fixtures render (`crassus bisect`). Use it to find which commit of a refactor caused a card. |
| `bun run check:css:overrides` | Declarations that can never win (`crassus dead`), with their `.scss` line. Also runs in CI as `tests/css/overrides.test.ts`. |
| `bun run check:css:tokens` | Which `--cds-*` tokens drive which properties, the unused ones, and colors set as literals or left to the user agent (`crassus tokens`). Evidence, not proof. |
| `bun run check:css:coverage` | Which declarations decide a value the fixtures render (`crassus coverage`), per file and component. Low coverage means a fixture is missing, not that the CSS is dead. |
| `bun run check:css:snapshot <dir>` | Computed styles of every e2e fixture (`crassus capture`), per theme, viewport and forced `:hover`/`:focus`/`:active` state. Add `--base <ref>` to capture a ref in a temporary worktree. |
| `bun run check:css:snapshot:diff <base> <head>` | Compares two captures (`crassus snapshot-diff`), grouped by `property: before -> after`. Prefer `check:css:compare`, which keeps no snapshots. |
| `bun run check:css:usage` | Browser-measured "never wins" worklist (`crassus usage`), written to `.crassus/usage/report.md`. Evidence, not proof. |
| `bun run check:css:doctor` | Checks Chrome, free disk, load and the fixture setup before a long browser run (`crassus doctor`). |

Tests in `tests/css/` that budget the compiled sheet, each with the number to lower when you improve it:

| Test | Holds |
| --- | --- |
| `size-budget.test.ts` | A floor under each sheet, so a compile that drops a module fails, and a ceiling on the opt-in `prose.css`. `all.css` and `white.css` growth is limited per PR instead; see [Size growth](#size-growth). |
| `not-chains.test.ts` | Selectors with three or more `:not()`. |
| `media-query-grouping.test.ts` | Number of `(any-hover: hover)` blocks. |
| `unrendered-classes.test.ts` | Styled `bx--*` classes nothing in `src/` renders. |
| `conventions.test.ts` | Source rules, with exact baselines for what predates them. |

These numbers are counts, so two branches that each raise 67 to 68 merge cleanly to a wrong 68. After a rebase over a branch that changed one, rebuild and set it to the measured count. Don't add your change on top.

Compile through `compileEntry()` from `tests/css/compile.ts`, not `compileAsync` directly. It caches per source hash so a dozen workers do not each compile the same sheet. A PR that touches `css/**` also gets two jobs. `css-size` runs `check:css:size` and fails over the limit in [Size growth](#size-growth). `css-cascade` shows the rule delta against the base branch in its summary and annotates each cascade flip at its `.scss` line; it is informational and never blocks.

These come from [crassus](https://github.com/metonym/crassus), configured in `crassus.config.ts`. `check:css` and `check:css:overrides` compile `css/all.scss` and `css/white.scss` with a source map; `dead --fix` also proves its edits against the other themes. The browser checks build the e2e fixtures statically into `.crassus/fixtures` and load each page in `white` and `g100` at 320, 1280 and 1600 px wide, so every breakpoint rule applies somewhere. Narrow a run with `--only <fixture>`, `--themes white --viewport 1280x900` or `--no-states`. They use Playwright's `chrome-headless-shell` when it's installed and half the cores, dropping to one tab while the machine is busy. `--base` builds only `css/` (the config's `inputs`) at that ref and caches each build by that tree, so running it again, or against another commit with the same `css/`, takes under a second. `crassus --help` lists the options; `--format json` gives the same report as data.

For an intended visual change, `crassus approve <id> --report <dir>` records its card in `crassus.approved.json`; `check:css:compare` then fails only on visible cards that file lacks. `crassus explain <id>`, `repro <id>`, `verify <id>` and `reduce <id>` (the fewest declaration edits that make the card) take the same `--report <dir>`.

#### Size growth

One PR may grow `all.css` or `white.css` by up to 25 kB minified and 3 kB gzipped, measured against its merge base. The biggest feature PR so far, the CSS Grid module, adds 18.7 kB and 2.1 kB. Undoing one pruning commit (the legacy Carbon selectors) adds 34.1 kB and 3.3 kB, and a re-synced vendored file far more. There is no fixed ceiling, so the limit does not fill up as features land.

When a failure is a bulk regression, fix it. When the growth is intended, add a `CSS-Size-Growth` trailer to a commit message in the PR. Give the new limit for each sheet and, after a semicolon, the reason:

```
CSS-Size-Growth: 6 kB gzip, 40 kB min; adds the v11 chart styles to all.css
```

The failing run prints a trailer with the measured amounts. The trailer applies only to the commits between the merge base and the branch head, so it needs no clean-up after merge. `git log --grep CSS-Size-Growth` lists every PR that used one. A trailer with no amount or no reason fails the check.

#### What belongs in tests/css

`tests/css/` holds checks that apply to the whole sheet: a rule about how every partial is written or how the compiled output is shaped. A fix or feature that changes one component's CSS does not get a test there. Confirm it with `check:css:compare` (approve the intended cards) or the Playwright computed-style recipe below.

| Do | Why |
| --- | --- |
| Add a test when you introduce a rule every partial must follow (no `:has()`, named transitions, budgeted `:not()` chains) | Nobody can check a whole-sheet property by eye, and a vendored re-sync can break it anywhere. |
| Extend an existing invariant (`conventions`, `overrides`, `unrendered-*`) before writing a new file | One scan over the sheet is cheaper than another compile-and-find. |
| Cover forced-colors and `prefers-contrast` fixes with a row in `e2e/forced-colors.test.ts`, not here | Chromium reports forced values from `getComputedStyle`, so the row checks what the user sees, hover and focus cascades included. One fixture page keeps it to a few seconds. |
| Don't assert that a selector carries the declaration you just added | It fails only if someone deletes that line, breaks on harmless selector refactors, and says nothing about whether the rule wins the cascade (`overrides.test.ts` checks that for every rule). |
| Don't raise a size limit to fit a feature | `css-size` limits each PR's growth. A PR that needs more says why in a `CSS-Size-Growth` trailer, which reviewers see. Raise `prose.css`'s ceiling only with the same kind of reason. |

When `check:css:overrides` reports a pair, work out which of the two values is the intended one before deleting anything. The checker proves the earlier declaration never wins; it does not know whether the later one is right. Deleting the flagged half of a `right: $carbon--spacing-03` / `right: auto` pair is how the fluid `CopyInput` button lost its offset.

Delete a selector family only after confirming no component in `src/` renders the class, including classes built from interpolated strings. Then add its pattern to `tests/css/unrendered-selectors.test.ts` so a vendored re-sync cannot bring it back, and drop its class from `KNOWN_UNRENDERED` in `tests/css/unrendered-classes.test.ts`.

jsdom does not resolve `::before`/`::after` or `:hover` cascades. To confirm one, load the built `css/all.css` into Playwright with `page.setContent(...)` and a minimal copy of the component markup, `page.hover()` the trigger, and read `getComputedStyle(el, "::before")`. Record the values before your change and compare them after.

#### Rebuild

**After editing any `.scss` under `css/`, you must rebuild CSS locally:**

```sh
bun build:css
# or, while iterating:
bun build:css:watch
```

The default build compiles only `css/all.scss` (docs, e2e, and `Theme` switching). Static sheets (`white`, `g10`, `g80`, `g90`, `g100`) are produced by `bun build:css:themes`, which release uses so the npm package still ships every entry.

The compiled `css/*.css` are **not** committed (they are gitignored) — but they are still required at runtime, so without this step your local docs site and e2e tests will use stale (or missing) styles. `bun setup` runs `build:css` once on a fresh clone, and CI/release run it on demand; neither helps an in-progress local edit.

This compiles Sass (compressed) and writes `css/*.css` plus `css/css.d.ts`. Lightning CSS then adds vendor prefixes for the supported browsers and minifies, locally as in CI, so local pages and e2e runs get the CSS that ships. Set `BUILD_CSS_MINIFY=0` for readable output. Commit only the `.scss` source — never the generated `*.css`. The small `css/css.d.ts` (module declarations) **is** committed, so type-checks resolve the CSS imports without a build; commit it too if adding or removing a theme entry changes it.

The prebundled CSS targets the [Svelte 5 browser support](https://svelte.dev/docs/svelte/browser-support) baseline (Firefox 83/Safari 14), not older browsers. Matching that baseline lets Lightning CSS drop legacy fallbacks. Author SCSS to that baseline; see the `:has()` note in [Conventions](#conventions).

### Checks

See [Best practices](#best-practices) for scoping. Run checks against what you changed. Full-repo runs are slow and surface unrelated failures.

The shortest loop, in order:

| Step | Command | Cost |
| --- | --- | --- |
| Format and lint what you touched | `bun fmt <paths> && bunx biome check --write <paths>` | Seconds |
| Run the unit tests your branch can reach | `bun run test:changed` | Plans in under a second, then runs Vitest on the selection |
| Type-check tests after an API change | `bun build:docs && bun test:types` | `build:docs` refreshes the generated `.d.ts` |
| Run the E2E tests your branch can reach | `bun run test:changed:e2e` | Chromium only, as in CI. About 7 s more to plan when `css/` changed |
| See what CI will run | `bun run test:plan` | Same plan as CI, with the reason for any full run. `bunx bivium why <test>` shows why a test was picked |

Don't run `bun run test` or `bun run test:e2e` to check a change. CI runs the same selection on the PR, and master runs everything after a merge.

`bun fmt` formats JavaScript, TypeScript, JSON, HTML and Svelte, with the options in [`bunfig.toml`](bunfig.toml). Sass, Markdown and YAML are left as written. Biome lints. Scope both to what you touched, with the same `<paths>`, `--staged` or `--changed` (Bun's `--changed` takes no `--since`):

```sh
# Specific paths — always lints the current working tree
bunx biome check --write src/DataTable

# Staged files only (what a commit would include) — also `bun run lint:changed`
bunx biome check --write --staged

# Files committed on this branch relative to master (CI-style, not aliased in package.json)
bunx biome check --write --changed --since=master
```

Pick the form that matches your state. `--changed` and `--staged` resolve their file
list from git, so each sees a different slice:

- Path scoping (`src/DataTable`) lints whatever is on disk now, committed or not. Use it
  while editing.
- `--staged` lints the git index. Run it after `git add`. `bun run lint:changed` is an
  alias for this — despite the name, it does **not** use `--changed`.
- `--changed` diffs *committed* changes against the default branch and, per Biome, is
  "intended for CI." It ignores staged and unstaged edits entirely, so on a long-lived
  branch it can also pull in every file changed since the branch diverged from master —
  not just your latest commit. Reach for it deliberately (e.g. auditing a whole branch
  before a PR), not as a pre-commit habit.

`bun run lint` runs `bun fmt` and Biome over the entire repository. Reserve it for broad sweeps.

For unit tests, match a pattern against test file paths instead of running the whole suite:

```sh
bun run test DataTable
```

The full suite (`bun run test`) is slow and can hit unrelated flaky UIShell focus failures. Scope to the component you touched.

A full run can be killed for lack of memory, with exit code 137. Pass `--maxWorkers=4` to limit the workers.

`bun run test:changed` runs every unit test your branch can affect, including uncommitted edits. CI uses the same selection on pull requests for unit and E2E tests. The selection comes from [bivium](https://github.com/metonym/bivium), configured in [`bivium.config.ts`](bivium.config.ts). It follows imports, so a `Button` change also runs the `Modal` tests that render a `Button`. `bun run test:plan` prints the plan without running it.

For the E2E selection (`test:changed:e2e`, `test:plan`, and CI), a `css/` change compiles the stylesheets E2E pages load at the merge base and on your branch, then selects only the E2E tests whose pages render a changed rule ([`css-narrower.ts`](scripts/lib/css-narrower.ts) over [`css-delta.ts`](scripts/lib/css-delta.ts)). A plain `bun run test:changed` skips that compile, since it runs unit tests only. crassus's `compileAt` caches each compile in `node_modules/.cache/crassus` by `css/` tree, so planning again after a commit is instant. It finds those pages by the classes a rule requires, so spell class names in source: literally (`"bx--tag--red"`) or as a prefix before an interpolation (`bx--tag--{type}`, `` `bx--btn--${kind}` ``). A rule that requires no class (`:root`, a theme token, `@keyframes`) or only classes no source spells (flatpickr's) runs every E2E test.

Types and E2E:

- `bun test:src-types` type-checks `src/` (uses `tsconfig.types.json`)
- `bun test:src-svelte` runs `svelte-check` compiler diagnostics on `src/` (a11y, unused CSS)
- `bun test:src-svelte-types` type-checks the component scripts in `src/` against a per-component error baseline (see [Component script types](#component-script-types))
- `bun test:types` runs `svelte-check` on `*.svelte` and `.ts` files in `tests/`
- `bunx playwright test --grep "Breakpoint"` runs a focused E2E pattern (see [E2E testing](#e2e-testing-with-playwright)); `bun run test:e2e` runs the full E2E suite

Three process traps:

- Read the exit code, not the tail. `bun run lint:changed | tail -1` prints "No fixes applied" and exits 0 even when Biome reported errors above it. Gate commits on the checks themselves: `bunx biome check <paths> && bun run test:types && git commit ...`.
- `bun test:types` reporting that a new prop or event "does not exist" usually means the generated `.d.ts` is stale, not that the code is wrong. Run `bun build:docs` first. This bites after a rebase as well as after an API change.
- Before calling a failure flaky, rerun it once and compare. The same assertion failing with the same value is deterministic, even if the file passes alone; run it together with the file before it to reproduce the order.

Other runs that pass in CI but fail locally are stale local state too:

| Symptom | Fix |
| --- | --- |
| Biome: "configuration schema version does not match", after a rebase | `bun install` |
| CSS tests time out at exactly 30 s or 60 s | A killed run left a lock. With no test running, remove `node_modules/.cache/ccs-css-tests/*.lock` |
| Local E2E runs another checkout's code, or can't find a fixture | Another checkout's server holds port 4173, and Playwright reuses it. Check `lsof -iTCP:4173 -sTCP:LISTEN` |
| Svelte 3/4 tests run against Svelte 5 | Install each harness: `cd tests-svelte3 && bun install`, and the same in `tests-svelte4` |
| A test that globs `src/**/*.svelte`, such as `ssr-smoke`, misses a component you just added | Vitest's cache is stale. Delete `node_modules/.vitest-cache` |

## Testing

### Unit tests

Unit tests live in `tests/` and use Vitest with `@testing-library/svelte`. See [Checks](#checks) for scoped runs.

#### Layout

```
tests/
  ComponentName/
    ComponentName.test.ts              # assertions
    ComponentName.test.svelte          # default fixture
    ComponentName.custom.test.svelte   # variant fixtures as needed
    helpers.ts                         # helpers shared by this folder's tests
  utils/
    get-form.ts                        # helpers shared across components
```

Mirror `src/` component folders. Put complex setups in `*.test.svelte`, not inline in the `.ts` file.

A helper used by one test file stays in that file. Once a second file in the same folder needs it, move it to that folder's `helpers.ts`. Once a second component needs it, move it to `tests/utils/` as a kebab-case file with a named `function` export.

#### Imports

In `.test.svelte` fixtures, import the component under test directly, not from the barrel:

```svelte
<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
</script>
```

Avoid `import { ComboBox } from "carbon-components-svelte"` in fixtures. Direct paths skip transforming the entire [`src/index.js`](src/index.js) barrel and are faster under Vitest. The alias in [`vite.config.ts`](vite.config.ts) resolves `carbon-components-svelte` to `src/`.

In `.test.ts` files, import types from the direct path and render via the fixture:

```ts
import type ComboBoxComponent from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBox from "./ComboBox.test.svelte";
```

Import shared utilities (for example exported helpers) from the component file or [`src/utils/`](src/utils/) as appropriate.

#### Style

- Write cases with `it(...)`, not `test(...)`. `describe`, `it`, `expect`, `vi`, `assert`, and `expectTypeOf` are globals; do not import them from `vitest`.
- Start a test file that never touches the DOM (pure utils, CSS compile checks, scripts) with `// @vitest-environment node`. Creating a jsdom environment is the largest fixed cost per file, and setup skips the DOM stubs when there is no `document`. Leave the pragma off if the file needs `Element`, `KeyboardEvent`, `localStorage`, or a rendered component, even indirectly.
- Keep imports, `vi.mock` paths, and `page.goto` URLs as string literals. CI picks tests by reading them with bivium, and a computed path makes the test run on every pull request.
- A test that reads files from disk (`node:fs`) must list them in a `// @depends-on <glob> [glob…]` comment, for example `// @depends-on css/**`. Without it the test runs on every pull request, and `bivium check` in `static-checks` fails. `bunx bivium check` lists each unreadable file with a fix.
- A file that only reads other files as text, not what they import, lists them in `// @reads <glob>` instead, so a change to their imports does not select it. A file that reads only what its caller already reaches, such as `e2e/helpers/host.ts` reading the fixture entry of the URL a test opens, is listed in `hermetic` in `bivium.config.ts` instead, so one fixture change doesn't select every E2E test. A file whose `import.meta.glob` is a lookup table, with each caller naming the entry it loads, marks it `// @glob-registry` (`e2e/fixtures/host.ts`). Keep `goto(` out of e2e comments: the selector reads it as a navigation.
- A `@depends-on`, `@reads` or `import.meta.glob` glob must reach files the selector reads. One that matches nothing, or files it ignores (`docs/**`), fails `bivium check`, since a change to them would never select the file. List an intended one under `deadGlobs` in `bivium.config.ts`, with the reason.
- Narrow types with an assertion, not a cast. Write `assert(input instanceof HTMLInputElement)` instead of `as HTMLInputElement`. The global `assert` fails the test with a clear message when the element is wrong, and TypeScript narrows the variable after it. Use `assert(el)` for a nullable lookup. Do not use `expect.assert` or non-null `!`.
- Skip the narrowing when a jest-dom matcher does the job. `expect(input).toHaveValue("a")`, `toBeChecked()`, and `toHaveFocus()` accept any element, so reading `.value` or `.checked` through a cast is rarely needed.
- Type `querySelector` through its generic: `container.querySelector<HTMLInputElement>("input")`, then `assert(input)`.
- Reserve `as unknown as X` for partial mocks of browser objects (`DOMRect`, `ResizeObserver`, a flatpickr `Instance`). Wrap a repeated one in a typed helper, as [`flatpickr-instance.ts`](tests/DatePicker/flatpickr-instance.ts) does.
- Spy on an instance, not a prototype. The config sets `clearMocks`, which resets call counts between tests but does not restore originals, so `vi.spyOn(HTMLInputElement.prototype, "select")` stays installed for the rest of the file. Narrow the element and spy on it, or call `mockRestore()` when a prototype or global spy is unavoidable.

Check [`tests/utils/`](tests/utils/) before writing a helper:

| Helper | Use |
| --- | --- |
| [`user`](tests/utils/user.ts) | Clicks and keyboard input |
| [`getForm`](tests/utils/get-form.ts) | The fixture's `<form data-testid="form">`, narrowed |
| [`getBoundText`](tests/utils/get-bound-text.ts) | Text of the `data-testid="bound"` element a `*.form.test.svelte` fixture renders |
| [`flushFormReset`](tests/utils/flush-form-reset.ts) | Wait for `use:formReset` and the bound values it writes |
| [`flushMacrotask`](tests/utils/flush-macrotask.ts) | Wait one macrotask for a timer or deferred listener; replaces `await new Promise((resolve) => setTimeout(resolve))` |
| [`netListenerCalls`](tests/utils/net-listener-calls.ts) | Outstanding `window` listener count from an add/remove spy pair |
| [`expectInlineStyle`](tests/utils/inline-style.ts) | Authored inline styles with relative units, which `toHaveStyle` resolves to `px` |
| [`expectNoContent`](tests/utils/no-content.ts) | No child elements and no visible text. Use it instead of `toBeEmptyDOMElement`, which fails on the whitespace Svelte 3 and 4 keep |
| [`openTooltips`](tests/utils/open-tooltips.ts) | Every portalled tooltip in the document |
| [`setMenuMetrics`](tests/utils/set-menu-metrics.ts) | Stub the scroll metrics jsdom leaves at zero |
| [`treeItemById`](tests/utils/tree-item-by-id.ts) | A tree node by `id`, narrowed |
| [`virtualWindowLayer`](tests/utils/virtual-window-layer.ts) | The element that holds a virtualized list's rendered rows, narrowed |
| [`renderSSR`](tests/utils/ssr.ts) | Server-render a component to normalized HTML and a queryable `document` (see [Server rendering tests](#server-rendering-tests)) |
| [`storage-mocks`](tests/utils/storage-mocks.ts) | A `storage` event mock for cross-tab tests |

Component folders keep their own `helpers.ts` for queries such as `getBodyRows` in [`tests/DataTable/helpers.ts`](tests/DataTable/helpers.ts) and `openMenu` in [`tests/MultiSelect/helpers.ts`](tests/MultiSelect/helpers.ts).

#### Queries and interactions

- Prefer accessible queries: `getByRole`, `getByLabelText`, `getByText` with `exact: true` when needed ([`ComboBox.test.ts`](tests/ComboBox/ComboBox.test.ts)).
- Use `data-testid` in unit tests only when roles are insufficient. E2E fixtures use `data-testid` routinely.
- Use the shared `user` helper from [`tests/utils/user.ts`](tests/utils/user.ts) for clicks and keyboard input.
- Type fixture props with `ComponentProps<typeof Component>` from `svelte` where helpful.

#### What to test

Prioritize high-value coverage:

- Default render and primary user interactions (open, select, submit, keyboard)
- Accessibility roles, labels, and ARIA state changes
- Regressions for bugs you fix. For a CSS-only bug, that means an e2e fixture that renders the broken state for `check:css:compare`, not a `tests/css/` assertion.
- The conditions in [Stress testing UI](#stress-testing-ui) that apply to the change: a narrow container, long words, the server render, keyboard only.
- Existing prop combinations without your new prop. A prop that adds content next to something another prop hides (`valueText` beside a `hideLabel` label) can break the case where it is unset. The `valueText` tests covered `hideLabel` with value text but not without it, which is the case that regressed.
- Boundary inputs to pure utils: zero or negative sizes, empty collections, divide-by-zero, and out-of-range indices. Assert the defined fallback (clamp, empty, identity) rather than only that it doesn't throw.
- Generic/type contracts when adding `@template` props (see below)

Skip or avoid:

- Tests that mirror implementation details without asserting user-visible behavior
- Redundant permutations of the same code path
- Large fixture setups when a focused unit test on a util suffices
- A case another test already covers. Search the component's folder before adding one, since behaviors such as close events often have a dedicated file (`OverflowMenuClose.test.ts`) beside the main one. Extend the existing test or add a row to its table instead.
- A compiled-CSS test for a CSS-only change. See [What belongs in tests/css](#what-belongs-in-testscss).
- `toBeEmptyDOMElement` to test that an element is empty. Svelte 3 and 4 keep whitespace text nodes in an element that looks empty. Use `expectNoContent`, or `el.matches(":empty")` when the CSS `:empty` selector is what the test is about.

Add tests proportional to the change. Not every prop variant needs its own case. When cases differ only in their inputs (sizes, counts, close triggers), write one `it.each` table instead of copies.

A test that asserts absence (`not.toMatch`, an upper bound on a count, `toEqual([])` on an offender list) needs a positive assertion beside it that fails when the pattern stops matching: a lower bound, or a count of what it inspected. A test that reads source text matches whole declarations up to `;`, not single lines, since the formatter wraps long values. Break the source on purpose once and confirm the test fails.

ComboBox, Dropdown, and MultiSelect tests started as copies of each other, so a duplicate in one usually exists in the other two. Check all three when you prune one.

#### Generics and type tests

Vitest exposes `expectTypeOf` globally (see [`tests/utils/setup-globals.ts`](tests/utils/setup-globals.ts)). Use it in a `describe("Generics", …)` block to verify `@template` JSDoc flows through to consumer types. Pure type assertions do not require a runtime render.

Pattern from [`Button.test.ts`](tests/Button/Button.test.ts) and [`ComboBox.test.ts`](tests/ComboBox/ComboBox.test.ts):

```ts
import type ComboBoxComponent from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import type { ComponentProps } from "svelte";

describe("Generics", () => {
  it("should support custom item types with generics", () => {
    type Product = { id: string; text: string; price: number };

    type ComponentType = ComboBoxComponent<Product>;
    type Props = ComponentProps<ComponentType>;

    // Optional props include `undefined`.
    expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
      readonly Product[]
    >();

    const itemToString = (item: Product) => item.text;
    expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
  });
});
```

Use `ComponentProps` and `ComponentEvents` from `svelte` for props and event payloads. For runtime smoke tests with custom item shapes, add a `*Generics.test.svelte` fixture ([`ComboBoxGenerics.test.svelte`](tests/ComboBox/ComboBoxGenerics.test.svelte)).

Common `expectTypeOf` matchers: `.toEqualTypeOf`, `.toExtend`, `.parameter(n)`, `.returns`, `.toHaveProperty`.

#### Other patterns

- Do not add `beforeEach(() => vi.clearAllMocks())`. The shared config in [`tests/utils.ts`](tests/utils.ts) sets `clearMocks: true`, which already clears every mock before each test.
- Scope runs: `bun run test ComboBox` (see [Checks](#checks)).
- In the Svelte 5 suite, `rerender({ x: undefined })` falls back to the fixture's default for `x` instead of clearing it. To toggle an optional prop off, give the fixture a separate boolean and compute the prop from it. See `enabled` in [`DatePickerDisplayFormat.test.svelte`](tests/DatePicker/DatePickerDisplayFormat.test.svelte).
- jsdom cannot select a flatpickr date by typing plus Enter, in popup or inline mode. Click a `.flatpickr-day` or call `calendar.setDate` in unit tests, and leave typed entry to e2e.

#### Server rendering tests

Components that fill state after mount (`onMount`, `afterUpdate`, a `batchStoreUpdates` flush, a store set from a child) render without that state on the server and for the first client paint. Test what a user sees without JavaScript.

Name the files `Foo.ssr.test.ts` and `Foo.ssr.test.svelte`, put `// @vitest-environment node` on the first line, and render with [`renderSSR`](tests/utils/ssr.ts):

```ts
// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Select from "./Select.ssr.test.svelte";

it("marks the `selected` option", () => {
  const { document } = renderSSR(Select, { selected: "md" });
  const options = [...document.querySelectorAll("option")];

  expect(options.map((option) => option.hasAttribute("selected"))).toEqual([
    false,
    true,
    false,
  ]);
});
```

`renderSSR` wraps `render` from `svelte/server`. It strips Svelte's hydration comments, replaces random `uniqueId()` ids with `id-1`, `id-2` in first-seen order, and parses the result into a JSDOM `document`. Pass a context `Map` as the third argument for a child that reads its parent's context, or render a fixture that composes the parent.

- `onMount`, `afterUpdate`, `bind:this`, and actions do not run on the server, and `window`, `document`, and DOM classes such as `HTMLElement` do not exist. A `$:` block does run, so guard browser APIs in it with `typeof window === "undefined"` or move them into `onMount` or an action such as `dismiss`.
- A `tick().then()` queued from a `$:` block runs after a server render too. Return early when the element ref is unset; a rejection there is unhandled.
- When the server output is wrong, resolve the initial state synchronously (a registration index each child claims in script order) and let the store win once it is set. Do not move the work into `onMount`.
- Only test files in the `node` environment compile components for the server. A jsdom test file compiles every `.svelte` import for the client, so it cannot server-render the same fixture. To check hydration, see [Hydration tests](#hydration-tests).
- [`ssr-smoke.ssr.test.ts`](tests/ssr-smoke.ssr.test.ts) renders every component in [`src/index.js`](src/index.js) with default props, and again with `open` when it has one, and fails on a throw or on `undefined`, `[object Object]`, or `NaN` in the output. A new child component that needs its parent's context goes in its `NEEDS_PARENT` list.
- Svelte's server compiler can move a JSDoc `@type` comment onto an unrelated expression and wrap it in parentheses, which produces invalid JavaScript. The sweep fails with a `Parse failure` when that happens. Type a function with `@param` and `@returns`, and move casts out of directive arguments into a helper.

#### Hydration tests

A `*.ssr.test.ts` checks the HTML the server sends. A `*.hydrate.test.ts` checks what happens when the client takes that HTML over. Prefer `renderSSR` whenever the defect shows in the server HTML (a missing selection, a wrong attribute). Add a hydration test only when the problem appears during or after hydration: Svelte rebuilds server nodes, text typed before hydration is lost, the client's first render differs from the server's, or registration changes the page after mount (the first-paint jump in [Conventions](#conventions)).

[`hydrateFixtures`](tests/utils/hydrate.ts) builds every fixture it is given twice with Vite (a server bundle and a Svelte dev-mode client bundle), renders each on the server with no DOM, then hydrates that HTML in jsdom and reports what changed. One call builds all its fixtures together, so call it once per file in `beforeAll` with a longer timeout. List every fixture in a `// @depends-on` comment:

```ts
// @vitest-environment node
// @depends-on tests/Select/Select.hydrate.test.svelte
import { fileURLToPath } from "node:url";
import { type HydrateResult, hydrateFixtures } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./Select.hydrate.test.svelte", import.meta.url),
);
let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([{ fixture, props: { selected: "md" } }]);
}, 120_000);

it("keeps the server nodes and paints the final state", () => {
  expect(result.identity.pct).toBe(100);
  expect(result.diffIgnoringIds).toEqual([]);
  expect(result.settledDiff).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
});
```

Svelte 5 repairs most mismatches without a warning: it rebuilds a swapped `{#if}` branch, lets the client's text and attributes win, and rewrites regenerated `uniqueId()` ids. A quiet console proves nothing, so assert on the diff and node identity rather than on `warnings`:

| Field | Meaning |
| --- | --- |
| `diffIgnoringIds` | Server DOM vs the DOM right after `hydrate()`, with random ids normalized. `[]` means the client kept what the server sent. |
| `identity.pct` | Share of server elements still in the document. Below 100 means Svelte discarded and rebuilt nodes; `identity.replaced` lists them. An element a portal moves to `body` still counts. |
| `settledDiff` | Changes made after mount (`onMount`, a registration flush). Assert `[]` when the server should already render the final state. |
| `brokenRefs.settled` | `aria-*`, `for`, and `headers` ids that match no element in the document. |
| `serverRenderError`, `hydrateError`, `errors` | Errors thrown on each side. |

- Svelte 5 always rebuilds `<option>` elements, so a native `<select>` lowers `identity.pct`. Check that `identity.replaced` lists only `option`s.
- jsdom has no layout. `matchMedia` evaluates `min-width` and `max-width` against the `viewport` option (1280 by 800 by default), and `ResizeObserver` never fires.
- bivium can't follow the paths a test passes to `hydrateFixtures`, so it selects the test through `@depends-on`: CI runs it when a listed fixture, or a component or util the fixture imports, changes. `hydrateFixtures` fails when the running file leaves a fixture out. The harness files are `hermetic` in [`bivium.config.ts`](bivium.config.ts), so they add no unknown.
- [`hydrate-smoke.hydrate.test.ts`](tests/hydrate-smoke.hydrate.test.ts) has negative controls that show what each field catches.
- Run them with `bunx vitest run hydrate`. They run in the `ssr` project (node environment) on Svelte 5 only. Build output goes to `node_modules/.cache/ccs-hydrate/` and is deleted after each call.

#### Svelte 3 and Svelte 4 compatibility tests

The default `bun run test` harness uses Svelte 5. Separate workspaces under `tests-svelte3/` and `tests-svelte4/` run the same tests against older Svelte versions.

You only need these when fixing a failure reported from `bun run test:svelte3`, `bun run test:svelte4`, or their type-check scripts. Most changes do not require them.

These workspaces run `../tests/**/*.test.ts` except `tests/Snippets/**`, `*.ssr.test.ts`, `*.hydrate.test.ts`, `tests/utils/ssr.test.ts`, and `tests/css/**` (compiled SCSS does not depend on the Svelte version). A test that imports a Svelte 5 only module (`svelte/server`, runes, snippets) must be excluded in both `vite.config.ts` files, and in [`tsconfig.compat-check.json`](tests/tsconfig.compat-check.json) together with every helper that reaches the module. One included file that imports `tests/utils/ssr.ts` loads Svelte 5's types into the Svelte 3 and 4 type checks and breaks unrelated icon props.

Before running a compatibility script, install that workspace's dependencies. Without a local `node_modules`, the run may fall back to the Svelte 5 harness:

```sh
cd tests-svelte3 && bun install
cd ../tests-svelte4 && bun install
```

Then from the repo root:

```sh
bun run test:svelte3
bun run test:svelte4
```

### E2E testing with Playwright

E2E tests run in a real browser against HTML fixtures served by Vite. The Playwright config is in `playwright.config.ts`; the Vite config for fixtures is in `e2e/vite.config.ts`.

Run the full suite:

```sh
bun run test:e2e
```

Run a focused component or pattern:

```sh
# Single test file
bunx playwright test e2e/breakpoint.test.ts

# Tests matching a grep pattern (for example "Breakpoint" or "sm breakpoint")
bunx playwright test --grep "Breakpoint"
```

#### How fixtures are served (local vs CI)

The fixtures are a Vite multi-page app, one `.html` entry per fixture. How they are served depends on the environment, controlled by the `CI` env var in `playwright.config.ts`:

- **Locally**: Playwright starts the Vite **dev server**. It transforms modules on demand, so there is no build step and edits show up immediately.
- **In CI**: Playwright runs `vite build` once and serves the static output with `vite preview`. Bundled assets load faster and with less run-to-run variance than the dev server, which transforms unbundled modules on demand through a single process that competes with the browser workers for CPU.

Neither path needs a manual build. To reproduce the CI build locally, for example to debug a build-only failure, build the fixtures once:

```sh
bunx vite build --config e2e/vite.config.ts
```

The output lands in `e2e/fixtures/dist/` (gitignored). Serve it with `bunx vite preview --config e2e/vite.config.ts`, or run the whole CI path in one command:

```sh
CI=true bunx playwright test --project=chromium
```

To add a new E2E test, copy the Breakpoint example. Create these files:

| File                                     | Purpose                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `e2e/fixtures/MyComponentFixture.svelte` | Svelte component that renders the component under test. Use `data-testid` on elements you want to query.         |
| `e2e/fixtures/my-component.ts`           | Entry script that mounts the fixture into `#app`. Use the shared `mount()` utility from `./mount`.               |
| `e2e/fixtures/my-component.html`         | HTML page with `<div id="app"></div>` and a script tag loading the entry module.                                 |
| `e2e/my-component.test.ts`               | Playwright tests. Import `test` and `expect` from `./helpers/host` (see below), use `page.goto("/my-component.html")` in `beforeEach` (or once, in a test that batches read-only cases), then `page.getByTestId(...)` to assert. |

Example fixture mount (`my-component.ts`):

```ts
import MyComponentFixture from "./MyComponentFixture.svelte";
import { mount } from "./mount";

mount(MyComponentFixture);
```

Keep the entry to exactly that: one fixture import, `./mount`, and the `mount()` call. Anything else, such as an extra stylesheet, makes the page navigate instead of using the host.

#### Tests share one host page per worker

A test that imports from [`e2e/helpers/host.ts`](e2e/helpers/host.ts) runs on one page per Playwright worker ([`e2e/fixtures/host.html`](e2e/fixtures/host.html)) that loads the CSS and Svelte once. `page.goto("/my-component.html")` remounts that fixture in place instead of loading a page, which made the median test about four times faster. Any URL whose entry does more than mount one fixture navigates as usual.

Between tests the host unmounts the fixture and resets what a fresh page would not have: leftover portals, `<style>` tags a test added, `<html>` and `<body>` attributes, focus and the pointer focus mode a click leaves (a key press clears it, so `focus()` matches `:focus-visible` again), scroll, storage, the URL query, viewport, media emulation and permissions. It parks the pointer in the bottom-right corner, since Chrome sends hover events for content that mounts under a pointer it has seen. `page.reload()` remounts the fixture and keeps storage, and the `context` fixture is the host page's context.

| Do | Why |
| --- | --- |
| Import from `@playwright/test` instead when a test needs `addInitScript`, `page.clock`, `test.use({ viewport })`, a route or its own context | Those apply on a page load, which the host skips. |
| Poll a layout read (`expect.poll`, `toPass`) that follows an action scheduling work for the next frame, or wait for that frame. A menu or popover that fits itself re-aligns a frame after it opens; see [`menu-button-edge.test.ts`](e2e/menu-button-edge.test.ts) and [`combo-button.test.ts`](e2e/combo-button.test.ts) | A read taken once races that frame. A menu read before its fit frame failed this way. Slow page loads used to hide these races; on the host they fail. |
| Wait for `document.fonts.ready` before you read a position or size | The fallback font and IBM Plex measured text 1px apart, so a read before the font loaded failed on some runs. |
| Turn off animations before you measure: `page.addStyleTag` with `animation: none`, as the buttons block in [`rtl.test.ts`](e2e/rtl.test.ts) does | A rotating element's box changes with its angle. A loading spinner measured 16px at one point in its turn and 20px at another. |
| Keep `goto(` out of e2e comments | The test selector reads it as a navigation and makes the file depend on every page. |
| Add new markup at the end of a shared fixture (`ForcedColorsFixture.svelte`, `RtlFixture.svelte`), and scope broad selectors | `style(page, ".bx--popover-contents")` reads the first match. A Toggletip added above the plain Popover changed what the caret test measured. |
| Run `bun build:css` after you switch branches, before e2e | The compiled `css/all.css` is not committed. A sheet left from another branch fails tests that pass in CI. |

A leak the reset misses shows up as a failure that depends on which tests ran earlier in the worker. Run the file with `--workers=1 --repeat-each=3` to reproduce it.

#### Read-only checks share one page

Each test pays for its setup: a remount on the host, or a page load (about 300 to 400ms in CI) for files that still navigate. When cases only read the page (layout, computed styles, attributes, a hover or focus state), load the fixture once and check every case in one test. See [`forced-colors.test.ts`](e2e/forced-colors.test.ts), [`hidden-label.test.ts`](e2e/hidden-label.test.ts) and [`consumer-override.test.ts`](e2e/consumer-override.test.ts).

| Do | Why |
| --- | --- |
| Loop over a case table and assert with `expect.soft(value, caseName)` | One load instead of one per case, and a failing run names every broken case, not just the first. |
| Run hover and focus cases after the static ones | Hover and focus persist and would change later reads. |
| Keep tests that open, filter, type or scroll separate, or restore the state after each case | State left by one case changes what the next one reads. |
| Keep each batched test under about 5 seconds | Playwright spreads tests, not cases, across workers; one long test runs on one worker. |
| Assert an expected failure with a single read and `not`, not `test.fail()` around a retrying matcher | A retrying matcher that never matches waits out its 5 second timeout every run. |

#### Layout checks

[`e2e/helpers/layout.ts`](e2e/helpers/layout.ts) turns the layout rules of the component guidelines into assertions. Each helper takes a `Page` or a `Locator`, measures in one `evaluate` after the fonts load, and throws an error that names each offending element with the numbers it measured. Edges may differ by 0.5 CSS px. Each helper also throws when it finds nothing to check and returns the count it checked, so it carries its own positive assertion.

| Helper | Rule it checks |
| :--- | :--- |
| `expectAligned(locators, { edge, ink })` | Elements share one edge: `inline-start`, `inline-end`, `top`, `bottom`, `center-x`, `center-y` or `baseline`. Inline edges follow each element's direction. `baseline` is the first line's text baseline, or the value's baseline in an input or select. Inline edges measure the ink (the text's Range rects and the icons' svg boxes) of an element with its own text, such as a heading, a label or a button, and the box of any other. `ink: true` measures the ink on every edge; `ink: false` measures the box. |
| `expectOnePitch(rows, { skip })` | Repeated rows have one top-to-top pitch, and it is a multiple of 4 px. Frozen rows (`sticky` or `fixed`), rows under `aria-hidden`, rows with no text, icon or control (a spacer, a selection overlay) and rows that match `skip` are left out. |
| `expectTextFits(scope)` | No text overflows its box or a clipping ancestor. Text cut by an ellipsis keeps its full value in a `title`, an `aria-label` or a tooltip, and does not stop inside a number, date or time. Cut-off text with no full value at rest is hovered, so a `title` set on hover (`titleWhenTruncated`) and a tooltip in a portal (`AnchoredTooltip`) count. The pointer ends in the bottom-right corner. Text hidden on purpose is skipped: under `clip`, `clip-path` or `.bx--visually-hidden`, or in a box with no area in view. |
| `expectNoNestedBorders(scope)` | No box with an edge sits inside another one on the same background. An edge is a border on all four sides, an outline, or a box-shadow ring with no offset or blur. Form controls' borders and the focused element's outline are skipped. Run it under forced colors too. |
| `expectNoPageOverflow(page, { vertical })` | The page does not scroll sideways. `vertical: true` also checks that it does not scroll down. |
| `expectSingleRing(scope, { skip })` | Under forced colors, each element the scope matches holds at most one focus or selection ring. Call it with at most one item focused or selected. A ring is an outline wider than the resting edge (1 px, or 2 px on an unfocused field), or an outline or border in `Highlight`. An element and its pseudo-elements count once. Hidden elements, such as a closed tooltip, are skipped, and so are elements inside `skip`, for child components the scope does not own. For one selection shown in two panes, pass a locator that matches both panes. |

Each helper reads the page once, except that `expectTextFits` hovers cut-off text it can't settle at rest. After an action that lays out in the next frame, wrap the call in `expect(...).toPass()`. [`layout-checks.test.ts`](e2e/layout-checks.test.ts) shows a passing and a failing case for each helper.

`findLayoutProblems(scope, check)` runs `fits`, `borders`, `overflow` or `ring` and returns the findings instead of throwing.

#### Layout sweep

[`layout-sweep.test.ts`](e2e/layout-sweep.test.ts) runs the page-wide layout checks on every page in `e2e/fixtures/`. It skips `host.html`, `index.html` and `layout-checks.html`, which holds the helpers' failing cases. It mounts each fixture again for each variant:

| Variant | Checks |
| :--- | :--- |
| `1280`, `672`, `320` (px wide, 720 px high) | `overflow` (`expectNoPageOverflow`), `borders` (`expectNoNestedBorders`), `fits` (`expectTextFits`) |
| `1280-forced` (forced colors) | `borders`, and `ring` (`expectSingleRing`) once for each `listbox`, `grid`, `treegrid`, `tree`, `tablist`, `menu`, `menubar` and `radiogroup` |

Before it measures, it waits for the fonts, finishes running transitions and stops looping animations at their start. `expectAligned` and `expectOnePitch` need selectors, so they stay in each component's tests.

[`layout-sweep.baseline.json`](e2e/layout-sweep.baseline.json) lists the findings on `master`. The sweep compares findings by a key: fixture, variant, check, kind and a short CSS path. The key holds no pixel values, and the path skips ids that `uniqueId` generates. The `message` holds the numbers; the sweep shows it and does not compare it. Each fixture is one test, and it fails in two cases:

- **A new finding.** The failure lists its key and message, for example `tag-v11.html | 320 | fits | no full text | button[data-testid="long-operational"] > span.bx--tag__label`. Fix it. If the design is intended, update the baseline and give the reason in the PR.
- **A baseline entry that no longer occurs.** Update the baseline to drop it. While a fixed finding stays in the baseline, it could come back without a failure.

Update the baseline for the fixtures that run, with one worker:

```sh
# Every fixture, about 1.5 minutes
LAYOUT_SWEEP_UPDATE=1 bunx playwright test e2e/layout-sweep.test.ts --project=chromium --workers=1

# One fixture
LAYOUT_SWEEP_UPDATE=1 bunx playwright test e2e/layout-sweep.test.ts --project=chromium --workers=1 --grep "sweep tabs.html$"
```

Read the diff before you commit it. Dropping entries is always fine. Add an entry only for an intended design, and give the reason in the PR. A new fixture can add entries the same way.

CI runs Chromium on Linux, and the baseline must match it. A few lines of text measure a few pixels apart on Linux and macOS. A finding that comes and goes between runs of the same code, or occurs on one platform only, goes in `UNSTABLE` in the test, with its reason. The sweep leaves those out of the comparison and the baseline. Check a change to the sweep with `--repeat-each=3 --retries=0`, and read the first CI run.

CI runs the sweep when a change reaches a fixture page, which covers `src/`, `css/` and `e2e/fixtures/`. It takes about 1.5 minutes on one worker.

A few gotchas:

For components that hide content with CSS (for example ComposedModal), `toBeVisible()` can lie because the element stays in the DOM. Prefer `toHaveClass(/is-visible/)` on the container, or assert on `aria-hidden` / `inert`.

`getByText("Row 1")` also matches "Row 10", "Row 11", and so on. Use `getByRole("cell", { name: "Row 1", exact: true })` or a more specific selector when content can overlap.

Scroll anchoring corrections can land more than two animation frames after a scroll. To catch them, wait with a timeout between scroll steps (80ms is enough), not `requestAnimationFrame`. Check that the test fails with the fix reverted. See [`virtual-list-spacer.test.ts`](e2e/virtual-list-spacer.test.ts).

To measure blank frames in a virtualized list, listen for `scroll` on `document` in the capture phase. That listener runs before the component's own handler, while the DOM still holds the previous window, so the part of the viewport no row covers is what the browser painted. See `recordGaps` in [`virtual-list-fast-scroll.test.ts`](e2e/virtual-list-fast-scroll.test.ts).

Headless Chromium has no scrollbar to drag. Send large `page.mouse.wheel` deltas, one per frame, to stand in for a fast drag.

`page.keyboard.press` calls in a loop without waits land inside one frame, faster than anyone types. Use that to reproduce timing races, and wait between presses only when the test judges a settled position. A race can fail in only some runs: one round of 12 presses failed 4 runs in 10. Repeat the sequence inside the test, and check with `--repeat-each=10` that it fails with the fix reverted. See [`listbox-virtualized.test.ts`](e2e/listbox-virtualized.test.ts).

To cover an opt-in mode with existing assertions, have the fixture read a query flag and run the suite once for each value. The measured-menu suites run a second time with `?optimizeFastScroll`.

Add a link to `e2e/fixtures/index.html` so the fixture is reachable from the index page.

### Stress testing UI

Most layout and state bugs only show once a component sits somewhere other than its docs example: in a narrow card, beside other controls, with a long label, or before JavaScript runs. Check a change against the conditions below before calling it done, and measure rather than eyeball. A bug found this way gets a fixture that renders the failing condition, so the fix stays fixed.

#### Render every state side by side

Render each size against each state in one matrix: default, helper text, invalid, warning, disabled, read-only, hidden label, skeleton, inline, fluid, and inside a `Layer`. Compare the rows. Do fields of the same size share one height and line up their icons? Does the skeleton match the loaded control? Does one size drop an icon or a border? One example at the default size hides almost all of this. Repeat in each theme (`white`, `g10`, `g90`, `g100`).

To review a change that moves many screenshots at once, such as a token or theme change, compare image dimensions before pixels. Same size, different pixels is a color change. A different width or height is a layout change, and those are the ones to look at first.

#### Put it in a real composition

Render the component where it will be used, not alone on a wide page:

- In narrow containers: fixed-width boxes at 240, 320 and 480px, and the phone width (390px). [`pagination-fit.test.ts`](e2e/pagination-fit.test.ts) renders the same component in four boxes and asserts per width.
- In rows that shrink: a flex row, a grid row with an `auto` track beside `minmax(0, 1fr)` text, and controls side by side in an `InputGroup` or toolbar. Controls that act as one share one height and a 1px seam; assert the heights and gaps.
- In panels, modals and cards.

Lay out by the component's own width, not the window's. A component that switches layout at a breakpoint should do it with a container query on itself, so it behaves the same in a 20rem panel on a wide screen as on a phone. A set of actions that can't fit its labels should stack or wrap, not squeeze.

#### Long and unusual content

Use a long compound word (`Datenschutzgrundverordnungskonformitätsprüfung`), a URL or id with no spaces, CJK text, a translated string longer than the English, a large count, an empty value and a single character. [`long-words.test.ts`](e2e/long-words.test.ts) puts these in a 12rem column and asserts nothing spills out.

Also test the opposite: a short word must not break when it would fit. `word-break: break-word` (see [`_long-words.scss`](css/_long-words.scss)) lets a box shrink below its longest word, so a squeezed flex item or `auto` grid track breaks "Select" a letter a line. Assert both: nothing spills past its column, and no word that fits its row is split across lines. A word is split when its range has client rects on more than one line:

```ts
const splitWords = (root: Element) => {
  const out: string[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const match of (node.textContent ?? "").matchAll(/\S+/g)) {
      range.setStart(node, match.index ?? 0);
      range.setEnd(node, (match.index ?? 0) + match[0].length);
      const tops = new Set(
        [...range.getClientRects()]
          .filter((rect) => rect.width > 0)
          .map((rect) => Math.round(rect.top)),
      );
      if (tops.size > 1) out.push(match[0]);
    }
  }
  return out;
};

expect(await page.getByTestId("rows").evaluate(splitWords)).toEqual([]);
```

#### Without JavaScript and before hydration

Anything a component settles after mount renders differently on the server: a class derived from its children registering (icon-only, a secondary label somewhere in a tab set), a measured size (a collapsed tile's height), a position computed in `afterUpdate` (an open menu), an indent read from the DOM. The page then moves when it hydrates, and stays wrong with JavaScript off.

- Prefer state the server can know: compute it from props or context in render (a node's `level`) instead of from the DOM after mount.
- When only the children know, express the layout in CSS. Use `:has()` only inside `@supports selector(:has(*))`: an unsupported selector in a rule's selector list drops the whole rule, so an unguarded `:has()` also breaks the rule for older browsers.
- Test the markup with a [server rendering test](#server-rendering-tests), and the layout with an e2e case that measures the mounted component, puts it back in its server state, and asserts that the box did not move:

```ts
test("a collapsed ExpandableTile is its collapsed height before it measures", async ({
  page,
}) => {
  const tile = page.locator(".bx--tile--expandable");
  const rect = () =>
    tile.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map(Math.round);
    });
  const mounted = await rect();
  // The server's markup: not yet measured.
  await tile.evaluate((el) => {
    el.classList.add("bx--tile--unmeasured");
    (el as HTMLElement).style.maxHeight = "none";
  });
  expect(await rect()).toEqual(mounted);
});
```

On a server-rendered page you can check the whole page the same way: screenshot a region as served, trigger hydration, screenshot it again, and diff. To find the cause, list each element's `class`, `style` and bounding box before and after hydration; the attribute that changed is usually the bug.

#### Keyboard only

Walk the component with the keyboard alone, and record `document.activeElement`, its accessible name and its ARIA state at each step. Tab in and out. Arrow keys follow the matching [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/). Escape closes an overlay and returns focus to what opened it, or to a fallback when the opener was removed. Focus is always visible and never lands on `body`. An icon-only trigger has a name, and a menu is labelled by its trigger.

#### Assistive text

Every string the component renders or announces (labels, counts, status text, live-region messages) must be translatable through a prop or `translateWithId`. Search the component for English string literals before adding one.

#### Measure, then prove the fix

Assert numbers (heights, gaps, positions, line counts, the number of visible skeleton bars), not that a screenshot looks right. Give a detector a self-test: render a case it must flag, and fail if it doesn't, so a clean run means something. Before opening the pull request, put the file back to its old version, rebuild, and watch the new test fail:

```sh
git show HEAD~1:css/_long-words.scss > css/_long-words.scss
bun run build:css && bunx playwright test e2e/long-words.test.ts --project=chromium
git checkout -- css/_long-words.scss && bun run build:css
```

When a style seems to have no effect, read the computed value with `getComputedStyle`, walking up the parent chain if needed. A computed `auto` where you set a value means the browser dropped your declaration.

#### CSS pitfalls found this way

- `min()`, `max()` and `calc()` can't take `max-content` or `min-content`. The browser drops the whole declaration without a warning. Use a length, a percentage, or a different property.
- `word-break: break-word` lowers an element's min-content to one character, so a flex item or an `auto` grid track can squeeze it a letter at a time. Give such items a way to keep their words: `nowrap` on a short label, `flex-wrap` on the row, or a container query that changes the layout.
- Text placed directly in a flex or grid container is an anonymous item with `min-width: auto`. It can't be styled apart from its container, so `overflow-wrap` on the container doesn't let it shrink.
- Shorthands reset what they don't name: `border: 0` also resets `border-color` to `currentColor`, which a transition then animates on the first change. Set the property you mean (`border-width`).
- A size modifier with more classes silently beats a state rule on the same element, for example centering what a tall layout start-aligns. Check specificity when adding either.

### Performance benchmarks

Benchmarks live in `bench/`, split into two tiers by filename convention. Both tiers run on [ostia](https://github.com/metonym/ostia) (Bun-native) — no vitest, no mitata.

**Pure-logic tier** (`bench/*.bench.ts`) benches a standalone util module directly — no Svelte, no DOM. Run it straight under bun via the `ostia` CLI:

```sh
# Whole file
bunx ostia bench bench/treeCheckboxState.bench.ts

# Only task(s) whose "group/name" id matches a substring — much faster while
# iterating on one new case in a file with many
bunx ostia bench bench/treeCheckboxState.bench.ts --filter "no cascade"
```

To check a change against master, `bun run bench:ab` runs every pure-logic file with `ostia ab --base origin/master`: both trees in one process, in alternating rounds, so machine load cancels out. It confirms flagged tasks in fresh processes and fails on the geometric mean, which catches a broad slowdown more reliably than one task's. Pass `--filter` to narrow it. The Perf workflow runs the same comparison on a `perf:` PR, or one labeled `performance`, and nightly on master against the commit the previous nightly ran on, with the table in the job summary. It fails at a 4% geomean, not ostia's 1.5%, since runners measure about 2.5% noise.

Numbers from this tier are representative of real-browser V8 behavior (no jsdom involved), so it's the right tier for validating algorithmic or data-structure choices — proving a `Set`-over-`Array` change actually helps, or that a function stays O(n) instead of drifting to O(n²), with real measurements instead of a guess.

**Component tier** (`bench/*.dom.bench.ts`) mounts a real component. ostia itself is Bun-native and has no jsdom or `.svelte`-compile support built in, so this tier supplies both itself via `--preload ./bench/dom-preload.ts` (see that file) — a script that installs jsdom globals (`document`, `window`, the same `matchMedia`/`ResizeObserver`/etc. mocks `tests/utils/setup-globals.ts` uses for the unit-test suite) and registers a `Bun.plugin()` loader that compiles `.svelte` files with the Svelte compiler directly (stripping `<script lang="ts">` via `Bun.Transpiler` first, where used — `bench/fixtures/*.svelte` all use it, `src/**/*.svelte` doesn't). A `projects` entry in `ostia.config.ts` gives `bench/*.dom.bench.ts` that preload and the `browser` condition below, so pure-logic files run without them. Running the whole component tier is just:

```sh
bun run bench
```

`bench/*.dom.bench.ts` also needs `svelte`'s package.json `exports` to resolve to its `browser` condition (the client runtime) instead of `default` (the server-rendering build, which throws `lifecycle_function_unavailable` on `mount()`) — that's what `ostia.config.ts`'s `bunFlags: ["--conditions=browser"]` is for. Running a single file directly works the same way: a file given on the command line replaces the config's `suites` list, and the `projects` entry still supplies its preload and flags:

```sh
bunx ostia bench bench/dropdown.dom.bench.ts
```

jsdom has no layout or paint, so treat this tier as a same-harness regression detector (did this change make mount/interaction meaningfully slower than before), not a real-browser latency number.

A new bench file, either tier, follows the same shape as an existing one — copy the closest match (for example `bench/treeCheckboxState.bench.ts` for pure-logic, `bench/dropdown.dom.bench.ts` for component) rather than starting from scratch. A few conventions and gotchas to carry over:

- Pure-logic files don't have a `.range()`/`.args()` bench-registration equivalent (mitata's old parameterized-sweep API) — `task()` takes a fixed name and zero-arg fn. Loop over ostia's built-in `range(start, end, multiplier?)` and call `task(`${size} nodes`, () => work(size))` per point, all inside one `group(name, () => { ... })` so the printed table's `Relative` column compares sizes within that case. Setup code before the `task()` call in the loop body runs once per size value (unmeasured); only the closure passed to `task()` is timed.
- Pass `{ gc: true }` as the third argument to a **pure-logic** `group(...)`/`task(...)` call whose case(s) allocate non-trivially per call (sorting or copying an array, building objects) — check the file's top-of-file comment for which groups need it. Without it, Bun's default batching (many calls back-to-back with no GC in between) can mis-calibrate and report numbers inflated by 20-60x. Cross-check a surprising absolute number against a plain `performance.now()` loop before trusting it. Set it per group (or per task, for a standalone `task()` outside any group) rather than the suite-wide `--gc` CLI flag, so a single suite file can freely mix gc-needing and gc-free cases (see `bench/virtualize.bench.ts`, which does both).
- Do **not** add `{ gc: true }` to a **component-tier** (DOM) bench. Forcing a real GC after every iteration over a large jsdom DOM object graph is far more expensive than over plain JS objects, and can trip real thermal throttling that silently inflates every number in the same run — including unrelated cases in the same file (this happened during initial mitata benchmarking and is why the component tier has never used it).
- Component-tier files call `cleanup()` from `@testing-library/svelte` inside the benched closure so DOM nodes don't pile up across thousands of samples of the *same* task. There's no per-task teardown hook across *different* tasks in one suite file, though — every `group()`/`task()` call in a file registers (and, for module-scope setup code, runs) up front, unlike mitata's `run()`, which drove one bench's generator (setup → sampling → any code after its `yield`) to completion before starting the next. A file with several cases that each need their own persistent, freshly-opened component instance (not just a fixed prop set) should scope every query through `within(instance.container)` (see `bench/dropdown-highlight.dom.bench.ts`, `bench/multiselect-toggle.dom.bench.ts`) rather than an instance-global `getByRole`/`getByText` — the latter queries the whole document and throws "found multiple elements" once a second instance is mounted, since both now coexist for the file's entire run instead of one at a time.
- Time the dimension that actually scales. A 3000-row × 4-column mount will not catch a rows×columns cell rebuild. Operator actions (select-all, ArrowDown, filter keystroke) need their own case if that is the claim. A `performance.now()` loop around the click or key plus `tick()` is enough.
- A Carbon React (or other sibling) perf PR is a hypothesis for this tree. Carbon React's select-all fix was O(N²) `includes`. This DataTable already assigns `selectedRowIds = selectableRowIds` and membership is a `Set`. Isolated click cost was sub-millisecond on a virtualized table; a sentinel-plus-exceptions model was slower. Measure the operator here before changing the model.

#### Counting redundant work

When the claim is "this expensive call should not happen", count the call instead of timing it. Counts are deterministic, jsdom times are not. A throwaway vitest file is enough, no bench harness needed:

- Wrap the expensive method on the live instance AFTER mount, so mount-time calls are excluded, then drive 200 updates and report the count plus a `performance.now()` range. If the instance is created before the test can reach it, wrap the constructor with `vi.mock` (see [`DatePickerRedundantSet.test.ts`](tests/DatePicker/DatePickerRedundantSet.test.ts)).
- Get the "before" number from the parent commit in a temporary `git worktree` with `node_modules` symlinked, not from a stash. The stash stack is shared across worktrees. DatePicker's month and week tests fail in such a worktree because flatpickr's plugins don't resolve through the symlink; run those in a real install.
- Report counts as exact and times as a range over 2 to 3 runs, and say when ranges overlap. "Median 5.3 to 3.7 ms, ranges overlap" is an honest result. A lone best-case number is not.
- Turn the finding into a permanent test with both halves: equal values do not call the method, and a genuinely different value does. A guard that never updates is worse than no guard.
- Time in production mode, never under the default `bun run test`. Svelte 5's dev mode captures a stack trace on every state write (`get_stack`/`get_error`), which inflated a `ComboBox` re-render probe by roughly 5 to 10x in past audits and — because the inflation scales with the number of state writes per case — can change which suspect looks slowest. Counts are unaffected, only milliseconds are. Use `bun run test:perf <file>`, which runs against [`vite.config.perf.ts`](vite.config.perf.ts) (`compilerOptions: { dev: false }`) with `NODE_ENV=production` (the runtime `DEV` flag comes from `esm-env`, keyed off `NODE_ENV`; the compiler flag alone does not silence it). This does not apply to `bench/*.dom.bench.ts` — that tier compiles with the Svelte compiler directly (`generate: "client"`, no `dev` option, so it's already off) and never goes through vitest.
- Count with a callback prop (`export let onCompare = () => {}`) on the fixture, not by mutating an `export let` object from inside the fixture — a mutated object is a new reference on every read, which both invalidates reactive statements that shouldn't re-run and wrecks the timing you're trying to measure.
- Always include a control case that is a constant expression in the markup (`prop={build()}`, no reactive dependency) and must show zero extra calls. If the control re-runs, the counter is measuring something else, not the case under test.
- A one-off probe file is throwaway, not a permanent test: put it under `tests/zzprobe/`, prefix `Zz`/`zz`, and delete it (and any scratch config) once you've written down the numbers. `.gitignore` already excludes `tests/zzprobe/`, `**/zz*.test.ts`, `**/Zz*.test.svelte`, and `zz.*.config.ts` so one can't be committed by accident.
- To see where time actually goes, CPU-profile one case under the production config (vitest 5 dropped `--poolOptions`, use `--pool=forks` directly):

  ```sh
  bun run test:perf <file> --pool=forks \
    --execArgv=--cpu-prof --execArgv=--cpu-prof-dir=/tmp/prof
  ```

#### Measuring in a browser

jsdom has no layout, paint, or observer timing, so neither bench tier nor `test:perf` can show a forced layout or an interaction delay. For those claims, build a production bundle of a small page that imports the components from `src/`, serve it with `vite preview`, and drive it with Playwright in Chromium.

| Do | Why |
| --- | --- |
| Count layouts and style recalcs with CDP `Performance.getMetrics` (`LayoutCount`, `RecalcStyleCount`) around the action. | Counts stay stable on a busy machine, where milliseconds swing 2 to 3 times between identical runs. |
| Build the base commit and the change side by side, alternate them round by round, and report medians. | Back-to-back batches pick up whatever else the machine was doing. Only interleaved comparisons hold up. |
| Time input to flushed and laid out (dispatch, wait a task, read `offsetHeight`), and use Event Timing only as a cross-check. | Event Timing reports in 8 ms steps with a 16 ms floor, and the first interaction after load includes first-frame presentation. A ComboBox "40 ms open" was about 4 ms of script. |
| Repeat interaction timings at 4x CPU throttling (`Emulation.setCPUThrottlingRate`). | A 120 ms hitch on a laptop is 464 ms on a slow phone, and that's the case a fix has to cover. |
| Check the page for live `Range` objects and page-wide `MutationObserver`s before blaming a component. | The browser updates every live `Range` on each DOM change. 2,000 of them made a 1,000-row sort 3 times slower. Highlight API painters should register `StaticRange`s. |
| For leaks, mount and unmount (or open and close) in batches, then compare listener counts from CDP `DOMDebugger.getEventListeners` on `window`, `document`, `body`, and `html`, `document.body` children, and heap from `Runtime.getHeapUsage` after `gc()` (launch with `--js-flags=--expose-gc`). | Heap that keeps growing batch after batch is a leak. Heap that levels off after the first batch is warm-up. |

#### Batching child registration

Each child that calls `store.update()` during mount copies the whole registry. N children means N copies. Every `derived` or `$: ... $store` subscriber re-runs on each one. `Tabs`, `OverflowMenu`, `ContentSwitcher`, `UserAvatarGroup`, `ProgressIndicator`, `TagSet`, `Select`, `ContextMenuRadioGroup`, and `Menu` all hit this. Wrap the update with [`batchStoreUpdates`](src/utils/batch-store-updates.js) so those N calls flush once.

```js
const batchedUpdate = batchStoreUpdates(store);

function register(item) {
  batchedUpdate((current) => [...current, item]);
}
```

- Put every mutator for that store on the same queue. A direct `store.update()` in the same mount pass can read an array that is still missing a not-yet-flushed batch.
- `batchStoreUpdates` flushes on a `Promise.resolve().then()` microtask, not `afterUpdate`. A comment that warns against deferring work because of `afterUpdate` does not apply.
- `afterUpdate` still runs once right after initial mount, before the batched flush, while the store is empty. A one-shot flag set in `register()` itself gets consumed by that empty call. Set it inside the batched update function, as `Tabs.svelte` does with `needsDomSync`.
- Don't measure in `onMount` while the registry is still empty. Children register in the batched flush after mount, so the read finds nothing to lay out and still forces a layout per instance. `TagSet` skips its mount-time measure until tags have registered.
- The flush never runs during server rendering, so anything rendered from the batched store is empty on the server and for the first client paint. See [Server rendering tests](#server-rendering-tests).
- Inside the batched updater, dedup and patch against the updater's own accumulator, not a `derived` store from outer scope. The derived store is the last flushed value, so a same-batch id looks unregistered. See `add()` in `ProgressIndicator.svelte`.
- Component-bench a new group or list's mount at a few sizes before shipping. A `performance.now()` loop around `render()` is enough to catch this.
- Matching `register()` code can still measure differently. If the consumer runs behind `tick()`, a synchronous `render()` never waits for that work. `TagSet` and `UserAvatarGroup` share an `insertByDomOrder` register shape. Only the avatar group's `$:` block runs synchronously, so only that one showed the cost.
- A Svelte child per option is still registration cost. Pagination's page list uses native `<option>` elements; page sizes still use `SelectItem` because that set is small. See [`Pagination.svelte`](src/Pagination/Pagination.svelte).

#### Per-item children

A component that renders a library component once per row or option pays for every instance, even in production builds. Svelte compiles each file on its own, so a child still costs a context lookup, rest-props proxies, its `$:` blocks, and a listener per forwarded event. `DataTable` renders its row selection inputs, and `MultiSelect` its option checkboxes, as plain markup for this reason.

| Do | Why |
| --- | --- |
| Fold a child into plain markup only when it renders per item in an unbounded, non-virtualized loop and the parent already owns its state. | A child that builds stores or context fallbacks (`Checkbox`, `RadioButton`) cost 90 to 200 µs per instance. A thin wrapper or an icon cost 15 to 30 µs, which nobody feels below hundreds of instances. |
| Keep icon components. Don't inline their SVG markup. | The saving is small, and every copy of the path data has to be kept in sync. |
| Before folding, list everything the child does besides markup: form reset, click workarounds, `overflowTitle`, context. | Plain markup silently drops it. `MultiSelect` needed its own reset hook, and `DataTable` its own Firefox shift-click workaround ([`forward-shift-click.js`](src/utils/forward-shift-click.js)). |
| Compare normalized markup (sorted attributes and classes, plus `checked` and `indeterminate`) before and after, on Svelte 3, 4, and 5. | Dropping a `{...$$restProps}` spread changes how attributes are written. Svelte 5 writes `disabled` on a `div` as a property, so the attribute disappears. Svelte 3 and 4 write `value={undefined}` on an input as `"undefined"`. |

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
```

Subject line:

- Keep it concise: one line, imperative mood
- Common types: `fix`, `feat`, `docs`, `chore`, `test`, `refactor`. A commit
  that adds a prop, slot, or public field is `feat`, even when it fixes a bug
- Scope is the component or area; multi-word names are lowercase with dashes: `combo-box`, `code-snippet`, `data-table`, `ui-shell`, `accordion-item`
- Omit scope when the change spans many areas (`docs: …`, `chore: …`)
- Append `!` after the scope for breaking changes: `fix(accordion-item)!: …`.
  A change is breaking when it changes what a form submits, what
  `bind:value` holds, or a default behavior, even when no type changes.
  Add a `BREAKING CHANGE:` footer with a short before and after
- `fix` is for bugs in a published release. If the buggy code was only
  ever on an unreleased commit (introduced since the last tag), use
  `chore` instead, since it never shipped as a bug. See also
  [What each commit holds](#what-each-commit-holds)
- `perf` bodies must state the measured effect: a before/after number
  (bundle size, benchmark timing, operation count), not just a
  description of the change. See [Performance benchmarks](#performance-benchmarks)

Examples:

```
fix(combo-box): close dropdown on outside click
docs(tree-view): fix slottable inline editing example
chore(deps-dev): bump vitest, svelte-check
```

Body (optional):

A body is not required. Add one when context helps reviewers or when closing an issue.

- Lead with the root cause or prior (broken) behavior, naming the
  specific selector, function, or mechanism at fault, then state the
  fix. Don't just restate the diff; a reviewer can already read that
- Reference the issue: `Fixes #1000` or `Closes #1000` (GitHub auto-closes on merge). Open the link first: a reference to a missing issue closes nothing
- At most 2-3 sentences, full sentences, no bullet lists
- Wrap lines at 72 characters for readability in `git log`

Example with body:

```
fix(data-table): associate cells with column headers

Cells never set aria-labelledby, so screen readers couldn't announce
a cell's column header. Point each cell at its column header id.
Fixes #3162
```

Example `perf` body with a measured effect:

```
perf(css): drop the redundant .popover qualifier on direction ::before

.bx--popover--{dir} never renders without .bx--popover on the same
element, so appending it to the compound filtered nothing, only
added specificity.

all.css 671418 -> 671274 B min, 72110 -> 72099 B gzip.
```

Avoid vague subjects (`fix bug`), PascalCase or camelCase scopes (`fix(ComboBox):`), and long subjects. Move detail to the body. Prefer `Fixes #N` in the body over PR numbers in the subject.

## Submit a pull request

Follow [Commit messages](#commit-messages) for each commit in your branch.

### What each commit holds

PRs land with a rebase merge, so each commit reaches master and the changelog.

- A `feat` or `fix` commit holds its own `src/` and `tests/` changes and nothing under `docs/`. Ship docs as a separate `docs(...)` commit.
- Fold a fix or refactor of code that the same PR adds into the commit that adds it. Otherwise the changelog lists a fix for something that never shipped.
- Resolve rebase conflicts inside the commits they touch. Never push a "resolve rebase onto master" commit.

### Keep your branch current

Rebase your branch onto current `master` before you ask for a merge. Do not merge `master` into it. Master adds checks often (strict component script types, `sveld/context-any-type`, `bun fmt --check`, aria-forwarding coverage, `require-leading-heading`), so a green run on an old base does not show that the PR passes them.

```sh
git fetch upstream
git rebase upstream/master
```

A branch older than the `bun fmt` reformat (0dedc0007) conflicts in almost every file it touches. Rebase it onto 2ef731752, which adds the `bun fmt` config but not the reformat, run `bun fmt` on the files each commit changes, then rebase onto `master`.

### Resolve conflicts in shared test files

`e2e/forced-colors.test.ts`, the shared e2e fixtures, `e2e/rtl.test.ts` and import lists conflict often, because many PRs append to them. Keeping both sides is usually right, but a merge tool that keeps both sides line by line can still break the file. After you resolve one, check that:

- each new test sits inside the right `describe`, not inside another test
- no list entry or import appears twice
- imports are still sorted (`bun fmt <file>`)
- the spec still passes locally

### What CI runs on a pull request

The `changes` job picks the tests once, from the same graph as `bun run test:changed`, without installing dependencies. A `css/` change is the exception: it installs and compiles CSS, about 8 s, cached for reruns and for later pushes that leave `css/` alone. The other jobs start from its selection.

| Job | Runs on a PR |
| --- | --- |
| `static-checks` | Always: `bun fmt --check`, `biome ci --error-on-warnings`, `build:docs`, `test:src-types`, `test:src-js`, `test:src-svelte`, `test:src-svelte-types`, `test:package-exports`, `check:package`, `thumbnails catalog` and `bivium check` |
| `test` (2 shards) | The selected unit tests, skipped when there are none and types didn't change. `test:types` runs on the first shard |
| `test-svelte-compat` (Svelte 3 and 4, 2 shards each) | The same selection, in each harness |
| `test-e2e` (Chromium, 1 shard for up to 20 files, else 2) | The selected E2E tests |
| `css-size`, `css-cascade` | `css/` changes only. `css-size` fails past the [growth limit](#size-growth); `css-cascade` is informational |
| `bench-ab` (Perf workflow) | `perf:` PRs and PRs labeled `performance`. Fails past a 4% [bench](#performance-benchmarks) geomean |

Pushes to master and manual runs run everything, which catches any miss. A PR that only touches `docs/**` or Markdown skips the workflow.

GitHub runs no `pull_request` workflow while a PR has merge conflicts. If a PR shows no checks at all, rebase it.

A PR runs a whole suite when the selection can't be trusted. `bun run test:plan` lists each reason under `reasons`:

| Cause | Fix |
| --- | --- |
| A change to the selector (`bivium.config.ts`, `scripts/lib/css-narrower.ts`, `scripts/lib/css-delta.ts`) | None needed. The selector can't vouch for itself |
| A changed file outside the graph's roots | Add the file's directory to `roots` in `bivium.config.ts` if tests import it |
| A changed setup or helper file that no test imports | None needed. It's wired in through config, so the whole suite runs |
| A test whose dependencies the graph can't read: a computed import path or `page.goto` URL, or a disk read without `// @depends-on <glob>` (or `// @reads <glob>` for files read as text) | Fix the test. It otherwise runs on every PR |

### Changing CI

A PR that edits `.github/workflows/` runs every suite, so its own run can't show a selective path: a CSS-only change, a one-shard E2E selection, or a cache hit. To see one, open a draft PR based on your branch with the smallest change that takes that path (a comment in a `.scss` partial, a line in one component), read the run, and close it.

| Do | Why |
| --- | --- |
| Compare step times with `gh run view <id> --json jobs --jq '.jobs[] \| .name as $j \| .steps[] \| "\($j) \| \(.name) \(((.completedAt\|fromdate)-(.startedAt\|fromdate)))s"'` | The run summary shows only job totals |
| Expect a PR's `actions/cache` to restore only from master and the PR's own earlier runs | GitHub scopes caches by branch, so warming one from another PR does nothing |
| When code that matches master fails, compare the `bun install vX` line with the last green run | `setup-bun` installs the latest Bun, so a Bun release can change behavior overnight |

### Open a PR

Push your branch, then open a PR comparing `<YOUR_USER_ID>/feature` to `origin/master`.

In the description:

- Lead with the problem, then the fix, in a short paragraph.
- For a visual change, add a Before/After table of screenshots: the same example and viewport, Before from `master`, in White and Gray 100. Add RTL or forced-colors shots when the change touches them.
- For a stacked PR, say what it is stacked on and the merge order. Where you can, write tests that pass in either order, so the stack can merge in any order.

## Maintainer guide

The following applies only to project maintainers.

### Release

This library publishes to NPM with [provenance](https://docs.npmjs.com/generating-provenance-statements) via a [GitHub workflow](https://github.com/carbon-design-system/carbon-components-svelte/blob/master/.github/workflows/release.yml).

Pushing a tag that starts with `v` (for example `v0.81.1`) triggers the workflow. It runs `bun ci` and `bun run release:build` (generates docs and types, strips doc comments, builds every CSS theme, and prunes `package.json`), checks the package contents with `scripts/check-package-contents.ts`, then publishes to NPM.

On a clean `master` branch, run `bun run release`. That will:

- Bump the semantic version in `package.json`
- Generate notes in `CHANGELOG.md`

It does not commit or tag. Do that manually:

```sh
# 1. Commit the changes using the new version as the commit message.
git commit -am "v0.81.1"

# 2. Create a tag.
git tag v0.81.1

# 3. Push the tag to the remote.
# This triggers the `release.yml` workflow to publish a new package to NPM (with provenance).
git push origin v0.81.1
```

If the workflow succeeds, the [`release.yml` workflow](https://github.com/carbon-design-system/carbon-components-svelte/actions/workflows/release.yml) publishes the new version to NPM.

### Post-release checklist

After the release is on NPM:

1. Create a [new release](https://github.com/carbon-design-system/carbon-components-svelte/releases/new) on GitHub. Click "Generate release notes" to list changes by commit with PR and author metadata. Drop notes that do not matter for the release (for example CI-only changes).

2. Mark it as the latest release.

3. Add screenshots for the release notes. The notes mark each spot with `<!-- screenshot: ... -->`; follow [Release screenshots](docs/release-screenshots.md) to generate them.

4. On each related PR or issue, confirm the fix shipped. Future readers will want to know which version picked it up.

```md
Released in [v0.81.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.81.1).
```
