<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let queue;
</script>

<NotificationQueue bind:this={queue} />

<ButtonSet>
  <Button
    on:click={() => {
      queue.add({
        kind: "success",
        title: "Success",
        subtitle: "Your changes have been saved.",
        timeout: 3000,
      });
    }}
  >
    Show success
  </Button>
  <Button
    kind="tertiary"
    on:click={() => {
      queue.add({
        kind: "error",
        title: "Error",
        subtitle: "An error occurred while processing your request.",
        timeout: 3000,
      });
    }}
  >
    Show error
  </Button>
  <Button
    kind="tertiary"
    on:click={() => {
      queue.add({
        kind: "info",
        title: "Information",
        subtitle: "New updates are available.",
        timeout: 3000,
      });
    }}
  >
    Show info
  </Button>
  <Button
    kind="tertiary"
    on:click={() => {
      queue.add({
        kind: "warning",
        title: "Warning",
        subtitle: "This is a warning notification.",
        timeout: 3000,
      });
    }}
  >
    Show warning
  </Button>
</ButtonSet>

