<script lang="ts">
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";

  export let open = false;
  export let hideIcon = false;
  export let triggerText = "Resources";
  export let tooltipProps: Record<string, unknown> = {};
</script>

<span id="extra-help">Extra help</span>
<span id="external-name">External name</span>
<Tooltip
  {open}
  {hideIcon}
  {triggerText}
  data-testid="tooltip-wrapper"
  {...tooltipProps}
>
  <p>Tip content</p>
</Tooltip>
