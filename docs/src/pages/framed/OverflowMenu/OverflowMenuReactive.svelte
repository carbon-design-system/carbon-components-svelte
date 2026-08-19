<script>
  import {
    Button,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={6} align="start">
  <OverflowMenu bind:open>
    <OverflowMenuItem text="Manage credentials" />
    <OverflowMenuItem
      href="https://cloud.ibm.com/docs/api-gateway/"
      target="_blank"
      text="API documentation"
    />
    <OverflowMenuItem danger text="Delete service" />
  </OverflowMenu>
  <Button kind="tertiary" size="small" on:click={() => (open = !open)}>
    {open ? "Close menu" : "Open menu"}
  </Button>
</Stack>
