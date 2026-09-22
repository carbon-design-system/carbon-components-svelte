<script>
  import { LocalStorage, Pagination } from "carbon-components-svelte";

  let pageSize = 10;
</script>

<LocalStorage key="pagination-page-size" bind:value={pageSize} />

<Pagination totalItems={102} pageSizes={[10, 20, 50]} bind:pageSize />
