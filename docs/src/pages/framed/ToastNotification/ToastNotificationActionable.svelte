<script>
  import {
    Button,
    NotificationActionButton,
    Stack,
    ToastNotification,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5} align="start">
  <Button disabled={open} on:click={() => (open = true)}>Upload report</Button>

  <ToastNotification
    bind:open
    actionable
    lowContrast
    title="Upload failed"
    subtitle="The connection timed out before quarterly-report.pdf finished."
    caption={new Date().toLocaleString()}
  >
    <svelte:fragment slot="actions">
      <NotificationActionButton on:click={() => (open = false)}>
        Retry
      </NotificationActionButton>
    </svelte:fragment>
  </ToastNotification>
</Stack>
