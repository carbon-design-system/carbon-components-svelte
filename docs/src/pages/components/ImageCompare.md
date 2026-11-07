---
description: Image comparisons overlay a before and an after behind a draggable divider, or set them side by side or switch between them, for design reviews, image edits, maps, and visual diffs.
---

<script>
  import {
    Box,
    Button,
    ImageCompare,
    Stack,
    TextInput,
    Tile,
  } from "carbon-components-svelte";
  import { dashboard, grid, photo } from "../../image-compare-samples";

  let value = 50;
  let selected = "before";
</script>

## Basic

Set `beforeSrc` and `afterSrc`, and describe each image with `beforeAlt` and `afterAlt`. The divider starts at the middle. Press anywhere on the image to move it there, then drag, or focus the divider and use the keys: <DocKbd label="ArrowLeft" /> and <DocKbd label="ArrowRight" /> move it 1%, <DocKbd label="Shift" /> + arrow key (or <DocKbd label="PageUp" /> and <DocKbd label="PageDown" />) 10%, and <DocKbd label="Home" /> and <DocKbd label="End" /> to either end.

<Box maxWidth="40rem">
  <ImageCompare
    labelText="Denoised photo"
    beforeSrc={photo(false)}
    afterSrc={photo(true)}
    beforeAlt="Mountains at dusk, flat and noisy"
    afterAlt="The same mountains with the noise removed and the color restored"
  />
</Box>

## Usage

| Do | Why |
| --- | --- |
| Compare two views of the same thing, framed the same way. | The divider reveals one over the other, so a shifted or rescaled side reads as a change that is not there. |
| Give each image its own `alt` that describes what is in it. | Both images are in the page for screen readers, and the label alone ("Before") does not say what changed. |
| Name the comparison with `labelText`, such as "Denoised photo". | The divider is announced as "Comparison position" with a value like "Showing 40% of Before". The name says what is being compared. |
| Keep the labels. | The side names are text, so the meaning does not depend on which side is which color or position. |
| Use `mode="side-by-side"` or `mode="toggle"` when the differences are small or the user needs to look at one side in full. | A moving divider hides half of each image at any moment. |
| Leave interactive content out of the slots. | The comparison takes the pointer, so a link or a map the user can pan would not respond. |

## Modes

Set `mode` to change how the two sides are compared. `"slider"` is the default.

### Side by side

`"side-by-side"` shows both sides in their own frames with the label below each, and has no divider.

<Box maxWidth="40rem">
  <ImageCompare
    mode="side-by-side"
    beforeSrc={photo(false)}
    afterSrc={photo(true)}
    beforeAlt="Mountains at dusk, flat and noisy"
    afterAlt="The same mountains with the noise removed and the color restored"
  />
</Box>

### Toggle

`"toggle"` shows one side and fades to the other when the user picks it, so the two frames sit in the same place for flicker comparison. Bind `selected` to `"before"` or `"after"` to read or change the side. The fade is off when the user prefers reduced motion.

<Box maxWidth="40rem">
  <Stack gap={4}>
    <ImageCompare
      mode="toggle"
      bind:selected
      beforeLabel="Baseline"
      afterLabel="Current"
      beforeSrc={dashboard(false)}
      afterSrc={dashboard(true)}
      beforeAlt="Dashboard in the baseline build"
      afterAlt="Dashboard in the current build, with a red card and a blue bar"
    />
    <p>Showing {selected === "before" ? "baseline" : "current"}</p>
  </Stack>
</Box>

## Orientation

Set `orientation` to `"vertical"` to divide the frame top to bottom, with "before" on top. It suits tall or narrow images. <DocKbd label="ArrowUp" /> and <DocKbd label="ArrowDown" /> move the divider the way the key points.

<Box maxWidth="24rem">
  <ImageCompare
    orientation="vertical"
    ratio="4x3"
    beforeSrc={photo(false)}
    afterSrc={photo(true)}
    beforeAlt="Mountains at dusk, flat and noisy"
    afterAlt="The same mountains with the noise removed and the color restored"
  />
</Box>

## Labels

Set `beforeLabel` and `afterLabel` to name the sides for the task, such as "Original" and "Upscaled". Each label belongs to its side, so the divider covers it with the side it names. Set `hideLabels` to leave them off; the divider still announces them.

