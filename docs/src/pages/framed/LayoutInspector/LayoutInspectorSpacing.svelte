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
      <div class="box" style="padding: 1rem; margin-bottom: 1.5rem;">
        padding 16 (spacing-05), margin-bottom 24 (spacing-06)
      </div>
    </Column>
    <Column sm={4} md={8} lg={5}>
      <div class="box" style="padding: 15px 1rem; margin-bottom: 20px;">
        padding 15 / 16, margin-bottom 20: two values off the scale
      </div>
    </Column>
    <Column sm={4} md={8} lg={6}>
      <div class="box" style="padding: 0.5rem 2rem 3rem;">
        padding 8 / 32 / 48 / 32: mixed, all on the scale
      </div>
    </Column>
  </Row>
</Grid>

<LayoutInspector open />

<style>
  .box {
    background: var(--cds-layer);
    outline: 1px solid var(--cds-border-subtle);
  }
</style>
