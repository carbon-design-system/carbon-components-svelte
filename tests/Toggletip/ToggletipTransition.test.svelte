<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let portalTooltip: boolean | undefined = false;
  export let transition: ComponentProps<Toggletip>["transition"] = undefined;
  export let motionTooltip: MotionValue = undefined;
  export let onOutroEnd: () => void = () => {};
  export let onIntroEnd: () => void = () => {};
</script>

<Motion tooltip={motionTooltip}>
  <Toggletip
    bind:open
    {portalTooltip}
    {transition}
    id="tip"
    on:introend={onIntroEnd}
    on:outroend={onOutroEnd}
  >
    <p data-testid="content">Content</p>
  </Toggletip>
</Motion>
