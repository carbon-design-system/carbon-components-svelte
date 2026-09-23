<script>
  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? readable(false);
  const multiple = ctx?.multiple ?? readable(false);
</script>

<div
  role={$selection ? ($multiple ? "group" : "radiogroup") : "rowgroup"}
  class:bx--structured-list-tbody={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
