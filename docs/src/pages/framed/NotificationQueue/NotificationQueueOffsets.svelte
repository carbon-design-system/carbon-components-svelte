<script>
  import { Button, NotificationQueue } from "carbon-components-svelte";

  let queue;
</script>

<NotificationQueue
  bind:this={queue}
  position="top-right"
  offsetTop="5rem"
  offsetRight="2rem"
/>

<Button
    on:click={() => {
      queue.add({
        kind: "success",
        title: "Custom offset",
      });
    }}
  >
    Add notification
  </Button>

