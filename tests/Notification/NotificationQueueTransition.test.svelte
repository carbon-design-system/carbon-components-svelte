<svelte:options accessors />

<script lang="ts">
  import type NotificationQueueComponent from "carbon-components-svelte/Notification/NotificationQueue.svelte";
  import NotificationQueue from "carbon-components-svelte/Notification/NotificationQueue.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { ComponentProps } from "svelte";

  export let position: ComponentProps<NotificationQueue>["position"] =
    "top-right";
  export let transition: ComponentProps<NotificationQueue>["transition"] =
    undefined;
  export let motionNotification: MotionValue = undefined;
  export let maxNotifications: ComponentProps<NotificationQueue>["maxNotifications"] =
    undefined;

  export let queue: NotificationQueueComponent | undefined = undefined;
</script>

<Motion notification={motionNotification}>
  <NotificationQueue
    {position}
    {transition}
    {maxNotifications}
    bind:this={queue}
  />
</Motion>
