<script>
  import { CssColumn, CssGrid, Stack } from "carbon-components-svelte";
</script>

<CssGrid>
  <CssColumn sm={1} md={2} lg={4}>
    <Stack gap={3}>
      <p>Tall</p>
      <p>column</p>
      <p>sets the</p>
      <p>row height</p>
    </Stack>
  </CssColumn>
  <CssColumn sm={1} md={2} lg={4} align="start">Start</CssColumn>
  <CssColumn sm={1} md={2} lg={4} align="center">Center</CssColumn>
  <CssColumn sm={1} md={2} lg={4} align="end">End</CssColumn>
</CssGrid>
