---
components: ["OverflowMenu", "OverflowMenuItem"]
description: Overflow menus present a list of actions in a compact dropdown, ideal for secondary or overflow actions.
---

<script>
  import { Box, Layer, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
</script>

## Basic

Create a basic overflow menu by wrapping overflow menu item components within the overflow menu. For menus that need submenus, use [MenuButton](/components/MenuButton#icon-only) instead.

Once open, arrow keys move focus between items without wrapping past the first or last item. <DocKbd label="Home" /> and <DocKbd label="End" /> jump to the first and last enabled item, skipping disabled ones. Type a character to move focus to the next enabled item whose text starts with it; type several characters quickly to match a longer prefix.

<OverflowMenu>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

## Reactive example

Control the menu state programmatically by binding to `open`.

<FileSource src="/framed/OverflowMenu/OverflowMenuReactive" />

## Positioning

Control where and how the menu opens.

### Portal

A menu that a container would cut off, such as a box with `overflow: hidden` or a scroll area, opens in a floating portal. The container in the example below hides its overflow, so the menu moves to a portal when it opens. Inside a [Modal](/components/Modal#modal-with-dropdowns), the menu always opens in a portal.

Set `portalMenu` to `true` to always render the menu in a portal, for example to escape a z-index stacking context. Set it to `false` to keep the menu in place. A portalled menu leaves its container in the DOM, so CSS that targets the menu as a descendant of the container does not match it.

<FileSource src="/framed/OverflowMenu/OverflowMenuPortalMenu" />

### Flipped

Set `flipped` to `true` to align the menu with the button's inline end: its right edge, or its left edge in a right-to-left layout.

<OverflowMenu flipped>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Direction

Set `direction` to `"top"` to position the menu above the button.

<OverflowMenu flipped direction="top">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

## On a layer

Place the component in a [`Layer`](/components/Layer) to put it on the next surface, so it contrasts with the surface below. `Layer` replaces the v10 `light` prop.

<Layer withBackground>
  <Box padding={5}>
    <OverflowMenu>
      <OverflowMenuItem text="Manage credentials" />
      <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
      <OverflowMenuItem danger text="Delete service" />
    </OverflowMenu>
  </Box>
</Layer>

## Sizes

Set `size` to control trigger and item height. The default is `md`.

### Extra-large

Set `size` to `"xl"` for an extra-large overflow menu.

<OverflowMenu size="xl">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Small

Set `size` to `"sm"` for a small overflow menu.

<OverflowMenu size="sm">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Extra-small

Set `size` to `"xs"` for an extra-small overflow menu.

<OverflowMenu size="xs">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

## Scrollable

Set `maxHeight` to cap the menu height and scroll the remaining items. A number is treated as pixels; a string is used as any CSS length, such as `"20rem"`. Keyboard navigation scrolls the focused item into view.

<FileSource src="/framed/OverflowMenu/OverflowMenuScrollable" />

## Trigger

Customize the menu trigger button.

### Icon

Replace the default vertical overflow menu icon with a custom icon.

<OverflowMenu icon={Add}>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Slot

Use the `menu` slot to customize the trigger button content. The trigger grows to fit custom content, and never shrinks below the default icon trigger's size.

<OverflowMenu>
  <Box slot="menu" paddingX={5}>Custom trigger</Box>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Accessible label

The trigger takes its accessible name and tooltip from `iconDescription`, which defaults to `"Options"`. The menu takes the same name. Set it to describe the actions.

<OverflowMenu iconDescription="Service actions">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

Set `aria-label` to give the trigger and the menu a longer name than the tooltip shows. Start it with the tooltip text, so voice control users can say what they see.

<OverflowMenu iconDescription="Actions" aria-label="Actions for API Gateway service">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Tooltip position

Set `tooltipAlign` to place the trigger's tooltip, with Popover's `align` names. The default is `"top"`. It replaces `tooltipPosition` and `tooltipAlignment`, which still work and are deprecated. The tooltip shows on hover and focus, hides while the menu is open, and flips to the opposite side when there is not enough space. It stays closed when the menu returns focus to the trigger.

<OverflowMenu tooltipAlign="bottom-start">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Disabled

Set `disabled` to `true` to disable the trigger button.

<OverflowMenu disabled>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

## Items

Customize individual menu items.

### Icons

Set `icon` for an icon at the start or `iconEnd` for one at the end; the label fills the space between them. Use the matching slots for custom markup. Item icons are not intended for `sm` or `xs` sizes.

<OverflowMenu>
  <OverflowMenuItem icon={Edit} text="Rename" />
  <OverflowMenuItem
    icon={Document}
    iconEnd={Launch}
    text="Open docs"
    href="https://www.ibm.com/docs"
    target="_blank"
  />
  <OverflowMenuItem hasDivider danger icon={TrashCan} text="Delete" />
</OverflowMenu>

### Keyboard shortcuts

Set `shortcut` to show an item's keys at the end of the row, such as `"mod+d"`: ⌘D on Apple platforms, Ctrl+D elsewhere. The item announces them with `aria-keyshortcuts`, and the menu widens, up to 20rem, so the keys don't squeeze the labels. The menu only shows the keys: bind the command itself with `onShortcut`.

<OverflowMenu>
  <OverflowMenuItem text="Edit" shortcut="mod+e" />
  <OverflowMenuItem text="Duplicate" shortcut="mod+d" />
  <OverflowMenuItem text="Delete" shortcut="mod+backspace" danger hasDivider />
</OverflowMenu>

### Primary focus

Set `primaryFocus` to `true` on a menu item to focus it when opening the dropdown.

<OverflowMenu>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem primaryFocus danger text="Delete service" />
</OverflowMenu>

### Disabled

Disable individual menu items with `disabled`. Use a divider to add visual separation between items.

<OverflowMenu>
  <OverflowMenuItem text="Create key" />
  <OverflowMenuItem text="Import key" />
  <OverflowMenuItem text="Revoke key" disabled />
  <OverflowMenuItem text="Duplicate key" disabled />
  <OverflowMenuItem
    hasDivider
    href="https://cloud.ibm.com/docs/api-gateway/"
    target="_blank"
    text="API documentation"
  />
  <OverflowMenuItem hasDivider danger text="Delete service" />
</OverflowMenu>

### Danger

Set `danger` on an item to indicate a critical or destructive action, such as deleting a resource. The item renders in red with a matching focus outline.

<OverflowMenu>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem hasDivider danger text="Delete service" />
</OverflowMenu>

## Events

Respond to menu close attempts and individual item clicks.

### Close event

Use `on:close` to respond to every close attempt, regardless of cause. The event detail includes `trigger` (`"toggle"`, `"escape-key"`, `"outside-click"`, or `"item-select"`); when triggered by a selection, `index` and `text` identify the selected item.

<OverflowMenu
  on:close={(e) => {
    console.log(e.detail.trigger); // "toggle" | "escape-key" | "outside-click" | "item-select"
    console.log(e.detail.index); // number | undefined
    console.log(e.detail.text); // string | undefined
  }}
>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem href="https://cloud.ibm.com/docs/api-gateway/" target="_blank" text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

### Prevent item close

Use `e.preventDefault()` on an individual overflow menu item click event to prevent the menu from closing when that item is clicked. Use this to keep the menu open after performing an action.

<FileSource src="/framed/OverflowMenu/OverflowMenuPreventDefault" />

### Cancel close event

The `close` event is cancelable. Call `e.preventDefault()` on it to keep the menu open when it would otherwise close from the trigger, <DocKbd label="Escape" />, or an outside click. The example below guards against accidentally dismissing unsaved changes: toggle a setting, then try to close the menu without saving.

<FileSource src="/framed/OverflowMenu/OverflowMenuCancelableClose" />
