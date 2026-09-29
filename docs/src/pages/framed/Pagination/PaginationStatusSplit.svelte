<script>
  import { Pagination, PaginationStatus } from "carbon-components-svelte";

  const totalItems = 102;
  const pageSize = 10;

  let page = 1;
</script>

<PaginationStatus {page} {pageSize} {totalItems} />

<Pagination simple bind:page {pageSize} {totalItems} />
