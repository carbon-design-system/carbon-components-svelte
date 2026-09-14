---
components: ["ConfirmModal"]
description: ConfirmModal is a preset over Modal for are-you-sure decisions, with danger, warning, and info kinds and an optional type-to-confirm phrase.
---

## Basic

Ask the user to confirm or cancel an action. `title` sets the modal's heading, and `confirmText`/`cancelText` label the two footer buttons. Listen for `on:confirm` and `on:cancel` to react to the choice; the modal closes itself in both cases. For anything beyond a yes/no decision, use [Modal](/components/Modal) directly.

<FileSource src="/framed/ConfirmModal/ConfirmModal" />

## Kinds

Set `kind` to match the severity of the action. The default is `"danger"`.

### Danger

Use `kind="danger"` for destructive, irreversible actions. The confirm button uses Modal's danger styling, the cancel button receives focus first so a stray keypress can't confirm by accident, and screen readers announce it as an alert dialog.

<FileSource src="/framed/ConfirmModal/DangerConfirmModal" />

### Warning

Use `kind="warning"` for actions that need attention but aren't destructive. It shows a warning icon next to the heading and is also announced as an alert dialog.

<FileSource src="/framed/ConfirmModal/WarningConfirmModal" />

### Info

Use `kind="info"` for plain confirmations with no danger or warning styling.

<FileSource src="/framed/ConfirmModal/InfoConfirmModal" />

## Type to confirm

Set `confirmationPhrase` to require the user to type an exact phrase before the confirm button is enabled. `confirmationLabel` is a function that receives the phrase and returns the input's label, such as for a translation.

The match is case-sensitive but ignores spaces around the phrase, which pasting often adds. The field turns off autocapitalize and autocorrect, so a phone doesn't change the phrase as it's typed, and asks password managers not to fill it. The phrase in the label is marked not to translate, so a page translator doesn't change the word the user has to type.

<FileSource src="/framed/ConfirmModal/ConfirmModalTypeToConfirm" />

## Async confirm

Pass the work as `confirm`, a function that returns a promise. The confirm button shows a loading spinner, and the cancel button, <DocKbd label="Escape" /> and outside clicks are blocked until it settles. On success the modal closes; on failure it stays open, focus returns to the confirm button, and `confirm:error` carries the error to show in the modal body. A result that arrives after the modal was closed and reopened is ignored.

For work you track yourself, set `loading` instead, and close the modal when it's done.

<FileSource src="/framed/ConfirmModal/ConfirmModalAsyncConfirm" />

### Focus after closing

When the modal closes, focus returns to the button that opened it. If confirming removes that button, such as a delete button in a table row, move focus in `on:close` to what comes next, such as the next row or the table's heading.

## Custom body

Use the default slot to add richer content below the confirmation prompt, such as a list of the items an action will affect.

<FileSource src="/framed/ConfirmModal/ConfirmModalCustomBody" />

## Events

### Confirm

`on:confirm` fires when the confirm button is clicked (or activated via <DocKbd label="Enter" />) and, when `confirmationPhrase` is set, the typed phrase matches. It carries no detail.

```svelte
<ConfirmModal bind:open title="Delete this item?" on:confirm={handleDelete}>
```

### Cancel

`on:cancel` fires when the user backs out. `event.detail.trigger` is `"cancel-button"`, `"close-button"`, `"escape-key"` or `"outside-click"`. Closing the modal yourself, such as after async work succeeds, isn't a cancel.

```svelte
<ConfirmModal
  bind:open
  title="Delete this item?"
  on:cancel={(e) => console.log(e.detail.trigger)}
>
```

### Open, close, and transition end

`on:open` and `on:transitionend` forward the underlying [Modal](/components/Modal#events) events. `on:close` fires when the modal closes, with the same `trigger` values as Modal's; `"programmatic"` means `open` was set to `false`, after a confirm or by you. A close attempt while `loading` is blocked and not reported, and calling `event.preventDefault()` keeps the modal open.
