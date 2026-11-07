<script>
  import { Button, captureFocusTarget, Stack } from "carbon-components-svelte";

  let open = false;
  let panel;
  let trigger;

  function close() {
    // `fallback` is where focus goes when the panel had it and nothing in
    // the panel's place can take it.
    const restore = captureFocusTarget(panel, { fallback: () => trigger });
    open = false;
    restore();
  }
</script>

<Stack gap={4}>
  <Button bind:ref={trigger} on:click={() => (open = true)}>Open details</Button
  >
  {#if open}
    <div bind:this={panel}>
      <Stack gap={3}>
        <p>Build 4821 passed in 3 minutes.</p>
        <Button size="small" kind="secondary" on:click={close}>Close</Button>
      </Stack>
    </div>
  {/if}
</Stack>
