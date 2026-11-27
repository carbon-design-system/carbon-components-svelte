---
components: ["Swatch"]
description: Swatches are small color dots that mark a category, such as a team in a tag or an entry in a chart legend, always next to the text that names it.
keywords: ["color dot", "legend", "label color"]
---

<script>
  import { Stack, Swatch, Tag, TagSet } from "carbon-components-svelte";
</script>

## Basic

Put a `Swatch` in a tag's `icon` slot to mark a category on a neutral tag. The tag keeps its own `type`, so the dot never has to match a tag fill. Color must not be the only signal: always pair a swatch with text, and use [ShapeIndicator](/components/ShapeIndicator) for status.

<Tag type="gray"><Swatch slot="icon" color="teal" />Platform</Tag>

## Color

### Palette

Set `color` to one of the palette colors. The default is `"blue"`. The fill is the `-strong` [UserAvatar](/components/UserAvatar) color, which stays visible on a gray tag in every theme.

<Stack orientation="horizontal" gap={3} wrap="wrap">
  <Tag type="gray"><Swatch slot="icon" color="red" />Red</Tag>
  <Tag type="gray"><Swatch slot="icon" color="magenta" />Magenta</Tag>
  <Tag type="gray"><Swatch slot="icon" color="purple" />Purple</Tag>
  <Tag type="gray"><Swatch slot="icon" color="blue" />Blue</Tag>
  <Tag type="gray"><Swatch slot="icon" color="cyan" />Cyan</Tag>
  <Tag type="gray"><Swatch slot="icon" color="teal" />Teal</Tag>
  <Tag type="gray"><Swatch slot="icon" color="green" />Green</Tag>
  <Tag type="gray"><Swatch slot="icon" color="gray" />Gray</Tag>
</Stack>

### Hashed from a key

Set `colorKey` to pick a color from a string: the same string always gives the same color, on the server and in the browser. It is the color [getAvatarBackgroundColor](/components/UserAvatar) picks, so a tag and a `UserAvatar` with `backgroundColor="auto"` for one team match. `colorKey` wins over `color`. Use it for categories. Don't use it for severity, since a hash can give any status any color.

<Stack orientation="horizontal" gap={3} wrap="wrap">
  <Tag type="gray"><Swatch slot="icon" colorKey="Platform" />Platform</Tag>
  <Tag type="gray"><Swatch slot="icon" colorKey="Design" />Design</Tag>
  <Tag type="gray"><Swatch slot="icon" colorKey="Billing" />Billing</Tag>
  <Tag type="gray"><Swatch slot="icon" colorKey="Security" />Security</Tag>
</Stack>

### Custom color

Set `cssColor` to any CSS color, for a color that comes from your data. It sets the `--ccs-swatch-color` custom property. A custom dot gets a 1px edge, so a color close to its background stays visible.

<Stack orientation="horizontal" gap={3} wrap="wrap">
  <Tag type="gray"><Swatch slot="icon" cssColor="#ff7eb6" />Pink</Tag>
  <Tag type="gray"><Swatch slot="icon" cssColor="#ffffff" />White</Tag>
</Stack>

## Sizes

In a tag, the dot follows the tag: 8px in an `xs` or `sm` tag, also when a [TagSet](/components/TagSet) sets the size, and 12px otherwise. Set `size="sm"` or `size="md"` on the swatch to choose one.

<Stack orientation="horizontal" gap={3} wrap="wrap" align="center">
  <Tag type="gray" size="sm"><Swatch slot="icon" color="green" />Small</Tag>
  <Tag type="gray"><Swatch slot="icon" color="green" />Default</Tag>
  <Tag type="gray" size="lg"><Swatch slot="icon" color="green" />Large</Tag>
</Stack>

## Color tags

A color tag, such as an issue label, is a gray `Tag` with a swatch in its `icon` slot. Every tag variant takes one: a filter tag keeps its close button, a selected or high-contrast tag switches the dot to a step that stands out from its inverse fill, and a disabled tag shows the dot as disabled.

<Stack orientation="horizontal" gap={3} wrap="wrap">
  <Tag type="gray" filter title="Remove Design"><Swatch slot="icon" colorKey="Design" />Design</Tag>
  <Tag type="gray" interactive><Swatch slot="icon" colorKey="Billing" />Billing</Tag>
  <Tag type="high-contrast"><Swatch slot="icon" colorKey="Data" />Data</Tag>
  <Tag type="gray" interactive disabled><Swatch slot="icon" colorKey="Security" />Security</Tag>
</Stack>

In a [TagSet](/components/TagSet), the swatch is measured with its tag, so the overflow count stays right.

<TagSet size="sm">
  <Tag type="gray"><Swatch slot="icon" colorKey="Platform" />Platform</Tag>
  <Tag type="gray"><Swatch slot="icon" colorKey="Design" />Design</Tag>
  <Tag type="gray"><Swatch slot="icon" colorKey="Billing" />Billing</Tag>
</TagSet>

## Legend

A swatch also stands alone, such as in a chart legend. Leave `label` empty when the text beside it names the category: the swatch is then hidden from assistive technologies, so a screen reader doesn't say the name twice. Set `label` only for a swatch with no text beside it, which gives it `role="img"`.

<Stack orientation="horizontal" gap={5}>
  <Stack orientation="horizontal" gap={3} align="center">
    <Swatch color="magenta" />
    <span>Open</span>
  </Stack>
  <Stack orientation="horizontal" gap={3} align="center">
    <Swatch color="teal" />
    <span>Closed</span>
  </Stack>
</Stack>

## Forced colors

In forced colors mode, such as a Windows contrast theme, the browser removes background colors, which would erase the dot. The swatch keeps its fill with `forced-color-adjust: none` and draws a 1px `CanvasText` ring, so it reads on a light or dark `Canvas`. A disabled tag's dot turns `GrayText`.

## Usage

| Do | Why |
| --- | --- |
| Pair every swatch with text. | The text carries the name. A color alone fails for color-blind users and in forced colors. |
| Use `colorKey` for categories. | The same name gets the same color everywhere, on the server and in the browser. |
| Use `ShapeIndicator` for status. | A hashed color has no meaning, and a shape works without color. |
| Leave a swatch beside text unlabelled. | The text already names it, so a label makes a screen reader say it twice. |
