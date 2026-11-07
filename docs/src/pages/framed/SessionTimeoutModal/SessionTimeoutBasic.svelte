<script>
  import {
    Button,
    createIdleTimer,
    SessionTimeoutModal,
    Stack,
  } from "carbon-components-svelte";

  let log = [];

  // A 15 minute session that warns 2 minutes before it ends.
  const timer = createIdleTimer({
    timeout: 15 * 60 * 1000,
    warnBefore: 2 * 60 * 1000,
    onExpire: ({ reason, remote }) => {
      // Every tab runs this. Call the server once, from the tab that ended it.
      log = [...log, remote ? `${reason} (other tab)` : reason];
    },
  });

  // For this demo only: jump to the last 2 minutes instead of waiting 13.
  function previewWarning() {
    timer.setExpiresAt(Date.now() + 2 * 60 * 1000);
  }
</script>

<Stack gap={5}>
  <p>
    Status: {$timer.status}.
    {#if log.length > 0}Ended by: {log.join(", ")}.{/if}
  </p>
  <Button kind="tertiary" on:click={previewWarning}>Preview the warning</Button>
</Stack>

<SessionTimeoutModal {timer} on:signin={() => timer.reset()} />
