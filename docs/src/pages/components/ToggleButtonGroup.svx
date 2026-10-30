---
components: ["ToggleButtonGroup", "ToggleButton"]
description: A group of pressable buttons where zero, one, or many can be pressed at once, for immediate-effect on/off commands like text formatting, map-layer toggles, or chart-series toggles.
---

<script>
  import {
    ToggleButton,
    ToggleButtonGroup,
  } from "carbon-components-svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";
</script>

## Selection

### Multiple (default)

A group of pressable buttons where zero, one, or many can be pressed at once, for immediate-effect on/off commands like text formatting, map-layer visibility, or chart-series toggles. Wrap `ToggleButton` components in a `ToggleButtonGroup` and give each a unique `value`.

The root renders `role="toolbar"`. Set `labelText` or `aria-label` so assistive technologies get a meaningful name, since there is no visible label otherwise. Arrow keys move focus between buttons, wrapping at the ends and skipping disabled ones, without changing the selection; Space/Enter presses the focused button.

<ToggleButtonGroup labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>

### Initial selection

Set `selected` to pre-press one or more buttons.

<ToggleButtonGroup selected={["bold"]} labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>

### Single

Set `selectionMode="single"` so at most one button is pressed. Pressing the pressed button clears the selection.

<ToggleButtonGroup selectionMode="single" labelText="Alignment">
  <ToggleButton value="left">Left</ToggleButton>
  <ToggleButton value="center">Center</ToggleButton>
  <ToggleButton value="right">Right</ToggleButton>
</ToggleButtonGroup>

### Required

Set `required` so the last pressed button can't be cleared. Works in both `multiple` and `single` mode.

<ToggleButtonGroup selectionMode="single" required selected={["center"]} labelText="Alignment (required)">
  <ToggleButton value="left">Left</ToggleButton>
  <ToggleButton value="center">Center</ToggleButton>
  <ToggleButton value="right">Right</ToggleButton>
</ToggleButtonGroup>

### Reactive

`selected` is bindable and always an array, even in `single` mode.

<FileSource src="/framed/ToggleButtonGroup/ToggleButtonGroupReactive" />

## Content

### Text

<ToggleButtonGroup labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
</ToggleButtonGroup>

### Icon-only

An icon-only button needs `iconDescription`, which becomes both the accessible label and the hover/focus tooltip text. Press <DocKbd label="Escape" /> to hide the tooltip without moving the pointer or focus. It shows again on the next hover or focus.

<ToggleButtonGroup labelText="Text formatting">
  <ToggleButton value="bold" icon={TextBold} iconDescription="Bold" />
  <ToggleButton value="italic" icon={TextItalic} iconDescription="Italic" />
  <ToggleButton
    value="underline"
    icon={TextUnderline}
    iconDescription="Underline"
  />
</ToggleButtonGroup>

### Custom tooltip position

Set `tooltipAlign` on `ToggleButton` to control where its tooltip appears, with Popover's `align` names. It replaces `tooltipPosition` and `tooltipAlignment`, which still work and are deprecated.

<ToggleButtonGroup labelText="Text formatting">
  <ToggleButton
    value="bold"
    icon={TextBold}
    iconDescription="Bold"
    tooltipAlign="top-start"
  />
  <ToggleButton
    value="italic"
    icon={TextItalic}
    iconDescription="Italic"
    tooltipAlign="top"
  />
  <ToggleButton
    value="underline"
    icon={TextUnderline}
    iconDescription="Underline"
    tooltipAlign="top-end"
  />
</ToggleButtonGroup>

### With icon

Set `icon` alongside default slot content to render both.

<ToggleButtonGroup labelText="Text formatting">
  <ToggleButton value="bold" icon={TextBold}>Bold</ToggleButton>
  <ToggleButton value="italic" icon={TextItalic}>Italic</ToggleButton>
</ToggleButtonGroup>

## Grid

Set `grid` to `true` to lay the buttons out as an even grid that wraps onto as many rows as it needs, such as for time slots. Columns are at least 5rem wide, so their number follows the width of the container. <DocKbd label="↑" /> and <DocKbd label="↓" /> move between rows.

<ToggleButtonGroup labelText="Appointment time" size="sm" selectionMode="single" grid>
  <ToggleButton value="0900">9:00 AM</ToggleButton>
  <ToggleButton value="0930">9:30 AM</ToggleButton>
  <ToggleButton value="1000" disabled>10:00 AM</ToggleButton>
  <ToggleButton value="1030">10:30 AM</ToggleButton>
  <ToggleButton value="1100">11:00 AM</ToggleButton>
  <ToggleButton value="1400">2:00 PM</ToggleButton>
  <ToggleButton value="1430">2:30 PM</ToggleButton>
  <ToggleButton value="1500">3:00 PM</ToggleButton>
