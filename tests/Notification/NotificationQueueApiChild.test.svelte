<script lang="ts">
  import { getNotificationQueue } from "carbon-components-svelte/Notification/notification-queue-context.js";

  export let api: ReturnType<typeof getNotificationQueue> | undefined =
    undefined;

  api = getNotificationQueue();
</script>
