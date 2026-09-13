<script>
  import { Button, NotificationQueue } from "carbon-components-svelte";

  let queue;
  let count = 0;
</script>

<NotificationQueue bind:this={queue} maxNotifications={5} />

<Button
  on:click={() => {
      count++;
      queue.add({
        kind: "success",
        title: `Backup job ${count} completed`,
      });
    }}
>
  Add notification
</Button>
