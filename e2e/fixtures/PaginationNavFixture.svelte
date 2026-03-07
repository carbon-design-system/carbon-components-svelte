<script>
  import { PaginationNav } from "carbon-components-svelte";

  let page = 1;
</script>

<div class="fixture-container">
  <PaginationNav
    data-testid="pagination-nav"
    total={10}
    bind:page
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
