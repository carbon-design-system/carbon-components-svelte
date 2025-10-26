<script>
  import { Button, PaginationNav } from "carbon-components-svelte";

  let page = 2;
</script>

<PaginationNav bind:page />

<div style="margin: var(--cds-layout-01) 0">
  <Button on:click={() => (page = 1)} disabled={page === 0}>
    Set page to 1
  </Button>
</div>

<strong>page:</strong>
{page}
