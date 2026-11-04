<script>
  import { getContext, onMount } from "svelte";

  const ctx = getContext("carbon:Toolbar") ?? {};

  let batchActionsActive = false;

  /** @type {undefined | (() => void)} */
  let unsubscribe;
  if (ctx?.batchActionsActive) {
    unsubscribe = ctx.batchActionsActive.subscribe(
      /** @param {boolean} value */
      (value) => {
        batchActionsActive = value;
      },
    );
  }

  onMount(() => {
    return () => {
      unsubscribe?.();
    };
  });

  $: inertProps = batchActionsActive ? { inert: true } : {};
</script>

<div class:bx--toolbar-content={true} {...inertProps}><slot /></div>
