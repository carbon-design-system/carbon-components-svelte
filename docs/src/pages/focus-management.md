---
title: Focus management
layout: guide
description: Keep keyboard and screen reader users in place when the element that has focus is deleted, dismissed, replaced, moved, or closed.
---

When the element that has focus leaves the page, the browser drops focus to `<body>`. A keyboard user has to tab from the top again, and a screen reader loses its place. It happens when a row is deleted, a tag is dismissed, a panel closes, or a button turns into another button.

Carbon Components Svelte keeps focus for the components that remove their own controls. For removals in your own code, use `captureFocusTarget` or the `focusHandoff` action. Neither adds a dependency or an element.

## Where focus goes

When the item that holds focus is removed, focus moves to the first of these that can take it:

| Order | Target | Example |
| :--- | :--- | :--- |
| 1 | The same control, found again (`find`) | A Cancel button replaced by a Retry button |
| 2 | The same control of the next item | The Delete button of the next row |
| 3 | The same control of the previous item | The Delete button of the row above, when the last row is deleted |
| 4 | `fallback` | The button that opened a panel, or a "Reset filters" button |
| 5 | The container | The list, which gets `tabindex="-1"` |

Focus only moves when it was inside the removed item and nothing else has taken it since. An item the app removes while focus is elsewhere, such as a row that a timer drops, leaves focus where it is.

## What the components do

These components already keep focus when they remove the control that has it.

| Component | When | Focus goes to |
| :--- | :--- | :--- |
| [DataTable](/components/DataTable) | A row that holds focus is removed | The same control of the next row, else the previous row, else the table body. A table that [virtualizes](/components/DataTable#when-to-virtualize) its rows does not move focus. |
| [DataTable](/components/DataTable) batch actions | The action bar closes | The toolbar |
| [TagSet](/components/TagSet) | A dismissible tag is closed | The next visible tag, else the previous one, else the overflow button |
| [TagInput](/components/TagInput) | The last tag is removed | The text field |
| [FileUploader](/components/FileUploader) | A file is removed | The next file's remove button, else the previous one, else the add button |
| [InlineNotification](/components/InlineNotification), [ToastNotification](/components/ToastNotification), [NotificationQueue](/components/NotificationQueue) | A notification closes | The element that had focus before it |
| [Modal](/components/Modal), [ComposedModal](/components/ComposedModal), [Dialog](/components/Dialog) | The dialog closes | The element that opened it, including a button Safari did not focus on click |

## Delete from a list

Call `captureFocusTarget` right before the removal. It returns a `restore` function to call right after. `restore` waits for the update, then moves focus.

<FileSource src="/framed/FocusManagement/DeleteInList" />

`siblings` says which elements are the neighbors of the item you remove, with that item among them. It takes a selector, matched against the item's parent's children, or a function that returns the list. By default focus goes to the control in the same position as the one that had focus, so the Delete button lands on the next Delete button. Set `target` to a selector or a function when the position is not enough.

Call `restore` in the same handler, not in `afterUpdate`. Svelte 5 runs `afterUpdate` before it patches an `{#if}` or a keyed `{#each}`, so a restore from there still finds the old node. `restore` waits with `tick()` instead, which works in Svelte 3, 4, and 5, and it returns a promise that resolves to whether focus moved.

## Keep focus in a list

When many code paths remove items, put the `focusHandoff` action on the list instead. It watches the list's DOM, so it does not matter which code removes an item or when Svelte patches it. It acts only when the removed item held focus.

<FileSource src="/framed/FocusManagement/DeleteWithAction" />

Set `items` to a selector for the items when they are not the list's direct children. When the last item is gone, focus falls back to the list, which gets `tabindex="-1"` then. The action does not see the list itself being removed. Use `captureFocusTarget` for that.

## Dismissible tags

A standalone dismissible `Tag` is yours to remove, so the same action covers it. Point `fallback` at a control that stays, such as a "Reset filters" button. Inside a [TagSet](/components/TagSet), the set does this for you.

<FileSource src="/framed/FocusManagement/DismissibleTags" />

## A button that turns into another

Cancel and Retry are two elements, not one button with a new label. Pass `find` to say where the same place is after the update. If you can, keep one button and change its text and `loading` state instead, which never loses focus.

<FileSource src="/framed/FocusManagement/ToggleButtons" />

## Close a panel

When a panel that holds focus closes, send focus to the control that opened it with `fallback`. [Modal](/components/Modal), [ComposedModal](/components/ComposedModal), and [Dialog](/components/Dialog) do this themselves.

<FileSource src="/framed/FocusManagement/ClosePanel" />

## Move items

A keyed `{#each}` moves a node by removing and inserting it, which drops focus from a button in that node. The action puts focus back on the same control after the move, so a "Move up" button stays under the keyboard.

<FileSource src="/framed/FocusManagement/KeyedReorder" />

## Announce the move

Focus moving to the next row is silent for a screen reader that was reading the deleted one. Pass `announce` to say what happened. It receives the target, the removed item, and why focus moved: `"next"`, `"previous"`, `"fallback"`, or `"same"`.

```js
captureFocusTarget(row, {
  announce: ({ reason }) => announce(`Row deleted, focus on ${reason} row`),
});
```

The helper does not write to a live region, so use your app's announcer or a visually hidden `role="status"` element, as in the first example.

## Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `siblings` | `string \| () => Iterable<Element>` | The item and its neighbors, in order. Default: the item's parent's children. |
| `target` | `string \| (item) => HTMLElement` | The control to focus in a neighbor. Default: the one in the same position. |
| `fallback` | `HTMLElement \| () => HTMLElement` | Where focus goes when no neighbor can take it. |
| `find` | `() => HTMLElement` | The same control again, tried first. |
| `announce` | `({ reason, target, removed }) => void` | Called after focus moves. |
| `items` | `string` | `focusHandoff` only. The selector for the items in the container. |
| `subtree` | `boolean` | `focusHandoff` only. Set to `false` to watch only the container's direct children. |
| `enabled` | `boolean` | `focusHandoff` only. Set to `false` to switch it off. |

A neighbor that is hidden, `inert`, or has no control that can take focus is skipped.

## Guidelines

| Do | Why |
| :--- | :--- |
| Keep a control that starts work in the page, and show the work with `loading`. | A button that is removed or `disabled` while it has focus loses it. |
| Call `captureFocusTarget` before the state change and `restore` after it. | The helper reads where focus is before the DOM changes. |
| Give `fallback` a stable element, such as the opener or the list. | If the last item goes and nothing is left, focus still has somewhere to go. |
| Hide with `{#if}` or `{#each}`, not `display: none`. | The helper watches for removal. A hidden control stays in the page, and the browser decides what to do with focus. |
| Don't call `.focus()` in your own handler as well. | The helper skips the move if focus is already somewhere else, so yours wins, but two moves are harder to follow. |

## Browser notes

- Safari does not focus a button when you click it with the pointer, so after a click nothing in the item had focus. The helper then does nothing, which is right: the user was not using the keyboard.
- Browsers disagree on whether removing the focused node fires `focusout`, so the action detects the removal from the DOM instead.
- On the server, `captureFocusTarget` returns a function that does nothing, and the action never runs.
