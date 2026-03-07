<script>
  import { Button, PaginationNav, Stack } from "carbon-components-svelte";

  let page = 2;
</script>

<Stack gap={6}>
  <PaginationNav bind:page />
  <Stack gap={4} orientation="horizontal" align="center">
    <Button
      kind="tertiary"
      size="small"
      on:click={() => (page = 1)}
      disabled={page === 0}
    >
      Set page to 1
    </Button>
    <div>
      <strong>Current page:</strong>
      {page}
    </div>
  </Stack>
</Stack>
