<script lang="ts">
  import CssColumn from "carbon-components-svelte/Grid/CssColumn.svelte";
  import CssGrid from "carbon-components-svelte/Grid/CssGrid.svelte";
</script>

<CssGrid narrow>
  <CssColumn sm={4} md={{ span: 4, offset: 2 }} lg="50%">
    <CssGrid condensed>
      <CssColumn span={2}>Nested</CssColumn>
    </CssGrid>
  </CssColumn>
</CssGrid>
