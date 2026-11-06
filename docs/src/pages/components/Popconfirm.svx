---
components: ["Popconfirm"]
description: Popconfirm asks a quick yes or no in a popover next to the button that triggered it, for small actions that don't need a Modal.
---

<script>
  import { Button, Popconfirm, Stack } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
</script>

## Basic

Wrap the trigger in a `Popconfirm`. Clicking it opens a popover with the question (`title`) and two buttons. `on:confirm` runs when the user agrees; the popover closes itself either way.

The first button or link in the default slot is the trigger. It gets `aria-haspopup="dialog"` and `aria-expanded` for you, and a `Tag` or any other clickable element works too.

<Popconfirm title="Delete this row?" confirmText="Delete">
  <Button kind="danger-ghost" size="small" icon={TrashCan} iconDescription="Delete row" iconOnly />
</Popconfirm>

## When to use it

Popconfirm sits between doing the action and a full-screen decision.

| Use | When |
| --- | --- |
| Popconfirm | The action is small and tied to one control: deleting a row, removing a tag, discarding a draft. The user's eyes are already on the button. |
| [ConfirmModal](/components/ConfirmModal) | The action is irreversible or high-stakes: deleting a project, revoking access for a team, anything the user should type a phrase to confirm. |
| Neither | The action can be undone. Do it and offer an undo in a toast instead. |

## Kinds

Set `kind` to match the severity. The default is `"danger"`.

| Kind | Confirm button | Announced as |
| --- | --- | --- |
| `"danger"` | Danger | Alert dialog |
| `"warning"` | Primary, with a warning icon beside the title | Alert dialog |
| `"info"` | Primary | Dialog |

<Stack orientation="horizontal" gap={5}>
  <Popconfirm title="Delete this row?" confirmText="Delete">
    <Button kind="danger" size="small">Danger</Button>
  </Popconfirm>
  <Popconfirm kind="warning" title="Discard this draft?" confirmText="Discard" cancelText="Keep editing">
    <Button kind="tertiary" size="small">Warning</Button>
  </Popconfirm>
  <Popconfirm kind="info" title="Make this public?" confirmText="Publish">
    <Button size="small">Info</Button>
  </Popconfirm>
</Stack>

## Description

Add supporting text under the title with `description`. Use the `descriptionChildren` slot for markup, such as a link to what will be lost. Screen readers read the description after the title.

<Popconfirm title="Remove from this project?" description="They lose access to every environment." confirmText="Remove">
  <Button kind="danger-tertiary" size="small">Remove member</Button>
</Popconfirm>

## Placement

Set `direction` to the side of the trigger the popover opens on, and `align` to line it up with the trigger's start, center or end. The popover flips to the other side when the window or a scroll area leaves no room. `start` and `end` name inline sides, so they swap under `dir="rtl"`.

<Stack orientation="horizontal" gap={5}>
  <Popconfirm title="Delete this row?" confirmText="Delete" direction="top">
    <Button kind="tertiary" size="small">Top</Button>
  </Popconfirm>
  <Popconfirm title="Delete this row?" confirmText="Delete" direction="bottom" align="start">
    <Button kind="tertiary" size="small">Bottom start</Button>
  </Popconfirm>
  <Popconfirm title="Delete this row?" confirmText="Delete" direction="right">
    <Button kind="tertiary" size="small">Right</Button>
  </Popconfirm>
</Stack>

## Examples

Real places a popconfirm belongs.

### Table row

Put the popconfirm in a cell. The table's scroll area would cut the popover off, so it moves to a portal on its own, and follows its trigger when the table scrolls. A click on the trigger also reaches a row's `on:click:row` handler, as with any button in a row.

<FileSource src="/framed/Popconfirm/PopconfirmTableRow" />

### Remove a tag

Any clickable element can be the trigger.

<FileSource src="/framed/Popconfirm/PopconfirmRemoveTag" />

