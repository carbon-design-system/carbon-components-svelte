<script>
  import { Button, Stack, Toggletip } from "carbon-components-svelte";

  let open = true;
</script>

<Stack gap={12} align="start">
  <Toggletip bind:open labelText="Resource list" align="start">
    Resources are provisioned based on your account's organization.
  </Toggletip>
  <Button kind="tertiary" size="small" on:click={() => (open = !open)}>
    {open ? "Close toggletip" : "Open toggletip"}
  </Button>
</Stack>
