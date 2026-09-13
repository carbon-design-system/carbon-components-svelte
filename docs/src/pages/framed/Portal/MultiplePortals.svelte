<script>
  import { Button, ButtonSet, Portal } from "carbon-components-svelte";

  let showPortal1 = false;
  let showPortal2 = false;
</script>

<ButtonSet>
  <Button on:click={() => (showPortal1 = !showPortal1)}>
    {showPortal1 ? "Hide system alert" : "Show system alert"}
  </Button>
  <Button on:click={() => (showPortal2 = !showPortal2)}>
    {showPortal2 ? "Hide maintenance notice" : "Show maintenance notice"}
  </Button>
</ButtonSet>

{#if showPortal1}
  <Portal> System alert: API latency is elevated </Portal>
{/if}

{#if showPortal2}
  <Portal> Maintenance notice: scheduled downtime at 2:00 AM UTC </Portal>
{/if}
