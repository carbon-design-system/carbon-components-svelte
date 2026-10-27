<svelte:options accessors />

<script lang="ts">
  import NotificationQueue from "carbon-components-svelte/Notification/NotificationQueue.svelte";
  import type { ComponentProps } from "svelte";
  import NotificationQueueApiChild from "./NotificationQueueApiChild.test.svelte";

  export let maxNotifications: ComponentProps<NotificationQueue>["maxNotifications"] =
    undefined;
  export let api: ComponentProps<NotificationQueueApiChild>["api"] = undefined;
</script>

<NotificationQueue {maxNotifications}>
  <NotificationQueueApiChild bind:api />
</NotificationQueue>
