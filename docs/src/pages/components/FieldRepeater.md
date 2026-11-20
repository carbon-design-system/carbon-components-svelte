---
components: ["FieldRepeater"]
description: A field repeater lets users add another group of fields, such as one more email, phone number, invoice line or team member, and remove or reorder the ones they have.
keywords: ["add another", "repeatable fields", "dynamic form", "field array"]
---

## Basic

Bind `items` to your own array and render one group of fields for each item in the default slot. Each item gets an Add button below the list and a Remove button beside it. The slot's `index` picks the item to bind, and `label` is its numbered name, such as "Email 2".

Set `itemName` to the singular noun. It builds the Add button ("Add another email"), the Remove buttons ("Remove email 2") and the announcements. The component replaces `items` with a new array on every change and never edits an item, so `items` stays yours. Hide the item's label visually by setting `hideItemLabel` to `true` when a field in the item shows the same label. The label remains available to screen readers as the name of the item's group.

<FileSource src="/framed/FieldRepeater/Emails" />

## Limits

Set `min` and `max` to bound the list. The list fills up to `min` with `createItem`, and Remove is disabled at it. Add is disabled at `max`. Reaching a limit shows a message under the Add button and announces it. The default texts come from `maxText` and `minText`.

<FileSource src="/framed/FieldRepeater/Limits" />

## Reorder

Set `reorderable` to `true` to add Move up and Move down buttons to each item. Both buttons stay focusable at the ends of the list, so pressing <DocKbd label="Enter" /> on Move down until the item is last does not lose focus. At the end a button is `aria-disabled` and does nothing.

<FileSource src="/framed/FieldRepeater/Reorderable" />

## Summary list

Pass `summaryText` to collapse each item to a one-line summary with an Edit button, for long lists where each item has several fields. A new item opens for editing, and Edit opens a collapsed one and moves focus to its first field. Collapsed fields stay in the page, so a form still posts them.

<FileSource src="/framed/FieldRepeater/Summary" />

## Layouts

### Line items with totals

Compose the item's fields with `Stack` and compute totals from your own array. Hide the item's label visually so the column labels line up with the Remove button. Screen readers still hear each row as a group, "Line 2".

<FileSource src="/framed/FieldRepeater/InvoiceLineItems" />

### Nested fields

An item can hold any fields, such as a `Select` for a role. The slot's `id` is the item's id, so derive each field's id from it (`{id}-role`). Leave the item's label visible when the fields have none of their own to name the group.

<FileSource src="/framed/FieldRepeater/TeamMembers" />

## Validation

The repeater does not validate. Mark each field invalid from your own array, as in any form. To link an error summary to a field inside an item, call `focusItem(index)` on the component, which opens a collapsed item and focuses its first field. The id of a field is derived from the item's id, `{id}-0-email` for the first item, so a summary link can also use a plain `href`.

<FileSource src="/framed/FieldRepeater/Validation" />

## Forms

Set `name` to post the items natively. The slot's `fieldName` is `{name}[{index}]`, such as `phones[0]`. Pass it to the field as its `name`, or add a suffix for an object item, such as `members[0][role]`. Fields inside a collapsed summary item still post.

<FileSource src="/framed/FieldRepeater/NativeForm" />

## Empty state

With no items, the list is replaced by `emptyText`. Use the `empty` slot for richer content. Set `addText` to change the Add button's text.

<FileSource src="/framed/FieldRepeater/EmptyList" />

## Focus and announcements

Focus never falls to the page. A polite status region announces each change, and every text is replaceable through a function prop such as `addedText`, `removedText` and `movedText`.

| After | Focus goes to | Announced |
| --- | --- | --- |
| Add | The new item's first field | "Email 3 added" |
| Remove | The next item's first field, else the previous item's, else the Add button | "Email 2 removed" |
| Move up or Move down | The same button, in its new place | "Email 2 moved to position 1 of 3" |
| Reaching `max` or `min` | Unchanged | "Maximum of 3 reached" |

Items keep their fields, and their focus, when they move. Without `itemKey`, the component identifies a row by where it put it. When your app sorts or replaces `items` itself, pass `itemKey` with a key such as the item's database id, so a row follows its item.

## Usage

| Do | Why |
| --- | --- |
| Name the item with `itemName`, such as "email". | Buttons and announcements say which item they act on, so "Remove email 2" is unique on the page. |
| Leave the item's label visible when its fields are labeled "Name" or "Role". | A screen reader reads the item's group and then the field, so "Team member 2", "Name" tells users whose name it is. |
| Set `min` instead of hiding the first Remove button. | The list always keeps one item, and the user is told why Remove is unavailable. |
| Use `summaryText` for lists of more than a few multi-field items. | Collapsed items keep the page short, and the Edit button still reaches every field. |
| Pass `itemKey` when your app reorders or replaces `items`. | The row's fields, focus and typed text move with their item. |
| Keep an unrelated list of controls out of a repeater. | A repeater is for items that share the same fields. Use [TagInput](/components/TagInput) for a list of short strings. |
