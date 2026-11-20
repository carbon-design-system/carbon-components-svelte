<script>
  import {
    Button,
    createIdleTimer,
    SessionTimeoutModal,
  } from "carbon-components-svelte";

  const timer = createIdleTimer({
    timeout: 30 * 60 * 1000,
    warnBefore: 5 * 60 * 1000,
  });

  // For this demo only: jump to the last 5 minutes.
  function previewWarning() {
    timer.setExpiresAt(Date.now() + 5 * 60 * 1000);
  }
</script>

<Button kind="tertiary" on:click={previewWarning}>Preview the warning</Button>

<SessionTimeoutModal
  {timer}
  heading="Still there?"
  description={"For your security, we sign you out after 30 minutes without activity. You will be signed out in {time}."}
  extendText="Keep working"
  signOutText="Sign out now"
  announceAt={[240, 120, 60, 30, 10]}
  announcement={(seconds) =>
    seconds >= 60
      ? `You will be signed out in ${seconds / 60} minutes`
      : `You will be signed out in ${seconds} seconds`}
  on:signin={() => timer.reset()}
/>
