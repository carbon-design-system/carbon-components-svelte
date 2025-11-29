<script>
  import { Button, ButtonSet, Portal } from "carbon-components-svelte";

  let showPortal1 = false;
  let showPortal2 = false;
</script>

<ButtonSet>
  <Button on:click={() => (showPortal1 = !showPortal1)}>
    {showPortal1 ? "Unmount portal 1" : "Mount portal 1"}
  </Button>
  <Button on:click={() => (showPortal2 = !showPortal2)}>
    {showPortal2 ? "Unmount portal 2" : "Mount portal 2"}
  </Button>
</ButtonSet>

{#if showPortal1}
  <Portal>
    Portal content 1
  </Portal>
{/if}

{#if showPortal2}
  <Portal>
    Portal content 2
  </Portal>
{/if}
