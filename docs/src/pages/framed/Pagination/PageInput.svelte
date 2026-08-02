<script>
  import { Pagination } from "carbon-components-svelte";
</script>

<Pagination
  totalItems={100_000}
  pageSizes={[10, 15, 20]}
  pageInputType="input"
/>
