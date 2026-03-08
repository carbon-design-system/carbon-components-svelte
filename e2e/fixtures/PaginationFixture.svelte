<script>
  import { Pagination } from "carbon-components-svelte";

  let page = 1;
  let pageSize = 10;
</script>

<Pagination
  data-testid="pagination"
  totalItems={50}
  pageSizes={[10, 20, 50]}
  bind:page
  bind:pageSize
/>
