<script>
  import { CssColumn, CssGrid } from "carbon-components-svelte";
</script>

<CssGrid withRowGap>
  <CssColumn sm={4} md={8} lg={16}>
    <CssGrid>
      <CssColumn sm={2} md={4} lg={8}>Wide</CssColumn>
      <CssColumn sm={2} md={4} lg={8}>Wide</CssColumn>
    </CssGrid>
  </CssColumn>
  <CssColumn sm={4} md={8} lg={16}>
    <CssGrid narrow>
      <CssColumn sm={2} md={4} lg={8}>Narrow</CssColumn>
      <CssColumn sm={2} md={4} lg={8}>Narrow</CssColumn>
    </CssGrid>
  </CssColumn>
  <CssColumn sm={4} md={8} lg={16}>
    <CssGrid condensed>
      <CssColumn sm={2} md={4} lg={8}>Condensed</CssColumn>
      <CssColumn sm={2} md={4} lg={8}>Condensed</CssColumn>
    </CssGrid>
  </CssColumn>
</CssGrid>
