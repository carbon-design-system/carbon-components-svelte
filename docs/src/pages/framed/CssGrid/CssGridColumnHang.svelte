<script>
  import { CssColumn, CssGrid, Stack } from "carbon-components-svelte";
</script>

<Stack gap={4}>
  <CssGrid>
    <CssColumn sm={4} md={8} lg={16}>
      <p>Wide</p>
    </CssColumn>
  </CssGrid>
  <CssGrid narrow>
    <CssColumn sm={4} md={8} lg={16}>
      <p class="bx--grid-column-hang">Narrow, hung</p>
    </CssColumn>
  </CssGrid>
  <CssGrid condensed>
    <CssColumn sm={4} md={8} lg={16}>
      <p class="bx--grid-column-hang">Condensed, hung</p>
    </CssColumn>
  </CssGrid>
</Stack>
