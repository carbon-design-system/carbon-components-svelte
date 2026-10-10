<script>
  import {
    Column,
    Grid,
    GridOverlay,
    Heading,
    RadioButton,
    RadioButtonGroup,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";

  let baseline = 4;

  // Outlines each element, so you can compare its box with its baseline.
  const box = "outline: 1px dashed rgba(22, 22, 22, 0.35)";
</script>

<Grid padding>
  <Row>
    <Column>
      <!-- A fixed 64px band keeps the text below on the rhythm, whatever
           height the radio group renders at. -->
      <div style="height: 4rem;">
        <RadioButtonGroup legendText="Baseline step" bind:selected={baseline}>
          <RadioButton labelText="2px" value={2} />
          <RadioButton labelText="4px" value={4} />
          <RadioButton labelText="8px" value={8} />
        </RadioButtonGroup>
      </div>
      <Stack gap={6}>
        <Heading style={box} type="productive-heading-04"
          >productive-heading-04 (28/36)</Heading
        >
        <Heading style={box} type="productive-heading-03"
          >productive-heading-03 (20/28)</Heading
        >
        <Text style={box} type="body-long-01">
          body-long-01 (14/20). The dashed box is the element: its top and
          bottom sit on rows because 20px is a multiple of 4. The line under
          each line of text is its glyph baseline, which CSS places inside the
          line box by font metrics. Here it lands 14px down, so it misses a 4px
          row by 2px.
        </Text>
        <Text style={box} type="body-short-01">
          body-short-01 (14/18). An 18px line height is not a multiple of 4, so
          even the line boxes drift 2px per line against a 4px rhythm.
        </Text>
        <Text style={box} type="label-01">label-01 (12/16)</Text>
        <Text style={box} type="caption-01">caption-01 (12/16)</Text>
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

<!-- docs-only:start -->
<style>
  /* The overlay is fixed to the viewport, so drop the frame's side padding
     to line the Grid up with it, and hide the frame's column guides. */
  :global(body.framed) {
    padding-inline: 0;
  }

  :global(body.framed :not(.bx--content) [class^="bx--col"]) {
    box-shadow: none;
  }
</style>
<!-- docs-only:end -->
