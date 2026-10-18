<script lang="ts">
  import PortalTooltip from "carbon-components-svelte/Portal/PortalTooltip.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let direction: ComponentProps<PortalTooltip>["direction"] = "top";

  let anchor: HTMLElement | null = null;
</script>

<div data-testid="anchor" bind:this={anchor}>Anchor element</div>

<PortalTooltip {anchor} {direction} {open} text="Tooltip text" />
