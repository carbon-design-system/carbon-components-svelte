---
description: Dividers separate content with a thin rule, horizontally between stacked sections or vertically between items in a row.
---

<script>
  import { Divider, Stack, Text } from "carbon-components-svelte";
</script>

## Basic

A divider renders a horizontal `hr` with `role="separator"` that spans the width of its container. Place it in a `Stack` to space it from the surrounding content.

<Stack gap={5}>
  <Text>Section one</Text>
  <Divider />
  <Text>Section two</Text>
</Stack>

## Vertical orientation

Set `orientation` to `"vertical"` to separate items in a row. The divider stretches to the height of a flex container, such as a horizontal `Stack`, and sets `aria-orientation="vertical"`.

<Stack orientation="horizontal" align="center" gap={5}>
  <Text>Left</Text>
  <Divider orientation="vertical" />
  <Text>Right</Text>
</Stack>

## Decorative

Set `decorative` to `true` when the rule is purely visual. The divider drops `role="separator"` and sets `aria-hidden="true"`, so assistive technology skips it.

<Stack gap={5}>
  <Text>Section one</Text>
  <Divider decorative />
  <Text>Section two</Text>
</Stack>

## Margin

Use `margin` to add space on the divider's own axis without a wrapping `Stack`: block margin for horizontal dividers, inline margin for vertical ones. Pass a spacing step from 1–13 (the same scale as `Box` and `Stack`), or a custom value such as `"22px"`.

<Text>Step 7 (2rem)</Text>
<Divider margin={7} />
<Text>Custom (22px)</Text>
<Divider margin="22px" />
<Text>End</Text>
