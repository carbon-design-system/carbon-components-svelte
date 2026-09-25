<script>
  import { CssColumn, CssGrid } from "carbon-components-svelte";
</script>

<CssGrid>
  <CssColumn sm={4} md={4} lg={8}>sm: 4, md: 4, lg: 8</CssColumn>
  <CssColumn sm={2} md={2} lg={4}>sm: 2, md: 2, lg: 4</CssColumn>
  <CssColumn sm={2} md={2} lg={4}>sm: 2, md: 2, lg: 4</CssColumn>
  <CssColumn sm={0} md={8} lg={16}>sm: 0 (hidden), md: 8, lg: 16</CssColumn>
</CssGrid>
