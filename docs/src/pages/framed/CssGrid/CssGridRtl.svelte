<script>
  import {
    CssColumn,
    CssGrid,
    LayoutDirection,
  } from "carbon-components-svelte";
</script>

<LayoutDirection dir="rtl">
  <CssGrid narrow>
    <CssColumn sm={{ span: 2, start: 1 }} lg={{ span: 6, start: 1 }}>
      Start 1
    </CssColumn>
    <CssColumn sm={{ span: 2, start: 3 }} lg={{ span: 6, start: 11 }}>
      sm: start 3, lg: start 11
    </CssColumn>
  </CssGrid>
</LayoutDirection>
