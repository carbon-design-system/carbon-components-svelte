<script>
  import { Button, PaginationNav, Stack } from "carbon-components-svelte";

  let page = 2;
</script>

<Stack gap={2}>
  <PaginationNav bind:page />
  <div>
    <Button on:click={() => (page = 1)} disabled={page === 0}>
      Set page to 1
    </Button>
  </div>
  <div>
    <strong>page:</strong>
    {page}
  </div>
</Stack>
