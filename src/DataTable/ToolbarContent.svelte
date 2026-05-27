<script>
  import { getContext, onMount } from "svelte";

  const ctx = getContext("carbon:Toolbar") ?? {};

  let batchActionsActive = false;

  let unsubscribe;
  if (ctx?.batchActionsActive) {
    unsubscribe = ctx.batchActionsActive.subscribe((value) => {
      batchActionsActive = value;
    });
  }

  onMount(() => {
    return () => {
      unsubscribe?.();
    };
  });

  $: inertProps = batchActionsActive ? { inert: true } : {};
</script>

<div class:bx--toolbar-content={true} {...inertProps}><slot /></div>
