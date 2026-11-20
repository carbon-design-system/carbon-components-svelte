<script>
  import {
    Box,
    Button,
    Splitter,
    Stack,
    WebTerminal,
  } from "carbon-components-svelte";

  let open = true;
  let maximized = false;
  let size = 55;

  function execute(command) {
    return `ran ${command}`;
  }
</script>

<Box height="24rem" border="subtle">
  <Splitter
    orientation="vertical"
    bind:size
    bind:collapsed={maximized}
    collapsedSize={0}
    min="120px"
    max={85}
    separatorLabel="Resize terminal"
    disabled={!open}
  >
    <Box slot="start" padding={5}>
      <Stack gap={5}>
        <p>
          Page content stays above the terminal. Drag the separator, or focus it
          and use the arrow keys.
        </p>
        <Button size="small" kind="tertiary" on:click={() => (open = !open)}>
          {open ? "Close terminal" : "Open terminal"}
        </Button>
      </Stack>
    </Box>
    <svelte:fragment slot="end">
      {#if open}
        <WebTerminal
          {execute}
          bind:maximized
          height="100%"
          maximizable
          title="Cloud shell"
          labelText="Cloud shell output"
        />
      {/if}
    </svelte:fragment>
  </Splitter>
</Box>
