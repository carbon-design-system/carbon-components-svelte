<script>
  import { getContext } from "svelte";

  const ctx = getContext("Toolbar") ?? {};

  let batchActionsActive = false;

  if (ctx?.batchActionsActive) {
    ctx.batchActionsActive.subscribe((value) => {
      batchActionsActive = value;
    });
  }

  $: inertProps = batchActionsActive ? { inert: true } : {};
</script>

<div class:bx--toolbar-content={true} {...inertProps}>
  <slot />
</div>
