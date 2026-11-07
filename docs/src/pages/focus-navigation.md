---
title: Focus navigation
layout: guide
description: Build keyboard navigation for toolbars, tab lists, listboxes, and grids with one helper, with roving tabindex or aria-activedescendant, wrapping, typeahead, right-to-left, and windowed lists.
---

`createFocusNav` is the keyboard model behind composite widgets: the single tab stop, the arrow keys that move inside it, and the keys that jump to the ends. It maps keys to an index and moves focus. It does not render, select, or scroll for you.

```js
import { createFocusNav, focusNav } from "carbon-components-svelte";

const nav = createFocusNav({ selector: "button", skipDisabled: true });
```

```svelte
<div role="toolbar" aria-label="Actions" use:focusNav={nav}>
  {#each actions as action, i}
    <button tabindex={i === $nav.tabStop ? 0 : -1}>{action}</button>
  {/each}
</div>
```

`nav` is a store of `{ index, tabStop, activeId }`. `tabStop` is the index that takes `tabindex="0"`: the active item, or the first enabled one before any item is active.

## Choose a model

| Model | Focus | Use it for |
| :--- | :--- | :--- |
| Roving tabindex (`mode: "roving"`, the default) | Moves to the item. Only the active item has `tabindex="0"`. | Toolbars, tab lists, radio-like groups, grids of buttons or links |
| `aria-activedescendant` (`mode: "activedescendant"`) | Stays on the host. The host's `aria-activedescendant` names the item. | A combobox popup, a listbox next to a search field, or a list that windows its items |

| Do | Why |
| :--- | :--- |
| Give the host `tabindex="0"` and a role in `activedescendant` mode. | The host holds focus, so it must be focusable and named. |
| Prefer roving in a grid of widgets, such as buttons or links. | A screen reader moves into the control. VoiceOver in Safari mishandles `aria-activedescendant` on `role="grid"`, so test it before you ship it. |
| Keep the active item mounted when you window a list. | An `aria-activedescendant` that names a removed element is invalid, and so is a roving tab stop that no longer exists. |

## Examples

### Toolbar

Arrow keys move between the buttons and wrap at the ends. <DocKbd label="Home" /> and <DocKbd label="End" /> jump to the first and last button. `skipDisabled` passes over disabled buttons, including a run of them. The toolbar is one tab stop.

<FileSource src="/framed/FocusNavigation/Toolbar" />

### Listbox with typeahead

In `activedescendant` mode the list keeps focus, so a search field or a screen reader's virtual cursor is never pulled away. Typing a letter jumps to the next option that starts with it, and a longer prefix stays on the option it already matches. `skip` keeps the cursor off options you cannot choose. Selection is yours: the helper only moves the cursor.

<FileSource src="/framed/FocusNavigation/Listbox" />

### Grid

Set `orientation` to `"grid"` and `columns` to the line length. <DocKbd label="ArrowUp" /> and <DocKbd label="ArrowDown" /> keep the column, so a short last line clamps and the column comes back on the way up. <DocKbd label="Home" /> and <DocKbd label="End" /> go to the ends of the line, and with <DocKbd label="Ctrl" /> to the ends of the grid. `flow` lets <DocKbd label="ArrowRight" /> carry on into the next line, which suits a picker. Leave it off for a table or spreadsheet, where the arrows stop at the ends of the line.

<FileSource src="/framed/FocusNavigation/Grid" />

### Right to left

