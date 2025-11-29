<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let queue;
</script>

<NotificationQueue bind:this={queue} />

<ButtonSet>
  <Button
    on:click={() => {
      queue.add({
        kind: "warning",
        title: "Persistent notification",
        subtitle: "This notification has no close button and will not auto-dismiss.",
        hideCloseButton: true,
      });
    }}
  >
    Add persistent
  </Button>
  <Button
    on:click={() => {
      queue.add({
        kind: "info",
        title: "Auto-dismiss notification",
        subtitle: "This notification has no close button but will auto-dismiss after 3 seconds.",
        hideCloseButton: true,
        timeout: 3000,
      });
    }}
  >
    Add auto-dismiss
  </Button>
  <Button
    on:click={() => {
      queue.clear();
    }}
  >
    Clear all
  </Button>
</ButtonSet>

