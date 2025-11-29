<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let queue;
  let notificationIds = [];
</script>

<NotificationQueue bind:this={queue} />

<ButtonSet>
  <Button
    on:click={() => {
      const id = queue.add({
        kind: "info",
        title: "Removable notification",
        subtitle: "This notification can be removed programmatically.",
        timeout: 0,
      });
      notificationIds = [...notificationIds, id];
    }}
  >
    Add notification
  </Button>
  <Button
    on:click={() => {
      if (notificationIds.length > 0) {
        const id = notificationIds[notificationIds.length - 1];
        queue.remove(id);
        notificationIds = notificationIds.slice(0, -1);
      }
    }}
  >
    Remove last
  </Button>
  <Button
    on:click={() => {
      queue.clear();
      notificationIds = [];
    }}
  >
    Clear all
  </Button>
</ButtonSet>

