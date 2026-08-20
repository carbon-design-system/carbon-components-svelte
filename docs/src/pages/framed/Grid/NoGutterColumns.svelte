<script>
  import { Column, Grid, Row, Stack } from "carbon-components-svelte";
</script>

<Stack gap={5}>
  <div style="padding: var(--cds-spacing-05)">
    Adding noGutter to Grid removes the gutter from every column:
  </div>

  <Grid noGutter>
    <Row>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
    </Row>
  </Grid>

  <div style="padding: var(--cds-spacing-05)">
    Adding noGutterLeft or noGutterRight to individual columns removes only that
    side's gutter—useful for flushing a column against a page edge or divider:
  </div>

  <Grid>
    <Row>
      <Column noGutterLeft>No left gutter</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column noGutterRight>No right gutter</Column>
    </Row>
  </Grid>
</Stack>
