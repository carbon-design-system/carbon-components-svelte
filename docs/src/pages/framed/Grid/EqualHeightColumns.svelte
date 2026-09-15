<script>
  import { Column, Grid, Row, Tile } from "carbon-components-svelte";
</script>

<Grid>
  <Row>
    <Column sm={4} md={4} lg={8}>
      <Tile fullHeight>Requests per minute: 4,201</Tile>
    </Column>
    <Column sm={4} md={4} lg={8}>
      <Tile fullHeight
        >Error rate: 0.3% over the last hour, down from 0.8% yesterday</Tile
      >
    </Column>
  </Row>
</Grid>
