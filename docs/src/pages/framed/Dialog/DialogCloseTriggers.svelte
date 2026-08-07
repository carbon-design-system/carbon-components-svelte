<script>
  import { Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;
  let lastTrigger = null;
</script>

<Stack gap={5}>
  <Button on:click={() => (open = true)}>Open modal dialog</Button>
  {#if lastTrigger}
    <p>Last close trigger: <code>{lastTrigger}</code></p>
  {/if}
</Stack>

<Dialog
  bind:open
  modal
  aria-label="Close trigger example"
  on:close={(e) => {
    lastTrigger = e.detail.trigger;
    console.log("close", e.detail);
  }}
>
  <Stack gap={5}>
    <p>
      Dismiss with <kbd>Escape</kbd>, the backdrop, the close button, or by
      setting <code>open</code> to <code>false</code>.
    </p>
    <form method="dialog">
      <Button type="submit">Close</Button>
    </form>
  </Stack>
</Dialog>
