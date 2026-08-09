<script lang="ts">
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<TooltipIcon>["open"] = false;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<TooltipIcon
  tooltipText="Test tooltip text"
  bind:open
  icon={Carbon}
  enterDelayMs={0}
  leaveDelayMs={0}
  on:open={onOpen}
  on:close={onClose}
/>