</ToggleButtonGroup>

## Sizes

Set `size` to `"sm"`, `"md"` (default), or `"lg"`.

### Small

<ToggleButtonGroup size="sm" labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
</ToggleButtonGroup>

### Large

<ToggleButtonGroup size="lg" labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
</ToggleButtonGroup>

## Layout

### Vertical

Set `orientation="vertical"` to stack the buttons and use Up/Down to move focus instead of Left/Right. Text is left-aligned in this orientation.

<ToggleButtonGroup orientation="vertical" labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>

### Small

<ToggleButtonGroup orientation="vertical" size="sm" labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>

### Large

<ToggleButtonGroup orientation="vertical" size="lg" labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>

### Icon-only

The tooltip defaults to the right in a vertical group instead of `"bottom"`, since a bottom tooltip would land on the next stacked segment. Set `tooltipAlign` on `ToggleButton` to override it.

<ToggleButtonGroup orientation="vertical" labelText="Text formatting">
  <ToggleButton value="bold" icon={TextBold} iconDescription="Bold" />
  <ToggleButton value="italic" icon={TextItalic} iconDescription="Italic" />
  <ToggleButton
    value="underline"
    icon={TextUnderline}
    iconDescription="Underline"
  />
</ToggleButtonGroup>

### Custom tooltip position

Override the `"right"` default with `tooltipAlign`.

<ToggleButtonGroup orientation="vertical" labelText="Text formatting">
  <ToggleButton
    value="bold"
    icon={TextBold}
    iconDescription="Bold"
    tooltipAlign="right-start"
  />
  <ToggleButton
    value="italic"
    icon={TextItalic}
    iconDescription="Italic"
    tooltipAlign="right"
  />
  <ToggleButton
    value="underline"
    icon={TextUnderline}
    iconDescription="Underline"
    tooltipAlign="right-end"
  />
</ToggleButtonGroup>

### With icon

<ToggleButtonGroup orientation="vertical" labelText="Text formatting">
  <ToggleButton value="bold" icon={TextBold}>Bold</ToggleButton>
  <ToggleButton value="italic" icon={TextItalic}>Italic</ToggleButton>
</ToggleButtonGroup>

## States

### Disabled buttons

Set `disabled` on an individual `ToggleButton` to disable just that segment. Arrow-key navigation skips it.

<ToggleButtonGroup labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic" disabled>Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>

### Disabled group

Set `disabled` on `ToggleButtonGroup` to disable every button.

<ToggleButtonGroup disabled labelText="Text formatting">
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
</ToggleButtonGroup>

## Rich text editor toolbar

Compose `ToggleButtonGroup` with other components for a realistic toolbar. `Dropdown` handles the paragraph style picker, since it has many mutually exclusive options rather than a small icon set. `Button` handles undo, redo, and inserting a link, since those are momentary actions rather than persistent on/off state.

<FileSource src="/framed/ToggleButtonGroup/RichTextEditorToolbar" />

## Tool palette

A vertical, icon-only, single-select group works well for a compact tool palette like Photoshop's or Figma's.

<FileSource src="/framed/ToggleButtonGroup/ToolPalette" />

## Custom toolbars

`ToggleButtonGroup` gives its buttons a single tab stop and moves between them with arrow keys. For a toolbar or tab list you build yourself, use the `rovingFocus` action on the container. Pass a `selector` that matches the items, a `getActiveIndex` function that returns the current index, and an `onMove` callback that stores the next index.

### Arrow keys

Press <DocKbd label="ArrowLeft" /> or <DocKbd label="ArrowRight" /> to move between items, and <DocKbd label="Home" /> or <DocKbd label="End" /> to jump to the first or last item. Set `focusOnMove` to `true` so the action focuses the new item. Give only the active item `tabindex="0"` and the rest `tabindex="-1"`.

<FileSource src="/framed/ToggleButtonGroup/RovingFocusBasic" />

### Orientation

Set `orientation` to `"vertical"` to respond to <DocKbd label="ArrowUp" /> and <DocKbd label="ArrowDown" /> instead. Set it to `"both"` to respond to all four arrow keys, which suits a grid of items.

<FileSource src="/framed/ToggleButtonGroup/RovingFocusOrientation" />

### Wrapping and disabled items

Focus wraps from the last item to the first by default. Set `wrap` to `false` to stop at the ends. Set `skipDisabled` to `true` to skip items that are disabled or have `aria-disabled`, so the arrow keys never land on them.

<FileSource src="/framed/ToggleButtonGroup/RovingFocusWrap" />
