<script>
  import { getContext } from "svelte";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? false;
  const multiple = ctx?.multiple ?? false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  role={selection ? (multiple ? "group" : "radiogroup") : "rowgroup"}
  class:bx--structured-list-tbody={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
