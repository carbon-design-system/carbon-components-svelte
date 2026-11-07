<script>
  import { Button, captureFocusTarget } from "carbon-components-svelte";

  let running = true;
  let wrapper;

  function toggle() {
    // Cancel and Retry are two elements. Say where the same place is after
    // the swap.
    const restore = captureFocusTarget(wrapper, {
      find: () => wrapper.querySelector("button"),
    });
    running = !running;
    restore();
  }
</script>

<div bind:this={wrapper}>
  {#if running}
    <Button kind="danger-tertiary" on:click={toggle}>Cancel deploy</Button>
  {:else}
    <Button kind="tertiary" on:click={toggle}>Retry deploy</Button>
  {/if}
</div>