### Discard a draft

Ask only when there is something to lose.

<FileSource src="/framed/Popconfirm/PopconfirmDiscardDraft" />

## Async confirm

Pass the work as `confirm`, a function that returns a promise. The confirm button shows a loading spinner, and the cancel button, <DocKbd label="Escape" /> and outside clicks are blocked until it settles. On success the popover closes.

For work you track yourself, set `loading` instead, and set `open` to `false` when it's done.

<FileSource src="/framed/Popconfirm/PopconfirmAsync" />

### Failure

When the promise rejects, or `confirm` throws, the popover stays open, shows `errorText` in an alert, and dispatches `confirm:error`. The user can try again or cancel. `errorText` is a string, or a function of the error for a message you choose. The default is a generic one, so an error's own text never reaches the page unless you pass it on.

<FileSource src="/framed/Popconfirm/PopconfirmAsyncError" />

## Open state

Bind `open` to open the popconfirm from somewhere else, such as a keyboard shortcut or a menu item. The popover places itself next to its slot, so keep an element there.

<FileSource src="/framed/Popconfirm/PopconfirmControlled" />

## Layering

### In a Modal

Inside a `Modal`, the popover renders in a portal, so the modal's scroll area can't cut it off and it stays above the modal. <DocKbd label="Escape" /> closes only the popconfirm; a second press closes the modal. Set `portalPopover` to `false` to keep it in place.

<FileSource src="/framed/Popconfirm/PopconfirmModal" />

### Portals

Left unset, `portalPopover` moves the popover to a portal when a box around it would cut it off. Set it to `true` to always portal, for a trigger in a container you know clips.

## Accessibility

The popconfirm is a non-modal dialog: the page behind stays reachable by pointer, and it doesn't set `aria-modal`. A danger or warning confirmation has the role `alertdialog`, an info one `dialog`. `title` names it, and `description` describes it.

### Keyboard

| Key | Action |
| --- | --- |
| <DocKbd label="Enter" /> or <DocKbd label="Space" /> on the trigger | Opens the popconfirm |
| <DocKbd label="Tab" /> and <DocKbd label="Shift" />+<DocKbd label="Tab" /> | Moves between the two buttons, and wraps |
| <DocKbd label="Escape" /> | Cancels, and returns focus to the trigger |

Focus moves to the cancel button when a danger or warning popconfirm opens, so a stray Enter doesn't confirm. An info popconfirm focuses confirm. Set `initialFocus` to change either. Focus returns to the trigger when the popconfirm closes, except after an outside click, which keeps the focus the click made. If confirming removes the trigger, such as a deleted row, move focus in `on:close` to what comes next.

### Guidelines

| Do | Why |
| --- | --- |
| Phrase `title` as a question that names the thing: "Delete Load Balancer 3?" | The title is the dialog's name, so a screen reader user hears what is at stake. |
| Label the buttons with verbs: "Delete" and "Keep editing" | "OK" and "Yes" don't say what happens. |
| Give an icon-only trigger an `iconDescription` | The trigger is a button with no visible text. |
| Use [ConfirmModal](/components/ConfirmModal) for irreversible, high-stakes actions | A popover is easy to dismiss and skim past. |
| Don't ask for actions the user can undo | A confirmation on every click teaches people to click through it. |

## Events

### Confirm

`on:confirm` fires when the confirm button is clicked. It carries no detail. With `confirm` set, it fires when the work starts.

```svelte
<Popconfirm title="Delete this row?" on:confirm={handleDelete}>
```

### Cancel

`on:cancel` fires when the user backs out. `event.detail.trigger` is `"cancel-button"`, `"escape-key"`, `"outside-click"` or `"trigger"` (the trigger was clicked again). Closing the popconfirm yourself, such as after async work succeeds, isn't a cancel.

### Open and close

`on:open` and `on:close` fire when `open` changes, whatever the cause.
