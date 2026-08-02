<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let topRightQueue;
  let topCenterQueue;
  let topLeftQueue;
  let bottomRightQueue;
  let bottomCenterQueue;
  let bottomLeftQueue;
</script>

<NotificationQueue bind:this={topRightQueue} position="top-right" />
<NotificationQueue bind:this={topCenterQueue} position="top-center" />
<NotificationQueue bind:this={topLeftQueue} position="top-left" />
<NotificationQueue bind:this={bottomRightQueue} position="bottom-right" />
<NotificationQueue bind:this={bottomCenterQueue} position="bottom-center" />
<NotificationQueue bind:this={bottomLeftQueue} position="bottom-left" />

<ButtonSet>
  <Button
    on:click={() => {
      topLeftQueue.add({
        kind: "info",
        title: "Top left",
      });
    }}
  >
    Add top left
  </Button>
  <Button
    on:click={() => {
      topCenterQueue.add({
        kind: "success",
        title: "Top center",
      });
    }}
  >
    Add top center
  </Button>
  <Button
    on:click={() => {
      topRightQueue.add({
        kind: "success",
        title: "Top right",
      });
    }}
  >
    Add top right
  </Button>
</ButtonSet>
<br>
<ButtonSet>
  <Button
    on:click={() => {
      bottomLeftQueue.add({
        kind: "warning",
        title: "Bottom left",
      });
    }}
  >
    Add bottom left
  </Button>
  <Button
    on:click={() => {
      bottomCenterQueue.add({
        kind: "info",
        title: "Bottom center",
      });
    }}
  >
    Add bottom center
  </Button>
  <Button
    on:click={() => {
      bottomRightQueue.add({
        kind: "info",
        title: "Bottom right",
      });
    }}
  >
    Add bottom right
  </Button>
</ButtonSet>
