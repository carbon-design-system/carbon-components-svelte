<script>
  import { Box, Button, Popover } from "carbon-components-svelte";

  let open = false;
</script>

<Box position="relative">
  <Button on:click={() => (open = !open)}>Quick settings</Button>
  <Popover transition bind:open align="bottom-start" closeOnEscape>
    Adjust table density and default sort order for this workspace.
  </Popover>
</Box>
