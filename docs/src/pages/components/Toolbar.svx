---
components: ["Toolbar", "ToolbarContent", "ToolbarSearch", "ToolbarMenu", "ToolbarMenuItem", "ToolbarBatchActions"]
description: Toolbars provide a flexible container for actions, search, and menu items, standalone or as part of a data table.
---

<script>
  import { Toolbar, ToolbarContent, ToolbarSearch, ToolbarMenu, ToolbarMenuItem, ToolbarBatchActions, Button } from "carbon-components-svelte";
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
</script>

## Basic

Create a basic toolbar with content inside toolbar content. **Toolbar** can be used independently of DataTable—it provides its own context for child components like **ToolbarMenu**, **ToolbarSearch**, and **ToolbarBatchActions**, so every example on this page works standalone. To use a toolbar with a data table instead, see [DataTable's Toolbar section](/components/DataTable#toolbar).

<Toolbar>
  <ToolbarContent>
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

## Accessible label

Set `ariaLabel` to override the toolbar's accessible name. The default, `"data table toolbar"`, is inherited from Toolbar's original use inside DataTable—override it for standalone toolbars so assistive technology announces something more meaningful.

<Toolbar ariaLabel="Product actions">
  <ToolbarContent>
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

## Sizes

Set `size` to control the toolbar height. The default is medium.

### Small

Set `size="sm"` for a compact toolbar.

<Toolbar size="sm">
  <ToolbarContent>
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>

### Extra-small

Set `size="xs"` for an extra-small toolbar, intended to pair with a compact data table.

<Toolbar size="xs">
  <ToolbarContent>
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>

## Search

Add search functionality using toolbar search.

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch />
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

### Persistent

Set `persistent` on toolbar search to keep it always expanded.

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch persistent placeholder="Search..." />
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

### Select on focus

Set `selectTextOnFocus` to select the full value when the field receives focus.

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch persistent selectTextOnFocus value="Cloud functions" />
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

### Disabled

Set `disabled` to `true` to disable the search field.

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch disabled placeholder="Search..." />
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

### Reactive

Bind to `value` for reactive updates. `expanded` is also bindable, so you can read or programmatically set whether the search field is open.

<FileSource src="/framed/Toolbar/ToolbarSearchReactive" />

### Clear programmatically

Use `bind:this` to obtain a ToolbarSearch reference and call `clear()` to reset the value.

<FileSource src="/framed/Toolbar/ToolbarSearchClear" />

### Clear event

Listen for `on:clear` to know when the user clears the field—by clicking the built-in clear icon or pressing <DocKbd label="Escape" /> while focused. This is distinct from calling the exported `clear()` method yourself, which updates `value` and `expanded` directly without dispatching the event.

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch persistent placeholder="Search..." on:clear={() => console.log("cleared")} />
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

### Debounce

Set `debounce` to delay client-side filtering until typing pauses, in milliseconds. `value` still updates on every keystroke; only the filter run waits. This keeps large tables responsive without wrapping `value` yourself. Clearing the field, by the clear icon, <DocKbd label="Escape" />, or an empty value, restores the full row set immediately, without waiting for the debounce period.

<FileSource src="/framed/Toolbar/ToolbarSearchDebounce" />

## Menu

Add an overflow menu using toolbar menu and toolbar menu item.

<Toolbar>
  <ToolbarContent>
    <ToolbarMenu>
      <ToolbarMenuItem>Restart all</ToolbarMenuItem>
      <ToolbarMenuItem href="https://cloud.ibm.com/docs">API documentation</ToolbarMenuItem>
      <ToolbarMenuItem>Settings</ToolbarMenuItem>
    </ToolbarMenu>
    <Button>Create</Button>
  </ToolbarContent>
</Toolbar>

### Divider and danger item

Use `hasDivider` to add a separator and `danger` for destructive actions.

<Toolbar>
  <ToolbarContent>
    <ToolbarMenu>
      <ToolbarMenuItem>Restart all</ToolbarMenuItem>
      <ToolbarMenuItem href="https://cloud.ibm.com/docs">API documentation</ToolbarMenuItem>
      <ToolbarMenuItem hasDivider danger>Stop all</ToolbarMenuItem>
    </ToolbarMenu>
  </ToolbarContent>
</Toolbar>

### Primary focus

Set `primaryFocus` on a menu item to focus it when opening the dropdown.

<Toolbar>
  <ToolbarContent>
    <ToolbarMenu>
      <ToolbarMenuItem>Restart all</ToolbarMenuItem>
      <ToolbarMenuItem href="https://cloud.ibm.com/docs">API documentation</ToolbarMenuItem>
      <ToolbarMenuItem primaryFocus hasDivider danger>Stop all</ToolbarMenuItem>
    </ToolbarMenu>
  </ToolbarContent>
</Toolbar>

### Disabled item

Set `disabled` on a menu item to prevent it from being selected.

<Toolbar>
  <ToolbarContent>
    <ToolbarMenu>
      <ToolbarMenuItem>Restart all</ToolbarMenuItem>
      <ToolbarMenuItem disabled>Restart selected</ToolbarMenuItem>
    </ToolbarMenu>
  </ToolbarContent>
</Toolbar>

### Custom icon

**ToolbarMenu** extends [OverflowMenu](/components/OverflowMenu), inheriting props such as `icon`. The default icon is a settings gear—pass a different icon component to change it.

<Toolbar>
  <ToolbarContent>
    <ToolbarMenu icon={Filter}>
      <ToolbarMenuItem>Filter by category</ToolbarMenuItem>
      <ToolbarMenuItem>Filter by price</ToolbarMenuItem>
    </ToolbarMenu>
  </ToolbarContent>
</Toolbar>

## Batch actions

Toolbar batch actions display batch actions when items are selected.

Although intended for use with [DataTable](/components/DataTable), batch actions can be used standalone when `selectedIds` is provided. That prop is not required when used with a data table.

### Basic usage

<Toolbar>
  <ToolbarBatchActions selectedIds={[1, 2, 3]}>
    <Button icon={TrashCan}>Delete</Button>
  </ToolbarBatchActions>
  <ToolbarContent>
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>

### Manually controlling visibility

Set `active` to `true` or `false` to override the automatic visibility based on `selectedIds`. This is useful when the batch action bar should be driven by application state instead of a selection count. Here, the bar is forced open even though no items are selected.

<Toolbar>
  <ToolbarBatchActions active>
    <Button icon={TrashCan}>Delete</Button>
  </ToolbarBatchActions>
  <ToolbarContent>
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>

### Custom cancel label

Override the Cancel button's text using the `cancel` slot.

<Toolbar>
  <ToolbarBatchActions selectedIds={[1, 2, 3]}>
    <Button icon={TrashCan}>Delete</Button>
    <svelte:fragment slot="cancel">Discard</svelte:fragment>
  </ToolbarBatchActions>
  <ToolbarContent>
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>

### Total selected label

Override the "N items selected" text with `formatTotalSelected`.

<Toolbar>
  <ToolbarBatchActions selectedIds={[1, 2, 3]} formatTotalSelected={(total) => `${total} item${total === 1 ? "" : "s"} chosen`}>
    <Button icon={TrashCan}>Delete</Button>
  </ToolbarBatchActions>
  <ToolbarContent>
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>

### Standalone with dynamic selection

In standalone usage there's no `DataTable` context to reset the selection automatically, so listen for `on:cancel` and clear your own selection state in the handler.

<FileSource src="/framed/Toolbar/ToolbarBatchActionsStandalone" />

## Sticky

### Pinned toolbar

Set `sticky` to keep the toolbar pinned to the top of its nearest scrolling ancestor as the page scrolls, including an active [ToolbarBatchActions](#basic-usage) bar, which would otherwise scroll out of view along with the table body. This differs from [DataTable's sticky header](/components/DataTable#sticky-header), which pins the column headers while the table body scrolls within its own container; a sticky toolbar instead sticks to the page (or another ancestor with `overflow`), since the toolbar sits outside the table's scroll wrappers. Select some rows below and scroll the example to see the batch bar stay in view.

<FileSource src="/framed/Toolbar/ToolbarSticky" />

### Offset

Set `stickyOffset` to add clearance above the stuck toolbar, useful when a fixed UI Shell header would otherwise overlap it. Pass a number for pixels or a string for any CSS length.

If a [Header](/components/UIShell#header) is rendered on the page, `stickyOffset` defaults to its height (48px) automatically, so the toolbar clears it without any extra configuration. Set `stickyOffset` explicitly, including `stickyOffset={0}`, to opt out of this default.

<FileSource src="/framed/Toolbar/ToolbarStickyHeader" />

## Composition

### Complete toolbar

Combine search, menu, and buttons for a full-featured toolbar.

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch />
    <ToolbarMenu>
      <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
      <ToolbarMenuItem href="https://cloud.ibm.com/docs/loadbalancer-service">
        API documentation
      </ToolbarMenuItem>
      <ToolbarMenuItem hasDivider danger>Stop all</ToolbarMenuItem>
    </ToolbarMenu>
    <Button>Create balancer</Button>
  </ToolbarContent>
</Toolbar>

### With multiple actions

Stack multiple action buttons in the toolbar.

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch persistent />
    <Button kind="secondary" size="small">Export</Button>
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>
