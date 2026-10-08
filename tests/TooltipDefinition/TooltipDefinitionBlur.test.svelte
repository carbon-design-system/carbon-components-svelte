<script lang="ts">
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";

  let blurCount = 0;
</script>

<TooltipDefinition
  tooltipText="Annual percentage rate"
  on:blur={() => blurCount++}
>
  APR
</TooltipDefinition>
<button type="button">Next</button>

<div data-testid="blur-count">{blurCount}</div>
