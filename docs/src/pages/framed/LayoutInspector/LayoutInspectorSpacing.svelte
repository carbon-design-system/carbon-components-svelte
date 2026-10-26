<script>
  import { Box, Column, Grid, Row, Text } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";
</script>

<Grid padding>
  <Row>
    <Column>
      <Box marginBottom={6}>
        <Text>
          Hover each box. The card lists every value with its token name, or
          "off-scale" when no token matches.
        </Text>
      </Box>
    </Column>
  </Row>
  <Row>
    <Column sm={4} md={8} lg={5}>
      <Box fill="layer-01" padding={5} marginBottom={6}>
        padding 16 (spacing-05), margin-bottom 24 (spacing-06)
      </Box>
    </Column>
    <Column sm={4} md={8} lg={5}>
      <div class="off-scale">
        padding 15 / 16, margin-bottom 20: two values off the scale
      </div>
    </Column>
    <Column sm={4} md={8} lg={6}>
      <Box fill="layer-01" paddingTop={3} paddingX={7} paddingBottom={9}>
        padding 8 / 32 / 48 / 32: mixed, all on the scale
      </Box>
    </Column>
  </Row>
</Grid>

<LayoutInspector open />

<style>
  /* Off the spacing scale on purpose. This is a plain element: on a Carbon
     component such as Box, the card would read "set by Carbon". */
  .off-scale {
    margin-bottom: 20px;
    padding: 15px 1rem;
    background: var(--cds-layer-01);
  }
</style>
