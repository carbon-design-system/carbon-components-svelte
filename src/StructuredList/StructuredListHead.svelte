<script>
  // @ts-check
  import { setContext } from "svelte";

  setContext("StructuredListHead", {});
</script>

<div {...$$restProps} role="rowgroup" class:bx--structured-list-thead="{true}">
  <slot />
</div>
