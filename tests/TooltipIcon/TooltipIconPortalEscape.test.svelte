<script lang="ts">
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
  export let ariaLabel: string | undefined = undefined;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <TooltipIcon
    portalTooltip
    enterDelayMs={0}
    leaveDelayMs={0}
    tooltipText="Portal tooltip"
    icon={Carbon}
    aria-label={ariaLabel}
    on:open={onOpen}
    on:close={onClose}
  />
  <input aria-label="Other control">
</div>
