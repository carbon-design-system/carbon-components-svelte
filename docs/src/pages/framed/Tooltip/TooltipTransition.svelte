<script>
  import { Stack, Tooltip, TooltipGroup } from "carbon-components-svelte";
</script>

<TooltipGroup>
  <Stack orientation="horizontal" gap={7}>
    <Tooltip transition triggerText="Region">
      <p>Where your resources run. Pick the one closest to your users.</p>
    </Tooltip>
    <Tooltip transition triggerText="Plan">
      <p>Sets your monthly quota. You can change plans at any time.</p>
    </Tooltip>
  </Stack>
</TooltipGroup>
