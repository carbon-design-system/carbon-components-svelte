<script lang="ts">
  import { Grid, Row, Column } from "../types";
</script>

<Grid>
  <Row>
    <Column
      sm="{{ span: 1, offset: 3 }}"
      style="outline: 1px solid var(--cds-interactive-04)"
    >
      Offset 3
    </Column>
    <Column
      sm="{{ span: 2, offset: 2 }}"
      style="outline: 1px solid var(--cds-interactive-04)"
    >
      Offset 2
    </Column>
    <Column
      sm="{{ span: 3, offset: 1 }}"
      style="outline: 1px solid var(--cds-interactive-04)"
    >
      Offset 1
    </Column>
    <Column
      sm="{{ span: 4, offset: 0 }}"
      style="outline: 1px solid var(--cds-interactive-04)"
    >
      Offset 0
    </Column>
  </Row>
</Grid>
