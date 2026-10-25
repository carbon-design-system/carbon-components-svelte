<script>
  import { Box, Button, dismiss, Tile } from "carbon-components-svelte";

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

<Box bind:ref={trigger} display="inline-flex">
  <Button kind="tertiary" on:click={() => (open = !open)}>
    Filter by region
  </Button>
</Box>

{#if open}
  <Box marginTop={3} maxWidth="20rem">
    <div
      bind:this={panel}
      use:dismiss={{
        enabled: open,
        type: "click",
        handler: handleOutsideClick,
      }}
    >
      <Tile>
        <p>US East (N. Virginia)</p>
        <p>EU West (Frankfurt)</p>
        <p>Asia Pacific (Tokyo)</p>
      </Tile>
    </div>
  </Box>
{/if}
