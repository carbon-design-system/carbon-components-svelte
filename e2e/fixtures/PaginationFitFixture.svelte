<script>
  import { Pagination } from "carbon-components-svelte";
</script>

<!-- Pagination in boxes narrower than md (672px), and one wider. -->
{#each [200, 320, 480, 800] as width}
  <div data-testid="pagination-{width}" style="width: {width}px; margin: 1rem;">
    <Pagination totalItems={120} pageSize={10} pageSizes={[10, 20]} page={3} />
  </div>
{/each}
