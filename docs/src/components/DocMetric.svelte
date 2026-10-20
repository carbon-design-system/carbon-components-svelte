<script lang="ts">
  import { Stack, Text, TooltipDefinition } from "carbon-components-svelte";

  export let value = "";
  export let label = "";
  export let caption = "";
  export let tooltipText = "";
</script>

<Stack gap={4}>
  <Text tag="span" type="heading-05" color="primary">
    {value}
    {#if tooltipText}
      <TooltipDefinition align="start" direction="bottom" {tooltipText}>
        <sup>*</sup>
      </TooltipDefinition>
    {/if}
  </Text>
  <Stack gap={1}>
    <Text type="body-compact-01" color="primary">{label}</Text>
    <Text type="label-01" color="secondary">{caption}</Text>
  </Stack>
</Stack>
