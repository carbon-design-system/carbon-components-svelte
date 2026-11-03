<script lang="ts">
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";

  /** Which trigger slots to pass: the new name, the deprecated one, or both. */
  export let slots: "triggerChildren" | "triggerText" | "both" =
    "triggerChildren";
  export let hideIcon = false;
</script>

{#if slots === "triggerChildren"}
  <Tooltip {hideIcon} iconDescription="Information">
    <strong slot="triggerChildren">New trigger</strong>
    Content
  </Tooltip>
{:else if slots === "triggerText"}
  <Tooltip {hideIcon} iconDescription="Information">
    <strong slot="triggerText">Old trigger</strong>
    Content
  </Tooltip>
{:else}
  <Tooltip {hideIcon} iconDescription="Information">
    <strong slot="triggerChildren">New trigger</strong>
    <strong slot="triggerText">Old trigger</strong>
    Content
  </Tooltip>
{/if}
