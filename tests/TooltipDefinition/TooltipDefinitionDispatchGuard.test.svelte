<script lang="ts">
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<TooltipDefinition>["open"] = false;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<TooltipDefinition
  tooltipText="Test tooltip text"
  bind:open
  enterDelayMs={0}
  leaveDelayMs={0}
  on:open={onOpen}
  on:close={onClose}
>
  Tooltip trigger
</TooltipDefinition>
