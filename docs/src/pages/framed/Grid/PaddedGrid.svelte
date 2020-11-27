<script>
  import { Grid, Row, Column } from "carbon-components-svelte";
</script>

<Grid narrow padding>
  <Row>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
  </Row>
</Grid>

<Grid narrow>
  <Row padding>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
  </Row>
  <Row>
    <Column padding style="outline: 1px solid var(--cds-interactive-04)">
      Column
    </Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
    <Column style="outline: 1px solid var(--cds-interactive-04)">Column</Column>
  </Row>
</Grid>
