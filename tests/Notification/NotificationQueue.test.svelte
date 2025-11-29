<svelte:options accessors />

<script lang="ts">
  import { NotificationQueue } from "carbon-components-svelte";
  import type NotificationQueueComponent from "carbon-components-svelte/Notification/NotificationQueue.svelte";
  import type { ComponentProps } from "svelte";

  export let position: ComponentProps<NotificationQueue>["position"] =
    "top-right";
  export let offsetTop: ComponentProps<NotificationQueue>["offsetTop"] =
    undefined;
  export let offsetBottom: ComponentProps<NotificationQueue>["offsetBottom"] =
    undefined;
  export let offsetRight: ComponentProps<NotificationQueue>["offsetRight"] =
    undefined;
  export let zIndex: ComponentProps<NotificationQueue>["zIndex"] = undefined;
  export let maxNotifications: ComponentProps<NotificationQueue>["maxNotifications"] =
    undefined;

  export let queue: NotificationQueueComponent | undefined = undefined;
</script>

<NotificationQueue
  {position}
  {offsetTop}
  {offsetBottom}
  {offsetRight}
  {zIndex}
  {maxNotifications}
  bind:this={queue}
/>