`rtl` swaps <DocKbd label="ArrowLeft" /> and <DocKbd label="ArrowRight" />. It takes a function, which is read on each key. <DocKbd label="ArrowUp" />, <DocKbd label="ArrowDown" />, <DocKbd label="Home" />, and <DocKbd label="End" /> do not change. See [Right-to-left](/right-to-left#arrow-keys).

<FileSource src="/framed/FocusNavigation/Rtl" />

### Large grids

Render only the rows in view and keep the row with the cursor mounted. `reveal(index)` runs before every move. Scroll the target into view there, and return a promise (Svelte's `tick()`) when it needs a render to exist. Focus or `aria-activedescendant` follows once it settles. Keys that arrive meanwhile keep moving from the newest target. This grid holds 10,000 cells and mounts about 150.

<FileSource src="/framed/FocusNavigation/VirtualGrid" />

## Keys

Lists answer to the arrows of their `orientation` (`"horizontal"`, `"vertical"`, or `"both"`), <DocKbd label="Home" />, and <DocKbd label="End" />. Alt, Ctrl, and Meta combinations belong to the browser, so a list leaves them alone. Grids add the keys below.

| Key | Grid | Option |
| :--- | :--- | :--- |
| <DocKbd label="ArrowLeft" /> / <DocKbd label="ArrowRight" /> | Move within the line | `flow` carries on across lines |
| <DocKbd label="ArrowUp" /> / <DocKbd label="ArrowDown" /> | Move a line, keeping the column | `wrap` wraps the column |
| <DocKbd label="Home" /> / <DocKbd label="End" /> | Ends of the line | `home` and `end` turn them off |
| <DocKbd label="Ctrl" /> + <DocKbd label="Home" /> / <DocKbd label="End" /> | Ends of the grid | |
| <DocKbd label="Ctrl" /> + <DocKbd label="ArrowRight" /> and the other arrows | Edge of the line or column | `ctrlArrows` |
| <DocKbd label="PageUp" /> / <DocKbd label="PageDown" /> | Move `pageSize` lines | Not handled without `pageSize` |
| <DocKbd label="Alt" /> + <DocKbd label="PageUp" /> / <DocKbd label="PageDown" /> | Move `pageColumns` columns | Not handled without `pageColumns` |

Lists wrap at the ends and grids stop, which is what the WAI-ARIA patterns do. Set `wrap` to change either.

## Options

| Option | Default | Does |
| :--- | :--- | :--- |
| `orientation` | `"horizontal"` | `"horizontal"`, `"vertical"`, `"both"`, or `"grid"` |
| `columns`, `layout` | `1` | Cells per line in a grid. `layout` takes `{ lineCount, lineOf, lineStart, lineLength }` for lines of different lengths, such as sections that each start a new line |
| `wrap` | `true` for a list, `false` for a grid | Wrap at the ends |
| `flow` | `false` | Grid only. Left and Right carry on into the next line |
| `rtl` | `false` | A boolean or a function read on each key |
| `skip`, `skipDisabled` | | Items the cursor never lands on. Leave both off to let it land on disabled items, as a menu does |
| `typeahead` | off | `{ label: (index) => string }` |
| `mode` | `"roving"` | `"roving"` or `"activedescendant"` |
| `selector` | | Items inside the node, in DOM order |
| `count`, `getItem`, `getId`, `getIndex`, `reveal` | | For lists you window yourself. `count` replaces `selector`, `getItem` returns the element if it is mounted, `getId` names it, `getIndex` maps an element back to its index, and `reveal` mounts it |
| `onMove` | | `(index, { event, key, extend, from })`. Return `false` to take the move over |
| `ownsKey` | | `(event) => boolean`. Leave the key to the focused control, such as the caret keys of a text field in a toolbar |
| `shift` | `"extend"` | `"ignore"` leaves Shift+key to the element |

## Server rendering

On the server there is no DOM to query, so `selector` finds no items and `tabStop` is `-1`: every item renders with `tabindex="-1"` until the page hydrates. Pass `count` (and `skip` for disabled items) as well, and the first enabled item renders with `tabindex="0"`.

## Selection

The helper moves the cursor and never changes what is selected. When Shift is held with a navigation key, `onMove` receives `extend: true` and the helper still moves the cursor. Extend a selection from there, with the selection model of your choice, and return `false` from `onMove` to keep the cursor where it is.

| Do | Why |
| :--- | :--- |
| Keep selection in your own state or a selection model. | A cursor and a selection are separate: Ctrl+Arrow moves one without changing the other. |
| Set `shift` to `"ignore"` when the host is a text field. | Shift+Arrow selects text there. |
| Use `ownsKey` for a text field, slider, or select inside a toolbar. | The control keeps the keys it needs. |
