<script>
  import {
    Button,
    createIdleTimer,
    SessionTimeoutModal,
    Stack,
  } from "carbon-components-svelte";

  // A token whose `exp` is in seconds, as a server sends it. This one has 3
  // minutes to live, so the 2 minute warning comes after 1.
  let exp = Math.floor(Date.now() / 1000) + 3 * 60;
  let refreshes = 0;

  // Stand-in for a call that renews the token and returns its new `exp`.
  async function refreshToken() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    refreshes += 1;
    exp = Math.floor(Date.now() / 1000) + 3 * 60;
    return { expiresAt: exp * 1000 };
  }

  const timer = createIdleTimer({
    // The token decides when the session ends, and activity does not move it.
    expiresAt: exp * 1000,
    warnBefore: 2 * 60 * 1000,
    // "Stay signed in" calls this. Activity calls it too, at most once a minute.
    onExtend: refreshToken,
    heartbeat: 60 * 1000,
  });
</script>

<Stack gap={5}>
  <p>
    Status: {$timer.status}. Token renewals: {refreshes}.
  </p>
  <Button kind="tertiary" on:click={() => timer.activity()}>
    Count activity
  </Button>
</Stack>

<SessionTimeoutModal {timer} on:signin={() => timer.reset()} />