<Box maxWidth="40rem">
  <ImageCompare
    beforeLabel="Original"
    afterLabel="Upscaled"
    beforeSrc={photo(false)}
    afterSrc={photo(true)}
    beforeAlt="The original, flat and noisy"
    afterAlt="The upscaled image, clean and vivid"
  />
</Box>

## Position

Set `value` to the share of the frame that shows "before", from 0 to 100, and bind it to read the position or to move it from your own control. The first frame is drawn with this value, with no script, so the server-rendered page already shows it.

<Box maxWidth="40rem">
  <Stack gap={4}>
    <ImageCompare
      bind:value
      beforeSrc={photo(false)}
      afterSrc={photo(true)}
      beforeAlt="Mountains at dusk, flat and noisy"
      afterAlt="The same mountains with the noise removed and the color restored"
    />
    <Stack orientation="horizontal" gap={3}>
      <Button size="small" kind="tertiary" on:click={() => (value = 0)}>Show after</Button>
      <Button size="small" kind="tertiary" on:click={() => (value = 100)}>Show before</Button>
    </Stack>
  </Stack>
</Box>

Screen readers hear the position as "Showing 40% of Before" with the label you set. Pass `formatValueText` to change the sentence, such as for another language.

## Images of different sizes

Both sides fill the same frame, set by `ratio`: a named ratio, or any `"WxH"` pair such as `"1200x800"`. Images with another shape are fit into it with `fit`, which takes the `object-fit` values and defaults to `"cover"`. Here a 4:3 image and a 5:1 image share a 2:1 frame, so their centers line up. Use `fit="contain"` to keep the whole image and let the frame show around it.

<Box maxWidth="40rem">
  <ImageCompare
    ratio="2x1"
    beforeSrc={grid(400, 300, "#0f62fe")}
    afterSrc={grid(1000, 200, "#198038")}
    beforeAlt="A 400 by 300 image"
    afterAlt="A 1000 by 200 image"
  />
</Box>

## Slots

Fill the `before` and `after` slots to compare anything that is not an image: two builds of an interface, two charts, or two map styles. Slot content fills the frame, so give it a height of 100%.

<Box maxWidth="40rem">
  <ImageCompare
    ratio="16x9"
    beforeLabel="Current"
    afterLabel="Proposed"
    labelText="Account settings redesign"
  >
    <Box slot="before" height="100%" padding={6} fill="layer-01">
      <Stack gap={4}>
        <h4>Account</h4>
        <TextInput labelText="Display name" value="Ada Lovelace" readonly />
        <Button kind="tertiary" size="small">Save changes</Button>
      </Stack>
    </Box>
    <Box slot="after" height="100%" padding={6} fill="layer-02">
      <Stack gap={5}>
        <h3>Account settings</h3>
        <TextInput labelText="Display name" helperText="Shown on your public profile" value="Ada Lovelace" />
        <Stack orientation="horizontal" gap={3}>
          <Button size="small">Save changes</Button>
          <Button size="small" kind="ghost">Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  </ImageCompare>
</Box>

## Visual diffs

Put a baseline screenshot and the current one in the two sides to review a visual regression. The slider shows where the change is, and the toggle in [Modes](#toggle) shows it as a flicker. This is the same view a failed end-to-end screenshot comparison needs: the expected image, the actual one, and a way to see what moved.

<Box maxWidth="40rem">
  <ImageCompare
    value={30}
    beforeLabel="Baseline"
    afterLabel="Current"
    labelText="Dashboard visual diff"
    beforeSrc={dashboard(false)}
    afterSrc={dashboard(true)}
    beforeAlt="Dashboard in the baseline build"
    afterAlt="Dashboard in the current build, with a red card and a blue bar"
  />
</Box>

## Right-to-left

"Before" sits at the inline start: the left in a left-to-right page and the right in a right-to-left one, so the sides read in the same order as the text around them. The pointer and <DocKbd label="ArrowLeft" /> and <DocKbd label="ArrowRight" /> follow the divider's side, and the divider and its labels mirror. In a vertical comparison "before" stays on top.

## Touch

The divider follows a horizontal swipe on the image, and a vertical swipe scrolls the page as usual, so a comparison does not trap a touch scroll. A vertical comparison swaps the two. A tap jumps the divider to the touch point.

## Forced colors

In Windows high contrast mode the divider line and the handle are drawn with the system `Canvas` and `CanvasText` colors, so they stay visible over any image, and the labels get a border.
