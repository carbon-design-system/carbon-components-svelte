<script>
  import { CssColumn, CssGrid } from "carbon-components-svelte";
</script>

<CssGrid>
  <CssColumn sm={{ start: 2, end: 5 }} lg={{ start: 5, end: 13 }}>
    sm: lines 2–5, lg: lines 5–13
  </CssColumn>
  <CssColumn sm={{ span: 2, start: 3 }} lg={{ span: 4, start: 13 }}>
    sm: span 2 from line 3, lg: span 4 from line 13
  </CssColumn>
</CssGrid>
