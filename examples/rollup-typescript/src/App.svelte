<script lang="ts">
  import { Button, TooltipDefinition } from "carbon-components-svelte";
</script>

<Button
  kind="primary"
  on:click="{() => {
    console.log('click');
  }}">
  Primary button
</Button>

<TooltipDefinition tooltipText="Tooltip text">
  Tooltip content
</TooltipDefinition>
