# Component guidelines

Rules for components that compose several Carbon elements, such as grids, trees, editors, boards, pickers and overlays. [CONTRIBUTING.md](CONTRIBUTING.md) applies to all code in this repository and takes precedence over this file.

- [Principles](#principles)
- [Styles](#styles)
- [API](#api)
- [Keyboard and accessibility](#keyboard-and-accessibility)
- [Motion](#motion)
- [UI text](#ui-text)
- [Icons and pictograms](#icons-and-pictograms)
- [Async states](#async-states)
- [Timing](#timing)
- [Svelte](#svelte)
- [Design checks](#design-checks)
- [Performance checks](#performance-checks)
- [Pull requests](#pull-requests)

## Principles

- Match Carbon's design. Where this library can improve behavior, developer experience or speed, improve it.
- Carbon React's behavior is evidence, not the rule. Where it contradicts the WAI-ARIA APG or these guidelines, follow them and say so in the pull request (for example, disabled menu items stay focusable).
- If a rule, test or budget blocks a better design, change the rule in the same pull request and give the reason.
- Add no runtime dependencies. Ship optional code from a separate entry point, as `carbon-components-svelte/syntax` does.
- Support performance claims with measurements, for example "1.5 ms per arrow key at 10,000 rows; 6 ms at 4x CPU throttling".
- Build the smallest version that tests the design. List what is deferred and why.

## Styles

### Reuse Carbon classes

Before you write CSS, look for a Carbon block whose rules you can use unchanged. Use a class only if you want all of its rules.

- Grids and tree tables: use DataTable's classes and its `headers` shape. Write row headers as `<td role="rowheader">` so DataTable's `td` rules for padding, zebra, hover and selected state apply. A `<th scope="row">` needs all four restyled.
- Lists in a panel: use the ListBox classes. The menu classes are for a popup (absolute position, shadow, hidden until open). Override the position in the component's partial.
- Anchored panels: use Popover or Toggletip. Their caret centers on targets of any size.
- Drawers and full-height overlays: use the dialog lifecycle, scroll lock and focus trap from SidePanel and the modals. Use ActionSet for the buttons.
- Page and table toolbars: use DataTable's Toolbar layout (`bx--table-toolbar`). Items fill the toolbar's height with no inner padding, and a search field's bottom border is the toolbar's bottom edge. A toolbar inside a field, such as a text editor's, keeps field-sized buttons and leaves the field's focus ring visible.
- Content surfaces: use `Layer` and `Tile`. For content, use `Tag`, `UserAvatar` and `OverflowMenu`.
- If a component includes parts you do not need (Slider renders a label row and a number input), import its helpers and custom properties instead of the component.

### Tokens

[Custom styles](CONTRIBUTING.md#custom-styles-patching-carbon-v10) in CONTRIBUTING has the full list. Summary:

- Use the `bx--` BEM classes in markup.
- Use theme tokens for color (`$layer`, `$text-primary`). The `$ui-01`-style names fail `tests/css/v11-tokens.test.ts`.
- Use contextual color tokens (`$layer`, `$field`, `$border-subtle`) so a surface changes with its `Layer`.
- `*-selected`, `*-hover` and `*-active` tokens mark states. Do not use them as surface colors.
- Show a status (error, warning, success, info) with one color everywhere it appears in a component. Pair the color with a cue that does not depend on color: text or a shape. Do not add a second badge or icon for the same status.
- Categorical colors, such as event or tag categories, use a fill and one accent (a bar or a dot) in the same hue. Add a border only under `forced-colors: active`, where fills disappear.
- Search matches use `$highlight`. The current match adds a 2 px `$focus` outline. Do not reuse a style the content can produce itself, such as inverse text.
- Sizes: `to-rem(Npx)` or `$carbon--spacing-01` to `-13`. Borders and outlines of 1 or 2 px stay in `px`.
- Type: `type-style("…")`. Motion: `$duration--*` with `motion(…)`.
- List each transitioned property. Do not transition the focus ring.
- Stacking above the page: `z("floating")` and related keys.
- Custom properties that this library adds use the `--ccs-*` prefix. Use a theme token if one exists. If none fits (there is no text-safe yellow or orange), use Carbon palette values, one set for light themes and one for dark.

### Spacing

- Use the spacing scale for all gaps, padding and sizes: 2, 4, 8, 12, 16, 24, 32, 40, 48 px and up.
- The gap between groups is at least twice the gap between items in a group, measured between visible content (text and icon ink), not between element boxes. Do not use one gap for every item in a row.
- Columns of monospace content (line numbers, timestamps, levels, ids) have fixed widths in `ch`, so values line up across rows. A `ch` width does not include letter spacing, and Carbon's `code-01` and `code-02` styles add 0.32 px per character. Set `letter-spacing: 0` on those columns.
- Use the row heights of the most similar component's [size family](CONTRIBUTING.md#carbon-v11-size-aliases): DataTable sizes for grids, ListBox sizes for fields. Accept the family's aliases.
- Repeated rows of one shape have one pitch, and it is a multiple of 4 px. Rows with optional or wrapping content share one minimum height and one padding instead. Rows that overlap by 1 px to share a border move 1 px off the grid per row.
- A grid uses at most two line styles, for example hour lines and day lines, both `$border-subtle`. Show extra guide lines only during an interaction such as a drag.
- Rows of form fields use fixed widths for every column except the last, so fields line up across rows. Only the last column grows.
- Columns in a board or a grid keep their width when content changes. Set a fixed or minimum and maximum width; long content wraps or truncates inside the column. A column that shows numbers, dates or ids is at least as wide as its widest value; it grows past a consumer's width before it cuts a value.
- Parts that move inside a component, such as slider thumbs and drag handles, stay inside the component's box at every value.
- Content outside a fixed range, such as a bar past the end of a time axis, is clipped at the range edge and marked as continuing.
- Decorative layers (highlights, overlays, rings drawn with pseudo-elements) set `pointer-events: none` so they never take a click.
- Show nesting with an indent and a 2 px inline-start rule (`$border-subtle`). Do not put a bordered box inside another bordered box. Nested levels then share the outer level's inline-end edge.
- Page-level surfaces use `$background`, with fields on `$field`. Panels and narrow overlays use `$layer`.

### Alignment

Align what the eye sees: the ink of glyphs and icons, and text baselines. Element boxes include padding that the eye does not see.

- Content in a toolbar or header starts at the same inline edge as the rows below it. The first icon's visible edge and the first character of the first column share one x.
- Centered content aligns on a shared center axis. A centered column header and the centered value below it, such as a weekday and its date in a circle, share one center.
- Icons side by side have the same optical size. Draw them on the same artboard (16 px) with a similar ink extent. A letterform icon such as "Aa" that fills less of its box reads smaller than an arrow beside it.
- Text in adjacent controls of one row shares a baseline. In a flex row with mixed type sizes, use `align-items: baseline`. Align on the baseline only when every item starts with text. An item that starts with an icon takes its baseline from the icon; align those rows to the top.
- Text the user writes (log lines, messages, editor paragraphs, search queries) reads in its own direction on a page of the other direction. Blocks of text get `dir="auto"`. Text inputs get `unicode-bidi: plaintext`, which keeps the field's padding and icons on the page's sides.
- Center an icon on the text beside it. A 16 px icon next to `body-compact-01` text centers in the 18 px line.
- Fields in a row align to the top of their field box. A message under one field does not move its neighbors. To center a shorter control, such as a toggle, center that control; do not center the field wrappers.
- Align numbers by place value: right-align numeric columns and use `tabular-nums`.
- Check alignment on a 2x screenshot. Edges that should line up differ by at most 0.5 CSS px.

### Type

- Use the productive type styles in components: `body-compact-01` for UI text, `label-01` for labels and helper text, `heading-compact-01` and `-02` in panels, `code-01` and `-02` for code. Use expressive styles only on marketing-style surfaces.
- Text is at least 12 px (`label-01`), including tags, counts and timestamps.
- Numbers that change or stack in a column use `font-variant-numeric: tabular-nums`. Right-align numeric columns. Wrap a formatted number in `<bdi>` with the direction of the locale that formatted it.
- Use the monospace family for values people copy or compare: ids, hashes, keys, paths, versions, log lines.
- Each text slot either wraps or truncates, and the component documents which. Labels, menu items and error messages wrap. Single-line cells and tags may truncate. Error messages never truncate.
- Use `text-wrap: balance` on headings and `text-wrap: pretty` on body text.
- Body text in long descriptions is at most about 70 characters per line, about 480 px of `body-compact-01`. A `70ch` width holds about 88 characters of IBM Plex Sans, so set the width in px or rem.
- Show an empty value as an em dash with an accessible name ("None"). Do not leave a cell blank.
- Join a number and its unit with a non-breaking space: "12&nbsp;GB".

### Behavior

- Change layout for narrow screens with CSS breakpoints. Do not change state, such as a view, a page size or `open`, from the viewport width in JavaScript: the server cannot know the width, and the change overwrites a bound prop.
- `size`, `kind`, `invalid`, `warn`, `disabled`, `readonly`, skeletons and `Layer` work as in related components. Form controls pass `tests/form-field-contract`.
- A disabled component shows every part as disabled: text in `$text-disabled`, icons in `$icon-disabled`, no hover, and no focus on its items. It disables its own controls; for slotted content, it sets `inert` on the slot region or documents that the consumer disables it. A read-only component keeps its text color and blocks changes. An unavailable item inside an enabled composite (a menu item, a toolbar button) is a different case: it stays focusable with `aria-disabled`.
- Where an alignment rule conflicts with the built-in layout of a Carbon component used inside, such as a field label's position, keep the Carbon layout and say so in the pull request.
- Overlays move to a portal when a container would clip them. A container with a `transform` or `content-visibility: auto` also clips in-place menus. Set `portalMenu` on menus inside one.
- Do not size an overlay or a panel with `100vw`: it includes a classic scrollbar, so the box runs under it. Use `100%` of the containing block.
- A titled surface uses `Section` one level below the page, so its headings nest.

## API

- **Data in, no mutation.** Take arrays and objects as props. Assign new values; do not edit the consumer's objects. Return changes through `bind:`. Examples: `rows` and `selectedRowIds` on DataTable, `nodes` and `expandedIds` on TreeView. Do not change a bound value on mount. Ids the component cannot resolve yet, such as checks under a node that has not loaded, stay in the value until their data arrives.
- **Data array with a per-item slot** for collections that need search, filtering, virtualization or reordering. A child component per item cannot be sorted or virtualized. Use child components for other cases. See [Code style](CONTRIBUTING.md#code-style).
- **Cancelable events for user actions.** Dispatch moves, pastes, sorts and closes with `{ cancelable: true }`, synchronously. `preventDefault()` cancels the action. Example: `click:overflow` on TagSet.
- **Exported helpers.** Put logic that consumers may need without the component (serialize, validate, evaluate, apply a change) in a pure function with no DOM access, exported from the package. It must run on the server. Examples: `toCsv`, `toHierarchy`, `fuzzyMatch`.
- **Actions for consumer markup.** Components cannot take actions. Put the action on a wrapper element and select the items inside it. Examples: `rovingFocus`, `dismiss`.
- **Strings as props.** Every visible or announced string is a prop. Reuse the name and signature from a related component (`*Text` props, `translateWithId`). If `translateWithId` returns no value for an id, use the English default.
- **Enums for variants** (`selectionMode`, `size`, `kind`). Use a boolean only for a true on/off state.
- **`id` prop.** Derive inner ids from `id`. Call `uniqueId()` only when `id` is unset. Do not build ids from consumer data: a space in an id breaks `aria-activedescendant` and `aria-controls`. Use the item's index.
- **No writes to props.** Store measured values in internal variables.
- **`$$restProps`** go on the primary element. A consumer `aria-label` replaces the default `aria-labelledby`.

### Props

These names apply to new components and new props. Shipped components keep their names; do not rename existing props without keeping the old name as an alias.

| Kind | Name | Examples |
| :--- | :--- | :--- |
| Visible text | `{part}Text` | `labelText`, `helperText`, `emptyText` |
| Text read only by assistive technology | `{part}Description` | `iconDescription`, `loadingDescription` |
| Assistive text built from values | `{part}Description` as a function with a named default | `countDescription(count, limit)` |
| Text both shown (in a `title` or tooltip) and read | `{part}Text`, or a `{part}Text` function | `colorNameText(color)` |
| Text for each state of a two-state control | one `*Text` prop per state | `onText`, `offText` |
| Text built from values | `{part}Text` as a function with a named default | `pageRangeText(start, end, total)` |
| Heading of a surface | `titleText` | A `title` prop also sets the native `title` attribute through `$$restProps` |
| On/off state | an adjective | `open`, `expanded`, `disabled`, `readonly`, `invalid`, `loading` |
| Visual hiding | `hide{Part}` | `hideLabel` |
| Name for a part with no visible label | `labelText` with `hideLabel` | A list title that only screen readers hear |
| One of several forms | a string enum | `kind` for meaning, `size` for scale, `variant` for layout form |
| One selected item | `selectedId` | |
| Several selected items | `selectedIds`, `expandedIds`, `checkedIds` | |
| Form value | `value` | |
| Collection | `items` (list), `nodes` (tree), `rows` and `headers` (table) | |
| Map from an item | `itemTo{Thing}` | `itemToString`, `itemToId` |
| Decision callback | `should{Verb}` returning a boolean | `shouldFilter` |
| Placement | `align`, in floating-ui form | `"bottom-start"`, `"end"` |

- Use `open` for content that floats above the page (menus, popovers, modals, panels). Use `expanded` for content that pushes the page (disclosures, tiles, tree rows).
- Do not use negative booleans (`prevent*`, `no*`). Name the behavior: `closeOn={["escape", "outside"]}`.
- Do not select by index. An index changes when items are sorted, filtered or reordered.
- Internal booleans are adjectives (`open`, `focused`). Reserve `is` and `has` for functions.

### Events

- Name the main state change with a verb in the present tense: `change`, `select`, `open`, `close`, `toggle`, `expand`, `collapse`, `sort`, `move`, `remove`. Dispatch it before the change when it can be canceled.
- A component with more than one bindable value dispatches `{noun}:change` for each, with the noun in kebab case: `active-cell:change`, `selection:change`.
- An event from one inner element is `{event}:{part}`, with the part in kebab case: `click:row`, `mouseenter:trigger`.
- A failure is `{action}:error`: `copy:error`, `download:error`.
- `detail` is always an object: `{ id, item }` for items, `{ trigger }` for open and close, `{ from, to }` for moves. Close triggers use the values the library already sends: `"escape-key"`, `"outside-click"`, `"close-button"`, `"programmatic"`.

### Slots

- A slot that replaces a prop's content is `{prop}Children`: `labelChildren`. Slot names are camelCase so they map to Svelte 5 snippets.
- Position slots use logical sides: `{part}Start`, `{part}End`.
- `actions` holds a group of buttons. `action` holds exactly one.
- `empty` renders when there are no items. `noResults` renders when a filter matches none. A component with both states has both slots.
- A slot for a custom trigger passes one object to spread on it, such as `let:triggerProps` with its `id`, `aria-*` attributes and handlers.

### Data props or child components

| Use a data array and a per-item slot when | Use child components when |
| :--- | :--- |
| The count is large or unbounded | The count is small and fixed |
| Items need search, filtering, sorting, virtualization or reordering | Items keep the order of the markup |
| Data comes from a server and selection is by id | Items are written by hand |
| Items have one shape | Each item is different |
| The server render must show the final state | The consumer controls layout between items |

- Combine them where it helps: a data array with a per-item slot (`let:item`), or a data array with `itemTo*` accessors so consumers do not reshape their data.
- Child components that register with a parent batch the registration (`batchStoreUpdates`). Their first-render state comes from props or `$$slots`.
- Use separate props for a few independent values (`primaryButtonText`, `primaryButtonDisabled`). Use an object when the values come from data together (`headers`). Use a slot when a group grows past about three related props.
- More than about 25 public props means the component should split into parts.

## Keyboard and accessibility

### Pattern and markup

- Choose a [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern before you write markup. Document each deviation and its reason.
- Use native elements where they fit: `button`, `a`, `input`, `select`, `dialog`.
- Give every control an accessible name. Connect helper and error text with `aria-describedby`; join multiple ids with spaces.
- Expose state with `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`, `aria-current`, `aria-invalid` and `aria-busy`.
- Use `aria-disabled` for items that must stay focusable while unavailable, such as menu items and toolbar buttons. Ignore their activation in the handler.

### Focus

- A composite widget (listbox, grid, tree, toolbar, tablist, radio group) has one tab stop. Arrow keys move focus inside it.
- Use roving `tabindex` when items receive DOM focus. Use `aria-activedescendant` when focus must stay in a text input, as in a combobox.
- Every focusable element shows the focus ring from `@include focus-outline("outline")`.
- Opening a dialog or panel moves focus into it. Closing it returns focus to the trigger, or to a documented fallback if the trigger was removed.
- After an item is removed, move focus to the next item, then the previous item, then the container.
- Do not move focus on hover, on timers or on data updates.
- A component that opens itself, such as a coachmark on page load, does not move focus. It moves focus only when the user opened it.

### Keys

| Key | Action |
| :--- | :--- |
| Arrow keys | Move one item. In a 2D grid, move one cell. Left and Right swap under `dir="rtl"`. |
| Home / End | First / last item. In a grid, first / last cell in the row; with Ctrl, first / last cell in the grid. |
| Page Up / Page Down | Move one visible page in long lists and grids. |
| Enter | Activate the item, or open it. |
| Space | Toggle selection or a checkbox; activate a button. |
| Escape | Close the innermost open layer and return focus to its trigger. Clear a filter only if nothing is open. |
| Printable characters | Type-ahead to the next matching item (`typeahead.js`). |
| Shift + arrow keys | Extend a multiple selection. |
| Ctrl/⌘ + A | Select all, in multiple selection only. |

- Do not bind single-character shortcuts at the document level (WCAG 2.1.4). Use `keyboard-shortcut.js` with a modifier, and scope shortcuts to the focused component unless they are documented as global.
- Every drag operation has a keyboard alternative and a single-pointer alternative (WCAG 2.5.7).
- A component that uses Tab itself, such as a text editor indenting a list, gives a documented way out (Escape, then Tab).

### Announcements and contrast

- Announce results and status with `aria-live="polite"`. Use `assertive` only for errors that block the user.
- Announce each change once. Throttle announcements for streams.
- Text contrast is at least 4.5:1. Large text, icons, focus rings, selected indicators and borders that identify a control or show its state are at least 3:1 (WCAG 1.4.3, 1.4.11). Borders that only divide the layout, such as dividers and nesting rules, may use `$border-subtle`.
- The component works at 200% zoom and at a 320 px CSS width (WCAG 1.4.10).

### Testing

- Keyboard only, for every feature.
- VoiceOver with Safari. For new ARIA patterns, also NVDA with Firefox or Chrome.
- An `e2e/a11y-<component>.test.ts` that runs axe through `@axe-core/playwright` on each state.

## Motion

- Components do not animate by default. Add motion only when it shows something the user would otherwise miss:
  - where an element enters or leaves (a panel opens, a row expands);
  - that an action completed (a copy confirmation);
  - that work is in progress (a loading indicator).
- Do not animate initial render, hydration, data updates (sort, filter, new rows) or decoration.
- A looping animation, such as a pulsing beacon, stops after at most 5 seconds or a few cycles, and stops at once under `prefers-reduced-motion` (WCAG 2.2.2).
- Measure in a `ResizeObserver` callback and write in the next frame (`createFrameJob`), so a resize does not trigger a ResizeObserver loop error.
- Durations come from the motion tokens: `$duration--fast-01` (70 ms), `fast-02` (110 ms), `moderate-01` (150 ms), `moderate-02` (240 ms), `slow-01` (400 ms), `slow-02` (720 ms).
  - Color, icon and small state changes: `fast-01` or `fast-02`.
  - Menus, expanding rows and small panels: `moderate-01` or `moderate-02`.
  - Full-height panels and modals: `slow-01` at most.
- Easing comes from `motion(standard | entrance | exit, productive)`. Use `entrance` for elements that appear and `exit` for elements that leave. Use `expressive` only on marketing-style surfaces. Where the Carbon component it mirrors uses `expressive`, match Carbon.
- Animate `transform` and `opacity`; they do not trigger layout. Animate a size only on the one element that expands.
- Elements that move together use the same duration and easing.
- Transitions are interruptible. A close during an open reverses from the current position.
- Do not depend on `transitionend` to finish a state change. It does not fire when the duration is 0 or the element is hidden. Use a timeout fallback.
- Under `prefers-reduced-motion: reduce`, remove movement: set durations to 0 for transforms, slides and smooth scrolling. Loading indicators may keep moving, since the motion shows state.
- Motion started from JavaScript (`scrollIntoView({ behavior: "smooth" })`, the Web Animations API, View Transitions) checks `matchMedia("(prefers-reduced-motion: reduce)")`. CSS media queries do not apply to it.

## UI text

Follow [Carbon's content guidelines](https://carbondesignsystem.com/guidelines/content/overview/).

- Use sentence case for labels, buttons, headings, menu items and tooltips.
- Buttons and menu items start with a verb: "Delete", "Add rule", "Export as CSV".
- Labels name the value: "Region", "Retention period".
- Placeholders show a format or example. A placeholder does not replace a label.
- Helper text states the constraint in one sentence: "Lowercase letters and hyphens, up to 63 characters."
- Helper text sits below its field, as in Carbon. For a tall group of rows (such as a query builder), it sits under the group's label, before the rows.
- Error text states the problem and the fix: "Enter a port from 1 to 65535." Do not use "Invalid input" or an error code alone.
- Empty states say why the area is empty and give the next action.
- Destructive confirmations name the object and the result: "Delete 3 services? You cannot undo this." The confirm button repeats the verb: "Delete".
- Accessible names for icon-only controls describe the action: "Close", "Remove Austin". Do not include the icon name or the word "button".
- Build text that contains numbers with a function prop that receives the values, for example `pageRangeText(start, end, total)`. Translators then control word order and plural forms. Do not concatenate strings.
- Format numbers, dates, lists and units with `Intl`, through `intl-formatter-cache.js` and the component's `locale` prop.
- Truncated text keeps the full value available in a tooltip or `title`.
- When space runs out, drop content in a fixed order: secondary details first (a time, a count, metadata), then shorten the title with an ellipsis, then show no text and keep the full text in the accessible name and a tooltip.
- Never cut a number, date, time or id in the middle. Show it whole or leave it out.

## Icons and pictograms

- Consumers pass icons from `carbon-icons-svelte` through `icon` props typed `IconComponent`. Components use the internal set in `src/icons/`. Do not add an icon package dependency.
- Use 16 px icons in components. Use 20 px in the UI shell header.
- Color icons with icon tokens: `$icon-primary`, `$icon-secondary`, `$icon-on-color`, `$icon-disabled`. Status icons use `$support-*` tokens.
- Hide decorative icons from assistive technology with `aria-hidden="true"`. This includes icons next to text that says the same thing.
- Icon-only controls get their name from `iconDescription` and show the same text in a tooltip, unless the control opens a popover that shows that text.
- Do not show status with color alone (WCAG 1.4.1). Combine color with a shape and text, as `IconIndicator` and `ShapeIndicator` do.
- Use one icon per meaning across the library, for example `Close` to dismiss and `TrashCan` to delete.
- Mirror icons that point forward or back in right-to-left layouts. See [Conventions](CONTRIBUTING.md#conventions).
- Use pictograms from `carbon-pictograms-svelte` only for empty states and onboarding, in a slot such as `EmptyState`'s `illustration` slot. They are decorative and hidden from assistive technology. Do not use pictograms as controls or inline with text.

## Async states

### Choose the indicator

| Situation | Indicator |
| :--- | :--- |
| First load of a region | The component's skeleton, at the size of the loaded content |
| Refresh of loaded data | Keep the current content. Set `aria-busy="true"` on the region and show `InlineLoading` or a `ProgressBar` in a fixed slot. |
| Action on one control (save, copy, submit) | `InlineLoading` in the control, for example Button's `loading` prop. The control keeps its size. |
| Whole page blocked | `Loading` overlay. Use it only when no part of the page is usable. |

### Avoid flicker and layout shift

- Show an indicator only if the operation runs longer than about 300 ms. Once shown, keep it for at least 500 ms. Use `createLoadingDelay` (a callback, for a `loading` prop inside a component) or `delayedLoading` (a store) from `delayed-loading.js`. Button, Dropdown, ComboBox, MultiSelect, Search and SearchMenu take `loadingDelay`, wired through `createLoadingIndicator`; Loading and InlineLoading take `delay` and render a waiting spinner hidden, so server HTML holds it. The defaults are `LOADING_DELAY_MS` and `LOADING_MIN_DURATION_MS`. A delayed indicator blocks clicks and sets `aria-busy` at once; only the visual waits.
- Reserve space for indicators, status text and error messages so that showing them does not move other content. Field error text replaces helper text in the same row.
- Insert new items without moving the content the user is reading. Keep the scroll position anchored, or show a "Show N new items" control instead of inserting above the viewport.
- Render the loading state on the server when data is not available at render time. Do not replace server HTML with a client-only spinner.

### Requests

- Give each request an id or an `AbortSignal`. Ignore responses for requests that a newer request replaced. Pass an `AbortSignal` to consumer callbacks that fetch data.
- Debounce requests driven by typing with `debounce.js`. The input stays responsive while a request runs.
- On failure, show the error where the operation failed, with a retry action. Keep the data already loaded.
- Optimistic updates apply at once and roll back on failure with a message. A cancelable event lets the consumer reject a change before it applies.
- While a control is busy, use `aria-disabled` and ignore activation, so focus stays on it. `disabled` removes it from the focus order.
- Announce the result once ("12 results"). Do not announce intermediate states.

## Timing

Delays and thresholds separate what the user means from incidental movement, and keep the page still while the user acts.

### Constants

Put every default delay in `src/constants/timing.js`, named `*_MS`, with a JSDoc comment that gives the reason. Reuse an existing constant when the purpose is the same.

| Constant | Value | Purpose |
| :--- | :--- | :--- |
| `TOOLTIP_ENTER_DELAY_MS` | 100 ms | Hover or focus time before a tooltip opens |
| `TOOLTIP_LEAVE_DELAY_MS` | 300 ms | Time before a `Tooltip` closes, so the pointer can move onto it |
| `TOOLTIP_ICON_LEAVE_DELAY_MS` | 100 ms | The same for icon tooltips (WCAG 1.4.13) |
| `TOOLTIP_SKIP_DELAY_MS` | 300 ms | Window after a tooltip closes in which the next one in its group opens with no delay or fade |
| `SUBMENU_HOVER_DELAY_MS` | 150 ms | Hover time before a submenu opens or closes |
| `SEPARATOR_HOVER_DELAY_MS` | 150 ms | Hover time before a `Splitter` separator highlights |
| `TYPEAHEAD_RESET_MS` | 500 ms | Idle time before a type-ahead buffer resets |
| `SUBMENU_AIM_PAUSE_MS` | 100 ms | Pause that ends pointer aim toward an open submenu |
| `LOADING_DELAY_MS` | 300 ms | Time `loading` stays `true` before an indicator shows |
| `LOADING_MIN_DURATION_MS` | 500 ms | Minimum time an indicator stays once shown |
| `NOTIFICATION_QUEUE_COLLAPSE_MS` | 150 ms | Time before the space a closed toast held under the pointer collapses |
| `STEPPER_REPEAT_DELAY_MS` | 400 ms | Hold time before a stepper button starts to repeat |
| `STEPPER_REPEAT_INTERVAL_MS` | 50 ms | Time between steps while a stepper button stays held |

### Intent

- Open on hover only after a delay, and close after a grace period. An open and a close cancel each other's pending timer. See `submenu-hover-intent.js` and `tooltip-handoff.js`.
- When one item in a group is already open, open the next one at once (warm handoff). Tooltips do this within `TOOLTIP_SKIP_DELAY_MS`.
- While the pointer moves toward an open submenu, hold the close and any sibling's open. Recheck when the pointer pauses for `SUBMENU_AIM_PAUSE_MS` (`pointer-aim.js`).
- Start a drag only after the pointer moves a few pixels from the press. A smaller movement is a click.
- On touch, open a context menu after a press of about 500 ms with less than about 10 px of movement. Cancel on larger movement so the page still scrolls.
- Run actions on release inside the target. Moving off the target before release cancels the action (WCAG 2.5.2).
- Apply hover delays only to pointers that can hover (`(any-hover: hover)`). A tap toggles.

### Feedback

- Show a pressed, selected or busy state within 100 ms of every input, even when the result takes longer.
- Match the indicator to the expected wait:

| Wait | Indicator |
| :--- | :--- |
| Under 300 ms | None |
| 300 ms to 2 s | Indeterminate indicator, held for at least 500 ms once shown |
| 2 s to 10 s | Determinate progress or named steps, when known |
| Over 10 s | Progress with an estimate, and a way to cancel or continue elsewhere |

- Delaying the indicator is opt-in per component (Button's `loadingDelay` defaults to 0). Components show it at once by default.

### Stability

- Do not insert, remove or move content next to the control under the pointer. Hold the change until the pointer leaves the region or the user scrolls.
- While a change is held under the pointer, announce it to assistive technology at once, and show it as soon as the pointer leaves.
- A do-not-disturb mode stops announcements and anything that opens by itself. It still updates counts.
- A counter next to controls ("3 of 12") uses `tabular-nums` and reserves the width of its largest value, so the controls after it do not move.
- A live list (logs, feeds, notifications) stops following new content when the user scrolls away from the end, and shows a control to return to it.
- A layout that collapses items into an overflow menu collapses at one width and expands at a larger one, so a width near the boundary does not toggle it on every resize. Fields shrink to a minimum width (about 8 rem) before any button collapses, since a field cannot move into a menu. The row never scrolls.

### Input pacing

- Debounce requests driven by typing (150 to 300 ms) with `debounce.js`. Respond to the first keystroke at once when the work is cheap.
- Run scroll, resize and drag work at most once per frame (`raf-throttle.js`, `createFrameJob`).
- A held stepper or arrow key repeats after an initial delay of about 400 ms, then at a faster rate.

### Validation

- Show a field error on blur or on submit. While a field shows an error, check again on every input and clear the error as soon as the value is valid.
- Do not report an empty field the user has not visited until submit.

### Time limits

- A component that sets its own auto-dismiss time makes it grow with the length of the message, with a minimum. Components leave `timeout` to the consumer by default; the docs advise a minimum of about 5 seconds plus reading time for the message, which depends on the language. A notification with an action does not auto-dismiss (WCAG 2.2.1).
- Pause auto-dismiss while the pointer is over the notification, while it has focus, and while the tab is hidden (`pause-on-hover-focus.js`, `timeout-dismiss.js`).
- For an action the user can reverse, run it at once and offer Undo. Ask for confirmation only before an action that cannot be reversed.

## Svelte

[Code style](CONTRIBUTING.md#code-style) has the general rules: the legacy API on Svelte 3, 4 and 5, script order, `class:` and `style:` directives, keyed `{#each}` over ids, no new `afterUpdate`, and state per instance.

### Shared utilities

Check `src/utils/` before you write a helper.

| Need | Utility |
| :--- | :--- |
| Drag with pointer capture | `pointer-drag.js` (Splitter, RangeSlider, SidePanel) |
| Element size and visibility | `observeResize`, `observeIntersection` in `shared-observer.js` |
| Batched layout reads and writes | `createFrameJob` in `frame-batch.js` (TextArea, Menu) |
| Virtualized lists | `VirtualList`, `virtualize.js`, `virtual-window.js` |
| Roving focus and type-ahead | `roving-focus.js`, `typeahead.js`, `option-list-navigator.js` |
| Search and match ranges | `fuzzyMatch`, `highlightSegments` |
| Outside click and Escape | `dismiss.js`, `outside-dismiss.js`, `is-outside-click.js` |
| Dialogs | `dialog-lifecycle.js`, `trap-focus.js`, `body-scroll-lock.js` |
| Text direction and placement | `layout-direction.js`, `inline-align.js`, `floating-position.js` |
| Shared timers and listeners | `relative-time-timer-pool.js`, `window-listener-pool.js` |
| `Intl` formatters | `intl-formatter-cache.js` |
| Child registration | `batchStoreUpdates` in `batch-store-updates.js` |
| Keyboard shortcuts | `keyboard-shortcut.js` |

### Known issues

- With pointer capture, the `click` after a press fires on the capturing element. Read the target in `pointerdown`. In a draggable item, ignore presses that start on links, buttons and form controls, or those controls stop working.
- Svelte 5: if a `$:` block assigns a value that an earlier `$:` block reads, the earlier block does not run again in the same flush. Assign state set by a user action in the event handler.
- Svelte 3 and 4: `bind:value` with a spread on a `<textarea>` that has text content resets the value. Set the value only through `bind:value`.
- A function called in the markup (`{#if}`, `{#each}`, `{@const}`, attribute values) that reads component state must receive that state as arguments. Svelte tracks only the names written in the expression, so the function does not run again when the state changes. This fails on Svelte 3, 4 and 5.
- A `<bdi>` or an element with its own `dir` resolves logical properties (`margin-inline-start`, `auto` margins) in its own direction. Put layout margins on its parent.
- `cursor` or `user-select` on a large container restyles every descendant. Set it on the dragged item, or on an element with `contain`.
- A virtualized list cannot be a live region because rows mount and unmount on scroll. Set `aria-live="off"` on the list. Announce summaries from a separate status element, at most once per interval.
- Thousands of tags mount slowly. Render a limited number and show the rest as a count.

## Design checks

Complete every check before you mark a pull request ready for review.

### Visual

Measure positions and sizes in the browser (`getBoundingClientRect`, computed styles). A scaled screenshot gives wrong numbers. In e2e tests, use the helpers in `e2e/helpers/layout.ts` (`expectAligned`, `expectOnePitch`, `expectTextFits`, `expectNoNestedBorders`, `expectNoPageOverflow`, `expectSingleRing`); see [E2E testing with Playwright](CONTRIBUTING.md#e2e-testing-with-playwright).

| Check | Method |
| :--- | :--- |
| Carbon spec | Compare with Carbon's spec at the same size and theme. Carbon React's Storybook is a working reference. Record each intentional difference and the reason. |
| States | One fixture shows every size with every state (`invalid`, `warn`, `disabled`, `readonly`, skeleton), with one field invalid beside valid ones in the same row, and with zero, one and many items. Review them together. |
| Themes and layers | White and Gray 100 at minimum. `Layer` nested to level 3. |
| Right to left | Test with `dir="rtl"`, using sample values that read differently when reversed ("3 / 4", never "3 / 3"),, `dir="ltr"` and no `dir`. Forward and back icons mirror. Inline-axis arrow keys swap. Time and progress run toward the inline end. Add a row to `e2e/rtl.test.ts`. |
| Forced colors | Chromium with `forced-colors: active`. Draw rings only on the focused or selected item; a ring on every cell hides which one is active. Structural edges, such as a card's 1 px border or a field's resting box, stay: without them a field or card disappears in forced colors. The focus ring is wider than those edges so it stands out. Show selection with a `Highlight` border; forced colors remove background fills. Draw lines with `CanvasText`. Draw progress as an element with a system color; forced colors remove `background-image`. `forced-color-adjust: none` inherits, so set it on one element only. Add a row to `e2e/forced-colors.test.ts`. |
| Narrow containers and long text | 320 px viewport, a narrow panel, and long words, URLs and log lines. See `e2e/long-words.test.ts` and `e2e/reflow.test.ts`. |
| Adjacent components | Render beside related components at each size. Heights and baselines must align. |
| Consumer overrides | A consumer rule with one class overrides the library rule. See `e2e/consumer-override.test.ts`. |
| CSS | Run `bun run check:css:compare --report <dir>` and approve intended changes. Run `bun run check:css:size`. See [Size growth](CONTRIBUTING.md#size-growth). |

### Interaction and accessibility

| Check | Method |
| :--- | :--- |
| Keyboard | Use every feature without a pointer, following [Keyboard and accessibility](#keyboard-and-accessibility). Focus stays in the component after a delete, a disable, or a virtualized unmount. |
| ARIA pattern | The pull request names the APG pattern and each deviation. Example: color swatches use `listbox` because in a `radiogroup` arrow keys select each swatch they pass. |
| Screen readers | Test with VoiceOver, and NVDA for new patterns. Add a case to `tests/aria-forwarding/cases/`, or an exemption with the reason. Add an axe test in `e2e/a11y-<component>.test.ts`. |
| Target size | At least 24 × 24 px (WCAG 2.5.8), or a documented exception. |
| Touch | Works with touch input. Controls that appear on hover also appear on focus, and always appear under `(any-hover: none)`. |
| Motion | Each animation has a reason from [Motion](#motion). Test with `prefers-reduced-motion: reduce` emulated in Chromium. |
| Text | Markup contains no hard-coded English. Strings follow [UI text](#ui-text). |
| Icons | Decorative icons are hidden from assistive technology. Status uses color, shape and text. See [Icons and pictograms](#icons-and-pictograms). |
| Async | Throttle the network in DevTools and test first load, refresh, slow response, failure and a superseded request. Nothing moves when an indicator appears. See [Async states](#async-states). |
| Timing | New delays live in `src/constants/timing.js`. Nothing moves under the pointer while the user acts. See [Timing](#timing). |

### Server rendering and layout shift

| Check | Method |
| :--- | :--- |
| Server HTML is final | A `*.ssr.test.ts` using `renderSSR` shows selection, sizes and classes in the server HTML. Derive first-render state from props and `$$slots`. Child registration does not run on the server. See [Server rendering tests](CONTRIBUTING.md#server-rendering-tests). |
| Hydration | A `*.hydrate.test.ts` with empty `diffIgnoringIds`, `identity.pct` of 100, empty `settledDiff` and no `brokenRefs`. See [Hydration tests](CONTRIBUTING.md#hydration-tests). |
| No shift on mount | Add a case to `e2e/ssr-layout.test.ts`. For components that measure and collapse content (overflow menus, fitted toolbars), record CLS with a `layout-shift` `PerformanceObserver`. Maximum 0.005. |
| Skeleton size | Add a case to `e2e/skeleton-swap.test.ts`. The skeleton and the component have the same height. |
| SSR smoke test | `tests/ssr-smoke.ssr.test.ts` passes. Add children that need a parent context to `NEEDS_PARENT`. |
| Stable ids | Server and client generate the same ids. See `tests/SsrLayout/StableIds.ssr.test.ts`. |

### Dates and times

- Store dates as instants. Compute the day and time with `Intl` and an optional IANA `timeZone`.
- Store all-day ranges as day numbers from local date parts. The range then covers the same days in every time zone and across DST changes.
- Document whether `end` is inclusive or exclusive.
- On 23- and 25-hour days, lay out the grid by local clock time. Keep an event's elapsed duration when it moves.

## Performance checks

### Order

1. **Count calls first.** To show that work does not run, count the calls. Assert zero calls for equal input and one call for changed input. See [Counting redundant work](CONTRIBUTING.md#counting-redundant-work).
2. **Time in production mode.** Run `bun run test:perf <file>`. Svelte 5 dev mode inflates timings 5 to 10 times.
3. **Benchmark pure functions.** Add a case to `bench/` and run `bun run bench:ab`. See [Performance benchmarks](CONTRIBUTING.md#performance-benchmarks).
4. **Measure layout and frames in a browser.** Build for production. Use Playwright with Chromium. Alternate base and change runs, report medians, count layouts with CDP, and repeat at 4x CPU throttling. See [Measuring in a browser](CONTRIBUTING.md#measuring-in-a-browser).
5. **Check for leaks.** Mount and unmount in batches. Compare listener counts and heap size between batches.

### Targets

Report these values in the pull request. Give the data size for each value and the size at which the target is no longer met.

| Interaction | Laptop | 4x CPU throttling |
| :--- | :--- | :--- |
| Key press (arrow keys, type-ahead) | < 4 ms | < 16 ms |
| Scroll and drag | 1 frame; no long tasks; no blank frames | Same |
| Open, expand, filter | < 50 ms | < 200 ms |
| Streaming append (logs, messages) | p99 frame time ≤ 16.7 ms | Report |
| Mount at the largest expected size | Report | Report |

### Techniques

- **Virtualize** unbounded lists. Render rows beyond the viewport so the browser does not show blank space during fast scrolls. Increase overscan when a large batch of rows arrives. Compute visible rows from the viewport; overscan rows are outside it.
- **Keep the active item mounted.** It holds focus and the tab stop. With frozen rows or columns, compute the scroll position and call `focus({ preventScroll: true })`.
- **Iterate the rendered rows.** Build per-cell maps and lookups from rendered rows only.
- **Share resources.** One observer per type, one timer per interval, one window listener per event type, one live region.
- **Batch layout.** Read sizes from `ResizeObserver` entries. Do not read `offsetWidth` in a loop. Group reads and writes with `createFrameJob`.
- **Defer work.** Run O(n) work only while the component is open or hovered. Build hidden content when it first opens, then keep it.
- **Update incrementally.** After an edit to a large document, reprocess the changed part. Reprocess the whole document when input pauses. Record undo entries at the start of each typing burst.
- **Use plain markup per item** when a child component would render once per item in an unbounded loop. See [Per-item children](CONTRIBUTING.md#per-item-children).
- **Use `Set` and `Map`** for membership. Iterate ids in `{#each}`. Compare values in `$:` guards; Svelte treats new objects as changed. Batch child registration. See [Batching child registration](CONTRIBUTING.md#batching-child-registration).
- **Cache `Intl` objects.** The first `Intl.Segmenter` on a page takes about 12 ms to create.
- **Avoid live `Range` objects** and page-wide `MutationObserver`s. Register `StaticRange`s with the CSS Custom Highlight API.

## Pull requests

- Open the pull request as a draft, titled `feat(<scope>): add <Component>`.
- Start the description with a usage example. Then list **Findings**: what the work showed, with measurements where they exist.
- Add a screenshot table: White and Gray 100, then right to left and forced colors. Add 320 px if the layout changes.
- For a design change with several parts, use one commit per part and post one comment per part: the rule it applies, quoted with its section, and before and after crops at 2x of the same region.
- List deferred work and the reasons.
- Follow the [New component checklist](CONTRIBUTING.md#new-component-checklist) and [Example conventions](CONTRIBUTING.md#example-conventions). Use `Stack` and `Box` for layout in examples.
