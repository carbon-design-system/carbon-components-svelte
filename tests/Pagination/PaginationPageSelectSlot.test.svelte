<script lang="ts">
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import type { ComponentProps } from "svelte";

  export let page: ComponentProps<Pagination>["page"] = 1;
  export let totalItems: ComponentProps<Pagination>["totalItems"] = 0;
  export let pageSizes: ComponentProps<Pagination>["pageSizes"] = [10];
  export let onChange: (detail: { page?: number; pageSize?: number }) => void =
    () => {};
  export let onUpdate: (detail: { page: number; pageSize: number }) => void =
    () => {};
</script>

<Pagination
  bind:page
  {totalItems}
  {pageSizes}
  on:change={(e) => onChange(e.detail)}
  on:update={(e) => onUpdate(e.detail)}
>
  <svelte:fragment
    slot="pageSelect"
    let:currentPage
    let:totalPages
    let:currentPageSize
    let:selectLabelText
  >
    <span data-testid="page-select-label">{selectLabelText}</span>
    <span data-testid="current-page">{currentPage}</span>
    <span data-testid="total-pages">{totalPages}</span>
    <span data-testid="current-page-size">{currentPageSize}</span>
    <button type="button" on:click={() => (page = 3)}>Go to 3</button>
  </svelte:fragment>
</Pagination>
