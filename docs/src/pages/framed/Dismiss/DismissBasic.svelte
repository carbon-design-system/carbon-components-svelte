<script>
  import { Button, dismiss, Tile } from "carbon-components-svelte";

  let open = false;
  let trigger;
  let panel;

  function handleOutsideClick(event) {
    if (
      panel &&
      !panel.contains(event.target) &&
      !trigger.contains(event.target)
    ) {
      open = false;
    }
  }
</script>

<div bind:this={trigger} style="display: inline-block">
  <Button kind="tertiary" on:click={() => (open = !open)}>
    Filter by region
  </Button>
</div>

{#if open}
  <div
    bind:this={panel}
    use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
    style="margin-top: var(--cds-spacing-03); max-width: 20rem"
  >
    <Tile>
      <p>US East (N. Virginia)</p>
      <p>EU West (Frankfurt)</p>
      <p>Asia Pacific (Tokyo)</p>
    </Tile>
  </div>
{/if}
