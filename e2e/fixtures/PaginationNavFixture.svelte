<script>
  import { PaginationNav } from "carbon-components-svelte";

  let page = 1;
</script>

<PaginationNav data-testid="pagination-nav" total={10} bind:page />
