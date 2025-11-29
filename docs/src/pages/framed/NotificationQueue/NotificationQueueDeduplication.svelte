<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let queue;
  let count = 0;
</script>

<NotificationQueue bind:this={queue} />

<ButtonSet>
  <Button
    on:click={() => {
      queue.add({
        id: "id",
        kind: "warning",
        title: "Duplicate notification",
        subtitle:
          "This notification has the same id. Click the button multiple times.",
      });
    }}
  >
    Add duplicate
  </Button>
  <Button
    on:click={() => {
      queue.add({
        id: "id-" + count++,
        kind: "info",
        title: "Unique notification",
        subtitle: "This has a unique id, so it will always appear.",
      });
    }}
  >
    Add unique
  </Button>
</ButtonSet>
