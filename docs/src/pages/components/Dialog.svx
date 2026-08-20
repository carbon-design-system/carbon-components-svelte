---
description: Dialog provides a lightweight, native browser primitive for building custom modal and non-modal overlays.
---

## Basic

Open the dialog by binding to `open`. `Dialog` opens non-modally by default, using the browser's `show()`: it renders without a backdrop, and the rest of the page stays interactive. `Dialog` has no built-in heading, so provide an `aria-label` or `aria-labelledby` attribute; both forward to the underlying dialog element.

<FileSource src="/framed/Dialog/Dialog" />

## Modal

Set `modal` to `true` to open the dialog with the browser's `showModal()`, which adds a backdrop and confines focus and interaction to the dialog.

`Dialog` renders only what you put in its default slot, with no built-in header, footer, or action buttons. Use it to build a custom overlay, or as the top-layer host for portalled content such as DatePicker or FloatingPortal. For a ready-made dialog with a heading, body, and action buttons, use [Modal](/components/Modal) instead.

When the dialog opens, focus moves into it (native modal focus trap). When it closes, focus returns to the element that opened it.

<FileSource src="/framed/Dialog/ModalDialog" />

## Events

`Dialog` dispatches `open` once the dialog becomes visible (after `show()`/`showModal()` runs and focus moves in). Pair it with `close` — see [Closing](#closing) below — to track the dialog's full lifecycle.

```svelte
<Dialog
  bind:open
  on:open={() => console.log("open")}
  on:close={(e) => console.log("close", e.detail)}
>
```

## Closing

The `close` event includes a `trigger` property indicating what dismissed the dialog: `"escape-key"` (<DocKbd label="Escape" />), `"backdrop"`, `"close-button"` (for example a `<form method="dialog">` submit), or `"programmatic"` (when `open` is set to `false`).

<FileSource src="/framed/Dialog/DialogCloseTriggers" />

### Prevent on outside click

Disable closing the modal dialog when clicking the backdrop with `preventCloseOnClickOutside`.

<FileSource src="/framed/Dialog/DialogPreventOutsideClick" />
