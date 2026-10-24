<script lang="ts">
  import CssColumn from "carbon-components-svelte/Grid/CssColumn.svelte";
  import type { ComponentProps } from "svelte";

  export let span: ComponentProps<CssColumn>["span"] = undefined;
  export let sm: ComponentProps<CssColumn>["sm"] = undefined;
  export let md: ComponentProps<CssColumn>["md"] = undefined;
  export let lg: ComponentProps<CssColumn>["lg"] = undefined;
  export let xlg: ComponentProps<CssColumn>["xlg"] = undefined;
  export let max: ComponentProps<CssColumn>["max"] = undefined;
  export let align: ComponentProps<CssColumn>["align"] = undefined;
  export let as = false;
</script>

{#if as}
  <CssColumn as {sm} data-testid="col" class="custom" let:props>
    <article {...props}>Column content</article>
  </CssColumn>
{:else}
  <CssColumn {span} {sm} {md} {lg} {xlg} {max} {align} data-testid="col">
    Column content
  </CssColumn>
{/if}
