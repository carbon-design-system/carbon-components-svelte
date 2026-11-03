<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { ComponentProps } from "svelte";

  export let open = true;
  export let transition: ComponentProps<InlineNotification>["transition"] =
    undefined;
  export let motionNotification: MotionValue = undefined;
</script>

<Motion notification={motionNotification}>
  <InlineNotification
    {open}
    {transition}
    title="Saved"
    subtitle="Your changes were saved."
  />
</Motion>
