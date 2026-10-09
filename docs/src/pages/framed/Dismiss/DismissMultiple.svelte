<script>
  import { Button, dismiss, Tile } from "carbon-components-svelte";

  let open = false;
  let trigger;
  let panel;

  function handleKeydown(event) {
    if (event.key === "Escape") open = false;
  }

  function handleClick(event) {
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
    Open notifications
  </Button>
</div>

{#if open}
  <div
    bind:this={panel}
    use:dismiss={{
      enabled: open,
      listeners: [
        { type: "keydown", handler: handleKeydown },
        { type: "click", handler: handleClick },
      ],
    }}
    style="margin-top: var(--cds-spacing-03); max-width: 20rem"
  >
    <Tile>
      <p>Build 4821 passed on main.</p>
      <p>Deployment to staging is waiting for approval.</p>
    </Tile>
  </div>
{/if}
