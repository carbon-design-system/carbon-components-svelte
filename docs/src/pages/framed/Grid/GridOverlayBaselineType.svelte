<script>
  import {
    Box,
    Column,
    Grid,
    Heading,
    RadioButton,
    RadioButtonGroup,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import { GridOverlay } from "carbon-components-svelte/devtools";

  let baseline = 4;
</script>

<Grid padding>
  <Row>
    <Column>
      <!-- A fixed 64px band keeps the text below on the rhythm, whatever
           height the radio group renders at. -->
      <Box height="4rem">
        <RadioButtonGroup legendText="Baseline step" bind:selected={baseline}>
          <RadioButton labelText="2px" value={2} />
          <RadioButton labelText="4px" value={4} />
          <RadioButton labelText="8px" value={8} />
        </RadioButtonGroup>
      </Box>
      <Stack gap={6}>
        <Heading class="outlined" type="heading-04">heading-04 (28/36)</Heading>
        <Heading class="outlined" type="heading-03">heading-03 (20/28)</Heading>
        <Text class="outlined" type="body-01">
          body-01 (14/20). The dashed box is the element: its top and bottom sit
          on rows because 20px is a multiple of 4. The line under each line of
          text is its glyph baseline, which CSS places inside the line box by
          font metrics. Here it lands 14px down, so it misses a 4px row by 2px.
        </Text>
        <Text class="outlined" type="body-compact-01">
          body-compact-01 (14/18). An 18px line height is not a multiple of 4,
          so even the line boxes drift 2px per line against a 4px rhythm.
        </Text>
        <Text class="outlined" type="label-01">label-01 (12/16)</Text>
        <Text class="outlined" type="helper-text-01"
          >helper-text-01 (12/16)</Text
        >
      </Stack>
    </Column>
  </Row>
</Grid>

<GridOverlay
  open
  columns={false}
  {baseline}
  baselineEmphasis={0}
  textBaselines
  label
/>

<style>
  /* Outlines each element, so you can compare its box with its baseline.
     An outline takes no space, so the boxes stay on the rhythm. */
  :global(.outlined) {
    outline: 1px dashed rgba(22, 22, 22, 0.35);
  }
</style>

<!-- docs-only:start -->
<svelte:head>
  <style>
    /* The overlay is fixed to the viewport, so drop the frame's side padding
       to line the Grid up with it, and hide the frame's column guides. */
    body.framed {
      padding-inline: 0;
    }

    body.framed :not(.bx--content) [class^="bx--col"] {
      box-shadow: none;
    }
  </style>
</svelte:head>
<!-- docs-only:end -->
