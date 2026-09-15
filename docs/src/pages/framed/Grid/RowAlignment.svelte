<script>
  import { Column, Grid, Row } from "carbon-components-svelte";
</script>

<Grid>
  <Row align="center" style="height: 8rem;" data-outline>
    <Column sm={2} md={4} lg={4}>Centered</Column>
    <Column sm={2} md={4} lg={4} align="end">Self-aligned end</Column>
  </Row>
</Grid>
