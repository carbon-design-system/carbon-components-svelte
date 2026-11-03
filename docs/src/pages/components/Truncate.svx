---
description: Truncate handles single-line and multiline text overflow, as a component or with the truncate action.
---

<script>
  import { Box, Text, Truncate, truncate } from "carbon-components-svelte";
</script>

## Component

### Basic

Truncate offers two ways to clip overflowing text: the `Truncate` component, which wraps content in a `<p>`, and the `truncate` action, which applies the same clipping to any element. For truncating text that also needs a specific Carbon type style, see [Text](/components/Text#truncate).

The default component wraps text in a paragraph and truncates at the end of the line.

<Box maxWidth="20rem">
  <Truncate>
    Failed to deploy revision 214: container image ghcr.io/acme-corp/payments-api:2.4.1-rc3 exceeded the memory limit configured for the production namespace.
  </Truncate>
</Box>

### Clamp front

Set `clamp` to `"front"` to keep the end of the text visible. `clamp` only takes effect when `lines` is `1`.

<Box maxWidth="20rem">
  <Truncate clamp="front">
    /var/log/kubernetes/production/payments-api/pods/payments-api-7f9c8d6b4d-x2kql/container.log
  </Truncate>
</Box>

### Multiline

Set `lines` above 1 to limit how many lines show. Multiline mode always clamps from the end, regardless of `clamp`.

<Box maxWidth="20rem">
  <Truncate lines={3}>
    The nightly reconciliation job failed after three retries because the upstream billing service returned inconsistent invoice totals for 42 accounts. Support has been notified and a manual review is in progress.
  </Truncate>
</Box>

### Tooltip

Set `reveal` to `"tooltip"` to show the full text in a tooltip. While the text is clipped, it joins the tab order, and the tooltip opens on hover and focus. Press <DocKbd label="Escape" /> to hide it. Text that fits stays plain. Set `tooltipAlign` to place the tooltip, with Popover's `align` names. It replaces `tooltipPosition` and `tooltipAlignment`, which still work and are deprecated.

<Box maxWidth="20rem">
  <Truncate reveal="tooltip">
    Failed to deploy revision 214: container image ghcr.io/acme-corp/payments-api:2.4.1-rc3 exceeded the memory limit configured for the production namespace.
  </Truncate>
</Box>

### Expand

Set `reveal` to `"expand"` to add a button that shows the full text. The button appears only while the text is clipped. Bind `expanded` to read or set the state, and set `expandLabel` and `collapseLabel` to change the button text.

<Box maxWidth="20rem">
  <Truncate reveal="expand" lines={2}>
    The nightly reconciliation job failed after three retries because the upstream billing service returned inconsistent invoice totals for 42 accounts. Support has been notified and a manual review is in progress.
  </Truncate>
</Box>

### Inline test

Truncating a span mid-sentence needs a normal block ancestor so the truncated text keeps the surrounding line height, otherwise descenders get clipped.

<Box tag="p" maxWidth="20rem">
  Deploy failed for image <Box tag="span" display="inline-flex" maxWidth="9rem"><Truncate tag="span">ghcr.io/acme-corp/payments-api:2.4.1-rc3</Truncate></Box> during rollout.
</Box>

### Nested text

Set `tag` when the content is itself a block element such as Text, since paragraphs cannot nest.

<Box maxWidth="20rem">
  <Truncate tag="div">
    <Text tag="span">
      Failed to deploy revision 214: container image ghcr.io/acme-corp/payments-api:2.4.1-rc3 exceeded the memory limit configured for the production namespace.
    </Text>
  </Truncate>
</Box>

## Action

Use the `truncate` action on any element for the same behavior without the `Truncate` component's wrapping `<p>`.

### Basic

<Box maxWidth="20rem">
  <h4 use:truncate>
    Failed to deploy revision 214: container image ghcr.io/acme-corp/payments-api:2.4.1-rc3 exceeded the memory limit configured for the production namespace.
  </h4>
</Box>

### Clamp front

Pass `clamp: "front"` to keep the end of the text visible. Wrap the text in `<bdi>`, as the component does, so a leading slash or a trailing period stays in place.

<Box maxWidth="20rem">
  <h4 use:truncate={{ clamp: "front" }}>
    <bdi>/var/log/kubernetes/production/payments-api/pods/payments-api-7f9c8d6b4d-x2kql/container.log</bdi>
  </h4>
</Box>

### Multiline

Pass `lines` for multiline truncation.

<Box maxWidth="20rem">
  <p use:truncate={{ lines: 3 }}>
    The nightly reconciliation job failed after three retries because the upstream billing service returned inconsistent invoice totals for 42 accounts. Support has been notified and a manual review is in progress.
  </p>
</Box>
