<script lang="ts">
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  export let portalTooltip = false;
  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <TooltipIcon
    data-testid="trigger"
    {portalTooltip}
    tooltipText="Region details"
    icon={Carbon}
  />
</div>
