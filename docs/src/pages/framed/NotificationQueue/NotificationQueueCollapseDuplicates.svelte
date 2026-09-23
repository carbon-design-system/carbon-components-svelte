<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let queue;
</script>

<NotificationQueue bind:this={queue} collapseDuplicates />

<ButtonSet>
  <Button
    on:click={() => {
      queue.add({
        kind: "error",
        title: "Connection lost",
        subtitle: "Retrying in the background.",
        timeout: 5_000,
      });
    }}
  >
    Add duplicate
  </Button>
  <Button
    kind="secondary"
    on:click={() => {
      queue.add({
        kind: "success",
        title: "Connection restored",
        timeout: 5_000,
      });
    }}
  >
    Add different
  </Button>
</ButtonSet>
