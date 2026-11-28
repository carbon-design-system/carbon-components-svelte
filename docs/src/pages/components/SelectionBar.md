---
components: ["SelectionBar"]
description: Selection bars show how many items are selected and the actions on them, for a selection in a list, a grid or a gallery outside a data table.
keywords: ["batch actions", "bulk actions", "tray"]
---

<script>
  import { Button, SelectionBar } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
</script>

## Basic

Set `count` to the number of selected items. The bar shows while it is above zero, with the count at the start and a clear button at the end. Put buttons that act on the selection in the `actions` slot. They take the default `primary` kind, so the bar reads the same as [DataTable's batch actions](/components/DataTable#batch), which a table's own selection keeps using.

The bar does not own the selection. The clear button dispatches `clear`, with the `count` it cleared; set your selection to empty, and the bar hides once `count` is zero. When the bar hides with focus inside it, focus returns to where it was before it entered the bar, such as the last checkbox. Set `returnFocusTo` to an element, or a function returning one, to focus that element instead. When it returns nothing in the page, focus goes back to where it came from, and stays where it is if that element is gone too.

<FileSource src="/framed/SelectionBar/SelectionBarBasic" />

## SelectionBar or batch actions

| Do | Why |
| :--- | :--- |
| Use DataTable's [batch actions](/components/DataTable#actions-toolbar) for a table with a toolbar | They take the toolbar's place while rows are selected, so the rows don't move, and read the selection from the table |
| Use SelectionBar for a selection in a list, a grid of tiles or a gallery | Those have no toolbar for batch actions to cover |
| Use SelectionBar with `placement="viewport-end"` for a table without a toolbar | Pinned, the bar covers the page instead of pushing the rows down under the pointer |
| Show one of them for a selection, not both | Two bars repeat the count and split the actions |

## Data table

For a table without a toolbar, pin the bar to the bottom of the viewport with `placement="viewport-end"`, so the table doesn't move when the bar appears. Bind `selectedRowIds` on the table and pass its length as `count`, so the bar and the table's checkboxes read the same selection. The actions read the selected rows from the same ids: here Delete removes them and clears the selection, which hides the bar, Export downloads them as CSV, and Add tag tags each of them.

Delete removes the row whose checkbox focus came from, so `returnFocusTo` sends focus to the table's select-all checkbox when the bar hides, by its [documented id](/components/DataTable#batch), `{id}-select-all`.

<FileSource src="/framed/SelectionBar/SelectionBarDataTable" />

## Actions

Put the actions in the order people use them, most used first. The clear button always comes last.

### Many actions

Below 672px wide, the bar stacks: the actions move onto rows of their own under the count, and the clear button stays on the count's row. Wider, actions that don't fit beside the count, many or long ones, wrap under it instead of squeezing, so every label stays whole. The bar stacks by its own width, not the viewport's, so it lays out the same in a narrow panel. For the same reason it fills its parent and doesn't size to its actions: give a parent that sizes to its content, such as a flex item with no `flex-grow`, a width of its own. <DocKbd label="Tab" /> moves through the actions in order, then to the clear button.

<FileSource src="/framed/SelectionBar/SelectionBarManyActions" />

### Overflow menu

Past three or four actions, keep the most used as buttons and put the rest in a [MenuButton](/components/MenuButton) labeled "More", last among the actions. Set its `size` to `"lg"` to match the bar's height. Put a destructive action at the end of the menu, after a divider, with `kind="danger"`. With the More button focused, <DocKbd label="ArrowDown" /> opens the menu on its first item.

<FileSource src="/framed/SelectionBar/SelectionBarOverflow" />

### Conditional

Set `disabled` on an action the selection can't take yet, such as Merge with one ticket selected, so it stays where people look for it. Render an action only while it applies, such as Edit for exactly one ticket. The actions sit at the end of the bar, so one that shows at the start of them doesn't move the others.

<FileSource src="/framed/SelectionBar/SelectionBarConditional" />

## Selected items

Use the `items` slot to show what is selected, such as a filterable [Tag](/components/Tag) for each item, in a row under the bar. Removing a tag is the same as clearing its checkbox. Keep the row short: past a few dozen items, show the first few and a count.

<FileSource src="/framed/SelectionBar/SelectionBarItems" />

### Select all results

When the page of a long result set is fully selected, offer the rest of it in the `items` slot, as a mail inbox does. The bar counts the selected rows until the person selects all the results, then counts every result. Clearing a row of the page goes back to counting rows. The row under the bar shows only while the slot renders something.

<FileSource src="/framed/SelectionBar/SelectionBarSelectAll" />

## Placement

The bar renders where you place it, above or below the content it acts on, by default. Above a list, it moves the list down when it appears and back up when it hides, so the item under the pointer moves too. Prefer a toolbar the selection already has, such as DataTable's batch actions, or set `placement` to `"viewport-end"` to pin the bar to the bottom of the viewport, over the page, as a tray that stays in view while the person scrolls a long list. Leave room at the end of the page so the bar never covers the last item.

<FileSource src="/framed/SelectionBar/SelectionBarPinned" />

## Text

Set `selectedText` to a function of the count to change or translate the count's text. The text names the bar for screen readers, and is announced when the count changes, once the selection settles for half a second, so a run of checks or a select all is read once with its final count. Set `clearText` to change the clear button's text.

<SelectionBar count={3} selectedText={(count) => `${count} of 12 services selected`} clearText="Deselect all">
  <svelte:fragment slot="actions">
    <Button icon={Download}>Download</Button>
  </svelte:fragment>
</SelectionBar>

### Plurals

Pick the message for the count with `Intl.PluralRules`: languages split counts differently, and Polish uses one form for 1, another for 2 to 4, and a third for 5 and up. Format the number with `Intl.NumberFormat`, and set `lang` on the bar so screen readers read its text in its language. Set `clearText` to the clear button's translated text.

<FileSource src="/framed/SelectionBar/SelectionBarPlural" />

## Animation

Set `transition` to `true` to animate the bar as it shows and hides: in the content it slides open and moves the content below it; pinned, it rises from the bottom of the viewport. Pass params, such as `{ duration: "fast02" }`, to customize it. The bar does not animate by default, and does not move under reduced motion. Here the bar rises over a grid of selectable tiles when the first tile is selected.

<FileSource src="/framed/SelectionBar/SelectionBarTiles" />
