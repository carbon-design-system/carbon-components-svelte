<script>
  import { Button, InlineLoading, Stack } from "carbon-components-svelte";

  let saving = false;
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <Button kind="tertiary" on:click={() => (saving = !saving)}>
    {saving ? "Stop" : "Save"}
  </Button>
  {#if saving}
    <InlineLoading transition description="Saving..." />
  {/if}
</Stack>
