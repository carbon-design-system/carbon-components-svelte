<script>
  import { CssColumn, CssGrid } from "carbon-components-svelte";
</script>

<CssGrid withRowGap>
  <CssColumn sm={4} md={8} lg={4}>Outer column</CssColumn>
  <CssColumn sm={4} md={8} lg={12}>
    <CssGrid withRowGap>
      <CssColumn sm={2} md={4} lg={4}>Subgrid column</CssColumn>
      <CssColumn sm={2} md={4} lg={4}>Subgrid column</CssColumn>
      <CssColumn sm={2} md={4} lg={4}>Subgrid column</CssColumn>
    </CssGrid>
  </CssColumn>
  <CssColumn sm={2} md={4} lg={4}>Outer column</CssColumn>
  <CssColumn sm={2} md={4} lg={4}>Outer column</CssColumn>
  <CssColumn sm={2} md={4} lg={4}>Outer column</CssColumn>
  <CssColumn sm={2} md={4} lg={4}>Outer column</CssColumn>
</CssGrid>
