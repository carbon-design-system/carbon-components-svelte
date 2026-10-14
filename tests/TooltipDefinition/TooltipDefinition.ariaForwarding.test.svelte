<script lang="ts">
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";

  export let tooltipProps: Record<string, unknown> = {};
</script>

<span id="extra-help">Extra help</span>
<span id="external-name">External name</span>
<TooltipDefinition
  tooltipText="Armonk, New York"
  data-testid="tooltip-wrapper"
  {...tooltipProps}
>
  IBM
</TooltipDefinition>
