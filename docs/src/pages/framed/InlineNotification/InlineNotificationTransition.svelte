<script>
  import { Button, InlineNotification, Stack } from "carbon-components-svelte";

  let open = true;
</script>

<Stack gap={5} align="start">
  <Button kind="tertiary" disabled={open} on:click={() => (open = true)}>
    Show notification
  </Button>
  <InlineNotification
    bind:open
    transition
    kind="info"
    title="Update available"
    subtitle="Restart the app to finish installing."
  />
  <p>The content below moves with the notification.</p>
</Stack>
