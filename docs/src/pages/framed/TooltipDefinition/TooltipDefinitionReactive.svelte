<script>
  import { Button, Stack, TooltipDefinition } from "carbon-components-svelte";

  let open = true;
</script>

<Stack gap={12}>
  <div>
    <TooltipDefinition
      align="start"
      bind:open
      tooltipText="Single sign-on: one login for all connected applications."
    >
      SSO
    </TooltipDefinition>
  </div>
  <div>
    <Button kind="tertiary" size="small" on:click={() => (open = !open)}>
      {open ? "Close tooltip" : "Open tooltip"}
    </Button>
  </div>
</Stack>
