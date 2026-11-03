<script lang="ts">
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  /** Which tooltip slots to pass: the new name, the deprecated one, or both. */
  export let slots: "tooltipChildren" | "tooltipText" | "both" =
    "tooltipChildren";
  export let portalTooltip = false;
</script>

{#if slots === "tooltipChildren"}
  <TooltipIcon icon={Carbon} {portalTooltip} open aria-label="Metrics">
    <span slot="tooltipChildren">New content</span>
  </TooltipIcon>
{:else if slots === "tooltipText"}
  <TooltipIcon icon={Carbon} {portalTooltip} open aria-label="Metrics">
    <span slot="tooltipText">Old content</span>
  </TooltipIcon>
{:else}
  <TooltipIcon icon={Carbon} {portalTooltip} open aria-label="Metrics">
    <span slot="tooltipChildren">New content</span>
    <span slot="tooltipText">Old content</span>
  </TooltipIcon>
{/if}
