<script>
  import { Pagination } from "carbon-components-svelte";

  const boxes = [
    { id: "cut", width: 200 },
    { id: "fits", width: 960 },
  ];
</script>

<!-- Each component twice: in a box too narrow for its text, and in one
     wide enough. -->
{#each boxes as { id, width } (id)}
  <div
    data-testid={id}
    style:display="grid"
    style:grid-template-columns="minmax(0, 1fr)"
    style:gap="1rem"
    style:margin-bottom="2rem"
    style:width="{width}px"
  >
    <div data-testid="pagination">
      <Pagination totalItems={120} pageSize={10} pageSizes={[10]} page={3} />
    </div>
  </div>
{/each}
