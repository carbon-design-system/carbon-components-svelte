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

This installs root and docs dependencies and generates TypeScript definitions and `docs/src/COMPONENT_API.json`.

Component documentation lives in `docs/`. The site uses [Vite](https://vite.dev/), [Routify 3](https://routify.dev/docs), Svelte 5, and MDsveX. The Vite config resolves `carbon-components-svelte` to the repository root, so edits under `src/` show up in the docs without a separate package link.

To preview the docs site locally:

```sh
cd docs
bun dev
```

The site serves at http://localhost:5173/ (or the next available port).

## Best practices

Conventions used across `src/`. Follow them in new and changed code.

### Code style

Comments:

- Do not add trivial comments. If a comment restates what the code already says, delete it or improve the code instead.
- Reserve comments for non-obvious behavior: Svelte reactivity edge cases, ARIA placement, workarounds for Carbon v10 gaps. See loop guards in [`ContentSwitcher.svelte`](src/ContentSwitcher/ContentSwitcher.svelte) and the duplicate-dispatch guard in [`Checkbox.svelte`](src/Checkbox/Checkbox.svelte).

Patterns:

- Use `function` declarations in `<script>`. Declare handlers, defaults, and logic as functions rather than inline in markup. Named functions give stable references for default prop values (see `defaultShouldFilter` in [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte)).
- Avoid `afterUpdate`. It runs after every DOM update and is easy to loop in Svelte 5. Prefer `$:` reactive statements with guards, event handlers, `onMount`, or `tick()` for DOM reads. Legacy code may still use `afterUpdate` for scroll-sync or measurement; do not add new uses without a strong reason.
- When moving a `dispatch(...)` from `afterUpdate` to `$:`, timing changes. `afterUpdate` ran after the DOM commit; `$:` runs during the flush. A throwing handler can abort the rest of that flush. Update internal `prev` state first, then `tick().then(() => dispatch(...))`, and snapshot values for the callback (`const next = value`). See [`FileUploader.svelte`](src/FileUploader/FileUploader.svelte), the storage components, and [`Theme.svelte`](src/Theme/Theme.svelte). Keep cancelable, user-driven dispatches synchronous.
- Reset cached positional state (scroll offset, highlighted index, measured sizes) reactively when its source collection changes, not just on open/close. A value cached against the old list, such as a scroll position into pre-filter results, silently points past the end of the new one. Use a `$:` guard comparing against the previous length or identity.
- Do not assign to a variable that a `$:` statement derives. The next flush recomputes it from its inputs, so the manual write is dead at best and misleading at worst. Change the inputs instead. `DataTable`'s `selectAll` is derived from `selectedRowIds`; clearing the selection is enough.
- Put component-level JSDoc first (`@restProps`, `@slot`, `@template`), then **all `export let` props** (each with its own JSDoc), then **imports**, then local logic. See [`Button.svelte`](src/Button/Button.svelte) and [`Box.svelte`](src/Box/Box.svelte).
- Keep small, component-specific helpers inline in the `<script>` block. Extract to `src/utils/` only when the logic is shared across components or complex enough to unit-test in isolation. See [`debounce.js`](src/utils/debounce.js) and [`isOutsideClick.js`](src/utils/is-outside-click.js). Token primitives such as [`Text.svelte`](src/Text/Text.svelte) and [`Box.svelte`](src/Box/Box.svelte) map props to utility classes and inline styles directly; their themeable rules live in `css/_type.scss`, `css/_box.scss`, and related partials.
- Check `src/utils/` before hand-rolling a helper. Hover-intent timers ([`createDelayedSetter`](src/utils/delayed-setter.js)), index wrapping and clamping ([`moveIndex`](src/utils/move-index.js), [`clampIndex`](src/utils/clamp-index.js), `clamp` in [`numeric-format.js`](src/utils/numeric-format.js)), shared `window` listeners ([`addPooledListener`](src/utils/window-listener-pool.js)), portal tooltip gaps ([`iconTooltipPortalGaps`](src/Portal/icon-tooltip-portal-gaps.js)), value comparison ([`deepEqual`](src/utils/deep-equal.js): `Date` by time, arrays and plain objects walked, functions and non-plain objects such as `Map`, `Set`, DOM nodes, and class instances by identity), and [`noop`](src/utils/noop.js) all exist and are already used by sibling components. Confirm the edge cases match before swapping: `createDelayedSetter` runs a non-positive delay synchronously, not as `setTimeout(fn, 0)`, `clamp` checks `max` before `min`, which differs from two sequential `if`s when the bounds cross, and `deepEqual` deliberately returns `false` for two different `Map`s or DOM elements even when they look alike, since neither exposes its state as own enumerable keys.
- Prefer `||` over `??` for a fallback whose input is a possibly-empty string. `??` only substitutes on `null`/`undefined`, so a prop that defaults to `""` (`minLabel`, `maxLabel`, and similar text props) still passes the empty string through unchanged instead of falling back. `Slider`'s `formatRangeLabel` had exactly this bug (`label ?? numericValue`, shipped in a release) while the near-identical `RangeSlider` copy used `label || numericValue` and rendered correctly.
- Before extracting a helper duplicated across sibling components to `src/utils/`, diff every copy line by line. Matching names and parameter shapes do not guarantee matching behavior: copies drift as one component picks up a fix or feature the other doesn't. `Tabs`'s scroll-overflow check carries a Firefox sub-pixel epsilon that `TabsVertical`'s otherwise-identical copy never got. Extract once every copy is confirmed identical; where they've drifted, fix the bug in its own commit first, then extract. Some superficially similar helpers are not safe to merge at all: the tooltip claim/release logic in `Button`, `CopyButton`, `Tab`, `Switch`, and `UserAvatar` shares a name and purpose but differs in delay semantics per component, so leave those separate rather than forcing one abstraction.
- Forward DOM events with bare `on:click` / `on:focus` (no handler) on the underlying element ([`Button.svelte`](src/Button/Button.svelte)).
- Interpolate attribute values with Svelte's attribute syntax, not template literals: `id="{treeId}-{id}-subtree"`, not ``id={`${treeId}-${id}-subtree`}``. Keep template literals only when a value needs nested quotes or logic the shorthand can't express (see `aria-label` in [`PinCodeInput.svelte`](src/PinCodeInput/PinCodeInput.svelte)).
- Compound components use `setContext` / `getContext` with `carbon:` keys ([`CheckboxGroup.svelte`](src/Checkbox/CheckboxGroup.svelte)). For a group whose children register themselves, expose `{ items, register(item), unregister(id), update(id, patch) }` on the context, where `items` is a `writable` store of registered entries. Sort by `Node.compareDocumentPosition` at registration time, not mount order, since children can mount out of DOM order when conditionally rendered. See `UserAvatarGroup` / `UserAvatar` and `TagSet` / `Tag`. When a child needs to trigger a group-level action, such as a close button the group must react to, add a `notify*` method to the context and call it in addition to the child's own local dispatch, so the component still works standalone outside the group. Route every mutator (`register`, `unregister`, `update`) through [`batchStoreUpdates`](src/utils/batch-store-updates.js). Mixing a direct `items.update(...)` with a batched call can read a stale array. See [Batching child registration](#batching-child-registration).
- Prefer a data-array prop (`items`, `tags`) plus a per-item slot when the collection needs bulk operations that only make sense on structured data: search, filtering, virtualization, reordering (`ComboBox`, `MultiSelect`, `TreeView`). Prefer child composition, real component instances as `<slot />` children, when items are simple, independently-styled elements a consumer would reach for standalone (`Tag`, `UserAvatar`); `UserAvatarGroup` / `TagSet` register those children via context instead of taking a data array.
- Default element IDs use `ccs-${Math.random().toString(36)}`.
- Key `{#each}` blocks, for example `(item.id ?? index)` (see [`RecursiveList.svelte`](src/RecursiveList/RecursiveList.svelte)).
- Put shared logic in `src/utils/`, for example [`debounce.js`](src/utils/debounce.js) and [`isOutsideClick.js`](src/utils/is-outside-click.js). Prefer pure, DOM-free functions for layout, geometry, and state-decision math (see [`virtualize.js`](src/utils/virtualize.js)). They are unit-testable in isolation, so edge cases get covered once in a util test instead of through expensive component renders.
- ComboBox, Dropdown, and MultiSelect share listbox behavior (virtualization, keyboard navigation, outside-click) through `src/utils/`. When you change shared menu behavior, apply and test the change in all three. The per-component wiring is parallel but not abstracted.
- Use Carbon v10 markup: `bx--` BEM classes in templates; SCSS patches use `$prefix` and tokens. See [Custom styles](#custom-styles-patching-carbon-v10).
- Do not add themeable styles in per-component `<style>` blocks (see [Custom styles](#custom-styles-patching-carbon-v10)).
- Use the legacy Svelte 5 API. Components use `export let`, `$:`, and `createEventDispatcher`. Do not introduce runes (`$state`, `$derived`, `$effect`) unless the project explicitly migrates.
- Bind per-iteration values once with `{@const}` inside `{#each}` blocks, then reuse them across the markup instead of recomputing inline. See `isSelected` / `isExpanded` / `rowClassValue` in [`DataTable.svelte`](src/DataTable/DataTable.svelte) and `actualIndex` in [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte).
- Keep reactive inputs visible in `$:` and `{@const}` expressions. Svelte 3/4 track dependencies by the identifiers in the statement, so `$: x = compute()` or `{@const x = compute(item)}` where `compute` closes over other component state never re-runs when that state changes (Svelte 5's signals hide the bug locally, but the compatibility suites will not). Pass the state as arguments (`compute(item, isAtSelectionCap)`) or keep the expression inline.
- Use `Set` / `Map` for membership and id lookups instead of `.includes()` / `.find()`. The O(1) lookup matters in components that can hold large datasets. See the `selectedRowIdsSet` / `nonSelectableRowIdsSet` sets in [`DataTable.svelte`](src/DataTable/DataTable.svelte) and the `itemsById` map in [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte).
- Row virtualize and pagination bound the DOM, not derived per-row records. Walk the painted window (`rowsToRender`) when building cell maps and similar objects, not the source `rows`. Hide-mode still paints every mounted row. A four-column mount fixture will not catch rows×columns allocation. See `buildCellsForPaintedRows` in [`DataTable.svelte`](src/DataTable/DataTable.svelte).
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
- Share one observer instance across multiple targets. `ResizeObserver`, `IntersectionObserver`, and `MutationObserver` all support calling `.observe()` more than once on the same instance; do not instantiate a second observer of the same type in one component just because it watches a different element for a related purpose. Besides the redundant object, each instance typically gets its own reactive disconnect/reconnect block, and Svelte does not order independent `$:` statements, so one block's `.disconnect()` can race the other's `.observe()`. See the single `intersectionObserver` watching four sentinels in [`ScrollGradient.svelte`](src/ScrollGradient/ScrollGradient.svelte), the single `observer` watching both `wrapperRef` and `containingElement` in [`TagSet.svelte`](src/TagSet/TagSet.svelte), and the single `resizeObserver` watching both the measured `<pre>` and the scrollable container in [`CodeSnippet.svelte`](src/CodeSnippet/CodeSnippet.svelte).
- `{#if open}` vs `display: none` is a form-participation contract, not only a layout choice. Unmounted controls drop out of `FormData`; CSS-hidden ones do not. MultiSelect used CSS hide so option checkboxes survived native POST ([#1742](https://github.com/carbon-design-system/carbon-components-svelte/issues/1742)); the closed menu now unmounts like ComboBox. If you unmount a closed overlay that used to serialize, put always-mounted fields on the selection, not on the option list. Do not restore CSS hide to get form POST back.
- Do not clobber external props. Never write internal or measured values back into an exported prop. A consumer may `bind:` to a prop to control behavior, and overwriting it silently breaks that control. Measure into an internal fallback and fall back to it only when the public prop is unset. See `measuredMaxHeight` / `measuredPadding` in [`ExpandableTile.svelte`](src/Tile/ExpandableTile.svelte) and the `showMoreLess` handling in [`CodeSnippet.svelte`](src/CodeSnippet/CodeSnippet.svelte). This is the prop-facing counterpart to the `afterUpdate` guidance above.
- Wrapping an imperative library (see [`create-calendar.js`](src/DatePicker/create-calendar.js)):
  - Merge consumer callbacks with the component's own, never spread them over. `...options` after `onOpen: carbonHandler` silently deletes the component's handler, and with it whatever state it maintained. Merge at creation AND on every later update, since the library's setter replaces the whole list.
  - Check what the library returns on failure. flatpickr catches its own init errors and returns `[]`, which is truthy. Normalize a failed init to `null` at the boundary.
  - Latch async creation. If creating the instance awaits anything, a second reactive run can build another instance on the same element before the first resolves. Guard with a `creating` flag, and use an epoch counter to discard an instance that finished after a rebuild was requested.
  - Options the library reads only at creation need a rebuild path, not a setter call. Keep one `recreate*()` helper that destroys, resets the `prev*` trackers, and lets the reactive block create again.
  - Undo your own DOM moves before the library's `destroy()`. If the component relocated a library-owned node, put it back in an `onDestroy` hook first. flatpickr's teardown unwraps `calendarContainer.parentNode`, and after a relocation that was Carbon's own container.
  - Do not assume a setter is cheap or idempotent. Read it. flatpickr's `set()` always redraws, and `minDate` / `maxDate` redraw twice.
- Name internal boolean state as a bare adjective or participle (`open`, `focused`, `truncated`, `initialRender`), not with an `is`/`has` prefix. Reserve `is`/`has` for predicate functions, such as the [`isOutsideClick`](src/utils/is-outside-click.js) util, and for exported props that already use them (public API, unchanged), such as `isSelected` / `isExpanded` in [`DataTable.svelte`](src/DataTable/DataTable.svelte) and `isFluid` in [`TextInput.svelte`](src/TextInput/TextInput.svelte).
- Prefer enums over booleans for props. When a prop selects among mutually exclusive variants, or the set of variants may grow, use a string-union prop instead of several boolean flags. It keeps states exclusive and extensible. See `kind` and `size` in [`Button.svelte`](src/Button/Button.svelte). Keep booleans for genuinely binary, independent toggles such as `disabled` and `open`.
- Apply classes with the `class:` directive, not string concatenation or template literals. Use `class:bx--name={true}` for classes that are always present and `class:bx--name--modifier={condition}` for conditional ones. This keeps each class on its own line and the toggling logic readable. See [`TextInput.svelte`](src/TextInput/TextInput.svelte): `class:bx--form-item={true}` (always) alongside `class:bx--text-input-wrapper--inline={inline}` (conditional).
- Forward `$$restProps` to the most important element. When a component has a clear primary element with the most customizable props, such as the `<input>` or `<button>`, spread `{...$$restProps}` onto it so consumers can set attributes like `name`, `placeholder`, or `data-*` on the element they care about. See the `<input>` in [`TextInput.svelte`](src/TextInput/TextInput.svelte). Only when there is no such element does it go to the wrapper (top-level element), as in [`Tile.svelte`](src/Tile/Tile.svelte).
- Name slots in camelCase. No dashes: a hyphenated slot name will not map to a Svelte 5 Snippet. Use `labelChildren`, not `label-children`.
- Mirror the shadowed prop in the slot name. When a slot overrides the content a prop renders, name it after that prop. Svelte forbids a slot from matching an exported prop name exactly, so suffix it with `Children`: the `labelChildren` slot shadows the `labelText` prop. See `<slot name="labelChildren">` in [`TextInput.svelte`](src/TextInput/TextInput.svelte).
- Set dynamic styles with the `style:` directive, not inline `style` strings or template literals: `style:left="{x}px"`. See [`ContextMenu.svelte`](src/ContextMenu/ContextMenu.svelte) and the thumb position in [`Slider.svelte`](src/Slider/Slider.svelte).

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
| `@extends` | Inherit props from another component (skeleton wrappers) |
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

### Creating a component

[File an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues) first.

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

Ship docs as their own commit, separate from the `feat`/`fix` commit
that adds the behavior (which should carry its own `src/` + `tests/`
changes and nothing under `docs/`). Title a new-example commit after
the example's exact heading: `docs(slider): add "Select on focus"
example`.

#### Where docs live

| Path | Purpose |
| --- | --- |
| `docs/src/pages/components/{Component}.svx` | Main component page (for example `Button.svx`): prose + examples |
| `docs/src/pages/framed/{Component}/{Example}.svelte` | Interactive demos referenced by `<FileSource>` |

Routify picks up new `.svx` files automatically. [`docs/scripts/index-docs.ts`](docs/scripts/index-docs.ts) indexes each page and its `##` headings for search. No separate nav registration is required.

Prose conventions: see [Prose and inline code](#prose-and-inline-code) and [SVX gotchas](#svx-gotchas).

Preview locally with `cd docs && bun dev`.

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
- The body must start with a `##` heading. A leading body paragraph is re-extracted by the `heroIntro` remark plugin in [`svelte.config.ts`](docs/svelte.config.ts) and silently overrides the frontmatter `description`. When lifting an old intro, fold any trailing sentences or links into the `## Basic` prose.

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
4. Layout options (direction, light)
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

Other patterns:

- No admonitions. Fold accessibility notes and non-obvious caveats into the relevant example's prose. Do not use `> [!NOTE]` / `> [!WARNING]` / `> [!TIP]` / `> [!CAUTION]` blocks.
- Keyboard keys in prose: use `<DocKbd label="Enter" />` for named keys (`Enter`, `Escape`, `Shift`, `Ctrl`, `Space`, etc.). mdsvex auto-imports `DocKbd`; do not add a manual import. Do not use backticks (`Escape`), raw `<kbd>`, or bold (`**Enter**`). For combinations, use one component per key: `<DocKbd label="⌘" />+<DocKbd label="C" />`. Keep collective phrases as plain text ("arrow keys", "modifier keys", "keyboard navigation"). Prop values and UI copy inside component examples are out of scope (e.g. `placeholder="Enter user name..."`, `shortcutText="⌘C"`).
- Cross-links to related components: `[Modal](/components/Modal#modal-with-dropdowns)`
- Use realistic, enterprise-flavored mock data instead of generic placeholders. Avoid `Tab label 1` / `Option 2` / `Item 3`, fruit or frontend-framework lists (Apple/Banana/Cherry, Angular/React/Vue), `foo`/`bar`, and lorem ipsum. Use something concrete instead, like a deployment region, an account plan tier, a service name, an incident summary, or a workspace setting. Reuse the same sample data shapes as neighboring examples on that page, and check whether an existing theme from a sibling section already fits before inventing a new one.
  - Exception: pure layout/mechanics demos (`Stack`, `Grid`, `Box`, `AspectRatio`, breakpoint/gap/offset demos) where the label is the thing being demonstrated, such as a prop value, a breakpoint name, or an ordinal position. Abstract content (`Item 1`, `16:9`, `Offset 3`) is correct there. Forcing a business narrative onto it only obscures the mechanic. Don't rename a label that documents its own prop value (`direction="top" tooltipText="Top"`).
  - When a long string is needed to demonstrate overflow or truncation, make the content itself realistic (a file path, a log line, an error message) instead of padding a short phrase with filler.
- For layout and spacing (flex, `gap`, stacked elements), use the [`Stack`](docs/src/pages/framed/Dropdown/MultipleDropdown.svelte) component rather than raw HTML with ad-hoc inline styles. Reserve hand-written layout markup for cases `Stack` cannot express.
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
5. Preview with `cd docs && bun dev`

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
- Color: theme tokens (`$ui-01`, `$field-01`, `$support-error`, …). No hex. In `all.css` tokens compile to `var(--cds-*)` strings, so Sass color functions (`mix()`, `lightness()`, `rgba($token, …)`) and unary minus (`-$token`) silently drop the rule or no-op.
- Type: `type-style("…")`.
- Motion: `$duration--*` with `motion(standard, productive)` and friends, never a literal `ms` or `cubic-bezier()`. Never `transition: all`: list the properties, and leave out `border-color`/`box-shadow`/`outline` when they double as the focus ring so the ring snaps instead of fading.
- `will-change`: only `transform` or `opacity`, the two properties the hint can promote to a compositor layer. Not on an element that is idle most of the time, and not on one whose running animation already promotes it (skeletons).
- No `!important`. When a vendored rule or an inline style leaves no other way, add a comment naming what it has to beat.
- Focus rings: `@include focus-outline("outline")` / `("invalid")`, not a hand-written `outline`.
- Set one spelling of a box property per rule. `width` and `inline-size` (likewise `top`/`inset-block-start`, `height`/`block-size`) share a cascade slot, so the earlier one is dead; `check:css:overrides` reports it.
- `z-index`: `z("floating")`, `z("dropdown")`, … for anything that floats over the page. A literal `1`/`-1` is fine for stacking inside the component's own box.
- Breakpoints: `@include carbon--breakpoint(md)`, not a literal `min-width`.
- Custom properties: `--cds-*` is reserved for Carbon theme tokens. Properties this library invents are `--ccs-*` (and Sass globals `$ccs-*`). A few older public hooks predate this rule (`--cds-scroll-gradient-color`, `--cds-popover-offset`, `--user-avatar-group-overlap`); do not add more.

Selectors:

- Reference classes through `$prefix` (`.#{$prefix}--breadcrumb`), never a literal `.bx--…`.
- Scope every rule in a variant partial under that variant's wrapper (`.#{$prefix}--time-picker--fluid …`), including "hide by default" rules.
- State: follow the v10 base where one exists (`[data-invalid]`, `--warn` vs `--warning` differ per component upstream). For new components use modifier classes on the wrapper: `--invalid`, `--warning`, `--disabled`, `--readonly`, `--open`.
- When a rule applies only if _none_ of several states hold, have the component emit one marker class (`--neutral`) instead of chaining `:not()`.
- Do not pad specificity (repeated classes, `tag.class`, order-only `:not()`). If the rule you need to beat is in the vendored tree, edit it there. Repetition is tolerated only to preserve an existing cascade during a refactor, with a comment saying what it matches.
- Hover rules go in **one** `@media (any-hover: hover)` block per partial, at the end of the mixin. Lightning CSS only merges adjacent blocks, and `tests/css/media-query-grouping.test.ts` budgets the total. Keep any equal-specificity `:focus` rule after the block, or a hover `outline: none` will erase the ring. Two shapes stay outside the block: a suppressor that lists `X:hover` beside its own `X` to restate the resting style, and any hover rule that competes with a base hover rule the vendored tree leaves unguarded (most of them). Guarding only your half lets the base hover through on touch; guard both or neither.
- Use physical properties (`left`, `padding-right`, `height`) for new code, matching the v10 base. Several v11 backports use logical properties on the block axis; do not mix both for the same box in one rule.
- Avoid syntax Lightning CSS downlevels by duplicating the rule: `inset-inline-start`/`-end`, `border-start-start-radius` and its siblings (each expands to `:lang()` RTL twins, about 900 bytes per declaration), a selector list inside `:not()` (write `:not(.a):not(.b)`, or better a marker class), and `:is()`/`:where()`. `tests/css/downlevel.test.ts` scans the vendored tree too.
- Do not use `:has()`. It exceeds the Svelte 5 browserslist baseline (Firefox 83/Safari 14) the CSS targets, and Lightning CSS cannot prefix or polyfill it. Mark parents explicitly instead (for example a `hasLeftIcon` prop emitting a marker class). Same rule for any selector newer than that baseline, since one unknown selector invalidates the whole rule. Newer _properties_ that degrade gracefully (`text-wrap: pretty`) are fine.

Naming:

- Component variants are BEM modifiers (`bx--meter--sm`). Sizes use `--xs`/`--sm`/`--md`/`--lg`/`--xl`; a bare number (`--20`) only when the prop itself is a pixel size.
- Token utilities are `bx--{block}-{property}-{step}` (`bx--box-p-5`, `bx--type-mono`). Map v11 token names in docs and props to v10 theme variables in SCSS where needed (for example `layer-01` → `$ui-01`). Share spacing scale values through [`css/_spacing-scale.scss`](css/_spacing-scale.scss).

Document the mixin with SassDoc (`/// @access private`, `/// @group components`) and use `//` for everything else. Use double quotes. When a partial overrides a single vendored component, say in its header why it could not live in the vendored file.

#### Where a patch lives

Component-scoped patches sit at the end of the vendored component file itself (for example `css/vendor/carbon-components/scss/components/accordion/_accordion.scss`), below a `// carbon-components-svelte patch` banner — see the [vendored tree's README](css/vendor/carbon-components/README.md). This is only safe when the patch does not depend on emitting after a _later_ component's equal-specificity rules; patches that must win such source-order ties (and any partial with no single component home) stay as `css/_*.scss` partials instead.

#### Registering a partial

A `css/_*.scss` partial ships only once [`css/_carbon-styles.scss`](css/_carbon-styles.scss) imports it. That manifest is shared by all six theme entry files (`all`, `white`, `g10`, `g80`, `g90`, `g100`), so there is nothing to add to the entries themselves.

Emission order is load-bearing: equal-specificity ties resolve by source order. Slot a partial that extends one Carbon component right after that component's import; everything else is appended to the post-base block. Do not reorder that block: its order is historical but load-bearing, and the known dependencies are listed in its header. If your rule has to come after a specific neighbour to win, add it to that list.

#### Guards

| Command | Use |
| --- | --- |
| `bun run check:css --base <ref>` | Compiled-rule cascade diff against a ref. Run for any refactor that should not change output. |
| `bun run check:css:overrides` | Declarations that can never win. Also runs in CI as `tests/css/overrides.test.ts`. |
| `bun e2e/cascade-snapshot.ts` | Computed-style snapshot of the e2e fixtures. |
| `bun run check:css:usage` | Browser-measured "never wins" worklist. Evidence, not proof. |

Tests in `tests/css/` that budget the compiled sheet, each with the number to lower when you improve it:

| Test | Holds |
| --- | --- |
| `size-budget.test.ts` | Minified and gzipped size of `all.css` and `white.css`, about 2% above measured. |
| `not-chains.test.ts` | Selectors with three or more `:not()`. |
| `media-query-grouping.test.ts` | Number of `(any-hover: hover)` blocks. |
| `unrendered-classes.test.ts` | Styled `bx--*` classes nothing in `src/` renders. |
| `conventions.test.ts` | Source rules, with exact baselines for what predates them. |

Compile through `compileEntry()` from `tests/css/compile.ts`, not `compileAsync` directly. It caches per source hash so a dozen workers do not each compile the same sheet. A PR that touches `css/**` also gets a `css-cascade` job whose summary shows the rule delta and size movement against the base branch; it is informational and never blocks.

Compiled-output and source conventions are enforced by the tests in `tests/css/`. A new rule about how CSS is written or emitted should land with a test there.

When `check:css:overrides` reports a pair, work out which of the two values is the intended one before deleting anything. The checker proves the earlier declaration never wins; it does not know whether the later one is right. Deleting the flagged half of a `right: $carbon--spacing-03` / `right: auto` pair is how the fluid `CopyInput` button lost its offset.

Delete a selector family only after confirming no component in `src/` renders the class, including classes built from interpolated strings. Then add its pattern to `tests/css/unrendered-selectors.test.ts` so a vendored re-sync cannot bring it back, and drop its class from `KNOWN_UNRENDERED` in `tests/css/unrendered-classes.test.ts`.

A guard that asserts absence (`not.toMatch`, an upper bound on a count, an empty offender list) needs a positive assertion beside it that fails when the pattern stops matching: a lower bound, or a count of the declarations it inspected. Match whole declarations up to `;` instead of single lines, since the formatter wraps long values. Then break the source on purpose once and confirm the test fails.

#### Rebuild

**After editing any `.scss` under `css/`, you must rebuild CSS locally:**

```sh
bun build:css
# or, while iterating:
bun build:css:watch
```

The default build compiles only `css/all.scss` (docs, e2e, and `Theme` switching). Static sheets (`white`, `g10`, `g80`, `g90`, `g100`) are produced by `bun build:css:themes`, which release uses so the npm package still ships every entry.

The compiled `css/*.css` are **not** committed (they are gitignored) — but they are still required at runtime, so without this step your local docs site and e2e tests will use stale (or missing) styles. `bun setup` runs `build:css` once on a fresh clone, and CI/release run it on demand; neither helps an in-progress local edit.

This compiles Sass (compressed) and writes `css/*.css` plus `css/css.d.ts`. Local builds skip Lightning CSS minify/prefixing; CI and `BUILD_CSS_MINIFY=1` still run that pass. Commit only the `.scss` source — never the generated `*.css`. The small `css/css.d.ts` (module declarations) **is** committed, so type-checks resolve the CSS imports without a build; commit it too if adding or removing a theme entry changes it.

The prebundled CSS targets the [Svelte 5 browser support](https://svelte.dev/docs/svelte/browser-support) baseline (Firefox 83/Safari 14), not older browsers. Matching that baseline lets Lightning CSS drop legacy fallbacks. Author SCSS to that baseline; see the `:has()` note in [Conventions](#conventions).

### Checks

See [Best practices](#best-practices) for scoping. Run checks against what you changed. Full-repo runs are slow and surface unrelated failures.

For format and lint, scope Biome to what you touched:

```sh
# Specific paths — always lints the current working tree
bunx biome check --write src/DataTable

# Staged files only (what a commit would include)
bunx biome check --write --staged

# Files committed on this branch relative to master
bunx biome check --write --changed --since=master
```

Pick the form that matches your state. `--changed` and `--staged` resolve their file
list from git, so each sees a different slice:

- Path scoping (`src/DataTable`) lints whatever is on disk now, committed or not. Use it
  while editing.
- `--staged` lints the git index. Run it after `git add`.
- `--changed` diffs commits against the default branch. It does **not** see uncommitted
  or unstaged edits, so it reports nothing until you commit.

`bun run lint` runs Biome over the entire repository. Reserve it for broad sweeps.

For unit tests, match a pattern against test file paths instead of running the whole suite:

```sh
bun run test DataTable
```

The full suite (`bun run test`) is slow and can hit unrelated flaky UIShell focus failures. Scope to the component you touched.

Types and E2E:

- `bun test:src-types` type-checks `src/` (uses `tsconfig.types.json`)
- `bun test:src-svelte` runs `svelte-check` compiler diagnostics on `src/` (a11y, unused CSS)
- `bun test:types` runs `svelte-check` on `*.svelte` and `.ts` files in `tests/`
- `bunx playwright test --grep "Breakpoint"` runs a focused E2E pattern (see [E2E testing](#e2e-testing-with-playwright)); `bun run test:e2e` runs the full E2E suite

Two process traps:

- Read the exit code, not the tail. `bun lint:changed | tail -1` prints "No fixes applied" and exits 0 even when Biome reported errors above it. Gate commits on the checks themselves: `bunx biome check <paths> && bun run test:types && git commit ...`.
- `bun test:types` reporting that a new prop or event "does not exist" usually means the generated `.d.ts` is stale, not that the code is wrong. Run `bun build:docs` first. This bites after a rebase as well as after an API change.

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
```

Mirror `src/` component folders. Put complex setups in `*.test.svelte`, not inline in the `.ts` file.

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

#### Queries and interactions

- Prefer accessible queries: `getByRole`, `getByLabelText`, `getByText` with `exact: true` when needed ([`ComboBox.test.ts`](tests/ComboBox/ComboBox.test.ts)).
- Use `data-testid` in unit tests only when roles are insufficient. E2E fixtures use `data-testid` routinely.
- Use the shared `user` helper from [`tests/utils/user.ts`](tests/utils/user.ts) for clicks and keyboard input.
- Type fixture props with `ComponentProps<typeof Component>` from `svelte` where helpful.

#### What to test

Prioritize high-value coverage:

- Default render and primary user interactions (open, select, submit, keyboard)
- Accessibility roles, labels, and ARIA state changes
- Regressions for bugs you fix
- Boundary inputs to pure utils: zero or negative sizes, empty collections, divide-by-zero, and out-of-range indices. Assert the defined fallback (clamp, empty, identity) rather than only that it doesn't throw.
- Generic/type contracts when adding `@template` props (see below)

Skip or avoid:

- Tests that mirror implementation details without asserting user-visible behavior
- Redundant permutations of the same code path
- Large fixture setups when a focused unit test on a util suffices

Add tests proportional to the change. Not every prop variant needs its own case.

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

    expectTypeOf<Props["items"]>().toEqualTypeOf<readonly Product[]>();

    const itemToString = (item: Product) => item.text;
    expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
  });
});
```

Use `ComponentProps` and `ComponentEvents` from `svelte` for props and event payloads. For runtime smoke tests with custom item shapes, add a `*Generics.test.svelte` fixture ([`ComboBoxGenerics.test.svelte`](tests/ComboBox/ComboBoxGenerics.test.svelte)).

Common `expectTypeOf` matchers: `.toEqualTypeOf`, `.toExtend`, `.parameter(n)`, `.returns`, `.toHaveProperty`.

#### Other patterns

- `beforeEach(() => vi.clearAllMocks())` when tests use spies.
- Scope runs: `bun run test ComboBox` (see [Checks](#checks)).
- In the Svelte 5 suite, `rerender({ x: undefined })` falls back to the fixture's default for `x` instead of clearing it. To toggle an optional prop off, give the fixture a separate boolean and compute the prop from it. See `enabled` in [`DatePickerDisplayFormat.test.svelte`](tests/DatePicker/DatePickerDisplayFormat.test.svelte).
- jsdom cannot select a flatpickr date by typing plus Enter, in popup or inline mode. Click a `.flatpickr-day` or call `calendar.setDate` in unit tests, and leave typed entry to e2e.

#### Svelte 3 and Svelte 4 compatibility tests

The default `bun run test` harness uses Svelte 5. Separate workspaces under `tests-svelte3/` and `tests-svelte4/` run the same tests against older Svelte versions.

You only need these when fixing a failure reported from `bun run test:svelte3`, `bun run test:svelte4`, or their type-check scripts. Most changes do not require them.

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
| `e2e/my-component.test.ts`               | Playwright tests. Use `page.goto("/my-component.html")` in `beforeEach`, then `page.getByTestId(...)` to assert. |

Example fixture mount (`my-component.ts`):

```ts
import MyComponentFixture from "./MyComponentFixture.svelte";
import { mount } from "./mount";

mount(MyComponentFixture);
```

A few gotchas:

For components that hide content with CSS (for example ComposedModal), `toBeVisible()` can lie because the element stays in the DOM. Prefer `toHaveClass(/is-visible/)` on the container, or assert on `aria-hidden` / `inert`.

`getByText("Row 1")` also matches "Row 10", "Row 11", and so on. Use `getByRole("cell", { name: "Row 1", exact: true })` or a more specific selector when content can overlap.

Add a link to `e2e/fixtures/index.html` so the fixture is reachable from the index page.

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

Numbers from this tier are representative of real-browser V8 behavior (no jsdom involved), so it's the right tier for validating algorithmic or data-structure choices — proving a `Set`-over-`Array` change actually helps, or that a function stays O(n) instead of drifting to O(n²), with real measurements instead of a guess.

**Component tier** (`bench/*.dom.bench.ts`) mounts a real component. ostia itself is Bun-native and has no jsdom or `.svelte`-compile support built in, so this tier supplies both itself via `--preload ./bench/dom-preload.ts` (see that file) — a script that installs jsdom globals (`document`, `window`, the same `matchMedia`/`ResizeObserver`/etc. mocks `tests/utils/setup-globals.ts` uses for the unit-test suite) and registers a `Bun.plugin()` loader that compiles `.svelte` files with the Svelte compiler directly (stripping `<script lang="ts">` via `Bun.Transpiler` first, where used — `bench/fixtures/*.svelte` all use it, `src/**/*.svelte` doesn't). `ostia.config.ts`'s `bench` section points at this tier's suites/preload/jobs defaults, so running the whole tier is just:

```sh
bun run bench
```

`bench/*.dom.bench.ts` also needs `svelte`'s package.json `exports` to resolve to its `browser` condition (the client runtime) instead of `default` (the server-rendering build, which throws `lifecycle_function_unavailable` on `mount()`) — that's what the `bench` script's `--bun-flags="--conditions=browser"` is for (`ostia.config.ts` doesn't cover `bunFlags` yet, so it stays on the CLI invocation). Running a single file directly needs the same flag, since a suite file given on the command line replaces the config's `suites` list (though `preload`/`jobs` still apply from config):

```sh
bunx ostia bench --bun-flags="--conditions=browser" bench/dropdown.dom.bench.ts
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
- Always include a control case that must NOT re-run (a constant prop). If the control re-runs, the counter is measuring something else.
- Get the "before" number from the parent commit in a temporary `git worktree` with `node_modules` symlinked, not from a stash. The stash stack is shared across worktrees.
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

#### Batching child registration

Each child that calls `store.update()` during mount copies the whole registry. N children means N copies. Every `derived` or `$: ... $store` subscriber re-runs on each one. `Tabs`, `OverflowMenu`, `ContentSwitcher`, and `UserAvatarGroup` all hit this. Wrap the update with [`batchStoreUpdates`](src/utils/batch-store-updates.js) so those N calls flush once.

```js
const batchedUpdate = batchStoreUpdates(store);

function register(item) {
  batchedUpdate((current) => [...current, item]);
}
```

- Put every mutator for that store on the same queue. A direct `store.update()` in the same mount pass can read an array that is still missing a not-yet-flushed batch.
- `batchStoreUpdates` flushes on a `Promise.resolve().then()` microtask, not `afterUpdate`. A comment that warns against deferring work because of `afterUpdate` does not apply.
- `afterUpdate` still runs once right after initial mount, before the batched flush, while the store is empty. A one-shot flag set in `register()` itself gets consumed by that empty call. Set it inside the batched update function, as `Tabs.svelte` does with `needsDomSync`.
- Inside the batched updater, dedup and patch against the updater's own accumulator, not a `derived` store from outer scope. The derived store is the last flushed value, so a same-batch id looks unregistered. See `add()` in `ProgressIndicator.svelte`.
- Component-bench a new group or list's mount at a few sizes before shipping. A `performance.now()` loop around `render()` is enough to catch this.
- Matching `register()` code can still measure differently. If the consumer runs behind `tick()`, a synchronous `render()` never waits for that work. `TagSet` and `UserAvatarGroup` share a `sortByDomOrder` register shape. Only the avatar group's `$:` block runs synchronously, so only that one showed the cost.
- A Svelte child per option is still registration cost. Pagination's page list uses native `<option>` elements; page sizes still use `SelectItem` because that set is small. See [`Pagination.svelte`](src/Pagination/Pagination.svelte).

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
```

Subject line:

- Keep it concise: one line, imperative mood
- Common types: `fix`, `feat`, `docs`, `chore`, `test`, `refactor`
- Scope is the component or area; multi-word names are lowercase with dashes: `combo-box`, `code-snippet`, `data-table`, `ui-shell`, `accordion-item`
- Omit scope when the change spans many areas (`docs: …`, `chore: …`)
- Append `!` after the scope for breaking changes: `fix(accordion-item)!: …`
- `fix` is for bugs in a published release. If the buggy code was only
  ever on an unreleased commit (introduced since the last tag), use
  `chore` instead, since it never shipped as a bug
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
- Reference the issue: `Fixes #1000` or `Closes #1000` (GitHub auto-closes on merge)
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

### Sync your fork

Before you open a PR, sync your fork with upstream:

```sh
git fetch upstream
git checkout master
git merge upstream/master
```

### Open a PR

Push your branch, then open a PR comparing `<YOUR_USER_ID>/feature` to `origin/master`.

## Maintainer guide

The following applies only to project maintainers.

### Release

This library publishes to NPM with [provenance](https://docs.npmjs.com/generating-provenance-statements) via a [GitHub workflow](https://github.com/carbon-design-system/carbon-components-svelte/blob/master/.github/workflows/release.yml).

Pushing a tag that starts with `v` (for example `v0.81.1`) triggers the workflow. It runs `bun ci`, `bun build:docs`, and `bunx culls --preserve=svelte` before publishing to NPM.

Maintainers still do a few things locally before tagging.

On a clean `master` branch, run `bun run release`. That will:

- Bump the semantic version in `package.json`
- Generate notes in `CHANGELOG.md`
- Run `bun run build:docs` to update generated documentation

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

3. On each related PR or issue, confirm the fix shipped. Future readers will want to know which version picked it up.

```md
Released in [v0.81.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.81.1).
```
