<script>
  import {
    createIdleTimer,
    SessionTimeoutModal,
    Stack,
  } from "carbon-components-svelte";

  let log = [];

  // Open this page in a second tab. Activity in either tab extends both,
  // and signing out of one signs out the other.
  const timer = createIdleTimer({
    timeout: 3 * 60 * 1000,
    warnBefore: 2 * 60 * 1000,
    crossTab: true,
    channelName: "docs-session-timeout",
    onWarn: () => (log = [...log, "warning"]),
    onExpire: ({ reason, remote }) =>
      (log = [...log, `${reason}${remote ? " (other tab)" : ""}`]),
  });
</script>

<Stack gap={3}>
  <p>Status: {$timer.status}.</p>
  <p>Events: {log.length > 0 ? log.join(", ") : "none yet"}.</p>
</Stack>

<SessionTimeoutModal {timer} on:signin={() => timer.reset()} />
