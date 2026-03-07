<script>
  import { Column, Grid, Row, Stack } from "carbon-components-svelte";
</script>

<Stack gap={5}>
  <div style="padding: var(--cds-spacing-05)">Adding padding to Grid applies it to columns in all rows:</div>

  <Grid padding>
  <Row>
    <Column>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
  </Row>
  </Grid>

  <div style="padding: var(--cds-spacing-05)">Adding padding to a Row only applies to its columns:</div>

  <Grid>
  <Row padding>
    <Column>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
  </Row>
  <Row>
    <Column>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
  </Row>
  </Grid>

  <div style="padding: var(--cds-spacing-05)">Adding padding to a specific column only applies it to the column:</div>

  <Grid>
  <Row>
    <Column padding>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
    <Column>Column</Column>
  </Row>
  </Grid>
</Stack>
