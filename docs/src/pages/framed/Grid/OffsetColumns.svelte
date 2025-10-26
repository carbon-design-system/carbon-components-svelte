<script>
  import { Column, Grid, Row } from "carbon-components-svelte";
</script>

<Grid>
  <Row>
    <Column sm={{ span: 1, offset: 3 }}>Offset 3</Column>
    <Column sm={{ span: 2, offset: 2 }}>Offset 2</Column>
    <Column sm={{ span: 3, offset: 1 }}>Offset 1</Column>
    <Column sm={{ span: 4, offset: 0 }}>Offset 0</Column>
  </Row>
</Grid>
