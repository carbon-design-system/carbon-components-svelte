<script>
  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? readable(false);
</script>

<div
  role={$selection ? undefined : "rowgroup"}
  class:bx--structured-list-thead={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
