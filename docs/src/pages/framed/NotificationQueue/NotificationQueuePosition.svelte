<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let topQueue;
  let bottomQueue;
</script>

<NotificationQueue bind:this={topQueue} position="top-right" />
<NotificationQueue bind:this={bottomQueue} position="bottom-right" />

<ButtonSet>
  <Button
    on:click={() => {
      topQueue.add({
        kind: "success",
        title: "Top right",
      });
    }}
  >
    Add top right
  </Button>
  <Button
    on:click={() => {
      bottomQueue.add({
        kind: "info",
        title: "Bottom right",
      });
    }}
  >
    Add bottom right
  </Button>
</ButtonSet>

