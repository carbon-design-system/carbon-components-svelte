<script>
  import { CssColumn, CssGrid } from "carbon-components-svelte";
</script>

<CssGrid withRowGap>
  <CssColumn sm={4} md={8} lg={16}>
    <CssGrid mode="wide">
      <CssColumn sm={2} md={4} lg={8}>mode: wide</CssColumn>
      <CssColumn sm={2} md={4} lg={8}>mode: wide</CssColumn>
    </CssGrid>
  </CssColumn>
  <CssColumn sm={4} md={8} lg={16}>
    <CssGrid mode="narrow">
      <CssColumn sm={2} md={4} lg={8}>mode: narrow</CssColumn>
      <CssColumn sm={2} md={4} lg={8}>mode: narrow</CssColumn>
    </CssGrid>
  </CssColumn>
  <CssColumn sm={4} md={8} lg={16}>
    <CssGrid mode="condensed">
      <CssColumn sm={2} md={4} lg={8}>mode: condensed</CssColumn>
      <CssColumn sm={2} md={4} lg={8}>mode: condensed</CssColumn>
    </CssGrid>
  </CssColumn>
</CssGrid>
