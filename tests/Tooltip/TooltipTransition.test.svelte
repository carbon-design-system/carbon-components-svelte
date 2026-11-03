<script lang="ts">
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { ComponentProps } from "svelte";

  export let kind: "single" | "group" = "single";
  export let open = false;
  export let portalTooltip: boolean | undefined = false;
  export let transition: ComponentProps<Tooltip>["transition"] = undefined;
  export let motionTooltip: MotionValue = undefined;
  export let onOutroEnd: (name: string) => void = () => {};
  export let onIntroStart: (name: string) => void = () => {};
</script>

<Motion tooltip={motionTooltip}>
  {#if kind === "single"}
    <Tooltip
      bind:open
      {portalTooltip}
      {transition}
      tooltipId="tip"
      iconDescription="Info"
      on:introstart={() => onIntroStart("single")}
      on:outroend={() => onOutroEnd("single")}
    >
      <p data-testid="content">Content</p>
    </Tooltip>
  {:else}
    <TooltipGroup enterDelayMs={20} leaveDelayMs={20} skipDelayMs={150}>
      <Tooltip
        {portalTooltip}
        {transition}
        iconDescription="A"
        on:introstart={() => onIntroStart("a")}
        on:outroend={() => onOutroEnd("a")}
      >
        <p data-testid="content-a">Content A</p>
      </Tooltip>
      <Tooltip
        {portalTooltip}
        {transition}
        iconDescription="B"
        on:introstart={() => onIntroStart("b")}
        on:outroend={() => onOutroEnd("b")}
      >
        <p data-testid="content-b">Content B</p>
      </Tooltip>
    </TooltipGroup>
  {/if}
</Motion>
