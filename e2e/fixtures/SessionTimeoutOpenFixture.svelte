<script>
  import {
    createIdleTimer,
    SessionTimeoutModal,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  // A session that is already in its warning, or with `?expired` already over,
  // so the dialog is open on load.
  const expired = new URLSearchParams(location.search).has("expired");
  const timer = createIdleTimer({
    expiresAt: Date.now() + (expired ? -1000 : 90000),
    warnBefore: 120000,
  });
  onMount(() => () => timer.stop());
</script>

<main>
  <h1>Account</h1>
  <p>Your changes are saved as you work.</p>
</main>

<SessionTimeoutModal {timer} />
