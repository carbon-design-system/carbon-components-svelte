<script lang="ts">
  import CssColumn from "carbon-components-svelte/Grid/CssColumn.svelte";
  import type { ComponentProps } from "svelte";

  export let span: ComponentProps<CssColumn>["span"] = undefined;
  export let sm: ComponentProps<CssColumn>["sm"] = undefined;
  export let md: ComponentProps<CssColumn>["md"] = undefined;
  export let lg: ComponentProps<CssColumn>["lg"] = undefined;
  export let xlg: ComponentProps<CssColumn>["xlg"] = undefined;
  export let max: ComponentProps<CssColumn>["max"] = undefined;
</script>

<CssColumn {span} {sm} {md} {lg} {xlg} {max} data-testid="test-col"
  >Column content</CssColumn
>

<!-- Type-check fixture: a percent span inside a descriptor must be
     assignable, matching the string branch CssColumn handles. -->
<CssColumn md={{ span: "50%", start: 2 }} data-testid="test-col-descriptor-pct"
  >Column content</CssColumn
>
