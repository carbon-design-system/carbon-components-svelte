---
components: ["Splitter"]
description: Splitters divide a view into two resizable panes, such as a list beside its details or an editor above its output.
---

<script>
  import { Box, Button, Splitter, Stack } from "carbon-components-svelte";

  let collapsed = false;
</script>

## Basic

Place content in the `start` and `end` slots. The splitter fills its container, so give the container a height. `size` sets the start pane's share as a percentage and defaults to `50`.

Drag the separator to resize the panes, or focus it and use the arrow keys; <DocKbd label="Shift" /> + arrow key moves 10 times as far. <DocKbd label="Home" /> and <DocKbd label="End" /> jump to the limits, <DocKbd label="Enter" /> collapses the start pane and restores it, and a double click restores the starting size.

<Box height="12rem" border="subtle">
  <Splitter size={30}>
    <Box slot="start" padding={5}>Services</Box>
    <Box slot="end" padding={5}>billing-api · us-south · 3 replicas</Box>
  </Splitter>
</Box>

## Minimum and maximum size

Set `min` and `max` to keep the start pane within a percentage range. <DocKbd label="Enter" /> collapses the start pane to `min`.

<Box height="12rem" border="subtle">
  <Splitter size={30} min={20} max={50}>
    <Box slot="start" padding={5}>Services</Box>
    <Box slot="end" padding={5}>billing-api · us-south · 3 replicas</Box>
  </Splitter>
</Box>

### Pixel bounds

Pass a pixel length such as `"200px"` to `min` or `max` to hold the start pane at a fixed size as the splitter resizes, for example a sidebar that should never get narrower than its content. `size` stays a percentage. When `min` is larger than `max`, `min` wins.

<Box height="12rem" border="subtle">
  <Splitter size={30} min="200px" max="400px" separatorLabel="Resize service list">
    <Box slot="start" padding={5}>Services</Box>
    <Box slot="end" padding={5}>billing-api · us-south · 3 replicas</Box>
  </Splitter>
</Box>

## Collapsed

Use `bind:collapsed` to collapse the start pane to `min` from your own control, such as a toolbar button. Setting it back to `false` restores the size the pane had before. It also turns `true` whenever the user moves the separator to `min`, whether with <DocKbd label="Enter" />, <DocKbd label="Home" />, or a drag. A pane shrunk to nothing is inert, so its content leaves the tab order.

<Stack gap={5}>
  <Box height="12rem" border="subtle">
    <Splitter size={30} bind:collapsed separatorLabel="Resize file tree">
      <Box slot="start" padding={5}>Files</Box>
      <Box slot="end" padding={5}>deploy.yaml</Box>
    </Splitter>
  </Box>
  <Button size="small" kind="tertiary" on:click={() => (collapsed = !collapsed)}>
    {collapsed ? "Show files" : "Hide files"}
  </Button>
</Stack>

### Collapse below min

Set `collapsedSize` to let the start pane collapse further than it resizes, such as a sidebar that stays at least `200px` wide but can still be hidden. <DocKbd label="Enter" /> and `collapsed` go to `collapsedSize`, and dragging past halfway between `min` and `collapsedSize` snaps the pane collapsed; dragging back snaps it open. <DocKbd label="Home" /> still stops at `min`.

<Box height="12rem" border="subtle">
  <Splitter size={30} min="200px" collapsedSize={0} separatorLabel="Resize service list">
    <Box slot="start" padding={5}>Services</Box>
    <Box slot="end" padding={5}>billing-api · us-south · 3 replicas</Box>
  </Splitter>
</Box>

## Vertical

Set `orientation` to `"vertical"` to stack the panes, with the start pane on top. Use <DocKbd label="ArrowUp" /> and <DocKbd label="ArrowDown" /> to move the separator.

<Box height="16rem" border="subtle">
  <Splitter orientation="vertical" size={65}>
    <Box slot="start" padding={5}>deploy.yaml</Box>
    <Box slot="end" padding={5}>Deploying billing-api to us-south… done in 42s</Box>
  </Splitter>
</Box>

## Nested

Nest a splitter in a pane to divide a view into more than two regions. Give each separator a distinct `separatorLabel` so screen reader users can tell them apart.

<Box height="16rem" border="subtle">
  <Splitter size={25} separatorLabel="Resize file tree">
    <Box slot="start" padding={5}>Files</Box>
    <Splitter slot="end" orientation="vertical" size={65} separatorLabel="Resize terminal">
      <Box slot="start" padding={5}>deploy.yaml</Box>
      <Box slot="end" padding={5}>Deploying billing-api to us-south… done in 42s</Box>
    </Splitter>
  </Splitter>
</Box>

## Hover delay

The separator highlights and shows the resize cursor once the pointer rests on it for `enterDelayMs` (default `150`), so passing over it on the way to a pane doesn't flash it. Leaving clears it at once. Keyboard focus draws the focus ring straight away, and touch never shows the hover state. A nested splitter without its own `enterDelayMs` uses the enclosing splitter's.

This example highlights the separators at once.

<Box height="12rem" border="subtle">
  <Splitter size={25} enterDelayMs={0} separatorLabel="Resize file tree">
    <Box slot="start" padding={5}>Files</Box>
    <Splitter slot="end" orientation="vertical" size={65} separatorLabel="Resize terminal">
      <Box slot="start" padding={5}>deploy.yaml</Box>
      <Box slot="end" padding={5}>Deploying billing-api to us-south… done in 42s</Box>
    </Splitter>
  </Splitter>
</Box>

## Reactive size

Use `bind:size` to read or set the size. It updates on every step of a drag, while `on:resize` fires once when the user finishes resizing, which suits saving the layout.

<FileSource src="/framed/Splitter/SplitterResize" />

## Disabled

Set `disabled` to `true` to prevent resizing. The separator stays visible but is no longer focusable.

<Box height="12rem" border="subtle">
  <Splitter size={30} disabled>
    <Box slot="start" padding={5}>Services</Box>
    <Box slot="end" padding={5}>billing-api · us-south · 3 replicas</Box>
  </Splitter>
</Box>
