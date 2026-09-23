<script>
  import {
    Button,
    Checkbox,
    NotificationQueue,
    Stack,
  } from "carbon-components-svelte";

  let queue;
  let blockClose = true;
</script>

<NotificationQueue
  bind:this={queue}
  on:close={(e) => {
    if (blockClose && e.detail.id === "unsaved-changes") e.preventDefault();
  }}
/>

<Stack gap={5}>
  <Checkbox bind:checked={blockClose} labelText="Keep the toast when closed" />

  <Button
    on:click={() => {
      queue.add({
        id: "unsaved-changes",
        kind: "warning",
        title: "Unsaved changes",
        subtitle: "Save or discard your changes before closing this.",
      });
    }}
  >
    Add notification
  </Button>
</Stack>
