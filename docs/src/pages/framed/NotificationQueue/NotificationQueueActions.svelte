<script>
  import { Button, NotificationQueue, Stack } from "carbon-components-svelte";

  let queue;
  let lastAction = "";

  function showUndo() {
    lastAction = "";
    queue.add({
      kind: "success",
      title: "Item deleted",
      subtitle: "You can undo this action.",
      timeout: 5000,
      actionText: "Undo",
      onAction: () => {
        lastAction = "undone";
        queue.clear();
      },
    });
  }
</script>

<NotificationQueue bind:this={queue} />

<Stack gap={5}>
  <Button on:click={showUndo}>Delete item</Button>

  {#if lastAction === "undone"}
    <p>Item restored.</p>
  {/if}
</Stack>
