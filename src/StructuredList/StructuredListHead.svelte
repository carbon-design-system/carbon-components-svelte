<script>
  import { getContext } from "svelte";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? false;
</script>

<div
  role={selection ? undefined : "rowgroup"}
  class:bx--structured-list-thead={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
