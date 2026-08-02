<script>
  import { Button, NotificationQueue } from "carbon-components-svelte";

  let queue;

  async function save() {
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
</script>

<NotificationQueue bind:this={queue} />

<Button
  on:click={() => {
    queue.promise(save(), {
      loading: "Saving...",
      success: "Changes saved",
      error: "Failed to save",
    });
  }}
>
  Save
</Button>
