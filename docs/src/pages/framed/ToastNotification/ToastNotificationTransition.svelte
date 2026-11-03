<script>
  import { Button, Stack, ToastNotification } from "carbon-components-svelte";

  let open = true;
</script>

<Stack gap={5} align="start">
  <Button kind="tertiary" disabled={open} on:click={() => (open = true)}>
    Show notification
  </Button>
  <ToastNotification
    bind:open
    transition
    kind="success"
    title="Report exported"
    subtitle="quarterly-report.csv is ready to download."
    caption="Just now"
  />
</Stack>
