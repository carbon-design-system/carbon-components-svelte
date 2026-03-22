<script>
  import { Button, Stack, TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  let open = true;
</script>

<Stack gap={12}>
  <div>
    <TooltipIcon
      bind:open
      tooltipText="Carbon is an open source design system by IBM."
      icon={Carbon}
      align="start"
    />
  </div>
  <div>
    <Button kind="tertiary" size="small" on:click={() => (open = !open)}>
      {open ? "Close tooltip" : "Open tooltip"}
    </Button>
  </div>
</Stack>
