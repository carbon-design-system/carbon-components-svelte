<script lang="ts">
  import SessionTimeoutModal from "carbon-components-svelte/SessionTimeout/SessionTimeoutModal.svelte";
  import { createIdleTimer } from "../../src/utils/idle-timer.js";

  const timer = createIdleTimer({ timeout: 900_000, crossTab: true });
</script>

<SessionTimeoutModal {timer} />
