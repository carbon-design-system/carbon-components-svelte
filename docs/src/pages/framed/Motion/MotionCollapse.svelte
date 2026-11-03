<script>
  import { Box, Button, Stack } from "carbon-components-svelte";
  import { collapse } from "carbon-components-svelte/motion";

  let open = false;
</script>

<Stack gap={5} align="start">
  <Button kind="tertiary" size="small" on:click={() => (open = !open)}>
    {open ? "Hide details" : "Show details"}
  </Button>
  <div use:collapse={open}>
    <Box fill="layer-01" padding={5} maxWidth="24rem">
      <Stack gap={3}>
        <p>
          Collapsed content stays mounted, so its state survives, and it is
          inert, so keyboard focus skips it.
        </p>
        <a href="#top">A link inside the details</a>
      </Stack>
    </Box>
  </div>
  <p>Content below moves with the details.</p>
</Stack>
