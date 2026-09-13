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
        title: "Deployment succeeded",
        subtitle: "Build #482 deployed to production.",
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
        title: "API rate limit exceeded",
        subtitle: "Requests are being throttled. Try again in 60 seconds.",
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
        title: "Scheduled maintenance",
        subtitle: "Maintenance window begins tonight at 10:00 PM UTC.",
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
        title: "Certificate expiring soon",
        subtitle: "TLS certificate for api.example.com expires in 7 days.",
        timeout: 3000,
      });
    }}
  >
    Show warning
  </Button>
</ButtonSet>
