<script>
  import { Button, Stack, Tooltip } from "carbon-components-svelte";

  let open = true;
</script>

<Stack gap={12}>
  <Tooltip bind:open triggerText="Resource list" align="start">
    <p>Resources are provisioned based on your account's organization.</p>
  </Tooltip>
  <div>
    <Button size="small" on:click={() => (open = !open)}>
      {open ? "Close tooltip" : "Open tooltip"}
    </Button>
  </div>
  <div>Open: {open}</div>
</Stack>
