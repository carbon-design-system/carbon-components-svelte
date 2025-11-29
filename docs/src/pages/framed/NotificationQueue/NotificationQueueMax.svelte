<script>
  import { Button, NotificationQueue } from "carbon-components-svelte";

  let queue;
  let count = 0;
</script>

<NotificationQueue bind:this={queue} maxNotifications={3} />

  <Button
    on:click={() => {
      count++;
      queue.add({
        kind: "success",
        title: "Notification " + count,
      });
    }}
  >
    Add notification
  </Button>

