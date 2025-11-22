<script>
  import { getContext } from "svelte";

  const ctx = getContext("DataTable") ?? {};

  let batchSelectedIds = [];

  if (ctx?.batchSelectedIds) {
    ctx.batchSelectedIds.subscribe((value) => {
      batchSelectedIds = value;
    });
  }

  $: hasBatchSelection = batchSelectedIds.length > 0;
  $: inertProps = hasBatchSelection ? { inert: true } : {};
</script>

<div class:bx--toolbar-content={true} {...inertProps}>
  <slot />
</div>
