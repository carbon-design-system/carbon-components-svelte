<script>
  import { Box, Button, dismiss, Tile } from "carbon-components-svelte";

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

<Box bind:ref={trigger} display="inline-flex">
  <Button kind="tertiary" on:click={() => (open = !open)}>
    Open notifications
  </Button>
</Box>

{#if open}
  <Box marginTop={3} maxWidth="20rem">
    <div
      bind:this={panel}
      use:dismiss={{
        enabled: open,
        listeners: [
          { type: "keydown", handler: handleKeydown },
          { type: "click", handler: handleClick },
        ],
      }}
    >
      <Tile>
        <p>Build 4821 passed on main.</p>
        <p>Deployment to staging is waiting for approval.</p>
      </Tile>
    </div>
  </Box>
{/if}
