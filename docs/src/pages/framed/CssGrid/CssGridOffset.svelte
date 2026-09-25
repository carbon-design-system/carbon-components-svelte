<script>
  import { CssColumn, CssGrid } from "carbon-components-svelte";
</script>

<CssGrid>
  <CssColumn sm={{ span: 1, offset: 3 }} lg={{ span: 4, offset: 12 }}>
    offset 3 / 12
  </CssColumn>
  <CssColumn sm={{ span: 2, offset: 2 }} lg={{ span: 8, offset: 8 }}>
    offset 2 / 8
  </CssColumn>
  <CssColumn sm={{ span: 3, offset: 1 }} lg={{ span: 12, offset: 4 }}>
    offset 1 / 4
  </CssColumn>
</CssGrid>
