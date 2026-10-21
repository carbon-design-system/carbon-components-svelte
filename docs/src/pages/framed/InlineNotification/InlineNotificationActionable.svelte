<script>
  import {
    Button,
    InlineNotification,
    NotificationActionButton,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5} align="start">
  <Button kind="danger" disabled={open} on:click={() => (open = true)}>
    Delete API key
  </Button>

  <InlineNotification
    bind:open
    actionable
    kind="success"
    title="API key deleted:"
    subtitle="Requests that use the key now fail."
  >
    <svelte:fragment slot="actions">
      <NotificationActionButton on:click={() => (open = false)}>
        Undo
      </NotificationActionButton>
    </svelte:fragment>
  </InlineNotification>
</Stack>
