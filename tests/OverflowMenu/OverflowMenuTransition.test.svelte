<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = false;
  export let direction: ComponentProps<OverflowMenu>["direction"] = "bottom";
  export let transition: ComponentProps<OverflowMenu>["transition"] = undefined;
  export let motionMenu: MotionValue = undefined;
  export let onIntroStart: () => void = () => {};
  export let onIntroEnd: () => void = () => {};
  export let onOutroStart: () => void = () => {};
  export let onOutroEnd: () => void = () => {};
</script>

<Motion menu={motionMenu}>
  <OverflowMenu
    bind:open
    {portalMenu}
    {direction}
    {transition}
    on:introstart={onIntroStart}
    on:introend={onIntroEnd}
    on:outrostart={onOutroStart}
    on:outroend={onOutroEnd}
  >
    <OverflowMenuItem text="Manage credentials" />
    <OverflowMenuItem text="API documentation" />
  </OverflowMenu>
</Motion>
